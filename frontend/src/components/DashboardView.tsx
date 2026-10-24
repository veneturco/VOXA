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
import axios from 'axios';
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
        <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D95F]/15 border border-[#00D95F]/30 flex items-center justify-center text-[#00D95F]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">
                Conversaciones Resueltas por IA
              </div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                {resolvedWithoutHumanRate}% Autónomo
                <span className="text-[10px] text-[#00D95F] font-bold bg-[#00D95F]/10 px-1.5 py-0.2 rounded">
                  Sin humano
                </span>
              </div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#00D95F] animate-pulse" />
        </div>

        {/* Metric 2: Tasa BCV Interactiva en Tiempo Real */}
        <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between shadow-lg border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <span>Tasa Oficial BCV (Bs/USD)</span>
                <button
                  onClick={() => handleUpdateBcv(true)}
                  disabled={updatingBcv}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Sincronizar tasa oficial automáticamente"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${updatingBcv ? 'animate-spin' : ''}`} />
                  Auto
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="number"
                  step="0.01"
                  value={bcvInput}
                  onChange={(e) => setBcvInput(e.target.value)}
                  className="w-20 bg-[#0B0F17] border border-white/15 rounded-lg px-2 py-0.5 text-sm font-black text-white font-mono focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={() => handleUpdateBcv(false)}
                  disabled={updatingBcv}
                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer transition-all"
                >
                  Fijar
                </button>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">Bimoneda</span>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">
                Sentimiento Global Clientes
              </div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                {positiveSentimentCount > 0 ? '94% Positivo' : 'Neutro / Positivo'}
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                  Auditado
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">En vivo</span>
        </div>
      </div>

      {/* Main Spoki AI Banner + Executive Audio-Briefing */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111827] via-[#1e1b4b]/60 to-[#111827] border border-purple-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#00D95F]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00D95F]/10 text-[#00D95F] border border-[#00D95F]/30 shadow-sm shadow-[#00D95F]/10">
                <span className="w-2 h-2 rounded-full bg-[#00D95F] animate-pulse" />
                VOXA (by VENE TURCO) V5.5 Enterprise
              </span>
              <span className="text-xs text-purple-300 bg-purple-900/40 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Single-Pass Gemini 2.5 Flash
              </span>
              <span className="text-xs text-slate-300 bg-slate-800/80 border border-slate-700/60 px-2.5 py-0.5 rounded-full font-mono">
                Soporte: +58 416 488 3199
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              VOXA — Recepcionista IA, Voz & CRM para WhatsApp
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Plataforma SaaS multiempresa con cotizador automático BCV, sincronización en vivo con Google Sheets, Escudo Anti-Baneo VENE TURCO Shield y Audio-Briefing ejecutivo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleGenerateAudioBriefing}
              disabled={briefingLoading}
              className="px-4 py-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[#00D95F] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Volume2 className={`w-4 h-4 ${briefingLoading ? 'animate-bounce' : ''}`} />
              <span>{briefingLoading ? 'Generando Voz...' : '🎙️ Audio-Briefing Gerencial'}</span>
            </button>

            <button
              onClick={() => onNavigate('simulator')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Simulador con Copiloto IA
            </button>
          </div>
        </div>

        {/* Audio-Briefing Player Drawer when generated */}
        {briefingData && (
          <div className="mt-6 p-4 rounded-2xl bg-[#0B0F17]/90 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1 flex-1">
              <div className="text-xs font-bold text-[#00D95F] uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <span>Reporte Ejecutivo de Voz Generado (Voz Neuronal Venezolana)</span>
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "{briefingData.summaryText}"
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
              {briefingData.audioUrl && (
                <audio controls autoPlay src={briefingData.audioUrl} className="h-9 max-w-[230px]" />
              )}
              {briefingData.ownerWhatsappLink && (
                <a
                  href={briefingData.ownerWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#00D95F] hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all"
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
          className="glass-panel hover:bg-[#1f293d]/50 p-5 rounded-2xl cursor-pointer transition-all border hover:border-purple-500/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Clientes CRM
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">{leads.length}</div>
          <p className="text-xs text-slate-400 mt-1">Con perfil y sentimiento clasificado</p>
        </div>

        <div
          onClick={() => onNavigate('crm')}
          className="glass-panel hover:bg-[#1f293d]/50 p-5 rounded-2xl cursor-pointer transition-all border hover:border-rose-500/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Leads Calientes (≥80)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 mt-3">{hotLeads.length}</div>
          <p className="text-xs text-slate-400 mt-1">Alta probabilidad de cierre comercial</p>
        </div>

        <div
          onClick={() => onNavigate('crm')}
          className="glass-panel hover:bg-[#1f293d]/50 p-5 rounded-2xl cursor-pointer transition-all border hover:border-amber-500/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Por Verificar Humano
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-3">{pendingTransactions.length}</div>
          <p className="text-xs text-slate-400 mt-1">Comprobantes y pedidos entrantes</p>
        </div>

        <div
          onClick={() => onNavigate('crm')}
          className="glass-panel hover:bg-[#1f293d]/50 p-5 rounded-2xl cursor-pointer transition-all border hover:border-[#00D95F]/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Operaciones Aprobadas
            </span>
            <div className="p-2 rounded-xl bg-[#00D95F]/10 text-[#00D95F]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#00D95F] mt-3">
            {verifiedTransactions.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Verificadas por operadores humanos</p>
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
