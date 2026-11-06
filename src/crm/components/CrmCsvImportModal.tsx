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

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let inQuote = false;
      let current = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const findIndex = (patterns: string[]): number => {
      return headers.findIndex(h => patterns.some(p => h.includes(p)));
    };

    const nameIdx = findIndex(['name', 'customer', 'client', 'caller']);
    const phoneIdx = findIndex(['phone', 'mobile', 'contact', 'cell', 'tele']);
    const altPhoneIdx = findIndex(['alternate', 'altphone', 'altmobile', 'secondphone']);
    const emailIdx = findIndex(['email', 'mail']);
    const sourceIdx = findIndex(['source', 'channel', 'portal']);
    const serviceIdx = findIndex(['service', 'category', 'requirement', 'interest', 'product']);
    const cityIdx = findIndex(['city', 'area', 'location', 'address']);
    const budgetIdx = findIndex(['budget', 'price', 'range', 'amount']);
    const notesIdx = findIndex(['note', 'notes', 'comment', 'detail', 'remarks', 'description']);

    if (nameIdx === -1 || phoneIdx === -1) {
      setGeneralError('Could not identify "Customer Name" or "Phone Number" in the CSV header columns.');
      setParsedRows([]);
      return;
    }

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length <= 1) continue;

      const customer_name = values[nameIdx] || '';
      const rawPhone = values[phoneIdx] || '';
      const altPhone = altPhoneIdx !== -1 ? values[altPhoneIdx] : undefined;
      const email = emailIdx !== -1 ? values[emailIdx] : undefined;
      const rawSource = sourceIdx !== -1 ? values[sourceIdx] : 'Justdial';
      const interested_service = serviceIdx !== -1 && values[serviceIdx] ? values[serviceIdx] : 'Residential Interior';
      const city = cityIdx !== -1 ? values[cityIdx] : undefined;
      const budget = budgetIdx !== -1 ? values[budgetIdx] : undefined;
      const notes = notesIdx !== -1 ? values[notesIdx] : undefined;

      const validPhone = isValidPhoneNumber(rawPhone);
      let isValid = true;
      let validationError: string | undefined = undefined;

      if (!customer_name.trim()) {
        isValid = false;
        validationError = 'Missing customer name';
      } else if (!validPhone) {
        isValid = false;
        validationError = 'Invalid or incomplete phone number';
      }

      rows.push({
        rowIndex: i,
        customer_name: customer_name.trim(),
        phone: normalizePhoneNumber(rawPhone),
        alternate_phone: altPhone ? normalizePhoneNumber(altPhone) : undefined,
        email: email?.trim(),
        source: (rawSource?.trim() as LeadSource) || 'Justdial',
        interested_service: interested_service.trim(),
        city: city?.trim(),
        budget: budget?.trim(),
        temperature: 'Warm',
        notes: notes?.trim(),
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-xl w-full max-w-4xl text-[#172033] shadow-xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Batch CSV Leads Import</h2>
              <div className="text-[11px] text-slate-500">Admin-controlled high-volume prospect onboarding</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadSampleTemplate}
              className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs text-slate-600 flex items-center gap-1 transition cursor-pointer"
              title="Download Generic CSV Template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generic CSV</span>
            </button>

            <button
              onClick={downloadJustdialTemplate}
              className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs text-amber-800 flex items-center gap-1 transition cursor-pointer"
              title="Download Justdial Specific Export Template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Justdial Preset CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-[#172033]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {generalError && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {importSummary && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Import Finished: {importSummary.imported} leads successfully added to CRM!</span>
              </div>
              <div className="text-xs text-slate-600">
                {importSummary.skipped} duplicate or invalid row{importSummary.skipped === 1 ? '' : 's'} were skipped to protect data integrity.
              </div>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-[#E2E8F0] hover:border-[#356AE6] rounded-xl p-6 text-center bg-slate-50/60 transition">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="font-semibold text-[#172033] mb-1">
              Select or Drop Leads CSV File
            </div>
            <p className="text-slate-500 text-[11px] mb-3">
              Supports CSV exported from Justdial, IndiaMART, Excel, or Google Sheets.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-[#172033] rounded-lg text-xs font-medium transition cursor-pointer shadow-xs">
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
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#172033]">Parsed Preview: {parsedRows.length} total rows</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    {validCount} Ready to Import
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                      {invalidCount} Invalid/Skip
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-[#E2E8F0] text-slate-500 font-semibold sticky top-0 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">Source</th>
                      <th className="py-2 px-3">Service</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {parsedRows.slice(0, 30).map((row) => (
                      <tr key={row.rowIndex} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{row.rowIndex}</td>
                        <td className="py-2 px-3 font-medium text-[#172033]">{row.customer_name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.phone}</td>
                        <td className="py-2 px-3 text-slate-600">{row.source}</td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[150px]">{row.interested_service}</td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="text-rose-600 text-[11px] font-medium flex items-center gap-1" title={row.validationError}>
                              <AlertCircle className="w-3 h-3 text-rose-500" />
                              <span>{row.validationError || 'Invalid'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 ? `${validCount} verified records ready` : 'Upload a CSV to begin validation'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={validCount === 0 || isProcessing}
              className="px-4 py-1.5 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? 'Importing Leads...' : `Import ${validCount} Leads`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
