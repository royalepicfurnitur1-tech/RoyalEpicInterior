import React, { useEffect } from 'react';
import { ShieldCheck, Truck, RotateCcw, FileText, ArrowLeft, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';

export type PolicyType = 'privacy' | 'terms' | 'shipping' | 'refund';

interface PolicyPageProps {
  policyType: PolicyType;
  onNavigate: (path: string) => void;
}

interface PolicyContent {
  title: string;
  badge: string;
  lastUpdated: string;
  icon: React.ReactNode;
  sections: {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
}

const POLICIES: Record<PolicyType, PolicyContent> = {
  privacy: {
    title: 'Privacy Policy',
    badge: 'Customer Data Protection',
    lastUpdated: 'October 2026',
    icon: <ShieldCheck className="w-8 h-8 text-amber-500" />,
    sections: [
      {
        heading: '1. Commitment to Privacy',
        paragraphs: [
          'Royal Epic Interior & Furniture Ltd. ("Royal Epic", "we", "us", or "our") operates https://royalepicinterior.com. We are committed to protecting the personal information and privacy of our customers, clients, and website visitors.',
          'This Privacy Policy outlines how we collect, use, store, and safeguard your data when you browse our catalog, make an online purchase, request an interior consultation, or interact with our services.'
        ]
      },
      {
        heading: '2. Information We Collect',
        paragraphs: [
          'We collect information only when necessary to provide our bespoke furniture manufacturing, delivery, installation, and architectural interior services:'
        ],
        bullets: [
          'Contact Information: Name, delivery address, billing address, phone number, and email address.',
          'Order & Transaction Records: Products purchased, variations selected, order value, payment status, and delivery instructions. Note: We do NOT store credit/debit card numbers or UPI PINs; all payments are processed securely via RBI-licensed payment gateways (such as Razorpay).',
          'Consultation Details: Site blueprints, room measurements, style preferences, and project budget.',
          'Technical Information: IP address, browser type, device information, and anonymous usage statistics collected via Google Analytics to optimize site performance.'
        ]
      },
      {
        heading: '3. How We Use Your Information',
        paragraphs: [
          'Your personal data is strictly utilized for legitimate business operations:'
        ],
        bullets: [
          'Fulfilling furniture orders, processing payments, arranging factory dispatch, and coordinating installation.',
          'Sending transactional notifications, tax invoices, order tracking updates, and warranty certificates.',
          'Responding to consultation enquiries, customer service requests, and website feedback.',
          'Preventing fraudulent transactions and ensuring compliance with applicable Indian commercial laws.'
        ]
      },
      {
        heading: '4. Data Sharing & Third Parties',
        paragraphs: [
          'Royal Epic Interior does NOT sell, rent, trade, or monetize your personal information to third parties. We share data strictly with trusted service partners on a need-to-know basis:',
          'Delivery Partners: Courier and transport providers (e.g., direct company fleet, Blue Dart, SafeExpress) receive your name, address, and phone number solely for delivery fulfillment.',
          'Payment Gateway: Encrypted transaction requests sent to Razorpay for secure checkout verification.',
          'Legal Compliance: Information disclosed only when required by law, subpoena, or lawful government directive.'
        ]
      },
      {
        heading: '5. Data Security & Retention',
        paragraphs: [
          'All communication between your browser and royalepicinterior.com is encrypted using 256-bit Secure Socket Layer (SSL/TLS). Customer records are stored in secure databases with role-based access control.',
          'We retain personal records for as long as necessary to maintain factory warranty coverage, process returns, and comply with statutory tax and accounting retention requirements.'
        ]
      },
      {
        heading: '6. Your Rights & Contact Information',
        paragraphs: [
          'You have the right to review, update, or request the deletion of your personal contact records at any time. For privacy inquiries, please contact our Data Protection Officer at enquiry@royalepicinterior.com or call +91 99166 33338.'
        ]
      }
    ]
  },
  terms: {
    title: 'Terms & Conditions',
    badge: 'User Agreement & Commercial Terms',
    lastUpdated: 'October 2026',
    icon: <FileText className="w-8 h-8 text-amber-500" />,
    sections: [
      {
        heading: '1. Agreement to Terms',
        paragraphs: [
          'By accessing or using https://royalepicinterior.com, placing an order, or commissioning an interior turnkey project, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use the website.',
          'These terms apply to all visitors, registered users, and commercial clients of Royal Epic Interior & Furniture Ltd.'
        ]
      },
      {
        heading: '2. Product Specifications & Custom Craftsmanship',
        paragraphs: [
          'Royal Epic manufactures luxury furniture, doors, modular kitchens, and architectural woodwork. Because our items utilize authentic natural materials—including natural Italian marble, granite, onyx, solid Burma teak, and natural wood veneers—minor variations in grain texture, natural veining, and organic color shading are inherent characteristics of luxury craftsmanship and are not considered manufacturing defects.',
          'Digital representations, 3D showcases, and catalog photographs are calibrated to represent materials accurately, but slight visual variances may occur depending on screen display settings.'
        ]
      },
      {
        heading: '3. Pricing, GST & Payment Terms',
        paragraphs: [
          'All prices are listed in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST) unless explicitly noted otherwise.',
          'We accept online payments via Credit/Debit Cards, UPI, Net Banking, and Bank Transfer via our certified payment partner Razorpay.',
          'Prices are subject to revision without prior notice, but any confirmed order with completed payment or formal advance deposit will be honored at the contracted rate.'
        ]
      },
      {
        heading: '4. Turnkey Consultations & Site Measurements',
        paragraphs: [
          'For bespoke built-in units (such as modular kitchens and sliding wardrobes), factory manufacturing begins strictly after formal site measurement verification by our technical engineers and customer sign-off on 2D/3D layout drawings.'
        ]
      },
      {
        heading: '5. Factory Warranty & Guarantee',
        paragraphs: [
          'Royal Epic provides up to a 10-Year Factory Warranty covering structural wood integrity, anti-termite treatment, and mechanical hardware (such as soft-close drawer slides and hydraulic hinges) under normal residential use.',
          'Warranties do not cover damage caused by unauthorized dismantling, external water flooding, fire, chemical corrosion, or deliberate misuse.'
        ]
      },
      {
        heading: '6. Jurisdiction & Dispute Resolution',
        paragraphs: [
          'These Terms are governed by the laws of the Republic of India. Any legal dispute arising in connection with orders or services shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.'
        ]
      }
    ]
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    badge: 'Logistics, Transit & White-Glove Setup',
    lastUpdated: 'October 2026',
    icon: <Truck className="w-8 h-8 text-amber-500" />,
    sections: [
      {
        heading: '1. Delivery Coverage',
        paragraphs: [
          'Royal Epic Interior & Furniture delivers across all pin codes in Bengaluru and Karnataka via our dedicated company logistics fleet, and delivers nationwide across India in partnership with specialized surface freight logistics carriers (such as Blue Dart, SafeExpress, and V-Trans).'
        ]
      },
      {
        heading: '2. Shipping Rates',
        paragraphs: [
          'We believe in transparent, upfront delivery pricing without hidden surcharges:'
        ],
        bullets: [
          'Bengaluru Urban & Rural: FREE Standard Delivery on orders above ₹10,000. Orders under ₹10,000 carry a nominal flat delivery charge of ₹499.',
          'Karnataka State: Standard surface freight calculated transparently at checkout based on package weight and pin code.',
          'Rest of India: Real-time courier rates calculated at checkout. White-glove crating and bubble-wrap edge protection are included at no additional cost.'
        ]
      },
      {
        heading: '3. Processing & Delivery Timelines',
        paragraphs: [
          'Delivery timelines vary depending on whether the item is in-stock or custom-manufactured:'
        ],
        bullets: [
          'In-Stock Catalog Items (Chairs, Accent Tables, Pre-finished Panels): Dispatched within 24-48 hours. Delivery takes 2-5 business days within South India, and 5-8 business days for other states.',
          'Custom Handcrafted Furniture (Onyx Marble Dining Tables, Sofas, Wall Beds): Built to order in our Thanisandra factory. Production takes 10-18 business days, followed by 3-5 days transit.',
          'Modular Kitchens & Full Wardrobes: Manufacturing and site assembly scheduled according to the contracted project milestone timeline (typically 2-4 weeks).'
        ]
      },
      {
        heading: '4. White-Glove Delivery & Installation',
        paragraphs: [
          'For orders within Bengaluru and surrounding districts, our specialized delivery team brings the furniture into your room of choice, uncrates the protective wrapping, and completes professional assembly and leveling at no extra cost.'
        ]
      },
      {
        heading: '5. Order Tracking',
        paragraphs: [
          'Once your order leaves our Rachenahalli factory, you will receive an SMS and email notification with your tracking number and logistics link. You can also track your shipment live at any time by visiting https://royalepicinterior.com/track-order.'
        ]
      },
      {
        heading: '6. Transit Insurance & Delivery Inspection',
        paragraphs: [
          'Every shipment is 100% insured against transit damage. We request that customers inspect outer packaging upon delivery. In the rare event of transit damage, take photos and note the damage on the delivery acknowledgment slip, or contact our customer support immediately at +91 99166 33338 within 48 hours for immediate replacement.'
        ]
      }
    ]
  },
  refund: {
    title: 'Refund & Return Policy',
    badge: 'Customer Satisfaction Guarantee',
    lastUpdated: 'October 2026',
    icon: <RotateCcw className="w-8 h-8 text-amber-500" />,
    sections: [
      {
        heading: '1. 7-Day Return Window for Catalog Products',
        paragraphs: [
          'We want you to be completely satisfied with your Royal Epic purchase. For standard catalog furniture items (including dining chairs, center tables, wall decor, and pre-packaged accessories), we offer a 7-day return and exchange policy from the date of confirmed delivery.',
          'To be eligible for a return, the item must be unused, in its original condition, with all factory labels, accessories, and protective packaging intact.'
        ]
      },
      {
        heading: '2. Damaged, Defective or Incorrect Items (Immediate Replacement)',
        paragraphs: [
          'Quality is the hallmark of our factory. If you receive an item that is damaged during transit, defective in workmanship, or incorrect compared to your order confirmation:'
        ],
        bullets: [
          'Notify us within 48 hours of delivery by calling +91 99166 33338 or emailing enquiry@royalepicinterior.com with clear photos of the issue.',
          'We will arrange a priority free pickup and dispatch a brand-new factory replacement at zero additional expense to you.',
          'If a replacement is not available or desired, you will receive a 100% full refund including any delivery charges paid.'
        ]
      },
      {
        heading: '3. Custom & Bespoke Orders Policy',
        paragraphs: [
          'For custom-made architectural elements, personalized dining tables with custom-cut marble, bespoke modular kitchens, and custom-upholstered sofas manufactured to non-standard customer dimensions:',
          'Because these items are manufactured to your unique specifications, returns based solely on change of mind are not accepted after factory fabrication has commenced.',
          'However, our 10-Year Factory Guarantee applies in full: any structural defect, hardware malfunction, or transit damage is repaired or replaced free of charge.'
        ]
      },
      {
        heading: '4. How to Initiate a Return',
        paragraphs: [
          'Initiating a return is simple and straightforward:'
        ],
        bullets: [
          'Step 1: Contact our support team via email (enquiry@royalepicinterior.com) or WhatsApp/Phone (+91 99166 33338) with your Order ID and reason for return.',
          'Step 2: Our logistics team will schedule a doorstep inspection and pickup from your delivery address.',
          'Step 3: Once inspected at our factory warehouse, your refund will be processed immediately.'
        ]
      },
      {
        heading: '5. Refund Method & Processing Timelines',
        paragraphs: [
          'Approved refunds are credited directly to the original payment method used during checkout (Credit/Debit Card, Net Banking, or UPI).',
          'Refunds are initiated within 2 business days of warehouse receipt. Depending on your issuing bank, the credit will reflect in your account within 5 to 7 business days.',
          'For payments made via Direct Bank Transfer or Cash on Delivery, refunds are remitted via IMPS/NEFT to the customer’s verified bank account.'
        ]
      },
      {
        heading: '6. Cancellation Policy',
        paragraphs: [
          'Standard catalog orders may be cancelled free of charge at any time prior to factory dispatch. Once an item has been dispatched, the standard 7-day return policy applies.',
          'Custom interior project contracts can be cancelled prior to material procurement with deduction only of verified preliminary 3D design and site survey costs.'
        ]
      }
    ]
  }
};

export const PolicyPage: React.FC<PolicyPageProps> = ({ policyType, onNavigate }) => {
  const policy = POLICIES[policyType] || POLICIES.privacy;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${policy.title} | Royal Epic Interior & Furniture Bengaluru`;
  }, [policyType, policy.title]);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 text-xs font-mono text-gold hover:text-white transition-colors mb-8 cursor-pointer uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        {/* Header Hero */}
        <div className="bg-neutral-950/80 border border-gold/30 rounded-3xl p-8 sm:p-12 mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gold/10 border border-gold/30">
              {policy.icon}
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-gold font-bold block">
                {policy.badge}
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white mt-1">
                {policy.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-white/10 text-xs text-neutral-400">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Governing Company</span>
              <span className="text-white font-medium">Royal Epic Interior & Furniture Ltd.</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Applicable Location</span>
              <span className="text-white font-medium">Bengaluru, Karnataka, India</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Last Reviewed</span>
              <span className="text-white font-medium">{policy.lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 bg-neutral-950/50 border border-white/10 rounded-3xl p-6 sm:p-10">
          {policy.sections.map((section, idx) => (
            <div key={idx} className="pb-8 border-b border-white/5 last:border-b-0 last:pb-0">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-gold mb-3">
                {section.heading}
              </h2>
              <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support Card */}
        <div className="mt-10 bg-neutral-950 border border-gold/20 rounded-3xl p-8">
          <h3 className="text-base font-serif font-bold text-white mb-2">
            Have Questions About This Policy?
          </h3>
          <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
            Our support and customer executive team are available Monday through Saturday (9:30 AM to 7:30 PM IST) to assist with any questions regarding orders, shipping, warranties, or privacy.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900 border border-white/5">
              <Phone className="w-4 h-4 text-gold shrink-0" />
              <div>
                <span className="text-neutral-500 block text-[10px] font-mono">Direct Helpline</span>
                <a href="tel:+919916633338" className="text-white font-bold hover:text-gold">+91 99166 33338</a>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900 border border-white/5">
              <Mail className="w-4 h-4 text-gold shrink-0" />
              <div>
                <span className="text-neutral-500 block text-[10px] font-mono">Email Support</span>
                <a href="mailto:enquiry@royalepicinterior.com" className="text-white font-medium hover:text-gold">enquiry@royalepicinterior.com</a>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900 border border-white/5">
              <MapPin className="w-4 h-4 text-gold shrink-0" />
              <div>
                <span className="text-neutral-500 block text-[10px] font-mono">Factory & Showroom</span>
                <span className="text-white font-medium">Thanisandra, Rachenahalli, Bengaluru</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links between policies */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
          <a
            href="/privacy-policy"
            onClick={(e) => { e.preventDefault(); onNavigate('/privacy-policy'); }}
            className={`px-4 py-2 rounded-xl border transition-all ${policyType === 'privacy' ? 'bg-gold text-black border-gold font-bold' : 'border-white/10 text-neutral-400 hover:text-white hover:border-gold/50'}`}
          >
            Privacy Policy
          </a>
          <a
            href="/terms-and-conditions"
            onClick={(e) => { e.preventDefault(); onNavigate('/terms-and-conditions'); }}
            className={`px-4 py-2 rounded-xl border transition-all ${policyType === 'terms' ? 'bg-gold text-black border-gold font-bold' : 'border-white/10 text-neutral-400 hover:text-white hover:border-gold/50'}`}
          >
            Terms & Conditions
          </a>
          <a
            href="/shipping-policy"
            onClick={(e) => { e.preventDefault(); onNavigate('/shipping-policy'); }}
            className={`px-4 py-2 rounded-xl border transition-all ${policyType === 'shipping' ? 'bg-gold text-black border-gold font-bold' : 'border-white/10 text-neutral-400 hover:text-white hover:border-gold/50'}`}
          >
            Shipping Policy
          </a>
          <a
            href="/refund-policy"
            onClick={(e) => { e.preventDefault(); onNavigate('/refund-policy'); }}
            className={`px-4 py-2 rounded-xl border transition-all ${policyType === 'refund' ? 'bg-gold text-black border-gold font-bold' : 'border-white/10 text-neutral-400 hover:text-white hover:border-gold/50'}`}
          >
            Refund Policy
          </a>
        </div>
      </div>
    </div>
  );
};
