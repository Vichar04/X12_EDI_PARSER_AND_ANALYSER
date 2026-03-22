'use strict';

const { LoopHandler } = require('./loopHandler');

/* ======================================================================
 *  Validation hook — placeholder for a future rule engine.
 *  Receives the raw tokenised segment array and an optional context string.
 *  Return { valid: true } to pass, or { valid: false, message: '...' }
 *  to log a warning.  Throwing here will surface as a parse error.
 * ====================================================================== */
function validateSegment(segment, _context) {
  // ---- example rule: every segment must have an identifier ----
  if (!segment || segment.length === 0 || !segment[0]) {
    return { valid: false, message: 'Segment has no identifier.' };
  }
  return { valid: true };
}

/* ======================================================================
 *  Small helpers
 * ====================================================================== */

/** Safe element access — returns '' rather than undefined. */
const el = (seg, idx) => (seg[idx] !== undefined ? seg[idx].trim() : '');

/** Parse a numeric element; return 0 on NaN / empty. */
const num = (seg, idx) => {
  const v = parseFloat(el(seg, idx));
  return isNaN(v) ? 0 : v;
};

/** Strip the qualifier prefix from a composite element, e.g. "HC:99213" → "99213". */
const stripQualifier = (value, sep) => {
  const parts = value.split(sep);
  return parts.length > 1 ? parts[1].trim() : parts[0].trim();
};

/* ======================================================================
 *  parseAdjustments
 *  CAS*GroupCode*ReasonCode*Amount[*ReasonCode*Amount …]~
 * ====================================================================== */
function parseAdjustments(seg) {
  const adjustments = [];
  const group = el(seg, 1);

  // Elements come in pairs starting at index 2: reason, amount
  for (let i = 2; i < seg.length - 1; i += 3) {
    const reason = el(seg, i);
    const amount = num(seg, i + 1);
    if (reason) {
      adjustments.push({ group, reason, amount });
    }
  }
  return adjustments;
}

/* ======================================================================
 *  Main EDI835 Parser
 * ====================================================================== */
class EDI835Parser {
  /**
   * @param {object} separators  - { elementSeparator, componentSeparator, segmentTerminator }
   * @param {object} [options]
   * @param {boolean} [options.strict=false]  - throw on warnings instead of logging
   */
  constructor(separators, options = {}) {
    this.sep    = separators;
    this.strict = options.strict || false;
    this.warnings = [];
  }

  /* ------------------------------------------------------------------ */

  _warn(message, segmentId) {
    const entry = segmentId ? `[${segmentId}] ${message}` : message;
    this.warnings.push(entry);
    if (this.strict) throw new Error(entry);
    // eslint-disable-next-line no-console
    console.warn(`⚠️  EDI835 Parser Warning: ${entry}`);
  }

  /* ------------------------------------------------------------------ */
  /*  Public entry point                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Parse a 2-D token array (output of tokenizer) into a structured object.
   *
   * @param  {string[][]} segments
   * @returns {object}  Structured EDI 835 JSON
   */
  parse(segments) {
    const result = {
      interchange : {},
      group       : {},
      transaction : {
        header   : {},
        payer    : {},
        payee    : {},
        claims   : [],
      },
      _warnings   : this.warnings,
    };

    const loop = new LoopHandler();

    for (const seg of segments) {
      // ---- run validation hook ----
      const validation = validateSegment(seg, loop.toString());
      if (!validation.valid) {
        this._warn(validation.message, seg[0]);
        continue;   // skip malformed segment
      }

      const id = seg[0].toUpperCase();

      try {
        this._handleSegment(id, seg, result, loop);
      } catch (err) {
        // Graceful degradation — log and continue
        this._warn(`Error processing segment ${id}: ${err.message}`, id);
      }
    }

    return result;
  }

  /* ------------------------------------------------------------------ */
  /*  Segment dispatcher                                                  */
  /* ------------------------------------------------------------------ */

  _handleSegment(id, seg, result, loop) {
    switch (id) {
      /* ---- Interchange ---- */
      case 'ISA': return this._parseISA(seg, result);
      case 'IEA': return this._parseIEA(seg, result);

      /* ---- Functional Group ---- */
      case 'GS':  return this._parseGS(seg, result);
      case 'GE':  return this._parseGE(seg, result);

      /* ---- Transaction Set ---- */
      case 'ST':  return this._parseST(seg, result);
      case 'SE':  return this._parseSE(seg, result);

      /* ---- Payment Info ---- */
      case 'BPR': return this._parseBPR(seg, result);
      case 'TRN': return this._parseTRN(seg, result);

      /* ---- Loops 1000A / 1000B ---- */
      case 'N1':  return this._parseN1(seg, result, loop);
      case 'N3':  return this._parseN3(seg, result, loop);
      case 'N4':  return this._parseN4(seg, result, loop);

      /* ---- Loop 2000 — Claim ---- */
      case 'CLP': return this._parseCLP(seg, result, loop);

      /* ---- Loop 2000 — Claim level segments ---- */
      case 'NM1': return this._parseNM1(seg, result, loop);
      case 'REF': return this._parseREF(seg, result, loop);
      case 'DTM':
      case 'DTP': return this._parseDTP(seg, result, loop);
      case 'AMT': return this._parseAMT(seg, result, loop);
      case 'CAS': return this._parseCAS(seg, result, loop);

      /* ---- Loop 2100 — Service Line ---- */
      case 'SVC': return this._parseSVC(seg, result, loop);

      /* ---- Gracefully ignore unknown segments ---- */
      default:
        // Uncomment for verbose debugging:
        // this._warn(`Unrecognised segment: ${id}`, id);
        break;
    }
  }

  /* ================================================================== */
  /*  Interchange & Group                                                */
  /* ================================================================== */

  _parseISA(seg, result) {
    result.interchange = {
      authorizationQualifier : el(seg, 1),
      authorizationInfo      : el(seg, 2),
      securityQualifier      : el(seg, 3),
      securityInfo           : el(seg, 4),
      senderIdQualifier      : el(seg, 5),
      senderId               : el(seg, 6),
      receiverIdQualifier    : el(seg, 7),
      receiverId             : el(seg, 8),
      date                   : el(seg, 9),
      time                   : el(seg, 10),
      repetitionSeparator    : el(seg, 11),
      versionNumber          : el(seg, 12),
      controlNumber          : el(seg, 13),
      acknowledgmentRequested: el(seg, 14),
      usageIndicator         : el(seg, 15),
    };
  }

  _parseIEA(seg, result) {
    result.interchange.functionalGroupCount = num(seg, 1);
    result.interchange.controlNumberEnd     = el(seg, 2);
  }

  _parseGS(seg, result) {
    result.group = {
      functionalIdentifier : el(seg, 1),
      applicationSender    : el(seg, 2),
      applicationReceiver  : el(seg, 3),
      date                 : el(seg, 4),
      time                 : el(seg, 5),
      controlNumber        : el(seg, 6),
      responsibleAgency    : el(seg, 7),
      versionRelease       : el(seg, 8),
    };
  }

  _parseGE(seg, result) {
    result.group.transactionSetCount = num(seg, 1);
    result.group.controlNumberEnd    = el(seg, 2);
  }

  /* ================================================================== */
  /*  Transaction Set                                                    */
  /* ================================================================== */

  _parseST(seg, result) {
    result.transaction.header = {
      transactionSetId      : el(seg, 1),
      controlNumber         : el(seg, 2),
      implementationConvention: el(seg, 3) || null,
    };
  }

  _parseSE(seg, result) {
    result.transaction.header.segmentCount  = num(seg, 1);
    result.transaction.header.controlNumberEnd = el(seg, 2);
  }

  /* ================================================================== */
  /*  BPR / TRN — Payment Detail                                         */
  /* ================================================================== */

  _parseBPR(seg, result) {
    result.transaction.payment = {
      transactionHandlingCode : el(seg, 1),
      monetaryAmount          : num(seg, 2),
      creditDebitFlag         : el(seg, 3),
      paymentMethod           : el(seg, 4),
      paymentFormat           : el(seg, 5),
      senderBankIdQualifier   : el(seg, 6),
      senderBankId            : el(seg, 7),
      senderAccountQualifier  : el(seg, 8),
      senderAccountNumber     : el(seg, 9),
      originatingCompanyId    : el(seg, 10),
      originatingCompanySupId : el(seg, 11),
      receiverBankIdQualifier : el(seg, 12),
      receiverBankId          : el(seg, 13),
      receiverAccountQualifier: el(seg, 14),
      receiverAccountNumber   : el(seg, 15),
      issueDate               : el(seg, 16),
    };
  }

  _parseTRN(seg, result) {
    result.transaction.traceNumber = {
      traceTypeCode    : el(seg, 1),
      referenceId      : el(seg, 2),
      originatingCompany: el(seg, 3) || null,
      referenceId2     : el(seg, 4) || null,
    };
  }

  /* ================================================================== */
  /*  N1 — Entity Name  (drives 1000A / 1000B loop detection)           */
  /* ================================================================== */

  _parseN1(seg, result, loop) {
    const qualifier = el(seg, 1).toUpperCase();
    const entity = {
      name               : el(seg, 2),
      identificationCode : el(seg, 4) || null,
      idQualifier        : el(seg, 3) || null,
    };

    if (qualifier === 'PR') {
      // Payer — loop 1000A
      loop.openLoop('1000A');
      result.transaction.payer = entity;
    } else if (qualifier === 'PE') {
      // Payee — loop 1000B
      loop.openLoop('1000B');
      result.transaction.payee = entity;
    } else if (loop.currentClaim) {
      // Other entity within a claim (e.g. rendering provider 82, attending 71 …)
      if (!loop.currentClaim.entities) loop.currentClaim.entities = [];
      loop.currentClaim.entities.push({ qualifier, ...entity });
    }
  }

  _parseN3(seg, result, loop) {
    const address = { street: el(seg, 1), street2: el(seg, 2) || null };
    this._attachToContext('address', address, result, loop);
  }

  _parseN4(seg, result, loop) {
    const cityStateZip = { city: el(seg, 1), state: el(seg, 2), zip: el(seg, 3) };
    this._attachToContext('cityStateZip', cityStateZip, result, loop);
  }

  /** Helper: attach a keyed object to the active loop context. */
  _attachToContext(key, value, result, loop) {
    if (loop.inLoop('1000A')) {
      result.transaction.payer[key] = value;
    } else if (loop.inLoop('1000B')) {
      result.transaction.payee[key] = value;
    } else if (loop.currentClaim) {
      loop.currentClaim[key] = value;
    }
  }

  /* ================================================================== */
  /*  CLP — Claim Payment  (opens 2000 loop)                            */
  /* ================================================================== */

  _parseCLP(seg, result, loop) {
    // Closing any previously open service line sub-loop
    if (loop.inSubLoop('2100')) {
      loop.closeSubLoop();
    }

    // Open (or re-open) the 2000 loop for this new claim
    loop.openLoop('2000');

    const claim = {
      claimId         : el(seg, 1),
      status          : el(seg, 2),
      totalCharge     : num(seg, 3),
      paidAmount      : num(seg, 4),
      patientResponsibility: num(seg, 5),
      claimFilingIndicator : el(seg, 6) || null,
      payerClaimControlNumber: el(seg, 7) || null,
      facilityTypeCode : el(seg, 8) || null,
      claimFrequencyCode: el(seg, 9) || null,
      patient         : {},
      adjustments     : [],
      references      : [],
      dates           : [],
      serviceLines    : [],
    };

    loop.setCurrentClaim(claim);
    result.transaction.claims.push(claim);
  }

  /* ================================================================== */
  /*  NM1 — Entity Name within a Claim or Service Line                  */
  /* ================================================================== */

  _parseNM1(seg, result, loop) {
    const qualifier = el(seg, 1).toUpperCase();

    const entity = {
      lastName     : el(seg, 3),
      firstName    : el(seg, 4),
      middleName   : el(seg, 5) || null,
      prefix       : el(seg, 6) || null,
      suffix       : el(seg, 7) || null,
      idQualifier  : el(seg, 8) || null,
      id           : el(seg, 9) || null,
    };

    const fullName = [entity.firstName, entity.lastName].filter(Boolean).join(' ');

    if (!loop.currentClaim) {
      // Outside a claim — likely a 1000x entity
      return;
    }

    if (qualifier === 'QC') {
      // Patient
      loop.currentClaim.patient = { name: fullName, ...entity };
    } else if (qualifier === 'IL') {
      // Insured / Subscriber
      loop.currentClaim.insured = { name: fullName, ...entity };
    } else if (qualifier === '82') {
      loop.currentClaim.renderingProvider = { name: fullName, ...entity };
    } else if (qualifier === '71') {
      loop.currentClaim.attendingProvider = { name: fullName, ...entity };
    } else {
      // Generic — add to entities list
      if (!loop.currentClaim.entities) loop.currentClaim.entities = [];
      loop.currentClaim.entities.push({ qualifier, name: fullName, ...entity });
    }
  }

  /* ================================================================== */
  /*  CAS — Adjustments  (claim-level or service-level)                 */
  /* ================================================================== */

  _parseCAS(seg, result, loop) {
    const adjustments = parseAdjustments(seg);

    if (loop.currentServiceLine) {
      loop.currentServiceLine.adjustments.push(...adjustments);
    } else if (loop.currentClaim) {
      loop.currentClaim.adjustments.push(...adjustments);
    } else {
      this._warn('CAS segment encountered outside of any claim or service context.', 'CAS');
    }
  }

  /* ================================================================== */
  /*  SVC — Service Line  (opens 2100 sub-loop)                         */
  /* ================================================================== */

  _parseSVC(seg, result, loop) {
    if (!loop.currentClaim) {
      this._warn(
        'SVC segment found without an active CLP parent. Segment skipped.',
        'SVC'
      );
      return;
    }

    // Open (or re-open) the 2100 sub-loop
    loop.openSubLoop('2100');

    const compositeCode = el(seg, 1);
    const procedure = stripQualifier(compositeCode, this.sep.componentSeparator);

    const svcLine = {
      compositeCode  : compositeCode,
      procedure      : procedure,
      charge         : num(seg, 2),
      paid           : num(seg, 3),
      revenueCode    : el(seg, 4) || null,
      units          : num(seg, 5) || null,
      adjProcedure   : el(seg, 6) || null,
      adjustments    : [],
      dates          : [],
      references     : [],
    };

    loop.setCurrentServiceLine(svcLine);
    loop.currentClaim.serviceLines.push(svcLine);
  }

  /* ================================================================== */
  /*  REF — Reference Identification                                     */
  /* ================================================================== */

  _parseREF(seg, result, loop) {
    const ref = { qualifier: el(seg, 1), value: el(seg, 2) };

    if (loop.currentServiceLine) {
      loop.currentServiceLine.references.push(ref);
    } else if (loop.currentClaim) {
      loop.currentClaim.references.push(ref);
    }
  }

  /* ================================================================== */
  /*  DTP / DTM — Dates                                                  */
  /* ================================================================== */

  _parseDTP(seg, result, loop) {
    const dateEntry = {
      qualifier  : el(seg, 1),
      format     : el(seg, 2),
      date       : el(seg, 3),
    };

    if (loop.currentServiceLine) {
      loop.currentServiceLine.dates.push(dateEntry);
    } else if (loop.currentClaim) {
      loop.currentClaim.dates.push(dateEntry);
    } else {
      // Transaction-level date
      if (!result.transaction.dates) result.transaction.dates = [];
      result.transaction.dates.push(dateEntry);
    }
  }

  /* ================================================================== */
  /*  AMT — Monetary Amounts                                             */
  /* ================================================================== */

  _parseAMT(seg, result, loop) {
    const amt = { qualifier: el(seg, 1), amount: num(seg, 2) };

    if (loop.currentServiceLine) {
      if (!loop.currentServiceLine.amounts) loop.currentServiceLine.amounts = [];
      loop.currentServiceLine.amounts.push(amt);
    } else if (loop.currentClaim) {
      if (!loop.currentClaim.amounts) loop.currentClaim.amounts = [];
      loop.currentClaim.amounts.push(amt);
    }
  }
}

module.exports = { EDI835Parser, validateSegment };
