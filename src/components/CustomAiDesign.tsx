import React, { useState } from 'react';
import { CustomAiDesignResult } from '../types';
import { 
  Sparkles, Upload, Wand2, Palette, Clock, Coins, 
  FileCheck, ShieldCheck, Check, ArrowRight, Download, Image as ImageIcon
} from 'lucide-react';
import { generateBoqPdf } from '../utils/pdfGenerator';

interface CustomAiDesignProps {
  onRequestQuote: (conceptTitle: string, budget: string) => void;
}

export const CustomAiDesign: React.FC<CustomAiDesignProps> = ({ onRequestQuote }) => {
  const [roomType, setRoomType] = useState<string>('Luxury Modular Kitchen');
  const [style, setStyle] = useState<string>('Luxury');
  const [budget, setBudget] = useState<number>(350000);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [designResult, setDesignResult] = useState<CustomAiDesignResult | null>(null);

  const roomTypes = [
    'Luxury Modular Kitchen',
    'Royal Living Room',
    'Master Bedroom Suite',
    'Executive Corporate Office',
    'Fine Dining Restaurant',
    'Sliding Wardrobe Suite',
    'Main Entrance Door & Facade'
  ];

  const styles = [
    'Luxury',
    'Modern',
    'Minimal',
    'Traditional',
    'Contemporary'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedImageName(e.target.files[0].name);
    }
  };

  const handleGenerateAi = async () => {
    setIsLoading(true);
    setDesignResult(null);

    try {
      const response = await fetch('/api/ai-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomType,
          style,
          budget,
          customPrompt
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDesignResult(data);
      } else {
        // Fallback default
        setDesignResult({
          conceptTitle: `Royal ${style} ${roomType}`,
          description: `An exquisite ${style.toLowerCase()} concept designed by Royal Epic AI studio for your ${roomType.toLowerCase()}. Features custom teakwood paneling, rose gold anodized brass profiles, Italian marble, and warm indirect cove lighting.`,
          recommendedMaterials: [
            "18mm High-Density BWR Marine Plywood",
            "Italian Botticino Quartz Countertops",
            "Rose Gold Anodized Aluminum Frames",
            "Soft-close Blum Tandem Drawers",
            "Fluted Acoustic Wall Paneling"
          ],
          colorPalette: ["#121212", "#D4AF37", "#F5F5F0", "#333333", "#8C7851"],
          estimatedCostRange: `₹${(budget * 0.9).toLocaleString('en-IN')} - ₹${(budget * 1.15).toLocaleString('en-IN')}`,
          timelineWeeks: "3-5 Weeks"
        });
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setDesignResult({
        conceptTitle: `Royal ${style} ${roomType}`,
        description: `Bespoke ${style.toLowerCase()} interior execution tailored to your space parameters. Incorporating 3D spatial layout, premium waterproof materials, and handcrafted metal inlays.`,
        recommendedMaterials: [
          "Seasoned Teakwood / BWR Ply",
          "Italian Marble / Quartz",
          "Tempered Fluted Glass",
          "Smart Soft-close Fittings"
        ],
        colorPalette: ["#121212", "#D4AF37", "#FFFFFF", "#4A4A4A"],
        estimatedCostRange: `₹${(budget * 0.95).toLocaleString('en-IN')} - ₹${(budget * 1.1).toLocaleString('en-IN')}`,
        timelineWeeks: "4 Weeks"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 bg-neutral-950 text-white relative" id="ai-design">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-3">
            <Wand2 className="w-3.5 h-3.5" /> AI Studio Concept Generator
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            Upload Image & Generate AI 3D Interior Plan
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Upload your room photo, floor plan, or rough sketch. Choose your preferred style and budget, and our Gemini AI engine will generate a instant architectural concept & cost estimate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form Column */}
          <div className="lg:col-span-6 bg-neutral-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" /> Step 1: Input Your Parameters
            </h3>

            <div className="space-y-5">
              
              {/* Room Type Selector */}
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400 block mb-2">
                  Select Room or Space Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Design Style Selector */}
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400 block mb-2">
                  Select Interior Design Aesthetic
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {styles.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStyle(st)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        style === st
                          ? 'bg-gold text-black shadow-md'
                          : 'bg-black/40 border border-white/10 text-neutral-300 hover:border-gold/40'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Range Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase text-neutral-400">
                    Target Budget Limit
                  </label>
                  <span className="text-xs font-mono font-bold text-gold">
                    ₹{budget.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={2000000}
                  step={25000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-gold cursor-pointer"
                />
              </div>

              {/* File Upload Simulation */}
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400 block mb-2">
                  Upload Room Image / Floor Plan / Sketch
                </label>
                <div className="relative border-2 border-dashed border-white/20 hover:border-gold rounded-2xl p-6 text-center bg-black/40 cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 text-gold mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-neutral-300 font-medium">
                    {uploadedImageName ? (
                      <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                        <ImageIcon className="w-4 h-4" /> {uploadedImageName}
                      </span>
                    ) : (
                      'Drag & Drop your room image or click to browse'
                    )}
                  </p>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Supports JPG, PNG, WEBP, PDF (Max 25MB)
                  </span>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400 block mb-2">
                  Special Requirements / Color Preferences
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="E.g. Want double height cove ceiling, Italian marble island, gold brass inlays, and hidden LED strip profiles..."
                  rows={3}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateAi}
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.7)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Wand2 className="w-4 h-4 animate-spin text-black" /> Generating AI Concept...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" /> Generate AI Design & Quotation
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Right Results Column */}
          <div className="lg:col-span-6">
            {!designResult && !isLoading && (
              <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[500px]">
                <Wand2 className="w-16 h-16 text-gold/30 mb-4 animate-pulse" />
                <h3 className="text-xl font-serif font-bold text-white mb-2">
                  Your AI Concept Will Appear Here
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Fill in your room parameters on the left and click "Generate AI Design" to see custom material lists, color palettes, and budget estimations.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="bg-neutral-900 border border-gold/40 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-16 h-16 rounded-full border-4 border-gold border-t-transparent animate-spin mb-6" />
                <h3 className="text-2xl font-serif font-bold text-gold mb-2">
                  Synthesizing Royal AI Concept...
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Analyzing spatial dimensions, selecting materials, and calculating precision cost estimates...
                </p>
              </div>
            )}

            {designResult && !isLoading && (
              <div className="bg-neutral-900 border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" /> AI Generated Plan
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    Est. Timeline: {designResult.timelineWeeks}
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-bold text-white mb-3">
                  {designResult.conceptTitle}
                </h3>

                <p className="text-xs text-neutral-300 leading-relaxed mb-6">
                  {designResult.description}
                </p>

                {/* Color Palette Swatches */}
                <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-xs font-bold text-gold uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Palette className="w-4 h-4" /> Suggested Color Palette
                  </span>
                  <div className="flex items-center gap-3">
                    {designResult.colorPalette.map((hex, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div
                          className="w-8 h-8 rounded-full border border-white/20 shadow-md"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-[9px] font-mono text-neutral-400">{hex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Materials */}
                <div className="mb-6">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                    Recommended Luxury Materials
                  </span>
                  <div className="space-y-1.5">
                    {designResult.recommendedMaterials.map((mat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-neutral-200">
                        <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span>{mat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estimated Budget Summary */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-gold/20 via-amber-500/10 to-transparent border border-gold/40 mb-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                      Estimated Cost Bracket
                    </span>
                    <span className="text-lg font-mono font-bold text-gold">
                      {designResult.estimatedCostRange}
                    </span>
                  </div>
                  <Coins className="w-8 h-8 text-gold opacity-80" />
                </div>

                {/* Action Triggers */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => onRequestQuote(designResult.conceptTitle, designResult.estimatedCostRange)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    Confirm & Request Official Quotation <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const estCost = designResult.estimatedCostRange.replace(/[^0-9-]/g, '').split('-');
                      const minLakhs = (parseFloat(estCost[0]) / 100000 || (budget * 0.9 / 100000)).toFixed(2);
                      const maxLakhs = (parseFloat(estCost[1]) / 100000 || (budget * 1.15 / 100000)).toFixed(2);
                      
                      generateBoqPdf({
                        propertyType: roomType,
                        areaSqFt: 1200,
                        finishQuality: style.toLowerCase(),
                        formattedMin: minLakhs,
                        formattedMax: maxLakhs,
                        avgEstimate: budget,
                        weeks: parseInt(designResult.timelineWeeks) || 4,
                        breakdown: {
                          woodwork: Math.round(budget * 0.42),
                          kitchen: Math.round(budget * 0.22),
                          ceilingLighting: Math.round(budget * 0.15),
                          civilPainting: Math.round(budget * 0.12),
                          projectManagement: Math.round(budget * 0.09)
                        },
                        aiNotes: `AI Material Spec: ${designResult.recommendedMaterials.join(', ')}`
                      });
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download AI BOQ & Specs (PDF)
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
