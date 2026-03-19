'use strict';

/**
 * Dynamically detects EDI separators from the ISA segment header.
 *
 * ISA segment anatomy (fixed-width):
 *   ISA*...  — position 3 is the element separator character
 *   The ISA segment is always exactly 106 chars, and:
 *     - position 3  → element separator  (e.g. '*')
 *     - position 104 → component/sub-element separator (e.g. ':')
 *     - position 105 → segment terminator  (e.g. '~')
 *
 * We do NOT assume any character — everything is read from the raw string.
 */
function detectSeparators(rawEdi) {
  if (!rawEdi || rawEdi.length < 106) {
    throw new Error(
      'EDI input too short to detect separators. ' +
      'Expected at least 106 characters for a valid ISA segment.'
    );
  }

  if (!rawEdi.startsWith('ISA')) {
    throw new Error('EDI input must start with an ISA segment.');
  }

  const elementSeparator    = rawEdi[3];          // char right after "ISA"
  const componentSeparator  = rawEdi[104];         // ISA16 — sub-element separator
  const segmentTerminator   = rawEdi[105];         // character immediately after ISA16

  if (!elementSeparator || !componentSeparator || !segmentTerminator) {
    throw new Error('Could not reliably detect all three EDI separators.');
  }

  return { elementSeparator, componentSeparator, segmentTerminator };
}

module.exports = { detectSeparators };
