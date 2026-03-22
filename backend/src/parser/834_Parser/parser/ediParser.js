'use strict';

const { detectSeparators } = require('../utils/separatorDetector');
const { tokenize }         = require('./tokenizer');
const lh                   = require('./loopHandler');

/**
 * ediParser.js – Core 834 parser
 * ================================
 * Implements a state-machine that walks the segment list and assigns each
 * segment to the correct loop context.
 *
 * Loop structure tracked:
 *   INTERCHANGE → GROUP → TRANSACTION
 *     ├── 1000A  (Sponsor)
 *     ├── 1000B  (Payer)
 *     └── 2000   (Member – one per INS segment)
 *           ├── 2100  (Member name / demographics)
 *           └── 2300  (Health coverage)
 */

// Relationship codes that indicate a subscriber (self)
const SUBSCRIBER_RELATIONSHIP_CODES = new Set(['18']);

function createMember() {
  return {
    ins: null,
    memberId: null,
    name: null,
    gender: null,
    dob: null,
    address: {},
    refs: [],
    contacts: [],
    coverages: [],
    dependents: [],
  };
}

function parse834(rawEdi) {
  // ── 1. Detect separators ──────────────────────────────────────────────────
  const separators = detectSeparators(rawEdi);

  // ── 2. Tokenize ───────────────────────────────────────────────────────────
  const segments = tokenize(rawEdi, separators);

  // ── 3. Build result scaffold ──────────────────────────────────────────────
  const result = {
    interchange:  {},
    group:        {},
    transaction: {
      header:      {},
      sponsor:     null,
      payer:       null,
      subscribers: [],
    },
    _meta: {
      separators,
      warnings: [],
      segmentCount: segments.length,
    },
  };

  const ctx = { warnings: result._meta.warnings, separators };

  // ── 4. State ──────────────────────────────────────────────────────────────
  let loop              = 'INTERCHANGE';   // current loop context
  let currentSubscriber = null;            // the active 2000-loop subscriber object
  let currentMember     = null;            // subscriber or dependent being built
  let currentCoverage   = null;            // active HD coverage block
  let n1Context         = null;            // last N1 qualifier (P5 or IN)
  let hasTransactionStart = false;

  // ── 5. Walk segments ──────────────────────────────────────────────────────
  for (const elements of segments) {
    const segId = (elements[0] || '').trim().toUpperCase();
    if (!segId) continue;

    lh.validateSegment(elements, ctx);

    switch (segId) {

      // ── Interchange ───────────────────────────────────────────────────────
      case 'ISA':
        result.interchange = lh.handleISA(elements);
        loop = 'INTERCHANGE';
        break;

      case 'IEA':
        result.interchange.controlCount = elements[1] || '';
        result.interchange.trailingControlNumber = elements[2] || '';
        loop = 'INTERCHANGE';
        break;

      // ── Group ─────────────────────────────────────────────────────────────
      case 'GS':
        result.group = lh.handleGS(elements);
        loop = 'GROUP';
        break;

      case 'GE':
        result.group.includedSets = elements[1] || '';
        result.group.trailingControlNumber = elements[2] || '';
        break;

      // ── Transaction ───────────────────────────────────────────────────────
      case 'ST':
        result.transaction.header = lh.handleST(elements);
        hasTransactionStart = true;
        loop = 'TRANSACTION';
        break;

      case 'SE':
        result.transaction.header.segmentCount     = elements[1] || '';
        result.transaction.header.trailingControlNumber = elements[2] || '';
        // Flush any open member
        _flushMember(currentMember, currentSubscriber, currentCoverage, result, ctx);
        currentMember = currentSubscriber = currentCoverage = null;
        break;

      case 'BGN':
        result.transaction.header.beginningSegment = {
          transactionSetPurposeCode: elements[1] || '',
          referenceId:               elements[2] || '',
          date:                      elements[3] || '',
          time:                      elements[4] || '',
          timeZoneCode:              elements[5] || '',
          actionCode:                elements[8] || '',
        };
        break;

      // ── 1000A / 1000B – Sponsor & Payer ──────────────────────────────────
      case 'N1': {
        const n1 = lh.handleN1(elements);
        n1Context = n1.entityIdCode;
        if (n1Context === 'P5') {
          result.transaction.sponsor = n1;
          loop = '1000A';
        } else if (n1Context === 'IN') {
          result.transaction.payer = n1;
          loop = '1000B';
        } else {
          // Could be a member-level N1 – attach to current member if active
          if (currentMember) {
            currentMember.organization = n1;
          }
        }
        break;
      }

      // ── 2000 – Member ─────────────────────────────────────────────────────
      case 'INS': {
        // Save prior member before starting new one
        _flushMember(currentMember, currentSubscriber, currentCoverage, result, ctx);
        currentCoverage = null;

        const ins = lh.handleINS(elements);
        const newMember = createMember();
        newMember.ins = ins;
        newMember.isSubscriber = SUBSCRIBER_RELATIONSHIP_CODES.has(ins.relationshipCode);

        if (newMember.isSubscriber) {
          currentSubscriber = newMember;
        }
        currentMember = newMember;
        loop = '2000';
        break;
      }

      // ── 2100 – Member Name / Demographics ────────────────────────────────
      case 'NM1':
        if (currentMember) {
          const nm1 = lh.handleNM1(elements);
          currentMember.name = {
            last:   nm1.lastName,
            first:  nm1.firstName,
            middle: nm1.middleName,
            prefix: nm1.prefix,
            suffix: nm1.suffix,
            full:   [nm1.firstName, nm1.middleName, nm1.lastName]
                      .filter(Boolean).join(' '),
          };
          if (nm1.memberId) {
            currentMember.memberId = currentMember.memberId || nm1.memberId;
          }
          currentMember._nm1 = nm1;
        } else {
          ctx.warnings.push('NM1 encountered outside of member context – skipped.');
        }
        break;

      case 'DMG':
        if (currentMember) {
          const dmg = lh.handleDMG(elements);
          currentMember.dob    = dmg.dobISO || dmg.dob;
          currentMember.gender = dmg.genderLabel;
        }
        break;

      case 'N3':
        if (currentMember) {
          const n3 = lh.handleN3(elements);
          currentMember.address = { ...currentMember.address, ...n3 };
        }
        break;

      case 'N4':
        if (currentMember) {
          const n4 = lh.handleN4(elements);
          currentMember.address = { ...currentMember.address, ...n4 };
        }
        break;

      case 'REF':
        if (currentMember) {
          currentMember.refs.push(lh.handleREF(elements));
          // Promote member id ref if qualifier is relevant
          const ref = currentMember.refs[currentMember.refs.length - 1];
          if (['1L', '17', '23', '3H', '49', 'D3', 'DX', 'F6', 'PD', 'ZZ'].includes(ref.qualifier)) {
            currentMember.memberId = currentMember.memberId || ref.value;
          }
        }
        break;

      case 'PER':
        if (currentMember) {
          currentMember.contacts.push(lh.handlePER(elements));
        }
        break;

      // ── 2300 – Health Coverage ────────────────────────────────────────────
      case 'HD': {
        const hd = lh.handleHD(elements);
        currentCoverage = {
          plan:              hd.planCoverage        || hd.insuranceLineCode,
          insuranceLineCode: hd.insuranceLineCode,
          coverageLevelCode: hd.coverageLevelCode,
          maintenanceTypeCode: hd.maintenanceTypeCode,
          dates:             {},
          refs:              [],
        };
        if (currentMember) {
          currentMember.coverages.push(currentCoverage);
        } else {
          ctx.warnings.push('HD segment encountered with no active member – skipped.');
        }
        break;
      }

      case 'DTP': {
        const dtp = lh.handleDTP(elements);
        const dateEntry = {
          qualifier:    dtp.qualifier,
          label:        dtp.qualifierLabel,
          date:         dtp.dateISO || dtp.date,
        };
        if (currentCoverage) {
          currentCoverage.dates[dtp.qualifierLabel || dtp.qualifier] = dateEntry.date;
        } else if (currentMember) {
          currentMember.eligibilityDates = currentMember.eligibilityDates || {};
          currentMember.eligibilityDates[dtp.qualifierLabel || dtp.qualifier] = dateEntry.date;
        }
        break;
      }

      default:
        // Unknown/unsupported segment – silently skip (extend here for 837/835)
        break;
    }
  }

  // Ensure last open member is flushed if SE wasn't reached
  _flushMember(currentMember, currentSubscriber, currentCoverage, result, ctx);

  return result;
}

// ─── Internal flush helper ────────────────────────────────────────────────────

/**
 * _flushMember
 * Pushes a completed member into the correct collection:
 *   - subscribers → result.transaction.subscribers
 *   - dependents  → currentSubscriber.dependents
 */
function _flushMember(member, currentSubscriber, _coverage, result, ctx) {
  if (!member) return;

  const isSubscriber = member.isSubscriber;
  const out = _buildMemberOutput(member);

  if (isSubscriber) {
    result.transaction.subscribers.push(out);
  } else {
    if (currentSubscriber) {
      const subOut = result.transaction.subscribers[result.transaction.subscribers.length - 1];
      if (subOut) {
        subOut.dependents = subOut.dependents || [];
        out.relationship = member.ins ? member.ins.relationshipCode : '';
        subOut.dependents.push(out);
      }
    } else {
      ctx.warnings.push(
        `Dependent (${member.name ? member.name.full : 'unknown'}) has no preceding subscriber – orphaned.`
      );
      result.transaction.subscribers.push({ _orphanedDependent: true, ...out });
    }
  }
}

function _buildMemberOutput(member) {
  const out = {
    memberId:   member.memberId || null,
    name:       member.name    || null,
    gender:     member.gender  || null,
    dob:        member.dob     || null,
    address:    Object.keys(member.address).length ? member.address : null,
    coverages:  member.coverages.map(c => ({
      plan:              c.plan            || null,
      insuranceLineCode: c.insuranceLineCode || null,
      coverageLevelCode: c.coverageLevelCode || null,
      effectiveDate:     c.dates['Benefit Begin'] || null,
      endDate:           c.dates['Benefit End']   || null,
      dates:             c.dates,
    })),
    dependents: [],
  };

  if (member.refs && member.refs.length) out.refs = member.refs;
  if (member.contacts && member.contacts.length) out.contacts = member.contacts;
  if (member.eligibilityDates) out.eligibilityDates = member.eligibilityDates;
  if (member.ins) out._ins = member.ins;

  return out;
}

module.exports = { parse834 };
