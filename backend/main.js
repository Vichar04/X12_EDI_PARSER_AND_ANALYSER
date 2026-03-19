require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { parseEDI, validateEDI } = require("./src/parser/837_Parser");
const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder must exist
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/parseEDIString", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No file was uploaded.",
    });
  }

  const filePath = `./uploads/${req.file.filename}`;

  try {
    const parseEDIJson = parseEDI(filePath);
    const { valid, errors, warnings } = validateEDI(parseEDIJson);
    
    // Clean up the uploaded file after successful processing
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    res.status(200).json({
      success: true,
      parseEDIJson,
      valid,
      errors,
      warnings
    });
  } catch (err) {
    // Clean up the uploaded file even if parsing fails
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error("Error deleting file:", unlinkErr);
    });

    res.status(400).json({
      success: false,
      error: err.message || "An error occurred while parsing the EDI file.",
    });
  }
});

app.get("/server-health", (req, res) => {
  res.send(`Server is Healthy`);
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running fine on the Port ${process.env.PORT}`);
});
