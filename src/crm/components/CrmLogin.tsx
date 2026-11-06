import React, { useState } from 'react';
import { useCrmAuth } from '../CrmAuthContext';
import { Phone, Lock, Mail, Shield, AlertCircle, ArrowLeft } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#172033] relative overflow-hidden font-sans antialiased">
      {/* Top Bar with Back to Website */}
      {onBackToWebsite && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onBackToWebsite}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#172033] bg-white px-3.5 py-2 rounded-lg border border-[#E2E8F0] shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Website</span>
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#356AE6] text-white shadow-xs mb-3 font-bold text-base">
            RE
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#172033]">
            Royal Epic Interiors
          </h2>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            Telecaller CRM & Sales Console
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
            Authorized workspace for telecallers and sales operations.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  autoComplete="email"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Sign In to CRM</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Note */}
        <div className="mt-6 text-center text-[11px] text-slate-400 space-y-0.5">
          <p>Protected by Royal Epic Interiors Session Security & Supabase RLS.</p>
          <p className="font-mono text-slate-400">Host: tele.royalepicinteriors.com</p>
        </div>
      </div>
    </div>
  );
};
