'use strict';

const fs   = require('fs');
const path = require('path');
const { parse834 } = require('./parser/ediParser');

/**
 * parseEDI(filePath)
 * ------------------
 * Convenience helper: reads a .edi file from disk and returns parsed JSON.
 * Designed as the single public entry-point for file-based usage.
 *
 * @param {string} filePath – absolute or relative path to the .edi file
 * @returns {object}         – structured JSON result
 */
function parseEDI(filePath) {
  const absPath = path.resolve(filePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`EDI file not found: ${absPath}`);
  }

  const rawEdi = fs.readFileSync(absPath, 'utf8');
  return parse834(rawEdi);
}

/**
 * parseEDIString(rawEdi)
 * ----------------------
 * Parse directly from a raw EDI string (useful for API payloads, streams, tests).
 *
 * @param {string} rawEdi
 * @returns {object}
 */
function parseEDIString(rawEdi) {
  if (typeof rawEdi !== 'string' || !rawEdi.trim()) {
    throw new Error('parseEDIString: input must be a non-empty string.');
  }
  return parse834(rawEdi);
}

/* ======================================================================
 *  CLI convenience — run directly:  node index.js path/to/file.edi
 * ====================================================================== */
if (require.main === module) {
  const [,, filePath] = process.argv;

  if (!filePath) {
    console.error('Usage: node index.js <path-to-edi-file>');
    process.exit(1);
  }

  try {
    const result = parseEDI(filePath, { isFilePath: true });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Parse failed:', err.message);
    process.exit(1);
  }
}

module.exports = { parseEDI };
module.exports = { parseEDI, parseEDIString };
