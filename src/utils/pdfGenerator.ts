import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface BoqPdfData {
  quoteId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  cityLocation?: string;
  propertyType: string;
  areaSqFt: number;
  finishQuality: string;
  formattedMin: string;
  formattedMax: string;
  avgEstimate: number;
  weeks: number;
  breakdown: {
    woodwork: number;
    kitchen: number;
    ceilingLighting: number;
    civilPainting: number;
    projectManagement: number;
  };
  selectedPreferences?: string[];
  aiNotes?: string;
}

export interface QuotePdfData {
  quoteId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  cityLocation: string;
  projectType: string;
  budget: string;
  message?: string;
  drawingName?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const generateBoqPdf = (data: BoqPdfData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Background Bar (Gold / Dark)
  doc.setFillColor(18, 18, 18); // Dark luxury
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Gold accent strip under header
  doc.setFillColor(212, 175, 55); // Royal Gold
  doc.rect(0, 32, pageWidth, 2, 'F');

  // Header Title
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ROYAL EPIC INTERIOR & FURNITURE', margin, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('ISO 9001:2025 Certified Turnkey Interior & Furniture Manufacturing', margin, 18);
  doc.text('Bengaluru Factory & Studio | Tel: +91 99166 33338 | royalepicfurnitur1@gmail.com', margin, 23);

  // Quote Ref ID on top right
  const quoteRef = data.quoteId || `RE-BOQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(212, 175, 55);
  doc.text(`REF: ${quoteRef}`, pageWidth - margin, 12, { align: 'right' });
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${dateStr}`, pageWidth - margin, 18, { align: 'right' });
  doc.text(`Valid For: 30 Days`, pageWidth - margin, 23, { align: 'right' });

  let y = 42;

  // Title Box
  doc.setFillColor(245, 245, 247);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 2, 2, 'F');
  
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PROJECT BOQ ESTIMATE & COST BREAKDOWN', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Turnkey Interior Execution Budget Estimate based on Bengaluru Factory Material Pricing', margin + 4, y + 12);

  y += 22;

  // Client & Space Specs Grid
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(212, 175, 55);
  doc.text('PROJECT SPECIFICATIONS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  // Left Column
  const col1X = margin + 4;
  doc.text(`Client Name: ${data.clientName || 'Valued Customer'}`, col1X, y + 13);
  doc.text(`Phone / Email: ${data.clientPhone || '+91 99166 33338'}`, col1X, y + 19);
  doc.text(`Location: ${data.cityLocation || 'Bengaluru / Pan-India'}`, col1X, y + 24);

  // Right Column
  const col2X = pageWidth / 2 + 10;
  doc.text(`Space Type: ${data.propertyType.toUpperCase().replace('_', ' ')}`, col2X, y + 13);
  doc.text(`Carpet Area: ${data.areaSqFt} Sq. Ft.`, col2X, y + 19);
  doc.text(`Finish Tier: ${data.finishQuality.toUpperCase()} Quality`, col2X, y + 24);

  y += 34;

  // BOQ Table using jspdf-autotable
  const tableData = [
    [
      '1',
      'Woodwork & Custom Furniture',
      'HDHMR / Commercial Plywood, Acrylic/Laminates, Hafele/Blum Fittings, Wardrobes & TV Panels',
      '42%',
      formatCurrency(data.breakdown.woodwork)
    ],
    [
      '2',
      'Modular Kitchen & SS Carcass',
      '304 Stainless Steel Waterproof Carcass, Quartz/Granite Countertop, Tandem Boxes & Pull-outs',
      '22%',
      formatCurrency(data.breakdown.kitchen)
    ],
    [
      '3',
      'False Ceiling & Architectural Lighting',
      'Gyproc Saint-Gobain False Ceiling, Dimmable COB Spotlights, LED Strips & Magnetic Track Lights',
      '15%',
      formatCurrency(data.breakdown.ceilingLighting)
    ],
    [
      '4',
      'Civil, Wall Treatments & PU Painting',
      '3-Coat Asian Paints Royale Aspira / Venetian Plaster, WPC Doors & Tiling Work',
      '12%',
      formatCurrency(data.breakdown.civilPainting)
    ],
    [
      '5',
      'Project Management & Quality Audit',
      'Site Engineering Supervision, 3D Design Approval, Factory QC Inspection & Installation',
      '9%',
      formatCurrency(data.breakdown.projectManagement)
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['S.No', 'Category / Module', 'Scope & Material Specifications', 'Alloc.', 'Est. Amount']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [212, 175, 55],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 78 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 34, halign: 'right', fontStyle: 'bold' }
    },
    theme: 'grid',
    styles: { cellPadding: 3 }
  });

  // Get position after table
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Investment Summary Box
  doc.setFillColor(24, 24, 27);
  doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 26, 3, 3, 'F');

  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL ESTIMATED PROJECT INVESTMENT', margin + 6, finalY + 8);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(`₹${data.formattedMin} Lakhs  –  ₹${data.formattedMax} Lakhs*`, margin + 6, finalY + 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text(`(~${formatCurrency(data.avgEstimate)} incl. Material, Fabrication & GST)`, pageWidth - margin - 6, finalY + 12, { align: 'right' });
  doc.text(`Est. Execution Timeline: ${data.weeks} Weeks | 15-Year Factory Warranty`, pageWidth - margin - 6, finalY + 18, { align: 'right' });

  let notesY = finalY + 32;

  // Add AI / Custom Notes if present
  if (data.aiNotes) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(212, 175, 55);
    doc.roundedRect(margin, notesY, pageWidth - (margin * 2), 12, 2, 2, 'FD');

    doc.setTextColor(146, 64, 14);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Customized Recommendations:', margin + 4, notesY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(doc.splitTextToSize(data.aiNotes, pageWidth - (margin * 2) - 8), margin + 4, notesY + 9);

    notesY += 16;
  }

  // Guarantees & Terms Box
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('ROYAL EPIC ADVANTAGE & TERMS:', margin, notesY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  const terms = [
    '• 100% 304 Grade Stainless Steel modular kitchen carcass is completely waterproof, fireproof, and termite-proof.',
    '• Turnkey execution includes 3D VR design approval, factory CNC precision cutting, dispatch, and white-glove installation.',
    '• Laser site measurement will be conducted upon booking deposit to finalize exact architectural line drawings.',
    '• Payment Schedule: 10% Advance Booking | 50% 3D Approval | 35% Material Dispatch | 5% Installation Completion.'
  ];

  let termY = notesY + 5;
  terms.forEach(term => {
    doc.text(term, margin, termY);
    termY += 4.5;
  });

  // Footer & Signature Block
  const footerY = pageHeight - 20;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Royal Epic Interior & Furniture • Turnkey Projects • Modular SS Kitchens • Spa & Commercial Fitouts', margin, footerY + 5);
  doc.text('Authorized Signatory & Stamp: ______________________', pageWidth - margin, footerY + 5, { align: 'right' });

  // Save PDF
  doc.save(`Royal_Epic_BOQ_${quoteRef}.pdf`);
};

export const generateQuotePdf = (data: QuotePdfData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Background Bar (Dark Luxury)
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Gold accent strip
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 32, pageWidth, 2, 'F');

  // Header Text
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ROYAL EPIC INTERIOR & FURNITURE', margin, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('ISO 9001:2025 Certified Turnkey Interior & Furniture Manufacturing', margin, 18);
  doc.text('Bengaluru Factory & Studio | Tel: +91 99166 33338 | royalepicfurnitur1@gmail.com', margin, 23);

  // Quote Ref ID on top right
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(212, 175, 55);
  doc.text(`QUOTE REF: ${data.quoteId}`, pageWidth - margin, 12, { align: 'right' });
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${dateStr}`, pageWidth - margin, 18, { align: 'right' });
  doc.text(`Status: Official Consultation`, pageWidth - margin, 23, { align: 'right' });

  let y = 42;

  // Header Banner Box
  doc.setFillColor(245, 245, 247);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 2, 2, 'F');
  
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('OFFICIAL PROJECT QUOTATION REQUEST', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Registered Inquiry Details & Consultation Record', margin + 4, y + 12);

  y += 22;

  // Client Details Box
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 40, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(212, 175, 55);
  doc.text('CLIENT & PROJECT INFORMATION', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);

  const leftCol = margin + 4;
  const rightCol = pageWidth / 2 + 10;

  doc.text(`Client Name: ${data.clientName}`, leftCol, y + 15);
  doc.text(`Phone Number: ${data.clientPhone}`, leftCol, y + 22);
  doc.text(`Email Address: ${data.clientEmail}`, leftCol, y + 29);
  doc.text(`Location / City: ${data.cityLocation}`, leftCol, y + 36);

  doc.text(`Project Type: ${data.projectType}`, rightCol, y + 15);
  doc.text(`Estimated Budget: ${data.budget}`, rightCol, y + 22);
  if (data.drawingName) {
    doc.text(`Attached Plan: ${data.drawingName}`, rightCol, y + 29);
  }

  y += 48;

  // Summary Table
  const tableData = [
    ['Project Scope & Service', data.projectType],
    ['Target Budget Range', data.budget],
    ['Factory Location', 'Bengaluru Production Plant & Experience Center'],
    ['Turnkey Services Included', '3D VR Design, SS 304 Carcass, On-site Execution, Quality Supervision'],
    ['Client Requirements Notes', data.message || 'Standard turnkey consultation & site laser measurement requested.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Parameter', 'Specification Details']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [212, 175, 55],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 132 }
    },
    theme: 'grid',
    styles: { cellPadding: 4 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Next Steps Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 28, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NEXT STEPS & CONSULTATION TIMELINE', margin + 4, finalY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Our Senior Interior Architect will contact you within 2 business hours.', margin + 4, finalY + 13);
  doc.text('2. A free on-site laser measurement and 3D space planning meeting will be scheduled.', margin + 4, finalY + 18);
  doc.text('3. You will receive an itemized BOQ with exact material samples at our experience studio.', margin + 4, finalY + 23);

  // Footer
  const footerY = pageHeight - 20;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Royal Epic Interior & Furniture • www.royalepic.in • +91 99166 33338', margin, footerY + 5);
  doc.text('Official Customer Copy', pageWidth - margin, footerY + 5, { align: 'right' });

  doc.save(`Royal_Epic_Quotation_${data.quoteId}.pdf`);
};
