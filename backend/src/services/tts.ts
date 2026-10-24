import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIO_DIR = path.resolve(__dirname, '../../public/audio');

// Set ffmpeg static binary path
if (typeof ffmpegStatic === 'string') {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export class TtsService {
  private static instance: TtsService;

  private constructor() {
    if (!fs.existsSync(AUDIO_DIR)) {
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }
  }

  public static getInstance(): TtsService {
    if (!TtsService.instance) {
      TtsService.instance = new TtsService();
    }
    return TtsService.instance;
  }

  public getAvailableVoices() {
    return [
      { id: 'es-VE-PaolaNeural', name: 'Paola (Venezuela - Femenina, Cálida)', locale: 'es-VE' },
      { id: 'es-VE-SebastianNeural', name: 'Sebastián (Venezuela - Masculina, Confiable)', locale: 'es-VE' },
      { id: 'es-CO-SalomeNeural', name: 'Salomé (Colombia - Dinámica, Enérgica)', locale: 'es-CO' },
      { id: 'es-MX-DaliaNeural', name: 'Dalia (México - Ejecutiva, Neutra)', locale: 'es-MX' },
      { id: 'es-ES-AlvaroNeural', name: 'Álvaro (España - Profesional)', locale: 'es-ES' }
    ];
  }

  /**
   * Synthesizes text to MP3 using msedge-tts and optionally converts to WhatsApp .ogg (opus).
   * Returns web-accessible URL and buffer.
   */
  public async synthesizeTextToAudio(
    text: string,
    voiceName = 'es-VE-PaolaNeural',
    convertToOgg = false
  ): Promise<{ audioUrl: string; filePath: string; durationEstimate: number } | null> {
    try {
      const sanitizedText = text.replace(/[*_#`~]/g, '').trim();
      if (!sanitizedText) return null;

      const fileBase = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mp3Path = path.join(AUDIO_DIR, `${fileBase}.mp3`);
      const oggPath = path.join(AUDIO_DIR, `${fileBase}.ogg`);

      const tts = new MsEdgeTTS();
      await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

      const streamResult = (await tts.toStream(sanitizedText)) as any;
      const audioStream = streamResult.audioStream || streamResult;
      const writeStream = fs.createWriteStream(mp3Path);

      await new Promise<void>((resolve, reject) => {
        audioStream.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err: any) => reject(err));
      });

      let finalFilePath = mp3Path;
      let finalFileName = `${fileBase}.mp3`;

      // If conversion to OGG requested and ffmpeg is functional
      if (convertToOgg && ffmpegStatic) {
        try {
          await new Promise<void>((resolve, reject) => {
            ffmpeg(mp3Path)
              .toFormat('ogg')
              .audioCodec('libopus')
              .audioBitrate('32k')
              .on('end', () => resolve())
              .on('error', (err) => reject(err))
              .save(oggPath);
          });
          finalFilePath = oggPath;
          finalFileName = `${fileBase}.ogg`;
        } catch (convErr) {
          console.warn('⚠️ [TtsService] OGG conversion failed, falling back to MP3:', convErr);
          finalFilePath = mp3Path;
          finalFileName = `${fileBase}.mp3`;
        }
      }

      // Duration estimate based on ~130 words per minute
      const wordCount = sanitizedText.split(/\s+/).length;
      const durationEstimate = Math.max(2, Math.round((wordCount / 130) * 60));

      const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:4000';
      const audioUrl = `${baseUrl}/audio/${finalFileName}`;

      return {
        audioUrl,
        filePath: finalFilePath,
        durationEstimate
      };
    } catch (error) {
      console.error('❌ [TtsService] Failed to synthesize audio:', error);
      return null;
    }
  }

  /**
   * Generates a special 2-minute daily audio briefing for the business owner.
   */
  public async generateDailyOwnerBriefing(summaryText: string, voiceName = 'es-VE-SebastianNeural') {
    return this.synthesizeTextToAudio(summaryText, voiceName, false);
  }
}
