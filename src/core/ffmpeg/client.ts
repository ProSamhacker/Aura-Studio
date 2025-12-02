// src/core/ffmpeg/client.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class FFmpegClient {
  private static instance: FFmpeg | null = null;
  private static loaded: boolean = false;
  private static loading: Promise<FFmpeg> | null = null;

  public static async getInstance(): Promise<FFmpeg> {
    // If already loading, wait for that to complete
    if (this.loading) {
      return this.loading;
    }

    // If already loaded, return immediately
    if (this.instance && this.loaded) {
      return this.instance;
    }

    // Start loading
    this.loading = this.loadFFmpeg();
    
    try {
      const ffmpeg = await this.loading;
      return ffmpeg;
    } finally {
      this.loading = null;
    }
  }

  private static async loadFFmpeg(): Promise<FFmpeg> {
    if (!this.instance) {
      this.instance = new FFmpeg();
      
      // Add logging for debugging
      this.instance.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });
    }

    const ffmpeg = this.instance;

    if (!this.loaded) {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        this.loaded = true;
        console.log('✅ FFmpeg loaded successfully');
      } catch (error) {
        console.error('❌ FFmpeg load failed:', error);
        this.instance = null;
        this.loaded = false;
        throw new Error('Failed to load FFmpeg');
      }
    }

    return ffmpeg;
  }

  // Reset FFmpeg if it gets stuck
  public static async reset(): Promise<void> {
    if (this.instance) {
      try {
        // Don't terminate, just reset the instance flag
        this.instance = null;
        this.loaded = false;
        console.log('🔄 FFmpeg reset');
      } catch (e) {
        console.warn('Reset warning:', e);
      }
    }
  }
}
