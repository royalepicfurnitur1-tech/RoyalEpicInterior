import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mic, MicOff, Send, Volume2, VolumeX, Sparkles, Building2, User, Phone, 
  Mail, Calendar, MapPin, CheckCircle2, ShieldCheck, Award, ArrowRight, 
  Bot, RefreshCw, ChevronDown, Layers, Wrench, IndianRupee, Globe, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { submitLeadToSupabase } from '../lib/supabase';


interface AiConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote?: (prefillTitle?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestedChips?: string[];
  recommendations?: {
    recommendedServices?: string[];
    recommendedMaterials?: string[];
    layoutLightingTips?: string;
    estimatedBudgetRange?: string;
  };
}

interface UserDiscovery {
  propertyType?: string;
  city?: string;
  sqft?: string;
  bedrooms?: string;
  style?: string;
  budget?: string;
  startDate?: string;
}

export const AiConsultantModal: React.FC<AiConsultantModalProps> = ({
  isOpen,
  onClose,
  onRequestQuote
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "Welcome to Royal Epic Interior & Furniture. I'm your AI Interior Consultant with 25+ years of turnkey design & manufacturing expertise. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedChips: [
        "Design my home",
        "Modular kitchen",
        "Office interior",
        "Wardrobe",
        "Villa interior",
        "False ceiling",
        "Painting",
        "Furniture",
        "Restaurant interior",
        "Hospital interior",
        "Retail showroom",
        "Turnkey construction",
        "Renovation"
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Kannada' | 'Tamil' | 'Telugu' | 'Malayalam'>('English');
  const [autoVoice, setAutoVoice] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  // History buffer state to prevent response repetition across new query contexts
  const [historyBuffer, setHistoryBuffer] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Web Speech API Voice synthesis states & refs
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechKeepAliveRef = useRef<NodeJS.Timeout | null>(null);

  // Customer Discovery State
  const [discovery, setDiscovery] = useState<UserDiscovery>({
    city: 'Bengaluru',
    propertyType: 'Apartment',
    style: 'Modern Luxury'
  });

  // Lead Generation Drawer State
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadLocation, setLeadLocation] = useState('Bengaluru');
  const [leadBudget, setLeadBudget] = useState('₹10L - ₹20L');
  const [leadProjectType, setLeadProjectType] = useState('Full Turnkey Interior');
  const [leadPreferredDate, setLeadPreferredDate] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccessMsg, setLeadSuccessMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load and cache Web Speech API SpeechSynthesis voices dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Cleanup active audio/speech when component unmounts or modal closes
  useEffect(() => {
    return () => {
      stopAllSpeechAndAudio();
    };
  }, []);

  // Universal Stop helper for Web Speech API and HTML Audio
  const stopAllSpeechAndAudio = () => {
    if (speechKeepAliveRef.current) {
      clearInterval(speechKeepAliveRef.current);
      speechKeepAliveRef.current = null;
    }

    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (e) {}
      activeAudioRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    activeUtteranceRef.current = null;
    setCurrentlyPlayingId(null);
  };

  // Web Speech API Voice Recognition Handler
  const startVoiceInput = () => {
    stopAllSpeechAndAudio();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser tab. Please type your query directly.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    const langMap: Record<string, string> = {
      English: 'en-IN',
      Hindi: 'hi-IN',
      Kannada: 'kn-IN',
      Tamil: 'ta-IN',
      Telugu: 'te-IN',
      Malayalam: 'ml-IN'
    };

    recognition.lang = langMap[language] || 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      handleSendMessage(transcript, { isPresetChip: true });
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Clean raw AI markdown text for natural, smooth human speech
  const cleanTextForSpeech = (rawText: string): string => {
    if (!rawText) return '';

    return rawText
      .replace(/[*#_`~]/g, '') // Strip markdown formatting symbols
      .replace(/₹\s*([0-9,.]+)\s*(L|Lakhs|Lakh)?/gi, (match, p1, p2) => {
        return `${p1} ${p2 ? 'Lakhs' : ''} Rupees `;
      })
      .replace(/₹/g, ' Rupees ')
      .replace(/\bSq\.?\s*Ft\.?\b/gi, ' square feet ')
      .replace(/\bsqft\b/gi, ' square feet ')
      .replace(/\b3BHK\b/gi, ' 3 B H K ')
      .replace(/\b2BHK\b/gi, ' 2 B H K ')
      .replace(/\b1BHK\b/gi, ' 1 B H K ')
      .replace(/\bBWR\b/gi, ' B W R ')
      .replace(/\bHDMR\b/gi, ' H D M R ')
      .replace(/\bBWP\b/gi, ' B W P ')
      .replace(/\bPU\b/gi, ' P U ')
      .replace(/\bBOQ\b/gi, ' B O Q ')
      .replace(/\bVR\b/gi, ' V R ')
      .replace(/\bLED\b/gi, ' L E D ')
      .replace(/\bCNC\b/gi, ' C N C ')
      .replace(/\bHVAC\b/gi, ' H V A C ')
      .replace(/•|▪|⁃/g, '. ') // Turn bullets into full stops for clear pauses
      .replace(/^\s*\d+\.\s*/gm, '. ') // Replace numbering with sentence pauses
      .replace(/\n+/g, '. ') // Replace line breaks with pauses
      .replace(/\s+/g, ' ')
      .trim();
  };

  // High quality voice selection algorithm matching target Indian / regional locales
  const selectBestVoice = (lang: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;

    const langCodeMap: Record<string, string> = {
      English: 'en-IN',
      Hindi: 'hi-IN',
      Kannada: 'kn-IN',
      Tamil: 'ta-IN',
      Telugu: 'te-IN',
      Malayalam: 'ml-IN'
    };

    const targetLocale = langCodeMap[lang] || 'en-IN';
    const targetLangPrefix = targetLocale.split('-')[0];

    // Priority 1: High quality natural/neural/google/premium voice matching exact locale or language prefix
    const naturalVoice = voices.find(v =>
      (v.lang === targetLocale || v.lang.startsWith(targetLangPrefix)) &&
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Premium') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Veena') || v.name.includes('Rishi') || v.name.includes('Lekha') || v.name.includes('Neerja'))
    );
    if (naturalVoice) return naturalVoice;

    // Priority 2: Any voice matching exact target locale
    const exactLocaleVoice = voices.find(v => v.lang === targetLocale);
    if (exactLocaleVoice) return exactLocaleVoice;

    // Priority 3: Any voice matching language prefix (e.g. 'hi' for Hindi, 'kn' for Kannada)
    const langPrefixVoice = voices.find(v => v.lang.startsWith(targetLangPrefix));
    if (langPrefixVoice) return langPrefixVoice;

    // Priority 4: Premium English voice fallback
    const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (enVoice) return enVoice;

    return voices[0] || null;
  };

  // High-Quality Native Web Speech API SpeechSynthesis Engine
  const playWebSpeech = (speechText: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setCurrentlyPlayingId(null);
      return;
    }

    stopAllSpeechAndAudio();

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95; // Calm, clear human speaking cadence
    utterance.pitch = 1.0; // Warm, approachable tone
    utterance.volume = 1.0;

    const langCodeMap: Record<string, string> = {
      English: 'en-IN',
      Hindi: 'hi-IN',
      Kannada: 'kn-IN',
      Tamil: 'ta-IN',
      Telugu: 'te-IN',
      Malayalam: 'ml-IN'
    };
    utterance.lang = langCodeMap[language] || 'en-IN';

    const voiceList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const selectedVoice = selectBestVoice(language, voiceList);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setCurrentlyPlayingId(msgId);
    };

    utterance.onend = () => {
      stopAllSpeechAndAudio();
    };

    utterance.onerror = (e) => {
      console.log("SpeechSynthesis utterance finished/cancelled:", e);
      stopAllSpeechAndAudio();
    };

    activeUtteranceRef.current = utterance;
    setCurrentlyPlayingId(msgId);

    // Chrome keep-alive interval to prevent long SpeechSynthesis pauses
    speechKeepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        if (speechKeepAliveRef.current) {
          clearInterval(speechKeepAliveRef.current);
          speechKeepAliveRef.current = null;
        }
      }
    }, 6000);

    window.speechSynthesis.speak(utterance);
  };

  // Primary Text-To-Speech Playback Launcher
  const playTtsAudio = async (text: string, msgId: string) => {
    // If clicking currently playing audio, stop speech
    if (currentlyPlayingId === msgId) {
      stopAllSpeechAndAudio();
      return;
    }

    stopAllSpeechAndAudio();

    const cleanedSpeechText = cleanTextForSpeech(text);
    if (!cleanedSpeechText) return;

    // 1. Try server Gemini TTS endpoint if active
    try {
      const res = await fetch('/api/ai-consultant/voice-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanedSpeechText, voiceName: 'Aoede', language })
      });
      const data = await res.json();

      if (data.success && data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        activeAudioRef.current = audio;
        audio.onended = () => stopAllSpeechAndAudio();
        audio.onerror = () => playWebSpeech(cleanedSpeechText, msgId);
        setCurrentlyPlayingId(msgId);
        await audio.play();
        return;
      }
    } catch (e) {
      console.log("Using Web Speech API SpeechSynthesis...");
    }

    // 2. High-Quality Web Speech API SpeechSynthesis
    playWebSpeech(cleanedSpeechText, msgId);
  };

  // Seamless Language Switcher
  const handleLanguageChange = (newLang: 'English' | 'Hindi' | 'Kannada' | 'Tamil' | 'Telugu' | 'Malayalam') => {
    stopAllSpeechAndAudio();
    setHistoryBuffer([]); // Clear history buffer on language change to prevent cross-language repetition
    setLanguage(newLang);

    const greetingMap: Record<string, { text: string; chips: string[] }> = {
      English: {
        text: "Switched to English. I'm your Royal Epic AI Interior Consultant. How can I help with your project today?",
        chips: ["Design my home", "Modular kitchen", "Office interior", "Wardrobe", "Turnkey pricing"]
      },
      Hindi: {
        text: "हिंदी भाषा चुनी गई। मैं आपका रॉयल एपिक AI इंटीरियर कंसल्टेंट हूँ। आज आपके प्रोजेक्ट में कैसे सहायता करूँ?",
        chips: ["मेरा घर डिजाइन करें", "मॉड्यूलर किचन", "ऑफिस इंटीरियर", "वॉर्डरोब सिस्टम", "लागत जानें"]
      },
      Kannada: {
        text: "ಕನ್ನಡ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ನಾನು ನಿಮ್ಮ ರಾಯಲ್ ಎಪಿಕ್ AI ಇಂಟೀರಿಯರ್ ಕನ್ಸಲ್ಟೆಂಟ್. ನಿಮ್ಮ ಪ್ರಾಜೆಕ್ಟ್‌ಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
        chips: ["ನನ್ನ ಮನೆ ಡಿಸೈನ್ ಮಾಡಿ", "ಮಾಡ್ಯುಲರ್ ಕಿಚನ್", "ಆಫೀಸ್ ಇಂಟೀರಿಯರ್", "ವಾರ್ಡ್‌ರೋಬ್", "ವೆಚ್ಚ ತಿಳಿಯಿರಿ"]
      },
      Tamil: {
        text: "தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது. நான் உங்கள் ராயல் எபிக் AI இன்டீரியர் கன்சல்டன்ட். இன்று எவ்வாறு உதவட்டும்?",
        chips: ["என் வீட்டை வடிவமையுங்கள்", "மாடுலர் கிச்சன்", "ஆபீஸ் இன்டீரியர்", "வார்ட்ரோப்", "விலை விவரம்"]
      },
      Telugu: {
        text: "తెలుగు భాష ఎంచుకోబడింది. నేను మీ రాయల్ ఎపిక్ AI ఇంటీరియర్ కన్సల్టెంట్‌ని. మీ ప్రాజెక్ట్‌కి ఎలా సహాయపడగలను?",
        chips: ["నా ఇల్లు డిజైన్ చేయండి", "మోడ్యులర్ కిచెన్", "ఆఫీస్ ఇంటీరియర్", "వార్డ్‌రోబ్", "ధరలు తెలుసుకోండి"]
      },
      Malayalam: {
        text: "മലയാളം ഭാഷ തിരഞ്ഞെടുത്തു. ഞാൻ നിങ്ങളുടെ റോയൽ എപ്പിക് AI ഇന്റീരിയർ കൺസൾട്ടന്റാണ്. ഇന്ന് എങ്ങനെ സഹായിക്കണം?",
        chips: ["എന്റെ വീട് ഡിസൈൻ ചെയ്യൂ", "മോഡുലാർ കിച്ചൻ", "ഓഫീസ് ഇന്റീരിയർ", "വാർഡ്റോബ്", "ചെലവ് അറിയുക"]
      }
    };

    const targetInfo = greetingMap[newLang] || greetingMap.English;

    const langMsg: ChatMessage = {
      id: `lang-sw-${Date.now()}`,
      sender: 'ai',
      text: targetInfo.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedChips: targetInfo.chips
    };

    setMessages(prev => [...prev, langMsg]);

    if (autoVoice) {
      playTtsAudio(targetInfo.text, langMsg.id);
    }
  };

  // Reset conversation and history buffer cleanly
  const handleResetChat = () => {
    stopAllSpeechAndAudio();
    setHistoryBuffer([]);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: "Welcome to Royal Epic Interior & Furniture. I'm your AI Interior Consultant with 25+ years of turnkey design & manufacturing expertise. How can I help with your project today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedChips: [
          "Design my home",
          "Modular kitchen",
          "Office interior",
          "Wardrobe",
          "Villa interior",
          "False ceiling",
          "Painting",
          "Furniture",
          "Restaurant interior",
          "Hospital interior",
          "Retail showroom",
          "Turnkey construction",
          "Renovation"
        ]
      }
    ]);
  };

  // Send message handler with history buffer reset for new preset/chip queries
  const handleSendMessage = async (
    textToSend?: string,
    options: { isPresetChip?: boolean; resetHistory?: boolean } = {}
  ) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    // Immediately stop any active speech audio
    stopAllSpeechAndAudio();

    // Prevent identical rapid submissions
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === 'user' && lastMsg.text.toLowerCase() === query.toLowerCase()) {
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Clear history buffer when new preset buttons ("Design My Home", "Modular Kitchen", etc.) are clicked
    const shouldResetHistory = options.isPresetChip || options.resetHistory || historyBuffer.length > 8;
    const payloadHistory = shouldResetHistory ? [] : historyBuffer;

    if (shouldResetHistory) {
      setHistoryBuffer([]);
    }

    try {
      const res = await fetch('/api/ai-consultant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: payloadHistory,
          language,
          userDiscovery: discovery
        })
      });

      const data = await res.json();

      if (data.success) {
        let finalReplyText = data.replyText;

        // Deduplicate response if identical to previous AI response
        const lastAiMsg = [...messages].reverse().find(m => m.sender === 'ai');
        if (lastAiMsg && lastAiMsg.text === finalReplyText) {
          finalReplyText = `Regarding your inquiry on "${query}":\n\n` + finalReplyText;
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: finalReplyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedChips: data.suggestedChips,
          recommendations: data.recommendations
        };

        if (data.discoveredInfo) {
          setDiscovery(prev => ({ ...prev, ...data.discoveredInfo }));
        }

        if (data.shouldOfferSiteVisit) {
          setShowLeadForm(true);
        }

        setMessages(prev => [...prev, aiMsg]);

        // Update history buffer with latest clean turn
        setHistoryBuffer(prev => {
          const base = shouldResetHistory ? [] : prev;
          return [
            ...base,
            { role: 'user', content: query },
            { role: 'assistant', content: finalReplyText }
          ];
        });

        if (autoVoice) {
          playTtsAudio(finalReplyText, aiMsg.id);
        }
      } else {
        throw new Error(data.error || 'AI Consultant response error');
      }
    } catch (error: any) {
      console.error("AI Consultant request failed:", error);
      const qLower = query.toLowerCase();
      let fallbackText = `Here are the details for your inquiry about "${query}":\n\n` +
        `• Materials: 100% Waterproof BWR Marine Plywood with 15-Year Factory Guarantee.\n` +
        `• Hardware: Blum & Hettich German soft-close fittings.\n` +
        `• Design Service: Photorealistic 3D VR Walkthroughs and itemized BOQ.\n\n` +
        `Would you like to schedule a free site visit with our senior architect in Bengaluru?`;
      let chips = ["Book Free Site Visit", "Modular Kitchen Cost", "3BHK Villa Interiors"];

      if (qLower.includes('kitchen')) {
        fallbackText = `Royal Epic Modular Kitchen Specifications:\n\n` +
          `1. Carcase: 18mm BWR Marine Plywood (100% Waterproof).\n` +
          `2. Shutters: Anti-fingerprint Acrylic / PU Lacquer.\n` +
          `3. Drawers: Blum & Hettich Tandembox soft-close systems.\n` +
          `4. Countertop: 20mm Quartz or Italian Granite.\n\n` +
          `Estimated Range: ₹1.8L - ₹4.5L (L-Shape, U-Shape, or Island Layout).`;
        chips = ["Kitchen Cost Estimate", "Acrylic vs PU", "Book Site Visit"];
      } else if (qLower.includes('wardrobe')) {
        fallbackText = `Royal Epic Wardrobe Specifications:\n\n` +
          `1. Sliding Doors: Floor-to-ceiling glass & aluminum profile sliding doors.\n` +
          `2. Lighting: Concealed sensor LED closet strips.\n` +
          `3. Accessories: Hydraulic pull-downs, velvet jewel trays, shoe racks.\n\n` +
          `Estimated Rate: ₹1,250 - ₹2,400 / Sq.Ft.`;
        chips = ["Sliding vs Hinged", "Walk-in Closet Cost", "Book Site Visit"];
      }

      const fallbackAiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedChips: chips
      };
      setMessages(prev => [...prev, fallbackAiMsg]);

      if (autoVoice) {
        playTtsAudio(fallbackText, fallbackAiMsg.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) {
      alert("Please enter your Name and Phone Number.");
      return;
    }

    setIsSubmittingLead(true);
    setLeadSuccessMsg(null);

    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName,
          phone: leadPhone,
          email: leadEmail,
          location: leadLocation,
          budget: leadBudget,
          projectType: leadProjectType,
          preferredDate: leadPreferredDate,
          discoveredInfo: discovery,
          source: 'Royal Epic AI Consultant'
        })
      });

      const data = await res.json();

      if (data.success) {
        // Also persist to Supabase PostgreSQL database
        submitLeadToSupabase({
          full_name: leadName,
          phone: leadPhone,
          email: leadEmail,
          city: leadLocation,
          estimated_budget: leadBudget,
          service_type: leadProjectType,
          preferred_date: leadPreferredDate,
          raw_details: discovery,
          source: 'Royal Epic AI Consultant',
          status: 'site_visit_scheduled'
        });

        try {
          addDoc(collection(db, "leads"), {

            leadId: data.leadId,
            name: leadName,
            phone: leadPhone,
            email: leadEmail,
            location: leadLocation,
            budget: leadBudget,
            projectType: leadProjectType,
            preferredDate: leadPreferredDate,
            createdAt: new Date().toISOString(),
            source: 'Royal Epic AI Consultant'
          }).catch(err => console.log("Firebase sync note:", err));
        } catch (fbErr) {
          console.log("Firebase async store bypassed:", fbErr);
        }

        setLeadSuccessMsg(`✨ Thank you, ${leadName}! Your Free Site Visit Consultation ID is ${data.leadId}. Our senior interior architect will call you shortly.`);
        
        setMessages(prev => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            sender: 'ai',
            text: `🎉 Site Visit Confirmed for ${leadName}! Reference ID: ${data.leadId}. Our team at Thanisandra, Bengaluru Hub will prepare your customized 3D layout & itemized BOQ.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        
        setTimeout(() => {
          setShowLeadForm(false);
        }, 4000);
      } else {
        throw new Error(data.error || 'Failed to submit lead');
      }
    } catch (err: any) {
      console.error("Error submitting lead:", err);
      alert("Unable to save booking. Direct call available at +91 99166 33338.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleCloseModal = () => {
    stopAllSpeechAndAudio();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-gold/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[820px] text-white">
        
        {/* Top Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-neutral-950/90 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-gold to-amber-300 p-0.5 shadow-lg shadow-gold/20 flex items-center justify-center">
                <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-gold">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-neutral-950 rounded-full" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-gold flex items-center gap-2 leading-none">
                Royal Epic AI Consultant
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-mono font-normal">
                  25+ Yrs Expertise
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-2">
                <span>Turnkey Projects & Modular Solutions</span> • 
                <span className="text-emerald-400 font-mono">Live Voice Enabled</span>
              </p>
            </div>
          </div>

          {/* Controls: Language & Reset & Voice Toggle & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Multilingual Selector */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as any)}
                className="bg-neutral-800 border border-gold/40 text-gold font-bold rounded-xl px-2.5 py-1.5 text-xs focus:border-gold focus:outline-none cursor-pointer pr-6 shadow-sm"
              >
                <option value="English">🌐 English</option>
                <option value="Hindi">🇮🇳 Hindi (हिंदी)</option>
                <option value="Kannada">🇮🇳 Kannada (ಕನ್ನಡ)</option>
                <option value="Tamil">🇮🇳 Tamil (தமிழ்)</option>
                <option value="Telugu">🇮🇳 Telugu (తెలుగు)</option>
                <option value="Malayalam">🇮🇳 Malayalam (മലയാളം)</option>
              </select>
            </div>

            {/* Clear Chat / Start Fresh Session */}
            <button
              onClick={handleResetChat}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-gold border border-white/10 transition-all text-xs flex items-center gap-1 cursor-pointer"
              title="Clear Chat & Reset History"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Auto Audio Speech Output Toggle */}
            <button
              onClick={() => {
                const nextState = !autoVoice;
                setAutoVoice(nextState);
                if (!nextState) stopAllSpeechAndAudio();
              }}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                autoVoice 
                  ? 'bg-gold/20 text-gold border-gold/40 shadow-sm' 
                  : 'bg-neutral-800 text-neutral-400 border-white/10'
              }`}
              title={autoVoice ? "Auto Voice Synthesis ON" : "Auto Voice Synthesis OFF"}
            >
              {autoVoice ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Book Site Visit CTA */}
            <button
              onClick={() => setShowLeadForm(!showLeadForm)}
              className="hidden md:flex px-3 py-1.5 bg-gold hover:bg-gold-light text-neutral-950 font-bold rounded-xl text-xs items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" /> Book Site Visit
            </button>

            <button
              onClick={handleCloseModal}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Multilingual Quick Tab Bar */}
        <div className="bg-neutral-950 border-b border-gold/20 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider px-1 flex items-center gap-1 shrink-0">
            <Globe className="w-3 h-3 text-gold" /> AI Voice Language:
          </span>
          {[
            { id: 'English', label: 'English', flag: '🌐' },
            { id: 'Hindi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
            { id: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
            { id: 'Tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
            { id: 'Telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
            { id: 'Malayalam', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' }
          ].map((langItem) => {
            const isActive = language === langItem.id;
            return (
              <button
                key={langItem.id}
                onClick={() => handleLanguageChange(langItem.id as any)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-gold text-neutral-950 font-bold border-gold shadow-md shadow-gold/20 scale-105'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-white/10 hover:border-gold/40'
                }`}
              >
                <span>{langItem.flag}</span>
                <span>{langItem.label}</span>
              </button>
            );
          })}
        </div>

        {/* Customer Discovery Ribbon */}
        <div className="bg-neutral-950/60 border-b border-white/5 px-4 py-2 flex items-center justify-between text-xs overflow-x-auto gap-4 custom-scrollbar shrink-0">
          <div className="flex items-center gap-3 text-neutral-300 whitespace-nowrap">
            <span className="font-mono text-gold font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold" /> Project Profile:
            </span>
            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-neutral-200">
              📍 {discovery.city || 'Bengaluru'}
            </span>
            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-neutral-200">
              🏢 {discovery.propertyType || 'Apartment'}
            </span>
            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-neutral-200">
              🎨 {discovery.style || 'Modern Luxury'}
            </span>
            {discovery.budget && (
              <span className="bg-gold/15 border border-gold/30 px-2 py-0.5 rounded-lg text-gold font-medium">
                💰 {discovery.budget}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowLeadForm(!showLeadForm)}
            className="text-gold hover:underline text-[11px] font-bold shrink-0 flex items-center gap-1"
          >
            {showLeadForm ? 'Hide Booking Form' : 'Update & Book Consultation →'}
          </button>
        </div>

        {/* Main Body Grid (Chat Area + Lead Drawer overlay) */}
        <div className="relative flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Main Chat Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono px-1">
                  <span>{msg.sender === 'ai' ? 'Royal Epic AI Consultant' : 'You'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gold text-neutral-950 font-medium rounded-tr-none shadow-lg'
                      : 'bg-neutral-800/90 text-neutral-100 border border-white/10 rounded-tl-none shadow-md space-y-3'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Recommendations Box if present */}
                  {msg.recommendations && (
                    <div className="mt-3 p-3 bg-neutral-900/80 rounded-xl border border-gold/30 text-xs space-y-2">
                      <h4 className="font-serif font-bold text-gold flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" /> AI Designer Recommendation Plan
                      </h4>
                      {msg.recommendations.recommendedServices && (
                        <div>
                          <span className="text-[10px] text-neutral-400 font-mono uppercase block">Services</span>
                          <p className="text-neutral-200 font-medium">{msg.recommendations.recommendedServices.join(', ')}</p>
                        </div>
                      )}
                      {msg.recommendations.recommendedMaterials && (
                        <div>
                          <span className="text-[10px] text-neutral-400 font-mono uppercase block">Recommended Materials</span>
                          <p className="text-neutral-300">{msg.recommendations.recommendedMaterials.join(', ')}</p>
                        </div>
                      )}
                      {msg.recommendations.estimatedBudgetRange && (
                        <div className="pt-1 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[10px] text-gold font-bold uppercase">Broad Estimated Range</span>
                          <span className="font-bold text-white bg-gold/20 px-2 py-0.5 rounded text-gold">{msg.recommendations.estimatedBudgetRange}</span>
                        </div>
                      )}
                      <p className="text-[10px] text-neutral-400 italic">
                        * Note: Final quotation requires a site visit & detailed design.
                      </p>
                    </div>
                  )}

                  {/* Speech Audio Button for AI Messages */}
                  {msg.sender === 'ai' && (
                    <div className="pt-1 flex items-center justify-between border-t border-white/10 text-[11px] text-neutral-400">
                      <button
                        onClick={() => playTtsAudio(msg.text, msg.id)}
                        className="hover:text-gold flex items-center gap-1 transition-colors cursor-pointer font-medium"
                      >
                        {currentlyPlayingId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-gold animate-bounce" />
                            <span className="text-gold font-bold">Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-gold" />
                            <span>Listen Audio</span>
                          </>
                        )}
                      </button>

                      <span className="text-[10px] text-neutral-500 font-mono">Royal Epic Web Speech Synthesis</span>
                    </div>
                  )}
                </div>

                {/* Follow-up Suggested Quick Chips */}
                {msg.sender === 'ai' && msg.suggestedChips && msg.suggestedChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-w-[88%] sm:max-w-[80%]">
                    {msg.suggestedChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip, { isPresetChip: true })}
                        className="px-2.5 py-1 bg-neutral-800/80 hover:bg-gold hover:text-neutral-950 text-neutral-300 border border-white/10 hover:border-gold rounded-xl text-xs transition-all cursor-pointer font-medium"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-neutral-800/60 rounded-2xl border border-white/10 w-fit text-xs text-neutral-300 animate-pulse">
                <Bot className="w-4 h-4 text-gold animate-spin" />
                <span>Consulting Royal Epic interior knowledge base & material catalogs...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Lead Capture & Site Visit Consultation Drawer */}
          {showLeadForm && (
            <div className="w-full md:w-80 bg-neutral-950/98 border-t md:border-t-0 md:border-l border-gold/40 p-4 overflow-y-auto shrink-0 animate-in slide-in-from-right duration-200 custom-scrollbar space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="font-serif font-bold text-sm text-gold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Schedule Free Site Visit
                </h4>
                <button
                  onClick={() => setShowLeadForm(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Book a senior interior architect for 3D layout discussion, laser measurement, and an itemized BOQ in Bengaluru.
              </p>

              {leadSuccessMsg ? (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="font-bold text-center">{leadSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-mono block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-mono block mb-1">Phone Number (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 99166 33338"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-mono block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="ramesh@example.com"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400 font-mono block mb-1">City / Area</label>
                      <input
                        type="text"
                        value={leadLocation}
                        onChange={(e) => setLeadLocation(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-white text-xs focus:border-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 font-mono block mb-1">Preferred Date</label>
                      <input
                        type="date"
                        value={leadPreferredDate}
                        onChange={(e) => setLeadPreferredDate(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-white text-xs focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-mono block mb-1">Project Type</label>
                    <select
                      value={leadProjectType}
                      onChange={(e) => setLeadProjectType(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-white text-xs focus:border-gold focus:outline-none"
                    >
                      <option value="Full Turnkey Interior">Full Turnkey Interior</option>
                      <option value="Modular Kitchen & SS Carcass">Modular Kitchen & SS Carcass</option>
                      <option value="Modular Wardrobes & Storage">Modular Wardrobes & Storage</option>
                      <option value="Luxury Villa Interior">Luxury Villa Interior</option>
                      <option value="Commercial & Office Fitout">Commercial & Office Fitout</option>
                      <option value="Renovation & Civil Work">Renovation & Civil Work</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-mono block mb-1">Budget Segment</label>
                    <select
                      value={leadBudget}
                      onChange={(e) => setLeadBudget(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-white text-xs focus:border-gold focus:outline-none"
                    >
                      <option value="Under ₹5 Lakhs">Under ₹5 Lakhs</option>
                      <option value="₹5L - ₹10L">₹5L - ₹10L</option>
                      <option value="₹10L - ₹20L">₹10L - ₹20L</option>
                      <option value="₹20L - ₹35L">₹20L - ₹35L</option>
                      <option value="₹35L+ Premium Luxury">₹35L+ Premium Luxury</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingLead}
                    className="w-full py-3 bg-gold hover:bg-gold-light text-neutral-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmittingLead ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Confirm Free Site Consultation
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-neutral-500">
                    Direct Thanisandra Hub Line: <a href="tel:+919916633338" className="text-gold underline">+91 99166 33338</a>
                  </p>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Bottom Input Action Bar */}
        <div className="p-3 sm:p-4 bg-neutral-950 border-t border-white/10 shrink-0 relative">
          
          {/* Active Voice Listening Pulse Banner Animation */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-red-950/90 via-neutral-900 to-amber-950/90 border border-red-500/60 shadow-2xl shadow-red-500/20 flex items-center justify-between gap-3 text-xs overflow-hidden relative"
              >
                {/* Background Ambient Glow */}
                <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />

                <div className="flex items-center gap-3 relative z-10">
                  {/* Pinging Red Recording Dot */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-md shadow-red-500/50" />
                  </div>

                  {/* Equalizer Wave Bouncing Sound Bars */}
                  <div className="flex items-end gap-1 h-5 shrink-0">
                    {[0.1, 0.3, 0.2, 0.4, 0.15, 0.35, 0.25].map((delay, idx) => (
                      <motion.div
                        key={idx}
                        animate={{ height: ['25%', '100%', '35%', '90%', '20%'] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8,
                          delay: delay,
                          ease: "easeInOut"
                        }}
                        className="w-1 bg-gradient-to-t from-red-500 via-amber-400 to-yellow-300 rounded-full"
                      />
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-400 uppercase tracking-wider text-[11px] font-mono flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" /> Live Voice Input Active
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-gold/20 text-gold border border-gold/40 text-[10px] font-bold">
                        {language}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-200 mt-0.5">
                      AI is actively listening for your speech... Speak clearly in <strong className="text-gold">{language}</strong>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsListening(false)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-white/20 text-neutral-300 hover:text-white text-[11px] font-bold shrink-0 transition-all cursor-pointer relative z-10"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(undefined, { resetHistory: false });
            }}
            className="flex items-center gap-2"
          >
            {/* Speech Microphone Button with Expanding Pulse Wave Rings */}
            <div className="relative">
              {isListening && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-2xl bg-red-500/40 pointer-events-none"
                  />
                  <motion.div
                    animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 rounded-2xl bg-amber-500/30 pointer-events-none"
                  />
                </>
              )}

              <button
                type="button"
                onClick={startVoiceInput}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center relative z-10 ${
                  isListening 
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/50 scale-105' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-gold border-white/10 hover:border-gold'
                }`}
                title={isListening ? "Listening audio... tap to stop" : `Tap microphone to speak in ${language}`}
              >
                {isListening ? <MicOff className="w-5 h-5 text-white animate-pulse" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            {/* Input Text Box */}
            <input
              type="text"
              placeholder={isListening ? `Listening in ${language}... speak now` : "Ask about home interior, modular kitchen, materials, costs, 3D design..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-neutral-900 border border-white/15 focus:border-gold text-white text-xs sm:text-sm rounded-2xl px-4 py-3 focus:outline-none placeholder-neutral-500 transition-colors"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 bg-gold hover:bg-gold-light disabled:opacity-40 text-neutral-950 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" /> <span className="hidden sm:inline">Send</span>
            </button>
          </form>

          <p className="text-[10px] text-center text-neutral-500 mt-2 font-mono">
            Powered by Royal Epic AI • Thanisandra Manufacturing Hub • Call +91 99166 33338
          </p>
        </div>

      </div>

    </div>
  );
};
