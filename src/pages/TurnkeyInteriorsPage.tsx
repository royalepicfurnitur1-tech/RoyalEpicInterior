import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Ruler, PaintRoller, Hammer, Home } from 'lucide-react';
import { turnkeyService, TurnkeyServiceFeature, TurnkeyServiceTimeline } from '../services/turnkeyService';

interface TurnkeyInteriorsPageProps {
  onNavigate: (path: string) => void;
  onRequestQuote: (title: string) => void;
}

export const TurnkeyInteriorsPage: React.FC<TurnkeyInteriorsPageProps> = ({
  onNavigate,
  onRequestQuote
}) => {
  const [features, setFeatures] = useState<TurnkeyServiceFeature[]>([]);
  const [timeline, setTimeline] = useState<TurnkeyServiceTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [f, t] = await Promise.all([
          turnkeyService.getFeatures(),
          turnkeyService.getTimeline()
        ]);
        setFeatures(f.filter(i => i.is_active).sort((a, b) => a.order_index - b.order_index));
        setTimeline(t.filter(i => i.is_active).sort((a, b) => a.order_index - b.order_index));
      } catch (error) {
        console.error('Error fetching turnkey data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Luxury Interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-neutral-900/60" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6 tracking-tight">
            Premium Turnkey Interior Contractors
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-neutral-200 mb-10">
            From design to execution, we manage your entire interior project with uncompromised quality, precision, and craftsmanship.
          </p>
          <button 
            onClick={() => onRequestQuote('Turnkey Interiors')}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-full transition-all text-lg font-medium"
          >
            Start Your Project
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-serif text-neutral-900 mb-4">Our Comprehensive Services</h2>
            <p className="text-neutral-600">
              We offer end-to-end solutions for residential and commercial spaces, ensuring a seamless journey from concept to reality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
              <Home className="w-12 h-12 text-amber-600 mb-6" />
              <h3 className="text-2xl font-serif text-neutral-900 mb-4">Residential Interiors</h3>
              <p className="text-neutral-600 mb-6">
                Transform your home with custom-designed living spaces, modular kitchens, luxury bedrooms, and smart home integration tailored to your lifestyle.
              </p>
              <ul className="space-y-3">
                {['Modular Kitchens & Wardrobes', 'False Ceiling & Lighting', 'Custom Furniture', 'Painting & Decor'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-700">
                    <CheckCircle2 className="w-5 h-5 text-amber-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
              <Ruler className="w-12 h-12 text-amber-600 mb-6" />
              <h3 className="text-2xl font-serif text-neutral-900 mb-4">Commercial Spaces</h3>
              <p className="text-neutral-600 mb-6">
                Create inspiring workspaces, retail environments, and hospitality venues that reflect your brand identity and optimize functionality.
              </p>
              <ul className="space-y-3">
                {['Office Layouts & Workstations', 'Retail Display & Branding', 'Acoustic Solutions', 'HVAC & Electrical Planning'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-700">
                    <CheckCircle2 className="w-5 h-5 text-amber-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-serif text-neutral-900 mb-4">Why Choose Royal Epic Interiors?</h2>
            <p className="text-neutral-600">
              Our turnkey approach eliminates the stress of coordinating multiple contractors and suppliers.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <div key={feature.id} className="text-center p-6 bg-neutral-50 rounded-xl">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Hammer className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-medium text-neutral-900 mb-3">{feature.title}</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
              {features.length === 0 && (
                <p className="text-center col-span-full text-neutral-500">No features configured.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="py-20 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-serif mb-4">Our Seamless Workflow</h2>
            <p className="text-neutral-400">
              A transparent, step-by-step process ensuring your project is delivered on time and within budget.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-800 hidden lg:block -translate-y-1/2"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {timeline.map((step, index) => (
                  <div key={step.id} className="relative z-10 bg-neutral-800/50 p-6 rounded-xl border border-neutral-700 backdrop-blur-sm">
                    <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold mb-6 mx-auto lg:mx-0">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-medium mb-3 text-center lg:text-left">{step.title}</h3>
                    <p className="text-neutral-400 text-sm text-center lg:text-left leading-relaxed">{step.description}</p>
                  </div>
                ))}
                {timeline.length === 0 && (
                   <p className="text-center col-span-full text-neutral-500">No timeline steps configured.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="py-20 bg-amber-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-serif mb-6">Ready to Transform Your Space?</h2>
          <p className="text-amber-100 mb-10 text-lg">
            Schedule a consultation with our interior experts today and take the first step towards your dream interior.
          </p>
          <button 
            onClick={() => onRequestQuote('Turnkey Interiors')}
            className="bg-white text-amber-900 hover:bg-neutral-50 px-8 py-4 rounded-full transition-all text-lg font-medium"
          >
            Get a Free Estimate
          </button>
        </div>
      </div>
    </div>
  );
};
