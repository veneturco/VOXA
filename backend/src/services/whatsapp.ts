import axios from 'axios';

export class WhatsAppService {
  private static instance: WhatsAppService;
  private phoneNumberId: string | null = null;
  private accessToken: string | null = null;

  private constructor() {
    this.refreshCredentials();
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  public refreshCredentials() {
    this.phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID || null;
    this.accessToken = process.env.META_WA_ACCESS_TOKEN || null;
  }

  public isConfigured(): boolean {
    this.refreshCredentials();
    return !!(this.phoneNumberId && this.accessToken);
  }

  /**
   * Send a WhatsApp text message via Cloud API
   */
  public async sendTextMessage(to: string, text: string) {
    if (!this.isConfigured()) {
      console.log(`ℹ️ [WhatsAppService] Cloud API not configured. Would send to ${to}: "${text}"`);
      return null;
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ [WhatsAppService] Failed to send text message:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Send an audio / voice note via Cloud API
   */
  public async sendAudioMessage(to: string, audioUrl: string) {
    if (!this.isConfigured()) {
      console.log(`ℹ️ [WhatsAppService] Cloud API not configured. Would send audio to ${to}: ${audioUrl}`);
      return null;
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'audio',
          audio: { link: audioUrl }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ [WhatsAppService] Failed to send audio message:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Reject / divert incoming WhatsApp Business call and send polite automated follow-up
   */
  public async handleCallIntercept(callerPhone: string, rejectionMessage: string, audioUrl?: string | null) {
    console.log(`📞 [WhatsAppService] Call intercepted from ${callerPhone}. Triggering auto-rejection polite response.`);
    if (audioUrl) {
      await this.sendAudioMessage(callerPhone, audioUrl);
    }
    return this.sendTextMessage(callerPhone, rejectionMessage);
  }
}
