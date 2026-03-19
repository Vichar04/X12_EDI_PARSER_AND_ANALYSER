/**
 * ediParser.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Stage 3 of the pipeline: tokenised segments → structured JSON.
 *
 * DESIGN PHILOSOPHY:
 * ──────────────────
 * • State-machine: a `currentLoop` variable tracks which EDI loop context is
 *   active, so that generic segments (N3, N4, REF, DTP …) know where to attach
 *   their data without requiring caller hints.
 *
 * • Single-responsibility segment handlers: each _handle*() method deals with
 *   exactly one segment ID. Adding support for a new segment never touches
 *   existing handlers.
 *
 * • Fail-soft: every handler is wrapped in try/catch. A bad segment produces a
 *   warning in result._meta.warnings but never crashes the parser.
 *
 * LOOP STATE MACHINE:
 * ───────────────────
 * ENVELOPE ──BHT──► TRANSACTION_HDR
 *          ──NM1*41──► LOOP_1000A  (Submitter)
 *          ──NM1*40──► LOOP_1000B  (Receiver)
 *          ──HL..20──► LOOP_2000A  (Billing Provider HL)
 *            ──NM1*85──► LOOP_2010AA (Billing Provider Name)
 *            ──NM1*87──► LOOP_2010AB (Pay-to Provider Name)
 *          ──HL..22──► LOOP_2000B  (Subscriber HL)
 *            ──NM1*IL──► LOOP_2010BA (Subscriber Name)
 *            ──NM1*PR──► LOOP_2010BB (Payer Name)
 *          ──HL..23──► LOOP_2000C  (Patient HL)
 *            ──NM1*QC──► LOOP_2010CA (Patient Name)
 *          ──CLM──────► LOOP_2300   (Claim)
 *            ──NM1*71──► LOOP_2310A (Attending Physician)
 *            ──NM1*72──► LOOP_2310B (Operating Physician)
 *            ──NM1*77──► LOOP_2310C (Service Facility)
 *          ──LX───────► LOOP_2400   (Service Line)
 *
 * @module ediParser
 */

'use strict';

const { LoopHandler } = require('./loopHandler');
const { getElement, splitComponents } = require('./tokenizer');

// ─────────────────────────────────────────────────────────────────────────────
// Loop state constants
// ─────────────────────────────────────────────────────────────────────────────
const LOOP = Object.freeze({
  ENVELOPE:    'ENVELOPE',
  LOOP_1000A:  'LOOP_1000A',   // Submitter Name
  LOOP_1000B:  'LOOP_1000B',   // Receiver Name
  LOOP_2000A:  'LOOP_2000A',   // Billing/Pay-to Provider HL
  LOOP_2010AA: 'LOOP_2010AA',  // Billing Provider Name
  LOOP_2010AB: 'LOOP_2010AB',  // Pay-to Provider Name
  LOOP_2000B:  'LOOP_2000B',   // Subscriber HL
  LOOP_2000C:  'LOOP_2000C',   // Patient HL
  LOOP_2010BA: 'LOOP_2010BA',  // Subscriber Name
  LOOP_2010BB: 'LOOP_2010BB',  // Payer Name
  LOOP_2010CA: 'LOOP_2010CA',  // Patient Name (dependent)
  LOOP_2300:   'LOOP_2300',    // Claim Header
  LOOP_2310A:  'LOOP_2310A',   // Attending Physician
  LOOP_2310B:  'LOOP_2310B',   // Operating Physician
  LOOP_2310C:  'LOOP_2310C',   // Service Facility Location
  LOOP_2400:   'LOOP_2400',    // Service Line
});

/**
 * Maps NM1 entity qualifier codes to their target loop state.
 * This table is the single place to add support for additional entity types.
 */
const NM1_QUALIFIER_TO_LOOP = {
  '41': LOOP.LOOP_1000A,   // Submitter
  '40': LOOP.LOOP_1000B,   // Receiver
  '85': LOOP.LOOP_2010AA,  // Billing Provider
  '87': LOOP.LOOP_2010AB,  // Pay-to Provider
  'IL': LOOP.LOOP_2010BA,  // Insured / Subscriber
  'PR': LOOP.LOOP_2010BB,  // Payer
  'QC': LOOP.LOOP_2010CA,  // Patient (dependent)
  '71': LOOP.LOOP_2310A,   // Attending Physician
  '72': LOOP.LOOP_2310B,   // Operating Physician
  '77': LOOP.LOOP_2310C,   // Service Facility Location
  'DN': LOOP.LOOP_2310A,   // Referring Provider (mapped to same slot)
  'P3': LOOP.LOOP_2310A,   // Primary Care Provider
};

// ─────────────────────────────────────────────────────────────────────────────
// Main parser class
// ─────────────────────────────────────────────────────────────────────────────
class EDIParser {
  /**
   * @param {string} componentSeparator - Detected from ISA[104], e.g. ':'
   */
  constructor(componentSeparator) {
    this.componentSep = componentSeparator;
    this.loopHandler  = new LoopHandler();

    // ── Output skeleton ──────────────────────────────────────────────────────
    this.result = {
      interchange: {},
      group:       {},
      transaction: {
        transactionCode: '',
        controlNumber:   '',
        implementationGuide: '',
        header:          {},
        submitter:       { contact: {} },
        receiver:        {},
        billingProviders: [],   // populated from loopHandler at the end
      },
      _meta: {
        parsedAt:   new Date().toISOString(),
        warnings:   [],
        segmentCount: 0,
      },
    };

    // ── Mutable state ────────────────────────────────────────────────────────
    this.currentLoop        = LOOP.ENVELOPE;
    this.currentClaim       = null;   // active CLM node
    this.currentServiceLine = null;   // active LX/SV2 node
    this.currentHLEntry     = null;   // last processHL() return value
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Main entry point. Processes all tokenised segments and returns the
   * fully populated output object.
   *
   * @param {string[][]} segments - Output of tokenizer.tokenize()
   * @returns {object}
   */
  parse(segments) {
    this.result._meta.segmentCount = segments.length;

    for (const segment of segments) {
      try {
        this._dispatch(segment);
      } catch (err) {
        this._warn(
          `Unhandled error on segment [${getElement(segment, 0)}]: ${err.message}`,
          segment
        );
      }
    }

    // Attach the completed HL hierarchy to the result
    this.result.transaction.billingProviders = this.loopHandler.getHierarchy();

    return this.result;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Segment Dispatcher
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Routes each segment to the appropriate handler based on its segment ID
   * (element 0).  Unknown segment IDs produce a debug warning but never throw.
   *
   * @param {string[]} seg - One tokenised segment
   */
  _dispatch(seg) {
    const id = getElement(seg, 0);

    switch (id) {
      // ── Envelope ──────────────────────────────────────────────────────────
      case 'ISA':  return this._handleISA(seg);
      case 'GS':   return this._handleGS(seg);
      case 'ST':   return this._handleST(seg);
      case 'SE':   return this._handleSE(seg);
      case 'GE':   return this._handleGE(seg);
      case 'IEA':  return this._handleIEA(seg);

      // ── Transaction Header ────────────────────────────────────────────────
      case 'BHT':  return this._handleBHT(seg);

      // ── Universal: Entity Name ────────────────────────────────────────────
      case 'NM1':  return this._handleNM1(seg);

      // ── Universal: Contact / Reference / Address ──────────────────────────
      case 'PER':  return this._handlePER(seg);
      case 'N3':   return this._handleN3(seg);
      case 'N4':   return this._handleN4(seg);
      case 'REF':  return this._handleREF(seg);
      case 'DMG':  return this._handleDMG(seg);

      // ── Hierarchical Level ────────────────────────────────────────────────
      case 'HL':   return this._handleHL(seg);

      // ── Provider Supplemental ─────────────────────────────────────────────
      case 'PRV':  return this._handlePRV(seg);

      // ── Subscriber / Payer ────────────────────────────────────────────────
      case 'SBR':  return this._handleSBR(seg);

      // ── Claim (Loop 2300) ─────────────────────────────────────────────────
      case 'CLM':  return this._handleCLM(seg);
      case 'DTP':  return this._handleDTP(seg);
      case 'CL1':  return this._handleCL1(seg);     // 837I institutional codes
      case 'HI':   return this._handleHI(seg);      // Diagnosis codes
      case 'NTE':  return this._handleNTE(seg);     // Notes
      case 'PWK':  return this._handlePWK(seg);     // Paperwork / attachments

      // ── Service Line (Loop 2400) ──────────────────────────────────────────
      case 'LX':   return this._handleLX(seg);
      case 'SV2':  return this._handleSV2(seg);     // 837I institutional
      case 'SV1':  return this._handleSV1(seg);     // 837P professional (extensibility)
      case 'AMT':  return this._handleAMT(seg);     // Monetary amounts

      // ── Silently skip known-but-unimplemented segments ────────────────────
      case 'CUR':  // Currency
      case 'K3':   // File information
      case 'CR1':  // Ambulance certification
      case 'CR2':  // Spinal manipulation
      case 'CRC':  // Conditions indicator
      case 'HCP':  // Claim pricing / repricing
      case 'SBR':  // (handled above — guard for duplicate)
        return;

      default:
        this._warn(`Segment "${id}" has no handler — skipped`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENVELOPE SEGMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  _handleISA(seg) {
    // ISA has 16 fixed-width data elements.  Positions are definitive per spec.
    this.result.interchange = {
      authorizationQualifier:  getElement(seg,  1),
      authorizationInfo:       getElement(seg,  2).trim(),
      securityQualifier:       getElement(seg,  3),
      securityInfo:            getElement(seg,  4).trim(),
      senderIdQualifier:       getElement(seg,  5),
      senderId:                getElement(seg,  6).trim(),
      receiverIdQualifier:     getElement(seg,  7),
      receiverId:              getElement(seg,  8).trim(),
      date:                    getElement(seg,  9),
      time:                    getElement(seg, 10),
      repetitionSeparator:     getElement(seg, 11),
      version:                 getElement(seg, 12),
      controlNumber:           getElement(seg, 13),
      acknowledgmentRequested: getElement(seg, 14) === '1',
      usageIndicator:          getElement(seg, 15) === 'P' ? 'Production' : 'Test',
    };
  }

  _handleGS(seg) {
    this.result.group = {
      functionalIdentifierCode: getElement(seg, 1), // 'HC' for health care claims
      applicationSenderId:      getElement(seg, 2).trim(),
      applicationReceiverId:    getElement(seg, 3).trim(),
      date:                     getElement(seg, 4),
      time:                     getElement(seg, 5),
      controlNumber:            getElement(seg, 6),
      responsibleAgencyCode:    getElement(seg, 7),
      version:                  getElement(seg, 8),
    };
  }

  _handleST(seg) {
    this.result.transaction.transactionCode      = getElement(seg, 1); // '837'
    this.result.transaction.controlNumber        = getElement(seg, 2);
    this.result.transaction.implementationGuide  = getElement(seg, 3); // '005010X223A2'
  }

  _handleBHT(seg) {
    // BHT: Beginning of Hierarchical Transaction — marks the start of the
    //      business payload after the ISA/GS/ST envelope.
    // BHT*0019*00*<OriginatorId>*<Date>*<Time>*<TypeCode>
    this.result.transaction.header = {
      hierarchicalStructureCode:  getElement(seg, 1), // 0019 = information source + subscriber + dependent
      transactionSetPurposeCode:  getElement(seg, 2), // 00=original, 18=reissue
      originatorApplicationId:    getElement(seg, 3),
      transactionDate:            getElement(seg, 4),
      transactionTime:            getElement(seg, 5),
      claimOrEncounterType:       getElement(seg, 6), // CH=chargeable, RP=reporting
    };
  }

  _handleSE(seg) {
    this.result.transaction.trailingSegmentCount    = parseInt(getElement(seg, 1), 10) || 0;
    this.result.transaction.trailingControlNumber   = getElement(seg, 2);
  }

  _handleGE(seg) {
    this.result.group.transactionSetCount = parseInt(getElement(seg, 1), 10) || 0;
    this.result.group.trailingControlNumber = getElement(seg, 2);
  }

  _handleIEA(seg) {
    this.result.interchange.functionalGroupCount   = parseInt(getElement(seg, 1), 10) || 0;
    this.result.interchange.trailingControlNumber  = getElement(seg, 2);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HIERARCHICAL LEVEL — THE CORE LOOP TRANSITION
  // ═══════════════════════════════════════════════════════════════════════════

  _handleHL(seg) {
    // Any open service line is implicitly closed when a new HL appears
    this.currentServiceLine = null;
    // Claims carry over within the same HL block; reset when the HL level changes
    // to prevent accidental cross-contamination between subscribers
    const levelCode = getElement(seg, 3);
    if (levelCode === '20' || levelCode === '22') {
      this.currentClaim = null;
    }

    // Delegate to LoopHandler to build the tree node and resolve parent links
    this.currentHLEntry = this.loopHandler.processHL(seg);

    // Advance the state machine to the matching loop
    switch (levelCode) {
      case '20': this.currentLoop = LOOP.LOOP_2000A; break;
      case '22': this.currentLoop = LOOP.LOOP_2000B; break;
      case '23': this.currentLoop = LOOP.LOOP_2000C; break;
      default:
        this._warn(`Unknown HL level code: "${levelCode}"`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NM1 — ENTITY NAME  (most critical routing segment)
  // ═══════════════════════════════════════════════════════════════════════════

  _handleNM1(seg) {
    const qualifier    = getElement(seg, 1); // NM101 — entity type qualifier
    const entityType   = getElement(seg, 2); // '1'=person, '2'=non-person/org
    const lastName     = getElement(seg, 3); // NM103 — last name OR org name
    const firstName    = getElement(seg, 4); // NM104
    const middleName   = getElement(seg, 5); // NM105
    const prefix       = getElement(seg, 6); // NM106
    const suffix       = getElement(seg, 7); // NM107
    const idQualifier  = getElement(seg, 8); // NM108 — XX=NPI, MI=MemberID, PI=PayerID, etc.
    const id           = getElement(seg, 9); // NM109 — the identifier value

    // Build a displayable full name
    const name = entityType === '1'
      ? [prefix, firstName, middleName, lastName, suffix].filter(Boolean).join(' ').trim()
      : lastName; // organisations store their name in NM103

    // Transition loop state based on entity qualifier
    if (NM1_QUALIFIER_TO_LOOP[qualifier]) {
      this.currentLoop = NM1_QUALIFIER_TO_LOOP[qualifier];
    }

    // Route data to the correct output location
    switch (qualifier) {

      // ── 1000A: Submitter ────────────────────────────────────────────────
      case '41':
        Object.assign(this.result.transaction.submitter, {
          entityType: entityType === '1' ? 'person' : 'organization',
          name, idQualifier, id,
        });
        break;

      // ── 1000B: Receiver ─────────────────────────────────────────────────
      case '40':
        Object.assign(this.result.transaction.receiver, {
          entityType: entityType === '1' ? 'person' : 'organization',
          name, idQualifier, id,
        });
        break;

      // ── 2010AA: Billing Provider ─────────────────────────────────────────
      case '85':
        if (this.loopHandler.current.billingProvider) {
          Object.assign(this.loopHandler.current.billingProvider, {
            name,
            npi: idQualifier === 'XX' ? id : '',
            idQualifier, id,
          });
        }
        break;

      // ── 2010AB: Pay-to Provider ──────────────────────────────────────────
      case '87':
        if (this.loopHandler.current.billingProvider) {
          this.loopHandler.current.billingProvider.payToProvider = {
            name, idQualifier, id,
          };
        }
        break;

      // ── 2010BA: Subscriber (Insured) ─────────────────────────────────────
      case 'IL':
        if (this.loopHandler.current.subscriber) {
          Object.assign(this.loopHandler.current.subscriber, {
            name,
            memberId: id,
            idQualifier,
          });
        }
        break;

      // ── 2010BB: Payer ────────────────────────────────────────────────────
      case 'PR':
        if (this.loopHandler.current.subscriber) {
          this.loopHandler.current.subscriber.payer = {
            name, idQualifier, id,
          };
        }
        break;

      // ── 2010CA: Patient (Dependent) ──────────────────────────────────────
      case 'QC':
        if (this.loopHandler.current.patient) {
          Object.assign(this.loopHandler.current.patient, {
            name, memberId: id, idQualifier,
          });
        }
        break;

      // ── 2310A: Attending Physician ───────────────────────────────────────
      case '71':
        this._setClaimProvider('attending', { name, npi: id, idQualifier });
        break;

      // ── 2310B: Operating Physician ───────────────────────────────────────
      case '72':
        this._setClaimProvider('operating', { name, npi: id, idQualifier });
        break;

      // ── 2310C: Service Facility ──────────────────────────────────────────
      case '77':
        this._setClaimProvider('serviceFacility', { name, idQualifier, id });
        break;

      // ── Referring / Other providers ──────────────────────────────────────
      case 'DN':
        this._setClaimProvider('referring', { name, npi: id, idQualifier });
        break;

      default:
        this._warn(`NM1 qualifier "${qualifier}" is not mapped — skipped`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PER — Contact Information (mainly Submitter, Loop 1000A)
  // ═══════════════════════════════════════════════════════════════════════════

  _handlePER(seg) {
    // PER*IC*<Name>*<ComType1>*<ComNumber1>*<ComType2>*<ComNumber2>...
    // Communication type codes: TE=telephone, FX=fax, EM=email, EX=extension
    const contact = {
      contactFunctionCode: getElement(seg, 1), // IC=Information Contact
      name:                getElement(seg, 2),
      communicationTypes:  [],
    };

    // Collect all communication number pairs (up to 3 per spec)
    for (let i = 3; i < seg.length - 1; i += 2) {
      const type   = getElement(seg, i);
      const number = getElement(seg, i + 1);
      if (type && number) {
        contact.communicationTypes.push({ type, number });
      }
    }

    if (this.currentLoop === LOOP.LOOP_1000A) {
      this.result.transaction.submitter.contact = contact;
    }
    // PER can also appear in 2310 loops (physician contacts) — extend here if needed
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRV — Provider Taxonomy / Specialty
  // ═══════════════════════════════════════════════════════════════════════════

  _handlePRV(seg) {
    // PRV*BI*PXC*<TaxonomyCode>
    // PRV01: provider code (BI=Billing, PE=Performing, RF=Referring)
    // PRV02: reference ID qualifier (PXC=taxonomy)
    // PRV03: reference ID (taxonomy code itself)
    const providerCode = getElement(seg, 1);
    const refQualifier = getElement(seg, 2);
    const refId        = getElement(seg, 3);

    const taxonomyCode = refQualifier === 'PXC' ? refId : '';

    if (
      this.currentLoop === LOOP.LOOP_2000A ||
      this.currentLoop === LOOP.LOOP_2010AA
    ) {
      if (this.loopHandler.current.billingProvider) {
        this.loopHandler.current.billingProvider.taxonomy    = taxonomyCode;
        this.loopHandler.current.billingProvider.providerCode = providerCode;
      }
    }

    // In 2310 loops PRV qualifies a specific provider role — extend here if needed
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // N3 / N4 — Address Lines
  // ═══════════════════════════════════════════════════════════════════════════

  _handleN3(seg) {
    const addrData = {
      addressLine1: getElement(seg, 1),
      addressLine2: getElement(seg, 2) || undefined,
    };
    if (!addrData.addressLine2) delete addrData.addressLine2;

    this._applyToAddressTarget(addrData);
  }

  _handleN4(seg) {
    const addrData = {
      city:       getElement(seg, 1),
      state:      getElement(seg, 2),
      postalCode: getElement(seg, 3),
      country:    getElement(seg, 4) || undefined,
    };
    if (!addrData.country) delete addrData.country;

    this._applyToAddressTarget(addrData);
  }

  /**
   * Routes N3/N4 address data to the correct node based on current loop state.
   * Merges into the node's `.address` object so N3 and N4 can be called in
   * either order without overwriting each other.
   */
  _applyToAddressTarget(data) {
    const target = this._resolveAddressTarget();
    if (!target) {
      this._warn(`Address segment (N3/N4) has no target in loop: ${this.currentLoop}`);
      return;
    }
    target.address = Object.assign(target.address || {}, data);
  }

  _resolveAddressTarget() {
    switch (this.currentLoop) {
      case LOOP.LOOP_2010AA: return this.loopHandler.current.billingProvider;
      case LOOP.LOOP_2010AB: return this.loopHandler.current.billingProvider?.payToProvider;
      case LOOP.LOOP_2010BA: return this.loopHandler.current.subscriber;
      case LOOP.LOOP_2010BB: return null; // payer addresses exist but rarely required
      case LOOP.LOOP_2010CA: return this.loopHandler.current.patient;
      case LOOP.LOOP_2310A:
      case LOOP.LOOP_2310B:
      case LOOP.LOOP_2310C:  return null; // provider addresses are uncommon in 837I
      default:               return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REF — Reference Identification
  // ═══════════════════════════════════════════════════════════════════════════

  _handleREF(seg) {
    // REF*<Qualifier>*<Value>*<Description>
    // Common qualifiers: EI=Employer ID (Tax ID), SY=SSN, 1W=MemberID,
    //                    F8=Original Ref Num, EA=Medical Record, G1=Prior Auth
    const qualifier   = getElement(seg, 1);
    const value       = getElement(seg, 2);
    const description = getElement(seg, 3);

    switch (this.currentLoop) {

      case LOOP.LOOP_2010AA:  // Billing Provider REF
        if (qualifier === 'EI') {
          // Federal Tax ID is critical — promote to a first-class field
          if (this.loopHandler.current.billingProvider) {
            this.loopHandler.current.billingProvider.taxId = value;
          }
        } else {
          this._addRefToBillingProvider(qualifier, value, description);
        }
        break;

      case LOOP.LOOP_2010BA:  // Subscriber REF
        if (this.loopHandler.current.subscriber) {
          this.loopHandler.current.subscriber.memberInfo =
            this.loopHandler.current.subscriber.memberInfo || {};
          this.loopHandler.current.subscriber.memberInfo[qualifier] = value;
        }
        break;

      case LOOP.LOOP_2010CA:  // Patient REF
        if (this.loopHandler.current.patient) {
          this.loopHandler.current.patient.memberInfo =
            this.loopHandler.current.patient.memberInfo || {};
          this.loopHandler.current.patient.memberInfo[qualifier] = value;
        }
        break;

      case LOOP.LOOP_2300:    // Claim REF (original claim #, prior auth, etc.)
        if (this.currentClaim) {
          this.currentClaim.references[qualifier] = value;
        }
        break;

      case LOOP.LOOP_2310A:
      case LOOP.LOOP_2310B:
      case LOOP.LOOP_2310C:   // Physician / facility REF (state lic, UPIN, etc.)
        if (this.currentClaim) {
          this.currentClaim.providerReferences =
            this.currentClaim.providerReferences || {};
          this.currentClaim.providerReferences[qualifier] = value;
        }
        break;

      case LOOP.LOOP_2400:    // Service line REF
        if (this.currentServiceLine) {
          this.currentServiceLine.references[qualifier] = value;
        }
        break;
    }
  }

  _addRefToBillingProvider(qualifier, value, description) {
    if (!this.loopHandler.current.billingProvider) return;
    const bp = this.loopHandler.current.billingProvider;
    bp.references = bp.references || {};
    bp.references[qualifier] = value;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DMG — Demographics (Date of Birth, Gender)
  // ═══════════════════════════════════════════════════════════════════════════

  _handleDMG(seg) {
    // DMG*D8*<DOB_CCYYMMDD>*<GenderCode>
    const genderCode = getElement(seg, 3);
    const demographics = {
      dateTimePeriodFormatQualifier: getElement(seg, 1), // D8 = CCYYMMDD
      dateOfBirth: getElement(seg, 2),
      gender: genderCode === 'M' ? 'Male'
            : genderCode === 'F' ? 'Female'
            : genderCode || 'Unknown',
    };

    switch (this.currentLoop) {
      case LOOP.LOOP_2010BA:
        if (this.loopHandler.current.subscriber) {
          this.loopHandler.current.subscriber.demographics = demographics;
        }
        break;
      case LOOP.LOOP_2010CA:
        if (this.loopHandler.current.patient) {
          this.loopHandler.current.patient.demographics = demographics;
        }
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SBR — Subscriber Information
  // ═══════════════════════════════════════════════════════════════════════════

  _handleSBR(seg) {
    // SBR*<PayerResponsibility>*<IndividualRelationship>*<GroupNumber>*
    //     <GroupName>***<InsuranceType>***<ClaimFilingIndicator>
    const memberInfo = {
      payerResponsibilitySequenceCode: getElement(seg, 1), // P=primary, S=secondary
      individualRelationshipCode:      getElement(seg, 2), // 18=self, spouse, child…
      groupNumber:                     getElement(seg, 3),
      groupName:                       getElement(seg, 4),
      insuranceTypeCode:               getElement(seg, 7),
      claimFilingIndicatorCode:        getElement(seg, 9), // CI=commercial, MC=Medicare…
    };

    if (this.loopHandler.current.subscriber) {
      this.loopHandler.current.subscriber.memberInfo = Object.assign(
        this.loopHandler.current.subscriber.memberInfo || {},
        memberInfo
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLM — Claim Information  (marks entry to Loop 2300)
  // ═══════════════════════════════════════════════════════════════════════════

  _handleCLM(seg) {
    // CLM*<ClaimId>*<TotalCharge>**<HealthCareServiceLocationInfo:composite>*
    //     <ProviderAssignment>*<BenefitsAssignment>*<ReleaseInfo>*<PatientSignature>
    //
    // CLM05 is a COMPOSITE: FacilityType:FacilityCostCode:ClaimFrequencyCode
    const clm05Parts = splitComponents(getElement(seg, 5), this.componentSep);

    this.currentClaim = {
      claimId:                    getElement(seg, 1),
      totalCharge:                parseFloat(getElement(seg, 2)) || 0,
      // CLM04 is not used in 005010X223A2
      facilityTypeCode:           clm05Parts[0] || '',
      facilityCostCode:           clm05Parts[1] || '',
      claimFrequencyCode:         clm05Parts[2] || '',
      providerAcceptsAssignment:  getElement(seg, 6) === 'Y',
      benefitsAssignmentCode:     getElement(seg, 7), // Y=yes, N=no
      releaseInformationCode:     getElement(seg, 8), // I=informed consent, Y=yes
      patientSignatureSourceCode: getElement(seg, 9),
      // Populated by subsequent segments
      diagnosisCodes:    [],
      serviceLines:      [],
      providers:         {},
      references:        {},
      notes:             [],
      dates:             {},
      institutionalCodes:{},
      attachments:       [],
    };

    this.currentServiceLine = null;
    this.currentLoop        = LOOP.LOOP_2300;

    // Attach to subscriber or patient context
    const target = this.loopHandler.getClaimTarget();
    if (target) {
      target.claims.push(this.currentClaim);
    } else {
      this._warn(`CLM "${this.currentClaim.claimId}" has no subscriber/patient target`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DTP — Date / Time Period
  // ═══════════════════════════════════════════════════════════════════════════

  _handleDTP(seg) {
    // DTP*<Qualifier>*<FormatCode>*<DateOrRange>
    // Qualifier codes: 434=service period, 435=admission, 096=discharge, 472=service date
    const qualifier  = getElement(seg, 1);
    const format     = getElement(seg, 2); // D8=CCYYMMDD, RD8=CCYYMMDD-CCYYMMDD
    const value      = getElement(seg, 3);

    const dateEntry = { qualifier, format, value };

    if (this.currentLoop === LOOP.LOOP_2400 && this.currentServiceLine) {
      this.currentServiceLine.dates = this.currentServiceLine.dates || {};
      this.currentServiceLine.dates[qualifier] = dateEntry;
    } else if (this.currentClaim) {
      this.currentClaim.dates[qualifier] = dateEntry;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CL1 — Institutional Claim Codes  (837I only, Loop 2300)
  // ═══════════════════════════════════════════════════════════════════════════

  _handleCL1(seg) {
    // CL1*<AdmissionType>*<AdmissionSource>*<PatientStatus>
    // This segment only appears in 837I (institutional) transactions.
    if (this.currentClaim) {
      this.currentClaim.institutionalCodes = {
        admissionTypeCode:   getElement(seg, 1), // 1=Emergency, 2=Urgent, 3=Elective…
        admissionSourceCode: getElement(seg, 2), // 1=physician referral, 7=ED…
        patientStatusCode:   getElement(seg, 3), // 01=discharged home, 20=expired…
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HI — Health Care Diagnosis Codes
  // ═══════════════════════════════════════════════════════════════════════════

  _handleHI(seg) {
    if (!this.currentClaim) return;

    // Each element (HI01–HI12) is a COMPOSITE:  QualifierCode:DiagnosisCode
    // ICD-10 qualifiers: ABK=principal diagnosis, ABF=admitting, ABJ=reason for visit
    // ICD-9  qualifiers: BK=principal, BF=other
    for (let i = 1; i < seg.length; i++) {
      const raw  = getElement(seg, i);
      if (!raw) continue;

      const parts         = splitComponents(raw, this.componentSep);
      const qualifier     = parts[0] || '';
      const diagnosisCode = parts[1] || '';
      const presentOnAdmission = parts[2] || ''; // Y/N/U/W (POA indicator)

      if (!diagnosisCode) continue;

      this.currentClaim.diagnosisCodes.push({
        qualifier,
        code:            diagnosisCode,
        isPrincipal:     i === 1 && (qualifier === 'ABK' || qualifier === 'BK'),
        presentOnAdmission: presentOnAdmission || undefined,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NTE — Notes
  // ═══════════════════════════════════════════════════════════════════════════

  _handleNTE(seg) {
    const note = {
      referenceCode: getElement(seg, 1), // ADD=additional info, DCP=goals
      description:   getElement(seg, 2),
    };

    if (this.currentClaim) {
      this.currentClaim.notes.push(note);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PWK — Paperwork / Claim Attachments
  // ═══════════════════════════════════════════════════════════════════════════

  _handlePWK(seg) {
    if (!this.currentClaim) return;

    this.currentClaim.attachments.push({
      attachmentReportTypeCode:          getElement(seg, 1), // 03=report, 04=x-ray
      attachmentTransmissionCode:        getElement(seg, 2), // AA=available on request
      identificationCodeQualifier:       getElement(seg, 6),
      attachmentControlNumber:           getElement(seg, 7),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LX — Service Line Counter  (marks entry to Loop 2400)
  // ═══════════════════════════════════════════════════════════════════════════

  _handleLX(seg) {
    if (!this.currentClaim) {
      this._warn('LX segment encountered outside a claim (CLM) context');
      return;
    }

    this.currentServiceLine = {
      lineNumber:  getElement(seg, 1),
      service:     {},
      dates:       {},
      references:  {},
      amounts:     {},
    };

    this.currentClaim.serviceLines.push(this.currentServiceLine);
    this.currentLoop = LOOP.LOOP_2400;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SV2 — Institutional Service Line  (837I — Loop 2400)
  // ═══════════════════════════════════════════════════════════════════════════

  _handleSV2(seg) {
    if (!this.currentServiceLine) {
      this._warn('SV2 encountered without an active service line (LX missing?)');
      return;
    }

    // SV2*<RevenueCode>*<CompositeProcedureId>*<Charge>*<UOM>*<Units>***<YesNo>
    //
    // SV202 is a COMPOSITE:  qualifier:procedureCode:modifier:modifier:modifier:modifier
    const sv202Parts = splitComponents(getElement(seg, 2), this.componentSep);

    this.currentServiceLine.service = {
      revenueCode:        getElement(seg, 1),          // e.g. '0300' = lab
      procedureQualifier: sv202Parts[0] || '',         // 'HC' = HCPCS/CPT
      procedureCode:      sv202Parts[1] || '',         // e.g. '99281'
      modifiers:          sv202Parts.slice(2).filter(Boolean), // e.g. ['25']
      lineItemCharge:     parseFloat(getElement(seg, 3)) || 0,
      unitOrBasisOfMeasurementCode: getElement(seg, 4),  // 'UN' = unit
      serviceUnitCount:   parseFloat(getElement(seg, 5)) || 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SV1 — Professional Service Line  (837P — included for extensibility)
  // ═══════════════════════════════════════════════════════════════════════════

  _handleSV1(seg) {
    if (!this.currentServiceLine) {
      this._warn('SV1 encountered without an active service line (LX missing?)');
      return;
    }

    // SV1*<CompositeProcedureId>*<Charge>*<UOM>*<Units>**<DiagnosisPointers>
    const sv101Parts = splitComponents(getElement(seg, 1), this.componentSep);

    this.currentServiceLine.service = {
      procedureQualifier: sv101Parts[0] || '', // 'HC' = HCPCS/CPT, 'IV' = IVB
      procedureCode:      sv101Parts[1] || '',
      modifiers:          sv101Parts.slice(2).filter(Boolean),
      lineItemCharge:     parseFloat(getElement(seg, 2)) || 0,
      unitOrBasisOfMeasurementCode: getElement(seg, 3),
      serviceUnitCount:   parseFloat(getElement(seg, 4)) || 0,
      // SV107 is a composite of diagnosis code pointers (references HI positions)
      diagnosisCodePointers: splitComponents(getElement(seg, 7), this.componentSep)
                               .filter(Boolean),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AMT — Monetary Amounts
  // ═══════════════════════════════════════════════════════════════════════════

  _handleAMT(seg) {
    // AMT*<AmountQualifier>*<Amount>
    const qualifier = getElement(seg, 1);
    const amount    = parseFloat(getElement(seg, 2)) || 0;

    if (this.currentServiceLine) {
      this.currentServiceLine.amounts[qualifier] = amount;
    } else if (this.currentClaim) {
      this.currentClaim.amounts = this.currentClaim.amounts || {};
      this.currentClaim.amounts[qualifier] = amount;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Attaches a provider object to the current claim's providers map.
   * @param {string} role - 'attending' | 'operating' | 'serviceFacility' | etc.
   * @param {object} data - Provider details
   */
  _setClaimProvider(role, data) {
    if (!this.currentClaim) {
      this._warn(`Provider segment (role: ${role}) has no active claim`);
      return;
    }
    this.currentClaim.providers[role] = data;
  }

  /**
   * Records a non-fatal warning in _meta.warnings.
   * @param {string}    message - Human-readable description
   * @param {string[]}  [segment] - The offending segment (optional, for context)
   */
  _warn(message, segment) {
    const entry = { message };
    if (segment) entry.segment = segment.join('|');
    this.result._meta.warnings.push(entry);
  }
}

module.exports = { EDIParser, LOOP, NM1_QUALIFIER_TO_LOOP };
