import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";

// ════════════════════════════════════════════════════════════════
//  SECTION 1 · THEME ENGINE & DESIGN TOKENS
// ════════════════════════════════════════════════════════════════

const DARK_THEME = {
  id: "dark",
  bg:           "#080C14",
  bgPanel:      "#0C1220",
  bgSurface:    "#101828",
  bgRaised:     "#162035",
  bgHover:      "#1A2640",
  bgActive:     "#1E2D4A",
  border:       "#1E304A",
  borderFaint:  "#152035",
  borderGlow:   "rgba(56,139,253,0.4)",
  textPrimary:  "#E6EDF6",
  textSecondary:"#7D94B5",
  textMuted:    "#3D5470",
  textDisabled: "#253348",
  blue:         "#4493F8",
  blueHover:    "#58A6FF",
  blueDim:      "rgba(68,147,248,0.15)",
  purple:       "#A371F7",
  purpleDim:    "rgba(163,113,247,0.15)",
  teal:         "#2DD4BF",
  tealDim:      "rgba(45,212,191,0.15)",
  green:        "#3FB950",
  greenDim:     "rgba(63,185,80,0.15)",
  amber:        "#F0A830",
  amberDim:     "rgba(240,168,48,0.15)",
  red:          "#F85149",
  redDim:       "rgba(248,81,73,0.15)",
  orange:       "#FB923C",
  orangeDim:    "rgba(251,146,60,0.15)",
  // EDI segment colors
  segISA:       "#58A6FF",
  segGS:        "#A371F7",
  segST:        "#2DD4BF",
  segSE:        "#F85149",
  segCLM:       "#F0A830",
  segNM1:       "#3FB950",
  segDTP:       "#FB923C",
  segBPR:       "#E86CF4",
  segREF:       "#39D0D8",
  segHI:        "#FFD700",
  segSV1:       "#58A6FF",
  segHL:        "#A371F7",
  shadow:       "0 8px 40px rgba(0,0,0,0.6)",
  shadowSm:     "0 2px 12px rgba(0,0,0,0.4)",
};

const LIGHT_THEME = {
  id: "light",
  bg:           "#F3F6FB",
  bgPanel:      "#FFFFFF",
  bgSurface:    "#F8FAFD",
  bgRaised:     "#EEF3FA",
  bgHover:      "#E5EEF9",
  bgActive:     "#D9E8F8",
  border:       "#D0DCF0",
  borderFaint:  "#E5EEF9",
  borderGlow:   "rgba(37,99,235,0.3)",
  textPrimary:  "#0F1F35",
  textSecondary:"#3D5470",
  textMuted:    "#7A90B0",
  textDisabled: "#B0C0D8",
  blue:         "#2563EB",
  blueHover:    "#1D4ED8",
  blueDim:      "rgba(37,99,235,0.1)",
  purple:       "#7C3AED",
  purpleDim:    "rgba(124,58,237,0.1)",
  teal:         "#0D9488",
  tealDim:      "rgba(13,148,136,0.1)",
  green:        "#16A34A",
  greenDim:     "rgba(22,163,74,0.1)",
  amber:        "#D97706",
  amberDim:     "rgba(217,119,6,0.1)",
  red:          "#DC2626",
  redDim:       "rgba(220,38,38,0.1)",
  orange:       "#EA580C",
  orangeDim:    "rgba(234,88,12,0.1)",
  segISA:       "#1D4ED8",
  segGS:        "#7C3AED",
  segST:        "#0D9488",
  segSE:        "#DC2626",
  segCLM:       "#D97706",
  segNM1:       "#16A34A",
  segDTP:       "#EA580C",
  segBPR:       "#9333EA",
  segREF:       "#0891B2",
  segHI:        "#CA8A04",
  segSV1:       "#1D4ED8",
  segHL:        "#7C3AED",
  shadow:       "0 4px 24px rgba(0,0,0,0.12)",
  shadowSm:     "0 2px 8px rgba(0,0,0,0.08)",
};

const ThemeCtx = createContext({ t: DARK_THEME, dark: true, setDark: () => {} });
const useTh = () => useContext(ThemeCtx);

// ════════════════════════════════════════════════════════════════
//  SECTION 2 · MOCK DATA
// ════════════════════════════════════════════════════════════════

const SAMPLES = {
  "837": `ISA*00*          *00*          *ZZ*SENDER12345    *ZZ*RECEIVER6789   *230615*1430*^*00501*000000001*0*P*:~
GS*HC*SENDER12345*RECEIVER6789*20230615*1430*1*X*005010X222A1~
ST*837*0001*005010X222A1~
BHT*0019*00*CLAIM-2023-001*20230615*1430*CH~
NM1*41*2*ACME BILLING SERVICES LLC*****46*1234567890~
PER*IC*JOHN ANDERSON*TE*5551234567*FX*5559876543~
NM1*40*2*BLUE CROSS BLUE SHIELD*****46*BCBS001~
HL*1**20*1~
NM1*85*2*MIDWEST MEDICAL GROUP*****XX*1122334455~
N3*1200 MEDICAL PLAZA DR*SUITE 400~
N4*CHICAGO*IL*60601~
REF*EI*987654321~
PRV*BI*PXC*207Q00000X~
HL*2*1*22*0~
SBR*P*18*GRP-2023-001**CI****MB~
NM1*IL*1*JOHNSON*MICHAEL*R**34*SSN123456789~
N3*4567 OAK AVENUE*APT 12B~
N4*CHICAGO*IL*60602~
DMG*D8*19850320*M~
NM1*PR*2*BLUE CROSS BLUE SHIELD*****PI*BCBS001~
CLM*CLM-20230615-001*1875.00***11:B:1*Y*A*Y*I~
DTP*435*D8*20230610~
DTP*096*TM*1430~
REF*D9*PRIORAUTH-2023-456~
REF*EA*PAT-ACCT-789~
HI*ABK:Z8100*ABF:M79.3~
NM1*82*1*PATEL*PRIYA*S**XX*9988776655~
PRV*PE*PXC*207Q00000X~
LX*1~
SV1*HC:99213:25**175.00*UN*1***1~
DTP*472*D8*20230610~
REF*6R*SVC-LINE-001~
LX*2~
SV1*HC:93000**285.00*UN*1***1~
DTP*472*D8*20230610~
REF*6R*SVC-LINE-002~
LX*3~
SV1*HC:85025**95.00*UN*1***1~
DTP*472*D8*20230610~
REF*6R*SVC-LINE-003~
LX*4~
SV1*HC:71046**320.00*UN*1***1~
DTP*472*D8*20230610~
SE*42*0001~
GE*1*1~
IEA*1*000000001~`,

  "835": `ISA*00*          *00*          *ZZ*BCBS001         *ZZ*PROVIDER001     *230616*0900*^*00501*000000002*0*P*:~
GS*HP*BCBS001*PROVIDER001*20230616*0900*2*X*005010X221A1~
ST*835*0002~
BPR*I*1420.50*C*ACH*CCP**01*021000021*DA*123456789*1987654321**01*071000013*DA*987654321*20230616~
TRN*1*REMIT-2023-0616-001*1234567890~
REF*EV*CLAIMS-ADJ-001~
REF*F2*TAX-ID-001~
DTM*405*20230616~
N1*PR*BLUE CROSS BLUE SHIELD ILLINOIS*XV*BCBS001~
N3*300 EAST RANDOLPH ST~
N4*CHICAGO*IL*60601~
N1*PE*MIDWEST MEDICAL GROUP*XX*1122334455~
N3*1200 MEDICAL PLAZA DR SUITE 400~
N4*CHICAGO*IL*60601~
LX*1~
CLP*CLM-20230615-001*1*1875.00*1420.50*454.50*MB*CLM-20230615-001*11~
CAS*PR*2*200.00*1~
CAS*CO*45*254.50~
NM1*QC*1*JOHNSON*MICHAEL*R**MI*SSN123456789~
NM1*82*1*PATEL*PRIYA*S**XX*9988776655~
DTM*232*20230610~
DTM*233*20230616~
AMT*AU*1875.00~
SVC*HC:99213*175.00*140.00**1~
DTM*472*D8*20230610~
CAS*CO*45*35.00~
SVC*HC:93000*285.00*235.00**1~
CAS*PR*2*25.00~
CAS*CO*45*25.00~
SVC*HC:85025*95.00*82.50**1~
CAS*CO*45*12.50~
SVC*HC:71046*320.00*273.00**1~
CAS*CO*45*47.00~
SE*35*0002~
GE*1*2~
IEA*1*000000002~`,

  "834": `ISA*00*          *00*          *ZZ*EMPLOYER001     *ZZ*CARRIER001      *230617*0800*^*00501*000000003*0*P*:~
GS*BE*EMPLOYER001*CARRIER001*20230617*0800*3*X*005010X220A1~
ST*834*0003~
BGN*00*ENROLL-20230617*20230617*0800***2~
REF*38*EMPLOYER001~
REF*72*PLAN-GRP-2023~
DTP*007*D8*20230617~
DTP*303*D8*20230101~
N1*P5*ACME CORPORATION INC*FI*123456789~
N3*500 W MADISON ST*FLOOR 22~
N4*CHICAGO*IL*60661~
PER*IC*HR BENEFITS ADMIN*TE*3125551234*EM*benefits@acme.com~
N1*IN*BLUE SHIELD HEALTH PLAN*XV*BSHP001~
INS*Y*18*030*XN*A*E**FT~
REF*0F*EMP-ID-12345~
REF*1L*GRP-PLAN-001~
REF*3H*DEPT-ENGINEERING~
DTP*356*D8*20230101~
DTP*357*D8*20231231~
NM1*IL*1*MARTINEZ*ELENA*C**34*SSN987654321~
PER*IP**TE*3125559876*EX*2210*EM*emartinez@email.com~
N3*2847 N CLARK ST*APT 3F~
N4*CHICAGO*IL*60657~
DMG*D8*19900712*F~
LUI**ENG*Primary~
HD*030**HLT*PPOPLAN2023*EMP~
DTP*348*D8*20230101~
REF*1D*MBR-ID-20230001~
COB*P*BCBS-OTHER*5~
SE*30*0003~
GE*1*3~
IEA*1*000000003~`
};

const PARSED_JSON = {
  transactionSet: "837P — Professional Claim",
  version: "005010X222A1",
  interchangeControlNumber: "000000001",
  submittedDate: "2023-06-15",
  interchange: {
    senderQualifier: "ZZ",
    senderId: "SENDER12345",
    receiverQualifier: "ZZ",
    receiverId: "RECEIVER6789",
    repetitionSeparator: "^",
    componentSeparator: ":"
  },
  functionalGroup: {
    functionalCode: "HC",
    groupControlNumber: "1",
    versionIdentifier: "005010X222A1"
  },
  claims: [{
    claimId: "CLM-20230615-001",
    totalChargeAmount: 1875.00,
    serviceLocationCode: "11",
    priorAuthorization: "PRIORAUTH-2023-456",
    patientAccountNumber: "PAT-ACCT-789",
    serviceDate: "2023-06-10",
    diagnosisCodes: ["Z8100", "M79.3"],
    billingProvider: {
      entityType: "Organization",
      npi: "1234567890",
      name: "ACME BILLING SERVICES LLC",
      taxId: "987654321"
    },
    renderingProvider: {
      npi: "9988776655",
      lastName: "PATEL",
      firstName: "PRIYA",
      middleInitial: "S",
      taxonomy: "207Q00000X"
    },
    subscriber: {
      memberId: "SSN123456789",
      lastName: "JOHNSON",
      firstName: "MICHAEL",
      middleInitial: "R",
      dateOfBirth: "1985-03-20",
      gender: "Male",
      address: { street: "4567 OAK AVENUE APT 12B", city: "CHICAGO", state: "IL", zip: "60602" }
    },
    payer: { payerId: "BCBS001", name: "BLUE CROSS BLUE SHIELD" },
    serviceLines: [
      { lineNumber: 1, procedureCode: "99213", modifier: "25", chargeAmount: 175.00, serviceUnits: 1, serviceDate: "2023-06-10", lineId: "SVC-LINE-001" },
      { lineNumber: 2, procedureCode: "93000", modifier: null,   chargeAmount: 285.00, serviceUnits: 1, serviceDate: "2023-06-10", lineId: "SVC-LINE-002" },
      { lineNumber: 3, procedureCode: "85025", modifier: null,   chargeAmount: 95.00,  serviceUnits: 1, serviceDate: "2023-06-10", lineId: "SVC-LINE-003" },
      { lineNumber: 4, procedureCode: "71046", modifier: null,   chargeAmount: 320.00, serviceUnits: 1, serviceDate: "2023-06-10", lineId: "SVC-LINE-004" }
    ]
  }]
};

const VALIDATION_DATA = [
  { id:1, line:20, sev:"error",   code:"EDI-E001", seg:"NM1", field:"NM109", message:"Subscriber ID format invalid for qualifier '34'. SSN must be 9 digits without dashes." },
  { id:2, line:26, sev:"error",   code:"EDI-E009", seg:"HI",  field:"HI01-2", message:"ICD-10-CM code 'Z8100' requires 7th character. Use 'Z81.00' (Personal history of suicidal behavior)." },
  { id:3, line:21, sev:"warning", code:"EDI-W012", seg:"CLM", field:"CLM05-3", message:"Facility code '11' (Office) — verify provider taxonomy 207Q00000X matches location of service." },
  { id:4, line:29, sev:"warning", code:"EDI-W034", seg:"SV1", field:"SV101-2", message:"Modifier '25' appended to E&M code 99213. Ensure separate documentation for significant, separately identifiable service." },
  { id:5, line:10, sev:"info",    code:"EDI-I002", seg:"NM1", field:"NM109",   message:"Billing provider NPI '1234567890' could not be verified against NPPES registry. Verify active status." },
  { id:6, line:14, sev:"info",    code:"EDI-I007", seg:"PRV", field:"PRV03",   message:"Taxonomy '207Q00000X' resolves to Family Medicine. Confirm specialty matches rendered services." },
];

const HISTORY_DATA = [
  { id:1, name:"claims_batch_june_2023.edi", type:"837", size:"48.2 KB", lines:312, date:"2025-03-19 14:22", errors:2, warnings:3, status:"warning" },
  { id:2, name:"remittance_apr_2023.edi",    type:"835", size:"31.7 KB", lines:218, date:"2025-03-18 09:45", errors:0, warnings:1, status:"warning" },
  { id:3, name:"enrollment_q2_2023.edi",     type:"834", size:"22.1 KB", lines:178, date:"2025-03-17 16:30", errors:0, warnings:0, status:"success" },
  { id:4, name:"claims_may_2023.edi",         type:"837", size:"62.8 KB", lines:440, date:"2025-03-16 11:00", errors:5, warnings:2, status:"error" },
  { id:5, name:"remit_835_march.edi",         type:"835", size:"19.4 KB", lines:142, date:"2025-03-15 08:15", errors:0, warnings:0, status:"success" },
];

const TXN_TABS = [
  { id:"837", label:"claim_837.edi",  color: "#4493F8",  dot:"#4493F8" },
  { id:"835", label:"remit_835.edi",  color: "#A371F7",  dot:"#A371F7" },
  { id:"834", label:"enroll_834.edi", color: "#2DD4BF",  dot:"#2DD4BF" },
];

const EDI_TREE = {
  id:"isa", tag:"ISA", desc:"Interchange Control Header", count:"1 interchange",
  children:[{
    id:"gs", tag:"GS", desc:"Functional Group Header", count:"1 group",
    children:[{
      id:"st", tag:"ST*837", desc:"Transaction Set — 837P Professional", count:"1 transaction",
      children:[
        { id:"bht", tag:"BHT", desc:"Beginning of Hierarchical Transaction", count:null, children:[] },
        { id:"l1000a", tag:"Loop 1000A", desc:"Submitter Name", count:"1",
          children:[
            { id:"nm1-41", tag:"NM1*41", desc:"Submitter — Billing Service", count:null, children:[] },
            { id:"per",    tag:"PER",    desc:"Submitter Contact Information", count:null, children:[] },
          ]
        },
        { id:"l1000b", tag:"Loop 1000B", desc:"Receiver Name", count:"1",
          children:[
            { id:"nm1-40", tag:"NM1*40", desc:"Receiver — Payer Organization", count:null, children:[] },
          ]
        },
        { id:"l2000a", tag:"Loop 2000A", desc:"Billing/Pay-to Provider HL", count:"1",
          children:[
            { id:"hl1",    tag:"HL*1",   desc:"Billing Provider Hierarchical Level", count:null, children:[] },
            { id:"nm1-85", tag:"NM1*85", desc:"Billing Provider Name", count:null, children:[] },
            { id:"n3",     tag:"N3",     desc:"Provider Address Line", count:null, children:[] },
            { id:"n4",     tag:"N4",     desc:"Provider City/State/Zip", count:null, children:[] },
            { id:"ref-ei", tag:"REF*EI", desc:"Employer's Identification Number", count:null, children:[] },
            { id:"l2000b", tag:"Loop 2000B", desc:"Subscriber HL Level", count:"1",
              children:[
                { id:"hl2",  tag:"HL*2",  desc:"Subscriber Hierarchical Level", count:null, children:[] },
                { id:"sbr",  tag:"SBR",   desc:"Subscriber Information", count:null, children:[] },
                { id:"nm1-il",tag:"NM1*IL",desc:"Subscriber — Insured Member", count:null, children:[] },
                { id:"l2300", tag:"Loop 2300", desc:"Claim Information", count:"1 claim",
                  children:[
                    { id:"clm",   tag:"CLM",    desc:"Claim Information — $1,875.00", count:null, children:[] },
                    { id:"dtp-1", tag:"DTP*435", desc:"Admission/Start Date", count:null, children:[] },
                    { id:"ref-d9",tag:"REF*D9",  desc:"Prior Authorization Number", count:null, children:[] },
                    { id:"hi",    tag:"HI",      desc:"Health Care Diagnosis Codes", count:"2 codes", children:[] },
                    { id:"nm1-82",tag:"NM1*82",  desc:"Rendering Provider", count:null, children:[] },
                    { id:"l2400-1",tag:"Loop 2400", desc:"SV1 — 99213×25 (E&M Office)", count:"line 1", children:[] },
                    { id:"l2400-2",tag:"Loop 2400", desc:"SV1 — 93000 (EKG)", count:"line 2", children:[] },
                    { id:"l2400-3",tag:"Loop 2400", desc:"SV1 — 85025 (CBC)", count:"line 3", children:[] },
                    { id:"l2400-4",tag:"Loop 2400", desc:"SV1 — 71046 (Chest X-Ray)", count:"line 4", children:[] },
                  ]
                }
              ]
            }
          ]
        },
        { id:"se", tag:"SE", desc:"Transaction Set Trailer", count:null, children:[] },
      ]
    }]
  }]
};

// ════════════════════════════════════════════════════════════════
//  SECTION 3 · UTILITY HELPERS
// ════════════════════════════════════════════════════════════════

const segColor = (tag, t) => {
  const map = {
    ISA:t.segISA, IEA:t.segISA,
    GS:t.segGS,   GE:t.segGS,
    ST:t.segST,   SE:t.segSE,
    BHT:t.teal,   BGN:t.segST,
    NM1:t.segNM1, N3:t.segNM1, N4:t.segNM1,
    CLM:t.segCLM, SBR:t.segCLM,
    DTP:t.segDTP, DTM:t.segDTP,
    HI:t.segHI,   SV1:t.segSV1,
    REF:t.segREF, HL:t.segHL,
    LX:t.purple,  PRV:t.textSecondary,
    PER:t.textSecondary, DMG:t.textSecondary,
    BPR:t.segBPR, TRN:t.teal,
    CLP:t.segCLM, CAS:t.red,
    SVC:t.blue,   AMT:t.green,
    INS:t.segNM1, HD:t.purple,
    COB:t.orange, LUI:t.textSecondary,
  };
  return map[tag] || t.textSecondary;
};

const isDateVal = v => /^\d{8}$/.test(v);
const isNumVal  = v => /^\d+(\.\d+)?$/.test(v) && v.length > 2;
const isTinyCode = v => v.length <= 4 && /^[A-Z0-9]{1,4}$/.test(v);

// ════════════════════════════════════════════════════════════════
//  SECTION 4 · BASE UI PRIMITIVES
// ════════════════════════════════════════════════════════════════

// ── Badge ──────────────────────────────────────────────────────
const Badge = ({ children, color, bg, style = {} }) => {
  const { t } = useTh();
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
      fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.4,
      color: color || t.blue, background: bg || t.blueDim,
      border: `1px solid ${(color || t.blue)}30`,
      ...style
    }}>{children}</span>
  );
};

// ── Chip ──────────────────────────────────────────────────────
const Chip = ({ label, color, onClick, active }) => {
  const { t } = useTh();
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "4px 12px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
        cursor: "pointer", border: `1px solid ${active ? (color||t.blue)+"55" : t.border}`,
        background: active ? (color||t.blue)+"18" : hov ? t.bgHover : "transparent",
        color: active ? (color||t.blue) : hov ? t.textPrimary : t.textMuted,
        fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
      }}
    >{label}</button>
  );
};

// ── IconBtn ──────────────────────────────────────────────────
const IconBtn = ({ icon, title, onClick, active, color, sm }) => {
  const { t } = useTh();
  const [hov, setHov] = useState(false);
  const sz = sm ? 28 : 32;
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: sz, height: sz, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 7, background: active ? (color||t.blue)+"18" : hov ? t.bgHover : "transparent",
        color: active ? (color||t.blue) : hov ? t.textPrimary : t.textMuted,
        cursor: "pointer", transition: "all 0.15s", fontSize: 15, flexShrink: 0, border: "none",
      }}
    >{icon}</button>
  );
};

// ── PrimaryBtn ───────────────────────────────────────────────
const PrimaryBtn = ({ children, onClick, icon, sm, style: ext = {} }) => {
  const { t } = useTh();
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: sm ? "5px 14px" : "7px 18px",
        borderRadius: 8, background: t.blue, color: "#fff",
        fontSize: sm ? 11.5 : 13, fontWeight: 600, border: "none", cursor: "pointer",
        fontFamily: "'DM Sans',sans-serif",
        boxShadow: hov ? `0 6px 20px ${t.blue}55` : `0 2px 10px ${t.blue}40`,
        transform: hov ? "translateY(-1px)" : "none",
        transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
        ...ext
      }}
    >
      {icon && <span style={{ fontSize: sm ? 12 : 14 }}>{icon}</span>}
      {children}
    </button>
  );
};

// ── GhostBtn ──────────────────────────────────────────────────
const GhostBtn = ({ children, onClick, style: ext = {} }) => {
  const { t } = useTh();
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 7,
        background: hov ? t.bgHover : "transparent",
        border: `1px solid ${t.border}`, color: hov ? t.textPrimary : t.textMuted,
        fontSize: 12, fontWeight: 500, cursor: "pointer",
        fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
        ...ext
      }}
    >{children}</button>
  );
};

// ── Divider ──────────────────────────────────────────────────
const Divider = ({ vertical, style: ext = {} }) => {
  const { t } = useTh();
  return (
    <div style={{
      background: t.border,
      ...(vertical
        ? { width: 1, alignSelf: "stretch", margin: "0 4px" }
        : { height: 1, margin: "4px 0" }),
      ...ext
    }} />
  );
};

// ── SectionLabel ─────────────────────────────────────────────
const SectionLabel = ({ children }) => {
  const { t } = useTh();
  return (
    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: t.textMuted, padding: "10px 14px 4px" }}>
      {children}
    </div>
  );
};

// ── PanelHeader ──────────────────────────────────────────────
const PanelHeader = ({ title, subtitle, right, icon }) => {
  const { t } = useTh();
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderBottom: `1px solid ${t.border}`,
      background: t.bgPanel, flexShrink: 0,
    }}>
      {icon && <span style={{ fontSize: 15, color: t.blue }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: t.textPrimary }}>{title}</div>
        {subtitle && <div style={{ fontSize: 10.5, color: t.textMuted, marginTop: 1 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
};

// ── StatusDot ─────────────────────────────────────────────────
const StatusDot = ({ status, pulse }) => {
  const { t } = useTh();
  const c = status === "success" ? t.green : status === "error" ? t.red : status === "warning" ? t.amber : t.blue;
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0,
      boxShadow: pulse ? `0 0 0 3px ${c}30` : "none",
      animation: pulse ? "pulse 2s infinite" : "none",
    }} />
  );
};

// ── KbdShortcut ───────────────────────────────────────────────
const Kbd = ({ children }) => {
  const { t } = useTh();
  return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, padding: "1px 5px", background: t.bgRaised, border: `1px solid ${t.border}`, borderRadius: 4, color: t.textMuted }}>
      {children}
    </span>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 5 · TOP NAVIGATION BAR
// ════════════════════════════════════════════════════════════════

const TopNavbar = ({ sidebarW, activeTxn, dark, setDark, onUpload, hasFile }) => {
  const { t } = useTh();
  const [searchFocus, setSearchFocus] = useState(false);
  const [search, setSearch] = useState("");

  const txn = TXN_TABS.find(x => x.id === activeTxn);

  return (
    <div style={{
      height: 48, display: "flex", alignItems: "center",
      background: t.bgPanel, borderBottom: `1px solid ${t.border}`,
      padding: "0 16px 0 0", position: "relative", zIndex: 100, flexShrink: 0,
    }}>
      {/* Logo zone */}
      <div style={{ width: sidebarW, display: "flex", alignItems: "center", padding: "0 14px", gap: 10, overflow: "hidden", flexShrink: 0, transition: "width 0.25s" }}>
        <div style={{
          width: 30, height: 30, flexShrink: 0,
          background: "linear-gradient(135deg, #4493F8 0%, #A371F7 100%)",
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono',monospace",
          boxShadow: "0 0 16px rgba(68,147,248,0.45)", letterSpacing: -0.5,
        }}>EDI</div>
        {sidebarW > 100 && (
          <div style={{ animation: "fadeIn 0.2s ease", overflow: "hidden", whiteSpace: "nowrap" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14.5, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.5 }}>EDI Studio</div>
            <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>X12 Healthcare</div>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      {hasFile && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: t.textMuted, marginLeft: 4 }}>
          <span>workspace</span>
          <span style={{ color: t.textDisabled }}>›</span>
          <span>uploads</span>
          <span style={{ color: t.textDisabled }}>›</span>
          <span style={{ color: txn?.color || t.textSecondary, fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>{txn?.label}</span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "5px 12px", borderRadius: 8,
        background: searchFocus ? t.bgRaised : t.bgSurface,
        border: `1px solid ${searchFocus ? t.borderGlow : t.border}`,
        boxShadow: searchFocus ? `0 0 0 3px ${t.blue}18` : "none",
        transition: "all 0.2s", minWidth: 200, marginRight: 8,
      }}>
        <span style={{ fontSize: 12, color: t.textMuted }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          placeholder="Search segments, codes…"
          style={{ background: "none", border: "none", color: t.textPrimary, fontSize: 12, width: "100%", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
        />
        <Kbd>⌘K</Kbd>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PrimaryBtn onClick={onUpload} icon="⬆" sm>
          Upload
          <Kbd>⌃O</Kbd>
        </PrimaryBtn>

        {/* Theme Toggle */}
        <div
          onClick={() => setDark(d => !d)}
          title="Toggle theme"
          style={{
            width: 54, height: 28, background: t.bgRaised, border: `1px solid ${t.border}`,
            borderRadius: 14, position: "relative", cursor: "pointer",
            display: "flex", alignItems: "center", padding: "0 4px",
          }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: "50%", background: t.blue,
            position: "absolute", left: 4, transform: dark ? "none" : "translateX(26px)",
            transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.3)", color: "#fff",
          }}>{dark ? "◑" : "☀"}</div>
          <div style={{ display:"flex", justifyContent:"space-between", width:"100%", padding:"0 3px", fontSize:9, color:t.textMuted, pointerEvents:"none" }}>
            <span>◑</span><span>☀</span>
          </div>
        </div>

        <Divider vertical />

        {/* Status */}
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:t.greenDim, border:`1px solid ${t.green}40`, borderRadius:20, fontSize:10.5, color:t.green }}>
          <StatusDot status="success" pulse />
          Ready
        </div>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #A371F7, #4493F8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer",
          border: `2px solid ${t.border}`, transition: "border-color 0.15s",
          flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = t.blue}
          onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
        >JD</div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 6 · LEFT SIDEBAR
// ════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id:"dashboard",  icon:"⊞",  label:"Dashboard"  },
  { id:"upload",     icon:"⬆",  label:"Upload File" },
  { id:"parser",     icon:"◫",  label:"Parser View" },
  { id:"validation", icon:"⚠",  label:"Validation", badge: 2 },
  { id:"history",    icon:"🕐", label:"History"    },
];
const NAV_BOTTOM = [
  { id:"settings", icon:"⚙", label:"Settings" },
];

const Sidebar = ({ active, setActive, expanded }) => {
  const { t } = useTh();

  const Item = ({ item, bottom }) => {
    const [hov, setHov] = useState(false);
    const isActive = active === item.id;
    return (
      <div
        onClick={() => setActive(item.id)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex", alignItems: "center", gap: 11,
          padding: "9px 13px", cursor: "pointer",
          color: isActive ? t.blue : hov ? t.textPrimary : t.textMuted,
          background: isActive ? t.blueDim : hov ? t.bgHover : "transparent",
          borderLeft: `3px solid ${isActive ? t.blue : "transparent"}`,
          transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden",
          position: "relative",
        }}
      >
        <span style={{ width: 22, height: 22, display:"flex", alignItems:"center", justifyContent:"center", fontSize: 16, flexShrink: 0 }}>
          {item.icon}
        </span>
        <span style={{
          fontSize: 13, fontWeight: 500, opacity: expanded ? 1 : 0,
          transform: expanded ? "none" : "translateX(-6px)",
          transition: "all 0.2s 0.05s", flex: 1,
        }}>{item.label}</span>
        {item.badge && expanded && (
          <span style={{ padding:"1px 6px", borderRadius:10, background:t.redDim, color:t.red, fontSize:9.5, fontWeight:700, border:`1px solid ${t.red}30` }}>
            {item.badge}
          </span>
        )}
        {item.badge && !expanded && isActive && (
          <span style={{ position:"absolute", top:6, right:6, width:7, height:7, borderRadius:"50%", background:t.red }} />
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      background: t.bgPanel, borderRight: `1px solid ${t.border}`,
      overflow: "hidden", transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <div style={{ flex: 1, paddingTop: 8, overflowY: "auto", overflowX: "hidden" }}>
        {expanded && <SectionLabel>Navigation</SectionLabel>}
        {NAV_ITEMS.map(item => <Item key={item.id} item={item} />)}
      </div>
      <div style={{ borderTop: `1px solid ${t.border}`, paddingBottom: 8 }}>
        {NAV_BOTTOM.map(item => <Item key={item.id} item={item} />)}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 7 · EDITOR — TAB BAR
// ════════════════════════════════════════════════════════════════

const EditorTabBar = ({ activeTxn, setActiveTxn, onClose, errorCounts, lineCount, showConsole, setShowConsole }) => {
  const { t } = useTh();
  const totalErrors = errorCounts.error;
  const totalWarns  = errorCounts.warning;

  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: t.bgPanel, borderBottom: `1px solid ${t.border}`,
      height: 40, padding: "0 8px", gap: 2, flexShrink: 0,
    }}>
      {TXN_TABS.map(tab => {
        const isActive = activeTxn === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTxn(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "0 12px", height: 32,
              background: isActive ? t.bgSurface : "transparent",
              border: `1px solid ${isActive ? t.border : "transparent"}`,
              borderRadius: 7, color: isActive ? t.textPrimary : t.textMuted,
              fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
              cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.bgHover; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: tab.color, boxShadow: isActive ? `0 0 8px ${tab.color}` : "none", flexShrink: 0 }} />
            {tab.label}
            <Badge color={tab.color} bg={`${tab.color}18`}>{tab.id}</Badge>
            {isActive && (
              <span
                onClick={e => { e.stopPropagation(); onClose(tab.id); }}
                style={{ fontSize: 13, color: t.textMuted, lineHeight: 1, padding: "0 1px", cursor: "pointer", marginLeft: 2 }}
                onMouseEnter={e => e.currentTarget.style.color = t.red}
                onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
              >×</span>
            )}
          </div>
        );
      })}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"3px 10px", background:t.bgSurface, border:`1px solid ${t.border}`, borderRadius:20, fontSize:10.5 }}>
          <span style={{ color: t.red }}>✕ {totalErrors}</span>
          <span style={{ color: t.border }}>|</span>
          <span style={{ color: t.amber }}>△ {totalWarns}</span>
          <span style={{ color: t.border }}>|</span>
          <span style={{ color: t.textMuted }}>{lineCount} ln</span>
        </div>
        <GhostBtn onClick={() => setShowConsole(c => !c)} style={{ fontSize: 11, padding: "4px 10px", background: showConsole ? t.blueDim : "transparent", borderColor: showConsole ? t.blue+"40" : t.border, color: showConsole ? t.blue : t.textMuted }}>
          ≡ Console
        </GhostBtn>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 8 · EDITOR — EDI LINE RENDERER
// ════════════════════════════════════════════════════════════════

const EDILine = ({ raw, lineNum, highlighted, isError, onClick, t }) => {
  const [hov, setHov] = useState(false);
  const base = raw.endsWith("~") ? raw.slice(0, -1) : raw;
  const parts = base.split("*");
  const tag = parts[0];
  const color = segColor(tag, t);

  const valueBg = highlighted ? `rgba(68,147,248,0.06)` : isError ? `rgba(248,81,73,0.06)` : hov ? t.bgHover : "transparent";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center",
        padding: "0 20px", height: "1.85em",
        background: valueBg,
        borderLeft: `2px solid ${highlighted ? t.blue : isError ? t.red : "transparent"}`,
        cursor: "pointer", transition: "background 0.08s",
      }}
    >
      <span style={{ fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5 }}>{tag}</span>
      {parts.slice(1).map((el, i) => (
        <span key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5 }}>
          <span style={{ color: t.textDisabled }}>*</span>
          {el === "" ? (
            <span style={{ color: t.textDisabled }}>∅</span>
          ) : (
            <span style={{ color: isDateVal(el) ? t.green : isNumVal(el) ? t.amber : isTinyCode(el) ? t.teal : t.textPrimary }}>
              {el}
            </span>
          )}
        </span>
      ))}
      <span style={{ color: t.textDisabled, fontFamily:"'JetBrains Mono',monospace", fontSize:12.5 }}>~</span>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 9 · EDITOR — MAIN EDITOR PANEL
// ════════════════════════════════════════════════════════════════

const EditorPanel = ({ activeTxn, highlightedLine, setHighlightedLine, errorLineSet }) => {
  const { t } = useTh();
  const lines = SAMPLES[activeTxn]?.split("\n").filter(Boolean) || [];

  return (
    <div style={{ display: "flex", flex: 1, overflow: "auto", background: t.bg }}>
      {/* Line numbers */}
      <div style={{
        background: t.bg, borderRight: `1px solid ${t.borderFaint}`,
        padding: "14px 0", flexShrink: 0, userSelect: "none",
        position: "sticky", left: 0, zIndex: 2,
      }}>
        {lines.map((_, i) => {
          const ln = i + 1;
          const isHL = highlightedLine === ln;
          const isErr = errorLineSet.has(ln);
          return (
            <div key={i} style={{
              height: "1.85em", display: "flex", alignItems: "center", justifyContent: "flex-end",
              padding: "0 12px 0 8px", minWidth: 50,
              fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
              color: isHL ? t.blue : isErr ? t.red+"AA" : t.textDisabled,
              background: isHL ? "rgba(68,147,248,0.06)" : "transparent",
            }}>{ln}</div>
          );
        })}
      </div>

      {/* EDI content */}
      <div style={{ flex: 1, padding: "14px 0", minWidth: 0 }}>
        {lines.map((line, i) => (
          <EDILine
            key={i}
            raw={line}
            lineNum={i + 1}
            highlighted={highlightedLine === i + 1}
            isError={errorLineSet.has(i + 1)}
            onClick={() => setHighlightedLine(hl => hl === i + 1 ? null : i + 1)}
            t={t}
          />
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 10 · EDITOR — CONSOLE / DEBUG PANEL
// ════════════════════════════════════════════════════════════════

const ConsolePanel = ({ height, onResize, onClose, activeTxn }) => {
  const { t } = useTh();
  const logs = [
    { ts:"14:30:01.023", lv:"INFO",  msg:`Loaded ${activeTxn} transaction — file parsed, ${SAMPLES[activeTxn]?.split("\n").filter(Boolean).length || 0} segments found.` },
    { ts:"14:30:01.041", lv:"INFO",  msg:"ISA*00 envelope: sender=SENDER12345, receiver=RECEIVER6789, version=00501" },
    { ts:"14:30:01.089", lv:"INFO",  msg:"GS functional group validated. Transaction count: 1" },
    { ts:"14:30:01.124", lv:"WARN",  msg:"Line 20 [NM1]: Subscriber ID qualifier '34' — SSN format validation failed." },
    { ts:"14:30:01.201", lv:"ERROR", msg:"Line 26 [HI]: ICD-10 code Z8100 invalid. Requires 7th character specificity per CMS guidelines." },
    { ts:"14:30:01.238", lv:"WARN",  msg:"Line 21 [CLM]: Facility type code '11' may not align with provider taxonomy 207Q00000X." },
    { ts:"14:30:01.255", lv:"INFO",  msg:"ST/SE segment pair verified. Transaction set control number 0001 matches." },
    { ts:"14:30:01.270", lv:"INFO",  msg:`Validation complete — 2 errors, 2 warnings, 2 informational messages.` },
  ];

  const lvColor = { INFO: t.blue, WARN: t.amber, ERROR: t.red };

  return (
    <div style={{ height, background: t.bgPanel, borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "relative" }}>
      <div
        onMouseDown={onResize}
        style={{ height: 4, cursor: "ns-resize", position: "absolute", top: 0, left: 0, right: 0, zIndex: 5 }}
        onMouseEnter={e => e.currentTarget.style.background = t.blue}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      />
      <PanelHeader
        icon="≡"
        title="Output Console"
        subtitle={`${activeTxn} parse log · ${logs.length} entries`}
        right={
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <Badge color={t.red}   bg={t.redDim}>2 ERR</Badge>
            <Badge color={t.amber} bg={t.amberDim}>2 WARN</Badge>
            <IconBtn icon="×" title="Close console" onClick={onClose} sm />
          </div>
        }
      />
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, lineHeight: 1.9 }}>
        {logs.map((log, i) => (
          <div key={i} style={{ display:"flex", gap:12 }}>
            <span style={{ color: t.textDisabled, flexShrink: 0 }}>{log.ts}</span>
            <span style={{ width: 40, flexShrink: 0, fontWeight: 700, color: lvColor[log.lv] }}>{log.lv}</span>
            <span style={{ color: log.lv === "ERROR" ? t.red+"CC" : log.lv === "WARN" ? t.amber+"CC" : t.textSecondary }}>{log.msg}</span>
          </div>
        ))}
        <div style={{ display:"flex", gap:12 }}>
          <span style={{ color: t.textDisabled }}>14:30:01.290</span>
          <span style={{ width:40, flexShrink:0 }} />
          <span style={{ color: t.blue }}>▌</span>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 11 · RIGHT PANEL — JSON VIEWER
// ════════════════════════════════════════════════════════════════

const JsonNode = ({ k, value, depth = 0, t }) => {
  const [open, setOpen] = useState(depth < 2);
  const isObj = typeof value === "object" && value !== null && !Array.isArray(value);
  const isArr = Array.isArray(value);
  const indent = depth * 14;

  if (isObj || isArr) {
    const entries = isObj ? Object.entries(value) : value.map((v, i) => [i, v]);
    const [o, c] = isArr ? ["[", "]"] : ["{", "}"];
    return (
      <div>
        <div
          onClick={() => setOpen(x => !x)}
          style={{ display:"flex", alignItems:"center", gap:5, paddingLeft:indent, cursor:"pointer", paddingTop:1, paddingBottom:1, borderRadius:4 }}
          onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ fontSize:8.5, color:t.textMuted, width:10, display:"inline-block", transition:"transform 0.15s", transform:open?"rotate(90deg)":"none" }}>▶</span>
          {k !== null && <span style={{ color:t.purple }}>&quot;{k}&quot;</span>}
          {k !== null && <span style={{ color:t.textMuted }}>: </span>}
          <span style={{ color:t.textMuted }}>{o}</span>
          {!open && <span style={{ color:t.textDisabled, fontStyle:"italic" }}> {isArr ? `${value.length} items` : `${entries.length} keys`} </span>}
          {!open && <span style={{ color:t.textMuted }}>{c}</span>}
        </div>
        {open && (
          <>
            {entries.map(([ek, ev]) => <JsonNode key={ek} k={isArr ? null : ek} value={ev} depth={depth+1} t={t} />)}
            <div style={{ paddingLeft:indent, color:t.textMuted, fontFamily:"'JetBrains Mono',monospace", fontSize:11.5 }}>{c}</div>
          </>
        )}
      </div>
    );
  }

  const vc = typeof value==="number" ? t.amber : typeof value==="boolean" ? t.orange : value===null ? t.textMuted : t.green;
  const vd = typeof value==="string" ? `"${value}"` : String(value);
  return (
    <div style={{ paddingLeft:indent+14, paddingTop:1, paddingBottom:1, fontFamily:"'JetBrains Mono',monospace", fontSize:11.5 }}>
      {k !== null && <span style={{ color:t.purple }}>&quot;{k}&quot;</span>}
      {k !== null && <span style={{ color:t.textMuted }}>: </span>}
      <span style={{ color:vc }}>{vd}</span>
    </div>
  );
};

const JsonPanel = ({ activeTxn }) => {
  const { t } = useTh();
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTxn, setSelectedTxn] = useState("837");

  const handleCopy = () => {
    navigator.clipboard?.writeText(JSON.stringify(PARSED_JSON, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <PanelHeader
        icon="{}"
        title="Parsed JSON Output"
        subtitle="837P · 1 claim · 4 service lines"
        right={
          <GhostBtn onClick={handleCopy} style={{ fontSize:11, padding:"4px 10px", color: copied ? t.green : t.textMuted, borderColor: copied ? t.green+"40" : t.border, background: copied ? t.greenDim : "transparent" }}>
            {copied ? "✓ Copied" : "⧉ Copy"}
          </GhostBtn>
        }
      />

      {/* Txn selector */}
      <div style={{ display:"flex", gap:5, padding:"8px 12px", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
        {TXN_TABS.map(tab => (
          <Chip key={tab.id} label={tab.id} color={tab.color} active={selectedTxn===tab.id} onClick={() => setSelectedTxn(tab.id)} />
        ))}
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", background:t.bgRaised, border:`1px solid ${t.border}`, borderRadius:6, fontSize:11 }}>
          <span style={{ color:t.textMuted }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter keys…"
            style={{ background:"none", border:"none", color:t.textPrimary, fontSize:11, width:80, fontFamily:"'DM Sans',sans-serif", outline:"none" }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
        {[
          ["Claims", "1", t.blue],
          ["Svc Lines", "4", t.green],
          ["Total $", "$1,875", t.amber],
          ["Diagnosis", "2", t.purple],
        ].map(([lbl, val, color]) => (
          <div key={lbl} style={{ flex:1, padding:"7px 0", textAlign:"center", borderRight:`1px solid ${t.border}` }}>
            <div style={{ fontSize:13, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
            <div style={{ fontSize:9.5, color:t.textMuted, marginTop:1, textTransform:"uppercase", letterSpacing:0.6 }}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:12, fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, lineHeight:1.8 }}>
        <JsonNode k={null} value={PARSED_JSON} depth={0} t={t} />
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 12 · RIGHT PANEL — VALIDATION PANEL
// ════════════════════════════════════════════════════════════════

const ValidationPanel = ({ onJumpToLine }) => {
  const { t } = useTh();
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const sevIcon  = { error:"✕", warning:"△", info:"ℹ" };
  const sevColor = { error:t.red, warning:t.amber, info:t.blue };
  const sevBg    = { error:t.redDim, warning:t.amberDim, info:t.blueDim };

  const counts = {
    error:   VALIDATION_DATA.filter(e => e.sev==="error").length,
    warning: VALIDATION_DATA.filter(e => e.sev==="warning").length,
    info:    VALIDATION_DATA.filter(e => e.sev==="info").length,
  };
  const filtered = VALIDATION_DATA.filter(e => filter==="all" || e.sev===filter);

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <PanelHeader
        icon="⚠"
        title="Validation Report"
        subtitle={`${counts.error} errors · ${counts.warning} warnings · ${counts.info} info`}
        right={
          <div style={{ display:"flex", gap:4 }}>
            <StatusDot status={counts.error > 0 ? "error" : "success"} />
          </div>
        }
      />

      {/* Summary bar */}
      <div style={{ display:"flex", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
        {[
          ["all", "All", null, VALIDATION_DATA.length],
          ["error", "Errors", t.red, counts.error],
          ["warning", "Warnings", t.amber, counts.warning],
          ["info", "Info", t.blue, counts.info],
        ].map(([id, label, color, count]) => {
          const isActive = filter===id;
          return (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                flex:1, padding:"9px 4px", background:"transparent",
                border:"none", borderBottom:`2px solid ${isActive ? (color||t.blue) : "transparent"}`,
                color: isActive ? (color||t.blue) : t.textMuted,
                fontSize:11.5, fontWeight:600, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
                display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              }}
            >
              <span style={{ fontSize:14, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{count}</span>
              <span style={{ fontSize:9.5, textTransform:"uppercase", letterSpacing:0.6 }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Error list */}
      <div style={{ flex:1, overflowY:"auto", padding:8 }}>
        {filtered.map(err => {
          const isExp = expanded===err.id;
          return (
            <div
              key={err.id}
              style={{
                marginBottom:6, borderRadius:9, border:`1px solid ${t.border}`,
                background:t.bgSurface, overflow:"hidden",
                borderLeft:`3px solid ${sevColor[err.sev]}`,
                transition:"all 0.15s", animation:"fadeSlideIn 0.2s ease",
              }}
            >
              {/* Header row */}
              <div
                onClick={() => setExpanded(isExp ? null : err.id)}
                style={{ padding:"9px 12px", cursor:"pointer", display:"flex", alignItems:"flex-start", gap:9 }}
                onMouseEnter={e => e.currentTarget.style.background = t.bgRaised}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize:13, color:sevColor[err.sev], marginTop:1, flexShrink:0 }}>{sevIcon[err.sev]}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                    <Badge color={sevColor[err.sev]} bg={sevBg[err.sev]} style={{ textTransform:"uppercase" }}>{err.sev}</Badge>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:t.textSecondary }}>Line {err.line}</span>
                    <span style={{ padding:"1px 6px", borderRadius:4, background:t.bgRaised, border:`1px solid ${t.border}`, fontSize:10.5, fontFamily:"'JetBrains Mono',monospace", color:t.textSecondary }}>{err.seg}</span>
                    <span style={{ marginLeft:"auto", fontSize:9.5, fontFamily:"'JetBrains Mono',monospace", color:t.textMuted }}>{err.code}</span>
                  </div>
                  <div style={{ fontSize:12, color:t.textPrimary, lineHeight:1.5 }}>{err.message}</div>
                </div>
                <span style={{ fontSize:10, color:t.textMuted, transform:isExp?"rotate(90deg)":"none", transition:"transform 0.15s", flexShrink:0 }}>›</span>
              </div>

              {/* Expanded actions */}
              {isExp && (
                <div style={{ padding:"0 12px 10px 34px", borderTop:`1px solid ${t.borderFaint}`, background:t.bgRaised }}>
                  <div style={{ display:"flex", gap:6, marginTop:8, alignItems:"center" }}>
                    <span style={{ fontSize:10, color:t.teal, fontFamily:"'JetBrains Mono',monospace" }}>Field: {err.field}</span>
                    <span style={{ color:t.border }}>·</span>
                    <button
                      onClick={() => { onJumpToLine(err.line); setExpanded(null); }}
                      style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:6, background:t.blueDim, border:`1px solid ${t.blue}40`, color:t.blue, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}
                    >
                      Jump to Line {err.line} →
                    </button>
                    <button style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:6, background:t.bgSurface, border:`1px solid ${t.border}`, color:t.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                      View Rule
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{ padding:"8px 12px", borderTop:`1px solid ${t.border}`, background:t.bgSurface, flexShrink:0 }}>
        <div style={{ fontSize:11, color:t.textMuted, textAlign:"center" }}>
          Click any error to expand · Click "Jump to Line" to navigate editor
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 13 · RIGHT PANEL — TREE VIEW
// ════════════════════════════════════════════════════════════════

const TreeNodeItem = ({ node, depth, t }) => {
  const [open, setOpen] = useState(depth < 3);
  const hasKids = node.children?.length > 0;
  const tagColors = {
    ISA:t.segISA, IEA:t.segISA, GS:t.segGS, GE:t.segGS,
    ST:t.segST, SE:t.segSE, CLM:t.segCLM, NM1:t.segNM1,
    HL:t.segHL, BHT:t.teal, DTP:t.segDTP, HI:t.segHI,
    SV1:t.segSV1, REF:t.segREF, PRV:t.textSecondary,
  };
  const mainTag = node.tag.split("*")[0].replace("Loop ","LOOP");
  const color = tagColors[mainTag] || t.orange;

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div
        onClick={() => hasKids && setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 10px", borderRadius:7, cursor:hasKids?"pointer":"default" }}
        onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {hasKids ? (
          <span style={{ fontSize:8, color:t.textMuted, transition:"transform 0.15s", transform:open?"rotate(90deg)":"none", display:"inline-block", width:10, flexShrink:0 }}>▶</span>
        ) : (
          <span style={{ width:10, display:"inline-block", flexShrink:0 }} />
        )}
        <span style={{ padding:"1px 7px", borderRadius:5, fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", background:`${color}18`, color, border:`1px solid ${color}28`, flexShrink:0, whiteSpace:"nowrap" }}>
          {node.tag}
        </span>
        <span style={{ fontSize:12, color:t.textSecondary, flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{node.desc}</span>
        {node.count && (
          <span style={{ fontSize:10, color:t.textMuted, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>{node.count}</span>
        )}
      </div>
      {open && hasKids && node.children.map(child => (
        <TreeNodeItem key={child.id} node={child} depth={depth+1} t={t} />
      ))}
    </div>
  );
};

const TreePanel = ({ activeTxn }) => {
  const { t } = useTh();
  const segStats = [
    ["ISA/IEA",2,t.segISA], ["GS/GE",2,t.segGS], ["ST/SE",2,t.segST],
    ["CLM",1,t.segCLM],     ["NM1",5,t.segNM1],   ["SV1",4,t.segSV1],
    ["HI",1,t.segHI],       ["REF",4,t.segREF],    ["HL",2,t.segHL],
    ["DTP",5,t.segDTP],     ["PRV",2,t.textSecondary], ["LX",4,t.purple],
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <PanelHeader
        icon="⋮"
        title="Segment Hierarchy"
        subtitle={`${activeTxn} · Loop structure`}
        right={<Badge color={TXN_TABS.find(x=>x.id===activeTxn)?.color}>{activeTxn}</Badge>}
      />

      {/* Legend */}
      <div style={{ padding:"8px 12px", borderBottom:`1px solid ${t.border}`, display:"flex", flexWrap:"wrap", gap:4, flexShrink:0 }}>
        {[["ISA/GS",t.segISA],["ST",t.segST],["NM1",t.segNM1],["CLM",t.segCLM],["SV1",t.segSV1],["Loop",t.orange]].map(([l,c]) => (
          <span key={l} style={{ padding:"2px 8px", borderRadius:4, fontSize:9.5, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", background:`${c}15`, color:c, border:`1px solid ${c}25` }}>{l}</span>
        ))}
      </div>

      {/* Tree */}
      <div style={{ flex:1, overflowY:"auto", padding:"6px 4px" }}>
        <TreeNodeItem node={EDI_TREE} depth={0} t={t} />
      </div>

      {/* Segment count grid */}
      <div style={{ borderTop:`1px solid ${t.border}`, padding:10, flexShrink:0 }}>
        <div style={{ fontSize:9.5, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:7 }}>Segment Summary</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4 }}>
          {segStats.map(([seg,count,color]) => (
            <div key={seg} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"3px 8px", borderRadius:5, background:t.bgSurface, border:`1px solid ${t.borderFaint}` }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color }}>{seg}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:t.textSecondary, fontWeight:700 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 14 · UPLOAD DROP ZONE
// ════════════════════════════════════════════════════════════════

const DropZone = ({ onLoad }) => {
  const { t } = useTh();
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const recent = HISTORY_DATA.slice(0,3);

  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:t.bg, padding:40 }}>
      <div style={{ width:"100%", maxWidth:560, display:"flex", flexDirection:"column", gap:24 }}>

        {/* Drop area */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); onLoad(); }}
          style={{
            border:`2px dashed ${drag ? t.blue : t.border}`,
            borderRadius:16, padding:"52px 40px",
            display:"flex", flexDirection:"column", alignItems:"center", gap:20,
            cursor:"pointer", textAlign:"center",
            background: drag ? t.blueDim : t.bgSurface,
            boxShadow: drag ? `0 0 32px ${t.blue}25` : "none",
            transition:"all 0.25s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=t.blue; e.currentTarget.style.background=t.bgRaised; }}
          onMouseLeave={e => { if(!drag){e.currentTarget.style.borderColor=t.border; e.currentTarget.style.background=t.bgSurface;} }}
        >
          <div style={{ width:72, height:72, borderRadius:18, background:`linear-gradient(135deg, ${t.blue}20, ${t.purple}20)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, border:`1px solid ${t.blue}30` }}>⬆</div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:t.textPrimary, marginBottom:8 }}>Drop your EDI file here</div>
            <div style={{ color:t.textMuted, fontSize:13.5, lineHeight:1.7 }}>
              Drag & drop or click to browse your filesystem<br/>
              Supports all HIPAA X12 5010 transaction sets
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
            {[["837P",t.blue],["837I",t.blue],["837D",t.blue],["835",t.purple],["834",t.teal],[".EDI",t.green],[".TXT",t.green]].map(([tag,color])=>(
              <span key={tag} style={{ padding:"3px 11px", borderRadius:20, fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", background:`${color}15`, color, border:`1px solid ${color}30` }}>{tag}</span>
            ))}
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <PrimaryBtn onClick={e => { e.stopPropagation(); inputRef.current?.click(); }} icon="⬆">
              Browse Files
              <Kbd>⌃O</Kbd>
            </PrimaryBtn>
            <span style={{ fontSize:12, color:t.textMuted }}>or drag and drop</span>
          </div>
        </div>
        <input ref={inputRef} type="file" style={{ display:"none" }} accept=".edi,.txt" onChange={onLoad} />

        {/* Recent files */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:t.textMuted, marginBottom:10 }}>Recent Files</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {recent.map(f => (
              <div
                key={f.id}
                onClick={onLoad}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, cursor:"pointer", background:t.bgPanel, border:`1px solid ${t.border}`, transition:"all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background=t.bgRaised; e.currentTarget.style.borderColor=t.blue+"44"; }}
                onMouseLeave={e => { e.currentTarget.style.background=t.bgPanel; e.currentTarget.style.borderColor=t.border; }}
              >
                <span style={{ fontSize:18 }}>◻</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, color:t.textPrimary, fontFamily:"'JetBrains Mono',monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                  <div style={{ fontSize:10.5, color:t.textMuted, marginTop:2 }}>{f.size} · {f.lines} lines · {f.date}</div>
                </div>
                <Badge color={f.type==="837"?t.blue:f.type==="835"?t.purple:t.teal}>{f.type}</Badge>
                <StatusDot status={f.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 15 · DASHBOARD VIEW
// ════════════════════════════════════════════════════════════════

const DashboardView = ({ onNavigate }) => {
  const { t } = useTh();

  const StatCard = ({ label, value, sub, color, icon }) => {
    const [hov, setHov] = useState(false);
    return (
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ padding:"18px 20px", borderRadius:12, background:t.bgPanel, border:`1px solid ${hov ? color+"44" : t.border}`, transition:"all 0.2s", boxShadow:hov?`0 4px 20px ${color}18`:t.shadowSm }}
      >
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, border:`1px solid ${color}25` }}>{icon}</div>
          <StatusDot status={color===t.red?"error":color===t.amber?"warning":"success"} />
        </div>
        <div style={{ fontSize:28, fontWeight:800, color, fontFamily:"'Syne',sans-serif", letterSpacing:-1 }}>{value}</div>
        <div style={{ fontSize:13, color:t.textPrimary, fontWeight:600, marginTop:4 }}>{label}</div>
        <div style={{ fontSize:11.5, color:t.textMuted, marginTop:2 }}>{sub}</div>
      </div>
    );
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:28, background:t.bg }}>
      <div style={{ maxWidth:900 }}>
        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:t.textPrimary, letterSpacing:-0.5 }}>Dashboard</div>
          <div style={{ fontSize:13.5, color:t.textMuted, marginTop:4 }}>X12 EDI parsing & validation overview · Updated just now</div>
        </div>

        {/* Stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
          <StatCard label="Files Processed" value="24"  sub="This month"   color={t.blue}   icon="◻" />
          <StatCard label="Validation Errors" value="8"   sub="Across 3 files" color={t.red}    icon="⚠" />
          <StatCard label="Claims Parsed" value="312" sub="837P transactions" color={t.green}  icon="◫" />
          <StatCard label="Total Billed" value="$48.2K" sub="837 charge total" color={t.amber}  icon="💰" />
        </div>

        {/* Recent activity */}
        <div style={{ background:t.bgPanel, borderRadius:12, border:`1px solid ${t.border}`, overflow:"hidden", marginBottom:20 }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:14, fontWeight:700, color:t.textPrimary }}>Recent Files</div>
            <GhostBtn onClick={() => onNavigate("history")} style={{ fontSize:11.5 }}>View All →</GhostBtn>
          </div>
          {HISTORY_DATA.map((f,i) => (
            <div
              key={f.id}
              onClick={() => onNavigate("parser")}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 18px", borderBottom:i<HISTORY_DATA.length-1?`1px solid ${t.borderFaint}`:"none", cursor:"pointer", transition:"background 0.12s" }}
              onMouseEnter={e => e.currentTarget.style.background=t.bgHover}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <div style={{ width:36, height:36, borderRadius:8, background:t.bgRaised, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>◻</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:t.textPrimary, fontFamily:"'JetBrains Mono',monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                <div style={{ fontSize:11, color:t.textMuted, marginTop:2 }}>{f.size} · {f.lines} segments · {f.date}</div>
              </div>
              <Badge color={f.type==="837"?t.blue:f.type==="835"?t.purple:t.teal}>{f.type}</Badge>
              <div style={{ display:"flex", gap:5 }}>
                {f.errors>0 && <Badge color={t.red} bg={t.redDim}>✕ {f.errors}</Badge>}
                {f.warnings>0 && <Badge color={t.amber} bg={t.amberDim}>△ {f.warnings}</Badge>}
                {f.errors===0&&f.warnings===0 && <Badge color={t.green} bg={t.greenDim}>✓ Clean</Badge>}
              </div>
              <StatusDot status={f.status} />
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {[
            { title:"Upload New File",    sub:"Parse 837, 835, or 834",  icon:"⬆", color:t.blue,   nav:"upload" },
            { title:"View Parser",        sub:"Browse parsed segments",  icon:"◫", color:t.purple, nav:"parser" },
            { title:"Check Validation",   sub:"Review errors & warnings",icon:"⚠", color:t.amber,  nav:"validation" },
            { title:"File History",       sub:"Browse all past uploads", icon:"🕐",color:t.green,  nav:"history" },
          ].map(qa => (
            <div
              key={qa.nav}
              onClick={() => onNavigate(qa.nav)}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderRadius:12, background:t.bgPanel, border:`1px solid ${t.border}`, cursor:"pointer", transition:"all 0.18s" }}
              onMouseEnter={e => { e.currentTarget.style.background=t.bgRaised; e.currentTarget.style.borderColor=qa.color+"44"; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=`0 4px 16px ${qa.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.background=t.bgPanel; e.currentTarget.style.borderColor=t.border; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
            >
              <div style={{ width:42,height:42,borderRadius:10,background:`${qa.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1px solid ${qa.color}25`,flexShrink:0 }}>{qa.icon}</div>
              <div>
                <div style={{ fontSize:13.5, fontWeight:600, color:t.textPrimary }}>{qa.title}</div>
                <div style={{ fontSize:11.5, color:t.textMuted, marginTop:2 }}>{qa.sub}</div>
              </div>
              <span style={{ marginLeft:"auto", color:t.textMuted, fontSize:16 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 16 · HISTORY VIEW
// ════════════════════════════════════════════════════════════════

const HistoryView = ({ onOpen }) => {
  const { t } = useTh();
  const [searchQ, setSearchQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const filtered = HISTORY_DATA.filter(f =>
    (typeFilter==="all" || f.type===typeFilter) &&
    f.name.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div style={{ flex:1, overflowY:"auto", padding:28, background:t.bg }}>
      <div style={{ maxWidth:900 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:t.textPrimary }}>File History</div>
            <div style={{ fontSize:12.5, color:t.textMuted, marginTop:3 }}>{HISTORY_DATA.length} files processed · All time</div>
          </div>
          <PrimaryBtn icon="⬆" onClick={onOpen}>Upload New</PrimaryBtn>
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 12px", background:t.bgPanel, border:`1px solid ${t.border}`, borderRadius:8, flex:1, maxWidth:280 }}>
            <span style={{ color:t.textMuted }}>🔍</span>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search files…" style={{ background:"none", border:"none", color:t.textPrimary, fontSize:13, flex:1, fontFamily:"'DM Sans',sans-serif", outline:"none" }} />
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {["all","837","835","834"].map(tp => (
              <Chip key={tp} label={tp==="all"?"All Types":tp} color={tp==="837"?t.blue:tp==="835"?t.purple:tp==="834"?t.teal:null} active={typeFilter===tp} onClick={() => setTypeFilter(tp)} />
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background:t.bgPanel, borderRadius:12, border:`1px solid ${t.border}`, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 80px 80px 80px 100px 80px 40px", padding:"10px 16px", borderBottom:`1px solid ${t.border}`, background:t.bgSurface }}>
            {["File Name","Type","Size","Lines","Date","Status",""].map((h,i)=>(
              <div key={i} style={{ fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:t.textMuted }}>{h}</div>
            ))}
          </div>
          {filtered.map((f,i) => (
            <div
              key={f.id}
              onClick={() => onOpen(f.type)}
              style={{ display:"grid", gridTemplateColumns:"2fr 80px 80px 80px 100px 80px 40px", padding:"12px 16px", borderBottom:i<filtered.length-1?`1px solid ${t.borderFaint}`:"none", cursor:"pointer", alignItems:"center", transition:"background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background=t.bgHover}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                <span style={{ fontSize:16 }}>◻</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:t.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
              </div>
              <Badge color={f.type==="837"?t.blue:f.type==="835"?t.purple:t.teal}>{f.type}</Badge>
              <span style={{ fontSize:12, color:t.textSecondary, fontFamily:"'JetBrains Mono',monospace" }}>{f.size}</span>
              <span style={{ fontSize:12, color:t.textSecondary, fontFamily:"'JetBrains Mono',monospace" }}>{f.lines}</span>
              <span style={{ fontSize:11.5, color:t.textMuted }}>{f.date}</span>
              <div style={{ display:"flex", gap:4 }}>
                {f.errors>0 ? <Badge color={t.red} bg={t.redDim}>✕{f.errors}</Badge> : f.warnings>0 ? <Badge color={t.amber} bg={t.amberDim}>△{f.warnings}</Badge> : <Badge color={t.green} bg={t.greenDim}>✓</Badge>}
              </div>
              <span style={{ color:t.textMuted, fontSize:16 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 17 · SETTINGS VIEW
// ════════════════════════════════════════════════════════════════

const SettingsView = () => {
  const { t, dark, setDark } = useTh();
  const [settings, setSettings] = useState({ autoValidate:true, strictMode:false, showLineNums:true, wrapLines:false, fontSize:13, tabSize:4 });
  const toggle = key => setSettings(s => ({ ...s, [key]:!s[key] }));

  const Toggle = ({ label, desc, k }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:`1px solid ${t.borderFaint}` }}>
      <div>
        <div style={{ fontSize:13.5, color:t.textPrimary, fontWeight:500 }}>{label}</div>
        <div style={{ fontSize:11.5, color:t.textMuted, marginTop:2 }}>{desc}</div>
      </div>
      <div onClick={() => toggle(k)} style={{ width:44, height:24, borderRadius:12, background:settings[k]?t.blue:t.bgRaised, border:`1px solid ${settings[k]?t.blue+"60":t.border}`, position:"relative", cursor:"pointer", transition:"all 0.25s" }}>
        <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:settings[k]?22:2, transition:"left 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }} />
      </div>
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ background:t.bgPanel, borderRadius:12, border:`1px solid ${t.border}`, overflow:"hidden", marginBottom:18 }}>
      <div style={{ padding:"12px 18px", borderBottom:`1px solid ${t.border}`, background:t.bgSurface }}>
        <div style={{ fontSize:13, fontWeight:700, color:t.textPrimary }}>{title}</div>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:"auto", padding:28, background:t.bg }}>
      <div style={{ maxWidth:640 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:t.textPrimary, marginBottom:6 }}>Settings</div>
        <div style={{ fontSize:12.5, color:t.textMuted, marginBottom:24 }}>Configure EDI Studio preferences and parser behavior</div>

        <Section title="Appearance">
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${t.borderFaint}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:13.5, color:t.textPrimary, fontWeight:500 }}>Theme</div>
              <div style={{ fontSize:11.5, color:t.textMuted, marginTop:2 }}>Choose your preferred color scheme</div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {[["Dark","dark"],["Light","light"]].map(([label, val]) => (
                <button key={val} onClick={() => setDark(val==="dark")} style={{ padding:"6px 16px", borderRadius:8, background:(dark&&val==="dark")||(!dark&&val==="light")?t.blueDim:"transparent", border:`1px solid ${(dark&&val==="dark")||(!dark&&val==="light")?t.blue+"50":t.border}`, color:(dark&&val==="dark")||(!dark&&val==="light")?t.blue:t.textMuted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${t.borderFaint}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:13.5, color:t.textPrimary, fontWeight:500 }}>Editor Font Size</div>
              <div style={{ fontSize:11.5, color:t.textMuted, marginTop:2 }}>Monospace font size in the EDI editor</div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {[11,12,13,14].map(sz => (
                <button key={sz} onClick={() => setSettings(s=>({...s,fontSize:sz}))} style={{ width:36,height:32,borderRadius:7,background:settings.fontSize===sz?t.blueDim:"transparent",border:`1px solid ${settings.fontSize===sz?t.blue+"50":t.border}`,color:settings.fontSize===sz?t.blue:t.textMuted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace" }}>{sz}</button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Parser Behavior">
          <Toggle label="Auto-Validate on Load" desc="Run validation immediately after parsing an EDI file" k="autoValidate" />
          <Toggle label="Strict HIPAA Mode" desc="Enforce all HIPAA 5010 companion guide rules" k="strictMode" />
          <Toggle label="Show Line Numbers" desc="Display line numbers in the EDI editor" k="showLineNums" />
          <Toggle label="Wrap Long Lines" desc="Wrap lines that exceed the editor width" k="wrapLines" />
        </Section>

        <Section title="Supported Transactions">
          {[["837P","Professional Claim","005010X222A1",t.blue],["837I","Institutional Claim","005010X223A2",t.blue],["835","Payment Remittance","005010X221A1",t.purple],["834","Benefit Enrollment","005010X220A1",t.teal]].map(([code,name,ver,color])=>(
            <div key={code} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 18px",borderBottom:`1px solid ${t.borderFaint}` }}>
              <Badge color={color} bg={`${color}18`} style={{ fontSize:11 }}>{code}</Badge>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:t.textPrimary }}>{name}</div>
                <div style={{ fontSize:11, color:t.textMuted, fontFamily:"'JetBrains Mono',monospace", marginTop:1 }}>{ver}</div>
              </div>
              <StatusDot status="success" />
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 18 · STATUS BAR (BOTTOM)
// ════════════════════════════════════════════════════════════════

const StatusBar = ({ activeTxn, lineCount, errCount, warnCount, highlightedLine }) => {
  const { t } = useTh();
  const txn = TXN_TABS.find(x => x.id === activeTxn);
  return (
    <div style={{
      height: 24, background: t.blue, display: "flex", alignItems: "center",
      padding: "0 12px", gap: 16, flexShrink: 0,
    }}>
      {[
        [`⊞ ${activeTxn} — 005010X${activeTxn==="837"?"222A1":activeTxn==="835"?"221A1":"220A1"}`, null],
        [`✕ ${errCount} errors`, null],
        [`△ ${warnCount} warnings`, null],
        [highlightedLine ? `Ln ${highlightedLine}` : `${lineCount} lines`, null],
        ["EDI X12 · UTF-8", null],
        ["Ready", null],
      ].map(([label], i) => (
        <span key={i} style={{ fontSize:11, color:"rgba(255,255,255,0.85)", fontFamily:"'JetBrains Mono',monospace", whiteSpace:"nowrap" }}>{label}</span>
      ))}
      <span style={{ flex:1 }} />
      <span style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontFamily:"'JetBrains Mono',monospace" }}>EDI Studio v2.0</span>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 19 · RIGHT PANEL CONTAINER (tabs wrapper)
// ════════════════════════════════════════════════════════════════

const RightPanelTabs = ["json","validation","tree"];
const RightPanelLabels = { json:"JSON", validation:"Validation", tree:"Tree" };
const RightPanelIcons  = { json:"{}", validation:"⚠", tree:"⋮" };

const RightPanel = ({ width, onResize, activeTxn, onJumpToLine, errCount }) => {
  const { t } = useTh();
  const [tab, setTab] = useState("json");

  return (
    <div style={{ width, flexShrink:0, display:"flex", flexDirection:"column", overflow:"hidden", background:t.bgPanel, position:"relative" }}>
      {/* Resize handle */}
      <div
        onMouseDown={onResize}
        style={{ width:4, cursor:"col-resize", position:"absolute", left:0, top:0, bottom:0, zIndex:10 }}
        onMouseEnter={e => e.currentTarget.style.background=t.blue}
        onMouseLeave={e => e.currentTarget.style.background="transparent"}
      />

      {/* Tab header */}
      <div style={{ display:"flex", borderBottom:`1px solid ${t.border}`, background:t.bgPanel, flexShrink:0 }}>
        {RightPanelTabs.map(id => {
          const isActive = tab===id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex:1, height:40, display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                background: isActive ? t.bgSurface : "transparent",
                color: isActive ? t.textPrimary : t.textMuted,
                borderBottom: `2px solid ${isActive ? t.blue : "transparent"}`,
                border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
              }}
              onMouseEnter={e => { if(!isActive) e.currentTarget.style.background=t.bgHover; }}
              onMouseLeave={e => { if(!isActive) e.currentTarget.style.background="transparent"; }}
            >
              <span style={{ fontSize:13 }}>{RightPanelIcons[id]}</span>
              {RightPanelLabels[id]}
              {id==="validation" && errCount>0 && (
                <span style={{ padding:"0px 5px", borderRadius:10, background:t.redDim, color:t.red, fontSize:9.5, fontWeight:700 }}>{errCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {tab==="json"       && <JsonPanel activeTxn={activeTxn} />}
        {tab==="validation" && <ValidationPanel onJumpToLine={onJumpToLine} />}
        {tab==="tree"       && <TreePanel activeTxn={activeTxn} />}
      </div>

      {/* Footer */}
      <div style={{ padding:"8px 12px", borderTop:`1px solid ${t.border}`, background:t.bgSurface, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:t.textSecondary }}>
              {TXN_TABS.find(x=>x.id===activeTxn)?.label}
            </div>
            <div style={{ display:"flex", gap:8, marginTop:2, fontSize:10.5 }}>
              {errCount>0
                ? <span style={{ color:t.red }}>✕ {errCount} errors</span>
                : <span style={{ color:t.green }}>✓ No errors</span>
              }
              <span style={{ color:t.textDisabled }}>·</span>
              <span style={{ color:t.textMuted }}>{SAMPLES[activeTxn]?.split("\n").filter(Boolean).length} segments</span>
            </div>
          </div>
          <GhostBtn style={{ fontSize:11 }}>⬇ Export</GhostBtn>
        </div>
        {/* Validation progress */}
        <div style={{ marginTop:8, height:3, background:t.border, borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.round((1-errCount/VALIDATION_DATA.length)*100)}%`, background:`linear-gradient(90deg, ${t.blue}, ${t.teal})`, borderRadius:2, transition:"width 0.4s ease" }} />
        </div>
        <div style={{ marginTop:4, fontSize:9.5, color:t.textDisabled, textAlign:"right" }}>
          {Math.round((1-errCount/VALIDATION_DATA.length)*100)}% passing
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  SECTION 20 · ROOT APP COMPONENT
// ════════════════════════════════════════════════════════════════

export default function EDIStudio() {
  const [dark, setDark]         = useState(true);
  const t = dark ? DARK_THEME : LIGHT_THEME;

  const [nav, setNav]           = useState("dashboard");
  const [sidebarExp, setSidebarExp] = useState(false);
  const [activeTxn, setActiveTxn]   = useState("837");
  const [hasFile, setHasFile]       = useState(true);
  const [highlightedLine, setHL]    = useState(null);
  const [showConsole, setShowCon]   = useState(true);

  const [rightW, setRightW]     = useState(388);
  const [consoleH, setConsH]    = useState(170);
  const resizingRight  = useRef(false);
  const resizingBottom = useRef(false);

  const sidebarW = sidebarExp ? 220 : 52;

  // Error/line data
  const ediLines     = SAMPLES[activeTxn]?.split("\n").filter(Boolean) || [];
  const errorLines   = new Set(VALIDATION_DATA.map(e => e.line));
  const errCount     = VALIDATION_DATA.filter(e => e.sev==="error").length;
  const warnCount    = VALIDATION_DATA.filter(e => e.sev==="warning").length;

  // Keyboard shortcut ⌃O
  useEffect(() => {
    const h = e => {
      if ((e.ctrlKey||e.metaKey) && e.key==="o") { e.preventDefault(); setNav("upload"); setHasFile(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Panel resize
  useEffect(() => {
    const onMove = e => {
      if (resizingRight.current) setRightW(Math.max(280, Math.min(640, window.innerWidth - e.clientX)));
      if (resizingBottom.current) setConsH(Math.max(90, Math.min(400, window.innerHeight - e.clientY)));
    };
    const onUp = () => { resizingRight.current=false; resizingBottom.current=false; document.body.style.cursor=""; document.body.style.userSelect=""; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const handleUpload = (txnType) => {
    setHasFile(true);
    setNav("parser");
    if (typeof txnType === "string" && ["837","835","834"].includes(txnType)) setActiveTxn(txnType);
  };

  const showParserView = nav === "parser" || nav === "validation";

  return (
    <ThemeCtx.Provider value={{ t, dark, setDark }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{height:100%;overflow:hidden;background:${t.bg};}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${t.border};border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:${t.textMuted};}
        input,button{font-family:'DM Sans',sans-serif;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <div style={{
        display: "grid",
        gridTemplateRows: "48px 1fr 24px",
        gridTemplateColumns: `${sidebarW}px 1fr`,
        height: "100vh", overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
        background: t.bg, color: t.textPrimary,
        transition: "grid-template-columns 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}>

        {/* ─── TOP NAVBAR (spans full width) ─── */}
        <div style={{ gridColumn:"1/-1", gridRow:1 }}>
          <TopNavbar
            sidebarW={sidebarW}
            activeTxn={activeTxn}
            dark={dark}
            setDark={setDark}
            onUpload={() => { setNav("upload"); setHasFile(false); }}
            hasFile={hasFile && showParserView}
          />
        </div>

        {/* ─── SIDEBAR ─── */}
        <div
          style={{ gridRow:2, gridColumn:1 }}
          onMouseEnter={() => setSidebarExp(true)}
          onMouseLeave={() => setSidebarExp(false)}
        >
          <Sidebar active={nav} setActive={v => { setNav(v); if (v==="parser"&&!hasFile) setHasFile(true); }} expanded={sidebarExp} />
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div style={{ gridRow:2, gridColumn:2, display:"flex", overflow:"hidden", minWidth:0 }}>

          {/* Dashboard */}
          {nav==="dashboard" && (
            <DashboardView onNavigate={v => { setNav(v); if(v==="parser"&&!hasFile)setHasFile(true); }} />
          )}

          {/* Upload */}
          {nav==="upload" && (
            <DropZone onLoad={handleUpload} />
          )}

          {/* History */}
          {nav==="history" && (
            <HistoryView onOpen={txnType => handleUpload(txnType)} />
          )}

          {/* Settings */}
          {nav==="settings" && (
            <SettingsView />
          )}

          {/* Parser / Validation — Editor layout */}
          {showParserView && (
            <div style={{ flex:1, display:"flex", overflow:"hidden", minWidth:0 }}>

              {/* Center editor column */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0, borderRight:`1px solid ${t.border}` }}>

                <EditorTabBar
                  activeTxn={activeTxn}
                  setActiveTxn={txn => { setActiveTxn(txn); setHL(null); }}
                  onClose={() => { setNav("upload"); setHasFile(false); }}
                  errorCounts={{ error:errCount, warning:warnCount }}
                  lineCount={ediLines.length}
                  showConsole={showConsole}
                  setShowConsole={setShowCon}
                />

                {hasFile ? (
                  <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
                    <EditorPanel
                      activeTxn={activeTxn}
                      highlightedLine={highlightedLine}
                      setHighlightedLine={setHL}
                      errorLineSet={errorLines}
                    />
                    {showConsole && (
                      <ConsolePanel
                        height={consoleH}
                        onResize={() => { resizingBottom.current=true; document.body.style.cursor="ns-resize"; document.body.style.userSelect="none"; }}
                        onClose={() => setShowCon(false)}
                        activeTxn={activeTxn}
                      />
                    )}
                  </div>
                ) : (
                  <DropZone onLoad={handleUpload} />
                )}
              </div>

              {/* Right panel */}
              <RightPanel
                width={rightW}
                onResize={() => { resizingRight.current=true; document.body.style.cursor="col-resize"; document.body.style.userSelect="none"; }}
                activeTxn={activeTxn}
                onJumpToLine={ln => { setHL(ln); setNav("parser"); }}
                errCount={errCount}
              />
            </div>
          )}
        </div>

        {/* ─── STATUS BAR ─── */}
        <div style={{ gridColumn:"1/-1", gridRow:3 }}>
          <StatusBar
            activeTxn={activeTxn}
            lineCount={ediLines.length}
            errCount={errCount}
            warnCount={warnCount}
            highlightedLine={highlightedLine}
          />
        </div>

      </div>
    </ThemeCtx.Provider>
  );
}