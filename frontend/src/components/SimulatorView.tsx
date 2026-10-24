import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Image as ImageIcon,
  PhoneCall,
  Volume2,
  Sparkles,
  Flame,
  CheckCircle,
  AlertCircle,
  FileText,
  UserCheck,
  RefreshCw,
  Loader2,
  Play,
  RotateCcw,
  FileAudio,
  Smile,
  AlertTriangle,
  Frown,
  Meh
} from 'lucide-react';
import axios from 'axios';
import { BusinessConfig, MessageRecord } from '../types';

interface SimulatorViewProps {
  business: BusinessConfig | null;
  onRefreshAll: () => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ business, onRefreshAll }) => {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState('Carlos Mendoza');
  const [senderPhone, setSenderPhone] = useState('+584129990011');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [forceVoiceReply, setForceVoiceReply] = useState(false);
  const [loading, setLoading] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [briefingAudio, setBriefingAudio] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [callLoading, setCallLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    try {
      const res = await axios.get('/api/conversations/sim_conv_default/messages');
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Error loading simulator messages:', err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('text', inputText);
    formData.append('conversation_id', 'sim_conv_default');
    formData.append('sender_phone', senderPhone);
    formData.append('customer_name', senderName);
    if (forceVoiceReply) formData.append('force_voice', 'true');
    if (selectedImage) formData.append('image', selectedImage);

    // Optimistic UI push
    const tempCustomerMsg: MessageRecord = {
      id: 'temp_' + Date.now(),
      conversation_id: 'sim_conv_default',
      sender: 'customer',
      type: selectedImage ? 'image' : 'text',
      content: inputText || 'Comprobante / Imagen adjunta',
      media_url: imagePreview || undefined,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempCustomerMsg]);

    setInputText('');
    setSelectedImage(null);
    setImagePreview(null);

    try {
      const res = await axios.post('/api/simulator/message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        if (res.data.geminiAnalysis) {
          setLatestAnalysis(res.data.geminiAnalysis);
        }
        await loadConversation();
        onRefreshAll();
      }
    } catch (err: any) {
      console.error('Error sending simulator message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCall = async () => {
    setCallLoading(true);
    try {
      const res = await axios.post('/api/simulator/call', {
        caller_phone: senderPhone,
        conversation_id: 'sim_conv_default'
      });
      if (res.data.success) {
        await loadConversation();
        onRefreshAll();
      }
    } catch (err) {
      console.error('Error simulating call:', err);
    } finally {
      setCallLoading(false);
    }
  };

  const handleGenerateBriefing = async () => {
    setBriefingLoading(true);
    try {
      const res = await axios.post('/api/simulator/daily-briefing');
      if (res.data.success && res.data.audioUrl) {
        setBriefingAudio(res.data.audioUrl);
      }
    } catch (err) {
      console.error('Error generating daily briefing:', err);
    } finally {
      setBriefingLoading(false);
    }
  };

  // Semáforo de Sentimiento Spoki AI
  const renderSentimentBadge = (sentiment?: string) => {
    switch (sentiment) {
      case 'positivo':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00D95F] bg-[#00D95F]/10 px-2 py-0.5 rounded-full border border-[#00D95F]/20">
            <Smile className="w-3 h-3" /> Positivo
          </span>
        );
      case 'frustrado':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <Frown className="w-3 h-3" /> Frustrado
          </span>
        );
      case 'urgente':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Urgente
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full">
            <Meh className="w-3 h-3" /> Neutro
          </span>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-[#00D95F] border-[#00D95F]/40 bg-[#00D95F]/10';
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Simulador WhatsApp + Inspector de Magia Operativa Spoki AI
            </h2>
            <p className="text-xs text-slate-400">
              Prueba texto, audios con transcripción automática y comprobantes en una sola pasada.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateCall}
            disabled={callLoading}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            {callLoading ? 'Desviando...' : 'Simular Llamada'}
          </button>
          <button
            type="button"
            onClick={handleGenerateBriefing}
            disabled={briefingLoading}
            className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            {briefingLoading ? 'Generando...' : 'Resumen Audio Dueño'}
          </button>
          <button
            type="button"
            onClick={loadConversation}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Recargar historial"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Briefing Audio Banner */}
      {briefingAudio && (
        <div className="glass-panel-purple rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-xs font-bold text-white">Resumen Diario en Audio Generado</div>
              <p className="text-[11px] text-slate-400">
                Sintetizado para el dueño con estadísticas y leads calientes
              </p>
            </div>
          </div>
          <audio controls src={briefingAudio} className="h-8 max-w-xs" autoPlay />
        </div>
      )}

      {/* Main Grid: WhatsApp Phone (Left) + Real-time Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: WhatsApp Device (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0B0F17] border border-white/10 rounded-3xl shadow-2xl flex flex-col h-[660px] overflow-hidden">
          {/* Mock Header */}
          <div className="bg-[#111827] px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00D95F] to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                WA
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {business?.name || 'Spoki Business'}
                  <span className="w-2 h-2 rounded-full bg-[#00D95F] animate-pulse" />
                </div>
                <div className="text-[11px] text-[#00D95F]">en línea • Asistente Spoki AI</div>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">
              Rubro: {business?.category || 'general'}
            </span>
          </div>

          {/* User Settings Pill */}
          <div className="bg-[#111827]/60 px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Cliente simulado:</span>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="bg-[#0B0F17] border border-white/10 rounded px-2 py-0.5 text-xs text-white w-32 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="bg-[#0B0F17] border border-white/10 rounded px-2 py-0.5 text-xs text-slate-300 w-32 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <Sparkles className="w-8 h-8 text-purple-400 mb-1" />
                <p className="text-sm font-medium text-slate-300">
                  Comienza una conversación interactiva
                </p>
                <p className="text-xs max-w-sm">
                  Prueba preguntar sobre el catálogo, adjunta un comprobante de pago o activa la respuesta en nota de voz.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.sender === 'customer';
                const isCall = msg.type === 'call_intercepted';

                if (isCall) {
                  return (
                    <div
                      key={msg.id}
                      className="mx-auto max-w-md bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-3 text-xs text-cyan-200 text-center space-y-2 shadow-lg"
                    >
                      <div className="font-semibold flex items-center justify-center gap-1.5">
                        <PhoneCall className="w-4 h-4 text-cyan-400" />
                        Llamada telefónica interceptada
                      </div>
                      <p className="text-[11px] text-slate-300 whitespace-pre-wrap">{msg.content}</p>
                      {msg.audio_url && (
                        <div className="pt-1">
                          <audio controls src={msg.audio_url} className="h-7 w-full" />
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-md text-sm ${
                        isCustomer
                          ? 'bg-[#16A34A] text-white rounded-br-none'
                          : msg.sender === 'human_agent'
                          ? 'bg-purple-700 text-white rounded-bl-none'
                          : 'bg-[#1e293d] text-slate-100 rounded-bl-none border border-white/10'
                      }`}
                    >
                      <div className="text-[10px] opacity-75 font-semibold mb-1">
                        {isCustomer
                          ? senderName
                          : msg.sender === 'human_agent'
                          ? 'Operador Humano'
                          : business?.name || 'Spoki AI'}
                      </div>

                      {/* Image Preview */}
                      {msg.media_url && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-white/10 max-w-xs">
                          <img
                            src={msg.media_url}
                            alt="Adjunto"
                            className="w-full h-auto object-cover max-h-48"
                          />
                        </div>
                      )}

                      {/* Text */}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                      {/* Transcripción de Nota de Voz (Spoki AI Feature) */}
                      {msg.metadata?.audio_transcription && (
                        <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-purple-200/90 italic flex items-start gap-1.5">
                          <FileAudio className="w-3.5 h-3.5 shrink-0 text-purple-300 mt-0.5" />
                          <span>
                            <strong>Transcripción IA:</strong> "{msg.metadata.audio_transcription}"
                          </span>
                        </div>
                      )}

                      {/* Audio Player */}
                      {msg.audio_url && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-emerald-300 shrink-0" />
                          <audio controls src={msg.audio_url} className="h-7 w-full max-w-[220px]" />
                        </div>
                      )}

                      {/* Metadata badges */}
                      {msg.metadata && (
                        <div className="mt-2 pt-1 border-t border-white/5 flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
                          {msg.metadata.buying_score !== undefined && (
                            <span className="font-mono text-[#00D95F]">
                              Score: {msg.metadata.buying_score}
                            </span>
                          )}
                          {msg.metadata.customer_sentiment && (
                            <span>{renderSentimentBadge(msg.metadata.customer_sentiment)}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Image Bar */}
          {imagePreview && (
            <div className="bg-[#111827] border-t border-white/10 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={imagePreview}
                  alt="Previa"
                  className="w-8 h-8 rounded object-cover border border-white/10"
                />
                <span className="text-xs text-slate-300 truncate max-w-xs">
                  {selectedImage?.name} (Comprobante de pago)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Quitar
              </button>
            </div>
          )}

          {/* Input Controls */}
          <form
            onSubmit={handleSendMessage}
            className="bg-[#111827] p-3 border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-full bg-[#1e293d] hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Adjuntar comprobante"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setForceVoiceReply(!forceVoiceReply)}
              className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                forceVoiceReply
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#1e293d] text-slate-400 hover:bg-slate-700'
              }`}
              title="Responder con nota de voz TTS"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe un mensaje de prueba..."
              className="flex-1 bg-[#0B0F17] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D95F]"
            />

            <button
              type="submit"
              disabled={loading || (!inputText.trim() && !selectedImage)}
              className="p-2.5 rounded-full bg-[#00D95F] hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold transition-all cursor-pointer shadow-md shadow-[#00D95F]/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Spoki AI Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl p-5 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Inspector Spoki AI (Turno Actual)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                Single-Pass Multimodal
              </span>
            </div>

            {/* Buying Score */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300">Termómetro Comercial:</span>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${getScoreColor(
                    latestAnalysis?.buying_score ?? 10
                  )}`}
                >
                  Score: {latestAnalysis?.buying_score ?? 10}/100
                </span>
              </div>
              <div className="w-full bg-[#0B0F17] h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (latestAnalysis?.buying_score ?? 10) >= 80
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : (latestAnalysis?.buying_score ?? 10) >= 50
                      ? 'bg-gradient-to-r from-teal-500 to-amber-500'
                      : 'bg-[#00D95F]'
                  }`}
                  style={{ width: `${Math.max(5, latestAnalysis?.buying_score ?? 10)}%` }}
                />
              </div>
            </div>

            {/* Sentiment & Knowledge Found Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0B0F17] border border-white/5 rounded-2xl p-3">
                <span className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                  Sentimiento Detectado
                </span>
                <div>{renderSentimentBadge(latestAnalysis?.customer_sentiment)}</div>
              </div>
              <div className="bg-[#0B0F17] border border-white/5 rounded-2xl p-3">
                <span className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                  Base de Conocimiento
                </span>
                <span
                  className={`text-xs font-bold ${
                    latestAnalysis?.knowledge_found !== false ? 'text-[#00D95F]' : 'text-rose-400'
                  }`}
                >
                  {latestAnalysis?.knowledge_found !== false ? '✓ Dato Respaldado' : '⚠ No encontrado'}
                </span>
              </div>
            </div>

            {/* CRM Profile */}
            <div className="bg-[#0B0F17] border border-white/5 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <UserCheck className="w-4 h-4" />
                Ficha CRM Invisible (Autocompletada)
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="text-white font-medium">
                    {latestAnalysis?.crm_profile?.customer_name || senderName || 'Desconocido'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-500">Necesidad:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[180px]">
                    {latestAnalysis?.crm_profile?.need_or_vehicle_or_symptom || 'Por definir'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Zona / Dirección:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[180px]">
                    {latestAnalysis?.crm_profile?.address_or_zone || 'No indicada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Missing Info */}
            {latestAnalysis?.missing_information && latestAnalysis.missing_information.length > 0 && (
              <div className="bg-[#0B0F17] border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  Datos Faltantes para Cerrar
                </div>
                <ul className="text-xs text-slate-300 list-disc list-inside space-y-0.5">
                  {latestAnalysis.missing_information.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Draft */}
            {latestAnalysis?.transaction_draft && (
              <div className="bg-[#0B0F17] border border-[#00D95F]/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#00D95F]">
                  <FileText className="w-4 h-4" />
                  Borrador de Transacción Extraído
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  {latestAnalysis.transaction_draft.reference_number && (
                    <div>
                      Ref: <span className="font-mono text-white">{latestAnalysis.transaction_draft.reference_number}</span>
                    </div>
                  )}
                  {latestAnalysis.transaction_draft.detected_amount && (
                    <div>
                      Monto: <span className="font-mono text-[#00D95F] font-bold">${latestAnalysis.transaction_draft.detected_amount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Owner Alert */}
            {latestAnalysis?.owner_alert_message && (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3 text-xs text-rose-200">
                <span className="font-bold block mb-1">🚨 Alerta Automática para el Dueño:</span>
                <p>{latestAnalysis.owner_alert_message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
