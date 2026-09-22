const express = require("express");
const multer = require("multer");
const Groq = require("groq-sdk");
const protect = require("../middleware/authMiddleware");

const {
  createTransaction,
  updateTransaction,
  findTransactionForDelete,
  deleteTransaction,
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

    console.log("🎤 Audio received");

    // SPEECH → TEXT
    const transcription = await groq.audio.transcriptions.create({
      file: new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      }),
      model: "whisper-large-v3-turbo",
    });

    const text = transcription.text.trim();

    console.log("🗣️ Transcription:", text);

    // TEXT → COMMAND
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: `
You are a finance command parser.

Return EXACTLY ONE JSON OBJECT.

Understand English, Hindi and Hinglish.

Actions:
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

UPDATE:
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

DELETE:
{
  "action": "delete",
  "target": {
    "category": "Food",
    "amount": 200
  }
}

DELETE LAST/LATEST:
If user says "last", "latest", "sabse last", "recent" or similar, add:
"latest": true

Example:
"last Food transaction delete kar"

{
  "action": "delete",
  "target": {
    "category": "Food",
    "latest": true
  }
}

RULES:
- Category can be ANY word or phrase.
- Never invent category, amount or type.
- For update, old values go in target.
- New values go in changes.
- For delete, target identifies the existing transaction.
- Include type only when spoken.
- Never return an array.
- Return ONLY valid JSON.
          `,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const parsedCommand = JSON.parse(completion.choices[0].message.content);

    console.log("🤖 Parsed command:", parsedCommand);

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

    // DELETE
    if (parsedCommand.action === "delete") {
      const result = await findTransactionForDelete({
        userId: req.user._id,
        target: parsedCommand.target,
      });

      // Multiple matches
      if (result.multipleMatches) {
        return res.status(200).json({
          message:
            "Multiple matching transactions found. Please specify which one to delete.",
          confirmationRequired: true,
          multipleMatches: true,
          text,
          command: parsedCommand,
          transactions: result.transactions,
          count: result.count,
        });
      }

      // Single/latest transaction
      const transaction = result.transaction;

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
    console.error("❌ Voice command error:", error);

    return res.status(400).json({
      message: error.message || "Voice command failed.",
    });
  }
});

// ACTUAL DELETE AFTER CONFIRMATION
router.delete("/:transactionId", protect, async (req, res) => {
  try {
    const transaction = await deleteTransaction({
      userId: req.user._id,
      transactionId: req.params.transactionId,
    });

    return res.status(200).json({
      message: "Transaction deleted successfully.",
      transaction,
    });
  } catch (error) {
    console.error("❌ Delete error:", error);

    return res.status(400).json({
      message: error.message || "Transaction delete failed.",
    });
  }
});

module.exports = router;
