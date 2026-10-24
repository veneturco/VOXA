import express, { Request, Response } from 'express';
import axios from 'axios';
import { StorageService } from '../services/storage.js';
import { GeminiService } from '../services/gemini.js';
import { TtsService } from '../services/tts.js';
import { WhatsAppService } from '../services/whatsapp.js';
import { enqueueCustomerMessage, formatOwnerWhatsAppAlert } from '../services/messageBuffer.js';

export const webhookRouter = express.Router();
const storage = StorageService.getInstance();
const gemini = GeminiService.getInstance();
const tts = TtsService.getInstance();
const whatsapp = WhatsAppService.getInstance();

/**
 * Meta WhatsApp Webhook Verification Challenge (GET)
 */
webhookRouter.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_WA_VERIFY_TOKEN || 'spoki_webhook_token_secure_2025';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ [Webhook] Meta verification challenge accepted successfully.');
    return res.status(200).send(challenge);
  }

  console.warn('❌ [Webhook] Meta verification token mismatch.');
  return res.status(403).send('Forbidden');
});

/**
 * Meta WhatsApp Inbound Event Dispatcher (POST)
 */
webhookRouter.post('/', async (req: Request, res: Response) => {
  // Acknowledge receipt to Meta immediately (prevents duplicate retries)
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    if (!change) return;

    // Check for WhatsApp Calling API Events
    if (change.calls && change.calls.length > 0) {
      const call = change.calls[0];
      const callerPhone = call.from;
      console.log(`📞 [Webhook] Inbound call received from ${callerPhone}`);

      const business = await storage.getBusinessConfig();
      if (business.call_forwarding_enabled) {
        let ttsAudioUrl: string | undefined;
        const ttsResult = await tts.synthesizeTextToAudio(
          business.call_rejection_message,
          business.voice_name,
          true
        );
        if (ttsResult) ttsAudioUrl = ttsResult.audioUrl;

        await whatsapp.handleCallIntercept(callerPhone, business.call_rejection_message, ttsAudioUrl);

        // Record call in DB
        const convId = `wa_${callerPhone}`;
        await storage.saveMessage({
          id: 'call_meta_' + Date.now(),
          conversation_id: convId,
          sender: 'bot',
          type: 'call_intercepted',
          content: `📞 LLAMADA RECHAZADA Y DESVIADA:\n"${business.call_rejection_message}"`,
          audio_url: ttsAudioUrl,
          created_at: new Date().toISOString()
        });
      }
      return;
    }

    // Process incoming message
    const messages = change.messages;
    if (!messages || messages.length === 0) {
      return;
    }

    const msg = messages[0];
    const waMessageId = msg.id;
    const fromPhone = msg.from;
    const contactName = change.contacts?.[0]?.profile?.name || 'Cliente WhatsApp';

    // 1. Mandatory Deduplication Check
    if (await storage.isMessageProcessed(waMessageId)) {
      console.log(`⚠️ [Webhook] Skipping duplicate message id: ${waMessageId}`);
      return;
    }
    await storage.markMessageProcessed(waMessageId);

    const convId = `wa_${fromPhone}`;
    let conv = await storage.getConversation(convId);
    if (!conv) {
      conv = await storage.saveConversation({
        id: convId,
        phone_or_user_id: fromPhone,
        customer_name: contactName,
        bot_paused: false,
        last_message: 'Mensaje entrante',
        last_message_at: new Date().toISOString(),
        unread_by_human: true,
        channel: 'whatsapp',
        created_at: new Date().toISOString()
      });
    }

    // 2. Check if Human Handover is active
    if (conv.bot_paused) {
      console.log(`⏸️ [Webhook] Bot is paused for conversation ${convId}. Message recorded for human agent.`);
      let content = '';
      if (msg.type === 'text') content = msg.text.body;
      else if (msg.type === 'audio') content = 'Nota de voz enviada';
      else if (msg.type === 'image') content = 'Imagen enviada';

      await storage.saveMessage({
        id: 'msg_' + Date.now(),
        wa_message_id: waMessageId,
        conversation_id: convId,
        sender: 'customer',
        type: msg.type === 'audio' ? 'audio' : msg.type === 'image' ? 'image' : 'text',
        content,
        created_at: new Date().toISOString()
      });
      return;
    }

    // 3. Extract text, audio, or image payload
    let incomingText: string | undefined;
    let audioBuffer: Buffer | undefined;
    let audioMimeType: string | undefined;
    let imageBuffer: Buffer | undefined;
    let imageMimeType: string | undefined;

    const accessToken = process.env.META_WA_ACCESS_TOKEN;

    if (msg.type === 'text') {
      incomingText = msg.text.body;
    } else if (msg.type === 'audio' && accessToken) {
      try {
        const mediaId = msg.audio.id;
        const mediaMeta = await axios.get(`https://graph.facebook.com/v21.0/${mediaId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const mediaUrl = mediaMeta.data?.url;
        if (mediaUrl) {
          const dl = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          audioBuffer = Buffer.from(dl.data);
          audioMimeType = msg.audio.mime_type || 'audio/ogg';
        }
      } catch (err) {
        console.error('❌ [Webhook] Error downloading audio media:', err);
      }
    } else if (msg.type === 'image' && accessToken) {
      try {
        const mediaId = msg.image.id;
        const mediaMeta = await axios.get(`https://graph.facebook.com/v21.0/${mediaId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const mediaUrl = mediaMeta.data?.url;
        if (mediaUrl) {
          const dl = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          imageBuffer = Buffer.from(dl.data);
          imageMimeType = msg.image.mime_type || 'image/jpeg';
        }
      } catch (err) {
        console.error('❌ [Webhook] Error downloading image media:', err);
      }
    }

    // Save incoming message
    await storage.saveMessage({
      id: 'msg_in_' + Date.now(),
      wa_message_id: waMessageId,
      conversation_id: convId,
      sender: 'customer',
      type: audioBuffer ? 'audio' : imageBuffer ? 'image' : 'text',
      content: incomingText || (audioBuffer ? 'Nota de voz' : 'Imagen/Comprobante'),
      created_at: new Date().toISOString()
    });

    // Enqueue message in the 4.5s burst buffer to group multiple rapid messages into a single Gemini call
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID || 'spoki_phone';
    enqueueCustomerMessage(
      phoneId,
      fromPhone,
      {
        text: incomingText,
        audioBuffer,
        audioMimeType,
        imageBuffer,
        imageMimeType,
        waMessageId
      },
      async (combined) => {
        const business = await storage.getBusinessConfig();
        const history = await storage.getMessages(convId);
        const lead = await storage.getLead(fromPhone);

        // 4. Single-Pass Execution with Gemini 2.5 Flash
        const geminiResponse = await gemini.analyzeAndRespond({
          business,
          conversationHistory: history,
          incomingMessage: {
            text: combined.combinedText || undefined,
            audioBuffer: combined.audioBuffer,
            audioMimeType: combined.audioMimeType,
            imageBuffer: combined.imageBuffer,
            imageMimeType: combined.imageMimeType
          },
          currentLead: lead
        });

        // Update CRM Lead
        const crm = geminiResponse.crm_profile;
        await storage.saveLead({
          phone_or_user_id: fromPhone,
          customer_name: crm.customer_name || lead?.customer_name || contactName,
          need_or_vehicle_or_symptom: crm.need_or_vehicle_or_symptom || lead?.need_or_vehicle_or_symptom,
          address_or_zone: crm.address_or_zone || lead?.address_or_zone,
          main_objection: crm.main_objection || lead?.main_objection,
          buying_score: geminiResponse.buying_score,
          last_intent: geminiResponse.intent_classification,
          missing_information: geminiResponse.missing_information
        });

        // Save transaction if draft is generated
        if (geminiResponse.transaction_draft || geminiResponse.action === 'validar_pago') {
          const draft = geminiResponse.transaction_draft || {};
          let txType: 'pedido' | 'cita' | 'comprobante_pago' = 'pedido';
          if (geminiResponse.action === 'confirmar_cita' || draft.type === 'cita') txType = 'cita';
          if (geminiResponse.action === 'validar_pago' || draft.type === 'comprobante_pago' || combined.imageBuffer) txType = 'comprobante_pago';

          await storage.saveTransaction({
            conversation_id: convId,
            phone_or_user_id: fromPhone,
            customer_name: crm.customer_name || contactName,
            type: txType,
            details: draft,
            status: 'pendiente_de_verificacion',
            amount: draft.detected_amount || draft.total,
            reference_number: draft.reference_number
          });
        }

        // 5. Send reply via WhatsApp
        const isVoiceReply =
          business.response_mode === 'voice' ||
          (business.response_mode === 'mirror' && !!combined.audioBuffer);

        let replyAudioUrl: string | undefined;

        if (isVoiceReply) {
          const ttsResult = await tts.synthesizeTextToAudio(
            geminiResponse.reply_to_customer,
            business.voice_name,
            true
          );
          if (ttsResult) {
            replyAudioUrl = ttsResult.audioUrl;
            await whatsapp.sendAudioMessage(fromPhone, replyAudioUrl);
          } else {
            await whatsapp.sendTextMessage(fromPhone, geminiResponse.reply_to_customer);
          }
        } else {
          await whatsapp.sendTextMessage(fromPhone, geminiResponse.reply_to_customer);
        }

        // Record Bot reply in DB
        await storage.saveMessage({
          id: 'msg_bot_' + Date.now(),
          conversation_id: convId,
          sender: 'bot',
          type: replyAudioUrl ? 'audio' : 'text',
          content: geminiResponse.reply_to_customer,
          audio_url: replyAudioUrl,
          created_at: new Date().toISOString(),
          metadata: {
            intent: geminiResponse.intent_classification,
            buying_score: geminiResponse.buying_score,
            action: geminiResponse.action,
            owner_alert_message: geminiResponse.owner_alert_message || undefined
          }
        });

        // Notify owner if alert is generated or score >= 80 using 1-click wa.me format
        if (business.owner_phone && (geminiResponse.buying_score >= 80 || geminiResponse.owner_alert_message)) {
          const ownerAlert = formatOwnerWhatsAppAlert(fromPhone, geminiResponse);
          await whatsapp.sendTextMessage(business.owner_phone, ownerAlert);
        }

        return geminiResponse.reply_to_customer;
      }
    );
  } catch (err: any) {
    console.error('❌ [Webhook] Processing error:', err);
  }
});
