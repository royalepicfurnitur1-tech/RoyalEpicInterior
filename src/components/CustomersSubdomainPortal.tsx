import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Shield, Phone, Mail, MapPin, Calendar, 
  Search, Filter, Plus, RefreshCw, CheckCircle2, Clock, 
  ArrowRight, ExternalLink, MessageSquare, Download, FileText, 
  Sparkles, ChevronRight, Eye, Edit3, Trash2, Building, 
  Award, TrendingUp, AlertCircle, LogOut, Lock, Key, ArrowLeft,
  ChevronDown, PhoneCall, Send, DollarSign, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { generateQuotePdf } from '../utils/pdfGenerator';

export interface CustomerLeadRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  budget: string;
  projectType: string;
  preferredDate?: string;
  discoveredInfo?: any;
  notes?: string;
  drawingName?: string;
  status: 'New' | 'Contacted' | 'Site Visit Scheduled' | 'BOQ Sent' | 'Closed' | 'In Production';
  createdAt: string;
  source: string;
}

interface CustomersSubdomainPortalProps {
  onBackToWebsite?: () => void;
  onNavigateToAdmin?: () => void;
}

export const CustomersSubdomainPortal: React.FC<CustomersSubdomainPortalProps> = ({
  onBackToWebsite,
  onNavigateToAdmin,
}) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<{
    role: 'executive' | 'admin' | 'customer';
    name: string;
    email: string;
    phone?: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem('royal_epic_customer_portal_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [authRoleTab, setAuthRoleTab] = useState<'executive' | 'customer'>('executive');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [customerLeadIdInput, setCustomerLeadIdInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Leads & Customer Records
  const [leads, setLeads] = useState<CustomerLeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLead, setSelectedLead] = useState<CustomerLeadRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Lead Form State
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    location: 'Bengaluru',
    projectType: 'Turnkey Residential Interior',
    budget: '₹15 Lakhs - ₹25 Lakhs',
    preferredDate: '',
    notes: '',
    source: 'Executive Walk-in / Direct'
  });
  const [isSavingNewLead, setIsSavingNewLead] = useState(false);

  // Follow-up notes state for selected lead
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<CustomerLeadRecord['status']>('New');
  const [editDate, setEditDate] = useState('');
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);

  // Fetch leads from Supabase & API
  const fetchCustomerLeads = async () => {
    setIsLoading(true);
    try {
      // 1. Try fetching from backend API which is synced to Supabase
      const res = await fetch('/api/crm/leads');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leads)) {
          setLeads(data.leads);
          setIsLoading(false);
          return;
        }
      }

      // 2. Direct Supabase client fetch fallback
      const supabase = getSupabase();
      if (supabase) {
        const { data: rows, error } = await supabase
          .from('leads_and_inquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(rows)) {
          const mapped: CustomerLeadRecord[] = rows.map((r: any) => ({
            id: r.id,
            name: r.full_name,
            phone: r.phone,
            email: r.email || 'N/A',
            location: r.city || 'Bengaluru',
            budget: r.estimated_budget || 'Custom Quote',
            projectType: r.service_type || 'Turnkey Interior',
            preferredDate: r.preferred_date || '',
            discoveredInfo: r.raw_details || {},
            notes: r.notes || '',
            drawingName: r.drawing_name || '',
            status: r.status === 'site_visit_scheduled' ? 'Site Visit Scheduled' : r.status === 'boq_sent' ? 'BOQ Sent' : r.status === 'converted' ? 'Closed' : 'New',
            createdAt: r.created_at || new Date().toISOString(),
            source: r.source || 'Website Form'
          }));
          setLeads(mapped);
        }
      }
    } catch (e) {
      console.error('Failed to fetch customer leads:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchCustomerLeads();
    }
  }, [currentUser]);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    if (authRoleTab === 'executive') {
      const email = emailInput.trim().toLowerCase();
      const pass = passwordInput.trim();

      // Check Executive / Admin credentials
      if (email === 'admin@royalepicinterior.in' || email === 'admin@royalepic.in' || email === 'admin') {
        if (pass === 'admin123' || pass === 'admin' || pass === 'royal123') {
          const userObj = { role: 'admin' as const, name: 'Managing Director / Admin', email: 'admin@royalepicinterior.in' };
          setCurrentUser(userObj);
          localStorage.setItem('royal_epic_customer_portal_auth', JSON.stringify(userObj));
          setIsLoggingIn(false);
          return;
        }
      }

      if (email.includes('executive') || email.includes('sales') || email.includes('marketing') || email.includes('royal')) {
        if (pass.length >= 4) {
          const userObj = { role: 'executive' as const, name: 'Marketing & Sales Executive', email: emailInput };
          setCurrentUser(userObj);
          localStorage.setItem('royal_epic_customer_portal_auth', JSON.stringify(userObj));
          setIsLoggingIn(false);
          return;
        }
      }

      // Default fallback for authorized staff
      if (pass === 'executive123' || pass === 'sales123' || pass === 'royal123' || pass === '123456') {
        const userObj = { role: 'executive' as const, name: emailInput.split('@')[0] || 'Executive Member', email: emailInput };
        setCurrentUser(userObj);
        localStorage.setItem('royal_epic_customer_portal_auth', JSON.stringify(userObj));
        setIsLoggingIn(false);
        return;
      }

      setAuthError('Invalid Executive credentials. Try executive@royalepic.in / executive123 or admin@royalepicinterior.in / admin123');
      setIsLoggingIn(false);
    } else {
      // Customer login by phone or lead id
      const cleanPhone = customerPhoneInput.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 8 || customerLeadIdInput.trim().length > 3) {
        const userObj = { 
          role: 'customer' as const, 
          name: 'Valued Client', 
          email: 'client@royalepic.in',
          phone: customerPhoneInput 
        };
        setCurrentUser(userObj);
        localStorage.setItem('royal_epic_customer_portal_auth', JSON.stringify(userObj));
        setIsLoggingIn(false);
      } else {
        setAuthError('Please enter a valid 10-digit registered mobile number or Lead ID.');
        setIsLoggingIn(false);
      }
    }
  };

  const handleQuickDemoLogin = (role: 'executive' | 'admin' | 'customer') => {
    if (role === 'admin') {
      const userObj = { role: 'admin' as const, name: 'Super Admin / Director', email: 'admin@royalepicinterior.in' };
      setCurrentUser(userObj);
      localStorage.setItem('royal_epic_customer_portal_auth', JSON.stringify(userObj));
    } else if (role === 'executive') {
      const userObj = { role: 'executive' as const, name: 'Senior Marketing Executive', email: 'executive@royalepic.in' };
      setCurrentUser(userObj);
      localStorage.setItem('royal_epic_customer_portal_auth', JSON.stringify(userObj));
    } else {
      const userObj = { role: 'customer' as const, name: 'Anand Kumar (Client)', email: 'anand.verma@gmail.com', phone: '+91 98450 12345' };
      setCurrentUser(userObj);
      localStorage.setItem('royal_epic_customer_portal_auth', JSON.stringify(userObj));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('royal_epic_customer_portal_auth');
  };

  // Open Lead Detail Dossier
  const handleOpenLead = (lead: CustomerLeadRecord) => {
    setSelectedLead(lead);
    setEditNotes(lead.notes || '');
    setEditStatus(lead.status);
    setEditDate(lead.preferredDate || '');
    setIsDetailModalOpen(true);
  };

  // Save Lead Status & Notes update
  const handleSaveLeadUpdate = async () => {
    if (!selectedLead) return;
    setIsUpdatingLead(true);

    const updatedRecord = {
      ...selectedLead,
      status: editStatus,
      notes: editNotes,
      preferredDate: editDate
    };

    try {
      // 1. Update Supabase
      const supabase = getSupabase();
      if (supabase) {
        let dbStatus = 'new';
        if (editStatus === 'Site Visit Scheduled') dbStatus = 'site_visit_scheduled';
        else if (editStatus === 'BOQ Sent') dbStatus = 'boq_sent';
        else if (editStatus === 'Closed') dbStatus = 'converted';
        else if (editStatus === 'Contacted') dbStatus = 'contacted';

        await supabase
          .from('leads_and_inquiries')
          .update({
            status: dbStatus,
            notes: editNotes,
            preferred_date: editDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedLead.id);
      }

      // 2. Update local state
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedRecord : l));
      setSelectedLead(updatedRecord);
      setIsDetailModalOpen(false);
    } catch (e) {
      console.error('Failed to update lead:', e);
    } finally {
      setIsUpdatingLead(false);
    }
  };

  // Create New Customer Lead
  const handleCreateNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.phone) return;
    setIsSavingNewLead(true);

    const generatedId = `LEAD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: CustomerLeadRecord = {
      id: generatedId,
      name: newLeadForm.name,
      phone: newLeadForm.phone,
      email: newLeadForm.email || 'N/A',
      location: newLeadForm.location,
      budget: newLeadForm.budget,
      projectType: newLeadForm.projectType,
      preferredDate: newLeadForm.preferredDate || new Date().toISOString().split('T')[0],
      notes: newLeadForm.notes,
      status: 'New',
      createdAt: new Date().toISOString(),
      source: newLeadForm.source
    };

    try {
      // 1. Insert into Supabase
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('leads_and_inquiries').insert([{
          id: generatedId,
          full_name: newLeadForm.name,
          phone: newLeadForm.phone,
          email: newLeadForm.email || null,
          city: newLeadForm.location,
          service_type: newLeadForm.projectType,
          estimated_budget: newLeadForm.budget,
          preferred_date: newLeadForm.preferredDate || null,
          notes: newLeadForm.notes || null,
          source: newLeadForm.source,
          status: 'new',
          created_at: new Date().toISOString()
        }]);
      }

      // 2. Also ping server API
      fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      }).catch(() => {});

      setLeads(prev => [newRecord, ...prev]);
      setIsAddModalOpen(false);
      setNewLeadForm({
        name: '',
        phone: '',
        email: '',
        location: 'Bengaluru',
        projectType: 'Turnkey Residential Interior',
        budget: '₹15 Lakhs - ₹25 Lakhs',
        preferredDate: '',
        notes: '',
        source: 'Executive Walk-in / Direct'
      });
    } catch (err) {
      console.error('Failed to create lead:', err);
    } finally {
      setIsSavingNewLead(false);
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.location && l.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      l.projectType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate quick metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const siteVisits = leads.filter(l => l.status === 'Site Visit Scheduled').length;
  const converted = leads.filter(l => l.status === 'Closed').length;

  // ==========================================
  // UN-AUTHENTICATED LOGIN SCREEN
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between selection:bg-gold selection:text-black font-sans relative overflow-hidden">
        {/* Subtle Background Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header Bar */}
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-black font-bold shadow-lg shadow-gold/20 font-serif text-lg">
              RE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold tracking-wide text-white text-base sm:text-lg">
                  Royal Epic
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
                  Customers Subdomain
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Marketing Executive & Client Intelligence Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToWebsite && (
              <button
                onClick={onBackToWebsite}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 text-xs text-neutral-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Main Site
              </button>
            )}
            {onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-gold/40 text-xs text-gold hover:bg-gold/10 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" /> Admin ERP
              </button>
            )}
          </div>
        </header>

        {/* Main Auth Container */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-8">
          <div className="w-full max-w-md bg-neutral-900/90 border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

            {/* Portal Badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5" /> Subdomain Secured Access
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                Customer & Executive Workspace
              </h1>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Log in as a Marketing Executive to manage customer leads, or track your personal interior project.
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => { setAuthRoleTab('executive'); setAuthError(''); }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  authRoleTab === 'executive'
                    ? 'bg-gradient-to-r from-gold to-yellow-600 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" /> Marketing Staff
              </button>
              <button
                type="button"
                onClick={() => { setAuthRoleTab('customer'); setAuthError(''); }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  authRoleTab === 'customer'
                    ? 'bg-gradient-to-r from-gold to-yellow-600 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" /> Customer Lookup
              </button>
            </div>

            {/* Error Message Banner */}
            {authError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {authRoleTab === 'executive' ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Executive / Staff Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="executive@royalepic.in or admin@royalepicinterior.in"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-neutral-600 text-xs focus:border-gold focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Security Password
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-neutral-600 text-xs focus:border-gold focus:outline-none transition"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Registered Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={customerPhoneInput}
                        onChange={e => setCustomerPhoneInput(e.target.value)}
                        placeholder="+91 99166 33338"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-neutral-600 text-xs focus:border-gold focus:outline-none transition font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Or Project / Lead ID (Optional)
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerLeadIdInput}
                        onChange={e => setCustomerLeadIdInput(e.target.value)}
                        placeholder="LEAD-101 or RE-QT-2026"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-neutral-600 text-xs focus:border-gold focus:outline-none transition font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold via-yellow-500 to-yellow-600 hover:opacity-95 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Access Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Access for Testing */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="text-center mb-3">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                  Quick Access Shortcuts
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('executive')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/40 text-[10px] text-neutral-300 hover:text-gold transition text-center cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 mx-auto mb-1 text-gold" />
                  <span>Marketing Staff</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/40 text-[10px] text-neutral-300 hover:text-gold transition text-center cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 mx-auto mb-1 text-gold" />
                  <span>Super Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('customer')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/40 text-[10px] text-neutral-300 hover:text-gold transition text-center cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-gold" />
                  <span>Client Demo</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer info */}
        <footer className="border-t border-white/5 bg-black/60 px-6 py-4 text-center text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} Royal Epic Interior & Furniture • Thanisandra, Bengaluru • Database Synced with Supabase</p>
        </footer>
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED EXECUTIVE & ADMIN VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col selection:bg-gold selection:text-black font-sans">
      
      {/* Top Portal Navigation */}
      <header className="border-b border-white/10 bg-neutral-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-black font-bold font-serif shadow-md shadow-gold/20">
            RE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-white text-base sm:text-lg">
                Royal Epic Customers & Leads
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Supabase Synced
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Connected as <span className="text-gold font-semibold">{currentUser.name}</span> ({currentUser.role.toUpperCase()})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-gold hover:bg-yellow-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-gold/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Customer Lead</span>
          </button>

          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-xs text-neutral-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-gold" />
              <span className="hidden md:inline">Admin ERP CRM</span>
            </button>
          )}

          {onBackToWebsite && (
            <button
              onClick={onBackToWebsite}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-xs text-neutral-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Main Site</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-white/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Inquiries</span>
              <Users className="w-4 h-4 text-gold" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-white">{totalLeads}</div>
            <p className="text-[11px] text-neutral-500 mt-1">Across all website & showroom channels</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900 border border-blue-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">New Submissions</span>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-blue-400">{newLeads}</div>
            <p className="text-[11px] text-neutral-500 mt-1">Pending initial follow-up</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900 border border-amber-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Site Visits</span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-400">{siteVisits}</div>
            <p className="text-[11px] text-neutral-500 mt-1">Architect measurement booked</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900 border border-emerald-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Converted / Active</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-400">{converted}</div>
            <p className="text-[11px] text-neutral-500 mt-1">Under factory production</p>
          </div>
        </div>

        {/* Search, Filter & Refresh Bar */}
        <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, city, budget..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-neutral-500 text-xs focus:border-gold focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['All', 'New', 'Site Visit Scheduled', 'BOQ Sent', 'Closed'].map((filterTab) => (
              <button
                key={filterTab}
                onClick={() => setStatusFilter(filterTab)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === filterTab
                    ? 'bg-gold text-black font-bold shadow-md shadow-gold/10'
                    : 'bg-black/40 text-neutral-400 hover:text-white border border-white/5'
                }`}
              >
                {filterTab}
              </button>
            ))}

            <button
              onClick={fetchCustomerLeads}
              title="Refresh Leads from Supabase"
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-gold border border-white/10 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-gold' : ''}`} />
            </button>
          </div>
        </div>

        {/* Customer Leads Table / Grid */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-gold" />
              <span>Customer Inquiries Directory</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-neutral-300">
                {filteredLeads.length} Records
              </span>
            </h2>
            <span className="text-xs text-neutral-400 hidden sm:block">
              Click on any row to open full customer dossier & action workstation
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-neutral-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-gold mx-auto" />
              <p className="text-xs">Synchronizing customer leads from Supabase PostgreSQL...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 space-y-3">
              <Users className="w-10 h-10 text-neutral-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No customer inquiries found</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No customer records match your filter criteria or search query. Click "Add Customer Lead" to record a new client.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-black/60 text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3.5">Customer & ID</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Project & Location</th>
                    <th className="px-5 py-3.5">Estimated Budget</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Source / Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.map((lead) => {
                    const statusColors = {
                      'New': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                      'Contacted': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                      'Site Visit Scheduled': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                      'BOQ Sent': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
                      'Closed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                      'In Production': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    };

                    return (
                      <tr 
                        key={lead.id}
                        onClick={() => handleOpenLead(lead)}
                        className="hover:bg-white/5 transition cursor-pointer group"
                      >
                        {/* Customer Name & ID */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-white group-hover:text-gold transition">
                            {lead.name}
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500">{lead.id}</span>
                        </td>

                        {/* Contact Details */}
                        <td className="px-5 py-4">
                          <div className="font-mono text-white flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-gold shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                          {lead.email && lead.email !== 'N/A' && (
                            <div className="text-[11px] text-neutral-400 truncate max-w-[160px] flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                              <span>{lead.email}</span>
                            </div>
                          )}
                        </td>

                        {/* Project & City */}
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">{lead.projectType}</div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span>{lead.location || 'Bengaluru'}</span>
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="px-5 py-4">
                          <span className="px-2 py-1 rounded bg-black/40 border border-white/10 text-gold font-mono font-semibold text-[11px]">
                            {lead.budget}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider inline-flex items-center gap-1 ${
                            statusColors[lead.status] || 'bg-neutral-800 text-neutral-300 border-white/10'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {lead.status}
                          </span>
                        </td>

                        {/* Date & Source */}
                        <td className="px-5 py-4">
                          <div className="text-[11px] text-neutral-300">{lead.source}</div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                            {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.name}, this is Royal Epic Interior & Furniture following up regarding your ${lead.projectType} inquiry.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Message on WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${lead.phone}`}
                              title="Call Customer"
                              className="p-1.5 rounded-lg bg-gold/20 text-gold hover:bg-gold hover:text-black transition"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleOpenLead(lead)}
                              title="View Full Dossier"
                              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ==========================================
          CUSTOMER DETAIL & ACTION DOSSIER MODAL
         ========================================== */}
      <AnimatePresence>
        {isDetailModalOpen && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative text-white shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-wider mb-1">
                    <UserCheck className="w-3 h-3" /> Customer Detail Dossier
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                    {selectedLead.name}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    ID: {selectedLead.id} • Source: {selectedLead.source}
                  </p>
                </div>

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 rounded-full bg-black/40 text-neutral-400 hover:text-white border border-white/10 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Phone Number</span>
                  <div className="font-mono text-sm text-gold font-bold flex items-center justify-between">
                    <span>{selectedLead.phone}</span>
                    <a href={`tel:${selectedLead.phone}`} className="text-xs text-neutral-400 hover:text-gold">Call</a>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Email Address</span>
                  <div className="text-sm text-white truncate">{selectedLead.email || 'N/A'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Project / Service Type</span>
                  <div className="text-sm text-white font-medium">{selectedLead.projectType}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Budget Range</span>
                  <div className="text-sm text-gold font-mono font-bold">{selectedLead.budget}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Site Location</span>
                  <div className="text-sm text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>{selectedLead.location || 'Bengaluru'}</span>
                  </div>
                </div>
              </div>

              {/* Executive Workstation & Status Updater */}
              <div className="p-5 rounded-2xl bg-neutral-950/80 border border-gold/30 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" /> Executive Pipeline Update
                  </span>
                  <span className="text-[10px] text-neutral-500">Syncs to Supabase & Admin CRM</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Lead Pipeline Stage
                    </label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:border-gold focus:outline-none"
                    >
                      <option value="New">New Inquiry</option>
                      <option value="Contacted">Contacted / Initial Call</option>
                      <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                      <option value="BOQ Sent">BOQ & Estimate Sent</option>
                      <option value="Closed">Closed / In Production</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Scheduled Visit / Meeting Date
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:border-gold focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Executive Follow-up Notes & Scope Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Enter site measurement notes, material choices (Acrylic, Veneer, BWR Ply), client budget flexibility..."
                    className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder:text-neutral-600 text-xs focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    generateQuotePdf({
                      quoteId: selectedLead.id,
                      clientName: selectedLead.name,
                      clientPhone: selectedLead.phone,
                      clientEmail: selectedLead.email,
                      cityLocation: selectedLead.location,
                      projectType: selectedLead.projectType,
                      budget: selectedLead.budget,
                      message: selectedLead.notes || 'Turnkey interior execution estimate'
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-xs font-bold text-neutral-200 hover:text-white flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-gold" />
                  <span>Download Quotation PDF</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-transparent border border-white/10 hover:bg-white/5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingLead}
                    onClick={handleSaveLeadUpdate}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-yellow-600 hover:opacity-95 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold/20 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {isUpdatingLead ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          ADD NEW CUSTOMER LEAD MODAL
         ========================================== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative text-white shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Plus className="w-3 h-3" /> New Inquiry
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                    Record Customer Lead
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Direct entry for showroom walk-in, phone call, or architect referral
                  </p>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-full bg-black/40 text-neutral-400 hover:text-white border border-white/10 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateNewLead} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newLeadForm.name}
                      onChange={e => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                      placeholder="e.g. Anand Verma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newLeadForm.phone}
                      onChange={e => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                      placeholder="+91 99166 33338"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:border-gold focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newLeadForm.email}
                      onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                      placeholder="client@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Location / Apartment
                    </label>
                    <input
                      type="text"
                      value={newLeadForm.location}
                      onChange={e => setNewLeadForm({ ...newLeadForm, location: e.target.value })}
                      placeholder="Thanisandra, Bengaluru"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Project Type
                    </label>
                    <select
                      value={newLeadForm.projectType}
                      onChange={e => setNewLeadForm({ ...newLeadForm, projectType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:border-gold focus:outline-none"
                    >
                      <option value="Complete 3BHK Turnkey Interior">Complete 3BHK Turnkey Interior</option>
                      <option value="Complete 2BHK Turnkey Interior">Complete 2BHK Turnkey Interior</option>
                      <option value="Luxury Villa Interior">Luxury Villa Interior</option>
                      <option value="Modular Kitchen & Wardrobes">Modular Kitchen & Wardrobes</option>
                      <option value="Beauty Spa / Salon Fitout">Beauty Spa / Salon Fitout</option>
                      <option value="Corporate Office Interior">Corporate Office Interior</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Estimated Budget Range
                    </label>
                    <select
                      value={newLeadForm.budget}
                      onChange={e => setNewLeadForm({ ...newLeadForm, budget: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:border-gold focus:outline-none font-mono"
                    >
                      <option value="₹3.5 Lakhs - ₹6 Lakhs">₹3.5 Lakhs - ₹6 Lakhs</option>
                      <option value="₹6 Lakhs - ₹12 Lakhs">₹6 Lakhs - ₹12 Lakhs</option>
                      <option value="₹12 Lakhs - ₹25 Lakhs">₹12 Lakhs - ₹25 Lakhs</option>
                      <option value="₹25 Lakhs - ₹50 Lakhs">₹25 Lakhs - ₹50 Lakhs</option>
                      <option value="₹50 Lakhs+ Premium Luxury">₹50 Lakhs+ Premium Luxury</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Internal Executive Notes
                  </label>
                  <textarea
                    rows={3}
                    value={newLeadForm.notes}
                    onChange={e => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                    placeholder="Specific requirements, preferred materials (Acrylic, PU, BWR Ply), floor plan available..."
                    className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-neutral-600 text-xs focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-transparent border border-white/10 hover:bg-white/5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingNewLead}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-yellow-600 hover:opacity-95 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold/20 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {isSavingNewLead ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Save Customer Lead</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
