import crypto from 'crypto';
import { seedCohortApplications } from './cohortSeed.js';
import { 
  seedContinuityRecords, 
  ScholarshipContinuityRecord, 
  ContinuityYearRecord, 
  ContinuityRequirement, 
  ContinuityRiskIssue 
} from './continuitySeed.js';

export type { 
  ScholarshipContinuityRecord, 
  ContinuityYearRecord, 
  ContinuityRequirement, 
  ContinuityRiskIssue 
};

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'STUDENT' | 'INSTITUTION_VERIFIER' | 'MOTA_OFFICER' | 'ADMIN' | 'SUPER_ADMIN';
  institution: string;
  state: string;
  createdAt: string;
}

export interface Scheme {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  ministry: string;
  createdAt: string;
}

export interface PolicyVersion {
  id: string;
  schemeId: string;
  schemeCode: string;
  versionNumber: string;
  academicYear: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'RETIRED';
  effectiveDate: string;
  config: {
    eligibilityRules: Array<{
      key: string;
      title: string;
      type: 'NUMBER_MAX' | 'NUMBER_MIN' | 'BOOLEAN' | 'SELECT' | 'TEXT';
      threshold?: any;
      description: string;
      mandatory: boolean;
      sourceClause?: string;
    }>;
    applicationFields: Array<{
      key: string;
      label: string;
      section: 'PERSONAL' | 'ACADEMIC' | 'INSTITUTION' | 'BANK' | 'CATEGORY' | 'OVERSEAS';
      type: 'text' | 'number' | 'select' | 'boolean' | 'date';
      required: boolean;
      options?: string[];
      placeholder?: string;
      helperText?: string;
    }>;
    documentRequirements: Array<{
      key: string;
      title: string;
      required: boolean;
      allowedMime: string[];
      maxSizeMB: number;
      description: string;
      issuingAuthority?: string;
      crossCheckWithField?: string;
    }>;
    verificationRules: Array<{
      key: string;
      path: 'PATH_A_EVIDENCE' | 'PATH_B_CREDENTIAL';
      targetField: string;
      targetDocument: string;
      ruleLogic: string;
      tolerancePercentage?: number;
      failureMessage: string;
      recommendedDeficiencyAction: string;
    }>;
    workflowStages: Array<{
      code: string;
      name: string;
      responsibleRole: string;
      slaDays: number;
    }>;
    selectionCriteria: Array<{
      key: string;
      title: string;
      priorityWeight: number;
      ruleDescription: string;
    }>;
    postSelectionMilestones: Array<{
      key: string;
      title: string;
      timelineDays: number;
      mandatory: boolean;
      submissionType: string;
    }>;
  };
  notes: string;
  createdBy: string;
  approvedBy?: string;
  publishedBy?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  applicationNumber: string;
  schemeId: string;
  schemeCode: string;
  schemeName: string;
  policyVersionId: string;
  policyVersionNumber: string;
  academicYear: string;
  applicantId: string;
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'ELIGIBILITY_CHECK'
    | 'VERIFICATION'
    | 'DEFICIENCY'
    | 'RESUBMITTED'
    | 'RE_VERIFICATION'
    | 'READY_FOR_SCRUTINY'
    | 'SCRUTINY'
    | 'SCREENING'
    | 'SELECTED'
    | 'NOT_SELECTED'
    | 'POST_SELECTION'
    | 'COMPLETED';
  fieldValues: Record<string, any>;
  timeline: Array<{
    stage: string;
    title: string;
    status: 'COMPLETED' | 'PENDING' | 'ACTION_REQUIRED' | 'FAILED';
    timestamp: string;
    description: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageRef: string;
  sha256Hash: string;
  ocrExtractedData: Record<string, any>;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'DEFICIENT' | 'REJECTED';
  uploadedBy: string;
  uploadedAt: string;
}

export interface VerificationCase {
  id: string;
  applicationId: string;
  verifierId: string;
  verificationStage: string;
  pathA_EvidenceResults: Array<{
    ruleKey: string;
    ruleTitle: string;
    status: 'PASS' | 'FAIL' | 'FLAG';
    applicantValue: any;
    documentExtractedValue: any;
    confidence: number;
    explanation: string;
  }>;
  pathB_CredentialResults: Array<{
    source: string;
    target: string;
    status: 'VERIFIED' | 'FAILED' | 'SKIPPED';
    identifierChecked: string;
    details: string;
  }>;
  overallStatus: 'VERIFIED' | 'INCOMPLETE' | 'INCONSISTENT' | 'FLAGGED' | 'REQUIRES_REVIEW' | 'FAILED';
  flags: Array<{
    ruleKey: string;
    title: string;
    what: string;
    why: string;
    action: string;
    relatedDocument: string;
  }>;
  explanations: string[];
  notes: string;
  updatedAt: string;
}

export interface Deficiency {
  id: string;
  applicationId: string;
  requirementKey: string;
  documentKey: string;
  title: string;
  whatExplanation: string;
  whyExplanation: string;
  actionRequired: string;
  status: 'OPEN' | 'RESUBMITTED' | 'RESOLVED';
  studentRemark?: string;
  replacementDocumentId?: string;
  raisedBy: string;
  raisedAt: string;
  resubmittedAt?: string;
  resolvedAt?: string;
}

export interface ScrutinyCase {
  id: string;
  applicationId: string;
  reviewerId: string;
  reviewerName: string;
  score: number;
  recommendation: 'RECOMMENDED' | 'SHORTLISTED' | 'WAITLISTED' | 'NOT_RECOMMENDED';
  committeeRemarks: string;
  priorityCriteriaMet: string[];
  reviewedAt: string;
}

export interface SelectionDecision {
  id: string;
  applicationId: string;
  decision: 'SELECTED' | 'NOT_SELECTED' | 'WAITLISTED';
  quotaCategory: 'DIVYANGJAN' | 'PVTG' | 'FEMALE' | 'ST_OTHERS';
  annualAwardAmount: string;
  awardLetterRef?: string | null;
  remarks: string;
  decidedBy: string;
  decidedAt: string;
}

export interface PostSelectionMilestone {
  id: string;
  applicationId: string;
  milestoneKey: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'OVERDUE';
  requiredDocument: string;
  submittedDocumentRef?: string;
  remarks?: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'ACTION_REQUIRED' | 'SUCCESS' | 'WARNING';
  read: boolean;
  createdAt: string;
}

export interface GrievanceRecord {
  id: string;
  ticketNumber: string;
  applicationId: string | null;
  studentId: string;
  studentName: string;
  subject: string;
  category: string;
  message: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESPONDED' | 'RESOLVED';
  officerReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditBlock {
  id: string;
  eventIndex: number;
  timestamp: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, any>;
  previousHash: string;
  currentHash: string;
}

// Database In-Memory Structure (Transactional, Normalized)
export const db = {
  users: [] as User[],
  schemes: [] as Scheme[],
  policyVersions: [] as PolicyVersion[],
  applications: [] as Application[],
  documents: [] as DocumentRecord[],
  verificationCases: [] as VerificationCase[],
  deficiencies: [] as Deficiency[],
  scrutinyCases: [] as ScrutinyCase[],
  selectionDecisions: [] as SelectionDecision[],
  postSelectionMilestones: [] as PostSelectionMilestone[],
  notifications: [] as NotificationRecord[],
  grievances: [] as GrievanceRecord[],
  auditLogs: [] as AuditBlock[],
  continuityRecords: [] as ScholarshipContinuityRecord[],
};

// Cryptographic Password Hashing helper (SHA-256 with salt)
export function hashPassword(password: string): string {
  const salt = 'jvs_mota_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function findUserByEmail(email: string): User | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}

// ==========================================
// TAMPER-EVIDENT SHA-256 AUDIT HASH CHAIN
// ==========================================
export function appendAuditLog(entry: {
  actorUserId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, any>;
}): AuditBlock {
  const eventIndex = db.auditLogs.length;
  const previousHash =
    eventIndex === 0
      ? '0000000000000000000000000000000000000000000000000000000000000000'
      : db.auditLogs[eventIndex - 1].currentHash;

  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID();

  // Deterministic serialization
  const blockData = {
    id,
    eventIndex,
    timestamp,
    actorUserId: entry.actorUserId,
    actorRole: entry.actorRole,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    payload: entry.payload,
    previousHash,
  };

  const currentHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(blockData))
    .digest('hex');

  const block: AuditBlock = {
    ...blockData,
    currentHash,
  };

  db.auditLogs.push(block);
  return block;
}

export function verifyAuditChainIntegrity(): {
  isValid: boolean;
  totalBlocks: number;
  brokenBlockIndex: number | null;
  details: string;
} {
  if (db.auditLogs.length === 0) {
    return { isValid: true, totalBlocks: 0, brokenBlockIndex: null, details: 'Audit chain is empty.' };
  }

  for (let i = 0; i < db.auditLogs.length; i++) {
    const current = db.auditLogs[i];
    const expectedPrev =
      i === 0
        ? '0000000000000000000000000000000000000000000000000000000000000000'
        : db.auditLogs[i - 1].currentHash;

    if (current.previousHash !== expectedPrev) {
      return {
        isValid: false,
        totalBlocks: db.auditLogs.length,
        brokenBlockIndex: i,
        details: `Previous hash pointer broken at block #${i}. Expected ${expectedPrev}, found ${current.previousHash}`,
      };
    }

    const recomputedHash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          id: current.id,
          eventIndex: current.eventIndex,
          timestamp: current.timestamp,
          actorUserId: current.actorUserId,
          actorRole: current.actorRole,
          action: current.action,
          entityType: current.entityType,
          entityId: current.entityId,
          payload: current.payload,
          previousHash: current.previousHash,
        })
      )
      .digest('hex');

    if (recomputedHash !== current.currentHash) {
      return {
        isValid: false,
        totalBlocks: db.auditLogs.length,
        brokenBlockIndex: i,
        details: `Cryptographic SHA-256 tampering detected at block #${i}. Block data was illegally modified! Recomputed: ${recomputedHash.slice(0, 16)}... != Recorded: ${current.currentHash.slice(0, 16)}...`,
      };
    }
  }

  return {
    isValid: true,
    totalBlocks: db.auditLogs.length,
    brokenBlockIndex: null,
    details: `All ${db.auditLogs.length} blocks verified cryptographically. Zero tampering detected.`,
  };
}

// ==========================================
// SEED DATABASE INITIALIZER
// ==========================================
export function initializeDatabase() {
  if (db.users.length > 0) return;

  // 1. Seed System Users (Real Roles)
  const defaultPasswordHash = hashPassword('MotA@Jvs2026');

  const studentUser: User = {
    id: 'usr-student-001',
    name: 'Rahul Kumar Munda',
    email: 'adityapathak6262@gmail.com', // user email from instructions
    passwordHash: defaultPasswordHash,
    role: 'STUDENT',
    institution: 'Delhi Technological University',
    state: 'Jharkhand',
    createdAt: '2026-04-01T09:00:00Z',
  };

  const studentUser2: User = {
    id: 'usr-student-002',
    name: 'Ananya Soren (Divyangjan)',
    email: 'ananya.soren@example.gov.in',
    passwordHash: defaultPasswordHash,
    role: 'STUDENT',
    institution: 'IIT Delhi',
    state: 'Odisha',
    createdAt: '2026-04-02T10:15:00Z',
  };

  const verifierUser: User = {
    id: 'usr-verifier-001',
    name: 'Dr. K. Raman (Institute Nodal Officer)',
    email: 'ino.dtu@gov.in',
    passwordHash: defaultPasswordHash,
    role: 'INSTITUTION_VERIFIER',
    institution: 'Delhi Technological University',
    state: 'Delhi',
    createdAt: '2026-03-01T10:00:00Z',
  };

  const officerUser: User = {
    id: 'usr-officer-001',
    name: 'Smt. Vandana Sharma (Joint Secretary)',
    email: 'js.scholarship@mota.gov.in',
    passwordHash: defaultPasswordHash,
    role: 'MOTA_OFFICER',
    institution: 'Ministry of Tribal Affairs, Shastri Bhawan',
    state: 'New Delhi',
    createdAt: '2026-01-15T09:00:00Z',
  };

  const adminUser: User = {
    id: 'usr-admin-001',
    name: 'Sh. Rajesh Meena (System Admin)',
    email: 'admin.jvs@mota.gov.in',
    passwordHash: defaultPasswordHash,
    role: 'ADMIN',
    institution: 'National Informatics Centre / MoTA PMU',
    state: 'New Delhi',
    createdAt: '2026-01-01T09:00:00Z',
  };

  const superAdminUser: User = {
    id: 'usr-superadmin-001',
    name: 'Principal Secretary (Tribal Affairs)',
    email: 'superadmin.jvs@mota.gov.in',
    passwordHash: defaultPasswordHash,
    role: 'SUPER_ADMIN',
    institution: 'Ministry of Tribal Affairs, GoI',
    state: 'New Delhi',
    createdAt: '2026-01-01T09:00:00Z',
  };

  db.users.push(studentUser, studentUser2, verifierUser, officerUser, adminUser, superAdminUser);

  // 2. Genesis Audit Block
  appendAuditLog({
    actorUserId: 'SYSTEM',
    actorRole: 'SUPER_ADMIN',
    action: 'SYSTEM_INITIALIZATION',
    entityType: 'PLATFORM',
    entityId: 'JVS-GENESIS',
    payload: {
      platform: 'JANJATIYA VIDYA SETU',
      version: '1.0.0',
      core: 'POLICY -> PROOF -> PROCESS',
      timestamp: new Date().toISOString(),
    },
  });

  // 3. Seed Schemes (From provided Official MoTA PDF Guidelines)
  const nfstScheme: Scheme = {
    id: 'sch-nfst-001',
    code: 'NFST',
    name: 'National Fellowship for Higher Education of ST Students',
    description: 'Central Sector Scheme providing 750 fellowships for M.Phil and Ph.D research in premier universities in India.',
    category: 'Higher Education / Research Fellowship',
    ministry: 'Ministry of Tribal Affairs (MoTA)',
    createdAt: '2026-01-10T10:00:00Z',
  };

  const nosScheme: Scheme = {
    id: 'sch-nos-002',
    code: 'NOS',
    name: 'National Overseas Scholarship for ST Students',
    description: 'Central Sector Scheme providing 20 awards for Masters, Ph.D and Post-Doctoral research in top 1,000 QS ranked universities abroad.',
    category: 'International Overseas Scholarship',
    ministry: 'Ministry of Tribal Affairs (MoTA)',
    createdAt: '2026-01-10T10:00:00Z',
  };

  const preMatricScheme: Scheme = {
    id: 'sch-pre-003',
    code: 'PRE_MATRIC',
    name: 'Pre-Matric Scholarship for ST Students (Classes IX & X)',
    description: 'Centrally Sponsored Scheme minimizing school dropouts between elementary and secondary stage.',
    category: 'Secondary School Education',
    ministry: 'Ministry of Tribal Affairs (MoTA)',
    createdAt: '2026-01-10T10:00:00Z',
  };

  const postMatricScheme: Scheme = {
    id: 'sch-post-004',
    code: 'POST_MATRIC',
    name: 'Post-Matric Scholarship for ST Students (Studies in India)',
    description: 'Centrally Sponsored Scheme granting financial assistance from Class XI to Post Graduation courses.',
    category: 'Post-Matric Higher Education',
    ministry: 'Ministry of Tribal Affairs (MoTA)',
    createdAt: '2026-01-10T10:00:00Z',
  };

  db.schemes.push(nfstScheme, nosScheme, preMatricScheme, postMatricScheme);

  // 4. Seed Published Policy Versions (Derived directly from MoTA PDF texts)
  const nfstPolicy2026: PolicyVersion = {
    id: 'pol-nfst-2026',
    schemeId: nfstScheme.id,
    schemeCode: 'NFST',
    versionNumber: '2026-27',
    academicYear: '2026-27',
    status: 'PUBLISHED',
    effectiveDate: '2026-04-01',
    publishedBy: 'Smt. Vandana Sharma (Joint Secretary)',
    publishedAt: '2026-04-05T11:00:00Z',
    createdBy: 'Sh. Rajesh Meena (System Admin)',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-04-05T11:00:00Z',
    notes: 'Approved policy for 750 slots. Clause 2.2 specifies NO income ceiling. Clause 2.3 specifies max age 36 years as of 1st July.',
    config: {
      eligibilityRules: [
        {
          key: 'category_st',
          title: 'Scheduled Tribe Domicile',
          type: 'BOOLEAN',
          description: 'Candidate must belong to Scheduled Tribe in relation to domicile state',
          mandatory: true,
          sourceClause: 'Clause 3.2.a',
        },
        {
          key: 'pg_marks',
          title: 'Minimum 55% Marks in Post-Graduation',
          type: 'NUMBER_MIN',
          threshold: 55,
          description: 'Candidate must have at least 55% aggregate marks in PG/Master degree',
          mandatory: true,
          sourceClause: 'Clause 2.1.ii',
        },
        {
          key: 'max_age_limit',
          title: 'Maximum Age Limit (36 Years)',
          type: 'NUMBER_MAX',
          threshold: 36,
          description: 'Maximum 36 years as on 1st July of the selection year',
          mandatory: true,
          sourceClause: 'Clause 2.3',
        },
        {
          key: 'no_income_ceiling',
          title: 'Income Ceiling Exemption',
          type: 'BOOLEAN',
          description: 'There is NO income criteria for eligibility in respect of NFST scholarship',
          mandatory: false,
          sourceClause: 'Clause 2.2',
        },
        {
          key: 'one_scholarship_only',
          title: 'No Concurrent Scholarship',
          type: 'BOOLEAN',
          description: 'Scholar shall not be availing any other fellowship/scholarship for the same study',
          mandatory: true,
          sourceClause: 'Clause 3.2.2 & Note 1',
        },
      ],
      applicationFields: [
        { key: 'applicantName', label: 'Full Name (as per Aadhaar)', section: 'PERSONAL', type: 'text', required: true, placeholder: 'Enter full name' },
        { key: 'gender', label: 'Gender', section: 'PERSONAL', type: 'select', required: true, options: ['Male', 'Female', 'Transgender'] },
        { key: 'dob', label: 'Date of Birth', section: 'PERSONAL', type: 'date', required: true },
        { key: 'ageOnFirstJuly', label: 'Age as on 1st July (Years)', section: 'PERSONAL', type: 'number', required: true, placeholder: 'e.g. 26' },
        { key: 'aadhaarNumber', label: 'Aadhaar Number (12 Digits)', section: 'PERSONAL', type: 'text', required: true, placeholder: 'XXXX XXXX XXXX' },
        { key: 'mobileNumber', label: 'Mobile Number (Aadhaar & Bank Linked)', section: 'PERSONAL', type: 'text', required: true, placeholder: '10 digit mobile' },
        { key: 'domicileState', label: 'Domicile State', section: 'CATEGORY', type: 'select', required: true, options: ['Jharkhand', 'Odisha', 'Madhya Pradesh', 'Chhattisgarh', 'Rajasthan', 'Gujarat', 'Maharashtra', 'Assam', 'Other'] },
        { key: 'stCertificateNumber', label: 'ST Certificate Number', section: 'CATEGORY', type: 'text', required: true, placeholder: 'Issuing certificate number' },
        { key: 'isPVTG', label: 'Belongs to Particularly Vulnerable Tribal Group (PVTG)?', section: 'CATEGORY', type: 'boolean', required: false, helperText: '25 priority slots reserved for PVTG' },
        { key: 'isDivyangjan', label: 'Person with Benchmark Disability (Divyangjan)?', section: 'CATEGORY', type: 'boolean', required: false, helperText: '38 slots reserved (5% quota) for min 40% disability' },
        { key: 'disabilityPercentage', label: 'Disability Percentage (if Divyangjan)', section: 'CATEGORY', type: 'number', required: false, placeholder: 'e.g. 45' },
        { key: 'courseEnrolled', label: 'Research Course Enrolled', section: 'ACADEMIC', type: 'select', required: true, options: ['Ph.D (Regular & Full Time)', 'M.Phil', 'Integrated M.Phil + Ph.D'] },
        { key: 'qualifyingDegree', label: 'Qualifying Master/PG Degree', section: 'ACADEMIC', type: 'text', required: true, placeholder: 'e.g. M.Sc Chemistry, M.Tech CSE' },
        { key: 'qualifyingMarksPercentage', label: 'Qualifying PG Marks (% Aggregate)', section: 'ACADEMIC', type: 'number', required: true, placeholder: 'Minimum 55%' },
        { key: 'researchTopic', label: 'Research Title / Proposed Topic', section: 'ACADEMIC', type: 'text', required: true, placeholder: 'Brief title of thesis' },
        { key: 'universityCategory', label: 'University Recognition Category', section: 'INSTITUTION', type: 'select', required: true, options: ['Institute of National Importance (IIT/IIM/AIIMS/NIT)', 'Central / State University under UGC 2(f)/12(B)', 'Deemed to be University under UGC Section 3', 'Receiving grants by Central/State Govt'] },
        { key: 'universityName', label: 'University / Institute Name', section: 'INSTITUTION', type: 'text', required: true, placeholder: 'e.g. Delhi Technological University' },
        { key: 'hasAdmissionOfferFromPremier', label: 'Got admission offer from IIT/AIIMS/IIM/IISER?', section: 'INSTITUTION', type: 'boolean', required: false, helperText: 'Given direct priority in slot allocation' },
        { key: 'bankAccountNumber', label: 'Bank Account Number (Aadhaar Seeded)', section: 'BANK', type: 'text', required: true, placeholder: 'Enter CBS Bank Account No' },
        { key: 'bankIfsc', label: 'Bank IFSC Code', section: 'BANK', type: 'text', required: true, placeholder: 'SBIN000XXXX' },
        { key: 'bankName', label: 'Bank Name & Branch', section: 'BANK', type: 'text', required: true, placeholder: 'e.g. State Bank of India' },
      ],
      documentRequirements: [
        { key: 'passport_photo', title: 'Latest Coloured Passport Size Photograph', required: true, allowedMime: ['image/jpeg', 'image/png'], maxSizeMB: 2, description: 'Clear frontal view' },
        { key: 'caste_certificate', title: 'ST / PVTG Certificate', required: true, allowedMime: ['application/pdf', 'image/jpeg'], maxSizeMB: 5, description: 'Issued by Competent Authority of State/UT', issuingAuthority: 'Revenue Officer / Tehsildar / SDO', crossCheckWithField: 'stCertificateNumber' },
        { key: 'dob_proof', title: '10th / Matriculation Certificate in support of Date of Birth', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Proof of age validation' },
        { key: 'qualifying_marksheet', title: 'Post-Graduation Final Consolidated Marksheet', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Minimum 55% marks required', crossCheckWithField: 'qualifyingMarksPercentage' },
        { key: 'admission_letter', title: 'Admission / Joining Certificate of M.Phil / Ph.D', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'From Registrar/Director of recognized university' },
        { key: 'disability_certificate', title: 'Divyangjan Disability Certificate (if applicable)', required: false, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Certifying minimum 40% disability from Medical Board' },
        { key: 'bank_passbook', title: 'Scanned Copy of Bank Passbook / Cancelled Cheque', required: true, allowedMime: ['application/pdf', 'image/jpeg'], maxSizeMB: 5, description: 'Aadhaar seeded active bank account' },
      ],
      verificationRules: [
        {
          key: 'rule_name_cross_check',
          path: 'PATH_A_EVIDENCE',
          targetField: 'applicantName',
          targetDocument: 'caste_certificate',
          ruleLogic: 'FUZZY_NAME_MATCH',
          tolerancePercentage: 85,
          failureMessage: 'Applicant name on application does not match name on ST Certificate.',
          recommendedDeficiencyAction: 'Upload gazette affidavit or updated ST certificate reflecting correct legal name.',
        },
        {
          key: 'rule_pg_marks_threshold',
          path: 'PATH_A_EVIDENCE',
          targetField: 'qualifyingMarksPercentage',
          targetDocument: 'qualifying_marksheet',
          ruleLogic: 'NUMERIC_MIN_THRESHOLD',
          failureMessage: 'Extracted PG marks do not meet mandatory 55% requirement.',
          recommendedDeficiencyAction: 'Upload official university marks conversion certificate or final degree transcript.',
        },
        {
          key: 'rule_age_ceiling',
          path: 'PATH_A_EVIDENCE',
          targetField: 'ageOnFirstJuly',
          targetDocument: 'dob_proof',
          ruleLogic: 'MAX_AGE_COMPLIANCE',
          failureMessage: 'Applicant age exceeds 36 years limit as of 1st July.',
          recommendedDeficiencyAction: 'Provide verifiable 10th board matriculation certificate validating Date of Birth.',
        },
        {
          key: 'rule_pfms_bank_verification',
          path: 'PATH_B_CREDENTIAL',
          targetField: 'bankAccountNumber',
          targetDocument: 'bank_passbook',
          ruleLogic: 'CREDENTIAL_ADAPTER_LOOKUP',
          failureMessage: 'Bank account could not be validated via PFMS Core Banking gateway.',
          recommendedDeficiencyAction: 'Ensure account is active and seeded with Aadhaar at your bank branch.',
        },
      ],
      workflowStages: [
        { code: 'APPLICATION', name: 'Application Submission', responsibleRole: 'STUDENT', slaDays: 30 },
        { code: 'INSTITUTE_VERIFY', name: 'Institute Nodal Officer Verification', responsibleRole: 'INSTITUTION_VERIFIER', slaDays: 15 },
        { code: 'DEFICIENCY_WINDOW', name: 'Deficiency Notice & Resubmission Window', responsibleRole: 'STUDENT', slaDays: 10 },
        { code: 'MOTA_SCRUTINY', name: 'Ministry Scrutiny Committee', responsibleRole: 'MOTA_OFFICER', slaDays: 14 },
        { code: 'MERIT_SELECTION', name: 'Merit List Publication & Award Allocation', responsibleRole: 'MOTA_OFFICER', slaDays: 7 },
        { code: 'POST_SELECTION', name: 'University Joining & Quarterly Continuation', responsibleRole: 'STUDENT', slaDays: 30 },
      ],
      selectionCriteria: [
        { key: 'premier_offer', title: 'Admission in IIT / IIM / AIIMS / IISER', priorityWeight: 100, ruleDescription: 'Direct priority allocation from open slots as per Note-1' },
        { key: 'pg_merit_score', title: 'Post-Graduation Aggregate Marks Merit', priorityWeight: 80, ruleDescription: 'Descending order ranking based on marks obtained' },
        { key: 'divyangjan_quota', title: 'Divyangjan Quota (38 Slots)', priorityWeight: 90, ruleDescription: '5% reservation for scholars with >= 40% disability' },
        { key: 'pvtg_quota', title: 'PVTG Quota (25 Slots)', priorityWeight: 85, ruleDescription: 'Reserved for Particularly Vulnerable Tribal Groups' },
        { key: 'female_quota', title: 'Female Quota (225 Slots)', priorityWeight: 75, ruleDescription: '30% reserved for female ST researchers' },
      ],
      postSelectionMilestones: [
        { key: 'joining_report', title: 'University Joining Report & NoC', timelineDays: 30, mandatory: true, submissionType: 'DOCUMENT_UPLOAD' },
        { key: 'pfms_linking', title: 'PFMS Beneficiary ID Generation', timelineDays: 45, mandatory: true, submissionType: 'CREDENTIAL_LINK' },
        { key: 'continuation_cert_q1', title: 'Quarter 1 Continuation Certificate (Apr-Jun)', timelineDays: 100, mandatory: true, submissionType: 'DOCUMENT_UPLOAD' },
        { key: 'annual_progress', title: 'Annual Research Progress Report', timelineDays: 365, mandatory: true, submissionType: 'DOCUMENT_UPLOAD' },
      ],
    },
  };

  const nosPolicy2026: PolicyVersion = {
    id: 'pol-nos-2026',
    schemeId: nosScheme.id,
    schemeCode: 'NOS',
    versionNumber: '2026-27 v1.0',
    academicYear: '2026-27',
    status: 'PUBLISHED',
    effectiveDate: '2026-04-01',
    publishedBy: 'Smt. Vandana Sharma (Joint Secretary)',
    publishedAt: '2026-04-06T12:00:00Z',
    createdBy: 'Sh. Rajesh Meena (System Admin)',
    createdAt: '2026-03-25T11:00:00Z',
    updatedAt: '2026-04-06T12:00:00Z',
    notes: '20 awards worldwide. Family income <= ₹6.0 Lakh. Top 1,000 QS ranked institutions. Clause 3.2: USD 15,400 allowance.',
    config: {
      eligibilityRules: [
        {
          key: 'income_ceiling',
          title: 'Family Income Ceiling (₹6.00 Lakh/annum)',
          type: 'NUMBER_MAX',
          threshold: 600000,
          description: 'Gross family income from all sources must not exceed Rs. 6,00,000/- per annum',
          mandatory: true,
          sourceClause: 'Clause 2.2.iii',
        },
        {
          key: 'qs_world_ranking',
          title: 'Foreign University QS World Ranking <= 1000',
          type: 'NUMBER_MAX',
          threshold: 1000,
          description: 'University must be ranked in top 1,000 as per latest QS World Ranking',
          mandatory: true,
          sourceClause: 'Clause 4.4.a',
        },
        {
          key: 'one_child_rule',
          title: 'One Child Per Family Restriction',
          type: 'BOOLEAN',
          description: 'Not more than one child of the same parents will be eligible under the scheme',
          mandatory: true,
          sourceClause: 'Clause 2.2.ii',
        },
      ],
      applicationFields: [
        { key: 'applicantName', label: 'Full Name (as per Passport & Aadhaar)', section: 'PERSONAL', type: 'text', required: true },
        { key: 'passportNumber', label: 'Passport Number', section: 'PERSONAL', type: 'text', required: true },
        { key: 'fieldOfStudy', label: 'Field of Study', section: 'OVERSEAS', type: 'select', required: true, options: ['Pure/Applied Science/Engineering/Technology/Maths (STEM) - 10 Slots', 'Management, Economics, Finance, Law - 4 Slots', 'Agriculture/Medicine - 4 Slots', 'Humanities/Social Science/Fine Arts - 2 Slots'] },
        { key: 'foreignUniversity', label: 'Foreign University Name', section: 'OVERSEAS', type: 'text', required: true, placeholder: 'e.g. Imperial College London' },
        { key: 'countryOfStudy', label: 'Country of Study', section: 'OVERSEAS', type: 'select', required: true, options: ['United Kingdom', 'United States', 'Germany', 'Australia', 'Canada', 'Singapore', 'Other'] },
        { key: 'qsRanking', label: 'University QS World Ranking', section: 'OVERSEAS', type: 'number', required: true, placeholder: 'Must be <= 1000' },
        { key: 'annualFamilyIncome', label: 'Annual Gross Family Income (₹)', section: 'CATEGORY', type: 'number', required: true, placeholder: 'Must not exceed 600000' },
      ],
      documentRequirements: [
        { key: 'passport_copy', title: 'Valid Indian Passport (Front & Back Pages)', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Must have at least 1 year validity' },
        { key: 'admission_offer', title: 'Unconditional / Preliminary Offer of Admission', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'From top 1,000 QS ranked university' },
        { key: 'income_certificate', title: 'Family Income Certificate (FY 2024-25)', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Must prove income <= ₹6.00 Lakh' },
        { key: 'caste_certificate', title: 'ST / PVTG Certificate', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Issued by competent State authority' },
      ],
      verificationRules: [
        {
          key: 'rule_income_check',
          path: 'PATH_A_EVIDENCE',
          targetField: 'annualFamilyIncome',
          targetDocument: 'income_certificate',
          ruleLogic: 'MAX_INCOME_CHECK',
          failureMessage: 'Annual income exceeds ₹6.00 Lakh threshold.',
          recommendedDeficiencyAction: 'Provide verified Competent Authority income certificate for FY 2024-25.',
        },
      ],
      workflowStages: [
        { code: 'APPLICATION', name: 'Online Application on NOSP', responsibleRole: 'STUDENT', slaDays: 30 },
        { code: 'MINISTRY_VERIFICATION', name: 'MoTA & Embassy Verification', responsibleRole: 'MOTA_OFFICER', slaDays: 20 },
        { code: 'MERIT_SELECTION', name: 'QS Ranking Merit Allocation', responsibleRole: 'MOTA_OFFICER', slaDays: 10 },
      ],
      selectionCriteria: [
        { key: 'qs_rank_priority', title: 'QS World Ranking Tier (Priority 1: Already Pursuing; Priority 2: Offer Letter)', priorityWeight: 100, ruleDescription: 'Ranked strictly by foreign institution standing' },
      ],
      postSelectionMilestones: [
        { key: 'embassy_registration', title: 'Registration at Indian Mission Abroad', timelineDays: 30, mandatory: true, submissionType: 'EMBASSY_REPORT' },
        { key: 'biannual_progress', title: 'Six-Month Academic Progress Report', timelineDays: 180, mandatory: true, submissionType: 'DOCUMENT_UPLOAD' },
      ],
    },
  };

  db.policyVersions.push(nfstPolicy2026, nosPolicy2026);

  // 5. Seed Applications in different lifecycle states
  const app1: Application = {
    id: 'app-001',
    applicationNumber: 'JVS-NFST-2026-00001',
    schemeId: nfstScheme.id,
    schemeCode: 'NFST',
    schemeName: nfstScheme.name,
    policyVersionId: nfstPolicy2026.id,
    policyVersionNumber: '2026-27',
    academicYear: '2026-27',
    applicantId: studentUser.id,
    status: 'DEFICIENCY', // For showing explainable deficiency & resubmission
    fieldValues: {
      applicantName: 'Rahul Kumar Munda',
      gender: 'Male',
      dob: '2000-08-15',
      ageOnFirstJuly: 25,
      aadhaarNumber: '9876 5432 1098',
      mobileNumber: '9876543210',
      domicileState: 'Jharkhand',
      stCertificateNumber: 'JH/ST/2022/49102',
      tribeCommunity: 'Munda',
      isPVTG: false,
      isDivyangjan: false,
      courseEnrolled: 'Ph.D (Regular & Full Time)',
      qualifyingDegree: 'M.Tech Computer Science',
      qualifyingMarksPercentage: 74.5,
      researchTopic: 'Machine Learning Models for Tribal Dialect Preservation',
      universityCategory: 'Central / State University under UGC 2(f)/12(B)',
      universityName: 'Delhi Technological University',
      hasAdmissionOfferFromPremier: false,
      bankAccountNumber: '38920194821',
      bankIfsc: 'SBIN0001234',
      bankName: 'State Bank of India, Main Branch',
    },
    timeline: [
      { stage: 'REGISTRATION', title: 'Student Registered', status: 'COMPLETED', timestamp: '2026-04-01T09:00:00Z', description: 'Registered with Aadhaar verification' },
      { stage: 'APPLICATION_SUBMITTED', title: 'Application Submitted', status: 'COMPLETED', timestamp: '2026-04-02T11:20:00Z', description: 'Submitted under NFST 2026-27 policy' },
      { stage: 'VERIFICATION', title: 'PRAMAAN Automated & Nodal Verification', status: 'ACTION_REQUIRED', timestamp: '2026-04-03T14:00:00Z', description: 'Deficiency raised: Name mismatch on ST Certificate' },
    ],
    createdAt: '2026-04-02T11:20:00Z',
    updatedAt: '2026-04-03T14:00:00Z',
  };

  const app2: Application = {
    id: 'app-002',
    applicationNumber: 'JVS-NFST-2026-00002',
    schemeId: nfstScheme.id,
    schemeCode: 'NFST',
    schemeName: nfstScheme.name,
    policyVersionId: nfstPolicy2026.id,
    policyVersionNumber: '2026-27',
    academicYear: '2026-27',
    applicantId: studentUser2.id,
    status: 'SELECTED', // For showing Scrutiny, Selection & Post Selection
    fieldValues: {
      applicantName: 'Ananya Soren',
      gender: 'Female',
      dob: '1998-05-20',
      ageOnFirstJuly: 27,
      aadhaarNumber: '8877 6655 4433',
      mobileNumber: '9812345678',
      domicileState: 'Odisha',
      stCertificateNumber: 'OD/ST/2021/88219',
      tribeCommunity: 'Santhal',
      isPVTG: false,
      isDivyangjan: true,
      disabilityPercentage: 45,
      courseEnrolled: 'Ph.D (Regular & Full Time)',
      qualifyingDegree: 'M.Sc Biotechnology',
      qualifyingMarksPercentage: 81.2,
      researchTopic: 'Genetic Mapping of Sickle Cell Anemia in Tribal Belts',
      universityCategory: 'Institute of National Importance (IIT/IIM/AIIMS/NIT)',
      universityName: 'IIT Delhi',
      hasAdmissionOfferFromPremier: true,
      bankAccountNumber: '90123847561',
      bankIfsc: 'SBIN0005678',
      bankName: 'State Bank of India, IIT Delhi',
    },
    timeline: [
      { stage: 'REGISTRATION', title: 'Student Registered', status: 'COMPLETED', timestamp: '2026-04-02T10:15:00Z', description: 'Registered on JVS' },
      { stage: 'APPLICATION_SUBMITTED', title: 'Application Submitted', status: 'COMPLETED', timestamp: '2026-04-03T15:30:00Z', description: 'Submitted under NFST 2026-27 policy' },
      { stage: 'VERIFICATION', title: 'PRAMAAN Verification Cleared', status: 'COMPLETED', timestamp: '2026-04-04T12:00:00Z', description: 'Dual-Path verification: 100% Match' },
      { stage: 'SCRUTINY', title: 'Committee Scrutiny Completed', status: 'COMPLETED', timestamp: '2026-04-05T16:00:00Z', description: 'Divyangjan & Premier Institute Priority Score: 95/100' },
      { stage: 'SELECTION', title: 'Provisionally Selected for Fellowship', status: 'COMPLETED', timestamp: '2026-04-06T10:00:00Z', description: 'Award Letter generated under Divyangjan Quota (Slot #04/38)' },
    ],
    createdAt: '2026-04-03T15:30:00Z',
    updatedAt: '2026-04-06T10:00:00Z',
  };

  db.applications.push(app1, app2);

  // 6. Seed Documents
  db.documents.push(
    {
      id: 'doc-001',
      applicationId: app1.id,
      documentType: 'caste_certificate',
      fileName: 'st_certificate_rahul.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 420500,
      storageRef: 'secure-vault://mota/NFST/app-001/caste_cert.enc',
      sha256Hash: crypto.createHash('sha256').update('st_cert_rahul').digest('hex'),
      ocrExtractedData: {
        certificateNumber: 'JH/ST/2022/49102',
        beneficiaryName: 'Rahul Munda', // Notice: "Rahul Munda" vs "Rahul Kumar Munda" -> Triggers explainable deficiency!
        tribeSubCaste: 'Munda',
        issuingAuthority: 'Sub-Divisional Officer, Ranchi',
        extractedConfidence: 0.94,
      },
      verificationStatus: 'DEFICIENT',
      uploadedBy: studentUser.id,
      uploadedAt: '2026-04-02T11:22:00Z',
    },
    {
      id: 'doc-002',
      applicationId: app1.id,
      documentType: 'qualifying_marksheet',
      fileName: 'mtech_marksheet.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 580200,
      storageRef: 'secure-vault://mota/NFST/app-001/mtech_marks.enc',
      sha256Hash: crypto.createHash('sha256').update('mtech_marks_rahul').digest('hex'),
      ocrExtractedData: {
        studentName: 'Rahul Kumar Munda',
        percentageMarks: 74.5,
        division: 'First Class with Distinction',
        extractedConfidence: 0.98,
      },
      verificationStatus: 'VERIFIED',
      uploadedBy: studentUser.id,
      uploadedAt: '2026-04-02T11:24:00Z',
    },
    {
      id: 'doc-003',
      applicationId: app2.id,
      documentType: 'caste_certificate',
      fileName: 'ananya_st_cert.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 490100,
      storageRef: 'secure-vault://mota/NFST/app-002/caste_cert.enc',
      sha256Hash: crypto.createHash('sha256').update('ananya_st').digest('hex'),
      ocrExtractedData: {
        certificateNumber: 'OD/ST/2021/88219',
        beneficiaryName: 'Ananya Soren',
        tribeSubCaste: 'Santhal',
        issuingAuthority: 'Tahsildar, Mayurbhanj',
        extractedConfidence: 0.99,
      },
      verificationStatus: 'VERIFIED',
      uploadedBy: studentUser2.id,
      uploadedAt: '2026-04-03T15:32:00Z',
    },
    {
      id: 'doc-004',
      applicationId: app2.id,
      documentType: 'disability_certificate',
      fileName: 'disability_cert_medical_board.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 390200,
      storageRef: 'secure-vault://mota/NFST/app-002/disability.enc',
      sha256Hash: crypto.createHash('sha256').update('ananya_disability').digest('hex'),
      ocrExtractedData: {
        patientName: 'Ananya Soren',
        disabilityPercentage: 45,
        type: 'Locomotor Disability',
        issuingMedicalBoard: 'District Medical Board, Baripada',
        extractedConfidence: 0.97,
      },
      verificationStatus: 'VERIFIED',
      uploadedBy: studentUser2.id,
      uploadedAt: '2026-04-03T15:35:00Z',
    }
  );

  // 7. Seed Explainable Deficiency for app1
  db.deficiencies.push({
    id: 'def-001',
    applicationId: app1.id,
    requirementKey: 'rule_name_cross_check',
    documentKey: 'caste_certificate',
    title: 'Candidate Name Inconsistency Between Application & ST Certificate',
    whatExplanation: 'The application records candidate name as "Rahul Kumar Munda", while the uploaded ST Certificate displays "Rahul Munda" (Middle name missing).',
    whyExplanation: 'According to NFST Policy Guidelines (Clause 5.1 & 6.c), document credentials must have verifiable identity consistency with Aadhaar to ensure DBT bank transfer legitimacy.',
    actionRequired: 'Upload a 1-page Magistrate Affidavit / Gazette notification affirming that "Rahul Kumar Munda" and "Rahul Munda" refer to the same individual, or submit an updated ST certificate.',
    status: 'OPEN',
    raisedBy: 'Dr. K. Raman (Institute Nodal Officer)',
    raisedAt: '2026-04-03T14:05:00Z',
  });

  // 8. Seed Selection Decision & Milestones for app2
  db.selectionDecisions.push({
    id: 'sel-002',
    applicationId: app2.id,
    decision: 'SELECTED',
    quotaCategory: 'DIVYANGJAN',
    annualAwardAmount: '₹3,72,000 (Stipend) + ₹25,000 (Contingency) + HRA + Escort Allowance (₹2,000/mo)',
    awardLetterRef: 'MOTA/JVS/AWARD/NFST/2026/00042',
    remarks: 'Selected under Divyangjan 5% reserved quota (Slot 04 of 38). Admission confirmed at IIT Delhi (Premier Institute Category Note-1).',
    decidedBy: 'Smt. Vandana Sharma (Joint Secretary)',
    decidedAt: '2026-04-06T10:00:00Z',
  });

  db.postSelectionMilestones.push(
    {
      id: 'ms-001',
      applicationId: app2.id,
      milestoneKey: 'joining_report',
      title: 'University Joining Report & Checklist',
      description: 'Submit joining report duly countersigned by Registrar, IIT Delhi within 30 days',
      dueDate: '2026-05-06',
      status: 'VERIFIED',
      requiredDocument: 'joining_report',
      submittedDocumentRef: 'secure-vault://mota/NFST/app-002/joining_signed.pdf',
      remarks: 'Joining verified on 2026-04-12 by INO',
      updatedAt: '2026-04-12T11:00:00Z',
    },
    {
      id: 'ms-002',
      applicationId: app2.id,
      milestoneKey: 'bank_pfms_linking',
      title: 'PFMS Beneficiary ID & Aadhaar Bridge Validation',
      description: 'Linking of research scholar ID with designated bank Portal for DBT release',
      dueDate: '2026-05-20',
      status: 'VERIFIED',
      requiredDocument: 'bank_mandate',
      submittedDocumentRef: 'PFMS-BENEFICIARY-ID: MOTA-ST-991204',
      remarks: 'Validated via PFMS NPCI Aadhaar Bridge',
      updatedAt: '2026-04-14T09:30:00Z',
    },
    {
      id: 'ms-003',
      applicationId: app2.id,
      milestoneKey: 'continuation_cert_q1',
      title: 'Quarter 1 Continuation Certificate (April - June)',
      description: 'Quarterly continuation certified by Supervisor (due 10th July)',
      dueDate: '2026-07-10',
      status: 'PENDING',
      requiredDocument: 'continuation_certificate_q1',
      updatedAt: '2026-04-06T10:00:00Z',
    },
    {
      id: 'ms-004',
      applicationId: app2.id,
      milestoneKey: 'annual_progress_report',
      title: 'Annual Research Progress Report & Repository Upload',
      description: 'Progress report certified by Dean (Research) and uploaded to repository.tribal.gov.in',
      dueDate: '2027-04-30',
      status: 'PENDING',
      requiredDocument: 'annual_progress_report',
      updatedAt: '2026-04-06T10:00:00Z',
    }
  );

  // 9. Seed In-App Notifications
  db.notifications.push(
    {
      id: 'notif-001',
      userId: studentUser.id,
      title: 'Deficiency Notice Issued',
      message: 'Officer Dr. K. Raman flagged a name inconsistency on your ST Certificate. Check your Deficiency Desk.',
      type: 'ACTION_REQUIRED',
      read: false,
      createdAt: '2026-04-03T14:06:00Z',
    },
    {
      id: 'notif-002',
      userId: studentUser2.id,
      title: 'Provisional Award Letter Released',
      message: 'Congratulations! You have been provisionally selected for NFST 2026-27 under the Divyangjan quota.',
      type: 'SUCCESS',
      read: true,
      createdAt: '2026-04-06T10:05:00Z',
    }
  );

  // 10. Seed Grievance Ticket
  db.grievances.push({
    id: 'grv-001',
    ticketNumber: 'GRV-260401',
    applicationId: app1.id,
    studentId: studentUser.id,
    studentName: studentUser.name,
    subject: 'Affidavit submission query regarding middle name',
    category: 'Verification Query',
    message: 'Respected Sir, My 10th certificate has Rahul Kumar Munda while ST Certificate has Rahul Munda. Will a Notary Affidavit suffice?',
    status: 'RESPONDED',
    officerReply: 'Yes Rahul, please upload a signed Notary Affidavit stating that both names belong to the same person under the deficiency resubmission button.',
    createdAt: '2026-04-03T15:00:00Z',
    updatedAt: '2026-04-03T16:30:00Z',
  });

  // 11. Seed Audit Logs for these operations
  appendAuditLog({
    actorUserId: 'usr-admin-001',
    actorRole: 'ADMIN',
    action: 'POLICY_PUBLISHED',
    entityType: 'POLICY_VERSION',
    entityId: nfstPolicy2026.id,
    payload: { version: '2026-27', slots: 750, scheme: 'NFST' },
  });

  appendAuditLog({
    actorUserId: 'usr-verifier-001',
    actorRole: 'INSTITUTION_VERIFIER',
    action: 'DEFICIENCY_RAISED',
    entityType: 'APPLICATION',
    entityId: app1.id,
    payload: { deficiencyKey: 'rule_name_cross_check', candidate: 'Rahul Kumar Munda' },
  });

  appendAuditLog({
    actorUserId: 'usr-officer-001',
    actorRole: 'MOTA_OFFICER',
    action: 'SELECTION_DECISION_AWARDED',
    entityType: 'APPLICATION',
    entityId: app2.id,
    payload: { awardRef: 'MOTA/JVS/AWARD/NFST/2026/00042', quota: 'DIVYANGJAN' },
  });

  // 12. Seed 2026-27 Cohort Applications for JVS Intelligence & Analytics
  seedCohortApplications();

  // 13. Seed Multi-Year Scholarship Continuity Records
  db.continuityRecords = seedContinuityRecords();
}
