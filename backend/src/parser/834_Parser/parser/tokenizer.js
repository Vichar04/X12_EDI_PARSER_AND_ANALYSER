'use strict';

/**
 * Tokenizer
 * ---------
 * Splits raw EDI text into a two-dimensional array:
 *   [ [segId, el1, el2, ...], ... ]
 *
 * Each inner array represents one segment; index 0 is always the segment ID.
 * Empty/whitespace-only segments are silently skipped.
 */
function tokenize(rawEdi, { segmentTerm, elementSep }) {
  // Normalise line endings then split on segment terminator
  const cleaned = rawEdi.replace(/\r\n|\r/g, '\n').trim();

  const segments = cleaned
    .split(segmentTerm)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.split(elementSep));

  return segments;
}

module.exports = { tokenize };
