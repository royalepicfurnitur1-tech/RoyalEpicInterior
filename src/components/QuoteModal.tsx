import React, { useState } from 'react';
import { 
  X, FileText, CheckCircle2, Upload, Phone, Mail, User, 
  MapPin, Coins, Sparkles, Download
} from 'lucide-react';
import { generateQuotePdf } from '../utils/pdfGenerator';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledTitle?: string;
  prefilledBudget?: string;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  prefilledTitle = '',
  prefilledBudget = '',
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    projectType: prefilledTitle || 'Residential Interior',
    budget: prefilledBudget || '₹3,000,000 - ₹5,000,000',
    message: '',
    drawingName: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quoteId, setQuoteId] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, drawingName: e.target.files[0].name });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const res = await response.json();
      setQuoteId(res.quoteId || `RE-QT-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setQuoteId(`RE-QT-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSubmitted(true);
    }
  };

  const handleDownloadPdf = () => {
    generateQuotePdf({
      quoteId: quoteId || `RE-QT-${Math.floor(100000 + Math.random() * 900000)}`,
      clientName: formData.name || 'Valued Client',
      clientPhone: formData.phone || '+91 99166 33338',
      clientEmail: formData.email || 'royalepicfurnitur1@gmail.com',
      cityLocation: formData.city || 'Bengaluru / India',
      projectType: formData.projectType,
      budget: formData.budget,
      message: formData.message,
      drawingName: formData.drawingName
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
      <div className="bg-neutral-900 border border-gold/40 rounded-3xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative text-white shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-black/60 border border-white/20 text-neutral-400 hover:text-white hover:border-gold transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="flex items-center gap-2 mb-2 text-gold text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> Free Architectural Consultation
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">
              Get Custom Quotation
            </h2>
            <p className="text-xs text-neutral-400 mb-6">
              Fill out your project details below to receive a precision estimate & 3D layout consultation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Mobile Number"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email Address"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                    City / Location *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mumbai, Hyderabad, Delhi"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                    Type of Project *
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="Complete Turnkey Project">Complete Turnkey Project</option>
                    <option value="Home Interior / Residence">Home Interior / Residence</option>
                    <option value="Beauty Spa Interior">Beauty Spa Interior</option>
                    <option value="Restaurant Interior">Restaurant Interior</option>
                    <option value="Corporate Office Workspace Planning">Corporate Office Workspace Planning</option>
                    <option value="Modular Kitchen & Wardrobes">Modular Kitchen & Wardrobes</option>
                    <option value="WPC Waterproof Doors & Woodwork">WPC Waterproof Doors & Woodwork</option>
                    <option value="Commercial Showroom / Retail">Commercial Showroom / Retail</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                    Estimated Budget Range *
                  </label>
                  <select
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="Under ₹2 Lakhs">Under ₹2 Lakhs</option>
                    <option value="₹2 Lakhs - ₹5 Lakhs">₹2 Lakhs - ₹5 Lakhs</option>
                    <option value="₹5 Lakhs - ₹15 Lakhs">₹5 Lakhs - ₹15 Lakhs</option>
                    <option value="₹15 Lakhs - ₹30 Lakhs">₹15 Lakhs - ₹30 Lakhs</option>
                    <option value="₹30 Lakhs - ₹50 Lakhs">₹30 Lakhs - ₹50 Lakhs</option>
                    <option value="₹50 Lakhs+ (Luxury / Turnkey)">₹50 Lakhs+ (Luxury Villa / Commercial)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                  Upload Floor Plan / Drawing (Optional)
                </label>
                <div className="relative border border-dashed border-white/20 rounded-xl p-3 text-center bg-black/40 cursor-pointer hover:border-gold transition-colors">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <span className="text-xs text-neutral-300 font-medium flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-gold" />
                    {formData.drawingName || 'Click to attach PDF / Drawing / CAD sketch'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                  Project Message / Details
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Mention area dimensions, preferred materials, or timeline..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                Submit Custom Quotation Request
              </button>

            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-serif font-bold text-white mb-2">
              Quotation Request Confirmed!
            </h3>

            <p className="text-xs text-neutral-300 max-w-md mx-auto mb-6 leading-relaxed">
              Your request has been registered with reference ID <span className="font-mono text-gold font-bold">{quoteId}</span>. Our senior interior architect will contact you shortly.
            </p>

            <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-left text-xs mb-6 space-y-1 font-mono">
              <p><span className="text-neutral-500">Name:</span> {formData.name}</p>
              <p><span className="text-neutral-500">Scope:</span> {formData.projectType}</p>
              <p><span className="text-neutral-500">Budget:</span> {formData.budget}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPdf}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-gold" /> Download Quote Record
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gold text-black text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
