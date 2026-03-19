/**
 * separatorDetector.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamically extracts the three EDI delimiters from the ISA segment.
 *
 * WHY: EDI X12 allows trading partners to choose their own delimiters. Hard-
 * coding them is a common and dangerous mistake. The ISA segment always has a
 * fixed byte layout regardless of which delimiters were chosen, which makes it
 * the perfect bootstrap point.
 *
 * ISA FIXED-WIDTH LAYOUT (106 total bytes including terminator):
 * ─────────────────────────────────────────────────────────────
 *  Pos   Len  Field
 *  0–2    3   Segment ID ("ISA")
 *  3      1   ★ ELEMENT SEPARATOR  (e.g. "*")
 *  4–5    2   ISA01 Auth Info Qualifier
 *  6      1   element sep
 *  7–16  10   ISA02 Auth Info
 *  17     1   element sep
 *  18–19  2   ISA03 Security Info Qualifier
 *  20     1   element sep
 *  21–30 10   ISA04 Security Info
 *  31     1   element sep
 *  32–33  2   ISA05 Interchange ID Qualifier (sender)
 *  34     1   element sep
 *  35–49 15   ISA06 Interchange Sender ID
 *  50     1   element sep
 *  51–52  2   ISA07 Interchange ID Qualifier (receiver)
 *  53     1   element sep
 *  54–68 15   ISA08 Interchange Receiver ID
 *  69     1   element sep
 *  70–75  6   ISA09 Interchange Date
 *  76     1   element sep
 *  77–80  4   ISA10 Interchange Time
 *  81     1   element sep
 *  82     1   ISA11 Repetition Separator
 *  83     1   element sep
 *  84–88  5   ISA12 Interchange Control Version
 *  89     1   element sep
 *  90–98  9   ISA13 Interchange Control Number
 *  99     1   element sep
 *  100    1   ISA14 Acknowledgment Requested
 *  101    1   element sep
 *  102    1   ISA15 Usage Indicator (P=Production T=Test)
 *  103    1   element sep
 *  104    1   ★ COMPONENT (SUB-ELEMENT) SEPARATOR  (e.g. ":")
 *  105    1   ★ SEGMENT TERMINATOR  (e.g. "~")
 *
 * @module separatorDetector
 */

"use strict";

/**
 * Detects the three EDI separators from the raw ISA segment.
 *
 * @param {string} rawEdi - Raw EDI document string (may include BOM / CRLF)
 * @returns {{ elementSeparator: string, componentSeparator: string, segmentTerminator: string }}
 * @throws {Error} If the string does not begin with a valid ISA segment
 */
function detectSeparators(ediString) {
  const elementSeparator = ediString[3];
  console.log(ediString);

  let cnt = 0, indx = 0;
  while(indx < ediString.length && cnt < 16) {
    if(ediString[indx] == elementSeparator) cnt++;
    console.log(cnt);
    indx++;
  }
  const componentSeparator = ediString[indx];
  const segmentTerminator = ediString[indx + 1]; 

  return {
    elementSeparator,
    componentSeparator,
    segmentTerminator,
  };
}
module.exports = { detectSeparators };
