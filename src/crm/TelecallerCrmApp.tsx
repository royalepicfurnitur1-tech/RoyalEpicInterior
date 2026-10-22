import React, { useState } from 'react';
import { CrmAuthProvider, useCrmAuth } from './CrmAuthContext';
import { CrmLogin } from './components/CrmLogin';
import { CrmDashboard } from './components/CrmDashboard';
import { CrmLeadsList } from './components/CrmLeadsList';
import { CrmFollowupsView } from './components/CrmFollowupsView';
import { CrmReportsView } from './components/CrmReportsView';
import { CrmUserManagement } from './components/CrmUserManagement';
import { CrmLeadModal } from './components/CrmLeadModal';
import { CrmLogCallModal } from './components/CrmLogCallModal';
import { CrmCreateLeadModal } from './components/CrmCreateLeadModal';
import { CrmCsvImportModal } from './components/CrmCsvImportModal';
import { CrmLead } from './types';
import { 
  Phone, 
  LayoutDashboard, 
  Users, 
  Clock, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldCheck, 
  LogOut, 
  Plus, 
  ExternalLink,
  Menu,
  X
} from 'lucide-react';

interface TelecallerCrmAppProps {
  onBackToWebsite?: () => void;
}

const CrmInnerApp: React.FC<TelecallerCrmAppProps> = ({ onBackToWebsite }) => {
  const { user, isAuthenticated, loading, isAdmin, logout } = useCrmAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'followups' | 'reports' | 'import' | 'users'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const [callLead, setCallLead] = useState<CrmLead | null>(null);
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-4">
        <div className="w-10 h-10 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">Verifying CRM Authorization...</p>
      </div>
    );
  }

  // Not signed in
  if (!isAuthenticated) {
    return <CrmLogin onBackToWebsite={onBackToWebsite} />;
  }

  const handleOpenLead = (lead: CrmLead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleQuickCall = (lead: CrmLead) => {
    setCallLead(lead);
    setIsLogCallModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Subdomain Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/20 font-bold border border-amber-300/30">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm tracking-wide text-white">
                  Royal Epic Interiors
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Telecaller CRM
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 font-mono hidden sm:block">
                Subdomain: tele.royalepicinteriors.com
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'leads'
                  ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Leads</span>
            </button>

            <button
              onClick={() => setActiveTab('followups')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'followups'
                  ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Follow-ups</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/60 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV Import</span>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Users</span>
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition shadow-md shadow-amber-500/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Lead</span>
            </button>

            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-white">{user?.name}</span>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">{user?.role}</span>
            </div>

            <button
              onClick={() => logout()}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {onBackToWebsite && (
              <button
                onClick={onBackToWebsite}
                className="hidden xl:inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-amber-400 transition ml-1"
                title="Open Public Website"
              >
                <span>Website</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-neutral-900 border-b border-neutral-800 px-4 py-3 space-y-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-lg text-xs font-mono text-neutral-200 hover:bg-neutral-800"
            >
              Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('leads'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-lg text-xs font-mono text-neutral-200 hover:bg-neutral-800"
            >
              All Leads
            </button>
            <button
              onClick={() => { setActiveTab('followups'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-lg text-xs font-mono text-neutral-200 hover:bg-neutral-800"
            >
              Follow-ups Due
            </button>
            <button
              onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-lg text-xs font-mono text-neutral-200 hover:bg-neutral-800"
            >
              Reports & Analytics
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => { setIsCsvModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2 px-3 rounded-lg text-xs font-mono text-emerald-400 hover:bg-neutral-800"
                >
                  Batch CSV Import
                </button>
                <button
                  onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2 px-3 rounded-lg text-xs font-mono text-neutral-200 hover:bg-neutral-800"
                >
                  Access Control (Users)
                </button>
              </>
            )}
            <button
              onClick={() => { setIsCreateModalOpen(true); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-lg text-xs font-mono bg-amber-500 text-neutral-950 font-bold"
            >
              + Create Lead
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <CrmDashboard
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onOpenCreateLead={() => setIsCreateModalOpen(true)}
            onSelectLead={handleOpenLead}
            onQuickCall={handleQuickCall}
          />
        )}

        {activeTab === 'leads' && (
          <CrmLeadsList
            onSelectLead={handleOpenLead}
            onOpenCreateLead={() => setIsCreateModalOpen(true)}
            onQuickCall={handleQuickCall}
          />
        )}

        {activeTab === 'followups' && (
          <CrmFollowupsView
            onSelectLead={handleOpenLead}
            onQuickCall={handleQuickCall}
          />
        )}

        {activeTab === 'reports' && (
          <CrmReportsView />
        )}

        {activeTab === 'users' && isAdmin && (
          <CrmUserManagement />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-4 bg-neutral-950 text-center text-[10px] font-mono text-neutral-400">
        Royal Epic Interiors Telecaller CRM • ISO 9001:2025 Certified Production Execution • Host: tele.royalepicinteriors.com
      </footer>

      {/* Modals */}
      <CrmLeadModal
        lead={selectedLead}
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onLeadUpdated={() => {}}
        onOpenLogCall={(lead) => {
          setIsLeadModalOpen(false);
          handleQuickCall(lead);
        }}
      />

      <CrmLogCallModal
        lead={callLead}
        isOpen={isLogCallModalOpen}
        onClose={() => setIsLogCallModalOpen(false)}
        onCallLogged={() => {}}
      />

      <CrmCreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLeadCreated={(newLead) => {
          setSelectedLead(newLead);
          setIsLeadModalOpen(true);
        }}
      />

      {isAdmin && (
        <CrmCsvImportModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          onImportComplete={() => {}}
        />
      )}
    </div>
  );
};

export const TelecallerCrmApp: React.FC<TelecallerCrmAppProps> = (props) => {
  return (
    <CrmAuthProvider>
      <CrmInnerApp {...props} />
    </CrmAuthProvider>
  );
};

export default TelecallerCrmApp;
