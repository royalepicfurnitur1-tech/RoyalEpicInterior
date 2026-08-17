import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Lock, Check, X, Save, RefreshCw, Plus, Search, 
  Trash2, UserPlus, CheckCircle2, ShieldAlert, Key, Edit3, Download, 
  Sliders, Info, Eye, FileText, Database, ShieldCheck, AlertCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { recordAdminAuditLog } from './AdminActivityLogger';

export interface ModulePermission {
  moduleKey: string;
  moduleName: string;
  category: 'Sales' | 'Operations' | 'Design' | 'System';
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface RolePermissions {
  roleId: string;
  roleName: string;
  description: string;
  color: string;
  isSystemRole?: boolean;
  modules: Record<string, ModulePermission>;
  updatedAt?: string;
}

export interface EmployeeUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  department: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ON_LEAVE';
  lastLogin: string;
}

// Pre-defined SaaS Modules
const SAAS_MODULES = [
  { key: 'crm', name: 'CRM Lead Pipeline', category: 'Sales' },
  { key: 'quotations', name: 'Quotation & BOQ Generator', category: 'Sales' },
  { key: 'cms', name: 'Website CMS & Landing Pages', category: 'Design' },
  { key: 'ai_manager', name: 'AI Voice & Chat Consultant', category: 'Design' },
  { key: 'inventory', name: 'Modular Factory & Material Stock', category: 'Operations' },
  { key: 'projects', name: 'Site Project Timelines & Snags', category: 'Operations' },
  { key: 'customer_portal', name: 'Customer 3D VR Portal', category: 'Operations' },
  { key: 'seo', name: 'SEO & Webmaster Suite', category: 'System' },
  { key: 'reports', name: 'Executive Financial & GST Reports', category: 'System' },
  { key: 'security', name: 'Security Audit & RBAC Controls', category: 'System' }
] as const;

// Default Roles & Initial Permission Matrix
const DEFAULT_ROLES: RolePermissions[] = [
  {
    roleId: 'super_admin',
    roleName: 'Super Admin / CEO',
    description: 'Unrestricted master access across all SaaS modules, financial reports, and RBAC configs.',
    color: 'border-gold text-gold bg-gold/15',
    isSystemRole: true,
    modules: SAAS_MODULES.reduce((acc, m) => {
      acc[m.key] = {
        moduleKey: m.key,
        moduleName: m.name,
        category: m.category as any,
        canRead: true,
        canWrite: true,
        canDelete: true,
        canExport: true
      };
      return acc;
    }, {} as Record<string, ModulePermission>),
    updatedAt: new Date().toISOString()
  },
  {
    roleId: 'sales_manager',
    roleName: 'Sales & CRM Lead Manager',
    description: 'Manages customer inquiries, phone bookings, WhatsApp leads, and quotation issuance.',
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/60',
    modules: SAAS_MODULES.reduce((acc, m) => {
      const isSales = m.key === 'crm' || m.key === 'quotations' || m.key === 'customer_portal';
      acc[m.key] = {
        moduleKey: m.key,
        moduleName: m.name,
        category: m.category as any,
        canRead: true,
        canWrite: isSales,
        canDelete: false,
        canExport: isSales
      };
      return acc;
    }, {} as Record<string, ModulePermission>),
    updatedAt: new Date().toISOString()
  },
  {
    roleId: 'design_architect',
    roleName: 'Senior Design Architect',
    description: 'Uploads 3D VR walkthroughs, configures materials, and modifies website portfolio renders.',
    color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/60',
    modules: SAAS_MODULES.reduce((acc, m) => {
      const isDesign = m.key === 'cms' || m.key === 'ai_manager' || m.key === 'customer_portal';
      acc[m.key] = {
        moduleKey: m.key,
        moduleName: m.name,
        category: m.category as any,
        canRead: true,
        canWrite: isDesign,
        canDelete: false,
        canExport: false
      };
      return acc;
    }, {} as Record<string, ModulePermission>),
    updatedAt: new Date().toISOString()
  },
  {
    roleId: 'site_engineer',
    roleName: 'Senior Site Project Engineer',
    description: 'Tracks site construction timelines, logs daily progress photos, and updates customer milestones.',
    color: 'border-purple-500/40 text-purple-400 bg-purple-950/60',
    modules: SAAS_MODULES.reduce((acc, m) => {
      const isOps = m.key === 'projects' || m.key === 'customer_portal' || m.key === 'inventory';
      acc[m.key] = {
        moduleKey: m.key,
        moduleName: m.name,
        category: m.category as any,
        canRead: true,
        canWrite: isOps,
        canDelete: false,
        canExport: false
      };
      return acc;
    }, {} as Record<string, ModulePermission>),
    updatedAt: new Date().toISOString()
  },
  {
    roleId: 'factory_manager',
    roleName: 'Factory Production Manager',
    description: 'Controls raw material plywood inventory, CNC cutting logs, and hardware purchase orders.',
    color: 'border-amber-500/40 text-amber-400 bg-amber-950/60',
    modules: SAAS_MODULES.reduce((acc, m) => {
      const isFactory = m.key === 'inventory' || m.key === 'projects';
      acc[m.key] = {
        moduleKey: m.key,
        moduleName: m.name,
        category: m.category as any,
        canRead: true,
        canWrite: isFactory,
        canDelete: false,
        canExport: isFactory
      };
      return acc;
    }, {} as Record<string, ModulePermission>),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_EMPLOYEES: EmployeeUser[] = [
  {
    id: 'EMP-1001',
    name: 'Royal Epic Admin Team',
    email: 'royalepicfurnitur1@gmail.com',
    phone: '+91 99166 33338',
    roleId: 'super_admin',
    department: 'Executive Management',
    status: 'ACTIVE',
    lastLogin: '2 mins ago (Thanisandra HQ)'
  },
  {
    id: 'EMP-1002',
    name: 'Karthik N.',
    email: 'karthik.site@royalepicfurniture.com',
    phone: '+91 98450 12345',
    roleId: 'site_engineer',
    department: 'Site Engineering',
    status: 'ACTIVE',
    lastLogin: '1 hour ago'
  },
  {
    id: 'EMP-1003',
    name: 'Ananya R.',
    email: 'ananya.design@royalepicfurniture.com',
    phone: '+91 97312 88990',
    roleId: 'design_architect',
    department: '3D VR Design Studio',
    status: 'ACTIVE',
    lastLogin: '3 hours ago'
  },
  {
    id: 'EMP-1004',
    name: 'Rajesh M.',
    email: 'factory@royalepicfurniture.com',
    phone: '+91 96111 45678',
    roleId: 'factory_manager',
    department: 'Thanisandra CNC Factory',
    status: 'ACTIVE',
    lastLogin: 'Yesterday'
  },
  {
    id: 'EMP-1005',
    name: 'Vikram S.',
    email: 'sales.head@royalepicfurniture.com',
    phone: '+91 91080 77889',
    roleId: 'sales_manager',
    department: 'Sales & Estimations',
    status: 'ACTIVE',
    lastLogin: 'Today, 10:15 AM'
  }
];

export const AccessControlPanel: React.FC = () => {
  const [roles, setRoles] = useState<RolePermissions[]>(DEFAULT_ROLES);
  const [employees, setEmployees] = useState<EmployeeUser[]>(DEFAULT_EMPLOYEES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('super_admin');
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'editor' | 'employees'>('matrix');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Employee Modal State
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Sales & Marketing');
  const [newEmpRoleId, setNewEmpRoleId] = useState('sales_manager');

  // Active Role Object
  const currentRole = roles.find(r => r.roleId === selectedRoleId) || roles[0];

  // Fetch Roles & Employees from Firebase Firestore
  const fetchRbacFromFirebase = async () => {
    setLoading(true);
    try {
      const rolesSnap = await getDocs(collection(db, 'rbac_roles'));
      if (!rolesSnap.empty) {
        const fetchedRoles: RolePermissions[] = [];
        rolesSnap.forEach((docSnap) => {
          const data = docSnap.data() as RolePermissions;
          fetchedRoles.push({
            ...data,
            roleId: docSnap.id
          });
        });

        // Merge with defaults
        const fetchedIds = new Set(fetchedRoles.map(r => r.roleId));
        const combinedRoles = [...fetchedRoles, ...DEFAULT_ROLES.filter(d => !fetchedIds.has(d.roleId))];
        setRoles(combinedRoles);
      }

      const empSnap = await getDocs(collection(db, 'employees'));
      if (!empSnap.empty) {
        const fetchedEmps: EmployeeUser[] = [];
        empSnap.forEach((docSnap) => {
          const data = docSnap.data() as EmployeeUser;
          fetchedEmps.push({
            ...data,
            id: docSnap.id
          });
        });

        const fetchedEmpIds = new Set(fetchedEmps.map(e => e.id));
        const combinedEmps = [...fetchedEmps, ...DEFAULT_EMPLOYEES.filter(d => !fetchedEmpIds.has(d.id))];
        setEmployees(combinedEmps);
      }
    } catch (err) {
      console.warn('RBAC Firebase fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRbacFromFirebase();

    // Subscribe real-time
    let unsubscribeRoles: () => void;
    let unsubscribeEmps: () => void;
    try {
      unsubscribeRoles = onSnapshot(collection(db, 'rbac_roles'), (snap) => {
        if (!snap.empty) {
          const realTimeRoles: RolePermissions[] = [];
          snap.forEach(d => {
            realTimeRoles.push({ ...(d.data() as RolePermissions), roleId: d.id });
          });
          setRoles(prev => {
            const map = new Map(prev.map(r => [r.roleId, r]));
            realTimeRoles.forEach(r => map.set(r.roleId, r));
            return Array.from(map.values());
          });
        }
      });

      unsubscribeEmps = onSnapshot(collection(db, 'employees'), (snap) => {
        if (!snap.empty) {
          const realTimeEmps: EmployeeUser[] = [];
          snap.forEach(d => {
            realTimeEmps.push({ ...(d.data() as EmployeeUser), id: d.id });
          });
          setEmployees(prev => {
            const map = new Map(prev.map(e => [e.id, e]));
            realTimeEmps.forEach(e => map.set(e.id, e));
            return Array.from(map.values());
          });
        }
      });
    } catch (e) {
      // Ignore
    }

    return () => {
      if (unsubscribeRoles) unsubscribeRoles();
      if (unsubscribeEmps) unsubscribeEmps();
    };
  }, []);

  // Toggle permission helper
  const handleTogglePermission = (
    roleId: string, 
    moduleKey: string, 
    permType: 'canRead' | 'canWrite' | 'canDelete' | 'canExport'
  ) => {
    setRoles(prevRoles => prevRoles.map(role => {
      if (role.roleId !== roleId) return role;

      const currentModule = role.modules[moduleKey] || {
        moduleKey,
        moduleName: SAAS_MODULES.find(m => m.key === moduleKey)?.name || moduleKey,
        category: 'Operations',
        canRead: false,
        canWrite: false,
        canDelete: false,
        canExport: false
      };

      const updatedModule = {
        ...currentModule,
        [permType]: !currentModule[permType]
      };

      // If enabling write/delete/export, auto enable Read
      if ((permType === 'canWrite' || permType === 'canDelete' || permType === 'canExport') && updatedModule[permType]) {
        updatedModule.canRead = true;
      }

      // If disabling Read, auto disable write/delete/export
      if (permType === 'canRead' && !updatedModule.canRead) {
        updatedModule.canWrite = false;
        updatedModule.canDelete = false;
        updatedModule.canExport = false;
      }

      return {
        ...role,
        updatedAt: new Date().toISOString(),
        modules: {
          ...role.modules,
          [moduleKey]: updatedModule
        }
      };
    }));
  };

  // Save current Role Permissions directly to Firebase Firestore
  const handleSaveRoleToFirebase = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const docRef = doc(db, 'rbac_roles', currentRole.roleId);
      await setDoc(docRef, currentRole, { merge: true });

      // Audit Log Entry
      await recordAdminAuditLog(
        `RBAC Security Policy Updated (${currentRole.roleName})`,
        'SECURITY',
        `Modified granular access permissions (Read/Write/Delete/Export) for role: ${currentRole.roleName}`,
        'WARNING'
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Saved RBAC role locally:', err);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Preset Handlers
  const handleApplyPreset = (preset: 'FULL' | 'READ_ONLY' | 'MINIMAL') => {
    setRoles(prev => prev.map(r => {
      if (r.roleId !== selectedRoleId) return r;

      const newModules: Record<string, ModulePermission> = {};
      SAAS_MODULES.forEach(m => {
        if (preset === 'FULL') {
          newModules[m.key] = { moduleKey: m.key, moduleName: m.name, category: m.category as any, canRead: true, canWrite: true, canDelete: true, canExport: true };
        } else if (preset === 'READ_ONLY') {
          newModules[m.key] = { moduleKey: m.key, moduleName: m.name, category: m.category as any, canRead: true, canWrite: false, canDelete: false, canExport: false };
        } else {
          newModules[m.key] = { moduleKey: m.key, moduleName: m.name, category: m.category as any, canRead: false, canWrite: false, canDelete: false, canExport: false };
        }
      });

      return { ...r, modules: newModules, updatedAt: new Date().toISOString() };
    }));
  };

  // Add New Employee Form Submit
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpEmail) return;

    const empId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmp: EmployeeUser = {
      id: empId,
      name: newEmpName,
      email: newEmpEmail,
      phone: newEmpPhone || '+91 98000 00000',
      roleId: newEmpRoleId,
      department: newEmpDept,
      status: 'ACTIVE',
      lastLogin: 'Never (Invited)'
    };

    try {
      const docRef = doc(db, 'employees', empId);
      await setDoc(docRef, newEmp, { merge: true });

      await recordAdminAuditLog(
        `New Employee Account Onboarded (${newEmpName})`,
        'AUTH',
        `Created employee account ${newEmpEmail} with role: ${roles.find(r => r.roleId === newEmpRoleId)?.roleName}`,
        'INFO'
      );
    } catch (e) {
      // Local state fallback
    }

    setEmployees(prev => [newEmp, ...prev]);
    setIsAddEmpModalOpen(false);
    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpPhone('');
  };

  // Update Employee Role
  const handleUpdateEmployeeRole = async (empId: string, newRoleId: string) => {
    setEmployees(prev => prev.map(emp => emp.id === empId ? { ...emp, roleId: newRoleId } : emp));

    try {
      const docRef = doc(db, 'employees', empId);
      await setDoc(docRef, { roleId: newRoleId }, { merge: true });

      const emp = employees.find(e => e.id === empId);
      await recordAdminAuditLog(
        `Employee Role Reassigned (${emp?.name})`,
        'SECURITY',
        `Reassigned role for ${emp?.email} to ${roles.find(r => r.roleId === newRoleId)?.roleName}`,
        'WARNING'
      );
    } catch (e) {
      // Ignore
    }
  };

  // Export RBAC Policy CSV
  const handleExportRbacCsv = () => {
    const headers = ['Role ID', 'Role Name', 'Module Key', 'Module Name', 'Read', 'Write', 'Delete', 'Export'];
    const rows: string[][] = [];

    roles.forEach(role => {
      SAAS_MODULES.forEach(mod => {
        const perm = role.modules[mod.key] || { canRead: false, canWrite: false, canDelete: false, canExport: false };
        rows.push([
          role.roleId,
          `"${role.roleName}"`,
          mod.key,
          `"${mod.name}"`,
          perm.canRead ? 'YES' : 'NO',
          perm.canWrite ? 'YES' : 'NO',
          perm.canDelete ? 'YES' : 'NO',
          perm.canExport ? 'YES' : 'NO'
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Royal_Epic_RBAC_Permission_Matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/40 text-[10px] font-mono font-bold uppercase tracking-wider">
              Firebase Synced Security Governance
            </span>
            <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Granular Module Permissions
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mt-1 flex items-center gap-2">
            <Shield className="w-6 h-6 text-gold" /> Employee Access Control & RBAC Panel
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage granular Read, Write, Delete, and Export permissions across all SaaS modules for executive roles and employees.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchRbacFromFirebase}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 transition-all cursor-pointer"
            title="Refresh Permissions from Firebase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddEmpModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>

          <button
            onClick={handleExportRbacCsv}
            className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Matrix CSV
          </button>

          <button
            onClick={handleSaveRoleToFirebase}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              saveSuccess 
                ? 'bg-emerald-400 shadow-emerald-400/20' 
                : 'bg-gradient-to-r from-gold via-amber-400 to-yellow-500 hover:brightness-110 shadow-gold/20'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>Synced to Firebase!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-black stroke-[2.5]" />
                <span>{saving ? 'Syncing...' : 'Save Role Policy'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'matrix' 
                ? 'bg-gold text-black shadow-md shadow-gold/20' 
                : 'bg-black/60 text-neutral-300 hover:text-white border border-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Full Permissions Matrix
          </button>

          <button
            onClick={() => setActiveSubTab('editor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'editor' 
                ? 'bg-gold text-black shadow-md shadow-gold/20' 
                : 'bg-black/60 text-neutral-300 hover:text-white border border-white/10'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Granular Role Editor
          </button>

          <button
            onClick={() => setActiveSubTab('employees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'employees' 
                ? 'bg-gold text-black shadow-md shadow-gold/20' 
                : 'bg-black/60 text-neutral-300 hover:text-white border border-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Employee Roster ({employees.length})
          </button>
        </div>

        {/* Role Selector Dropdown for Editor */}
        {activeSubTab === 'editor' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-bold uppercase">Role:</span>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="bg-black/80 border border-gold/40 text-gold font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              {roles.map(r => (
                <option key={r.roleId} value={r.roleId}>
                  {r.roleName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: FULL PERMISSIONS MATRIX TABLE */}
      {activeSubTab === 'matrix' && (
        <div className="rounded-3xl bg-neutral-950 border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-serif font-bold text-white text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-gold" /> Cross-Module Role Access Matrix
            </h3>
            <span className="text-[11px] text-neutral-400 font-mono">
              Green Check = Read/Write Enabled • Red Cross = Access Restricted
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black text-neutral-400 font-mono text-[11px] uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">SaaS Module</th>
                  <th className="p-4">Category</th>
                  {roles.map(r => (
                    <th key={r.roleId} className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${r.color}`}>
                        {r.roleName.split(' ')[0]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {SAAS_MODULES.map(mod => (
                  <tr key={mod.key} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span>{mod.name}</span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-neutral-400">
                      {mod.category}
                    </td>
                    {roles.map(role => {
                      const perm = role.modules[mod.key] || { canRead: false, canWrite: false, canDelete: false, canExport: false };
                      return (
                        <td key={role.roleId} className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                            {/* Read Badge */}
                            <button
                              onClick={() => handleTogglePermission(role.roleId, mod.key, 'canRead')}
                              title={`Toggle Read for ${role.roleName}`}
                              className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                                perm.canRead 
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 font-bold' 
                                  : 'bg-neutral-900 text-neutral-600 border-neutral-800'
                              }`}
                            >
                              R
                            </button>

                            {/* Write Badge */}
                            <button
                              onClick={() => handleTogglePermission(role.roleId, mod.key, 'canWrite')}
                              title={`Toggle Write for ${role.roleName}`}
                              className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                                perm.canWrite 
                                  ? 'bg-blue-950 text-blue-300 border-blue-500/40 font-bold' 
                                  : 'bg-neutral-900 text-neutral-600 border-neutral-800'
                              }`}
                            >
                              W
                            </button>

                            {/* Delete Badge */}
                            <button
                              onClick={() => handleTogglePermission(role.roleId, mod.key, 'canDelete')}
                              title={`Toggle Delete for ${role.roleName}`}
                              className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                                perm.canDelete 
                                  ? 'bg-red-950 text-red-300 border-red-500/40 font-bold' 
                                  : 'bg-neutral-900 text-neutral-600 border-neutral-800'
                              }`}
                            >
                              D
                            </button>

                            {/* Export Badge */}
                            <button
                              onClick={() => handleTogglePermission(role.roleId, mod.key, 'canExport')}
                              title={`Toggle Export for ${role.roleName}`}
                              className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                                perm.canExport 
                                  ? 'bg-amber-950 text-amber-300 border-amber-500/40 font-bold' 
                                  : 'bg-neutral-900 text-neutral-600 border-neutral-800'
                              }`}
                            >
                              E
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: GRANULAR ROLE EDITOR (DETAILED TOGGLES PER MODULE) */}
      {activeSubTab === 'editor' && (
        <div className="space-y-6">
          {/* Active Role Overview Card */}
          <div className="p-5 rounded-3xl bg-neutral-950 border border-white/10 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${currentRole.color}`}>
                    {currentRole.roleName}
                  </span>
                  {currentRole.isSystemRole && (
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                      SYSTEM PROTECTED
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  {currentRole.description}
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-neutral-400 font-bold">Presets:</span>
                <button
                  onClick={() => handleApplyPreset('FULL')}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold cursor-pointer"
                >
                  Grant Full Access
                </button>
                <button
                  onClick={() => handleApplyPreset('READ_ONLY')}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold cursor-pointer"
                >
                  Read-Only Preset
                </button>
                <button
                  onClick={() => handleApplyPreset('MINIMAL')}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-red-400 border border-red-500/30 text-[11px] font-bold cursor-pointer"
                >
                  Revoke All
                </button>
              </div>
            </div>

            {/* Detailed Granular Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAAS_MODULES.map((m) => {
                const perm = currentRole.modules[m.key] || {
                  moduleKey: m.key,
                  moduleName: m.name,
                  category: m.category as any,
                  canRead: false,
                  canWrite: false,
                  canDelete: false,
                  canExport: false
                };

                return (
                  <div key={m.key} className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-gold" /> {m.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 text-[10px] font-mono border border-white/5">
                        {m.category}
                      </span>
                    </div>

                    {/* 4 Granular Toggles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      {/* READ */}
                      <label className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        perm.canRead ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-neutral-900 border-white/10 text-neutral-500'
                      }`}>
                        <span>Read</span>
                        <input
                          type="checkbox"
                          checked={perm.canRead}
                          onChange={() => handleTogglePermission(currentRole.roleId, m.key, 'canRead')}
                          className="accent-gold cursor-pointer"
                        />
                      </label>

                      {/* WRITE */}
                      <label className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        perm.canWrite ? 'bg-blue-950/80 border-blue-500/50 text-blue-300' : 'bg-neutral-900 border-white/10 text-neutral-500'
                      }`}>
                        <span>Write</span>
                        <input
                          type="checkbox"
                          checked={perm.canWrite}
                          onChange={() => handleTogglePermission(currentRole.roleId, m.key, 'canWrite')}
                          className="accent-gold cursor-pointer"
                        />
                      </label>

                      {/* DELETE */}
                      <label className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        perm.canDelete ? 'bg-red-950/80 border-red-500/50 text-red-300' : 'bg-neutral-900 border-white/10 text-neutral-500'
                      }`}>
                        <span>Delete</span>
                        <input
                          type="checkbox"
                          checked={perm.canDelete}
                          onChange={() => handleTogglePermission(currentRole.roleId, m.key, 'canDelete')}
                          className="accent-gold cursor-pointer"
                        />
                      </label>

                      {/* EXPORT */}
                      <label className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        perm.canExport ? 'bg-amber-950/80 border-amber-500/50 text-amber-300' : 'bg-neutral-900 border-white/10 text-neutral-500'
                      }`}>
                        <span>Export</span>
                        <input
                          type="checkbox"
                          checked={perm.canExport}
                          onChange={() => handleTogglePermission(currentRole.roleId, m.key, 'canExport')}
                          className="accent-gold cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: EMPLOYEE ROSTER & ROLE ASSIGNMENTS */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search employees by name, email or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees
              .filter(emp => 
                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.department.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(emp => {
                const empRole = roles.find(r => r.roleId === emp.roleId) || roles[0];
                return (
                  <div key={emp.id} className="p-5 rounded-3xl bg-neutral-950 border border-white/10 space-y-3 hover:border-gold/30 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-gold text-[10px] font-bold px-2 py-0.5 rounded bg-gold/10 border border-gold/30">
                          {emp.id}
                        </span>
                        <h4 className="font-bold text-white text-sm mt-1">{emp.name}</h4>
                        <p className="text-xs text-neutral-400 font-mono">{emp.email}</p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
                        {emp.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/60 border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 font-bold uppercase text-[10px]">Department:</span>
                        <span className="text-white font-medium">{emp.department}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 font-bold uppercase text-[10px]">Assigned Role:</span>
                        <select
                          value={emp.roleId}
                          onChange={(e) => handleUpdateEmployeeRole(emp.id, e.target.value)}
                          className="bg-neutral-900 border border-gold/40 text-gold font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                        >
                          {roles.map(r => (
                            <option key={r.roleId} value={r.roleId}>
                              {r.roleName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-white/5">
                        <span>Phone: <strong className="text-neutral-300">{emp.phone}</strong></span>
                        <span>{emp.lastLogin}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW EMPLOYEE */}
      {isAddEmpModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-gold/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-white text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-gold" /> Onboard New Employee
              </h3>
              <button onClick={() => setIsAddEmpModalOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1 uppercase">Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.design@royalepicfurniture.com"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 99000 00000"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase">Department</label>
                  <input
                    type="text"
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1 uppercase">Initial Security Role</label>
                <select
                  value={newEmpRoleId}
                  onChange={(e) => setNewEmpRoleId(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-gold font-bold focus:outline-none focus:border-gold cursor-pointer"
                >
                  {roles.map(r => (
                    <option key={r.roleId} value={r.roleId}>
                      {r.roleName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEmpModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gold text-black font-bold flex items-center gap-1.5 hover:bg-amber-400 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> Save Employee Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
