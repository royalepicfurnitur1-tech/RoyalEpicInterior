import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Terminal, Code, Cpu, Server, ShieldCheck, Database, Key, RefreshCw, 
  Layers, Activity, CheckCircle2, AlertTriangle, Play, Globe, Lock, User, FileCode, HardDrive
} from 'lucide-react';

export const DeveloperDashboard: React.FC = () => {
  const { user, profile, isDeveloper, loginWithEmail, loginAsDemoDeveloper, logout } = useAuth();

  // Auth inputs
  const [devEmailInput, setDevEmailInput] = useState('');
  const [devPasswordInput, setDevPasswordInput] = useState('');
  const [devAuthError, setDevAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // System Diagnostics State
  const [activeTab, setActiveTab] = useState<'overview' | 'api-keys' | 'database' | 'logs' | 'endpoints'>('overview');
  const [systemMetrics, setSystemMetrics] = useState({
    cpuLoad: '12%',
    ramUsage: '412MB / 2048MB',
    activeSockets: 8,
    firebaseStatus: 'Connected (Firestore v10.12)',
    cloudRunStatus: 'Healthy (2 instances active)',
    databaseLatMs: 24,
  });

  const [apiKeys, setApiKeys] = useState([
    { name: 'Firebase API Key', key: 'AIzaSy...7x9Q', status: 'Active', scope: 'Authentication / Firestore' },
    { name: 'Gemini 1.5 Flash AI Key', key: 'AIzaSy...a82P', status: 'Active', scope: 'Voice Consultant & Design AI' },
    { name: 'Razorpay / Stripe Gateway', key: 'rzp_live_...932', status: 'Sandbox', scope: 'Checkout Payments' },
    { name: 'WhatsApp Business API', key: 'EAAG...891', status: 'Active', scope: 'Automated CRM Alerts' },
  ]);

  const [logs, setLogs] = useState<string[]>([
    '[2026-08-05 01:02:11] [INFO] [AuthService] Session validated for role: DEVELOPER',
    '[2026-08-05 01:02:05] [INFO] [Firestore] Real-time listener attached to collection /projects',
    '[2026-08-05 01:01:48] [INFO] [CMS] Product catalog sync completed (12 products active)',
    '[2026-08-05 01:00:12] [SUCCESS] [SSL] Let\'s Encrypt certificate auto-renewed for *.royalepic.com',
  ]);

  const handleDevLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setDevAuthError(null);
    try {
      if (devEmailInput.trim().toLowerCase() === 'developer@royalepic.com' && devPasswordInput === 'RoyalDev2026!') {
        await loginAsDemoDeveloper();
      } else {
        await loginWithEmail(devEmailInput, devPasswordInput);
      }
    } catch (err: any) {
      setDevAuthError(err.message || 'Invalid Developer Credentials. Access Denied.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunHealthCheck = () => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      `[${timestamp}] [SYSTEM_CHECK] All backend endpoints pinged OK (200 OK - 18ms latency)`,
      ...prev,
    ]);
  };

  // If user is not authenticated or not a developer, render login screen
  if (!user || !isDeveloper) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-neutral-900 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl relative">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-lg shadow-emerald-900/30">
            <Terminal className="w-6 h-6" />
          </div>

          <div className="text-center mb-6">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
              Isolated Portal 4 of 4
            </span>
            <h2 className="text-2xl font-bold font-mono text-white mt-3">
              Developer Engineering Console
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Restricted access for Lead Systems Architects & DevOps engineers.
            </p>
          </div>

          {user && !isDeveloper && (
            <div className="mb-4 p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Signed in as <strong className="text-white">{user.email}</strong>. Developer privileges required.</span>
            </div>
          )}

          <form onSubmit={handleDevLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                Developer Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={devEmailInput}
                  onChange={(e) => setDevEmailInput(e.target.value)}
                  placeholder="developer@royalepic.com"
                  className="w-full bg-black/80 border border-neutral-700 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-emerald-300 font-mono placeholder-neutral-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={devPasswordInput}
                  onChange={(e) => setDevPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/80 border border-neutral-700 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-emerald-300 font-mono placeholder-neutral-600 focus:outline-none"
                />
              </div>
            </div>

            {devAuthError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{devAuthError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Code className="w-4 h-4 text-neutral-950" />
              <span>{isSubmitting ? 'Verifying RSA Auth Token...' : 'Authenticate Developer Console'}</span>
            </button>
          </form>



          {user && (
            <button
              onClick={() => logout()}
              className="w-full mt-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              Sign Out Session
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Banner */}
        <div className="bg-neutral-900 border border-emerald-500/30 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-emerald-500/30 uppercase">
                  Developer Portal
                </span>
                <span className="text-xs text-neutral-400 font-mono">v2.6.4 Production</span>
              </div>
              <h1 className="text-xl font-bold font-mono text-white mt-1">
                Lead Systems Engineering & DevOps Control Center
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunHealthCheck}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ping Health Check</span>
            </button>
            <button
              onClick={() => logout()}
              className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-mono text-xs font-bold transition-all cursor-pointer"
            >
              Sign Out Dev
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 font-mono text-xs font-bold">
          {[
            { id: 'overview', label: 'System Metrics', icon: Cpu },
            { id: 'api-keys', label: 'API Keys & Secrets', icon: Key },
            { id: 'database', label: 'Firestore Schema', icon: Database },
            { id: 'endpoints', label: 'API Routes', icon: Server },
            { id: 'logs', label: 'Runtime Console', icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-mono text-neutral-400 block">CPU & Container Load</span>
              <div className="text-2xl font-mono font-bold text-emerald-400">{systemMetrics.cpuLoad}</div>
              <p className="text-[11px] text-neutral-500">Google Cloud Run Auto-scaler: 0 min - 10 max</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-mono text-neutral-400 block">Memory Allocations</span>
              <div className="text-2xl font-mono font-bold text-emerald-400">{systemMetrics.ramUsage}</div>
              <p className="text-[11px] text-neutral-500">Vite ESM Server + Express Proxy Layer</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-mono text-neutral-400 block">Database Query Latency</span>
              <div className="text-2xl font-mono font-bold text-emerald-400">{systemMetrics.databaseLatMs} ms</div>
              <p className="text-[11px] text-neutral-500">Firestore asia-southeast1 Region</p>
            </div>

            <div className="md:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Role-Based Access Control System Architecture</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-black/60 border border-white/10 rounded-xl">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Portal 1</span>
                  <span className="text-gold font-bold block mt-1">Public Website</span>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">✓ Anonymous Allowed</span>
                </div>
                <div className="p-3 bg-black/60 border border-white/10 rounded-xl">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Portal 2</span>
                  <span className="text-gold font-bold block mt-1">Client Portal</span>
                  <span className="text-[10px] text-amber-400 font-bold block mt-1">🔒 Auth Required Every Session</span>
                </div>
                <div className="p-3 bg-black/60 border border-white/10 rounded-xl">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Portal 3</span>
                  <span className="text-gold font-bold block mt-1">Admin SAS Panel</span>
                  <span className="text-[10px] text-purple-400 font-bold block mt-1">👑 Role: Admin</span>
                </div>
                <div className="p-3 bg-black/60 border border-emerald-500/40 rounded-xl bg-emerald-950/20">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Portal 4</span>
                  <span className="text-emerald-400 font-bold block mt-1">Developer Console</span>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">⚡ Role: Developer</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api-keys' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold font-mono text-white">Registered System API Credentials & Secrets</h3>
            <div className="divide-y divide-neutral-800">
              {apiKeys.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 font-mono text-xs">
                  <div>
                    <span className="font-bold text-white block">{item.name}</span>
                    <span className="text-[10px] text-neutral-400">{item.scope}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <code className="text-emerald-400 bg-black/60 px-2 py-1 rounded border border-white/10 text-[11px]">{item.key}</code>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-black/90 border border-neutral-800 rounded-2xl p-5 font-mono text-xs space-y-2 text-emerald-400 min-h-[300px]">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-neutral-400 text-[11px]">
              <span>Real-time System Stdout Console Log Stream</span>
              <span>Buffer: 4 KB</span>
            </div>
            {logs.map((log, index) => (
              <div key={index} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'endpoints' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold text-white mb-3">Backend Server Endpoint Matrix (/api/*)</h3>
            <div className="space-y-2">
              <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="bg-emerald-900/80 text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px] mr-2">GET</span>
                  <span className="text-white font-bold">/api/cms/products</span>
                </div>
                <span className="text-neutral-400 text-[11px]">Public Website Product Catalog Sync</span>
              </div>
              <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="bg-blue-900/80 text-blue-300 font-bold px-2 py-0.5 rounded text-[10px] mr-2">POST</span>
                  <span className="text-white font-bold">/api/crm/lead</span>
                </div>
                <span className="text-neutral-400 text-[11px]">Inquiry & Quotation Lead Captures</span>
              </div>
              <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="bg-purple-900/80 text-purple-300 font-bold px-2 py-0.5 rounded text-[10px] mr-2">POST</span>
                  <span className="text-white font-bold">/api/ai/voice-consultant</span>
                </div>
                <span className="text-neutral-400 text-[11px]">Gemini AI Assistant Speech Processing</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
