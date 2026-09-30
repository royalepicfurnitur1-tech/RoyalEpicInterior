import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Send, MessageSquare, Clock, CheckCircle2, Building,
  Instagram, Facebook, Linkedin, Youtube, Star, ExternalLink, Globe
} from 'lucide-react';
import { submitLeadToSupabase } from '../lib/supabase';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    projectType: 'Residential Interior',
    budget: '₹5 Lakhs - ₹15 Lakhs',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitLeadToSupabase({
        full_name: formData.name,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        service_type: formData.projectType,
        estimated_budget: formData.budget,
        project_scope: formData.message,
        source: 'Contact Page Section',
        status: 'new'
      });
    } catch (err) {
      console.warn('Inquiry submission error:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };


  return (
    <section className="py-20 sm:py-28 bg-[#F5F5F3] text-stone-900 relative overflow-hidden" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 font-mono block mb-2">
              Corporate Office & Experience Center
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
              Connect With Our Architects
            </h2>
          </div>
          <p className="text-sm text-stone-600 max-w-md leading-relaxed">
            Visit our experience center or schedule an on-site consultation. Our design engineers respond within 2 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Contact Info Card & Google Maps Simulation */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Contact Details Card */}
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <h3 className="text-xl font-serif font-bold text-stone-900 mb-6">
                Corporate Office & Experience Center
              </h3>

              <div className="space-y-4 text-xs text-stone-600">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <MapPin className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900 block">Main Office Address</span>
                    <span className="leading-relaxed">No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru - 560077</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <Phone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900 block">Customer Care Line</span>
                    <a href="tel:+919916633338" className="hover:text-amber-700 font-mono block text-sm font-bold text-amber-800">+91 99166 33338</a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <Mail className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-stone-900 block">Official Email Support</span>
                    <a href="mailto:royalepicfurnitur1@gmail.com" className="hover:text-amber-800 font-mono block text-stone-600">royalepicfurnitur1@gmail.com</a>
                    <a href="mailto:info@royalepic.in" className="hover:text-amber-800 font-mono block text-stone-600">info@royalepic.in</a>
                    <a href="mailto:info@royalepicinterior.in" className="hover:text-amber-800 font-mono block text-stone-600">info@royalepicinterior.in</a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900 block">Studio Hours</span>
                    <span>Mon - Sat: 9:30 AM - 8:30 PM (Sun by Appointment)</span>
                  </div>
                </div>
              </div>

              {/* Direct Instant Actions */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-stone-100">
                <a
                  href="tel:+919916633338"
                  className="py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-700" /> Direct Call
                </a>
                <a
                  href="https://wa.me/919916633338?text=Hi%20Royal%20Epic,%20I%20want%20to%20discuss%20an%20interior%20project"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            </div>

            {/* Google Maps Embed & Service Area Coverage */}
            <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">Company Showroom Location</span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium mt-1">
                    📍 No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru
                  </p>
                </div>
                <a
                  href="https://maps.google.com/?q=No.+169,+Anjanadri+Badavana,+Rachenahalli,+Thanisandra,+Bengaluru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-amber-600 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
                >
                  <Globe className="w-3.5 h-3.5" /> Directions
                </a>
              </div>

              {/* Responsive Embedded Google Map Iframe */}
              <div className="w-full h-60 rounded-2xl overflow-hidden border border-stone-200 relative bg-stone-100">
                <iframe
                  title="Royal Epic Interior Showroom Location - Thanisandra Bengaluru"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.627763636531!2d77.6232111!3d13.0612111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDAzJzQwLjQiTiA3N8KwMzcnMjMuNiJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Location Keywords Grid */}
              <div className="pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-2 font-mono">
                  📍 Active Interior Service Hubs Across North & Central Bengaluru
                </span>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-stone-600">
                  {['Thanisandra Main Rd', 'Rachenahalli Lake Rd', 'Manyata Tech Park', 'Hebbal', 'Hennur Road', 'Yelahanka', 'Sahakarnagar', 'HBR Layout', 'Kalyan Nagar', 'Jakkur', 'Devanahalli', 'Whitefield', 'Indiranagar', 'Koramangala'].map((loc) => (
                    <span key={loc} className="px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-700">
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Google My Business & Social Media Section */}
            <div className="bg-white border border-stone-200/90 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">Google Verified Business</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-amber-800 text-[10px] font-bold font-mono">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>4.9 ★ (480+ Reviews)</span>
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Visit our official Google My Business listing for client reviews, verified project photos, studio location, and driving directions.
              </p>

              <a
                href="https://maps.google.com/?q=No.+169,+Anjanadri+Badavana,+Rachenahalli,+Thanisandra,+Bengaluru+-+560077"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Open Google Maps & Reviews</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              </a>

              {/* Social Media Grid */}
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[10px] font-bold uppercase text-stone-400 block mb-2 font-mono">Follow Royal Epic On Social Media</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-400 text-stone-700 flex items-center gap-2 transition-all"
                  >
                    <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold block truncate">Instagram</span>
                      <span className="text-[9px] text-stone-400 block truncate">@royalepic</span>
                    </div>
                  </a>

                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-400 text-stone-700 flex items-center gap-2 transition-all"
                  >
                    <Facebook className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold block truncate">Facebook</span>
                      <span className="text-[9px] text-stone-400 block truncate">Royal Epic</span>
                    </div>
                  </a>

                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-400 text-stone-700 flex items-center gap-2 transition-all"
                  >
                    <Linkedin className="w-4 h-4 text-blue-700 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold block truncate">LinkedIn</span>
                      <span className="text-[9px] text-stone-400 block truncate">Company Page</span>
                    </div>
                  </a>

                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-400 text-stone-700 flex items-center gap-2 transition-all"
                  >
                    <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold block truncate">YouTube</span>
                      <span className="text-[9px] text-stone-400 block truncate">Interior Tours</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-10 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 font-mono block mb-1">
              Start Your Project
            </span>
            <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">
              Send an Instant Inquiry
            </h3>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1 font-mono">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1 font-mono">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Mobile contact number"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1 font-mono">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@domain.com"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1 font-mono">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Bengaluru, Mumbai, etc."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1 font-mono">
                      Type of Project *
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
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
                    <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1 font-mono">
                      Estimated Budget Range *
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                    >
                      <option value="₹5 Lakhs - ₹15 Lakhs">₹5 Lakhs - ₹15 Lakhs</option>
                      <option value="₹15 Lakhs - ₹30 Lakhs">₹15 Lakhs - ₹30 Lakhs</option>
                      <option value="₹30 Lakhs - ₹50 Lakhs">₹30 Lakhs - ₹50 Lakhs</option>
                      <option value="₹50 Lakhs+ (Luxury / Turnkey)">₹50 Lakhs+ (Luxury / Commercial)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-600 block mb-1 font-mono">
                    Project Requirements / Scope Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your floor plan preferences, square footage, design requirements, or timeline..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <Send className="w-4 h-4" /> {isSubmitting ? 'Submitting...' : 'Submit Project Inquiry'}
                </button>

              </form>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h4 className="text-2xl font-serif font-bold text-stone-900 mb-2">Inquiry Submitted!</h4>
                <p className="text-xs text-stone-600 max-w-sm mx-auto mb-6 leading-relaxed">
                  Thank you for contacting Royal Epic. Our senior interior architect will get back to you within 2 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-amber-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
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
