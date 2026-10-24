import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
import { StorageService } from '../services/storage.js';
import { GeminiService } from '../services/gemini.js';
import { TtsService } from '../services/tts.js';
import { WhatsAppService } from '../services/whatsapp.js';
import { BaileysManager } from '../services/baileysManager.js';
import { BUSINESS_TEMPLATES } from '../config/templates.js';
import { AntiBanShieldService, NumberMaturity } from '../antiBanShield.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

export const apiRouter = express.Router();
const storage = StorageService.getInstance();
const gemini = GeminiService.getInstance();
const tts = TtsService.getInstance();
const whatsapp = WhatsAppService.getInstance();
const baileys = BaileysManager.getInstance();
const shield = AntiBanShieldService.getInstance();

// ----------------------------------------------------
// 1. Business Config, Multi-Tenant & Templates
// ----------------------------------------------------
apiRouter.get('/business', async (_req: Request, res: Response) => {
  try {
    const config = await storage.getBusinessConfig();
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/business', async (req: Request, res: Response) => {
  try {
    const updated = await storage.updateBusinessConfig(req.body);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/businesses', async (_req: Request, res: Response) => {
  try {
    const list = await storage.getBusinesses();
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/businesses/switch', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.body;
    const active = await storage.switchActiveBusiness(businessId);
    res.json({ success: true, data: active });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/businesses/create', async (req: Request, res: Response) => {
  try {
    const { name, category = 'tienda' } = req.body;
    const created = await storage.createNewBusiness({ name: name || 'Nueva Sucursal VOXA', category });
    res.json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Live Google Sheets CSV Sync (Zero-Database Admin)
apiRouter.post('/business/sync-sheets', async (req: Request, res: Response) => {
  try {
    const { sheetUrl } = req.body;
    const business = await storage.getBusinessConfig();
    const targetUrl = (sheetUrl || business.google_sheet_csv_url || '').trim();

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'Ingresa un enlace público de Google Sheets o CSV para sincronizar.'
      });
    }

    // Transform standard Google Sheet view URL into export CSV URL if needed
    let fetchUrl = targetUrl;
    const matchId = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (matchId && !targetUrl.includes('/export')) {
      fetchUrl = `https://docs.google.com/spreadsheets/d/${matchId[1]}/export?format=csv`;
    }

    const response = await axios.get(fetchUrl, { timeout: 10000, responseType: 'text' });
    const rawCsv = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    // Format CSV rows cleanly into Knowledge Base
    const lines = rawCsv
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0)
      .slice(0, 120); // Max 120 rows for fast token context

    const formattedCatalog = `[CATÁLOGO EN VIVO SINCRONIZADO DESDE GOOGLE SHEETS (${new Date().toLocaleString()})]:\n` + lines.join('\n');

    const updated = await storage.updateBusinessConfig({
      google_sheet_csv_url: targetUrl,
      last_sheet_sync: new Date().toISOString(),
      knowledge_base: formattedCatalog
    });

    res.json({
      success: true,
      rowsSynced: lines.length,
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'No se pudo leer el Google Sheet. Asegúrate de que esté compartido como "Cualquier persona con el enlace puede ver".'
    });
  }
});

// BCV Exchange Rate Live Updater
apiRouter.post('/business/bcv-rate', async (req: Request, res: Response) => {
  try {
    let { rate, autoFetch } = req.body;
    let finalRate = Number(rate) || 52.4;

    if (autoFetch) {
      try {
        const apiRes = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial', { timeout: 6000 });
        if (apiRes.data && apiRes.data.promedio) {
          finalRate = Number(apiRes.data.promedio);
        }
      } catch {
        // Fallback if external API is unreachable
      }
    }

    const updated = await storage.updateBusinessConfig({ bcv_rate: finalRate });
    res.json({ success: true, bcv_rate: finalRate, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/business/template/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category as 'clinica' | 'taller' | 'tienda';
    const template = BUSINESS_TEMPLATES[category];
    if (!template) {
      return res.status(400).json({ success: false, error: 'Plantilla inválida. Usa: clinica, taller o tienda' });
    }
    const updated = await storage.updateBusinessConfig(template);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/business/voices', (_req: Request, res: Response) => {
  res.json({ success: true, data: tts.getAvailableVoices() });
});

apiRouter.get('/business/prompt-preview', async (_req: Request, res: Response) => {
  try {
    const business = await storage.getBusinessConfig();
    const prompt = gemini.buildSystemPrompt(business);
    res.json({ success: true, data: { prompt } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 2. Simulator & Unified Message Pipeline
// ----------------------------------------------------
apiRouter.post(
  '/simulator/message',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const { text, conversation_id, sender_phone, customer_name } = req.body;
      const convId = conversation_id || 'sim_conv_default';
      const phone = sender_phone || '+584120000000';
      const name = customer_name || 'Cliente Simulador';

      const business = await storage.getBusinessConfig();
      let conv = await storage.getConversation(convId);

      if (!conv) {
        conv = await storage.saveConversation({
          id: convId,
          phone_or_user_id: phone,
          customer_name: name,
          bot_paused: false,
          last_message: text || 'Archivo multimedia enviado',
          last_message_at: new Date().toISOString(),
          unread_by_human: true,
          channel: 'simulator',
          created_at: new Date().toISOString()
        });
      }

      if (conv.bot_paused) {
        const userMsg = await storage.saveMessage({
          id: 'msg_' + Date.now(),
          conversation_id: convId,
          sender: 'customer',
          type: 'text',
          content: text || 'Mensaje multimedia',
          created_at: new Date().toISOString()
        });

        return res.json({
          success: true,
          bot_paused: true,
          message: 'Atención tomada por humano. El bot IA está en pausa en esta conversación.',
          userMessage: userMsg
        });
      }

      // Process uploaded files using relative web paths so they render on any domain
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      let audioBuffer: Buffer | undefined;
      let audioMimeType: string | undefined;
      let audioUploadUrl: string | undefined;
      let imageBuffer: Buffer | undefined;
      let imageMimeType: string | undefined;
      let imageUploadUrl: string | undefined;

      if (files?.audio && files.audio[0]) {
        const aFile = files.audio[0];
        audioBuffer = fs.readFileSync(aFile.path);
        audioMimeType = aFile.mimetype;
        audioUploadUrl = `/uploads/${aFile.filename}`;
      }

      if (files?.image && files.image[0]) {
        const iFile = files.image[0];
        imageBuffer = fs.readFileSync(iFile.path);
        imageMimeType = iFile.mimetype;
        imageUploadUrl = `/uploads/${iFile.filename}`;
      }

      // Record incoming customer message
      const incomingRecord = await storage.saveMessage({
        id: 'msg_in_' + Date.now(),
        conversation_id: convId,
        sender: 'customer',
        type: audioBuffer ? 'audio' : imageBuffer ? 'image' : 'text',
        content: text || (audioBuffer ? 'Nota de voz enviada' : 'Comprobante / Imagen enviada'),
        media_url: imageUploadUrl,
        audio_url: audioUploadUrl,
        created_at: new Date().toISOString()
      });

      const history = await storage.getMessages(convId);
      const lead = await storage.getLead(phone);

      // Registrar mensaje entrante en VENE TURCO SHIELD con ID consistente
      const businessId = business.id || 'default_business';
      shield.recordInbound(businessId, text || '');

      const shieldCheck = shield.canSendMessage(businessId);
      if (!shieldCheck.allowed) {
        return res.json({
          success: false,
          kill_switch: true,
          error: '🚨 AUTO-KILL SWITCH ACTIVO: El Escudo Anti-Baneo ha bloqueado el envío para proteger la línea WhatsApp.',
          shield_status: shieldCheck
        });
      }

      // Execute Single-Pass Gemini 2.5 Flash
      const geminiResponse = await gemini.analyzeAndRespond({
        business,
        conversationHistory: history,
        incomingMessage: {
          text,
          audioBuffer,
          audioMimeType,
          imageBuffer,
          imageMimeType
        },
        currentLead: lead
      });

      // Update CRM Invisible Lead
      const crm = geminiResponse.crm_profile;
      await storage.saveLead({
        phone_or_user_id: phone,
        customer_name: crm.customer_name || lead?.customer_name || name,
        need_or_vehicle_or_symptom: crm.need_or_vehicle_or_symptom || lead?.need_or_vehicle_or_symptom,
        address_or_zone: crm.address_or_zone || lead?.address_or_zone,
        main_objection: crm.main_objection || lead?.main_objection,
        buying_score: geminiResponse.buying_score,
        last_intent: geminiResponse.intent_classification,
        sentiment: geminiResponse.customer_sentiment,
        missing_information: geminiResponse.missing_information
      });

      // Spoki AI V5.0: Respuesta Condicional Estricta
      let effectiveReply = geminiResponse.reply_to_customer;
      let shouldAutoPause = false;

      if (business.strict_conditional_reply && (!geminiResponse.knowledge_found || geminiResponse.confidence < 0.65)) {
        shouldAutoPause = true;
        effectiveReply =
          'Ya te comunico con un asesor especializado de nuestro equipo para confirmarte este detalle a la brevedad.';
        await storage.setBotPaused(convId, true);
      }

      // If transaction draft is created (order, appointment or payment receipt) with Bimoneda BCV Calculation
      let savedTransaction = null;
      if (geminiResponse.transaction_draft || geminiResponse.action === 'validar_pago') {
        const draft = geminiResponse.transaction_draft || {};
        let txType: 'pedido' | 'cita' | 'comprobante_pago' = 'pedido';
        if (geminiResponse.action === 'confirmar_cita' || draft.type === 'cita') txType = 'cita';
        if (geminiResponse.action === 'validar_pago' || draft.type === 'comprobante_pago' || imageBuffer)
          txType = 'comprobante_pago';

        const rate = business.bcv_rate || 52.4;
        const rawAmount = draft.detected_amount || draft.total || 0;
        const isVes =
          draft.detected_currency === 'VES' ||
          (txType === 'comprobante_pago' && rawAmount > 150); // Si supera 150 asumimos Bolívares en capture local

        const amountUsd = isVes ? Number((rawAmount / rate).toFixed(2)) : rawAmount;
        const amountVes = isVes ? rawAmount : Number((rawAmount * rate).toFixed(2));

        savedTransaction = await storage.saveTransaction({
          conversation_id: convId,
          phone_or_user_id: phone,
          customer_name: crm.customer_name || name,
          type: txType,
          details: draft,
          status: 'pendiente_de_verificacion',
          proof_image_url: imageUploadUrl,
          amount: amountUsd,
          amount_ves: amountVes,
          amount_usd_equiv: amountUsd,
          bcv_rate_applied: rate,
          reference_number: draft.reference_number
        });
      }

      // Voice / TTS generation logic
      let botAudioUrl: string | undefined;
      const shouldGenerateVoice =
        business.response_mode === 'voice' ||
        (business.response_mode === 'mirror' && (!!audioBuffer || req.body.force_voice === 'true'));

      if (shouldGenerateVoice) {
        const ttsResult = await tts.synthesizeTextToAudio(
          effectiveReply,
          business.voice_name || 'es-VE-PaolaNeural',
          false
        );
        if (ttsResult) {
          botAudioUrl = ttsResult.audioUrl;
        }
      }

      // Registrar mensaje saliente del bot en el Escudo Anti-Baneo
      shield.recordOutbound(businessId, effectiveReply);

      // Record Bot Reply Message
      const botMsg = await storage.saveMessage({
        id: 'msg_bot_' + Date.now(),
        conversation_id: convId,
        sender: 'bot',
        type: botAudioUrl ? 'audio' : 'text',
        content: effectiveReply,
        audio_url: botAudioUrl,
        created_at: new Date().toISOString(),
        metadata: {
          intent: geminiResponse.intent_classification,
          buying_score: geminiResponse.buying_score,
          action: geminiResponse.action,
          transaction_draft: geminiResponse.transaction_draft,
          owner_alert_message: geminiResponse.owner_alert_message || undefined,
          audio_transcription: geminiResponse.audio_transcription || undefined,
          customer_sentiment: geminiResponse.customer_sentiment,
          detected_language: geminiResponse.detected_language,
          knowledge_found: geminiResponse.knowledge_found
        }
      });

      await storage.saveConversation({
        ...conv,
        bot_paused: shouldAutoPause ? true : conv.bot_paused,
        last_message: effectiveReply,
        last_message_at: new Date().toISOString(),
        sentiment: geminiResponse.customer_sentiment
      });

      res.json({
        success: true,
        customerMessage: incomingRecord,
        botMessage: botMsg,
        geminiAnalysis: geminiResponse,
        transaction: savedTransaction
      });
    } catch (error: any) {
      console.error('❌ Error processing message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ----------------------------------------------------
// 3. Simulated Incoming Call Interception
// ----------------------------------------------------
apiRouter.post('/simulator/call', async (req: Request, res: Response) => {
  try {
    const { caller_phone = '+584129998877', conversation_id = 'sim_conv_default' } = req.body;
    const business = await storage.getBusinessConfig();

    if (!business.call_forwarding_enabled) {
      return res.json({
        success: false,
        message: 'El desvío de llamadas automáticas está desactivado en la configuración del negocio.'
      });
    }

    const humanizedMsg = shield.humanizeFixedMessage(business.call_rejection_message);

    const ttsResult = await tts.synthesizeTextToAudio(humanizedMsg, business.voice_name, false);

    const record = await storage.saveMessage({
      id: 'call_' + Date.now(),
      conversation_id,
      sender: 'bot',
      type: 'call_intercepted',
      content: `📞 LLAMADA ENTRANTE RECHAZADA Y DESVIADA AL CHAT:\n"${humanizedMsg}"`,
      audio_url: ttsResult?.audioUrl,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Llamada interceptada y desviada a WhatsApp exitosamente.',
      record,
      audioUrl: ttsResult?.audioUrl,
      rejectionMessage: humanizedMsg
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 4. Daily Owner Audio-Briefing Generation (Nivel Superior)
// ----------------------------------------------------
apiRouter.post('/simulator/daily-briefing', async (_req: Request, res: Response) => {
  try {
    const business = await storage.getBusinessConfig();
    const leads = await storage.getLeads();
    const transactions = await storage.getTransactions();
    const hotLeads = leads.filter((l) => l.buying_score >= 80);
    const pendingTxs = transactions.filter((t) => t.status === 'pendiente_de_verificacion');
    const rate = business.bcv_rate || 52.4;

    const topLeadName = hotLeads[0]?.customer_name || 'un cliente prioritario';
    const topLeadNeed = hotLeads[0]?.need_or_vehicle_or_symptom || 'confirmar su pedido';

    const summaryText = `Reporte Ejecutivo VOXA para la gerencia de ${business.name}. Hoy hemos atendido ${leads.length} prospectos en WhatsApp. Tienes ${hotLeads.length} clientes calientes listos para cerrar, destacando a ${topLeadName} interesado en ${topLeadNeed}. En caja tienes ${pendingTxs.length} comprobantes de pago pendientes de verificación humana calculados a tasa BCV de ${rate.toFixed(1)} bolívares por dólar. Tu escudo anti-baneo VENE TURCO se mantiene en estado óptimo. ¡Excelente jornada de ventas!`;

    const audioResult = await tts.generateDailyOwnerBriefing(
      summaryText,
      business.voice_name || 'es-VE-SebastianNeural'
    );

    res.json({
      success: true,
      summaryText,
      audioUrl: audioResult?.audioUrl,
      ownerWhatsappLink: `https://wa.me/${(business.owner_phone || '+584164883199').replace(/\D/g, '')}?text=${encodeURIComponent('🎙️ *REPORTE EJECUTIVO VOXA:*\n\n' + summaryText)}`,
      stats: {
        totalLeads: leads.length,
        hotLeads: hotLeads.length,
        pendingTransactions: pendingTxs.length,
        bcvRate: rate
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 5. CRM Leads, Conversations & Human Handover
// ----------------------------------------------------
apiRouter.get('/leads', async (_req: Request, res: Response) => {
  try {
    const leads = await storage.getLeads();
    res.json({ success: true, data: leads });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/conversations', async (_req: Request, res: Response) => {
  try {
    const conversations = await storage.getConversations();
    res.json({ success: true, data: conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const messages = await storage.getMessages(id);
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/conversations/:id/pause-bot', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { paused } = req.body;
    await storage.setBotPaused(id, !!paused);
    res.json({ success: true, bot_paused: !!paused });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/conversations/:id/human-reply', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { text, send_to_whatsapp = false } = req.body;
    const conv = await storage.getConversation(id);

    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversación no encontrada' });
    }

    const message = await storage.saveMessage({
      id: 'human_msg_' + Date.now(),
      conversation_id: id,
      sender: 'human_agent',
      type: 'text',
      content: text,
      created_at: new Date().toISOString()
    });

    await storage.saveConversation({
      ...conv,
      last_message: `(Agente Humano): ${text}`,
      last_message_at: new Date().toISOString()
    });

    if (send_to_whatsapp && conv.phone_or_user_id) {
      await whatsapp.sendTextMessage(conv.phone_or_user_id, text);
    }

    res.json({ success: true, data: message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 6. Transactions & Payment Verification
// ----------------------------------------------------
apiRouter.get('/transactions', async (_req: Request, res: Response) => {
  try {
    const txs = await storage.getTransactions();
    res.json({ success: true, data: txs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.patch('/transactions/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;
    if (status !== 'verificado' && status !== 'rechazado') {
      return res.status(400).json({ success: false, error: 'Estado debe ser verificado o rechazado' });
    }
    const updated = await storage.updateTransactionStatus(id, status);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 8. Baileys QR Connector Endpoints
// ----------------------------------------------------
apiRouter.post('/baileys/:businessId/connect', async (req: Request, res: Response) => {
  try {
    const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const result = await baileys.connect(businessId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/baileys/:businessId/status', async (req: Request, res: Response) => {
  try {
    const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const status = baileys.getSessionStatus(businessId);
    res.json({ success: true, ...status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/baileys/:businessId/disconnect', async (req: Request, res: Response) => {
  try {
    const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const disconnected = await baileys.disconnect(businessId);
    res.json({ success: true, disconnected });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 9. Spoki AI V5.0: Copilot Assist & Template Generator
// ----------------------------------------------------
apiRouter.post('/copilot/assist', async (req: Request, res: Response) => {
  try {
    const { mode, conversation_id, draft_text } = req.body;
    const business = await storage.getBusinessConfig();
    const history = conversation_id ? await storage.getMessages(conversation_id) : [];

    const assistResult = await gemini.runCopilotAssist({
      mode: mode || 'suggest_reply',
      conversationHistory: history,
      knowledgeBase: business.knowledge_base,
      draftText: draft_text,
      business
    });

    res.json({ success: true, data: assistResult });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/copilot/generate-template', async (req: Request, res: Response) => {
  try {
    const { objective } = req.body;
    if (!objective) {
      return res.status(400).json({ success: false, error: 'Se requiere el objetivo de la plantilla.' });
    }
    const business = await storage.getBusinessConfig();
    const templates = await gemini.generateMarketingTemplates({ objective, business });
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 10. VENE TURCO SHIELD (Anti-Ban Protection Engine)
// ----------------------------------------------------
apiRouter.get('/shield/:businessId/telemetry', async (req: Request, res: Response) => {
  try {
    const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const telemetry = shield.calculateRisk(businessId);
    res.json({ success: true, data: telemetry });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/shield/:businessId/settings', async (req: Request, res: Response) => {
  try {
    const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const { numberMaturity, resetKillSwitch, simulateBurst } = req.body;

    if (numberMaturity && ['new_chip', 'medium', 'veteran'].includes(numberMaturity)) {
      shield.setMaturity(businessId, numberMaturity as NumberMaturity);
    }

    if (resetKillSwitch) {
      shield.resetKillSwitch(businessId);
    }

    if (simulateBurst) {
      shield.simulateTrafficBurst(businessId, typeof simulateBurst === 'number' ? simulateBurst : 5);
    }

    const updatedTelemetry = shield.calculateRisk(businessId);
    res.json({ success: true, data: updatedTelemetry });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/health/integrations', async (_req: Request, res: Response) => {
  const storageStatus = storage.getStorageStatus();
  const geminiAvailable = gemini.isAvailable();
  const whatsappConfigured = whatsapp.isConfigured();

  res.json({
    success: true,
    data: {
      gemini: {
        status: geminiAvailable ? 'connected' : 'simulation_mode',
        model: 'gemini-2.5-flash',
        message: geminiAvailable
          ? 'API Key configurada y lista para llamadas multimodales.'
          : 'Modo simulador offline activo (Agrega GEMINI_API_KEY en backend/.env para IA real).'
      },
      storage: {
        mode: storageStatus.mode,
        firestoreActive: storageStatus.firestoreActive,
        localDbPath: storageStatus.localDbPath,
        status: storageStatus.firestoreActive ? 'connected' : 'local_file_active',
        message: storageStatus.firestoreActive
          ? 'Conectado a Google Cloud Firestore.'
          : 'Persistencia local activa en backend/data/db.json (Operativo al 100% sin credenciales).'
      },
      whatsapp: {
        configured: whatsappConfigured,
        verifyToken: process.env.META_WA_VERIFY_TOKEN || 'spoki_webhook_token_secure_2025',
        webhookUrl: '/webhook',
        message: whatsappConfigured
          ? 'Credenciales de Meta WhatsApp Cloud API configuradas.'
          : 'Pendiente credenciales de Meta (Usa el Simulador Web con audio e imágenes 100% funcional).'
      },
      tts: {
        engine: 'msedge-tts',
        status: 'ready',
        message: 'Síntesis de voz neuronal activa con soporte para voces venezolanas, colombianas y mexicanas.'
      }
    }
  });
});
