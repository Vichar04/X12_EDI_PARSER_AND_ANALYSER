import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const Home = () => {
  return (
    <>
      <Box component="main" sx={{ flexGrow: 1, p: 3, paddingTop: 10 }}>
        <h1 className="text-2xl font-bold">
          AI-Powered X12 EDI Parser & Validator
        </h1>
        <Typography component="div" sx={{ marginBottom: 2 }}>
          Transform complex healthcare EDI files into clear, structured insights
          — detect errors instantly, understand them in plain English, and fix
          them with AI assistance.
        </Typography>

        <h2 className="text-xl font-semibold">About the Platform</h2>
        <Typography component="div" sx={{ marginBottom: 2 }}>
          Healthcare data exchange relies heavily on X12 Electronic Data
          Interchange (EDI) — the backbone of claims processing, payments, and
          member enrollment in the US healthcare system. However, these files
          are difficult to read, validate, and debug due to their complex,
          delimiter-based structure and strict compliance rules. Our platform
          simplifies this process by converting raw EDI files into a structured,
          interactive, and human-readable format, enabling developers, billing
          teams, and administrators to quickly understand and resolve issues.
        </Typography>

        <h2 className="text-xl font-semibold">The Problem We Solve</h2>
        <Typography component="div" sx={{ marginBottom: 2 }}>
          Processing EDI files manually is time-consuming and error-prone. Even
          a small mistake — such as an invalid code, missing segment, or
          incorrect identifier — can lead to:
          <div>
            <ul style={{ listStyleType: "disc", marginLeft: "20px" }}>
              <li>Claim rejections and delayed payments</li>
              <li>Enrollment failures leaving members uninsured</li>
              <li>Increased operational costs</li>
              <li>Hours of manual debugging</li>
            </ul>
          </div>
          Our solution eliminates these inefficiencies by providing real-time
          validation and intelligent insights.
        </Typography>

        <h2 className="text-xl font-semibold">What Our Platform Does</h2>
        <Typography component="div" sx={{ marginBottom: 2 }}>
          <div>
            <ol style={{ listStyleType: "decimal", marginLeft: "20px" }}>
              <li>
                <b>Smart File Ingestion:</b> Upload any X12 EDI file (837, 835,
                or 834), and our system automatically detects its type and
                extracts key metadata.
              </li>
              <li>
                <b>Interactive EDI Parser:</b> Visualize the entire EDI
                structure in a collapsible tree format, making it easy to
                explore segments, loops, and elements without reading raw text.
              </li>
              <li>
                <b>Advanced Validation Engine:</b> Our rule-based engine checks
                for: Missing required segments Invalid formats (dates, NPIs,
                codes) Cross-field inconsistencies Transaction-specific
                compliance errors All issues are clearly highlighted with
                precise locations.
              </li>
              <li>
                <b>AI-Powered Error Explanation:</b> No more cryptic errors. Our
                AI assistant translates technical validation issues into simple,
                actionable explanations.
              </li>
              <li>
                <b>Intelligent Fix Suggestions:</b> For common errors, the
                platform suggests corrections that you can apply instantly —
                reducing debugging time significantly.
              </li>
              <li>
                <b>Transaction Insights:</b> View claim payments, adjustments,
                and patient responsibility and Track member additions, updates,
                and terminations
              </li>
            </ol>
          </div>
        </Typography>

        <h2 className="text-xl font-semibold">Who is this for?</h2>
        <Typography component="div" sx={{ marginBottom: 2 }}>
          <div>
            <ul style={{ listStyleType: "disc", marginLeft: "20px" }}>
              <li>Medical Billing Specialists</li>
              <li>Healthcare Developers</li>
              <li>Insurance Providers</li>
              <li>HR & Benefits Teams</li>
              <li>Healthcare IT Companies</li>
            </ul>
          </div>
        </Typography>

        <h2 className="text-xl font-semibold">Why Choose Us?</h2>
        <Typography component="div" sx={{ marginBottom: 2 }}>
          <div>
            <ul style={{ listStyleType: "disc", marginLeft: "20px" }}>
              <li>Instant parsing & validation</li>
              <li>AI-powered explanations</li>
              <li>Visual and intuitive interface</li>
              <li>Deep error insights</li>
              <li>Built for speed and accuracy</li>
            </ul>
          </div>
        </Typography>

        <h2 className="text-xl font-semibold">Our Mission</h2>
        <Typography component="div" sx={{ marginBottom: 2 }}>
          To simplify healthcare data processing by making EDI files
          transparent, understandable, and error-free, empowering teams to work
          faster and more efficiently.
        </Typography>
      </Box>
    </>
  );
};

export default Home;
