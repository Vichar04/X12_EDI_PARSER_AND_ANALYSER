# EDI 837 Parser (Institutional — HIPAA 5010)

A production-quality, **zero-dependency** Node.js parser for EDI X12 837I files.

---

## Features

| Feature | Detail |
|---|---|
| Dynamic separator detection | Reads ISA[3], ISA[104], ISA[105] — never hardcoded |
| Hierarchical HL parsing | Correct parent-child tree via HL ID map |
| State-machine dispatch | Each segment routes to the right output node |
| Composite element support | `HC:99281:25` → `{ qualifier, code, modifiers }` |
| Validation hook | Structural rules engine, extensible |
| Fail-soft | Unknown segments → warning, never crash |
| 837P extensibility | SV1 handler included alongside SV2 |

---

## Project Structure

```
edi-837-parser/
│
├── src/
│   ├── index.js                  ← Public API: parseEDI, parseEDIString, validateEDI
│   │
│   ├── parser/
│   │   ├── tokenizer.js          ← Raw string → string[][]
│   │   ├── loopHandler.js        ← HL hierarchy management
│   │   └── ediParser.js          ← State-machine segment orchestrator
│   │
│   └── utils/
│       └── separatorDetector.js  ← ISA bootstrap: detect all three separators
│
├── sample/
│   ├── sample_837i.edi           ← Example 837I with 2 subscribers, 3 claims
│   └── output.json               ← Generated after running tests
│
└── test/
    └── test.js                   ← 108-assertion test suite (no framework needed)
```

---

## Quick Start

```bash
# Parse a file and print JSON to stdout
node src/index.js sample/sample_837i.edi

# Run the full test suite
node test/test.js
```

### API Usage

```javascript
const { parseEDI, parseEDIString, validateEDI } = require('./src/index');

// From a file path
const result = parseEDI('./sample/sample_837i.edi');

// From a string
const raw    = require('fs').readFileSync('./sample/sample_837i.edi', 'utf8');
const result = parseEDIString(raw);

// Validate the parsed output
const { valid, errors, warnings } = validateEDI(result);
```

---

## Pipeline Architecture

```
Raw EDI string
      │
      ▼
┌─────────────────────┐
│  separatorDetector  │  Reads ISA[3], ISA[104], ISA[105]
│                     │  { elementSep, componentSep, segTerm }
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│     tokenizer       │  Split on segTerm → split on elemSep
│                     │  string → string[][]
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐   ┌──────────────────────┐
│     ediParser       │──►│    loopHandler        │
│  (state machine)    │   │  (HL tree builder)    │
│                     │   │                        │
│  currentLoop var    │   │  hlMap: id → node      │
│  _handle*() per seg │   │  current.{bp,sub,pat}  │
└─────────┬───────────┘   └──────────────────────┘
          │
          ▼
   Structured JSON
```

---

## How HL Loop Hierarchy Works

### The Problem

EDI 837 uses flat segments but represents a *tree* of:
```
Billing Provider → Subscriber → Claim → Service Line
```

The `HL` segment encodes this tree using two IDs:

```
HL * <HL_ID> * <Parent_HL_ID> * <Level_Code> * <Has_Child>
        │             │               │
   sequential    HL_ID of        20 = Billing Provider
   number         parent         22 = Subscriber
   (1, 2, 3…)    (blank=root)   23 = Patient/Dependent
```

### Example Document

```
HL*1**20*1       → Billing Provider (root, has children)
  NM1*85*...     → Provider name → attaches to BP node
  HL*2*1*22*1    → Subscriber A  (parent=HL1, has children)
    NM1*IL*...   → Subscriber name
    CLM*CLAIM001 → Claim 1 → attaches to Subscriber A
      LX*1       → Service line 1
      SV2*...    → Institutional service
      LX*2       → Service line 2
    CLM*CLAIM002 → Claim 2 → attaches to Subscriber A
  HL*3*1*22*0    → Subscriber B  (parent=HL1, leaf)
    NM1*IL*...
    CLM*CLAIM003 → Claim 3 → attaches to Subscriber B
```

### Implementation (`loopHandler.js`)

```javascript
// Step 1: HL segment arrives
processHL(['HL', '3', '1', '22', '0'])

// Step 2: Look up parent in the map
const parentEntry = hlMap.get('1');  // → Billing Provider node

// Step 3: Create new subscriber node, attach to parent
parentEntry.node.subscribers.push(newSubscriberNode);

// Step 4: Update rolling pointer
this.current.subscriber = newSubscriberNode;
```

All subsequent `NM1`, `CLM`, `N3`, `N4`, `REF`, `DMG` segments use
`loopHandler.current.subscriber` to know where to attach their data —
without needing to re-examine the HL segment.

---

## Output JSON Structure

```json
{
  "interchange": {
    "senderId": "SUBMITTERID",
    "receiverId": "RECEIVERID",
    "controlNumber": "000000001",
    "version": "00501",
    "usageIndicator": "Test"
  },
  "group": {
    "functionalIdentifierCode": "HC",
    "version": "005010X223A2"
  },
  "transaction": {
    "transactionCode": "837",
    "header": {
      "originatorApplicationId": "CLAIMSBATCH001",
      "transactionDate": "20230101"
    },
    "submitter": {
      "name": "ACME HOSPITAL SYSTEMS",
      "contact": { "communicationTypes": [{ "type": "TE", "number": "..." }] }
    },
    "receiver": { "name": "BLUE CROSS BLUE SHIELD" },
    "billingProviders": [
      {
        "_hlType": "billingProvider",
        "name": "GENERAL HOSPITAL",
        "npi": "1234567893",
        "taxId": "123456789",
        "taxonomy": "282N00000X",
        "address": { "addressLine1": "...", "city": "...", "state": "IL" },
        "subscribers": [
          {
            "_hlType": "subscriber",
            "name": "JOHN A SMITH",
            "memberId": "ABC123456789",
            "demographics": { "dateOfBirth": "19680315", "gender": "Male" },
            "payer": { "name": "BLUE CROSS BLUE SHIELD", "id": "12345" },
            "claims": [
              {
                "claimId": "CLAIM001",
                "totalCharge": 1500,
                "institutionalCodes": {
                  "admissionTypeCode": "1",
                  "patientStatusCode": "01"
                },
                "diagnosisCodes": [
                  { "qualifier": "ABK", "code": "K92.1", "isPrincipal": true },
                  { "qualifier": "ABF", "code": "I10",   "isPrincipal": false }
                ],
                "providers": {
                  "attending": { "name": "ROBERT JONES", "npi": "9876543210" }
                },
                "references": { "F8": "ORIG001" },
                "serviceLines": [
                  {
                    "lineNumber": "1",
                    "service": {
                      "revenueCode": "0300",
                      "procedureCode": "99281",
                      "modifiers": ["25"],
                      "lineItemCharge": 500,
                      "serviceUnitCount": 1
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "_meta": {
    "parsedAt": "2025-01-01T00:00:00.000Z",
    "warnings": [],
    "separators": { "elementSeparator": "*", "componentSeparator": ":", "segmentTerminator": "~" }
  }
}
```

---

## Segment Coverage

| Segment | Loop(s) | Purpose |
|---|---|---|
| `ISA` | Envelope | Interchange control header |
| `GS` | Envelope | Functional group header |
| `ST` | Envelope | Transaction set header |
| `BHT` | Header | Beginning of hierarchical transaction |
| `NM1` | 1000A/B, 2010*, 2310* | Entity name + ID |
| `PER` | 1000A | Submitter contact |
| `HL` | 2000A/B/C | Hierarchical level declaration |
| `PRV` | 2000A | Provider taxonomy |
| `SBR` | 2000B | Subscriber payer information |
| `N3` | 2010* | Address line |
| `N4` | 2010* | City / State / ZIP |
| `REF` | 2010*, 2300, 2400 | Reference identification |
| `DMG` | 2010BA/CA | Demographics (DOB, gender) |
| `CLM` | 2300 | Claim header |
| `DTP` | 2300, 2400 | Service / admission / discharge dates |
| `CL1` | 2300 | Institutional claim codes (837I) |
| `HI` | 2300 | Diagnosis codes (ICD-10/9) |
| `NTE` | 2300 | Notes / special instructions |
| `PWK` | 2300 | Claim attachments |
| `LX` | 2400 | Service line counter |
| `SV2` | 2400 | Institutional service (837I) |
| `SV1` | 2400 | Professional service (837P, extensibility) |
| `AMT` | 2300, 2400 | Monetary amounts |
| `SE/GE/IEA` | Envelope | Trailer segments |

---

## Extending to 835 / 834

The architecture is loop-agnostic:

1. **separatorDetector** — works identically for all X12 transactions
2. **tokenizer** — works identically for all X12 transactions
3. **loopHandler** — only needs a different `LEVEL_CODE_MAP`
4. **ediParser** — add handlers for 835-specific segments (`CLP`, `SVC`, `CAS`…)

---

## Validation Hook

`validateEDI(parsedResult)` is a pure function that receives parsed output
and returns `{ valid, errors, warnings }`.  Add rules by appending checks
to the function body — no changes to the parser required.

```javascript
// Example custom rule
if (claim.totalCharge > 999999) {
  errors.push(`Claim ${claim.claimId}: charge exceeds $999,999 threshold`);
}
```
