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
// HELPER: CURRENT MONTH / YEAR
// ======================================================

const getCurrentMonthYear = () => {
  const now = new Date();

  const month = now.toLocaleString("en-US", {
    month: "long",
  });

  const year = now.getFullYear();

  return {
    month,
    year,
  };
};

// ======================================================
// NORMALIZE AI COMMAND
// ======================================================

const normalizeCommand = (command, text) => {
  if (!command || typeof command !== "object") {
    throw new Error("Invalid AI command");
  }

  // ------------------------------------------
  // NORMALIZE TARGET
  // ------------------------------------------

  if (command.target && typeof command.target === "object") {
    const target = command.target;

    if (typeof target.category === "string") {
      target.category = target.category
        .replace(/^(?:the\s+)?(?:latest|last|most\s+recent)\s+/i, "")
        .replace(/\s+(?:latest|last|most\s+recent)$/i, "")
        .trim();
    }

    // Detect latest from ORIGINAL transcription.
    const latestPattern =
      /\b(?:latest|last|most\s+recent|abhi\s+(?:wala|wali|waala|waali)|last\s+(?:wala|wali)|sabse\s+(?:recent|latest))\b/i;

    if (latestPattern.test(text || "")) {
      target.latest = true;
    }
  }

  // ------------------------------------------
  // NORMALIZE ADD CATEGORY
  // ------------------------------------------

  if (command.action === "add_category") {
    if (typeof command.category === "string") {
      command.category = command.category
        .replace(
          /^(?:add|create|make|set)\s+(?:a\s+)?(?:budget\s+)?category\s+/i,
          "",
        )
        .trim();
    }

    command.amount = Number(command.amount);

    if (!Number.isFinite(command.amount)) {
      command.amount = null;
    }
  }

  return command;
};

// ======================================================
// ADD BUDGET CATEGORY
// ======================================================

const addBudgetCategory = async ({ userId, category, amount, month, year }) => {
  if (!category || typeof category !== "string") {
    throw new Error("Budget category name is required");
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Budget category amount must be greater than 0");
  }

  const finalMonth = month || getCurrentMonthYear().month;
  const finalYear = Number(year || getCurrentMonthYear().year);

  const cleanCategory = category.trim();

  if (!cleanCategory) {
    throw new Error("Budget category name cannot be empty");
  }

  // ------------------------------------------
  // FIND MONTHLY BUDGET
  // ------------------------------------------

  const monthlyBudget = await Budget.findOne({
    user: userId,
    month: finalMonth,
    year: finalYear,
  });

  if (!monthlyBudget) {
    throw new Error(
      `Please set your monthly budget for ${finalMonth} ${finalYear} first`,
    );
  }

  // ------------------------------------------
  // CHECK DUPLICATE CATEGORY
  // CASE INSENSITIVE
  // ------------------------------------------

  const escapedCategory = cleanCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const existingCategory = await BudgetCategory.findOne({
    user: userId,
    month: finalMonth,
    year: finalYear,
    category: {
      $regex: `^${escapedCategory}$`,
      $options: "i",
    },
  });

  if (existingCategory) {
    throw new Error(
      `${existingCategory.category} category already exists for ${finalMonth} ${finalYear}`,
    );
  }

  // ------------------------------------------
  // GET EXISTING CATEGORIES
  // ------------------------------------------

  const existingCategories = await BudgetCategory.find({
    user: userId,
    month: finalMonth,
    year: finalYear,
  });

  const totalAllocated = existingCategories.reduce(
    (total, item) => total + Number(item.amount),
    0,
  );

  const remainingBudget = Number(monthlyBudget.amount) - totalAllocated;

  // ------------------------------------------
  // CHECK AVAILABLE ALLOCATION
  // ------------------------------------------

  if (numericAmount > remainingBudget) {
    throw new Error(
      `You only have ₹${Math.max(0, remainingBudget).toLocaleString(
        "en-IN",
      )} left to allocate for ${finalMonth}`,
    );
  }

  // ------------------------------------------
  // CREATE CATEGORY
  // ------------------------------------------

  const newCategory = await BudgetCategory.create({
    user: userId,
    category: cleanCategory,
    amount: numericAmount,
    month: finalMonth,
    year: finalYear,
  });

  return newCategory;
};

// ======================================================
// VOICE COMMAND
// ======================================================

router.post("/", protect, upload.single("audio"), async (req, res) => {
  try {
    // ==================================================
    // CHECK AUDIO
    // ==================================================

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

NEVER return an array.
NEVER return markdown.
NEVER return explanation.

Understand:
- English
- Hindi
- Hinglish
- Natural sentence structure

==================================================
SUPPORTED ACTIONS
==================================================

- add
- update
- delete
- add_category
- query


==================================================
ADD TRANSACTION
==================================================

Example:

"add 200 food"

Return:

{
  "action": "add",
  "amount": 200,
  "category": "Food",
  "type": "Expense"
}


Example:

"salary 50000 add"

Return:

{
  "action": "add",
  "amount": 50000,
  "category": "Salary",
  "type": "Income"
}


Rules:
- amount must come from user speech.
- category must come from user speech.
- Never invent amount.
- Never invent category.
- Expense means spending.
- Income means money received.


==================================================
UPDATE TRANSACTION
==================================================

Example:

"update travel 300 to 150"

Return:

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


IMPORTANT:
OLD values go inside target.
NEW values go inside changes.


==================================================
DELETE TRANSACTION
==================================================

Example:

"delete travel 300"

Return:

{
  "action": "delete",
  "target": {
    "category": "Travel",
    "amount": 300,
    "type": "Expense"
  }
}


==================================================
LATEST DELETE RULE
==================================================

If user says:

- latest
- last
- most recent
- abhi wala
- abhi wali
- last wala
- last wali
- sabse recent
- sabse latest

set:

"latest": true


VERY IMPORTANT:

latest means:

FIRST filter by the spoken transaction details.

THEN select the newest transaction from those matching transactions.

It does NOT mean newest transaction overall.


Example:

Transactions:

Food ₹200
Travel ₹200
Travel ₹200
Food ₹500


User:

"delete latest travel 200"


Correct:

{
  "action": "delete",
  "target": {
    "category": "Travel",
    "amount": 200,
    "type": "Expense",
    "latest": true
  }
}


DO NOT select latest Food ₹200.


==================================================
ADD BUDGET CATEGORY
==================================================

This action is ONLY for adding a category to the
Budget Plan.

Examples:

"add category Food 5000"

"add food category 5000"

"create travel budget 3000"

"travel category ka budget 3000 add karo"

"add 5000 budget for shopping category"

"food ka budget 5000 set karo"


Return:

{
  "action": "add_category",
  "category": "Food",
  "amount": 5000
}


IMPORTANT:

For add_category:

- category = budget category name
- amount = category budget amount
- Do NOT create a transaction.
- Do NOT use action "add".
- Do NOT include type.
- Do NOT invent category.
- Do NOT invent amount.


==================================================
BUDGET CATEGORY EXAMPLES
==================================================

User:

"add category Food 5000"

Return:

{
  "action": "add_category",
  "category": "Food",
  "amount": 5000
}


User:

"travel category ka budget 3000 add karo"

Return:

{
  "action": "add_category",
  "category": "Travel",
  "amount": 3000
}


User:

"shopping budget 4000"

Return:

{
  "action": "add_category",
  "category": "Shopping",
  "amount": 4000
}


User:

"add 2500 for medical category"

Return:

{
  "action": "add_category",
  "category": "Medical",
  "amount": 2500
}


==================================================
IMPORTANT DISTINCTION
==================================================

"add food 500"

means TRANSACTION:

{
  "action": "add",
  "amount": 500,
  "category": "Food",
  "type": "Expense"
}


"add category food 5000"

means BUDGET CATEGORY:

{
  "action": "add_category",
  "category": "Food",
  "amount": 5000
}


The word "category" or clear budget wording should
make it add_category.


==================================================
QUERY
==================================================

If user asks general financial information:

{
  "action": "query"
}


==================================================
FINAL RULES
==================================================

- Return ONLY valid JSON.
- Never return an array.
- Never invent values.
- Keep category as the category intended by the user.
- Do not confuse budget category with transaction.
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

    // ==================================================
    // PARSE AI RESPONSE
    // ==================================================

    let parsedCommand;

    try {
      parsedCommand = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error("❌ AI JSON parse error:", parseError);

      return res.status(400).json({
        message: "AI could not understand the command correctly.",
      });
    }

    // ==================================================
    // NORMALIZE COMMAND
    // ==================================================

    parsedCommand = normalizeCommand(parsedCommand, text);

    console.log("🤖 AI Parsed Command:", parsedCommand);

    // ==================================================
    // ADD TRANSACTION
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
    // UPDATE TRANSACTION
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
    // DELETE TRANSACTION
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
      const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

      const category = await addBudgetCategory({
        userId: req.user._id,
        category: parsedCommand.category,
        amount: parsedCommand.amount,
        month: currentMonth,
        year: currentYear,
      });

      return res.status(201).json({
        message: `Budget category "${category.category}" added successfully.`,
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

    // ==================================================
    // UNKNOWN ACTION
    // ==================================================

    return res.status(400).json({
      message: "I could not understand this finance command.",
      text,
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
