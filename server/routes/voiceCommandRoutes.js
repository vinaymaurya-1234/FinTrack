const express = require("express");
const multer = require("multer");
const Groq = require("groq-sdk");
const protect = require("../middleware/authMiddleware");
const { createTransaction } = require("../services/TransactionServices");

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
You are a finance command parser.

Convert the user's voice command into JSON.

Possible actions:
- add
- update
- delete
- query

For transaction commands return:

{
  "action": "add",
  "amount": 200,
  "category": "Travel",
  "type": "Expense"
}

Rules:
- If money is spent, type = "Expense"
- If money is received, type = "Income"
- Extract the amount
- Extract the category
- Do not invent missing information
- Return ONLY valid JSON
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


    // STEP 3: Execute the AI command

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
        text: text,
        command: parsedCommand,
        transaction: transaction,
      });
    }

    return res.status(200).json({
      message: "Command parsed successfully, but no transaction was created.",
      text: text,
      command: parsedCommand,
    });
 } catch (error) {
  console.error("Voice command error:", error);

  if (
    error.message === "All transaction fields are required" ||
    error.message === "Invalid transaction type" ||
    error.message === "Amount must be greater than 0" ||
    error.message.startsWith("Insufficient available balance")
  ) {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message: "Voice command failed.",
  });
}
});

module.exports = router;
