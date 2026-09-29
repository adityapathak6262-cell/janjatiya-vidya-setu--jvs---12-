import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  FileText, 
  Shield, 
  Scale, 
  Sparkles, 
  HelpCircle,
  Building2,
  GraduationCap,
  Globe
} from 'lucide-react';
import { User, Scheme, PolicyVersion, api } from '../api';

interface VisualSchemeConfiguratorProps {
  currentUser: User;
  onRefreshData?: () => void;
}

export const VisualSchemeConfigurator: React.FC<VisualSchemeConfiguratorProps> = ({ 
  currentUser, 
  onRefreshData 
}) => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedSchemeCode, setSelectedSchemeCode] = useState<string>('NFST');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State for Visual Rules
  const [incomeCeiling, setIncomeCeiling] = useState<number>(800000);
  const [minMarks, setMinMarks] = useState<number>(55);
  const [testRequirement, setTestRequirement] = useState<string>('UGC_NET');
  const [qsRankLimit, setQsRankLimit] = useState<number>(500);
  const [quotaDivyangjan, setQuotaDivyangjan] = useState<number>(5);
  const [quotaPVTG, setQuotaPVTG] = useState<number>(10);
  const [quotaFemale, setQuotaFemale] = useState<number>(33);
  
  // Document checklists
  const [reqCaste, setReqCaste] = useState<boolean>(true);
  const [reqIncome, setReqIncome] = useState<boolean>(true);
  const [reqBonafide, setReqBonafide] = useState<boolean>(true);
  const [reqMarksheet, setReqMarksheet] = useState<boolean>(true);
  const [reqOfferLetter, setReqOfferLetter] = useState<boolean>(false);
  const [reqBankMandate, setReqBankMandate] = useState<boolean>(true);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const data = await api.getSchemes();
      setSchemes(data);
      if (data.length > 0) {
        loadSchemePreset(data[0].code);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchemePreset = (code: string) => {
    setSelectedSchemeCode(code);
    setSaveSuccess(false);

    if (code === 'NFST') {
      setIncomeCeiling(0); // No income ceiling for NFST fellowship
      setMinMarks(55);
      setTestRequirement('UGC_NET');
      setQsRankLimit(0);
      setReqCaste(true);
      setReqIncome(false);
      setReqBonafide(true);
      setReqMarksheet(true);
      setReqOfferLetter(false);
      setReqBankMandate(true);
      setQuotaDivyangjan(5);
      setQuotaPVTG(10);
      setQuotaFemale(33);
    } else if (code === 'NOS') {
      setIncomeCeiling(800000); // Max 8L for overseas
      setMinMarks(55);
      setTestRequirement('NONE');
      setQsRankLimit(500); // QS Top 500
      setReqCaste(true);
      setReqIncome(true);
      setReqBonafide(false);
      setReqMarksheet(true);
      setReqOfferLetter(true);
      setReqBankMandate(true);
      setQuotaDivyangjan(5);
      setQuotaPVTG(5);
      setQuotaFemale(33);
    } else if (code === 'TOP_CLASS') {
      setIncomeCeiling(600000); // 6L for top class
      setMinMarks(60);
      setTestRequirement('ENTRANCE_TEST');
      setQsRankLimit(0);
      setReqCaste(true);
      setReqIncome(true);
      setReqBonafide(true);
      setReqMarksheet(true);
      setReqOfferLetter(true);
      setReqBankMandate(true);
      setQuotaDivyangjan(5);
      setQuotaPVTG(10);
      setQuotaFemale(30);
    } else if (code === 'POST_MATRIC') {
      setIncomeCeiling(250000); // 2.5L
      setMinMarks(50);
      setTestRequirement('NONE');
      setQsRankLimit(0);
      setReqCaste(true);
      setReqIncome(true);
      setReqBonafide(true);
      setReqMarksheet(true);
      setReqOfferLetter(false);
      setReqBankMandate(true);
      setQuotaDivyangjan(5);
      setQuotaPVTG(5);
      setQuotaFemale(30);
    }
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      // Find matching scheme
      const matched = schemes.find((s) => s.code === selectedSchemeCode);
      if (!matched) return;

      // Construct visual policy config
      const docRequirements = [];
      if (reqCaste) docRequirements.push({ key: 'caste_certificate', title: 'ST Caste Certificate', required: true, allowedMime: ['application/pdf', 'image/jpeg'], maxSizeMB: 5, description: 'Competent Revenue Authority certificate' });
      if (reqIncome) docRequirements.push({ key: 'income_certificate', title: 'Family Income Certificate', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: `Annual family income must not exceed ${incomeCeiling > 0 ? '₹' + incomeCeiling.toLocaleString('en-IN') : 'No Limit'}` });
      if (reqBonafide) docRequirements.push({ key: 'bonafide_certificate', title: 'Institutional Bonafide Certificate', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'Current academic year enrollment certificate' });
      if (reqMarksheet) docRequirements.push({ key: 'qualifying_marksheet', title: 'Qualifying Degree Marksheet', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: `Aggregate marks must be >= ${minMarks}%` });
      if (reqOfferLetter) docRequirements.push({ key: 'admission_offer_letter', title: 'Admission Offer Letter', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: qsRankLimit > 0 ? `Must be ranked in QS Top ${qsRankLimit}` : 'Official letter of admission' });
      if (reqBankMandate) docRequirements.push({ key: 'bank_passbook', title: 'Aadhaar-Seeded Bank Mandate', required: true, allowedMime: ['application/pdf'], maxSizeMB: 5, description: 'NPCI mapped bank account for Direct Benefit Transfer' });

      const eligibilityRules = [
        { key: 'category_st', title: 'Scheduled Tribe Community', type: 'BOOLEAN', threshold: true, description: 'Applicant must belong to recognized ST community', mandatory: true },
        { key: 'min_marks', title: `Minimum Qualifying Marks (>= ${minMarks}%)`, type: 'NUMBER_MIN', threshold: minMarks, description: `Mandatory aggregate cutoff of ${minMarks}%`, mandatory: true }
      ];

      if (incomeCeiling > 0) {
        eligibilityRules.push({
          key: 'income_ceiling',
          title: `Annual Family Income (<= ₹${incomeCeiling.toLocaleString('en-IN')})`,
          type: 'NUMBER_MAX',
          threshold: incomeCeiling,
          description: `Total income from all sources must not exceed ₹${incomeCeiling.toLocaleString('en-IN')}`,
          mandatory: true
        });
      }

      if (qsRankLimit > 0) {
        eligibilityRules.push({
          key: 'qs_rank_limit',
          title: `QS World University Ranking (<= #${qsRankLimit})`,
          type: 'NUMBER_MAX',
          threshold: qsRankLimit,
          description: `Host university must be ranked within Top ${qsRankLimit} globally`,
          mandatory: true
        });
      }

      // Create new policy version via API
      await api.createPolicyVersion({
        schemeId: matched.id,
        versionNumber: '2026-27 (Visual Config)',
        academicYear: '2026-27',
        config: {
          eligibilityRules,
          applicationFields: [],
          documentRequirements: docRequirements,
          verificationRules: [
            { key: 'name_check', path: 'caste', targetField: 'applicantName', targetDocument: 'caste_certificate', ruleLogic: 'LEVENSHTEIN_SIMILARITY_0.85', failureMessage: 'Name mismatch with ST record', recommendedDeficiencyAction: 'Upload Gazette affidavit' }
          ],
          workflowStages: [
            { code: 'INSTITUTE', name: 'Institute Nodal Officer Verification', responsibleRole: 'INSTITUTION_VERIFIER', slaDays: 5 },
            { code: 'MOTA', name: 'Ministry Scrutiny Committee', responsibleRole: 'MOTA_OFFICER', slaDays: 7 }
          ],
          selectionCriteria: [
            { key: 'divyangjan', title: 'Divyangjan Disability Quota', priorityWeight: quotaDivyangjan, ruleDescription: `Dedicated ${quotaDivyangjan}% reservation for PwD ST candidates` },
            { key: 'pvtg', title: 'Particularly Vulnerable Tribal Group Priority', priorityWeight: quotaPVTG, ruleDescription: `Dedicated ${quotaPVTG}% allocation for PVTG candidates` },
            { key: 'female', title: 'Female Earmarking', priorityWeight: quotaFemale, ruleDescription: `Earmarked ${quotaFemale}% seats for ST women scholars` }
          ],
          postSelectionMilestones: [
            { key: 'joining', title: 'University Joining Report', timelineDays: 30, mandatory: true, submissionType: 'DOCUMENT' },
            { key: 'pfms', title: 'PFMS Bank Mandate Validation', timelineDays: 15, mandatory: true, submissionType: 'CREDENTIAL_CHECK' }
          ]
        },
        notes: `Visually configured by ${currentUser.name} (${currentUser.role}) via No-Code Rules Studio.`
      });

      setSaveSuccess(true);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      alert(`Save failed: ${err.message || 'Error updating configuration'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-amber-700 font-bold">
              Administrative Rules Engine
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">No-Code Policy Studio</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Visual Scheme Rule & Quota Configurator
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure eligibility thresholds, document requirements, and statutory reservation quotas visually without writing JSON or code.
          </p>
        </div>

        {/* Scheme Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {['NFST', 'NOS', 'TOP_CLASS', 'POST_MATRIC'].map((code) => (
            <button
              key={code}
              onClick={() => loadSchemePreset(code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedSchemeCode === code
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Configuration Successfully Published & Deployed!</strong> The active verification engine, document checkers, and application forms for <strong>{selectedSchemeCode}</strong> have been updated in real-time.
            </span>
          </div>
          <button 
            onClick={() => setSaveSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: 3 Visual Configuration Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Eligibility Thresholds */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Eligibility Thresholds</h3>
              <p className="text-[11px] text-slate-500">Auto-evaluated during PRAMAAN Path A</p>
            </div>
          </div>

          {/* Income Ceiling */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700">Annual Family Income Ceiling</label>
              <span className="font-bold font-mono text-slate-900">
                {incomeCeiling === 0 ? 'No Income Limit' : `₹${incomeCeiling.toLocaleString('en-IN')}`}
              </span>
            </div>
            <input 
              type="range"
              min={0}
              max={1200000}
              step={50000}
              value={incomeCeiling}
              onChange={(e) => setIncomeCeiling(parseInt(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>No Limit (NFST)</span>
              <span>₹2.5L (Post-Matric)</span>
              <span>₹8.0L (NOS)</span>
            </div>
          </div>

          {/* Minimum Marks */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700">Minimum Qualifying Marks (%)</label>
              <span className="font-bold font-mono text-slate-900">{minMarks}%</span>
            </div>
            <input 
              type="range"
              min={45}
              max={75}
              step={1}
              value={minMarks}
              onChange={(e) => setMinMarks(parseInt(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>45% (Relaxed)</span>
              <span>55% (Standard MoTA)</span>
              <span>75% (Merit)</span>
            </div>
          </div>

          {/* Mandatory Test */}
          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-slate-700">National Qualifying Exam Mandate</label>
            <select
              value={testRequirement}
              onChange={(e) => setTestRequirement(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
            >
              <option value="NONE">None Required (Direct Admission)</option>
              <option value="UGC_NET">UGC-NET / CSIR-NET JRF (NFST Standard)</option>
              <option value="GATE">GATE / CEED Examination</option>
              <option value="ENTRANCE_TEST">National Institute Entrance Test</option>
            </select>
          </div>

          {/* Foreign University QS Rank Limit (NOS Specific) */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">QS World University Rank Cutoff</label>
              <span className="font-bold font-mono text-slate-900">
                {qsRankLimit === 0 ? 'Not Applicable (Domestic)' : `Top ${qsRankLimit} Globally`}
              </span>
            </div>
            <select
              value={qsRankLimit}
              onChange={(e) => setQsRankLimit(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
            >
              <option value={0}>Not Applicable (Indian Universities)</option>
              <option value={100}>Top 100 QS Ranked Only</option>
              <option value={250}>Top 250 QS Ranked Only</option>
              <option value={500}>Top 500 QS Ranked (NOS Gazette Rule)</option>
            </select>
          </div>
        </div>

        {/* Column 2: Document Checklists */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Document Requirements</h3>
              <p className="text-[11px] text-slate-500">Auto-flagged if missing or invalid</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">ST Caste Certificate</span>
                <p className="text-[10px] text-slate-500">Tehsildar / SDO digital record verification</p>
              </div>
              <input 
                type="checkbox" 
                checked={reqCaste} 
                onChange={(e) => setReqCaste(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">Annual Income Certificate</span>
                <p className="text-[10px] text-slate-500">Valid FY revenue authority certificate</p>
              </div>
              <input 
                type="checkbox" 
                checked={reqIncome} 
                onChange={(e) => setReqIncome(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">Institutional Bonafide Letter</span>
                <p className="text-[10px] text-slate-500">Signed & stamped by Registrar / Dean</p>
              </div>
              <input 
                type="checkbox" 
                checked={reqBonafide} 
                onChange={(e) => setReqBonafide(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">Qualifying Degree Marksheet</span>
                <p className="text-[10px] text-slate-500">For marks percentage cutoff evaluation</p>
              </div>
              <input 
                type="checkbox" 
                checked={reqMarksheet} 
                onChange={(e) => setReqMarksheet(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">Foreign University Admission Offer</span>
                <p className="text-[10px] text-slate-500">Unconditional letter from approved foreign institution</p>
              </div>
              <input 
                type="checkbox" 
                checked={reqOfferLetter} 
                onChange={(e) => setReqOfferLetter(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">Aadhaar-Seeded Bank Passbook</span>
                <p className="text-[10px] text-slate-500">For PFMS Direct Benefit Transfer</p>
              </div>
              <input 
                type="checkbox" 
                checked={reqBankMandate} 
                onChange={(e) => setReqBankMandate(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 border-slate-300"
              />
            </label>
          </div>
        </div>

        {/* Column 3: Statutory Quota Allocations */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Statutory Quota Distribution</h3>
              <p className="text-[11px] text-slate-500">Auto-allocated during Merit Selection</p>
            </div>
          </div>

          {/* Divyangjan Quota */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">Divyangjan Disability Quota</label>
              <span className="font-bold font-mono text-blue-700">{quotaDivyangjan}%</span>
            </div>
            <input 
              type="range"
              min={3}
              max={10}
              step={1}
              value={quotaDivyangjan}
              onChange={(e) => setQuotaDivyangjan(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Statutory minimum: 5% for ≥ 40% disability</p>
          </div>

          {/* PVTG Quota */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">PVTG Priority Earmarking</label>
              <span className="font-bold font-mono text-purple-700">{quotaPVTG}%</span>
            </div>
            <input 
              type="range"
              min={5}
              max={20}
              step={1}
              value={quotaPVTG}
              onChange={(e) => setQuotaPVTG(parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Direct admission without competitive cutoff</p>
          </div>

          {/* Female Reservation */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">Female ST Reservation</label>
              <span className="font-bold font-mono text-emerald-700">{quotaFemale}%</span>
            </div>
            <input 
              type="range"
              min={25}
              max={40}
              step={1}
              value={quotaFemale}
              onChange={(e) => setQuotaFemale(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Statutory minimum: 33% female earmarking</p>
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
            <div className="font-bold text-slate-800">Remaining General ST Merit:</div>
            <div className="font-mono text-base font-extrabold text-slate-900">
              {Math.max(0, 100 - (quotaDivyangjan + quotaPVTG + quotaFemale))}%
            </div>
            <p className="text-[10px] text-slate-500">Open to all eligible Scheduled Tribe applicants purely on merit score.</p>
          </div>
        </div>
      </div>

      {/* Save Action Footer */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          Publishing updates the active verification logic across <strong className="text-slate-800">{selectedSchemeCode}</strong> in real-time. An immutable SHA-256 audit block will be appended.
        </div>

        <button
          onClick={handleSaveConfiguration}
          disabled={saving}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Publishing Rules to Engine...' : `Deploy & Activate ${selectedSchemeCode} Rules`}
        </button>
      </div>
    </div>
  );
};
