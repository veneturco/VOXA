/**
 * VENE TURCO SHIELD (Anti-Ban Protection Engine & Predictive Risk Meter)
 * Medidor Predictivo de Riesgo Anti-Baneo + Camaleón Humano + Auto-Kill Switch
 *
 * Evalúa 5 factores en tiempo real en una ventana móvil de 60 minutos:
 * 1. Madurez del número (new_chip: x2.0, medium: x1.3, veteran: x1.0)
 * 2. Velocidad / Burst Rate (mensajes en el último minuto y en la última hora)
 * 3. Ratio Inbound/Outbound (porcentaje de mensajes de clientes vs mensajes del bot)
 * 4. Huella de Repetición (detección de hashes idénticos en últimos 10 mensajes y humanización)
 * 5. Retardo Camaleón Dinámico (getRecommendedDelayMs con jitter orgánico)
 * 
 * Auto-Kill Switch: Si riskScore >= 85, bot_active = false automático y aviso de alerta.
 */

export type StatusLevel = 'OPTIMAL' | 'COOLING' | 'SURVIVAL' | 'KILL_SWITCH';
export type NumberMaturity = 'new_chip' | 'medium' | 'veteran';

export interface ShieldTelemetry {
  riskScore: number;
  statusLevel: StatusLevel;
  killSwitchActive: boolean;
  metrics: {
    sentLastMinute: number;
    sentLastHour: number;
    inboundLastHour: number;
    outboundLastHour: number;
    inboundRatio: number; // 0 a 100%
    duplicateRate: number; // 0 a 100%
    recommendedDelayMs: number;
    numberMaturity: NumberMaturity;
    burstSafeLimitPerMinute: number;
    burstSafeLimitPerHour: number;
  };
  logs: ShieldLogEntry[];
}

export interface ShieldLogEntry {
  timestamp: string;
  type: 'inbound' | 'outbound' | 'cooling' | 'warning' | 'kill_switch' | 'setting_change';
  message: string;
  score: number;
}

interface MessageRecord {
  timestamp: number;
  direction: 'inbound' | 'outbound';
  contentHash: string;
}

export class AntiBanShieldService {
  private static instance: AntiBanShieldService;

  // Estado por businessId
  private maturityMap = new Map<string, NumberMaturity>();
  private messageHistoryMap = new Map<string, MessageRecord[]>();
  private killSwitchMap = new Map<string, boolean>();
  private logsMap = new Map<string, ShieldLogEntry[]>();

  private constructor() {}

  public static getInstance(): AntiBanShieldService {
    if (!AntiBanShieldService.instance) {
      AntiBanShieldService.instance = new AntiBanShieldService();
    }
    return AntiBanShieldService.instance;
  }

  private getHistory(businessId: string): MessageRecord[] {
    if (!this.messageHistoryMap.has(businessId)) {
      this.messageHistoryMap.set(businessId, []);
    }
    return this.messageHistoryMap.get(businessId)!;
  }

  private cleanOldRecords(records: MessageRecord[], windowMs = 3600000) {
    const cutoff = Date.now() - windowMs;
    return records.filter((r) => r.timestamp >= cutoff);
  }

  private getLogs(businessId: string): ShieldLogEntry[] {
    if (!this.logsMap.has(businessId)) {
      this.logsMap.set(businessId, []);
    }
    return this.logsMap.get(businessId)!;
  }

  private addLog(businessId: string, type: ShieldLogEntry['type'], message: string, score: number) {
    const logs = this.getLogs(businessId);
    logs.unshift({
      timestamp: new Date().toISOString(),
      type,
      message,
      score
    });
    if (logs.length > 50) logs.pop();
  }

  public getMaturity(businessId: string): NumberMaturity {
    return this.maturityMap.get(businessId) || 'medium';
  }

  public setMaturity(businessId: string, maturity: NumberMaturity) {
    this.maturityMap.set(businessId, maturity);
    const score = this.calculateRisk(businessId).riskScore;
    this.addLog(
      businessId,
      'setting_change',
      `Madurez del número actualizada a '${maturity}'. Multiplicador de riesgo ajustado.`,
      score
    );
  }

  public resetKillSwitch(businessId: string) {
    this.killSwitchMap.set(businessId, false);
    const score = this.calculateRisk(businessId).riskScore;
    this.addLog(
      businessId,
      'setting_change',
      'Auto-Kill Switch reseteado manualmente por el operador.',
      score
    );
  }

  public isKillSwitchActive(businessId: string): boolean {
    return !!this.killSwitchMap.get(businessId);
  }

  /**
   * Genera un hash simple normalizado para detectar huellas textuales repetitivas
   */
  public getHash(text: string): string {
    return text.trim().toLowerCase().replace(/[\s\p{P}]/gu, '');
  }

  /**
   * Factor 4: Humaniza mensajes fijos (saludos o rechazos de llamada) rotando conectores y modismos
   * para evitar el mismo hash binario repetido.
   */
  public humanizeFixedMessage(baseText: string): string {
    const greetings = [
      '¡Hola! Disculpa que no pueda tomar tu llamada en este momento.',
      'Hola, qué tal. Por ahora nos encontramos atendiendo otros clientes en línea.',
      '¡Un saludo cordial! En este momento no podemos responder llamadas de voz.',
      'Hola, te comento que nuestra central de voz está ocupada en este instante.'
    ];

    const connectors = [
      'Por favor escríbenos tu consulta por este mismo chat y te atenderemos de inmediato.',
      'Déjanos tu mensaje de texto o nota de voz por aquí para brindarte soporte prioritario.',
      'Indícanos por aquí qué necesitas y el equipo te asistirá al instante.',
      'Escríbenos por este medio lo que requieres y te responderemos sin demora.'
    ];

    const contactRef = 'Para emergencias o asistencia directa: VENE TURCO Soporte (+58 416 488 3199).';

    const g = greetings[Math.floor(Math.random() * greetings.length)];
    const c = connectors[Math.floor(Math.random() * connectors.length)];

    return `${g} ${c}\n\n${contactRef}`;
  }

  /**
   * Registra un mensaje entrante (cliente -> bot)
   */
  public recordInbound(businessId: string, text = '') {
    const records = this.getHistory(businessId);
    records.push({
      timestamp: Date.now(),
      direction: 'inbound',
      contentHash: this.getHash(text)
    });
    this.messageHistoryMap.set(businessId, this.cleanOldRecords(records));
  }

  /**
   * Registra un mensaje saliente (bot -> cliente)
   */
  public recordOutbound(businessId: string, text = '') {
    const records = this.getHistory(businessId);
    records.push({
      timestamp: Date.now(),
      direction: 'outbound',
      contentHash: this.getHash(text)
    });
    this.messageHistoryMap.set(businessId, this.cleanOldRecords(records));

    // Evaluar riesgo inmediatamente después del envío
    const telemetry = this.calculateRisk(businessId);
    if (telemetry.riskScore >= 85 && !this.killSwitchMap.get(businessId)) {
      this.killSwitchMap.set(businessId, true);
      this.addLog(
        businessId,
        'kill_switch',
        `🚨 AUTO-KILL SWITCH ACTIVADO (Riesgo ${telemetry.riskScore}%). Se pausó el bot para salvar la línea WhatsApp de baneo.`,
        telemetry.riskScore
      );
    }
  }

  /**
   * Comprueba si el bot tiene autorización de enviar mensajes sin riesgo de baneo
   */
  public canSendMessage(businessId: string): { allowed: boolean; reason?: string; riskScore: number } {
    if (this.killSwitchMap.get(businessId)) {
      return {
        allowed: false,
        reason: 'Auto-Kill Switch activo. El riesgo de baneo superó el umbral crítico del 85%.',
        riskScore: 90
      };
    }

    const { riskScore, statusLevel } = this.calculateRisk(businessId);
    if (statusLevel === 'KILL_SWITCH') {
      this.killSwitchMap.set(businessId, true);
      return {
        allowed: false,
        reason: 'Riesgo crítico de baneo alcanzado (>=85%). Envíos bloqueados automáticamente.',
        riskScore
      };
    }

    return { allowed: true, riskScore };
  }

  /**
   * Factor 5: Retardo Camaleón Dinámico con jitter orgánico
   */
  public getRecommendedDelayMs(textLength: number, riskScore: number): number {
    // Escalar un poco según longitud de texto (mecanografía humana)
    const typingTimeMs = Math.min(2500, Math.floor(textLength * 25));

    if (riskScore < 40) {
      // OPTIMAL: 1500ms a 3200ms
      const base = 1500 + Math.random() * 1700;
      return Math.round(base + typingTimeMs * 0.2);
    } else if (riskScore < 70) {
      // COOLING: 4500ms a 8000ms
      const base = 4500 + Math.random() * 3500;
      return Math.round(base + typingTimeMs * 0.3);
    } else if (riskScore < 85) {
      // SURVIVAL: 8000ms a 12000ms
      const base = 8000 + Math.random() * 4000;
      return Math.round(base + typingTimeMs * 0.4);
    } else {
      // KILL_SWITCH: retardo de protección máxima
      return 15000;
    }
  }

  /**
   * Cálculo central en tiempo real de telemetría y puntuación de riesgo (0 a 100)
   */
  public calculateRisk(businessId: string): ShieldTelemetry {
    let records = this.getHistory(businessId);
    records = this.cleanOldRecords(records);
    this.messageHistoryMap.set(businessId, records);

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const maturity = this.getMaturity(businessId);
    const maturityMult = maturity === 'new_chip' ? 2.0 : maturity === 'medium' ? 1.3 : 1.0;
    const burstSafeLimitPerMinute = maturity === 'new_chip' ? 2 : maturity === 'medium' ? 3 : 5;
    const burstSafeLimitPerHour = maturity === 'new_chip' ? 18 : maturity === 'medium' ? 32 : 48;

    const outbounds = records.filter((r) => r.direction === 'outbound');
    const inbounds = records.filter((r) => r.direction === 'inbound');

    const sentLastMinute = outbounds.filter((r) => r.timestamp >= oneMinuteAgo).length;
    const sentLastHour = outbounds.length;
    const inboundLastHour = inbounds.length;
    const outboundLastHour = sentLastHour;

    // Factor 2: Burst score
    let burstMinuteScore = 0;
    if (sentLastMinute > burstSafeLimitPerMinute) {
      burstMinuteScore = Math.min(45, (sentLastMinute - burstSafeLimitPerMinute) * 20);
    }

    let burstHourScore = 0;
    if (sentLastHour > burstSafeLimitPerHour) {
      burstHourScore = Math.min(35, ((sentLastHour - burstSafeLimitPerHour) / burstSafeLimitPerHour) * 50);
    }

    // Factor 3: Ratio Inbound / Outbound
    const totalExchanged = inboundLastHour + outboundLastHour;
    let inboundRatio = 100;
    let ratioPenalty = 0;
    if (totalExchanged > 0) {
      inboundRatio = Math.round((inboundLastHour / totalExchanged) * 100);
      if (inboundRatio < 35 && outboundLastHour >= 4) {
        ratioPenalty = Math.min(25, Math.round((35 - inboundRatio) * 0.8));
      }
    }

    // Factor 4: Huella de Repetición en los últimos 10 mensajes salientes
    const recentOut = outbounds.slice(-10);
    let duplicateRate = 0;
    let repetitionPenalty = 0;
    if (recentOut.length >= 3) {
      const hashes = recentOut.map((r) => r.contentHash);
      const uniqueHashes = new Set(hashes);
      const duplicates = recentOut.length - uniqueHashes.size;
      duplicateRate = Math.round((duplicates / recentOut.length) * 100);
      if (duplicateRate > 20) {
        repetitionPenalty = Math.min(30, Math.round(duplicateRate * 0.4));
      }
    }

    // Puntuación base
    const rawScore = (burstMinuteScore + burstHourScore + ratioPenalty + repetitionPenalty) * maturityMult;
    let riskScore = Math.min(100, Math.round(rawScore));

    const killActive = this.isKillSwitchActive(businessId);
    if (killActive) {
      riskScore = Math.max(88, riskScore);
    }

    let statusLevel: StatusLevel = 'OPTIMAL';
    if (riskScore >= 85 || killActive) {
      statusLevel = 'KILL_SWITCH';
    } else if (riskScore >= 70) {
      statusLevel = 'SURVIVAL';
    } else if (riskScore >= 40) {
      statusLevel = 'COOLING';
    }

    const recommendedDelayMs = this.getRecommendedDelayMs(60, riskScore);

    return {
      riskScore,
      statusLevel,
      killSwitchActive: killActive || statusLevel === 'KILL_SWITCH',
      metrics: {
        sentLastMinute,
        sentLastHour,
        inboundLastHour,
        outboundLastHour,
        inboundRatio,
        duplicateRate,
        recommendedDelayMs,
        numberMaturity: maturity,
        burstSafeLimitPerMinute,
        burstSafeLimitPerHour
      },
      logs: this.getLogs(businessId)
    };
  }

  /**
   * Simulador de Ráfaga de Tráfico para pruebas y demostraciones en vivo a clientes
   */
  public simulateTrafficBurst(businessId: string, count = 5) {
    const now = Date.now();
    const records = this.getHistory(businessId);
    for (let i = 0; i < count; i++) {
      records.push({
        timestamp: now - (count - i) * 2000,
        direction: 'outbound',
        contentHash: 'hash_simulado_rafaga_promocional'
      });
    }
    this.messageHistoryMap.set(businessId, records);
    const telemetry = this.calculateRisk(businessId);
    this.addLog(
      businessId,
      'warning',
      `⚡ Ráfaga simulada de ${count} mensajes salientes consecutivos procesada para auditoría de estrés.`,
      telemetry.riskScore
    );
    return telemetry;
  }
}
