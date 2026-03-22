/**
 * index.js  —  Public API
 * ─────────────────────────────────────────────────────────────────────────────
 * Wires together the three pipeline stages:
 *
 *   1. separatorDetector  →  read ISA[3], ISA[104], ISA[105]
 *   2. tokenizer          →  raw string → string[][]
 *   3. EDIParser          →  string[][] → structured JSON
 *
 * Exports:
 *   parseEDIString(rawEdi)  — parse a string
 *   parseEDI(filePath)      — read a file, then parse
 *   validateEDI(result)     — run basic structural validation
 *
 * @module index
 */

"use strict";

const fs = require("fs");
const path = require("path");

const { detectSeparators } = require("./utils/separatorDetector");
const { tokenize } = require("./parser/tokenizer");
const { EDIParser } = require("./parser/ediParser");

// ─────────────────────────────────────────────────────────────────────────────
// Core: parse an EDI string
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a raw EDI 837 string and returns a structured JSON object.
 *
 * @param {string} rawEdi - Full EDI document as a UTF-8 string
 * @returns {object}      - Structured representation of the EDI document
 * @throws {Error}        - If the ISA segment is missing or malformed
 */
function parseEDIString(rawEdi) {
  if (typeof rawEdi !== "string" || rawEdi.trim().length === 0) {
    throw new Error("parseEDIString: input must be a non-empty string");
  }

  // Stage 1: Detect separators (never hardcode these!)
  const separators = detectSeparators(rawEdi);
  console.log(separators);

  // Stage 2: Tokenise — split into segments, then elements
  const segments = tokenize(rawEdi, separators);
  console.log(segments);

  // Stage 3: Parse — build the hierarchical JSON structure
  const parser = new EDIParser(separators.componentSeparator);
  const result = parser.parse(segments);

  // Attach separator metadata so consumers can debug round-trip issues
  result._meta.separators = separators;

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: read a file then parse it
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads an EDI file from the filesystem and parses it.
 *
 * @param {string} filePath - Absolute or relative path to the .edi file
 * @returns {object}        - Same structure as parseEDIString
 * @throws {Error}          - If the file does not exist or cannot be read
 */
function parseEDI(filePath) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`parseEDI: file cannot be parsed`);
  }

  const rawEdi = fs.readFileSync(absolutePath, "utf8");
  return parseEDIString(rawEdi);
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Hook  (placeholder for a rules engine)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs a set of structural validation rules against a parsed EDI result.
 *
 * This is intentionally lightweight — it validates shape and required fields,
 * not HIPAA business rules.  Extend `VALIDATION_RULES` to add custom checks
 * without touching the parser itself.
 *
 * @param {object} parsedResult - Output of parseEDI / parseEDIString
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateEDI(parsedResult) {
  const errors = [];
  const warnings = [];

  // Helper: push an error with a readable path label
  const err = (msg) => errors.push(msg);
  const warn = (msg) => warnings.push(msg);

  // ── Interchange ───────────────────────────────────────────────────────────
  const ic = parsedResult.interchange || {};
  if (!ic.controlNumber) err("ISA13 (Interchange Control Number) is missing");
  if (!ic.senderId) err("ISA06 (Sender ID) is missing");
  if (!ic.receiverId) err("ISA08 (Receiver ID) is missing");
  if (ic.usageIndicator === "Production") {
    warn("File is marked as Production — ensure this is intentional");
  }

  // ── Group ────────────────────────────────────────────────────────────────
  const grp = parsedResult.group || {};
  if (!grp.controlNumber) err("GS06 (Group Control Number) is missing");
  if (grp.functionalIdentifierCode && grp.functionalIdentifierCode !== "HC") {
    warn(
      `GS01 functional code is "${grp.functionalIdentifierCode}", expected "HC" for claims`,
    );
  }

  // ── Transaction ───────────────────────────────────────────────────────────
  const tx = parsedResult.transaction || {};
  if (!tx.transactionCode) err("ST01 (Transaction Set Code) is missing");
  if (tx.transactionCode && tx.transactionCode !== "837") {
    warn(`ST01 is "${tx.transactionCode}", expected "837"`);
  }
  if (!tx.header?.transactionDate) warn("BHT04 (Transaction Date) is missing");

  // ── Submitter ─────────────────────────────────────────────────────────────
  const sub = tx.submitter || {};
  if (!sub.name) warn("Loop 1000A: Submitter name (NM103) is missing");
  if (!sub.id) warn("Loop 1000A: Submitter ID (NM109) is missing");

  // ── Billing Providers & Hierarchy ─────────────────────────────────────────
  const providers = tx.billingProviders || [];
  if (providers.length === 0) {
    err("No Billing Provider (HL level 20) found in the document");
  }

  providers.forEach((bp, bpIdx) => {
    const bpLabel = `BillingProvider[${bpIdx + 1}]`;

    if (!bp.name) warn(`${bpLabel}: NPI name (NM103) is missing`);
    if (!bp.npi) warn(`${bpLabel}: NPI number (NM109) is missing`);
    if (!bp.taxId) warn(`${bpLabel}: Tax ID (REF*EI) is missing`);

    const subscribers = bp.subscribers || [];
    if (subscribers.length === 0) {
      warn(`${bpLabel}: no subscribers (HL level 22) found`);
    }

    subscribers.forEach((subscriber, subIdx) => {
      const subLabel = `${bpLabel}.Subscriber[${subIdx + 1}]`;

      if (!subscriber.name) warn(`${subLabel}: name (NM103) is missing`);
      if (!subscriber.memberId)
        warn(`${subLabel}: member ID (NM109) is missing`);

      const claims = subscriber.claims || [];
      if (claims.length === 0) {
        warn(`${subLabel}: no claims (CLM) found`);
      }

      claims.forEach((claim, claimIdx) => {
        const claimLabel = `${subLabel}.Claim[${claimIdx + 1}]`;

        if (!claim.claimId)
          err(
            `${claimLabel}: CLM01 (Claim Submission Reason Code / Claim ID) is missing`,
          );
        if (!claim.totalCharge || claim.totalCharge <= 0)
          warn(`${claimLabel}: CLM02 (Total Charge) is zero or missing`);
        if (!claim.diagnosisCodes || claim.diagnosisCodes.length === 0)
          err(`${claimLabel}: No diagnosis codes (HI segment) found`);
        if (!claim.serviceLines || claim.serviceLines.length === 0)
          warn(`${claimLabel}: No service lines (LX/SV2) found`);

        // Check institutional-specific fields
        const ic2 = claim.institutionalCodes || {};
        if (!ic2.admissionTypeCode)
          warn(`${claimLabel}: CL101 (Admission Type Code) is missing`);
        if (!ic2.patientStatusCode)
          warn(`${claimLabel}: CL103 (Patient Status Code) is missing`);
      });

      // Also check patient (dependent) claims
      const dependents = subscriber.dependents || [];
      dependents.forEach((dep, depIdx) => {
        if (!dep.name)
          warn(`${subLabel}.Dependent[${depIdx + 1}]: name is missing`);
      });
    });
  });

  // ── Parser's own warnings ─────────────────────────────────────────────────
  const parserWarnings = parsedResult._meta?.warnings || [];
  parserWarnings.forEach((w) => warn(`[Parser] ${w.message || w}`));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = { parseEDI, parseEDIString, validateEDI };

// ─────────────────────────────────────────────────────────────────────────────
// CLI  (node src/index.js <path-to-file>)
// ─────────────────────────────────────────────────────────────────────────────
