import React, { useState, useEffect } from 'react';
import { CrmAuthProvider, useCrmAuth } from './CrmAuthContext';
import { CrmLogin } from './components/CrmLogin';
import { CrmDashboard } from './components/CrmDashboard';
import { CrmLeadsList } from './components/CrmLeadsList';
import { CrmFollowupsView } from './components/CrmFollowupsView';
import { CrmReportsView } from './components/CrmReportsView';
import { CrmUserManagement } from './components/CrmUserManagement';
import { CrmIntegrationsView } from './components/CrmIntegrationsView';
import { CrmLeadModal } from './components/CrmLeadModal';
import { CrmLogCallModal } from './components/CrmLogCallModal';
import { CrmCreateLeadModal } from './components/CrmCreateLeadModal';
import { CrmCsvImportModal } from './components/CrmCsvImportModal';
import { CrmLead, CrmFilterState } from './types';
import { fetchCrmFollowups, fetchCrmLeads } from './crmService';
import { 
  Phone, 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  AlertCircle, 
  Clock, 
  PhoneCall, 
  BarChart3, 
  ShieldCheck, 
  Sliders, 
  LogOut, 
  Plus, 
  ExternalLink,
  Menu,
  X,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface TelecallerCrmAppProps {
  onBackToWebsite?: () => void;
}

type TabType = 'dashboard' | 'leads' | 'followups' | 'history' | 'reports' | 'users' | 'settings';

const CrmInnerApp: React.FC<TelecallerCrmAppProps> = ({ onBackToWebsite }) => {
  const { user, isAuthenticated, loading, isAdmin, logout } = useCrmAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [followupSubTab, setFollowupSubTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Search & Filters
  const [globalSearch, setGlobalSearch] = useState('');
  const [leadFilters, setLeadFilters] = useState<Partial<CrmFilterState>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Followup counts for notifications and sidebar badges
  const [followupCounts, setFollowupCounts] = useState({
    today: 0,
    overdue: 0,
    upcoming: 0
  });

  // Modal states
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [callLead, setCallLead] = useState<CrmLead | null>(null);
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Load counts on mount and refresh
  useEffect(() => {
    if (isAuthenticated) {
      fetchCrmFollowups().then(res => {
        setFollowupCounts({
          today: res.dueToday?.length || 0,
          overdue: res.overdue?.length || 0,
          upcoming: res.upcoming?.length || 0
        });
      }).catch(() => {});
    }
  }, [isAuthenticated, refreshKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center text-[#172033] px-4">
        <div className="w-8 h-8 border-2 border-[#356AE6]/20 border-t-[#356AE6] rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading Telecaller CRM...</p>
      </div>
    );
  }

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

  const handleNavigateTabWithFilter = (tab: string, filters?: Partial<CrmFilterState>) => {
    if (filters) {
      setLeadFilters(filters);
    }
    if (tab === 'followups-today') {
      setActiveTab('followups');
      setFollowupSubTab('today');
    } else if (tab === 'followups-overdue') {
      setActiveTab('followups');
      setFollowupSubTab('overdue');
    } else if (tab === 'followups-upcoming') {
      setActiveTab('followups');
      setFollowupSubTab('upcoming');
    } else {
      setActiveTab(tab as TabType);
    }
    setMobileMenuOpen(false);
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    setLeadFilters({ search: globalSearch.trim(), page: 1 });
    setActiveTab('leads');
    setMobileMenuOpen(false);
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'leads': return 'All Leads Directory';
      case 'followups': 
        return followupSubTab === 'today' ? "Today's Follow-ups" :
               followupSubTab === 'overdue' ? 'Overdue Follow-ups' :
               followupSubTab === 'upcoming' ? 'Upcoming Follow-ups' : 'Completed Follow-ups';
      case 'history': return 'Recent Call Interactions';
      case 'reports': return 'Operational Performance Reports';
      case 'users': return 'User Access & Permissions';
      case 'settings': return 'System Settings & Integrations';
      default: return 'CRM Workspace';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172033] flex flex-col font-sans antialiased">
      <div className="flex flex-1 min-h-screen">
        {/* ========================================================================= */}
        {/* 1. DESKTOP LEFT SIDEBAR */}
        {/* ========================================================================= */}
        <aside 
          className={`hidden md:flex flex-col bg-white border-r border-[#E2E8F0] transition-all duration-200 z-30 ${
            isSidebarCollapsed ? 'w-18' : 'w-64'
          }`}
        >
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-[#356AE6] text-white flex items-center justify-center shrink-0 shadow-sm font-semibold text-sm">
                RE
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <div className="text-sm font-bold text-[#172033] tracking-tight leading-none truncate">
                    Royal Epic
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium leading-tight mt-1 truncate">
                    Telecaller CRM
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-md text-slate-400 hover:text-[#172033] hover:bg-slate-100 transition-colors"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick Action: Add New Lead */}
          <div className="p-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className={`w-full py-2.5 px-3 rounded-lg bg-[#356AE6] hover:bg-[#2D5AC2] text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                isSidebarCollapsed ? 'px-0' : ''
              }`}
              title="Add New Lead"
            >
              <Plus className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Add New Lead</span>}
            </button>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {/* Overview */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
              }`}
              title="Overview"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Overview</span>}
            </button>

            {/* All Leads */}
            <button
              onClick={() => {
                setLeadFilters({});
                setActiveTab('leads');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'leads'
                  ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
              }`}
              title="All Leads"
            >
              <Users className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>All Leads</span>}
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-[#E2E8F0]" />

            {!isSidebarCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Follow-ups
              </div>
            )}

            {/* Today's Follow-ups */}
            <button
              onClick={() => {
                setActiveTab('followups');
                setFollowupSubTab('today');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'followups' && followupSubTab === 'today'
                  ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
              }`}
              title="Today's Follow-ups"
            >
              <div className="flex items-center gap-3">
                <CalendarClock className="w-4 h-4 shrink-0 text-amber-600" />
                {!isSidebarCollapsed && <span>Today's Follow-ups</span>}
              </div>
              {!isSidebarCollapsed && followupCounts.today > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  {followupCounts.today}
                </span>
              )}
            </button>

            {/* Overdue Follow-ups */}
            <button
              onClick={() => {
                setActiveTab('followups');
                setFollowupSubTab('overdue');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'followups' && followupSubTab === 'overdue'
                  ? 'bg-rose-50 text-rose-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
              }`}
              title="Overdue Follow-ups"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {!isSidebarCollapsed && <span>Overdue Follow-ups</span>}
              </div>
              {!isSidebarCollapsed && followupCounts.overdue > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  {followupCounts.overdue}
                </span>
              )}
            </button>

            {/* Upcoming Follow-ups */}
            <button
              onClick={() => {
                setActiveTab('followups');
                setFollowupSubTab('upcoming');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'followups' && followupSubTab === 'upcoming'
                  ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
              }`}
              title="Upcoming Follow-ups"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 shrink-0 text-slate-500" />
                {!isSidebarCollapsed && <span>Upcoming Follow-ups</span>}
              </div>
              {!isSidebarCollapsed && followupCounts.upcoming > 0 && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {followupCounts.upcoming}
                </span>
              )}
            </button>

            {/* Call History */}
            <button
              onClick={() => {
                setLeadFilters({ sortBy: 'created_desc' });
                setActiveTab('history');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
              }`}
              title="Call History"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Call History</span>}
            </button>

            {/* Reports */}
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
              }`}
              title="Reports"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Reports</span>}
            </button>

            {/* Admin-only Navigation */}
            {isAdmin && (
              <>
                <div className="my-2 border-t border-[#E2E8F0]" />

                {!isSidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Administration
                  </div>
                )}

                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
                  }`}
                  title="User Management"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>User Management</span>}
                </button>

                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-[#172033] transition-colors cursor-pointer"
                  title="Import CSV"
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Import CSV</span>}
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
                  }`}
                  title="Settings"
                >
                  <Sliders className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Settings</span>}
                </button>
              </>
            )}
          </nav>

          {/* User profile & logout at bottom of sidebar */}
          <div className="p-3 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-[#172033] font-semibold text-xs flex items-center justify-center shrink-0">
                  {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                </div>
                {!isSidebarCollapsed && (
                  <div className="truncate">
                    <div className="text-xs font-semibold text-[#172033] truncate">
                      {user?.name}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize truncate">
                      {user?.role}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* 2. MAIN APPLICATION VIEWPORT */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header */}
          <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
            {/* Left: Mobile Menu Toggle & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="text-xs text-slate-500 hidden sm:block">
                  Royal Epic CRM / {activeTab === 'dashboard' ? 'Overview' : activeTab.toUpperCase()}
                </div>
                <h1 className="text-base font-bold text-[#172033] truncate leading-tight">
                  {getPageTitle()}
                </h1>
              </div>
            </div>

            {/* Center: Global Search Field */}
            <div className="hidden lg:flex flex-1 max-w-md mx-4">
              <form onSubmit={handleGlobalSearchSubmit} className="w-full relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Global search by name or phone... (Press Enter)"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-[#E2E8F0] focus:border-[#356AE6] rounded-lg text-xs text-[#172033] placeholder-slate-400 focus:outline-none transition-colors"
                />
              </form>
            </div>

            {/* Right: Notifications, Actions & User */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Notification Popover Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {(followupCounts.today > 0 || followupCounts.overdue > 0) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-3 z-50 text-xs">
                    <div className="font-semibold text-[#172033] pb-2 border-b border-[#E2E8F0] flex items-center justify-between">
                      <span>Follow-up Alerts</span>
                      <span className="text-[10px] text-slate-500">{followupCounts.today + followupCounts.overdue} pending</span>
                    </div>
                    <div className="py-2 space-y-2">
                      <div 
                        onClick={() => {
                          setActiveTab('followups');
                          setFollowupSubTab('overdue');
                          setShowNotifications(false);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between text-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Overdue Tasks</span>
                        </div>
                        <span className="font-semibold text-rose-600">{followupCounts.overdue}</span>
                      </div>

                      <div 
                        onClick={() => {
                          setActiveTab('followups');
                          setFollowupSubTab('today');
                          setShowNotifications(false);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between text-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Due Today</span>
                        </div>
                        <span className="font-semibold text-amber-600">{followupCounts.today}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Back to Website Button */}
              {onBackToWebsite && (
                <button
                  onClick={onBackToWebsite}
                  className="hidden xl:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#172033] px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span>Public Site</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {/* User badge & Logout in top header */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#172033] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                    {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden lg:block text-left text-xs leading-tight">
                    <div className="font-semibold text-slate-800 truncate max-w-[120px]">{user?.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                  title="Sign out of CRM"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Mobile Quick Add Lead */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="md:hidden p-2 rounded-lg bg-[#356AE6] text-white"
                title="Add Lead"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <CrmDashboard
                key={`dash-${refreshKey}`}
                onNavigateTab={handleNavigateTabWithFilter}
                onOpenCreateLead={() => setIsCreateModalOpen(true)}
                onSelectLead={handleOpenLead}
                onQuickCall={handleQuickCall}
              />
            )}

            {activeTab === 'leads' && (
              <CrmLeadsList
                key={`leads-${refreshKey}`}
                initialFilters={leadFilters}
                onSelectLead={handleOpenLead}
                onOpenCreateLead={() => setIsCreateModalOpen(true)}
                onQuickCall={handleQuickCall}
              />
            )}

            {activeTab === 'followups' && (
              <CrmFollowupsView
                key={`follow-${refreshKey}-${followupSubTab}`}
                defaultTab={followupSubTab}
                onSelectLead={handleOpenLead}
                onQuickCall={handleQuickCall}
              />
            )}

            {activeTab === 'history' && (
              <CrmLeadsList
                key={`hist-${refreshKey}`}
                initialFilters={{ sortBy: 'created_desc' }}
                onSelectLead={handleOpenLead}
                onOpenCreateLead={() => setIsCreateModalOpen(true)}
                onQuickCall={handleQuickCall}
              />
            )}

            {activeTab === 'reports' && (
              <CrmReportsView />
            )}

            {activeTab === 'users' && isAdmin && (
              <CrmUserManagement />
            )}

            {activeTab === 'settings' && isAdmin && (
              <CrmIntegrationsView />
            )}
          </main>

          {/* Compact Clean Footer */}
          <footer className="border-t border-[#E2E8F0] bg-white py-3 px-6 text-center text-xs text-slate-500">
            Royal Epic Commercial & Home Interiors • Telecaller CRM Suite • tele.royalepicinteriors.com
          </footer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE NAVIGATION DRAWER */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85%] bg-white flex flex-col h-full shadow-2xl z-10">
            {/* Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#356AE6] text-white flex items-center justify-center font-bold text-xs">
                  RE
                </div>
                <div>
                  <div className="text-sm font-bold text-[#172033]">Royal Epic</div>
                  <div className="text-[10px] text-slate-500">Telecaller CRM</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-[#172033]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 p-3 space-y-1 overflow-y-auto text-xs">
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-left ${
                  activeTab === 'dashboard' ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold' : 'text-slate-600'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => { setLeadFilters({}); setActiveTab('leads'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-left ${
                  activeTab === 'leads' ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold' : 'text-slate-600'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All Leads</span>
              </button>

              <div className="my-2 border-t border-[#E2E8F0]" />

              <button
                onClick={() => { setActiveTab('followups'); setFollowupSubTab('today'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-left ${
                  activeTab === 'followups' && followupSubTab === 'today' ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold' : 'text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarClock className="w-4 h-4 text-amber-600" />
                  <span>Today's Follow-ups</span>
                </div>
                {followupCounts.today > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700">
                    {followupCounts.today}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('followups'); setFollowupSubTab('overdue'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-left ${
                  activeTab === 'followups' && followupSubTab === 'overdue' ? 'bg-rose-50 text-rose-700 font-semibold' : 'text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Overdue Follow-ups</span>
                </div>
                {followupCounts.overdue > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700">
                    {followupCounts.overdue}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('followups'); setFollowupSubTab('upcoming'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-left ${
                  activeTab === 'followups' && followupSubTab === 'upcoming' ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold' : 'text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Upcoming Follow-ups</span>
                </div>
                {followupCounts.upcoming > 0 && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {followupCounts.upcoming}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setLeadFilters({ sortBy: 'created_desc' }); setActiveTab('history'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-left ${
                  activeTab === 'history' ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold' : 'text-slate-600'
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call History</span>
              </button>

              <button
                onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-left ${
                  activeTab === 'reports' ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold' : 'text-slate-600'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </button>

              {isAdmin && (
                <>
                  <div className="my-2 border-t border-[#E2E8F0]" />
                  <button
                    onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-left ${
                      activeTab === 'users' ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold' : 'text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>User Management</span>
                  </button>

                  <button
                    onClick={() => { setIsCsvModalOpen(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-600 text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Import CSV</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-left ${
                      activeTab === 'settings' ? 'bg-[#EBF1FE] text-[#356AE6] font-semibold' : 'text-slate-600'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#172033]">{user?.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS & DRAWERS */}
      {/* ========================================================================= */}
      <CrmLeadModal
        lead={selectedLead}
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onLeadUpdated={() => {
          triggerRefresh();
        }}
        onOpenLogCall={(lead) => {
          setIsLeadModalOpen(false);
          handleQuickCall(lead);
        }}
      />

      <CrmLogCallModal
        lead={callLead}
        isOpen={isLogCallModalOpen}
        onClose={() => setIsLogCallModalOpen(false)}
        onCallLogged={() => {
          triggerRefresh();
        }}
      />

      <CrmCreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLeadCreated={(newLead) => {
          triggerRefresh();
          setSelectedLead(newLead);
          setIsLeadModalOpen(true);
        }}
      />

      {isAdmin && (
        <CrmCsvImportModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          onImportComplete={() => {
            triggerRefresh();
          }}
        />
      )}

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-50 border border-rose-100">
                <LogOut className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Sign Out</h3>
                <p className="text-xs text-slate-500">Royal Epic Telecaller CRM</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to log out as <strong className="text-slate-800">{user?.name}</strong> ({user?.role})? Your active session token and cached local storage will be cleared immediately.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
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
