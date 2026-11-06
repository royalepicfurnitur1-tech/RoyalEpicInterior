import React, { useState } from 'react';
import { useCrmAuth } from '../CrmAuthContext';
import { Phone, Lock, Mail, Shield, AlertCircle, ArrowLeft, KeyRound, Sparkles, UserCheck } from 'lucide-react';

interface CrmLoginProps {
  onBackToWebsite?: () => void;
}

export const CrmLogin: React.FC<CrmLoginProps> = ({ onBackToWebsite }) => {
  const { login, error } = useCrmAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsSubmitting(true);
    await login(email, password);
    setIsSubmitting(false);
  };

  const handleFillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-neutral-100 relative overflow-hidden font-sans">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar with Back to Website */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBackToWebsite}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-amber-400 transition-colors bg-neutral-900/80 px-3.5 py-2 rounded-xl border border-neutral-800 backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Website</span>
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
          <p className="mt-2 text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Authorized portal for sales telecallers, lead qualifiers, and executive administrators.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-neutral-900/90 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {error && (
            <div className="mb-5 bg-red-950/60 border border-red-800/80 rounded-xl p-3.5 text-xs text-red-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Work Email Address
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
                  placeholder="telecaller1@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-950/80 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition font-mono"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-950/80 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Sign In to Telecaller CRM</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Helpers */}
          <div className="mt-6 pt-5 border-t border-neutral-800 space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block text-center">
              Quick Logins (Click to autofill)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillCredentials('telecaller1@gmail.com', 'telecaller1@123')}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-left transition text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] mb-0.5">
                  <Phone className="w-3 h-3" />
                  <span>Telecaller 1</span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono truncate">telecaller1@gmail.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillCredentials('admin@royalepicinterior.com', 'Admin@RoyalEpic2026')}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-left transition text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px] mb-0.5">
                  <Shield className="w-3 h-3" />
                  <span>Executive Admin</span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono truncate">admin@royalepicinterior.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Scope Footer Note */}
        <div className="mt-6 text-center text-xs text-neutral-400 space-y-1">
          <p>Protected by Royal Epic Interiors Session Security & Supabase RLS.</p>
          <p className="font-mono text-[10px] text-neutral-400">Subdomain: tele.royalepicinteriors.com</p>
        </div>
      </div>
    </div>
  );
};
