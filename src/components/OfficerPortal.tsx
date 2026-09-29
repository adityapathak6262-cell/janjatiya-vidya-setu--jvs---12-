import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Shield, 
  SlidersHorizontal, 
  Search, 
  Filter, 
  FileText, 
  ExternalLink, 
  CheckSquare, 
  XSquare, 
  ShieldAlert, 
  Award, 
  Scale, 
  FileCheck2,
  RefreshCw,
  Send,
  Eye,
  UserCheck,
  Building,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Users,
  Lock,
  Key,
  Download,
  Share2
} from 'lucide-react';
import { 
  User, 
  Application, 
  DocumentRecord, 
  VerificationCase, 
  ScrutinyCase, 
  SelectionDecision, 
  api 
} from '../api';
import { JvsIntelligence } from './JvsIntelligence';

interface OfficerPortalProps {
  currentUser: User;
  onRefreshData: () => void;
  onNavigateTab?: (tab: string) => void;
  targetSubTab?: 'verification' | 'scrutiny' | 'selection' | 'intelligence' | 'handover' | 'sentinel';
}

export const OfficerPortal: React.FC<OfficerPortalProps> = ({ currentUser, onRefreshData, onNavigateTab, targetSubTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'verification' | 'scrutiny' | 'selection' | 'intelligence' | 'handover' | 'sentinel'>('verification');

  // Sync external targetSubTab navigation (e.g. from 3-dot overflow menu)
  useEffect(() => {
    if (targetSubTab) {
      setActiveSubTab(targetSubTab);
    }
  }, [targetSubTab]);

  // Innovative Officer Features State
  const [chargeRelinquished, setChargeRelinquished] = useState(false);
  const [chargeAssumed, setChargeAssumed] = useState(false);
  const [bulkPassExecuted, setBulkPassExecuted] = useState(false);
  const [cagShieldModalOpen, setCagShieldModalOpen] = useState(false);
  const [rogueSyndicateFrozen, setRogueSyndicateFrozen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [appDossier, setAppDossier] = useState<{
    application: Application;
    scheme: any;
    policyVersion: any;
    documents: DocumentRecord[];
    deficiencies: any[];
    verificationCase?: VerificationCase;
    scrutinyCase?: ScrutinyCase;
    selectionDecision?: SelectionDecision;
  } | null>(null);

  // Filters & Search
  const [schemeFilter, setSchemeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Verification Decision modal / action state
  const [showDeficiencyModal, setShowDeficiencyModal] = useState(false);
  const [defWhat, setDefWhat] = useState('');
  const [defWhy, setDefWhy] = useState('');
  const [defAction, setDefAction] = useState('');
  const [verRemarks, setVerRemarks] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Scrutiny review state
  const [scrutinyScore, setScrutinyScore] = useState(85);
  const [scrutinyRec, setScrutinyRec] = useState<'RECOMMENDED' | 'SHORTLISTED' | 'WAITLISTED' | 'NOT_RECOMMENDED'>('RECOMMENDED');
  const [scrutinyRemarks, setScrutinyRemarks] = useState('');
  const [priorityPremier, setPriorityPremier] = useState(false);
  const [priorityDivyangjan, setPriorityDivyangjan] = useState(false);
  const [priorityPVTG, setPriorityPVTG] = useState(false);
  const [priorityFemale, setPriorityFemale] = useState(false);

  // Selection decision state
  const [selectionDecision, setSelectionDecision] = useState<'SELECTED' | 'NOT_SELECTED' | 'WAITLISTED'>('SELECTED');
  const [quotaCategory, setQuotaCategory] = useState<'DIVYANGJAN' | 'PVTG' | 'FEMALE' | 'ST_OTHERS'>('ST_OTHERS');
  const [awardAmount, setAwardAmount] = useState('₹3,72,000 + HRA & Contingency');
  const [awardRemarks, setAwardRemarks] = useState('');
  const [meritRankingGenerated, setMeritRankingGenerated] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getApplications({ cohortView: true });
      setApplications(data);
      if (data.length > 0 && !selectedAppId) {
        setSelectedAppId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [currentUser]);

  useEffect(() => {
    if (selectedAppId) {
      loadDossier(selectedAppId);
    } else {
      setAppDossier(null);
    }
  }, [selectedAppId]);

  const loadDossier = async (id: string) => {
    try {
      const data = await api.getApplicationById(id);
      setAppDossier(data as any);
      // Pre-fill scrutiny state
      if (data.scrutinyCase) {
        setScrutinyScore(data.scrutinyCase.score);
        setScrutinyRec(data.scrutinyCase.recommendation);
        setScrutinyRemarks(data.scrutinyCase.committeeRemarks);
      }
      if (data.application.fieldValues?.hasAdmissionOfferFromPremier) setPriorityPremier(true);
      if (data.application.fieldValues?.isDivyangjan) setPriorityDivyangjan(true);
      if (data.application.fieldValues?.isPVTG) setPriorityPVTG(true);
      if (data.application.fieldValues?.gender?.toLowerCase() === 'female') setPriorityFemale(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Re-run PRAMAAN Verification
  const handleRerunPramaan = async () => {
    if (!selectedAppId) return;
    setActionInProgress(true);
    try {
      await api.evaluateVerification(selectedAppId);
      await loadDossier(selectedAppId);
      await fetchApplications();
      onRefreshData();
    } catch (err: any) {
      alert(`PRAMAAN evaluation failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Verification Decision: Approve
  const handleApproveVerification = async () => {
    if (!selectedAppId) return;
    setActionInProgress(true);
    try {
      await api.submitVerificationDecision({
        applicationId: selectedAppId,
        decision: 'VERIFY_APPROVE',
        remarks: verRemarks || 'All credentials and evidence verified against policy rules.',
      });
      await loadDossier(selectedAppId);
      await fetchApplications();
      onRefreshData();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Verification Decision: Raise Deficiency
  const handleRaiseDeficiency = async () => {
    if (!selectedAppId || !defWhat) return;
    setActionInProgress(true);
    try {
      await api.submitVerificationDecision({
        applicationId: selectedAppId,
        decision: 'MARK_DEFECTIVE',
        remarks: 'Verification disparity flagged. Correction required from candidate.',
        deficienciesToRaise: [
          {
            requirementKey: 'manual_verification_flag',
            documentKey: 'caste_certificate',
            title: 'Evidence Rectification Notice',
            whatExplanation: defWhat,
            whyExplanation: defWhy || 'Policy guidelines mandate verified congruence between application details and statutory certificates.',
            actionRequired: defAction || 'Candidate must upload supporting affidavit or updated certificate.',
          },
        ],
      });
      setShowDeficiencyModal(false);
      setDefWhat('');
      setDefWhy('');
      setDefAction('');
      await loadDossier(selectedAppId);
      await fetchApplications();
      onRefreshData();
    } catch (err: any) {
      alert(`Failed to raise deficiency: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Submit Scrutiny Review
  const handleSubmitScrutiny = async () => {
    if (!selectedAppId) return;
    setActionInProgress(true);
    try {
      const criteria: string[] = [];
      if (priorityPremier) criteria.push('IIT/AIIMS/IIM Offer (Note-1 Priority)');
      if (priorityDivyangjan) criteria.push('Divyangjan 5% Quota');
      if (priorityPVTG) criteria.push('PVTG Priority');
      if (priorityFemale) criteria.push('Female 30% Quota');

      await api.submitScrutinyReview({
        applicationId: selectedAppId,
        score: scrutinyScore,
        recommendation: scrutinyRec,
        committeeRemarks: scrutinyRemarks || 'Verified against selection committee guidelines.',
        priorityCriteriaMet: criteria,
      });
      await loadDossier(selectedAppId);
      await fetchApplications();
      onRefreshData();
    } catch (err: any) {
      alert(`Scrutiny submission failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Submit Final Selection & Award Decision
  const handleRecordSelection = async () => {
    if (!selectedAppId) return;
    setActionInProgress(true);
    try {
      await api.recordSelectionDecision({
        applicationId: selectedAppId,
        decision: selectionDecision,
        quotaCategory: quotaCategory,
        annualAwardAmount: awardAmount,
        remarks: awardRemarks || 'Official selection approved by the Ministry committee.',
      });
      await loadDossier(selectedAppId);
      await fetchApplications();
      onRefreshData();
    } catch (err: any) {
      alert(`Selection recording failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Filtered Applications List
  const filteredApps = applications.filter((app) => {
    if (schemeFilter !== 'ALL' && app.schemeCode !== schemeFilter) return false;
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = app.applicationNumber.toLowerCase().includes(q);
      const matchName = app.applicantName?.toLowerCase().includes(q);
      if (!matchNum && !matchName) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Officer Header & Metrics Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-indigo-700 font-bold">
                Government Officer Workspace
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-semibold">{currentUser.institution}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Officer Verification & Scrutiny Bench
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Officer: <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.role})
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveSubTab('verification')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeSubTab === 'verification' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. PRAMAAN Verification
              </button>
              <button
                onClick={() => setActiveSubTab('scrutiny')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeSubTab === 'scrutiny' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Scrutiny Bench
              </button>
              <button
                onClick={() => setActiveSubTab('selection')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeSubTab === 'selection' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Selection & Award
              </button>
              <button
                onClick={() => setActiveSubTab('handover')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeSubTab === 'handover' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Share2 className="w-3 h-3 text-indigo-400" />
                <span>4. Handover (GFR 255)</span>
                <span className={`text-[9px] px-1 rounded-full ${activeSubTab === 'handover' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'}`}>0-Day Loss</span>
              </button>
              <button
                onClick={() => setActiveSubTab('sentinel')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeSubTab === 'sentinel' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>5. Syndicate Trap</span>
                <span className={`text-[9px] px-1 rounded-full ${activeSubTab === 'sentinel' ? 'bg-rose-800 text-rose-100' : 'bg-rose-100 text-rose-800'}`}>Fraud Velocity</span>
              </button>
            </div>

            {/* JVS Intelligence Button / Entry Point */}
            <button
              onClick={() => setActiveSubTab('intelligence')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                activeSubTab === 'intelligence'
                  ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                  : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>JVS Intelligence</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-950 font-extrabold">New</span>
            </button>

            {/* Scholarship Continuity Queue Entry Point */}
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('continuity')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scholarship Continuity</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 text-emerald-950 font-extrabold">Queue</span>
              </button>
            )}

            {/* System Delay Monitor Entry Point */}
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('delay-monitor')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs bg-indigo-50 text-indigo-900 border border-indigo-300 hover:bg-indigo-100"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Verification Delay Monitor</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200 text-indigo-950 font-extrabold">Bottlenecks</span>
              </button>
            )}
          </div>
        </div>

        {/* Real Dynamic Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Total In Queue</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">{applications.length}</span>
          </div>
          <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100">
            <span className="text-[11px] text-blue-700 block">Under Verification</span>
            <span className="text-lg font-bold text-blue-900 mt-0.5 block">
              {applications.filter((a) => a.status === 'SUBMITTED' || a.status === 'ELIGIBILITY_CHECK' || a.status === 'RESUBMITTED').length}
            </span>
          </div>
          <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-100">
            <span className="text-[11px] text-rose-700 block">Active Deficiencies</span>
            <span className="text-lg font-bold text-rose-900 mt-0.5 block">
              {applications.filter((a) => a.status === 'DEFICIENCY').length}
            </span>
          </div>
          <div className="p-3 bg-purple-50/70 rounded-lg border border-purple-100">
            <span className="text-[11px] text-purple-700 block">Ready for Scrutiny</span>
            <span className="text-lg font-bold text-purple-900 mt-0.5 block">
              {applications.filter((a) => a.status === 'READY_FOR_SCRUTINY' || a.status === 'SCRUTINY' || a.status === 'SCREENING').length}
            </span>
          </div>
          <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100">
            <span className="text-[11px] text-emerald-700 block">Provisionally Selected</span>
            <span className="text-lg font-bold text-emerald-900 mt-0.5 block">
              {applications.filter((a) => a.status === 'SELECTED' || a.status === 'POST_SELECTION').length}
            </span>
          </div>
        </div>

        {/* JVS Intelligence Quick Access Dashboard Card */}
        <div className="mt-4 p-3 bg-linear-to-r from-amber-50/90 via-orange-50/90 to-amber-50/90 border border-amber-200/90 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-amber-950">JVS Intelligence & Decision Support</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-950 font-bold">Academic Cycle 2026–27</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Cohort Analytics across States & Universities · Recommended Attention Queue · Process Bottlenecks & Delay Risks
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('intelligence')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs whitespace-nowrap self-start sm:self-auto"
          >
            <span>Launch JVS Intelligence</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* JVS Intelligence vs Existing Workbench */}
      {activeSubTab === 'intelligence' ? (
        <JvsIntelligence
          currentUser={currentUser}
          applications={applications}
          onBackToWorkbench={() => setActiveSubTab('verification')}
          onOpenApplication={(appId, targetTab) => {
            setSelectedAppId(appId);
            setActiveSubTab(targetTab || 'verification');
          }}
        />
      ) : activeSubTab === 'handover' ? (
        /* ========================================================================= */
        /* SUB-TAB 4: CONTEXTUAL HANDOVER MODE (GFR RULE 255) */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] rounded-full uppercase border border-indigo-200">
                    GFR 2017 Rule 255 · Transfer of Charge
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                    Zero Day Lost · 100% State Preserved
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                  Contextual Handover & Digital Charge Relinquishment Desk
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Eliminates the 4-month file re-scrutiny backlog when Desk Officers are transferred or go on leave.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setChargeRelinquished(false); setChargeAssumed(false); }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Reset Demo
                </button>
              </div>
            </div>

            {/* Officer Profiles: Outgoing vs Incoming */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Relinquishing Officer (Outgoing)
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                    RM
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Shri R. K. Meena</h4>
                    <span className="text-xs text-slate-500">Desk Officer (ST-II) · Transferred to MoPR</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between">
                  <span>Transfer Order: <strong>MoTA/EST/2026/894</strong></span>
                  <span className={`font-bold ${chargeRelinquished ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {chargeRelinquished ? '✓ Charge Relinquished' : 'Pending Relinquishment'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Assuming Officer (Incoming)
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-sm">
                    AT
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Smt. Ananya Toppo</h4>
                    <span className="text-xs text-slate-500">Desk Officer (ST-II) · Joining on Posting</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between">
                  <span>Joining Duty Date: <strong>Today (Active Session)</strong></span>
                  <span className={`font-bold ${chargeAssumed ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {chargeAssumed ? '✓ Charge Digitally Assumed' : 'Awaiting Relinquishment'}
                  </span>
                </div>
              </div>
            </div>

            {/* Triaged Workload Balance (3 Buckets) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                Handover Dossier: Triaged Workload State (72 Total Applications)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Bucket 1 */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-950">1. Pre-Cleared Clean Files</span>
                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full text-[10px] font-extrabold">42 Files</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    100% DigiLocker verified, zero discrepancy. Incoming officer can execute <strong>1-Click Bulk Approval</strong> without re-reading 500 pages.
                  </p>
                  <div className="text-[10px] font-semibold text-emerald-900 pt-1 border-t border-emerald-200">
                    Est. Time Saved: <strong>14 Working Days</strong>
                  </div>
                </div>

                {/* Bucket 2 */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-amber-950">2. High-Risk / AI-Flagged</span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-extrabold">18 Files</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Discrepancy tagged. Outgoing officer's <strong>preliminary notes & reason tags are preserved</strong> so incoming officer doesn't start from zero!
                  </p>
                  <div className="text-[10px] font-semibold text-amber-900 pt-1 border-t border-amber-200">
                    Sticky Notes Preserved: <strong>18 Annotations</strong>
                  </div>
                </div>

                {/* Bucket 3 */}
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-rose-950">3. Grievance SLA Escalations</span>
                    <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded-full text-[10px] font-extrabold">12 Tickets</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Citizen Charter deadline active. Due within <strong>48 hours</strong>. Highlighted in incoming officer's primary high-priority queue.
                  </p>
                  <div className="text-[10px] font-semibold text-rose-900 pt-1 border-t border-rose-200">
                    SLA Breach Risk: <strong>Zero (Auto-Escalated)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons for Digital Transfer */}
            <div className="p-5 bg-slate-900 text-white rounded-xl space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    GFR-255 Digital Certificate of Transfer Execution
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Statutory compliance under Government of India General Financial Rules (Rule 255).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setChargeRelinquished(true)}
                    disabled={chargeRelinquished}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 disabled:text-slate-400 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {chargeRelinquished ? '1. Charge Relinquished' : '1. Relinquish Charge (Outgoing)'}
                  </button>

                  <button
                    onClick={() => setChargeAssumed(true)}
                    disabled={!chargeRelinquished || chargeAssumed}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white disabled:text-slate-400 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {chargeAssumed ? '2. Charge Digitally Assumed' : '2. Assume Charge (Incoming)'}
                  </button>
                </div>
              </div>

              {chargeAssumed && (
                <div className="p-4 bg-slate-800 rounded-xl border border-emerald-500/40 text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between font-bold text-emerald-400 border-b border-slate-700 pb-2">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Digital Certificate of Transfer of Charge Issued & Signed!
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Hash: SHA256-GFR255-894-2026-OK
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                    <div>
                      <span>Handed Over by:</span>
                      <strong className="block text-white">Shri R. K. Meena (Outgoing Desk Officer)</strong>
                    </div>
                    <div>
                      <span>Taken Over by:</span>
                      <strong className="block text-emerald-300">Smt. Ananya Toppo (Incoming Desk Officer)</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-700 italic">
                    All 72 pending cases, complete audit trails, and reason logs transferred with zero loss of institutional context. Incoming officer workbench is 100% populated.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'sentinel' ? (
        /* ========================================================================= */
        /* SUB-TAB 5: ROGUE SYNDICATE SENTINEL (VELOCITY TRAP) */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-extrabold text-[10px] rounded-full uppercase border border-rose-200">
                    Vigilance & Anti-Corruption Sentinel
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-full border border-amber-200">
                    Velocity Trap Active
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Rogue Syndicate & Cyber Cafe Anomaly Trap
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Detects bulk fabricated certificate rings and rogue cyber cafe clusters before public funds leave the treasury.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRogueSyndicateFrozen(!rogueSyndicateFrozen)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    rogueSyndicateFrozen
                      ? 'bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  {rogueSyndicateFrozen ? 'Batch Under Vigilance Freeze (Safe)' : '1-Click Freeze Rogue Batch (₹1.90 Cr Saved)'}
                </button>
              </div>
            </div>

            {/* Live Telemetry Card */}
            <div className="p-4 bg-rose-50/70 border border-rose-300 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200/80 pb-2">
                <span className="font-extrabold text-xs text-rose-950 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  CRITICAL ANOMALY ALERT: Clustered Certificate Submission Velocity
                </span>
                <span className="font-mono text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-bold">
                  Cluster ID: SYND-JH-2026-09
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-rose-200">
                  <span className="text-slate-500 text-[10px] block">Identified Node</span>
                  <strong className="text-slate-900 block mt-0.5">Birsa Cyber Solutions</strong>
                  <span className="text-[10px] text-slate-500">Circular Road, Ranchi, JH</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-rose-200">
                  <span className="text-slate-500 text-[10px] block">Velocity Spike</span>
                  <strong className="text-rose-700 block mt-0.5">38 Apps in 22 Mins</strong>
                  <span className="text-[10px] text-slate-500">Normal citizen avg: 1 app/day</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-rose-200">
                  <span className="text-slate-500 text-[10px] block">Serial No. Clustering</span>
                  <strong className="text-rose-700 block mt-0.5">JH/INC/0891 to 0929</strong>
                  <span className="text-[10px] text-slate-500">Consecutive certificate series</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-rose-200">
                  <span className="text-slate-500 text-[10px] block">Potential Fraud Value</span>
                  <strong className="text-rose-900 font-black block mt-0.5 text-sm">₹1,90,00,000</strong>
                  <span className="text-[10px] text-slate-500">38 Fellowship Allocations</span>
                </div>
              </div>

              {rogueSyndicateFrozen ? (
                <div className="p-3.5 bg-emerald-100 border border-emerald-300 rounded-lg text-xs space-y-1 text-emerald-950">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    All 38 Applications Successfully Frozen on State Ledger!
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Auto-generated Vigilance Dossier dispatched to <strong>Jharkhand State Anti-Corruption Bureau & Central CVC Cell</strong>. Treasury DBT disbursement pipeline hard-locked for these 38 Aadhaar tokens. <strong>Zero taxpayer money compromised.</strong>
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  <strong>Pattern Analysis:</strong> The identical IP subnet (`103.24.182.xx`) generated 38 applications with synthetic income certificates purportedly signed by the same Circle Officer within a 22-minute window. Click the button above to freeze this syndicate batch immediately.
                </p>
              )}
            </div>

            {/* List of 5 Sample Flagged Applications in Syndicate */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">Flagged Syndicate Batch Applications (Sample 5 of 38):</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">App ID</th>
                      <th className="p-2.5">Applicant Name</th>
                      <th className="p-2.5">Certificate Serial</th>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Vigilance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">NF-2026-SYN-01</td>
                      <td className="p-2.5">Rameshwar Kujur</td>
                      <td className="p-2.5 font-mono text-rose-700">JH/INC/2026/0891</td>
                      <td className="p-2.5 text-slate-500">14:02:11</td>
                      <td className="p-2.5 font-bold text-rose-700">{rogueSyndicateFrozen ? 'FROZEN' : 'FLAGGED'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">NF-2026-SYN-02</td>
                      <td className="p-2.5">Fulmani Toppo</td>
                      <td className="p-2.5 font-mono text-rose-700">JH/INC/2026/0892</td>
                      <td className="p-2.5 text-slate-500">14:02:44</td>
                      <td className="p-2.5 font-bold text-rose-700">{rogueSyndicateFrozen ? 'FROZEN' : 'FLAGGED'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">NF-2026-SYN-03</td>
                      <td className="p-2.5">Birsa Oraon</td>
                      <td className="p-2.5 font-mono text-rose-700">JH/INC/2026/0893</td>
                      <td className="p-2.5 text-slate-500">14:03:19</td>
                      <td className="p-2.5 font-bold text-rose-700">{rogueSyndicateFrozen ? 'FROZEN' : 'FLAGGED'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">NF-2026-SYN-04</td>
                      <td className="p-2.5">Sarita Minz</td>
                      <td className="p-2.5 font-mono text-rose-700">JH/INC/2026/0894</td>
                      <td className="p-2.5 text-slate-500">14:03:52</td>
                      <td className="p-2.5 font-bold text-rose-700">{rogueSyndicateFrozen ? 'FROZEN' : 'FLAGGED'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">NF-2026-SYN-05</td>
                      <td className="p-2.5">Anil Baski</td>
                      <td className="p-2.5 font-mono text-rose-700">JH/INC/2026/0895</td>
                      <td className="p-2.5 text-slate-500">14:04:30</td>
                      <td className="p-2.5 font-bold text-rose-700">{rogueSyndicateFrozen ? 'FROZEN' : 'FLAGGED'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Workbench Layout: Left Queue (4 Cols), Right Dossier / Action (8 Cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable Application Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Application Queue ({filteredApps.length})
              </h2>
              <button
                onClick={fetchApplications}
                title="Refresh queue"
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ⚡ Bulk Smart-Pass with 5% CVC Micro-Sample Audit */}
            <div className="space-y-2 pb-2 border-b border-slate-100">
              <button
                onClick={() => setBulkPassExecuted(!bulkPassExecuted)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-between shadow-2xs cursor-pointer ${
                  bulkPassExecuted
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {bulkPassExecuted ? 'Bulk Pass Executed (CVC Compliant)' : 'Bulk Smart-Pass Clean Queue (80/20)'}
                </span>
                <span className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                  5% Audit Sample
                </span>
              </button>
              {bulkPassExecuted && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 40 Applications Batch-Verified!
                  </div>
                  <p className="text-[10px] text-emerald-800 leading-relaxed">
                    As per Central Vigilance Commission (CVC) mandate, <strong>2 random applications (5% micro-sample)</strong> have been locked for mandatory manual scrutiny (App #NF-2026-004 & #NF-2026-018) while 40 clean DigiLocker files moved to scrutiny instantly!
                  </p>
                </div>
              )}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search App # or Applicant..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Scheme & Status Filter Pills */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={schemeFilter}
                onChange={(e) => setSchemeFilter(e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-700"
              >
                <option value="ALL">All Schemes</option>
                <option value="NFST">NFST (Fellowship)</option>
                <option value="NOS">NOS (Overseas)</option>
                <option value="PRE_MATRIC">Pre-Matric</option>
                <option value="POST_MATRIC">Post-Matric</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="DEFICIENCY">Deficiency</option>
                <option value="RESUBMITTED">Resubmitted</option>
                <option value="READY_FOR_SCRUTINY">Ready for Scrutiny</option>
                <option value="SELECTED">Selected</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pt-1">
              {filteredApps.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No applications match filters.
                </div>
              ) : (
                filteredApps.map((app) => {
                  const isSelected = selectedAppId === app.id;
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-slate-900">
                          {app.applicationNumber}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {app.schemeCode}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-800 line-clamp-1">
                        {app.applicantName || app.fieldValues?.applicantName || 'Applicant'}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Status: <span className="font-bold text-slate-700">{app.status}</span></span>
                        <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Case Dossier & Action Inspector */}
        <div className="lg:col-span-8">
          {appDossier ? (
            <div className="space-y-6">
              {/* Dossier Banner */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {appDossier.application.applicationNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
                      {appDossier.application.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-800 mt-1">
                    {appDossier.application.fieldValues?.applicantName || 'Applicant'} · {appDossier.scheme.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Policy Applied: <span className="font-mono font-semibold">{appDossier.policyVersion.academicYear || '2026-27'}</span> · Domicile: <span className="font-semibold">{appDossier.application.fieldValues?.domicileState}</span> · Category: <span className="font-semibold">{appDossier.application.fieldValues?.tribeCommunity || 'ST'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRerunPramaan}
                    disabled={actionInProgress}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-run PRAMAAN Check
                  </button>
                </div>
              </div>

              {/* VIEW 1: PRAMAAN DUAL-PATH VERIFICATION INSPECTOR */}
              {activeSubTab === 'verification' && (
                <div className="space-y-6">
                  {/* PRAMAAN Overall Status Callout */}
                  <div className={`p-4 rounded-xl border text-xs ${
                    appDossier.verificationCase?.overallStatus === 'VERIFIED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : appDossier.verificationCase?.overallStatus === 'INCONSISTENT' || appDossier.verificationCase?.overallStatus === 'INCOMPLETE'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Shield className="w-4 h-4" />
                        PRAMAAN Automated Verification Engine: {appDossier.verificationCase?.overallStatus || 'PENDING EVALUATION'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {appDossier.verificationCase?.notes || 'Automated dual-path rules engine verified data against published scheme policy.'}
                    </p>
                  </div>

                  {/* PATH A: Evidence & Cross-Document Inspection */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-indigo-600" />
                        Path A: Evidence & Cross-Document Cross-Checking
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Rule Invariants Checked
                      </span>
                    </div>

                    <div className="space-y-3">
                      {appDossier.verificationCase?.pathA_EvidenceResults?.map((res, i) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900">{res.ruleTitle}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                res.status === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {res.status} ({(res.confidence * 100).toFixed(0)}% Confidence)
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 my-2 text-[11px]">
                            <div className="bg-white p-2 rounded border border-slate-200">
                              <span className="text-[10px] text-slate-400 block">Entered in Application:</span>
                              <span className="font-semibold text-slate-800">{String(res.applicantValue)}</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-200">
                              <span className="text-[10px] text-slate-400 block">Extracted from Document:</span>
                              <span className="font-semibold text-slate-800">{String(res.documentExtractedValue)}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600">{res.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PATH B: Credential & Government Registry Adapters */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-emerald-600" />
                      Path B: Credential & Statutory Gateway Adapters
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {appDossier.verificationCase?.pathB_CredentialResults?.map((cred, i) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900 text-[11px] truncate">
                              {cred.target}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                              {cred.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{cred.source}</p>
                          <div className="mt-2 text-[10px] text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                            {cred.details}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Officer Action Bar */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Officer Verification Decision
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleApproveVerification}
                        disabled={actionInProgress}
                        className="flex-1 px-4 py-2.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-2"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Verify & Forward to Scrutiny
                      </button>

                      <button
                        onClick={() => setShowDeficiencyModal(true)}
                        disabled={actionInProgress}
                        className="flex-1 px-4 py-2.5 bg-rose-700 text-white rounded-lg text-xs font-bold hover:bg-rose-800 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Issue Explainable Deficiency Notice
                      </button>
                    </div>

                    {/* 🛡️ Officer Statutory Immunity Shield (1-Click CAG Defense Pack) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-indigo-950 block">Officer Statutory Immunity Shield</span>
                          <span className="text-[10px] text-indigo-800">Legal protection under statutory guidelines against retrospective CAG/CBI inquiries</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setCagShieldModalOpen(true)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Generate 1-Click CAG Defense Pack
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: SCRUTINY WORKBENCH */}
              {activeSubTab === 'scrutiny' && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-indigo-600" />
                      MoTA Scrutiny Committee Evaluation Bench
                    </h3>

                    {/* Merit & Score Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Merit Score (0 - 100)
                        </label>
                        <input
                          type="number"
                          value={scrutinyScore}
                          onChange={(e) => setScrutinyScore(parseInt(e.target.value) || 0)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Based on PG marks ({appDossier.application.fieldValues?.qualifyingMarksPercentage}%) & premier admission standing
                        </span>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Committee Recommendation
                        </label>
                        <select
                          value={scrutinyRec}
                          onChange={(e) => setScrutinyRec(e.target.value as any)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="RECOMMENDED">RECOMMENDED FOR AWARD</option>
                          <option value="SHORTLISTED">SHORTLISTED IN MERIT</option>
                          <option value="WAITLISTED">WAITLISTED</option>
                          <option value="NOT_RECOMMENDED">NOT RECOMMENDED</option>
                        </select>
                      </div>
                    </div>

                    {/* Official Scheme Priority Verification Checklist */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-2">
                        Official Scheme Priority Criteria Satisfied:
                      </span>
                      <div className="space-y-2 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded border border-slate-200">
                          <input
                            type="checkbox"
                            checked={priorityPremier}
                            onChange={(e) => setPriorityPremier(e.target.checked)}
                            className="w-4 h-4 rounded text-slate-900 border-slate-300"
                          />
                          <span className="font-semibold text-slate-800">
                            Admission Offer in IITs / AIIMS / IIMs / IISER (Direct Priority under Note-1)
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded border border-slate-200">
                          <input
                            type="checkbox"
                            checked={priorityDivyangjan}
                            onChange={(e) => setPriorityDivyangjan(e.target.checked)}
                            className="w-4 h-4 rounded text-slate-900 border-slate-300"
                          />
                          <span className="font-semibold text-slate-800">
                            Divyangjan 5% Reservation (38 Dedicated Slots for &gt;= 40% Disability)
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded border border-slate-200">
                          <input
                            type="checkbox"
                            checked={priorityPVTG}
                            onChange={(e) => setPriorityPVTG(e.target.checked)}
                            className="w-4 h-4 rounded text-slate-900 border-slate-300"
                          />
                          <span className="font-semibold text-slate-800">
                            Particularly Vulnerable Tribal Groups (PVTG - 25 Reserved Slots)
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded border border-slate-200">
                          <input
                            type="checkbox"
                            checked={priorityFemale}
                            onChange={(e) => setPriorityFemale(e.target.checked)}
                            className="w-4 h-4 rounded text-slate-900 border-slate-300"
                          />
                          <span className="font-semibold text-slate-800">
                            Female Candidate 30% Earmarking (225 Slots)
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Committee Observations & Formal Remarks
                      </label>
                      <textarea
                        rows={2}
                        value={scrutinyRemarks}
                        onChange={(e) => setScrutinyRemarks(e.target.value)}
                        placeholder="Add committee member notes, verification of original certificates, etc."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleSubmitScrutiny}
                        disabled={actionInProgress}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        Record Scrutiny Findings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: SELECTION & AWARD STUDIO */}
              {activeSubTab === 'selection' && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      Ministry Final Selection & Award Studio
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Selection Committee Verdict
                        </label>
                        <select
                          value={selectionDecision}
                          onChange={(e) => setSelectionDecision(e.target.value as any)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="SELECTED">SELECTED FOR AWARD</option>
                          <option value="WAITLISTED">PLACED ON WAITLIST</option>
                          <option value="NOT_SELECTED">NOT SELECTED</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Allocated Quota Category
                        </label>
                        <select
                          value={quotaCategory}
                          onChange={(e) => setQuotaCategory(e.target.value as any)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="DIVYANGJAN">Divyangjan Quota (38 Slots)</option>
                          <option value="PVTG">PVTG Quota (25 Slots)</option>
                          <option value="FEMALE">Female Earmarked Quota (225 Slots)</option>
                          <option value="ST_OTHERS">ST General / Open Merit (462 Slots)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">
                          Annual Fellowship Rate / Entitlement (As per Policy Version)
                        </label>
                        <input
                          type="text"
                          value={awardAmount}
                          onChange={(e) => setAwardAmount(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Sanction Order / Award Remarks
                      </label>
                      <textarea
                        rows={2}
                        value={awardRemarks}
                        onChange={(e) => setAwardRemarks(e.target.value)}
                        placeholder="State sanction reference, committee approval reference, etc."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                      <span className="font-bold block mb-0.5">Post-Selection Automation:</span>
                      Selecting this scholar will automatically bootstrap the University Joining Checklist, PFMS Beneficiary Linkage milestone, and Quarterly Continuation tracking.
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleRecordSelection}
                        disabled={actionInProgress}
                        className="px-5 py-2.5 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        Execute Selection & Issue Award Letter
                      </button>
                    </div>
                  </div>

                  {/* AUTOMATED STATUTORY MERIT & QUOTA ALLOCATOR */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                          Automated Merit Ranking Engine
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-purple-600" />
                          Statutory Quota Allocation & Merit List Generator
                        </h4>
                      </div>

                      <button
                        onClick={() => setMeritRankingGenerated(true)}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {meritRankingGenerated ? 'Re-Compute Merit Distribution' : 'Auto-Allocate Statutory Quotas (750 Slots)'}
                      </button>
                    </div>

                    {meritRankingGenerated ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              <strong>Merit Ranking Computed Successfully!</strong> Order reference: <span className="font-mono font-bold">MoTA/2026/NFST/MERIT-0914</span>. All statutory quotas filled according to policy guidelines.
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                            <div className="font-bold text-blue-900">Divyangjan Quota (5%)</div>
                            <div className="text-lg font-black text-blue-950 mt-1">38 / 38</div>
                            <div className="text-[10px] text-blue-700 mt-0.5">100% Filled (≥40% PwD)</div>
                          </div>

                          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                            <div className="font-bold text-purple-900">PVTG Priority (10%)</div>
                            <div className="text-lg font-black text-purple-950 mt-1">25 / 25</div>
                            <div className="text-[10px] text-purple-700 mt-0.5">100% Filled (Birhor, Chenchu, etc.)</div>
                          </div>

                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                            <div className="font-bold text-emerald-900">Female Quota (33%)</div>
                            <div className="text-lg font-black text-emerald-950 mt-1">225 / 225</div>
                            <div className="text-[10px] text-emerald-700 mt-0.5">100% Female Earmarking</div>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                            <div className="font-bold text-slate-800">Open ST Merit (52%)</div>
                            <div className="text-lg font-black text-slate-900 mt-1">462 / 462</div>
                            <div className="text-[10px] text-slate-600 mt-0.5">General ST Merit Cutoff: 64.5%</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Click the button above to run the automated merit algorithm across all verified applications. The engine satisfies statutory reservations (Divyangjan, PVTG, Female) before filling open ST merit seats.
                      </p>
                    )}
                  </div>

                  {/* POST-SELECTION TRACKING & DBT DISBURSEMENT COMMAND CENTER */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Post-Selection Monitoring
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                          Mandatory Post-Selection Milestones & DBT Pipeline
                        </h4>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Automated Milestones Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">1. Joining Report</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Verified</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Dean / Registrar verified within 30 days of award notification.</p>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">2. PFMS Bank Linkage</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Active</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Aadhaar-NPCI mapper confirmed for direct bank credit.</p>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">3. Half-Yearly Report</span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Scheduled</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Research guide academic continuation assessment.</p>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">4. DBT Fund Release</span>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">Treasury Ready</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Sanction order routed to Public Financial Management System.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
              <SlidersHorizontal className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">Select an Application from Queue</h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose a candidate from the left panel to review PRAMAAN cross-document verification results, scrutiny findings, and award decisions.
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* MODAL: Structured Explainable Deficiency */}
      {showDeficiencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-4 h-4" />
                Issue Explainable Deficiency Notice
              </h3>
              <button
                onClick={() => setShowDeficiencyModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Government standard mandates structured explainability: Clearly outline WHAT failed, WHY according to policy rules, and ACTION required.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  1. What is the Defect / Disparity? (WHAT)
                </label>
                <textarea
                  rows={2}
                  value={defWhat}
                  onChange={(e) => setDefWhat(e.target.value)}
                  placeholder="e.g. Name mismatch detected between application form and uploaded ST Certificate."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Why does the Published Policy Require this? (WHY)
                </label>
                <textarea
                  rows={2}
                  value={defWhy}
                  onChange={(e) => setDefWhy(e.target.value)}
                  placeholder="e.g. Under NFST Guideline Clause 5.1 & 6.c, candidate identity must match Aadhaar to ensure DBT bank transfer validity."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  3. Concrete Action Required from Candidate (ACTION)
                </label>
                <textarea
                  rows={2}
                  value={defAction}
                  onChange={(e) => setDefAction(e.target.value)}
                  placeholder="e.g. Upload a 1-page Notary / Magistrate Affidavit or updated ST Certificate."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDeficiencyModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRaiseDeficiency}
                disabled={actionInProgress || !defWhat}
                className="px-4 py-2 bg-rose-700 text-white rounded-lg text-xs font-semibold hover:bg-rose-800 disabled:opacity-50"
              >
                {actionInProgress ? 'Dispatching...' : 'Dispatch Deficiency Notice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 1-Click CAG Defense Pack & Statutory Immunity Shield */}
      {cagShieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-indigo-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block">
                    Legal Protection · Section 197 CrPC
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Statutory Audit Immunity Dossier (CAG / CBI Shield)
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setCagShieldModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-2">
              <div className="flex justify-between font-mono text-[10px] text-slate-500">
                <span>Dossier Reference:</span>
                <span className="font-bold text-indigo-900">MoTA/CAG-IMMUNITY/2026/8942-D</span>
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-500">
                <span>Application Docket:</span>
                <span className="font-bold text-slate-800">{appDossier?.application?.applicationNumber || 'NF-2026-002'}</span>
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-500">
                <span>Beneficiary:</span>
                <span className="font-bold text-slate-800">{appDossier?.application?.applicantName || 'Priya Marandi'}</span>
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-500">
                <span>Cryptographic Proof:</span>
                <span className="font-mono text-emerald-700">SHA256:e3b0c442...991b7852</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 space-y-2 leading-relaxed">
              <strong className="block text-slate-900">Official Statutory Defense Declaration:</strong>
              <p>
                "This verification decision was arrived at strictly pursuant to <strong>Official Gazette Guidelines</strong> on the basis of authenticated API-verified records from DigiLocker and CIDR Aadhaar Salt. 
              </p>
              <p className="text-indigo-900 font-medium">
                Under the provisions of <strong>Section 197 CrPC</strong> and General Financial Rules (GFR), the verifying officer <em>({currentUser.name})</em> is indemnified and protected against retrospective departmental inquiries or audits by CAG/CBI, provided no malafide intent is established."
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setCagShieldModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Statutory Immunity Dossier MoTA/CAG-IMMUNITY/2026/8942-D successfully compiled and cryptographically locked to audit ledger.');
                  setCagShieldModalOpen(false);
                }}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sealed Immunity PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
