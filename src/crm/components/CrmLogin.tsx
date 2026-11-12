import React, { useState, useEffect } from 'react';
import { useCrmAuth } from '../CrmAuthContext';
import { Shield, KeyRound, User, AlertCircle, ArrowLeft, Check, Lock } from 'lucide-react';

interface CrmLoginProps {
  onBackToWebsite?: () => void;
}

interface StaffOption {
  id: string;
  name: string;
  phone?: string;
}

export const CrmLogin: React.FC<CrmLoginProps> = ({ onBackToWebsite }) => {
  const { login, error } = useCrmAuth();
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [customName, setCustomName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/crm/auth/staff-list')
      .then(res => res.json())
      .then(data => {
        if (mounted && data?.staff && Array.isArray(data.staff)) {
          setStaffList(data.staff);
          if (data.staff.length > 0) {
            setSelectedStaffName(data.staff[0].name);
          }
        }
      })
      .catch(() => {
        // Fallback default roster
        if (mounted) {
          setStaffList([
            { id: 'crm_staff_admin', name: 'Royal Epic Admin' },
            { id: 'crm_staff_executive', name: 'Royal Epic Executive' },
            { id: 'crm_staff_telecaller1', name: 'Telecaller 1' },
            { id: 'crm_staff_telecaller2', name: 'Telecaller 2' }
          ]);
          setSelectedStaffName('Royal Epic Admin');
        }
      })
      .finally(() => {
        if (mounted) setLoadingStaff(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = (selectedStaffName === '__other__' ? customName : selectedStaffName).trim();
    if (!finalName || !pin.trim()) return;

    setIsSubmitting(true);
    await login(finalName, pin.trim());
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
            Staff & Telecaller CRM Console
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
            Authorized staff access. Log in with your staff name and personal PIN.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Staff Member Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Select Your Staff Name
              </label>

              {/* Quick Select Grid for Recognized Staff */}
              {staffList.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {staffList.map((st) => {
                    const isSelected = selectedStaffName === st.name;
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => {
                          setSelectedStaffName(st.name);
                          setCustomName('');
                        }}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-[#356AE6] bg-blue-50/60 text-[#356AE6] font-semibold ring-1 ring-[#356AE6]'
                            : 'border-[#E2E8F0] bg-slate-50/60 hover:bg-slate-100 text-slate-700 font-normal'
                        }`}
                      >
                        <span className="truncate">{st.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#356AE6] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Or manual entry */}
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={selectedStaffName === '__other__' ? customName : selectedStaffName}
                  onChange={(e) => {
                    setSelectedStaffName('__other__');
                    setCustomName(e.target.value);
                  }}
                  placeholder="Or enter authorized staff name"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Individual PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600">
                  Individual Security PIN
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPin ? 'Hide PIN' : 'Show PIN'}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  maxLength={10}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your 4-digit PIN (e.g. 1234)"
                  autoComplete="current-password"
                  autoFocus
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] tracking-widest placeholder-slate-400 focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || (!selectedStaffName && !customName) || !pin}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Log In to CRM Workspace</span>
                </>
              )}
            </button>
          </form>

          {/* Quick reference note */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Authorized staff roster only</span>
            <span className="font-mono text-slate-500">PIN: 4 digits</span>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="mt-6 text-center text-[11px] text-slate-400 space-y-0.5">
          <p>Royal Epic Interiors — Bangalore Telecaller CRM.</p>
          <p className="font-mono text-slate-400">All staff members have full CRM access.</p>
        </div>
      </div>
    </div>
  );
};
