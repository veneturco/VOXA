import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { AppDatabase, BusinessConfig, Conversation, Lead, MessageRecord, Transaction } from '../types/index.js';
import { BUSINESS_TEMPLATES } from '../config/templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export class StorageService {
  private static instance: StorageService;
  private isFirestoreActive = false;
  private firestoreDb: admin.firestore.Firestore | null = null;
  private localMemoryDb: AppDatabase;

  private constructor() {
    this.localMemoryDb = this.initializeLocalDb();
    this.initFirebaseIfAvailable();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private getDefaultBusinessesList(): BusinessConfig[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'default_business',
        ...BUSINESS_TEMPLATES.clinica,
        bcv_rate: 52.4,
        updated_at: now
      },
      {
        id: 'taller_vene_turco',
        ...BUSINESS_TEMPLATES.taller,
        bcv_rate: 52.4,
        updated_at: now
      },
      {
        id: 'tienda_express_vt',
        ...BUSINESS_TEMPLATES.tienda,
        bcv_rate: 52.4,
        updated_at: now
      }
    ];
  }

  private initializeLocalDb(): AppDatabase {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as AppDatabase;
        if (!parsed.business.bcv_rate) {
          parsed.business.bcv_rate = 52.4;
        }
        if (!parsed.businesses || parsed.businesses.length === 0) {
          parsed.businesses = [
            parsed.business,
            ...this.getDefaultBusinessesList().filter((b) => b.id !== parsed.business.id)
          ];
        }
        return parsed;
      } catch (err) {
        console.warn('⚠️ Error reading local db.json, reinitializing default store:', err);
      }
    }

    const defaultList = this.getDefaultBusinessesList();
    const defaultBusiness = defaultList[0];

    const initialDb: AppDatabase = {
      business: defaultBusiness,
      businesses: defaultList,
      processed_message_ids: [],
      leads: [],
      conversations: [],
      messages: [],
      transactions: []
    };

    this.persistLocalDb(initialDb);
    return initialDb;
  }

  private persistLocalDb(db: AppDatabase) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('❌ Failed to write local db.json:', err);
    }
  }

  private initFirebaseIfAvailable() {
    const credEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!credEnv || credEnv.trim() === '') {
      console.log('ℹ️ [Storage] No FIREBASE_SERVICE_ACCOUNT detected. Running seamlessly in Local JSON DB mode.');
      this.isFirestoreActive = false;
      return;
    }

    try {
      let serviceAccount: any;
      if (credEnv.trim().startsWith('{')) {
        serviceAccount = JSON.parse(credEnv);
      } else if (fs.existsSync(credEnv)) {
        serviceAccount = JSON.parse(fs.readFileSync(credEnv, 'utf-8'));
      }

      if (serviceAccount && serviceAccount.project_id) {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
        }
        this.firestoreDb = admin.firestore();
        this.isFirestoreActive = true;
        console.log('✅ [Storage] Connected to Google Cloud Firestore successfully!');
      }
    } catch (error) {
      console.warn('⚠️ [Storage] Could not initialize Firestore with provided credentials. Falling back to Local JSON DB:', error);
      this.isFirestoreActive = false;
    }
  }

  public getStorageStatus() {
    return {
      mode: this.isFirestoreActive ? 'firestore' : 'local_json',
      firestoreActive: this.isFirestoreActive,
      localDbPath: DB_FILE,
      totalConversations: this.localMemoryDb.conversations.length,
      totalLeads: this.localMemoryDb.leads.length,
      totalTransactions: this.localMemoryDb.transactions.length
    };
  }

  // Multi-tenant Businesses
  public async getBusinesses(): Promise<BusinessConfig[]> {
    if (!this.localMemoryDb.businesses || this.localMemoryDb.businesses.length === 0) {
      this.localMemoryDb.businesses = [this.localMemoryDb.business];
    }
    return this.localMemoryDb.businesses;
  }

  public async switchActiveBusiness(businessId: string): Promise<BusinessConfig> {
    const list = await this.getBusinesses();
    const target = list.find((b) => b.id === businessId);
    if (target) {
      this.localMemoryDb.business = target;
      this.persistLocalDb(this.localMemoryDb);
      return target;
    }
    return this.localMemoryDb.business;
  }

  public async createNewBusiness(data: { name: string; category: 'clinica' | 'taller' | 'tienda' }): Promise<BusinessConfig> {
    const template = BUSINESS_TEMPLATES[data.category] || BUSINESS_TEMPLATES.tienda;
    const newBiz: BusinessConfig = {
      ...template,
      id: `biz_${Date.now()}`,
      name: data.name.trim() || template.name,
      category: data.category,
      bcv_rate: this.localMemoryDb.business.bcv_rate || 52.4,
      updated_at: new Date().toISOString()
    };

    if (!this.localMemoryDb.businesses) {
      this.localMemoryDb.businesses = [this.localMemoryDb.business];
    }
    this.localMemoryDb.businesses.push(newBiz);
    this.localMemoryDb.business = newBiz;
    this.persistLocalDb(this.localMemoryDb);
    return newBiz;
  }

  // Business Config
  public async getBusinessConfig(): Promise<BusinessConfig> {
    if (this.isFirestoreActive && this.firestoreDb) {
      const doc = await this.firestoreDb.collection('settings').doc('business').get();
      if (doc.exists) {
        return doc.data() as BusinessConfig;
      }
    }
    return this.localMemoryDb.business;
  }

  public async updateBusinessConfig(config: Partial<BusinessConfig>): Promise<BusinessConfig> {
    const updated: BusinessConfig = {
      ...this.localMemoryDb.business,
      ...config,
      updated_at: new Date().toISOString()
    };
    this.localMemoryDb.business = updated;

    if (this.localMemoryDb.businesses) {
      const idx = this.localMemoryDb.businesses.findIndex((b) => b.id === updated.id);
      if (idx >= 0) {
        this.localMemoryDb.businesses[idx] = updated;
      } else {
        this.localMemoryDb.businesses.push(updated);
      }
    }

    this.persistLocalDb(this.localMemoryDb);

    if (this.isFirestoreActive && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('settings').doc('business').set(updated, { merge: true });
      } catch (err) {
        console.error('Firestore update error:', err);
      }
    }
    return updated;
  }

  // Deduplication
  public async isMessageProcessed(waMessageId: string): Promise<boolean> {
    if (!waMessageId) return false;
    if (this.isFirestoreActive && this.firestoreDb) {
      const doc = await this.firestoreDb.collection('processed_messages').doc(waMessageId).get();
      return doc.exists;
    }
    return this.localMemoryDb.processed_message_ids.includes(waMessageId);
  }

  public async markMessageProcessed(waMessageId: string): Promise<void> {
    if (!waMessageId) return;
    if (!this.localMemoryDb.processed_message_ids.includes(waMessageId)) {
      this.localMemoryDb.processed_message_ids.push(waMessageId);
      if (this.localMemoryDb.processed_message_ids.length > 5000) {
        this.localMemoryDb.processed_message_ids = this.localMemoryDb.processed_message_ids.slice(-3000);
      }
      this.persistLocalDb(this.localMemoryDb);
    }
    if (this.isFirestoreActive && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('processed_messages').doc(waMessageId).set({
          processed_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Firestore markMessageProcessed error:', err);
      }
    }
  }

  // Conversations
  public async getConversation(conversationId: string): Promise<Conversation | null> {
    const conv = this.localMemoryDb.conversations.find((c) => c.id === conversationId);
    return conv || null;
  }

  public async getConversations(): Promise<Conversation[]> {
    return [...this.localMemoryDb.conversations].sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  }

  public async saveConversation(conversation: Conversation): Promise<Conversation> {
    const idx = this.localMemoryDb.conversations.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      this.localMemoryDb.conversations[idx] = { ...this.localMemoryDb.conversations[idx], ...conversation };
    } else {
      this.localMemoryDb.conversations.push(conversation);
    }
    this.persistLocalDb(this.localMemoryDb);

    if (this.isFirestoreActive && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('conversations').doc(conversation.id).set(conversation, { merge: true });
      } catch (e) {
        console.error('Firestore saveConversation error:', e);
      }
    }
    return conversation;
  }

  public async setBotPaused(conversationId: string, paused: boolean): Promise<boolean> {
    const conv = this.localMemoryDb.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.bot_paused = paused;
      this.persistLocalDb(this.localMemoryDb);
    }
    if (this.isFirestoreActive && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('conversations').doc(conversationId).update({ bot_paused: paused });
      } catch (e) {
        console.error('Firestore setBotPaused error:', e);
      }
    }
    return true;
  }

  // Messages
  public async getMessages(conversationId: string): Promise<MessageRecord[]> {
    return this.localMemoryDb.messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public async saveMessage(message: MessageRecord): Promise<MessageRecord> {
    this.localMemoryDb.messages.push(message);
    this.persistLocalDb(this.localMemoryDb);

    if (this.isFirestoreActive && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('messages').doc(message.id).set(message);
      } catch (e) {
        console.error('Firestore saveMessage error:', e);
      }
    }
    return message;
  }

  // Leads
  public async getLeads(): Promise<Lead[]> {
    return [...this.localMemoryDb.leads].sort((a, b) => b.buying_score - a.buying_score);
  }

  public async getLead(phoneOrUserId: string): Promise<Lead | null> {
    const lead = this.localMemoryDb.leads.find((l) => l.phone_or_user_id === phoneOrUserId);
    return lead || null;
  }

  public async saveLead(leadData: Partial<Lead> & { phone_or_user_id: string }): Promise<Lead> {
    const idx = this.localMemoryDb.leads.findIndex((l) => l.phone_or_user_id === leadData.phone_or_user_id);
    const now = new Date().toISOString();
    let updatedLead: Lead;

    if (idx >= 0) {
      updatedLead = {
        ...this.localMemoryDb.leads[idx],
        ...leadData,
        updated_at: now
      };
      this.localMemoryDb.leads[idx] = updatedLead;
    } else {
      updatedLead = {
        id: 'lead_' + Date.now(),
        phone_or_user_id: leadData.phone_or_user_id,
        customer_name: leadData.customer_name || 'Cliente',
        need_or_vehicle_or_symptom: leadData.need_or_vehicle_or_symptom || '',
        address_or_zone: leadData.address_or_zone || '',
        main_objection: leadData.main_objection || '',
        buying_score: leadData.buying_score ?? 10,
        last_intent: leadData.last_intent || 'navegando',
        missing_information: leadData.missing_information || [],
        total_messages: 1,
        created_at: now,
        updated_at: now
      };
      this.localMemoryDb.leads.push(updatedLead);
    }
    this.persistLocalDb(this.localMemoryDb);

    if (this.isFirestoreActive && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('leads').doc(updatedLead.phone_or_user_id).set(updatedLead, { merge: true });
      } catch (e) {
        console.error('Firestore saveLead error:', e);
      }
    }
    return updatedLead;
  }

  // Transactions
  public async getTransactions(): Promise<Transaction[]> {
    return [...this.localMemoryDb.transactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async saveTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const now = new Date().toISOString();
    const newTx: Transaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...tx,
      created_at: now,
      updated_at: now
    };
    this.localMemoryDb.transactions.push(newTx);
    this.persistLocalDb(this.localMemoryDb);

    if (this.isFirestoreActive && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('transactions').doc(newTx.id).set(newTx);
      } catch (e) {
        console.error('Firestore saveTransaction error:', e);
      }
    }
    return newTx;
  }

  public async updateTransactionStatus(id: string, status: 'verificado' | 'rechazado'): Promise<Transaction | null> {
    const tx = this.localMemoryDb.transactions.find((t) => t.id === id);
    if (!tx) return null;

    tx.status = status;
    tx.updated_at = new Date().toISOString();
    this.persistLocalDb(this.localMemoryDb);

    if (this.isFirestoreActive && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('transactions').doc(id).update({
          status,
          updated_at: tx.updated_at
        });
      } catch (e) {
        console.error('Firestore updateTransactionStatus error:', e);
      }
    }
    return tx;
  }
}
