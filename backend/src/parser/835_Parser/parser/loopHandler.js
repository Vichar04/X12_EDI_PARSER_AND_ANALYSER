'use strict';

/**
 * LoopHandler
 * -----------
 * Tracks which loop is currently "open" and provides helper methods
 * to open / close loops and attach data to the right parent.
 *
 * Loop hierarchy for 835:
 *
 *   TRANSACTION
 *     ├─ 1000A  (Payer)
 *     ├─ 1000B  (Payee)
 *     └─ 2000   (Claim / CLP)
 *          └─ 2100  (Service / SVC)
 *
 * The handler is intentionally generic so it can be reused for 837 / 834.
 */
class LoopHandler {
  constructor() {
    this.reset();
  }

  reset() {
    // Active loop identifiers
    this._loop       = null;   // top-level loop: '1000A' | '1000B' | '2000'
    this._subLoop    = null;   // sub-loop inside 2000: '2100'

    // Pointers to the objects being built
    this.currentClaim       = null;
    this.currentServiceLine = null;
  }

  /* ------------------------------------------------------------------ */
  /*  Loop open / close                                                   */
  /* ------------------------------------------------------------------ */

  openLoop(loopId) {
    this._loop    = loopId;
    this._subLoop = null;
  }

  openSubLoop(subLoopId) {
    this._subLoop = subLoopId;
  }

  closeSubLoop() {
    this._subLoop         = null;
    this.currentServiceLine = null;
  }

  closeLoop() {
    this._loop              = null;
    this._subLoop           = null;
    this.currentClaim       = null;
    this.currentServiceLine = null;
  }

  /* ------------------------------------------------------------------ */
  /*  State queries                                                       */
  /* ------------------------------------------------------------------ */

  get loop()    { return this._loop;    }
  get subLoop() { return this._subLoop; }

  inLoop(id)    { return this._loop    === id; }
  inSubLoop(id) { return this._subLoop === id; }

  /* ------------------------------------------------------------------ */
  /*  Context setters                                                     */
  /* ------------------------------------------------------------------ */

  setCurrentClaim(claimObj) {
    this.currentClaim       = claimObj;
    this.currentServiceLine = null;   // new claim resets service context
  }

  setCurrentServiceLine(svcObj) {
    this.currentServiceLine = svcObj;
  }

  /* ------------------------------------------------------------------ */
  /*  Diagnostic                                                          */
  /* ------------------------------------------------------------------ */

  toString() {
    return `LoopHandler { loop=${this._loop}, subLoop=${this._subLoop} }`;
  }
}

module.exports = { LoopHandler };
