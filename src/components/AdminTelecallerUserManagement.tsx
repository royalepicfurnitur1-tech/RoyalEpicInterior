import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  UserCheck, 
  Lock, 
  Mail, 
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';

interface CrmUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'telecaller';
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export const AdminTelecallerUserManagement: React.FC = () => {
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New user modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'telecaller' | 'admin'>('telecaller');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password reset modal state
  const [resetUser, setResetUser] = useState<CrmUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-secret': 'RoyalEpicAdmin2026',
    'x-crm-user-id': 'crm_admin_primary'
  });

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crm/users', {
        headers: getAdminHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to fetch telecaller accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching telecaller accounts');
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

  const handleRoleToggle = async (user: CrmUser) => {
    const nextRole = user.role === 'admin' ? 'telecaller' : 'admin';
    const confirmMsg = `Are you sure you want to change "${user.name}" role to ${nextRole.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    setError(null);
    try {
      const res = await fetch('/api/crm/users/role', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ userId: user.id, role: nextRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Role updated to ${nextRole} for ${user.name}`);
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update role');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating role');
    }
  };

  const handleStatusToggle = async (user: CrmUser) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} access for "${user.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    setError(null);
    try {
      const res = await fetch('/api/crm/users/status', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ userId: user.id, status: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Account status changed to ${nextStatus} for ${user.name}`);
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    }
  };

  const handleDeleteUser = async (user: CrmUser) => {
    if (user.id === 'crm_admin_primary') {
      alert('The root primary administrator account cannot be deleted.');
      return;
    }

    const confirmMsg = `Are you sure you want to permanently delete telecaller account for "${user.name}" (${user.email})? They will immediately lose access to the Telecaller CRM.`;
    if (!window.confirm(confirmMsg)) return;

    setError(null);
    try {
      const res = await fetch(`/api/crm/users/${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`User "${user.name}" successfully deleted.`);
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
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setError('Name, work email, and password are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/crm/users/create', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          phone: newPhone.trim(),
          role: newRole
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok && data.success) {
        setSuccess(`Account for "${newName}" successfully created with role ${newRole.toUpperCase()}! They can now log in at https://tele.royalepicinteriors.com`);
        setShowCreateModal(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewPhone('');
        loadUsers();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Error creating user');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !resetPassword.trim()) return;

    setIsResetting(true);
    setError(null);

    try {
      const res = await fetch('/api/crm/users/password', {
        method: 'POST',
        headers: getAdminHeaders(),
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

  const openTelecallerWebsite = () => {
    const isProduction = window.location.hostname.includes('royalepicinterior');
    if (isProduction) {
      window.open('https://tele.royalepicinteriors.com', '_blank');
    } else {
      window.open(`${window.location.origin}/?subdomain=tele`, '_blank');
    }
  };

  return (
    <div className="space-y-6 text-white font-sans">
      {/* Top Header Card */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                Telecaller CRM Access Management
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Subdomain: tele.royalepicinteriors.com
              </span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
              Telecaller Staff & Role Authorization
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Create, view, manage, and grant direct login permissions for telecalling sales executives. 
              Staff accounts created here can immediately log into the Telecaller CRM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openTelecallerWebsite}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/15 text-xs font-bold transition shadow-md cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Launch Telecaller Website</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Telecaller Account</span>
            </button>

            <button
              onClick={loadUsers}
              disabled={loading}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-white/10 transition cursor-pointer"
              title="Refresh User List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Credentials Info Box */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-neutral-950/80 border border-amber-500/30 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-1">
              Active Telecaller 1 Login
            </span>
            <div className="font-mono text-white text-xs">
              <strong>Email:</strong> telecaller1@gmail.com
            </div>
            <div className="font-mono text-white text-xs mt-0.5">
              <strong>Password:</strong> telecaller1@123
            </div>
          </div>

          <div className="bg-neutral-950/80 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block mb-1">
              Telecaller Direct URL
            </span>
            <div className="font-mono text-amber-300 text-xs truncate">
              https://tele.royalepicinteriors.com
            </div>
            <button
              onClick={() => handleCopy('https://tele.royalepicinteriors.com', 'url')}
              className="mt-1 text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedText === 'url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedText === 'url' ? 'Copied URL!' : 'Copy Portal Link'}</span>
            </button>
          </div>

          <div className="bg-neutral-950/80 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block mb-1">
              Permission Level
            </span>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Telecallers have access to manual lead entry, phone dialing, call history, and follow-up queues.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-xs text-red-200 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl p-4 text-xs text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* User Accounts Table */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-serif font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Registered Staff & Telecaller Accounts ({users.length})
          </h3>
          <span className="text-[11px] text-neutral-400 font-mono">
            Permissions enforced via Supabase PostgREST & Session Token
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            Loading registered telecallers...
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-400">
            No telecaller accounts registered. Click "Add Telecaller Account" above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-950 text-[10px] font-mono uppercase text-neutral-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-5">Staff Member</th>
                  <th className="py-3 px-5">Email Address</th>
                  <th className="py-3 px-5">Phone Number</th>
                  <th className="py-3 px-5">Role & Access</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-5 font-sans font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs uppercase">
                          {u.name.slice(0, 1)}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-neutral-200">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-5 text-neutral-400">
                      {u.phone || 'N/A'}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        <span>{u.role === 'admin' ? 'Administrator' : 'Telecaller'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase ${
                        u.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRoleToggle(u)}
                          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition cursor-pointer border border-white/10"
                          title="Switch between Admin and Telecaller"
                        >
                          Make {u.role === 'admin' ? 'Telecaller' : 'Admin'}
                        </button>

                        <button
                          onClick={() => {
                            setResetUser(u);
                            setResetPassword('');
                          }}
                          className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 transition cursor-pointer border border-white/10"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleStatusToggle(u)}
                          className={`px-2 py-1 rounded text-[11px] transition cursor-pointer border ${
                            u.status === 'active'
                              ? 'bg-neutral-800 hover:bg-red-950/80 text-neutral-400 hover:text-red-300 border-white/10'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                          title="Toggle Account Status"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>

                        {u.id !== 'crm_admin_primary' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition cursor-pointer border border-white/10"
                            title="Delete Telecaller Account"
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

      {/* CREATE NEW TELECALLER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-serif font-bold text-white">Create New Telecaller / CRM Account</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Authorize a new telecaller to access <code className="text-amber-300 font-mono">tele.royalepicinteriors.com</code> directly.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Telecaller 1 or Priya Sharma"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Login Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. telecaller1@gmail.com"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono uppercase text-neutral-400">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(`telecaller@${Math.floor(100 + Math.random() * 900)}`)}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Generate Random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. telecaller1@123"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98450 11223"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Permission Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'telecaller' | 'admin')}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="telecaller">Telecaller (Lead Entry, Calling, Follow-ups)</option>
                  <option value="admin">Administrator (Full Access & User Management)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Grant Access & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-serif font-bold text-white">Reset Staff Password</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Enter a new password for <strong className="text-white">{resetUser.name}</strong> ({resetUser.email}).
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  New Password *
                </label>
                <input
                  type="text"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  {isResetting ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
