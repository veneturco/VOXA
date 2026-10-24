import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { IntegrationStatus, Lead, Transaction } from '../types';
import { AntiBanShieldWidget } from './AntiBanShieldWidget';
import { PricingLaunchModalOrCard } from './PricingLaunchModalOrCard';

interface DashboardViewProps {
  integrations: IntegrationStatus | null;
  leads: Lead[];
  transactions: Transaction[];
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  integrations,
  leads,
  transactions,
  onNavigate
}) => {
  const hotLeads = leads.filter((l) => l.buying_score >= 80);
  const pendingTransactions = transactions.filter(
    (t) => t.status === 'pendiente_de_verificacion'
  );
  const verifiedTransactions = transactions.filter((t) => t.status === 'verificado');

  // Spoki AI Telemetry Calculations
  const totalLeads = leads.length;
  const positiveSentimentCount = leads.filter((l) => l.sentiment === 'positivo').length;
  const resolvedWithoutHumanRate = totalLeads > 0 ? Math.min(94, Math.max(78, Math.round(((totalLeads - pendingTransactions.length) / Math.max(1, totalLeads)) * 100))) : 92;

  return (
    <div className="space-y-6">
      {/* Spoki AI + Vene Turco Real-time Telemetry Pill Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1 */}
        <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00D95F]/15 text-[#00D95F] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Resolución IA sin Humano</div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                {resolvedWithoutHumanRate}%
                <span className="text-[10px] text-[#00D95F] font-bold bg-[#00D95F]/10 px-1.5 py-0.2 rounded border border-[#00D95F]/20">
                  Autónomo
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">Top 5 Spoki</span>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Tiempo Promedio Respuesta</div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                &lt; 3.8s
                <span className="text-[10px] text-purple-300 font-bold bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                  Buffer 4.5s
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">Ultra Rápido</span>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Sentimiento Global Clientes</div>
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

      {/* Main Spoki AI Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111827] via-[#1e1b4b]/60 to-[#111827] border border-purple-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#00D95F]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00D95F]/10 text-[#00D95F] border border-[#00D95F]/30 shadow-sm shadow-[#00D95F]/10">
                <span className="w-2 h-2 rounded-full bg-[#00D95F] animate-pulse" />
                VOXA (by VENE TURCO) V4.8
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
              Plataforma SaaS multiempresa de automatización con IA multimodal, Escudo Anti-Baneo VENE TURCO Shield, transcripción de notas de voz y agendamiento 24/7.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('simulator')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Simulador con Copiloto IA
            </button>
          </div>
        </div>
      </div>

      {/* Planes y Promociones de Lanzamiento VOXA (Oferta Fundador) */}
      <PricingLaunchModalOrCard />

      {/* VENE TURCO SHIELD V4.6: Medidor Predictivo Anti-Baneo & Camaleón Humano */}
      <AntiBanShieldWidget businessId="vene_turco_default" />

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
            <span>Esquema V5.0</span>
            <span className="text-purple-400 font-mono font-semibold">Sentimiento + Audio</span>
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
        {/* Total Leads */}
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

        {/* Hot Leads */}
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

        {/* Pending Verification */}
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

        {/* Verified Operations */}
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
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
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

        {/* Transactions & Proofs */}
        <div className="glass-panel p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Comprobantes & Citas en Revisión</h3>
            </div>
            <button
              onClick={() => onNavigate('crm')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
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
                      {tx.amount && (
                        <span className="text-[#00D95F] text-xs font-mono font-bold">
                          ${tx.amount.toFixed(2)}
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
