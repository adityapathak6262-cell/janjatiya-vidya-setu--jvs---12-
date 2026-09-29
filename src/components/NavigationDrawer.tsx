import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Home,
  GraduationCap,
  Building2,
  UserCheck,
  Globe,
  RefreshCw,
  Clock,
  Layers,
  BarChart3,
  FileCheck2,
  FileText,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Bot,
  Sparkles,
  Award,
  Lock,
  LogIn,
  UserPlus,
  Landmark,
  CreditCard,
  AlertTriangle,
  FolderLock,
  Compass,
  CheckCircle2,
  Bell,
  Scale,
  MoreVertical,
  Activity,
  SlidersHorizontal
} from 'lucide-react';
import { User } from '../api';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allDemoUsers?: User[];
  activeTab: string;
  onNavigateTab: (tab: string, subTab?: string) => void;
  onSwitchUser?: (user: User) => void;
  onOpenAuthModal: (mode: 'STUDENT_LOGIN' | 'STUDENT_REGISTER' | 'ADMIN_LOGIN') => void;
  onOpenChatbot?: () => void;
  onOpenNotifications?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  desc: string;
  icon: any;
  tab: string;
  subTab?: string;
  roles?: string[];
  badge?: string;
  action?: () => void;
}

interface MenuCategory {
  id: string;
  title: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  items: MenuItem[];
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  allDemoUsers = [],
  activeTab,
  onNavigateTab,
  onSwitchUser,
  onOpenAuthModal,
  onOpenChatbot,
  onOpenNotifications,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleItemClick = (tab: string, subTab?: string) => {
    onNavigateTab(tab, subTab);
    onClose();
  };

  // Safe user profile details
  const userName = currentUser?.name || 'Registered User';
  const userRole = (currentUser?.role || 'STUDENT').replace(/_/g, ' ');
  const userInitial = userName.charAt(0) || 'U';

  // Comprehensive feature list for 3-dot overflow menu
  const menuCategories: MenuCategory[] = [
    {
      id: 'core',
      title: 'Portal Overview & Highlights',
      color: 'text-amber-700',
      badgeBg: 'bg-amber-50',
      borderColor: 'border-amber-200',
      items: [
        {
          id: 'home',
          label: 'Portal Home & Overview',
          desc: 'Central landing view with Schemes, Announcements & OTR',
          icon: Home,
          tab: 'home',
          roles: ['ALL'],
          badge: 'Overview',
        },
        {
          id: 'schemes-overview',
          label: 'Central Schemes Directory',
          desc: 'NFST, NOS & Top Class Education for ST Students',
          icon: Award,
          tab: 'home',
          roles: ['ALL'],
          badge: 'AY 2026-27',
        },
        {
          id: 'global-bridge-nos',
          label: 'PRAMAAN Global Bridge (NOS 360°)',
          desc: '11-Page MoTA circular compliance, QS verifier, Kinship hash & Embassy node',
          icon: Globe,
          tab: 'global-bridge',
          roles: ['ALL'],
          badge: 'NOS 2021-26',
        },
      ],
    },
    {
      id: 'students',
      title: 'Student & Applicant Services',
      color: 'text-[#ef5366]',
      badgeBg: 'bg-rose-50',
      borderColor: 'border-rose-200',
      items: [
        {
          id: 'student-dashboard',
          label: 'Student Dashboard',
          desc: 'Unified scholar overview, scholarship status & notifications',
          icon: GraduationCap,
          tab: 'student',
          subTab: 'dashboard',
          roles: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
          badge: 'Core',
        },
        {
          id: 'student-applications',
          label: 'Applications & Fresh Wizard',
          desc: 'Launch new application or view active scheme submissions',
          icon: FileText,
          tab: 'student',
          subTab: 'schemes',
          roles: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          id: 'student-documents',
          label: 'Digital Document Locker',
          desc: 'Caste, Income, Marksheet repository with PRAMAAN status',
          icon: FolderLock,
          tab: 'student',
          subTab: 'documents',
          roles: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
          badge: 'PRAMAAN',
        },
        {
          id: 'student-eligibility',
          label: 'PRAMAAN Automated Eligibility',
          desc: 'Evaluate policy rules against student academic profile',
          icon: Compass,
          tab: 'student',
          subTab: 'schemes',
          roles: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          id: 'student-continuity',
          label: 'Scholarship Continuity Desk',
          desc: 'Autonomous annual academic progression & multi-year renewal',
          icon: RefreshCw,
          tab: 'continuity',
          roles: ['STUDENT', 'INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'],
          badge: 'Continuity',
        },
        {
          id: 'student-deficiency',
          label: 'Explainable Deficiency Desk',
          desc: 'Review officer discrepancies & upload rectified proofs',
          icon: AlertTriangle,
          tab: 'student',
          subTab: 'deficiency',
          roles: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          id: 'student-tracking',
          label: 'Application Tracking & Timeline',
          desc: 'Live end-to-end audit lifecycle tracking from INO to PFMS',
          icon: Activity,
          tab: 'student',
          subTab: 'timeline',
          roles: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          id: 'student-dbt',
          label: 'Payment / DBT Milestone Desk',
          desc: 'PFMS Aadhaar Payment Bridge status & disbursement releases',
          icon: CreditCard,
          tab: 'student',
          subTab: 'post_selection',
          roles: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },
    {
      id: 'institutes',
      title: 'Institute Verification Services',
      color: 'text-[#d44c85]',
      badgeBg: 'bg-pink-50',
      borderColor: 'border-pink-200',
      items: [
        {
          id: 'institute-desk',
          label: 'Institute Verification Desk',
          desc: 'Nodal Officer (INO) verification queue & student validation',
          icon: Building2,
          tab: 'officer',
          subTab: 'verification',
          roles: ['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'],
          badge: 'INO Desk',
        },
        {
          id: 'institute-queue',
          label: 'Application Scrutiny Queue',
          desc: 'Real-time student submissions awaiting institutional verification',
          icon: FileCheck2,
          tab: 'officer',
          subTab: 'verification',
          roles: ['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },
    {
      id: 'officers',
      title: 'Officer & Ministry Action Center',
      color: 'text-[#6c5ce7]',
      badgeBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
      items: [
        {
          id: 'officer-monitor',
          label: 'Verification Delay & SLA Monitor',
          desc: 'System-level bottleneck diagnostics & real-time queue latency',
          icon: Clock,
          tab: 'delay-monitor',
          roles: ['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'],
          badge: 'SLA Engine',
        },
        {
          id: 'officer-scrutiny',
          label: 'Ministry Scrutiny Committee',
          desc: 'Deep verification case scrutiny & discrepancy resolution',
          icon: Scale,
          tab: 'officer',
          subTab: 'scrutiny',
          roles: ['MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'],
        },
        {
          id: 'officer-merit',
          label: 'Merit Screening & Allocation',
          desc: 'Central fellowship quota allocation & merit lists',
          icon: Award,
          tab: 'officer',
          subTab: 'selection',
          roles: ['MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },
    {
      id: 'governance',
      title: 'Public Analytics & Governance',
      color: 'text-[#00b4d8]',
      badgeBg: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      items: [
        {
          id: 'admin-showcase',
          label: 'Multi-Scheme Execution Engine',
          desc: 'Parallel execution of NFST vs NOS with auto-flagging proof',
          icon: Sparkles,
          tab: 'admin',
          roles: ['ALL'],
          badge: 'Live Engine',
        },
        {
          id: 'admin-configurator',
          label: 'No-Code Visual Rules Configurator',
          desc: 'Visual sliders for income ceiling, marks cutoffs & quotas',
          icon: SlidersHorizontal,
          tab: 'admin',
          roles: ['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN'],
          badge: 'Visual Engine',
        },
        {
          id: 'analytics-mota',
          label: 'MoTA Central Analytics',
          desc: 'State-wise DBT breakdown, gender equity & scheme metrics',
          icon: BarChart3,
          tab: 'analytics',
          roles: ['ALL'],
          badge: 'Public',
        },
        {
          id: 'admin-compiler',
          label: 'Policy Compiler & Governance',
          desc: 'Machine-readable JSON scheme rules & validation schemas',
          icon: Layers,
          tab: 'admin',
          roles: ['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN'],
        },
        {
          id: 'admin-audit',
          label: 'Tamper-Evident SHA-256 Ledger',
          desc: 'Cryptographic block hash audit chain & immutability logs',
          icon: Shield,
          tab: 'admin',
          roles: ['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN'],
          badge: 'SHA-256',
        },
      ],
    },
    {
      id: 'support',
      title: 'AI Assistance & Utilities',
      color: 'text-indigo-600',
      badgeBg: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      items: [
        {
          id: 'ai-mitra',
          label: 'Setu Mitra AI Assistant',
          desc: 'Tribal scholarship scheme advisor & step-by-step assistant',
          icon: Sparkles,
          tab: 'chatbot',
          roles: ['ALL'],
          badge: 'AI Assistant',
          action: () => {
            onClose();
            if (onOpenChatbot) onOpenChatbot();
          },
        },
        {
          id: 'notifications-center',
          label: 'In-App Notifications',
          desc: 'System notifications, policy broadcasts & status alerts',
          icon: Bell,
          tab: 'notifications',
          roles: ['ALL'],
          action: () => {
            onClose();
            if (onOpenNotifications) onOpenNotifications();
          },
        },
      ],
    },
  ];

  // Filter items by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return menuCategories;
    const q = searchQuery.toLowerCase();
    return menuCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q) ||
            cat.title.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery, menuCategories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel wrapper anchored to the right */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 z-10">
        <div className="w-screen max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold">
                <MoreVertical className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight text-white uppercase">
                  All JVS Features & Services
                </h2>
                <p className="text-[11px] text-slate-400">
                  Direct navigation to existing portal workflows
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features (e.g., Documents, DBT, Continuity, SLA)..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Current Active Persona Banner (Safely Rendered) */}
          {currentUser ? (
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                  {userInitial}
                </div>
                <div className="truncate">
                  <span className="font-bold text-slate-800 block truncate">{userName}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{userRole}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold shrink-0">
                Active
              </span>
            </div>
          ) : (
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs shrink-0">
              <span className="text-amber-800 font-semibold text-[11px]">Guest Scholar Mode</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuthModal('STUDENT_LOGIN');
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold transition cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuthModal('STUDENT_REGISTER');
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold transition cursor-pointer"
                >
                  OTR
                </button>
              </div>
            </div>
          )}

          {/* Scrollable Categories List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 sm:p-4 space-y-4 text-xs min-h-0">
            {filteredCategories.map((category) => (
              <div key={category.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${category.color}`}>
                    {category.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {category.items.length} {category.items.length === 1 ? 'service' : 'services'}
                  </span>
                </div>

                <div className="space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.tab;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.action) {
                            item.action();
                          } else if (!currentUser && item.roles && !item.roles.includes('ALL')) {
                            onClose();
                            onOpenAuthModal('STUDENT_LOGIN');
                          } else {
                            handleItemClick(item.tab, item.subTab);
                          }
                        }}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'hover:bg-slate-50 text-slate-800 border border-transparent hover:border-slate-100'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isActive
                              ? 'bg-white/10 text-amber-400'
                              : `${category.badgeBg} ${category.color}`
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-bold truncate text-xs ${isActive ? 'text-white' : 'text-slate-900'}`}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                  isActive
                                    ? 'bg-amber-400/20 text-amber-300'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] leading-snug line-clamp-1 mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                            {item.desc}
                          </p>
                        </div>

                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 self-center ${isActive ? 'text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="py-12 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No matching features found</p>
                <p className="text-[11px] text-slate-400">
                  Try searching for "Documents", "Continuity", "Verification", or "DBT"
                </p>
              </div>
            )}
          </div>

          {/* Footer of Menu */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Ministry of Tribal Affairs</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">PRAMAAN Verification Subsystem</span>
          </div>

        </div>
      </div>
    </div>
  );
};
