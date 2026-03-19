require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const { parseEDI, validateEDI } = require("./src/parser/837_Parser");
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      warnings,
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

app.post("/getSummary", async (req, res) => {
  try {
    // Retrieve the parseEDIjson from the request, falling back to the entire body if they sent the JSON payload directly
    const parseEDIJson =
      req.body.parseEDIjson ||
      req.body.parseEDIJson ||
      req.parseEDIJson ||
      req.body;

    const axiosResponse = await axios.post("http://localhost:11434/api/chat", {
      model: "llama3:8b",
      messages: [
        {
          role: "system",
          content: `You are a healthcare EDI (Electronic Data Interchange) specialist assistant. Your task is to analyze and summarize EDI files (837 claims, 835 payments, or 834 enrollments) in a clear, human-readable format.

Key requirements:
1. Identify the EDI document type first (837, 835, or 834)
2. Extract and summarize all critical information
3. Present information in clear sections with bullet points
4. Use plain English, avoid technical EDI jargon
5. Focus on what a healthcare professional would need to understand
6. If any critical data is missing, mention what should be there
7. Keep the summary concise but comprehensive`,
        },
        {
          role: "user",
          content: `I need a clear, human-readable summary of this EDI ${parseEDIJson.documentType || "document"} file.

Here's the parsed EDI JSON data:
${JSON.stringify(parseEDIJson, null, 2)}

Please provide a summary that includes:

1. **Document Overview**
   - Document type (837/835/834)
   - File/Control number
   - Date of processing
   - Sender/Receiver information

2. **Key Information** (based on document type):
   - For 837 (Claims): Patient info, provider details, services rendered, amounts
   - For 835 (Payments): Payment details, claim adjustments, patient responsibility
   - For 834 (Enrollments): Member info, coverage details, effective dates

3. **Financial Summary** (if applicable)
   - Total amounts
   - Payment breakdowns
   - Any adjustments

4. **Important Dates**
   - Service dates
   - Transaction dates
   - Effective dates

5. **Status Information**
   - Claim status
   - Payment status
   - Enrollment status

Format the response in clear sections with bullet points for easy reading. Start by stating which type of EDI document this is.`,
        },
      ],
      stream: false,
      // Add temperature to control creativity (lower = more focused)
      temperature: 0.3,
    });

    console.log(axiosResponse.data);

    res.status(200).json(axiosResponse.data);
  } catch (error) {
    // Read the internal error response from Ollama if available
    const ollamaError = error.response ? error.response.data.error : null;
    console.error("Ollama API Error:", ollamaError || error.message);

    res.status(400).json({
      success: false,
      error:
        ollamaError ||
        error.message ||
        "An error occurred while getting summary.",
    });
  }
});

app.get("/server-health", (req, res) => {
  res.send(`Server is Healthy`);
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running fine on the Port ${process.env.PORT}`);
});
