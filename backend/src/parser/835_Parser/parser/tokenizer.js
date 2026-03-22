'use strict';

/**
 * Tokenizer
 * ---------
 * Splits raw EDI text into a 2-D array of tokens.
 *
 * Output shape:
 *   [
 *     ["ISA", "00", "          ", ...],
 *     ["GS",  "HP", "SENDER",   ...],
 *     ["ST",  "835","0001"],
 *     ...
 *   ]
 *
 * Rules:
 *   • Segments are split on segmentTerminator.
 *   • Elements  are split on elementSeparator.
 *   • Empty / whitespace-only lines are discarded.
 *   • No trimming of element values — preserve original spacing
 *     so callers can decide what to do with it.
 */
function tokenize(rawEdi, { elementSeparator, segmentTerminator }) {
  if (typeof rawEdi !== 'string') {
    throw new TypeError('tokenize() expects a string as first argument.');
  }

  // Normalise line endings that might sit between the terminator and the
  // next segment identifier (common in real-world EDI files).
  const normalized = rawEdi.replace(/\r?\n/g, '');

  const segments = normalized
    .split(segmentTerminator)
    .map(seg => seg.trim())
    .filter(seg => seg.length > 0)
    .map(seg => seg.split(elementSeparator));

  return segments;
}

module.exports = { tokenize };
