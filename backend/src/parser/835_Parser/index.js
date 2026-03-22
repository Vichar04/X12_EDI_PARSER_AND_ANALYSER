'use strict';

const fs   = require('fs');
const path = require('path');

const { detectSeparators } = require('./utils/separatorDetector');
const { tokenize }         = require('./parser/tokenizer');
const { EDI835Parser }     = require('./parser/ediParser');

/* ======================================================================
 *  parseEDI — primary public API
 *
 *  @param  {string}  input     Raw EDI text OR an absolute/relative file path
 *  @param  {object}  [options]
 *  @param  {boolean} [options.strict=false]   Throw on warnings
 *  @param  {boolean} [options.isFilePath=false]  Treat `input` as a file path
 *
 *  @returns {object}  Structured JSON representation of the 835 file
 * ====================================================================== */
function parseEDI(input, options = {}) {
  let rawEdi = input;

  // ---- If input is a file path, read it ----
  if (options.isFilePath) {
    const resolved = path.resolve(input);
    if (!fs.existsSync(resolved)) {
      throw new Error(`EDI file not found: ${resolved}`);
    }
    rawEdi = fs.readFileSync(resolved, 'utf8');
  }

  if (typeof rawEdi !== 'string' || rawEdi.trim().length === 0) {
    throw new TypeError('parseEDI() requires a non-empty string or a valid file path.');
  }

  // ---- Step 1: Detect separators dynamically ----
  const separators = detectSeparators(rawEdi);

  // ---- Step 2: Tokenize ----
  const segments = tokenize(rawEdi, separators);

  // ---- Step 3: Parse ----
  const parser = new EDI835Parser(separators, { strict: options.strict });
  const result = parser.parse(segments);

  return result;
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
