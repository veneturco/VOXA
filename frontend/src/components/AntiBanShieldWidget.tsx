import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Flame,
  AlertTriangle,
  RotateCcw,
  Clock,
  Sparkles,
  PhoneCall,
  Fingerprint
} from 'lucide-react';
import axios from '../services/api';
import { NumberMaturity, ShieldTelemetry } from '../types';

interface AntiBanShieldWidgetProps {
  businessId?: string;
  compact?: boolean;
}

export function AntiBanShieldWidget({ businessId = 'vene_turco_default', compact = false }: AntiBanShieldWidgetProps) {
  const [telemetry, setTelemetry] = useState<ShieldTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/shield/${businessId}/telemetry`);
      if (res.data?.success) {
        setTelemetry(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching shield telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, [businessId]);

  const handleMaturityChange = async (maturity: NumberMaturity) => {
    try {
      setActionLoading(true);
      const res = await axios.post(`/api/shield/${businessId}/settings`, { numberMaturity: maturity });
      if (res.data?.success) {
        setTelemetry(res.data.data);
      }
    } catch (err) {
      console.error('Error changing maturity:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateBurst = async () => {
    try {
      setActionLoading(true);
      const res = await axios.post(`/api/shield/${businessId}/settings`, { simulateBurst: 5 });
      if (res.data?.success) {
        setTelemetry(res.data.data);
      }
    } catch (err) {
      console.error('Error simulating burst:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetKillSwitch = async () => {
    try {
      setActionLoading(true);
      const res = await axios.post(`/api/shield/${businessId}/settings`, { resetKillSwitch: true });
      if (res.data?.success) {
        setTelemetry(res.data.data);
      }
    } catch (err) {
      console.error('Error resetting kill switch:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const score = telemetry?.riskScore || 0;
  const status = telemetry?.statusLevel || 'OPTIMAL';
  const isKill = telemetry?.killSwitchActive || score >= 85;

  // Semáforo dinámico
  const getScoreColor = (val: number) => {
    if (val < 40) return { text: 'text-[#00D95F]', bg: 'bg-[#00D95F]', ring: 'border-[#00D95F]/30', label: 'Óptimo' };
    if (val < 70) return { text: 'text-amber-400', bg: 'bg-amber-400', ring: 'border-amber-400/30', label: 'Enfriamiento' };
    if (val < 85) return { text: 'text-orange-500', bg: 'bg-orange-500', ring: 'border-orange-500/30', label: 'Supervivencia' };
    return { text: 'text-rose-500', bg: 'bg-rose-500', ring: 'border-rose-500/40', label: 'Kill Switch' };
  };

  const statusConfig = getScoreColor(score);
  const jitterSeconds = ((telemetry?.metrics.recommendedDelayMs || 2200) / 1000).toFixed(1);

  return (
    <div className="rounded-2xl bg-[#0F1624] border border-white/10 p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Glow ambiental */}
      <div
        className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${statusConfig.bg}`}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${
              isKill
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-500/20'
                : 'bg-emerald-500/10 text-[#00D95F] border-[#00D95F]/30 shadow-emerald-500/10'
            }`}
          >
            {isKill ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wide uppercase">VENE TURCO SHIELD</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v4.6
              </span>
            </div>
            <p className="text-xs text-slate-400">Protección predictiva anti-baneo & Camaleón humano para WhatsApp QR</p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusConfig.ring} bg-white/5 ${statusConfig.text}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusConfig.bg} animate-pulse`} />
            <span>ESTADO: {status}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Velocímetro / Barra + Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Velocímetro Térmico de Riesgo */}
        <div className="lg:col-span-5 rounded-xl bg-[#0B0F17]/80 border border-white/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-400" />
              Índice de Riesgo Predictivo
            </span>
            <span className={`text-xs font-bold ${statusConfig.text}`}>{statusConfig.label}</span>
          </div>

          {/* Gran Visualizador Numérico */}
          <div className="my-4 flex items-baseline justify-center gap-2">
            <span className={`text-5xl font-black font-mono tracking-tight ${statusConfig.text}`}>
              {score}
            </span>
            <span className="text-lg font-bold text-slate-500">/ 100</span>
          </div>

          {/* Barra de Progreso Térmica Semicircular */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10 flex">
              <div
                className={`h-full rounded-full transition-all duration-700 ${statusConfig.bg}`}
                style={{ width: `${Math.max(4, score)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>0% Óptimo</span>
              <span>40% Enfriar</span>
              <span>70% Alerta</span>
              <span>85% Kill Switch</span>
            </div>
          </div>

          {/* Kill Switch Banner si está activo */}
          {isKill && (
            <div className="mt-4 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-semibold text-[11px]">Envíos detenidos por seguridad preventiva</span>
              </div>
              <button
                onClick={handleResetKillSwitch}
                disabled={actionLoading}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
              >
                Resetear
              </button>
            </div>
          )}
        </div>

        {/* Telemetría en Vivo */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-3">
          {/* Card 1: Mensajes / Hora */}
          <div className="p-3.5 rounded-xl bg-[#0B0F17]/80 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Velocidad (Burst)</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-2">
              <div className="text-xl font-bold font-mono text-white">
                {telemetry?.metrics.sentLastHour || 0}
                <span className="text-xs font-normal text-slate-400">
                  {' '}
                  / {telemetry?.metrics.burstSafeLimitPerHour || 45} h
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {telemetry?.metrics.sentLastMinute || 0} en el último minuto (Máx: {telemetry?.metrics.burstSafeLimitPerMinute || 3})
              </div>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (((telemetry?.metrics.sentLastHour || 0) / (telemetry?.metrics.burstSafeLimitPerHour || 45)) * 100)
                  )}%`
                }}
              />
            </div>
          </div>

          {/* Card 2: Ratio Inbound / Outbound */}
          <div className="p-3.5 rounded-xl bg-[#0B0F17]/80 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Ratio Conversación</span>
              <Zap className="w-4 h-4 text-[#00D95F]" />
            </div>
            <div className="my-2">
              <div className="text-xl font-bold font-mono text-white">
                {telemetry?.metrics.inboundRatio ?? 100}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {telemetry?.metrics.inboundLastHour || 0} Inbound vs {telemetry?.metrics.outboundLastHour || 0} Outbound
              </div>
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span>Saludable (&gt; 35% cliente primero)</span>
            </div>
          </div>

          {/* Card 3: Jitter Camaleón Humano */}
          <div className="p-3.5 rounded-xl bg-[#0B0F17]/80 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Jitter Camaleón</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="my-2">
              <div className="text-xl font-bold font-mono text-purple-300">
                {jitterSeconds}s
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Presencia 'composing' adaptativa según riesgo
              </div>
            </div>
            <div className="text-[10px] text-purple-400 font-mono">
              Retardo dinámico activo
            </div>
          </div>

          {/* Card 4: Huella de Repetición Textual */}
          <div className="p-3.5 rounded-xl bg-[#0B0F17]/80 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Huella Textual</span>
              <Fingerprint className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="my-2">
              <div className="text-xl font-bold font-mono text-white">
                {telemetry?.metrics.duplicateRate ?? 0}%
                <span className="text-xs text-slate-400 font-normal"> hash rep.</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Rotación de conectores humanizados
              </div>
            </div>
            <div className="text-[10px] text-indigo-400">
              Antipatrón anti-spam OK
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Madurez del Número & Prueba de Estrés */}
      <div className="mt-5 pt-4 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Selector de Madurez */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Madurez de Línea:</span>
          <div className="inline-flex rounded-lg bg-[#0B0F17] p-1 border border-white/10 text-xs">
            <button
              onClick={() => handleMaturityChange('new_chip')}
              disabled={actionLoading}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                telemetry?.metrics.numberMaturity === 'new_chip'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Chip Nuevo (&lt; 7 días)
            </button>
            <button
              onClick={() => handleMaturityChange('medium')}
              disabled={actionLoading}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                telemetry?.metrics.numberMaturity === 'medium'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Línea Media (1-6 meses)
            </button>
            <button
              onClick={() => handleMaturityChange('veteran')}
              disabled={actionLoading}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                telemetry?.metrics.numberMaturity === 'veteran'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Veterano (+6 meses)
            </button>
          </div>
        </div>

        {/* Botón Demostración Ráfaga de Tráfico */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateBurst}
            disabled={actionLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition-all shadow-lg shadow-orange-600/20 cursor-pointer"
            title="Simula 5 mensajes consecutivos para demostrar cómo sube la aguja y protege la línea"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Simular Ráfaga de Tráfico</span>
          </button>

          {isKill && (
            <button
              onClick={handleResetKillSwitch}
              disabled={actionLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Registro de Auditoría en Tiempo Real */}
      {telemetry?.logs && telemetry.logs.length > 0 && !compact && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Eventos Recientes de Seguridad
          </span>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1 font-mono text-[11px]">
            {telemetry.logs.slice(0, 3).map((log, i) => (
              <div key={i} className="flex items-center justify-between text-slate-400 bg-white/5 px-2 py-1 rounded">
                <span className="truncate pr-2">{log.message}</span>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AntiBanShieldWidget;
