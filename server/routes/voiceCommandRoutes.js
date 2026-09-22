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

// ==========================================
// VOICE COMMAND
// ==========================================

router.post("/", protect, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Audio file is required.",
      });
    }

    console.log("🎤 Audio received by backend");

    // ==========================================
    // SPEECH → TEXT
    // ==========================================

    const transcription = await groq.audio.transcriptions.create({
      file: new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      }),
      model: "whisper-large-v3-turbo",
    });

    const text = transcription.text;

    console.log("🗣️ Transcription:", text);

    // ==========================================
    // TEXT → COMMAND
    // ==========================================

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",

      messages: [
        {
          role: "system",

          content: `
You are a finance command parser.

Return EXACTLY ONE JSON OBJECT.

Understand:
- English
- Hindi
- Hinglish
- Natural sentence structure

Actions:
- add
- update
- delete
- query

==========================================
ADD
==========================================

{
  "action": "add",
  "amount": 200,
  "category": "Food",
  "type": "Expense"
}

==========================================
UPDATE
==========================================

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

==========================================
DELETE
==========================================

{
  "action": "delete",
  "target": {
    "category": "Travel",
    "amount": 300,
    "type": "Expense",
    "latest": true
  }
}

DELETE RULES:

- target identifies the existing transaction.
- Include category if spoken.
- Include amount if spoken.
- Include type if spoken.
- Never invent values.
- Category can be any word or phrase.

LATEST RULE:

If the user says:
- latest
- last
- most recent
- abhi wala
- last wala
- sabse recent

set:

"latest": true

Otherwise:

"latest": false

or omit it.

Examples:

"Delete latest travel 100 rupees"

should become:

{
  "action": "delete",
  "target": {
    "category": "Travel",
    "amount": 100,
    "latest": true
  }
}

"Delete travel 100 rupees"

should NOT automatically set latest true.

==========================================
QUERY
==========================================

{
  "action": "query"
}

Return ONLY valid JSON.

Never return an array.
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

    // ==========================================
    // ADD
    // ==========================================

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

    // ==========================================
    // UPDATE
    // ==========================================

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

    // ==========================================
    // DELETE - FIND ONLY
    // ==========================================

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

    // ==========================================
    // QUERY
    // ==========================================

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
