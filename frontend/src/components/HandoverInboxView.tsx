import React, { useState, useEffect, useRef } from 'react';
import {
  Inbox,
  PauseCircle,
  PlayCircle,
  Send,
  User,
  Bot,
  ShieldAlert,
  Sparkles,
  Volume2,
  FileAudio,
  Smile,
  AlertTriangle,
  Frown,
  Meh,
  Wand2,
  ListOrdered,
  FileText
} from 'lucide-react';
import axios from '../services/api';
import { Conversation, MessageRecord } from '../types';

interface HandoverInboxViewProps {
  conversations: Conversation[];
  onRefreshAll: () => void;
}

export const HandoverInboxView: React.FC<HandoverInboxViewProps> = ({
  conversations,
  onRefreshAll
}) => {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);

  // Spoki AI Copilot Assist State
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [chatSummaryBullets, setChatSummaryBullets] = useState<string[] | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConv) {
      setSelectedConv(conversations[0]);
    }
  }, [conversations]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
      setChatSummaryBullets(null);
    }
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (convId: string) => {
    try {
      const res = await axios.get(`/api/conversations/${convId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Error loading inbox messages:', err);
    }
  };

  const handleToggleBotPause = async () => {
    if (!selectedConv) return;
    setTogglingBot(true);
    const newPauseState = !selectedConv.bot_paused;

    try {
      const res = await axios.post(`/api/conversations/${selectedConv.id}/pause-bot`, {
        paused: newPauseState
      });
      if (res.data.success) {
        setSelectedConv({ ...selectedConv, bot_paused: newPauseState });
        onRefreshAll();
      }
    } catch (err) {
      console.error('Error toggling bot pause:', err);
    } finally {
      setTogglingBot(false);
    }
  };

  const handleSendHumanReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyText.trim()) return;

    setSending(true);
    try {
      const res = await axios.post(`/api/conversations/${selectedConv.id}/human-reply`, {
        text: replyText,
        send_to_whatsapp: selectedConv.channel === 'whatsapp'
      });

      if (res.data.success) {
        setReplyText('');
        loadMessages(selectedConv.id);
        onRefreshAll();
      }
    } catch (err) {
      console.error('Error sending human reply:', err);
    } finally {
      setSending(false);
    }
  };

  // Copilot Assist Handler (Sugerir, Resumir, Mejorar)
  const handleCopilotAssist = async (mode: 'suggest_reply' | 'summarize_chat' | 'improve_draft') => {
    if (!selectedConv) return;
    setCopilotLoading(true);

    try {
      const res = await axios.post('/api/copilot/assist', {
        mode,
        conversation_id: selectedConv.id,
        draft_text: replyText
      });

      if (res.data.success) {
        const data = res.data.data;
        if (mode === 'suggest_reply' || mode === 'improve_draft') {
          setReplyText(data.resultText || '');
        } else if (mode === 'summarize_chat') {
          setChatSummaryBullets(data.bullets || [data.resultText]);
        }
      }
    } catch (err) {
      console.error('Error in Copilot assist:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const renderSentimentIndicator = (sentiment?: string) => {
    switch (sentiment) {
      case 'positivo':
        return <span className="text-[10px] text-[#00D95F] bg-[#00D95F]/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Smile className="w-3 h-3" /> Positivo</span>;
      case 'frustrado':
        return <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Frown className="w-3 h-3" /> Frustrado</span>;
      case 'urgente':
        return <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Urgente</span>;
      default:
        return <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1"><Meh className="w-3 h-3" /> Neutro</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Inbox className="w-5 h-5 text-purple-400" />
          Bandeja de Entrada, Copiloto IA e Intervención Humana
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Toma el control humano en cualquier chat, recibe sugerencias de respuesta con IA y lee notas de voz transcritas.
        </p>
      </div>

      {/* Split Inbox Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 glass-panel rounded-3xl overflow-hidden shadow-2xl h-[670px]">
        {/* Conversations List (4 Cols) */}
        <div className="md:col-span-4 border-r border-white/5 flex flex-col bg-[#0B0F17]/60">
          <div className="p-3.5 border-b border-white/5 font-bold text-xs text-slate-300 flex items-center justify-between">
            <span>Conversaciones ({conversations.length})</span>
            <span className="text-[10px] text-purple-400 font-mono">Modo Copiloto</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No hay conversaciones registradas aún.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-950/40 border-l-4 border-purple-500'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[130px]">
                        {conv.customer_name || 'Cliente'}
                      </span>
                      {conv.bot_paused && (
                        <span className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-black">
                          HUMANO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mb-1.5">
                      {conv.last_message || 'Sin mensajes'}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-500">{conv.phone_or_user_id}</span>
                      {renderSentimentIndicator(conv.sentiment)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Thread & Copilot Toolbar (8 Cols) */}
        <div className="md:col-span-8 flex flex-col h-full bg-[#0B0F17]">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-white/5 bg-[#111827]/70 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {selectedConv.customer_name || 'Cliente'}
                      <span className="text-xs font-mono text-slate-400">({selectedConv.phone_or_user_id})</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Canal: <span className="capitalize">{selectedConv.channel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleBotPause}
                    disabled={togglingBot}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      selectedConv.bot_paused
                        ? 'bg-[#00D95F] hover:bg-emerald-400 text-slate-950 shadow-md shadow-[#00D95F]/20'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20'
                    }`}
                  >
                    {selectedConv.bot_paused ? (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        Reactivar Asistente IA
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-4 h-4" />
                        Pausar IA / Tomar Control
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bot Paused Banner */}
              {selectedConv.bot_paused && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2 text-xs text-amber-300">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    El asistente IA está <strong>pausado</strong> para esta conversación. El cliente espera tu respuesta directa.
                  </span>
                </div>
              )}

              {/* Copilot Executive Summary Card (If Requested) */}
              {chatSummaryBullets && (
                <div className="m-3 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs space-y-2">
                  <div className="font-bold text-purple-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4" /> Resumen Ejecutivo de la Conversación
                    </span>
                    <button
                      onClick={() => setChatSummaryBullets(null)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Cerrar
                    </button>
                  </div>
                  <ul className="text-slate-200 space-y-1 list-disc list-inside">
                    {chatSummaryBullets.map((bullet, i) => (
                      <li key={i}>{bullet.replace(/^[*-]\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const isCust = m.sender === 'customer';
                  const isHum = m.sender === 'human_agent';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isCust ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-xs ${
                          isCust
                            ? 'bg-[#1e293d] text-slate-100 rounded-bl-none border border-white/5'
                            : isHum
                            ? 'bg-purple-700 text-white rounded-br-none shadow-md shadow-purple-900/30'
                            : 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-200 rounded-br-none'
                        }`}
                      >
                        <div className="text-[10px] font-bold opacity-75 mb-0.5 flex items-center gap-1">
                          {isCust ? <><User className="w-3 h-3" /> Cliente</> : isHum ? <><User className="w-3 h-3" /> Operador Humano</> : <><Bot className="w-3 h-3" /> Asistente IA</>}
                        </div>
                        <p className="whitespace-pre-wrap">{m.content}</p>

                        {/* Transcripción de Nota de Voz */}
                        {m.metadata?.audio_transcription && (
                          <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-purple-200/90 italic flex items-start gap-1">
                            <FileAudio className="w-3 h-3 shrink-0 text-purple-300 mt-0.5" />
                            <span>Transcripción: "{m.metadata.audio_transcription}"</span>
                          </div>
                        )}

                        {m.audio_url && (
                          <div className="mt-1 pt-1 border-t border-white/10 flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5" />
                            <audio controls src={m.audio_url} className="h-6 max-w-[200px]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5 px-1">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* MODO COPILOTO IA BAR (SPOKI AI FEATURE) */}
              <div className="px-3 py-2 bg-[#111827] border-t border-white/5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3" /> Copiloto IA:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopilotAssist('suggest_reply')}
                  disabled={copilotLoading}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                >
                  <Sparkles className="w-3 h-3" />
                  Sugerir Respuesta
                </button>
                <button
                  type="button"
                  onClick={() => handleCopilotAssist('summarize_chat')}
                  disabled={copilotLoading}
                  className="px-2.5 py-1 rounded-lg bg-purple-900/50 hover:bg-purple-900 text-purple-200 border border-purple-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <FileText className="w-3 h-3" />
                  Resumir Conversación
                </button>
                <button
                  type="button"
                  onClick={() => handleCopilotAssist('improve_draft')}
                  disabled={copilotLoading || !replyText.trim()}
                  className="px-2.5 py-1 rounded-lg bg-indigo-900/50 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40"
                >
                  <Wand2 className="w-3 h-3" />
                  Mejorar / Persuasivo
                </button>
                {copilotLoading && (
                  <span className="text-[10px] text-purple-300 animate-pulse ml-auto">
                    Procesando con Gemini...
                  </span>
                )}
              </div>

              {/* Reply Input Form */}
              <form
                onSubmit={handleSendHumanReply}
                className="p-3 border-t border-white/10 bg-[#111827]/90 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribe tu mensaje o usa el botón 'Sugerir Respuesta' del Copiloto..."
                  className="flex-1 bg-[#0B0F17] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Selecciona una conversación a la izquierda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
