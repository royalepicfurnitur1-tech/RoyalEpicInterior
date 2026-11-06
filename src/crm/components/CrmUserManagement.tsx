import React, { useState, useEffect } from 'react';
import { CrmUser } from '../types';
import { fetchCrmUsers, updateCrmUserRole, getCrmAuthHeaders } from '../crmService';
import { useCrmAuth } from '../CrmAuthContext';
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Mail,
  Lock,
  Key,
  Trash2,
  Copy,
  Check,
  Phone,
  X
} from 'lucide-react';

export const CrmUserManagement: React.FC = () => {
  const { isAdmin } = useCrmAuth();
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New user form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'telecaller'>('telecaller');
  const [isAdding, setIsAdding] = useState(false);

  // Reset password state
  const [resetUser, setResetUser] = useState<CrmUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
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
      setError(err.message || 'Error fetching users');
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

  const handleRoleToggle = async (userId: string, currentRole: 'admin' | 'telecaller') => {
    if (!isAdmin) {
      setError('Only administrators can change role permissions.');
      return;
    }
    const newRole = currentRole === 'admin' ? 'telecaller' : 'admin';
    const confirmed = window.confirm(`Change role to "${newRole.toUpperCase()}" for this user?`);
    if (!confirmed) return;

    setError(null);
    const res = await updateCrmUserRole(userId, newRole);
    if (!res.success) {
      setError(res.error || 'Failed to update user role');
    } else {
      setSuccess(`User role updated to ${newRole}.`);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    }
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
        setSuccess(`User status updated to ${nextStatus}.`);
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    }
  };

  const handleDeleteUser = async (u: CrmUser) => {
    if (u.id === 'crm_admin_primary') {
      alert('The root administrator account cannot be deleted.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to permanently delete user "${u.name}" (${u.email})?`);
    if (!confirmed) return;

    setError(null);
    try {
      const res = await fetch(`/api/crm/users/${encodeURIComponent(u.id)}`, {
        method: 'DELETE',
        headers: getCrmAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`User "${u.name}" was successfully deleted.`);
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim() || !newPassword.trim()) {
      setError('Please fill in all required fields.');
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
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          phone: newPhone.trim(),
          role: newRole
        })
      });

      const data = await res.json().catch(() => ({}));
      setIsAdding(false);

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create user');
      } else {
        setSuccess(`User "${newName}" successfully created with role ${newRole}.`);
        setShowAddUserModal(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewPhone('');
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setIsAdding(false);
      setError(err.message || 'Network error creating user');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !resetPassword.trim()) return;

    setIsResetting(true);
    setError(null);

    try {
      const res = await fetch('/api/crm/users/password', {
        method: 'POST',
        headers: getCrmAuthHeaders(),
        body: JSON.stringify({
          userId: resetUser.id,
          newPassword: resetPassword.trim()
        })
      });

      const data = await res.json();
      setIsResetting(false);

      if (res.ok && data.success) {
        setSuccess(`Password for "${resetUser.name}" successfully updated!`);
        setResetUser(null);
        setResetPassword('');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setIsResetting(false);
      setError(err.message || 'Error resetting password');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-8 rounded-xl text-center text-rose-800">
        <Shield className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h2 className="text-sm font-bold uppercase tracking-wider">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          User & role management is restricted strictly to administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              User Access & Permissions
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Manage approved telecallers and administrators with granular CRM access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-slate-600 transition cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-3.5 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Telecaller Account</span>
          </button>
        </div>
      </div>

      {/* Portal Status & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-0.5">
              Portal Access Summary
            </span>
            <div className="text-sm font-bold text-[#172033]">
              {users.filter(u => u.status === 'active' && u.role === 'telecaller').length} Active Telecaller Accounts
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Strict authentication required. No autofill credentials permitted.
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-0.5">
              Direct Subdomain Link
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

      {/* Users Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#356AE6]" />
            Loading CRM user registry...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No CRM users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Work Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-[#172033]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 text-[#172033] flex items-center justify-center font-bold text-xs uppercase border border-slate-200">
                          {u.name.slice(0, 1)}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {u.phone || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        u.role === 'admin'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        <span>{u.role === 'admin' ? 'Administrator' : 'Telecaller'}</span>
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
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition cursor-pointer"
                          title="Toggle Role"
                        >
                          Make {u.role === 'admin' ? 'Telecaller' : 'Admin'}
                        </button>

                        <button
                          onClick={() => {
                            setResetUser(u);
                            setResetPassword('');
                          }}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition cursor-pointer"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
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

                        {u.id !== 'crm_admin_primary' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete User"
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-md w-full p-6 text-[#172033] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h2 className="text-sm font-bold text-[#172033]">Add Approved CRM User</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded text-slate-400 hover:text-[#172033]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Telecaller 2"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. telecaller2@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs"
                >
                  <option value="telecaller">Telecaller (Manual Lead Entry, Call Logging, Follow-ups)</option>
                  <option value="admin">Administrator (Full Access & User Management)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs disabled:opacity-50"
                >
                  {isAdding ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-sm w-full p-6 text-[#172033] shadow-xl">
            <h2 className="text-sm font-bold text-[#172033] mb-1">Reset Account Password</h2>
            <p className="text-xs text-slate-500 mb-3">
              Set a new secure password for <strong className="text-[#172033]">{resetUser.name}</strong> ({resetUser.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs disabled:opacity-50"
                >
                  {isResetting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
