import React, { useState } from 'react';
import { 
  Globe, 
  Shield, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Plane, 
  RefreshCw, 
  FileText, 
  Scale, 
  Calculator, 
  Users, 
  Clock, 
  Award, 
  Search, 
  Hash, 
  Lock, 
  Check, 
  Info, 
  Landmark, 
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Download,
  AlertCircle
} from 'lucide-react';
import { User } from '../api';

interface PramaanGlobalBridgeProps {
  currentUser: User | null;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

// Mock QS Universities Database (Accredited vs Non-Accredited)
const QS_DATABASE = [
  { rank: 1, name: 'Massachusetts Institute of Technology (MIT)', country: 'USA', subjectRank: 1, accredited: true, eligible: true, note: '55% Marks waived as per Page 4 Note' },
  { rank: 2, name: 'University of Cambridge', country: 'UK', subjectRank: 2, accredited: true, eligible: true, note: '55% Marks waived as per Page 4 Note' },
  { rank: 3, name: 'University of Oxford', country: 'UK', subjectRank: 3, accredited: true, eligible: true, note: '55% Marks waived as per Page 4 Note' },
  { rank: 13, name: 'University of Melbourne', country: 'Australia', subjectRank: 18, accredited: true, eligible: true, note: '55% Marks waived as per Page 4 Note' },
  { rank: 82, name: 'University of Leeds', country: 'UK', subjectRank: 45, accredited: true, eligible: true, note: '55% Marks waived as per Page 4 Note' },
  { rank: 215, name: 'King’s College London (Health/Biotech)', country: 'UK', subjectRank: 32, accredited: true, eligible: true, note: '55% Marks waived as per Page 4 Note' },
  { rank: 450, name: 'University of South Australia', country: 'Australia', subjectRank: 310, accredited: true, eligible: true, note: '55% Marks waived as per Page 4 Note' },
  { rank: 650, name: 'University of Central Lancashire', country: 'UK', subjectRank: 580, accredited: true, eligible: true, note: 'Eligible (Rank ≤ 1000). 55% marks criteria applies' },
  { rank: 980, name: 'Wollongong Offshore Study Centre', country: 'Malaysia/UAE', subjectRank: 920, accredited: true, eligible: true, note: 'Eligible (Rank ≤ 1000). 55% marks criteria applies' },
  { rank: 1250, name: 'Global Tech Management College (Offshore)', country: 'UK/Private', subjectRank: 1100, accredited: false, eligible: false, note: 'BREACH: Rank > 1,000 threshold. Ineligible under Para 4.4(a)' }
];

// Historical NOS Recipients for Sibling Check (Para 2.2.ii)
const PAST_NOS_LEDGER = [
  { studentName: 'Vikram Tirkey', parentName: 'Somra Tirkey', motherName: 'Fulmani Tirkey', state: 'Jharkhand', awardYear: '2023-24', university: 'Univ of Sheffield' },
  { studentName: 'Priya Marandi', parentName: 'Hopna Marandi', motherName: 'Sita Marandi', state: 'Odisha', awardYear: '2022-23', university: 'Univ of Edinburgh' },
  { studentName: 'Karan Gond', parentName: 'Manglu Gond', motherName: 'Sukri Gond', state: 'Madhya Pradesh', awardYear: '2024-25', university: 'Univ of Bristol' }
];

export const PramaanGlobalBridge: React.FC<PramaanGlobalBridgeProps> = ({ currentUser, onNavigateTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'qs-shield' | 'quota-radar' | 'embassy-engine'>('pipeline');

  // Tab 1: Pipeline Simulator State
  const [selectedCase, setSelectedCase] = useState<'A' | 'B' | 'C'>('A');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simStep, setSimStep] = useState(0);

  // Tab 2: QS & Kinship Search States
  const [qsSearchTerm, setQsSearchTerm] = useState('');
  const [siblingCheckAadhaar, setSiblingCheckAadhaar] = useState('8492-3849-1029');
  const [siblingFatherName, setSiblingFatherName] = useState('Somra Tirkey');
  const [siblingMotherName, setSiblingMotherName] = useState('Fulmani Tirkey');
  const [siblingResult, setSiblingResult] = useState<{ checked: boolean; duplicateFound: boolean; matchedRecord?: any } | null>(null);

  // Tab 3: 3D Quota & Milestone States
  const [quotaScenario, setQuotaScenario] = useState<'STANDARD' | 'PVTG_SPILLOVER' | 'FEMALE_SPILLOVER'>('STANDARD');
  const [selectedScholarTrack, setSelectedScholarTrack] = useState<'pooja' | 'deepak' | 'rakesh'>('rakesh');
  const [seatReclaimed, setSeatReclaimed] = useState<boolean>(false);
  const [selectedSeatDetails, setSelectedSeatDetails] = useState<any | null>(null);

  // Tab 4: Embassy & Pro-Rata Calculator State
  const [fieldTripDays, setFieldTripDays] = useState<number>(90);
  const [selectedEmbassy, setSelectedEmbassy] = useState<'UK' | 'USA' | 'AUS'>('UK');
  const [disbursalSimulated, setDisbursalSimulated] = useState(false);

  // Run 5-Step Pipeline Simulation
  const handleRunSimulation = () => {
    setSimulationRunning(true);
    setSimStep(1);
    const timer1 = setTimeout(() => setSimStep(2), 700);
    const timer2 = setTimeout(() => setSimStep(3), 1400);
    const timer3 = setTimeout(() => setSimStep(4), 2100);
    const timer4 = setTimeout(() => {
      setSimStep(5);
      setSimulationRunning(false);
    }, 2800);
  };

  // Run Sibling Check
  const handleCheckSibling = () => {
    const match = PAST_NOS_LEDGER.find(
      r => r.parentName.toLowerCase() === siblingFatherName.trim().toLowerCase() ||
           r.motherName.toLowerCase() === siblingMotherName.trim().toLowerCase()
    );
    if (match) {
      setSiblingResult({ checked: true, duplicateFound: true, matchedRecord: match });
    } else {
      setSiblingResult({ checked: true, duplicateFound: false });
    }
  };

  const filteredUniversities = QS_DATABASE.filter(u => 
    u.name.toLowerCase().includes(qsSearchTerm.toLowerCase()) ||
    u.country.toLowerCase().includes(qsSearchTerm.toLowerCase())
  );

  // Pro-Rata Calculations
  const monthlyForeignRate = selectedEmbassy === 'UK' ? 825 : 1283; // £9,900 / 12 = £825 or $15,400 / 12 = $1,283
  const currencySymbol = selectedEmbassy === 'UK' ? '£' : '$';
  const exchangeRate = selectedEmbassy === 'UK' ? 106 : 84; // INR approximate
  const totalMonthsInIndia = (fieldTripDays / 30).toFixed(1);
  const foreignAllowanceSaved = Math.round(Number(totalMonthsInIndia) * monthlyForeignRate);
  const foreignSavingsINR = Math.round(foreignAllowanceSaved * exchangeRate);
  const indiaJrfPaidINR = Math.round(Number(totalMonthsInIndia) * 37000);
  const netGovtSavingsINR = foreignSavingsINR - indiaJrfPaidINR;

  return (
    <div className="space-y-6">
      
      {/* Clean Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Globe className="w-6 h-6 text-amber-400" />
              National Overseas Scholarship (NOS) Engine
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3.5 py-1.5 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sanctioned Slots</div>
              <div className="text-sm font-black text-amber-400">20 Awards / Yr</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3.5 py-1.5 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Turnaround SLA</div>
              <div className="text-sm font-black text-emerald-400">&lt; 72 Hours</div>
            </div>
          </div>
        </div>

        {/* 4 Feature Sub-Nav Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('pipeline')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'pipeline'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            1. 5-Step Pipeline
          </button>

          <button
            onClick={() => setActiveSubTab('qs-shield')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'qs-shield'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            2. QS & Kinship Shield
          </button>

          <button
            onClick={() => setActiveSubTab('quota-radar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'quota-radar'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            3. 3D Quota & Radar
          </button>

          <button
            onClick={() => setActiveSubTab('embassy-engine')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'embassy-engine'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            4. Indian Mission & Pro-Rata
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 5-STEP ZERO-FRAUD PIPELINE SIMULATOR */}
      {/* ========================================================================= */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  5-Step Application Scrutiny Simulator
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a candidate to simulate automated eligibility, 3D quota, and embassy disbursal.
                </p>
              </div>

              {/* Case Selectors */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                <button
                  onClick={() => { setSelectedCase('A'); setSimStep(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedCase === 'A' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pooja Munda (Oxford)
                </button>
                <button
                  onClick={() => { setSelectedCase('B'); setSimStep(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedCase === 'B' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Amit Tirkey (Sibling Breach)
                </button>
                <button
                  onClick={() => { setSelectedCase('C'); setSimStep(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedCase === 'C' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rahul Soren (Field Visit)
                </button>
              </div>
            </div>

            {/* Candidate Metadata Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">Candidate & Tribe</span>
                <span className="text-xs font-bold text-slate-900">
                  {selectedCase === 'A' && 'Pooja Munda (Birhor PVTG Tribe)'}
                  {selectedCase === 'B' && 'Amit Tirkey (Oraon ST Tribe)'}
                  {selectedCase === 'C' && 'Rahul Soren (Santhal ST Tribe)'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {selectedCase === 'A' && 'Jharkhand · Domicile Verified'}
                  {selectedCase === 'B' && 'Jharkhand · Sibling History Detected'}
                  {selectedCase === 'C' && 'Odisha · Active Scholar in UK'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">Foreign University & Rank</span>
                <span className="text-xs font-bold text-slate-900">
                  {selectedCase === 'A' && 'University of Oxford (QS #3)'}
                  {selectedCase === 'B' && 'Univ of Central Lancashire (QS #650)'}
                  {selectedCase === 'C' && 'University of Leeds (QS #82)'}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium block">
                  {selectedCase === 'A' && 'STEM Discipline · M.Sc. Environment'}
                  {selectedCase === 'B' && 'Management Discipline · MBA'}
                  {selectedCase === 'C' && 'STEM Discipline · Ph.D. Renewable Energy'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">Family Income & Marks</span>
                <span className="text-xs font-bold text-slate-900">
                  {selectedCase === 'A' && '₹4.20 Lakh / Yr · 78.4% Marks'}
                  {selectedCase === 'B' && '₹9.40 Lakh / Yr · 58.2% Marks'}
                  {selectedCase === 'C' && '₹3.80 Lakh / Yr · 82.0% Marks'}
                </span>
                <span className={`text-[10px] font-bold block ${selectedCase === 'B' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedCase === 'A' && 'Within ₹6L limit (Para 2.2.iii)'}
                  {selectedCase === 'B' && 'Exceeds ₹6L ceiling breach!'}
                  {selectedCase === 'C' && 'Within ₹6L limit (Para 2.2.iii)'}
                </span>
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={handleRunSimulation}
                  disabled={simulationRunning}
                  className="w-full md:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${simulationRunning ? 'animate-spin' : ''}`} />
                  {simulationRunning ? 'Executing 5-Step Pipeline...' : 'Run Automated Scrutiny Pipeline'}
                </button>
              </div>
            </div>

            {/* 5-Step Interactive Horizontal Flow */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              
              {/* Step 1 */}
              <div className={`p-4 rounded-xl border transition-all ${
                simStep >= 1 ? 'border-indigo-500 bg-indigo-50/40 shadow-xs' : 'border-slate-200 bg-white opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Step 1</span>
                  {simStep >= 1 && (
                    selectedCase === 'B' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900">Zero-Fraud Ingestion</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  DigiLocker + Aadhaar Kinship Hash Check (Para 2.2.ii).
                </p>
                {simStep >= 1 && (
                  <div className={`mt-2.5 p-2 rounded-lg text-[10px] font-medium ${
                    selectedCase === 'B' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedCase === 'B' ? '⚠️ Sibling Vikram Tirkey already availed NOS (2023). Flagged!' : '✅ Kinship Hash Clear: Unique family candidate affirmed.'}
                  </div>
                )}
              </div>

              {/* Step 2 */}
              <div className={`p-4 rounded-xl border transition-all ${
                simStep >= 2 ? 'border-indigo-500 bg-indigo-50/40 shadow-xs' : 'border-slate-200 bg-white opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Step 2</span>
                  {simStep >= 2 && (
                    selectedCase === 'B' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900">Real-Time QS Verify</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Accreditation check & Page 4 marks waiver evaluation.
                </p>
                {simStep >= 2 && (
                  <div className={`mt-2.5 p-2 rounded-lg text-[10px] font-medium ${
                    selectedCase === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedCase === 'B' ? '⚠️ QS #650. Min 55% marks mandatory. Income exceeds ₹6L.' : '✅ Oxford QS #3. 55% Marks waived as per Page 4 Note.'}
                  </div>
                )}
              </div>

              {/* Step 3 */}
              <div className={`p-4 rounded-xl border transition-all ${
                simStep >= 3 ? 'border-indigo-500 bg-indigo-50/40 shadow-xs' : 'border-slate-200 bg-white opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Step 3</span>
                  {simStep >= 3 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900">3D Quota Solver</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  20 slots: 03 PVTG + 30% Female + 4 subject caps.
                </p>
                {simStep >= 3 && (
                  <div className="mt-2.5 p-2 rounded-lg text-[10px] font-medium bg-emerald-100 text-emerald-800">
                    {selectedCase === 'A' ? '✅ Priority Quota: Birhor PVTG slot (1 of 3) assigned directly.' : '✅ Mathematical constraint solver allocated open slots.'}
                  </div>
                )}
              </div>

              {/* Step 4 */}
              <div className={`p-4 rounded-xl border transition-all ${
                simStep >= 4 ? 'border-indigo-500 bg-indigo-50/40 shadow-xs' : 'border-slate-200 bg-white opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Step 4</span>
                  {simStep >= 4 && (
                    selectedCase === 'B' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900">72-Hr Award & SLA</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Barcoded MoTA sponsorship letter for CAS/Visa.
                </p>
                {simStep >= 4 && (
                  <div className={`mt-2.5 p-2 rounded-lg text-[10px] font-medium ${
                    selectedCase === 'B' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedCase === 'B' ? '🚨 3W Notice Issued: 7-day cure window to appeal or re-file.' : '✅ Award Ref: MoTA/2026/NOS/0842 issued within 72 hrs.'}
                  </div>
                )}
              </div>

              {/* Step 5 */}
              <div className={`p-4 rounded-xl border transition-all ${
                simStep >= 5 ? 'border-indigo-500 bg-indigo-50/40 shadow-xs' : 'border-slate-200 bg-white opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Step 5</span>
                  {simStep >= 5 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900">Embassy & Pro-Rata</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Day-1 foreign disbursal & automated India visit pause.
                </p>
                {simStep >= 5 && (
                  <div className="mt-2.5 p-2 rounded-lg text-[10px] font-medium bg-emerald-100 text-emerald-800">
                    {selectedCase === 'C' ? '🔄 90-Day India Field Trip: Foreign allowance paused, JRF ₹37k paid.' : '✅ High Commission London: £9,900/yr mandate scheduled.'}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REAL-TIME QS & KINSHIP SHIELD */}
      {/* ========================================================================= */}
      {activeSubTab === 'qs-shield' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Module 1: Live QS Ranking Evaluator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  Real-Time QS Top 1,000 University & Course Verifier
                </h3>
                <p className="text-[11px] text-slate-500">
                  Validates Page 4 Note & Para 4.4(a) tie-breakers without human error.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-extrabold border border-indigo-200">
                Live QS API Sync
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search foreign university name or country..."
                value={qsSearchTerm}
                onChange={(e) => setQsSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredUniversities.map((univ, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl border text-xs flex flex-col gap-1 transition-all ${
                    univ.eligible ? 'border-slate-200 bg-slate-50/60 hover:border-indigo-300' : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      {univ.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      univ.rank <= 1000 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      QS Rank #{univ.rank}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{univ.country} · Subject Rank: #{univ.subjectRank}</span>
                    <span className={`font-semibold ${univ.eligible ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {univ.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Official Audit Defense (Para 4.4.a):</strong> System automatically binds the QS verified hash with the application dossier, granting statutory immunity to evaluating officers against CAG audit queries.
              </span>
            </div>
          </div>

          {/* Module 2: Aadhaar Kinship Hash Tree (One-Child Rule 2.2.ii) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Aadhaar Kinship Hash Tree (One-Child Rule 2.2.ii)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Prevents sibling duplicate scholarship fraud across multi-year MoTA batches.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-extrabold border border-emerald-200">
                Rule 2.2(ii) Enforced
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Applicant Aadhaar Vault Token</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={siblingCheckAadhaar}
                    onChange={(e) => setSiblingCheckAadhaar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200 shrink-0">
                    CIDR Salted
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Father's Full Name</label>
                  <input
                    type="text"
                    value={siblingFatherName}
                    onChange={(e) => setSiblingFatherName(e.target.value)}
                    placeholder="e.g. Somra Tirkey"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Mother's Full Name</label>
                  <input
                    type="text"
                    value={siblingMotherName}
                    onChange={(e) => setSiblingMotherName(e.target.value)}
                    placeholder="e.g. Fulmani Tirkey"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={handleCheckSibling}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                Generate Kinship Hash & Query Historical Registry
              </button>

              {siblingResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all ${
                  siblingResult.duplicateFound ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {siblingResult.duplicateFound ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Duplicate Benefit Detected: Prior Sibling Enrolment Found</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Kinship Verified: First Beneficiary in Family (Eligible)</span>
                      </>
                    )}
                  </div>
                  {siblingResult.duplicateFound && siblingResult.matchedRecord && (
                    <p className="text-[11px] leading-relaxed">
                      Sibling <strong>{siblingResult.matchedRecord.studentName}</strong> previously availed NOS in Academic Year <strong>{siblingResult.matchedRecord.awardYear}</strong> at <em>{siblingResult.matchedRecord.university}</em>. Self-certification failed; auto-generating Section 2.2(ii) notice.
                    </p>
                  )}
                  {!siblingResult.duplicateFound && (
                    <p className="text-[11px] text-emerald-700">
                      Parental lineage verified against past 10 years MoTA beneficiary archives. No prior sibling awards recorded.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <strong>Sample Test:</strong> Type father name <em>"Somra Tirkey"</em> to test sibling breach detection, or <em>"Ravi Munda"</em> to test verified clear status.
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 3D QUOTA & MILESTONE RADAR (SECTION-WISE WORKING IMPLEMENTATION) */}
      {/* ========================================================================= */}
      {activeSubTab === 'quota-radar' && (
        <div className="space-y-8">
          
          {/* ===================================================================== */}
          {/* SECTION A: 3D MULTI-CONSTRAINT QUOTA SOLVER */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            
            {/* Section A Header & Problem-Solution Explainer */}
            <div className="border-b border-slate-100 pb-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] rounded-full uppercase border border-indigo-200">
                      Dynamic Category Matrix · 3D Quota Allocation
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-full border border-amber-200">
                      Automated 3D Matrix
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-600" />
                    3D Multi-Constraint Quota Solver (20 Sanctioned Slots)
                  </h3>
                </div>

                {/* Scenario Controller */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
                  <button
                    onClick={() => setQuotaScenario('STANDARD')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      quotaScenario === 'STANDARD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Standard (All 20 Quotas Met)
                  </button>
                  <button
                    onClick={() => setQuotaScenario('PVTG_SPILLOVER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      quotaScenario === 'PVTG_SPILLOVER' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Simulate Missing Agri PVTG (Rule 2.1.iii)
                  </button>
                  <button
                    onClick={() => setQuotaScenario('FEMALE_SPILLOVER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      quotaScenario === 'FEMALE_SPILLOVER' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3. Simulate Missing Mgmt Female (Rule 2.1.iv)
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Academic Streams Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>STEM Disciplines</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-extrabold">10 Slots</span>
                </div>
                <div className="text-[11px] text-slate-500">Engineering, Tech, Pure/Applied Sciences, Math</div>
                <div className="text-[11px] font-semibold text-emerald-700 pt-1 border-t border-slate-200">
                  Allocated: 10/10 · 4 Female · 2 PVTG
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Mgmt, Econ, Law</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-extrabold">04 Slots</span>
                </div>
                <div className="text-[11px] text-slate-500">Management, Finance, Law, Public Policy</div>
                <div className="text-[11px] font-semibold text-emerald-700 pt-1 border-t border-slate-200">
                  {quotaScenario === 'FEMALE_SPILLOVER' 
                    ? '⚠️ 1 Female Spillover to Male (Rule 2.1.iv)'
                    : 'Allocated: 4/4 · 2 Female · 1 PVTG'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Agri & Medicine</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">04 Slots</span>
                </div>
                <div className="text-[11px] text-slate-500">Agriculture, Forestry, Biotechnology, Medicine</div>
                <div className="text-[11px] font-semibold text-emerald-700 pt-1 border-t border-slate-200">
                  {quotaScenario === 'PVTG_SPILLOVER' 
                    ? '⚠️ 1 PVTG Spillover to General ST (Rule 2.1.iii)'
                    : 'Allocated: 4/4 · 1 Female · 1 PVTG'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Humanities & Arts</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-extrabold">02 Slots</span>
                </div>
                <div className="text-[11px] text-slate-500">Anthropology, Sociology, Fine Arts</div>
                <div className="text-[11px] font-semibold text-emerald-700 pt-1 border-t border-slate-200">
                  Allocated: 2/2 · 1 Female · 0 PVTG
                </div>
              </div>
            </div>

            {/* Visual 20-Seat Matrix Grid */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Visual 20-Seat Allocation Matrix (AY 2026–27)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Click any seat to view candidate dossier</span>
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> ST General</span>
                  <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> PVTG (3 Slots)</span>
                  <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Female (30%)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                
                {/* 10 STEM Seats */}
                <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-indigo-700">
                    <span>Seat #1 · STEM</span>
                    <span className="bg-indigo-200 px-1 rounded">PVTG</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Pooja Munda ♀</div>
                  <div className="text-[10px] text-slate-500 truncate">Univ of Oxford (QS #3)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-blue-700">
                    <span>Seat #2 · STEM</span>
                    <span>ST Gen</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Birsa Murmu ♂</div>
                  <div className="text-[10px] text-slate-500 truncate">Univ of Cambridge (QS #2)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/40 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-pink-700">
                    <span>Seat #3 · STEM</span>
                    <span>Female</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Priya Marandi ♀</div>
                  <div className="text-[10px] text-slate-500 truncate">MIT USA (QS #1)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-blue-700">
                    <span>Seat #4 · STEM</span>
                    <span>ST Gen</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Sukram Hembram ♂</div>
                  <div className="text-[10px] text-slate-500 truncate">Univ of Leeds (QS #82)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/40 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-pink-700">
                    <span>Seat #5 · STEM</span>
                    <span>Female</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Suman Gond ♀</div>
                  <div className="text-[10px] text-slate-500 truncate">Univ of Melbourne (QS #13)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-blue-700">
                    <span>Seat #6 · STEM</span>
                    <span>ST Gen</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Amit Kumar ♂</div>
                  <div className="text-[10px] text-slate-500 truncate">Imperial College (QS #6)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-indigo-700">
                    <span>Seat #7 · STEM</span>
                    <span className="bg-indigo-200 px-1 rounded">PVTG</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Kiran Baiga ♀</div>
                  <div className="text-[10px] text-slate-500 truncate">Univ of Edinburgh (QS #22)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-blue-700">
                    <span>Seat #8 · STEM</span>
                    <span>ST Gen</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Mangal Kisku ♂</div>
                  <div className="text-[10px] text-slate-500 truncate">Univ of Manchester (QS #32)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-blue-700">
                    <span>Seat #9 · STEM</span>
                    <span>ST Gen</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Ramesh Purty ♂</div>
                  <div className="text-[10px] text-slate-500 truncate">King's College London (QS #40)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/40 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-pink-700">
                    <span>Seat #10 · STEM</span>
                    <span>Female</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Divya Naik ♀</div>
                  <div className="text-[10px] text-slate-500 truncate">UCL London (QS #9)</div>
                </div>

                {/* 4 Management, Econ, Law Seats */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-purple-700">
                    <span>Seat #11 · MGMT</span>
                    <span>ST Gen</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Rohit Tirkey ♂</div>
                  <div className="text-[10px] text-slate-500 truncate">LSE London (QS #45)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/40 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-pink-700">
                    <span>Seat #12 · MGMT</span>
                    <span>Female</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Sunita Hansda ♀</div>
                  <div className="text-[10px] text-slate-500 truncate">Univ of Warwick (QS #67)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-indigo-700">
                    <span>Seat #13 · MGMT</span>
                    <span className="bg-indigo-200 px-1 rounded">PVTG</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Anil Soren ♂</div>
                  <div className="text-[10px] text-slate-500 truncate">Univ of Sydney (QS #19)</div>
                </div>

                {/* Seat #14 (Mgmt Female Spillover target) */}
                <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 transition-all ${
                  quotaScenario === 'FEMALE_SPILLOVER'
                    ? 'border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-400'
                    : 'border-pink-200 bg-pink-50/40'
                }`}>
                  <div className="flex justify-between items-center text-[10px] font-extrabold">
                    <span className="text-purple-700">Seat #14 · MGMT</span>
                    <span className={quotaScenario === 'FEMALE_SPILLOVER' ? 'text-amber-800 bg-amber-200 px-1 rounded' : 'text-pink-700'}>
                      {quotaScenario === 'FEMALE_SPILLOVER' ? 'SPILLOVER' : 'Female'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">
                    {quotaScenario === 'FEMALE_SPILLOVER' ? 'Sandeep Purty ♂ (Merit ST)' : 'Kavita Jamatia ♀'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {quotaScenario === 'FEMALE_SPILLOVER' ? 'Reallocated via Rule 2.1.iv' : 'NUS Singapore (QS #8)'}
                  </div>
                </div>

                {/* 4 Agriculture & Medicine Seats */}
                <div className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/40 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-pink-700">
                    <span>Seat #15 · AGRI</span>
                    <span>Female</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Madhu Munda ♀</div>
                  <div className="text-[10px] text-slate-500 truncate">Wageningen Univ (QS #1 Agri)</div>
                </div>

                {/* Seat #16 (Agri PVTG Spillover target) */}
                <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 transition-all ${
                  quotaScenario === 'PVTG_SPILLOVER'
                    ? 'border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-400'
                    : 'border-indigo-200 bg-indigo-50/50'
                }`}>
                  <div className="flex justify-between items-center text-[10px] font-extrabold">
                    <span className="text-emerald-700">Seat #16 · AGRI</span>
                    <span className={quotaScenario === 'PVTG_SPILLOVER' ? 'text-amber-800 bg-amber-200 px-1 rounded' : 'text-indigo-700 bg-indigo-200 px-1 rounded'}>
                      {quotaScenario === 'PVTG_SPILLOVER' ? 'SPILLOVER' : 'PVTG'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">
                    {quotaScenario === 'PVTG_SPILLOVER' ? 'Rajesh Toppo ♂ (Merit ST)' : 'Budhram Birhor ♂'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {quotaScenario === 'PVTG_SPILLOVER' ? 'Reallocated via Rule 2.1.iii' : 'UC Davis USA (QS #2 Agri)'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/40 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-pink-700">
                    <span>Seat #17 · AGRI</span>
                    <span>Female</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Anjali Minz ♀</div>
                  <div className="text-[10px] text-slate-500 truncate">Cornell Univ (QS #16)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-emerald-700">
                    <span>Seat #18 · AGRI</span>
                    <span>ST Gen</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Vikas Baski ♂</div>
                  <div className="text-[10px] text-slate-500 truncate">Purdue Univ (QS #99)</div>
                </div>

                {/* 2 Humanities & Arts Seats */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-amber-700">
                    <span>Seat #19 · ARTS</span>
                    <span>ST Gen</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Somra Soy ♂</div>
                  <div className="text-[10px] text-slate-500 truncate">SOAS Univ of London (QS #91)</div>
                </div>

                <div className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/40 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-pink-700">
                    <span>Seat #20 · ARTS</span>
                    <span>Female</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">Renu Bhagat ♀</div>
                  <div className="text-[10px] text-slate-500 truncate">Columbia Univ (QS #23)</div>
                </div>

              </div>
            </div>

            {/* Official Statutory Audit Memo (Dynamic based on Scenario) */}
            <div className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all ${
              quotaScenario !== 'STANDARD' ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Official Statutory Allocation Audit Memo (MoTA Sanction File)
                </span>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  Ref: MoTA/2026/NOS/3D-ALLOC-{quotaScenario}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {quotaScenario === 'STANDARD' && (
                  <>All 20 seats mathematically satisfied: 03 PVTG slots (15%), 07 Female scholars (35% exceeding statutory 30% mandate), and 10 General ST candidates across all 4 specified subject streams. Zero carryover required.</>
                )}
                {quotaScenario === 'PVTG_SPILLOVER' && (
                  <><strong>PVTG Slot Optimization Executed:</strong> In Agriculture stream, zero eligible PVTG applications were received. As per scheme guidelines, the unutilized PVTG slot has legally spilled over to the next highest merit ST candidate <strong>Rajesh Toppo (Merit #1, 88.4%)</strong>. Audit log locked into cryptographic ledger.</>
                )}
                {quotaScenario === 'FEMALE_SPILLOVER' && (
                  <><strong>Female Quota Balance Optimization Executed:</strong> In Management discipline, female candidate quota remained short. As per scheme guidelines, the unutilized female slot has been opened for the highest eligible male candidate <strong>Sandeep Purty (Merit #1, 86.8%)</strong> while maintaining overall 30% female earmarking across total batch.</>
                )}
              </p>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* SECTION B: 2-YEAR MILESTONE RADAR (PREVENTING DEAD-SEAT LOCKING) */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            
            {/* Section B Header & Problem-Solution Explainer */}
            <div className="border-b border-slate-100 pb-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 font-extrabold text-[10px] rounded-full uppercase border border-amber-200">
                      Milestone SLA & Seat Retention Radar
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                      Zero Dead-Seat Loss
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    2-Year Milestone Radar (Automated Seat Retention & Re-allocation)
                  </h3>
                </div>

                {/* Scholar Tracker Selector */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
                  <button
                    onClick={() => { setSelectedScholarTrack('pooja'); setSeatReclaimed(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedScholarTrack === 'pooja' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Pooja Munda (On-Track · Safe)
                  </button>
                  <button
                    onClick={() => { setSelectedScholarTrack('deepak'); setSeatReclaimed(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedScholarTrack === 'deepak' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Deepak Minz (180-Day Warning)
                  </button>
                  <button
                    onClick={() => setSelectedScholarTrack('rakesh')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedScholarTrack === 'rakesh' ? 'bg-rose-600 text-white font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3. Rakesh Kerkatta (Silent Dropout / Reclaim)
                  </button>
                </div>
              </div>
            </div>

            {/* Active Scholar Radar Track Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Selected Scholar Dossier</span>
                  <h4 className="text-sm font-black text-slate-900">
                    {selectedScholarTrack === 'pooja' && 'Pooja Munda · Birhor PVTG · Univ of Oxford (UK)'}
                    {selectedScholarTrack === 'deepak' && 'Deepak Minz · Oraon ST · Univ of Bristol (UK)'}
                    {selectedScholarTrack === 'rakesh' && 'Rakesh Kerkatta · Kharia ST · Univ of Leeds (UK)'}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {selectedScholarTrack === 'pooja' && 'Award Sanction Ref: MoTA/2026/NOS/0842 · Provisional Award Date: 12 Jan 2026'}
                    {selectedScholarTrack === 'deepak' && 'Award Sanction Ref: MoTA/2026/NOS/0855 · Provisional Award Date: 15 Aug 2025'}
                    {selectedScholarTrack === 'rakesh' && 'Award Sanction Ref: MoTA/2026/NOS/0861 · Provisional Award Date: 10 Apr 2025'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedScholarTrack === 'pooja' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    selectedScholarTrack === 'deepak' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    seatReclaimed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {selectedScholarTrack === 'pooja' && 'SLA Status: 100% On-Track'}
                    {selectedScholarTrack === 'deepak' && 'SLA Status: 180 Days Dwell Warning'}
                    {selectedScholarTrack === 'rakesh' && (seatReclaimed ? 'Seat Successfully Reclaimed & Reallocated' : 'SLA Status: Critical 210-Day Deadlock')}
                  </span>
                </div>
              </div>

              {/* 4 Quarterly SLA Milestones Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                
                {/* Q1 */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800">Q1 (Month 0–6)</span>
                    <span className="text-emerald-600 flex items-center gap-1 font-extrabold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">Language & Aptitude (Para 4.4.c)</div>
                  <div className="text-[10px] text-slate-500">IELTS Score 7.5 Verified on DigiLocker</div>
                </div>

                {/* Q2 */}
                <div className={`p-3 bg-white rounded-xl border text-xs space-y-1 shadow-2xs ${
                  selectedScholarTrack === 'deepak' ? 'border-amber-400 bg-amber-50/30' :
                  selectedScholarTrack === 'rakesh' && !seatReclaimed ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800">Q2 (Month 6–12)</span>
                    {selectedScholarTrack === 'pooja' && (
                      <span className="text-emerald-600 flex items-center gap-1 font-extrabold"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>
                    )}
                    {selectedScholarTrack === 'deepak' && (
                      <span className="text-amber-600 font-extrabold animate-pulse">180d Inactive</span>
                    )}
                    {selectedScholarTrack === 'rakesh' && (
                      <span className="text-rose-600 font-extrabold">210d Overdue</span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">Unconditional Offer Conversion</div>
                  <div className="text-[10px] text-slate-500">
                    {selectedScholarTrack === 'pooja' && 'Oxford Unconditional Admission Letter Uploaded'}
                    {selectedScholarTrack === 'deepak' && 'Conditional Offer pending fee deposit. Nudge sent.'}
                    {selectedScholarTrack === 'rakesh' && 'Scholar unresponsive. UK Visa refused.'}
                  </div>
                </div>

                {/* Q3 */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800">Q3 (Month 12–18)</span>
                    {selectedScholarTrack === 'pooja' ? (
                      <span className="text-indigo-600 font-extrabold">Active (CAS)</span>
                    ) : (
                      <span className="text-slate-400 font-normal">Pending</span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">CAS Letter & Embassy Visa</div>
                  <div className="text-[10px] text-slate-500">
                    {selectedScholarTrack === 'pooja' ? 'MoTA sponsorship letter dispatched to Embassy' : 'Awaiting Q2 clearance'}
                  </div>
                </div>

                {/* Q4 */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800">Q4 (Month 18–24)</span>
                    <span className="text-slate-400 font-normal">Final Join</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">Foreign Enrollment & Air Ticket</div>
                  <div className="text-[10px] text-slate-500">Day-1 Disbursal upon university joining report</div>
                </div>

              </div>

              {/* Rakesh Kerkatta 1-Click Reclamation Action Box */}
              {selectedScholarTrack === 'rakesh' && (
                <div className="mt-5 p-4 rounded-xl border border-rose-300 bg-rose-50/70 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Para 4.4(d) Dead-Seat Detected: Scholar Inactive &gt; 210 Days
                      </span>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        Manual system me ye seat agle 1.5 saal tak block rehti. JVS Milestone Radar can reclaim this ₹50 Lakh slot right now and grant it to Waitlist #1 candidate!
                      </p>
                    </div>

                    <button
                      onClick={() => setSeatReclaimed(true)}
                      disabled={seatReclaimed}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shrink-0 shadow-md shadow-rose-600/20 disabled:opacity-60 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {seatReclaimed ? 'Seat Successfully Reallocated' : 'Execute 1-Click Proactive Seat Reclamation'}
                    </button>
                  </div>

                  {/* Reallocation Certificate Preview */}
                  {seatReclaimed && (
                    <div className="p-4 bg-white rounded-xl border border-emerald-300 text-xs space-y-2 animate-fade-in shadow-xs">
                      <div className="flex items-center justify-between font-extrabold text-emerald-900 border-b border-emerald-100 pb-2">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Official MoTA Sanction Re-Allocation Order Generated!
                        </span>
                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          Order Ref: MoTA/2026/NOS/REALLOC-0194
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-500">Revoked Deadlock Seat:</span>
                          <div className="font-bold text-slate-800">Rakesh Kerkatta (Unresponsive &gt; 210d)</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Promoted Waitlisted Scholar:</span>
                          <div className="font-bold text-emerald-700">Anita Oraon (Ph.D. Biotech, Edinburgh · 89.2% Marks)</div>
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-800 italic pt-1 border-t border-slate-100">
                        Sanction dispatched automatically to Indian High Commission London. Zero seats wasted. 100% CAG audit proof saved to immutable SHA-256 block ledger.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INDIAN MISSION & PRO-RATA ENGINE */}
      {/* ========================================================================= */}
      {activeSubTab === 'embassy-engine' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Module 1: Indian Embassy / Mission Node (Para 5.0) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-indigo-600" />
                  Indian Embassy / Mission Node (Para 5.0)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Direct mission linkage for Day-1 foreign currency maintenance release.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-extrabold border border-indigo-200">
                Mission Node Active
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Foreign Mission Node</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setSelectedEmbassy('UK'); setDisbursalSimulated(false); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      selectedEmbassy === 'UK' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🇬🇧 London, UK (£9,900)
                  </button>
                  <button
                    onClick={() => { setSelectedEmbassy('USA'); setDisbursalSimulated(false); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      selectedEmbassy === 'USA' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🇺🇸 Washington, US ($15,400)
                  </button>
                  <button
                    onClick={() => { setSelectedEmbassy('AUS'); setDisbursalSimulated(false); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      selectedEmbassy === 'AUS' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🇦🇺 Canberra, AUS ($15,400)
                  </button>
                </div>
              </div>

              {/* Scholar Overseas Active Dossier */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Pooja Munda (MoTA/2026/NOS/0842)</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Landing Verified
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  University of Oxford · M.Sc. Environmental Science · Foreign Bank Account Linked
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                  <div>Annual Allowance: <strong>{currencySymbol}{selectedEmbassy === 'UK' ? '9,900' : '15,400'}</strong></div>
                  <div>Contingency Grant: <strong>{currencySymbol}{selectedEmbassy === 'UK' ? '1,116' : '1,532'}</strong></div>
                </div>
              </div>

              <button
                onClick={() => setDisbursalSimulated(true)}
                disabled={disbursalSimulated}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
              >
                <Landmark className="w-4 h-4" />
                {disbursalSimulated ? 'Day-1 Maintenance Transferred to Student Account' : 'Execute Mission Day-1 Disbursal Protocol'}
              </button>

              {disbursalSimulated && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Diplomatic Mission Sanction Dispatched!
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    High Commission nodal officer authorized foreign stipend remittance. Zero headquarters delay; scholar received first installment on landing.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Module 2: Field Trip / India Visit Pro-Rata Reconciler (Note 1.b & Note 4) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  India Field Visit Pro-Rata Reconciler (Note 1.b)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Automated foreign allowance pause + JRF switch preventing CAG recovery queries.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-extrabold border border-amber-200">
                CAG Audit Shield
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700">
                    Duration of Scholar's Stay in India (Field Research / Visit)
                  </label>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {fieldTripDays} Days ({totalMonthsInIndia} Months)
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={fieldTripDays}
                  onChange={(e) => setFieldTripDays(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>15 Days</span>
                  <span>90 Days (Field Study)</span>
                  <span>180 Days (Max)</span>
                </div>
              </div>

              {/* Dynamic Calculation Breakdown */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Foreign Allowance Paused ({totalMonthsInIndia} mo × {currencySymbol}{monthlyForeignRate}):</span>
                  <span className="font-bold text-rose-700">-{currencySymbol}{foreignAllowanceSaved.toLocaleString()} (~₹{foreignSavingsINR.toLocaleString()})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>India JRF Stipend Paid ({totalMonthsInIndia} mo × ₹37,000):</span>
                  <span className="font-bold text-emerald-700">+₹{indiaJrfPaidINR.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
                  <span>Net Treasury Funds Protected:</span>
                  <span className="text-emerald-600">₹{netGovtSavingsINR.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 space-y-1">
                <span className="font-bold block">Statutory Audit & Verification Memo:</span>
                <p className="text-[10px] text-indigo-800 leading-relaxed">
                  System creates an automated pro-rata adjustment ledger. When the scholar returns abroad and uploads the re-joining boarding pass, foreign rates resume instantly with zero manual overpayment recovery disputes.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Cross-Link Back to Admin or Officer Portal */}
      <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Need to adjust scheme rules or test other fellowship programs? Jump to the <strong>Visual Rules Builder</strong> or <strong>Scheme Execution Engine</strong>.
          </span>
        </div>
        {onNavigateTab && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('admin')}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              Open Admin Portal
            </button>
            <button
              onClick={() => onNavigateTab('officer')}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
            >
              Open Officer Portal
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
