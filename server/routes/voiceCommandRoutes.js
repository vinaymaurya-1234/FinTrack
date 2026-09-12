const express = require("express");
const multer = require("multer");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/", protect, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Audio file is required.",
      });
    }

    console.log("🎤 Audio received by backend");
    console.log("File name:", req.file.originalname);
    console.log("File type:", req.file.mimetype);
    console.log("File size:", req.file.size);

    return res.status(200).json({
      message: "Audio received successfully.",
    });
  } catch (error) {
    console.error("Voice audio error:", error);

    return res.status(500).json({
      message: "Audio upload failed.",
    });
  }
});

module.exports = router;