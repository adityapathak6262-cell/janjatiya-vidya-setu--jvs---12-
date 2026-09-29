import React, { useState } from 'react';
import emblemLogo from '../assets/emblem.svg';
import { 
  Shield, 
  User as UserIcon, 
  Bell, 
  CheckCircle2, 
  ChevronDown, 
  Layers, 
  FileCheck2, 
  BarChart3, 
  SlidersHorizontal,
  KeyRound,
  ExternalLink,
  Lock,
  LogOut,
  UserPlus,
  LogIn,
  LayoutDashboard,
  RefreshCw,
  Clock,
  Home,
  MoreVertical,
  Globe
} from 'lucide-react';
import { User, NotificationRecord, api } from '../api';

interface HeaderProps {
  currentUser: User | null;
  allDemoUsers: User[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSwitchUser: (user: User) => void;
  notifications: NotificationRecord[];
  onNotificationRead: (id: string) => void;
  chainLength: number;
  onOpenAuthModal: (mode: 'STUDENT_LOGIN' | 'STUDENT_REGISTER' | 'ADMIN_LOGIN') => void;
  onLogout: () => void;
  onOpenThreeDotMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allDemoUsers,
  activeTab,
  onTabChange,
  onSwitchUser,
  notifications,
  onNotificationRead,
  chainLength,
  onOpenAuthModal,
  onLogout,
  onOpenThreeDotMenu
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabelMap: Record<string, { label: string; badgeColor: string }> = {
    STUDENT: { label: 'Applicant / Scholar', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    INSTITUTION_VERIFIER: { label: 'Institute Nodal Officer (INO)', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    MOTA_OFFICER: { label: 'MoTA Committee Officer', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    ADMIN: { label: 'Policy / System Admin', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    SUPER_ADMIN: { label: 'Ministry Super Admin', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  const navItems = [
    { id: 'home', label: 'Home', roles: ['ALL'], icon: Home },
    { id: 'global-bridge', label: 'Global Bridge (NOS)', roles: ['ALL'], icon: Globe },
    { id: 'student', label: 'Scholarship Desk', roles: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'], icon: FileCheck2 },
    { id: 'continuity', label: 'Scholarship Continuity', roles: ['STUDENT', 'INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'], icon: RefreshCw },
    { id: 'delay-monitor', label: 'Verification Monitor', roles: ['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'], icon: Clock },
    { id: 'officer', label: 'Verification & Scrutiny', roles: ['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN'], icon: SlidersHorizontal },
    { id: 'admin', label: 'Policy Compiler & Governance', roles: ['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN'], icon: Layers },
    { id: 'analytics', label: 'MoTA Analytics', roles: ['MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'INSTITUTION_VERIFIER', 'ALL'], icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Government Tricolor Stripe */}
      <div className="h-1 w-full bg-linear-to-r from-amber-500 via-white to-emerald-600" />

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity */}
          <div 
            onClick={() => onTabChange('home')}
            className="flex items-center gap-3.5 cursor-pointer group"
            title="Go to JVS Portal Home"
          >
            <div className="flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img 
                src={emblemLogo} 
                alt="State Emblem of India (Bharat Emblem)" 
                className="h-11 w-auto max-w-[34px] object-contain drop-shadow-xs" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-amber-800 transition-colors">
                  JANJATIYA VIDYA SETU
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">
                Policy-to-Workflow Intelligence Platform · Ministry of Tribal Affairs (MoTA)
              </p>
            </div>
          </div>

          {/* Navigation Tabs (RBAC Gated) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isAllowed = item.roles.includes('ALL') || (currentUser ? item.roles.includes(currentUser.role) : false);
              if (!isAllowed) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Top Right Action Zone */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* 3-Dot Overflow Menu Button */}
            <button
              onClick={onOpenThreeDotMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs group cursor-pointer"
              title="All JVS Features & Services (3-Dot Overflow Menu)"
              aria-label="3-Dot Menu"
            >
              <div className="flex items-center gap-1 text-slate-700 group-hover:text-slate-950">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-amber-600 transition-colors"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-amber-600 transition-colors"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-amber-600 transition-colors"></span>
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">Features</span>
            </button>

            {/* Tamper-Evident Chain Indicator */}
            {currentUser && (
              <button
                onClick={() => onTabChange('admin')}
                title="Tamper-Evident SHA-256 Audit Trail active"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono text-[11px]">Audit Chain: {chainLength}</span>
              </button>
            )}

            {/* Notifications Menu (Only when logged in) */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-800">In-App Notifications</span>
                      <span className="text-[11px] text-slate-500">{notifications.length} total</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">No notifications yet.</div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              onNotificationRead(notif.id);
                            }}
                            className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                              !notif.read ? 'bg-amber-50/50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-900">{notif.title}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* IF LOGGED IN: User Profile Badge & Persona Switcher */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {roleLabelMap[currentUser.role]?.label || currentUser.role}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-[11px] font-bold text-slate-800">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border ${roleLabelMap[currentUser.role]?.badgeColor || ''}`}>
                        {roleLabelMap[currentUser.role]?.label || currentUser.role}
                      </span>
                    </div>

                    {/* Quick Role Switcher section */}
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Registered Persona
                    </div>
                    <div className="space-y-0.5 max-h-52 overflow-y-auto">
                      {allDemoUsers.map((u) => {
                        const isCurrent = currentUser?.id === u.id;
                        const roleMeta = roleLabelMap[u.role] || { label: u.role, badgeColor: 'bg-slate-100 text-slate-700' };
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSwitchUser(u);
                              setShowUserMenu(false);
                            }}
                            className={`w-full flex items-start gap-2 p-1.5 rounded-lg text-left text-xs transition-colors ${
                              isCurrent ? 'bg-amber-50 font-semibold' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-700 shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="truncate text-slate-800 text-[11px]">{u.name}</span>
                                {isCurrent && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                              </div>
                              <span className="text-[9px] text-slate-400">{roleMeta.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Logout Option */}
                    <div className="border-t border-slate-100 mt-2 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-rose-700 hover:bg-rose-50 font-semibold transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out / Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* IF LOGGED OUT: Real Authentication Buttons in Top Right */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('STUDENT_LOGIN')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 hover:text-slate-950 hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-700" />
                  <span>Student Login</span>
                </button>
                <button
                  onClick={() => onOpenAuthModal('STUDENT_REGISTER')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ef5366] hover:bg-[#e04356] text-white transition-colors shadow-2xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up (OTR)</span>
                </button>
                <button
                  onClick={() => onOpenAuthModal('ADMIN_LOGIN')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Officer Login</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto py-2 border-t border-slate-100 gap-1 scrollbar-none">
          {navItems.map((item) => {
            const isAllowed = item.roles.includes('ALL') || (currentUser ? item.roles.includes(currentUser.role) : false);
            if (!isAllowed) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center gap-1 text-[10px] font-medium py-1 px-2 rounded shrink-0 ${
                  isActive ? 'text-slate-900 font-bold bg-slate-100' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}

          {/* Mobile 3-Dot Menu Button */}
          <button
            onClick={onOpenThreeDotMenu}
            className="flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-2.5 rounded text-amber-800 bg-amber-50 border border-amber-200 shrink-0"
          >
            <div className="flex items-center gap-0.5 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-amber-800"></span>
              <span className="w-1 h-1 rounded-full bg-amber-800"></span>
              <span className="w-1 h-1 rounded-full bg-amber-800"></span>
            </div>
            <span>Features</span>
          </button>
        </div>

      </div>
    </header>
  );
};
