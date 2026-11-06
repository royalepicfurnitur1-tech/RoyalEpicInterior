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
  Sliders,
  X
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Paused (Inactive)
        </span>
      );
    }
    if (s === 'CONNECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Connected & Verified
        </span>
      );
    }
    if (s === 'ERROR') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Delivery Error
        </span>
      );
    }
    if (s === 'NOT_CONNECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Not Configured
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Pending Leads Delivery
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs text-[#172033]">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              Settings & Integrations
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Pipeline configurations, webhook endpoints, and system synchronization.
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-xs font-medium text-slate-600 transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Main Justdial Integration Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        {/* Card Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#356AE6] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              JD
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-sm font-bold text-[#172033]">Justdial Webhook Integration</h2>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated webhook ingestion pipeline for verified Bengaluru interior enquiries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleActive}
              disabled={isSavingConfig}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>{config?.isActive ? 'Pause Webhook' : 'Activate Webhook'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#E2E8F0] border-b border-[#E2E8F0] text-center">
          <div className="bg-white p-4">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Received</div>
            <div className="text-xl font-bold font-mono text-[#172033] mt-0.5 tabular-nums">{stats?.totalReceived ?? 0}</div>
          </div>

          <div className="bg-white p-4">
            <div className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Ingested Leads</div>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5 tabular-nums">{stats?.totalSuccess ?? 0}</div>
          </div>

          <div className="bg-white p-4">
            <div className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">Duplicate Inquiries</div>
            <div className="text-xl font-bold font-mono text-blue-600 mt-0.5 tabular-nums">{stats?.totalDuplicates ?? 0}</div>
          </div>

          <div className="bg-white p-4">
            <div className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">Errors / Blocked</div>
            <div className="text-xl font-bold font-mono text-rose-600 mt-0.5 tabular-nums">{stats?.totalErrors ?? 0}</div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6">
          {/* Section 1: Endpoint URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-[#172033] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#356AE6]" />
                <span>Production Webhook URL (For Justdial Team)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Method: POST</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-mono text-[#172033] focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhookUrl}
                className="px-3.5 py-2 bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Secret Token Configuration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#356AE6]" />
                <span className="text-xs font-bold text-[#172033]">Webhook Secret Authentication</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                Active Protection
              </span>
            </div>

            <form onSubmit={handleSaveConfig} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showSecret ? "text" : "password"}
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Enter secret token..."
                  className="w-full bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg px-3 py-2 text-xs font-mono text-[#172033] focus:outline-none pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg transition cursor-pointer"
              >
                <span>{isSavingConfig ? 'Saving...' : 'Update Secret'}</span>
              </button>
            </form>

            {configSuccessMsg && (
              <div className="text-xs text-emerald-700 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{configSuccessMsg}</span>
              </div>
            )}

            {configErrorMsg && (
              <div className="text-xs text-rose-700 flex items-center gap-1.5 pt-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{configErrorMsg}</span>
              </div>
            )}
          </div>

          {/* Section 3: Diagnostic Test Trigger */}
          <div className="p-4 bg-slate-50 rounded-xl border border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#356AE6]" />
                <h3 className="text-xs font-bold text-[#172033]">Simulate Inbound Justdial Lead</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sends a synthetic Justdial payload to verify ingestion and duplicate detection without calling third-party APIs.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunTest}
              disabled={isTesting}
              className="px-4 py-2 bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
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

          {testResult && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-mono space-y-1 text-emerald-800">
              <div className="flex items-center justify-between font-bold text-emerald-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Webhook Test Succeeded (HTTP 201 Created)
                </span>
                <span className="text-[10px] text-emerald-600">{new Date().toLocaleTimeString('en-IN')}</span>
              </div>
              <p>
                Created Lead: <span className="font-bold">{testResult.lead?.customer_name}</span> ({testResult.lead?.phone})
              </p>
            </div>
          )}

          {testError && (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Test Failed: {testError}
              </span>
            </div>
          )}

          {/* Section 4: Activity & Ingestion Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-[#172033]">
                  Recent Inbound Webhook Activity Logs ({logs.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const l = await fetchJustdialLogs(30);
                    setLogs(l.logs);
                  }}
                  className="text-slate-600 hover:text-[#172033] p-1 rounded text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-[#E2E8F0]">
                No webhook payloads received yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-[#E2E8F0]">
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
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3.5 py-2 text-slate-500 whitespace-nowrap text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-3.5 py-2 whitespace-nowrap">
                          {log.status === 'SUCCESS' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                              SUCCESS (201)
                            </span>
                          ) : log.status === 'DUPLICATE' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                              DUPLICATE (200)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                              {log.status} ({log.httpStatus || 400})
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-[#172033] font-medium whitespace-nowrap font-sans">
                          {log.customerName || '—'}
                        </td>
                        <td className="px-3.5 py-2 text-slate-700 whitespace-nowrap">
                          {log.phone || '—'}
                        </td>
                        <td className="px-3.5 py-2 text-slate-500 text-[11px] whitespace-nowrap">
                          {log.externalLeadId ? `#${log.externalLeadId}` : '—'}
                        </td>
                        <td className="px-3.5 py-2 text-slate-600 text-[11px] max-w-xs truncate" title={log.message}>
                          {log.message}
                        </td>
                        <td className="px-3.5 py-2 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedRawLog(log)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] transition cursor-pointer"
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
        </div>
      </div>

      {/* Raw Payload Modal */}
      {selectedRawLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">
                  Raw Webhook Payload • {selectedRawLog.id}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Received at {new Date(selectedRawLog.timestamp).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedRawLog(null)}
                className="p-1 rounded text-slate-400 hover:text-[#172033]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs">
              <pre className="bg-slate-50 p-4 rounded-lg border border-[#E2E8F0] text-slate-800 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(selectedRawLog.rawPayload || { note: 'No payload captured' }, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setSelectedRawLog(null)}
                className="px-4 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium cursor-pointer"
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
