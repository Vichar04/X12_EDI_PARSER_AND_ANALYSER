require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const { parseEDI, validateEDI } = require("./src/parser/837_Parser");
const cors = require("cors");
const app = express();


const allowedOrigins = [
  "https://x12-edi-parser-and-analyser.vercel.app",
  "http://localhost:3000", // if you test locally
  // add other frontend URLs you need
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
}));


// Ensure the uploads directory exists so multer doesn't crash
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

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

const txtRoute = require("./routes/txt");
const ediRoute = require("./routes/edi");
const datRoute = require("./routes/dat");
const x12Route = require("./routes/x12");

app.use("/txt", upload.single("file"), txtRoute);
app.use("/edi", upload.single("file"), ediRoute);
app.use("/dat", upload.single("file"), datRoute);
app.use("/x12", upload.single("file"), x12Route);

app.post("/getSummary", async (req, res) => {
  try {
    // Retrieve the parseEDIjson from the request, falling back to the entire body if they sent the JSON payload directly
    const parseEDIJson =
      req.body.parseEDIjson ||
      req.body.parseEDIJson ||
      req.parseEDIJson ||
      req.body;

    function getDocumentTypeSpecificPrompt(parseEDIJson) {
      // Try to determine document type from the data
      const docType =
        parseEDIJson.documentType ||
        parseEDIJson.transactionType ||
        parseEDIJson.transactionSet ||
        "unknown";

      let typeSpecificInstructions = "";

      if (docType.includes("837") || parseEDIJson.claims) {
        typeSpecificInstructions = `
Focus on these 837 claim details:
- Patient name and demographics
- Subscriber/insured information
- Provider details (rendering, referring, billing)
- Claim dates (service, admission, discharge)
- Diagnosis codes and descriptions
- Procedure codes with modifiers
- Charge amounts and claim totals
- Claim status`;
      } else if (docType.includes("835") || parseEDIJson.payments) {
        typeSpecificInstructions = `
Focus on these 835 payment details:
- Payer information
- Payee/provider details
- Total payment amount
- Check/EFT number and date
- Individual claim payments
- Adjustment amounts and reasons
- Patient responsibility amounts`;
      } else if (docType.includes("834") || parseEDIJson.enrollment) {
        typeSpecificInstructions = `
Focus on these 834 enrollment details:
- Member name and demographics
- Subscriber information
- Coverage type (medical, dental, vision)
- Effective dates (coverage start/end)
- Plan details and benefits
- Premium amounts
- Member status (active/terminated)`;
      }

      return typeSpecificInstructions;
    }

    // Get the document-specific prompt
    const docSpecificPrompt = getDocumentTypeSpecificPrompt(parseEDIJson);

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
7. Keep the summary concise but comprehensive
8. **CRITICAL: Convert ALL dates to human-readable format (MM/DD/YYYY or Month DD, YYYY)**`,
        },
        {
          role: "user",
          content: `I need a clear, human-readable summary of this EDI ${parseEDIJson.documentType || "document"} file.

Here's the parsed EDI JSON data:
${JSON.stringify(parseEDIJson, null, 2)}

**IMPORTANT DATE FORMATTING REQUIREMENTS:**
- Convert all dates from any format (YYYYMMDD, YYYY-MM-DD, etc.) to **MM/DD/YYYY** format
- Example: "20240115" should become "01/15/2024"
- Example: "2024-01-15" should become "01/15/2024"
- If you see dates like "D8" or other EDI date formats, convert them properly
- Always specify what each date represents (Service Date, Process Date, Effective Date, etc.)

Please provide a summary that includes:

1. **Document Overview**
   - Document type (837/835/834)
   - File/Control number
   - Date of processing (in MM/DD/YYYY format)
   - Sender/Receiver information

2. **Key Information** (based on document type):
   ${docSpecificPrompt}

3. **Financial Summary** (if applicable)
   - Total amounts
   - Payment breakdowns
   - Any adjustments

4. **Important Dates** (ALL in MM/DD/YYYY format)
   - Service dates
   - Transaction dates
   - Effective dates
   - Termination dates
   - Process dates

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
