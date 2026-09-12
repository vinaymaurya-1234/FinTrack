const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");
const { toFile } = require("openai");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", protect, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Audio file is required.",
      });
    }

    console.log("🎤 Audio received by backend");

    const audioFile = await toFile(
      req.file.buffer,
      req.file.originalname,
      {
        type: req.file.mimetype,
      }
    );

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-mini-transcribe",
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