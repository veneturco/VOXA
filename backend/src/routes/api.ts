import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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
// 1. Business Config & Templates
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
  upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1 }]),
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

      // Check if Human Handover is active
      if (conv.bot_paused) {
        // Record incoming message from user
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

      // Process uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      let audioBuffer: Buffer | undefined;
      let audioMimeType: string | undefined;
      let audioUploadUrl: string | undefined;
      let imageBuffer: Buffer | undefined;
      let imageMimeType: string | undefined;
      let imageUploadUrl: string | undefined;

      const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:4000';

      if (files?.audio && files.audio[0]) {
        const aFile = files.audio[0];
        audioBuffer = fs.readFileSync(aFile.path);
        audioMimeType = aFile.mimetype;
        audioUploadUrl = `${baseUrl}/uploads/${aFile.filename}`;
      }

      if (files?.image && files.image[0]) {
        const iFile = files.image[0];
        imageBuffer = fs.readFileSync(iFile.path);
        imageMimeType = iFile.mimetype;
        imageUploadUrl = `${baseUrl}/uploads/${iFile.filename}`;
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

      // Retrieve history and current lead
      const history = await storage.getMessages(convId);
      const lead = await storage.getLead(phone);

      // Registrar mensaje entrante en VENE TURCO SHIELD
      const businessId = business.id || 'vene_turco_default';
      shield.recordInbound(businessId, text || '');

      // Consultar Escudo Anti-Baneo antes de generar y emitir respuesta
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
        effectiveReply = 'Ya te comunico con un asesor especializado de nuestro equipo para confirmarte este detalle a la brevedad.';
        await storage.setBotPaused(convId, true);
      }

      // If transaction draft is created (order, appointment or payment receipt)
      let savedTransaction = null;
      if (geminiResponse.transaction_draft || geminiResponse.action === 'validar_pago') {
        const draft = geminiResponse.transaction_draft || {};
        let txType: 'pedido' | 'cita' | 'comprobante_pago' = 'pedido';
        if (geminiResponse.action === 'confirmar_cita' || draft.type === 'cita') txType = 'cita';
        if (geminiResponse.action === 'validar_pago' || draft.type === 'comprobante_pago' || imageBuffer) txType = 'comprobante_pago';

        savedTransaction = await storage.saveTransaction({
          conversation_id: convId,
          phone_or_user_id: phone,
          customer_name: crm.customer_name || name,
          type: txType,
          details: draft,
          status: 'pendiente_de_verificacion', // Rule: ALWAYS pending human verification
          proof_image_url: imageUploadUrl,
          amount: draft.detected_amount || draft.total,
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

      // Update Conversation Summary
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

    // Synthesize polite rejection audio message
    const ttsResult = await tts.synthesizeTextToAudio(
      business.call_rejection_message,
      business.voice_name,
      false
    );

    // Record call event in conversation
    const record = await storage.saveMessage({
      id: 'call_' + Date.now(),
      conversation_id,
      sender: 'bot',
      type: 'call_intercepted',
      content: `📞 LLAMADA ENTRANTE RECHAZADA Y DESVIADA AL CHAT:\n"${business.call_rejection_message}"`,
      audio_url: ttsResult?.audioUrl,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Llamada interceptada y desviada a WhatsApp exitosamente.',
      record,
      audioUrl: ttsResult?.audioUrl,
      rejectionMessage: business.call_rejection_message
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 4. Daily Owner Briefing Generation
// ----------------------------------------------------
apiRouter.post('/simulator/daily-briefing', async (_req: Request, res: Response) => {
  try {
    const business = await storage.getBusinessConfig();
    const leads = await storage.getLeads();
    const transactions = await storage.getTransactions();
    const hotLeads = leads.filter(l => l.buying_score >= 80);
    const pendingTxs = transactions.filter(t => t.status === 'pendiente_de_verificacion');

    const summaryText = `¡Buenos días, equipo de ${business.name}! Aquí está tu resumen operativo Spoki AI. Al momento cuentas con ${leads.length} clientes atendidos, de los cuales ${hotLeads.length} tienen alta intención de compra lista para cerrar. Además, tienes ${pendingTxs.length} transacciones y comprobantes pendientes por verificar en tu panel. El asistente de inteligencia artificial se encuentra activo y optimizando tus conversiones. ¡Mucho éxito en la jornada de hoy!`;

    const audioResult = await tts.generateDailyOwnerBriefing(summaryText, business.voice_name);

    res.json({
      success: true,
      summaryText,
      audioUrl: audioResult?.audioUrl,
      stats: {
        totalLeads: leads.length,
        hotLeads: hotLeads.length,
        pendingTransactions: pendingTxs.length
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
