const express = require("express");
const fs = require("fs");
const router = express.Router();
const { parseEDI, validateEDI } = require("../src/parser/837_Parser");

router.post("/", (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file was uploaded." });
  }

  const filePath = `./uploads/${req.file.filename}`;

  try {
    // Custom logic for .txt files can be added here in the future
    const parseEDIJson = parseEDI(filePath);
    const { valid, errors, warnings } = validateEDI(parseEDIJson);

    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    res.status(200).json({ success: true, parseEDIJson, valid, errors, warnings });
  } catch (err) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
    res.status(400).json({ success: false, error: err.message || "An error occurred." });
  }
});

module.exports = router;
