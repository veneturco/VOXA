import { z } from 'zod';

export const IntentClassificationSchema = z.enum([
  'navegando',
  'comparando',
  'listo_para_comprar',
  'listo_para_cita',
  'comprobante_enviado',
  'soporte',
  'queja'
]);

export const BotActionSchema = z.enum([
  'seguir_conversando',
  'confirmar_pedido',
  'confirmar_cita',
  'validar_pago',
  'derivar_humano'
]);

export const CustomerSentimentSchema = z.enum([
  'positivo',
  'neutro',
  'frustrado',
  'urgente'
]);

export const CrmProfileSchema = z.object({
  customer_name: z.string().nullable().optional(),
  need_or_vehicle_or_symptom: z.string().nullable().optional(),
  address_or_zone: z.string().nullable().optional(),
  main_objection: z.string().nullable().optional(),
});

export const TransactionDraftSchema = z.object({
  type: z.enum(['pedido', 'cita', 'comprobante_pago']).optional(),
  items: z.array(z.string()).optional(),
  total: z.number().optional(),
  payment_method: z.string().optional(),
  service_or_specialty: z.string().optional(),
  requested_date: z.string().optional(),
  requested_time: z.string().optional(),
  reference_number: z.string().optional(),
  detected_amount: z.number().optional(),
  bank_or_platform: z.string().optional(),
}).passthrough();

export const GeminiMasterResponseSchema = z.object({
  reply_to_customer: z.string(),
  intent_classification: IntentClassificationSchema,
  buying_score: z.number().min(0).max(100),
  action: BotActionSchema,
  confidence: z.number().min(0).max(1),
  missing_information: z.array(z.string()),
  crm_profile: CrmProfileSchema,
  transaction_draft: TransactionDraftSchema.nullable().optional(),
  owner_alert_message: z.string().nullable().optional(),
  // Nuevos campos Spoki AI V5.0
  audio_transcription: z.string().nullable().optional(),
  customer_sentiment: CustomerSentimentSchema.default('neutro'),
  detected_language: z.string().default('es'),
  knowledge_found: z.boolean().default(true),
});

export type GeminiMasterResponse = z.infer<typeof GeminiMasterResponseSchema>;

export interface BusinessConfig {
  id: string;
  name: string;
  category: 'clinica' | 'taller' | 'tienda';
  description: string;
  schedule: string;
  catalog_or_services: string;
  payment_methods: string;
  address: string;
  owner_phone: string;
  response_mode: 'text' | 'voice' | 'mirror'; // mirror: text->text, audio->audio
  voice_name: string;
  call_forwarding_enabled: boolean;
  call_rejection_message: string;
  custom_system_rules: string;
  updated_at: string;
  // Campos Spoki AI V5.0
  knowledge_base?: string;
  strict_conditional_reply?: boolean; // Si true y knowledge_found=false o confidence<0.65, auto-derivar a humano
}

export interface Lead {
  id: string;
  phone_or_user_id: string;
  customer_name?: string;
  need_or_vehicle_or_symptom?: string;
  address_or_zone?: string;
  main_objection?: string;
  buying_score: number;
  last_intent: string;
  sentiment?: 'positivo' | 'neutro' | 'frustrado' | 'urgente';
  missing_information: string[];
  total_messages: number;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  wa_message_id?: string;
  conversation_id: string;
  sender: 'customer' | 'bot' | 'human_agent';
  type: 'text' | 'audio' | 'image' | 'call_intercepted';
  content: string; // Text reply or transcription or URL
  media_url?: string;
  audio_url?: string;
  created_at: string;
  metadata?: {
    intent?: string;
    buying_score?: number;
    action?: string;
    transaction_draft?: any;
    owner_alert_message?: string;
    audio_transcription?: string;
    customer_sentiment?: 'positivo' | 'neutro' | 'frustrado' | 'urgente';
    detected_language?: string;
    knowledge_found?: boolean;
  };
}

export interface Conversation {
  id: string;
  phone_or_user_id: string;
  customer_name?: string;
  bot_paused: boolean; // Human Handover flag
  last_message: string;
  last_message_at: string;
  unread_by_human: boolean;
  channel: 'simulator' | 'whatsapp';
  sentiment?: 'positivo' | 'neutro' | 'frustrado' | 'urgente';
  created_at: string;
}

export interface Transaction {
  id: string;
  conversation_id: string;
  phone_or_user_id: string;
  customer_name?: string;
  type: 'pedido' | 'cita' | 'comprobante_pago';
  details: Record<string, any>;
  status: 'pendiente_de_verificacion' | 'verificado' | 'rechazado';
  proof_image_url?: string;
  amount?: number;
  reference_number?: string;
  created_at: string;
  updated_at: string;
}

export interface AppDatabase {
  business: BusinessConfig;
  processed_message_ids: string[];
  leads: Lead[];
  conversations: Conversation[];
  messages: MessageRecord[];
  transactions: Transaction[];
}
