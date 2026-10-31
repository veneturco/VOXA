import React, { useState, useEffect } from 'react';
import {
  Save,
  Sparkles,
  Stethoscope,
  Wrench,
  ShoppingBag,
  Volume2,
  PhoneForwarded,
  Eye,
  CheckCircle2,
  BookOpen,
  ShieldAlert,
  Copy,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import axios from '../services/api';
import { BusinessConfig } from '../types';
import { WhatsAppQRConnector } from './WhatsAppQRConnector';

interface ConfigViewProps {
  business: BusinessConfig | null;
  onRefreshBusiness: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({ business, onRefreshBusiness }) => {
  const [formData, setFormData] = useState<Partial<BusinessConfig>>({});
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState<string>('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  // Google Sheets Live Sync State
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [sheetSyncMsg, setSheetSyncMsg] = useState<string | null>(null);

  // Spoki AI V5.0: Marketing Template Generator State
  const [templateObjective, setTemplateObjective] = useState('');
  const [generatingTemplates, setGeneratingTemplates] = useState(false);
  const [generatedTemplates, setGeneratedTemplates] = useState<{
    short: string;
    direct: string;
    urgency: string;
  } | null>(null);
  const [copiedVariant, setCopiedVariant] = useState<string | null>(null);

  useEffect(() => {
    if (business) {
      setFormData(business);
      setSheetUrl(business.google_sheet_csv_url || '');
    }
  }, [business]);

  const handleApplyTemplate = async (category: 'clinica' | 'taller' | 'tienda') => {
    setLoadingTemplate(category);
    try {
      const res = await axios.post(`/api/business/template/${category}`);
      if (res.data.success) {
        setFormData(res.data.data);
        onRefreshBusiness();
        loadPromptPreview();
      }
    } catch (err) {
      console.error('Error applying template:', err);
    } finally {
      setLoadingTemplate(null);
    }
  };

  const handleSyncGoogleSheets = async () => {
    if (!sheetUrl.trim()) return;
    setSyncingSheets(true);
    setSheetSyncMsg(null);
    try {
      const res = await axios.post('/api/business/sync-sheets', { sheetUrl });
      if (res.data?.success) {
        setFormData(res.data.data);
        setSheetSyncMsg(`âœ… Â¡${res.data.rowsSynced} filas de inventario/precios sincronizadas con Ã©xito!`);
        onRefreshBusiness();
        loadPromptPreview();
      }
    } catch (err: any) {
      setSheetSyncMsg(
        `âš ï¸ ${err.response?.data?.error || 'Verifica que el Google Sheet sea pÃºblico con enlace.'}`
      );
    } finally {
      setSyncingSheets(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await axios.post('/api/business', formData);
      if (res.data.success) {
        setSaveSuccess(true);
        onRefreshBusiness();
        loadPromptPreview();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving business config:', err);
    } finally {
      setSaving(false);
    }
  };

  const loadPromptPreview = async () => {
    setLoadingPrompt(true);
    try {
      const res = await axios.get('/api/business/prompt-preview');
      if (res.data.success) {
        setPreviewPrompt(res.data.data.prompt);
      }
    } catch (err) {
      console.error('Error loading prompt preview:', err);
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleGenerateMarketingTemplates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateObjective.trim()) return;

    setGeneratingTemplates(true);
    try {
      const res = await axios.post('/api/copilot/generate-template', {
        objective: templateObjective
      });
      if (res.data.success) {
        setGeneratedTemplates(res.data.data);
      }
    } catch (err) {
      console.error('Error generating marketing templates:', err);
    } finally {
      setGeneratingTemplates(false);
    }
  };

  const copyToClipboard = (text: string, variant: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVariant(variant);
    setTimeout(() => setCopiedVariant(null), 2000);
  };

  useEffect(() => {
    loadPromptPreview();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Entrenador del Asistente, Google Sheets en Vivo y PolÃ­ticas
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configura la identidad del negocio, reglas comerciales, hojas de cÃ¡lculo en vivo y respuesta condicional estricta.
        </p>
      </div>

      {/* WhatsApp QR Header Connector */}
      <WhatsAppQRConnector businessId={business?.id || 'default_business'} compact={true} />

      {/* 1-Click Rubro Template Pickers */}
            {/* Bento Asimétrico: Plantillas Maestras por Rubro */}
      <div className="ui-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            // PLANTILLAS MAESTRAS POR RUBRO (BENTO ENGINE)
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            SECTOR ACTIVO: <strong className="text-[var(--accent-primary)] uppercase">{formData.category}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Card Activa Destacada (col-span-12 md:col-span-6) */}
          <div className="md:col-span-6 p-5 rounded-xl bg-[var(--bg-elevated)] border-2 border-[var(--accent-primary)] relative shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="ui-badge-led">
                RUBRO EN PRODUCCIÓN
              </span>
              <span className="text-xs font-mono font-bold text-[var(--accent-primary)] uppercase">
                {formData.category}
              </span>
            </div>
            <h4 className="text-base font-bold font-mono text-[var(--text-primary)]">
              {formData.name || 'Empresa Activa'}
            </h4>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-1 leading-relaxed">
              {formData.description || 'Sin descripcion configurada.'}
            </p>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
              <span>REGLAS COGNITIVAS</span>
              <span className="text-[var(--accent-secondary)] font-bold">ESTRICTAS</span>
            </div>
          </div>

          {/* Selector Rápido de Otros Rubros (col-span-12 md:col-span-6) */}
          <div className="md:col-span-6 grid grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={() => handleApplyTemplate('clinica')}
              disabled={loadingTemplate !== null}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                formData.category === 'clinica'
                  ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-highlight)] text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Stethoscope className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold font-mono text-[var(--text-primary)]">Clínica & Consultorio</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">Citas, triage médico, derivación humana</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase">{formData.category === 'clinica' ? '● ACTIVA' : 'APLICAR'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyTemplate('taller')}
              disabled={loadingTemplate !== null}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                formData.category === 'taller'
                  ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-highlight)] text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wrench className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold font-mono text-[var(--text-primary)]">Taller & Repuestos</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">Marca/modelo/año, cotización y cita</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase">{formData.category === 'taller' ? '● ACTIVA' : 'APLICAR'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyTemplate('tienda')}
              disabled={loadingTemplate !== null}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                formData.category === 'tienda'
                  ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-highlight)] text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold font-mono text-[var(--text-primary)]">Tienda & Delivery</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">Catálogo, comprobantes Pago Móvil y delivery</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase">{formData.category === 'tienda' ? '● ACTIVA' : 'APLICAR'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Business Identity & Operations */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">
              Datos Comerciales de la Empresa
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre Comercial del Negocio
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                DescripciÃ³n / Slogan
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Horario de AtenciÃ³n
                </label>
                <input
                  type="text"
                  value={formData.schedule || ''}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  TelÃ©fono del DueÃ±o (Alertas wa.me)
                </label>
                <input
                  type="text"
                  placeholder="+584164883199"
                  value={formData.owner_phone || ''}
                  onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                DirecciÃ³n FÃ­sica o Zonas de Cobertura
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                CatÃ¡logo de Productos / Servicios con Precios (USD)
              </label>
              <textarea
                rows={4}
                value={formData.catalog_or_services || ''}
                onChange={(e) => setFormData({ ...formData, catalog_or_services: e.target.value })}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                MÃ©todos de Pago Aceptados
              </label>
              <textarea
                rows={2}
                value={formData.payment_methods || ''}
                onChange={(e) => setFormData({ ...formData, payment_methods: e.target.value })}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Column 2: Google Sheets Sync, Knowledge Base, Conditional Reply & Voice */}
          <div className="space-y-6">
            {/* Base de Conocimiento Documental + Google Sheets Live Sync */}
            <div className="glass-panel-purple rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    Base de Conocimiento + Google Sheets en Vivo
                  </h3>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  Zero-DB Admin
                </span>
              </div>

              {/* Google Sheets Connector */}
              <div className="p-3.5 rounded-2xl bg-[#0B0F17]/90 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Sincronizar Inventario / Precios desde Google Sheets</span>
                  </label>
                  {formData.last_sheet_sync && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Sync: {new Date(formData.last_sheet_sync).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/TU_ID_DE_HOJA/edit?usp=sharing"
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSyncGoogleSheets}
                    disabled={syncingSheets || !sheetUrl.trim()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingSheets ? 'animate-spin' : ''}`} />
                    <span>{syncingSheets ? 'Leyendo...' : 'Sincronizar'}</span>
                  </button>
                </div>
                {sheetSyncMsg && (
                  <p className="text-[11px] text-emerald-300 font-medium">{sheetSyncMsg}</p>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Documentos de referencia, polÃ­ticas de garantÃ­a, zonas de delivery e inventario sincronizado:
              </p>
              <textarea
                rows={4}
                value={formData.knowledge_base || ''}
                onChange={(e) => setFormData({ ...formData, knowledge_base: e.target.value })}
                placeholder="Ejemplo: 'PolÃ­ticas de garantÃ­a de repuestos: 90 dÃ­as con factura. Zonas cubiertas para delivery: Municipio Chacao y Baruta sin costo extra sobre $20...'"
                className="w-full bg-[#0B0F17] border border-purple-500/30 rounded-xl p-3 text-xs text-purple-100 font-mono focus:outline-none focus:border-purple-400"
              />

              {/* Switch de Respuesta Condicional Estricta */}
              <div className="p-3.5 bg-[#0B0F17]/90 border border-purple-500/30 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      Respuesta Condicional Estricta (Modo Spoki AI)
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Si el cliente pregunta algo no contemplado en la Base de Conocimiento, la IA pausa el bot y avisa: <em>"Ya te comunico con un asesor especializado"</em>.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.strict_conditional_reply ?? false}
                    onChange={(e) =>
                      setFormData({ ...formData, strict_conditional_reply: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {/* Modalidad de Respuesta y DesvÃ­o */}
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#00D95F]" />
                Modalidad de Respuesta y DesvÃ­o de Llamadas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Modo de Respuesta
                  </label>
                  <select
                    value={formData.response_mode || 'mirror'}
                    onChange={(e: any) =>
                      setFormData({ ...formData, response_mode: e.target.value })
                    }
                    className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="mirror">Espejo (Texto-&gt;Texto / Audio-&gt;Audio)</option>
                    <option value="text">Solo Texto (MÃ¡xima rapidez)</option>
                    <option value="voice">Solo Voz (Todas en notas de voz)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Voz Neuronal TTS
                  </label>
                  <select
                    value={formData.voice_name || 'es-VE-PaolaNeural'}
                    onChange={(e) => setFormData({ ...formData, voice_name: e.target.value })}
                    className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="es-VE-PaolaNeural">Paola (Venezuela - CÃ¡lida)</option>
                    <option value="es-VE-SebastianNeural">SebastiÃ¡n (Venezuela - Asesor)</option>
                    <option value="es-CO-SalomeNeural">SalomÃ© (Colombia - DinÃ¡mica)</option>
                    <option value="es-MX-DaliaNeural">Dalia (MÃ©xico - Ejecutiva)</option>
                  </select>
                </div>
              </div>

              {/* Call Intercept */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneForwarded className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">DesvÃ­o de Llamadas</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.call_forwarding_enabled ?? true}
                      onChange={(e) =>
                        setFormData({ ...formData, call_forwarding_enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00D95F]"></div>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={formData.call_rejection_message || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, call_rejection_message: e.target.value })
                  }
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="flex items-center justify-between glass-panel rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar ConfiguraciÃ³n'}
            </button>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-[#00D95F] font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Sincronizado con Ã©xito
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={loadPromptPreview}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-purple-400" />
            Actualizar Vista del Prompt
          </button>
        </div>
      </form>

      {/* GENERADOR DE PLANTILLAS DE MARKETING CON IA (SPOKI AI FEATURE) */}
      <div className="glass-panel-purple rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Generador de Plantillas de Marketing & ReactivaciÃ³n con IA
            </h3>
          </div>
          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
            3 Variantes Persuasivas
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Escribe un objetivo comercial y la IA redactarÃ¡ 3 versiones adaptadas a WhatsApp listas para copiar.
        </p>

        <form onSubmit={handleGenerateMarketingTemplates} className="flex gap-2">
          <input
            type="text"
            value={templateObjective}
            onChange={(e) => setTemplateObjective(e.target.value)}
            placeholder="Ejemplo: 'PromociÃ³n de cambio de aceite y filtro este fin de semana' o 'Recordatorio de control dental'..."
            className="flex-1 bg-[#0B0F17] border border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
          />
          <button
            type="submit"
            disabled={generatingTemplates || !templateObjective.trim()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-lg shadow-purple-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {generatingTemplates ? 'Redactando...' : 'Generar Plantillas'}
          </button>
        </form>

        {generatedTemplates && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* Short Variant */}
            <div className="p-4 rounded-2xl bg-[#0B0F17] border border-purple-500/20 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                  Variante Corta
                </span>
                <p className="text-xs text-slate-200 mt-2 leading-relaxed whitespace-pre-wrap">
                  {generatedTemplates.short}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedTemplates.short, 'short')}
                className="mt-2 text-[11px] text-purple-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedVariant === 'short' ? 'Â¡Copiado!' : 'Copiar Texto'}
              </button>
            </div>

            {/* Direct Variant */}
            <div className="p-4 rounded-2xl bg-[#0B0F17] border border-purple-500/20 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#00D95F] bg-[#00D95F]/10 px-2 py-0.5 rounded">
                  Variante Directa / Comercial
                </span>
                <p className="text-xs text-slate-200 mt-2 leading-relaxed whitespace-pre-wrap">
                  {generatedTemplates.direct}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedTemplates.direct, 'direct')}
                className="mt-2 text-[11px] text-emerald-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedVariant === 'direct' ? 'Â¡Copiado!' : 'Copiar Texto'}
              </button>
            </div>

            {/* Urgency Variant */}
            <div className="p-4 rounded-2xl bg-[#0B0F17] border border-purple-500/20 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                  Variante Urgencia / Escasez
                </span>
                <p className="text-xs text-slate-200 mt-2 leading-relaxed whitespace-pre-wrap">
                  {generatedTemplates.urgency}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedTemplates.urgency, 'urgency')}
                className="mt-2 text-[11px] text-rose-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedVariant === 'urgency' ? 'Â¡Copiado!' : 'Copiar Texto'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compiled System Prompt Inspector */}
      <div className="glass-panel rounded-3xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              `system_prompt` Compilado con Base de Conocimiento y Tasa BCV
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {previewPrompt ? `${previewPrompt.length} caracteres` : ''}
          </span>
        </div>
        <pre className="bg-[#0B0F17] border border-white/10 rounded-2xl p-4 text-xs font-mono text-purple-300/90 whitespace-pre-wrap max-h-56 overflow-y-auto">
          {loadingPrompt ? 'Generando vista previa...' : previewPrompt}
        </pre>
      </div>
    </div>
  );
};
