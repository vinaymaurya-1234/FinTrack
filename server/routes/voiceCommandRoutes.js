const express = require("express");
const multer = require("multer");
const Groq = require("groq-sdk");
const protect = require("../middleware/authMiddleware");

const {
  createTransaction,
  updateTransaction,
  findTransactionForDelete,
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

    // SPEECH → TEXT
    const transcription = await groq.audio.transcriptions.create({
      file: new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      }),
      model: "whisper-large-v3-turbo",
    });

    const text = transcription.text;

    console.log("🗣️ Transcription:", text);

    // TEXT → COMMAND
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",

      messages: [
        {
          role: "system",
          content: `
You are a finance command parser.

Convert the user's voice command into EXACTLY ONE JSON OBJECT.

Rules:
- Return only valid JSON.
- Never return an array.
- Understand English, Hindi and Hinglish.
- Categories are dynamic.
- Never invent values.

ACTIONS:
add
update
delete
query


ADD:
{
  "action": "add",
  "amount": 200,
  "category": "Food",
  "type": "Expense"
}


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
- target = existing values.
- changes = new values.
- Do not mix old and new values.
- Target can contain category, amount, type.
- Changes can contain category, amount, type.


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
- Use category, amount and type only when mentioned.
- Never invent missing information.


QUERY:
{
  "action": "query"
}

Return exactly one JSON object.
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

      return res.status(200).json({
        message: "Voice transaction updated successfully.",
        text,
        command: parsedCommand,
        transaction,
      });
    }

    // DELETE - FIND ONLY
    if (parsedCommand.action === "delete") {
      const transaction = await findTransactionForDelete({
        userId: req.user._id,
        target: parsedCommand.target,
      });

      console.log("🗑️ Delete confirmation required:", transaction);

      return res.status(200).json({
        message: "Delete confirmation required.",
        confirmationRequired: true,
        text,
        command: parsedCommand,
        transaction,
      });
    }

    // QUERY
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
    console.error("Voice command error:", error);

    if (
      error.message === "All transaction fields are required" ||
      error.message === "Invalid transaction type" ||
      error.message === "Amount must be greater than 0" ||
      error.message.startsWith("Insufficient available balance") ||
      error.message === "No matching transaction found" ||
      error.message.startsWith("Multiple matching transactions") ||
      error.message === "No changes were provided" ||
      error.message.startsWith("Please specify which transaction")
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
