import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Building, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  UserCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { api, setAuthToken, User } from '../api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'STUDENT_LOGIN' | 'STUDENT_REGISTER' | 'ADMIN_LOGIN';
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'STUDENT_LOGIN',
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<'STUDENT_LOGIN' | 'STUDENT_REGISTER' | 'ADMIN_LOGIN'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [state, setState] = useState('Jharkhand');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode and pre-fill credentials accurately
  useEffect(() => {
    setMode(initialMode);
    setError(null);
    if (initialMode === 'ADMIN_LOGIN') {
      setEmail('admin.jvs@mota.gov.in');
      setPassword('MotA@Jvs2026');
    } else if (initialMode === 'STUDENT_LOGIN') {
      setEmail('adityapathak6262@gmail.com');
      setPassword('MotA@Jvs2026');
    } else {
      setEmail('');
      setPassword('');
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), password);
      setAuthToken(res.token);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      let msg = err.message || 'Login failed. Please verify credentials.';
      if (msg.includes('JSON') || msg.includes('token') || msg.includes('doctype') || msg.includes('rate') || msg.includes('Rate')) {
        msg = 'Temporary network delay or cloud rate limit detected. Please retry or click Quick Sign-In.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        password: password,
        role: 'STUDENT',
        institution: institution.trim() || 'Central University of Jharkhand',
        state: state
      });
      setAuthToken(res.token);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Account Selectors
  const selectAccount = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('MotA@Jvs2026');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Tricolor top header strip */}
        <div className="h-1.5 w-full bg-linear-to-r from-amber-500 via-white to-emerald-600" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {mode === 'STUDENT_LOGIN' && 'Student & Scholar Login'}
                {mode === 'STUDENT_REGISTER' && 'New Student Registration'}
                {mode === 'ADMIN_LOGIN' && 'Official / Admin Portal Access'}
              </h2>
              <p className="text-[11px] text-slate-500">Ministry of Tribal Affairs Authentication</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 bg-slate-100 p-1 m-4 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => { 
              setMode('STUDENT_LOGIN'); 
              setError(null); 
              selectAccount('adityapathak6262@gmail.com');
            }}
            className={`py-1.5 rounded-lg transition-all ${
              mode === 'STUDENT_LOGIN' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Student Login
          </button>
          <button
            onClick={() => { 
              setMode('STUDENT_REGISTER'); 
              setError(null); 
              setEmail(''); 
              setPassword('');
            }}
            className={`py-1.5 rounded-lg transition-all ${
              mode === 'STUDENT_REGISTER' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            New Student
          </button>
          <button
            onClick={() => { 
              setMode('ADMIN_LOGIN'); 
              setError(null); 
              selectAccount('admin.jvs@mota.gov.in');
            }}
            className={`py-1.5 rounded-lg transition-all ${
              mode === 'ADMIN_LOGIN' ? 'bg-amber-600 text-white shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Official / Admin
          </button>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="mx-4 mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                const targetEmail = mode === 'ADMIN_LOGIN' ? 'admin.jvs@mota.gov.in' : 'adityapathak6262@gmail.com';
                setEmail(targetEmail);
                setPassword('MotA@Jvs2026');
                try {
                  const res = await api.login(targetEmail, 'MotA@Jvs2026');
                  setAuthToken(res.token);
                  onLoginSuccess(res.user);
                  onClose();
                } catch {
                  //
                }
              }}
              className="self-start text-[11px] font-bold text-amber-800 hover:text-amber-900 underline cursor-pointer"
            >
              ➔ Click to bypass & Sign In immediately as {mode === 'ADMIN_LOGIN' ? 'MoTA Admin' : 'Registered Scholar'}
            </button>
          </div>
        )}

        {/* STUDENT LOGIN FORM */}
        {mode === 'STUDENT_LOGIN' && (
          <form onSubmit={handleLogin} className="p-4 pt-0 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. adityapathak6262@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[10px] text-slate-400">Default: MotA@Jvs2026</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In to Student Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Pre-fill */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Quick fill scholar:</span>
              <button
                type="button"
                onClick={() => selectAccount('adityapathak6262@gmail.com')}
                className="text-amber-700 hover:underline font-semibold cursor-pointer"
              >
                Aditya (Registered ST Scholar)
              </button>
            </div>
          </form>
        )}

        {/* STUDENT REGISTRATION FORM */}
        {mode === 'STUDENT_REGISTER' && (
          <form onSubmit={handleRegister} className="p-4 pt-0 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name (As per Aadhaar Card)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Birsa Soren"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@gmail.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enrolled Institution / Univ
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="IIT Ranchi / DU / etc"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Domicile State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Assam">Assam</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800">
              <span className="font-semibold">Auto-Activated ST Student Profile:</span> Instant access to apply for NFST, NOS, and Top-Class fellowship schemes immediately after registration.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Creating Student Account...' : 'Register & Access Dashboard'}
              <Sparkles className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ADMIN / OFFICER LOGIN FORM */}
        {mode === 'ADMIN_LOGIN' && (
          <form onSubmit={handleLogin} className="p-4 pt-0 space-y-3.5">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
              <span className="font-bold">Official Ministry & Verifier Portals:</span>
              <p className="mt-0.5 text-[11px] text-amber-800">
                Choose an official role below or enter your government credentials.
              </p>
              
              {/* One-click official persona selector buttons */}
              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => selectAccount('admin.jvs@mota.gov.in')}
                  className={`py-1 px-2 text-[10px] font-bold rounded border text-center transition ${
                    email === 'admin.jvs@mota.gov.in' 
                      ? 'bg-amber-600 text-white border-amber-600' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-100'
                  }`}
                >
                  System Admin
                </button>
                <button
                  type="button"
                  onClick={() => selectAccount('ino.dtu@gov.in')}
                  className={`py-1 px-2 text-[10px] font-bold rounded border text-center transition ${
                    email === 'ino.dtu@gov.in' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-100'
                  }`}
                >
                  Nodal Verifier (INO)
                </button>
                <button
                  type="button"
                  onClick={() => selectAccount('superadmin.jvs@mota.gov.in')}
                  className={`py-1 px-2 text-[10px] font-bold rounded border text-center transition ${
                    email === 'superadmin.jvs@mota.gov.in' 
                      ? 'bg-purple-600 text-white border-purple-600' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-purple-100'
                  }`}
                >
                  Super Admin
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Ministry / Officer Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin.jvs@mota.gov.in"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[10px] text-slate-500 font-mono font-semibold">MotA@Jvs2026</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Verifying RBAC Authorization...' : 'Sign In as Officer / Admin'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
