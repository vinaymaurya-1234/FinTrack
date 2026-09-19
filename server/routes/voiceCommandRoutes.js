const express = require("express");
const multer = require("multer");
const Groq = require("groq-sdk");
const protect = require("../middleware/authMiddleware");

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
      model: "llama-3.1-8b-instant",
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

    // IMPORTANT:
    // Abhi transaction create nahi kar rahe.
    // Sirf AI parsing test kar rahe hain.

    return res.status(200).json({
      message: "Voice command parsed successfully.",
      text: text,
      command: parsedCommand,
    });
  } catch (error) {
    console.error("Voice command error:", error);

    return res.status(500).json({
      message: "Voice command failed.",
    });
  }
});

module.exports = router;
