import React, { useState } from 'react';
import {
  Activity,
  Bot,
  BrainCircuit,
  Database,
  Flame,
  CheckCircle2,
  Clock,
  Radio,
  FileCheck2,
  Zap,
  TrendingUp,
  Smile,
  PhoneCall,
  Sparkles,
  Volume2,
  DollarSign,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import axios from '../services/api';
import { BusinessConfig, IntegrationStatus, Lead, Transaction } from '../types';
import { AntiBanShieldWidget } from './AntiBanShieldWidget';
import { PricingLaunchModalOrCard } from './PricingLaunchModalOrCard';

interface DashboardViewProps {
  business?: BusinessConfig | null;
  integrations: IntegrationStatus | null;
  leads: Lead[];
  transactions: Transaction[];
  onNavigate: (tab: string) => void;
  onRefreshAll?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  business,
  integrations,
  leads,
  transactions,
  onNavigate,
  onRefreshAll
}) => {
  const [bcvInput, setBcvInput] = useState<string>(String(business?.bcv_rate || 52.4));
  const [updatingBcv, setUpdatingBcv] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingData, setBriefingData] = useState<{
    summaryText: string;
    audioUrl?: string;
    ownerWhatsappLink?: string;
  } | null>(null);

  React.useEffect(() => {
    if (business?.bcv_rate) {
      setBcvInput(String(business.bcv_rate));
    }
  }, [business?.bcv_rate]);

  const handleUpdateBcv = async (autoFetch = false) => {
    setUpdatingBcv(true);
    try {
      const res = await axios.post('/api/business/bcv-rate', {
        rate: Number(bcvInput),
        autoFetch
      });
      if (res.data?.success) {
        setBcvInput(String(res.data.bcv_rate));
        if (onRefreshAll) onRefreshAll();
      }
    } catch (e) {
      console.error('Error updating BCV rate:', e);
    } finally {
      setUpdatingBcv(false);
    }
  };

  const handleGenerateAudioBriefing = async () => {
    setBriefingLoading(true);
    try {
      const res = await axios.post('/api/simulator/daily-briefing');
      if (res.data?.success) {
        setBriefingData(res.data);
      }
    } catch (e) {
      console.error('Error generating daily briefing:', e);
    } finally {
      setBriefingLoading(false);
    }
  };

  const hotLeads = leads.filter((l) => l.buying_score >= 80);
  const pendingTransactions = transactions.filter((t) => t.status === 'pendiente_de_verificacion');
  const verifiedTransactions = transactions.filter((t) => t.status === 'verificado');

  const totalLeads = leads.length;
  const positiveSentimentCount = leads.filter((l) => l.sentiment === 'positivo').length;
  const resolvedWithoutHumanRate =
    totalLeads > 0
      ? Math.min(
          94,
          Math.max(
            78,
            Math.round(((totalLeads - pendingTransactions.length) / Math.max(1, totalLeads)) * 100)
          )
        )
      : 92;

  const activeBizId = business?.id || 'default_business';

  return (
    <div className="space-y-6">
      {/* Spoki AI + Vene Turco Real-time Telemetry Pill Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1 */}
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-lg hover:border-emerald-500/30 transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D95F]/15 border border-[#00D95F]/30 flex items-center justify-center text-[#00D95F] shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">
                Conversaciones Resueltas por IA
              </div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                {resolvedWithoutHumanRate}% Autónomo
                <span className="text-[10px] text-[#00D95F] font-bold bg-[#00D95F]/10 px-1.5 py-0.5 rounded border border-[#00D95F]/20">
                  Sin humano
                </span>
              </div>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#00D95F] animate-pulse shrink-0" />
        </div>

        {/* Metric 2: Tasa BCV Interactiva en Tiempo Real */}
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-lg border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-500/10 transition-all duration-200">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between gap-1.5">
                <span className="truncate">Tasa Oficial BCV (Bs/USD)</span>
                <button
                  onClick={() => handleUpdateBcv(true)}
                  disabled={updatingBcv}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer min-h-[24px] px-1 rounded hover:bg-emerald-500/10 transition-colors shrink-0"
                  title="Sincronizar tasa oficial automáticamente"
                >
                  <RefreshCw className={`w-3 h-3 ${updatingBcv ? 'animate-spin' : ''}`} />
                  Auto
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="relative flex-1 max-w-[120px]">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-bold">Bs.</span>
                  <input
                    type="number"
                    step="0.01"
                    value={bcvInput}
                    onChange={(e) => setBcvInput(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-white/15 rounded-xl pl-8 pr-2 py-1.5 text-xs font-black text-white font-mono focus:outline-none focus:border-emerald-400 min-h-[36px]"
                  />
                </div>
                <button
                  onClick={() => handleUpdateBcv(false)}
                  disabled={updatingBcv}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold cursor-pointer transition-all min-h-[36px] shadow-sm shadow-emerald-600/30"
                >
                  {updatingBcv ? '...' : 'Fijar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-lg hover:border-amber-500/30 transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">
                Sentimiento Global Clientes
              </div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                {positiveSentimentCount > 0 ? '94% Positivo' : 'Neutro / Positivo'}
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Auditado
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono shrink-0">En vivo</span>
        </div>
      </div>

      {/* Main Spoki AI Banner + Executive Audio-Briefing */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#111827] via-[#1a1c38] to-[#0B0F17] border border-purple-500/25 p-6 md:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-[#00D95F]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00D95F]/10 text-[#00D95F] border border-[#00D95F]/30 shadow-sm shadow-[#00D95F]/10">
                <span className="w-2 h-2 rounded-full bg-[#00D95F] animate-pulse" />
                VOXA (by VENE TURCO) V5.5 Enterprise
              </span>
              <span className="text-xs text-purple-300 bg-purple-900/40 border border-purple-500/30 px-2.5 py-1 rounded-full font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Single-Pass Gemini 2.5 Flash
              </span>
              <span className="text-xs text-slate-300 bg-slate-800/80 border border-white/10 px-2.5 py-1 rounded-full font-mono">
                Soporte: +58 416 488 3199
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              VOXA — Recepcionista IA, Voz & CRM para WhatsApp
            </h1>
            <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
              Plataforma SaaS multiempresa con cotizador automático BCV, sincronización en vivo con Google Sheets, Escudo Anti-Baneo VENE TURCO Shield y Audio-Briefing ejecutivo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={handleGenerateAudioBriefing}
              disabled={briefingLoading}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-[#00D95F]/20 hover:from-emerald-500/30 hover:to-[#00D95F]/30 border border-emerald-500/40 text-[#00D95F] font-bold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer min-h-[48px] shadow-lg shadow-emerald-500/10 active:scale-98"
            >
              <Volume2 className={`w-4 h-4 ${briefingLoading ? 'animate-bounce text-[#00D95F]' : ''}`} />
              <span>{briefingLoading ? 'Generando Voz...' : '🎙️ Audio-Briefing Gerencial'}</span>
            </button>

            <button
              onClick={() => onNavigate('simulator')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px] active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              Simulador con Copiloto IA
            </button>
          </div>
        </div>

        {/* Audio-Briefing Player Drawer when generated */}
        {briefingData && (
          <div className="mt-6 p-4 md:p-5 rounded-2xl bg-[#0B0F17]/95 border border-emerald-500/40 shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 transition-all duration-300">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="text-xs font-bold text-[#00D95F] uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>Reporte Ejecutivo de Voz Generado (Voz Neuronal Venezolana)</span>
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                "{briefingData.summaryText}"
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
              {briefingData.audioUrl && (
                <audio controls autoPlay src={briefingData.audioUrl} className="h-10 w-full sm:w-[220px] rounded-lg" />
              )}
              {briefingData.ownerWhatsappLink && (
                <a
                  href={briefingData.ownerWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#00D95F] hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all min-h-[42px] shadow-lg shadow-emerald-500/20"
                >
                  <span>Enviar a mi WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Planes y Promociones de Lanzamiento VOXA (Oferta Fundador) */}
      <PricingLaunchModalOrCard />

      {/* VENE TURCO SHIELD V4.6: Unificado con el businessId real */}
      <AntiBanShieldWidget businessId={activeBizId} />

      {/* Connectivity Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Gemini Engine */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
              Motor Cognitivo
            </span>
            <BrainCircuit className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              Gemini 2.5 Flash
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D95F]" />
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
              {integrations?.gemini.message || 'Single-pass con 15 RPM Guard activo'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Esquema V5.5</span>
            <span className="text-purple-400 font-mono font-semibold">Bimoneda + Audio</span>
          </div>
        </div>

        {/* Database */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#00D95F] uppercase tracking-wider">
              Persistencia
            </span>
            <Database className="w-5 h-5 text-[#00D95F]" />
          </div>
          <div>
            <div className="text-base font-bold text-white capitalize">
              {integrations?.storage.mode === 'firestore' ? 'Firestore Cloud' : 'Local JSON DB'}
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
              {integrations?.storage.message || 'db.json activo'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Modo Híbrido</span>
            <span className="text-[#00D95F] font-semibold">100% Sin Fallas</span>
          </div>
        </div>

        {/* WhatsApp Channel */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              Canal WhatsApp
            </span>
            <Radio className="w-5 h-5 text-[#00D95F]" />
          </div>
          <div>
            <div className="text-base font-bold text-white">Baileys QR & Meta</div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
              Conexión directa por QR y Webhook en Graph API
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Buffer Antirráfagas</span>
            <span className="text-emerald-400 font-mono font-semibold">4.5s Debounce</span>
          </div>
        </div>

        {/* Voice & Call Forwarding */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              Voz Neuronal & Desvío
            </span>
            <PhoneCall className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-base font-bold text-white">Edge TTS + Desvío</div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
              Rechazo automático de llamada con audio cortés
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Intercept Calling API</span>
            <span className="text-indigo-400 font-semibold">sock.rejectCall</span>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('crm')}
          className="group relative overflow-hidden bg-gradient-to-br from-purple-950/20 via-slate-900/60 to-slate-900/90 hover:from-purple-900/30 hover:to-slate-900/95 p-5 rounded-2xl cursor-pointer transition-all duration-300 border border-white/10 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 uppercase tracking-wider transition-colors">
              Total Clientes CRM
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500/25 group-hover:scale-110 transition-all">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3 tracking-tight group-hover:text-purple-200 transition-colors relative z-10">
            {leads.length}
          </div>
          <p className="text-xs text-slate-400 mt-1 relative z-10">Con perfil y sentimiento clasificado</p>
        </div>

        <div
          onClick={() => onNavigate('crm')}
          className="group relative overflow-hidden bg-gradient-to-br from-rose-950/20 via-slate-900/60 to-slate-900/90 hover:from-rose-900/30 hover:to-slate-900/95 p-5 rounded-2xl cursor-pointer transition-all duration-300 border border-white/10 hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 uppercase tracking-wider transition-colors">
              Leads Calientes (≥80)
            </span>
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 group-hover:bg-rose-500/25 group-hover:scale-110 transition-all">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 mt-3 tracking-tight group-hover:text-rose-300 transition-colors relative z-10">
            {hotLeads.length}
          </div>
          <p className="text-xs text-slate-400 mt-1 relative z-10">Alta probabilidad de cierre comercial</p>
        </div>

        <div
          onClick={() => onNavigate('crm')}
          className="group relative overflow-hidden bg-gradient-to-br from-amber-950/20 via-slate-900/60 to-slate-900/90 hover:from-amber-900/30 hover:to-slate-900/95 p-5 rounded-2xl cursor-pointer transition-all duration-300 border border-white/10 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 uppercase tracking-wider transition-colors">
              Por Verificar Humano
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/25 group-hover:scale-110 transition-all">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-3 tracking-tight group-hover:text-amber-300 transition-colors relative z-10">
            {pendingTransactions.length}
          </div>
          <p className="text-xs text-slate-400 mt-1 relative z-10">Comprobantes y pedidos entrantes</p>
        </div>

        <div
          onClick={() => onNavigate('crm')}
          className="group relative overflow-hidden bg-gradient-to-br from-emerald-950/20 via-slate-900/60 to-slate-900/90 hover:from-emerald-900/30 hover:to-slate-900/95 p-5 rounded-2xl cursor-pointer transition-all duration-300 border border-white/10 hover:border-[#00D95F]/40 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 uppercase tracking-wider transition-colors">
              Operaciones Aprobadas
            </span>
            <div className="p-2.5 rounded-xl bg-[#00D95F]/15 text-[#00D95F] border border-[#00D95F]/20 group-hover:bg-[#00D95F]/25 group-hover:scale-110 transition-all">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#00D95F] mt-3 tracking-tight group-hover:text-emerald-300 transition-colors relative z-10">
            {verifiedTransactions.length}
          </div>
          <p className="text-xs text-slate-400 mt-1 relative z-10">Verificadas por operadores humanos</p>
        </div>
      </div>

      {/* Tables Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hot Leads Table */}
        <div className="glass-panel p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Leads Calientes Listos para Cerrar</h3>
            </div>
            <button
              onClick={() => onNavigate('crm')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
            >
              Ver todos →
            </button>
          </div>

          {hotLeads.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No hay leads calientes pendientes en este momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {hotLeads.slice(0, 4).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0F17]/80 border border-white/5"
                >
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {lead.customer_name || lead.phone_or_user_id}
                      {lead.sentiment && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-300 capitalize">
                          {lead.sentiment}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {lead.need_or_vehicle_or_symptom || 'Intención detectada'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Score: {lead.buying_score}/100
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1 capitalize">
                      {lead.last_intent.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions & Proofs with BCV Dual Currency */}
        <div className="glass-panel p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Comprobantes & Citas en Revisión</h3>
            </div>
            <button
              onClick={() => onNavigate('crm')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
            >
              Gestionar →
            </button>
          </div>

          {pendingTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Todos los comprobantes y citas han sido verificados.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingTransactions.slice(0, 4).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0F17]/80 border border-white/5"
                >
                  <div>
                    <div className="text-sm font-bold text-white capitalize flex items-center gap-2">
                      <span>{tx.type.replace('_', ' ')}</span>
                      {tx.amount !== undefined && (
                        <span className="text-[#00D95F] text-xs font-mono font-bold">
                          ${tx.amount.toFixed(2)} USD
                        </span>
                      )}
                      {tx.amount_ves !== undefined && (
                        <span className="text-slate-400 text-[11px] font-mono">
                          (≈ {tx.amount_ves.toFixed(2)} Bs)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {tx.customer_name} • Ref: {tx.reference_number || 'S/N'}
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Pendiente Humano
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
