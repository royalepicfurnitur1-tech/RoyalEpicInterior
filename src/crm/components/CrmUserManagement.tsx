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
  Phone
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
      <div className="bg-red-950/20 border border-red-800 p-8 rounded-2xl text-center text-red-200">
        <Shield className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <h2 className="text-sm font-bold uppercase tracking-wider font-mono">Access Denied</h2>
        <p className="text-xs text-neutral-400 mt-1">
          User & role management is restricted strictly to administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/90 border border-neutral-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Admin Privilege
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Staff Access Registry
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            Telecaller Staff & Access Control
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Manage approved telecallers and administrators with granular CRM permissions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Telecaller Account</span>
          </button>
        </div>
      </div>

      {/* Quick Active Credentials Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-0.5">
              Current Telecaller 1 Login
            </span>
            <div className="text-xs text-white font-mono">
              <strong>Email:</strong> telecaller1@gmail.com | <strong>Pass:</strong> telecaller1@123
            </div>
          </div>
          <button
            onClick={() => handleCopy('telecaller1@gmail.com / telecaller1@123', 'tele1')}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer font-mono"
          >
            {copiedText === 'tele1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText === 'tele1' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block mb-0.5">
              Direct Subdomain Link
            </span>
            <div className="text-xs text-amber-300 font-mono">
              https://tele.royalepicinteriors.com
            </div>
          </div>
          <button
            onClick={() => handleCopy('https://tele.royalepicinteriors.com', 'link')}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer font-mono"
          >
            {copiedText === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText === 'link' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 p-4 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/40 border border-emerald-800 p-4 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-neutral-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            Loading CRM user registry...
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-400">
            No CRM users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-neutral-950 text-[10px] font-mono uppercase text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Work Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3.5 px-4 font-sans font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs uppercase">
                          {u.name.slice(0, 1)}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">
                      {u.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        <span>{u.role === 'admin' ? 'Administrator' : 'Telecaller'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        u.status === 'active' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] transition cursor-pointer"
                          title="Toggle Role"
                        >
                          Make {u.role === 'admin' ? 'Telecaller' : 'Admin'}
                        </button>

                        <button
                          onClick={() => {
                            setResetUser(u);
                            setResetPassword('');
                          }}
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-[11px] transition cursor-pointer"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleStatusToggle(u)}
                          className={`px-2 py-1 rounded text-[11px] transition cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                          title="Toggle Active/Suspended"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>

                        {u.id !== 'crm_admin_primary' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 rounded bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 text-[11px] transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <h2 className="text-base font-serif font-bold text-white mb-1">Add Approved CRM User</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Authorize a new telecaller or administrator for <code className="text-amber-300 font-mono">tele.royalepicinteriors.com</code>.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Telecaller 1 or Rahul Kumar"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Work Email *</label>
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
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. telecaller1@123"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98450 11223"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'telecaller')}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="telecaller">Telecaller (Calling, Leads, Follow-ups)</option>
                  <option value="admin">Administrator (Full Access & User Management)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl">
            <h2 className="text-base font-serif font-bold text-white mb-1">Reset Password</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Enter a new password for <strong className="text-white">{resetUser.name}</strong> ({resetUser.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">New Password *</label>
                <input
                  type="text"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-800">
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
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
