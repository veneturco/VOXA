import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCw, PowerOff, CheckCircle2, ShieldCheck, Smartphone, AlertCircle } from 'lucide-react';
import axios from 'axios';

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
      <div className="bg-[#151b26] border border-[#222c3d] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#a04328]/15 border border-[#a04328]/30 flex items-center justify-center text-[#c2593b]">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Conector WhatsApp QR (VENE TURCO)
              </span>
              {status === 'open' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  En línea: {connectedPhone || 'Vinculado'}
                </span>
              ) : status === 'qrcode' ? (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Escanear QR
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  Desconectado
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Conexión directa vía Baileys con buffer de 4.5s y presencia de escritura automática.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'open' ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PowerOff className="w-3.5 h-3.5" />
              Desconectar
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-[#a04328] hover:bg-[#c2593b] text-white text-xs font-bold shadow-md shadow-[#a04328]/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              {loading ? 'Generando QR...' : 'Vincular por Código QR'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f141c] border border-[#222c3d] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-[#a04328]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#222c3d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#a04328]/20 border border-[#a04328]/40 flex items-center justify-center text-[#c2593b]">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Conector Directo WhatsApp (Baileys QR)
              <span className="text-[10px] bg-[#a04328]/20 text-[#c2593b] px-2 py-0.5 rounded font-mono">
                VT-CEDAR
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Vincula cualquier número de WhatsApp escaneando el código QR en pantalla sin Meta App Review.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'open' ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PowerOff className="w-3.5 h-3.5" />
              Desconectar
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#a04328] hover:bg-[#c2593b] text-white text-xs font-bold shadow-lg shadow-[#a04328]/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Generando sesión...' : 'Iniciar / Generar QR'}
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: QR Display Window */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-[#151b26] border border-[#222c3d] rounded-2xl min-h-[300px]">
          {status === 'open' ? (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-sm font-bold text-white">WhatsApp Vinculado con Éxito</div>
              <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                {connectedPhone || 'Línea Conectada'}
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs">
                El asistente IA está escuchando mensajes y gestionando las conversaciones activamente.
              </p>
            </div>
          ) : qrDataUrl ? (
            <div className="text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-2xl inline-block border-4 border-[#a04328]/30">
                <img
                  src={qrDataUrl}
                  alt="WhatsApp QR Code"
                  className="w-56 h-56 object-contain rounded-lg"
                />
              </div>
              <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#c2593b]" />
                Escanea desde WhatsApp &gt; Dispositivos vinculados
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2 text-slate-500">
              <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-xs font-medium text-slate-400">Sesión desconectada</div>
              <p className="text-[11px] max-w-xs">
                Haz clic en "Iniciar / Generar QR" para generar el código de emparejamiento.
              </p>
            </div>
          )}
        </div>

        {/* Right: Technical Features & Instructions */}
        <div className="md:col-span-7 space-y-3">
          <div className="p-3.5 bg-[#151b26] border border-[#222c3d] rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#a04328]/20 text-[#c2593b] shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Buffer Antirráfagas de 4.5 Segundos</div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Agrupa automáticamente múltiples mensajes rápidos de un mismo cliente en un solo bloque coherente,
                garantizando una única llamada a Gemini 2.5 Flash por turno.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-[#151b26] border border-[#222c3d] rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Presencia de WhatsApp Automatizada</div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Envía estado de <code className="text-emerald-400 font-mono">composing</code> (escribiendo...) o{' '}
                <code className="text-emerald-400 font-mono">recording</code> (grabando audio...) antes de enviar la respuesta.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-[#151b26] border border-[#222c3d] rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Intercepción y Desvío de Llamadas de Voz</div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Rechaza cortésmente llamadas entrantes con <code className="text-cyan-400 font-mono">sock.rejectCall</code> y
                responde inmediatamente con el mensaje explicativo de líneas ocupadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
