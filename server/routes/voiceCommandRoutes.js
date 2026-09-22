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

// ======================================================
// NORMALIZE AI COMMAND
// ======================================================

const normalizeCommand = (command, text) => {
  if (!command || typeof command !== "object") {
    throw new Error("Invalid AI command");
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

// ======================================================
// VOICE COMMAND
// ======================================================

router.post("/", protect, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Audio file is required.",
      });
    }

    console.log("🎤 Audio received by backend");

    // ==================================================
    // SPEECH → TEXT
    // ==================================================

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

    // ==================================================
    // TEXT → COMMAND
    // ==================================================

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",

      messages: [
        {
          role: "system",

          content: `
You are a finance command parser.

Return EXACTLY ONE valid JSON object.
Never return an array.

Understand:
- English
- Hindi
- Hinglish
- Natural sentence structure

Actions:
- add
- update
- delete
- add_category
- update_category
- delete_category
- query


========================================
TRANSACTION ADD
========================================

{
  "action": "add",
  "amount": 200,
  "category": "Food",
  "type": "Expense"
}


========================================
TRANSACTION UPDATE
========================================

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

OLD values → target
NEW values → changes


========================================
TRANSACTION DELETE
========================================

{
  "action": "delete",
  "target": {
    "category": "Travel",
    "amount": 300,
    "type": "Expense",
    "latest": true
  }
}

If user says latest/last/most recent:
latest = true

Latest means:
FIRST match category + amount + type,
THEN select newest matching transaction.

Example:

Food 200
Travel 200
Travel 200
Food 500

"delete latest travel 200"

means newest Travel ₹200.


========================================
BUDGET CATEGORY ADD
========================================

If user says:

"add food category 5000"
"add travel budget 3000"
"food ka budget 5000 add karo"

Return:

{
  "action": "add_category",
  "category": "Food",
  "amount": 5000
}

IMPORTANT:
For budget category commands:
- category = budget category name
- amount = category budget amount
- Never confuse this with transaction add.


========================================
BUDGET CATEGORY UPDATE
========================================

If user says:

"update food category to 6000"
"food budget 6000 kar do"
"travel category ka budget 4000 kar do"

Return:

{
  "action": "update_category",
  "target": {
    "category": "Food"
  },
  "changes": {
    "amount": 6000
  }
}

OLD category → target
NEW amount → changes


========================================
BUDGET CATEGORY DELETE
========================================

If user says:

"delete food category"
"remove food budget category"
"food category hata do"

Return:

{
  "action": "delete_category",
  "target": {
    "category": "Food"
  }
}


========================================
CATEGORY RULES
========================================

- Never invent category.
- Never invent amount.
- Category can contain multiple words.
- Keep category exactly as spoken.
- Budget category commands do NOT need transaction type.
- Budget category commands do NOT need latest.


========================================
QUERY
========================================

{
  "action": "query"
}


========================================
FINAL RULES
========================================

Return ONLY valid JSON.
Never return an array.
Never add explanations outside JSON.
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

    // ==================================================
    // TRANSACTION ADD
    // ==================================================

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

    // ==================================================
    // TRANSACTION UPDATE
    // ==================================================

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

    // ==================================================
    // TRANSACTION DELETE
    // ==================================================

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

    // ==================================================
    // ADD BUDGET CATEGORY
    // ==================================================

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
          $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
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

    // ==================================================
    // UPDATE BUDGET CATEGORY
    // ==================================================

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
          $regex: `^${targetCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
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

    // ==================================================
    // DELETE BUDGET CATEGORY
    // ==================================================

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
          $regex: `^${targetCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
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

    // ==================================================
    // QUERY
    // ==================================================

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
