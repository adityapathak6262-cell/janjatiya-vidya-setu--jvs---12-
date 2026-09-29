import React, { useState, useEffect } from 'react';
import {
  User,
  api,
  DelayOverviewResponse,
  DelayApplicationItem,
  DelayThresholdConfig,
} from '../api';
import {
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  Download,
  Send,
  Sliders,
  FileText,
  UserCheck,
  Eye,
  Info,
  Check,
  X,
  History,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Landmark,
} from 'lucide-react';

interface Props {
  currentUser: User;
  onRefreshData?: () => void;
  onNavigateTab?: (tab: string) => void;
  initialApplicationId?: string;
}

export const VerificationDelayMonitor: React.FC<Props> = ({
  currentUser,
  onRefreshData,
  onNavigateTab,
  initialApplicationId,
}) => {
  const isOfficerOrAdmin = ['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'].includes(
    currentUser.role
  );
  const isStudent = currentUser.role === 'STUDENT';

  // Navigation / active perspective within the monitor (Default to Officer Desk for verifiers, System for Admin)
  const [activePerspective, setActivePerspective] = useState<
    'SYSTEM' | 'OFFICER' | 'APPLICANT' | 'THRESHOLDS'
  >(currentUser.role === 'INSTITUTION_VERIFIER' ? 'OFFICER' : 'SYSTEM');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Overview data from API
  const [overviewData, setOverviewData] = useState<DelayOverviewResponse | null>(null);

  // Drilldown state for System Oversight:
  // Step 1: System Level -> Step 2: Selected Institution -> Step 3: Selected Stage -> Step 4: Selected Application Dossier
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const [selectedStageCode, setSelectedStageCode] = useState<string | null>(null);
  const [selectedApplicationDossier, setSelectedApplicationDossier] = useState<DelayApplicationItem | null>(
    null
  );

  // Tracking View Active Application & Filters
  const [activeTrackingAppId, setActiveTrackingAppId] = useState<string | null>(initialApplicationId || null);
  const [trackingSearchQuery, setTrackingSearchQuery] = useState<string>('');
  const [trackingDelayFilter, setTrackingDelayFilter] = useState<string>('ALL');

  // Filters
  const [filterDelayStatus, setFilterDelayStatus] = useState<string>('ALL');
  const [filterScheme, setFilterScheme] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Nudge / Administrative Note Modal
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [nudgeTargetApp, setNudgeTargetApp] = useState<DelayApplicationItem | null>(null);
  const [nudgeTargetInst, setNudgeTargetInst] = useState<string>('');
  const [nudgeMessage, setNudgeMessage] = useState<string>('');
  const [sendingNudge, setSendingNudge] = useState(false);

  // Threshold Configuration State (Admin)
  const [normalMaxDaysInput, setNormalMaxDaysInput] = useState<number>(5);
  const [delayedMaxDaysInput, setDelayedMaxDaysInput] = useState<number>(10);
  const [savingThresholds, setSavingThresholds] = useState(false);

  // Applicant Status Ping State
  const [pingingAppId, setPingingAppId] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const fetchMonitorData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getDelayOverview({
        delayStatus: filterDelayStatus !== 'ALL' ? filterDelayStatus : undefined,
        schemeCode: filterScheme !== 'ALL' ? filterScheme : undefined,
        allStudents: !isStudent,
      });
      setOverviewData(data);
      if (data.systemSummary.thresholds) {
        setNormalMaxDaysInput(data.systemSummary.thresholds.normalMaxDays);
        setDelayedMaxDaysInput(data.systemSummary.thresholds.delayedMaxDays);
      }

      if (data.applications.length > 0 && !activeTrackingAppId) {
        setActiveTrackingAppId(data.applications[0].id);
      }

      // If initialApplicationId was provided, select it directly
      if (initialApplicationId) {
        const found = data.applications.find((a) => a.id === initialApplicationId);
        if (found) {
          setSelectedApplicationDossier(found);
          setActiveTrackingAppId(found.id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load verification delay monitor data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
  }, [filterDelayStatus, filterScheme]);

  // Handle Thresholds Save
  const handleSaveThresholds = async () => {
    if (normalMaxDaysInput <= 0 || delayedMaxDaysInput <= normalMaxDaysInput) {
      alert('Normal Service Level Agreement (SLA) max days must be greater than 0 and less than Delayed threshold.');
      return;
    }
    setSavingThresholds(true);
    try {
      await api.updateDelayThresholds({
        normalMaxDays: Number(normalMaxDaysInput),
        delayedMaxDays: Number(delayedMaxDaysInput),
      });
      showNotification('Configurable Service Level Agreement (SLA) thresholds updated and logged to audit ledger.');
      fetchMonitorData();
    } catch (err: any) {
      alert(err.message || 'Failed to update thresholds.');
    } finally {
      setSavingThresholds(false);
    }
  };

  // Handle Send Administrative Notice / Nudge
  const handleSendNudge = async () => {
    setSendingNudge(true);
    try {
      await api.sendAdminDelayNotice({
        applicationId: nudgeTargetApp ? nudgeTargetApp.id : undefined,
        institutionName: nudgeTargetInst || (nudgeTargetApp ? nudgeTargetApp.institutionName : undefined),
        message: nudgeMessage || 'Administrative review recommended regarding verification backlog.',
      });
      showNotification('Administrative delay review notice recorded and dispatched.');
      setIsNudgeModalOpen(false);
      setNudgeMessage('');
      setNudgeTargetApp(null);
      setNudgeTargetInst('');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch notice.');
    } finally {
      setSendingNudge(false);
    }
  };

  // Handle Applicant Status Ping
  const handleApplicantPing = async (applicationId: string) => {
    setPingingAppId(applicationId);
    try {
      await api.sendApplicantStatusPing(applicationId);
      showNotification(
        'Priority review inquiry logged. Your application has been flagged for institutional nodal officer attention.'
      );
    } catch (err: any) {
      alert(err.message || 'Failed to send inquiry.');
    } finally {
      setPingingAppId(null);
    }
  };

  // Download printable status slip
  const handleDownloadStatusSlip = (app: DelayApplicationItem) => {
    const slipText = `===============================================================
JANJATIYA VIDYA SETU (JVS) - MINISTRY OF TRIBAL AFFAIRS (MoTA)
APPLICATION VERIFICATION DELAY & STATUS CONFIRMATION DOSSIER
===============================================================

Application Reference  : ${app.applicationNumber}
Scholar Name           : ${app.applicantName}
Scheme                 : ${app.schemeName} (${app.schemeCode})
Institution            : ${app.institutionName}
Domicile State         : ${app.state}
Course / Degree        : ${app.course}

CURRENT VERIFICATION STATUS
---------------------------
Workflow Stage         : ${app.currentStageName} (${app.currentStageCode})
Stage Entry Date       : ${new Date(app.stageEntryDate).toLocaleDateString()}
Duration at Current Stage: ${app.daysPending} days
Expected Baseline Service Level Agreement (SLA): ${app.expectedProcessingWindow}
Delay Classification   : ${app.delayStatus.replace('_', ' ')}

APPLICANT RESPONSIBILITY ASSESSMENT
-----------------------------------
Action Required by Applicant : ${app.actionRequired ? 'YES' : 'NO'}
Official Directive           : ${app.actionRequiredMessage}
Administrative Note          : ${app.bottleneckReason}

BENEFICIARY PROTECTION ASSURANCE
---------------------------------
This document certifies that your application is registered and securely
preserved within the national portal. Administrative delays occurring at
the institutional or ministry verification level do NOT imply deficiency,
rejection, or cancellation of scholarship benefits.

Generated at: ${new Date().toISOString()}
Verification Ledger Ref: SHA256:${app.id.substring(0, 16)}
===============================================================`;

    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JVS_Status_Dossier_${app.applicationNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification(`Status slip downloaded for ${app.applicationNumber}.`);
  };

  // Filtered applications list
  const filteredApplications = (overviewData?.applications || []).filter((app) => {
    if (selectedInstitution && app.institutionName !== selectedInstitution) return false;
    if (selectedStageCode && app.currentStageCode !== selectedStageCode) return false;
    if (searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      app.applicationNumber.toLowerCase().includes(q) ||
      app.applicantName.toLowerCase().includes(q) ||
      app.institutionName.toLowerCase().includes(q) ||
      app.state.toLowerCase().includes(q)
    );
  });

  const getDelayBadge = (status: 'NORMAL' | 'DELAYED' | 'UNUSUAL_DELAY') => {
    if (status === 'UNUSUAL_DELAY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>Unusual Delay Detected</span>
        </span>
      );
    }
    if (status === 'DELAYED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Delayed Beyond Baseline</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Normal Window</span>
      </span>
    );
  };

  const getAdminStatusBadge = (status: string) => {
    if (status === 'ADMINISTRATIVE_REVIEW_RECOMMENDED') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Administrative Review Recommended
        </span>
      );
    }
    if (status === 'MONITORING_SUGGESTED') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Pattern Requires Review
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Within Baseline
      </span>
    );
  };

  const getWorkflowStages = (app: DelayApplicationItem) => {
    let currentStep = 1;
    const status = app.currentStatus;
    if (status === 'SUBMITTED') currentStep = 1;
    else if (status === 'ELIGIBILITY_CHECK') currentStep = 2;
    else if (['VERIFICATION', 'DEFICIENCY', 'RESUBMITTED', 'RE_VERIFICATION'].includes(status)) currentStep = 3;
    else if (['READY_FOR_SCRUTINY', 'SCRUTINY'].includes(status)) currentStep = 4;
    else if (status === 'SCREENING') currentStep = 5;
    else if (status === 'SELECTED' || status === 'POST_SELECTION') currentStep = 6;
    else if (status === 'COMPLETED') currentStep = 7;

    return [
      {
        step: 1,
        title: 'Application Ingestion & Aadhaar eKYC',
        authority: 'National Scholarship Gateway',
        baseline: '1–2 Days',
        isCurrent: currentStep === 1,
        isCompleted: currentStep > 1,
        isDeficiency: false,
        summary: 'Aadhaar demographic authentication verified, bank mandate linked, and application cryptographically logged.',
        timestamp: app.timeline.find((t) => t.stage === 'REGISTRATION' || t.stage === 'APPLICATION_SUBMITTED')?.timestamp || app.stageEntryDate,
      },
      {
        step: 2,
        title: 'PRAMAAN Automated Dual-Path Verification',
        authority: 'PRAMAAN Automated Rules Engine',
        baseline: '1–3 Days',
        isCurrent: currentStep === 2,
        isCompleted: currentStep > 2,
        isDeficiency: false,
        summary: 'Direct State digital repository verification (ST caste validity certificate, income criteria, and admission credentials).',
        timestamp: app.timeline.find((t) => t.stage === 'ELIGIBILITY_CHECK' || t.title?.includes('PRAMAAN'))?.timestamp,
      },
      {
        step: 3,
        title: 'Institute Nodal Officer (INO) Verification Desk',
        authority: `${app.institutionName} · Verification Desk`,
        baseline: '3–5 Days',
        isCurrent: currentStep === 3,
        isCompleted: currentStep > 3,
        isDeficiency: app.currentStatus === 'DEFICIENCY',
        summary: app.currentStatus === 'DEFICIENCY'
          ? `Deficiency Notice Active: ${app.deficiencyDetails?.title || 'Action required from applicant to upload replacement documents.'}`
          : app.currentStatus === 'RESUBMITTED'
          ? 'Scholar uploaded rectification documents. Re-verification in progress by Institute Nodal Officer.'
          : 'Physical/academic enrollment check, fee receipt scrutiny, and bonafide scholar endorsement.',
        timestamp: app.timeline.find((t) => t.stage === 'VERIFICATION' || t.stage === 'DEFICIENCY' || t.stage === 'RESUBMISSION')?.timestamp || (currentStep === 3 ? app.stageEntryDate : undefined),
      },
      {
        step: 4,
        title: 'Ministry Scrutiny Committee Assessment',
        authority: 'Ministry of Tribal Affairs (MoTA) Officers',
        baseline: '5–10 Days',
        isCurrent: currentStep === 4,
        isCompleted: currentStep > 4,
        isDeficiency: false,
        summary: 'Central quota compliance scrutiny, domicile quota alignment, and policy eligibility certification.',
        timestamp: app.timeline.find((t) => t.stage === 'SCRUTINY' || t.stage === 'READY_FOR_SCRUTINY')?.timestamp || (currentStep === 4 ? app.stageEntryDate : undefined),
      },
      {
        step: 5,
        title: 'State / Central Merit Screening & Slot Allocation',
        authority: 'MoTA Central Selection Board',
        baseline: '3–7 Days',
        isCurrent: currentStep === 5,
        isCompleted: currentStep > 5,
        isDeficiency: false,
        summary: 'Merit list ranking, slot allocation against sanctioned scheme seats, provisional scholarship award order.',
        timestamp: app.timeline.find((t) => t.stage === 'SCREENING')?.timestamp || (currentStep === 5 ? app.stageEntryDate : undefined),
      },
      {
        step: 6,
        title: 'PFMS Direct Benefit Transfer (DBT) Disbursement Pipeline',
        authority: 'Central PFMS Gateway / Ministry Finance Desk',
        baseline: '5–15 Days',
        isCurrent: currentStep === 6,
        isCompleted: currentStep > 6,
        isDeficiency: false,
        summary: 'Aadhaar Payment Bridge System (APBS) mandate generation, treasury authorization, and batch transfer.',
        timestamp: app.timeline.find((t) => t.stage === 'SELECTED' || t.stage === 'POST_SELECTION')?.timestamp || (currentStep === 6 ? app.stageEntryDate : undefined),
      },
      {
        step: 7,
        title: 'Workflow Concluded & Scholarship Disbursed',
        authority: 'Ministry of Tribal Affairs / Public Financial Management',
        baseline: 'Concluded',
        isCurrent: currentStep === 7,
        isCompleted: currentStep === 7 && app.currentStatus === 'COMPLETED',
        isDeficiency: false,
        summary: 'Direct credit confirmation received. Scholarship disbursed directly into scholar Aadhaar-linked bank account.',
        timestamp: app.timeline.find((t) => t.stage === 'COMPLETED')?.timestamp,
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slide-up text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner - Standard Government Web Portal Style */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>System-Level Verification Delay & Bottleneck Monitor</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Real-time administrative visibility into verification latency, structural stage bottlenecks, and
              ageing distribution. Provides transparency for applicants on pending stages and equips officers to
              take neutral corrective action without presumption of fault.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-1.5 bg-slate-800/80 p-3.5 rounded-lg border border-slate-700 shrink-0">
            <div className="text-left md:text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Session Baseline</p>
              <p className="text-sm font-bold text-amber-400 font-mono">Normal Service Level Agreement (SLA): 3–5 Days</p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Active User: {currentUser.name} ({currentUser.role.replace('_', ' ')})
            </span>
          </div>
        </div>

        {/* Perspective Selector Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {isOfficerOrAdmin && (
              <button
                onClick={() => {
                  setActivePerspective('SYSTEM');
                  setSelectedInstitution(null);
                  setSelectedStageCode(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activePerspective === 'SYSTEM'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>System & Ministry Oversight</span>
              </button>
            )}

            {isOfficerOrAdmin && (
              <button
                onClick={() => {
                  setActivePerspective('OFFICER');
                  setSelectedInstitution(null);
                  setSelectedStageCode(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activePerspective === 'OFFICER'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Institute / Officer Desk</span>
              </button>
            )}

            <button
              onClick={() => {
                setActivePerspective('APPLICANT');
                setSelectedInstitution(null);
                setSelectedStageCode(null);
                if (!activeTrackingAppId && overviewData?.applications.length) {
                  setActiveTrackingAppId(overviewData.applications[0].id);
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activePerspective === 'APPLICANT'
                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Applicant Tracking View</span>
            </button>

            {['ADMIN', 'SUPER_ADMIN', 'MOTA_OFFICER'].includes(currentUser.role) && (
              <button
                onClick={() => {
                  setActivePerspective('THRESHOLDS');
                  setSelectedInstitution(null);
                  setSelectedStageCode(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activePerspective === 'THRESHOLDS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configurable Service Level Agreement (SLA) Benchmarks</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMonitorData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      {overviewData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Monitored</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{overviewData.systemSummary.totalMonitored}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Active applications</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase text-emerald-700">Normal Processing</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{overviewData.systemSummary.normalCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {overviewData.systemSummary.totalMonitored > 0
                ? `${Math.round(
                    (overviewData.systemSummary.normalCount / overviewData.systemSummary.totalMonitored) * 100
                  )}% on baseline`
                : 'Within 5 days'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase text-amber-700">Delayed (6–10 Days)</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{overviewData.systemSummary.delayedCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {overviewData.systemSummary.totalMonitored > 0
                ? `${Math.round(
                    (overviewData.systemSummary.delayedCount / overviewData.systemSummary.totalMonitored) * 100
                  )}% of queue`
                : 'Attention needed'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase text-rose-700">Unusual Delay (&gt;10d)</p>
            <p className="text-2xl font-black text-rose-700 mt-1">{overviewData.systemSummary.unusualDelayCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Administrative review</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase text-slate-600">System Avg Duration</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {overviewData.systemSummary.avgDaysPending} <span className="text-xs font-normal text-slate-500">days</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Across all workflow stages</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold uppercase text-slate-600">Monitored Institutes</p>
            <p className="text-2xl font-black text-indigo-700 mt-1">{overviewData.institutionsBreakdown.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Institutes & Universities</p>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && !overviewData ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Loading System Verification Latency Metrics...
          </p>
        </div>
      ) : null}

      {/* PERSPECTIVE 1: SYSTEM & MINISTRY OVERSIGHT (DRILLDOWN) */}
      {overviewData && activePerspective === 'SYSTEM' && (
        <div className="space-y-6">
          {/* Breadcrumb Bar */}
          <div className="bg-slate-100/80 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Surveillance Drilldown:</span>
            <button
              onClick={() => {
                setSelectedInstitution(null);
                setSelectedStageCode(null);
              }}
              className={`font-semibold hover:underline flex items-center gap-1 ${
                !selectedInstitution ? 'text-indigo-600 font-bold' : 'text-slate-600'
              }`}
            >
              <span>1. System Overview</span>
            </button>

            {selectedInstitution && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  onClick={() => setSelectedStageCode(null)}
                  className={`font-semibold hover:underline flex items-center gap-1 ${
                    !selectedStageCode ? 'text-indigo-600 font-bold' : 'text-slate-600'
                  }`}
                >
                  <Building2 className="w-3 h-3 text-slate-500" />
                  <span>2. {selectedInstitution}</span>
                </button>
              </>
            )}

            {selectedStageCode && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-indigo-600 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-indigo-500" />
                  <span>3. Stage: {selectedStageCode}</span>
                </span>
              </>
            )}
          </div>

          {/* Level 1: System Overview Heatmaps & Global Distribution */}
          {!selectedInstitution && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Ageing Distribution & Stage Bottleneck Heatmap (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Ageing Distribution Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between mb-4">
                    <span>Global Ageing Distribution</span>
                    <span className="text-[10px] text-slate-500 font-normal">Active Applications</span>
                  </h2>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">0–3 Days (Fresh Submissions)</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {overviewData.systemSummary.ageingDistribution.zeroToThree} apps
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{
                            width: `${
                              overviewData.systemSummary.totalMonitored > 0
                                ? (overviewData.systemSummary.ageingDistribution.zeroToThree /
                                    overviewData.systemSummary.totalMonitored) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">4–7 Days (Standard In-Process)</span>
                        <span className="font-mono font-bold text-blue-700">
                          {overviewData.systemSummary.ageingDistribution.fourToSeven} apps
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              overviewData.systemSummary.totalMonitored > 0
                                ? (overviewData.systemSummary.ageingDistribution.fourToSeven /
                                    overviewData.systemSummary.totalMonitored) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">8–14 Days (Delayed Notice Window)</span>
                        <span className="font-mono font-bold text-amber-700">
                          {overviewData.systemSummary.ageingDistribution.eightToFourteen} apps
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{
                            width: `${
                              overviewData.systemSummary.totalMonitored > 0
                                ? (overviewData.systemSummary.ageingDistribution.eightToFourteen /
                                    overviewData.systemSummary.totalMonitored) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">15+ Days (Unusual Delay Pattern)</span>
                        <span className="font-mono font-bold text-rose-700">
                          {overviewData.systemSummary.ageingDistribution.fifteenPlus} apps
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-rose-500 h-2 rounded-full"
                          style={{
                            width: `${
                              overviewData.systemSummary.totalMonitored > 0
                                ? (overviewData.systemSummary.ageingDistribution.fifteenPlus /
                                    overviewData.systemSummary.totalMonitored) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">Neutral Observation:</span> Applications pending over
                    15 days represent workflow bottlenecks in institutional verification desks or awaiting student
                    deficiency uploads.
                  </div>
                </div>

                {/* Workflow Stage Latency Ranking */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between mb-3">
                    <span>Workflow Stage Latency Ranking</span>
                    <span className="text-[10px] text-slate-500">Backlog Index</span>
                  </h2>

                  <div className="space-y-2.5">
                    {overviewData.stageBreakdown.map((stage) => (
                      <div
                        key={stage.stageCode}
                        onClick={() => setSelectedStageCode(stage.stageCode)}
                        className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition cursor-pointer bg-slate-50/50 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{stage.stageName}</span>
                            {stage.bottleneckSeverity === 'HIGH' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-800 font-extrabold">
                                Bottleneck
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Role: {stage.responsibleRole} · Baseline: {stage.baselineWindow}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold font-mono text-slate-900">{stage.pendingCount} pending</p>
                          <p className="text-[11px] font-mono text-amber-700">avg {stage.avgDays}d</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Institutions Bottleneck Matrix Table (7 Cols) */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Institution Bottleneck Surveillance Matrix ({overviewData.institutionsBreakdown.length})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Comparative processing latency against the standard 3–5 day Service Level Agreement (SLA) baseline
                      </p>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search university or state..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Institutions Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="py-2.5 px-3">Institution & State</th>
                          <th className="py-2.5 px-3">Active Apps</th>
                          <th className="py-2.5 px-3">Avg Latency</th>
                          <th className="py-2.5 px-3">Unusual Delays</th>
                          <th className="py-2.5 px-3">Primary Bottleneck</th>
                          <th className="py-2.5 px-3">Administrative Status</th>
                          <th className="py-2.5 px-3 text-right">Drilldown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {overviewData.institutionsBreakdown.map((inst) => (
                          <tr key={inst.institutionName} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="line-clamp-1">{inst.institutionName}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block ml-5">{inst.state}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{inst.totalApps}</td>
                            <td className="py-2.5 px-3 font-mono font-bold">
                              <span
                                className={
                                  inst.avgDaysPending > 10
                                    ? 'text-rose-700'
                                    : inst.avgDaysPending > 5
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }
                              >
                                {inst.avgDaysPending}d
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {inst.unusualDelayCount > 0 ? (
                                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                  {inst.unusualDelayCount} apps
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-600 line-clamp-1">
                              {inst.bottleneckStage}
                            </td>
                            <td className="py-2.5 px-3">{getAdminStatusBadge(inst.administrativeStatus)}</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => setSelectedInstitution(inst.institutionName)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-xs transition flex items-center gap-1 ml-auto"
                              >
                                <span>Inspect</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Level 2: Selected Institution View (Applications Queue & Nodal Oversight) */}
          {selectedInstitution && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              {/* Institution Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-slate-900">{selectedInstitution}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Institution Verification Workload & Delay Surveillance Dossier
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setNudgeTargetInst(selectedInstitution);
                      setNudgeMessage(
                        `Administrative inquiry: Please expedite pending verification queue at ${selectedInstitution}. Standard Service Level Agreement (SLA) baseline benchmark is 3–5 days.`
                      );
                      setIsNudgeModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Issue Nodal Administrative Review Notice</span>
                  </button>

                  <button
                    onClick={() => setSelectedInstitution(null)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    Back to All Institutions
                  </button>
                </div>
              </div>

              {/* Institution Filter & Summary */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>Filter Applications:</span>
                  </div>

                  <select
                    value={filterDelayStatus}
                    onChange={(e) => setFilterDelayStatus(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden"
                  >
                    <option value="ALL">All Delay Statuses</option>
                    <option value="NORMAL">Normal Window</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="UNUSUAL_DELAY">Unusual Delay Detected</option>
                  </select>

                  <select
                    value={filterScheme}
                    onChange={(e) => setFilterScheme(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden"
                  >
                    <option value="ALL">All Schemes</option>
                    <option value="NFST">NFST</option>
                    <option value="POST_MATRIC">Post-Matric ST</option>
                    <option value="PRE_MATRIC">Pre-Matric ST</option>
                    <option value="NOS">NOS (Overseas)</option>
                  </select>
                </div>

                <span className="text-xs font-mono text-slate-500">
                  Showing {filteredApplications.length} applications
                </span>
              </div>

              {/* Applications Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Application ID</th>
                      <th className="py-2.5 px-3">Applicant Name</th>
                      <th className="py-2.5 px-3">Scheme</th>
                      <th className="py-2.5 px-3">Current Stage</th>
                      <th className="py-2.5 px-3">Days Pending</th>
                      <th className="py-2.5 px-3">Expected Baseline</th>
                      <th className="py-2.5 px-3">Delay Status</th>
                      <th className="py-2.5 px-3">Applicant Action</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-xs text-slate-500">
                          No applications match the current filter criteria for this institution.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{app.applicationNumber}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{app.applicantName}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-700">
                              {app.schemeCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{app.currentStageName}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            <span
                              className={
                                app.daysPending > 10
                                  ? 'text-rose-700'
                                  : app.daysPending > 5
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }
                            >
                              {app.daysPending} days
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{app.expectedProcessingWindow}</td>
                          <td className="py-2.5 px-3">{getDelayBadge(app.delayStatus)}</td>
                          <td className="py-2.5 px-3">
                            {app.actionRequired ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                Yes (Deficiency)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                                No (Pending Officer)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => setSelectedApplicationDossier(app)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition"
                            >
                              View Dossier
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PERSPECTIVE 2: INSTITUTE / OFFICER DESK */}
      {overviewData && activePerspective === 'OFFICER' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Verification Desk Workload & Bottleneck Diagnostics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed surveillance of pending verification items, ageing metrics, and bottleneck stages
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterDelayStatus}
                  onChange={(e) => setFilterDelayStatus(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value="ALL">All Latency Categories</option>
                  <option value="NORMAL">Normal (&le; 5 Days)</option>
                  <option value="DELAYED">Delayed (6–10 Days)</option>
                  <option value="UNUSUAL_DELAY">Unusual Delay Detected (&gt;10 Days)</option>
                </select>

                <select
                  value={filterScheme}
                  onChange={(e) => setFilterScheme(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value="ALL">All Schemes</option>
                  <option value="NFST">NFST</option>
                  <option value="POST_MATRIC">Post-Matric ST</option>
                  <option value="PRE_MATRIC">Pre-Matric ST</option>
                  <option value="NOS">NOS</option>
                </select>
              </div>
            </div>

            {/* Officer applications list sorted by highest days pending first */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Application ID</th>
                    <th className="py-2.5 px-3">Applicant Name</th>
                    <th className="py-2.5 px-3">Institution</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Days Pending</th>
                    <th className="py-2.5 px-3">Delay Classification</th>
                    <th className="py-2.5 px-3">Bottleneck Assessment</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overviewData.applications
                    .sort((a, b) => b.daysPending - a.daysPending)
                    .map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{app.applicationNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{app.applicantName}</td>
                        <td className="py-2.5 px-3 text-slate-700">{app.institutionName}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{app.currentStageName}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          <span
                            className={
                              app.daysPending > 10
                                ? 'text-rose-700'
                                : app.daysPending > 5
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }
                          >
                            {app.daysPending} days
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{getDelayBadge(app.delayStatus)}</td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-xs truncate">
                          {app.bottleneckReason}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedApplicationDossier(app)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => {
                                setNudgeTargetApp(app);
                                setNudgeMessage(
                                  `Administrative verification reminder regarding application ${app.applicationNumber} (${app.applicantName}) pending at ${app.currentStageName}.`
                                );
                                setIsNudgeModalOpen(true);
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold transition"
                              title="Send Administrative Nudge"
                            >
                              Nudge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PERSPECTIVE 3: APPLICANT TRACKING VIEW */}
      {overviewData && activePerspective === 'APPLICANT' && (() => {
        const trackingFilteredApps = overviewData.applications.filter((app) => {
          if (trackingDelayFilter !== 'ALL' && app.delayStatus !== trackingDelayFilter) return false;
          if (trackingSearchQuery.trim() === '') return true;
          const q = trackingSearchQuery.toLowerCase();
          return (
            app.applicationNumber.toLowerCase().includes(q) ||
            app.applicantName.toLowerCase().includes(q) ||
            app.institutionName.toLowerCase().includes(q) ||
            app.schemeCode.toLowerCase().includes(q)
          );
        });

        const activeTrackedApp =
          overviewData.applications.find((a) => a.id === activeTrackingAppId) ||
          trackingFilteredApps[0] ||
          overviewData.applications[0];

        return (
          <div className="space-y-6">
            {/* Reassurance Banner */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 text-amber-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg shrink-0 mt-0.5">
                  <Info className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <span className="font-bold text-sm text-amber-900">
                    Beneficiary Protection & Non-Responsibility Notice
                  </span>
                  <p className="mt-1 text-amber-800 leading-relaxed max-w-3xl">
                    If an application shows an unusual processing delay, please note that this is solely due to an
                    administrative queue backlog at the institution or verification desk. The application remains
                    securely active. Beneficiaries are NOT responsible for officer-side delays, and no scholarship cancellation will
                    occur as a result.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Search & Application Selector Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>Applicant Tracking & Workflow Pipeline Hub</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select an application below to view its complete end-to-end verification workflow, stage timeline, and latency diagnostics.
                  </p>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Application ID, scholar..."
                      value={trackingSearchQuery}
                      onChange={(e) => setTrackingSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-56"
                    />
                  </div>

                  <select
                    value={trackingDelayFilter}
                    onChange={(e) => setTrackingDelayFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                  >
                    <option value="ALL">All Latency Statuses</option>
                    <option value="UNUSUAL_DELAY">Unusual Delay Detected</option>
                    <option value="DELAYED">Delayed Beyond Baseline</option>
                    <option value="NORMAL">Normal Window</option>
                  </select>
                </div>
              </div>

              {/* Horizontal Application Switcher Chips */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Applications ({trackingFilteredApps.length}):
                </span>
                {trackingFilteredApps.map((app) => {
                  const isSelected = activeTrackedApp?.id === app.id;
                  return (
                    <button
                      key={app.id}
                      onClick={() => setActiveTrackingAppId(app.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 border text-left ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="font-mono font-bold">{app.applicationNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {app.applicantName.split(' ')[0]}
                      </span>
                      {app.delayStatus === 'UNUSUAL_DELAY' && (
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-rose-500'}`} title="Unusual Delay" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MASTER WORKFLOW PIPELINE TRACKER FOR SELECTED APPLICATION */}
            {activeTrackedApp && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-6">
                {/* Application Header Dossier */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-lg font-black text-slate-900 tracking-tight">
                        {activeTrackedApp.applicationNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {activeTrackedApp.schemeCode}
                      </span>
                      {getDelayBadge(activeTrackedApp.delayStatus)}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {activeTrackedApp.applicantName} · {activeTrackedApp.schemeName}
                    </h3>
                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Course: <strong className="text-slate-700">{activeTrackedApp.course}</strong></span>
                      <span>•</span>
                      <span>Institution: <strong className="text-slate-700">{activeTrackedApp.institutionName}</strong></span>
                      <span>•</span>
                      <span>State: <strong className="text-slate-700">{activeTrackedApp.state}</strong></span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left md:text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Waiting at Stage</p>
                      <p className="text-base font-black font-mono text-amber-700 mt-0.5">
                        {activeTrackedApp.daysPending} Days Pending
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Service Level Agreement (SLA): {activeTrackedApp.expectedProcessingWindow}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadStatusSlip(activeTrackedApp)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      title="Download Official Workflow Slip"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Slip</span>
                    </button>
                  </div>
                </div>

                {/* THE COMPLETE WORKFLOW STAGES PROGRESSION PIPELINE */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>End-to-End Workflow Stages & Live Tracking Pipeline</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Current Stage: <strong className="text-slate-900">{activeTrackedApp.currentStageName}</strong>
                    </span>
                  </div>

                  {/* Connected Stage Stepper */}
                  <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 pt-2 pb-2">
                    {getWorkflowStages(activeTrackedApp).map((stage) => {
                      return (
                        <div key={stage.step} className="relative group">
                          {/* Dot / Icon on the timeline */}
                          <div
                            className={`absolute -left-[33px] top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                              stage.isCompleted
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : stage.isCurrent
                                ? activeTrackedApp.delayStatus === 'UNUSUAL_DELAY'
                                  ? 'bg-rose-600 border-rose-300 text-white ring-4 ring-rose-100 animate-pulse'
                                  : activeTrackedApp.delayStatus === 'DELAYED'
                                  ? 'bg-amber-600 border-amber-300 text-white ring-4 ring-amber-100'
                                  : 'bg-indigo-600 border-indigo-300 text-white ring-4 ring-indigo-100'
                                : stage.isDeficiency
                                ? 'bg-rose-600 border-rose-300 text-white ring-4 ring-rose-100'
                                : 'bg-slate-100 border-slate-300 text-slate-500'
                            }`}
                          >
                            {stage.isCompleted ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              stage.step
                            )}
                          </div>

                          {/* Stage Content Card */}
                          <div
                            className={`p-4 rounded-xl border transition ${
                              stage.isCurrent
                                ? activeTrackedApp.delayStatus === 'UNUSUAL_DELAY'
                                  ? 'bg-rose-50/60 border-rose-200 ring-1 ring-rose-200'
                                  : activeTrackedApp.delayStatus === 'DELAYED'
                                  ? 'bg-amber-50/60 border-amber-200 ring-1 ring-amber-200'
                                  : 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200'
                                : stage.isCompleted
                                ? 'bg-slate-50/60 border-slate-200'
                                : 'bg-white border-slate-200 opacity-70'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  Stage {stage.step}: {stage.title}
                                </span>
                                {stage.isCompleted && (
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Completed</span>
                                  </span>
                                )}
                                {stage.isCurrent && (
                                  <span
                                    className={`px-2 py-0.2 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                      activeTrackedApp.delayStatus === 'UNUSUAL_DELAY'
                                        ? 'bg-rose-100 text-rose-800'
                                        : activeTrackedApp.delayStatus === 'DELAYED'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-indigo-100 text-indigo-800'
                                    }`}
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>Currently Pending Here ({activeTrackedApp.daysPending} days)</span>
                                  </span>
                                )}
                                {!stage.isCompleted && !stage.isCurrent && (
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                                    Queued / Upcoming
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                <span className="font-mono text-slate-600">SLA: {stage.baseline}</span>
                                {stage.timestamp && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-slate-500">
                                      {new Date(stage.timestamp).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                              {stage.summary}
                            </p>

                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                              <span>Responsible Authority: <strong className="text-slate-700">{stage.authority}</strong></span>
                              {stage.isCurrent && (
                                <span className="text-indigo-700 font-medium">
                                  Diagnostic: {activeTrackedApp.bottleneckReason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Applicant Action & Diagnostic Directive */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div
                    className={`p-4 rounded-xl border text-xs ${
                      activeTrackedApp.actionRequired
                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {activeTrackedApp.actionRequired ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Action Required from Applicant: YES</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Action Required from Applicant: NO</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed">{activeTrackedApp.actionRequiredMessage}</p>
                    <p className="mt-2 text-[10px] text-slate-600">
                      Responsibility: <strong>{activeTrackedApp.actionResponsibility}</strong>
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Neutral Delay Assessment & Directive
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {activeTrackedApp.bottleneckReason}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Evaluated against policy Service Level Agreement (SLA) baselines without presumption of fault.
                    </p>
                  </div>
                </div>

                {/* Verified Transition Events Ledger */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Verified Transition Ledger & Audit Trail
                  </h4>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-4 text-xs">
                    {activeTrackedApp.timeline.map((ev, idx) => (
                      <div key={idx} className="relative pb-2">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{ev.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(ev.timestamp).toLocaleDateString()} · {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{ev.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => handleDownloadStatusSlip(activeTrackedApp)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Tracking Dossier (.txt)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setNudgeTargetApp(activeTrackedApp);
                        setNudgeMessage(
                          `Administrative review reminder regarding application ${activeTrackedApp.applicationNumber} (${activeTrackedApp.applicantName}) pending at ${activeTrackedApp.currentStageName}.`
                        );
                        setIsNudgeModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Issue Administrative Nudge</span>
                    </button>

                    <button
                      onClick={() => setSelectedApplicationDossier(activeTrackedApp)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
                    >
                      Open Full Dossier Modal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Applications List Table for Tracking */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    All Monitored Applications ({trackingFilteredApps.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click "Track Workflow" on any application to view its multi-stage lifecycle pipeline above.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Application ID</th>
                      <th className="py-2.5 px-3">Applicant Name</th>
                      <th className="py-2.5 px-3">Scheme</th>
                      <th className="py-2.5 px-3">Current Stage</th>
                      <th className="py-2.5 px-3">Days Pending</th>
                      <th className="py-2.5 px-3">Expected (SLA)</th>
                      <th className="py-2.5 px-3">Delay Classification</th>
                      <th className="py-2.5 px-3">Action Required</th>
                      <th className="py-2.5 px-3 text-right">Workflow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trackingFilteredApps.map((app) => (
                      <tr
                        key={app.id}
                        className={`transition ${
                          activeTrackedApp?.id === app.id ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{app.applicationNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{app.applicantName}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-700">
                            {app.schemeCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{app.currentStageName}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          <span
                            className={
                              app.daysPending > 10
                                ? 'text-rose-700'
                                : app.daysPending > 5
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }
                          >
                            {app.daysPending} days
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{app.expectedProcessingWindow}</td>
                        <td className="py-2.5 px-3">{getDelayBadge(app.delayStatus)}</td>
                        <td className="py-2.5 px-3">
                          {app.actionRequired ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                              Yes (Deficiency)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                              No (Pending Desk)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setActiveTrackingAppId(app.id);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                              activeTrackedApp?.id === app.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {activeTrackedApp?.id === app.id ? 'Tracking Active' : 'Track Workflow'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PERSPECTIVE 4: CONFIGURABLE SERVICE LEVEL AGREEMENT (SLA) BENCHMARKS (ADMIN) */}
      {overviewData && activePerspective === 'THRESHOLDS' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-5">
            <h2 className="text-base font-bold text-slate-900">Configurable Service Level Agreement (SLA) & Bottleneck Thresholds</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calibrate system-level delay detection parameters. Any modifications are automatically logged into the
              tamper-evident SHA-256 audit ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Global Threshold Boundaries</h3>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Normal Service Level Agreement (SLA) Max Limit (Days):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={normalMaxDaysInput}
                    onChange={(e) => setNormalMaxDaysInput(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500">
                    Applications pending &le; {normalMaxDaysInput} days are categorized as "Normal".
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Delayed Window Upper Threshold (Days):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={normalMaxDaysInput + 1}
                    max={30}
                    value={delayedMaxDaysInput}
                    onChange={(e) => setDelayedMaxDaysInput(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500">
                    Applications pending &gt; {delayedMaxDaysInput} days trigger "Unusual Delay Detected".
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveThresholds}
                  disabled={savingThresholds}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingThresholds ? 'Saving...' : 'Update & Audit Thresholds'}</span>
                </button>
              </div>
            </div>

            {/* Stage-wise configured baselines display */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Configured Stage Baselines</h3>

              <div className="space-y-2 text-xs">
                {Object.entries(overviewData.systemSummary.thresholds?.stageBaselines || {}).map(([key, cfg]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900">{cfg.label}</span>
                      <span className="text-[10px] text-slate-500 block">Role: {cfg.responsibleRole}</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-700">
                      {cfg.minDays}–{cfg.maxDays} days
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATION DELAY DOSSIER MODAL */}
      {selectedApplicationDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900">
                    {selectedApplicationDossier.applicationNumber}
                  </span>
                  {getDelayBadge(selectedApplicationDossier.delayStatus)}
                </div>
                <h3 className="text-sm font-bold text-slate-800 mt-1">
                  {selectedApplicationDossier.schemeName} ({selectedApplicationDossier.schemeCode})
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedApplicationDossier.applicantName} · {selectedApplicationDossier.institutionName} ·{' '}
                  {selectedApplicationDossier.state}
                </p>
              </div>

              <button
                onClick={() => setSelectedApplicationDossier(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delay Metrics Summary Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Stage</span>
                <span className="text-xs font-bold text-slate-900 mt-1 block">
                  {selectedApplicationDossier.currentStageName}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Stage Entry Date</span>
                <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">
                  {new Date(selectedApplicationDossier.stageEntryDate).toLocaleDateString()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Days Pending</span>
                <span className="text-xs font-mono font-bold text-amber-700 mt-1 block">
                  {selectedApplicationDossier.daysPending} days
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Expected Baseline (SLA)</span>
                <span className="text-xs font-mono font-bold text-indigo-700 mt-1 block">
                  {selectedApplicationDossier.expectedProcessingWindow}
                </span>
              </div>
            </div>

            {/* Action Required Box */}
            <div
              className={`p-4 rounded-xl border text-xs ${
                selectedApplicationDossier.actionRequired
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {selectedApplicationDossier.actionRequired ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Action Required from Applicant: YES</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Action Required from Applicant: NO</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed">{selectedApplicationDossier.actionRequiredMessage}</p>
            </div>

            {/* Neutral Pattern Diagnostic Assessment */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Neutral Bottleneck Diagnostic Assessment
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedApplicationDossier.bottleneckReason}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Classification is derived programmatically from waiting time vs policy Service Level Agreement (SLA) baseline benchmarks without
                presumption of individual fault.
              </p>
            </div>

            {/* Full Multi-Stage Workflow Stages Pipeline inside Modal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Verification Workflow Pipeline Progress</span>
              </h4>
              <div className="space-y-3 border-l-2 border-slate-200 pl-4 text-xs">
                {getWorkflowStages(selectedApplicationDossier).map((stage) => (
                  <div key={stage.step} className="relative pb-1">
                    <div
                      className={`absolute -left-[23px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        stage.isCompleted
                          ? 'bg-emerald-600 text-white'
                          : stage.isCurrent
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {stage.isCompleted ? '✓' : stage.step}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{stage.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        stage.isCompleted
                          ? 'bg-emerald-50 text-emerald-700'
                          : stage.isCurrent
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {stage.isCompleted ? 'Completed' : stage.isCurrent ? 'Current Stage' : 'Queued'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{stage.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Verified Transition Log & Timestamps
              </h4>

              <div className="space-y-2 border-l-2 border-slate-200 pl-4 text-xs">
                {selectedApplicationDossier.timeline.map((ev, idx) => (
                  <div key={idx} className="relative pb-2">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ev.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ev.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleDownloadStatusSlip(selectedApplicationDossier)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Status Slip</span>
              </button>

              <div className="flex items-center gap-2">
                {isOfficerOrAdmin && (
                  <button
                    onClick={() => {
                      setNudgeTargetApp(selectedApplicationDossier);
                      setNudgeMessage(
                        `Administrative review inquiry regarding application ${selectedApplicationDossier.applicationNumber} pending for ${selectedApplicationDossier.daysPending} days.`
                      );
                      setIsNudgeModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Issue Review Notice</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedApplicationDossier(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMINISTRATIVE NOTICE / NUDGE MODAL */}
      {isNudgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Issue Administrative Review Notice</h3>
              </div>
              <button onClick={() => setIsNudgeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Target:{' '}
              <span className="font-bold text-slate-800">
                {nudgeTargetApp ? `${nudgeTargetApp.applicationNumber} (${nudgeTargetApp.applicantName})` : nudgeTargetInst}
              </span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Administrative Note / Directives:</label>
              <textarea
                rows={4}
                value={nudgeMessage}
                onChange={(e) => setNudgeMessage(e.target.value)}
                placeholder="Enter administrative review note..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Notice will be recorded in the immutable SHA-256 audit ledger and notified to the recipient.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNudgeModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNudge}
                disabled={sendingNudge}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingNudge ? 'Dispatching...' : 'Dispatch Review Notice'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
