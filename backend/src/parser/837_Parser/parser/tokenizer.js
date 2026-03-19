/**
 * tokenizer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Stage 1 of the parsing pipeline: raw EDI string → 2-D token array.
 *
 * RESPONSIBILITIES:
 *   • Split raw text on the segment terminator  → one entry per segment
 *   • Split each segment on the element separator → one entry per element
 *   • Strip CRLF / whitespace that trading partners often inject for readability
 *   • Provide safe element/component accessor helpers used by all higher layers
 *
 * The tokenizer does NOT interpret any business logic. It is intentionally
 * dumb — component (sub-element) splitting is left to the parser layer so
 * that this module stays reusable across 835, 834, 270/271, etc.
 *
 * OUTPUT EXAMPLE:
 *   [
 *     ['ISA', '00', '          ', '00', '          ', 'ZZ', 'SENDER', ...],
 *     ['GS',  'HC', 'SENDER', 'RECEIVER', '20230101', '1200', '1', 'X', '005010X223A2'],
 *     ['ST',  '837', '0001', '005010X223A2'],
 *     ['BHT', '0019', '00', 'BATCH001', '20230101', '1200', 'CH'],
 *     ...
 *   ]
 *
 * @module tokenizer
 */

'use strict';

/**
 * Converts a raw EDI string into a 2-D array of string tokens.
 *
 * @param {string} rawEdi       - Full EDI document as a string
 * @param {object} separators   - Detected separator set from separatorDetector
 * @param {string} separators.elementSeparator
 * @param {string} separators.segmentTerminator
 * @returns {string[][]}        - Array of segments; each segment is an array of elements
 */
function tokenize(rawEdi, separators) {
  const { elementSeparator, segmentTerminator } = separators;

  // ── Step 1: Split on segment terminator ─────────────────────────────────────
  // Trading partners often insert \r\n after "~" for human readability.
  // We must strip those before splitting so we don't get ghost segments.
  const rawSegments = rawEdi
    .split(segmentTerminator)
    .map((seg) => seg.replace(/[\r\n]/g, '').trim()) // normalise line endings
    .filter((seg) => seg.length > 0);               // discard empty entries

  // ── Step 2: Split each segment on the element separator ─────────────────────
  // Result: [['ISA','00',...], ['GS','HC',...], ...]
  const segments = rawSegments.map((raw) => raw.split(elementSeparator));

  return segments;
}

/**
 * Safely retrieves a string element from a parsed segment by index.
 * Returns an empty string instead of throwing when the index is out of bounds.
 *
 * Usage:
 *   getElement(seg, 1)   →  'HC'   (element at position 1)
 *   getElement(seg, 99)  →  ''     (safe OOB access)
 *
 * @param {string[]} segment - One tokenized segment
 * @param {number}   index   - 0-based position (0 = segment ID like 'ISA')
 * @returns {string}
 */
function getElement(segment, index) {
  const val = segment[index];
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

/**
 * Splits a composite EDI element on the component separator and returns the
 * requested component.  Composite elements look like "HC:99281:25" where ":"
 * is the component separator.
 *
 * Usage:
 *   getComponent('HC:99281:25', ':', 0)  →  'HC'
 *   getComponent('HC:99281:25', ':', 1)  →  '99281'
 *   getComponent('HC:99281:25', ':', 2)  →  '25'
 *   getComponent('HC:99281:25', ':', 9)  →  ''   (safe OOB)
 *   getComponent('',            ':', 0)  →  ''   (empty input)
 *
 * @param {string} element      - Raw element string (may contain component sep)
 * @param {string} componentSep - Component separator character (e.g. ':')
 * @param {number} componentIdx - 0-based index of the desired component
 * @returns {string}
 */
function getComponent(element, componentSep, componentIdx) {
  if (!element) return '';
  const parts = element.split(componentSep);
  const val   = parts[componentIdx];
  return (val !== undefined && val !== null) ? String(val).trim() : '';
}

/**
 * Splits a composite element into ALL its components.
 * Returns an array of strings, trimmed, empty slots included as ''.
 *
 * @param {string} element      - Raw element string
 * @param {string} componentSep - Component separator character
 * @returns {string[]}
 */
function splitComponents(element, componentSep) {
  if (!element) return [];
  return element.split(componentSep).map((c) => String(c).trim());
}

module.exports = { tokenize, getElement, getComponent, splitComponents };
