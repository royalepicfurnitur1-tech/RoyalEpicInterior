import React, { useState, useEffect } from 'react';
import { ProjectMilestone } from '../types';
import { 
  Ruler, Layout, Factory, Truck, CheckCircle2, Clock, 
  AlertCircle, RefreshCw, ChevronDown, ChevronUp, FileCheck, 
  UserCheck, Calendar, ShieldCheck, Download, Sparkles, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_MILESTONES: ProjectMilestone[] = [
  {
    id: 'm-1',
    stageNumber: 1,
    title: 'Site Measurement & Space Audit',
    category: 'Site Engineering',
    status: 'completed',
    startDate: 'July 16, 2026',
    completedDate: 'July 17, 2026',
    targetDate: 'July 17, 2026',
    description: '3D Laser scanning and site dimensional audit conducted at Worli site premises.',
    department: 'Site Engineering',
    assignedPerson: 'Ramesh Kumar (Senior Site Engineer)',
    progressPercent: 100,
    deliverables: [
      'Laser scanned 3D floor plan',
      'Plumbing & electrical point mapping',
      'Structural clearance certificate'
    ],
    notes: 'Site clearance verified. All walls and plumbing points matched exact architectural drawings.'
  },
  {
    id: 'm-2',
    stageNumber: 2,
    title: '2D & 3D Design Approval',
    category: 'Interior Design',
    status: 'completed',
    startDate: 'July 18, 2026',
    completedDate: 'July 21, 2026',
    targetDate: 'July 22, 2026',
    description: 'Photorealistic 3D renders, material mood boards, and BOQ approved by client.',
    department: 'Design Department',
    assignedPerson: 'Priya Mehta (Lead Interior Designer)',
    progressPercent: 100,
    deliverables: [
      'High-resolution 3D walkthrough video',
      'Material swatch sample box delivered',
      'Approved BOQ & Quotation signoff'
    ],
    notes: 'Client selected Imperial Italian Quartz island counter top with champagne gold SS profile handles.'
  },
  {
    id: 'm-3',
    stageNumber: 3,
    title: 'Factory Production & SS Fabrication',
    category: 'Factory Manufacturing',
    status: 'in-progress',
    startDate: 'July 22, 2026',
    targetDate: 'August 03, 2026',
    description: 'Precision CNC cutting, 304 SS laser welding, HDHMR carcass edge-banding, and PU paint finish.',
    department: 'Factory & Purchase',
    assignedPerson: 'Suresh Verma (Factory Plant Lead)',
    progressPercent: 65,
    deliverables: [
      'CNC cut carcass panels (Completed)',
      '304 Stainless steel frame welding (Completed)',
      'Blum soft-close hardware fitment (In Progress)',
      'Quality inspection & protective film coating (Pending)'
    ],
    notes: 'Hardware fitment ongoing. Paint booth curing scheduled for July 28.'
  },
  {
    id: 'm-4',
    stageNumber: 4,
    title: 'Dispatch & On-Site Installation',
    category: 'Logistics & Installation',
    status: 'upcoming',
    startDate: 'August 04, 2026',
    targetDate: 'August 09, 2026',
    description: 'Safe transport via air-cushioned vehicle, site assembly, appliance fitting, and civil alignment.',
    department: 'Installation & Logistics',
    assignedPerson: 'Vikram Singh (Senior Field Manager)',
    progressPercent: 0,
    deliverables: [
      'Dispatched in protective wooden crates',
      'On-site assembly by certified technicians',
      'Built-in appliance integration & electrical testing'
    ],
    notes: 'Installation vehicle booked. Field team briefed on site access guidelines.'
  },
  {
    id: 'm-5',
    stageNumber: 5,
    title: 'Final Quality Audit & Project Handover',
    category: 'Quality & Handover',
    status: 'upcoming',
    startDate: 'August 10, 2026',
    targetDate: 'August 12, 2026',
    description: 'Final 50-point quality audit, site deep cleaning, warranty card issuance, and client handover.',
    department: 'Management & QC',
    assignedPerson: 'Royal Epic QA Inspector',
    progressPercent: 0,
    deliverables: [
      '50-point Quality Check clearance',
      '5-Year Warranty Certificate issuance',
      'Maintenance guide & care kit handover'
    ],
    notes: 'Project handover ceremony and key handover scheduled for August 12.'
  }
];

export const ProjectTimeline: React.FC = () => {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>('m-3');
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  const fetchMilestoneData = () => {
    setLoading(true);
    // Simulate fetching live milestone data from backend / ERP
    setTimeout(() => {
      setMilestones(MOCK_MILESTONES);
      setLoading(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastRefreshed(`Today at ${timeStr}`);
    }, 600);
  };

  useEffect(() => {
    fetchMilestoneData();
  }, []);

  const getStageIcon = (stageNumber: number, status: string) => {
    switch (stageNumber) {
      case 1:
        return <Ruler className="w-5 h-5" />;
      case 2:
        return <Layout className="w-5 h-5" />;
      case 3:
        return <Factory className="w-5 h-5" />;
      case 4:
        return <Truck className="w-5 h-5" />;
      case 5:
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Building2 className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: ProjectMilestone['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-gold border border-gold/50 shadow animate-pulse">
            <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress (65%)
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-400 border border-rose-500/40 shadow">
            <AlertCircle className="w-3.5 h-3.5" /> Delayed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 text-neutral-400 border border-white/10">
            <Calendar className="w-3.5 h-3.5" /> Upcoming
          </span>
        );
    }
  };

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const overallProgress = Math.round(
    (milestones.reduce((acc, m) => acc + m.progressPercent, 0) / (milestones.length * 100)) * 100
  ) || 0;

  return (
    <div className="space-y-8">
      
      {/* Project Overview Header Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-black border border-gold/30 rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-mono font-bold uppercase border border-gold/30">
                Project ID: RE-ORD-849201
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Updated: {lastRefreshed}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
              Worli Penthouse Italian Modular Kitchen & Bar
            </h2>

            <p className="text-xs text-neutral-400 flex items-center gap-3 font-medium">
              <span>Client: Rahul Sharma</span>
              <span>•</span>
              <span>Site Location: Worli, Mumbai</span>
              <span>•</span>
              <span>Est. Completion: Aug 12, 2026</span>
            </p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <button
              onClick={fetchMilestoneData}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-gold hover:text-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Fetching...' : 'Live Sync'}
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-gold text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF Report
            </button>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-neutral-300 uppercase tracking-wider font-mono">Overall Project Completion</span>
            <span className="text-gold font-mono text-sm">{overallProgress}%</span>
          </div>
          <div className="w-full bg-black/60 rounded-full h-3 p-0.5 border border-white/10 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-gold via-amber-400 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(212,175,55,0.6)]"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 font-mono">
            <span>{completedCount} of {milestones.length} Milestones Complete</span>
            <span className="text-emerald-400 font-semibold">Active Stage: Factory Production & SS Fabrication</span>
          </div>
        </div>
      </div>

      {/* Main Vertical Progress Track Container */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" /> Project Lifecycle Progress Track
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Real-time milestone tracking monitored by Royal Epic Project Managers and Department Leads.
            </p>
          </div>
          
          <button
            onClick={() => setExpandedId(expandedId ? null : 'm-3')}
            className="text-xs text-gold hover:underline font-bold"
          >
            {expandedId ? 'Collapse Details' : 'Expand Active Stage'}
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto" />
            <p className="text-xs text-neutral-400 font-mono">Connecting to Royal Epic ERP Live Tracker...</p>
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-8 space-y-8">
            {/* Continuous Vertical Connecting Line */}
            <div className="absolute top-6 bottom-6 left-8 sm:left-12 w-1 bg-gradient-to-b from-emerald-500 via-gold to-neutral-800 -z-0" />

            {milestones.map((m, index) => {
              const isCompleted = m.status === 'completed';
              const isInProgress = m.status === 'in-progress';
              const isExpanded = expandedId === m.id;

              return (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.07, ease: 'easeOut' }}
                  className="relative z-10"
                >
                  <div className="flex items-start gap-4 sm:gap-6">
                    
                    {/* Node Icon Circle */}
                    <div className="relative shrink-0 mt-1">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xl transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                          : isInProgress
                          ? 'bg-gradient-to-br from-gold to-amber-600 text-black ring-4 ring-gold/30 shadow-gold/40 animate-pulse'
                          : 'bg-neutral-950 text-neutral-500 border border-white/15'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-6 h-6 stroke-[2.5]" /> : getStageIcon(m.stageNumber, m.status)}
                      </div>

                      {/* Stage Number Badge */}
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black border border-white/20 text-[10px] font-mono font-bold text-white flex items-center justify-center">
                        {m.stageNumber}
                      </span>
                    </div>

                    {/* Milestone Card Content */}
                    <div className="flex-1 bg-black/60 border border-white/10 hover:border-gold/40 rounded-2xl p-5 transition-all shadow-md">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-gold font-bold">
                              Stage {m.stageNumber}: {m.category}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-serif font-bold text-white">
                            {m.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(m.status)}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : m.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                        {m.description}
                      </p>

                      {/* Dates & Personnel Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-neutral-900/80 p-3 rounded-xl border border-white/5 font-mono">
                        <div className="flex items-center gap-2 text-neutral-300">
                          <UserCheck className="w-3.5 h-3.5 text-gold shrink-0" />
                          <span className="truncate">{m.assignedPerson}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-300">
                          <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                          <span>
                            {isCompleted ? `Completed: ${m.completedDate}` : `Target: ${m.targetDate}`}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Deliverables & Notes */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-4 pt-4 border-t border-white/10 space-y-4"
                          >
                            {/* Deliverables Checklist */}
                            <div>
                              <h5 className="text-xs font-bold uppercase tracking-wider text-gold mb-2.5 flex items-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5" /> Deliverables & Inspection Checklist
                              </h5>
                              <ul className="space-y-1.5 text-xs text-neutral-300">
                                {m.deliverables.map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                      isCompleted || item.includes('(Completed)')
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                        : 'bg-neutral-800 text-neutral-500 border border-white/10'
                                    }`}>
                                      ✓
                                    </span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Department Notes */}
                            {m.notes && (
                              <div className="p-3 rounded-xl bg-gold/10 border border-gold/20 text-xs text-amber-200">
                                <span className="font-bold text-gold block mb-0.5 font-mono">Department Note:</span>
                                {m.notes}
                              </div>
                            )}

                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Support & Quality Assurance Banner */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-300">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-gold shrink-0" />
          <div>
            <h4 className="font-bold text-white text-sm">Royal Epic Quality Guarantee</h4>
            <p className="text-neutral-400">All fabrications undergo a 50-point dimensional inspection before site dispatch.</p>
          </div>
        </div>

        <a
          href="https://wa.me/919916633338"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider shrink-0 transition-colors"
        >
          Contact Site Engineer
        </a>
      </div>

    </div>
  );
};
