import React, { useState, useEffect } from 'react';
import { 
  User, 
  api, 
  ScholarshipContinuityRecord, 
  ContinuityYearRecord, 
  ContinuityRequirement, 
  ContinuityRiskIssue,
  ContinuitySummary 
} from '../api';
import { 
  RefreshCw, 
  Shield, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Calendar, 
  GraduationCap, 
  Building2, 
  ChevronRight, 
  ChevronDown, 
  AlertCircle, 
  FileCheck2, 
  Send, 
  History, 
  Info, 
  Check, 
  X, 
  Lock, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';

interface Props {
  currentUser: User;
  onRefreshData?: () => void;
}

export const ScholarshipContinuityPortal: React.FC<Props> = ({ currentUser, onRefreshData }) => {
  const isOfficer = ['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Student state
  const [studentRecord, setStudentRecord] = useState<ScholarshipContinuityRecord | null>(null);
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(3);
  const [uploadingReqKey, setUploadingReqKey] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [submittingRenewal, setSubmittingRenewal] = useState(false);
  const [expandedPastYear, setExpandedPastYear] = useState<string | null>(null);

  // Officer state
  const [allRecords, setAllRecords] = useState<ScholarshipContinuityRecord[]>([]);
  const [continuitySummary, setContinuitySummary] = useState<ContinuitySummary | null>(null);
  const [selectedOfficerRecord, setSelectedOfficerRecord] = useState<ScholarshipContinuityRecord | null>(null);
  const [selectedOfficerYear, setSelectedOfficerYear] = useState<string>('2026-27');
  
  // Officer filters
  const [filterScheme, setFilterScheme] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Officer Action Modal (Deficiency / Approval)
  const [officerActionModal, setOfficerActionModal] = useState<'APPROVE' | 'DEFICIENCY' | null>(null);
  const [deficiencyReqKey, setDeficiencyReqKey] = useState<string>('');
  const [deficiencyWhat, setDeficiencyWhat] = useState<string>('');
  const [deficiencyWhy, setDeficiencyWhy] = useState<string>('');
  const [deficiencyAction, setDeficiencyAction] = useState<string>('');
  const [approvalRemarks, setApprovalRemarks] = useState<string>('All statutory academic & bonafide proofs verified.');
  const [processingOfficerAction, setProcessingOfficerAction] = useState(false);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isOfficer) {
        const res = await api.getAllContinuityRecords({
          schemeCode: filterScheme !== 'ALL' ? filterScheme : undefined,
          riskLevel: filterRisk !== 'ALL' ? filterRisk : undefined,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
          allInstitutes: true,
        });
        setAllRecords(res.records);
        setContinuitySummary(res.summary);
        if (res.records.length > 0 && !selectedOfficerRecord) {
          setSelectedOfficerRecord(res.records[0]);
        }
      } else {
        const record = await api.getContinuityRecord();
        setStudentRecord(record);
        if (record) {
          setSelectedYearIndex(record.currentYearIndex);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load scholarship continuity records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterScheme, filterRisk, filterStatus, currentUser.role]);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Student upload document
  const handleUploadDoc = async (reqKey: string, customFileName?: string) => {
    if (!studentRecord) return;
    const currentYear = studentRecord.years.find(y => y.academicYear === studentRecord.currentAcademicYear);
    if (!currentYear) return;

    if (currentYear.isHistoricalLocked) {
      alert('This academic year is a locked historical record and cannot be edited.');
      return;
    }

    setUploadingReqKey(reqKey);
    try {
      const fileName = customFileName || selectedFileName || `${reqKey}_signed_verified.pdf`;
      const res = await api.uploadContinuityDoc({
        recordId: studentRecord.id,
        academicYear: currentYear.academicYear,
        requirementKey: reqKey,
        fileName,
      });
      setStudentRecord(res.record);
      setSelectedFileName('');
      showNotification(`Document "${fileName}" uploaded successfully. Status updated to SUBMITTED.`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploadingReqKey(null);
    }
  };

  // Student submit final renewal package
  const handleSubmitRenewal = async () => {
    if (!studentRecord) return;
    const currentYear = studentRecord.years.find(y => y.academicYear === studentRecord.currentAcademicYear);
    if (!currentYear) return;

    if (currentYear.isHistoricalLocked) {
      alert('This academic year is a locked historical record.');
      return;
    }

    setSubmittingRenewal(true);
    try {
      const res = await api.submitContinuityRenewal({
        recordId: studentRecord.id,
        academicYear: currentYear.academicYear,
        remarks: 'Renewal package completed and submitted for institutional verification.',
      });
      setStudentRecord(res.record);
      showNotification(`Renewal dossier for ${currentYear.academicYear} submitted for officer verification.`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmittingRenewal(false);
    }
  };

  // Officer actions
  const handleOfficerDecision = async () => {
    if (!selectedOfficerRecord) return;
    setProcessingOfficerAction(true);
    try {
      if (officerActionModal === 'APPROVE') {
        const res = await api.officerVerifyContinuity({
          recordId: selectedOfficerRecord.id,
          academicYear: selectedOfficerYear,
          action: 'APPROVE_RENEWAL',
          officerRemarks: approvalRemarks,
        });
        setSelectedOfficerRecord(res.record);
        setAllRecords(prev => prev.map(r => r.id === res.record.id ? res.record : r));
        showNotification(`Scholarship renewal verified & approved for ${res.record.studentName} (${selectedOfficerYear}). Record forwarded to central disbursement pipeline.`);
      } else if (officerActionModal === 'DEFICIENCY') {
        const res = await api.officerVerifyContinuity({
          recordId: selectedOfficerRecord.id,
          academicYear: selectedOfficerYear,
          action: 'MARK_DEFICIENT',
          requirementKey: deficiencyReqKey,
          deficiencyTitle: 'Renewal Requirement Deficiency',
          what: deficiencyWhat,
          why: deficiencyWhy,
          actionRequired: deficiencyAction,
        });
        setSelectedOfficerRecord(res.record);
        setAllRecords(prev => prev.map(r => r.id === res.record.id ? res.record : r));
        showNotification(`Deficiency notice issued to ${res.record.studentName}. Status updated to DEFICIENT.`);
      }
      setOfficerActionModal(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setProcessingOfficerAction(false);
    }
  };

  // Filtered officer records
  const filteredRecords = allRecords.filter(r => {
    if (searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.studentEmail.toLowerCase().includes(q) ||
      r.institution.toLowerCase().includes(q) ||
      r.course.toLowerCase().includes(q) ||
      r.schemeCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* Top Header Banner - Standard Government Web Portal Style */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                Ministry of Tribal Affairs · Government of India
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-slate-300 bg-slate-800 border border-slate-700">
                Cycle: Academic Year 2026–27
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Scholarship Continuity & Multi-Year Renewal Desk</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Administrative tracking system to safeguard uninterrupted scholarship continuation across multiple academic years. Identifies missing documents, outdated certificates, and verification milestones before funding lapses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-1.5 bg-slate-800/80 p-3.5 rounded-lg border border-slate-700 shrink-0">
            <div className="text-left md:text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Academic Session</p>
              <p className="text-sm font-bold text-amber-400 font-mono">2026–27 Renewal Window</p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Role: {currentUser.role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {loading && !studentRecord && allRecords.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Loading Continuity Records...</p>
        </div>
      ) : isOfficer ? (
        /* ========================================================================= */
        /* OFFICER: CONTINUITY VERIFICATION QUEUE & CASE DOSSIER                     */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Summary Strip */}
          {continuitySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <p className="text-[11px] font-bold uppercase text-slate-400">Total Scholars</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{continuitySummary.totalScholars}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Multi-year records tracked</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <p className="text-[11px] font-bold uppercase text-emerald-700">On Track</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{continuitySummary.onTrackCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Zero continuity flags</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <p className="text-[11px] font-bold uppercase text-amber-700">Attention Needed</p>
                <p className="text-2xl font-black text-amber-700 mt-1">{continuitySummary.attentionNeededCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Action pending by student</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <p className="text-[11px] font-bold uppercase text-blue-700">Verification Queue</p>
                <p className="text-2xl font-black text-blue-700 mt-1">{continuitySummary.pendingVerificationCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Ready for officer sign-off</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <p className="text-[11px] font-bold uppercase text-slate-800">Renewal Approved</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{continuitySummary.renewalApprovedCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Forwarded to disbursement pipeline</p>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filters:</span>
              </div>

              <select
                value={filterScheme}
                onChange={(e) => setFilterScheme(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              >
                <option value="ALL">All Schemes</option>
                <option value="NFST">NFST</option>
                <option value="POST_MATRIC">Post-Matric ST</option>
              </select>

              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="DEFICIENT">Deficient</option>
                <option value="ACTIVE_RENEWAL">Renewal In-Progress</option>
                <option value="APPROVED_FOR_DISBURSEMENT">Approved</option>
              </select>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search scholar or institution..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Officer Continuity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Queue */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-slate-600" />
                  <span>Continuity Verification Queue</span>
                  <span className="px-1.5 py-0.2 rounded font-mono text-[11px] bg-slate-100 text-slate-700 font-bold">
                    {filteredRecords.length}
                  </span>
                </h2>
                <span className="text-[11px] text-slate-400">Prioritized by condition</span>
              </div>

              <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
                {filteredRecords.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    No continuity cases match selected criteria.
                  </div>
                ) : (
                  filteredRecords.map((rec) => {
                    const isSelected = selectedOfficerRecord?.id === rec.id;
                    const curYear = rec.years.find(y => y.academicYear === rec.currentAcademicYear);
                    const openIssues = curYear?.issues.filter(i => i.status === 'OPEN').length || 0;

                    return (
                      <div
                        key={rec.id}
                        onClick={() => setSelectedOfficerRecord(rec)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-slate-50 border-slate-900 shadow-xs ring-1 ring-slate-900'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{rec.studentName}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {rec.schemeCode}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">{rec.institution}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{rec.course}</p>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              rec.overallRiskLevel === 'HIGH'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : rec.overallRiskLevel === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {rec.overallRiskLevel} Risk
                          </span>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-mono">
                            AY {rec.currentAcademicYear} (Year {rec.currentYearIndex}/{rec.totalDurationYears})
                          </span>
                          <div className="flex items-center gap-2">
                            {openIssues > 0 && (
                              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                                {openIssues} flagged issue{openIssues > 1 ? 's' : ''}
                              </span>
                            )}
                            <span className="font-semibold text-slate-800">{curYear?.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Dossier Bench: Answering Officer Core Questions */}
            <div className="lg:col-span-7">
              {selectedOfficerRecord ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
                  {/* Dossier Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{selectedOfficerRecord.studentName}</h2>
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {selectedOfficerRecord.schemeCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {selectedOfficerRecord.institution} · {selectedOfficerRecord.course}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Initial Award: {selectedOfficerRecord.initialAwardYear} · Total Tenure: {selectedOfficerRecord.totalDurationYears} Years · Current: Year {selectedOfficerRecord.currentYearIndex}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setApprovalRemarks(`Verified and endorsed by ${currentUser.name}. Full continuation criteria confirmed.`);
                          setOfficerActionModal('APPROVE');
                        }}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Confirm Renewal Verification</span>
                      </button>

                      <button
                        onClick={() => {
                          const curYear = selectedOfficerRecord.years.find(y => y.academicYear === selectedOfficerRecord.currentAcademicYear);
                          const defReq = curYear?.requirements.find(r => r.status === 'DEFICIENT' || r.status === 'PENDING');
                          setDeficiencyReqKey(defReq?.key || 'progress_report');
                          setDeficiencyWhat('Uploaded document is incomplete or missing institutional supervisor sign-off.');
                          setDeficiencyWhy('Required under the configured scheme renewal rule to verify active academic standing.');
                          setDeficiencyAction('Re-upload signed and stamped document via Renewal Center.');
                          setOfficerActionModal('DEFICIENCY');
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>Issue Deficiency</span>
                      </button>
                    </div>
                  </div>

                  {/* Multi-Year Timeline: Demonstrating Locked History vs Current Renewal */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Tenure Progression History (Protected Historical Records)
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {selectedOfficerRecord.years.map((y) => {
                        const isSelectedYear = selectedOfficerYear === y.academicYear;
                        return (
                          <button
                            key={y.academicYear}
                            onClick={() => setSelectedOfficerYear(y.academicYear)}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              isSelectedYear
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase opacity-75">Year {y.yearIndex}</span>
                              {y.isHistoricalLocked && (
                                <span title="Locked Historical Record">
                                  <Lock className="w-3 h-3 text-slate-400" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold font-mono mt-0.5">{y.academicYear}</p>
                            <span
                              className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                y.status === 'COMPLETED_DISBURSED'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : y.status === 'APPROVED_FOR_DISBURSEMENT'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : y.status === 'DEFICIENT'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {y.status === 'COMPLETED_DISBURSED' ? 'DISBURSED' : y.status.replace('_', ' ')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Year Dossier View */}
                  {(() => {
                    const viewYear = selectedOfficerRecord.years.find(y => y.academicYear === selectedOfficerYear) || selectedOfficerRecord.years[0];
                    if (!viewYear) return null;

                    return (
                      <div className="space-y-4 pt-1">
                        {/* Audit Status Bar */}
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-semibold text-slate-500">Record Status:</span>
                            <span className="ml-1.5 font-bold text-slate-900">{viewYear.status.replace('_', ' ')}</span>
                            {viewYear.isHistoricalLocked && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                                <Lock className="w-3 h-3" />
                                Locked Historical Audit Record
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">Progress:</span>
                            <span className="font-mono font-bold text-slate-900">{viewYear.renewalProgressPercent}%</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">Deadline:</span>
                            <span className="font-mono font-bold text-slate-900">{viewYear.renewalDeadline}</span>
                          </div>
                        </div>

                        {/* What changed from last year? */}
                        {viewYear.changedFromLastYear && viewYear.changedFromLastYear.length > 0 && (
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                            <p className="font-bold text-slate-800">Changes Reported From Previous Academic Year:</p>
                            <div className="space-y-1">
                              {viewYear.changedFromLastYear.map((ch, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                                  <span>{ch.field}: <strong className="text-slate-700">{ch.previousValue}</strong> → <strong className="text-slate-900">{ch.currentValue}</strong></span>
                                  <span className="text-emerald-700 font-semibold font-mono text-[10px]">Document Attested</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Active Issues for this Year */}
                        {viewYear.issues.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Detected Continuity Conditions</span>
                            </p>
                            {viewYear.issues.map((issue) => (
                              <div
                                key={issue.id}
                                className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                                  issue.status === 'RESOLVED'
                                    ? 'bg-slate-50 border-slate-200 opacity-60'
                                    : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900">{issue.title}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800">
                                    {issue.severity} Severity
                                  </span>
                                </div>
                                <p className="text-slate-700"><strong>Condition:</strong> {issue.what}</p>
                                <p className="text-slate-600"><strong>Rule Justification:</strong> {issue.why}</p>
                                <p className="text-slate-800 font-semibold"><strong>Action Required:</strong> {issue.suggestedAction}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Requirements Dossier */}
                        <div className="space-y-2.5">
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Renewal Requirements Checklist ({viewYear.requirements.length})
                          </p>

                          {viewYear.requirements.length === 0 ? (
                            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
                              No requirement items configured for this cycle.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {viewYear.requirements.map((req) => (
                                <div
                                  key={req.id}
                                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900">{req.title}</span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                          req.status === 'VERIFIED'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : req.status === 'SUBMITTED'
                                            ? 'bg-blue-100 text-blue-800'
                                            : req.status === 'DEFICIENT'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {req.status}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{req.description}</p>
                                    {req.documentName && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-mono mt-1">
                                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{req.documentName}</span>
                                      </div>
                                    )}
                                  </div>

                                  {!viewYear.isHistoricalLocked && (
                                    <div className="flex items-center gap-2 shrink-0">
                                      {req.status !== 'VERIFIED' && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              const res = await api.officerVerifyContinuity({
                                                recordId: selectedOfficerRecord.id,
                                                academicYear: selectedOfficerYear,
                                                action: 'VERIFY_REQUIREMENT',
                                                requirementKey: req.key,
                                              });
                                              setSelectedOfficerRecord(res.record);
                                              showNotification(`Requirement "${req.title}" marked as VERIFIED.`);
                                            } catch (err: any) {
                                              alert(err.message || 'Verification error');
                                            }
                                          }}
                                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded text-xs font-semibold transition flex items-center gap-1"
                                        >
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Verify</span>
                                        </button>
                                      )}

                                      {req.status !== 'DEFICIENT' && (
                                        <button
                                          onClick={() => {
                                            setDeficiencyReqKey(req.key);
                                            setDeficiencyWhat(`Discrepancy identified in "${req.title}".`);
                                            setDeficiencyWhy('Required under the configured scheme renewal rule.');
                                            setDeficiencyAction(`Please re-upload a clear, verified copy of ${req.title}.`);
                                            setOfficerActionModal('DEFICIENCY');
                                          }}
                                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-red-700 border border-slate-300 rounded text-xs font-semibold transition flex items-center gap-1"
                                        >
                                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                          <span>Deficiency</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
                  Select a scholar from the queue to review continuity dossier.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* STUDENT: CONTINUITY STATUS, CORE QUESTIONS & RENEWAL CENTER               */
        /* ========================================================================= */
        studentRecord && (
          <div className="space-y-6">
            {/* Top Overview Card */}
            {(() => {
              const curYear = studentRecord.years.find(y => y.academicYear === studentRecord.currentAcademicYear);
              return (
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold font-mono text-xs border border-slate-200">
                          {studentRecord.schemeCode}
                        </span>
                        <h2 className="text-xl font-bold text-slate-900">
                          {studentRecord.schemeName}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {studentRecord.course} · {studentRecord.institution}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Award Year: {studentRecord.initialAwardYear} · Duration: {studentRecord.totalDurationYears} Academic Years
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-1.5 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          studentRecord.overallRiskLevel === 'HIGH'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : studentRecord.overallRiskLevel === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        Risk Level: {studentRecord.overallRiskLevel}
                      </span>
                      <span className="text-xs text-slate-500">
                        Status: <strong className="text-slate-900">{studentRecord.overallContinuityStatus.replace('_', ' ')}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Academic Year</p>
                      <p className="text-base font-bold text-slate-900 font-mono mt-0.5">{studentRecord.currentAcademicYear}</p>
                      <p className="text-[10px] text-slate-500">Year {studentRecord.currentYearIndex} of {studentRecord.totalDurationYears}</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Renewal Progress</p>
                      <p className="text-base font-bold text-slate-900 font-mono mt-0.5">{curYear?.renewalProgressPercent || 0}%</p>
                      <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
                        <div 
                          className="bg-slate-800 h-1 rounded-full transition-all duration-300" 
                          style={{ width: `${curYear?.renewalProgressPercent || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Renewal Deadline</p>
                      <p className="text-base font-bold text-slate-900 font-mono mt-0.5">{curYear?.renewalDeadline || 'N/A'}</p>
                      <p className="text-[10px] font-semibold text-slate-600">{curYear?.daysRemaining || 0} days remaining</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Disbursement Pipeline</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {curYear?.disbursementPipelineStatus === 'PENDING_PFMS_PROCESSING'
                          ? 'Queued for PFMS Processing'
                          : curYear?.status === 'APPROVED_FOR_DISBURSEMENT'
                          ? 'Renewal Approved'
                          : 'Pending Renewal Verification'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Student Core Questions Answer Desk */}
            {(() => {
              const curYear = studentRecord.years.find(y => y.academicYear === studentRecord.currentAcademicYear);
              const activeIssues = curYear?.issues.filter(i => i.status === 'OPEN') || [];
              const pendingRequirements = curYear?.requirements.filter(r => r.status === 'PENDING' || r.status === 'DEFICIENT') || [];

              return (
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-slate-600" />
                    <span>Continuity Inquiry & Guidance Desk</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Q1: Is my renewal due? */}
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">1. Is my scholarship renewal due?</p>
                      <p className="text-slate-600">
                        {curYear?.renewalOpeningStatus === 'OPEN' 
                          ? `Yes. The renewal window for Academic Year ${studentRecord.currentAcademicYear} is currently open until ${curYear.renewalDeadline} (${curYear.daysRemaining} days remaining).`
                          : `No. Current session renewal window is ${curYear?.renewalOpeningStatus}.`}
                      </p>
                    </div>

                    {/* Q2: What documents do I need? */}
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">2. What documents do I need to submit?</p>
                      <p className="text-slate-600">
                        {curYear?.requirements.map(r => r.title).join(', ') || 'No documents configured.'}
                      </p>
                    </div>

                    {/* Q3: What changed from last year? */}
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">3. What changed from last year?</p>
                      <p className="text-slate-600">
                        {curYear?.changedFromLastYear && curYear.changedFromLastYear.length > 0
                          ? curYear.changedFromLastYear.map(c => `${c.field} progressed to ${c.currentValue}`).join('; ')
                          : 'No structural institution or course changes reported. Progression into regular next academic semester.'}
                      </p>
                    </div>

                    {/* Q4 & Q5: Is anything putting my continuity at risk? Why? */}
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">4. Is anything putting my continuity at risk? Why?</p>
                      <p className="text-slate-600">
                        {activeIssues.length > 0
                          ? activeIssues.map(i => `${i.title}: ${i.what} (${i.why})`).join('; ')
                          : 'No active continuity risks detected. All submitted items conform to configured rules.'}
                      </p>
                    </div>

                    {/* Q6: What do I need to do? */}
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">5. What action do I need to take?</p>
                      <p className="text-slate-600 font-semibold">
                        {pendingRequirements.length > 0
                          ? `Complete upload of ${pendingRequirements.length} pending requirement(s): ${pendingRequirements.map(r => r.title).join(', ')}.`
                          : curYear?.status === 'PENDING_VERIFICATION'
                          ? 'Dossier successfully submitted. No further action needed while verification officer reviews.'
                          : 'All renewal requirements cleared.'}
                      </p>
                    </div>

                    {/* Q7: What is the current status? */}
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">6. What is the current continuation status?</p>
                      <p className="text-slate-600">
                        Academic Cycle {studentRecord.currentAcademicYear}: <strong className="text-slate-900">{curYear?.status.replace('_', ' ')}</strong> ({curYear?.institutionVerificationStatus === 'APPROVED' ? 'Institution Verified' : 'Awaiting Review'}).
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Multi-Year Tenure History with Locked Historical Separation */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-600" />
                    <span>Multi-Year Scholarship Record (Tenure History)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Year-by-year immutable record. Previous academic years are locked historical records and cannot be altered.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
                {studentRecord.years.map((y) => {
                  const isCurrent = y.academicYear === studentRecord.currentAcademicYear;

                  return (
                    <div
                      key={y.academicYear}
                      onClick={() => setExpandedPastYear(expandedPastYear === y.academicYear ? null : y.academicYear)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-xs'
                          : y.isHistoricalLocked
                          ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-50/40 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase font-mono text-slate-500">
                          Year {y.yearIndex}
                        </span>
                        {y.isHistoricalLocked ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-600 bg-slate-200 px-1 py-0.2 rounded font-bold">
                            <Lock className="w-2.5 h-2.5" />
                            LOCKED
                          </span>
                        ) : isCurrent ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-900 text-white">
                            CURRENT
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">UPCOMING</span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-slate-900 mt-2 font-mono">{y.academicYear}</p>
                      
                      {y.disbursedAmount && (
                        <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                          {y.disbursedAmount}
                        </p>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{y.isHistoricalLocked ? 'Audited Record' : isCurrent ? 'Active Cycle' : 'Future Stage'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedPastYear === y.academicYear ? 'rotate-180' : ''}`} />
                      </div>

                      {expandedPastYear === y.academicYear && (
                        <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] space-y-1 animate-in fade-in">
                          <p className="font-semibold text-slate-700">Audit Dossier:</p>
                          {y.requirements.length === 0 ? (
                            <p className="text-[10px] text-slate-400">Scheduled for future activation.</p>
                          ) : (
                            y.requirements.map(r => (
                              <div key={r.id} className="flex items-center justify-between text-[10px]">
                                <span className="truncate pr-1 text-slate-600">{r.title}</span>
                                <span className="font-bold text-slate-700 shrink-0">✓ {r.status}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unified Renewal Center for the Current Academic Year */}
            {(() => {
              const curYear = studentRecord.years.find(y => y.academicYear === studentRecord.currentAcademicYear);
              if (!curYear) return null;

              const totalCount = curYear.requirements.length;
              const completedCount = curYear.requirements.filter(r => r.status === 'VERIFIED' || r.status === 'SUBMITTED').length;
              const canSubmit = curYear.requirements.filter(r => r.mandatory && r.status === 'PENDING').length === 0;

              return (
                <div id="renewal-center-section" className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-5 h-5 text-slate-700" />
                        <h3 className="text-base font-bold text-slate-900">
                          Renewal Center (Academic Year {curYear.academicYear})
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                          Window: {curYear.renewalOpeningStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload configured renewal documents for Institute Nodal Officer verification.
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 text-xs">
                      <p className="text-slate-500">
                        Checklist: <strong className="text-slate-900 font-mono">{completedCount} of {totalCount}</strong> Ready
                      </p>
                      <p className="text-slate-700 font-semibold font-mono">
                        Submission Status: {curYear.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Requirements List */}
                  <div className="space-y-3">
                    {curYear.requirements.map((req) => {
                      const isUploading = uploadingReqKey === req.key;
                      const hasDefect = req.status === 'DEFICIENT';

                      return (
                        <div
                          key={req.id}
                          className={`p-4 rounded-lg border transition-all ${
                            hasDefect
                              ? 'bg-red-50/50 border-red-300'
                              : req.status === 'VERIFIED'
                              ? 'bg-slate-50/80 border-slate-200'
                              : 'bg-slate-50/40 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{req.title}</span>
                                <span
                                  className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase font-mono ${
                                    req.status === 'VERIFIED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : req.status === 'SUBMITTED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : req.status === 'DEFICIENT'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {req.status}
                                </span>
                                {req.mandatory && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                                    Mandatory
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600">{req.description}</p>

                              {req.documentName && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono mt-1">
                                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>{req.documentName}</span>
                                  {req.verifiedBy && (
                                    <span className="text-[10px] text-slate-500 font-sans">
                                      (Verified by {req.verifiedBy})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons for Document */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5 text-slate-600" />
                                <span>{req.status === 'PENDING' ? 'Upload Document' : 'Replace File'}</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleUploadDoc(req.key, file.name);
                                    }
                                  }}
                                />
                              </label>

                              <button
                                disabled={isUploading}
                                onClick={() => handleUploadDoc(req.key, `${req.key}_signed_attested.pdf`)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                              >
                                {isUploading ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3 text-slate-300" />
                                )}
                                <span>Upload Sample</span>
                              </button>
                            </div>
                          </div>

                          {/* Deficiency Callout */}
                          {req.deficiencyReason && req.status === 'DEFICIENT' && (
                            <div className="mt-3 p-3 bg-red-100/70 border border-red-300 rounded-lg text-xs space-y-1">
                              <p className="font-bold text-red-900">Deficiency Notice Issued by Verifier:</p>
                              <p className="text-red-950"><strong>Condition:</strong> {req.deficiencyReason.what}</p>
                              <p className="text-red-900"><strong>Rule Justification:</strong> {req.deficiencyReason.why}</p>
                              <p className="text-red-950 font-semibold"><strong>Action Required:</strong> {req.deficiencyReason.action}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">
                      Ensure all required proofs are attested before final submission for institutional verification.
                    </p>

                    <button
                      disabled={!canSubmit || submittingRenewal || curYear.status === 'APPROVED_FOR_DISBURSEMENT'}
                      onClick={handleSubmitRenewal}
                      className={`px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition flex items-center justify-center gap-2 ${
                        curYear.status === 'APPROVED_FOR_DISBURSEMENT'
                          ? 'bg-slate-800 text-white cursor-default'
                          : canSubmit
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {submittingRenewal ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting Renewal Dossier...</span>
                        </>
                      ) : curYear.status === 'APPROVED_FOR_DISBURSEMENT' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Renewal Verified & Approved</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Renewal Dossier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )
      )}

      {/* Officer Decision Modal */}
      {officerActionModal && selectedOfficerRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {officerActionModal === 'APPROVE' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Confirm Scholarship Renewal Verification</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Issue Structured Deficiency Notice</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setOfficerActionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-0.5">
              <p><strong>Scholar:</strong> {selectedOfficerRecord.studentName} ({selectedOfficerRecord.schemeCode})</p>
              <p className="font-mono"><strong>Academic Session:</strong> {selectedOfficerYear}</p>
            </div>

            {officerActionModal === 'APPROVE' ? (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Confirming this verification certifies that the student satisfies all configured continuation rules for Academic Year {selectedOfficerYear}. The record will be forwarded to the central disbursement pipeline.
                </p>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Verification Officer Remarks</label>
                  <textarea
                    rows={3}
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Provide exact, explainable parameters for the defect. The scholar will view these items in their Continuity Desk under DETECT → EXPLAIN → ACT.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Requirement</label>
                  <select
                    value={deficiencyReqKey}
                    onChange={(e) => setDeficiencyReqKey(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  >
                    <option value="progress_report">Academic Progress Report / Marksheet</option>
                    <option value="bonafide">Institutional Bonafide Certificate</option>
                    <option value="income_declaration">Income / ST Validity Declaration</option>
                    <option value="bank_status">Bank Account Active Seeding</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">1. What is defective?</label>
                  <input
                    type="text"
                    value={deficiencyWhat}
                    onChange={(e) => setDeficiencyWhat(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                    placeholder="e.g. Supervisor signature missing on Page 2."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">2. Why is it required?</label>
                  <input
                    type="text"
                    value={deficiencyWhy}
                    onChange={(e) => setDeficiencyWhy(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                    placeholder="e.g. Required under the configured scheme renewal rule."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">3. Action Required for Student</label>
                  <input
                    type="text"
                    value={deficiencyAction}
                    onChange={(e) => setDeficiencyAction(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                    placeholder="e.g. Re-upload document with guide signature and seal."
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                onClick={() => setOfficerActionModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>

              <button
                disabled={processingOfficerAction}
                onClick={handleOfficerDecision}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
              >
                {processingOfficerAction
                  ? 'Saving...'
                  : officerActionModal === 'APPROVE'
                  ? 'Confirm Verification'
                  : 'Issue Deficiency Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
