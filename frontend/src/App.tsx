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
  X
} from 'lucide-react';
import axios from 'axios';
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
        axios.get('/api/business').catch(() => ({ data: { data: null } })),
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
    const interval = setInterval(fetchAllData, 12000); // 12s polling for real-time CRM updates
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

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation - Obsidian & VENE TURCO Cedar styling */}
      <aside className="w-full md:w-64 bg-[#0F172A]/90 backdrop-blur-md border-r border-white/10 flex flex-col shrink-0 shadow-2xl">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Monograma VENE TURCO con Pino Cedro Libanés */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#0a4820] border border-[#00D95F]/30 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20 relative group">
              <span className="font-serif text-sm font-bold tracking-tighter">VT</span>
              <span className="absolute -top-1 -right-1 text-[11px]" title="Pino Cedro Libanés">🌲</span>
            </div>
            <div>
              <div className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                VOXA<span className="text-[#00D95F]">.AI</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                  v5.5
                </span>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                <span>by VENE TURCO</span>
                <span className="text-slate-600">•</span>
                <span className="text-purple-400">Enterprise</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Tenant Active Business Switcher Pill */}
        <div className="px-4 py-3 border-b border-white/5 bg-[#0B0F17]/60 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-purple-400" />
              Negocio Activo
            </span>
            <button
              onClick={() => setShowNewBizForm(!showNewBizForm)}
              className="text-[10px] text-[#00D95F] hover:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
              title="Crear nuevo negocio en el workspace"
            >
              {showNewBizForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {showNewBizForm ? 'Cerrar' : 'Nuevo'}
            </button>
          </div>

          {!showNewBizForm ? (
            <div>
              <select
                value={business?.id || ''}
                onChange={(e) => handleSwitchBusiness(e.target.value)}
                disabled={switchingBiz}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {businesses.length > 0 ? (
                  businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))
                ) : (
                  <option value={business?.id || 'default_business'}>
                    {business?.name || 'Cargando negocio...'}
                  </option>
                )}
              </select>
              <div className="text-[11px] text-emerald-400 capitalize mt-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D95F] animate-pulse" />
                  Rubro: {business?.category || 'general'}
                </span>
                {business?.bcv_rate && (
                  <span className="text-[10px] font-mono text-slate-400">
                    BCV: Bs.{business.bcv_rate}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateBusiness} className="space-y-2 pt-1">
              <input
                type="text"
                placeholder="Nombre del nuevo negocio..."
                value={newBizName}
                onChange={(e) => setNewBizName(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D95F]"
                required
              />
              <div className="flex items-center gap-1.5">
                <select
                  value={newBizCategory}
                  onChange={(e) => setNewBizCategory(e.target.value as BusinessCategory)}
                  className="flex-1 bg-slate-900 border border-white/15 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none"
                >
                  <option value="tienda">Tienda / E-Commerce</option>
                  <option value="restaurante">Restaurante / Delivery</option>
                  <option value="taller">Taller Mecánico</option>
                  <option value="clinica">Clínica / Salud</option>
                  <option value="servicios">Servicios / Agencia</option>
                </select>
                <button
                  type="submit"
                  disabled={switchingBiz}
                  className="px-2.5 py-1.5 rounded-lg bg-[#00D95F] hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer"
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
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 border border-purple-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Resumen Operativo</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 border border-purple-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4" />
              <span>Entrenador Asistente</span>
            </div>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold">
              IA
            </span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-[#00D95F] to-[#16A34A] text-slate-950 font-bold shadow-lg shadow-emerald-500/25 border border-emerald-400/40'
                : 'text-[#00D95F] hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4" />
              <span>Simulador + Inspector</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
              activeTab === 'simulator' ? 'bg-slate-950/30 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              Clave
            </span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'crm'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 border border-purple-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>CRM & Transacciones</span>
            </div>
            {(hotLeadsCount > 0 || pendingTxCount > 0) && (
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">
                {hotLeadsCount + pendingTxCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 border border-purple-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Inbox className="w-4 h-4" />
              <span>Bandeja & Copiloto</span>
            </div>
            {conversations.filter((c) => c.bot_paused).length > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                Pausa
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'integrations'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 border border-purple-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Link2 className="w-4 h-4" />
              <span>Integraciones & QR</span>
            </div>
          </button>
        </nav>

        {/* Support & Corporate Footer */}
        <div className="p-3 border-t border-white/10 bg-[#0B0F17]/80 space-y-2">
          {/* Soporte Oficial VENE TURCO */}
          <a
            href="https://wa.me/584164883199"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all text-[11px]"
          >
            <div className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-[#00D95F]" />
              <div className="text-left">
                <p className="font-semibold text-white">Soporte Técnico</p>
                <p className="text-[10px] text-slate-400 font-mono">+58 416 488 3199</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#00D95F] animate-ping" />
          </a>

          {/* Motor Status */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00D95F] animate-pulse" />
              <span>
                {integrations?.storage.mode === 'firestore'
                  ? 'Cloud Firestore'
                  : 'Local JSON DB'}
              </span>
            </div>
            <button
              onClick={fetchAllData}
              disabled={refreshing}
              className="text-slate-400 hover:text-white cursor-pointer p-1"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
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
  );
}

export default App;
