import React from "react";

const Docs = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

      {/* Title */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete guide to using the EDI Parser & Analyzer platform.
        </p>
      </div>

      {/* Overview */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Overview</h2>
        <p>
          This platform processes healthcare X12 EDI files (837, 835, 834) by converting raw EDI data into structured JSON.
          It enables validation, error detection, and easier debugging of complex healthcare data.
        </p>
      </section>

      {/* Supported Formats */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Supported File Types</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li>.edi (standard EDI format)</li>
          <li>.txt (plain text EDI)</li>
          <li>.dat (generic data format)</li>
          <li>.x12 (X12 specific files)</li>
        </ul>
      </section>

      {/* Workflow */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Processing Workflow</h2>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Upload EDI file</li>
          <li>System detects transaction type (837 / 835 / 834)</li>
          <li>Backend parses EDI into structured JSON</li>
          <li>Validation engine checks for errors and warnings</li>
          <li>Results are displayed and stored</li>
        </ol>
      </section>

      {/* API Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">API Endpoint</h2>
        <div className="bg-gray-100 dark:bg-code rounded-lg p-4 text-sm overflow-x-auto">
          <code>POST /edi</code>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Upload an EDI file using multipart/form-data.
        </p>
      </section>

      {/* Sample Response */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Sample Response</h2>
        <pre className="bg-gray-100 dark:bg-code rounded-lg p-4 text-xs overflow-x-auto">
{`{
  "valid": true,
  "transaction": {
    "type": "837",
    "claims": [...]
  }
}`}
        </pre>
      </section>

      {/* Validation */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Validation</h2>
        <p>
          The system performs validation checks to identify missing segments, incorrect formats, and logical inconsistencies.
          Errors and warnings are displayed to help debug the EDI file.
        </p>
      </section>

      {/* Storage */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Data Storage</h2>
        <p>
          Raw EDI files are stored in cloud storage (Cloudflare R2), while parsed JSON data and user history are stored in a NoSQL database
          for efficient retrieval and analysis.
        </p>
      </section>

      {/* 🔐 Security Section (NEW) */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Security & Access Control</h2>
        <p>
          The backend API is secured using CORS (Cross-Origin Resource Sharing) and only allows requests from authorized origins.
          Currently, access is restricted to the local development environment (localhost) and the deployed frontend application.
        </p>
        <ul className="list-disc ml-5 mt-2 text-sm space-y-1">
          <li>Prevents unauthorized external API access</li>
          <li>Ensures only trusted frontend clients can interact with the backend</li>
          <li>Enhances overall system security and reliability</li>
        </ul>
      </section>

      {/* Notes */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Notes</h2>
        <ul className="list-disc ml-5 space-y-1 text-sm">
          <li>Currently supports X12 837 format (prototype limitation)</li>
          <li>Single file upload supported</li>
          <li>ZIP support can be added in future versions</li>
        </ul>
      </section>

    </div>
  );
};

export default Docs;