import { GeminiMasterResponse } from '../types/index.js';

interface BufferEntry {
  messages: Array<{
    text?: string;
    audioBuffer?: Buffer;
    audioMimeType?: string;
    imageBuffer?: Buffer;
    imageMimeType?: string;
    waMessageId?: string;
  }>;
  timer: NodeJS.Timeout;
}

const activeBuffers = new Map<string, BufferEntry>();
const conversationMemory = new Map<string, string[]>();

export interface EnqueueMessagePayload {
  text?: string;
  audioBuffer?: Buffer;
  audioMimeType?: string;
  imageBuffer?: Buffer;
  imageMimeType?: string;
  waMessageId?: string;
}

/**
 * Agrupa mensajes enviados en ráfaga por un mismo cliente durante delayMs (default 4.5s)
 * evitando llamadas redundantes a Gemini y permitiendo responder a ráfagas en una sola pasada.
 */
export function enqueueCustomerMessage(
  phoneId: string,
  customerPhone: string,
  payload: EnqueueMessagePayload,
  processCallback: (combinedPayload: {
    combinedText: string;
    audioBuffer?: Buffer;
    audioMimeType?: string;
    imageBuffer?: Buffer;
    imageMimeType?: string;
    allWaMessageIds: string[];
  }, history: string[]) => Promise<string | null>,
  delayMs = 4500
): void {
  const key = `${phoneId}_${customerPhone}`;

  if (activeBuffers.has(key)) {
    const existing = activeBuffers.get(key)!;
    existing.messages.push(payload);
    clearTimeout(existing.timer);

    existing.timer = setTimeout(() => {
      flushBuffer(key, phoneId, customerPhone, processCallback);
    }, delayMs);
  } else {
    const timer = setTimeout(() => {
      flushBuffer(key, phoneId, customerPhone, processCallback);
    }, delayMs);

    activeBuffers.set(key, {
      messages: [payload],
      timer
    });
  }
}

async function flushBuffer(
  key: string,
  phoneId: string,
  customerPhone: string,
  processCallback: (combinedPayload: {
    combinedText: string;
    audioBuffer?: Buffer;
    audioMimeType?: string;
    imageBuffer?: Buffer;
    imageMimeType?: string;
    allWaMessageIds: string[];
  }, history: string[]) => Promise<string | null>
): Promise<void> {
  const entry = activeBuffers.get(key);
  activeBuffers.delete(key);
  if (!entry || entry.messages.length === 0) return;

  // Unir todos los fragmentos de texto enviados en ráfaga
  const textParts = entry.messages
    .map(m => m.text?.trim())
    .filter((t): t is string => Boolean(t && t.length > 0));
  const combinedText = textParts.join(' | ');

  // Extraer el último audio o imagen si existe en la ráfaga
  const lastAudio = [...entry.messages].reverse().find(m => m.audioBuffer);
  const lastImage = [...entry.messages].reverse().find(m => m.imageBuffer);

  const allWaMessageIds = entry.messages
    .map(m => m.waMessageId)
    .filter((id): id is string => Boolean(id));

  const history = getRecentHistory(key);

  const aiReply = await processCallback(
    {
      combinedText,
      audioBuffer: lastAudio?.audioBuffer,
      audioMimeType: lastAudio?.audioMimeType,
      imageBuffer: lastImage?.imageBuffer,
      imageMimeType: lastImage?.imageMimeType,
      allWaMessageIds
    },
    history
  );

  if (aiReply) {
    if (combinedText) {
      appendHistory(key, 'Cliente', combinedText);
    }
    appendHistory(key, 'Asistente', aiReply);
  }
}

/**
 * Retorna los últimos turnos en memoria del cliente
 */
export function getRecentHistory(key: string): string[] {
  return conversationMemory.get(key) || [];
}

/**
 * Conserva únicamente los últimos 10 mensajes para optimizar tokens y contexto
 */
export function appendHistory(key: string, role: string, content: string): void {
  const current = conversationMemory.get(key) || [];
  current.push(`${role}: ${content}`);
  if (current.length > 10) current.shift();
  conversationMemory.set(key, current);
}

/**
 * Generador de Alerta Ejecutiva con enlace wa.me de 1 clic para el dueño del negocio
 */
export function formatOwnerWhatsAppAlert(customerPhone: string, aiDecision: GeminiMasterResponse): string {
  const cleanPhone = customerPhone.replace(/\D/g, '');
  const customerName = aiDecision.crm_profile?.customer_name || 'Cliente';
  const need = aiDecision.crm_profile?.need_or_vehicle_or_symptom || 'Consulta activa';

  return [
    `🔥 *CLIENTE LISTO (${aiDecision.buying_score}/100)*`,
    `👤 *Nombre:* ${customerName}`,
    `📌 *Busca:* ${need}`,
    `🎯 *Acción:* ${aiDecision.action.toUpperCase()}`,
    `💡 *Nota IA:* ${aiDecision.owner_alert_message || 'Listo para concretar'}`,
    ``,
    `👉 *Toca aquí para hablarle directo:*`,
    `https://wa.me/${cleanPhone}`
  ].join('\n');
}
