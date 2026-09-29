import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Landmark, 
  RefreshCw,
  Building,
  ShieldCheck
} from 'lucide-react';
import { User, api } from '../api';

interface AnalyticsPortalProps {
  currentUser: User;
}

export const AnalyticsPortal: React.FC<AnalyticsPortalProps> = ({ currentUser }) => {
  const [analytics, setAnalytics] = useState<{
    metrics: {
      totalApplications: number;
      submitted: number;
      underVerification: number;
      deficiencies: number;
      readyForScrutiny: number;
      selected: number;
      completed: number;
    };
    schemeBreakdown: Array<{ code: string; name: string; totalApplications: number; selectedCount: number }>;
    deficiencyStats: { totalRaised: number; open: number; resubmitted: number; resolved: number };
    inclusionMetrics: { divyangjan: number; pvtg: number; female: number };
    auditChainLength: number;
    lastAuditHash: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalyticsOverview();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentUser]);

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
        Loading MoTA Scheme Analytics...
      </div>
    );
  }

  const { metrics, schemeBreakdown, deficiencyStats, inclusionMetrics } = analytics;

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-emerald-700 font-bold">
              MoTA Executive MIS & Oversight
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Real-Time Transactional Aggregation</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Ministry of Tribal Affairs Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated metrics for NFST, NOS, Pre-Matric, and Post-Matric schemes across India
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Beneficiaries</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.totalApplications}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active application records</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Verification Pipeline</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-900">
            {metrics.underVerification}
          </div>
          <span className="text-[11px] text-blue-600 mt-1 block">Pending Nodal verification</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Deficiency Resolution</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-900">
            {metrics.deficiencies}
          </div>
          <span className="text-[11px] text-rose-600 mt-1 block">Action required by applicant</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Awards Provisioned</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-900">
            {metrics.selected}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">Provisional award letters issued</span>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scheme Wise Performance Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Scheme Breakdown & Quota Utilization
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[11px]">
                  <th className="pb-2">Scheme Code</th>
                  <th className="pb-2">Full Scheme Name</th>
                  <th className="pb-2 text-right">Applications</th>
                  <th className="pb-2 text-right">Selected</th>
                  <th className="pb-2 text-right">Approval Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemeBreakdown.map((s) => {
                  const rate = s.totalApplications > 0 ? ((s.selectedCount / s.totalApplications) * 100).toFixed(0) : '0';
                  return (
                    <tr key={s.code} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono font-bold text-slate-900">{s.code}</td>
                      <td className="py-2.5 text-slate-700 font-medium">{s.name}</td>
                      <td className="py-2.5 text-right font-bold text-slate-800">{s.totalApplications}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-700">{s.selectedCount}</td>
                      <td className="py-2.5 text-right font-mono text-slate-600">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-[11px] flex items-center justify-between">
            <span>Official Policy Rule Enforcement:</span>
            <span className="font-semibold text-slate-900">
              NFST 750 Annual Ceiling · NOS 20 Worldwide Slots
            </span>
          </div>
        </div>

        {/* Inclusion & Quota Compliance (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Social Inclusion & Statutory Quotas
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Divyangjan (Persons with Disability)</span>
                <span className="text-[11px] text-slate-500">5% Statutory Quota (38 Slots in NFST)</span>
              </div>
              <span className="font-mono text-sm font-bold text-indigo-700">
                {inclusionMetrics.divyangjan} Scholars
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">PVTG (Particularly Vulnerable Groups)</span>
                <span className="text-[11px] text-slate-500">25 Priority Slots in NFST · 3 in NOS</span>
              </div>
              <span className="font-mono text-sm font-bold text-amber-700">
                {inclusionMetrics.pvtg} Scholars
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Female ST Scholars Earmarked</span>
                <span className="text-[11px] text-slate-500">30% Earmarking (225 Slots in NFST)</span>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-700">
                {inclusionMetrics.female} Scholars
              </span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-900">
            <span className="font-bold block mb-0.5">DBT Payment Bridge Readiness:</span>
            Aadhaar CIDR demographic matching and PFMS bank mandate active across all verified scholars.
          </div>
        </div>
      </div>
    </div>
  );
};
