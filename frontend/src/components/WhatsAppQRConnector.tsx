import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCw, PowerOff, CheckCircle2, ShieldCheck, Smartphone, AlertCircle, Terminal, Cpu } from 'lucide-react';
import axios from '../services/api';

interface WhatsAppQRConnectorProps {
  businessId?: string;
  onStatusChange?: (status: string) => void;
  compact?: boolean;
}

export const WhatsAppQRConnector: React.FC<WhatsAppQRConnectorProps> = ({
  businessId = 'default_business',
  onStatusChange,
  compact = false
}) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'open' | 'qrcode'>('disconnected');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`/api/baileys/${businessId}/status`);
      if (res.data.success) {
        setStatus(res.data.status);
        setQrDataUrl(res.data.qrDataUrl);
        setConnectedPhone(res.data.connectedPhone);
        if (onStatusChange) onStatusChange(res.data.status);
      }
    } catch (err) {
      console.error('Error fetching Baileys status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [businessId]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/api/baileys/${businessId}/connect`);
      if (res.data.success) {
        setStatus(res.data.status);
        setQrDataUrl(res.data.qrDataUrl);
      }
    } catch (err) {
      console.error('Error connecting Baileys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/api/baileys/${businessId}/disconnect`);
      if (res.data.success) {
        setStatus('disconnected');
        setQrDataUrl(null);
        setConnectedPhone(null);
      }
    } catch (err) {
      console.error('Error disconnecting Baileys:', err);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="ui-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/15 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)]">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)] tracking-wide">
                WHATSAPP SOCKET // BAILEYS HUD
              </span>
              {status === 'open' ? (
                <span className="ui-badge-led text-[var(--accent-primary)] border-[var(--accent-primary)]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                  ONLINE: {connectedPhone || 'ACTIVO'}
                </span>
              ) : status === 'qrcode' ? (
                <span className="ui-badge-led text-amber-400 border-amber-500/30">
                  ESCANEAR QR
                </span>
              ) : (
                <span className="ui-badge-led text-[var(--text-muted)] border-white/10">
                  DESCONECTADO
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
              BUFFER: 4.5s DEBOUNCE | MODE: STEALTH ANTI-BAN
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'open' ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="ui-btn-secondary text-rose-400 hover:text-rose-300 hover:border-rose-500/30 font-mono text-xs"
            >
              <PowerOff className="w-3.5 h-3.5 mr-1" />
              Desconectar
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="ui-btn-primary font-mono text-xs font-bold"
            >
              <QrCode className="w-3.5 h-3.5 mr-1.5" />
              {loading ? 'Generando QR...' : 'Vincular WhatsApp QR'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ui-card p-6 relative overflow-hidden">
      {/* Tactical Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[var(--border-subtle)] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/15 border border-[var(--border-highlight)] flex items-center justify-center text-[var(--accent-primary)]">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)]">
              // TELEMETRY HARDWARE MODULE
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
              Conector Directo WhatsApp (Baileys QR)
              <span className="ui-badge-led text-[9px]">
                BUFFER: 4.5s | MODE: STEALTH
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              Vincula cualquier linea de WhatsApp escaneando el codigo sin Meta Business App Review.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'open' ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="ui-btn-secondary text-rose-400 hover:text-rose-300 font-mono text-xs"
            >
              <PowerOff className="w-3.5 h-3.5 mr-1" />
              Desconectar Socket
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="ui-btn-primary font-mono text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Generando sesion...' : 'Iniciar / Generar QR'}
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: QR Display Window */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl min-h-[300px]">
          {status === 'open' ? (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 flex items-center justify-center mx-auto shadow-lg shadow-[var(--accent-primary)]/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] font-mono">
                LINEA WHATSAPP VINCULADA
              </div>
              <div className="text-xs font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-lg border border-[var(--border-subtle)] tabular-nums">
                {connectedPhone || 'Socket Establecido'}
              </div>
              <p className="text-[11px] font-mono text-[var(--text-muted)] max-w-xs">
                El agente IA multimodal esta escuchando y respondiendo mensajes en tiempo real.
              </p>
            </div>
          ) : qrDataUrl ? (
            <div className="text-center space-y-3">
              <div className="p-3 bg-white rounded-xl shadow-2xl inline-block border-2 border-[var(--accent-primary)]">
                <img
                  src={qrDataUrl}
                  alt="WhatsApp QR Code"
                  className="w-56 h-56 object-contain rounded-lg"
                />
              </div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)] flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[var(--accent-primary)]" />
                Abre WhatsApp &gt; Dispositivos vinculados &gt; Escanear
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2 text-[var(--text-muted)]">
              <QrCode className="w-12 h-12 text-[var(--text-muted)] opacity-50 mx-auto" />
              <div className="text-xs font-mono font-bold text-[var(--text-muted)]">SOCKET INACTIVO</div>
              <p className="text-[11px] font-mono max-w-xs">
                Presiona "Iniciar / Generar QR" para desplegar la clave de emparejamiento.
              </p>
            </div>
          )}
        </div>

        {/* Right: Technical Features & Instructions */}
        <div className="md:col-span-7 space-y-3 font-mono">
          <div className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">
                // BUFFER ANTIRRAFAGAS 4.5s
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                Agrupa multiples notas de voz y mensajes de texto continuos en un solo turno, garantizando una sola llamada multimodal a Gemini 2.5 Flash.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--accent-secondary)]/15 text-[var(--accent-secondary)] shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">
                // PRESENCIA DE ESCRITURA REAL
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                Emite estados de socket <code className="text-[var(--accent-primary)]">composing</code> y <code className="text-[var(--accent-secondary)]">recording</code> con jitter organico antes del despacho.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">
                // INTERCEPTOR DE LLAMADAS VOIP
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                Rechaza llamadas entrantes con <code className="text-cyan-400">sock.rejectCall</code> y envia nota de voz cortés de líneas ocupadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
