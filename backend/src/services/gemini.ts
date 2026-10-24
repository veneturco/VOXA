import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { BusinessConfig, GeminiMasterResponse, GeminiMasterResponseSchema, Lead, MessageRecord } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GeminiService {
  private static instance: GeminiService;
  private aiClient: GoogleGenAI | null = null;

  private constructor() {
    this.initClient();
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public initClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      this.aiClient = new GoogleGenAI({ apiKey: apiKey.trim() });
    } else {
      this.aiClient = null;
    }
  }

  public isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '';
  }

  /**
   * Builds the System Instruction incorporating business context, rules, and behavioral constraints.
   */
  public buildSystemPrompt(business: BusinessConfig, currentLead?: Lead | null): string {
    return `ERES EL RECEPCIONISTA / ASESOR COMERCIAL IA OFICIAL DE: "${business.name}" (Rubro: ${business.category.toUpperCase()}).
Actúas a través de WhatsApp. Tu objetivo es atender con máxima cordialidad y eficiencia, guiando al cliente hacia el cierre comercial, la cita médica o la confirmación de su requerimiento.

INFORMACIÓN DEL NEGOCIO:
- Descripción: ${business.description}
- Horario de Atención: ${business.schedule}
- Dirección / Ubicación: ${business.address}
- Catálogo de Productos / Servicios y Precios:
${business.catalog_or_services}
- Métodos de Pago Disponibles:
${business.payment_methods}

BASE DE CONOCIMIENTO (DOCUMENTOS Y POLÍTICAS EXTENDIDAS):
${business.knowledge_base || 'No hay documentos adicionales cargados.'}

REGLAS DEL RUBRO Y NEGOCIO:
${business.custom_system_rules}

CONTEXTO DEL CLIENTE EN CRM INVISIBLE (HASTA EL MOMENTO):
${currentLead ? `- Nombre conocido: ${currentLead.customer_name || 'Desconocido'}
- Necesidad / Vehículo / Síntoma registrado: ${currentLead.need_or_vehicle_or_symptom || 'Aún no especificado'}
- Dirección / Zona conocida: ${currentLead.address_or_zone || 'Aún no especificada'}
- Principal objeción previa: ${currentLead.main_objection || 'Ninguna'}
- Score comercial previo: ${currentLead.buying_score}/100` : '- Cliente nuevo sin historial previo.'}

REGLAS INQUEBRANTABLES DE TU RESPUESTA:
1. 'reply_to_customer' DEBE SER TEXTO LIMPIO, NATURAL, AMIGABLE Y CONVERSACIONAL.
   - NUNCA uses etiquetas sintácticas o técnicas como [PEDIDO_CONFIRMADO], [CITA_AGENDADA], [BOT], etc.
   - NUNCA uses markdown excesivo ni listas infinitas de asteriscos. Tu respuesta debe leerse o escucharse fluidamente en notas de voz.
2. 'intent_classification' DEBE SER UNO DE: 'navegando', 'comparando', 'listo_para_comprar', 'listo_para_cita', 'comprobante_enviado', 'soporte', 'queja'.
3. 'customer_sentiment' DEBE SER UNO DE: 'positivo', 'neutro', 'frustrado', 'urgente'.
4. 'detected_language' código de idioma (ej. 'es', 'en', 'pt'). Responde siempre en el mismo idioma detectado.
5. 'knowledge_found' booleano: 'true' si la consulta del cliente está respaldada por la información, catálogo o base de conocimiento del negocio; 'false' si el cliente solicita información no existente o fuera de alcance.
6. 'audio_transcription': Si el cliente envió un audio o nota de voz, coloca aquí la transcripción exacta de lo que dijo para mostrarla por escrito. Si no hubo audio, déjalo en null.
7. 'buying_score' ES UN NÚMERO DE 0 A 100:
   - 0-30: Cliente solo curioseando, saludando o con dudas vagas.
   - 31-70: Pidiendo precios específicos, preguntando disponibilidad o consultando detalles técnicos.
   - 71-90: Eligió producto/servicio, preguntó cómo pagar, o pidió fecha/hora concreta.
   - 91-100: Envió comprobante de pago, dio dirección exacta para delivery o confirmó su asistencia médica.
8. 'action' DEBE SER UNO DE: 'seguir_conversando', 'confirmar_pedido', 'confirmar_cita', 'validar_pago', 'derivar_humano'.
9. SI EL CLIENTE ENVÍA UN COMPROBANTE DE PAGO (IMAGEN O TEXTO CON REFERENCIA Y MONTO):
   - Extrae 'reference_number', 'detected_amount' y 'bank_or_platform' dentro de 'transaction_draft'.
   - 'action' debe ser 'validar_pago'.
   - NUNCA digas que el pago ya está 100% aprobado. Di amablemente que el comprobante fue recibido y que el área de administración/caja lo está revisando para despachar o agendar.
10. SI EL SCORE >= 80 O REQUIERE ACCIÓN HUMANA:
   - Genera 'owner_alert_message' con un resumen de 2 líneas directo y accionable para el dueño.
11. Responde SIEMPRE estrictamente bajo el esquema JSON solicitado.`;
  }

  /**
   * Main Multimodal Single-Pass Execution using official @google/genai SDK and gemini-2.5-flash
   */
  public async analyzeAndRespond(params: {
    business: BusinessConfig;
    conversationHistory: MessageRecord[];
    incomingMessage: {
      text?: string;
      audioBuffer?: Buffer;
      audioMimeType?: string;
      imageBuffer?: Buffer;
      imageMimeType?: string;
    };
    currentLead?: Lead | null;
  }): Promise<GeminiMasterResponse> {
    this.initClient();

    // Fallback if no API key is provided
    if (!this.aiClient) {
      console.warn('⚠️ [GeminiService] GEMINI_API_KEY is not configured. Returning simulation mock response.');
      return this.generateOfflineSimulationResponse(params.incomingMessage.text || 'Hola', params.business, !!params.incomingMessage.audioBuffer);
    }

    const systemInstruction = this.buildSystemPrompt(params.business, params.currentLead);

    // Build contents array
    const contents: any[] = [];

    // Include recent history (last 8 messages for context)
    const recentHistory = params.conversationHistory.slice(-8);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Prepare current user turn parts
    const currentParts: any[] = [];

    if (params.incomingMessage.text && params.incomingMessage.text.trim()) {
      currentParts.push({ text: params.incomingMessage.text });
    }

    if (params.incomingMessage.audioBuffer) {
      const mime = params.incomingMessage.audioMimeType || 'audio/ogg';
      currentParts.push({
        inlineData: {
          mimeType: mime,
          data: params.incomingMessage.audioBuffer.toString('base64')
        }
      });
      currentParts.push({
        text: 'Por favor escucha con atención esta nota de voz, transcribe exactamente lo que el cliente dijo en el campo `audio_transcription` y responde a su requerimiento.'
      });
    }

    if (params.incomingMessage.imageBuffer) {
      const mime = params.incomingMessage.imageMimeType || 'image/jpeg';
      currentParts.push({
        inlineData: {
          mimeType: mime,
          data: params.incomingMessage.imageBuffer.toString('base64')
        }
      });
      currentParts.push({
        text: 'Por favor analiza con mucha atención esta imagen. Si es un comprobante de pago o transferencia bancaria, extrae el número de referencia, banco/plataforma, fecha y monto exacto.'
      });
    }

    if (currentParts.length === 0) {
      currentParts.push({ text: 'Hola' });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    try {
      const response = await this.aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply_to_customer: { type: Type.STRING },
              intent_classification: {
                type: Type.STRING,
                enum: [
                  'navegando',
                  'comparando',
                  'listo_para_comprar',
                  'listo_para_cita',
                  'comprobante_enviado',
                  'soporte',
                  'queja'
                ]
              },
              buying_score: { type: Type.INTEGER },
              action: {
                type: Type.STRING,
                enum: [
                  'seguir_conversando',
                  'confirmar_pedido',
                  'confirmar_cita',
                  'validar_pago',
                  'derivar_humano'
                ]
              },
              confidence: { type: Type.NUMBER },
              missing_information: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              crm_profile: {
                type: Type.OBJECT,
                properties: {
                  customer_name: { type: Type.STRING, nullable: true },
                  need_or_vehicle_or_symptom: { type: Type.STRING, nullable: true },
                  address_or_zone: { type: Type.STRING, nullable: true },
                  main_objection: { type: Type.STRING, nullable: true }
                }
              },
              transaction_draft: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, nullable: true },
                  items: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                  total: { type: Type.NUMBER, nullable: true },
                  payment_method: { type: Type.STRING, nullable: true },
                  service_or_specialty: { type: Type.STRING, nullable: true },
                  requested_date: { type: Type.STRING, nullable: true },
                  requested_time: { type: Type.STRING, nullable: true },
                  reference_number: { type: Type.STRING, nullable: true },
                  detected_amount: { type: Type.NUMBER, nullable: true },
                  bank_or_platform: { type: Type.STRING, nullable: true }
                },
                nullable: true
              },
              owner_alert_message: { type: Type.STRING, nullable: true },
              audio_transcription: { type: Type.STRING, nullable: true },
              customer_sentiment: {
                type: Type.STRING,
                enum: ['positivo', 'neutro', 'frustrado', 'urgente']
              },
              detected_language: { type: Type.STRING },
              knowledge_found: { type: Type.BOOLEAN }
            },
            required: [
              'reply_to_customer',
              'intent_classification',
              'buying_score',
              'action',
              'confidence',
              'missing_information',
              'crm_profile',
              'customer_sentiment',
              'detected_language',
              'knowledge_found'
            ]
          }
        }
      });

      const rawText = response.text?.trim() || '{}';
      const parsed = JSON.parse(rawText);
      const validated = GeminiMasterResponseSchema.parse(parsed);
      return validated;
    } catch (error: any) {
      console.error('❌ [GeminiService] Error calling gemini-2.5-flash:', error?.message || error);
      return this.generateOfflineSimulationResponse(params.incomingMessage.text || 'Consulta recibida', params.business, !!params.incomingMessage.audioBuffer);
    }
  }

  /**
   * Asistente Copiloto para Operadores Humanos (Sugerir, Resumir, Persuadir)
   */
  public async runCopilotAssist(params: {
    mode: 'suggest_reply' | 'summarize_chat' | 'improve_draft';
    conversationHistory: MessageRecord[];
    knowledgeBase?: string;
    draftText?: string;
    business: BusinessConfig;
  }): Promise<{ resultText: string; bullets?: string[] }> {
    this.initClient();
    if (!this.aiClient) {
      if (params.mode === 'suggest_reply') {
        return { resultText: `Hola, con gusto te confirmo los detalles de tu consulta sobre ${params.business.name}. ¿Deseas coordinar la entrega o agendar cita para hoy?` };
      } else if (params.mode === 'summarize_chat') {
        return {
          resultText: 'Resumen ejecutivo de la conversación',
          bullets: [
            'Cliente interesado en cotización rápida de catálogo.',
            'Ha consultado métodos de pago disponibles.',
            'Esperando confirmación final para concretar la operación.'
          ]
        };
      } else {
        return { resultText: `${params.draftText || ''} ¡Quedamos totalmente a tu orden con atención prioritaria e inmediata!` };
      }
    }

    try {
      const historyStr = params.conversationHistory
        .slice(-10)
        .map(m => `${m.sender}: ${m.content}`)
        .join('\n');

      let prompt = '';
      if (params.mode === 'suggest_reply') {
        prompt = `Eres el copiloto IA para el operador humano de "${params.business.name}".
Historial reciente:
${historyStr}

Base de conocimiento / Catálogo:
${params.business.knowledge_base || params.business.catalog_or_services}

Genera la respuesta sugerida ideal, cortés, persuasiva y concisa para enviar por WhatsApp al cliente. Devuelve ÚNICAMENTE el texto de la respuesta.`;
      } else if (params.mode === 'summarize_chat') {
        prompt = `Eres el copiloto IA de "${params.business.name}".
Historial de conversación:
${historyStr}

Genera un resumen ejecutivo en exactamente 3 puntos concisos (viñetas con guión) destacando:
1. Necesidad principal del cliente
2. Objeción o estado actual
3. Próximo paso recomendado para cerrar.`;
      } else {
        prompt = `Eres un copywriter experto en ventas por WhatsApp para "${params.business.name}".
Reescribe y mejora este borrador escrito por el operador humano haciéndolo más claro, profesional, cálido y persuasivo sin extenderlo de más:
"${params.draftText}"
Devuelve ÚNICAMENTE la versión mejorada.`;
      }

      const res = await this.aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const output = res.text?.trim() || '';
      if (params.mode === 'summarize_chat') {
        const bullets = output.split('\n').filter(l => l.trim().length > 0);
        return { resultText: output, bullets };
      }
      return { resultText: output };
    } catch (e: any) {
      console.error('Error in Copilot assist:', e);
      return { resultText: 'No fue posible conectar con el copiloto en este momento.' };
    }
  }

  /**
   * Generador de 3 Variantes de Plantillas de Marketing para WhatsApp
   */
  public async generateMarketingTemplates(params: {
    objective: string;
    business: BusinessConfig;
  }): Promise<{ short: string; direct: string; urgency: string }> {
    this.initClient();
    if (!this.aiClient) {
      return {
        short: `¡Hola! 👋 En ${params.business.name} tenemos disponible: ${params.objective}. Escríbenos para aprovecharlo hoy.`,
        direct: `Estimado cliente, te recordamos que en ${params.business.name} contamos con ${params.objective}. ¿Te agendamos o coordinamos tu despacho de inmediato?`,
        urgency: `⚡ ¡Últimos cupos / unidades disponibles! ${params.objective} solo por tiempo limitado en ${params.business.name}. ¡Reserva el tuyo aquí!`
      };
    }

    try {
      const prompt = `Actúa como especialista en Marketing Conversacional de WhatsApp.
Genera 3 variantes de plantillas persuasivas para el negocio "${params.business.name}" sobre el siguiente objetivo:
"${params.objective}"

Responde en formato JSON con la siguiente estructura:
{
  "short": "Plantilla corta y amigable",
  "direct": "Plantilla comercial directa y orientada a beneficios",
  "urgency": "Plantilla con sentido de escasez y llamado urgente a la acción"
}`;

      const res = await this.aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(res.text?.trim() || '{}');
      return {
        short: parsed.short || 'Plantilla rápida disponible.',
        direct: parsed.direct || 'Plantilla comercial directa.',
        urgency: parsed.urgency || 'Plantilla urgente con cupos limitados.'
      };
    } catch (e) {
      console.error('Error generating templates:', e);
      return {
        short: `¡Hola! 👋 Tenemos activo: ${params.objective}. Escríbenos para detalles.`,
        direct: `Conoce nuestra promoción en ${params.objective}. Consulta precios y disponibilidad aquí.`,
        urgency: `⚡ ¡Atención! Últimas plazas en ${params.objective}. ¡Confirma hoy mismo!`
      };
    }
  }

  /**
   * Offline / Mock simulator generator when API key is missing or quota is exceeded
   */
  private generateOfflineSimulationResponse(userText: string, business: BusinessConfig, hasAudio = false): GeminiMasterResponse {
    const textLower = userText.toLowerCase();
    let score = 30;
    let intent: any = 'navegando';
    let action: any = 'seguir_conversando';
    let sentiment: any = 'neutro';
    let reply = `¡Hola! Bienvenido a ${business.name}. Estamos a tu orden con nuestros servicios y promociones de hoy. ¿En qué te podemos ayudar?`;
    let transaction: any = null;
    let alertMsg: string | null = null;
    let knowledgeFound = true;
    const missing: string[] = [];

    if (textLower.includes('urgente') || textLower.includes('emergencia') || textLower.includes('rapido') || textLower.includes('ayuda')) {
      sentiment = 'urgente';
      score = 75;
    } else if (textLower.includes('molesto') || textLower.includes('mal') || textLower.includes('queja') || textLower.includes('tardanza')) {
      sentiment = 'frustrado';
      intent = 'queja';
      action = 'derivar_humano';
      reply = 'Lamento mucho el inconveniente. En este instante estoy transfiriendo tu caso a nuestro equipo de atención humana para resolverlo de inmediato.';
    } else if (textLower.includes('precio') || textLower.includes('cuanto') || textLower.includes('costo')) {
      score = 65;
      intent = 'comparando';
      sentiment = 'positivo';
      reply = `Con gusto. Acá tienes nuestros precios principales: ${business.catalog_or_services.split('\n')[0] || 'Consultar con asesor'}. ¿Te gustaría agendar o solicitarlo para hoy?`;
      missing.push('confirmación de servicio o producto');
    } else if (textLower.includes('comprar') || textLower.includes('pedido') || textLower.includes('quiero') || textLower.includes('combo')) {
      score = 85;
      intent = 'listo_para_comprar';
      action = 'confirmar_pedido';
      sentiment = 'positivo';
      reply = `¡Excelente elección! Para registrar tu pedido necesitamos tu dirección o zona para coordinar la entrega y tu método de pago preferido.`;
      missing.push('dirección de entrega', 'método de pago');
      alertMsg = `🚨 Lead Caliente (85 pts): Cliente solicitó pedido. Esperando datos de despacho.`;
      transaction = {
        type: 'pedido',
        items: ['Pedido solicitado en chat'],
        total: 19.99,
        payment_method: 'Pago Móvil / Zelle'
      };
    } else if (textLower.includes('cita') || textLower.includes('doctor') || textLower.includes('turno')) {
      score = 80;
      intent = 'listo_para_cita';
      action = 'confirmar_cita';
      sentiment = 'positivo';
      reply = `Con gusto te agendamos la cita médica en ${business.name}. Por favor indícanos tu nombre completo y si prefieres asistir en el turno de la mañana o de la tarde.`;
      missing.push('nombre del paciente', 'turno preferido');
      alertMsg = `🚨 Lead Caliente (80 pts): Solicitud de cita médica entrante.`;
      transaction = {
        type: 'cita',
        service_or_specialty: 'Consulta General',
        requested_date: 'Próxima disponible'
      };
    } else if (textLower.includes('pago') || textLower.includes('transferencia') || textLower.includes('referencia') || textLower.includes('comprobante')) {
      score = 95;
      intent = 'comprobante_enviado';
      action = 'validar_pago';
      sentiment = 'positivo';
      reply = `¡Muchas gracias por enviar tu comprobante! Lo hemos registrado exitosamente. Nuestro equipo de administración lo verificará en minutos para confirmar tu operación.`;
      alertMsg = `💰 Comprobante recibido pendiente de verificación humana.`;
      transaction = {
        type: 'comprobante_pago',
        reference_number: 'REF-' + Math.floor(100000 + Math.random() * 900000),
        detected_amount: 25.00,
        bank_or_platform: 'Pago Móvil / Banco'
      };
    } else if (textLower.includes('extraterrestre') || textLower.includes('politica no registrada')) {
      knowledgeFound = false;
    }

    return {
      reply_to_customer: reply,
      intent_classification: intent,
      buying_score: score,
      action: action,
      confidence: 0.95,
      missing_information: missing,
      crm_profile: {
        customer_name: null,
        need_or_vehicle_or_symptom: 'Consulta recibida en simulador',
        address_or_zone: null,
        main_objection: null
      },
      transaction_draft: transaction,
      owner_alert_message: alertMsg,
      audio_transcription: hasAudio ? (userText || 'Nota de voz recibida del cliente consultando disponibilidad y precios.') : null,
      customer_sentiment: sentiment,
      detected_language: 'es',
      knowledge_found: knowledgeFound
    };
  }
}
