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

// ================================
// NORMALIZE AI COMMAND
// ================================

const normalizeCommand = (command, text) => {
  if (!command || typeof command !== "object") {
    throw new Error("Invalid AI command");
  }

  if (command.target && typeof command.target === "object") {
    const target = command.target;

    // Sometimes AI may accidentally include "latest"
    // inside category.
    if (typeof target.category === "string") {
      target.category = target.category
        .replace(/^(?:the\s+)?(?:latest|last|most\s+recent)\s+/i, "")
        .replace(/\s+(?:latest|last|most\s+recent)$/i, "")
        .trim();
    }

    // Detect latest directly from original transcription.
    const latestPattern =
      /\b(?:latest|last|most\s+recent|abhi\s+(?:wala|wali|waala|waali)|sabse\s+recent|sabse\s+latest)\b/i;

    if (latestPattern.test(text || "")) {
      target.latest = true;
    }
  }

  return command;
};

// ================================
// VOICE COMMAND
// ================================

router.post("/", protect, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Audio file is required.",
      });
    }

    console.log("🎤 Audio received by backend");

    // ================================
    // SPEECH → TEXT
    // ================================

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

    // ================================
    // TEXT → COMMAND
    // ================================

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
- query


========================================
ADD
========================================

{
  "action": "add",
  "amount": 200,
  "category": "Food",
  "type": "Expense"
}


========================================
UPDATE
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

For update:
- OLD values go inside target.
- NEW values go inside changes.


========================================
DELETE
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


DELETE RULES:

- target identifies the existing transaction.
- Include category if spoken.
- Include amount if spoken.
- Include type if spoken.
- Never invent values.
- Category can be any word or phrase.

IMPORTANT:

If the user says:

"latest travel 200"

return:

{
  "action": "delete",
  "target": {
    "category": "Travel",
    "amount": 200,
    "latest": true
  }
}

DO NOT make "latest travel" the category.

If the user says:

"delete latest food 200"

return:

{
  "action": "delete",
  "target": {
    "category": "Food",
    "amount": 200,
    "latest": true
  }
}

If the user says:

"delete travel 200"

DO NOT set latest to true.


========================================
LATEST WORDS
========================================

Set latest=true only when the user means:

- latest
- last
- most recent
- abhi wala
- abhi wali
- last wala
- last wali
- sabse recent
- sabse latest

When latest is requested:

IMPORTANT:
First identify the category/amount/type.
Then latest means the newest transaction AMONG THOSE MATCHING VALUES.

Example:

If transactions are:

Food ₹200
Travel ₹200
Travel ₹200
Food ₹500

"delete latest travel 200"

means:

Find Travel + ₹200
THEN select the newest Travel + ₹200.

It does NOT mean select the newest transaction overall.


========================================
QUERY
========================================

{
  "action": "query"
}


========================================
FINAL RULES
========================================

- Return ONLY valid JSON.
- Never return an array.
- Never invent category.
- Never invent amount.
- Never invent type.
- Keep category exactly as spoken.
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

    // Extra safety normalization
    parsedCommand = normalizeCommand(parsedCommand, text);

    console.log("🤖 AI Parsed Command:", parsedCommand);

    // ================================
    // ADD
    // ================================

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

    // ================================
    // UPDATE
    // ================================

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

    // ================================
    // DELETE
    // ================================

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

    // ================================
    // QUERY
    // ================================

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
