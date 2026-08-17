import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Send, MessageSquare, Clock, CheckCircle2, Building,
  Instagram, Facebook, Linkedin, Youtube, Star, ExternalLink, Globe
} from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    projectType: 'Residential Interior',
    budget: '₹1,500,000 - ₹3,000,000',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="py-20 bg-neutral-950 text-white relative overflow-hidden" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-3">
            <Building className="w-3.5 h-3.5" /> Royal Headquarters & Design Studio
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            Connect With Our Interior Architects
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Visit our experience center or schedule an on-site consultation. Our design engineers respond within 2 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Contact Info Card & Google Maps Simulation */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Contact Details Card */}
            <div className="bg-neutral-900 border border-gold/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

              <h3 className="text-xl font-serif font-bold text-white mb-6">
                Corporate Office & Experience Center
              </h3>

              <div className="space-y-4 text-xs text-neutral-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                  <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Main Office Address</span>
                    <span>No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru - 560077</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                  <Phone className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Customer Care Line</span>
                    <a href="tel:+919916633338" className="hover:text-gold font-mono block text-sm font-bold text-gold">+91 99166 33338</a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                  <Mail className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-white block">Official Email Support</span>
                    <a href="mailto:royalepicfurnitur1@gmail.com" className="hover:text-gold font-mono block text-neutral-300">royalepicfurnitur1@gmail.com</a>
                    <a href="mailto:info@royalepic.in" className="hover:text-gold font-mono block text-neutral-300">info@royalepic.in</a>
                    <a href="mailto:info@royalepicinterior.in" className="hover:text-gold font-mono block text-neutral-300">info@royalepicinterior.in</a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                  <Clock className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Studio Hours</span>
                    <span>Mon - Sat: 9:30 AM - 8:30 PM (Sun by Appointment)</span>
                  </div>
                </div>
              </div>

              {/* Direct Instant Actions */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/10">
                <a
                  href="tel:+919916633338"
                  className="py-3 rounded-xl bg-white/10 hover:bg-gold hover:text-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" /> Direct Call
                </a>
                <a
                  href="https://wa.me/919916633338?text=Hi%20Royal%20Epic,%20I%20want%20to%20discuss%20an%20interior%20project"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            </div>

            {/* Google Maps Embed & Service Area Coverage */}
            <div className="bg-neutral-900 border border-gold/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Company Location & Showroom Map</span>
                  </div>
                  <p className="text-[11px] text-amber-300 font-medium mt-1">
                    📍 No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru
                  </p>
                </div>
                <a
                  href="https://maps.google.com/?q=No.+169,+Anjanadri+Badavana,+Rachenahalli,+Thanisandra,+Bengaluru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-gold text-neutral-950 hover:bg-amber-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0"
                >
                  <Globe className="w-3.5 h-3.5 text-neutral-950" /> Get Directions
                </a>
              </div>

              {/* Responsive Embedded Google Map Iframe */}
              <div className="w-full h-60 rounded-2xl overflow-hidden border border-gold/30 relative shadow-inner group">
                <iframe
                  title="Royal Epic Interior Showroom Location - Thanisandra Bengaluru"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.627763636531!2d77.6232111!3d13.0612111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDAzJzQwLjQiTiA3N8KwMzcnMjMuNiJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'grayscale(0.15) contrast(1.1)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Location Keywords Grid */}
              <div className="pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold block mb-2 font-mono">
                  📍 Active Interior Service Hubs Across North & Central Bengaluru
                </span>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-neutral-300">
                  {['Thanisandra Main Rd', 'Rachenahalli Lake Rd', 'Manyata Tech Park', 'Hebbal', 'Hennur Road', 'Yelahanka', 'Sahakarnagar', 'HBR Layout', 'Kalyan Nagar', 'Jakkur', 'Devanahalli', 'Whitefield', 'Indiranagar', 'Koramangala'].map((loc) => (
                    <span key={loc} className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-neutral-300 hover:border-gold/50 transition-colors">
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Google My Business & Social Media Section */}
            <div className="bg-neutral-900/90 border border-gold/30 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Google My Business</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-400 text-[10px] font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>4.9 ★ (480+ Reviews)</span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Visit our official Google My Business listing for client reviews, verified project photos, studio location, and driving directions.
              </p>

              <a
                href="https://maps.google.com/?q=No.+169,+Anjanadri+Badavana,+Rachenahalli,+Thanisandra,+Bengaluru+-+560077"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-gold/10 hover:bg-gold text-gold hover:text-black border border-gold/40 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Open Google Maps & Reviews</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Social Media Grid */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-2 font-mono">Follow Royal Epic On Social Media</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-black/50 border border-white/10 hover:border-pink-500/50 hover:bg-pink-500/10 text-neutral-300 hover:text-pink-400 flex items-center gap-2 transition-all"
                  >
                    <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold block truncate">Instagram</span>
                      <span className="text-[9px] text-neutral-500 block truncate">@royalepic</span>
                    </div>
                  </a>

                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-black/50 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-neutral-300 hover:text-blue-400 flex items-center gap-2 transition-all"
                  >
                    <Facebook className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold block truncate">Facebook</span>
                      <span className="text-[9px] text-neutral-500 block truncate">Royal Epic</span>
                    </div>
                  </a>

                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-black/50 border border-white/10 hover:border-blue-400/50 hover:bg-blue-400/10 text-neutral-300 hover:text-blue-400 flex items-center gap-2 transition-all"
                  >
                    <Linkedin className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold block truncate">LinkedIn</span>
                      <span className="text-[9px] text-neutral-500 block truncate">Company Page</span>
                    </div>
                  </a>

                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-black/50 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-neutral-300 hover:text-red-400 flex items-center gap-2 transition-all"
                  >
                    <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold block truncate">YouTube</span>
                      <span className="text-[9px] text-neutral-500 block truncate">Interior Tours</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7 bg-neutral-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-white mb-6">
              Send an Instant Inquiry
            </h3>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Mobile Number"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email Address"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City Name"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-gold"
                    />
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
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold cursor-pointer"
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
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold cursor-pointer"
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

                <div>
                  <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                    Project Requirements / Scope Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your room dimensions, floor plan preferences, or manufacturing specs..."
                    className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:border-gold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.7)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4 text-black" /> Submit Project Inquiry
                </button>

              </form>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
                <h4 className="text-2xl font-serif font-bold text-white mb-2">Inquiry Submitted!</h4>
                <p className="text-xs text-neutral-300 max-w-sm mx-auto mb-6">
                  Thank you for contacting Royal Epic. Our senior interior architect will get back to you within 2 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 rounded-xl bg-gold text-black text-xs font-bold uppercase"
                >
                  Send Another Message
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
