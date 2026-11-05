import React, { useState } from 'react';
import { CrmLead, LeadSource, LeadTemperature } from '../types';
import { 
  importCrmCsv, 
  isValidPhoneNumber, 
  normalizePhoneNumber 
} from '../crmService';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Check, 
  AlertTriangle,
  Download
} from 'lucide-react';

interface CrmCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  rowIndex: number;
  customer_name: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  source: LeadSource;
  interested_service: string;
  city?: string;
  budget?: string;
  temperature: LeadTemperature;
  notes?: string;
  external_lead_id?: string;
  isValid: boolean;
  validationError?: string;
}

export const CrmCsvImportModal: React.FC<CrmCsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  if (!isOpen) return null;

  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    skipped: number;
    errors: Array<{ row: number; reason: string }>;
  } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const sampleCsv = `Customer Name,Phone Number,Email,Source,Service,City,Budget,Notes
Priya Sharma,9845011223,priya.s@gmail.com,Justdial,Modular Kitchen,Bengaluru (Hebbal),15 Lakhs,Requires acrylic finish
Karthik Rao,+91 99001 22334,karthik.rao@yahoo.com,IndiaMART,Turnkey 3BHK,Bengaluru (Thanisandra),28 Lakhs,Burma teak pooja door
Manjunath B,97311 99887,,Website,WPC Bathroom Doors,Bengaluru,4 Lakhs,Termite proof warranty inquiry`;

  const justdialCsv = `Lead ID,Caller Name,Mobile Number,Alternate Mobile,Email,Category,City,Area,Budget,Requirement,Date
JD-91021,Rajesh Gowda,9880199887,+918023456789,rajesh.g@example.com,Turnkey 4BHK Villa Interior,Bengaluru,Hebbal,35 Lakhs,Italian marble flooring and teak pooja room,2026-11-05
JD-91022,Deepa Nambiar,9916644221,,deepa.n@yahoo.com,Modular Kitchen & Wardrobes,Bengaluru,Thanisandra,18 Lakhs,Acrylic kitchen with island counter,2026-11-05
JD-91023,Arjun Murthy,9741288334,,arjun.m@techcorp.in,Commercial Office Fit-Out,Bengaluru,Whitefield,45 Lakhs,Glass partitions and director cabin,2026-11-05`;

  const downloadSampleTemplate = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'royal_epic_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJustdialTemplate = () => {
    const blob = new Blob([justdialCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'justdial_leads_export_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string) => {
    setGeneralError(null);
    setImportSummary(null);

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setGeneralError('CSV must include at least a header row and 1 data row.');
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Find column indexes with support for standard CRM and Justdial exports
    const extIdIdx = headers.findIndex(h => h.includes('leadid') || h.includes('leadno') || h.includes('extid') || h.includes('enquiryid') || h === 'id');
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('customer') || h.includes('client') || h.includes('caller') || h.includes('contactperson'));
    const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('number') || h.includes('cell'));
    const altPhoneIdx = headers.findIndex(h => h.includes('alt') || h.includes('second'));
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    const sourceIdx = headers.findIndex(h => h.includes('source') || h.includes('channel') || h.includes('platform'));
    const serviceIdx = headers.findIndex(h => h.includes('service') || h.includes('requirement') || h.includes('product') || h.includes('category'));
    const cityIdx = headers.findIndex(h => h.includes('city') || h.includes('location') || h.includes('area') || h.includes('branch'));
    const budgetIdx = headers.findIndex(h => h.includes('budget') || h.includes('quote') || h.includes('cost') || h.includes('value'));
    const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('remark') || h.includes('comment') || h.includes('requirement'));

    if (nameIdx === -1 || phoneIdx === -1) {
      setGeneralError('Could not identify required columns: "Customer Name" and "Phone Number" are required in the header row.');
      return;
    }

    const rows: ParsedRow[] = [];
    const seenPhonesInBatch = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV splitter respecting quoted cells
      const cells: string[] = [];
      let inQuotes = false;
      let currentCell = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());

      const rawExtId = extIdIdx !== -1 ? cells[extIdIdx] : '';
      const rawName = cells[nameIdx] || '';
      const rawPhone = cells[phoneIdx] || '';
      const rawAltPhone = altPhoneIdx !== -1 ? cells[altPhoneIdx] : '';
      const rawEmail = emailIdx !== -1 ? cells[emailIdx] : '';
      const rawSource = sourceIdx !== -1 ? cells[sourceIdx] : 'Justdial';
      const rawService = serviceIdx !== -1 ? cells[serviceIdx] : 'Turnkey Interior';
      const rawCity = cityIdx !== -1 ? cells[cityIdx] : 'Bengaluru';
      const rawBudget = budgetIdx !== -1 ? cells[budgetIdx] : '';
      const rawNotes = notesIdx !== -1 ? cells[notesIdx] : '';

      let isValid = true;
      let validationError = '';

      if (!rawName.trim()) {
        isValid = false;
        validationError = 'Name is missing';
      } else if (!isValidPhoneNumber(rawPhone)) {
        isValid = false;
        validationError = 'Invalid phone number format';
      } else {
        const norm = normalizePhoneNumber(rawPhone);
        if (seenPhonesInBatch.has(norm)) {
          isValid = false;
          validationError = 'Duplicate phone number within this CSV';
        } else {
          seenPhonesInBatch.add(norm);
        }
      }

      // Safe source mapping
      let cleanSource: LeadSource = 'Website';
      const sLower = rawSource.toLowerCase();
      if (sLower.includes('justdial')) cleanSource = 'Justdial';
      else if (sLower.includes('indiamart')) cleanSource = 'IndiaMART';
      else if (sLower.includes('facebook')) cleanSource = 'Facebook';
      else if (sLower.includes('instagram')) cleanSource = 'Instagram';
      else if (sLower.includes('referral')) cleanSource = 'Referral';
      else if (sLower.includes('walk')) cleanSource = 'Walk-in';
      else if (sLower.includes('website')) cleanSource = 'Website';
      else cleanSource = 'Other';

      rows.push({
        rowIndex: i + 1,
        customer_name: rawName.trim(),
        phone: normalizePhoneNumber(rawPhone.trim()),
        alternate_phone: rawAltPhone?.trim() ? normalizePhoneNumber(rawAltPhone.trim()) : undefined,
        email: rawEmail?.trim() || undefined,
        source: cleanSource,
        interested_service: rawService?.trim() || 'Turnkey Interior Design',
        city: rawCity?.trim() || 'Bengaluru',
        budget: rawBudget?.trim() || undefined,
        temperature: 'Warm',
        notes: rawNotes?.trim() || undefined,
        external_lead_id: rawExtId?.trim() || undefined,
        isValid,
        validationError
      });
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      parseCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setGeneralError('No valid rows available to import.');
      return;
    }

    setIsProcessing(true);
    setGeneralError(null);

    const payload = validRows.map(r => ({
      customer_name: r.customer_name,
      phone: r.phone,
      email: r.email,
      source: r.source,
      interested_service: r.interested_service,
      city: r.city,
      budget: r.budget,
      temperature: r.temperature,
      notes: r.notes
    }));

    const res = await importCrmCsv(payload);
    setIsProcessing(false);

    if (!res.success) {
      setGeneralError(res.error || 'Failed to complete CSV import.');
    } else {
      setImportSummary({
        imported: res.importedCount,
        skipped: res.skippedCount,
        errors: res.errors
      });
      onImportComplete();
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-4xl text-white shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-white">Batch CSV Leads Import</h2>
              <div className="text-[11px] font-mono text-neutral-400">Admin-controlled high-volume prospect onboarding</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadSampleTemplate}
              className="text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
              title="Download Generic CSV Template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generic CSV</span>
            </button>

            <button
              onClick={downloadJustdialTemplate}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"
              title="Download Justdial Specific Export Template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Justdial Preset CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {generalError && (
            <div className="bg-red-950/60 border border-red-800 p-3 rounded-xl text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {importSummary && (
            <div className="bg-emerald-950/40 border border-emerald-800 p-4 rounded-xl text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Import Finished: {importSummary.imported} leads successfully added to CRM!</span>
              </div>
              <div className="text-xs text-neutral-300 font-mono">
                {importSummary.skipped} duplicate or invalid row{importSummary.skipped === 1 ? '' : 's'} were skipped to protect data integrity.
              </div>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-neutral-700 hover:border-amber-400/60 rounded-2xl p-6 text-center bg-neutral-950/40 transition">
            <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <div className="font-semibold text-white mb-1">
              Select or Drop Leads CSV File
            </div>
            <p className="text-neutral-400 text-[11px] mb-3">
              Supports CSV exported from Justdial, IndiaMART, Excel, or Google Sheets.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-mono transition cursor-pointer border border-neutral-700">
              <span>{fileName || 'Choose CSV File'}</span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview Table & Validation Summary */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-neutral-300">
                <div className="flex items-center gap-3">
                  <span>Total Rows: <strong className="text-white">{parsedRows.length}</strong></span>
                  <span className="text-emerald-400">Valid: <strong>{validCount}</strong></span>
                  {invalidCount > 0 && (
                    <span className="text-red-400">Invalid: <strong>{invalidCount}</strong></span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400">
                  Previewing first 10 rows
                </div>
              </div>

              <div className="border border-neutral-800 rounded-xl overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-neutral-950 sticky top-0 text-[10px] font-mono uppercase text-neutral-400 border-b border-neutral-800">
                    <tr>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Customer Name</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">Source</th>
                      <th className="py-2 px-3">Interested Service</th>
                      <th className="py-2 px-3">City</th>
                      <th className="py-2 px-3">Validation Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {parsedRows.slice(0, 10).map((row) => (
                      <tr key={row.rowIndex} className={row.isValid ? 'hover:bg-neutral-800/30' : 'bg-red-950/20 text-red-200'}>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="text-emerald-400 font-bold">✓ Ready</span>
                          ) : (
                            <span className="text-red-400 font-bold">✕ Error</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-sans font-medium text-white">{row.customer_name || '-'}</td>
                        <td className="py-2 px-3">{row.phone}</td>
                        <td className="py-2 px-3">{row.source}</td>
                        <td className="py-2 px-3 font-sans truncate max-w-[120px]">{row.interested_service}</td>
                        <td className="py-2 px-3">{row.city}</td>
                        <td className="py-2 px-3 text-red-400">{row.validationError || 'Valid'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono text-neutral-400">
            {validCount > 0 ? `${validCount} prospect(s) verified for import.` : 'No leads queued.'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-mono text-xs text-neutral-300 transition"
            >
              Close
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={validCount === 0 || isProcessing}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold font-mono text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 disabled:opacity-40 cursor-pointer"
            >
              {isProcessing ? 'Writing to CRM...' : `Confirm & Import ${validCount} Leads`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
