import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Download, Eye, Search, ShieldCheck, CheckCircle2, 
  FolderDown, FileSpreadsheet, Layers, Lock, Sparkles, Calendar, 
  UserCheck, X, FileCode, Award, ArrowRight, RefreshCw
} from 'lucide-react';
import { generateBoqPdf } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';

export interface RepositoryDocument {
  id: string;
  title: string;
  category: 'boq' | 'floorplans' | 'agreements' | 'invoices';
  fileType: 'PDF' | 'DWG' | 'XLSX' | 'ZIP';
  fileSize: string;
  version: string;
  uploadDate: string;
  status: 'Signed & Executed' | 'Approved by Architect' | 'Verified' | 'Final Handover';
  author: string;
  description: string;
  downloadUrl?: string;
  pagesCount?: number;
  previewSummary?: {
    totalValue?: string;
    keyClauses?: string[];
    dimensions?: string;
    specifications?: string[];
  };
}

export const DocumentRepository: React.FC = () => {
  const { user, userProject } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewDoc, setPreviewDoc] = useState<RepositoryDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const sampleDocuments: RepositoryDocument[] = [
    {
      id: 'DOC-BOQ-8812',
      title: 'Itemized Bill of Quantities (BOQ) - Master Villa Turnkey',
      category: 'boq',
      fileType: 'PDF',
      fileSize: '2.4 MB',
      version: 'v2.4 (Final)',
      uploadDate: 'Jul 24, 2026',
      status: 'Approved by Architect',
      author: 'Ar. Sanya Malhotra (Lead Interior Architect)',
      description: 'Comprehensive itemized breakdown of hardware, HDMR plywood carcase, Blum fittings, and Italian marble finishes.',
      pagesCount: 6,
      previewSummary: {
        totalValue: '₹48,50,000 (Incl. 18% GST)',
        specifications: [
          'Kitchen Carcase: 18mm BWR Grade Gurjan Plywood',
          'Shutter Finish: 1mm Anti-fingerprint Acrylic Laminate',
          'Hardware: Blum Soft-close Tandembox drawers with Blumotion',
          'Wardrobes: Floor-to-ceiling glass sliding doors with LED sensors'
        ]
      }
    },
    {
      id: 'DOC-CAD-301',
      title: 'High-Precision 3D LiDAR Floor Plan & Electrical Blueprint',
      category: 'floorplans',
      fileType: 'DWG',
      fileSize: '14.8 MB',
      version: 'v3.0',
      uploadDate: 'Jul 14, 2026',
      status: 'Verified',
      author: 'Ar. Rajesh V. (Chief Site Surveyor)',
      description: 'Millimeter-accurate 3D point cloud LiDAR scan, structural load points, and 230V electrical layout mapping.',
      pagesCount: 4,
      previewSummary: {
        dimensions: '3,850 Sq. Ft. Total Built-up Area',
        specifications: [
          'Wall Alignment Tolerance: ≤ 1.5mm variance across all axes',
          'Concealed Wiring: Havells FRLS Copper Cable layout',
          'Plumbing Inlets: Grohe Concealed Thermostatic Mixers'
        ]
      }
    },
    {
      id: 'DOC-AGR-992',
      title: 'Turnkey Architectural Execution Agreement & 10-Yr Guarantee',
      category: 'agreements',
      fileType: 'PDF',
      fileSize: '1.8 MB',
      version: 'Executed',
      uploadDate: 'Jul 10, 2026',
      status: 'Signed & Executed',
      author: 'Royal Epic Legal & Operations Cell',
      description: 'Fully signed binding turnkey execution contract, milestone payout schedules, and 10-Year anti-termite warranty clause.',
      pagesCount: 12,
      previewSummary: {
        keyClauses: [
          'Penalty-free completion guarantee on or before Aug 22, 2026',
          '10-Year structural anti-warp & anti-termite replacement warranty',
          'Zero hidden cost escalation clause post-BOQ signature'
        ]
      }
    },
    {
      id: 'DOC-BOQ-EXCEL',
      title: 'Raw BOQ Material Swatch Spreadsheet',
      category: 'boq',
      fileType: 'XLSX',
      fileSize: '680 KB',
      version: 'v2.4',
      uploadDate: 'Jul 22, 2026',
      status: 'Verified',
      author: 'Material Procurement Dept.',
      description: 'Raw pricing spreadsheet with unit rates for veneers, acoustic wall paneling, and Hafele architectural hardware.',
      pagesCount: 3
    },
    {
      id: 'DOC-4K-RENDERS',
      title: '4K Architectural Renders & 360 VR Walkthrough Pack',
      category: 'floorplans',
      fileType: 'ZIP',
      fileSize: '48.2 MB',
      version: 'v1.0',
      uploadDate: 'Jul 18, 2026',
      status: 'Approved by Architect',
      author: 'Studio 3D Visuals',
      description: 'High-resolution photorealistic renderings for Living Room, Master Suite, Walk-in Closet, and Kitchen.',
      pagesCount: 16
    },
    {
      id: 'DOC-INV-849201',
      title: 'Advance Milestone Invoice #RE-ORD-849201',
      category: 'invoices',
      fileType: 'PDF',
      fileSize: '410 KB',
      version: 'Paid',
      uploadDate: 'Jul 25, 2026',
      status: 'Final Handover',
      author: 'Accounts & Finance Team',
      description: 'Official tax invoice receipt for 40% Factory Production Milestone advance payment.',
      pagesCount: 2
    },
    {
      id: 'DOC-WARR-2026',
      title: '10-Year Comprehensive Material & Hardware Warranty Card',
      category: 'agreements',
      fileType: 'PDF',
      fileSize: '1.1 MB',
      version: 'Issued',
      uploadDate: 'Jul 26, 2026',
      status: 'Signed & Executed',
      author: 'Quality Audit Dept.',
      description: 'Official digital certificate outlining 10-year warranty coverage on Hettich/Blum hardware and moisture-resistant plywood.',
      pagesCount: 3
    }
  ];

  const filteredDocs = sampleDocuments.filter((doc) => {
    const matchesCat = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDownload = (docItem: RepositoryDocument) => {
    setDownloadingId(docItem.id);

    setTimeout(() => {
      if (docItem.category === 'boq' || docItem.id.includes('BOQ')) {
        // Trigger live PDF generation for BOQ
        generateBoqPdf({
          quoteId: docItem.id,
          clientName: user?.displayName || 'Valued Client',
          clientPhone: user?.phoneNumber || '+91 99166 33338',
          clientEmail: user?.email || 'client@royalepic.com',
          cityLocation: 'Whitefield, Bangalore',
          propertyType: '4BHK Villa',
          areaSqFt: 3850,
          finishQuality: 'Ultra-Luxury Italian Veneer & Blum Fittings',
          formattedMin: '₹45,00,000',
          formattedMax: '₹52,00,000',
          avgEstimate: 4850000,
          weeks: 6,
          breakdown: {
            woodwork: 2450000,
            kitchen: 1100000,
            ceilingLighting: 550000,
            civilPainting: 450000,
            projectManagement: 300000
          },
          selectedPreferences: ['Modular Kitchen', 'Walk-in Closet', 'PU Lacquer Finish', 'Blum Soft-Close'],
          aiNotes: 'Verified structural LiDAR site dimensions. All carcases treated for 100% moisture resistance.'
        });
      } else {
        // Mock download trigger for blueprints / contracts
        const dummyContent = `ROYAL EPIC INTERIOR ARCHITECTURE & FURNITURE\n=========================================\nDocument Ref: ${docItem.id}\nTitle: ${docItem.title}\nVersion: ${docItem.version}\nDate: ${docItem.uploadDate}\nStatus: ${docItem.status}\nAuthor: ${docItem.author}\n\nDescription:\n${docItem.description}\n\n[Security Certificate: 256-Bit SSL Encrypted Verification Hash #${Math.random().toString(36).substring(2, 12).toUpperCase()}]\n`;
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docItem.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${docItem.fileType.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setDownloadingId(null);
    }, 600);
  };

  const getFormatBadge = (type: RepositoryDocument['fileType']) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-950/80 text-red-400 border-red-500/40';
      case 'DWG':
        return 'bg-blue-950/80 text-blue-400 border-blue-500/40';
      case 'XLSX':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
      case 'ZIP':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/40';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Repository Banner Header */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-black border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                <FolderDown className="w-3.5 h-3.5 text-gold" /> Encrypted Vault
              </span>
              <span className="text-xs text-neutral-400 font-mono">Ref: {userProject?.id || 'RE-PROJ-8812'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Client Document Repository
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Access, preview, and download your itemized BOQ estimates, 3D floor plan DWG blueprints, signed turnkey contracts, and warranty certificates.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/60 border border-white/10 rounded-2xl p-4 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">Total Files Vaulted</span>
              <span className="text-2xl font-serif font-bold text-gold">{sampleDocuments.length} Verified Files</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center border border-gold/30">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 sm:pb-0">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'boq', label: 'BOQ & Costing' },
              { id: 'floorplans', label: 'Floor Plans & CAD' },
              { id: 'agreements', label: 'Signed Contracts' },
              { id: 'invoices', label: 'Invoices & Warranty' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-gold text-neutral-950 font-bold shadow-md'
                    : 'bg-neutral-950 border border-white/10 text-neutral-400 hover:text-white hover:border-gold/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative shrink-0 sm:w-64">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold font-mono"
            />
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-neutral-900/60 rounded-3xl border border-white/10">
            <FileText className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm font-serif font-bold text-white">No documents match your query</p>
            <p className="text-xs text-neutral-500 mt-1">Try clearing your search filter or select "All Files".</p>
          </div>
        ) : (
          filteredDocs.map((docItem, idx) => (
            <motion.div
              key={docItem.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="bg-neutral-900/90 border border-white/10 hover:border-gold/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold ${getFormatBadge(docItem.fileType)}`}>
                    {docItem.fileType} • {docItem.fileSize}
                  </span>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {docItem.status}
                  </span>
                </div>

                {/* Title & Ref */}
                <span className="text-[10px] font-mono text-gold font-bold block mb-1">{docItem.id} • {docItem.version}</span>
                <h3 className="text-sm font-serif font-bold text-white group-hover:text-gold transition-colors line-clamp-2 mb-2">
                  {docItem.title}
                </h3>

                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                  {docItem.description}
                </p>
              </div>

              {/* Footer info & Action Buttons */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gold" /> {docItem.uploadDate}
                  </span>
                  <span className="flex items-center gap-1 truncate max-w-[140px]" title={docItem.author}>
                    <UserCheck className="w-3 h-3 text-gold" /> {docItem.author.split('(')[0]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPreviewDoc(docItem)}
                    className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/5"
                  >
                    <Eye className="w-3.5 h-3.5 text-gold" /> Preview
                  </button>

                  <button
                    onClick={() => handleDownload(docItem)}
                    disabled={downloadingId === docItem.id}
                    className="py-2 px-3 rounded-xl bg-gold hover:brightness-110 text-neutral-950 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    {downloadingId === docItem.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-neutral-950" /> Download
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Request Document Refresh Banner */}
      <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0 border border-gold/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-serif font-bold text-white">Need a customized floor plan variant or revised BOQ?</h4>
            <p className="text-[11px] text-neutral-400">Request your dedicated lead architect to issue a revised PDF/DWG package.</p>
          </div>
        </div>

        <a
          href="https://wa.me/919916633338"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer"
        >
          Request Update on WhatsApp <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-neutral-900 border border-white/15 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-5 text-white overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold ${getFormatBadge(previewDoc.fileType)}`}>
                    {previewDoc.fileType}
                  </span>
                  <span className="text-xs font-mono text-gold font-bold">{previewDoc.id}</span>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-serif font-bold text-white mb-1">{previewDoc.title}</h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Uploaded by {previewDoc.author} on {previewDoc.uploadDate} ({previewDoc.fileSize})
                </p>
              </div>

              <div className="bg-black/60 p-4 rounded-2xl border border-white/10 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold block">
                  Document Overview & Security Attestation
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {previewDoc.description}
                </p>

                {previewDoc.previewSummary?.totalValue && (
                  <div className="p-3 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-300">Audited Project Value:</span>
                    <strong className="text-gold font-bold">{previewDoc.previewSummary.totalValue}</strong>
                  </div>
                )}

                {previewDoc.previewSummary?.specifications && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">Key Specifications Highlighted:</span>
                    <ul className="space-y-1 text-xs text-neutral-300">
                      {previewDoc.previewSummary.specifications.map((spec, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewDoc.previewSummary?.keyClauses && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">Binding Contractual Guarantees:</span>
                    <ul className="space-y-1 text-xs text-neutral-300">
                      {previewDoc.previewSummary.keyClauses.map((clause, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0" />
                          <span>{clause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> 256-Bit SSL Encrypted Vault Copy
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-mono text-xs hover:bg-neutral-700 cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      const docToDownload = previewDoc;
                      setPreviewDoc(null);
                      handleDownload(docToDownload);
                    }}
                    className="px-5 py-2 rounded-xl bg-gold hover:brightness-110 text-neutral-950 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" /> Download Official {previewDoc.fileType}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
