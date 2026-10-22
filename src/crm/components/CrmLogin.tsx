import React, { useState } from 'react';
import { useCrmAuth } from '../CrmAuthContext';
import { Phone, Lock, Mail, Shield, UserCheck, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

interface CrmLoginProps {
  onBackToWebsite?: () => void;
}

export const CrmLogin: React.FC<CrmLoginProps> = ({ onBackToWebsite }) => {
  const { login, initFirstAdmin, error, clearError } = useCrmAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInitAdminModal, setShowInitAdminModal] = useState(false);

  // Admin init form state
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitSubmitting, setIsInitSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsSubmitting(true);
    await login(email, password);
    setIsSubmitting(false);
  };

  const handleInitAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminName.trim() || !adminPassword.trim()) {
      setInitError('Please fill in all required fields.');
      return;
    }
    setInitError(null);
    setIsInitSubmitting(true);
    const res = await initFirstAdmin({
      email: adminEmail,
      name: adminName,
      password: adminPassword,
      phone: adminPhone
    });
    setIsInitSubmitting(false);
    if (!res.success) {
      setInitError(res.error || 'Failed to initialize admin.');
    } else {
      setShowInitAdminModal(false);
    }
  };

  const setDemoCredentials = (role: 'admin' | 'telecaller') => {
    clearError();
    if (role === 'admin') {
      setEmail('admin@royalepicinterior.com');
      setPassword('Admin@RoyalEpic2026');
    } else {
      setEmail('telecaller1@royalepicinterior.com');
      setPassword('Tele@RoyalEpic2026');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-neutral-100 relative overflow-hidden font-sans">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar with Back to Website */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBackToWebsite}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-amber-400 transition-colors bg-neutral-900/80 px-3.5 py-2 rounded-lg border border-neutral-800 backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Website</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 shadow-xl shadow-amber-500/20 mb-4 border border-amber-300/30">
            <Phone className="w-7 h-7 text-neutral-950" />
          </div>
          <h2 className="text-2xl font-serif tracking-wide text-white font-bold">
            Royal Epic Interiors
          </h2>
          <div className="mt-1 flex items-center justify-center gap-2 text-xs font-mono tracking-widest uppercase text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Telecaller CRM & Sales Engine</span>
          </div>
          <p className="mt-2 text-xs text-neutral-400 max-w-sm mx-auto">
            Authorized portal for sales executives, customer relationship managers, and executive administrators.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {error && (
            <div className="mb-5 bg-red-950/50 border border-red-800/80 rounded-xl p-3.5 text-xs text-red-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@royalepicinterior.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-950/80 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-950/80 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Sign In to CRM</span>
                </>
              )}
            </button>
          </form>

          {/* Preset Roles Helper */}
          <div className="mt-6 pt-5 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">Quick Test Credentials:</span>
              <span className="text-[10px] text-amber-500/80 font-mono">MVP Sandbox</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="py-2 px-3 bg-neutral-950/70 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg text-left text-xs transition flex items-center gap-2 group cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-medium text-white text-[11px]">Admin Role</div>
                  <div className="text-[9px] text-neutral-400 font-mono">Full Permissions</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('telecaller')}
                className="py-2 px-3 bg-neutral-950/70 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg text-left text-xs transition flex items-center gap-2 group cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-medium text-white text-[11px]">Telecaller Role</div>
                  <div className="text-[9px] text-neutral-400 font-mono">Calling & Leads</div>
                </div>
              </button>
            </div>
          </div>

          {/* First-Time Admin Setup Trigger */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowInitAdminModal(true)}
              className="text-xs text-neutral-400 hover:text-amber-300 font-mono transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Configure New Admin Account</span>
            </button>
          </div>
        </div>

        {/* Security & Scope Footer Note */}
        <div className="mt-6 text-center text-xs text-neutral-400 space-y-1">
          <p>Protected by Royal Epic Interiors Session Security & Supabase RLS.</p>
          <p className="font-mono text-[10px] text-neutral-400">Host: tele.royalepicinteriors.com</p>
        </div>
      </div>

      {/* First-Time Admin Modal */}
      {showInitAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-lg">
                <Shield className="w-5 h-5" />
                <span>Initialize CRM Administrator</span>
              </div>
              <button
                onClick={() => setShowInitAdminModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Use this procedure to securely register or activate your primary CRM administrator account with role <code>admin</code>.
            </p>

            {initError && (
              <div className="mb-4 bg-red-950/50 border border-red-800 p-3 rounded-lg text-xs text-red-200">
                {initError}
              </div>
            )}

            <form onSubmit={handleInitAdminSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Royal Epic Admin"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@royalepicinterior.com"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="+91 99166 33338"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInitAdminModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-mono rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInitSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition"
                >
                  {isInitSubmitting ? 'Creating Admin...' : 'Create & Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
