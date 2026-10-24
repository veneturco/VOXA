import React from 'react';
import {
  Link2,
  CheckCircle,
  AlertTriangle,
  Copy,
  Key,
  Database,
  Radio,
  ShieldCheck
} from 'lucide-react';
import { BusinessConfig, IntegrationStatus } from '../types';
import { WhatsAppQRConnector } from './WhatsAppQRConnector';
import { AntiBanShieldWidget } from './AntiBanShieldWidget';

interface IntegrationsViewProps {
  integrations: IntegrationStatus | null;
  business?: BusinessConfig | null;
  onRefresh: () => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  integrations,
  business,
  onRefresh
}) => {
  const [copied, setCopied] = React.useState(false);

  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const fullWebhookUrl = isLocalDev
    ? `${window.location.protocol}//${window.location.hostname}:4000/webhook`
    : `${window.location.origin}/webhook`;

  const activeBizId = business?.id || 'default_business';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(fullWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-400" />
            Estado de Integraciones y Configuración de Credenciales
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Diagnóstico en vivo de los componentes del backend y credenciales de producción para{' '}
            <span className="text-emerald-400 font-semibold">{business?.name || 'Negocio Activo'}</span>.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
        >
          Verificar Estado
        </button>
      </div>

      {/* WhatsApp Baileys QR Connector Component */}
      <WhatsAppQRConnector businessId={activeBizId} />

      {/* VENE TURCO SHIELD: Medidor Predictivo Anti-Baneo & Camaleón */}
      <AntiBanShieldWidget businessId={activeBizId} />

      {/* Connectivity Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Google Gemini 2.5 Flash SDK</h3>
            </div>
            {integrations?.gemini.status === 'connected' ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" /> API Real Conectada
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5" /> Modo Simulador Local
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{integrations?.gemini.message}</p>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div>
              Variable backend: <code className="text-indigo-400 font-mono">GEMINI_API_KEY</code>
            </div>
            <div>
              Modelo multimodal utilizado:{' '}
              <span className="text-white font-mono">gemini-2.5-flash</span> (Single-Pass 15 RPM
              Guard)
            </div>
          </div>
        </div>

        {/* Storage Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Almacenamiento Híbrido</h3>
            </div>
            {integrations?.storage.mode === 'firestore' ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" /> Firestore Cloud
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                <CheckCircle className="w-3.5 h-3.5" /> Local JSON DB
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{integrations?.storage.message}</p>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div>
              Ruta activa:{' '}
              <code className="text-cyan-400 font-mono break-all">
                {integrations?.storage.localDbPath}
              </code>
            </div>
            <div>
              Para activar Firestore: añade{' '}
              <code className="text-white font-mono">FIREBASE_SERVICE_ACCOUNT</code> en{' '}
              <code className="text-white font-mono">Environment</code>
            </div>
          </div>
        </div>
      </div>

      {/* Meta WhatsApp Cloud API Setup Guide & Webhook Details */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Meta WhatsApp Cloud API & Webhook Configuration
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Graph API v21.0</span>
        </div>

        <p className="text-xs text-slate-300">
          Para conectar un número de teléfono oficial de Meta WhatsApp Cloud API al SaaS, configura
          la URL de retorno en el portal de Meta for Developers:
        </p>

        {/* Webhook URL Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Callback URL (URL de Webhook Detectada)
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs text-emerald-400 font-mono truncate">{fullWebhookUrl}</code>
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0 cursor-pointer"
                title="Copiar URL"
              >
                {copied ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Verify Token (Token de Verificación)
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs text-indigo-400 font-mono">
                {integrations?.whatsapp.verifyToken || 'spoki_webhook_token_secure_2025'}
              </code>
            </div>
          </div>
        </div>

        {/* Required Meta Fields Checklist */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Campos requeridos de suscripción en Meta:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                <code className="text-emerald-400">messages</code> (Texto, audio, imágenes)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                <code className="text-emerald-400">calls</code> (WhatsApp Calling API)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                <code className="text-emerald-400">message_template_status_update</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
