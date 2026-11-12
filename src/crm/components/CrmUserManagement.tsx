import React, { useState, useEffect } from 'react';
import { CrmUser } from '../types';
import { fetchCrmUsers, getCrmAuthHeaders } from '../crmService';
import { useCrmAuth } from '../CrmAuthContext';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Mail,
  KeyRound,
  Trash2,
  Copy,
  Check,
  Phone,
  X,
  UserCheck
} from 'lucide-react';

export const CrmUserManagement: React.FC = () => {
  const { user: currentUser } = useCrmAuth();
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New staff form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Reset PIN state
  const [resetStaff, setResetStaff] = useState<CrmUser | null>(null);
  const [resetPinValue, setResetPinValue] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCrmUsers();
      if (res.error) {
        setError(res.error);
      } else {
        setUsers(res.users);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleStatusToggle = async (u: CrmUser) => {
    const nextStatus = u.status === 'active' ? 'suspended' : 'active';
    const confirmed = window.confirm(`Change status to "${nextStatus.toUpperCase()}" for ${u.name}?`);
    if (!confirmed) return;

    setError(null);
    try {
      const res = await fetch('/api/crm/users/status', {
        method: 'POST',
        headers: getCrmAuthHeaders(),
        body: JSON.stringify({ userId: u.id, status: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Staff status for "${u.name}" updated to ${nextStatus}.`);
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    }
  };

  const handleDeleteStaff = async (u: CrmUser) => {
    if (u.id === 'crm_staff_admin' || u.id === 'crm_admin_primary') {
      alert('The root primary staff account cannot be deleted.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to remove staff member "${u.name}"?`);
    if (!confirmed) return;

    setError(null);
    try {
      const res = await fetch(`/api/crm/users/${encodeURIComponent(u.id)}`, {
        method: 'DELETE',
        headers: getCrmAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Staff member "${u.name}" was successfully removed.`);
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to delete staff member');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting staff member');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPin.trim()) {
      setError('Staff Name and 4-digit PIN are required.');
      return;
    }

    if (newPin.trim().length < 4) {
      setError('PIN must be at least 4 characters long.');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const res = await fetch('/api/crm/users/create', {
        method: 'POST',
        headers: getCrmAuthHeaders(),
        body: JSON.stringify({
          name: newName.trim(),
          pin: newPin.trim(),
          email: newEmail.trim() ? newEmail.trim().toLowerCase() : undefined,
          phone: newPhone.trim() || undefined,
          role: 'staff'
        })
      });

      const data = await res.json().catch(() => ({}));
      setIsAdding(false);

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create staff member');
      } else {
        setSuccess(`Staff member "${newName}" successfully authorized with login PIN.`);
        setShowAddUserModal(false);
        setNewName('');
        setNewPin('');
        setNewEmail('');
        setNewPhone('');
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setIsAdding(false);
      setError(err.message || 'Network error creating staff member');
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStaff || !resetPinValue.trim()) return;

    if (resetPinValue.trim().length < 4) {
      setError('PIN must be at least 4 characters long.');
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      const res = await fetch('/api/crm/users/pin', {
        method: 'POST',
        headers: getCrmAuthHeaders(),
        body: JSON.stringify({
          userId: resetStaff.id,
          newPin: resetPinValue.trim()
        })
      });

      const data = await res.json();
      setIsResetting(false);

      if (res.ok && data.success) {
        setSuccess(`Individual PIN for "${resetStaff.name}" successfully updated!`);
        setResetStaff(null);
        setResetPinValue('');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update PIN');
      }
    } catch (err: any) {
      setIsResetting(false);
      setError(err.message || 'Error updating PIN');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              Staff Directory & Security PINs
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Equal Access
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Authorized staff roster with individual PINs. All active staff members have identical CRM permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-slate-600 transition cursor-pointer"
            title="Refresh Staff Roster"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-3.5 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Roster Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-0.5">
              Authorized Staff Members
            </span>
            <div className="text-sm font-bold text-[#172033]">
              {users.filter(u => u.status === 'active').length} Active Accounts
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Log in with Staff Name and individual 4-digit PIN.
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-0.5">
              Telecaller Portal Link
            </span>
            <div className="text-xs text-[#356AE6] font-mono font-medium">
              https://tele.royalepicinteriors.com
            </div>
          </div>
          <button
            onClick={() => handleCopy('https://tele.royalepicinteriors.com', 'link')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs flex items-center gap-1 cursor-pointer border border-[#E2E8F0]"
          >
            {copiedText === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText === 'link' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#356AE6]" />
            Loading authorized staff roster...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No staff accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Email / Record</th>
                  <th className="py-3 px-4">Permission Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-[#172033]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#172033] flex items-center justify-center font-bold text-xs uppercase border border-slate-200">
                          {u.name.slice(0, 1)}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          {currentUser?.id === u.id && (
                            <span className="text-[10px] text-[#356AE6] font-medium">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {u.phone || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {u.email || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <UserCheck className="w-3 h-3" />
                        <span>Staff Member</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                        u.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setResetStaff(u);
                            setResetPinValue('');
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition cursor-pointer flex items-center gap-1"
                          title="Change PIN"
                        >
                          <KeyRound className="w-3 h-3 text-slate-500" />
                          <span>Change PIN</span>
                        </button>

                        <button
                          onClick={() => handleStatusToggle(u)}
                          className={`px-2 py-1 rounded text-[11px] transition cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                          title="Toggle Active/Suspended"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>

                        {u.id !== 'crm_staff_admin' && u.id !== 'crm_admin_primary' && (
                          <button
                            onClick={() => handleDeleteStaff(u)}
                            className="p-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Remove Staff Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-md w-full p-6 text-[#172033] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h2 className="text-sm font-bold text-[#172033]">Add Authorized Staff Member</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded text-slate-400 hover:text-[#172033]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Full Staff Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Telecaller 3"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Individual Security PIN (4-6 Digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 7890"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs font-mono tracking-wider"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. staff@royalepicinterior.com"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium disabled:opacity-50"
                >
                  {isAdding ? 'Adding...' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {resetStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-sm w-full p-5 text-[#172033] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
              <h2 className="text-sm font-bold text-[#172033]">
                Update PIN for {resetStaff.name}
              </h2>
              <button
                onClick={() => setResetStaff(null)}
                className="p-1 rounded text-slate-400 hover:text-[#172033]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPin} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  New 4-Digit PIN *
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={resetPinValue}
                  onChange={(e) => setResetPinValue(e.target.value)}
                  placeholder="Enter new PIN (e.g. 4321)"
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs font-mono tracking-wider"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetStaff(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !resetPinValue.trim()}
                  className="px-4 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium disabled:opacity-50"
                >
                  {isResetting ? 'Saving...' : 'Update PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
