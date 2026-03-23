import React from "react";

const About = ({ darkMode, onToggle }) => {
  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-background text-gray-800 dark:text-gray-200 px-6 py-10 transition-colors duration-300">
        
        

        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">About the Project</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              A platform that simplifies complex healthcare EDI data into structured, validated, and actionable insights.
            </p>
          </div>

          {/* Project Overview */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">Project Overview</h2>
            <p>
              This platform processes healthcare X12 EDI files (837, 835, 834) by converting complex raw data into structured and readable formats.
              It enables users to upload, parse, validate, and analyze EDI files efficiently.
            </p>
          </section>

          {/* Purpose */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">Purpose</h2>
            <p>
              The goal is to simplify the handling of healthcare EDI data, which is typically difficult to read and debug,
              by providing an intuitive and structured system for developers and organizations.
            </p>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">What the System Does</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Accepts .edi, .txt, .dat, .x12, and .zip files</li>
              <li>Extracts ZIP files and identifies transaction types</li>
              <li>Parses EDI into structured JSON</li>
              <li>Validates files and highlights errors</li>
              <li>Stores raw and processed data</li>
              <li>Generates EDI from structured input</li>
            </ul>
          </section>

          {/* User Features */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">User Features(Will be implemented)</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Secure user authentication</li>
              <li>User-specific file access</li>
              <li>Chat assistance with stored history</li>
              <li>Easy retrieval of past files</li>
            </ul>
          </section>

          {/* Architecture */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">System Architecture</h2>
            <p>
              Built with a React frontend, Node.js backend, Cloudflare R2 for raw storage, and MongoDB for structured data and history.
            </p>
          </section>

          {/* Highlights */}
          <section>
            <h2 className="text-2xl font-semibold mb-2">Key Highlights</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Unified support for multiple EDI transaction types</li>
              <li>Backend-driven secure processing</li>
              <li>Structured output for easy integration</li>
              <li>End-to-end workflow from upload to regeneration</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;