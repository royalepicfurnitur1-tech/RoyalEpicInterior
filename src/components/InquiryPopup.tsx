import React, { useState } from 'react';
import { X, Sparkles, Phone, User, CheckCircle2, Mail, FileText, FolderKanban, Coins } from 'lucide-react';

interface InquiryPopupProps {
  onClose: () => void;
  onSubmitLead: (name: string, phone: string, email?: string, description?: string, projectType?: string, budget?: string) => void;
}

export const InquiryPopup: React.FC<InquiryPopupProps> = ({ onClose, onSubmitLead }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState('Complete Turnkey Project');
  const [budget, setBudget] = useState('₹5 Lakhs - ₹15 Lakhs');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitLead(name, phone, email, description, projectType, budget);
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-gold/50 rounded-3xl max-w-lg w-full p-6 sm:p-7 relative text-white shadow-2xl animate-fade-in max-h-[92vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-neutral-400 hover:text-white transition-colors cursor-pointer border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-wider mb-2 border border-gold/30">
              <Sparkles className="w-3 h-3 animate-pulse" /> Project Inquiry Form
            </div>

            <h3 className="text-2xl font-serif font-bold text-white mb-1.5">
              Request Project Quote & Consultation
            </h3>

            <p className="text-xs text-neutral-300 leading-relaxed mb-5">
              Select your project type and estimated budget to get a free 3D layout consultation and itemized BOQ estimate.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Mobile Number"
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Type of Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                    Type of Project *
                  </label>
                  <div className="relative">
                    <FolderKanban className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full bg-black/70 border border-gold/40 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
                    >
                      <option value="Complete Turnkey Project">Complete Turnkey Project</option>
                      <option value="Home Interior / Villa">Home Interior / Residence</option>
                      <option value="Beauty Spa Interior">Beauty Spa Interior</option>
                      <option value="Restaurant Interior">Restaurant Interior</option>
                      <option value="Corporate Office Workspace Planning">Corporate Office Workspace</option>
                      <option value="Modular Kitchen & Wardrobes">Modular Kitchen & Wardrobes</option>
                      <option value="WPC Doors & Waterproof Millwork">WPC Doors & Waterproof Millwork</option>
                      <option value="Commercial Showroom / Retail">Commercial Showroom / Retail</option>
                    </select>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                    Estimated Budget *
                  </label>
                  <div className="relative">
                    <Coins className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-black/70 border border-gold/40 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
                    >
                      <option value="Under ₹2 Lakhs">Under ₹2 Lakhs</option>
                      <option value="₹2 Lakhs - ₹5 Lakhs">₹2 Lakhs - ₹5 Lakhs</option>
                      <option value="₹5 Lakhs - ₹15 Lakhs">₹5 Lakhs - ₹15 Lakhs</option>
                      <option value="₹15 Lakhs - ₹30 Lakhs">₹15 Lakhs - ₹30 Lakhs</option>
                      <option value="₹30 Lakhs - ₹50 Lakhs">₹30 Lakhs - ₹50 Lakhs</option>
                      <option value="₹50 Lakhs+ (Luxury / Turnkey)">₹50 Lakhs+ (Luxury / Commercial)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                  Project Notes & Message
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <textarea
                    rows={2.5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us about space dimensions, preferred style, or key requirements..."
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all cursor-pointer mt-1"
              >
                Submit Project Inquiry
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <h4 className="text-xl font-serif font-bold text-white mb-2">Inquiry Submitted Successfully!</h4>
            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              Thank you, <span className="text-gold font-bold">{name}</span>. We have logged your request for <span className="text-gold font-bold">{projectType}</span> ({budget}). Our project team will call you shortly.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

