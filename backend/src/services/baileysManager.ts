import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';
import { StorageService } from './storage.js';
import { GeminiService } from './gemini.js';
import { TtsService } from './tts.js';
import { enqueueCustomerMessage, formatOwnerWhatsAppAlert } from './messageBuffer.js';
import { AntiBanShieldService } from '../antiBanShield.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSIONS_BASE_DIR = path.resolve(__dirname, '../../auth_sessions');

export type ConnectionStatus = 'disconnected' | 'connecting' | 'open' | 'qrcode';

export interface BaileysSessionState {
  businessId: string;
  status: ConnectionStatus;
  qrDataUrl: string | null;
  connectedPhone: string | null;
  pairingCode: string | null;
  sock: any | null;
  ev: EventEmitter;
  isExplicitDisconnect?: boolean;
  connectingPromise?: Promise<{ status: ConnectionStatus; qrDataUrl: string | null; connectedPhone?: string | null; pairingCode?: string | null }> | null;
}

export class BaileysManager {
  private static instance: BaileysManager;
  private sessions = new Map<string, BaileysSessionState>();
  private storage = StorageService.getInstance();
  private gemini = GeminiService.getInstance();
  private tts = TtsService.getInstance();
  private shield = AntiBanShieldService.getInstance();
  // Smart Triaging V5.6: Track bot-originated messages so Human Takeover (fromMe) only triggers when owner types on physical phone
  private botSentMessageIds = new Set<string>();
  private botOutgoingTimestamps = new Map<string, number>();

  private constructor() {
    if (!fs.existsSync(SESSIONS_BASE_DIR)) {
      fs.mkdirSync(SESSIONS_BASE_DIR, { recursive: true });
    }
  }

  public static getInstance(): BaileysManager {
    if (!BaileysManager.instance) {
      BaileysManager.instance = new BaileysManager();
    }
    return BaileysManager.instance;
  }

  private recordBotSentMessage(remoteJid: string, sentMsg?: any) {
    this.botOutgoingTimestamps.set(remoteJid, Date.now());
    if (sentMsg?.key?.id) {
      this.botSentMessageIds.add(sentMsg.key.id);
      if (this.botSentMessageIds.size > 1000) {
        const first = this.botSentMessageIds.values().next().value;
        if (first) this.botSentMessageIds.delete(first);
      }
    }
  }

  public getSessionStatus(businessId: string) {
    const session = this.sessions.get(businessId);
    if (!session) {
      return {
        status: 'disconnected' as ConnectionStatus,
        qrDataUrl: null,
        connectedPhone: null,
        pairingCode: null
      };
    }
    return {
      status: session.status,
      qrDataUrl: session.qrDataUrl,
      connectedPhone: session.connectedPhone,
      pairingCode: session.pairingCode || null
    };
  }

  /**
   * Envía un mensaje de texto desde el operador humano en la consola web a través de la sesión activa de Baileys
   */
  public async sendTextMessage(businessId: string, toPhone: string, text: string): Promise<boolean> {
    const session =
      this.sessions.get(businessId) ||
      this.sessions.get('default_business') ||
      Array.from(this.sessions.values()).find((s) => s.status === 'open');

    if (!session || !session.sock || session.status !== 'open') {
      return false;
    }

    try {
      const cleanPhone = toPhone.replace(/\D/g, '');
      if (!cleanPhone) return false;
      const targetJid = `${cleanPhone}@s.whatsapp.net`;
      this.botOutgoingTimestamps.set(targetJid, Date.now());
      const sent = await session.sock.sendMessage(targetJid, { text });
      this.recordBotSentMessage(targetJid, sent);
      return true;
    } catch (err) {
      console.error('❌ [Baileys] Error enviando respuesta humana:', err);
      return false;
    }
  }

  /**
   * Genera un código QR escaneable real usando la librería qrcode (con fallback SVG si no está disponible)
   */
  private async generateRealQrDataUrl(text: string): Promise<string> {
    try {
      const qrPkgName = 'qrcode';
      const QRCodeMod: any = await import(qrPkgName);
      const QRCode = QRCodeMod.default || QRCodeMod;
      if (QRCode && typeof QRCode.toDataURL === 'function') {
        return await QRCode.toDataURL(text, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 280,
          color: {
            dark: '#050811',
            light: '#FFFFFF'
          }
        });
      }
    } catch {
      // Fallback a generador SVG interno
    }
    return this.generateQrSvgDataUrl(text);
  }

  /**
   * Fallback SVG en base64 si qrcode no está instalado localmente
   */
  private generateQrSvgDataUrl(text: string): string {
    const hash = Array.from(text).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 1000000, 7);
    const size = 260;
    const grid = 25;
    const cellSize = size / grid;

    let rects = '';
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const isCorner =
          (r < 7 && c < 7) ||
          (r < 7 && c >= grid - 7) ||
          (r >= grid - 7 && c < 7);
        const bit = ((hash * (r + 1) * 37 + c * 19 + (r ^ c)) % 100) > 48;
        if (isCorner || bit) {
          rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0d1117"/>`;
        }
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#ffffff"/>${rects}</svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Inicia o reconecta una sesión Baileys para un negocio de forma reactiva y protegida
   */
  public async connect(businessId: string): Promise<{ status: ConnectionStatus; qrDataUrl: string | null; connectedPhone?: string | null; pairingCode?: string | null }> {
    const sessionDir = path.join(SESSIONS_BASE_DIR, businessId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    let session = this.sessions.get(businessId);
    if (session && session.status === 'open') {
      return { status: 'open', qrDataUrl: null, connectedPhone: session.connectedPhone, pairingCode: null };
    }

    // Si ya existe una promesa de conexión en progreso, reutilizarla (evita race condition y duplicación)
    if (session && session.status === 'connecting' && session.connectingPromise) {
      return session.connectingPromise;
    }

    // Limpiar socket anterior en memoria si existía
    if (session && session.sock) {
      try {
        session.sock.ev.removeAllListeners();
        session.sock.end();
      } catch {}
      session.sock = null;
    }

    if (!session) {
      session = {
        businessId,
        status: 'connecting',
        qrDataUrl: null,
        connectedPhone: null,
        pairingCode: null,
        sock: null,
        ev: new EventEmitter()
      };
      this.sessions.set(businessId, session);
    } else {
      session.status = 'connecting';
      session.qrDataUrl = null;
      session.pairingCode = null;
    }

    session.isExplicitDisconnect = false;

    const connectTask = (async () => {
      try {
        let makeWASocket: any;
        let useMultiFileAuthState: any;
        let DisconnectReason: any;
        let fetchLatestBaileysVersion: any;
        let pinoLogger: any;

        try {
          const pkgName = '@whiskeysockets/baileys';
          const baileysMod = await import(pkgName);
          makeWASocket = baileysMod.default?.default || baileysMod.default?.makeWASocket || baileysMod.makeWASocket || baileysMod.default;
          useMultiFileAuthState = baileysMod.useMultiFileAuthState || baileysMod.default?.useMultiFileAuthState;
          DisconnectReason = baileysMod.DisconnectReason || baileysMod.default?.DisconnectReason;
          fetchLatestBaileysVersion = baileysMod.fetchLatestBaileysVersion || baileysMod.default?.fetchLatestBaileysVersion;

          try {
            const pinoName = 'pino';
            const pinoMod: any = await import(pinoName);
            const pinoFn = pinoMod.default?.default || pinoMod.default || pinoMod;
            pinoLogger = pinoFn({ level: 'silent' });
          } catch {}
        } catch (importErr) {
          console.error('❌ Error importando @whiskeysockets/baileys:', importErr);
        }

        if (makeWASocket && useMultiFileAuthState) {
          const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

          let versionConfig: any = {};
          if (typeof fetchLatestBaileysVersion === 'function') {
            try {
              const { version } = await fetchLatestBaileysVersion();
              if (version) versionConfig = { version };
            } catch {}
          }

          const sock = makeWASocket({
            ...versionConfig,
            auth: state,
            printQRInTerminal: false,
            logger: pinoLogger,
            browser: ['VOXA IA (Vene Turco)', 'Chrome', '122.0.0'],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000
          });

          session!.sock = sock;

          sock.ev.on('creds.update', saveCreds);

          // Promesa que resuelve en cuanto llega el QR o se abre la sesión (hasta 12s)
          const waitForInitialQrOrOpen = new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, 12000);
            session!.ev.once('ready_or_qr', () => {
              clearTimeout(timer);
              resolve();
            });
          });

          sock.ev.on('connection.update', async (update: any) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
              session!.status = 'qrcode';
              session!.qrDataUrl = await this.generateRealQrDataUrl(qr);
              session!.ev.emit('ready_or_qr');
              console.log(`📱 [Baileys] Nuevo QR escaneable generado para negocio: ${businessId}`);
            }

            if (connection === 'close') {
              const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
              const isLoggedOut = statusCode === DisconnectReason?.loggedOut;
              session!.status = 'disconnected';
              session!.qrDataUrl = null;

              if (isLoggedOut) {
                console.log(`🔒 [Baileys] Sesión desvinculada en el teléfono móvil (${businessId}). Purgando credenciales locales...`);
                try {
                  fs.rmSync(sessionDir, { recursive: true, force: true });
                } catch (e) {}
              } else if (!session!.isExplicitDisconnect) {
                console.log(`🔄 [Baileys] Desconexión temporal (${statusCode}). Reintentando en 3s...`);
                setTimeout(() => this.connect(businessId), 3000);
              }
            } else if (connection === 'open') {
              session!.status = 'open';
              session!.qrDataUrl = null;
              session!.pairingCode = null;
              session!.connectedPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Conectado';
              session!.ev.emit('ready_or_qr');
              console.log(`✅ [Baileys] WhatsApp Conectado exitosamente (${session!.connectedPhone}) para ${businessId}`);
            }
          });

        // Intercepción de llamadas (sock.rejectCall)
        sock.ev.on('call', async (calls: any[]) => {
          for (const call of calls) {
            if (call.status === 'offer') {
              console.log(`📞 [Baileys] Llamada entrante de ${call.from}. Rechazando y desviando...`);
              try {
                await sock.rejectCall(call.id, call.from);
              } catch (e) {
                console.warn('Error al rechazar llamada:', e);
              }

              const business = await this.storage.getBusinessConfig();
              if (business.call_forwarding_enabled) {
                const humanizedCallMsg = this.shield.humanizeFixedMessage(business.call_rejection_message);

                const check = this.shield.canSendMessage(businessId);
                if (check.allowed) {
                  this.shield.recordOutbound(businessId, humanizedCallMsg);
                  this.botOutgoingTimestamps.set(call.from, Date.now());
                  const sentCallReply = await sock.sendMessage(call.from, { text: humanizedCallMsg });
                  this.recordBotSentMessage(call.from, sentCallReply);
                } else {
                  console.warn(`🛡️ [AntiBanShield] Mensaje de llamada bloqueado por Kill Switch (riesgo: ${check.riskScore}%)`);
                }
              }
            }
          }
        });

        // Recepción de mensajes con Buffer, Presencia, CRM y Arquitectura de 4 Reglas (Smart Triaging V5.6)
        sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
          if (type !== 'notify') return;

          for (const m of messages) {
            if (!m.message) continue;

            const fromJid = m.key.remoteJid;
            // REGLA 1: Filtro Duro Cero-Costo para Grupos, Estados y Canales ($0.00 tokens)
            if (
              !fromJid ||
              fromJid.includes('@g.us') ||
              fromJid === 'status@broadcast' ||
              fromJid.includes('@broadcast') ||
              fromJid.includes('@newsletter')
            ) {
              continue;
            }

            const fromPhone = fromJid.split('@')[0];
            const waMessageId = m.key.id;
            const convId = `baileys_${fromPhone}`;
            const contactName = m.pushName || `Cliente ${fromPhone}`;
            const incomingText =
              m.message.conversation ||
              m.message.extendedTextMessage?.text ||
              m.message.imageMessage?.caption ||
              '';

            // REGLA 2: Detección Automática de Intervención Humana desde el Móvil Físico (fromMe === true)
            if (m.key.fromMe) {
              const isFromBotId = waMessageId && this.botSentMessageIds.has(waMessageId);
              const lastBotOut = this.botOutgoingTimestamps.get(fromJid) || 0;
              const isRecentBotWindow = Date.now() - lastBotOut < 5500;

              if (isFromBotId || isRecentBotWindow) {
                continue;
              }

              // El dueño escribió manualmente desde su propio celular físico -> Auto-Handover por 12 horas
              const pausedUntil = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
              console.log(
                `👤 [SmartTriaging] Dueño intervino desde su celular en ${convId}. Auto-pausando IA por 12h.`
              );

              let conv = await this.storage.getConversation(convId);
              if (!conv) {
                conv = await this.storage.saveConversation({
                  id: convId,
                  phone_or_user_id: fromPhone,
                  customer_name: contactName,
                  bot_paused: true,
                  pause_reason: 'human_takeover',
                  paused_until: pausedUntil,
                  last_message: incomingText || 'Mensaje enviado desde el móvil',
                  last_message_at: new Date().toISOString(),
                  unread_by_human: false,
                  channel: 'whatsapp',
                  created_at: new Date().toISOString()
                });
              } else {
                await this.storage.setBotPaused(convId, true, 'human_takeover', pausedUntil);
              }

              if (incomingText) {
                await this.storage.saveMessage({
                  id: 'msg_hum_mobile_' + Date.now(),
                  wa_message_id: waMessageId,
                  conversation_id: convId,
                  sender: 'human_agent',
                  type: 'text',
                  content: incomingText,
                  created_at: new Date().toISOString()
                });
              }
              continue;
            }

            // Deduplicación de mensajes entrantes del contacto
            if (await this.storage.isMessageProcessed(waMessageId)) continue;
            await this.storage.markMessageProcessed(waMessageId);

            // Factor 3: Registrar mensaje entrante en VENE TURCO SHIELD
            this.shield.recordInbound(businessId, incomingText);

            // Obtener o crear conversación
            let conv = await this.storage.getConversation(convId);
            if (!conv) {
              conv = await this.storage.saveConversation({
                id: convId,
                phone_or_user_id: fromPhone,
                customer_name: contactName,
                bot_paused: false,
                last_message: incomingText || 'Mensaje entrante',
                last_message_at: new Date().toISOString(),
                unread_by_human: true,
                channel: 'whatsapp',
                created_at: new Date().toISOString()
              });
            } else {
              conv.last_message = incomingText || 'Mensaje multimedia';
              conv.last_message_at = new Date().toISOString();
              await this.storage.saveConversation(conv);
            }

            // REGLA 4: Detector de Semilla Comercial
            const hasCommercialSeed =
              /(vi su cat[aá]logo|vi el cat[aá]logo|quiero informaci[oó]n|precio|cat[aá]logo|costo|disponible|pedido|agendar cita|comprar)/i.test(
                incomingText
              );

            if (hasCommercialSeed && conv.bot_paused && conv.pause_reason === 'personal_contact') {
              console.log(
                `🟢 [SmartTriaging] Contacto ${fromPhone} envió palabra semilla comercial. Reactivando modo cliente.`
              );
              await this.storage.setBotPaused(convId, false);
              conv.bot_paused = false;
            }

            // Verificar si una pausa automática por intervención móvil ya cumplió sus 12 horas
            if (conv.bot_paused && conv.paused_until) {
              if (new Date(conv.paused_until).getTime() < Date.now()) {
                console.log(`⏰ [SmartTriaging] Expiró ventana de 12h en ${convId}. Reactivando IA.`);
                await this.storage.setBotPaused(convId, false);
                conv.bot_paused = false;
              }
            }

            // Respetar Human Handover o Lista Blanca de Contactos Personales ($0.00 tokens)
            const isKnownPersonal = !hasCommercialSeed && (await this.storage.isPersonalContact(fromPhone));
            if (conv.bot_paused || isKnownPersonal) {
              console.log(
                `⏸️ [SmartTriaging] Chat en silencio (${conv.pause_reason || 'personal_contact'}) para ${convId}. Cero gasto de tokens.`
              );
              await this.storage.saveMessage({
                id: 'msg_' + Date.now(),
                wa_message_id: waMessageId,
                conversation_id: convId,
                sender: 'customer',
                type: 'text',
                content: incomingText || 'Mensaje multimedia',
                created_at: new Date().toISOString()
              });
              continue;
            }

            // Guardar el mensaje entrante del cliente en el historial antes del buffer
            await this.storage.saveMessage({
              id: 'msg_in_' + Date.now(),
              wa_message_id: waMessageId,
              conversation_id: convId,
              sender: 'customer',
              type: 'text',
              content: incomingText || 'Mensaje multimedia',
              created_at: new Date().toISOString()
            });

            // Encolar en el buffer antirráfagas de 4.5s
            enqueueCustomerMessage(
              businessId,
              fromPhone,
              { text: incomingText, waMessageId },
              async (combined) => {
                const business = await this.storage.getBusinessConfig();
                const history = await this.storage.getMessages(convId);
                const lead = await this.storage.getLead(fromPhone);

                // Consultar VENE TURCO SHIELD antes de enviar
                const shieldCheck = this.shield.canSendMessage(businessId);
                if (!shieldCheck.allowed) {
                  console.warn(`🛡️ [AntiBanShield] Bloqueo de envío a ${fromPhone}: ${shieldCheck.reason}`);
                  return 'Envío suspendido preventivamente por el Escudo Anti-Baneo.';
                }

                // Llamada Single-Pass a Gemini 2.5 Flash
                const geminiResponse = await this.gemini.analyzeAndRespond({
                  business,
                  conversationHistory: history,
                  incomingMessage: { text: combined.combinedText },
                  currentLead: lead
                });

                // REGLA 3: Si Gemini detecta que es un amigo/familiar/chat personal y el filtro está activo
                if (
                  business.smart_personal_filter !== false &&
                  (geminiResponse.is_business_inquiry === false ||
                    geminiResponse.action === 'silencio_personal' ||
                    geminiResponse.intent_classification === 'personal_o_ajeno')
                ) {
                  console.log(
                    `🤫 [SmartTriaging] Mensaje de ${fromPhone} clasificado como PERSONAL/AJENO. Silenciando bot y agregando a memoria personal.`
                  );
                  await this.storage.markPersonalContact(fromPhone, true);
                  await this.storage.setBotPaused(convId, true, 'personal_contact');
                  try {
                    await sock.sendPresenceUpdate('paused', fromJid);
                  } catch (e) {}
                  return '';
                }

                // Actualizar ficha CRM Invisible del cliente
                const crm = geminiResponse.crm_profile;
                await this.storage.saveLead({
                  phone_or_user_id: fromPhone,
                  customer_name: crm.customer_name || lead?.customer_name || contactName,
                  need_or_vehicle_or_symptom:
                    crm.need_or_vehicle_or_symptom || lead?.need_or_vehicle_or_symptom,
                  address_or_zone: crm.address_or_zone || lead?.address_or_zone,
                  main_objection: crm.main_objection || lead?.main_objection,
                  buying_score: geminiResponse.buying_score,
                  last_intent: geminiResponse.intent_classification,
                  sentiment: geminiResponse.customer_sentiment,
                  missing_information: geminiResponse.missing_information
                });

                // Guardar Transacción Bimoneda si aplica (Pedido, Cita o Comprobante)
                if (geminiResponse.transaction_draft || geminiResponse.action === 'validar_pago') {
                  const draft = geminiResponse.transaction_draft || {};
                  let txType: 'pedido' | 'cita' | 'comprobante_pago' = 'pedido';
                  if (geminiResponse.action === 'confirmar_cita' || draft.type === 'cita') txType = 'cita';
                  if (geminiResponse.action === 'validar_pago' || draft.type === 'comprobante_pago')
                    txType = 'comprobante_pago';

                  const rate = business.bcv_rate || 52.4;
                  const rawAmount = draft.detected_amount || draft.total || 0;
                  const isVes =
                    draft.detected_currency === 'VES' ||
                    (txType === 'comprobante_pago' && rawAmount > 150);

                  const amountUsd = isVes ? Number((rawAmount / rate).toFixed(2)) : rawAmount;
                  const amountVes = isVes ? rawAmount : Number((rawAmount * rate).toFixed(2));

                  await this.storage.saveTransaction({
                    conversation_id: convId,
                    phone_or_user_id: fromPhone,
                    customer_name: crm.customer_name || contactName,
                    type: txType,
                    details: draft,
                    status: 'pendiente_de_verificacion',
                    amount: amountUsd,
                    amount_ves: amountVes,
                    amount_usd_equiv: amountUsd,
                    bcv_rate_applied: rate,
                    reference_number: draft.reference_number || undefined
                  });
                }

                const isVoiceMode = business.response_mode === 'voice';

                // Factor 5: Retardo Camaleón Dinámico con jitter orgánico
                const delayMs = this.shield.getRecommendedDelayMs(60, shieldCheck.riskScore);

                try {
                  await sock.sendPresenceUpdate(isVoiceMode ? 'recording' : 'composing', fromJid);
                } catch (e) {}

                if (delayMs > 0) {
                  await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 6000)));
                }

                // Registrar mensaje saliente en el Escudo Anti-Baneo
                this.shield.recordOutbound(businessId, geminiResponse.reply_to_customer);

                // Enviar respuesta al cliente registrando el ID para no disparar el auto-handover
                this.botOutgoingTimestamps.set(fromJid, Date.now());
                const sentMsg = await sock.sendMessage(fromJid, { text: geminiResponse.reply_to_customer });
                this.recordBotSentMessage(fromJid, sentMsg);
                await sock.sendPresenceUpdate('paused', fromJid);

                // Guardar mensaje del bot y actualizar conversación
                await this.storage.saveMessage({
                  id: 'msg_bot_' + Date.now(),
                  conversation_id: convId,
                  sender: 'bot',
                  type: 'text',
                  content: geminiResponse.reply_to_customer,
                  created_at: new Date().toISOString(),
                  metadata: {
                    intent: geminiResponse.intent_classification,
                    buying_score: geminiResponse.buying_score,
                    action: geminiResponse.action,
                    owner_alert_message: geminiResponse.owner_alert_message || undefined,
                    customer_sentiment: geminiResponse.customer_sentiment,
                    detected_language: geminiResponse.detected_language,
                    knowledge_found: geminiResponse.knowledge_found
                  }
                });

                if (conv) {
                  await this.storage.saveConversation({
                    ...conv,
                    last_message: geminiResponse.reply_to_customer,
                    last_message_at: new Date().toISOString(),
                    sentiment: geminiResponse.customer_sentiment
                  });
                }

                // Notificar al dueño si score >= 80 con enlace de 1 clic wa.me
                if (business.owner_phone && (geminiResponse.buying_score >= 80 || geminiResponse.owner_alert_message)) {
                  const alertMsg = formatOwnerWhatsAppAlert(fromPhone, geminiResponse);
                  const ownerJid = `${business.owner_phone.replace(/\D/g, '')}@s.whatsapp.net`;
                  this.botOutgoingTimestamps.set(ownerJid, Date.now());
                  const sentOwner = await sock.sendMessage(ownerJid, { text: alertMsg }).catch(() => null);
                  if (sentOwner) this.recordBotSentMessage(ownerJid, sentOwner);
                }

                return geminiResponse.reply_to_customer;
              }
            );
          }
        });

        await waitForInitialQrOrOpen;
        return {
          status: session!.status,
          qrDataUrl: session!.qrDataUrl,
          connectedPhone: session!.connectedPhone,
          pairingCode: session!.pairingCode
        };
      } else {
        // Fallback si no fue posible inicializar el socket nativo
        session.status = 'disconnected' as ConnectionStatus;
        session.qrDataUrl = null;
        return { status: 'disconnected' as ConnectionStatus, qrDataUrl: null };
      }
    } catch (err) {
      console.error('❌ Error en sesión Baileys:', err);
      session.status = 'disconnected' as ConnectionStatus;
      session.qrDataUrl = null;
      return { status: 'disconnected' as ConnectionStatus, qrDataUrl: null };
    } finally {
      session.connectingPromise = null;
    }
  })();

  session.connectingPromise = connectTask;
  return connectTask;
}

  /**
   * Solicita un Código de Emparejamiento de 8 dígitos para vincular WhatsApp sin cámara
   */
  public async requestPairingCode(businessId: string, phoneNumber: string): Promise<{ success: boolean; pairingCode?: string; error?: string }> {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      return { success: false, error: 'Número de teléfono inválido para emparejamiento.' };
    }

    let session = this.sessions.get(businessId);
    if (!session || !session.sock || session.status !== 'qrcode') {
      // Iniciar conexión primero si no existe
      await this.connect(businessId);
      session = this.sessions.get(businessId);
    }

    if (!session || !session.sock) {
      return { success: false, error: 'No se pudo inicializar el socket para solicitar el código.' };
    }

    try {
      if (typeof session.sock.requestPairingCode === 'function') {
        const code = await session.sock.requestPairingCode(cleanPhone);
        session.pairingCode = code;
        console.log(`🔑 [Baileys] Código de vinculación generado para ${cleanPhone}: ${code}`);
        return { success: true, pairingCode: code };
      } else {
        return { success: false, error: 'La versión de Baileys instalada no soporta requestPairingCode.' };
      }
    } catch (err: any) {
      console.error('❌ [Baileys] Error solicitando código de emparejamiento:', err);
      return { success: false, error: err.message || 'Error al solicitar código a WhatsApp' };
    }
  }

  /**
   * Cierra la sesión y limpia las credenciales de auth_sessions/:businessId
   */
  public async disconnect(businessId: string): Promise<boolean> {
    const session = this.sessions.get(businessId);
    if (session) {
      session.isExplicitDisconnect = true;
      try {
        if (session.sock) {
          session.sock.ev.removeAllListeners();
          session.sock.end(new Error('Sesión finalizada por el usuario'));
        }
      } catch (e) {}

      session.status = 'disconnected';
      session.qrDataUrl = null;
      session.connectedPhone = null;
      session.pairingCode = null;
      this.sessions.delete(businessId);
    }

    const sessionDir = path.join(SESSIONS_BASE_DIR, businessId);
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log(`🗑️ [Baileys] Sesión limpiada en disco: ${sessionDir}`);
      } catch (e) {
        console.warn('Error limpiando sessionDir:', e);
      }
    }

    return true;
  }
}
