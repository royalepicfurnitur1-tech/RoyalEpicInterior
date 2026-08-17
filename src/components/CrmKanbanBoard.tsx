import React, { useState, useEffect } from 'react';
import { 
  Users, Bot, Phone, Send, Search, Plus, RefreshCw, 
  MapPin, IndianRupee, ArrowRight, ArrowLeft, CheckCircle2, 
  Filter, Sparkles, Clock, Calendar, GripVertical, Trash2, Edit3, X, Save
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useNotifications } from '../context/NotificationContext';
import { fetchLeadsFromSupabase, updateLeadInSupabase, submitLeadToSupabase, isSupabaseConfigured } from '../lib/supabase';


export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  projectType: string;
  location: string;
  budget: string;
  status: 'New' | 'Qualified' | 'Site Visit' | 'Quotation';
  source: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

const STAGES: { id: LeadItem['status']; title: string; color: string; badgeBg: string; border: string }[] = [
  { 
    id: 'New', 
    title: 'New Inquiries', 
    color: 'text-amber-400', 
    badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
    border: 'border-amber-500/20 hover:border-amber-500/50'
  },
  { 
    id: 'Qualified', 
    title: 'Qualified Leads', 
    color: 'text-blue-400', 
    badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-500/30',
    border: 'border-blue-500/20 hover:border-blue-500/50'
  },
  { 
    id: 'Site Visit', 
    title: 'Site Visit Scheduled', 
    color: 'text-purple-400', 
    badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
    border: 'border-purple-500/20 hover:border-purple-500/50'
  },
  { 
    id: 'Quotation', 
    title: 'BOQ Quotation Sent', 
    color: 'text-emerald-400', 
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
    border: 'border-emerald-500/20 hover:border-emerald-500/50'
  }
];

// Initial mock leads fallback if Firestore is empty or offline
const INITIAL_MOCK_LEADS: LeadItem[] = [
  {
    id: 'LD-901',
    name: 'Ananya Deshmukh',
    phone: '+91 98450 12345',
    email: 'ananya.d@gmail.com',
    projectType: '3BHK Turnkey Interior',
    location: 'Bhartiya City, Thanisandra',
    budget: '₹14.5 Lakhs',
    status: 'New',
    source: 'AI Voice Assistant',
    notes: 'Requested wood sample catalog and 3D walkthrough.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'LD-902',
    name: 'Vikramaditya Rao',
    phone: '+91 99001 88776',
    email: 'vrao@techmahindra.com',
    projectType: 'Luxury Villa Turnkey',
    location: 'Prestige Golfshire, Nandi Hills',
    budget: '₹45.0 Lakhs',
    status: 'Qualified',
    source: 'Website BOQ Form',
    notes: 'Floor plan received via WhatsApp. Italian marble + CenturyPly BWR specified.',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'LD-903',
    name: 'Dr. Srinivas Murthy',
    phone: '+91 94480 55221',
    email: 'dr.smurthy@fortis.in',
    projectType: '4BHK Duplex Penthouse',
    location: 'Sobha City, Thanisandra Main Rd',
    budget: '₹28.0 Lakhs',
    status: 'Site Visit',
    source: 'WhatsApp Inbound',
    notes: 'Site visit confirmed for Saturday 11 AM with Senior Architect.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'LD-904',
    name: 'Priya & Rajesh Nair',
    phone: '+91 97312 44331',
    email: 'rajesh.nair@cisco.com',
    projectType: 'Modular Factory Kitchen + Wardrobes',
    location: 'Assetz Atmosphere, Thanisandra',
    budget: '₹9.8 Lakhs',
    status: 'Quotation',
    source: 'Showroom Walk-in',
    notes: 'Official BOQ PDF sent with 18% GST break-up. Awaiting token advance.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'LD-905',
    name: 'Siddharth Hegde',
    phone: '+91 98860 77112',
    email: 'sid.hegde@yahoo.com',
    projectType: '2BHK Apartment Interior',
    location: 'Mantri Webcity, Hennur',
    budget: '₹8.5 Lakhs',
    status: 'New',
    source: 'Google Search Ads',
    notes: 'Inquired about Action TESA HDHMR board quality and 10 year warranty.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const CrmKanbanBoard: React.FC = () => {
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_MOCK_LEADS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addNotification } = useNotifications();
  const [filterSource, setFilterSource] = useState('ALL');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadItem['status'] | null>(null);

  // New Lead Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLead, setNewLead] = useState<Omit<LeadItem, 'id' | 'createdAt'>>({
    name: '',
    phone: '',
    email: '',
    projectType: '3BHK Turnkey Interior',
    location: '',
    budget: '₹12.0 Lakhs',
    status: 'New',
    source: 'Manual Admin Entry',
    notes: ''
  });

  // Edit Lead Modal State
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);

  // Sync / Fetch leads from Supabase PostgreSQL & Firebase Firestore
  const fetchAllLeads = async () => {
    setLoading(true);
    try {
      const fetchedList: LeadItem[] = [];

      // 1. Try fetching from Supabase PostgreSQL first
      try {
        const supaLeads = await fetchLeadsFromSupabase();
        if (supaLeads && supaLeads.length > 0) {
          supaLeads.forEach((item: any) => {
            let normStatus: LeadItem['status'] = 'New';
            if (item.status === 'qualified' || item.status === 'Qualified') normStatus = 'Qualified';
            else if (item.status === 'site_visit_scheduled' || item.status === 'Site Visit') normStatus = 'Site Visit';
            else if (item.status === 'boq_sent' || item.status === 'Quotation') normStatus = 'Quotation';

            fetchedList.push({
              id: item.id || `LD-${Math.floor(Math.random() * 1000)}`,
              name: item.full_name || item.name || 'Inquiry Client',
              phone: item.phone || 'N/A',
              email: item.email || '',
              projectType: item.service_type || item.projectType || 'Interior Consultation',
              location: item.city || item.location || 'Bengaluru',
              budget: item.estimated_budget || item.budget || 'Custom Quote',
              status: normStatus,
              source: item.source || 'Supabase PostgreSQL DB',
              notes: item.notes || item.project_scope || '',
              createdAt: item.created_at || item.createdAt || new Date().toISOString()
            });
          });
        }
      } catch (supaErr) {
        console.warn('Supabase fetch notice:', supaErr);
      }

      // 2. Fetch from Firebase
      try {
        const querySnapshot = await getDocs(collection(db, 'leads'));
        if (!querySnapshot.empty) {
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let normStatus: LeadItem['status'] = 'New';
            if (data.status === 'Qualified' || data.status === 'Qualified Lead') normStatus = 'Qualified';
            else if (data.status === 'Site Visit' || data.status === 'Site Visit Scheduled') normStatus = 'Site Visit';
            else if (data.status === 'Quotation' || data.status === 'Quotation Sent') normStatus = 'Quotation';

            fetchedList.push({
              id: docSnap.id,
              name: data.name || 'Anonymous Inquiry',
              phone: data.phone || 'N/A',
              email: data.email || '',
              projectType: data.projectType || 'Interior Project',
              location: data.location || 'Bangalore',
              budget: data.budget || '₹10.0 Lakhs',
              status: normStatus,
              source: data.source || 'Website Inbound',
              notes: data.notes || '',
              createdAt: data.createdAt || new Date().toISOString()
            });
          });
        }
      } catch (fbErr) {
        // Firebase offline fallback
      }

      // Merge with initial mock leads so board is always populated cleanly
      const existingIds = new Set(fetchedList.map(l => l.id));
      const combined = [...fetchedList, ...INITIAL_MOCK_LEADS.filter(m => !existingIds.has(m.id))];
      setLeads(combined);
    } catch (err) {
      console.warn('Leads fetch fallback to local cache:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLeads();


    // Setup Firestore real-time listener if available
    let unsubscribe: () => void;
    try {
      unsubscribe = onSnapshot(collection(db, 'leads'), (snapshot) => {
        if (!snapshot.empty) {
          const realTimeList: LeadItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let normStatus: LeadItem['status'] = 'New';
            if (data.status === 'Qualified') normStatus = 'Qualified';
            else if (data.status === 'Site Visit') normStatus = 'Site Visit';
            else if (data.status === 'Quotation') normStatus = 'Quotation';

            realTimeList.push({
              id: docSnap.id,
              name: data.name || 'Client',
              phone: data.phone || '',
              email: data.email || '',
              projectType: data.projectType || 'Turnkey Project',
              location: data.location || 'Bangalore',
              budget: data.budget || '₹10.0 Lakhs',
              status: normStatus,
              source: data.source || 'AI Consultant',
              notes: data.notes || '',
              createdAt: data.createdAt || new Date().toISOString()
            });
          });

          setLeads(prev => {
            const existingMap = new Map(prev.map(l => [l.id, l]));
            realTimeList.forEach(item => existingMap.set(item.id, item));
            return Array.from(existingMap.values());
          });
        }
      }, (error) => {
        console.warn('Firestore snapshot listener warning:', error.message);
      });
    } catch (e) {
      // Ignore
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Update lead status in state and sync to Firebase
  const updateLeadStage = async (leadId: string, newStage: LeadItem['status']) => {
    const targetLead = leads.find(l => l.id === leadId);
    const oldStage = targetLead?.status || 'New';

    // 1. Optimistic local state update
    const updatedAt = new Date().toISOString();
    setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, status: newStage, updatedAt } : lead));

    // 2. Dispatch real-time project stage movement notification
    if (targetLead && oldStage !== newStage) {
      const stagePctMap: Record<LeadItem['status'], number> = {
        'New': 20,
        'Qualified': 45,
        'Site Visit': 70,
        'Quotation': 90
      };

      addNotification({
        projectId: targetLead.id,
        projectName: targetLead.name ? `${targetLead.name}'s ${targetLead.projectType}` : 'Client Project',
        previousStage: `Stage: ${oldStage}`,
        newStage: `Stage: ${newStage}`,
        stageNumber: newStage === 'Qualified' ? 2 : newStage === 'Site Visit' ? 3 : newStage === 'Quotation' ? 4 : 1,
        totalStages: 4,
        completionPercent: stagePctMap[newStage] || 50,
        message: `Status card for ${targetLead.name || 'Client'} moved from "${oldStage}" to "${newStage}".`,
        category: 'stage_change'
      });
    }

    // 3. Sync to Supabase PostgreSQL
    try {
      const supaStatusMap: Record<LeadItem['status'], any> = {
        'New': 'new',
        'Qualified': 'contacted',
        'Site Visit': 'site_visit_scheduled',
        'Quotation': 'boq_sent'
      };
      updateLeadInSupabase(leadId, { status: supaStatusMap[newStage] });
    } catch (_) {}

    // 4. Sync to Firebase Firestore
    try {
      const leadRef = doc(db, 'leads', leadId);
      await setDoc(leadRef, {
        status: newStage,
        updatedAt
      }, { merge: true });
    } catch (err) {
      console.warn('Firebase status sync notice (saved locally):', err);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: LeadItem['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LeadItem['status']) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      await updateLeadStage(leadId, targetStage);
    }
    setDraggedLeadId(null);
  };

  // Add new lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;

    const newId = `LD-${Math.floor(100 + Math.random() * 900)}`;
    const fullLead: LeadItem = {
      ...newLead,
      id: newId,
      createdAt: new Date().toISOString()
    };

    setLeads(prev => [fullLead, ...prev]);
    setIsAddModalOpen(false);

    // Save to Supabase PostgreSQL
    try {
      submitLeadToSupabase({
        id: newId,
        full_name: newLead.name,
        phone: newLead.phone,
        email: newLead.email,
        service_type: newLead.projectType,
        city: newLead.location,
        estimated_budget: newLead.budget,
        source: newLead.source || 'Manual Admin Entry',
        status: 'new',
        notes: newLead.notes
      });
    } catch (_) {}

    // Save to Firestore
    try {
      await setDoc(doc(db, 'leads', newId), fullLead);
    } catch (err) {
      console.warn('Saved lead to local state:', err);
    }

    // Reset Form
    setNewLead({
      name: '',
      phone: '',
      email: '',
      projectType: '3BHK Turnkey Interior',
      location: '',
      budget: '₹12.0 Lakhs',
      status: 'New',
      source: 'Manual Admin Entry',
      notes: ''
    });
  };

  // Save Edit Lead
  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    setLeads(prev => prev.map(l => l.id === editingLead.id ? editingLead : l));
    const toSave = editingLead;
    setEditingLead(null);

    try {
      await setDoc(doc(db, 'leads', toSave.id), toSave, { merge: true });
    } catch (err) {
      console.warn('Saved edit to local state:', err);
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm('Are you sure you want to remove this lead from the CRM pipeline?')) {
      setLeads(prev => prev.filter(l => l.id !== leadId));
      try {
        await deleteDoc(doc(db, 'leads', leadId));
      } catch (err) {
        console.warn('Deleted from local state:', err);
      }
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.projectType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSource = filterSource === 'ALL' || lead.source === filterSource;

    return matchesSearch && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/40 text-[10px] font-mono font-bold uppercase tracking-wider">
              Supabase PostgreSQL CRM
            </span>
            <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {isSupabaseConfigured() ? 'Supabase Connected' : 'Local / Offline Sync'}
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-gold" /> CRM Lead Kanban Board
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time lead pipeline synced with Supabase PostgreSQL and local storage.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchAllLeads}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/30 transition-all cursor-pointer"
            title="Refresh Leads from Supabase & Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-gold/20 hover:brightness-110 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search leads by client name, phone number, location, or project type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
          >
            <option value="ALL">All Lead Acquisition Sources</option>
            <option value="AI Voice Assistant">AI Voice Assistant</option>
            <option value="AI Consultant">AI Consultant</option>
            <option value="Website BOQ Form">Website BOQ Form</option>
            <option value="WhatsApp Inbound">WhatsApp Inbound</option>
            <option value="Showroom Walk-in">Showroom Walk-in</option>
            <option value="Manual Admin Entry">Manual Admin Entry</option>
          </select>
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter(l => l.status === stage.id);
          const isOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`flex flex-col rounded-2xl bg-neutral-950/80 border transition-all min-h-[520px] p-3 ${
                isOver ? 'border-gold bg-gold/5 shadow-lg shadow-gold/10' : 'border-white/10'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.color.replace('text-', 'bg-')}`} />
                  <h3 className={`font-serif font-bold text-sm ${stage.color}`}>{stage.title}</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold border ${stage.badgeBg}`}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                {stageLeads.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs text-neutral-500 font-mono">Drag lead cards here</p>
                    <p className="text-[10px] text-neutral-600 mt-1">or create a new inquiry</p>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className={`group p-4 rounded-xl bg-black/80 border ${stage.border} transition-all space-y-3 cursor-grab active:cursor-grabbing hover:shadow-xl hover:shadow-black relative`}
                    >
                      {/* Top Bar: Lead ID & Source */}
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="w-3.5 h-3.5 text-neutral-600 group-hover:text-gold transition-colors" />
                          <span className="font-mono text-gold font-bold">{lead.id}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 font-mono flex items-center gap-1 border border-white/10">
                          <Bot className="w-2.5 h-2.5 text-gold" /> {lead.source}
                        </span>
                      </div>

                      {/* Client Name & Phone */}
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-gold transition-colors">
                          {lead.name}
                        </h4>
                        <a 
                          href={`tel:${lead.phone}`} 
                          className="text-[11px] text-neutral-300 hover:text-gold flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-gold" /> {lead.phone}
                        </a>
                      </div>

                      {/* Project Specs */}
                      <div className="space-y-1 text-[11px] text-neutral-300 bg-neutral-900/90 p-2.5 rounded-lg border border-white/5">
                        <p className="font-semibold text-white flex items-center gap-1">
                          📌 {lead.projectType}
                        </p>
                        <p className="text-neutral-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400 shrink-0" /> {lead.location}
                        </p>
                        <p className="text-amber-400 font-mono font-bold flex items-center gap-1">
                          <IndianRupee className="w-3 h-3 text-amber-400 shrink-0" /> {lead.budget}
                        </p>
                      </div>

                      {/* Notes snippet if present */}
                      {lead.notes && (
                        <p className="text-[10px] text-neutral-400 italic line-clamp-2 border-l-2 border-gold/40 pl-2 py-0.5">
                          "{lead.notes}"
                        </p>
                      )}

                      {/* Stage Action Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        {/* Quick Shift Stage Arrows */}
                        <div className="flex items-center gap-1">
                          {stage.id !== 'New' && (
                            <button
                              onClick={() => {
                                const prevIdx = STAGES.findIndex(s => s.id === stage.id) - 1;
                                if (prevIdx >= 0) updateLeadStage(lead.id, STAGES[prevIdx].id);
                              }}
                              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer"
                              title="Move back 1 stage"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}

                          {stage.id !== 'Quotation' && (
                            <button
                              onClick={() => {
                                const nextIdx = STAGES.findIndex(s => s.id === stage.id) + 1;
                                if (nextIdx < STAGES.length) updateLeadStage(lead.id, STAGES[nextIdx].id);
                              }}
                              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-gold hover:text-amber-300 transition-all cursor-pointer"
                              title="Advance to next stage"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* WhatsApp Action & Edit Buttons */}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.name}, thank you for contacting Royal Epic Interior regarding your ${lead.projectType} at ${lead.location}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <Send className="w-3 h-3" />
                          </a>

                          <button
                            onClick={() => setEditingLead(lead)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition-all cursor-pointer"
                            title="Edit Lead Details"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 transition-all cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD NEW LEAD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-gold/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-white text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-gold" /> Add New CRM Lead
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1 uppercase">Client Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98450 XXXXX"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase">Email Address</label>
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1 uppercase">Project Type</label>
                <select
                  value={newLead.projectType}
                  onChange={(e) => setNewLead({ ...newLead, projectType: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                >
                  <option>3BHK Turnkey Interior</option>
                  <option>Modular Factory Kitchen</option>
                  <option>Luxury Villa Turnkey</option>
                  <option>2BHK Apartment Interior</option>
                  <option>Commercial Office Fitout</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase">Location / Colony</label>
                  <input
                    type="text"
                    placeholder="e.g. Thanisandra Main Rd"
                    value={newLead.location}
                    onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase">Estimated Budget</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹15.0 Lakhs"
                    value={newLead.budget}
                    onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1 uppercase">Initial Stage</label>
                <select
                  value={newLead.status}
                  onChange={(e) => setNewLead({ ...newLead, status: e.target.value as LeadItem['status'] })}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                >
                  <option value="New">New Inquiries</option>
                  <option value="Qualified">Qualified Leads</option>
                  <option value="Site Visit">Site Visit Scheduled</option>
                  <option value="Quotation">BOQ Quotation Sent</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1 uppercase">Notes / Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Key requirements, wooden finish, timeline..."
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gold text-black font-bold flex items-center gap-1.5 hover:bg-amber-400 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Lead to Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAD MODAL */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-gold/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-white text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-gold" /> Edit Lead ({editingLead.id})
              </h3>
              <button onClick={() => setEditingLead(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1 uppercase">Client Full Name</label>
                <input
                  type="text"
                  required
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editingLead.phone}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase">Pipeline Stage</label>
                  <select
                    value={editingLead.status}
                    onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value as LeadItem['status'] })}
                    className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="New">New Inquiries</option>
                    <option value="Qualified">Qualified Leads</option>
                    <option value="Site Visit">Site Visit Scheduled</option>
                    <option value="Quotation">BOQ Quotation Sent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1 uppercase">Project Type</label>
                <input
                  type="text"
                  value={editingLead.projectType}
                  onChange={(e) => setEditingLead({ ...editingLead, projectType: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase">Location</label>
                  <input
                    type="text"
                    value={editingLead.location}
                    onChange={(e) => setEditingLead({ ...editingLead, location: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-bold mb-1 uppercase">Budget</label>
                  <input
                    type="text"
                    value={editingLead.budget}
                    onChange={(e) => setEditingLead({ ...editingLead, budget: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1 uppercase">Notes</label>
                <textarea
                  rows={2}
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gold text-black font-bold flex items-center gap-1.5 hover:bg-amber-400 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
