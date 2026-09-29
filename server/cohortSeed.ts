import crypto from 'crypto';
import { db, Application, DocumentRecord, Deficiency, VerificationCase, hashPassword, User } from './db.js';

export function seedCohortApplications() {
  const now = new Date('2026-04-18T10:00:00Z').getTime();
  const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

  const defaultPasswordHash = hashPassword('MotA@Jvs2026');

  // Additional mock student applicants for diverse cohort
  const cohortStudents = [
    { id: 'usr-st-101', name: 'Bikram Keshari Majhi', email: 'bikram.majhi@example.org', state: 'Odisha', inst: 'XYZ University' },
    { id: 'usr-st-102', name: 'Sujata Marndi', email: 'sujata.marndi@example.org', state: 'Odisha', inst: 'XYZ University' },
    { id: 'usr-st-103', name: 'Debashis Oram', email: 'debashis.oram@example.org', state: 'Odisha', inst: 'XYZ University' },
    { id: 'usr-st-104', name: 'Pooja Naik', email: 'pooja.naik@example.org', state: 'Odisha', inst: 'Sambalpur University' },
    { id: 'usr-st-105', name: 'Rakesh Tudu', email: 'rakesh.tudu@example.org', state: 'Odisha', inst: 'NIT Rourkela' },
    { id: 'usr-st-106', name: 'Manish Birhor', email: 'manish.birhor@example.org', state: 'Jharkhand', inst: 'Ranchi University' },
    { id: 'usr-st-107', name: 'Sunita Hembram', email: 'sunita.h@example.org', state: 'Jharkhand', inst: 'BIT Mesra' },
    { id: 'usr-st-108', name: 'Deepak Gond', email: 'deepak.gond@example.org', state: 'Madhya Pradesh', inst: 'Barkatullah University, Bhopal' },
    { id: 'usr-st-109', name: 'Kavita Baiga', email: 'kavita.baiga@example.org', state: 'Madhya Pradesh', inst: 'Devi Ahilya Vishwavidyalaya, Indore' },
    { id: 'usr-st-110', name: 'Amit Korwa', email: 'amit.korwa@example.org', state: 'Chhattisgarh', inst: 'Pt. Ravishankar Shukla University, Raipur' },
    { id: 'usr-st-111', name: 'Mamta Dhurve', email: 'mamta.dhurve@example.org', state: 'Chhattisgarh', inst: 'NIT Raipur' },
    { id: 'usr-st-112', name: 'Vikram Meena', email: 'vikram.meena@example.org', state: 'Rajasthan', inst: 'Rajasthan Technical University, Kota' },
    { id: 'usr-st-113', name: 'Sunil Garasia', email: 'sunil.garasia@example.org', state: 'Rajasthan', inst: 'MLSU Udaipur' },
    { id: 'usr-st-114', name: 'Pravin Warli', email: 'pravin.warli@example.org', state: 'Maharashtra', inst: 'IIT Bombay' },
    { id: 'usr-st-115', name: 'Rashmi Bodo', email: 'rashmi.bodo@example.org', state: 'Assam', inst: 'Gauhati University' },
    { id: 'usr-st-116', name: 'Tanmay Munda', email: 'tanmay.munda@example.org', state: 'Odisha', inst: 'XYZ University' },
    { id: 'usr-st-117', name: 'Lopamudra Kisan', email: 'lopa.kisan@example.org', state: 'Odisha', inst: 'XYZ University' },
    { id: 'usr-st-118', name: 'Sanjay Bhil', email: 'sanjay.bhil@example.org', state: 'Madhya Pradesh', inst: 'Barkatullah University, Bhopal' },
    { id: 'usr-st-119', name: 'Hemant Kol', email: 'hemant.kol@example.org', state: 'Madhya Pradesh', inst: 'Barkatullah University, Bhopal' },
    { id: 'usr-st-120', name: 'Chhabi Sahariya', email: 'chhabi.s@example.org', state: 'Rajasthan', inst: 'Rajasthan Technical University, Kota' },
  ];

  for (const s of cohortStudents) {
    if (!db.users.some(u => u.id === s.id)) {
      db.users.push({
        id: s.id,
        name: s.name,
        email: s.email,
        passwordHash: defaultPasswordHash,
        role: 'STUDENT',
        institution: s.inst,
        state: s.state,
        createdAt: daysAgo(30),
      });
    }
  }

  // Define detailed cohort applications
  const additionalApps: Array<{
    id: string;
    num: string;
    scheme: string;
    schemeName: string;
    studentIdx: number;
    status: Application['status'];
    state: string;
    inst: string;
    course: string;
    qualDegree: string;
    qualMarks: number;
    daysPending: number;
    attentionCategory?: string;
    attentionReason?: string;
    evidence?: string;
    suggestedAction?: string;
    deficiencyType?: 'INCOME_CERT' | 'ST_CERT' | 'ADMISSION_PROOF' | 'BANK_INFO';
    financialPending?: boolean;
    aiInconsistency?: boolean;
  }> = [
    // 1. ODISHA -> XYZ University -> NFST -> B.Tech (From user prompt example!)
    {
      id: 'app-003',
      num: 'JVS-NFST-2026-00003',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 0, // Bikram Keshari Majhi
      status: 'VERIFICATION',
      state: 'Odisha',
      inst: 'XYZ University',
      course: 'B.Tech',
      qualDegree: 'Class 12 Science',
      qualMarks: 78.4,
      daysPending: 18, // 18 days pending -> Ageing risk!
      attentionCategory: 'Delay / Ageing Risk',
      attentionReason: 'Processing SLA exceeded by 3 days in Institute Nodal Officer desk',
      evidence: 'Application submitted 18 days ago without verification dispatch (Institute SLA benchmark: 15 days)',
      suggestedAction: 'Send automated escalation reminder to XYZ University verification desk',
    },
    // 2. ODISHA -> XYZ University -> NFST -> B.Tech (Second app in same leaf)
    {
      id: 'app-004',
      num: 'JVS-NFST-2026-00004',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 1, // Sujata Marndi
      status: 'DEFICIENCY',
      state: 'Odisha',
      inst: 'XYZ University',
      course: 'B.Tech',
      qualDegree: 'Class 12 Science',
      qualMarks: 82.0,
      daysPending: 6,
      attentionCategory: 'AI Flagged Inconsistency',
      attentionReason: 'Document information mismatch detected',
      evidence: 'Application name records "Sujata Marndi" while uploaded ST Certificate records "Sujata Majhi" (Surname disparity)',
      suggestedAction: 'Request gazette notification / affidavit or updated ST certificate from candidate',
      deficiencyType: 'ST_CERT',
      aiInconsistency: true,
    },
    // 3. ODISHA -> XYZ University -> NFST -> B.Tech (Third app)
    {
      id: 'app-005',
      num: 'JVS-NFST-2026-00005',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 2, // Debashis Oram
      status: 'SUBMITTED',
      state: 'Odisha',
      inst: 'XYZ University',
      course: 'B.Tech',
      qualDegree: 'Class 12 Science',
      qualMarks: 76.5,
      daysPending: 2, // 0-3 days
      attentionCategory: 'Verification Pending',
      attentionReason: 'New submission queued for automated PRAMAAN cross-verification',
      evidence: 'Aadhaar e-KYC passed, academic credentials uploaded and waiting for Nodal signoff',
      suggestedAction: 'Execute PRAMAAN Dual-Path Verification pipeline',
    },
    // 4. ODISHA -> XYZ University -> NFST -> B.Tech (Fourth app: Financial Verification Pending)
    {
      id: 'app-006',
      num: 'JVS-NFST-2026-00006',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 15, // Tanmay Munda
      status: 'VERIFICATION',
      state: 'Odisha',
      inst: 'XYZ University',
      course: 'B.Tech',
      qualDegree: 'Class 12 Science',
      qualMarks: 79.1,
      daysPending: 9, // 8-15 days
      attentionCategory: 'Financial Verification Pending',
      attentionReason: 'NPCI Aadhaar-Bank bridge seeded status unconfirmed',
      evidence: 'Bank account CBS response returned "Account Active but Aadhaar linkage flag false"',
      suggestedAction: 'Notify candidate to visit home branch and enable DBT Aadhaar seeding',
      financialPending: true,
      deficiencyType: 'BANK_INFO',
    },
    // 5. ODISHA -> XYZ University -> NFST -> B.Tech (Fifth app: Ready for scrutiny)
    {
      id: 'app-007',
      num: 'JVS-NFST-2026-00007',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 16, // Lopamudra Kisan
      status: 'READY_FOR_SCRUTINY',
      state: 'Odisha',
      inst: 'XYZ University',
      course: 'B.Tech',
      qualDegree: 'Class 12 Science',
      qualMarks: 88.5,
      daysPending: 4, // 4-7 days
      attentionCategory: 'Complete / Ready for Scrutiny',
      attentionReason: 'All multi-source credentials 100% verified and validated against 2026-27 policy',
      evidence: 'PRAMAAN Path A & Path B passed with zero discrepancies. Scholar meets all priority parameters.',
      suggestedAction: 'Convening Scrutiny Committee for merit ranking and slot allocation',
    },
    // 6. ODISHA -> Sambalpur University -> NFST -> Ph.D
    {
      id: 'app-008',
      num: 'JVS-NFST-2026-00008',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 3, // Pooja Naik
      status: 'RESUBMITTED',
      state: 'Odisha',
      inst: 'Sambalpur University',
      course: 'Ph.D',
      qualDegree: 'M.Sc Botany',
      qualMarks: 72.3,
      daysPending: 1, // 0-3 days
      attentionCategory: 'Deficiency Returned',
      attentionReason: 'Candidate uploaded revised admission joining certificate after defect notice',
      evidence: 'Previous defect was "Admission proof lacked Registrar seal"; new signed PDF uploaded',
      suggestedAction: 'Re-verify replacement document and clear deficiency',
      deficiencyType: 'ADMISSION_PROOF',
    },
    // 7. ODISHA -> NIT Rourkela -> POST_MATRIC -> B.Tech
    {
      id: 'app-009',
      num: 'JVS-PM-2026-00009',
      scheme: 'POST_MATRIC',
      schemeName: 'Post-Matric Scholarship for ST Students',
      studentIdx: 4, // Rakesh Tudu
      status: 'SELECTED',
      state: 'Odisha',
      inst: 'NIT Rourkela',
      course: 'B.Tech',
      qualDegree: 'Class 12',
      qualMarks: 91.2,
      daysPending: 14,
      attentionCategory: 'Complete / Ready for Scrutiny',
      attentionReason: 'Merit list confirmed and DBT sanctions generated',
      evidence: 'State Tribal Welfare Directorate sanctioned annual maintenance and tuition fee award',
      suggestedAction: 'Release DBT batch via PFMS',
    },
    // 8. JHARKHAND -> Ranchi University -> POST_MATRIC -> B.Sc
    {
      id: 'app-010',
      num: 'JVS-PM-2026-00010',
      scheme: 'POST_MATRIC',
      schemeName: 'Post-Matric Scholarship for ST Students',
      studentIdx: 5, // Manish Birhor (PVTG!)
      status: 'DEFICIENCY',
      state: 'Jharkhand',
      inst: 'Ranchi University',
      course: 'B.Sc',
      qualDegree: 'Class 12',
      qualMarks: 65.4,
      daysPending: 22, // 15+ days -> Ageing risk!
      attentionCategory: 'Documents Requiring Attention',
      attentionReason: 'Income certificate expired beyond valid financial assessment year',
      evidence: 'Uploaded income certificate issued in FY 2023-24, policy mandates FY 2025-26 validity',
      suggestedAction: 'Issue reminder notice to furnish current Tahsildar revenue certificate',
      deficiencyType: 'INCOME_CERT',
    },
    // 9. JHARKHAND -> BIT Mesra -> NFST -> B.Tech
    {
      id: 'app-011',
      num: 'JVS-NFST-2026-00011',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 6, // Sunita Hembram
      status: 'VERIFICATION',
      state: 'Jharkhand',
      inst: 'BIT Mesra',
      course: 'B.Tech',
      qualDegree: 'Class 12',
      qualMarks: 84.6,
      daysPending: 11, // 8-15 days
      attentionCategory: 'Financial Verification Pending',
      attentionReason: 'Bank account name differs slightly from Aadhaar legal identity',
      evidence: 'Bank Passbook extracted name "S Hembram", Aadhaar records "Sunita Hembram"',
      suggestedAction: 'Review bank IFSC code & request standard name variation indemnity',
      financialPending: true,
      deficiencyType: 'BANK_INFO',
    },
    // 10. MADHYA PRADESH -> Barkatullah University -> PRE_MATRIC -> Class 10
    {
      id: 'app-012',
      num: 'JVS-PRE-2026-00012',
      scheme: 'PRE_MATRIC',
      schemeName: 'Pre-Matric Scholarship for ST Students (Class IX & X)',
      studentIdx: 7, // Deepak Gond
      status: 'VERIFICATION',
      state: 'Madhya Pradesh',
      inst: 'Barkatullah University, Bhopal',
      course: 'Class 10',
      qualDegree: 'Class 9',
      qualMarks: 68.0,
      daysPending: 25, // 15+ days -> Ageing risk!
      attentionCategory: 'Delay / Ageing Risk',
      attentionReason: 'Institutional verification bottleneck: Pending at school nodal level for 25 days',
      evidence: 'No action taken since submission on 2026-03-24. High pending backlog at institution.',
      suggestedAction: 'Trigger State District Welfare Officer (DWO) oversight alert',
    },
    // 11. MADHYA PRADESH -> Barkatullah University -> NFST -> M.Phil
    {
      id: 'app-013',
      num: 'JVS-NFST-2026-00013',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 17, // Sanjay Bhil
      status: 'SUBMITTED',
      state: 'Madhya Pradesh',
      inst: 'Barkatullah University, Bhopal',
      course: 'M.Phil',
      qualDegree: 'M.A History',
      qualMarks: 64.2,
      daysPending: 16, // 15+ days
      attentionCategory: 'Delay / Ageing Risk',
      attentionReason: 'Pending scrutiny queue ageing beyond 15 days',
      evidence: 'Initial scrutiny assigned but unreviewed due to university session backlog',
      suggestedAction: 'Reassign verification batch to fast-track committee desk',
    },
    // 12. MADHYA PRADESH -> Barkatullah University -> POST_MATRIC -> B.A
    {
      id: 'app-014',
      num: 'JVS-PM-2026-00014',
      scheme: 'POST_MATRIC',
      schemeName: 'Post-Matric Scholarship for ST Students',
      studentIdx: 18, // Hemant Kol
      status: 'DEFICIENCY',
      state: 'Madhya Pradesh',
      inst: 'Barkatullah University, Bhopal',
      course: 'B.A',
      qualDegree: 'Class 12',
      qualMarks: 59.8,
      daysPending: 7, // 4-7 days
      attentionCategory: 'Documents Requiring Attention',
      attentionReason: 'Income certificate illegible / low resolution scan',
      evidence: 'OCR confidence score 0.31; seal and issuing authority signature unreadable',
      suggestedAction: 'Require high-resolution color scan of competent authority certificate',
      deficiencyType: 'INCOME_CERT',
    },
    // 13. MADHYA PRADESH -> Devi Ahilya Vishwavidyalaya -> NFST -> M.Phil
    {
      id: 'app-015',
      num: 'JVS-NFST-2026-00015',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 8, // Kavita Baiga (PVTG!)
      status: 'READY_FOR_SCRUTINY',
      state: 'Madhya Pradesh',
      inst: 'Devi Ahilya Vishwavidyalaya, Indore',
      course: 'M.Phil',
      qualDegree: 'M.Sc Tribal Studies',
      qualMarks: 77.0,
      daysPending: 3, // 0-3 days
      attentionCategory: 'Complete / Ready for Scrutiny',
      attentionReason: 'PVTG priority slot candidate with verified credentials',
      evidence: 'Baiga tribal community verified against Presidential Notification list',
      suggestedAction: 'Confirm priority allocation under 25 PVTG reserved slots',
    },
    // 14. CHHATTISGARH -> Pt. Ravishankar Shukla University -> POST_MATRIC -> B.A
    {
      id: 'app-016',
      num: 'JVS-PM-2026-00016',
      scheme: 'POST_MATRIC',
      schemeName: 'Post-Matric Scholarship for ST Students',
      studentIdx: 9, // Amit Korwa
      status: 'DEFICIENCY',
      state: 'Chhattisgarh',
      inst: 'Pt. Ravishankar Shukla University, Raipur',
      course: 'B.A',
      qualDegree: 'Class 12',
      qualMarks: 63.5,
      daysPending: 12, // 8-15 days
      attentionCategory: 'AI Flagged Inconsistency',
      attentionReason: 'Annual family income recorded differs between application form and revenue slip',
      evidence: 'Application entered ₹1,40,000; uploaded certificate states ₹2,10,000 (Within limit, but disparity flagged)',
      suggestedAction: 'Officer review to reconcile values and approve within ceiling criteria',
      deficiencyType: 'INCOME_CERT',
      aiInconsistency: true,
    },
    // 15. CHHATTISGARH -> NIT Raipur -> NFST -> B.Tech
    {
      id: 'app-017',
      num: 'JVS-NFST-2026-00017',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 10, // Mamta Dhurve
      status: 'READY_FOR_SCRUTINY',
      state: 'Chhattisgarh',
      inst: 'NIT Raipur',
      course: 'B.Tech',
      qualDegree: 'Class 12',
      qualMarks: 86.4,
      daysPending: 5, // 4-7 days
      attentionCategory: 'Complete / Ready for Scrutiny',
      attentionReason: 'Premier institute admission confirmed; 100% verified credentials',
      evidence: 'NIT Raipur admission roster verified with JEE Main roll number',
      suggestedAction: 'Prepare formal award recommendation',
    },
    // 16. RAJASTHAN -> Rajasthan Technical University -> NFST -> B.Tech
    {
      id: 'app-018',
      num: 'JVS-NFST-2026-00018',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 11, // Vikram Meena
      status: 'VERIFICATION',
      state: 'Rajasthan',
      inst: 'Rajasthan Technical University, Kota',
      course: 'B.Tech',
      qualDegree: 'Class 12',
      qualMarks: 73.2,
      daysPending: 21, // 15+ days -> Ageing risk!
      attentionCategory: 'Delay / Ageing Risk',
      attentionReason: 'State verification pending beyond 20 days',
      evidence: 'Application verified by college on 2026-03-28; pending at State Tribal Welfare desk since',
      suggestedAction: 'Send automated status alert to State Nodal Officer',
    },
    // 17. RAJASTHAN -> Rajasthan Technical University -> NFST -> B.Tech
    {
      id: 'app-019',
      num: 'JVS-NFST-2026-00019',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 19, // Chhabi Sahariya (PVTG!)
      status: 'DEFICIENCY',
      state: 'Rajasthan',
      inst: 'Rajasthan Technical University, Kota',
      course: 'B.Tech',
      qualDegree: 'Class 12',
      qualMarks: 71.0,
      daysPending: 8, // 8-15 days
      attentionCategory: 'Documents Requiring Attention',
      attentionReason: 'Admission proof lacks active academic semester fee receipt',
      evidence: 'Student uploaded provisional allotment letter instead of official fee clearance certificate',
      suggestedAction: 'Request current semester institutional admission and fee payment receipt',
      deficiencyType: 'ADMISSION_PROOF',
    },
    // 18. RAJASTHAN -> MLSU Udaipur -> POST_MATRIC -> B.Com
    {
      id: 'app-020',
      num: 'JVS-PM-2026-00020',
      scheme: 'POST_MATRIC',
      schemeName: 'Post-Matric Scholarship for ST Students',
      studentIdx: 12, // Sunil Garasia
      status: 'SUBMITTED',
      state: 'Rajasthan',
      inst: 'MLSU Udaipur',
      course: 'B.Com',
      qualDegree: 'Class 12',
      qualMarks: 67.9,
      daysPending: 2, // 0-3 days
      attentionCategory: 'Verification Pending',
      attentionReason: 'New applicant submitted for 2026-27 session',
      evidence: 'Registration complete with Digilocker verified marksheets',
      suggestedAction: 'Conduct preliminary eligibility check',
    },
    // 19. MAHARASHTRA -> IIT Bombay -> NFST -> Ph.D
    {
      id: 'app-021',
      num: 'JVS-NFST-2026-00021',
      scheme: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      studentIdx: 13, // Pravin Warli
      status: 'SELECTED',
      state: 'Maharashtra',
      inst: 'IIT Bombay',
      course: 'Ph.D',
      qualDegree: 'M.Tech Energy Systems',
      qualMarks: 89.0,
      daysPending: 10,
      attentionCategory: 'Complete / Ready for Scrutiny',
      attentionReason: 'Selected under Premier Institute quota; PFMS milestone pending',
      evidence: 'Offer letter from IIT Bombay validated. Award letter issued.',
      suggestedAction: 'Monitor Q1 continuation report upload',
    },
    // 20. ASSAM -> Gauhati University -> NOS -> Ph.D
    {
      id: 'app-022',
      num: 'JVS-NOS-2026-00022',
      scheme: 'NOS',
      schemeName: 'National Overseas Scholarship for ST Candidates',
      studentIdx: 14, // Rashmi Bodo
      status: 'VERIFICATION',
      state: 'Assam',
      inst: 'Gauhati University',
      course: 'Ph.D',
      qualDegree: 'M.Sc Environmental Science',
      qualMarks: 82.5,
      daysPending: 13, // 8-15 days
      attentionCategory: 'Financial Verification Pending',
      attentionReason: 'Forex exchange account and sponsor guarantee verification required',
      evidence: 'Candidate uploaded unconditional offer letter from University of Edinburgh; bank guarantee under review',
      suggestedAction: 'Forward overseas financial dossier to Ministry External Affairs cell',
      financialPending: true,
      deficiencyType: 'BANK_INFO',
    },
  ];

  const nfstScheme = db.schemes.find(s => s.code === 'NFST') || db.schemes[0];
  const postMatricScheme = db.schemes.find(s => s.code === 'POST_MATRIC') || db.schemes[0];
  const preMatricScheme = db.schemes.find(s => s.code === 'PRE_MATRIC') || db.schemes[0];
  const nosScheme = db.schemes.find(s => s.code === 'NOS') || db.schemes[0];

  const nfstPolicy = db.policyVersions.find(p => p.schemeCode === 'NFST') || db.policyVersions[0];

  for (const item of additionalApps) {
    if (db.applications.some(a => a.id === item.id)) continue;

    const student = cohortStudents[item.studentIdx];
    const targetScheme = item.scheme === 'NFST' ? nfstScheme :
                         item.scheme === 'POST_MATRIC' ? postMatricScheme :
                         item.scheme === 'PRE_MATRIC' ? preMatricScheme : nosScheme;

    const createdTime = daysAgo(item.daysPending);
    const updatedTime = daysAgo(Math.max(0, item.daysPending - 2));

    const app: Application = {
      id: item.id,
      applicationNumber: item.num,
      schemeId: targetScheme.id,
      schemeCode: targetScheme.code,
      schemeName: targetScheme.name,
      policyVersionId: nfstPolicy.id,
      policyVersionNumber: '2026-27 v2.0',
      academicYear: '2026-27',
      applicantId: student.id,
      status: item.status,
      fieldValues: {
        applicantName: student.name,
        email: student.email,
        domicileState: item.state,
        state: item.state,
        universityName: item.inst,
        institutionName: item.inst,
        institute: item.inst,
        courseEnrolled: item.course,
        course: item.course,
        qualifyingDegree: item.qualDegree,
        qualifyingMarksPercentage: item.qualMarks,
        daysPending: item.daysPending,
        attentionCategory: item.attentionCategory,
        attentionReason: item.attentionReason,
        attentionEvidence: item.evidence,
        suggestedAction: item.suggestedAction,
        deficiencyType: item.deficiencyType,
        hasFinancialVerificationPending: !!item.financialPending,
        isAiFlaggedInconsistency: !!item.aiInconsistency,
      },
      timeline: [
        {
          stage: 'REGISTRATION',
          title: 'Student Registered',
          status: 'COMPLETED',
          timestamp: daysAgo(item.daysPending + 1),
          description: `Registered from ${item.state} on JVS portal`,
        },
        {
          stage: 'APPLICATION_SUBMITTED',
          title: 'Application Submitted',
          status: 'COMPLETED',
          timestamp: createdTime,
          description: `Submitted under ${item.scheme} 2026-27 policy`,
        },
      ],
      createdAt: createdTime,
      updatedAt: updatedTime,
    };

    db.applications.push(app);

    // If deficiency
    if (item.deficiencyType) {
      const defTitles = {
        INCOME_CERT: 'Annual Family Income Certificate Rectification Required',
        ST_CERT: 'Statutory ST / Tribe Certificate Name Congruence Notice',
        ADMISSION_PROOF: 'Institutional Joining / Admission Verification Document Required',
        BANK_INFO: 'Aadhaar-Seeded Bank Account Mandate Disparity',
      };

      db.deficiencies.push({
        id: `def-${item.id}`,
        applicationId: item.id,
        requirementKey: item.deficiencyType.toLowerCase(),
        documentKey: item.deficiencyType.toLowerCase(),
        title: defTitles[item.deficiencyType],
        whatExplanation: item.evidence || 'Disparity flagged between application declaration and uploaded proof.',
        whyExplanation: 'MoTA 2026-27 policy mandates strict verification against designated statutory registers.',
        actionRequired: item.suggestedAction || 'Upload certified replacement document.',
        status: item.status === 'RESUBMITTED' ? 'RESUBMITTED' : 'OPEN',
        raisedBy: 'Institute Nodal Officer',
        raisedAt: updatedTime,
      });
    }

    // Add Verification Case
    db.verificationCases.push({
      id: `vc-${item.id}`,
      applicationId: item.id,
      verifierId: 'usr-verifier-001',
      verificationStage: 'PRAMAAN_AUTOMATED',
      pathA_EvidenceResults: [
        {
          ruleKey: 'rule_identity',
          ruleTitle: 'Identity & Domicile Verification',
          status: item.aiInconsistency ? 'FLAG' : 'PASS',
          applicantValue: student.name,
          documentExtractedValue: item.aiInconsistency ? `${student.name.split(' ')[0]} Alternate` : student.name,
          confidence: item.aiInconsistency ? 0.72 : 0.98,
          explanation: item.aiInconsistency
            ? 'Minor name variation identified between application form and uploaded certificate.'
            : 'Extracted name and domicile state match national Aadhaar database.',
        },
        {
          ruleKey: 'rule_academic',
          ruleTitle: 'Academic Qualification Benchmark',
          status: 'PASS',
          applicantValue: `${item.qualMarks}%`,
          documentExtractedValue: `${item.qualMarks}%`,
          confidence: 0.96,
          explanation: `Extracted aggregate marks (${item.qualMarks}%) meet scheme eligibility thresholds.`,
        },
      ],
      pathB_CredentialResults: [
        {
          source: 'DigiLocker / State Revenue Gateway',
          target: 'ST Certificate Validity',
          status: 'VERIFIED',
          identifierChecked: `ST/${item.state.slice(0, 2).toUpperCase()}/2026/${item.id.slice(-4)}`,
          details: `Statutory certificate confirmed active in ${item.state} electronic register`,
        },
        {
          source: 'NPCI Aadhaar Payment Bridge (APB)',
          target: 'DBT Bank Account Seeding',
          status: item.financialPending ? 'FAILED' : 'VERIFIED',
          identifierChecked: 'Aadhaar Seeded Status',
          details: item.financialPending
            ? 'Bank account active but APB mapping flag returned false'
            : 'Active APB mapping confirmed with DBT gateway',
        },
      ],
      overallStatus: item.aiInconsistency
        ? 'FLAGGED'
        : item.status === 'READY_FOR_SCRUTINY' || item.status === 'SELECTED'
        ? 'VERIFIED'
        : item.status === 'DEFICIENCY'
        ? 'INCOMPLETE'
        : 'REQUIRES_REVIEW',
      flags: item.aiInconsistency
        ? [
            {
              ruleKey: 'rule_identity',
              title: 'Name Disparity Flagged',
              what: item.attentionReason || 'Name variation detected',
              why: 'Identity consistency required for Direct Benefit Transfer auditability',
              action: item.suggestedAction || 'Review document',
              relatedDocument: 'st_certificate',
            },
          ]
        : [],
      explanations: [item.evidence || 'Standard policy cross-check performed.'],
      notes: `Automated PRAMAAN analysis completed for cycle 2026-27.`,
      updatedAt: updatedTime,
    });
  }
}
