const express = require("express");
const multer = require("multer");
const Groq = require("groq-sdk");
const protect = require("../middleware/authMiddleware");

const {
  createTransaction,
  updateTransaction,
  findTransactionForDelete,
} = require("../services/TransactionServices");

const BudgetCategory = require("../models/BudgetCategory");
const Budget = require("../models/Budget");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveBudgetPeriod = (monthRef, yearRef) => {
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();
  const nextMonthIndex = (currentMonthIndex + 1) % 12;
  const nextYear = currentMonthIndex === 11 ? currentYear + 1 : currentYear;

  const ref = String(monthRef || "current")
    .trim()
    .toLowerCase();

  let monthIndex;
  let year;

  if (
    ref === "current" ||
    ref === "this" ||
    ref === "current month" ||
    ref === "this month"
  ) {
    monthIndex = currentMonthIndex;
    year = currentYear;
  } else if (ref === "next" || ref === "next month") {
    monthIndex = nextMonthIndex;
    year = nextYear;
  } else {
    monthIndex = months.findIndex((month) => month.toLowerCase() === ref);

    if (monthIndex === -1) {
      throw new Error("Invalid budget month");
    }

    year = Number(yearRef) || currentYear;

    const isCurrent = monthIndex === currentMonthIndex && year === currentYear;

    const isNext = monthIndex === nextMonthIndex && year === nextYear;

    if (!isCurrent && !isNext) {
      throw new Error("You can only manage the current or next month budget");
    }
  }

  return {
    month: months[monthIndex],
    year,
  };
};

const normalizeCommand = (command, text) => {
  if (!command || typeof command !== "object") {
    throw new Error("Invalid AI command");
  }

  const lowerText = String(text || "").toLowerCase();

  const monthPattern = new RegExp(`\\b(${months.join("|")})\\b`, "i");

  const overallBudgetHint =
    /\b(overall budget|monthly budget|current month budget|this month budget|next month budget|current month|this month|next month|month budget)\b/i.test(
      lowerText,
    ) ||
    /\b(mahine ka budget|iss mahine ka budget|agle mahine ka budget)\b/i.test(
      lowerText,
    ) ||
    (monthPattern.test(text || "") && /\bbudget\b/i.test(text || ""));

  const categoryHint =
    /\b(category|food|shopping|travel|medical|rent|bills|entertainment|education|salary|savings|others)\b/i.test(
      lowerText,
    );

  if (
    overallBudgetHint &&
    !categoryHint &&
    ["add_category", "update_category", "delete_category"].includes(
      command.action,
    )
  ) {
    if (command.action === "add_category") {
      command.action = "add_budget";
      command.month = command.month || command.category || "current";
      delete command.category;
    }

    if (command.action === "update_category") {
      command.action = "update_budget";
      command.month = command.month || command.target?.category || "current";
      command.amount = command.changes?.amount;
      delete command.target;
      delete command.changes;
    }

    if (command.action === "delete_category") {
      command.action = "delete_budget";
      command.month = command.month || command.target?.category || "current";
      delete command.target;
    }
  }

  if (command.target && typeof command.target === "object") {
    const target = command.target;

    if (typeof target.category === "string") {
      target.category = target.category
        .replace(/^(?:the\s+)?(?:latest|last|most\s+recent)\s+/i, "")
        .replace(/\s+(?:latest|last|most\s+recent)$/i, "")
        .trim();
    }

    const latestPattern =
      /\b(?:latest|last|most\s+recent|abhi\s+(?:wala|wali|waala|waali)|sabse\s+recent|sabse\s+latest)\b/i;

    if (latestPattern.test(text || "")) {
      target.latest = true;
    }
  }

  return command;
};

router.post("/", protect, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Audio file is required.",
      });
    }

    const transcription = await groq.audio.transcriptions.create({
      file: new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      }),
      model: "whisper-large-v3-turbo",
    });

    const text = String(transcription.text || "").trim();

    console.log("🗣️ Transcription:", text);

    if (!text) {
      return res.status(400).json({
        message: "Could not understand the voice command.",
      });
    }

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `
You are a finance command parser.

Return EXACTLY ONE valid JSON object.
Never return an array.

Understand English, Hindi and Hinglish.

Actions:
- add
- update
- delete
- add_budget
- update_budget
- delete_budget
- add_category
- update_category
- delete_category
- query

IMPORTANT BUDGET RULE:

There are TWO different things:

1. OVERALL MONTHLY BUDGET
2. BUDGET CATEGORY

OVERALL MONTHLY BUDGET means the main budget shown in Monthly Budget Progress.

Examples:

"add monthly budget 15000"
"current month budget 15000"
"iss mahine ka budget 15000 set karo"
"September ka overall budget 20000"
"update current month budget to 18000"
"September budget 18000 kar do"

Return:

{
  "action": "add_budget",
  "amount": 15000,
  "month": "current"
}

or:

{
  "action": "update_budget",
  "amount": 18000,
  "month": "current"
}

For next month:

{
  "action": "add_budget",
  "amount": 20000,
  "month": "next"
}

For a named month use the exact month name:

{
  "action": "update_budget",
  "amount": 20000,
  "month": "September",
  "year": 2026
}

Delete overall budget:

"delete current month budget"
"current month ka budget delete karo"
"September ka budget hata do"

Return:

{
  "action": "delete_budget",
  "month": "current"
}

CRITICAL:
If the user is talking about the overall monthly budget,
NEVER return add_category, update_category or delete_category.

A month name like September, October etc. is NOT a category.

BUDGET CATEGORY examples:

"add food category 5000"

{
  "action": "add_category",
  "category": "Food",
  "amount": 5000
}

"food ka budget 5000 add karo"

{
  "action": "add_category",
  "category": "Food",
  "amount": 5000
}

"update food category to 6000"

{
  "action": "update_category",
  "target": {
    "category": "Food"
  },
  "changes": {
    "amount": 6000
  }
}

"delete food category"

{
  "action": "delete_category",
  "target": {
    "category": "Food"
  }
}

TRANSACTION ADD:

{
  "action": "add",
  "amount": 200,
  "category": "Food",
  "type": "Expense"
}

TRANSACTION UPDATE:

{
  "action": "update",
  "target": {
    "category": "Travel",
    "amount": 300,
    "type": "Expense"
  },
  "changes": {
    "amount": 150
  }
}

TRANSACTION DELETE:

{
  "action": "delete",
  "target": {
    "category": "Travel",
    "amount": 300,
    "type": "Expense",
    "latest": true
  }
}

If user says latest, last or most recent:
latest = true.

CATEGORY RULES:
- Never invent category.
- Never invent amount.
- Keep category exactly as spoken.
- Budget category commands do not need transaction type.
- Budget category commands do not need latest.

FINAL RULE:
Return ONLY valid JSON.
`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0,
      response_format: {
        type: "json_object",
      },
    });

    let parsedCommand = JSON.parse(completion.choices[0].message.content);

    parsedCommand = normalizeCommand(parsedCommand, text);

    console.log("🤖 AI Parsed Command:", parsedCommand);

    // TRANSACTION ADD
    if (parsedCommand.action === "add") {
      const transaction = await createTransaction({
        userId: req.user._id,
        category: parsedCommand.category,
        type: parsedCommand.type,
        amount: parsedCommand.amount,
        date: new Date(),
      });

      return res.status(201).json({
        message: "Voice transaction added successfully.",
        text,
        command: parsedCommand,
        transaction,
      });
    }

    // TRANSACTION UPDATE
    if (parsedCommand.action === "update") {
      const transaction = await updateTransaction({
        userId: req.user._id,
        target: parsedCommand.target,
        changes: parsedCommand.changes,
      });

      return res.status(200).json({
        message: "Voice transaction updated successfully.",
        text,
        command: parsedCommand,
        transaction,
      });
    }

    // TRANSACTION DELETE
    if (parsedCommand.action === "delete") {
      const result = await findTransactionForDelete({
        userId: req.user._id,
        target: parsedCommand.target,
      });

      return res.status(200).json({
        message: "Delete confirmation required.",
        confirmationRequired: true,
        text,
        command: parsedCommand,
        transaction: result,
      });
    }

    // OVERALL BUDGET ADD
    if (parsedCommand.action === "add_budget") {
      const amount = Number(parsedCommand.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Budget amount must be greater than 0");
      }

      const { month, year } = resolveBudgetPeriod(
        parsedCommand.month,
        parsedCommand.year,
      );

      const existingBudget = await Budget.findOne({
        user: req.user._id,
        month,
        year,
      });

      if (existingBudget) {
        throw new Error(
          `Budget already exists for ${month} ${year}. Use update budget.`,
        );
      }

      const budget = await Budget.create({
        user: req.user._id,
        amount,
        month,
        year,
      });

      return res.status(201).json({
        message: `Budget added successfully for ${month} ${year}.`,
        text,
        command: parsedCommand,
        budget,
      });
    }

    // OVERALL BUDGET UPDATE
    if (parsedCommand.action === "update_budget") {
      const amount = Number(parsedCommand.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("New budget amount must be greater than 0");
      }

      const { month, year } = resolveBudgetPeriod(
        parsedCommand.month,
        parsedCommand.year,
      );

      const budget = await Budget.findOne({
        user: req.user._id,
        month,
        year,
      });

      if (!budget) {
        throw new Error(`Monthly budget not found for ${month} ${year}`);
      }

      budget.amount = amount;
      await budget.save();

      return res.status(200).json({
        message: `Budget updated successfully for ${month} ${year}.`,
        text,
        command: parsedCommand,
        budget,
      });
    }

    // OVERALL BUDGET DELETE
    if (parsedCommand.action === "delete_budget") {
      const { month, year } = resolveBudgetPeriod(
        parsedCommand.month,
        parsedCommand.year,
      );

      const budget = await Budget.findOne({
        user: req.user._id,
        month,
        year,
      });

      if (!budget) {
        throw new Error(`Monthly budget not found for ${month} ${year}`);
      }

      await BudgetCategory.deleteMany({
        user: req.user._id,
        month,
        year,
      });

      await Budget.deleteOne({
        _id: budget._id,
        user: req.user._id,
      });

      return res.status(200).json({
        message: `Budget deleted successfully for ${month} ${year}.`,
        text,
        command: parsedCommand,
      });
    }

    // ADD BUDGET CATEGORY
    if (parsedCommand.action === "add_category") {
      const category = String(parsedCommand.category || "").trim();

      const amount = Number(parsedCommand.amount);

      if (!category) {
        throw new Error("Budget category name is required");
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Budget category amount must be greater than 0");
      }

      const now = new Date();

      const month = now.toLocaleString("en-US", {
        month: "long",
      });

      const year = now.getFullYear();

      const monthlyBudget = await Budget.findOne({
        user: req.user._id,
        month,
        year,
      });

      if (!monthlyBudget) {
        throw new Error("Please set your monthly budget first");
      }

      const existingCategory = await BudgetCategory.findOne({
        user: req.user._id,
        category: {
          $regex: `^${escapeRegex(category)}$`,
          $options: "i",
        },
        month,
        year,
      });

      if (existingCategory) {
        throw new Error("This category already exists in your budget plan");
      }

      const existingCategories = await BudgetCategory.find({
        user: req.user._id,
        month,
        year,
      });

      const totalAllocated = existingCategories.reduce(
        (total, item) => total + Number(item.amount),
        0,
      );

      if (totalAllocated + amount > Number(monthlyBudget.amount)) {
        throw new Error(
          `You only have ₹${Math.max(
            0,
            Number(monthlyBudget.amount) - totalAllocated,
          ).toLocaleString("en-IN")} left to allocate`,
        );
      }

      const newCategory = await BudgetCategory.create({
        user: req.user._id,
        category,
        amount,
        month,
        year,
      });

      return res.status(201).json({
        message: "Budget category added successfully.",
        text,
        command: parsedCommand,
        category: newCategory,
      });
    }

    // UPDATE BUDGET CATEGORY
    if (parsedCommand.action === "update_category") {
      const targetCategory = String(
        parsedCommand.target?.category || "",
      ).trim();

      const newAmount = Number(parsedCommand.changes?.amount);

      if (!targetCategory) {
        throw new Error("Budget category is required");
      }

      if (!Number.isFinite(newAmount) || newAmount <= 0) {
        throw new Error("New budget amount must be greater than 0");
      }

      const now = new Date();

      const month = now.toLocaleString("en-US", {
        month: "long",
      });

      const year = now.getFullYear();

      const category = await BudgetCategory.findOne({
        user: req.user._id,
        category: {
          $regex: `^${escapeRegex(targetCategory)}$`,
          $options: "i",
        },
        month,
        year,
      });

      if (!category) {
        throw new Error(
          `Budget category "${targetCategory}" not found for ${month} ${year}`,
        );
      }

      const monthlyBudget = await Budget.findOne({
        user: req.user._id,
        month,
        year,
      });

      if (!monthlyBudget) {
        throw new Error("Monthly budget not found");
      }

      const otherCategories = await BudgetCategory.find({
        user: req.user._id,
        month,
        year,
        _id: { $ne: category._id },
      });

      const otherAllocated = otherCategories.reduce(
        (total, item) => total + Number(item.amount),
        0,
      );

      if (otherAllocated + newAmount > Number(monthlyBudget.amount)) {
        throw new Error(
          `You only have ₹${Math.max(
            0,
            Number(monthlyBudget.amount) - otherAllocated,
          ).toLocaleString("en-IN")} available for this category`,
        );
      }

      category.amount = newAmount;
      await category.save();

      return res.status(200).json({
        message: "Budget category updated successfully.",
        text,
        command: parsedCommand,
        category,
      });
    }

    // DELETE BUDGET CATEGORY
    if (parsedCommand.action === "delete_category") {
      const targetCategory = String(
        parsedCommand.target?.category || "",
      ).trim();

      if (!targetCategory) {
        throw new Error("Budget category is required");
      }

      const now = new Date();

      const month = now.toLocaleString("en-US", {
        month: "long",
      });

      const year = now.getFullYear();

      const category = await BudgetCategory.findOne({
        user: req.user._id,
        category: {
          $regex: `^${escapeRegex(targetCategory)}$`,
          $options: "i",
        },
        month,
        year,
      });

      if (!category) {
        throw new Error(
          `Budget category "${targetCategory}" not found for ${month} ${year}`,
        );
      }

      await BudgetCategory.deleteOne({
        _id: category._id,
        user: req.user._id,
      });

      return res.status(200).json({
        message: "Budget category deleted successfully.",
        text,
        command: parsedCommand,
        category,
      });
    }

    if (parsedCommand.action === "query") {
      return res.status(200).json({
        message: "Query command received.",
        text,
        command: parsedCommand,
      });
    }

    return res.status(400).json({
      message: "Unknown voice command.",
      command: parsedCommand,
    });
  } catch (error) {
    console.error("❌ Voice command error:", error);

    return res.status(400).json({
      message: error.message || "Voice command failed.",
    });
  }
});

module.exports = router;
