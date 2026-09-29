import React, { useState, useEffect } from 'react';
import emblemLogo from '../assets/emblem.svg';
import {
  GraduationCap,
  Building2,
  UserCheck,
  Globe,
  RefreshCw,
  Megaphone,
  Award,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Shield,
  FileCheck2,
  Lock,
  LogIn,
  UserPlus,
  CheckCircle2,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { User } from '../api';

interface PortalHomeViewProps {
  currentUser: User | null;
  onNavigateTab: (tab: string) => void;
  onOpenAuth: (mode: 'STUDENT_LOGIN' | 'STUDENT_REGISTER' | 'ADMIN_LOGIN') => void;
}

export const PortalHomeView: React.FC<PortalHomeViewProps> = ({
  currentUser,
  onNavigateTab,
  onOpenAuth,
}) => {
  // Carousel slide index
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      id: 1,
      title: 'Empowering and Inspiring',
      subtitle: 'Tribal Students to Excel as Life Long Learners',
      badge: 'Academic Year 2026-27 Open',
      desc: 'Central Direct Benefit Transfer (DBT) portal for Scheduled Tribe scholars. Machine-readable policy verification with PRAMAAN dual-path digital validation.',
      imagePattern: 'bg-linear-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10',
    },
    {
      id: 2,
      title: 'Scholarship Continuity Desk',
      subtitle: 'Autonomous Annual Academic Progression for ST Scholars',
      badge: 'Zero-Disruption Renewals',
      desc: 'Streamlined session-to-session continuation without re-applying. Direct institution nodal endorsement and PFMS Aadhaar payment bridge credits.',
      imagePattern: 'bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10',
    },
    {
      id: 3,
      title: 'National Fellowship & Overseas Schemes',
      subtitle: 'Full Funding for M.Phil, Ph.D. & World Premier Universities',
      badge: 'NFST & NOS 100% Funded',
      desc: 'Monthly stipends up to ₹42,000 and 100% foreign university tuition coverage for meritorious tribal scholars across science and humanities.',
      imagePattern: 'bg-linear-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const slide = heroSlides[currentSlide];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. PANORAMIC HERO CAROUSEL BANNER (Matching Reference Screenshots 1 & 2) */}
      <div className="relative rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        {/* Decorative background overlay */}
        <div className={`absolute inset-0 ${slide.imagePattern} transition-all duration-700 pointer-events-none`} />
        
        {/* Subtle geometric dot pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative px-8 py-10 sm:px-14 sm:py-14 max-w-4xl mx-auto text-center flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px]">
          
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-[#ef5366] border border-rose-200 mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{slide.badge}</span>
          </span>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {slide.title}
          </h1>
          
          <p className="text-base sm:text-xl font-medium text-slate-700 mt-2 max-w-2xl leading-relaxed">
            {slide.subtitle}
          </p>

          <p className="text-xs sm:text-sm text-slate-500 mt-3 max-w-xl leading-relaxed">
            {slide.desc}
          </p>

          {/* Quick CTA row */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {!currentUser ? (
              <>
                <button
                  onClick={() => onOpenAuth('STUDENT_REGISTER')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#ef5366] hover:bg-[#e04356] text-white shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>One Time Registration (OTR / Sign Up)</span>
                </button>
                <button
                  onClick={() => onOpenAuth('STUDENT_LOGIN')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Student Login</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
                <button
                  onClick={() => onOpenAuth('ADMIN_LOGIN')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition flex items-center gap-2 shadow-2xs cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>Officer / Institutional Login</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigateTab('student')}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#ef5366] hover:bg-[#e04356] text-white shadow-xs transition flex items-center gap-2"
              >
                <span>Go to Scholarship Desk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Carousel Arrow Controls */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-slate-600 shadow-md border border-slate-200 transition"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-slate-600 shadow-md border border-slate-200 transition"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel Slide Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? 'w-6 bg-[#ef5366]' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 2. THE 5 VIBRANT COLORFUL CATEGORY CARDS (Centerpiece of Screenshot 1 & 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* CARD 1: STUDENTS (Coral Red / #ef5366) */}
        <button
          onClick={() => {
            if (!currentUser) onOpenAuth('STUDENT_LOGIN');
            else onNavigateTab('student');
          }}
          className="p-5 sm:p-6 rounded-xl bg-[#ef5366] hover:bg-[#e4465a] text-white shadow-md transition-all transform hover:-translate-y-0.5 text-center flex flex-col items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center transition group-hover:scale-110">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-wide">Students</span>
          <span className="text-[11px] text-white/85 line-clamp-1">Scholarship Desk & OTR</span>
        </button>

        {/* CARD 2: INSTITUTIONS (Magenta Pink / #d44c85) */}
        <button
          onClick={() => {
            if (!currentUser) onOpenAuth('ADMIN_LOGIN');
            else onNavigateTab('officer');
          }}
          className="p-5 sm:p-6 rounded-xl bg-[#d44c85] hover:bg-[#c63e77] text-white shadow-md transition-all transform hover:-translate-y-0.5 text-center flex flex-col items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center transition group-hover:scale-110">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-wide">Institutions</span>
          <span className="text-[11px] text-white/85 line-clamp-1">Verification Desk</span>
        </button>

        {/* CARD 3: OFFICERS (Purple Violet / #6c5ce7) */}
        <button
          onClick={() => {
            if (!currentUser) onOpenAuth('ADMIN_LOGIN');
            else onNavigateTab('delay-monitor');
          }}
          className="p-5 sm:p-6 rounded-xl bg-[#6c5ce7] hover:bg-[#5b4ad8] text-white shadow-md transition-all transform hover:-translate-y-0.5 text-center flex flex-col items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center transition group-hover:scale-110">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-wide">Officers</span>
          <span className="text-[11px] text-white/85 line-clamp-1">Scrutiny & Delay Monitor</span>
        </button>

        {/* CARD 4: PUBLIC (Cyan Teal / #00b4d8) */}
        <button
          onClick={() => onNavigateTab('analytics')}
          className="p-5 sm:p-6 rounded-xl bg-[#00b4d8] hover:bg-[#00a2c2] text-white shadow-md transition-all transform hover:-translate-y-0.5 text-center flex flex-col items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center transition group-hover:scale-110">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-wide">Public</span>
          <span className="text-[11px] text-white/85 line-clamp-1">MoTA Open Analytics</span>
        </button>

        {/* CARD 5: FELLOWSHIP (Vibrant Orange / #ee7325) */}
        <button
          onClick={() => onNavigateTab('continuity')}
          className="col-span-2 sm:col-span-1 p-5 sm:p-6 rounded-xl bg-[#ee7325] hover:bg-[#dc6418] text-white shadow-md transition-all transform hover:-translate-y-0.5 text-center flex flex-col items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center transition group-hover:scale-110">
            <Award className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-wide">Fellowship</span>
          <span className="text-[11px] text-white/85 line-clamp-1">Scholarship Continuity</span>
        </button>

      </div>

      {/* 3. TWO-COLUMN SECTION: ANNOUNCEMENTS & GET YOUR OTR (Screenshot 1 & 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* COLUMN 1: ANNOUNCEMENTS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#d44c85]">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Announcements</h2>
              <p className="text-xs text-slate-500">Ministry of Tribal Affairs Official Notifications</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl transition border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                Active Policy
              </span>
              <p className="font-bold text-slate-800 leading-snug">
                National Fellowship for ST Students (NFST) & Overseas Schemes (NOS) 2026-27
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Central Sector Schemes portal is now accepting fresh and renewal applications. Beneficiary profiles are authenticated automatically via the PRAMAAN engine.
              </p>
            </div>

            <div className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl transition border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase">
                Notice to Institutes
              </span>
              <p className="font-bold text-slate-800 leading-snug">
                Mandatory PRAMAAN Verification of Enrolled ST Scholars
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Institute Nodal Officers (INOs) are requested to review institutional verification queues under the Service Level Agreement (SLA) standard window of 3–5 days.
              </p>
            </div>

            <div className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl transition border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">
                DBT Aadhaar Seeding
              </span>
              <p className="font-bold text-slate-800 leading-snug">
                Aadhaar Payment Bridge System (APBS) Bank Account Linking
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                All scholarship disbursements are executed through direct bank credit to the scholar's Aadhaar-seeded bank account. Check your mandate status on the portal.
              </p>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={() => onNavigateTab('student')}
              className="text-xs font-bold text-[#d44c85] hover:text-[#b63c70] inline-flex items-center gap-1 transition"
            >
              <span>View all notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COLUMN 2: GET YOUR OTR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6c5ce7]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Get your OTR (One Time Registration)</h2>
              <p className="text-xs text-slate-500">Universal Digital Identity for Tribal Scholarships</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>One Time Registration (OTR)</strong> is a unique 14-digit number issued based on the Aadhaar / Aadhaar Enrolment ID (EID) and is applicable for the entire academic career of the student.
            </p>

            <p>
              OTR simplifies the scholarship application process, eliminating the need of duplicate registration in each academic year.
            </p>

            <p>
              OTR is required to apply for Central ST scholarships (NFST, NOS, Top Class Education) on the Janjatiya Vidya Setu portal.
            </p>

            {/* Benefit Checkmarks */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-[11px] font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Single registration valid across all academic degrees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instant automated PRAMAAN caste & marksheet verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Tamper-evident SHA-256 state ledger records</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {!currentUser ? (
              <button
                onClick={() => onOpenAuth('STUDENT_REGISTER')}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
              >
                <span>Register for OTR Now</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            ) : (
              <button
                onClick={() => onNavigateTab('student')}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
              >
                <span>View My OTR Application Status</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 4. FEATURED SCHEMES SECTION (Refined visual cards matching portal palette) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Central ST Scholarship Subsystems (Academic Year 2026-27)
            </h2>
            <p className="text-xs text-slate-500">
              Direct Benefit Transfer schemes administered by the Ministry of Tribal Affairs (MoTA)
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            PRAMAAN Verified Schemes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* NFST */}
          <div className="border border-slate-200 hover:border-amber-400 rounded-xl p-5 bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-3">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                National Fellowship for ST Students (NFST)
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                750 fellowships awarded annually for regular M.Phil & Ph.D. scholars in Sciences, Humanities, and Technology.
              </p>
              <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fellowship:</span>
                  <span className="font-semibold text-slate-900">₹35,000 – ₹42,000/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contingency:</span>
                  <span className="font-semibold text-slate-900">₹20,500/year</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth('STUDENT_LOGIN');
                else onNavigateTab('student');
              }}
              className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold transition"
            >
              {currentUser ? 'Open Scheme Desk' : 'Login to Apply'}
            </button>
          </div>

          {/* NOS */}
          <div className="border border-slate-200 hover:border-blue-400 rounded-xl p-5 bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                National Overseas Scholarship (NOS)
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Full financial coverage for ST students pursuing Master's and Doctoral programs abroad in top QS-ranked world universities.
              </p>
              <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tuition Fee:</span>
                  <span className="font-semibold text-slate-900">100% Fully Funded</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Maintenance:</span>
                  <span className="font-semibold text-slate-900">£9,900 / $15,400/yr</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (!currentUser) onOpenAuth('STUDENT_LOGIN');
                  else onNavigateTab('student');
                }}
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition"
              >
                {currentUser ? 'Open Scheme Desk' : 'Login to Apply'}
              </button>
              <button
                onClick={() => onNavigateTab('global-bridge')}
                className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border border-indigo-200"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>PRAMAAN Global Bridge (NOS 360°)</span>
              </button>
            </div>
          </div>

          {/* Top Class */}
          <div className="border border-slate-200 hover:border-emerald-400 rounded-xl p-5 bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                Top Class Education for ST Students
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Full tuition fee waiver and grant support for ST students enrolled in premier institutes (IITs, IIMs, NITs, AIIMS, NLUs).
              </p>
              <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Living Allowance:</span>
                  <span className="font-semibold text-slate-900">₹3,000/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Laptop & Books:</span>
                  <span className="font-semibold text-slate-900">₹86,000 grant</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth('STUDENT_LOGIN');
                else onNavigateTab('student');
              }}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition"
            >
              {currentUser ? 'Open Scheme Desk' : 'Login to Apply'}
            </button>
          </div>

        </div>
      </div>

      {/* 5. GOVERNMENT PARTNER LOGOS ROW (Screenshot 1 & 2) */}
      <div className="py-6 border-t border-slate-200/80">
        <div className="flex flex-wrap items-center justify-around gap-6 sm:gap-8 opacity-75 grayscale hover:grayscale-0 transition-all text-xs font-bold text-slate-500">
          <div className="flex items-center gap-1.5 font-sans">
            <span className="text-sm font-black text-slate-700">MeitY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black tracking-wider text-slate-700">NIC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-slate-700">my<span className="text-amber-600">Gov</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-slate-700">india.gov.in</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-blue-700">Digital India</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-emerald-700">DBT Bharat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <img src={emblemLogo} alt="State Emblem of India" className="h-4 w-auto object-contain" />
            <span className="text-sm font-black text-slate-800">MoTA</span>
          </div>
        </div>
      </div>

      {/* 6. OFFICIAL FOOTER POLICY LINKS (Screenshot 1 & 2) */}
      <div className="border-t border-slate-200 pt-6 pb-2 text-center text-[11px] text-slate-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-medium">
          <a href="#copyright" onClick={(e) => e.preventDefault()} className="hover:text-slate-800 transition">Copyright Policy</a>
          <span>|</span>
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-800 transition">Privacy Policy</a>
          <span>|</span>
          <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-800 transition">Terms and Conditions</a>
          <span>|</span>
          <a href="#disclaimer" onClick={(e) => e.preventDefault()} className="hover:text-slate-800 transition">Disclaimer</a>
          <span>|</span>
          <a href="#hyperlink" onClick={(e) => e.preventDefault()} className="hover:text-slate-800 transition">Hyperlink Policy</a>
          <span>|</span>
          <a href="#sitemap" onClick={(e) => e.preventDefault()} className="hover:text-slate-800 transition">Site Map</a>
        </div>
      </div>

    </div>
  );
};
