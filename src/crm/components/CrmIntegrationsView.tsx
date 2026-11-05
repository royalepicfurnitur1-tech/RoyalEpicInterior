import React, { useState, useEffect } from 'react';
import { 
  JustdialConfig, 
  JustdialLog, 
  JustdialStats 
} from '../types';
import { 
  fetchJustdialIntegrationStatus, 
  saveJustdialConfig, 
  triggerJustdialTest, 
  fetchJustdialLogs, 
  clearJustdialLogsApi 
} from '../crmService';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  RefreshCw, 
  Key, 
  Eye, 
  EyeOff, 
  Play, 
  Trash2, 
  FileText, 
  ExternalLink,
  ShieldAlert,
  Server,
  Layers,
  PhoneCall,
  Sliders
} from 'lucide-react';

export const CrmIntegrationsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<JustdialConfig | null>(null);
  const [stats, setStats] = useState<JustdialStats | null>(null);
  const [logs, setLogs] = useState<JustdialLog[]>([]);
  const [webhookUrl, setWebhookUrl] = useState<string>('');

  // Editing Secret Token State
  const [secretInput, setSecretInput] = useState<string>('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);
  const [configErrorMsg, setConfigErrorMsg] = useState<string | null>(null);

  // Testing Webhook State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Logs Modal State
  const [selectedRawLog, setSelectedRawLog] = useState<JustdialLog | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    const res = await fetchJustdialIntegrationStatus();
    if (res.success) {
      setConfig(res.config || null);
      setStats(res.stats || null);
      setLogs(res.recentLogs || []);
      setWebhookUrl(res.webhookUrl || `${window.location.origin}/api/integrations/justdial/webhook`);
      setSecretInput(res.config?.webhookSecret || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccessMsg(null);
    setConfigErrorMsg(null);
    setIsSavingConfig(true);

    const res = await saveJustdialConfig({
      webhookSecret: secretInput.trim(),
      isActive: config?.isActive ?? true
    });

    if (res.success && res.config) {
      setConfig(res.config);
      setConfigSuccessMsg('Webhook secret token updated successfully.');
      setTimeout(() => setConfigSuccessMsg(null), 3500);
    } else {
      setConfigErrorMsg(res.error || 'Failed to update configuration.');
    }
    setIsSavingConfig(false);
  };

  const handleToggleActive = async () => {
    if (!config) return;
    const nextState = !config.isActive;
    setIsSavingConfig(true);
    const res = await saveJustdialConfig({
      isActive: nextState
    });
    if (res.success && res.config) {
      setConfig(res.config);
    }
    setIsSavingConfig(false);
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    const res = await triggerJustdialTest();
    if (res.success) {
      setTestResult(res.testResult);
      if (res.stats) setStats(res.stats);
      if (res.config) setConfig(res.config);
      // Reload logs to show new test record
      const logsRes = await fetchJustdialLogs(25);
      setLogs(logsRes.logs);
    } else {
      setTestError(res.error || 'Simulated test lead failed.');
    }
    setIsTesting(false);
  };

  const handleClearLogs = async () => {
    if (confirm('Clear all Justdial webhook activity logs?')) {
      const res = await clearJustdialLogsApi();
      if (res.success) {
        setLogs([]);
        setStats(prev => prev ? { ...prev, totalReceived: 0, totalErrors: 0, totalDuplicates: 0 } : null);
      }
    }
  };

  const sampleJustdialPayload = {
    leadid: "JD9880123",
    name: "Sunil Kumar",
    mobile: "9845011223",
    alternate_mobile: "+91 80 4123 4567",
    email: "sunil.k@gmail.com",
    category: "Turnkey Home Interior",
    city: "Bengaluru (Thanisandra)",
    budget: "₹25 - 35 Lakhs",
    requirement: "3BHK modern interior with acrylic modular kitchen and master bedroom walk-in closet.",
    date: "2026-11-05 11:30:00"
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleJustdialPayload, null, 2));
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const getStatusBadge = () => {
    const s = stats?.status || config?.status || 'PENDING_SETUP';
    if (!config?.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
          <span className="w-2 h-2 rounded-full bg-neutral-500" />
          PAUSED (INACTIVE)
        </span>
      );
    }
    if (s === 'CONNECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-600/50 shadow-sm shadow-emerald-900/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          CONNECTED & VERIFIED
        </span>
      );
    }
    if (s === 'ERROR') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-950/80 text-red-400 border border-red-600/50">
          <XCircle className="w-3.5 h-3.5 text-red-400" />
          ERROR (DELIVERY ISSUE)
        </span>
      );
    }
    if (s === 'NOT_CONNECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          NOT CONFIGURED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-600/50">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        PENDING SETUP (AWAITING LEADS)
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold font-serif text-white tracking-wide">
              Lead Source Integrations
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Automated webhook pipelines feeding enquiries into Royal Epic Telecaller CRM and mobile application.
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Main Justdial Integration Card */}
      <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
        {/* Card Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-850 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg shadow-md border border-orange-400/40 shrink-0">
              JD
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base font-bold text-white">Justdial Lead Ingestion Webhook</h2>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Real-time automated webhook receiver for Justdial verified Bengaluru home & commercial interior inquiries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleActive}
              disabled={isSavingConfig}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                config?.isActive
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{config?.isActive ? 'Pause Webhook' : 'Activate Webhook'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-800 border-b border-neutral-800 text-center">
          <div className="bg-neutral-950 p-4">
            <div className="text-[10px] font-mono uppercase text-neutral-400">Total Received</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{stats?.totalReceived ?? 0}</div>
          </div>

          <div className="bg-neutral-950 p-4">
            <div className="text-[10px] font-mono uppercase text-emerald-400">Successfully Ingested</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{stats?.totalSuccess ?? 0}</div>
          </div>

          <div className="bg-neutral-950 p-4">
            <div className="text-[10px] font-mono uppercase text-blue-400">Duplicate Inquiries Merged</div>
            <div className="text-xl font-bold font-mono text-blue-400 mt-0.5">{stats?.totalDuplicates ?? 0}</div>
          </div>

          <div className="bg-neutral-950 p-4">
            <div className="text-[10px] font-mono uppercase text-red-400">Validation / Auth Errors</div>
            <div className="text-xl font-bold font-mono text-red-400 mt-0.5">{stats?.totalErrors ?? 0}</div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Section 1: Endpoint URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-neutral-300 font-bold flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                <span>Production Webhook URL (Provide this to Justdial)</span>
              </label>
              <span className="text-[10px] font-mono text-neutral-400">HTTP Method: POST</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-300 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhookUrl}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs rounded-xl transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">
              Accepts JSON or x-www-form-urlencoded POST requests from Justdial's lead delivery servers.
            </p>
          </div>

          {/* Section 2: Secret Token Configuration */}
          <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold font-mono uppercase text-white">Webhook Secret Token Authentication</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                Active Protection
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Justdial must include this token in their request header (<code className="text-amber-300 font-mono">x-justdial-token: &lt;token&gt;</code>) or as query parameter (<code className="text-amber-300 font-mono">?token=&lt;token&gt;</code>).
            </p>

            <form onSubmit={handleSaveConfig} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showSecret ? "text" : "password"}
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Enter secret token..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs rounded-lg border border-neutral-600 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isSavingConfig ? 'Saving...' : 'Update Secret'}</span>
              </button>
            </form>

            {configSuccessMsg && (
              <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{configSuccessMsg}</span>
              </div>
            )}

            {configErrorMsg && (
              <div className="text-xs font-mono text-red-400 flex items-center gap-1.5 pt-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>{configErrorMsg}</span>
              </div>
            )}
          </div>

          {/* Section 3: Diagnostic Test Trigger */}
          <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono uppercase text-white">Simulate Inbound Justdial Lead</h3>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Sends a synthetic Justdial payload with a Bengaluru customer inquiry to test end-to-end ingestion, duplicate filtering, and database synchronization.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunTest}
              disabled={isTesting}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold font-mono text-xs rounded-xl shadow-lg shadow-amber-500/10 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating Webhook...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Send Test Lead</span>
                </>
              )}
            </button>
          </div>

          {/* Test Result Banner */}
          {testResult && (
            <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Webhook Test Succeeded (HTTP 201 Created)
                </span>
                <span className="text-[10px] text-neutral-400">{new Date().toLocaleTimeString('en-IN')}</span>
              </div>
              <p className="text-neutral-300">
                Created Lead: <span className="text-white font-bold">{testResult.lead?.customer_name}</span> ({testResult.lead?.phone}) • CRM ID: <span className="text-amber-400 font-bold">{testResult.lead_id}</span>
              </p>
              <div className="text-[11px] text-neutral-400">
                Service: {testResult.lead?.interested_service} • Locality: {testResult.lead?.city}
              </div>
            </div>
          )}

          {testError && (
            <div className="p-4 bg-red-950/40 rounded-xl border border-red-800 text-xs font-mono space-y-1">
              <span className="text-red-400 font-bold flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Test Failed: {testError}
              </span>
            </div>
          )}

          {/* Section 4: Activity & Ingestion Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  Recent Inbound Webhook Activity Logs ({logs.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const l = await fetchJustdialLogs(30);
                    setLogs(l.logs);
                  }}
                  className="text-neutral-400 hover:text-white p-1 rounded text-xs font-mono flex items-center gap-1"
                  title="Refresh activity logs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-neutral-500 hover:text-red-400 p-1 rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
                    title="Clear logs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-neutral-400 bg-neutral-950/40 rounded-xl border border-neutral-800/60">
                No webhook payloads received yet. Run a simulated test lead above or provide the webhook URL to Justdial.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
                    <tr>
                      <th className="px-3.5 py-2.5">Time</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5">Lead / Caller</th>
                      <th className="px-3.5 py-2.5">Mobile</th>
                      <th className="px-3.5 py-2.5">Ext ID</th>
                      <th className="px-3.5 py-2.5">Summary Message</th>
                      <th className="px-3.5 py-2.5 text-right">Raw Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 bg-neutral-950/60">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-900/60 transition">
                        <td className="px-3.5 py-2 text-neutral-400 whitespace-nowrap text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-3.5 py-2 whitespace-nowrap">
                          {log.status === 'SUCCESS' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                              SUCCESS (201)
                            </span>
                          ) : log.status === 'DUPLICATE' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                              DUPLICATE (200)
                            </span>
                          ) : log.status === 'AUTH_ERROR' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-400 border border-red-800 font-bold">
                              AUTH FAILED (401)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                              {log.status} ({log.httpStatus})
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-white font-medium whitespace-nowrap">
                          {log.customerName || '—'}
                        </td>
                        <td className="px-3.5 py-2 text-amber-300 whitespace-nowrap">
                          {log.phone || '—'}
                        </td>
                        <td className="px-3.5 py-2 text-neutral-400 text-[11px] whitespace-nowrap">
                          {log.externalLeadId ? `#${log.externalLeadId}` : '—'}
                        </td>
                        <td className="px-3.5 py-2 text-neutral-300 text-[11px] max-w-xs truncate" title={log.message}>
                          {log.message}
                        </td>
                        <td className="px-3.5 py-2 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedRawLog(log)}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] transition cursor-pointer"
                          >
                            View JSON
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 5: Integration Reference for Justdial Technical Onboarding */}
          <div className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Justdial Webhook Technical Specifications & Onboarding Copy</span>
              </span>
              <button
                type="button"
                onClick={handleCopySample}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
              >
                {copiedSample ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSample ? 'Sample Copied!' : 'Copy Sample Payload'}</span>
              </button>
            </div>

            <div className="text-xs text-neutral-400 space-y-2">
              <p>
                Provide the following details to your Justdial Account Executive / Campaign Technical Team to start instant lead delivery:
              </p>
              <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 text-[11px] font-mono space-y-1 text-neutral-300">
                <div><strong className="text-white">Webhook URL:</strong> {webhookUrl}</div>
                <div><strong className="text-white">Method:</strong> POST</div>
                <div><strong className="text-white">Header:</strong> x-justdial-token: {config?.webhookSecret || 're_jd_live_sec_2026'}</div>
                <div><strong className="text-white">Payload Format:</strong> application/json or application/x-www-form-urlencoded</div>
                <div><strong className="text-white">Expected Responses:</strong> 200 OK / 201 Created</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Payload Modal */}
      {selectedRawLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono font-bold text-white">
                  Raw Webhook Payload • {selectedRawLog.id}
                </h3>
                <p className="text-[10px] font-mono text-neutral-400">
                  Received at {new Date(selectedRawLog.timestamp).toLocaleString('en-IN')} from {selectedRawLog.ip || 'Remote IP'}
                </p>
              </div>
              <button
                onClick={() => setSelectedRawLog(null)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs">
              <pre className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-amber-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(selectedRawLog.rawPayload || { note: 'No payload captured' }, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setSelectedRawLog(null)}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmIntegrationsView;
