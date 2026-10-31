import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Settings,
  Bot,
  Users,
  Inbox,
  Link2,
  RefreshCw,
  PhoneCall,
  Plus,
  Building2,
  X,
  Menu,
  LogOut,
  Terminal,
  Cpu,
  Layers
} from 'lucide-react';
import axios, { getAdminKey, clearAdminKey } from './services/api';
import { AuthModal } from './components/AuthModal';
import { SkinSelector } from './components/SkinSelector';
import { InstallAppBanner } from './components/InstallAppBanner';
import { DashboardView } from './components/DashboardView';
import { ConfigView } from './components/ConfigView';
import { SimulatorView } from './components/SimulatorView';
import { CrmTransactionsView } from './components/CrmTransactionsView';
import { HandoverInboxView } from './components/HandoverInboxView';
import { IntegrationsView } from './components/IntegrationsView';
import { BusinessCategory, BusinessConfig, Conversation, IntegrationStatus, Lead, Transaction } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'config' | 'simulator' | 'crm' | 'inbox' | 'integrations'
  >('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getAdminKey());

  const [business, setBusiness] = useState<BusinessConfig | null>(null);
  const [businesses, setBusinesses] = useState<BusinessConfig[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Multi-Tenant New Business Modal
  const [showNewBizForm, setShowNewBizForm] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizCategory, setNewBizCategory] = useState<BusinessCategory>('tienda');
  const [switchingBiz, setSwitchingBiz] = useState(false);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const [bizRes, bizListRes, leadsRes, convsRes, txsRes, integRes] = await Promise.all([
        axios.get('/api/business').catch((err) => {
          if (err.response?.status === 401) setIsAuthenticated(false);
          return { data: { data: null } };
        }),
        axios.get('/api/businesses').catch(() => ({ data: { data: [] } })),
        axios.get('/api/leads').catch(() => ({ data: { data: [] } })),
        axios.get('/api/conversations').catch(() => ({ data: { data: [] } })),
        axios.get('/api/transactions').catch(() => ({ data: { data: [] } })),
        axios.get('/api/health/integrations').catch(() => ({ data: { data: null } }))
      ]);

      if (bizRes.data?.data) setBusiness(bizRes.data.data);
      if (bizListRes.data?.data) setBusinesses(bizListRes.data.data);
      if (leadsRes.data?.data) setLeads(leadsRes.data.data);
      if (convsRes.data?.data) setConversations(convsRes.data.data);
      if (txsRes.data?.data) setTransactions(txsRes.data.data);
      if (integRes.data?.data) setIntegrations(integRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 12000); // 12s polling
    return () => clearInterval(interval);
  }, []);

  const handleSwitchBusiness = async (businessId: string) => {
    if (!businessId || businessId === business?.id) return;
    setSwitchingBiz(true);
    try {
      const res = await axios.post('/api/businesses/switch', { business_id: businessId });
      if (res.data?.success) {
        setBusiness(res.data.data);
        await fetchAllData();
      }
    } catch (err) {
      console.error('Error switching business:', err);
    } finally {
      setSwitchingBiz(false);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;
    setSwitchingBiz(true);
    try {
      const res = await axios.post('/api/businesses/create', {
        name: newBizName.trim(),
        category: newBizCategory
      });
      if (res.data?.success) {
        setBusiness(res.data.data);
        setNewBizName('');
        setShowNewBizForm(false);
        await fetchAllData();
      }
    } catch (err) {
      console.error('Error creating business:', err);
    } finally {
      setSwitchingBiz(false);
    }
  };

  const hotLeadsCount = leads.filter((l) => l.buying_score >= 80).length;
  const pendingTxCount = transactions.filter((t) => t.status === 'pendiente_de_verificacion').length;

  const handleTabChange = (tab: 'dashboard' | 'config' | 'simulator' | 'crm' | 'inbox' | 'integrations') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {!isAuthenticated && (
        <AuthModal
          onSuccess={() => {
            setIsAuthenticated(true);
            fetchAllData();
          }}
        />
      )}

      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col md:flex-row antialiased overflow-x-hidden transition-colors duration-200">
        {/* Mobile Sticky Header Bar */}
        <header className="md:hidden bg-[var(--bg-surface)] backdrop-blur-xl border-b border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-highlight)] flex items-center justify-center text-[var(--accent-primary)] font-mono font-black shadow-md">
              <span className="text-xs font-bold tracking-tighter">VT</span>
            </div>
            <div>
              <div className="text-sm font-black tracking-tight flex items-center gap-1 font-mono">
                VOXA <span className="text-[var(--accent-primary)]">.AI</span>
              </div>
              <div className="text-[9px] font-mono text-[var(--text-muted)] tracking-wider">
                [SYS v5.5 // VENE TURCO]
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SkinSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu de navegacion'}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[var(--accent-secondary)]" /> : <Menu className="w-5 h-5 text-[var(--accent-primary)]" />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer Overlay Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-45 md:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation - HUD & Tactical Styling */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:max-w-none md:static md:w-64 bg-[var(--bg-surface)] backdrop-blur-xl border-r border-[var(--border-subtle)] flex flex-col shrink-0 shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Brand Header */}
          <div className="p-4 md:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-highlight)] flex items-center justify-center text-[var(--accent-primary)] font-mono font-black shadow-md">
                <span className="text-sm font-bold tracking-tight">VT</span>
              </div>
              <div>
                <div className="text-base font-black tracking-tight flex items-center gap-1.5 font-mono">
                  VOXA <span className="text-[var(--accent-primary)]">.AI</span>
                </div>
                <div className="text-[9px] font-mono text-[var(--accent-secondary)] uppercase tracking-wider font-semibold">
                  [SYS v5.5 // VENE TURCO]
                </div>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Cerrar navegacion"
              className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Multi-Tenant Active Business Switcher Pill */}
          <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-2">
            <div className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-[var(--accent-primary)]" />
                Negocio Activo
              </span>
              <button
                onClick={() => setShowNewBizForm(!showNewBizForm)}
                className="text-[10px] text-[var(--accent-primary)] hover:underline font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                {showNewBizForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showNewBizForm ? 'Cerrar' : '+ Nuevo'}
              </button>
            </div>

            {!showNewBizForm ? (
              <div>
                <select
                  value={business?.id || ''}
                  onChange={(e) => handleSwitchBusiness(e.target.value)}
                  disabled={switchingBiz}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer min-h-[38px]"
                >
                  {businesses.length > 0 ? (
                    businesses.map((b) => (
                      <option key={b.id} value={b.id} className="bg-[#0A101F] text-white">
                        {b.name}
                      </option>
                    ))
                  ) : (
                    <option value={business?.id || 'default_business'} className="bg-[#0A101F] text-white">
                      {business?.name || 'Cargando negocio...'}
                    </option>
                  )}
                </select>
                <div className="text-[10px] font-mono text-[var(--accent-primary)] capitalize mt-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                    Rubro: {business?.category || 'general'}
                  </span>
                  {business?.bcv_rate && (
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      BCV: Bs.{business.bcv_rate}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateBusiness} className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="Nombre de sucursal..."
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)] min-h-[36px]"
                  required
                />
                <div className="flex items-center gap-1.5">
                  <select
                    value={newBizCategory}
                    onChange={(e) => setNewBizCategory(e.target.value as BusinessCategory)}
                    className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-[10px] font-mono text-[var(--text-primary)] focus:outline-none min-h-[36px]"
                  >
                    <option value="tienda">Tienda</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="taller">Taller</option>
                    <option value="clinica">Clinica</option>
                    <option value="servicios">Servicios</option>
                  </select>
                  <button
                    type="submit"
                    disabled={switchingBiz}
                    className="ui-btn-primary px-3 py-1.5 text-[10px] min-h-[36px]"
                  >
                    Crear
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer min-h-[42px] ${
                activeTab === 'dashboard'
                  ? 'bg-[var(--accent-primary)]/15 border border-[var(--border-highlight)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Resumen Operativo</span>
              </div>
              <span className="text-[9px] font-mono opacity-70">01</span>
            </button>

            <button
              onClick={() => handleTabChange('config')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer min-h-[42px] ${
                activeTab === 'config'
                  ? 'bg-[var(--accent-primary)]/15 border border-[var(--border-highlight)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-[var(--accent-secondary)]" />
                <span>Entrenador Asistente</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary)]">
                IA
              </span>
            </button>

            <button
              onClick={() => handleTabChange('simulator')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer min-h-[42px] ${
                activeTab === 'simulator'
                  ? 'bg-[var(--accent-primary)] text-[#050811] font-bold shadow-md shadow-[var(--accent-primary)]/20'
                  : 'text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4" />
                <span>Simulador + Inspector</span>
              </div>
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider">
                LIVE
              </span>
            </button>

            <button
              onClick={() => handleTabChange('crm')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer min-h-[42px] ${
                activeTab === 'crm'
                  ? 'bg-[var(--accent-primary)]/15 border border-[var(--border-highlight)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>CRM & Transacciones</span>
              </div>
              {(hotLeadsCount > 0 || pendingTxCount > 0) && (
                <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  {hotLeadsCount + pendingTxCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('inbox')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer min-h-[42px] ${
                activeTab === 'inbox'
                  ? 'bg-[var(--accent-primary)]/15 border border-[var(--border-highlight)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4 text-[var(--accent-secondary)]" />
                <span>Bandeja & Copiloto</span>
              </div>
              {conversations.filter((c) => c.bot_paused).length > 0 && (
                <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  PAUSA
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('integrations')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer min-h-[42px] ${
                activeTab === 'integrations'
                  ? 'bg-[var(--accent-primary)]/15 border border-[var(--border-highlight)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Link2 className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Integraciones & QR</span>
              </div>
            </button>
          </nav>

          {/* Support & Telemetry Footer */}
          <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-2">
            <a
              href="https://wa.me/584164883199"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all text-[11px] min-h-[40px]"
            >
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                <div className="text-left font-mono">
                  <p className="font-semibold text-xs">Soporte Tecnico</p>
                  <p className="text-[9px] text-[var(--text-muted)]">+58 416 488 3199</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
            </a>

            <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span>
                  {integrations?.storage.mode === 'firestore'
                    ? 'Cloud Firestore'
                    : 'Local JSON DB'}
                </span>
              </div>
              <button
                onClick={fetchAllData}
                disabled={refreshing}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-1 rounded hover:bg-white/5 transition-colors"
                title="Refrescar datos"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          {/* PWA Direct Installation Banner */}
          <InstallAppBanner />

          {/* Superior Telemetry & Live Skin Header Bar */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="ui-badge-led">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
                <span>CLUSTER 24/7 ONLINE</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                <span>//</span>
                <span>SINGLE-PASS GEMINI 2.5 FLASH</span>
                <span>//</span>
                <span className="text-[var(--accent-primary)] font-bold">SHIELD 100%</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <SkinSelector />
              <button
                onClick={() => {
                  clearAdminKey();
                  setIsAuthenticated(false);
                }}
                className="ui-btn-secondary min-h-[38px] flex items-center gap-1.5 text-rose-400 hover:text-rose-300 hover:border-rose-500/40"
                title="Cerrar Sesion de Administrador"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] font-bold">Bloquear</span>
              </button>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <DashboardView
              business={business}
              integrations={integrations}
              leads={leads}
              transactions={transactions}
              onNavigate={(tab) => setActiveTab(tab as any)}
              onRefreshAll={fetchAllData}
            />
          )}
          {activeTab === 'config' && (
            <ConfigView business={business} onRefreshBusiness={fetchAllData} />
          )}
          {activeTab === 'simulator' && (
            <SimulatorView business={business} onRefreshAll={fetchAllData} />
          )}
          {activeTab === 'crm' && (
            <CrmTransactionsView
              leads={leads}
              transactions={transactions}
              onRefreshAll={fetchAllData}
            />
          )}
          {activeTab === 'inbox' && (
            <HandoverInboxView conversations={conversations} onRefreshAll={fetchAllData} />
          )}
          {activeTab === 'integrations' && (
            <IntegrationsView business={business} integrations={integrations} onRefresh={fetchAllData} />
          )}
        </main>
      </div>
    </>
  );
}

export default App;
