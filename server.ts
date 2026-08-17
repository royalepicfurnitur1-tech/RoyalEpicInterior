import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { generateSitemapXml, generateRobotsTxt } from "./src/utils/sitemap";
import { PRODUCTS_DATA } from "./src/data/mockData";

dotenv.config();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_TLdbeJzTprNsdX";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "hGD8X1kj8RlDPZtsuT8wbsjG";

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Royal Epic Interior & Furniture" });
  });

  // STEP 1: Razorpay Create Order Endpoint
  app.post("/api/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt, isRupees } = req.body;

      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      // Calculate amount in paise (1 INR = 100 paise)
      let amountInPaise = Math.round(Number(amount));
      if (isRupees || amountInPaise < 100) {
        amountInPaise = Math.round(Number(amount) * 100);
      }

      if (amountInPaise < 100) {
        return res.status(400).json({ error: "Minimum amount must be at least 100 paise (₹1)" });
      }

      const options = {
        amount: amountInPaise,
        currency: currency || "INR",
        receipt: receipt || `rcpt_${Math.floor(Date.now() / 1000)}_${Math.floor(Math.random() * 1000)}`,
      };

      const order = await razorpay.orders.create(options);

      res.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: razorpayKeyId
      });
    } catch (error: any) {
      console.error("Razorpay Create Order Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create Razorpay order"
      });
    }
  });

  // STEP 3: Razorpay Payment Signature Verification Endpoint
  app.post("/api/verify-payment", (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: "Missing required payment verification parameters"
        });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        console.log(`Payment Verified Successfully! Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`);
        res.json({
          success: true,
          verified: true,
          message: "Payment signature verified successfully",
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id
        });
      } else {
        console.warn(`Payment Signature Mismatch! Generated: ${expectedSignature}, Received: ${razorpay_signature}`);
        res.status(400).json({
          success: false,
          verified: false,
          error: "Payment signature verification failed. Signature mismatch."
        });
      }
    } catch (error: any) {
      console.error("Razorpay Signature Verification Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error verifying payment signature"
      });
    }
  });

  // SEO Robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(generateRobotsTxt());
  });

  // SEO Sitemap.xml
  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    res.send(generateSitemapXml());
  });

  // In-Memory CRM Store for Leads
  const crmLeads: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    location: string;
    budget: string;
    projectType: string;
    preferredDate: string;
    discoveredInfo?: any;
    recommendations?: any;
    status: 'New' | 'Contacted' | 'Site Visit Scheduled' | 'BOQ Sent' | 'Closed';
    createdAt: string;
    source: string;
  }> = [
    {
      id: "LEAD-101",
      name: "Anand R. Verma",
      phone: "+91 98450 12345",
      email: "anand.verma@gmail.com",
      location: "Prestige Lakeside Habitat, Whitefield, Bengaluru",
      budget: "₹25 Lakhs - ₹35 Lakhs",
      projectType: "3BHK Luxury Apartment Interior",
      preferredDate: "2026-08-10",
      discoveredInfo: { propertyType: "Apartment", sqft: "1850", bedrooms: "3", style: "Modern Luxury" },
      status: "Site Visit Scheduled",
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      source: "AI Voice Consultant"
    },
    {
      id: "LEAD-102",
      name: "Priya Sundaram",
      phone: "+91 99001 88765",
      email: "priya.sundaram@techfirm.io",
      location: "Sobha Silicon Oasis, HSR Layout, Bengaluru",
      budget: "₹12 Lakhs - ₹18 Lakhs",
      projectType: "Modular Kitchen & Wardrobes",
      preferredDate: "2026-08-08",
      discoveredInfo: { propertyType: "Apartment", sqft: "1400", bedrooms: "2", style: "Minimalist Contemporary" },
      status: "New",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      source: "AI Chat Consultant"
    }
  ];

  // CRM GET Leads
  app.get("/api/crm/leads", (req, res) => {
    res.json({
      success: true,
      count: crmLeads.length,
      leads: crmLeads
    });
  });

  // CRM POST Lead
  app.post("/api/crm/leads", (req, res) => {
    try {
      const { name, phone, email, location, budget, projectType, preferredDate, discoveredInfo, recommendations, source } = req.body;
      
      if (!name || !phone) {
        return res.status(400).json({ success: false, error: "Name and Phone are required" });
      }

      const newLead = {
        id: `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        phone,
        email: email || "N/A",
        location: location || "Bengaluru",
        budget: budget || "Custom Quote Required",
        projectType: projectType || "Turnkey Interior Consultation",
        preferredDate: preferredDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        discoveredInfo,
        recommendations,
        status: "New" as const,
        createdAt: new Date().toISOString(),
        source: source || "AI Consultant"
      };

      crmLeads.unshift(newLead);

      console.log("🌟 New Lead saved to Royal Epic CRM:", newLead);

      res.json({
        success: true,
        leadId: newLead.id,
        message: "Lead successfully captured in Royal Epic CRM system.",
        lead: newLead
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // CMS STORE FOR PRODUCTS MANAGEMENT
  let cmsProducts = [...PRODUCTS_DATA];

  // GET All CMS Products
  app.get("/api/cms/products", (req, res) => {
    res.json({
      success: true,
      count: cmsProducts.length,
      products: cmsProducts
    });
  });

  // POST Add New Product Listing
  app.post("/api/cms/products", (req, res) => {
    try {
      const newProductData = req.body;
      if (!newProductData.name || !newProductData.price) {
        return res.status(400).json({ success: false, error: "Product name and price are required." });
      }

      const id = newProductData.id || `prod-${Math.floor(100 + Math.random() * 900)}`;
      const price = Number(newProductData.price) || 0;
      const originalPrice = Number(newProductData.originalPrice) || Math.round(price * 1.2);
      const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

      const newProduct = {
        id,
        name: newProductData.name,
        category: newProductData.category || "General Furniture",
        categorySlug: (newProductData.category || "furniture").toLowerCase().replace(/[^a-z0-9]/g, '-'),
        price,
        originalPrice,
        discount,
        rating: Number(newProductData.rating) || 4.9,
        reviewsCount: Number(newProductData.reviewsCount) || 12,
        image: newProductData.image || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        galleryImages: newProductData.galleryImages || [newProductData.image || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"],
        description: newProductData.description || "Factory crafted luxury piece by Royal Epic Interior.",
        specifications: newProductData.specifications || {
          material: "Solid Teak / Plywood Core",
          size: "Custom Dimensions",
          finish: "Italian PU Matte/Gloss",
          warranty: "10 Years Factory Guarantee",
          brand: "Royal Epic Interior",
          origin: "Bengaluru Factory"
        },
        features: newProductData.features || ["100% Termite Resistant", "Soft Close German Hardware", "Factory Finish"],
        isHot: Boolean(newProductData.isHot),
        isNew: Boolean(newProductData.isNew),
        has3dViewer: Boolean(newProductData.has3dViewer),
        inStock: newProductData.inStock !== false,
      };

      cmsProducts.unshift(newProduct);
      console.log("✅ Created new product via CMS:", newProduct.name);

      res.json({
        success: true,
        message: "Product listing successfully added to Royal Epic Catalog.",
        product: newProduct,
        allProducts: cmsProducts
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // PUT Edit Existing Product Listing
  app.put("/api/cms/products/:id", (req, res) => {
    try {
      const { id } = req.params;
      const index = cmsProducts.findIndex(p => p.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, error: "Product listing not found." });
      }

      const updatedFields = req.body;
      const existing = cmsProducts[index];

      const price = updatedFields.price !== undefined ? Number(updatedFields.price) : existing.price;
      const originalPrice = updatedFields.originalPrice !== undefined ? Number(updatedFields.originalPrice) : existing.originalPrice;
      const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

      const updatedProduct = {
        ...existing,
        ...updatedFields,
        price,
        originalPrice,
        discount,
        specifications: {
          ...existing.specifications,
          ...(updatedFields.specifications || {})
        }
      };

      cmsProducts[index] = updatedProduct;
      console.log("✏️ Updated product via CMS:", updatedProduct.name);

      res.json({
        success: true,
        message: "Product listing updated successfully.",
        product: updatedProduct,
        allProducts: cmsProducts
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // DELETE Remove Product Listing
  app.delete("/api/cms/products/:id", (req, res) => {
    try {
      const { id } = req.params;
      const initialLength = cmsProducts.length;
      cmsProducts = cmsProducts.filter(p => p.id !== id);

      if (cmsProducts.length === initialLength) {
        return res.status(404).json({ success: false, error: "Product listing not found." });
      }

      console.log("🗑️ Deleted product listing:", id);

      res.json({
        success: true,
        message: "Product listing removed successfully.",
        deletedId: id,
        allProducts: cmsProducts
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // AI Consultant Interactive Chat Endpoint
  app.post("/api/ai-consultant/chat", async (req, res) => {
    // Detailed topic-specific response generator for accurate, non-repetitive answers
    const getTopicDetails = (q: string, lang: string) => {
      const query = (q || "").toLowerCase();

      if (query.includes('kitchen') || query.includes('किचन') || query.includes('ಕಿಚನ್') || query.includes('கிச்சன்')) {
        return {
          replyText: `Here are the exact details for Royal Epic Modular Kitchens:\n\n` +
            `1. Carcase Construction: 100% Waterproof 18mm BWR/BWP Marine Plywood with anti-termite treatment.\n` +
            `2. Shutters & Finishes: 1mm Anti-fingerprint Acrylic, High-Gloss PU Lacquer, or Veneer finish.\n` +
            `3. Architectural Hardware: Soft-close Tandembox drawers & 185° clip-on hinges by Blum & Hettich.\n` +
            `4. Countertop & Backsplash: Quartz (15mm/20mm) or Italian Granite with seamless sink integration.\n` +
            `5. Appliances: Built-in Kaff/Elica Chimney, Hob, and Microwave niches.\n\n` +
            `Typical Budget Range: ₹1.8 Lakhs to ₹4.5 Lakhs (depending on layout: L-Shape, U-Shape, or Parallel Island).`,
          suggestedChips: ["Kitchen Cost Estimate", "Acrylic vs PU Finish", "Blum vs Hettich Hardware", "Book Free Site Visit"],
          recommendations: {
            recommendedServices: ["BWR Marine Plywood Kitchen", "Quartz Countertop", "Blum Soft-Close Fittings"],
            recommendedMaterials: ["18mm BWR Marine Ply", "1mm Acrylic Shutters", "Hafele Appliances"],
            estimatedBudgetRange: "₹1.8L - ₹4.5L"
          }
        };
      }

      if (query.includes('home') || query.includes('house') || query.includes('villa') || query.includes('2bhk') || query.includes('3bhk') || query.includes('apartment') || query.includes('घर') || query.includes('ಮನೆ')) {
        return {
          replyText: `Here is the full-home turnkey interior execution plan by Royal Epic:\n\n` +
            `1. Living & Dining: Custom TV wall unit with Italian marble louvers, CNC ceiling coves, and fluted paneling.\n` +
            `2. Master & Guest Bedrooms: Floor-to-ceiling sliding wardrobes, plush headboard wall paneling, and floating side tables.\n` +
            `3. Modular Kitchen & Utility: Marine ply carcase, quartz countertop, and overhead storage units.\n` +
            `4. Lighting & Ceiling: Saint-Gobain plasterboard false ceiling with 3000K warm magnetic track lights.\n` +
            `5. Turnkey Guarantee: 15-Year waterproof warranty, 45-day factory delivery, and 0% cost escalation.\n\n` +
            `Estimated Turnkey Costs: 2BHK (₹3.8L - ₹6.5L) | 3BHK (₹5.8L - ₹11.5L) | Villa (₹12L - ₹28L).`,
          suggestedChips: ["Modular Kitchen Details", "Wardrobe Designs", "Calculate 3BHK Cost", "Book Free Site Visit"],
          recommendations: {
            recommendedServices: ["Complete 3BHK Turnkey Interiors", "False Ceiling & Profile Lighting", "Custom Wardrobes"],
            recommendedMaterials: ["Greenply Marine Ply", "Asian Paints Royale", "Italian PU Polish"],
            estimatedBudgetRange: "₹3.8L - ₹11.5L"
          }
        };
      }

      if (query.includes('wardrobe') || query.includes('closet') || query.includes('वॉर्डरोब') || query.includes('ವಾರ್ಡ್‌ರೋಬ್')) {
        return {
          replyText: `Royal Epic Custom Wardrobe Specifications & Options:\n\n` +
            `1. Floor-to-Ceiling Sliding Wardrobes: Heavy-duty aluminum top-hung sliding tracks with soft-close dampers.\n` +
            `2. Shutters: Lacquered tinted glass with slim profile aluminum frames, anti-fingerprint acrylic, or natural veneer.\n` +
            `3. Internal Accessories: Hydraulic pull-down clothes hangers, velvet tie/jewel organizers, and sensor LED lighting strips.\n` +
            `4. Structural Frame: 18mm HDMR / BWR Marine Plywood guaranteed against warping for 15 years.\n\n` +
            `Pricing: ₹1,250 to ₹2,400 per Sq.Ft of elevation area.`,
          suggestedChips: ["Sliding vs Hinged Wardrobes", "Walk-in Closet Cost", "Glass Shutter Options", "Book Free Site Visit"],
          recommendations: {
            recommendedServices: ["Floor-to-Ceiling Glass Sliding Wardrobe", "Sensor LED Closet Lighting"],
            recommendedMaterials: ["Tinted Fluted Glass", "HDMR Moisture Resistant Ply"],
            estimatedBudgetRange: "₹95,000 - ₹2.5L"
          }
        };
      }

      if (query.includes('office') || query.includes('commercial') || query.includes('workplace') || query.includes('ऑफिस') || query.includes('ಆಫೀಸ್')) {
        return {
          replyText: `Turnkey Office Interior & Commercial Space Execution:\n\n` +
            `1. Workstation Pods: Modular ergonomic desks with integrated wire management & privacy screens.\n` +
            `2. Director Cabins & Conference Rooms: Double-glazed acoustic glass partitions with smart privacy film & veneer paneling.\n` +
            `3. Acoustic Ceiling & Lighting: Sound-absorbing ceiling baffles with high-CRI linear LED office diffusers.\n` +
            `4. Flooring & Reception: Heavy footfall vinyl tiles or Italian marble entry desk with 3D acrylic logo paneling.\n\n` +
            `Turnkey Commercial Rates: ₹950 to ₹1,850 per Sq.Ft (including HVAC, Electrical, and Fire Fighting Compliance).`,
          suggestedChips: ["Workstation Pricing / SqFt", "Conference Room Specs", "Corporate Turnkey Plan", "Book Site Audit"],
          recommendations: {
            recommendedServices: ["Modular Ergonomic Workstations", "Acoustic Glass Partitions", "Commercial Lighting"],
            recommendedMaterials: ["Double Glazed Glass", "Acoustic Baffles", "Commercial Vinyl Flooring"],
            estimatedBudgetRange: "₹950 - ₹1,850 / Sq.Ft"
          }
        };
      }

      if (query.includes('ceiling') || query.includes('lighting') || query.includes('सीलिंग')) {
        return {
          replyText: `Architectural False Ceiling & Ambient Lighting Solutions:\n\n` +
            `1. Materials: Original Saint-Gobain Gyproc plasterboard with heavy GI metal channel framework.\n` +
            `2. Lighting Design: Concealed warm cove channels (3000K), magnetic track spots, and COB downlights.\n` +
            `3. Accent Features: Wooden louver rafters, stretch ceiling prints, and chandelier fan reinforcements.\n\n` +
            `Pricing: Standard False Ceiling starting at ₹115 / Sq.Ft | Profile & Cove Lighting package starting at ₹45 / Sq.Ft.`,
          suggestedChips: ["Living Room Ceiling Ideas", "Magnetic Track Lights", "Per SqFt Rates", "Book Site Audit"],
          recommendations: {
            recommendedServices: ["Saint-Gobain Gyproc False Ceiling", "COB & Magnetic Track Lighting"],
            recommendedMaterials: ["Gyproc Moisture Resistant Board", "Havells LED Profile Strips"],
            estimatedBudgetRange: "₹115 - ₹165 / Sq.Ft"
          }
        };
      }

      if (query.includes('painting') || query.includes('paint') || query.includes('wall') || query.includes('पेंटिंग')) {
        return {
          replyText: `Royal Epic Professional Wall Finishes & House Painting:\n\n` +
            `1. Interior Walls: Asian Paints Royale Luxury Emulsion (Silky smooth, washable, anti-bacterial finish).\n` +
            `2. Wood Polish: Italian ICA / Sirca PU Polishes (High-Gloss or Super-Matte for doors & solid wood furniture).\n` +
            `3. Feature Accent Walls: Concrete texture, Stucco plaster, metallic stencil art, or 3D HDMR fluted louvers.\n\n` +
            `Pricing: Interior Painting starting at ₹18 / Sq.Ft | Italian PU Polish starting at ₹140 / Sq.Ft.`,
          suggestedChips: ["Royale Emulsion Colors", "Italian PU Polish Specs", "Accent Wall Textures", "Book Painter Visit"],
          recommendations: {
            recommendedServices: ["Asian Paints Royale Emulsion", "Italian PU Wood Polish"],
            recommendedMaterials: ["Royale Aspira Emulsion", "ICA Italian PU Polish"],
            estimatedBudgetRange: "₹18 - ₹140 / Sq.Ft"
          }
        };
      }

      if (query.includes('renovation') || query.includes('construction') || query.includes('turnkey')) {
        return {
          replyText: `Complete Home Renovation & Turnkey Civil Execution:\n\n` +
            `1. Civil Demolition & Tiling: Tile overlaying, bathroom remodeling, structural wall modifications.\n` +
            `2. Electrical & Plumbing: Concealed FRLS copper wiring, Grohe/Jaquar thermostatic plumbing fittings.\n` +
            `3. Modular Woodwork: In-house factory manufacturing of kitchens, wardrobes, and TV units.\n` +
            `4. Project Supervision: Dedicated Site Engineer, 3D VR alignment audits, and strict milestone tracking.\n\n` +
            `Guarantees: 15-Year Structural & Moisture Warranty, 0% Hidden Charges.`,
          suggestedChips: ["Renovation Cost Estimator", "Bathroom Remodeling", "Site Engineer Audit", "Book Site Visit"],
          recommendations: {
            recommendedServices: ["Complete Civil & Interior Renovation", "Electrical & Plumbing Overhaul"],
            recommendedMaterials: ["Somany GVT Vitrified Tiles", "Havells Copper Wire"],
            estimatedBudgetRange: "₹4.5L - ₹15L+"
          }
        };
      }

      // Generic fallback with detailed guidance
      return {
        replyText: `Thank you for consulting Royal Epic Interior & Furniture.\n\n` +
          `Regarding your inquiry about "${q}", our team provides bespoke turnkey solutions crafted directly at our 10,000 Sq.Ft Thanisandra factory.\n\n` +
          `• Materials: 100% BWR Waterproof Marine Plywood with 15-Year Warranty.\n` +
          `• Fittings: Blum & Hettich German soft-close architectural hardware.\n` +
          `• 3D VR Service: Complete photorealistic 3D renders before site execution.\n\n` +
          `Would you like an itemized BOQ estimate or a free site visit consultation with our lead architect?`,
        suggestedChips: ["Book Free Site Visit", "Modular Kitchen Cost", "3BHK Villa Interiors", "Factory Visit Request"],
        recommendations: {
          recommendedServices: ["Bespoke Interior Planning", "3D VR Design Walkthrough"],
          recommendedMaterials: ["18mm Marine Plywood", "Blum Soft-Close"],
          estimatedBudgetRange: "Customized to BOQ"
        }
      };
    };

    try {
      const { message, history = [], language = "English", userDiscovery = {} } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const topicInfo = getTopicDetails(message, language);

      const defaultSystemInstruction = `You are "Royal Epic AI Interior Consultant", an expert senior interior designer & turnkey project consultant for "Royal Epic Interior & Furniture" (www.royalepicinterior.com) in Bengaluru, India.

CRITICAL INSTRUCTIONS:
- User query: "${message}"
- Language selected: **${language}**. Write response directly in ${language}.
- Provide exact, specific technical specifications, material options, and realistic budget ranges. Never give generic repetitive answers.
- Highlight our 10,000 Sq.Ft Thanisandra Factory, 15-Year BWR Marine Plywood Warranty, Blum/Hettich hardware, and 0% cost escalation guarantee.

Return a JSON object with:
- "replyText": String (Your direct detailed architectural answer written in ${language})
- "suggestedChips": Array of 3 to 4 string prompt ideas written in ${language}
- "discoveredInfo": Object updating propertyType, city, sqft, bedrooms, style, budget if mentioned
- "recommendations": Object with recommendedServices (array), recommendedMaterials (array), layoutLightingTips (string), estimatedBudgetRange (string)
- "shouldOfferSiteVisit": Boolean (true if user asks for quote or site visit)
`;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.json({
          success: true,
          replyText: topicInfo.replyText,
          suggestedChips: topicInfo.suggestedChips,
          discoveredInfo: userDiscovery,
          recommendations: topicInfo.recommendations,
          shouldOfferSiteVisit: true
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const conversationPrompt = `
Language Selected by User: ${language}
Context Discovery So Far: ${JSON.stringify(userDiscovery)}
User Message: "${message}"

Respond strictly as valid JSON adhering to system instruction in ${language}.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: conversationPrompt,
        config: {
          systemInstruction: defaultSystemInstruction,
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);

      res.json({
        success: true,
        replyText: parsed.replyText || topicInfo.replyText,
        suggestedChips: parsed.suggestedChips || topicInfo.suggestedChips,
        discoveredInfo: { ...userDiscovery, ...parsed.discoveredInfo },
        recommendations: parsed.recommendations || topicInfo.recommendations,
        shouldOfferSiteVisit: parsed.shouldOfferSiteVisit !== undefined ? parsed.shouldOfferSiteVisit : true
      });

    } catch (error: any) {
      console.error("AI Consultant Chat Error:", error);
      const fallbackTopic = getTopicDetails(req.body.message || '', req.body.language || 'English');
      res.json({
        success: true,
        replyText: fallbackTopic.replyText,
        suggestedChips: fallbackTopic.suggestedChips,
        recommendations: fallbackTopic.recommendations,
        shouldOfferSiteVisit: true
      });
    }
  });

  // AI Voice Synthesis (Text-To-Speech) Endpoint
  app.post("/api/ai-consultant/voice-tts", async (req, res) => {
    try {
      const { text, voiceName = "Aoede", language = "English" } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || !text) {
        return res.json({ success: false, audioBase64: null, message: "TTS requires active Gemini API Key" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: `Speak warmly, clearly, and eloquently as a senior interior design consultant in ${language}: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Aoede" }
            }
          }
        }
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioBase64) {
        res.json({ success: true, audioBase64 });
      } else {
        res.json({ success: false, audioBase64: null, message: "No audio generated" });
      }
    } catch (error: any) {
      console.error("Voice TTS error:", error);
      res.json({ success: false, error: error.message });
    }
  });

  // AI Custom Interior Design Generator Endpoint
  app.post("/api/ai-design", async (req, res) => {
    try {
      const { roomType, style, budget, customPrompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        // Fallback simulated response if key not configured
        return res.json({
          success: true,
          conceptTitle: `Royal ${style} ${roomType}`,
          description: `An exquisite ${style.toLowerCase()} concept for your ${roomType.toLowerCase()}, featuring handcrafted teak elements, warm gold accent lighting, ambient ceiling coving, and premium glass partitions. Estimated budget: ₹${(budget || 250000).toLocaleString('en-IN')}.`,
          recommendedMaterials: [
            "18mm High-Density BWR Marine Plywood",
            "Italian Botticino Marble Countertops",
            "Rose Gold Anodized Aluminum Frames",
            "Soft-close Blum & Hettich Hardware",
            "Fluted Acoustic Wall Panels"
          ],
          colorPalette: ["#121212", "#D4AF37", "#F5F5F0", "#333333", "#8C7851"],
          estimatedCostRange: `₹${((budget || 250000) * 0.9).toLocaleString('en-IN')} - ₹${((budget || 250000) * 1.15).toLocaleString('en-IN')}`,
          timelineWeeks: "3-5 Weeks"
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a world-class luxury interior designer for "Royal Epic Interior & Furniture".
Generate a comprehensive custom interior design plan for a customer:
Room Type: ${roomType}
Style: ${style}
Estimated Budget: ₹${budget}
Special Instructions: ${customPrompt || "Focus on luxury, gold accents, glasswork, and ergonomic space optimization."}

Provide a JSON response with the following keys:
- conceptTitle (short catchy title)
- description (150 words professional design breakdown)
- recommendedMaterials (array of 5 luxury materials used)
- colorPalette (array of 5 hex color codes)
- estimatedCostRange (string)
- timelineWeeks (string)
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      const data = JSON.parse(text);
      res.json({ success: true, ...data });
    } catch (error: any) {
      console.error("AI Design error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate AI design concept."
      });
    }
  });

  // SAAS MULTI-TENANT ENTERPRISE ENGINE
  let saasTenants = [
    {
      id: "tenant-1",
      name: "Royal Epic Interior & Furniture Pvt Ltd",
      domain: "www.royalepicinterior.com",
      industry: "Turnkey Residential & Commercial Interiors",
      status: "Active",
      leadsCount: 142,
      projectsCount: 28,
      revenue: "₹1.85 Cr",
      aiAssistantName: "Royal Epic AI Voice Consultant",
      brandingColor: "#D4AF37"
    },
    {
      id: "tenant-2",
      name: "Royal Epic Modular Furniture Factory",
      domain: "factory.royalepicinterior.com",
      industry: "B2B CNC Cutting & OEM Furniture Manufacturing",
      status: "Active",
      leadsCount: 64,
      projectsCount: 19,
      revenue: "₹82 Lakhs",
      aiAssistantName: "Factory Bot & Cutting Assistant",
      brandingColor: "#10B981"
    },
    {
      id: "tenant-3",
      name: "Royal Epic Construction & Civil Infra",
      domain: "build.royalepicinterior.com",
      industry: "Structural Construction & Civil Engineering",
      status: "Active",
      leadsCount: 31,
      projectsCount: 7,
      revenue: "₹3.40 Cr",
      aiAssistantName: "Civil Site Engineer AI",
      brandingColor: "#3B82F6"
    }
  ];

  app.get("/api/saas/tenants", (req, res) => {
    res.json({ success: true, count: saasTenants.length, tenants: saasTenants });
  });

  app.post("/api/saas/tenants", (req, res) => {
    try {
      const newTenant = {
        id: `tenant-${Date.now()}`,
        name: req.body.name || "New Business Unit",
        domain: req.body.domain || "newbusiness.com",
        industry: req.body.industry || "General Enterprise",
        status: "Active",
        leadsCount: 0,
        projectsCount: 0,
        revenue: "₹0",
        aiAssistantName: req.body.aiAssistantName || "Enterprise AI Assistant",
        brandingColor: req.body.brandingColor || "#D4AF37"
      };
      saasTenants.push(newTenant);
      res.json({ success: true, tenant: newTenant, allTenants: saasTenants });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // AI VOICE ASSISTANT CONFIG API
  let aiAssistantConfig = {
    welcomeVoice: "Puck (Energetic Male)",
    welcomeMessage: "Welcome to Royal Epic Interior & Furniture! I am your AI Voice & Design Consultant. How can I assist you with your home or office interior today?",
    aiPersonality: "Senior Master Interior Designer & Turnkey Project Director",
    languages: ["English", "Hindi", "Kannada", "Tamil", "Telugu", "Malayalam"],
    companyInfo: "10,000 Sq.Ft In-House Factory at Thanisandra Bengaluru. 15-Year Waterproof Guarantee.",
    pricingGuidelines: "2BHK Turnkey starting at ₹3.5 Lakhs; 3BHK starting at ₹5.2 Lakhs; Villa Turnkey starting at ₹9.8 Lakhs.",
    warrantyInfo: "10-Year Factory Replacement Warranty & 15-Year BWR Waterproof Plywood Guarantee.",
    missedQuestionsLog: [
      { id: "q1", question: "Do you supply Italian Botticino Marble for staircase cladding?", frequency: 12, status: "Pending Knowledge Base" },
      { id: "q2", question: "What is the lead time for Lacquered Glass Wardrobe sliding channels?", frequency: 8, status: "Answer Added" }
    ]
  };

  app.get("/api/ai-assistant/config", (req, res) => {
    res.json({ success: true, config: aiAssistantConfig });
  });

  app.post("/api/ai-assistant/config", (req, res) => {
    try {
      aiAssistantConfig = { ...aiAssistantConfig, ...req.body };
      res.json({ success: true, message: "AI Assistant Configuration saved & deployed live to www.royalepicinterior.com", config: aiAssistantConfig });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // CMS WEBSITE PAGES & CONTENT API
  let cmsPagesContent = {
    homeHeroTitle: "Turnkey Home & Commercial Interiors in Bengaluru",
    homeHeroSubtitle: "10,000 Sq.Ft In-House Manufacturing Facility • 15-Year Waterproof Guarantee",
    bannerOfferText: "🎉 Special Festive Season Offer: Free 3D VR Walkthrough & 10% Discount on Modular Kitchens!",
    bannerOfferActive: true,
    contactAddress: "No. 169, Anjanadri Badavana, Rachenahalli, Thanisandra, Bengaluru, Karnataka 560077",
    contactPhone: "+91 99000 00000",
    contactEmail: "info@royalepicinterior.com"
  };

  app.get("/api/cms/content", (req, res) => {
    res.json({ success: true, content: cmsPagesContent });
  });

  app.post("/api/cms/content", (req, res) => {
    try {
      cmsPagesContent = { ...cmsPagesContent, ...req.body };
      res.json({ success: true, message: "Website CMS Content updated instantly.", content: cmsPagesContent });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // MATERIAL LIBRARY MASTER API
  let masterMaterials = [
    { id: "mat-1", name: "18mm BWR Marine Plywood", brand: "CenturyPly / Greenply", category: "Core Wood", pricePerSqFt: "₹120 - ₹165/sqft", warranty: "15 Years Waterproof", stockStatus: "In Stock" },
    { id: "mat-2", name: "High Density HDHMR Board", brand: "Action TESA", category: "Core Wood", pricePerSqFt: "₹85 - ₹110/sqft", warranty: "10 Years Moisture Resistant", stockStatus: "In Stock" },
    { id: "mat-3", name: "Soft Close Tandem Drawer Box", brand: "Hettich / Hafele", category: "Hardware", pricePerSqFt: "₹2,800 - ₹4,500/set", warranty: "Lifetime German Warranty", stockStatus: "In Stock" },
    { id: "mat-4", name: "Calacatta Quartz Countertop", brand: "Kalingastone", category: "Stone & Marble", pricePerSqFt: "₹280 - ₹420/sqft", warranty: "10 Years Stain Proof", stockStatus: "In Stock" },
    { id: "mat-5", name: "1.5mm Italian PU Matte Finish", brand: "Sirca / ICA", category: "Surface Finishes", pricePerSqFt: "₹180 - ₹260/sqft", warranty: "7 Years Scratch Proof", stockStatus: "In Stock" }
  ];

  app.get("/api/cms/materials", (req, res) => {
    res.json({ success: true, count: masterMaterials.length, materials: masterMaterials });
  });

  app.post("/api/cms/materials", (req, res) => {
    try {
      const newMat = { id: `mat-${Date.now()}`, ...req.body };
      masterMaterials.unshift(newMat);
      res.json({ success: true, material: newMat, allMaterials: masterMaterials });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // SEO & WEBMASTER SUITE API
  let seoConfigData = {
    metaTitle: "Best Interior Designers in Bengaluru | Royal Epic Interior & Furniture",
    metaDescription: "10,000 Sq.Ft Factory Manufactured Modular Kitchens, Wardrobes & Turnkey Home Interiors in Thanisandra, Bengaluru. Get Free 3D VR Estimate.",
    keywords: "Interior Designers Bengaluru, Modular Kitchen Thanisandra, Turnkey Interior Contractor, Wardrobes Manyata Tech Park",
    robotsTxt: "User-agent: *\nAllow: /\nSitemap: https://www.royalepicinterior.com/sitemap.xml",
    sitemapUrl: "https://www.royalepicinterior.com/sitemap.xml",
    canonicalUrl: "https://www.royalepicinterior.com",
    schemaType: "LocalBusiness / InteriorDesign"
  };

  app.get("/api/seo/config", (req, res) => {
    res.json({ success: true, config: seoConfigData });
  });

  app.post("/api/seo/config", (req, res) => {
    try {
      seoConfigData = { ...seoConfigData, ...req.body };
      res.json({ success: true, message: "SEO Meta & Webmaster rules deployed.", config: seoConfigData });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Lead / Quotation Submission Endpoint
  app.post("/api/quote", (req, res) => {
    const quoteData = req.body;
    console.log("Received new quote request:", quoteData);
    res.json({
      success: true,
      quoteId: `RE-QT-${Math.floor(100000 + Math.random() * 900000)}`,
      message: "Quotation request successfully logged. Senior designer will contact within 2 hours."
    });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Royal Epic server running on http://localhost:${PORT}`);
  });
}

startServer();
