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

    const transcription = await groq.audio.transcriptions.create({
      file: new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      }),
      model: "whisper-large-v3-turbo",
    });

    console.log("🗣️ Transcription:", transcription.text);

    return res.status(200).json({
      message: "Audio transcribed successfully.",
      text: transcription.text,
    });
  } catch (error) {
    console.error("Voice transcription error:", error);

    return res.status(500).json({
      message: "Audio transcription failed.",
    });
  }
});

module.exports = router;