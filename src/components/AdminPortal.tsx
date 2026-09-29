import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Upload, 
  History, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Eye, 
  Send, 
  RefreshCw,
  GitBranch,
  FileCheck2,
  Sliders,
  ChevronRight,
  Terminal,
  Cpu
} from 'lucide-react';
import { 
  User, 
  Scheme, 
  PolicyVersion, 
  AuditBlock, 
  api 
} from '../api';
import { SchemeExecutionEngine } from './SchemeExecutionEngine';
import { VisualSchemeConfigurator } from './VisualSchemeConfigurator';

interface AdminPortalProps {
  currentUser: User;
  onRefreshData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser, onRefreshData }) => {
  const [activeSubTab, setActiveSubTab] = useState<'showcase' | 'configurator' | 'compiler' | 'versions' | 'audit'>('showcase');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [policies, setPolicies] = useState<PolicyVersion[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditBlock[]>([]);
  const [auditIntegrity, setAuditIntegrity] = useState<{
    isValid: boolean;
    totalBlocks: number;
    brokenBlockIndex: number | null;
    details: string;
  } | null>(null);

  // Policy Compiler Form State
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [versionNumber, setVersionNumber] = useState('2026-27');
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [guidelinePresetKey, setGuidelinePresetKey] = useState('NFST_2026');
  const [rawGuidelineText, setRawGuidelineText] = useState('');
  const [preloadedGuidelines, setPreloadedGuidelines] = useState<Record<string, any>>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedConfig, setExtractedConfig] = useState<any | null>(null);
  const [extractionMessage, setExtractionMessage] = useState<string | null>(null);
  const [compilerNotes, setCompilerNotes] = useState('Extracted via AI-assisted compiler for NFST 2026-27');
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Active Policy Detail for Review
  const [viewingPolicy, setViewingPolicy] = useState<PolicyVersion | null>(null);
  const [transitionRemarks, setTransitionRemarks] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Loading
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [schemesData, policiesData, guidelinesData, auditData, integrityData] = await Promise.all([
        api.getSchemes(),
        api.getPolicies(),
        api.getPreloadedGuidelines(),
        api.getAuditLogs({ limit: 50 }),
        api.verifyAuditChain(),
      ]);

      setSchemes(schemesData);
      setPolicies(policiesData);
      setPreloadedGuidelines(guidelinesData);
      setAuditLogs(auditData.items);
      setAuditIntegrity(integrityData);

      if (schemesData.length > 0 && !selectedSchemeId) {
        setSelectedSchemeId(schemesData[0].id);
      }
      if (policiesData.length > 0 && !viewingPolicy) {
        setViewingPolicy(policiesData[0]);
      }
      if (guidelinesData['NFST_2026']) {
        setRawGuidelineText(guidelinesData['NFST_2026'].content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser]);

  // Handle Preset Change
  const handlePresetSelect = (key: string) => {
    setGuidelinePresetKey(key);
    if (preloadedGuidelines[key]) {
      setRawGuidelineText(preloadedGuidelines[key].content);
      const matchedScheme = schemes.find((s) => s.code === preloadedGuidelines[key].schemeCode);
      if (matchedScheme) setSelectedSchemeId(matchedScheme.id);
      setAcademicYear(preloadedGuidelines[key].academicYear);
    }
  };

  // Run AI-Assisted Policy Extraction
  const handleExtractPolicy = async () => {
    if (!rawGuidelineText) return;
    setIsExtracting(true);
    setExtractionMessage(null);
    try {
      const selectedScheme = schemes.find((s) => s.id === selectedSchemeId);
      const res = await api.extractPolicyWithAI({
        schemeCode: selectedScheme?.code || 'NFST',
        academicYear,
        rawGuidelineText,
        guidelinePresetKey,
      });

      setExtractedConfig(res.extractedConfig);
      setExtractionMessage(res.message);
    } catch (err: any) {
      alert(`AI Extraction error: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Save Extracted Config as Draft Policy Version
  const handleSavePolicyDraft = async () => {
    if (!selectedSchemeId || !versionNumber || !extractedConfig) {
      alert('Scheme, Version Number, and Extracted Config are required.');
      return;
    }
    setSavingPolicy(true);
    try {
      const created = await api.createPolicyVersion({
        schemeId: selectedSchemeId,
        versionNumber,
        academicYear,
        config: extractedConfig,
        notes: compilerNotes,
      });

      alert(`Draft Policy Version ${created.versionNumber} saved successfully.`);
      await fetchAdminData();
      setViewingPolicy(created);
      setActiveSubTab('versions');
      onRefreshData();
    } catch (err: any) {
      alert(`Failed to save policy: ${err.message}`);
    } finally {
      setSavingPolicy(false);
    }
  };

  // State Transition (DRAFT -> UNDER_REVIEW -> APPROVED -> PUBLISHED -> RETIRED)
  const handlePolicyTransition = async (targetStatus: string) => {
    if (!viewingPolicy) return;
    setTransitioning(true);
    try {
      const res = await api.transitionPolicyState(viewingPolicy.id, targetStatus, transitionRemarks || `State updated to ${targetStatus}`);
      setViewingPolicy(res.policy);
      setTransitionRemarks('');
      await fetchAdminData();
      onRefreshData();
      alert(`Policy version status changed to ${targetStatus}`);
    } catch (err: any) {
      alert(`Transition rejected: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  // Run Cryptographic Hash Chain Audit
  const handleRunAuditVerification = async () => {
    try {
      const res = await api.verifyAuditChain();
      setAuditIntegrity(res);
      alert(res.details);
    } catch (err: any) {
      alert(`Audit verification failed: ${err.message}`);
    }
  };

  // Simulate Tampering Attack Test
  const handleSimulateTamper = async () => {
    try {
      const res = await api.simulateTamper();
      setAuditIntegrity(res.verificationResult);
      await fetchAdminData();
      alert(
        `Tamper Test Executed!\n\nResult: The hash chain immediately flagged: ${res.verificationResult.details}`
      );
    } catch (err: any) {
      alert(`Tamper simulation failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-purple-700 font-bold">
                MoTA Central Policy & Workflow Intelligence
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">Universal Configuration Engine</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Policy-to-Workflow Compiler & Governance
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Core Principle: <span className="font-semibold text-slate-800">"NEW SCHEME ≠ NEW PORTAL; NEW SCHEME = NEW CONFIGURATION"</span>
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-lg border border-slate-200 gap-1">
            <button
              onClick={() => setActiveSubTab('showcase')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'showcase' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Multi-Scheme Execution Engine
            </button>
            <button
              onClick={() => setActiveSubTab('configurator')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeSubTab === 'configurator' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Visual Rules Builder
            </button>
            <button
              onClick={() => setActiveSubTab('compiler')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeSubTab === 'compiler' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. AI Policy Compiler
            </button>
            <button
              onClick={() => setActiveSubTab('versions')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeSubTab === 'versions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Version Governance ({policies.length})
            </button>
            <button
              onClick={() => setActiveSubTab('audit')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeSubTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Tamper-Evident Audit
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 0: MULTI-SCHEME EXECUTION ENGINE (NFST & NOS DUAL-VALIDATION) */}
      {activeSubTab === 'showcase' && (
        <SchemeExecutionEngine 
          currentUser={currentUser} 
          onRefreshData={fetchAdminData}
        />
      )}

      {/* SUBTAB 0.5: VISUAL NO-CODE SCHEME CONFIGURATOR */}
      {activeSubTab === 'configurator' && (
        <VisualSchemeConfigurator
          currentUser={currentUser}
          onRefreshData={fetchAdminData}
        />
      )}

      {/* SUBTAB 1: POLICY-TO-WORKFLOW COMPILER */}
      {activeSubTab === 'compiler' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Ingestion & Trigger (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-purple-600" />
                Step 1: Guideline Document Ingestion
              </h2>

              {/* Preloaded Official Guidelines Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Load Official MoTA Scheme Guideline
                </label>
                <select
                  value={guidelinePresetKey}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="NFST_2026">NFST — National Fellowship for ST (M.Phil / Ph.D)</option>
                  <option value="NOS_2026">NOS — National Overseas Scholarship (Top 1000 QS)</option>
                  <option value="PRE_MATRIC_2026">Pre-Matric Scholarship (Classes IX & X)</option>
                  <option value="POST_MATRIC_2026">Post-Matric Scholarship (Centrally Sponsored)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Official guideline texts pre-loaded from Government of India regulations
                </span>
              </div>

              {/* Target Scheme & Academic Year */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Scheme</label>
                  <select
                    value={selectedSchemeId}
                    onChange={(e) => setSelectedSchemeId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {schemes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name.slice(0, 20)}...
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">
                  Version Identifier
                </label>
                <input
                  type="text"
                  value={versionNumber}
                  onChange={(e) => setVersionNumber(e.target.value)}
                  placeholder="e.g. 2026-27"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Raw Guideline Text Area */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">
                  Raw Policy / Regulation Text
                </label>
                <textarea
                  rows={9}
                  value={rawGuidelineText}
                  onChange={(e) => setRawGuidelineText(e.target.value)}
                  placeholder="Paste government circular, regulation, or gazette text..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px] leading-relaxed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Length: {rawGuidelineText.length} characters
                </span>
              </div>

              {/* AI Extraction Trigger */}
              <div className="pt-2">
                <button
                  onClick={handleExtractPolicy}
                  disabled={isExtracting || !rawGuidelineText}
                  className="w-full py-2.5 px-4 bg-purple-700 text-white rounded-lg text-xs font-bold hover:bg-purple-800 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {isExtracting ? 'AI Compiling Policy...' : 'Run AI-Assisted Policy Extraction'}
                </button>
              </div>

              {/* Important AI Governance Note */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800 block mb-0.5">Human-in-the-Loop AI Mandate:</span>
                AI extracts and structures candidate rules. It can <span className="font-semibold text-rose-700">NEVER</span> autonomously publish policy. Authorized officers must validate and approve before version activation.
              </div>
            </div>
          </div>

          {/* Right Column: Structured Extracted Rules Editor & Validator (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Step 2: Structured Policy Rules Reviewer & Schema
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Machine-executable configuration that drives the Dynamic Application & Verification Engines
                  </p>
                </div>

                {extractedConfig && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Extracted & Validated
                  </span>
                )}
              </div>

              {extractionMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  {extractionMessage}
                </div>
              )}

              {extractedConfig ? (
                <div className="space-y-5">
                  {/* Eligibility Rules */}
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                    <span className="font-bold text-slate-900 text-xs block mb-2">
                      1. Eligibility Rules ({extractedConfig.eligibilityRules?.length || 0})
                    </span>
                    <div className="space-y-2">
                      {extractedConfig.eligibilityRules?.map((r: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{r.title}</span>
                            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                              {r.type} {r.threshold !== undefined ? `(${r.threshold})` : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{r.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Application Fields */}
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                    <span className="font-bold text-slate-900 text-xs block mb-2">
                      2. Dynamic Form Fields ({extractedConfig.applicationFields?.length || 0})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {extractedConfig.applicationFields?.map((f: any, idx: number) => (
                        <div key={idx} className="p-2 bg-white border border-slate-200 rounded text-[11px]">
                          <span className="font-semibold text-slate-900 block truncate">{f.label}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {f.section} · {f.type} {f.required ? '(Req)' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Documents */}
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                    <span className="font-bold text-slate-900 text-xs block mb-2">
                      3. Required Documents & Cryptographic Constraints ({extractedConfig.documentRequirements?.length || 0})
                    </span>
                    <div className="space-y-1.5">
                      {extractedConfig.documentRequirements?.map((d: any, idx: number) => (
                        <div key={idx} className="p-2 bg-white border border-slate-200 rounded text-xs flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{d.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            PDF/JPEG · max {d.maxSizeMB || 5}MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verification Cross-Check Rules */}
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                    <span className="font-bold text-slate-900 text-xs block mb-2">
                      4. PRAMAAN Verification Rules & Defect Actions ({extractedConfig.verificationRules?.length || 0})
                    </span>
                    <div className="space-y-2">
                      {extractedConfig.verificationRules?.map((v: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{v.key}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-blue-50 text-blue-700">
                              {v.path}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">
                            <span className="font-semibold text-slate-800">Deficiency Action: </span>
                            {v.recommendedDeficiencyAction}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Draft Action */}
                  <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                    <button
                      onClick={handleSavePolicyDraft}
                      disabled={savingPolicy}
                      className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {savingPolicy ? 'Saving Version...' : 'Save as DRAFT Policy Version'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  Select a scheme guideline on the left and click "Run AI-Assisted Policy Extraction" to compile into structured rules.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: VERSION GOVERNANCE & IMMUTABLE LIFECYCLE */}
      {activeSubTab === 'versions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Policy Versions List (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                All Scheme Policy Versions ({policies.length})
              </h2>

              <div className="space-y-2">
                {policies.map((p) => {
                  const isSelected = viewingPolicy?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setViewingPolicy(p)}
                      className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/40 shadow-xs ring-1 ring-purple-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{p.schemeCode}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : p.status === 'UNDER_REVIEW'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-800">
                        Academic Year: {p.academicYear || '2026-27'}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        Created by {p.createdBy}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Policy Detail & Transition Governance (8 Cols) */}
          <div className="lg:col-span-8">
            {viewingPolicy ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {viewingPolicy.schemeCode} — Academic Year {viewingPolicy.academicYear || '2026-27'}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
                        {viewingPolicy.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Academic Year: <span className="font-semibold text-slate-800">{viewingPolicy.academicYear}</span> · Effective Date: <span className="font-semibold text-slate-800">{viewingPolicy.effectiveDate}</span>
                    </p>
                  </div>

                  {viewingPolicy.status === 'PUBLISHED' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="font-semibold">Immutable Published State</span>
                    </div>
                  )}
                </div>

                {/* Governance Lifecycle Transition Bar */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    Human-in-the-Loop Lifecycle State Machine:
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {viewingPolicy.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePolicyTransition('UNDER_REVIEW')}
                        disabled={transitioning}
                        className="px-3.5 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Submit for Committee Review
                      </button>
                    )}

                    {viewingPolicy.status === 'UNDER_REVIEW' && (
                      <>
                        <button
                          onClick={() => handlePolicyTransition('APPROVED')}
                          disabled={transitioning}
                          className="px-3.5 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Approve Policy Version
                        </button>
                        <button
                          onClick={() => handlePolicyTransition('DRAFT')}
                          disabled={transitioning}
                          className="px-3.5 py-1.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Send Back to Draft
                        </button>
                      </>
                    )}

                    {viewingPolicy.status === 'APPROVED' && (
                      <button
                        onClick={() => handlePolicyTransition('PUBLISHED')}
                        disabled={transitioning}
                        className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Publish Policy (Activate Dynamic Engine)
                      </button>
                    )}

                    {viewingPolicy.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handlePolicyTransition('RETIRED')}
                        disabled={transitioning}
                        className="px-3.5 py-1.5 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Retire Policy Version
                      </button>
                    )}
                  </div>
                </div>

                {/* Inspect Policy Rules */}
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Configured Rule Matrix
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingPolicy.config.eligibilityRules.map((rule) => (
                      <div key={rule.key} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-800">{rule.title}</span>
                        <p className="text-slate-600 text-[11px] mt-0.5">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-xl">
                Select a policy version from the left panel.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: TAMPER-EVIDENT SHA-256 AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    Cryptographic SHA-256 Tamper-Evident Audit Trail
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every state transition, document upload, verification, and award decision forms an immutable hash-linked chain.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunAuditVerification}
                  className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Run Integrity Verification
                </button>

                <button
                  onClick={handleSimulateTamper}
                  title="Simulates tampering on block 1 to prove algorithm catches modifications"
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Simulate Tamper Attack Test
                </button>
              </div>
            </div>

            {/* Integrity Status Card */}
            {auditIntegrity && (
              <div
                className={`mt-4 p-3.5 rounded-lg border text-xs flex items-center justify-between ${
                  auditIntegrity.isValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                }`}
              >
                <div className="flex items-center gap-2">
                  {auditIntegrity.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{auditIntegrity.details}</span>
                </div>
                <span className="font-mono text-[11px]">
                  Total Blocks: {auditIntegrity.totalBlocks}
                </span>
              </div>
            )}
          </div>

          {/* Audit Chain Chronological Stream */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
              Audit Hash Chain Ledger ({auditLogs.length} Blocks)
            </h3>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
                        BLOCK #{log.eventIndex}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{log.action}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        {log.entityType}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()} · Actor: {log.actorRole}
                    </span>
                  </div>

                  {/* Hash pointers */}
                  <div className="space-y-1 text-[11px] bg-white p-2.5 rounded border border-slate-200">
                    <div className="text-slate-500 truncate">
                      <span className="text-slate-400 font-bold">Prev Hash: </span>
                      {log.previousHash}
                    </div>
                    <div className="text-indigo-800 font-bold truncate">
                      <span className="text-slate-400 font-normal">Block Hash: </span>
                      {log.currentHash}
                    </div>
                  </div>

                  {log.payload && Object.keys(log.payload).length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-600 truncate font-sans">
                      <span className="font-bold text-slate-700">Payload: </span>
                      {JSON.stringify(log.payload)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
