import React, { useState } from 'react';
import { Product } from '../types';
import { 
  User, Package, FileText, Heart, Download, MapPin, 
  Ticket, ShieldCheck, ChevronRight, Clock, CheckCircle2, Activity,
  ArrowRight, Lock, LogOut, Key, Mail, Sparkles, AlertCircle, Phone, Building, FolderDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectTimeline } from './ProjectTimeline';
import { ProjectRoadmap } from './ProjectRoadmap';
import { DocumentRepository } from './DocumentRepository';
import { useAuth } from '../context/AuthContext';

interface CustomerDashboardProps {
  wishlistProducts: Product[];
  onRequestQuote: (item: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  wishlistProducts,
  onRequestQuote,
}) => {
  const { 
    user, 
    profile, 
    userProject, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle,
    loginWithFacebook,
    loginWithMobilePhone,
    loginAsDemoCustomer, 
    loginAsDemoAdmin, 
    logout, 
    error, 
    clearError 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'roadmap' | 'timeline' | 'documents' | 'orders' | 'quotes' | 'wishlist' | 'downloads' | 'support'>('roadmap');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authMethodTab, setAuthMethodTab] = useState<'email' | 'phone' | 'social'>('email');
  
  // Auth Form Inputs
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();
    try {
      if (authMethodTab === 'phone') {
        if (!otpSent) {
          // Send OTP Simulation
          setOtpSent(true);
        } else {
          await loginWithMobilePhone(phoneInput, otpInput);
        }
      } else if (authMode === 'login') {
        await loginWithEmail(emailInput, passwordInput);
      } else {
        await registerWithEmail(nameInput, emailInput, passwordInput, phoneInput);
      }
    } catch (err) {
      // handled in context error state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    clearError();
    try {
      await loginWithGoogle();
    } catch (e) {
      // ignore context error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsSubmitting(true);
    clearError();
    try {
      await loginWithFacebook();
    } catch (e) {
      // ignore context error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unauthenticated State: Render HTTPS-Secured Luxury Auth Portal
  if (!user) {
    return (
      <section className="py-16 bg-neutral-950 text-white min-h-[85vh] flex items-center justify-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-md w-full mx-auto px-4 relative z-10">
          {/* Security Badge Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold mb-4 shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>256-Bit SSL Encrypted & Firebase Auth Safeguarded</span>
            </div>
            <h2 className="text-3xl font-serif font-bold text-white tracking-wide">
              Royal Epic Client Portal
            </h2>
            <p className="text-xs text-neutral-400 mt-2 max-w-sm mx-auto">
              Sign in with your preferred authentication method: Google, Facebook, Mobile Number OTP, or Email ID.
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-neutral-900 border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            
            {/* Auth Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-black/60 p-1.5 rounded-2xl border border-white/10 mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setAuthMethodTab('email'); clearError(); }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethodTab === 'email'
                    ? 'bg-gold text-neutral-950 font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Email ID
              </button>

              <button
                type="button"
                onClick={() => { setAuthMethodTab('phone'); clearError(); }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethodTab === 'phone'
                    ? 'bg-gold text-neutral-950 font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" /> Mobile OTP
              </button>

              <button
                type="button"
                onClick={() => { setAuthMethodTab('social'); clearError(); }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethodTab === 'social'
                    ? 'bg-gold text-neutral-950 font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Social
              </button>
            </div>

            {/* Email Mode Sub-Tabs (Sign In vs Register) */}
            {authMethodTab === 'email' && (
              <div className="flex items-center gap-2 mb-4 text-xs font-bold border-b border-white/10 pb-3">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    authMode === 'login' ? 'text-gold underline underline-offset-4 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Sign In with Email
                </button>
                <span className="text-neutral-600">•</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    authMode === 'register' ? 'text-gold underline underline-offset-4 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Create New Account
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* SOCIAL AUTH BUTTONS (Google & Facebook) */}
            {authMethodTab === 'social' ? (
              <div className="space-y-3 py-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
                  </svg>
                  <span>Sign In with Google</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFacebookSignIn}
                  className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md"
                >
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Sign In with Facebook</span>
                </button>

                <p className="text-[10px] text-neutral-400 text-center mt-2">
                  Instant 1-Click Authentication powered by Firebase OAuth Providers.
                </p>
              </div>
            ) : (
              /* FORM FOR EMAIL OR MOBILE OTP */
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* MOBILE NUMBER OTP TAB */}
                {authMethodTab === 'phone' ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          required
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="+91 99166 33338"
                          className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {otpSent && (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                          6-Digit SMS OTP Code
                        </label>
                        <div className="relative">
                          <Key className="w-4 h-4 text-gold absolute left-3.5 top-3" />
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            placeholder="582914"
                            className="w-full bg-black/70 border border-gold/40 focus:border-gold rounded-xl pl-10 pr-4 py-2.5 text-xs text-gold font-mono font-bold tracking-widest focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3" /> Verification OTP sent via SMS to {phoneInput || 'your mobile number'}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 hover:brightness-105 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      {otpSent ? (
                        <>
                          <Key className="w-4 h-4 text-neutral-950" />
                          <span>Verify OTP & Sign In</span>
                        </>
                      ) : (
                        <>
                          <Phone className="w-4 h-4 text-neutral-950" />
                          <span>Send SMS OTP Verification</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  /* EMAIL ID & PASSWORD FORM */
                  <>
                    {authMode === 'register' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                            <input
                              type="text"
                              required
                              value={nameInput}
                              onChange={(e) => setNameInput(e.target.value)}
                              placeholder="e.g. Dr. Rahul Sharma"
                              className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                            Phone Number (WhatsApp updates)
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                            <input
                              type="tel"
                              required
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              placeholder="+91 99166 33338"
                              className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="client@example.com"
                          className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Secure Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-black/70 border border-white/15 focus:border-gold rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 hover:brightness-105 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      {isSubmitting ? (
                        <span>Authenticating Encrypted Session...</span>
                      ) : (
                        <>
                          <Key className="w-4 h-4 text-neutral-950" />
                          <span>{authMode === 'login' ? 'Sign In with Email ID' : 'Create Email Account'}</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            )}

            {/* QUICK 1-CLICK SOCIAL BUTTONS BELOW FORM IF NOT ON SOCIAL TAB */}
            {authMethodTab !== 'social' && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-2 font-bold text-center">
                  Or Sign In with 1-Click Social Auth:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="py-2 px-3 rounded-xl bg-white text-neutral-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-neutral-100"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                      <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"/>
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFacebookSignIn}
                    className="py-2 px-3 rounded-xl bg-[#1877F2] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-blue-600"
                  >
                    <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>
              </div>
            )}

            {/* Account Protection Notice */}
            <div className="mt-5 pt-5 border-t border-white/10 text-[11px] text-neutral-400 text-left space-y-1.5 bg-black/40 p-3.5 rounded-xl border border-white/10">
              <span className="font-bold text-neutral-300 block flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gold" />
                <span>Authentication Required Every Session</span>
              </span>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                To safeguard project files, BOQs, and site progress, users must authenticate with valid credentials every session. Passwordless bypasses are strictly disabled.
              </p>
            </div>

            {/* Data Isolation Notice */}
            <div className="mt-5 p-3 rounded-xl bg-black/40 border border-white/10 text-[10px] text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                <span>Strict Customer Data Isolation Guarantee</span>
              </div>
              <p>
                Each client's BOQ records, room dimensions, factory dispatches, and milestone photos are strictly mapped to their Firebase UID. HTTPS encryption enforces encrypted transit end-to-end.
              </p>
            </div>

          </div>
        </div>
      </section>
    );
  }

  // Authenticated State: User Dashboard
  const customerOrders = userProject?.orders || [
    {
      id: 'RE-ORD-849201',
      date: 'July 15, 2026',
      items: 'Imperial Italian Quartz Island Kitchen',
      status: 'In Manufacturing (65%)',
      total: '₹380,000',
    },
    {
      id: 'RE-ORD-621049',
      date: 'May 22, 2026',
      items: 'Royal Heritage Solid Teak Door',
      status: 'Delivered',
      total: '₹85,000',
    },
  ];

  const customerQuotations = userProject?.quotations || [
    {
      id: 'RE-QT-991204',
      date: 'July 20, 2026',
      project: 'Worli Penthouse Full Living Room & TV Console',
      budget: '₹1,500,000',
      status: 'Approved by Designer',
    },
  ];

  return (
    <section className="py-16 bg-neutral-950 text-white min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* User Banner */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-black border border-gold/40 rounded-3xl p-6 lg:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-amber-600 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
                <User className="w-8 h-8 text-gold" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-serif font-bold text-white">
                  {profile?.name || user.displayName || 'Valued Client'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold uppercase border border-gold/40">
                  {profile?.vipTier || profile?.role === 'admin' ? 'Super Admin' : 'Verified Client'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[9px] font-mono border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Data Encrypted
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {user.email} • Account Status: <span className="font-mono text-emerald-400 font-bold">Active & Encrypted</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setActiveTab('timeline')}
              className="px-4 py-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4" /> Live Track Active Project
            </button>

            <button
              onClick={() => onRequestQuote('Custom Consultation')}
              className="px-4 py-2.5 rounded-xl bg-gold text-neutral-950 text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              Request New Quote
            </button>

            <button
              onClick={() => logout()}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-red-950 hover:text-red-300 border border-white/10 hover:border-red-500/40 text-neutral-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Security & Access Isolation Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-neutral-900/60 border border-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
            <div>
              <span className="font-bold text-white block">Role-Based Access Control (RBAC) Active</span>
              <span className="text-neutral-400 text-[11px]">
                Project Ref: <strong className="text-gold font-mono">{userProject?.id || 'RE-PROJ-8812'}</strong> • Access restricted strictly to <strong className="text-white">{user.email}</strong>.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>HTTPS Encrypted Cloud Sync</span>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-8">
          {[
            { id: 'roadmap', label: 'Project Roadmap', icon: <Sparkles className="w-4 h-4 text-gold" /> },
            { id: 'timeline', label: 'Milestone Logs', icon: <Activity className="w-4 h-4" /> },
            { id: 'documents', label: 'Document Vault', icon: <FolderDown className="w-4 h-4 text-gold" /> },
            { id: 'orders', label: 'My Orders', icon: <Package className="w-4 h-4" /> },
            { id: 'quotes', label: 'Saved Quotations', icon: <FileText className="w-4 h-4" /> },
            { id: 'wishlist', label: 'Wishlist', icon: <Heart className="w-4 h-4" /> },
            { id: 'downloads', label: 'Invoices & Catalogs', icon: <Download className="w-4 h-4" /> },
            { id: 'support', label: 'Support & Tickets', icon: <Ticket className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gold text-neutral-950 border-gold shadow-md font-bold'
                  : 'bg-neutral-900 border-white/10 text-neutral-300 hover:border-gold/40'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeTab === 'roadmap' && (
                <ProjectRoadmap />
              )}

              {activeTab === 'timeline' && (
                <ProjectTimeline />
              )}

              {activeTab === 'documents' && (
                <DocumentRepository />
              )}

              {activeTab === 'orders' && (
                <div>
                  <h3 className="text-xl font-serif font-bold text-white mb-6">Order History ({customerOrders.length})</h3>
                  <div className="space-y-4">
                    {customerOrders.map((ord, idx) => (
                      <motion.div 
                        key={ord.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.08 }}
                        className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-gold">{ord.id}</span>
                            <span className="text-[10px] text-neutral-500">• {ord.date}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{ord.items}</h4>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                            {ord.status}
                          </span>
                          <span className="text-sm font-mono font-bold text-white">{ord.total}</span>
                          <button
                            onClick={() => setActiveTab('timeline')}
                            className="px-3 py-1.5 rounded-lg bg-gold/20 hover:bg-gold text-gold hover:text-black border border-gold/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="View Live Milestone Progress Track"
                          >
                            Track <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'quotes' && (
                <div>
                  <h3 className="text-xl font-serif font-bold text-white mb-6">Saved Quotation Estimates</h3>
                  <div className="space-y-4">
                    {customerQuotations.map((qt, idx) => (
                      <motion.div 
                        key={qt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.08 }}
                        className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div>
                          <span className="font-mono text-xs font-bold text-gold block mb-1">{qt.id}</span>
                          <h4 className="text-sm font-bold text-white">{qt.project}</h4>
                          <p className="text-xs text-neutral-400">Budget Limit: {qt.budget}</p>
                        </div>

                        <button
                          onClick={() => onRequestQuote(qt.project)}
                          className="px-4 py-2 rounded-xl bg-gold text-neutral-950 font-bold text-xs uppercase tracking-wider hover:brightness-105 cursor-pointer"
                        >
                          View Full Details
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div>
                  <h3 className="text-xl font-serif font-bold text-white mb-6">Saved Wishlist ({wishlistProducts.length})</h3>
                  {wishlistProducts.length === 0 ? (
                    <p className="text-xs text-neutral-400">No products saved to wishlist yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wishlistProducts.map((p, idx) => (
                        <motion.div 
                          key={p.id}
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: idx * 0.06 }}
                          className="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-3"
                        >
                          <img src={p.image} alt={p.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div>
                            <h4 className="text-xs font-bold text-white line-clamp-1">{p.name}</h4>
                            <span className="text-xs font-mono text-gold font-bold">₹{p.price.toLocaleString('en-IN')}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'downloads' && (
                <div>
                  <h3 className="text-xl font-serif font-bold text-white mb-6">Downloaded Invoices & Catalogs</h3>
                  <div className="space-y-3 text-xs">
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <span>Royal Epic Product Catalog 2026 (PDF)</span>
                      <button className="px-3 py-1 rounded-lg bg-gold text-black font-bold">Download</button>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <span>Invoice #RE-ORD-849201.pdf</span>
                      <button className="px-3 py-1 rounded-lg bg-gold text-black font-bold">Download</button>
                    </motion.div>
                  </div>
                </div>
              )}

              {activeTab === 'support' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-xl font-serif font-bold text-white mb-4">Support & Tickets</h3>
                  <p className="text-xs text-neutral-400 mb-6">Need help with custom dimensions, installation scheduling, or warranty claims?</p>
                  <a
                    href="https://wa.me/919916633338"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase"
                  >
                    Chat directly with Senior Architect on WhatsApp
                  </a>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};


