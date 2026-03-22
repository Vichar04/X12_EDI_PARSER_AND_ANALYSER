'use strict';

/**
 * separatorDetector.js
 * --------------------
 * Dynamically detects all three EDI separators from the ISA segment header.
 *
 * Strategy (robust, spec-compliant):
 *   1. elementSep  → always rawEdi[3]  (the char immediately after "ISA")
 *   2. Locate ISA16 by splitting on elementSep and taking the 17th token (index 16)
 *   3. componentSep → ISA16[0]   (first char of the 16th element value)
 *   4. segmentTerm  → ISA16[1]   (second char – the terminator that closes the ISA)
 *
 * This approach handles non-standard field padding (ISA06/ISA08 shorter than 15)
 * and any unusual terminator characters without ever hard-coding values.
 *
 * Validated against:
 *   - Standard  ~  terminator files
 *   - Files with \n or other chars as terminator
 *   - Compact ISA headers (stripped trailing spaces)
 */
function detectSeparators(rawEdi) {
  if (!rawEdi || rawEdi.length < 106) {
    // Allow slightly short ISA (non-padded fields) – 80 chars is a reasonable minimum
    if (!rawEdi || rawEdi.length < 80) {
      throw new Error(
        `EDI content too short to contain a valid ISA segment (got ${rawEdi ? rawEdi.length : 0} chars).`
      );
    }
  }

  // ── Step 1: element separator ─────────────────────────────────────────────
  const elementSep = rawEdi[3];

  // ── Step 2: find ISA16 (the component+terminator element) ─────────────────
  // We only need the very first line up to position ~200 to find ISA.
  const searchWindow = rawEdi.slice(0, 300);
  const tokens = searchWindow.split(elementSep);

  // ISA has exactly 16 data elements (tokens[0]='ISA', tokens[1]..tokens[16])
  if (tokens.length < 17) {
    throw new Error(
      `ISA segment appears malformed – expected at least 16 element separators, found ${tokens.length - 1}.`
    );
  }

  const isa16 = tokens[16]; // e.g.  ":~\nGS"  or  ":\n"  or  ":~"

  if (!isa16 || isa16.length < 2) {
    throw new Error(`ISA16 too short to extract separators: ${JSON.stringify(isa16)}`);
  }

  // ── Step 3: component separator ──────────────────────────────────────────
  const componentSep = isa16[0];

  // ── Step 4: segment terminator ────────────────────────────────────────────
  // ISA16 value = componentSep immediately followed by segmentTerm
  const segmentTerm = isa16[1];

  // ── Sanity checks ─────────────────────────────────────────────────────────
  if (elementSep === componentSep) {
    console.warn('[separatorDetector] elementSep === componentSep – file may be malformed.');
  }
  if (elementSep === segmentTerm) {
    console.warn('[separatorDetector] elementSep === segmentTerm – file may be malformed.');
  }
  if (componentSep === segmentTerm) {
    console.warn('[separatorDetector] componentSep === segmentTerm – file may be malformed.');
  }

  return { elementSep, componentSep, segmentTerm };
}

module.exports = { detectSeparators };
