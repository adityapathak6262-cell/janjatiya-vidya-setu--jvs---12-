export interface ContinuityRequirement {
  id: string;
  key: string;
  title: string;
  category: 'ACADEMIC_PROGRESS' | 'BONAFIDE_ENROLLMENT' | 'AFFIDAVIT_INCOME' | 'BANK_STATUS' | 'RESEARCH_PROGRESS';
  description: string;
  mandatory: boolean;
  status: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'DEFICIENT';
  documentType?: string;
  documentRef?: string;
  documentName?: string;
  uploadedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  deficiencyReason?: {
    what: string;
    why: string;
    action: string;
  };
}

export interface ContinuityRiskIssue {
  id: string;
  type: 'MISSING_DOCUMENT' | 'OUTDATED_DOCUMENT' | 'INSTITUTION_CHANGE' | 'DEADLINE_APPROACHING' | 'VERIFICATION_PENDING' | 'ACADEMIC_CRITERIA_ALERT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  what: string;
  why: string;
  suggestedAction: string;
  requirementKey?: string;
  deadline?: string;
  detectedAt: string;
  status: 'OPEN' | 'RESOLVED';
  resolvedAt?: string;
}

export interface ContinuityYearRecord {
  academicYear: string; // e.g. "2024-25", "2025-26", "2026-27", "2027-28"
  yearIndex: number; // 1, 2, 3, 4, 5
  isHistoricalLocked: boolean; // Locked historical academic-year records must never be overwritten
  isCurrentRenewalYear: boolean; // Only the current academic year is editable
  status: 'COMPLETED_DISBURSED' | 'ACTIVE_RENEWAL' | 'PENDING_VERIFICATION' | 'DEFICIENT' | 'APPROVED_FOR_DISBURSEMENT' | 'UPCOMING';
  disbursedAmount?: string;
  disbursedAt?: string;
  disbursementPipelineStatus?: 'DISBURSED_PRIOR_CYCLE' | 'PENDING_RENEWAL' | 'PENDING_PFMS_PROCESSING' | 'NOT_APPLICABLE';
  renewalProgressPercent: number;
  renewalOpeningStatus: 'OPEN' | 'UPCOMING' | 'CLOSED';
  renewalDeadline: string;
  daysRemaining: number;
  requirements: ContinuityRequirement[];
  issues: ContinuityRiskIssue[];
  annualProgressReportSubmitted?: boolean;
  cgpaPercentage?: number;
  institutionVerificationStatus: 'PENDING' | 'APPROVED' | 'DEFICIENT' | 'NOT_STARTED';
  motaApprovalStatus: 'PENDING' | 'APPROVED' | 'DEFICIENT' | 'NOT_STARTED';
  submissionDate?: string;
  approvalDate?: string;
  officerRemarks?: string;
  changedFromLastYear?: {
    field: string;
    previousValue: string;
    currentValue: string;
    verified: boolean;
  }[];
}

export interface ScholarshipContinuityRecord {
  id: string;
  isSyntheticDemo: boolean;
  studentId: string;
  studentName: string;
  studentEmail: string;
  state: string;
  institution: string;
  course: string;
  schemeCode: string;
  schemeName: string;
  initialAwardYear: string;
  currentAcademicYear: string;
  totalDurationYears: number;
  currentYearIndex: number;
  overallContinuityStatus: 'ON_TRACK' | 'ATTENTION_NEEDED' | 'AT_RISK' | 'DISRUPTED' | 'RENEWAL_APPROVED';
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  years: ContinuityYearRecord[];
  updatedAt: string;
}

export function seedContinuityRecords(): ScholarshipContinuityRecord[] {
  return [
    // 1. Rahul Kumar Munda (Default Student - adityapathak6262@gmail.com)
    {
      id: 'cont-001',
      isSyntheticDemo: true,
      studentId: 'usr-student-001',
      studentName: 'Rahul Kumar Munda',
      studentEmail: 'adityapathak6262@gmail.com',
      state: 'Jharkhand',
      institution: 'Demo Technological University (Campus A)',
      course: 'Ph.D in Computer Science & Engineering',
      schemeCode: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      initialAwardYear: '2024-25',
      currentAcademicYear: '2026-27',
      totalDurationYears: 5,
      currentYearIndex: 3,
      overallContinuityStatus: 'ATTENTION_NEEDED',
      overallRiskLevel: 'MEDIUM',
      updatedAt: '2026-04-18T10:00:00Z',
      years: [
        {
          academicYear: '2024-25',
          yearIndex: 1,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹4,20,000 (Disbursed in AY 2024-25)',
          disbursedAt: '2025-03-15T09:30:00Z',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2024-06-30',
          daysRemaining: 0,
          cgpaPercentage: 84.5,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          submissionDate: '2024-05-10T11:00:00Z',
          approvalDate: '2024-06-12T14:20:00Z',
          requirements: [
            {
              id: 'req-y1-1',
              key: 'marksheet_y1',
              title: 'Year 1 Coursework Grade Card',
              category: 'ACADEMIC_PROGRESS',
              description: 'Official university grade sheet showing coursework completion.',
              mandatory: true,
              status: 'VERIFIED',
              documentName: 'Coursework_GradeCard_Sem1_2.pdf',
              uploadedAt: '2024-05-10T11:00:00Z',
              verifiedAt: '2024-06-05T10:00:00Z',
              verifiedBy: 'Institute Nodal Officer',
            },
            {
              id: 'req-y1-2',
              key: 'bonafide_y1',
              title: 'Annual Continuation Certificate',
              category: 'BONAFIDE_ENROLLMENT',
              description: 'Signed certificate from Dean (Academics) confirming continuous full-time scholar status.',
              mandatory: true,
              status: 'VERIFIED',
              documentName: 'Continuation_Cert_2024.pdf',
              uploadedAt: '2024-05-10T11:00:00Z',
              verifiedAt: '2024-06-05T10:00:00Z',
              verifiedBy: 'Institute Nodal Officer',
            }
          ],
          issues: []
        },
        {
          academicYear: '2025-26',
          yearIndex: 2,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹4,20,000 (Disbursed in AY 2025-26)',
          disbursedAt: '2026-03-20T10:15:00Z',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2025-06-30',
          daysRemaining: 0,
          cgpaPercentage: 86.0,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          submissionDate: '2025-05-14T09:40:00Z',
          approvalDate: '2025-06-18T16:00:00Z',
          requirements: [
            {
              id: 'req-y2-1',
              key: 'marksheet_y2',
              title: 'Year 2 Research Comprehensive Exam Certificate',
              category: 'ACADEMIC_PROGRESS',
              description: 'Certification of successful thesis topic defense & exam.',
              mandatory: true,
              status: 'VERIFIED',
              documentName: 'PhD_Compre_Exam_Report.pdf',
              uploadedAt: '2025-05-14T09:40:00Z',
              verifiedAt: '2025-06-10T12:00:00Z',
              verifiedBy: 'Institute Nodal Officer',
            },
            {
              id: 'req-y2-2',
              key: 'bonafide_y2',
              title: 'Annual Continuation Certificate',
              category: 'BONAFIDE_ENROLLMENT',
              description: 'Signed certificate from Head of Department confirming regular progress.',
              mandatory: true,
              status: 'VERIFIED',
              documentName: 'Continuation_Cert_2025.pdf',
              uploadedAt: '2025-05-14T09:40:00Z',
              verifiedAt: '2025-06-10T12:00:00Z',
              verifiedBy: 'Institute Nodal Officer',
            }
          ],
          issues: []
        },
        {
          academicYear: '2026-27',
          yearIndex: 3,
          isHistoricalLocked: false,
          isCurrentRenewalYear: true,
          status: 'DEFICIENT',
          disbursedAmount: 'Pending Verification (₹4,44,000 eligible rate)',
          disbursementPipelineStatus: 'PENDING_RENEWAL',
          renewalProgressPercent: 75,
          renewalOpeningStatus: 'OPEN',
          renewalDeadline: '2026-05-31',
          daysRemaining: 34,
          cgpaPercentage: 85.0,
          institutionVerificationStatus: 'DEFICIENT',
          motaApprovalStatus: 'PENDING',
          submissionDate: '2026-04-10T14:30:00Z',
          officerRemarks: 'Supervisor signature missing on Research Progress Report Page 2. Resubmit with valid stamp.',
          changedFromLastYear: [
            {
              field: 'Research Stage',
              previousValue: 'Coursework & Topic Defense',
              currentValue: 'Advanced Experimental Data Collection',
              verified: true
            },
            {
              field: 'Bank Account Branch IFSC',
              previousValue: 'SBIN0001234',
              currentValue: 'SBIN0001234 (Aadhaar Active Seeded)',
              verified: true
            }
          ],
          requirements: [
            {
              id: 'req-y3-1',
              key: 'progress_report_y3',
              title: 'Year 3 Annual Research Progress Report',
              category: 'RESEARCH_PROGRESS',
              description: 'Annual report approved and stamped by Ph.D Research Guide/Supervisor and Dean.',
              mandatory: true,
              status: 'DEFICIENT',
              documentName: 'Draft_Year3_Progress_Report.pdf',
              uploadedAt: '2026-04-10T14:30:00Z',
              verifiedAt: '2026-04-14T11:00:00Z',
              verifiedBy: 'Institute Nodal Officer',
              deficiencyReason: {
                what: 'Current-year Annual Research Progress Report is missing the Research Supervisor endorsement signature and institutional department seal on page 2.',
                why: 'Required under the configured scheme renewal rule to verify continuous active research engagement prior to renewal approval.',
                action: 'Obtain the physical or digital signature with institutional seal from your Research Guide on page 2 and re-upload the document.'
              }
            },
            {
              id: 'req-y3-2',
              key: 'bonafide_y3',
              title: 'Current-Year Bonafide & Fee Receipt',
              category: 'BONAFIDE_ENROLLMENT',
              description: 'Bonafide certificate issued by Registrar / Academic section for Academic Year 2026-27.',
              mandatory: true,
              status: 'VERIFIED',
              documentName: 'Bonafide_DTU_2026_27.pdf',
              uploadedAt: '2026-04-10T14:30:00Z',
              verifiedAt: '2026-04-14T11:00:00Z',
              verifiedBy: 'Institute Nodal Officer'
            },
            {
              id: 'req-y3-3',
              key: 'income_declaration_y3',
              title: 'Non-Employment & Self-Declaration Affidavit',
              category: 'AFFIDAVIT_INCOME',
              description: 'Declaration affirming no other regular salary or conflicting central fellowship is being drawn.',
              mandatory: true,
              status: 'VERIFIED',
              documentName: 'Self_Declaration_Fellowship_2026.pdf',
              uploadedAt: '2026-04-10T14:30:00Z',
              verifiedAt: '2026-04-14T11:00:00Z',
              verifiedBy: 'Institute Nodal Officer'
            },
            {
              id: 'req-y3-4',
              key: 'bank_mandate_y3',
              title: 'Aadhaar-Seeded Bank Mandate Active Status',
              category: 'BANK_STATUS',
              description: 'NPCI Aadhaar seeding mapper confirmation with beneficiary account.',
              mandatory: true,
              status: 'VERIFIED',
              documentName: 'DBT_NPCI_Status_Passbook.pdf',
              uploadedAt: '2026-04-10T14:30:00Z',
              verifiedAt: '2026-04-14T11:00:00Z',
              verifiedBy: 'System Auto-Check'
            }
          ],
          issues: [
            {
              id: 'iss-001',
              type: 'MISSING_DOCUMENT',
              severity: 'HIGH',
              title: 'Research Progress Report Endorsement Deficient',
              what: 'Current-year Annual Research Progress Report has a verification deficiency: supervisor signature & seal missing on Page 2.',
              why: 'Required under the configured scheme renewal rule to validate continuous enrollment and academic standing.',
              suggestedAction: 'Re-upload the signed and stamped Research Progress Report in the Renewal Center below to resolve the deficiency.',
              requirementKey: 'progress_report_y3',
              deadline: '2026-05-31',
              detectedAt: '2026-04-14T11:00:00Z',
              status: 'OPEN'
            }
          ]
        },
        {
          academicYear: '2027-28',
          yearIndex: 4,
          isHistoricalLocked: false,
          isCurrentRenewalYear: false,
          status: 'UPCOMING',
          disbursementPipelineStatus: 'NOT_APPLICABLE',
          renewalProgressPercent: 0,
          renewalOpeningStatus: 'UPCOMING',
          renewalDeadline: '2027-05-31',
          daysRemaining: 398,
          institutionVerificationStatus: 'NOT_STARTED',
          motaApprovalStatus: 'NOT_STARTED',
          requirements: [],
          issues: []
        },
        {
          academicYear: '2028-29',
          yearIndex: 5,
          isHistoricalLocked: false,
          isCurrentRenewalYear: false,
          status: 'UPCOMING',
          disbursementPipelineStatus: 'NOT_APPLICABLE',
          renewalProgressPercent: 0,
          renewalOpeningStatus: 'UPCOMING',
          renewalDeadline: '2028-05-31',
          daysRemaining: 763,
          institutionVerificationStatus: 'NOT_STARTED',
          motaApprovalStatus: 'NOT_STARTED',
          requirements: [],
          issues: []
        }
      ]
    },

    // 2. Ananya Soren (usr-student-002)
    {
      id: 'cont-002',
      isSyntheticDemo: true,
      studentId: 'usr-student-002',
      studentName: 'Ananya Soren',
      studentEmail: 'ananya.soren@example.gov.in',
      state: 'Odisha',
      institution: 'Demo Institute of Technology (Campus B)',
      course: 'Ph.D in Biochemical Engineering',
      schemeCode: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      initialAwardYear: '2025-26',
      currentAcademicYear: '2026-27',
      totalDurationYears: 5,
      currentYearIndex: 2,
      overallContinuityStatus: 'ON_TRACK',
      overallRiskLevel: 'LOW',
      updatedAt: '2026-04-17T12:00:00Z',
      years: [
        {
          academicYear: '2025-26',
          yearIndex: 1,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹4,20,000 (Disbursed in AY 2025-26)',
          disbursedAt: '2026-02-10T10:00:00Z',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2025-06-30',
          daysRemaining: 0,
          cgpaPercentage: 91.2,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          submissionDate: '2025-05-20T10:00:00Z',
          approvalDate: '2025-06-25T11:00:00Z',
          requirements: [],
          issues: []
        },
        {
          academicYear: '2026-27',
          yearIndex: 2,
          isHistoricalLocked: false,
          isCurrentRenewalYear: true,
          status: 'PENDING_VERIFICATION',
          disbursedAmount: 'Pending Verification (₹4,44,000)',
          disbursementPipelineStatus: 'PENDING_RENEWAL',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'OPEN',
          renewalDeadline: '2026-05-31',
          daysRemaining: 34,
          cgpaPercentage: 92.5,
          institutionVerificationStatus: 'PENDING',
          motaApprovalStatus: 'PENDING',
          submissionDate: '2026-04-16T15:20:00Z',
          requirements: [
            {
              id: 'req-as-1',
              key: 'progress_report',
              title: 'Annual Progress Report',
              category: 'RESEARCH_PROGRESS',
              description: 'Verified by Guide and Dean (Research).',
              mandatory: true,
              status: 'SUBMITTED',
              documentName: 'Ananya_ProgressReport_2026.pdf',
              uploadedAt: '2026-04-16T15:10:00Z'
            },
            {
              id: 'req-as-2',
              key: 'bonafide_cert',
              title: 'Continuation Bonafide Certificate',
              category: 'BONAFIDE_ENROLLMENT',
              description: 'Institutional Bonafide 2026-27.',
              mandatory: true,
              status: 'SUBMITTED',
              documentName: 'DemoInst_Bonafide_Soren.pdf',
              uploadedAt: '2026-04-16T15:15:00Z'
            }
          ],
          issues: [
            {
              id: 'iss-002',
              type: 'VERIFICATION_PENDING',
              severity: 'LOW',
              title: 'Pending Institute Nodal Officer Verification',
              what: 'All required documents submitted. Awaiting verification sign-off.',
              why: 'Required under configured verification workflow prior to central approval.',
              suggestedAction: 'No action required by scholar. Verification officer notified to review dossier.',
              deadline: '2026-05-10',
              detectedAt: '2026-04-16T15:20:00Z',
              status: 'OPEN'
            }
          ]
        },
        {
          academicYear: '2027-28',
          yearIndex: 3,
          isHistoricalLocked: false,
          isCurrentRenewalYear: false,
          status: 'UPCOMING',
          disbursementPipelineStatus: 'NOT_APPLICABLE',
          renewalProgressPercent: 0,
          renewalOpeningStatus: 'UPCOMING',
          renewalDeadline: '2027-05-31',
          daysRemaining: 398,
          institutionVerificationStatus: 'NOT_STARTED',
          motaApprovalStatus: 'NOT_STARTED',
          requirements: [],
          issues: []
        }
      ]
    },

    // 3. Bikram Keshari Majhi (usr-st-101)
    {
      id: 'cont-003',
      isSyntheticDemo: true,
      studentId: 'usr-st-101',
      studentName: 'Bikram Keshari Majhi',
      studentEmail: 'bikram.majhi@example.org',
      state: 'Odisha',
      institution: 'Demo State University (Campus C)',
      course: 'B.Tech in Computer Science',
      schemeCode: 'POST_MATRIC',
      schemeName: 'Post Matric Scholarship for ST Students',
      initialAwardYear: '2024-25',
      currentAcademicYear: '2026-27',
      totalDurationYears: 4,
      currentYearIndex: 3,
      overallContinuityStatus: 'AT_RISK',
      overallRiskLevel: 'HIGH',
      updatedAt: '2026-04-18T10:00:00Z',
      years: [
        {
          academicYear: '2024-25',
          yearIndex: 1,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹75,000 (Disbursed in AY 2024-25)',
          disbursedAt: '2025-02-28T09:00:00Z',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2024-07-15',
          daysRemaining: 0,
          cgpaPercentage: 76.0,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          requirements: [],
          issues: []
        },
        {
          academicYear: '2025-26',
          yearIndex: 2,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹75,000 (Disbursed in AY 2025-26)',
          disbursedAt: '2026-03-05T14:00:00Z',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2025-07-15',
          daysRemaining: 0,
          cgpaPercentage: 78.5,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          requirements: [],
          issues: []
        },
        {
          academicYear: '2026-27',
          yearIndex: 3,
          isHistoricalLocked: false,
          isCurrentRenewalYear: true,
          status: 'ACTIVE_RENEWAL',
          disbursedAmount: 'Pending Submission (₹80,000 eligible)',
          disbursementPipelineStatus: 'PENDING_RENEWAL',
          renewalProgressPercent: 25,
          renewalOpeningStatus: 'OPEN',
          renewalDeadline: '2026-05-05',
          daysRemaining: 8,
          cgpaPercentage: 74.0,
          institutionVerificationStatus: 'NOT_STARTED',
          motaApprovalStatus: 'NOT_STARTED',
          requirements: [
            {
              id: 'req-bm-1',
              key: 'marksheet_sem4',
              title: 'Semester 4 Consolidated Marksheet',
              category: 'ACADEMIC_PROGRESS',
              description: 'Official marksheet showing minimum passing credits without active year-back.',
              mandatory: true,
              status: 'PENDING'
            },
            {
              id: 'req-bm-2',
              key: 'bonafide_y3',
              title: 'Year 3 Institutional Bonafide Certificate',
              category: 'BONAFIDE_ENROLLMENT',
              description: 'Certificate from Registrar certifying admission in 5th Semester.',
              mandatory: true,
              status: 'PENDING'
            },
            {
              id: 'req-bm-3',
              key: 'fee_receipt_y3',
              title: 'Current Academic Year Fee Receipt',
              category: 'BONAFIDE_ENROLLMENT',
              description: 'Verified college fee challan/receipt for 2026-27.',
              mandatory: true,
              status: 'SUBMITTED',
              documentName: 'College_Fee_Challan_2026.pdf',
              uploadedAt: '2026-04-12T09:00:00Z'
            }
          ],
          issues: [
            {
              id: 'iss-003',
              type: 'DEADLINE_APPROACHING',
              severity: 'HIGH',
              title: 'Renewal Submission Deadline Approaching (8 Days Remaining)',
              what: 'Only 1 of 3 mandatory renewal requirements submitted. Scheduled deadline is 5th May 2026.',
              why: 'Required under configured academic cycle timeline to prevent discontinuation.',
              suggestedAction: 'Upload Semester 4 Marksheet and Bonafide Certificate before 5th May 2026.',
              deadline: '2026-05-05',
              detectedAt: '2026-04-17T08:00:00Z',
              status: 'OPEN'
            },
            {
              id: 'iss-004',
              type: 'MISSING_DOCUMENT',
              severity: 'HIGH',
              title: 'Semester 4 Marksheet Missing',
              what: 'Mandatory Semester 4 mark statement has not been uploaded.',
              why: 'Continuation criteria requires academic progression proof to verify non-detention.',
              suggestedAction: 'Upload official university marksheet or DigiLocker issued copy.',
              requirementKey: 'marksheet_sem4',
              detectedAt: '2026-04-15T10:00:00Z',
              status: 'OPEN'
            }
          ]
        },
        {
          academicYear: '2027-28',
          yearIndex: 4,
          isHistoricalLocked: false,
          isCurrentRenewalYear: false,
          status: 'UPCOMING',
          disbursementPipelineStatus: 'NOT_APPLICABLE',
          renewalProgressPercent: 0,
          renewalOpeningStatus: 'UPCOMING',
          renewalDeadline: '2027-05-05',
          daysRemaining: 373,
          institutionVerificationStatus: 'NOT_STARTED',
          motaApprovalStatus: 'NOT_STARTED',
          requirements: [],
          issues: []
        }
      ]
    },

    // 4. Sujata Marndi (usr-st-102)
    {
      id: 'cont-004',
      isSyntheticDemo: true,
      studentId: 'usr-st-102',
      studentName: 'Sujata Marndi',
      studentEmail: 'sujata.marndi@example.org',
      state: 'Odisha',
      institution: 'Demo State University (Campus C)',
      course: 'M.Sc in Biotechnology',
      schemeCode: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      initialAwardYear: '2025-26',
      currentAcademicYear: '2026-27',
      totalDurationYears: 2,
      currentYearIndex: 2,
      overallContinuityStatus: 'ATTENTION_NEEDED',
      overallRiskLevel: 'MEDIUM',
      updatedAt: '2026-04-17T14:00:00Z',
      years: [
        {
          academicYear: '2025-26',
          yearIndex: 1,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹3,60,000 (Disbursed in AY 2025-26)',
          disbursedAt: '2026-02-15T11:00:00Z',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2025-06-30',
          daysRemaining: 0,
          cgpaPercentage: 81.0,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          requirements: [],
          issues: []
        },
        {
          academicYear: '2026-27',
          yearIndex: 2,
          isHistoricalLocked: false,
          isCurrentRenewalYear: true,
          status: 'DEFICIENT',
          disbursedAmount: 'Pending Deficiency Clearance (₹3,60,000)',
          disbursementPipelineStatus: 'PENDING_RENEWAL',
          renewalProgressPercent: 66,
          renewalOpeningStatus: 'OPEN',
          renewalDeadline: '2026-05-25',
          daysRemaining: 28,
          cgpaPercentage: 82.5,
          institutionVerificationStatus: 'DEFICIENT',
          motaApprovalStatus: 'PENDING',
          submissionDate: '2026-04-08T16:00:00Z',
          officerRemarks: 'Income Certificate date has crossed statutory validity period. Please upload updated certificate.',
          requirements: [
            {
              id: 'req-sm-1',
              key: 'income_cert_renew',
              title: 'Updated Family Income Certificate',
              category: 'AFFIDAVIT_INCOME',
              description: 'Valid Revenue Authority Income Certificate.',
              mandatory: true,
              status: 'DEFICIENT',
              documentName: 'Old_Income_Cert_2022.pdf',
              uploadedAt: '2026-04-08T16:00:00Z',
              deficiencyReason: {
                what: 'Uploaded Income Certificate validity has lapsed according to configured revenue rules.',
                why: 'Required under the configured scheme renewal rule to maintain active income threshold eligibility.',
                action: 'Obtain current financial year income certificate from designated revenue portal and upload.'
              }
            },
            {
              id: 'req-sm-2',
              key: 'marksheet_y2',
              title: 'M.Sc Year 1 Marksheet',
              category: 'ACADEMIC_PROGRESS',
              description: 'Passed Semester 1 & 2 coursework.',
              mandatory: true,
              status: 'VERIFIED',
              documentName: 'MSc_Sem1_2_Marks.pdf',
              uploadedAt: '2026-04-08T16:00:00Z',
              verifiedAt: '2026-04-12T14:00:00Z',
              verifiedBy: 'Institute Nodal Officer'
            }
          ],
          issues: [
            {
              id: 'iss-005',
              type: 'OUTDATED_DOCUMENT',
              severity: 'HIGH',
              title: 'Income Certificate Validity Period Lapsed',
              what: 'The uploaded income certificate was issued beyond the acceptable validity period.',
              why: 'Required under the configured scheme renewal rule to verify active income criteria.',
              suggestedAction: 'Upload renewed revenue certificate or DigiLocker verified record.',
              requirementKey: 'income_cert_renew',
              detectedAt: '2026-04-12T14:00:00Z',
              status: 'OPEN'
            }
          ]
        }
      ]
    },

    // 5. Vikram Meena (usr-st-112)
    {
      id: 'cont-005',
      isSyntheticDemo: true,
      studentId: 'usr-st-112',
      studentName: 'Vikram Meena',
      studentEmail: 'vikram.meena@example.org',
      state: 'Rajasthan',
      institution: 'Demo Technical Institute (Campus D)',
      course: 'B.Tech in Mechanical Engineering',
      schemeCode: 'POST_MATRIC',
      schemeName: 'Post Matric Scholarship for ST Students',
      initialAwardYear: '2023-24',
      currentAcademicYear: '2026-27',
      totalDurationYears: 4,
      currentYearIndex: 4,
      overallContinuityStatus: 'RENEWAL_APPROVED',
      overallRiskLevel: 'LOW',
      updatedAt: '2026-04-17T11:00:00Z',
      years: [
        {
          academicYear: '2023-24',
          yearIndex: 1,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹65,000 (Disbursed in AY 2023-24)',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2024-05-30',
          daysRemaining: 0,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          requirements: [],
          issues: []
        },
        {
          academicYear: '2024-25',
          yearIndex: 2,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹65,000 (Disbursed in AY 2024-25)',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2025-05-30',
          daysRemaining: 0,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          requirements: [],
          issues: []
        },
        {
          academicYear: '2025-26',
          yearIndex: 3,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹65,000 (Disbursed in AY 2025-26)',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2026-02-28',
          daysRemaining: 0,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          requirements: [],
          issues: []
        },
        {
          academicYear: '2026-27',
          yearIndex: 4,
          isHistoricalLocked: false,
          isCurrentRenewalYear: true,
          status: 'APPROVED_FOR_DISBURSEMENT',
          disbursedAmount: 'Renewal Approved — Queued for PFMS Processing (₹70,000)',
          disbursementPipelineStatus: 'PENDING_PFMS_PROCESSING',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'OPEN',
          renewalDeadline: '2026-05-30',
          daysRemaining: 33,
          cgpaPercentage: 82.0,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          submissionDate: '2026-04-02T10:00:00Z',
          approvalDate: '2026-04-15T16:00:00Z',
          officerRemarks: 'All documents verified. Final year scholarship renewal approved. Routed to disbursement pipeline.',
          requirements: [
            {
              id: 'req-vm-1',
              key: 'marksheet_y4',
              title: 'Year 3 Marksheet',
              category: 'ACADEMIC_PROGRESS',
              description: 'Passed all theory and practical subjects.',
              mandatory: true,
              status: 'VERIFIED',
              documentName: 'Year3_Marksheet.pdf',
              uploadedAt: '2026-04-02T10:00:00Z',
              verifiedAt: '2026-04-15T16:00:00Z',
              verifiedBy: 'Institute Nodal Officer'
            }
          ],
          issues: []
        }
      ]
    }
  ];
}
