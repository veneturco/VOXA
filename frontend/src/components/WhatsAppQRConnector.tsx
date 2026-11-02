import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCw, PowerOff, CheckCircle2, ShieldCheck, Smartphone, AlertCircle, KeyRound, Copy, Check, Hash } from 'lucide-react';
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
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'code'>('qr');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`/api/baileys/${businessId}/status`);
      if (res.data.success) {
        setStatus(res.data.status);
        setQrDataUrl(res.data.qrDataUrl);
        setConnectedPhone(res.data.connectedPhone);
        if (res.data.pairingCode) {
          setPairingCode(res.data.pairingCode);
        }
        if (onStatusChange) onStatusChange(res.data.status);
      }
    } catch (err) {
      console.error('Error fetching Baileys status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3500);
    return () => clearInterval(interval);
  }, [businessId]);

  const handleConnect = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post(`/api/baileys/${businessId}/connect`);
      if (res.data.success) {
        setStatus(res.data.status);
        setQrDataUrl(res.data.qrDataUrl);
        if (res.data.connectedPhone) setConnectedPhone(res.data.connectedPhone);
      }
    } catch (err: any) {
      console.error('Error connecting Baileys:', err);
      setErrorMsg(err.response?.data?.error || 'Error al conectar con WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post(`/api/baileys/${businessId}/disconnect`);
      if (res.data.success) {
        setStatus('disconnected');
        setQrDataUrl(null);
        setConnectedPhone(null);
        setPairingCode(null);
      }
    } catch (err: any) {
      console.error('Error disconnecting Baileys:', err);
      setErrorMsg('Error al desconectar');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneNumberInput.replace(/\D/g, '');
    if (!clean || clean.length < 9) {
      setErrorMsg('Ingresa un número internacional válido (ej: 584121234567)');
      return;
    }
    setPairingLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post(`/api/baileys/${businessId}/pairing-code`, { phoneNumber: clean });
      if (res.data.success && res.data.pairingCode) {
        setPairingCode(res.data.pairingCode);
      } else {
        setErrorMsg(res.data.error || 'No se pudo generar el código. Intenta nuevamente.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Error al solicitar código de vinculación');
    } finally {
      setPairingLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
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
                  ESCANEAR QR / CÓDIGO
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
              {loading ? 'Generando QR...' : 'Vincular WhatsApp'}
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
              Conector Directo WhatsApp (Baileys QR & Pairing Code)
              <span className="ui-badge-led text-[9px]">
                BUFFER: 4.5s | MODE: STEALTH
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              Vincula cualquier línea de WhatsApp escaneando el código QR oficial o mediante código de 8 dígitos sin Meta Business App Review.
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
              {loading ? 'Generando sesión...' : 'Iniciar / Generar QR'}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-mono text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs para elegir modo de vinculación cuando no está conectado */}
      {status !== 'open' && (
        <div className="mt-5 flex gap-2 border-b border-[var(--border-subtle)] pb-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'qr'
                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            1. Escanear Código QR
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'code'
                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            2. Vincular con Código (Sin Cámara)
          </button>
        </div>
      )}

      {/* Main Body */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: QR / Code Display Window */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl min-h-[320px]">
          {status === 'open' ? (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 flex items-center justify-center mx-auto shadow-lg shadow-[var(--accent-primary)]/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] font-mono">
                LÍNEA WHATSAPP VINCULADA
              </div>
              <div className="text-xs font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-lg border border-[var(--border-subtle)] tabular-nums">
                +{connectedPhone || 'Socket Establecido'}
              </div>
              <p className="text-[11px] font-mono text-[var(--text-muted)] max-w-xs">
                El agente IA multimodal está escuchando y respondiendo mensajes en tiempo real.
              </p>
            </div>
          ) : activeTab === 'code' ? (
            <div className="w-full text-center space-y-3 font-mono">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center mx-auto">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[var(--text-primary)]">
                VINCULACIÓN POR CÓDIGO DE 8 DÍGITOS
              </div>

              {pairingCode ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Ingresa este código en tu WhatsApp:
                  </p>
                  <div
                    onClick={() => copyToClipboard(pairingCode)}
                    className="p-3 bg-black/60 border border-[var(--accent-primary)] rounded-xl text-lg font-mono font-black tracking-widest text-[var(--accent-primary)] cursor-pointer hover:scale-105 transition-transform flex items-center justify-center gap-2 select-all shadow-lg"
                  >
                    <span>{pairingCode}</span>
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 opacity-60" />}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    {copiedCode ? '¡Código copiado al portapapeles!' : 'Haz clic sobre el código para copiar'}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestPairingCode} className="space-y-3 text-left">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">
                      Tu número con código de país
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 584121234567"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-[var(--border-subtle)] rounded-lg text-xs font-mono text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pairingLoading || loading}
                    className="w-full ui-btn-primary py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                  >
                    <Hash className="w-3.5 h-3.5" />
                    {pairingLoading ? 'Solicitando a WhatsApp...' : 'Generar Código de 8 Dígitos'}
                  </button>
                </form>
              )}
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
                WhatsApp &gt; Dispositivos vinculados &gt; Vincular dispositivo
              </div>
            </div>
          ) : loading ? (
            <div className="text-center space-y-3 text-[var(--text-muted)]">
              <RefreshCw className="w-10 h-10 text-[var(--accent-primary)] animate-spin mx-auto" />
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">ESTABLECIENDO HANDSHAKE...</div>
              <p className="text-[11px] font-mono max-w-xs">
                Iniciando socket Baileys seguro y solicitando nuevo código QR...
              </p>
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
                // BUFFER ANTIRRÁFAGAS 4.5s
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                Agrupa múltiples notas de voz y mensajes de texto continuos en un solo turno, garantizando una sola llamada multimodal a Gemini 2.5 Flash.
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
                Emite estados de socket <code className="text-[var(--accent-primary)]">composing</code> y <code className="text-[var(--accent-secondary)]">recording</code> con jitter orgánico antes del despacho.
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
                Rechaza llamadas entrantes con <code className="text-cyan-400">sock.rejectCall</code> y envía nota de voz cortés de líneas ocupadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
