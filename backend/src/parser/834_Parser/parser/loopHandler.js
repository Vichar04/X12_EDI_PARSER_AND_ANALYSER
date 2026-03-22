'use strict';

/**
 * loopHandler.js
 * --------------
 * Pure mapping functions that convert raw segment arrays into typed objects.
 * All field positions follow the ASC X12 005010X220A1 (834) spec.
 *
 * Each handler receives:
 *   elements  – string[] for the full segment (index 0 = segment ID)
 *   ctx       – shared parse context (separators, warnings array)
 */

function warn(ctx, msg) {
  ctx.warnings.push(msg);
  console.warn(`[loopHandler] ${msg}`);
}

// ─── Interchange & Group ──────────────────────────────────────────────────────

function handleISA(elements) {
  return {
    authInfoQualifier:    elements[1]  || '',
    authInfo:             (elements[2]  || '').trim(),
    securityInfoQualifier:elements[3]  || '',
    securityInfo:         (elements[4]  || '').trim(),
    senderIdQualifier:    elements[5]  || '',
    senderId:             (elements[6]  || '').trim(),
    receiverIdQualifier:  elements[7]  || '',
    receiverId:           (elements[8]  || '').trim(),
    date:                 elements[9]  || '',
    time:                 elements[10] || '',
    repetitionSep:        elements[11] || '',
    versionNumber:        elements[12] || '',
    controlNumber:        elements[13] || '',
    ackRequested:         elements[14] || '',
    usageIndicator:       elements[15] || '',
    componentSep:         elements[16] || '',
  };
}

function handleGS(elements) {
  return {
    functionalIdCode: elements[1] || '',
    senderCode:       elements[2] || '',
    receiverCode:     elements[3] || '',
    date:             elements[4] || '',
    time:             elements[5] || '',
    controlNumber:    elements[6] || '',
    responsibleAgency:elements[7] || '',
    version:          elements[8] || '',
  };
}

function handleST(elements) {
  return {
    transactionSetId:      elements[1] || '',
    controlNumber:         elements[2] || '',
    implementationConvRef: elements[3] || '',
  };
}

// ─── Sponsor / Payer (1000A / 1000B) ─────────────────────────────────────────

function handleN1(elements) {
  return {
    entityIdCode: elements[1] || '',  // P5 = Sponsor, IN = Payer/Insurance
    name:         elements[2] || '',
    idCodeQualifier: elements[3] || '',
    idCode:       elements[4] || '',
  };
}

// ─── Member-level segments (2000 loop) ───────────────────────────────────────

/**
 * INS – Member Level Detail
 * INS01  Y/N  → subscriber indicator
 * INS02       → individual relationship code (18 = self/subscriber)
 * INS03       → maintenance type code
 * INS04       → maintenance reason code
 * INS05       → benefit status code
 * INS08       → employment status code
 */
function handleINS(elements) {
  return {
    subscriberIndicator: elements[1] || '',   // Y = subscriber
    relationshipCode:    elements[2] || '',   // 18 = self
    maintenanceTypeCode: elements[3] || '',
    maintenanceReasonCode: elements[4] || '',
    benefitStatusCode:   elements[5] || '',
    medicarePlanCode:    elements[6] || '',
    cobraQualifyingEvent:elements[7] || '',
    employmentStatusCode:elements[8] || '',
  };
}

/**
 * NM1 – Individual or Organisational Name
 * NM101 → entity ID qualifier (IL = insured, 74 = corrected insured)
 * NM102 → entity type (1 = person)
 * NM103 → last name
 * NM104 → first name
 * NM105 → middle name
 * NM108 → id code qualifier (34 = SSN, MI = member id)
 * NM109 → member id value
 */
function handleNM1(elements) {
  return {
    entityIdCode:    elements[1] || '',
    entityType:      elements[2] || '',
    lastName:        elements[3] || '',
    firstName:       elements[4] || '',
    middleName:      elements[5] || '',
    prefix:          elements[6] || '',
    suffix:          elements[7] || '',
    idCodeQualifier: elements[8] || '',
    memberId:        elements[9] || '',
  };
}

/**
 * DMG – Demographic Information
 * DMG01 → date format qualifier (D8 = CCYYMMDD)
 * DMG02 → date of birth
 * DMG03 → gender (M/F/U)
 */
function handleDMG(elements) {
  const rawDob = elements[2] || '';
  return {
    dobFormat: elements[1] || '',
    dob:       rawDob,
    dobISO:    formatDate(rawDob),
    gender:    elements[3] || '',
    genderLabel: genderLabel(elements[3]),
  };
}

/**
 * N3 – Address Line
 */
function handleN3(elements) {
  return {
    addressLine1: elements[1] || '',
    addressLine2: elements[2] || '',
  };
}

/**
 * N4 – City/State/Zip
 */
function handleN4(elements) {
  return {
    city:        elements[1] || '',
    state:       elements[2] || '',
    postalCode:  elements[3] || '',
    countryCode: elements[4] || '',
  };
}

/**
 * HD – Health Coverage
 * HD01 → maintenance type code
 * HD03 → insurance line code (HLT, DEN, VIS, etc.)
 * HD04 → plan coverage description
 * HD05 → coverage level code
 */
function handleHD(elements) {
  return {
    maintenanceTypeCode: elements[1] || '',
    timeperiodQualifier: elements[2] || '',
    insuranceLineCode:   elements[3] || '',
    planCoverage:        elements[4] || '',
    coverageLevelCode:   elements[5] || '',
  };
}

/**
 * DTP – Date or Time Period
 * DTP01 → date/time qualifier (348=benefit begin, 349=benefit end, 336=eligibility begin)
 * DTP02 → date format (D8)
 * DTP03 → date value
 */
function handleDTP(elements) {
  const rawDate = elements[3] || '';
  return {
    qualifier:      elements[1] || '',
    qualifierLabel: dtpQualifierLabel(elements[1]),
    dateFormat:     elements[2] || '',
    date:           rawDate,
    dateISO:        formatDate(rawDate),
  };
}

/**
 * REF – Reference Identification
 */
function handleREF(elements) {
  return {
    qualifier: elements[1] || '',
    value:     elements[2] || '',
    description: elements[3] || '',
  };
}

/**
 * PER – Administrative Communications Contact
 */
function handlePER(elements) {
  return {
    contactFunctionCode: elements[1] || '',
    name:                elements[2] || '',
    commNumberQualifier1:elements[3] || '',
    commNumber1:         elements[4] || '',
    commNumberQualifier2:elements[5] || '',
    commNumber2:         elements[6] || '',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(raw) {
  if (!raw || raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function genderLabel(code) {
  const map = { M: 'Male', F: 'Female', U: 'Unknown' };
  return map[code] || code || 'Unknown';
}

function dtpQualifierLabel(code) {
  const map = {
    '348': 'Benefit Begin',
    '349': 'Benefit End',
    '336': 'Eligibility Begin',
    '357': 'COBRA Begin',
    '303': 'Maintenance Effective',
  };
  return map[code] || code;
}

// ─── Validation Hook (extensible rules engine) ───────────────────────────────

/**
 * validateSegment – placeholder hook for future rules.
 * Return an array of error strings; empty array = valid.
 */
function validateSegment(elements, ctx) {
  const errors = [];
  const segId = elements[0];

  // Example built-in rules
  if (segId === 'INS' && !elements[1]) {
    errors.push(`INS01 (subscriber indicator) is required but missing.`);
  }
  if (segId === 'NM1' && !elements[3]) {
    errors.push(`NM1 last name is missing.`);
  }

  if (errors.length) {
    errors.forEach(e => warn(ctx, `Validation [${segId}]: ${e}`));
  }
  return errors;
}

module.exports = {
  handleISA, handleGS, handleST,
  handleN1,
  handleINS, handleNM1, handleDMG,
  handleN3, handleN4,
  handleHD, handleDTP, handleREF, handlePER,
  validateSegment,
};
