# JANJATIYA VIDYA SETU (JVS)

> **"Policy-to-Workflow Intelligence Platform for MoTA Scholarships & Fellowships"**  
> *Ministry of Tribal Affairs (MoTA), Government of India*  
> **Core:** POLICY → PROOF → PROCESS

---

## 1. Executive Summary

**Janjatiya Vidya Setu (JVS)** is an enterprise scholarship and fellowship management platform for Scheduled Tribe students across India and abroad.

Traditional scholarship portals require weeks of engineering and custom code rewrites for every new scheme circular or guideline revision. JVS eliminates this with its central paradigm:

> **"NEW SCHEME ≠ NEW PORTAL"**  
> **"NEW SCHEME = NEW CONFIGURATION"**

Approved government policies and regulations are converted by the **Policy-to-Workflow Compiler** into machine-executable schema configurations that dynamically drive the entire lifecycle:
`Policy` → `Dynamic Application` → `PRAMAAN Dual-Path Verification` → `Explainable Deficiency` → `Committee Scrutiny` → `Selection Award` → `Post-Selection Milestones` → `Tamper-Evident Audit Trail`.

---

## 2. Official Primary MoTA Schemes Implemented

1. **NFST — National Fellowship for Higher Education of ST Students**:
   - Central Sector Scheme (100% GoI funded) for M.Phil and Ph.D research.
   - **750 fresh fellowships annually**.
   - **No Income Ceiling** (Clause 2.2).
   - **Age limit**: Max 36 years as of 1st July of selection year.
   - **Statutory Quota Distribution**:
     * Priority 1: Divyangjan (5% = 38 slots, min 40% certified disability)
     * Priority 2: PVTG (Particularly Vulnerable Tribal Groups = 25 slots)
     * Priority 3: Female ST Scholars (30% = 225 slots)
     * Priority 4: ST General / Open Merit (462 slots)
     * Direct priority for candidates with admission offers in IITs/AIIMS/IIMs/IISER.
   - **Award Rate**: M.Phil ₹31,000/mo + contingency; Ph.D ₹31,000/mo (first 2 yrs) / ₹35,000/mo (next 3 yrs) + contingency + HRA + Escort allowance.

2. **NOS — National Overseas Scholarship for ST Students**:
   - Central Sector Scheme for Masters, Ph.D, and Post-Doctoral research abroad.
   - **20 awards annually** (STEM: 10, Management/Law: 4, Agriculture/Medicine: 4, Humanities: 2).
   - Foreign institution must rank within **Top 1,000 QS World Ranking**.
   - **Gross Family Income Ceiling**: ₹6,00,000/- per annum.
   - **Award Rate**: USD 15,400 (US) / GBP 9,900 (UK) maintenance allowance + tuition fee + airfare + visa.

3. **Pre-Matric Scholarship for ST Students (Classes IX & X)**:
   - Centrally Sponsored Scheme (75:25 general, 90:10 North East/Hilly).
   - Family income ceiling: ₹2,50,000/- per annum.
   - Day Scholars ₹225/mo + ₹750 books grant; Hostelers ₹525/mo + ₹1,000 books grant.

4. **Post-Matric Scholarship for ST Students**:
   - Centrally Sponsored Scheme from Class XI to Post Graduation.
   - Family income ceiling: ₹2,50,000/- per annum.
   - Groups I to IV stipend and fee reimbursement rates.

---

## 3. Core Architecture & Subsystems

### A. Policy-to-Workflow Compiler (AI-Assisted + Human Validation)
- Ingests raw government guidelines (PDF or gazette text).
- AI extraction (powered by Gemini 3.8 Flash with deterministic offline fallback) compiles raw text into structured JSON:
  * `eligibilityRules`: min marks, age limits, income caps, quota earmarks.
  * `applicationFields`: dynamic form definitions grouped by section (Personal, Academic, Category, Bank, Overseas).
  * `documentRequirements`: required file types, allowed MIME types, max sizes.
  * `verificationRules`: cross-document validation rules and tolerances.
  * `workflowStages`: status transitions and SLA definitions.
  * `selectionCriteria`: priority weights and quota categories.
  * `postSelectionMilestones`: quarterly continuation certs, thesis uploads.
- **Human-in-the-Loop Governance**: AI never autonomously publishes policies. Authorized officers validate, edit, approve, and publish.
- **Version Immutability**: Published policy versions are locked to ensure judicial audit compliance for historic applications.

### B. Dynamic Application Engine
- No hardcoded forms.
- Form fields, sections, validations, and document requirements are dynamically generated on-the-fly from the published policy version selected by the candidate.

### C. PRAMAAN Dual-Path Verification Engine
- **Path A (Evidence)**: OCR field extraction cross-checked against applicant inputs (Name fuzzy matching, marks threshold verification, age compliance, income caps).
- **Path B (Credential Adapters)**:
  * UIDAI Aadhaar CIDR gateway adapter (Aadhaar demographic matching).
  * PFMS NPCI Bank Account bridge adapter (Aadhaar-seeded CBS account validation for DBT).
  * AISHE / UGC regulatory directory adapter (Institute affiliation & recognition).

### D. Explainable Deficiency Engine
Eliminates opaque "Rejected" statuses by structuring every defect:
- **WHAT**: Precise discrepancy statement.
- **WHY**: Exact clause reference from the published scheme policy.
- **ACTION**: Concrete corrective instruction for the candidate.
- Resubmission workflow with immediate re-verification queueing.

### E. Scrutiny Workbench & Selection Studio
- Committee review bench with priority criteria verification (IIT/AIIMS offer priority, Divyangjan 5% quota, PVTG slots, Female earmarking).
- Formal sanction order generation and authentic Award Letter Reference creation (`MOTA/JVS/AWARD/...`).

### F. Post-Selection Fellowship Milestone Tracker
- University Joining Report & Registrar NoC.
- PFMS Beneficiary ID & Aadhaar bridge linking.
- Quarterly continuation certificates (Q1 10 July, Q2 10 Oct, Q3 10 Jan, Q4 10 April).
- Annual Research Progress Report & Thesis upload to the Tribal Repository (`repository.tribal.gov.in`).

### G. Tamper-Evident SHA-256 Audit Trail
- Cryptographic hash chain:
  $$\text{Block Hash } H_n = \text{SHA256}(H_{n-1} + \text{Event Payload})$$
- Every action, policy publication, document upload, verification, and award decision is hashed.
- Interactive cryptographic integrity audit utility re-verifies the entire chain from Genesis block $H_0$ to $H_n$.
- Built-in "Simulate Tamper Attack" test demonstrably proves that illegal payload modification is detected immediately.

---

## 4. Role-Based Access Control (RBAC) & Demo Personas

The system features real role-based permissions with switchable personas:

| Persona Name | Role | Access Scope |
|---|---|---|
| **Rahul Kumar Munda** (`adityapathak6262@gmail.com`) | `STUDENT` | Application Wizard, Document Vault, Explainable Deficiency Resubmission, Timeline, Grievances |
| **Ananya Soren (Divyangjan)** | `STUDENT` | Selected Scholar, Award Letter, Post-Selection Fellowship Milestones & Quarterly Continuation |
| **Dr. K. Raman** | `INSTITUTION_VERIFIER` | Institute Nodal Officer (INO) Queue, PRAMAAN Inspector, Issue Deficiency, Forward to Scrutiny |
| **Smt. Vandana Sharma** | `MOTA_OFFICER` | Ministry Scrutiny Committee, Quota Allocation, Selection & Award Studio, Grievance Resolution |
| **Sh. Rajesh Meena** | `ADMIN` | Policy-to-Workflow Compiler, Scheme Master, Version Governance, Tamper-Evident Hash Chain Audit |
| **Principal Secretary** | `SUPER_ADMIN` | Full System Authority, Policy Publication, Tamper Attack Simulation, Platform Configuration |

---

## 5. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans typography.
- **Full-Stack Server (Live Container)**: Express 4, Node.js, `tsx`, `@google/genai` (Gemini 3.8 Flash), Crypto SHA-256 Engine.
- **Enterprise Python Stack (`/backend`)**: Python 3.12, FastAPI, SQLAlchemy 2.0 Async, Pydantic v2, Alembic, PostgreSQL, Redis, Celery, Docker.

---

## 6. How to Run

### Quick Start (Current Environment)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Run with Docker Compose
```bash
docker-compose up --build
```
This spins up:
- PostgreSQL 16 database (`jvs-postgres`)
- Redis 7 cache/queue (`jvs-redis`)
- JVS Full-Stack Application (`jvs-app`) on port 3000

---

## 7. Verification & Audit API Endpoints

- `GET  /api/v1/health` — Service readiness & database status.
- `POST /api/v1/policies/extract` — AI-assisted scheme policy compiler.
- `POST /api/v1/verification/evaluate/:id` — Execute PRAMAAN Dual-Path verification.
- `POST /api/v1/deficiencies/:id/resubmit` — Submit explainable deficiency rectification.
- `POST /api/v1/scrutiny/review` — Record committee scrutiny score & priority flags.
- `POST /api/v1/selection/decision` — Issue award letter & provision post-selection milestones.
- `GET  /api/v1/audit/verify-chain` — Cryptographically audit entire SHA-256 hash ledger.
- `POST /api/v1/audit/simulate-tamper` — Simulate tampering test on audit block.
