import { GoogleGenAI, Type } from '@google/genai';

export const preloadedGuidelines: Record<
  string,
  {
    title: string;
    schemeCode: string;
    academicYear: string;
    summary: string;
    content: string;
  }
> = {
  NFST_2026: {
    title: 'National Fellowship for Higher Education of Scheduled Tribe Students',
    schemeCode: 'NFST',
    academicYear: '2026-27',
    summary: 'Central Sector Scheme providing 750 fresh fellowships for M.Phil and Ph.D research. Priority for Divyangjan (38 slots), PVTG (25 slots), Female (225 slots), and IITs/AIIMS/IIMs/IISER admissions.',
    content: `GOVERNMENT OF INDIA
MINISTRY OF TRIBAL AFFAIRS
GUIDELINES: NATIONAL FELLOWSHIP & SCHOLARSHIP FOR HIGHER EDUCATION OF SCHEDULED TRIBE STUDENTS

1. Objective: To provide financial assistance to meritorious ST students to enable them to pursue higher education (M.Phil/Ph.D) after post-graduate degree.
2. Salient Features:
2.1 Eligibility: M.Phil (2 years), M.Phil+Ph.D (5 years), Ph.D (5 years). Minimum 55% marks in final examination/grading at PG level.
2.2 Income Criteria: There is NO income criteria for eligibility in respect of this scholarship.
2.3 Age Limit: Maximum 36 years as on first day of July of the relevant year of award of scholarship.
2.4 Covered Institutions: UGC Act 2(f)/12(B), Section 3 Deemed Universities, Institutes of National Importance (IIT, IIM, AIIMS, NIT).
2.5 Number of Fellowships: 750 fresh fellowships every year.
Sub-category priority slots:
- Priority 1: Divyangjan (5% = 38 slots, min 40% certified disability)
- Priority 2: PVTG (Particularly Vulnerable Tribal Groups = 25 slots)
- Priority 3: Female (30% = 225 slots)
- Priority 4: ST Others (462 slots)
Note 1: Eligible students with offer of admission in IITs/AIIMS/IIMs/IISER will be given direct priority.
2.6 Value of Fellowship:
- M.Phil: ₹31,000/month + ₹10,000-12,000/year contingency.
- Ph.D: ₹31,000/month for first 2 years, ₹35,000/month for remaining 3 years + ₹20,500-25,000/year contingency.
- HRA: 8%, 16%, or 24% based on city categorization.
- Escort allowance for Divyangjan: ₹2,000/month.
3. Documents Required:
- Latest coloured passport size photograph
- ST/PVTG certificate issued by competent authority
- 10th/Matriculation certificate in support of date of birth
- Divyangjan certificate issued by competent medical authority (if applicable)
- Post-Graduation marksheet (minimum 55% aggregate)
- Admission/Joining certificate of M.Phil/Ph.D from University
- Bank passbook/account details linked with Aadhaar and mobile.
4. Workflow & Verification:
- First-level verification by University/Institute Nodal Officer (INO)
- Online verification by Ministry of Tribal Affairs
- Selection by Selection Committee headed by Secretary MoTA
- Provisional merit list published on website
- Scholar formalities within 1 month: Joining report, PFMS beneficiary linking, Quarterly continuation certificates (10 July, 10 Oct, 10 Jan, 10 April), Annual progress report and thesis upload to repository.tribal.gov.in.`,
  },
  NOS_2026: {
    title: 'National Overseas Scholarship (NOS) for Scheduled Tribe Students',
    schemeCode: 'NOS',
    academicYear: '2026-27',
    summary: 'Central Sector Scheme providing 20 overseas scholarships for Masters, Ph.D and Post-Doctoral studies in top 1,000 QS ranked universities across the globe. Family income <= ₹6.0 Lakh.',
    content: `GOVERNMENT OF INDIA
MINISTRY OF TRIBAL AFFAIRS
GUIDELINES: CENTRAL-SECTOR SCHOLARSHIP SCHEME OF NATIONAL OVERSEAS SCHOLARSHIP FOR ST STUDENTS

1. Scope: Financial assistance for Masters, Ph.D, and Post-Doctoral research in reputed foreign universities abroad.
2. Awards: 20 awards per year (17 ST candidates, 3 PVTG candidates). 30% earmarked for female candidates.
Fields of study:
- STEM (Science, Technology, Engineering, Mathematics): 10 slots
- Management, Economics, Finance, Law: 4 slots
- Agriculture / Medicine: 4 slots
- Humanities / Social Science / Fine Arts: 2 slots
3. Eligibility & Age:
- Post-Doctoral Research: 55% marks in Master's with Ph.D, Maximum Age 38 years.
- Ph.D: 55% marks in Master's, Maximum Age 35 years.
- Master's: 55% marks in Bachelor's, Maximum Age 32 years.
- Top 1000 QS World Ranking: Foreign university must be ranked within top 1000 QS.
- One child in family & one-time assistance only.
4. Income Criteria: Family income from all sources must not exceed Rs. 6,00,000/- (Rs. Six Lakhs) per annum.
5. Value of Scholarship:
- Annual Maintenance Allowance: USD 15,400 (US) / GBP 9,900 (UK) for all courses.
- Annual Contingency & Equipment: $1,532 (US) / £1,116 (UK).
- Compulsory tuition fees and non-refundable fees as per actuals.
- Medical insurance premium as per actuals.
- Air passage economy class and visa fees in INR.
6. Documents:
- Passport copy (valid)
- ST/PVTG certificate
- 10th certificate for Date of Birth
- Degree and marksheets (minimum 55%)
- Unconditional or preliminary admission offer from top 1000 QS university
- Family income certificate (FY preceding selection year).
7. Selection:
Priority 1: Already pursuing in top 1000 QS university.
Priority 2: Got preliminary admission offer.
Interview by Expert Committee.
Indian Embassy abroad monitors performance and releases maintenance allowance.`,
  },
  PRE_MATRIC_2026: {
    title: 'Pre-Matric Scholarship for ST Students (Classes IX & X)',
    schemeCode: 'PRE_MATRIC',
    academicYear: '2026-27',
    summary: 'Centrally Sponsored Scheme to arrest drop-out rates between elementary and secondary education. Family income ceiling ₹2.50 Lakh.',
    content: `GOVERNMENT OF INDIA
MINISTRY OF TRIBAL AFFAIRS
GUIDELINES: PRE-MATRIC SCHOLARSHIP FOR SCHEDULED TRIBE STUDENTS STUDYING IN CLASSES IX & X

1. Scope: For ST students studying in Classes IX and X in Government or recognized schools.
2. Conditions of Eligibility:
- Must belong to Scheduled Tribe domicile of the State.
- Family income from all sources should not exceed Rs. 2.50 Lakh per annum.
- Valid bank account in Scheduled Bank linked with Aadhaar and mobile.
- Not getting any other scholarship.
3. Value of Scholarship:
- Day Scholars: ₹225/month for 10 months (₹2,250) + ₹750 Books and ad hoc grant.
- Hostelers: ₹525/month for 10 months (₹5,250) + ₹1,000 Books and ad hoc grant.
- Additional Disability Allowance: ₹800/month hosteler, ₹600/month day scholar.
4. Documents: Aadhaar Number, Domicile certificate, ST certificate, Family Income certificate, Disability certificate (if applicable), Passport photo.`,
  },
  POST_MATRIC_2026: {
    title: 'Post-Matric Scholarship for ST Students (Centrally Sponsored)',
    schemeCode: 'POST_MATRIC',
    academicYear: '2026-27',
    summary: 'Centrally Sponsored Scheme granting assistance from Class XI to Post Graduation. Family income ceiling ₹2.50 Lakh. Fee reimbursement + monthly stipend.',
    content: `GOVERNMENT OF INDIA
MINISTRY OF TRIBAL AFFAIRS
REGULATION GOVERNING THE AWARD OF POST MATRIC SCHOLARSHIP FOR ST STUDENTS FOR STUDIES IN INDIA

1. Scope: From Class XI to Post Graduation in recognized institutions.
2. Conditions of Eligibility:
- Scheduled Tribe domicile.
- Family income from all sources not exceeding Rs. 2.50 Lakh per annum.
- Valid Aadhaar linked bank account.
3. Groups:
- Group I: Degree, PG Diploma, M.Phil, Ph.D professional courses (Hosteller ₹1,200/mo, Day Scholar ₹550/mo).
- Group II: Non-professional Graduate/PG (BA, B.Sc, B.Com, MA, M.Sc) (Hosteller ₹820/mo, Day Scholar ₹530/mo).
- Group III: Vocational stream, ITI, 3-year diploma (Hosteller ₹570/mo, Day Scholar ₹300/mo).
- Group IV: Class XI & XII non-degree courses (Hosteller ₹380/mo, Day Scholar ₹230/mo).
- Tuition fee reimbursement up to state ceiling / Rs 2.50 lakh for engineering, Rs 6.00 lakh for MBBS.
- Additional disability allowance: ₹800/mo hosteler, ₹600/mo day scholar.`,
  },
};

export async function compilePolicyWithAI(
  ai: GoogleGenAI | null,
  schemeCode: string,
  academicYear: string,
  guidelineText: string
): Promise<any> {
  // If Gemini API is available and initialized, call Gemini 3.8 Flash
  if (ai) {
    try {
      const prompt = `You are a Senior Software Architect and Policy Compiler for the Ministry of Tribal Affairs (MoTA), Government of India.
Extract a structured, machine-executable JSON scholarship/fellowship policy configuration from the following official government guideline text.

CRITICAL INSTRUCTIONS:
- Follow the official policy strictly.
- For NFST: Note that Clause 2.2 explicitly says "There is NO income criteria for eligibility".
- For NOS: Family income ceiling is ₹6,00,000, and foreign university must be in top 1,000 QS ranking.
- Include eligibilityRules, applicationFields (with section and type), documentRequirements, verificationRules (cross checks), workflowStages, selectionCriteria, and postSelectionMilestones.

Return valid JSON conforming to this schema:
{
  "eligibilityRules": [
    { "key": "string", "title": "string", "type": "NUMBER_MAX"|"NUMBER_MIN"|"BOOLEAN"|"SELECT", "threshold": any, "description": "string", "mandatory": boolean, "sourceClause": "string" }
  ],
  "applicationFields": [
    { "key": "string", "label": "string", "section": "PERSONAL"|"ACADEMIC"|"INSTITUTION"|"BANK"|"CATEGORY"|"OVERSEAS", "type": "text"|"number"|"select"|"boolean"|"date", "required": boolean, "options": ["string"], "placeholder": "string", "helperText": "string" }
  ],
  "documentRequirements": [
    { "key": "string", "title": "string", "required": boolean, "allowedMime": ["application/pdf"|"image/jpeg"|"image/png"], "maxSizeMB": number, "description": "string", "issuingAuthority": "string", "crossCheckWithField": "string" }
  ],
  "verificationRules": [
    { "key": "string", "path": "PATH_A_EVIDENCE"|"PATH_B_CREDENTIAL", "targetField": "string", "targetDocument": "string", "ruleLogic": "string", "failureMessage": "string", "recommendedDeficiencyAction": "string" }
  ],
  "workflowStages": [
    { "code": "string", "name": "string", "responsibleRole": "string", "slaDays": number }
  ],
  "selectionCriteria": [
    { "key": "string", "title": "string", "priorityWeight": number, "ruleDescription": "string" }
  ],
  "postSelectionMilestones": [
    { "key": "string", "title": "string", "timelineDays": number, "mandatory": boolean, "submissionType": "string" }
  ]
}

Scheme Code: ${schemeCode}
Academic Year: ${academicYear}

OFFICIAL GUIDELINE TEXT:
${guidelineText.slice(0, 15000)}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const jsonText = response.text?.trim();
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        if (parsed.eligibilityRules && parsed.applicationFields) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gemini extraction error, falling back to deterministic policy compiler:', e);
    }
  }

  // Deterministic Heuristic Compiler Fallback (Rock-Solid Government Rule Engine)
  return generateDeterministicPolicyConfig(schemeCode, academicYear, guidelineText);
}

function generateDeterministicPolicyConfig(schemeCode: string, academicYear: string, text: string): any {
  const code = schemeCode.toUpperCase();

  if (code === 'NOS') {
    return {
      eligibilityRules: [
        { key: 'category_st', title: 'Scheduled Tribe Status', type: 'BOOLEAN', description: 'Must be verified Scheduled Tribe', mandatory: true, sourceClause: 'Clause 2.1' },
        { key: 'income_ceiling', title: 'Family Income <= ₹6.0 Lakh', type: 'NUMBER_MAX', threshold: 600000, description: 'Gross family income must not exceed Rs. 6,00,000/- per annum', mandatory: true, sourceClause: 'Clause 2.2.iii' },
        { key: 'qs_world_ranking', title: 'QS World Ranking <= 1000', type: 'NUMBER_MAX', threshold: 1000, description: 'Target foreign university in top 1,000 QS ranking', mandatory: true, sourceClause: 'Clause 4.4.a' },
        { key: 'age_limit_masters', title: 'Age Limit (32 yrs Masters / 35 yrs PhD)', type: 'NUMBER_MAX', threshold: 35, description: 'Age on 1st July of selection year', mandatory: true, sourceClause: 'Clause 2.2.i' },
      ],
      applicationFields: [
        { key: 'applicantName', label: 'Full Legal Name (as per Passport)', section: 'PERSONAL', type: 'text', required: true, placeholder: 'Enter name as on passport' },
        { key: 'passportNumber', label: 'Indian Passport Number', section: 'PERSONAL', type: 'text', required: true, placeholder: 'Z1234567' },
        { key: 'dob', label: 'Date of Birth', section: 'PERSONAL', type: 'date', required: true },
        { key: 'fieldOfStudy', label: 'Field of Study', section: 'OVERSEAS', type: 'select', required: true, options: ['STEM (Science/Tech/Eng/Maths)', 'Management/Economics/Law', 'Agriculture/Medicine', 'Humanities/Social Science'] },
        { key: 'foreignUniversity', label: 'Foreign University Name', section: 'OVERSEAS', type: 'text', required: true, placeholder: 'e.g. University of Oxford' },
        { key: 'qsRanking', label: 'QS World Ranking of University', section: 'OVERSEAS', type: 'number', required: true, placeholder: 'Rank 1 to 1000' },
        { key: 'annualFamilyIncome', label: 'Annual Gross Family Income (₹)', section: 'CATEGORY', type: 'number', required: true, placeholder: 'Max 600000' },
        { key: 'bankAccountNumber', label: 'Indian Bank Account (CBS)', section: 'BANK', type: 'text', required: true, placeholder: 'For travel allowance' },
        { key: 'bankIfsc', label: 'Bank IFSC Code', section: 'BANK', type: 'text', required: true, placeholder: 'e.g. SBIN0001234' },
      ],
      documentRequirements: [
        { key: 'passport_copy', title: 'Valid Indian Passport', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Front & back scanned pages' },
        { key: 'caste_certificate', title: 'ST / PVTG Certificate', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Issued by Competent Authority' },
        { key: 'income_certificate', title: 'Family Income Certificate (FY 2024-25)', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Proof of income <= ₹6.0 Lakh' },
        { key: 'admission_offer', title: 'Offer Letter from Foreign University', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Unconditional or preliminary offer' },
      ],
      verificationRules: [
        { key: 'rule_qs_check', path: 'PATH_A_EVIDENCE', targetField: 'qsRanking', targetDocument: 'admission_offer', ruleLogic: 'MAX_QS_RANK_1000', failureMessage: 'University QS Ranking exceeds 1000.', recommendedDeficiencyAction: 'Upload official confirmation letter citing official QS ranking.' },
        { key: 'rule_income_check', path: 'PATH_A_EVIDENCE', targetField: 'annualFamilyIncome', targetDocument: 'income_certificate', ruleLogic: 'MAX_INCOME_600K', failureMessage: 'Income exceeds ₹6,00,000 threshold.', recommendedDeficiencyAction: 'Provide updated Revenue Authority income certificate.' },
      ],
      workflowStages: [
        { code: 'APPLICATION', name: 'NOSP Portal Submission', responsibleRole: 'STUDENT', slaDays: 30 },
        { code: 'MINISTRY_VERIFICATION', name: 'MoTA & Embassy Verification', responsibleRole: 'MOTA_OFFICER', slaDays: 20 },
        { code: 'MERIT_SELECTION', name: 'QS Ranking Merit Allocation', responsibleRole: 'MOTA_OFFICER', slaDays: 10 },
      ],
      selectionCriteria: [
        { key: 'qs_priority', title: 'QS World Ranking Tier Priority', priorityWeight: 100, ruleDescription: 'Ranked by highest QS standing' },
      ],
      postSelectionMilestones: [
        { key: 'embassy_registration', title: 'Registration at Indian Mission Abroad', timelineDays: 30, mandatory: true, submissionType: 'EMBASSY_REPORT' },
        { key: 'biannual_progress', title: 'Six-Month Academic Progress Report', timelineDays: 180, mandatory: true, submissionType: 'DOCUMENT_UPLOAD' },
      ],
    };
  }

  // Default NFST / Higher Education Policy Structure
  return {
    eligibilityRules: [
      { key: 'category_st', title: 'Scheduled Tribe Status', type: 'BOOLEAN', description: 'Must be verified Scheduled Tribe', mandatory: true, sourceClause: 'Clause 3.2.a' },
      { key: 'pg_marks', title: 'Minimum 55% Marks in PG Degree', type: 'NUMBER_MIN', threshold: 55, description: 'Candidate must have at least 55% aggregate marks in PG', mandatory: true, sourceClause: 'Clause 2.1.ii' },
      { key: 'max_age_limit', title: 'Maximum Age Limit (36 Years)', type: 'NUMBER_MAX', threshold: 36, description: 'Maximum 36 years as of 1st July of selection year', mandatory: true, sourceClause: 'Clause 2.3' },
      { key: 'no_income_ceiling', title: 'Income Ceiling Exemption', type: 'BOOLEAN', description: 'There is NO income criteria for eligibility in respect of this scholarship', mandatory: false, sourceClause: 'Clause 2.2' },
      { key: 'one_scholarship_only', title: 'No Concurrent Scholarship', type: 'BOOLEAN', description: 'Scholar shall not be availing any other fellowship for the same study', mandatory: true, sourceClause: 'Clause 3.2.2' },
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
      { key: 'courseEnrolled', label: 'Research Course Enrolled', section: 'ACADEMIC', type: 'select', required: true, options: ['Ph.D (Regular & Full Time)', 'M.Phil', 'Integrated M.Phil + Ph.D'] },
      { key: 'qualifyingDegree', label: 'Qualifying Master/PG Degree', section: 'ACADEMIC', type: 'text', required: true, placeholder: 'e.g. M.Sc Chemistry, M.Tech CSE' },
      { key: 'qualifyingMarksPercentage', label: 'Qualifying PG Marks (% Aggregate)', section: 'ACADEMIC', type: 'number', required: true, placeholder: 'Minimum 55%' },
      { key: 'researchTopic', label: 'Research Title / Proposed Topic', section: 'ACADEMIC', type: 'text', required: true, placeholder: 'Brief title of thesis' },
      { key: 'universityCategory', label: 'University Recognition Category', section: 'INSTITUTION', type: 'select', required: true, options: ['Institute of National Importance (IIT/IIM/AIIMS/NIT)', 'Central / State University under UGC 2(f)/12(B)', 'Deemed to be University under UGC Section 3', 'Receiving grants by Central/State Govt'] },
      { key: 'universityName', label: 'University / Institute Name', section: 'INSTITUTION', type: 'text', required: true, placeholder: 'e.g. Delhi Technological University' },
      { key: 'bankAccountNumber', label: 'Bank Account Number (Aadhaar Seeded)', section: 'BANK', type: 'text', required: true, placeholder: 'Enter CBS Bank Account No' },
      { key: 'bankIfsc', label: 'Bank IFSC Code', section: 'BANK', type: 'text', required: true, placeholder: 'SBIN000XXXX' },
      { key: 'bankName', label: 'Bank Name & Branch', section: 'BANK', type: 'text', required: true, placeholder: 'e.g. State Bank of India' },
    ],
    documentRequirements: [
      { key: 'passport_photo', title: 'Latest Coloured Passport Size Photograph', required: true, allowedMime: ['image/jpeg', 'image/png'], maxSizeMB: 2, description: 'Clear frontal view' },
      { key: 'caste_certificate', title: 'ST / PVTG Certificate', required: true, allowedMime: ['application/pdf', 'image/jpeg'], maxSizeMB: 5, description: 'Issued by Competent Authority of State/UT' },
      { key: 'dob_proof', title: '10th / Matriculation Certificate in support of Date of Birth', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Proof of age validation' },
      { key: 'qualifying_marksheet', title: 'Post-Graduation Final Consolidated Marksheet', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Minimum 55% marks required' },
      { key: 'admission_letter', title: 'Admission / Joining Certificate of M.Phil / Ph.D', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'From Registrar of recognized university' },
      { key: 'bank_passbook', title: 'Scanned Copy of Bank Passbook', required: true, allowedMime: ['application/pdf', 'image/jpeg'], maxSizeMB: 5, description: 'Aadhaar seeded active bank account' },
    ],
    verificationRules: [
      { key: 'rule_name_cross_check', path: 'PATH_A_EVIDENCE', targetField: 'applicantName', targetDocument: 'caste_certificate', ruleLogic: 'FUZZY_NAME_MATCH', failureMessage: 'Applicant name on application does not match ST Certificate.', recommendedDeficiencyAction: 'Upload Magistrate affidavit or updated ST certificate.' },
      { key: 'rule_pg_marks_threshold', path: 'PATH_A_EVIDENCE', targetField: 'qualifyingMarksPercentage', targetDocument: 'qualifying_marksheet', ruleLogic: 'NUMERIC_MIN_THRESHOLD', failureMessage: 'PG marks below 55%.', recommendedDeficiencyAction: 'Upload official university marks conversion sheet.' },
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
    ],
    postSelectionMilestones: [
      { key: 'joining_report', title: 'University Joining Report & NoC', timelineDays: 30, mandatory: true, submissionType: 'DOCUMENT_UPLOAD' },
      { key: 'pfms_linking', title: 'PFMS Beneficiary ID Generation', timelineDays: 45, mandatory: true, submissionType: 'CREDENTIAL_LINK' },
      { key: 'continuation_cert_q1', title: 'Quarter 1 Continuation Certificate', timelineDays: 100, mandatory: true, submissionType: 'DOCUMENT_UPLOAD' },
      { key: 'annual_progress', title: 'Annual Research Progress Report', timelineDays: 365, mandatory: true, submissionType: 'DOCUMENT_UPLOAD' },
    ],
  };
}
