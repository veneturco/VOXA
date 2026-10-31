export type BusinessCategory = 'clinica' | 'taller' | 'tienda' | 'restaurante' | 'servicios';

export interface BusinessConfig {
  id: string;
  name: string;
  category: BusinessCategory;
  description: string;
  schedule: string;
  catalog_or_services: string;
  payment_methods: string;
  address: string;
  owner_phone: string;
  response_mode: 'text' | 'voice' | 'mirror';
  voice_name: string;
  call_forwarding_enabled: boolean;
  call_rejection_message: string;
  custom_system_rules: string;
  updated_at?: string;
  // Spoki AI V5.0
  knowledge_base?: string;
  strict_conditional_reply?: boolean;
  // Nivel Superior V5.5 (Bimoneda BCV + Google Sheets Live Sync)
  bcv_rate?: number;
  google_sheet_csv_url?: string;
  last_sheet_sync?: string;
  // Smart Triaging V5.6 (Filtro Inteligente de Teléfono Personal)
  smart_personal_filter?: boolean;
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
  conversation_id: string;
  sender: 'customer' | 'bot' | 'human_agent';
  type: 'text' | 'audio' | 'image' | 'call_intercepted';
  content: string;
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
  bot_paused: boolean;
  pause_reason?: 'manual' | 'human_takeover' | 'personal_contact';
  paused_until?: string;
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
  amount_ves?: number;
  amount_usd_equiv?: number;
  bcv_rate_applied?: number;
  reference_number?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationStatus {
  gemini: {
    status: 'connected' | 'simulation_mode';
    model: string;
    message: string;
  };
  storage: {
    mode: 'firestore' | 'local_json';
    firestoreActive: boolean;
    localDbPath: string;
    status: string;
    message: string;
  };
  whatsapp: {
    configured: boolean;
    verifyToken: string;
    webhookUrl: string;
    message: string;
  };
  tts: {
    engine: string;
    status: string;
    message: string;
  };
}

// VENE TURCO SHIELD (Anti-Ban Engine)
export type ShieldStatusLevel = 'OPTIMAL' | 'COOLING' | 'SURVIVAL' | 'KILL_SWITCH';
export type NumberMaturity = 'new_chip' | 'medium' | 'veteran';

export interface ShieldTelemetry {
  riskScore: number;
  statusLevel: ShieldStatusLevel;
  killSwitchActive: boolean;
  metrics: {
    sentLastMinute: number;
    sentLastHour: number;
    inboundLastHour: number;
    outboundLastHour: number;
    inboundRatio: number;
    duplicateRate: number;
    recommendedDelayMs: number;
    numberMaturity: NumberMaturity;
    burstSafeLimitPerMinute: number;
    burstSafeLimitPerHour: number;
  };
  logs: Array<{
    timestamp: string;
    type: 'inbound' | 'outbound' | 'cooling' | 'warning' | 'kill_switch' | 'setting_change';
    message: string;
    score: number;
  }>;
}
