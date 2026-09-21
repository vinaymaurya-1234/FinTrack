const express = require("express");
const multer = require("multer");
const Groq = require("groq-sdk");
const protect = require("../middleware/authMiddleware");
const {
  createTransaction,
  updateTransaction,
} = require("../services/TransactionServices");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/", protect, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Audio file is required.",
      });
    }

    console.log("🎤 Audio received by backend");

    // STEP 1: Speech → Text
    const transcription = await groq.audio.transcriptions.create({
      file: new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      }),
      model: "whisper-large-v3-turbo",
    });

    const text = transcription.text;

    console.log("🗣️ Transcription:", text);

    // STEP 2: Text → Structured command
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",

      messages: [
        {
          role: "system",
          content: `
You are a finance command parser for a personal finance application.

Convert the user's voice command into EXACTLY ONE JSON OBJECT.

IMPORTANT:
- Never return an array.
- Return ONLY valid JSON.
- Understand English, Hindi and Hinglish.
- Categories are dynamic and unlimited.
- Do not invent information.

Possible actions:
- add
- update
- delete
- query


ADD:
{
  "action": "add",
  "amount": 200,
  "category": "Food",
  "type": "Expense"
}

Rules:
- Money spent = Expense
- Money received/earned = Income
- Extract amount and category exactly.
- Category can be ANY word or phrase.


UPDATE:
{
  "action": "update",
  "target": {
    "category": "Travel",
    "amount": 300
  },
  "changes": {
    "amount": 150
  }
}

Rules:
- target = EXISTING transaction.
- changes = NEW values only.
- Never put new values inside target.
- Never put old values inside changes.
- Target can contain category, amount, type.
- Changes can contain category, amount, type.
- Include only information actually mentioned.
- Do not invent missing information.

Examples:

"Travel 300 replaced with 150"
→
{
  "action": "update",
  "target": {
    "category": "Travel",
    "amount": 300
  },
  "changes": {
    "amount": 150
  }
}

"Food 200 ko 300 kar do"
→
{
  "action": "update",
  "target": {
    "category": "Food",
    "amount": 200
  },
  "changes": {
    "amount": 300
  }
}

"Shopping transaction ko Electronics category kar do"
→
{
  "action": "update",
  "target": {
    "category": "Shopping"
  },
  "changes": {
    "category": "Electronics"
  }
}


DELETE:
{
  "action": "delete",
  "target": {
    "category": "Food",
    "amount": 200
  }
}

Rules:
- target identifies the existing transaction.
- Use category, amount or type only when mentioned.


QUERY:
{
  "action": "query"
}

FINAL:
- Return exactly ONE JSON object.
- Never return an array.
- Never invent values.
- Understand English, Hindi and Hinglish.
- Categories are completely dynamic.
- For updates, separate OLD values into target and NEW values into changes.
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

    const parsedCommand = JSON.parse(completion.choices[0].message.content);

    console.log("🤖 AI Parsed Command:", parsedCommand);

    // ADD
    if (parsedCommand.action === "add") {
      const transaction = await createTransaction({
        userId: req.user._id,
        category: parsedCommand.category,
        type: parsedCommand.type,
        amount: parsedCommand.amount,
        date: new Date(),
      });

      console.log("💰 Voice transaction created:", transaction);

      return res.status(201).json({
        message: "Voice transaction added successfully.",
        text,
        command: parsedCommand,
        transaction,
      });
    }

    // UPDATE
    if (parsedCommand.action === "update") {
      const transaction = await updateTransaction({
        userId: req.user._id,
        target: parsedCommand.target,
        changes: parsedCommand.changes,
      });

      console.log("✏️ Voice transaction updated:", transaction);

      return res.status(200).json({
        message: "Voice transaction updated successfully.",
        text,
        command: parsedCommand,
        transaction,
      });
    }

    // DELETE / QUERY - not implemented yet
    return res.status(200).json({
      message: "Command parsed successfully.",
      text,
      command: parsedCommand,
    });
  } catch (error) {
    console.error("Voice command error:", error);

    if (
      error.message === "All transaction fields are required" ||
      error.message === "Invalid transaction type" ||
      error.message === "Amount must be greater than 0" ||
      error.message.startsWith("Insufficient available balance") ||
      error.message === "No matching transaction found" ||
      error.message ===
        "Multiple matching transactions found. Please specify the transaction more clearly" ||
      error.message === "No changes were provided"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Voice command failed.",
      error: error.message,
    });
  }
});

module.exports = router;
