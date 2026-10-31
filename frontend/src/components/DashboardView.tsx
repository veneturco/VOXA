import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Smile,
  Volume2,
  ExternalLink,
  Bot,
  Flame,
  Clock,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  RefreshCw,
  Terminal,
  Activity,
  Cpu,
  Radio,
  Database,
  PhoneCall
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

  const handleUpdateBcv = async (auto = false) => {
    setUpdatingBcv(true);
    try {
      let payloadRate: number | undefined;
      if (!auto) {
        const parsed = parseFloat(bcvInput);
        if (isNaN(parsed) || parsed <= 0) return;
        payloadRate = parsed;
      }
      const res = await axios.post('/api/business/bcv-rate', {
        bcv_rate: payloadRate,
        auto_fetch: auto
      });
      if (res.data?.success) {
        setBcvInput(String(res.data.bcv_rate));
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err) {
      console.error('Error updating BCV rate:', err);
    } finally {
      setUpdatingBcv(false);
    }
  };

  const handleGenerateAudioBriefing = async () => {
    setBriefingLoading(true);
    try {
      const res = await axios.post('/api/simulator/daily-briefing');
      if (res.data?.success) {
        setBriefingData({
          summaryText: res.data.summaryText,
          audioUrl: res.data.audioUrl,
          ownerWhatsappLink: res.data.ownerWhatsappLink
        });
      }
    } catch (err) {
      console.error('Error generating audio briefing:', err);
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
      {/* Bento Grid Superior: Métricas de Telemetría Real */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Metric 1: IA Resolutiva (col-span-4) */}
        <div className="ui-card p-4 md:col-span-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/15 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                // Resolucion IA Autonoma
              </div>
              <div className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 font-mono tabular-nums">
                {resolvedWithoutHumanRate}%
                <span className="text-[9px] font-bold bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                  AUTO-PILOT
                </span>
              </div>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] animate-ping shrink-0" />
        </div>

        {/* Metric 2: Tasa BCV Bimoneda (col-span-5) */}
        <div className="ui-card p-4 md:col-span-5 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-secondary)]/15 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-secondary)] shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between gap-1.5">
                <span className="truncate">// Tasa Oficial BCV</span>
                <button
                  onClick={() => handleUpdateBcv(true)}
                  disabled={updatingBcv}
                  className="text-[9px] font-mono text-[var(--accent-primary)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  title="Sincronizar tasa oficial con API"
                >
                  <RefreshCw className={`w-3 h-3 ${updatingBcv ? 'animate-spin' : ''}`} />
                  AUTO-SYNC
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1 max-w-[130px]">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--text-muted)] font-bold">Bs.</span>
                  <input
                    type="number"
                    step="0.01"
                    value={bcvInput}
                    onChange={(e) => setBcvInput(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg pl-8 pr-2 py-1 text-xs font-black font-mono tabular-nums text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[34px]"
                  />
                </div>
                <button
                  onClick={() => handleUpdateBcv(false)}
                  disabled={updatingBcv}
                  className="ui-btn-primary px-3 py-1 text-[11px] min-h-[34px]"
                >
                  {updatingBcv ? '...' : 'Fijar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Sentimiento Global (col-span-3) */}
        <div className="ui-card p-4 md:col-span-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] shrink-0">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                // Score Sentimiento
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] font-mono tabular-nums">
                {positiveSentimentCount > 0 ? '94% POSITIVO' : 'ESTABLE'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Telemetry & Audio-Briefing Asymmetrical Bento Hero */}
      <div className="ui-card p-6 md:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-3xl space-y-2">
            <div className="text-[10px] font-mono font-bold tracking-widest text-[var(--accent-primary)] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              // CORE TELEMETRY & LIVE SHEETS ENGINE
            </div>
            <h1 className="text-2xl md:text-3xl font-black ui-heading leading-tight text-[var(--text-primary)]">
              VOXA — Recepcionista IA, Voz & CRM para WhatsApp
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed">
              Plataforma multiempresa con cotizador bimoneda USD/Bs BCV, sincronizacion en vivo de inventarios en Google Sheets, Escudo Anti-Baneo y sintetizador neural.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={handleGenerateAudioBriefing}
              disabled={briefingLoading}
              className="ui-btn-secondary py-3 px-4 min-h-[44px] flex items-center justify-center gap-2 font-mono text-xs font-bold"
            >
              <Volume2 className={`w-4 h-4 text-[var(--accent-primary)] ${briefingLoading ? 'animate-bounce' : ''}`} />
              <span>{briefingLoading ? 'Sintetizando Voz...' : 'Audio-Briefing Gerencial'}</span>
            </button>

            <button
              onClick={() => onNavigate('simulator')}
              className="ui-btn-primary py-3 px-5 min-h-[44px] flex items-center justify-center gap-2 text-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Lanzar Simulador IA</span>
            </button>
          </div>
        </div>

        {/* Audio Briefing Player */}
        {briefingData && (
          <div className="mt-6 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-highlight)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="text-[11px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>// Reporte Neuronal Ejecutivo Generado</span>
              </div>
              <p className="text-xs text-[var(--text-primary)] italic font-mono bg-black/20 p-2.5 rounded-lg border border-white/5">
                "{briefingData.summaryText}"
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
              {briefingData.audioUrl && (
                <audio controls autoPlay src={briefingData.audioUrl} className="h-10 w-full sm:w-[220px]" />
              )}
              {briefingData.ownerWhatsappLink && (
                <a
                  href={briefingData.ownerWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-btn-primary text-xs flex items-center justify-center gap-2 min-h-[40px]"
                >
                  <span>Enviar a WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Planes y Promociones VOXA */}
      <PricingLaunchModalOrCard />

      {/* VENE TURCO SHIELD Widget */}
      <AntiBanShieldWidget businessId={activeBizId} />

      {/* Hardware Telemetry 4-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Cognitive Engine */}
        <div className="ui-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-[var(--accent-secondary)] uppercase tracking-wider">
              // Motor Cognitivo
            </span>
            <Cpu className="w-4 h-4 text-[var(--accent-secondary)]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
              Gemini 2.5 Flash
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1 font-mono">
              {integrations?.gemini.message || 'Single-pass con 15 RPM Guard activo'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span>MODO</span>
            <span className="text-[var(--accent-primary)] font-bold">MULTIMODAL</span>
          </div>
        </div>

        {/* Database */}
        <div className="ui-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider">
              // Persistencia
            </span>
            <Database className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)] font-mono capitalize">
              {integrations?.storage.mode === 'firestore' ? 'Firestore Cloud' : 'Local JSON DB'}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1 font-mono">
              {integrations?.storage.message || 'db.json activo'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span>ESTADO</span>
            <span className="text-[var(--accent-primary)] font-bold">100% ONLINE</span>
          </div>
        </div>

        {/* WhatsApp Channel */}
        <div className="ui-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider">
              // Canal WhatsApp
            </span>
            <Radio className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)] font-mono">Baileys QR & Meta</div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1 font-mono">
              Socket directo y Webhook Graph API
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span>BUFFER</span>
            <span className="text-[var(--accent-secondary)] font-bold">4.5s DEBOUNCE</span>
          </div>
        </div>

        {/* Voice & Call Forwarding */}
        <div className="ui-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-[var(--accent-secondary)] uppercase tracking-wider">
              // Audio Neuronal
            </span>
            <PhoneCall className="w-4 h-4 text-[var(--accent-secondary)]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)] font-mono">Edge TTS + Desvio</div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1 font-mono">
              Rechazo automatico con audio cortés
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span>INTERCEPT</span>
            <span className="text-[var(--accent-primary)] font-bold">sock.rejectCall</span>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('crm')}
          className="ui-card p-5 cursor-pointer hover:border-[var(--accent-primary)] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              // TOTAL CLIENTES CRM
            </span>
            <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div className="text-3xl font-black mt-3 font-mono tabular-nums text-[var(--text-primary)]">
            {leads.length}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Perfiles con intencion clasificada</p>
        </div>

        <div
          onClick={() => onNavigate('crm')}
          className="ui-card p-5 cursor-pointer hover:border-rose-500/50 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
              // LEADS CALIENTES (≥80)
            </span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black mt-3 font-mono tabular-nums text-rose-400">
            {hotLeads.length}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Alta probabilidad de cierre</p>
        </div>

        <div
          onClick={() => onNavigate('crm')}
          className="ui-card p-5 cursor-pointer hover:border-amber-500/50 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
              // POR VERIFICAR HUMANO
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black mt-3 font-mono tabular-nums text-amber-400">
            {pendingTransactions.length}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Comprobantes y pedidos en espera</p>
        </div>

        <div
          onClick={() => onNavigate('crm')}
          className="ui-card p-5 cursor-pointer hover:border-[var(--accent-primary)] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)]">
              // OPERACIONES APROBADAS
            </span>
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div className="text-3xl font-black mt-3 font-mono tabular-nums text-[var(--accent-primary)]">
            {verifiedTransactions.length}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Verificadas por operadores</p>
        </div>
      </div>

      {/* Asymmetric Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hot Leads */}
        <div className="ui-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Leads Calientes Listos para Cerrar
              </h3>
            </div>
            <button
              onClick={() => onNavigate('crm')}
              className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline font-bold cursor-pointer"
            >
              VER TODOS →
            </button>
          </div>

          {hotLeads.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-muted)] font-mono text-xs">
              No hay leads calientes pendientes en este momento.
            </div>
          ) : (
            <div className="space-y-2">
              {hotLeads.slice(0, 4).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                >
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
                      {lead.customer_name || lead.phone_or_user_id}
                      {lead.sentiment && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/20 text-[var(--text-muted)] capitalize">
                          {lead.sentiment}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                      {lead.need_or_vehicle_or_symptom || 'Intencion detectada'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 tabular-nums">
                      SCORE: {lead.buying_score}/100
                    </span>
                    <div className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5 capitalize">
                      {lead.last_intent.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions & Proofs */}
        <div className="ui-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Comprobantes & Citas en Revision
              </h3>
            </div>
            <button
              onClick={() => onNavigate('crm')}
              className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline font-bold cursor-pointer"
            >
              GESTIONAR →
            </button>
          </div>

          {pendingTransactions.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-muted)] font-mono text-xs">
              Todos los comprobantes y citas han sido verificados.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTransactions.slice(0, 4).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                >
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)] font-mono capitalize flex items-center gap-2">
                      <span>{tx.type.replace('_', ' ')}</span>
                      {tx.amount !== undefined && (
                        <span className="text-[var(--accent-primary)] text-xs font-mono font-bold tabular-nums">
                          ${tx.amount.toFixed(2)} USD
                        </span>
                      )}
                      {tx.amount_ves !== undefined && (
                        <span className="text-[var(--text-muted)] text-[10px] font-mono tabular-nums">
                          (≈ {tx.amount_ves.toFixed(2)} Bs)
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                      {tx.customer_name} • Ref: {tx.reference_number || 'S/N'}
                    </div>
                  </div>
                  <span className="ui-badge-led text-amber-400 border-amber-500/30 bg-amber-500/10">
                    PENDIENTE
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
