import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  Scale, 
  GraduationCap, 
  Globe, 
  Award,
  Check,
  Clock,
  SlidersHorizontal,
  Sliders
} from 'lucide-react';
import { User } from '../api';

interface SchemeExecutionEngineProps {
  currentUser: User;
  onRefreshData?: () => void;
  onSwitchTab?: (tab: string) => void;
}

export const SchemeExecutionEngine: React.FC<SchemeExecutionEngineProps> = ({ 
  currentUser, 
  onRefreshData,
  onSwitchTab 
}) => {
  const [simulationState, setSimulationState] = useState<'IDLE' | 'RUNNING' | 'COMPLETED'>('IDLE');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCase, setSelectedCase] = useState<'NFST_DEFICIENT' | 'NFST_VALID' | 'NOS_DEFICIENT' | 'NOS_VALID' | null>('NFST_DEFICIENT');

  const handleRunSimulation = () => {
    setSimulationState('RUNNING');
    setCurrentStep(1);

    setTimeout(() => {
      setCurrentStep(2);
    }, 800);

    setTimeout(() => {
      setCurrentStep(3);
    }, 1600);

    setTimeout(() => {
      setCurrentStep(4);
      setSimulationState('COMPLETED');
      if (onRefreshData) onRefreshData();
    }, 2400);
  };

  const handleReset = () => {
    setSimulationState('IDLE');
    setCurrentStep(0);
    setSelectedCase('NFST_DEFICIENT');
  };

  return (
    <div className="space-y-6">
      {/* CLEAN LIGHT EXECUTIVE HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              Unified Scheme Governance
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Multi-Scheme Execution Engine (NFST & NOS Dual-Validation)
            </h2>
            <p className="text-xs text-slate-500">
              Simultaneous execution of distinct policy rules on a single administrative platform (AY 2026–27).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {simulationState !== 'RUNNING' ? (
              <button
                onClick={handleRunSimulation}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {simulationState === 'COMPLETED' ? 'Re-Run Scrutiny Engine' : 'Run Live Policy Engine'}
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-2 animate-pulse">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Executing PRAMAAN Dual-Path Verification...
              </div>
            )}

            {simulationState === 'COMPLETED' && (
              <button
                onClick={handleReset}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5"
                title="Reset simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 4-Step Stepper (Clean Light Styling) */}
        {simulationState !== 'IDLE' && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className={`p-2.5 rounded-xl border transition ${currentStep >= 1 ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                Scheme Config Loaded
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">NFST & NOS Policies</span>
            </div>

            <div className={`p-2.5 rounded-xl border transition ${currentStep >= 2 ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                Dual-Path Matching
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">Rules + Registry Graph</span>
            </div>

            <div className={`p-2.5 rounded-xl border transition ${currentStep >= 3 ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">3</span>
                Auto-Triage & 3W Notice
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">Pass vs 7-Day Cure</span>
            </div>

            <div className={`p-2.5 rounded-xl border transition ${currentStep >= 4 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">4</span>
                Ledger Hash Sealed
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">SHA-256 Audit Trail</span>
            </div>
          </div>
        )}
      </div>

      {/* 2-SCHEME PARALLEL WORKFLOW DEMONSTRATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SCHEME 1: NFST */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Scheme 1 · NFST
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                    National Fellowship for ST Students (M.Phil / Ph.D.)
                  </h3>
                </div>
              </div>
            </div>

            {/* Active Rule Badges */}
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                Age: <strong>&lt; 36 Yrs</strong>
              </span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                PG Cutoff: <strong>≥ 55%</strong>
              </span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                Income: <strong>≤ ₹6,00,000/yr</strong>
              </span>
              <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 rounded text-purple-800 font-semibold">
                Quota: 10% PVTG | 5% PwD
              </span>
            </div>
          </div>

          {/* Test Cases */}
          <div className="p-4 space-y-3 flex-1">
            {/* Case 1A: Deficient */}
            <div 
              onClick={() => setSelectedCase('NFST_DEFICIENT')}
              className={`p-3.5 rounded-xl border-2 transition cursor-pointer ${
                selectedCase === 'NFST_DEFICIENT'
                  ? 'border-rose-400 bg-rose-50/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Ramesh Oraon</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border">
                      NFST-2026-0041
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className="text-rose-700 font-bold bg-rose-100 px-1.5 py-0.2 rounded">Marks: 52% (Fail)</span>
                    <span className="text-rose-700 font-bold bg-rose-100 px-1.5 py-0.2 rounded">Bonafide Missing</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {simulationState === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      3W DEFICIENCY NOTICE
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Ready for Scrutiny</span>
                  )}
                </div>
              </div>

              {simulationState === 'COMPLETED' && (
                <div className="mt-2.5 pt-2 border-t border-rose-200 text-[11px] text-slate-700 space-y-0.5">
                  <p><strong className="text-rose-900">WHAT:</strong> Marks below 55% cutoff & Bonafide letter missing.</p>
                  <p><strong className="text-indigo-900">ACTION:</strong> 7-day cure window granted to upload CGPA conversion & Bonafide.</p>
                </div>
              )}
            </div>

            {/* Case 1B: Valid */}
            <div 
              onClick={() => setSelectedCase('NFST_VALID')}
              className={`p-3.5 rounded-xl border-2 transition cursor-pointer ${
                selectedCase === 'NFST_VALID'
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Sunita Marandi</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border">
                      NFST-2026-0042
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">Marks: 74.2%</span>
                    <span className="text-purple-700 font-bold bg-purple-100 px-1.5 py-0.2 rounded">PVTG (Birhor)</span>
                    <span className="text-indigo-700 font-medium bg-indigo-50 px-1.5 py-0.2 rounded">UGC-NET JRF</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {simulationState === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      <Check className="w-3 h-3" />
                      AUTO-CLEARED FOR MERIT
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Ready for Scrutiny</span>
                  )}
                </div>
              </div>

              {simulationState === 'COMPLETED' && (
                <div className="mt-2.5 pt-2 border-t border-emerald-200 text-[11px] text-slate-700 space-y-0.5">
                  <p><strong className="text-emerald-900">PRAMAAN:</strong> 100% Registry Match (Score: 92/100).</p>
                  <p><strong className="text-purple-900">QUOTA:</strong> Auto-allocated to PVTG 10% statutory priority bucket.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SCHEME 2: NOS */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Scheme 2 · NOS
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                    National Overseas Scholarship (Global Master / Ph.D.)
                  </h3>
                </div>
              </div>
            </div>

            {/* Active Rule Badges */}
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                Univ Ranking: <strong>QS Rank ≤ 500</strong>
              </span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                Income: <strong>≤ ₹8,00,000/yr</strong>
              </span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                Offer: <strong>Unconditional</strong>
              </span>
              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-800 font-semibold">
                Slots: 20 Global Awards
              </span>
            </div>
          </div>

          {/* Test Cases */}
          <div className="p-4 space-y-3 flex-1">
            {/* Case 2A: Deficient */}
            <div 
              onClick={() => setSelectedCase('NOS_DEFICIENT')}
              className={`p-3.5 rounded-xl border-2 transition cursor-pointer ${
                selectedCase === 'NOS_DEFICIENT'
                  ? 'border-rose-400 bg-rose-50/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Amit Tirkey</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border">
                      NOS-2026-0043
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className="text-rose-700 font-bold bg-rose-100 px-1.5 py-0.2 rounded">QS Rank: #650 (Cutoff: ≤500)</span>
                    <span className="text-rose-700 font-bold bg-rose-100 px-1.5 py-0.2 rounded">Income: ₹9.4L (Max: ₹8L)</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {simulationState === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      AUTO-FLAGGED DEFICIENT
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Ready for Scrutiny</span>
                  )}
                </div>
              </div>

              {simulationState === 'COMPLETED' && (
                <div className="mt-2.5 pt-2 border-t border-rose-200 text-[11px] text-slate-700 space-y-0.5">
                  <p><strong className="text-rose-900">WHAT:</strong> QS Rank #650 is ineligible; Income exceeds ₹8L ceiling.</p>
                  <p><strong className="text-indigo-900">ACTION:</strong> 7-day cure window to submit valid QS Top 500 offer.</p>
                </div>
              )}
            </div>

            {/* Case 2B: Valid */}
            <div 
              onClick={() => setSelectedCase('NOS_VALID')}
              className={`p-3.5 rounded-xl border-2 transition cursor-pointer ${
                selectedCase === 'NOS_VALID'
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Pooja Munda</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border">
                      NOS-2026-0044
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">Oxford (QS #3)</span>
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">Income: ₹4.2L</span>
                    <span className="text-blue-700 font-medium bg-blue-100 px-1.5 py-0.2 rounded">Female Quota</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {simulationState === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      <Award className="w-3 h-3" />
                      CLEARED FOR SELECTION
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Ready for Scrutiny</span>
                  )}
                </div>
              </div>

              {simulationState === 'COMPLETED' && (
                <div className="mt-2.5 pt-2 border-t border-emerald-200 text-[11px] text-slate-700 space-y-0.5">
                  <p><strong className="text-emerald-900">PRAMAAN:</strong> Foreign credential verified with 98% confidence score.</p>
                  <p><strong className="text-indigo-900">AWARD:</strong> 100% Tuition Fee + £9,900/yr Living Allowance via Indian Embassy.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* INSPECTION DRAWER FOR SELECTED CASE */}
      {selectedCase && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              Automated Rule Telemetry: {selectedCase.replace('_', ' ')}
            </span>
            <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 border">
              PRAMAAN Dual-Path Engine
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 block text-[11px]">Path A: Rule Thresholds</span>
              <p className="text-slate-600 mt-1 text-[11px]">
                {selectedCase === 'NFST_DEFICIENT' && '❌ 52% marks failed 55% cutoff. Bonafide missing.'}
                {selectedCase === 'NFST_VALID' && '✅ 74.2% marks exceed cutoff. ST status verified.'}
                {selectedCase === 'NOS_DEFICIENT' && '❌ QS #650 exceeds Top 500 limit. Income ₹9.4L exceeds ceiling.'}
                {selectedCase === 'NOS_VALID' && '✅ Oxford University QS #3. Unconditional offer validated.'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 block text-[11px]">Path B: Registry Graph</span>
              <p className="text-slate-600 mt-1 text-[11px]">
                {selectedCase === 'NFST_DEFICIENT' && '⚠️ Demographic check passed. Bank NPCI seeding pending.'}
                {selectedCase === 'NFST_VALID' && '✅ Canara Bank DBT active. University UGC 2(f)/12(B) verified.'}
                {selectedCase === 'NOS_DEFICIENT' && '⚠️ University accredited in UK, but fails MoTA Top 500 criteria.'}
                {selectedCase === 'NOS_VALID' && '✅ Indian Embassy (London) liaison pre-cleared for direct release.'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 block text-[11px]">Action Result</span>
              <p className="text-slate-600 mt-1 text-[11px]">
                {selectedCase === 'NFST_DEFICIENT' && '🚨 3W Deficiency Notice dispatched. Queue slot reserved for 7 days.'}
                {selectedCase === 'NFST_VALID' && '🎯 Advanced to Scrutiny Committee under 10% PVTG quota.'}
                {selectedCase === 'NOS_DEFICIENT' && '🚨 3W Notice dispatched. 7-day cure window to provide Top 500 offer.'}
                {selectedCase === 'NOS_VALID' && '🎯 Selection Order generated. Embassy fund release scheduled.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
