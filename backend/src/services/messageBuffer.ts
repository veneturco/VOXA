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

// Control de flujo y Rate Limiting por WhatsApp user (remoteJid / phone)
interface UserRateRecord {
  timestamps: number[];
  cooldownUntil: number;
}

const activeBuffers = new Map<string, BufferEntry>();
const conversationMemory = new Map<string, string[]>();
const userRateLimits = new Map<string, UserRateRecord>();

// Límites de seguridad contra draining de cuota de Gemini API
const MAX_MESSAGES_PER_MINUTE = 10;
const COOLDOWN_DURATION_MS = 60 * 1000; // 1 minuto de penalización si abusan
const MAX_STORED_USERS = 500; // Prevenir memory leak en RAM

export interface EnqueueMessagePayload {
  text?: string;
  audioBuffer?: Buffer;
  audioMimeType?: string;
  imageBuffer?: Buffer;
  imageMimeType?: string;
  waMessageId?: string;
}

/**
 * Valida si un usuario de WhatsApp excedió el límite de mensajes por minuto
 */
export function checkUserRateLimit(userId: string): { allowed: boolean; remainingCooldownMs: number } {
  const now = Date.now();
  let record = userRateLimits.get(userId);

  if (!record) {
    // Si la memoria supera el tamaño máximo, limpiar registros antiguos (TTL)
    if (userRateLimits.size > MAX_STORED_USERS) {
      for (const [key, val] of userRateLimits.entries()) {
        if (now - (val.timestamps[val.timestamps.length - 1] || 0) > 300000) {
          userRateLimits.delete(key);
        }
      }
    }
    record = { timestamps: [now], cooldownUntil: 0 };
    userRateLimits.set(userId, record);
    return { allowed: true, remainingCooldownMs: 0 };
  }

  // Si está en período de enfriamiento (cooldown)
  if (record.cooldownUntil > now) {
    return { allowed: false, remainingCooldownMs: record.cooldownUntil - now };
  }

  // Filtrar timestamps de los últimos 60 segundos
  record.timestamps = record.timestamps.filter(t => now - t < 60000);
  record.timestamps.push(now);

  if (record.timestamps.length > MAX_MESSAGES_PER_MINUTE) {
    record.cooldownUntil = now + COOLDOWN_DURATION_MS;
    console.warn(`🛡️ [RateLimit WhatsApp] Usuario ${userId.slice(0, 8)}*** excedió ${MAX_MESSAGES_PER_MINUTE} msgs/min. Pausando por 60s.`);
    return { allowed: false, remainingCooldownMs: COOLDOWN_DURATION_MS };
  }

  return { allowed: true, remainingCooldownMs: 0 };
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
  // Limitar longitud de texto entrante por ráfaga (Anti-DoS y Prompt Bloat)
  if (payload.text && payload.text.length > 3000) {
    payload.text = payload.text.slice(0, 3000);
  }

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
 * Conserva estrictamente los últimos 10 mensajes para optimizar tokens y contexto (Anti-Memory Leak)
 */
export function appendHistory(key: string, role: string, content: string): void {
  // Limpieza preventiva de memoria si hay demasiadas conversaciones inactivas
  if (conversationMemory.size > 1000) {
    const keys = Array.from(conversationMemory.keys());
    for (let i = 0; i < 200; i++) {
      conversationMemory.delete(keys[i]);
    }
  }

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
