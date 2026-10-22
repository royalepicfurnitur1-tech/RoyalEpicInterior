import React, { useState, useEffect } from 'react';
import { CrmUser } from '../types';
import { fetchCrmUsers, updateCrmUserRole } from '../crmService';
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
  Lock
} from 'lucide-react';

export const CrmUserManagement: React.FC = () => {
  const { isAdmin, initFirstAdmin } = useCrmAuth();
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New user form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'telecaller'>('telecaller');
  const [isAdding, setIsAdding] = useState(false);

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('royal_epic_crm_session') || '{}')?.token || ''}`
        },
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-serif font-bold text-white tracking-wide">
            CRM Access Control & User Roles
          </h1>
          <p className="text-xs text-neutral-400 font-mono">
            Manage approved telecallers and administrators with granular permissions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add CRM User</span>
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
                      {u.name}
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
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] transition cursor-pointer"
                        title="Toggle Role"
                      >
                        Switch to {u.role === 'admin' ? 'Telecaller' : 'Admin'}
                      </button>
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
            <h2 className="text-sm font-serif font-bold text-white mb-1">Add Approved CRM User</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Authorize a new telecaller or administrator for the CRM subdomain.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Anjali Nair"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="anjali@royalepicinterior.com"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 99000 11223"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'telecaller')}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="telecaller">Telecaller (Calling, Leads, Follow-ups)</option>
                  <option value="admin">Administrator (Full Access & User Management)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-mono text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-xs rounded-lg transition"
                >
                  {isAdding ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
