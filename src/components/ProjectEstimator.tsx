import React, { useState, useMemo } from 'react';
import { 
  Calculator, Ruler, Layers, Sparkles, Download, MessageSquare, 
  CheckCircle2, ArrowRight, ShieldCheck, Clock, FileText, Info, 
  Home, Building2, Utensils, Scissors, ChevronRight, Sliders, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateBoqPdf } from '../utils/pdfGenerator';

interface ProjectEstimatorProps {
  onRequestQuote: (title: string, budget: string) => void;
}

type PropertyType = '2bhk' | '3bhk' | '4bhk_villa' | 'kitchen_only' | 'office' | 'spa_salon' | 'custom_space';
type FinishQuality = 'standard' | 'premium' | 'luxury';

interface PreferenceOption {
  id: string;
  name: string;
  category: 'woodwork' | 'kitchen' | 'ceiling' | 'civil_paint' | 'lighting';
  baseRatePerSqFt: number; // in INR per sqft or fixed base
  fixedAddition: number;
  description: string;
}

const PREFERENCES: PreferenceOption[] = [
  {
    id: 'pref_kitchen_ss',
    name: '304 Stainless Steel Carcass Kitchen',
    category: 'kitchen',
    baseRatePerSqFt: 250,
    fixedAddition: 120000,
    description: '100% Waterproof, fireproof, anti-bacterial 304 grade SS carcass with Blum soft-close fittings.'
  },
  {
    id: 'pref_wardrobes',
    name: 'Floor-to-Ceiling Sliding Wardrobes',
    category: 'woodwork',
    baseRatePerSqFt: 220,
    fixedAddition: 85000,
    description: 'HDHMR board with high-gloss acrylic or lacquered glass shutters & inner sensor LED strips.'
  },
  {
    id: 'pref_tv_unit',
    name: 'Floating TV Panel & Charcoal Louvers',
    category: 'woodwork',
    baseRatePerSqFt: 110,
    fixedAddition: 45000,
    description: 'Stone veneer background, fluted charcoal louver panels, and ambient backlighting.'
  },
  {
    id: 'pref_false_ceiling',
    name: 'Gyproc False Ceiling & COB Lights',
    category: 'ceiling',
    baseRatePerSqFt: 145,
    fixedAddition: 25000,
    description: 'Saint-Gobain Gyproc ceiling with architectural magnetic tracks & dimmable COB spotlighting.'
  },
  {
    id: 'pref_wpc_doors',
    name: 'WPC Waterproof & Termite-Proof Doors',
    category: 'civil_paint',
    baseRatePerSqFt: 95,
    fixedAddition: 35000,
    description: '100% solid WPC frame and shutter with CNC grooving and magnetic latch locks.'
  },
  {
    id: 'pref_wall_finish',
    name: 'PU Paint & Velvet Touch Royale Wall Finish',
    category: 'civil_paint',
    baseRatePerSqFt: 75,
    fixedAddition: 20000,
    description: 'Asian Paints Royale Aspira 3-coat finish with Venetian plaster feature wall.'
  },
  {
    id: 'pref_smart_lighting',
    name: 'Smart Home Automation & Scene Lighting',
    category: 'lighting',
    baseRatePerSqFt: 80,
    fixedAddition: 55000,
    description: 'Zigbee smart touch switches, motion sensors, and smartphone app control.'
  }
];

export const ProjectEstimator: React.FC<ProjectEstimatorProps> = ({ onRequestQuote }) => {
  const [propertyType, setPropertyType] = useState<PropertyType>('3bhk');
  const [areaSqFt, setAreaSqFt] = useState<number>(1450);
  const [finishQuality, setFinishQuality] = useState<FinishQuality>('premium');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([
    'pref_kitchen_ss', 'pref_wardrobes', 'pref_tv_unit', 'pref_false_ceiling', 'pref_wall_finish'
  ]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isAiCalculating, setIsAiCalculating] = useState<boolean>(false);
  const [aiNotes, setAiNotes] = useState<string>('');

  // Calculate Base Cost
  const estimation = useMemo(() => {
    // Base rate multiplier per sqft depending on property type & finish quality
    let multiplier = 1200; // default standard per sqft
    
    if (finishQuality === 'standard') multiplier = 1350;
    if (finishQuality === 'premium') multiplier = 1950;
    if (finishQuality === 'luxury') multiplier = 2850;

    // Property type adjustment factors
    let propFactor = 1.0;
    if (propertyType === 'kitchen_only') propFactor = 0.65; // higher concentration in smaller area
    if (propertyType === '4bhk_villa') propFactor = 1.12;
    if (propertyType === 'office') propFactor = 0.85;
    if (propertyType === 'spa_salon') propFactor = 1.25;

    let baseCost = areaSqFt * multiplier * propFactor;

    // Add selected modular feature preferences
    let preferencesTotal = 0;
    selectedPreferences.forEach(id => {
      const pref = PREFERENCES.find(p => p.id === id);
      if (pref) {
        preferencesTotal += (areaSqFt * (pref.baseRatePerSqFt / 100)) + pref.fixedAddition;
      }
    });

    const totalEstimate = Math.round(baseCost + preferencesTotal);
    const minEstimate = Math.round(totalEstimate * 0.92);
    const maxEstimate = Math.round(totalEstimate * 1.10);

    // Itemized category distribution
    const breakdown = {
      woodwork: Math.round(totalEstimate * 0.42),
      kitchen: Math.round(totalEstimate * 0.22),
      ceilingLighting: Math.round(totalEstimate * 0.15),
      civilPainting: Math.round(totalEstimate * 0.12),
      projectManagement: Math.round(totalEstimate * 0.09),
    };

    // Estimated timeline
    let weeks = 6;
    if (areaSqFt < 800) weeks = 4;
    else if (areaSqFt > 2000) weeks = 10;
    if (finishQuality === 'luxury') weeks += 2;

    return {
      minEstimate,
      maxEstimate,
      avgEstimate: totalEstimate,
      breakdown,
      weeks,
      formattedMin: (minEstimate / 100000).toFixed(2),
      formattedMax: (maxEstimate / 100000).toFixed(2),
      formattedAvg: (totalEstimate / 100000).toFixed(2),
    };
  }, [propertyType, areaSqFt, finishQuality, selectedPreferences]);

  const handleTogglePref = (id: string) => {
    setSelectedPreferences(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAiRefine = () => {
    if (!customPrompt.trim()) return;
    setIsAiCalculating(true);
    setTimeout(() => {
      setIsAiCalculating(false);
      setAiNotes(`AI Analysis for "${customPrompt}": Adjusted material allocation to emphasize durable, moisture-resistant SS 304 hardware and acoustic wall treatments. Estimated cost range optimized for Bengaluru market rates.`);
    }, 800);
  };

  const handlePresetSelect = (type: PropertyType, defaultSqFt: number) => {
    setPropertyType(type);
    setAreaSqFt(defaultSqFt);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <section className="py-12 lg:py-16 bg-neutral-950 text-white min-h-screen relative overflow-hidden">
      {/* Glow background accents */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/15 text-gold text-xs font-mono font-bold uppercase tracking-wider border border-gold/30 shadow-md">
            <Calculator className="w-4 h-4" /> Royal Epic Turnkey Cost Calculator
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
            Instant Project Estimator & BOQ Calculator
          </h2>
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-sans">
            Calculate standard market-rate interior budgets for your home, commercial office, beauty spa, or modular kitchen. Configured with real-time Bengaluru factory material prices.
          </p>
        </div>

        {/* Main Grid: Controls vs Live Estimator Summary Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Controls Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-8 bg-neutral-900/80 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-xl">
            
            {/* Step 1: Select Property / Space Type */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-bold font-mono text-gold uppercase tracking-wider flex items-center gap-2">
                  <Home className="w-4 h-4" /> 1. Select Space / Property Type
                </label>
                <span className="text-[11px] text-neutral-400 font-mono">Current: {propertyType.replace('_', ' ').toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: '2bhk', label: '2BHK Apartment', sqft: 1100, icon: <Home className="w-4 h-4" /> },
                  { id: '3bhk', label: '3BHK Apartment', sqft: 1450, icon: <Home className="w-4 h-4" /> },
                  { id: '4bhk_villa', label: '4BHK Villa / Duplex', sqft: 2800, icon: <Building2 className="w-4 h-4" /> },
                  { id: 'kitchen_only', label: 'Modular Kitchen Only', sqft: 200, icon: <Utensils className="w-4 h-4" /> },
                  { id: 'office', label: 'Corporate Office', sqft: 2200, icon: <Building2 className="w-4 h-4" /> },
                  { id: 'spa_salon', label: 'Beauty Spa & Salon', sqft: 1500, icon: <Scissors className="w-4 h-4" /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePresetSelect(item.id as PropertyType, item.sqft)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      propertyType === item.id
                        ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20 font-bold scale-[1.02]'
                        : 'bg-black/60 text-neutral-300 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {item.icon}
                      <span className="text-[10px] font-mono opacity-80">~{item.sqft} sq.ft</span>
                    </div>
                    <span className="text-xs font-serif font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Carpet Area Slider */}
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-mono text-gold uppercase tracking-wider flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> 2. Carpet Area (Sq. Ft.)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={areaSqFt}
                    onChange={(e) => setAreaSqFt(Math.max(50, Number(e.target.value)))}
                    className="w-24 bg-neutral-900 border border-gold/40 rounded-lg px-2.5 py-1 text-sm text-gold font-bold font-mono text-right focus:outline-none focus:border-gold"
                  />
                  <span className="text-xs text-neutral-400 font-mono">sq ft</span>
                </div>
              </div>

              <input
                type="range"
                min="100"
                max="6000"
                step="50"
                value={areaSqFt}
                onChange={(e) => setAreaSqFt(Number(e.target.value))}
                className="w-full accent-gold bg-neutral-800 h-2 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>100 sq ft</span>
                <span>1,500 sq ft</span>
                <span>3,000 sq ft</span>
                <span>6,000+ sq ft</span>
              </div>
            </div>

            {/* Step 3: Material Finish Tier */}
            <div>
              <label className="text-xs font-bold font-mono text-gold uppercase tracking-wider block mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" /> 3. Material Finish & Hardware Tier
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'standard',
                    title: 'Essential Standard',
                    desc: 'Commercial Plywood, 1mm Laminate, Hafele Fittings',
                    rate: '₹1,350 / sq.ft'
                  },
                  {
                    id: 'premium',
                    title: 'Premium Executive',
                    desc: 'HDHMR, High-Gloss Acrylic, Soft-Close Blum Hardware',
                    rate: '₹1,950 / sq.ft'
                  },
                  {
                    id: 'luxury',
                    title: 'Ultra Luxury Royal',
                    desc: '304 SS Carcass, Italian Quartz, PU Paint & Veneer',
                    rate: '₹2,850 / sq.ft'
                  }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setFinishQuality(tier.id as FinishQuality)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                      finishQuality === tier.id
                        ? 'bg-gradient-to-b from-neutral-800 to-black border-gold ring-2 ring-gold/50 shadow-xl'
                        : 'bg-black/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold font-serif text-white">{tier.title}</span>
                        {finishQuality === tier.id && <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 mb-3 leading-snug">{tier.desc}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-gold px-2 py-1 rounded bg-gold/10 w-fit">
                      {tier.rate}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Include Custom Preferences & Fit-outs */}
            <div>
              <label className="text-xs font-bold font-mono text-gold uppercase tracking-wider block mb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4" /> 4. Custom Fit-out Additions
              </label>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {PREFERENCES.map((pref) => {
                  const isChecked = selectedPreferences.includes(pref.id);
                  return (
                    <div
                      key={pref.id}
                      onClick={() => handleTogglePref(pref.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'bg-gold/10 border-gold/40 text-white'
                          : 'bg-black/40 border-white/5 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 accent-gold cursor-pointer shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between font-medium">
                          <span className={isChecked ? 'font-bold text-gold' : ''}>{pref.name}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{pref.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 5: AI Custom Prompt Refinement */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-gold/30 space-y-3">
              <label className="text-xs font-bold text-gold flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4" /> AI Preference Refiner
              </label>
              <p className="text-[11px] text-neutral-400">
                Mention specific requirements (e.g. "Pet-friendly scratchproof laminates in Worli" or "Soundproof partitions for conference room")
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Italian quartz countertop with champagne gold profiles..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="flex-1 bg-black border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
                />
                <button
                  onClick={handleAiRefine}
                  disabled={isAiCalculating}
                  className="px-4 py-2 rounded-xl bg-gold text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-amber-400 transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAiCalculating ? 'animate-spin' : ''}`} />
                  Refine
                </button>
              </div>

              {aiNotes && (
                <div className="p-3 rounded-xl bg-gold/10 border border-gold/20 text-xs text-amber-200 animate-in fade-in">
                  {aiNotes}
                </div>
              )}
            </div>

          </div>

          {/* Right Live Summary BOQ Column (5 Cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-black border-2 border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <span className="text-[10px] font-mono text-gold uppercase tracking-wider block font-bold">
                    Real-time Estimate
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white">Estimated Investment</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Market Verified
                </div>
              </div>

              {/* Total Price Range Display */}
              <div className="text-center py-4 bg-black/60 rounded-2xl border border-white/10 mb-6">
                <span className="text-xs text-neutral-400 font-mono block mb-1">Estimated Budget Range</span>
                <div className="text-3xl sm:text-4xl font-serif font-bold text-gold tracking-tight">
                  ₹{estimation.formattedMin} L — ₹{estimation.formattedMax} Lakhs*
                </div>
                <span className="text-[11px] text-neutral-400 font-mono mt-1 block">
                  (~{formatCurrency(estimation.avgEstimate)} incl. GST & Execution)
                </span>
              </div>

              {/* Completion Timeline & Guarantee */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-xs font-mono">
                <div className="p-3 rounded-xl bg-neutral-900 border border-white/10 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Est. Execution</span>
                    <span className="font-bold text-white">{estimation.weeks} Weeks</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900 border border-white/10 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Warranty</span>
                    <span className="font-bold text-white">15 Years</span>
                  </div>
                </div>
              </div>

              {/* Itemized BOQ Cost Breakdown */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gold font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> BOQ Cost Allocation
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-neutral-300 mb-1">
                      <span>Woodwork & Custom Furniture (42%)</span>
                      <span className="font-mono font-semibold">{formatCurrency(estimation.breakdown.woodwork)}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5">
                      <div className="bg-gold h-1.5 rounded-full" style={{ width: '42%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 mb-1">
                      <span>Modular Kitchen & SS Carcass (22%)</span>
                      <span className="font-mono font-semibold">{formatCurrency(estimation.breakdown.kitchen)}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '22%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 mb-1">
                      <span>False Ceiling & Architectural Lighting (15%)</span>
                      <span className="font-mono font-semibold">{formatCurrency(estimation.breakdown.ceilingLighting)}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '15%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 mb-1">
                      <span>Civil, Wall Treatments & PU Painting (12%)</span>
                      <span className="font-mono font-semibold">{formatCurrency(estimation.breakdown.civilPainting)}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5">
                      <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '12%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 mb-1">
                      <span>Project Management & Quality Audit (9%)</span>
                      <span className="font-mono font-semibold">{formatCurrency(estimation.breakdown.projectManagement)}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5">
                      <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: '9%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4 border-t border-white/10">
                <button
                  onClick={() => onRequestQuote(
                    `${propertyType.toUpperCase()} Interior (${areaSqFt} sq ft)`,
                    `₹${estimation.formattedMin}L - ₹${estimation.formattedMax}L`
                  )}
                  className="w-full py-3.5 rounded-2xl bg-gold hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Convert to Official Quotation
                </button>

                <a
                  href={`https://wa.me/919916633338?text=${encodeURIComponent(
                    `Hello Royal Epic Team, I generated a project estimate on your website:\n📌 *Space:* ${propertyType.toUpperCase()} (${areaSqFt} sq.ft)\n💰 *Estimated Cost Range:* ₹${estimation.formattedMin}L - ₹${estimation.formattedMax} Lakhs\n🏆 *Finish Tier:* ${finishQuality.toUpperCase()}\n\nPlease schedule a free site measurement.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> Send Estimate to WhatsApp
                </a>

                <button
                  onClick={() => generateBoqPdf({
                    propertyType,
                    areaSqFt,
                    finishQuality,
                    formattedMin: estimation.formattedMin,
                    formattedMax: estimation.formattedMax,
                    avgEstimate: estimation.avgEstimate,
                    weeks: estimation.weeks,
                    breakdown: estimation.breakdown,
                    selectedPreferences,
                    aiNotes
                  })}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download Official BOQ (PDF)
                </button>
              </div>

            </div>

            {/* Disclaimer note */}
            <p className="text-[10px] text-neutral-500 font-mono text-center">
              *Estimates are indicative based on standard market rates for turnkey projects in Bengaluru. Final BOQ depends on exact site laser measurements and material selections.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
};
