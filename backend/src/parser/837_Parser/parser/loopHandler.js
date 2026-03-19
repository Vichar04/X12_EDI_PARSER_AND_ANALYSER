/**
 * loopHandler.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the HL (Hierarchical Level) tree that is the spine of every 837
 * transaction set.
 *
 * HOW HL SEGMENTS WORK:
 * ─────────────────────
 * Every HL segment introduces a new hierarchical node:
 *
 *   HL * <HL_ID> * <Parent_HL_ID> * <Level_Code> * <Has_Child>
 *
 *   HL_ID         Sequential integer assigned by the sender (1, 2, 3 …)
 *   Parent_HL_ID  HL_ID of the parent node; blank for top-level nodes
 *   Level_Code    Determines the business role of this node:
 *                   20 → Billing Provider
 *                   22 → Subscriber
 *                   23 → Dependent / Patient
 *   Has_Child     1 = child HL nodes follow; 0 = leaf node
 *
 * EXAMPLE DOCUMENT HIERARCHY:
 * ────────────────────────────
 *   HL*1**20*1         Billing Provider  (root, has children)
 *     HL*2*1*22*1      Subscriber A      (parent = HL 1, has children)
 *       [CLM segments → claim 1 under subscriber A]
 *       [CLM segments → claim 2 under subscriber A]
 *     HL*3*1*22*0      Subscriber B      (parent = HL 1, leaf)
 *       [CLM segments → claim 3 under subscriber B]
 *
 * RESULTING JSON:
 * ───────────────
 *   billingProviders: [
 *     {
 *       name: '...',
 *       subscribers: [
 *         { name: '...', claims: [claim1, claim2] },  // Subscriber A
 *         { name: '...', claims: [claim3] }            // Subscriber B
 *       ]
 *     }
 *   ]
 *
 * @module loopHandler
 */

'use strict';

// ── HL Level Code → semantic label ──────────────────────────────────────────
// Extensible: add 19 (Clearinghouse) or custom codes here without touching
// the rest of the parser.
const LEVEL_CODE_MAP = {
  '20': 'billingProvider',
  '22': 'subscriber',
  '23': 'patient',    // dependent billed separately from subscriber
};

class LoopHandler {
  constructor() {
    /**
     * Flat map of HL_ID (string) → { hlId, parentHlId, levelCode, levelType, hasChild, node }
     * Used for O(1) parent look-ups when wiring child nodes.
     * @type {Map<string, object>}
     */
    this.hlMap = new Map();

    /**
     * Ordered list of top-level billing provider nodes.
     * This becomes result.transaction.billingProviders.
     * @type {object[]}
     */
    this.billingProviders = [];

    /**
     * Rolling pointers to the most-recently activated node at each level.
     * These are updated every time a new HL segment is processed so that
     * subsequent segments (NM1, CLM, etc.) know where to attach their data.
     */
    this.current = {
      billingProvider: null,  // most recent level-20 node
      subscriber:      null,  // most recent level-22 node
      patient:         null,  // most recent level-23 node
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Processes one HL segment and wires the new node into the hierarchy.
   *
   * @param {string[]} segment - Tokenized HL segment, e.g. ['HL','2','1','22','1']
   * @returns {{ hlId, parentHlId, levelCode, levelType, hasChild, node }}
   */
  processHL(segment) {
    const hlId       = String(segment[1] || '').trim();
    const parentHlId = String(segment[2] || '').trim();
    const levelCode  = String(segment[3] || '').trim();
    const hasChild   = segment[4] === '1';

    const levelType = LEVEL_CODE_MAP[levelCode] || `unknown_${levelCode}`;

    // Build a typed, pre-structured node for this hierarchy level
    const node = this._buildNode(levelType);

    // Register in the flat map for parent resolution
    const entry = { hlId, parentHlId, levelCode, levelType, hasChild, node };
    this.hlMap.set(hlId, entry);

    // Wire the node into the hierarchy and update current pointers
    this._attachNode(entry);

    return entry;
  }

  /**
   * Returns the current claim-attachment target.
   * Claims (CLM segments) should be attached to the deepest active context:
   * a patient node if one is active, otherwise the subscriber.
   *
   * @returns {object|null}
   */
  getClaimTarget() {
    return this.current.patient || this.current.subscriber || null;
  }

  /**
   * Returns the fully built billing-provider hierarchy.
   * Called once at the end of parsing to populate result.transaction.billingProviders.
   *
   * @returns {object[]}
   */
  getHierarchy() {
    return this.billingProviders;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Attaches a newly created HL node to its correct position in the tree,
   * then updates the rolling current.* pointers.
   *
   * @param {object} entry - HL map entry ({ hlId, parentHlId, levelCode, ... })
   */
  _attachNode({ hlId, parentHlId, levelCode, node }) {
    switch (levelCode) {

      // ── Level 20: Billing Provider (always a root node) ──────────────────
      case '20':
        this.billingProviders.push(node);
        this.current.billingProvider = node;
        this.current.subscriber      = null; // reset children
        this.current.patient         = null;
        break;

      // ── Level 22: Subscriber ─────────────────────────────────────────────
      case '22': {
        // Find the parent billing-provider node via the map
        const parentEntry = this.hlMap.get(parentHlId);
        const bp = (parentEntry && parentEntry.levelCode === '20')
          ? parentEntry.node
          : this.current.billingProvider; // fallback to most-recent BP

        if (bp) {
          bp.subscribers.push(node);
        }

        this.current.subscriber = node;
        this.current.patient    = null; // reset patient under new subscriber
        // Keep current.billingProvider pointing to the owning BP
        if (parentEntry && parentEntry.levelCode === '20') {
          this.current.billingProvider = parentEntry.node;
        }
        break;
      }

      // ── Level 23: Patient / Dependent ────────────────────────────────────
      case '23': {
        // Find the parent subscriber node
        const parentEntry = this.hlMap.get(parentHlId);
        const sub = (parentEntry && parentEntry.levelCode === '22')
          ? parentEntry.node
          : this.current.subscriber; // fallback to most-recent subscriber

        if (sub) {
          sub.dependents.push(node);
        }

        this.current.patient = node;
        // Keep subscriber pointer aligned with parent
        if (parentEntry && parentEntry.levelCode === '22') {
          this.current.subscriber = parentEntry.node;
        }
        break;
      }

      // ── Unknown level code ────────────────────────────────────────────────
      default:
        // We record the node in hlMap but don't crash — forward-compatible
        console.warn(
          `[LoopHandler] Unrecognised HL level code "${levelCode}" for HL ID "${hlId}". ` +
          'Node recorded but not attached to hierarchy.'
        );
        break;
    }
  }

  /**
   * Creates a pre-structured empty node based on the HL level type.
   * Pre-defining the shape keeps downstream code readable and avoids
   * scattered property-existence checks.
   *
   * @param {string} levelType - 'billingProvider' | 'subscriber' | 'patient'
   * @returns {object}
   */
  _buildNode(levelType) {
    switch (levelType) {

      case 'billingProvider':
        return {
          _hlType:     'billingProvider',
          name:        '',           // from NM1*85
          npi:         '',           // from NM1*85 ID
          taxId:       '',           // from REF*EI
          taxonomy:    '',           // from PRV*BI*PXC
          providerCode:'',           // from PRV
          address:     {},           // from N3 + N4
          payToProvider: null,       // from NM1*87 (optional)
          subscribers: [],           // child level-22 nodes
        };

      case 'subscriber':
        return {
          _hlType:     'subscriber',
          name:        '',           // from NM1*IL
          memberId:    '',           // from NM1*IL ID
          memberInfo:  {},           // from SBR (payer responsibility, group#, etc.)
          address:     {},           // from N3 + N4
          demographics:{},           // from DMG
          payer:       {},           // from NM1*PR
          dependents:  [],           // child level-23 nodes
          claims:      [],           // 2300 CLM loops
        };

      case 'patient':
        return {
          _hlType:     'patient',
          name:        '',           // from NM1*QC
          memberId:    '',
          address:     {},
          demographics:{},
          claims:      [],           // 2300 CLM loops (when patient ≠ subscriber)
        };

      default:
        // Generic bucket for unknown level codes — keeps parsing alive
        return {
          _hlType:  levelType,
          _raw:     {},
          claims:   [],
        };
    }
  }
}

module.exports = { LoopHandler, LEVEL_CODE_MAP };
