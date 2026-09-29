import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  FileCheck2,
  Building2,
  MapPin,
  GraduationCap,
  Layers,
  ChevronRight,
  Filter,
  Search,
  ExternalLink,
  ArrowRight,
  Info,
  Calendar,
  CreditCard,
  FileText,
  UserCheck,
  RefreshCw,
  X,
  SlidersHorizontal,
  Scale
} from 'lucide-react';
import { Application, User } from '../api';

interface JvsIntelligenceProps {
  currentUser: User;
  applications: Application[];
  onOpenApplication: (appId: string, targetTab?: 'verification' | 'scrutiny' | 'selection') => void;
  onBackToWorkbench: () => void;
}

type AttentionCategory =
  | 'ALL'
  | 'AI_FLAGGED'
  | 'DOCUMENTS_ATTENTION'
  | 'FINANCIAL_PENDING'
  | 'READY_FOR_SCRUTINY'
  | 'VERIFICATION_PENDING'
  | 'DEFICIENCY_RETURNED'
  | 'DELAY_AGEING_RISK';

export const JvsIntelligence: React.FC<JvsIntelligenceProps> = ({
  currentUser,
  applications,
  onOpenApplication,
  onBackToWorkbench,
}) => {
  // Top Active View Tab inside JVS Intelligence
  const [activeSection, setActiveSection] = useState<'analytics' | 'decision_support' | 'bottlenecks' | 'ageing' | 'deficiencies'>('analytics');

  // Academic Cycle
  const [selectedCycle, setSelectedCycle] = useState('2026–27');

  // Cohort Drill-Down Hierarchy State: State -> Institute -> Scheme -> Course
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedInstitute, setSelectedInstitute] = useState<string | null>(null);
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Deficiency Drill-Down Hierarchy State: Deficiency -> State -> Institute -> Scheme -> Course
  const [selectedDefType, setSelectedDefType] = useState<string | null>(null);
  const [defDrillState, setDefDrillState] = useState<string | null>(null);
  const [defDrillInstitute, setDefDrillInstitute] = useState<string | null>(null);
  const [defDrillScheme, setDefDrillScheme] = useState<string | null>(null);

  // Decision Support Attention Filter & Search
  const [attentionFilter, setAttentionFilter] = useState<AttentionCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Application for Explainability Inspection Drawer / Modal
  const [inspectedApp, setInspectedApp] = useState<any | null>(null);

  // Filter applications by academic cycle (defaults to 2026-27 or all)
  const cycleApps = useMemo(() => {
    return applications.filter((app) => {
      if (selectedCycle === '2026–27') {
        return !app.academicYear || app.academicYear.includes('2026');
      }
      return app.academicYear?.includes(selectedCycle.split('–')[0]);
    });
  }, [applications, selectedCycle]);

  // Helper to extract application metadata safely
  const getAppMeta = (app: Application) => {
    const fv = app.fieldValues || {};
    const state = fv.domicileState || fv.state || 'Odisha';
    const institute = fv.universityName || fv.institutionName || fv.institute || 'Delhi Technological University';
    const course = fv.courseEnrolled || fv.course || 'Ph.D';
    const scheme = app.schemeCode || 'NFST';

    // Calculate pending days
    let daysPending = fv.daysPending;
    if (daysPending === undefined) {
      const createdDate = new Date(app.createdAt || Date.now()).getTime();
      const now = new Date('2026-04-18T10:00:00Z').getTime();
      daysPending = Math.max(1, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)));
    }

    // Determine category
    const isAiInconsistency = fv.isAiFlaggedInconsistency || app.verificationStatus === 'FLAGGED';
    const isDeficient = app.status === 'DEFICIENCY';
    const isResubmitted = app.status === 'RESUBMITTED';
    const isFinancialPending = fv.hasFinancialVerificationPending || fv.deficiencyType === 'BANK_INFO';
    const isReadyForScrutiny = app.status === 'READY_FOR_SCRUTINY' || app.status === 'SCRUTINY';
    const isSelected = app.status === 'SELECTED' || app.status === 'POST_SELECTION';
    const isVerificationPending =
      app.status === 'SUBMITTED' || app.status === 'ELIGIBILITY_CHECK' || app.status === 'VERIFICATION';
    const isAgeingRisk = daysPending >= 15;

    // Reason & Explainability
    let reason = fv.attentionReason;
    let evidence = fv.attentionEvidence;
    let suggestedAction = fv.suggestedAction;

    if (!reason) {
      if (isAiInconsistency) {
        reason = 'Document information mismatch detected.';
        evidence = 'Application information and uploaded document contain different values.';
        suggestedAction = 'Review relevant documents in PRAMAAN verification bench.';
      } else if (isDeficient) {
        reason = 'Deficiency notice pending resolution from candidate.';
        evidence = 'One or more required documents flagged for disparity or non-compliance.';
        suggestedAction = 'Monitor student resubmission desk.';
      } else if (isResubmitted) {
        reason = 'Candidate resubmitted replacement documents after defect notice.';
        evidence = 'Fresh proof uploaded by student awaiting re-verification signoff.';
        suggestedAction = 'Re-evaluate verification case and clear defect.';
      } else if (isFinancialPending) {
        reason = 'PFMS / APB Aadhaar Bank bridge verification pending.';
        evidence = 'Bank account CBS response or Aadhaar linking mandate unconfirmed.';
        suggestedAction = 'Review account IFSC and initiate NPCI bridge re-check.';
      } else if (isAgeingRisk) {
        reason = 'Processing time approaching or exceeding configured threshold.';
        evidence = `Application pending for ${daysPending} days (Configured SLA benchmark: 15 days).`;
        suggestedAction = 'Prioritize verification or issue administrative escalation.';
      } else if (isReadyForScrutiny) {
        reason = 'Complete & verified credentials ready for Committee Scrutiny.';
        evidence = 'Dual-Path PRAMAAN verification passed with 100% policy congruence.';
        suggestedAction = 'Assign committee member and record scrutiny score.';
      } else {
        reason = 'Initial application submitted and queued for verification.';
        evidence = 'Application received with uploaded certificate bundle.';
        suggestedAction = 'Execute automated PRAMAAN verification.';
      }
    }

    return {
      state,
      institute,
      course,
      scheme,
      daysPending,
      isAiInconsistency,
      isDeficient,
      isResubmitted,
      isFinancialPending,
      isReadyForScrutiny,
      isSelected,
      isVerificationPending,
      isAgeingRisk,
      reason,
      evidence,
      suggestedAction,
    };
  };

  // High-Level Cohort Metrics (Cycle 2026-27)
  const cohortMetrics = useMemo(() => {
    let completedScrutiny = 0;
    let verificationPending = 0;
    let deficientApps = 0;
    let returnedForCorrection = 0;
    let selectedApps = 0;
    let financialPending = 0;

    cycleApps.forEach((app) => {
      const meta = getAppMeta(app);
      if (meta.isReadyForScrutiny || meta.isSelected) completedScrutiny++;
      if (meta.isVerificationPending) verificationPending++;
      if (meta.isDeficient) deficientApps++;
      if (meta.isResubmitted) returnedForCorrection++;
      if (meta.isSelected) selectedApps++;
      if (meta.isFinancialPending) financialPending++;
    });

    return {
      total: cycleApps.length,
      completedScrutiny,
      verificationPending,
      deficientApps,
      returnedForCorrection,
      selectedApps,
      financialPending,
    };
  }, [cycleApps]);

  // Recommended Attention Queue Organized by Category
  const attentionQueue = useMemo(() => {
    return cycleApps.map((app) => {
      const meta = getAppMeta(app);
      let cat: AttentionCategory = 'VERIFICATION_PENDING';

      if (meta.isAiInconsistency) cat = 'AI_FLAGGED';
      else if (meta.isDeficient) cat = 'DOCUMENTS_ATTENTION';
      else if (meta.isFinancialPending) cat = 'FINANCIAL_PENDING';
      else if (meta.isResubmitted) cat = 'DEFICIENCY_RETURNED';
      else if (meta.isAgeingRisk) cat = 'DELAY_AGEING_RISK';
      else if (meta.isReadyForScrutiny) cat = 'READY_FOR_SCRUTINY';
      else if (meta.isVerificationPending) cat = 'VERIFICATION_PENDING';

      return {
        app,
        meta,
        cat,
      };
    });
  }, [cycleApps]);

  // Filtered Attention Queue
  const filteredAttentionQueue = useMemo(() => {
    return attentionQueue.filter(({ app, meta, cat }) => {
      if (attentionFilter !== 'ALL') {
        if (attentionFilter === 'DELAY_AGEING_RISK' && !meta.isAgeingRisk) return false;
        if (attentionFilter === 'FINANCIAL_PENDING' && !meta.isFinancialPending) return false;
        if (attentionFilter === 'AI_FLAGGED' && !meta.isAiInconsistency) return false;
        if (attentionFilter === 'DOCUMENTS_ATTENTION' && !meta.isDeficient && cat !== 'DOCUMENTS_ATTENTION') return false;
        if (attentionFilter === 'READY_FOR_SCRUTINY' && !meta.isReadyForScrutiny) return false;
        if (attentionFilter === 'VERIFICATION_PENDING' && !meta.isVerificationPending) return false;
        if (attentionFilter === 'DEFICIENCY_RETURNED' && !meta.isResubmitted) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = app.applicationNumber.toLowerCase().includes(q);
        const matchName = (app.applicantName || app.fieldValues?.applicantName || '').toLowerCase().includes(q);
        const matchInst = meta.institute.toLowerCase().includes(q);
        const matchState = meta.state.toLowerCase().includes(q);
        const matchCourse = meta.course.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchInst && !matchState && !matchCourse) return false;
      }

      return true;
    });
  }, [attentionQueue, attentionFilter, searchQuery]);

  // Category counts for Decision Support Queue
  const categoryCounts = useMemo(() => {
    const counts: Record<AttentionCategory, number> = {
      ALL: attentionQueue.length,
      AI_FLAGGED: attentionQueue.filter((x) => x.meta.isAiInconsistency).length,
      DOCUMENTS_ATTENTION: attentionQueue.filter((x) => x.meta.isDeficient).length,
      FINANCIAL_PENDING: attentionQueue.filter((x) => x.meta.isFinancialPending).length,
      READY_FOR_SCRUTINY: attentionQueue.filter((x) => x.meta.isReadyForScrutiny).length,
      VERIFICATION_PENDING: attentionQueue.filter((x) => x.meta.isVerificationPending).length,
      DEFICIENCY_RETURNED: attentionQueue.filter((x) => x.meta.isResubmitted).length,
      DELAY_AGEING_RISK: attentionQueue.filter((x) => x.meta.isAgeingRisk).length,
    };
    return counts;
  }, [attentionQueue]);

  // Cohort Drill-Down Aggregates: State -> Institute -> Scheme -> Course
  const cohortDrillData = useMemo(() => {
    const statesMap: Record<string, { total: number; pending: number; completed: number; deficient: number; financial: number; apps: Application[] }> = {};

    cycleApps.forEach((app) => {
      const meta = getAppMeta(app);
      if (!statesMap[meta.state]) {
        statesMap[meta.state] = { total: 0, pending: 0, completed: 0, deficient: 0, financial: 0, apps: [] };
      }
      statesMap[meta.state].total++;
      if (meta.isVerificationPending) statesMap[meta.state].pending++;
      if (meta.isReadyForScrutiny || meta.isSelected) statesMap[meta.state].completed++;
      if (meta.isDeficient || meta.isResubmitted) statesMap[meta.state].deficient++;
      if (meta.isFinancialPending) statesMap[meta.state].financial++;
      statesMap[meta.state].apps.push(app);
    });

    // Institutes for selectedState
    const institutesMap: Record<string, { total: number; pending: number; completed: number; deficient: number; financial: number; apps: Application[] }> = {};
    if (selectedState) {
      cycleApps
        .filter((a) => getAppMeta(a).state === selectedState)
        .forEach((app) => {
          const meta = getAppMeta(app);
          if (!institutesMap[meta.institute]) {
            institutesMap[meta.institute] = { total: 0, pending: 0, completed: 0, deficient: 0, financial: 0, apps: [] };
          }
          institutesMap[meta.institute].total++;
          if (meta.isVerificationPending) institutesMap[meta.institute].pending++;
          if (meta.isReadyForScrutiny || meta.isSelected) institutesMap[meta.institute].completed++;
          if (meta.isDeficient || meta.isResubmitted) institutesMap[meta.institute].deficient++;
          if (meta.isFinancialPending) institutesMap[meta.institute].financial++;
          institutesMap[meta.institute].apps.push(app);
        });
    }

    // Schemes for selectedInstitute
    const schemesMap: Record<string, { total: number; pending: number; completed: number; deficient: number; financial: number; apps: Application[] }> = {};
    if (selectedState && selectedInstitute) {
      cycleApps
        .filter((a) => {
          const m = getAppMeta(a);
          return m.state === selectedState && m.institute === selectedInstitute;
        })
        .forEach((app) => {
          const meta = getAppMeta(app);
          if (!schemesMap[meta.scheme]) {
            schemesMap[meta.scheme] = { total: 0, pending: 0, completed: 0, deficient: 0, financial: 0, apps: [] };
          }
          schemesMap[meta.scheme].total++;
          if (meta.isVerificationPending) schemesMap[meta.scheme].pending++;
          if (meta.isReadyForScrutiny || meta.isSelected) schemesMap[meta.scheme].completed++;
          if (meta.isDeficient || meta.isResubmitted) schemesMap[meta.scheme].deficient++;
          if (meta.isFinancialPending) schemesMap[meta.scheme].financial++;
          schemesMap[meta.scheme].apps.push(app);
        });
    }

    // Courses for selectedScheme
    const coursesMap: Record<string, { total: number; pending: number; completed: number; deficient: number; financial: number; apps: Application[] }> = {};
    if (selectedState && selectedInstitute && selectedScheme) {
      cycleApps
        .filter((a) => {
          const m = getAppMeta(a);
          return m.state === selectedState && m.institute === selectedInstitute && m.scheme === selectedScheme;
        })
        .forEach((app) => {
          const meta = getAppMeta(app);
          if (!coursesMap[meta.course]) {
            coursesMap[meta.course] = { total: 0, pending: 0, completed: 0, deficient: 0, financial: 0, apps: [] };
          }
          coursesMap[meta.course].total++;
          if (meta.isVerificationPending) coursesMap[meta.course].pending++;
          if (meta.isReadyForScrutiny || meta.isSelected) coursesMap[meta.course].completed++;
          if (meta.isDeficient || meta.isResubmitted) coursesMap[meta.course].deficient++;
          if (meta.isFinancialPending) coursesMap[meta.course].financial++;
          coursesMap[meta.course].apps.push(app);
        });
    }

    // Underlying applications for leaf or current node
    let activeLevelApps = cycleApps;
    if (selectedState) {
      activeLevelApps = activeLevelApps.filter((a) => getAppMeta(a).state === selectedState);
    }
    if (selectedInstitute) {
      activeLevelApps = activeLevelApps.filter((a) => getAppMeta(a).institute === selectedInstitute);
    }
    if (selectedScheme) {
      activeLevelApps = activeLevelApps.filter((a) => getAppMeta(a).scheme === selectedScheme);
    }
    if (selectedCourse) {
      activeLevelApps = activeLevelApps.filter((a) => getAppMeta(a).course === selectedCourse);
    }

    return {
      statesMap,
      institutesMap,
      schemesMap,
      coursesMap,
      activeLevelApps,
    };
  }, [cycleApps, selectedState, selectedInstitute, selectedScheme, selectedCourse]);

  // System-Level Delay Visibility: Process Bottlenecks
  const bottlenecks = useMemo(() => {
    const instGroup: Record<string, { total: number; completed: number; pending: number; deficient: number; apps: Application[] }> = {};

    cycleApps.forEach((app) => {
      const meta = getAppMeta(app);
      if (!instGroup[meta.institute]) {
        instGroup[meta.institute] = { total: 0, completed: 0, pending: 0, deficient: 0, apps: [] };
      }
      instGroup[meta.institute].total++;
      if (meta.isReadyForScrutiny || meta.isSelected) instGroup[meta.institute].completed++;
      if (meta.isVerificationPending) instGroup[meta.institute].pending++;
      if (meta.isDeficient || meta.isResubmitted) instGroup[meta.institute].deficient++;
      instGroup[meta.institute].apps.push(app);
    });

    return Object.entries(instGroup).map(([inst, stats]) => {
      let observation = 'Normal processing flow.';
      const pendingRatio = stats.total > 0 ? stats.pending / stats.total : 0;
      const deficientRatio = stats.total > 0 ? stats.deficient / stats.total : 0;

      if (pendingRatio >= 0.5) {
        observation = 'High verification-pending concentration.';
      } else if (deficientRatio >= 0.3) {
        observation = 'Elevated document deficiency and resubmission rate.';
      } else if (stats.completed >= stats.pending && stats.completed > 0) {
        observation = 'Steady verification throughput.';
      }

      return {
        institute: inst,
        ...stats,
        observation,
      };
    }).sort((a, b) => b.pending - a.pending);
  }, [cycleApps]);

  // Delay / Ageing View
  const ageingBuckets = useMemo(() => {
    const b0_3: Application[] = [];
    const b4_7: Application[] = [];
    const b8_15: Application[] = [];
    const b15_plus: Application[] = [];

    cycleApps.forEach((app) => {
      const meta = getAppMeta(app);
      if (meta.isVerificationPending || meta.isDeficient) {
        if (meta.daysPending <= 3) b0_3.push(app);
        else if (meta.daysPending <= 7) b4_7.push(app);
        else if (meta.daysPending <= 15) b8_15.push(app);
        else b15_plus.push(app);
      }
    });

    return {
      b0_3,
      b4_7,
      b8_15,
      b15_plus,
    };
  }, [cycleApps]);

  // Deficiency Trend Analytics: Recurring defect reasons with drill-down
  const deficiencyTrend = useMemo(() => {
    const defCounts = {
      'Income Certificate': 0,
      'ST Certificate': 0,
      'Admission Proof': 0,
      'Bank Information': 0,
    };

    const defApps: Record<string, Application[]> = {
      'Income Certificate': [],
      'ST Certificate': [],
      'Admission Proof': [],
      'Bank Information': [],
    };

    cycleApps.forEach((app) => {
      const fv = app.fieldValues || {};
      const defType = fv.deficiencyType;
      if (defType === 'INCOME_CERT') {
        defCounts['Income Certificate']++;
        defApps['Income Certificate'].push(app);
      } else if (defType === 'ST_CERT') {
        defCounts['ST Certificate']++;
        defApps['ST Certificate'].push(app);
      } else if (defType === 'ADMISSION_PROOF') {
        defCounts['Admission Proof']++;
        defApps['Admission Proof'].push(app);
      } else if (defType === 'BANK_INFO') {
        defCounts['Bank Information']++;
        defApps['Bank Information'].push(app);
      }
    });

    // Sub-drill-down for selected deficiency
    let filteredDefApps: Application[] = [];
    if (selectedDefType && defApps[selectedDefType]) {
      filteredDefApps = defApps[selectedDefType];
      if (defDrillState) {
        filteredDefApps = filteredDefApps.filter((a) => getAppMeta(a).state === defDrillState);
      }
      if (defDrillInstitute) {
        filteredDefApps = filteredDefApps.filter((a) => getAppMeta(a).institute === defDrillInstitute);
      }
      if (defDrillScheme) {
        filteredDefApps = filteredDefApps.filter((a) => getAppMeta(a).scheme === defDrillScheme);
      }
    }

    return {
      defCounts,
      defApps,
      filteredDefApps,
    };
  }, [cycleApps, selectedDefType, defDrillState, defDrillInstitute, defDrillScheme]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Cycle Selector */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                JVS Intelligence Layer
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs text-slate-300 font-medium">Multi-Level Decision Support & System Analytics</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1 text-white flex items-center gap-2">
              Autonomous Intelligence Bench
              <span className="text-xs font-normal text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-700/50">
                MoTA Scheduled Tribe Scholarship Gateway
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Real-time cohort visibility across States, Universities, and Schemes. Empowers verification and scrutiny officers with explainable decision prioritization and neutral bottleneck diagnostics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Academic Cycle Selector */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400 ml-2 mr-1.5" />
              <span className="text-[11px] text-slate-400 mr-1.5 font-medium">Cycle:</span>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="bg-slate-900 text-white font-bold text-xs px-2.5 py-1 rounded border border-slate-600 focus:outline-none"
              >
                <option value="2026–27">2026–27 (Active)</option>
                <option value="2025–26">2025–26 (Archived)</option>
                <option value="2024–25">2024–25 (Audited)</option>
              </select>
            </div>

            {/* Back to Officer Workbench Button */}
            <button
              onClick={onBackToWorkbench}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Return to Officer Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs inside JVS Intelligence */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveSection('analytics')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSection === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white bg-slate-800/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>1. Cohort Analytics (2026–27)</span>
          </button>

          <button
            onClick={() => setActiveSection('decision_support')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSection === 'decision_support'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white bg-slate-800/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>2. Recommended Attention Queue</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold ml-1">
              {attentionQueue.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('bottlenecks')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSection === 'bottlenecks'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white bg-slate-800/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>3. Process Bottlenecks</span>
          </button>

          <button
            onClick={() => setActiveSection('ageing')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSection === 'ageing'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>4. Delay / Ageing View</span>
            {ageingBuckets.b15_plus.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold ml-1">
                {ageingBuckets.b15_plus.length} Risk
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('deficiencies')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSection === 'deficiencies'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>5. Deficiency Trend</span>
          </button>
        </div>
      </div>

      {/* 2. OFFICER ACTION CENTER: Top Compact Summary Bar */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              JVS Intelligence — Attention Summary:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => {
                setActiveSection('decision_support');
                setAttentionFilter('DOCUMENTS_ATTENTION');
              }}
              className="px-3 py-1 bg-white hover:bg-amber-100 border border-amber-300/80 rounded-lg text-amber-950 font-bold transition flex items-center gap-1.5"
            >
              <span className="font-extrabold text-rose-700">{categoryCounts.DOCUMENTS_ATTENTION}</span>
              <span>applications — Documents require attention</span>
            </button>

            <button
              onClick={() => {
                setActiveSection('decision_support');
                setAttentionFilter('FINANCIAL_PENDING');
              }}
              className="px-3 py-1 bg-white hover:bg-amber-100 border border-amber-300/80 rounded-lg text-amber-950 font-bold transition flex items-center gap-1.5"
            >
              <span className="font-extrabold text-blue-700">{categoryCounts.FINANCIAL_PENDING}</span>
              <span>applications — Financial verification pending</span>
            </button>

            <button
              onClick={() => {
                setActiveSection('decision_support');
                setAttentionFilter('DELAY_AGEING_RISK');
              }}
              className="px-3 py-1 bg-white hover:bg-amber-100 border border-amber-300/80 rounded-lg text-amber-950 font-bold transition flex items-center gap-1.5"
            >
              <span className="font-extrabold text-rose-700">{categoryCounts.DELAY_AGEING_RISK}</span>
              <span>applications — Ageing / Delay Risk</span>
            </button>

            <button
              onClick={() => {
                setActiveSection('decision_support');
                setAttentionFilter('VERIFICATION_PENDING');
              }}
              className="px-3 py-1 bg-white hover:bg-amber-100 border border-amber-300/80 rounded-lg text-amber-950 font-bold transition flex items-center gap-1.5"
            >
              <span className="font-extrabold text-indigo-700">{categoryCounts.VERIFICATION_PENDING}</span>
              <span>applications — Verification pending</span>
            </button>

            <button
              onClick={() => setActiveSection('bottlenecks')}
              className="px-3 py-1 bg-amber-200/70 hover:bg-amber-300/70 border border-amber-400/80 rounded-lg text-amber-950 font-extrabold transition flex items-center gap-1"
            >
              <span>XYZ University — High verification backlog</span>
              <ArrowRight className="w-3 h-3 text-amber-800" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: COHORT ANALYTICS (Academic Cycle 2026-27 + Hierarchy Drill-Down) */}
      {/* ========================================================================= */}
      {activeSection === 'analytics' && (
        <div className="space-y-6">
          {/* Top 7 Metrics required by brief */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
                Total Applications
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{cohortMetrics.total}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Cycle {selectedCycle}</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[11px] text-purple-700 font-semibold block uppercase tracking-wider">
                Completed Scrutiny
              </span>
              <span className="text-2xl font-black text-purple-900 mt-1 block">{cohortMetrics.completedScrutiny}</span>
              <span className="text-[10px] text-purple-600 font-medium mt-1 block">Merit evaluated</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[11px] text-blue-700 font-semibold block uppercase tracking-wider">
                Verification Pending
              </span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">{cohortMetrics.verificationPending}</span>
              <span className="text-[10px] text-blue-600 font-medium mt-1 block">Under INO / SNO</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[11px] text-rose-700 font-semibold block uppercase tracking-wider">
                Deficient Applications
              </span>
              <span className="text-2xl font-black text-rose-900 mt-1 block">{cohortMetrics.deficientApps}</span>
              <span className="text-[10px] text-rose-600 font-medium mt-1 block">Active defect notice</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[11px] text-amber-700 font-semibold block uppercase tracking-wider">
                Returned for Correction
              </span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">{cohortMetrics.returnedForCorrection}</span>
              <span className="text-[10px] text-amber-600 font-medium mt-1 block">Student re-uploaded</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[11px] text-emerald-700 font-semibold block uppercase tracking-wider">
                Selected Applications
              </span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">{cohortMetrics.selectedApps}</span>
              <span className="text-[10px] text-emerald-600 font-medium mt-1 block">Slot award issued</span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <span className="text-[11px] text-cyan-700 font-semibold block uppercase tracking-wider">
                Financial Verif. Pending
              </span>
              <span className="text-2xl font-black text-cyan-900 mt-1 block">{cohortMetrics.financialPending}</span>
              <span className="text-[10px] text-cyan-600 font-medium mt-1 block">Aadhaar/PFMS check</span>
            </div>
          </div>

          {/* Hierarchy Drill-Down Section: State -> Institute -> Scheme -> Course */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Cohort Hierarchy Drill-Down
                </h2>
                <p className="text-xs text-slate-500">
                  Navigate granular distributions: <span className="font-semibold text-slate-800">State → Institute/University → Scheme → Course</span>
                </p>
              </div>

              {/* Breadcrumb reset */}
              {(selectedState || selectedInstitute || selectedScheme || selectedCourse) && (
                <button
                  onClick={() => {
                    setSelectedState(null);
                    setSelectedInstitute(null);
                    setSelectedScheme(null);
                    setSelectedCourse(null);
                  }}
                  className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 bg-rose-50 rounded-md border border-rose-200 font-medium transition"
                >
                  Reset to All States
                </button>
              )}
            </div>

            {/* Interactive Breadcrumb Bar */}
            <div className="flex items-center flex-wrap gap-2 text-xs font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <button
                onClick={() => {
                  setSelectedState(null);
                  setSelectedInstitute(null);
                  setSelectedScheme(null);
                  setSelectedCourse(null);
                }}
                className={`hover:underline flex items-center gap-1 ${!selectedState ? 'text-indigo-700 font-bold' : 'text-slate-600'}`}
              >
                <span>Cycle: {selectedCycle}</span>
              </button>

              {selectedState && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <button
                    onClick={() => {
                      setSelectedInstitute(null);
                      setSelectedScheme(null);
                      setSelectedCourse(null);
                    }}
                    className={`hover:underline flex items-center gap-1 ${!selectedInstitute ? 'text-indigo-700 font-bold' : 'text-slate-600'}`}
                  >
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>State: {selectedState}</span>
                  </button>
                </>
              )}

              {selectedInstitute && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <button
                    onClick={() => {
                      setSelectedScheme(null);
                      setSelectedCourse(null);
                    }}
                    className={`hover:underline flex items-center gap-1 ${!selectedScheme ? 'text-indigo-700 font-bold' : 'text-slate-600'}`}
                  >
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>Institute: {selectedInstitute}</span>
                  </button>
                </>
              )}

              {selectedScheme && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className={`hover:underline flex items-center gap-1 ${!selectedCourse ? 'text-indigo-700 font-bold' : 'text-slate-600'}`}
                  >
                    <span>Scheme: {selectedScheme}</span>
                  </button>
                </>
              )}

              {selectedCourse && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-indigo-700 font-bold flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-indigo-600" />
                    <span>Course: {selectedCourse}</span>
                  </span>
                </>
              )}
            </div>

            {/* LEVEL 1: STATES (If no state selected) */}
            {!selectedState && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Step 1: Select State
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(cohortDrillData.statesMap).map(([state, stats]) => (
                    <div
                      key={state}
                      onClick={() => setSelectedState(state)}
                      className="p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition shadow-2xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-700 text-sm">{state}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-black text-slate-900">{stats.total}</span>
                        <span className="text-[11px] text-slate-500">applications</span>
                      </div>
                      {/* Status distribution pills */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                          {stats.pending} Pending
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                          {stats.completed} Done
                        </span>
                        {stats.deficient > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                            {stats.deficient} Defect
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEVEL 2: INSTITUTES (For selected State) */}
            {selectedState && !selectedInstitute && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 2: Institutes in {selectedState} ({Object.keys(cohortDrillData.institutesMap).length})
                  </h3>
                  <button
                    onClick={() => setSelectedState(null)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    ← Back to States
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(cohortDrillData.institutesMap).map(([inst, stats]) => (
                    <div
                      key={inst}
                      onClick={() => setSelectedInstitute(inst)}
                      className={`p-4 border rounded-xl cursor-pointer transition shadow-2xs group ${
                        inst === 'XYZ University'
                          ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/70'
                          : 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-700 text-xs leading-snug">
                          {inst}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition shrink-0 mt-0.5" />
                      </div>
                      <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-900">{stats.total}</span>
                        <span className="text-[11px] text-slate-500">applications</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                          {stats.pending} Pending
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                          {stats.completed} Done
                        </span>
                        {stats.deficient > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                            {stats.deficient} Defect
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEVEL 3: SCHEMES (For selected Institute) */}
            {selectedState && selectedInstitute && !selectedScheme && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 3: Scholarship Schemes at {selectedInstitute}
                  </h3>
                  <button
                    onClick={() => setSelectedInstitute(null)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    ← Back to Institutes
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(cohortDrillData.schemesMap).map(([scheme, stats]) => (
                    <div
                      key={scheme}
                      onClick={() => setSelectedScheme(scheme)}
                      className="p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition shadow-2xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-indigo-900 text-sm">{scheme}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                      </div>
                      <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-900">{stats.total}</span>
                        <span className="text-[11px] text-slate-500">applications</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                          {stats.pending} Pending
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                          {stats.completed} Done
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEVEL 4: COURSES (For selected Scheme) */}
            {selectedState && selectedInstitute && selectedScheme && !selectedCourse && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 4: Courses for {selectedScheme} at {selectedInstitute}
                  </h3>
                  <button
                    onClick={() => setSelectedScheme(null)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    ← Back to Schemes
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(cohortDrillData.coursesMap).map(([course, stats]) => (
                    <div
                      key={course}
                      onClick={() => setSelectedCourse(course)}
                      className={`p-4 border rounded-xl cursor-pointer transition shadow-2xs group ${
                        course === 'B.Tech'
                          ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                          : 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-700 text-sm flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-indigo-600" />
                          {course}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                      </div>
                      <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-900">{stats.total}</span>
                        <span className="text-[11px] text-slate-500">applications</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                          {stats.pending} Pending
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                          {stats.completed} Done
                        </span>
                        {stats.deficient > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                            {stats.deficient} Defect
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UNDERLYING APPLICATIONS LIST (Move from aggregate to underlying records) */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>Underlying Applications at this Drill-Down Node</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                    {cohortDrillData.activeLevelApps.length} records
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Click any application to open it in the Officer Verification/Scrutiny Bench
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left">App ID</th>
                      <th className="px-3.5 py-2.5 text-left">Applicant</th>
                      <th className="px-3.5 py-2.5 text-left">Scheme</th>
                      <th className="px-3.5 py-2.5 text-left">Institute & State</th>
                      <th className="px-3.5 py-2.5 text-left">Course</th>
                      <th className="px-3.5 py-2.5 text-left">Status</th>
                      <th className="px-3.5 py-2.5 text-left">Pending Duration</th>
                      <th className="px-3.5 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {cohortDrillData.activeLevelApps.map((app) => {
                      const meta = getAppMeta(app);
                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50 transition cursor-pointer"
                          onClick={() => onOpenApplication(app.id, meta.isReadyForScrutiny ? 'scrutiny' : 'verification')}
                        >
                          <td className="px-3.5 py-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            {app.applicationNumber}
                          </td>
                          <td className="px-3.5 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                            {app.applicantName || app.fieldValues?.applicantName || 'Applicant'}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap font-bold text-slate-800">
                            {app.schemeCode}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                            <span className="font-medium text-slate-800 block">{meta.institute}</span>
                            <span className="text-[10px] text-slate-400 block">{meta.state}</span>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap">
                            {meta.course}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                app.status === 'SELECTED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'READY_FOR_SCRUTINY'
                                  ? 'bg-purple-100 text-purple-800'
                                  : app.status === 'DEFICIENCY'
                                  ? 'bg-rose-100 text-rose-800'
                                  : app.status === 'RESUBMITTED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap font-medium text-slate-700">
                            <span className={meta.daysPending >= 15 ? 'text-rose-700 font-bold' : ''}>
                              {meta.daysPending} days
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenApplication(app.id, meta.isReadyForScrutiny ? 'scrutiny' : 'verification');
                              }}
                              className="px-2.5 py-1 bg-slate-900 text-white rounded font-bold hover:bg-slate-800 transition text-[11px]"
                            >
                              Open Dossier
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: OFFICER DECISION SUPPORT (Recommended Attention Queue)        */}
      {/* ========================================================================= */}
      {activeSection === 'decision_support' && (
        <div className="space-y-4">
          {/* Header Explanation Banner (Explicitly Non-Automated) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Recommended Attention Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Helps officers answer: <span className="font-semibold text-slate-800">“Which applications need my attention first, and why?”</span>
                </p>
              </div>

              {/* Explainability statutory notice */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Zero unexplained AI scores. The officer retains final statutory authority.</span>
              </div>
            </div>

            {/* Search and Category Filter Tabs */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Application ID, Applicant, Institute, State, or Course..."
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => setAttentionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    attentionFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({categoryCounts.ALL})
                </button>

                <button
                  onClick={() => setAttentionFilter('AI_FLAGGED')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    attentionFilter === 'AI_FLAGGED'
                      ? 'bg-rose-700 text-white'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span>AI Flagged Inconsistency</span>
                  <span className="font-extrabold ml-1">({categoryCounts.AI_FLAGGED})</span>
                </button>

                <button
                  onClick={() => setAttentionFilter('DOCUMENTS_ATTENTION')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    attentionFilter === 'DOCUMENTS_ATTENTION'
                      ? 'bg-amber-700 text-white'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span>Documents Requiring Attention</span>
                  <span className="font-extrabold ml-1">({categoryCounts.DOCUMENTS_ATTENTION})</span>
                </button>

                <button
                  onClick={() => setAttentionFilter('FINANCIAL_PENDING')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    attentionFilter === 'FINANCIAL_PENDING'
                      ? 'bg-cyan-700 text-white'
                      : 'bg-cyan-50 text-cyan-900 border border-cyan-200 hover:bg-cyan-100'
                  }`}
                >
                  <span>Financial Verification Pending</span>
                  <span className="font-extrabold ml-1">({categoryCounts.FINANCIAL_PENDING})</span>
                </button>

                <button
                  onClick={() => setAttentionFilter('DELAY_AGEING_RISK')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    attentionFilter === 'DELAY_AGEING_RISK'
                      ? 'bg-red-800 text-white'
                      : 'bg-red-50 text-red-900 border border-red-200 hover:bg-red-100'
                  }`}
                >
                  <span>Delay / Ageing Risk</span>
                  <span className="font-extrabold ml-1">({categoryCounts.DELAY_AGEING_RISK})</span>
                </button>

                <button
                  onClick={() => setAttentionFilter('READY_FOR_SCRUTINY')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    attentionFilter === 'READY_FOR_SCRUTINY'
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <span>Complete / Ready for Scrutiny</span>
                  <span className="font-extrabold ml-1">({categoryCounts.READY_FOR_SCRUTINY})</span>
                </button>

                <button
                  onClick={() => setAttentionFilter('DEFICIENCY_RETURNED')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    attentionFilter === 'DEFICIENCY_RETURNED'
                      ? 'bg-orange-700 text-white'
                      : 'bg-orange-50 text-orange-900 border border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  <span>Deficiency Returned</span>
                  <span className="font-extrabold ml-1">({categoryCounts.DEFICIENCY_RETURNED})</span>
                </button>

                <button
                  onClick={() => setAttentionFilter('VERIFICATION_PENDING')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    attentionFilter === 'VERIFICATION_PENDING'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <span>Verification Pending</span>
                  <span className="font-extrabold ml-1">({categoryCounts.VERIFICATION_PENDING})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attention Queue Application Cards (with Reason, Evidence, Suggested Action) */}
          <div className="space-y-3">
            {filteredAttentionQueue.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-2xs">
                <SlidersHorizontal className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <h3 className="font-bold text-slate-800 text-sm">No Applications Match Filter</h3>
                <p className="text-xs text-slate-400 mt-1">Try selecting another attention category or clearing the search query.</p>
              </div>
            ) : (
              filteredAttentionQueue.map(({ app, meta, cat }) => (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 shadow-xs transition space-y-3.5"
                >
                  {/* Top Bar: ID, Applicant, Scheme, Category Badge, Ageing Duration */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center flex-wrap gap-2.5">
                      <span className="font-mono font-bold text-indigo-700 text-xs">
                        {app.applicationNumber}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {app.applicantName || app.fieldValues?.applicantName || 'Applicant'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {app.schemeCode}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {meta.course}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.8 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          meta.isAiInconsistency
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : meta.isDeficient
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : meta.isFinancialPending
                            ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                            : meta.isAgeingRisk
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : meta.isReadyForScrutiny
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                      >
                        {cat.replace(/_/g, ' ')}
                      </span>

                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className={meta.daysPending >= 15 ? 'text-rose-700 font-bold' : ''}>
                          {meta.daysPending} days pending
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Institution, State, and Current Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Institute</span>
                      <span className="font-semibold text-slate-800">{meta.institute}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Domicile State</span>
                      <span className="font-semibold text-slate-800">{meta.state}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Current Status</span>
                      <span className="font-bold text-indigo-900">{app.status}</span>
                    </div>
                  </div>

                  {/* EXPLAINABILITY BLOCK: Why is this application here? Reason, Evidence, Suggested Action */}
                  <div className="bg-amber-50/50 border border-amber-200/70 rounded-lg p-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Why is this application here? (Explainable Decision Context)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Reason for Attention</span>
                        <p className="font-semibold text-slate-900 mt-0.5">{meta.reason}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Measurable Evidence</span>
                        <p className="text-slate-700 mt-0.5 leading-relaxed">{meta.evidence}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Suggested Next Action</span>
                        <p className="font-semibold text-indigo-900 mt-0.5">{meta.suggestedAction}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ref: {app.id} · MoTA SLA: 15 Days
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInspectedApp(app)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                      >
                        Explainability Details
                      </button>

                      <button
                        onClick={() => onOpenApplication(app.id, meta.isReadyForScrutiny ? 'scrutiny' : 'verification')}
                        className="px-4 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs transition shadow-2xs flex items-center gap-1.5"
                      >
                        <span>Open in {meta.isReadyForScrutiny ? 'Scrutiny Bench' : 'Verification Bench'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SYSTEM-LEVEL DELAY VISIBILITY — "PROCESS BOTTLENECK"           */}
      {/* ========================================================================= */}
      {activeSection === 'bottlenecks' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Process Bottlenecks & Workflow Accumulation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies where applications accumulate across Institutes, States, and Schemes. Uses only measurable, neutral observations without speculative labels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bottlenecks.map((item) => (
              <div
                key={item.institute}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Institution Verification Node
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{item.institute}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {item.total} Total Apps
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Completed</span>
                    <span className="text-base font-bold text-purple-900 mt-0.5 block">{item.completed}</span>
                  </div>
                  <div className="bg-blue-50/70 p-2 rounded-lg border border-blue-200">
                    <span className="text-[10px] text-blue-700 block">Pending</span>
                    <span className="text-base font-bold text-blue-900 mt-0.5 block">{item.pending}</span>
                  </div>
                  <div className="bg-rose-50/70 p-2 rounded-lg border border-rose-200">
                    <span className="text-[10px] text-rose-700 block">Deficient</span>
                    <span className="text-base font-bold text-rose-900 mt-0.5 block">{item.deficient}</span>
                  </div>
                </div>

                {/* Measurable Neutral Observation */}
                <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Measurable Observation
                  </span>
                  <p className="font-semibold text-amber-950 mt-0.5">“{item.observation}”</p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setSelectedInstitute(item.institute);
                      setActiveSection('analytics');
                    }}
                    className="text-xs text-indigo-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Inspect {item.total} applications in Cohort View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: DELAY / AGEING VIEW                                            */}
      {/* ========================================================================= */}
      {activeSection === 'ageing' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              Application Ageing & SLA Threshold Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard MoTA Processing Benchmarks: Institute Verification SLA = <span className="font-semibold text-slate-700">7 Days</span>, State/Ministry Bench SLA = <span className="font-semibold text-slate-700">15 Days</span>. Applications exceeding 15 days are surfaced as Delay Risk.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 0-3 days */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">0–3 Days</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Normal Flow
                </span>
              </div>
              <span className="text-3xl font-black text-slate-900 block">{ageingBuckets.b0_3.length}</span>
              <p className="text-[11px] text-slate-500">Recently submitted or re-submitted records in active intake pipeline.</p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-56 overflow-y-auto">
                {ageingBuckets.b0_3.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onOpenApplication(app.id, 'verification')}
                    className="p-2 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer text-[11px] flex items-center justify-between"
                  >
                    <span className="font-mono text-indigo-700 font-bold truncate">{app.applicationNumber}</span>
                    <span className="text-slate-500">{getAppMeta(app).course}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4-7 days */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">4–7 Days</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  Standard Window
                </span>
              </div>
              <span className="text-3xl font-black text-slate-900 block">{ageingBuckets.b4_7.length}</span>
              <p className="text-[11px] text-slate-500">Under standard institutional document cross-checking process.</p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-56 overflow-y-auto">
                {ageingBuckets.b4_7.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onOpenApplication(app.id, 'verification')}
                    className="p-2 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer text-[11px] flex items-center justify-between"
                  >
                    <span className="font-mono text-indigo-700 font-bold truncate">{app.applicationNumber}</span>
                    <span className="text-slate-500">{getAppMeta(app).course}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 8-15 days */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">8–15 Days</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Approaching SLA
                </span>
              </div>
              <span className="text-3xl font-black text-amber-900 block">{ageingBuckets.b8_15.length}</span>
              <p className="text-[11px] text-slate-500">Approaching maximum permissible institutional threshold of 15 days.</p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-56 overflow-y-auto">
                {ageingBuckets.b8_15.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onOpenApplication(app.id, 'verification')}
                    className="p-2 rounded bg-amber-50/60 hover:bg-amber-100/60 cursor-pointer text-[11px] flex items-center justify-between"
                  >
                    <span className="font-mono text-indigo-700 font-bold truncate">{app.applicationNumber}</span>
                    <span className="text-amber-800 font-semibold">{getAppMeta(app).daysPending}d</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 15+ days (Delay Risk!) */}
            <div className="bg-white border-2 border-rose-300 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 text-xs uppercase tracking-wider">15+ Days</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                  Attention / Delay Risk
                </span>
              </div>
              <span className="text-3xl font-black text-rose-700 block">{ageingBuckets.b15_plus.length}</span>
              <p className="text-[11px] text-rose-700 font-medium">Exceeded configured SLA timeline. Requires prompt review.</p>
              <div className="space-y-1.5 pt-2 border-t border-rose-100 max-h-56 overflow-y-auto">
                {ageingBuckets.b15_plus.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onOpenApplication(app.id, 'verification')}
                    className="p-2 rounded bg-rose-50 hover:bg-rose-100 cursor-pointer text-[11px] flex items-center justify-between border border-rose-200"
                  >
                    <span className="font-mono text-rose-900 font-bold truncate">{app.applicationNumber}</span>
                    <span className="text-rose-700 font-bold">{getAppMeta(app).daysPending}d overdue</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: DEFICIENCY TREND (Recurring Defects & Root Cause Drill-Down)   */}
      {/* ========================================================================= */}
      {activeSection === 'deficiencies' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              Recurring Deficiency Trends & Root Cause Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies recurrent process and document failure patterns. Drill-down: <span className="font-semibold text-slate-800">Deficiency Reason → State → Institute → Scheme → Course → Applications</span>
            </p>
          </div>

          {/* Top 4 Recurring Deficiency Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(deficiencyTrend.defCounts).map(([title, count]) => (
              <div
                key={title}
                onClick={() => {
                  setSelectedDefType(title);
                  setDefDrillState(null);
                  setDefDrillInstitute(null);
                  setDefDrillScheme(null);
                }}
                className={`p-5 rounded-xl border cursor-pointer transition shadow-2xs ${
                  selectedDefType === title
                    ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-200'
                    : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{title}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-3xl font-black text-purple-950 mt-2 block">{count}</span>
                <span className="text-[11px] text-slate-400 mt-1 block">Recurring defect notices</span>
              </div>
            ))}
          </div>

          {/* Selected Deficiency Drill-Down */}
          {selectedDefType && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <span>Drill-Down: {selectedDefType} Disparities ({deficiencyTrend.filteredDefApps.length})</span>
                </h3>
                <button
                  onClick={() => {
                    setSelectedDefType(null);
                    setDefDrillState(null);
                    setDefDrillInstitute(null);
                    setDefDrillScheme(null);
                  }}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Clear Deficiency Drill-Down
                </button>
              </div>

              {/* State Filter for Deficiency */}
              <div className="flex items-center flex-wrap gap-2 text-xs">
                <span className="text-slate-500 font-semibold">Filter State:</span>
                <button
                  onClick={() => setDefDrillState(null)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    !defDrillState ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All States
                </button>
                {Array.from(new Set(deficiencyTrend.defApps[selectedDefType]?.map((a) => getAppMeta(a).state) || [])).map((st) => (
                  <button
                    key={st}
                    onClick={() => setDefDrillState(st)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      defDrillState === st ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Matching Deficient Applications Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3.5 py-2 text-left">App ID</th>
                      <th className="px-3.5 py-2 text-left">Applicant</th>
                      <th className="px-3.5 py-2 text-left">Institute</th>
                      <th className="px-3.5 py-2 text-left">Scheme & Course</th>
                      <th className="px-3.5 py-2 text-left">Reason & Required Action</th>
                      <th className="px-3.5 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {deficiencyTrend.filteredDefApps.map((app) => {
                      const meta = getAppMeta(app);
                      return (
                        <tr key={app.id} className="hover:bg-slate-50">
                          <td className="px-3.5 py-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            {app.applicationNumber}
                          </td>
                          <td className="px-3.5 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                            {app.applicantName || app.fieldValues?.applicantName}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                            {meta.institute} ({meta.state})
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap">
                            <span className="font-bold text-slate-800">{app.schemeCode}</span> · {meta.course}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600 max-w-sm">
                            <span className="font-semibold text-rose-800 block text-[11px]">{meta.reason}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{meta.suggestedAction}</span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => onOpenApplication(app.id, 'verification')}
                              className="px-2.5 py-1 bg-indigo-700 text-white rounded font-bold hover:bg-indigo-800 text-[11px]"
                            >
                              Open Verification
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / DRAWER: EXPLAINABILITY DETAILS INSPECTOR                          */}
      {/* ========================================================================= */}
      {inspectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Statutory Decision Support Explainability
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Case Review: {inspectedApp.applicationNumber}
                </h3>
              </div>
              <button
                onClick={() => setInspectedApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Candidate Identity</span>
                <p className="font-bold text-slate-900 text-sm">
                  {inspectedApp.applicantName || inspectedApp.fieldValues?.applicantName}
                </p>
                <p className="text-slate-600 text-[11px]">
                  {getAppMeta(inspectedApp).institute} · {getAppMeta(inspectedApp).state} · {inspectedApp.schemeCode} ({getAppMeta(inspectedApp).course})
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                <span className="text-[10px] text-amber-800 block uppercase font-bold">Why is this application here?</span>
                <p className="font-bold text-amber-950 text-xs">
                  {getAppMeta(inspectedApp).reason}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Evidence Discovered</span>
                <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed text-xs">
                  {getAppMeta(inspectedApp).evidence}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Suggested Officer Action</span>
                <p className="text-indigo-900 bg-indigo-50 p-2.5 rounded-lg border border-indigo-200 font-semibold text-xs">
                  {getAppMeta(inspectedApp).suggestedAction}
                </p>
              </div>

              <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-600 border border-slate-200">
                <span className="font-semibold text-slate-800">MoTA Statutory Policy Rule:</span> The AI decision support layer provides transparent explanations without opaque scoring. The presiding verification officer retains complete statutory discretion to accept, reject, or issue defect notices.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setInspectedApp(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const targetAppId = inspectedApp.id;
                  const isScrutiny = getAppMeta(inspectedApp).isReadyForScrutiny;
                  setInspectedApp(null);
                  onOpenApplication(targetAppId, isScrutiny ? 'scrutiny' : 'verification');
                }}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Proceed to Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
