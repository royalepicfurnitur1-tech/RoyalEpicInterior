import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Clock, Calendar, ChevronRight, Ruler, Box, Wrench, 
  Sparkles, Layers, ShieldCheck, UserCheck, FileText, ArrowRight, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface RoadmapPhase {
  id: string;
  number: number;
  title: string;
  category: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  progress: number;
  startDate: string;
  completionDate: string;
  lead: string;
  icon: React.ReactNode;
  summary: string;
  deliverables: string[];
  notes?: string;
}

export const ProjectRoadmap: React.FC = () => {
  const { userProject } = useAuth();
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('phase-3');

  const defaultPhases: RoadmapPhase[] = [
    {
      id: 'phase-1',
      number: 1,
      title: 'Site Measurement & Survey',
      category: 'Initial Planning',
      status: 'completed',
      progress: 100,
      startDate: 'Jul 10, 2026',
      completionDate: 'Jul 14, 2026',
      lead: 'Ar. Rajesh V. (Chief Surveyor)',
      icon: <Ruler className="w-5 h-5" />,
      summary: '3D Laser LiDAR site scan, wall structural validation, floor level check, and electrical/plumbing layout mapping.',
      deliverables: [
        'High-precision 3D point cloud scan',
        'Structural readiness report',
        'Raw dimensions blueprint (PDF & DWG)'
      ],
      notes: 'Site verified in Whitefield, Bangalore. Floor leveling tolerance within 2mm.'
    },
    {
      id: 'phase-2',
      number: 2,
      title: '3D Design & Material Selection',
      category: 'Design & Render',
      status: 'completed',
      progress: 100,
      startDate: 'Jul 15, 2026',
      completionDate: 'Jul 24, 2026',
      lead: 'Sanya Malhotra (Lead Interior Architect)',
      icon: <Layers className="w-5 h-5" />,
      summary: 'Photorealistic 4K render approvals, material sample box delivery (BWR plywood, Italian veneer, Hettich hardware).',
      deliverables: [
        'Approved 4K architectural renders',
        'Client signed material sample swatch box',
        'Itemized Bill of Quantities (BOQ)'
      ],
      notes: 'Customer approved Royal Walnut finish and Blum Soft-Close fittings.'
    },
    {
      id: 'phase-3',
      number: 3,
      title: 'Factory Precision Production',
      category: 'Manufacturing',
      status: 'in_progress',
      progress: 75,
      startDate: 'Jul 25, 2026',
      completionDate: 'Aug 12, 2026',
      lead: 'Vikramaditya S. (Factory Plant Head)',
      icon: <Box className="w-5 h-5" />,
      summary: 'Automated Homag CNC precision cutting, zero-joint edge-banding, and moisture-resistant PU lacquer coating.',
      deliverables: [
        'Modular carcase precision cutting (Completed)',
        'Zero-joint laser edge-banding (In Progress)',
        'Multi-coat PU lacquer surface curing (Scheduled)'
      ],
      notes: 'Carcase assemblies passed 48-hour moisture resistance QC testing.'
    },
    {
      id: 'phase-4',
      number: 4,
      title: 'Quality Control & Packaging',
      category: 'Quality Assurance',
      status: 'upcoming',
      progress: 0,
      startDate: 'Aug 13, 2026',
      completionDate: 'Aug 16, 2026',
      lead: 'Deepak Nair (Senior QA Auditor)',
      icon: <ShieldCheck className="w-5 h-5" />,
      summary: 'Full trial assembly in studio, hardware load stress test, dust-proof foam wrap & crate packaging.',
      deliverables: [
        '50-point factory audit certificate',
        'Heavy-duty wooden crate packaging',
        'Dispatched logistics tracking code'
      ],
      notes: 'Pre-dispatch trial assembly scheduled at Jigani Manufacturing Facility.'
    },
    {
      id: 'phase-5',
      number: 5,
      title: 'On-Site Assembly & Handover',
      category: 'Execution',
      status: 'upcoming',
      progress: 0,
      startDate: 'Aug 17, 2026',
      completionDate: 'Aug 22, 2026',
      lead: 'Karan Mehra (Site Installation Lead)',
      icon: <Wrench className="w-5 h-5" />,
      summary: 'Dust-free site installation, soft-close alignment, final deep polish, and 10-year warranty certificate handover.',
      deliverables: [
        'Turnkey site installation',
        'Joint inspection sign-off sheet',
        '10-Year Comprehensive Warranty Card'
      ],
      notes: 'Final white-glove cleaning & key handover ceremony planned.'
    }
  ];

  const phases = defaultPhases;
  const currentPhase = phases.find((p) => p.id === selectedPhaseId) || phases[2];

  // Calculate overall project completion percentage
  const totalProgress = Math.round(
    phases.reduce((acc, curr) => acc + curr.progress, 0) / phases.length
  );

  return (
    <div className="space-y-6">
      
      {/* Roadmap Header Summary Card */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-black border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-gold" /> Executive Project Roadmap
              </span>
              <span className="text-xs text-neutral-400 font-mono">Ref: {userProject?.id || 'RE-PROJ-8812'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {userProject?.name || 'Villa Horizon Luxury Interior Architecture'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Real-time milestone tracking across design, precision factory manufacturing, white-glove site installation, and final handover.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-black/60 border border-white/10 rounded-2xl p-4 shrink-0">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">Overall Completion</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-serif font-bold text-gold">{totalProgress}%</span>
                <span className="text-xs text-emerald-400 font-mono font-bold">On Schedule</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">Est. Handover</span>
              <span className="text-sm font-bold text-white block mt-1 font-mono">Aug 22, 2026</span>
              <span className="text-[10px] text-neutral-400 font-mono">Whitefield Site</span>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold" /> Active Stage: <strong className="text-white font-bold">Phase 3 — Factory Precision Production</strong>
            </span>
            <span className="text-gold font-bold">{totalProgress}% Total Completed</span>
          </div>
          <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-600 via-gold to-yellow-300 rounded-full shadow-lg shadow-gold/30"
            />
          </div>
        </div>
      </div>

      {/* Horizontal Interactive Timeline Bar */}
      <div className="bg-neutral-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-gold" /> Project Execution Timeline
          </h3>
          <span className="text-xs text-neutral-400 font-mono">Click any phase node for details</span>
        </div>

        {/* Horizontal Nodes Container */}
        <div className="relative py-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gold/20 scrollbar-track-neutral-950 pb-6">
          {/* Connecting Line background */}
          <div className="absolute top-[42px] left-8 right-8 h-1 bg-neutral-800 rounded-full z-0 min-w-[650px]" />

          {/* Active Progress line fill */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '55%' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute top-[42px] left-8 h-1 bg-gradient-to-r from-emerald-500 via-gold to-amber-500 rounded-full z-0 pointer-events-none"
          />

          <div className="flex items-start justify-between min-w-[700px] relative z-10 px-4">
            {phases.map((phase) => {
              const isSelected = selectedPhaseId === phase.id;
              const isCompleted = phase.status === 'completed';
              const isInProgress = phase.status === 'in_progress';

              return (
                <div
                  key={phase.id}
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className="flex flex-col items-center cursor-pointer group px-2 max-w-[130px] text-center"
                >
                  {/* Node Icon Circle */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-xl relative ${
                      isCompleted
                        ? 'bg-emerald-950 border-2 border-emerald-500 text-emerald-400 shadow-emerald-950/50'
                        : isInProgress
                        ? 'bg-gold text-neutral-950 border-2 border-yellow-200 shadow-gold/40 ring-4 ring-gold/20 animate-pulse'
                        : 'bg-neutral-950 border border-neutral-700 text-neutral-500 hover:border-neutral-500'
                    } ${isSelected ? 'ring-2 ring-white scale-105' : ''}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      phase.icon
                    )}

                    {/* Step Number Badge */}
                    <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center border ${
                      isCompleted ? 'bg-emerald-500 text-black border-emerald-300' :
                      isInProgress ? 'bg-black text-gold border-gold' :
                      'bg-neutral-800 text-neutral-400 border-neutral-600'
                    }`}>
                      {phase.number}
                    </span>
                  </motion.div>

                  {/* Phase Title & Status */}
                  <div className="mt-3 space-y-1">
                    <span className={`text-xs font-bold block transition-colors line-clamp-2 ${
                      isSelected ? 'text-gold' : 'text-neutral-200 group-hover:text-white'
                    }`}>
                      {phase.title}
                    </span>

                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      isCompleted ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                      isInProgress ? 'bg-gold/20 text-gold border border-gold/40' :
                      'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}>
                      {isCompleted ? 'Completed' : isInProgress ? `${phase.progress}% Done` : 'Upcoming'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Phase Detail Drawer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="mt-6 pt-6 border-t border-white/10 bg-black/60 rounded-2xl p-6 border border-white/5"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  currentPhase.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                  currentPhase.status === 'in_progress' ? 'bg-gold/20 text-gold border border-gold/40' :
                  'bg-neutral-800 text-neutral-400'
                }`}>
                  {currentPhase.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider">
                      Phase {currentPhase.number} • {currentPhase.category}
                    </span>
                  </div>
                  <h4 className="text-lg font-serif font-bold text-white">
                    {currentPhase.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span>{currentPhase.startDate} – {currentPhase.completionDate}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-gold" />
                  <span>{currentPhase.lead}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-5">
              {currentPhase.summary}
            </p>

            {/* Deliverables Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-900/80 p-4 rounded-xl border border-white/10 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gold font-bold block mb-2">
                  Key Phase Deliverables & Inspection Artifacts
                </span>
                <ul className="space-y-1.5 text-xs text-neutral-300 font-sans">
                  {currentPhase.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${
                        currentPhase.status === 'completed' ? 'text-emerald-400' : 'text-gold'
                      }`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {currentPhase.notes && (
                <div className="bg-neutral-900/80 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block mb-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-gold" /> Architect Field Notes
                    </span>
                    <p className="text-xs text-neutral-300 italic">
                      "{currentPhase.notes}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>Quality Assurance Rating: <strong className="text-emerald-400">5.0 / 5.0 Star</strong></span>
                    <span className="text-gold font-bold">Verified</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};
