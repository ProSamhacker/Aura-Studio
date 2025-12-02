// src/core/ffmpeg/actions.ts - FIXED VERSION
import { fetchFile } from '@ffmpeg/util';
import { FFmpegClient } from './client';

// Helper to generate unique filenames
const generateFileName = (prefix: string, ext: string) => 
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;

// Helper to safely cleanup files
async function safeCleanup(ffmpeg: any, ...fileNames: string[]) {
  for (const fileName of fileNames) {
    try {
      await ffmpeg.deleteFile(fileName);
    } catch (e) {
      // File might not exist, ignore
    }
  }
}

export async function compressVideo(
  videoUrl: string,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await FFmpegClient.getInstance();
  
  const inputName = generateFileName('input', 'mp4');
  const outputName = generateFileName('output', 'mp4');

  onProgress(0);
  
  const progressListener = ({ progress }: { progress: number }) => {
    const pct = Math.min(99, Math.round(progress * 100));
    onProgress(pct);
  };
  
  ffmpeg.on('progress', progressListener);

  try {
    console.log('📥 Loading video into FFmpeg...');
    await ffmpeg.writeFile(inputName, await fetchFile(videoUrl));

    console.log('⚙️ Compressing video...');
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'scale=-2:360,fps=15', 
      '-c:v', 'libx264',
      '-preset', 'ultrafast', 
      '-crf', '32', 
      '-c:a', 'aac',
      '-ar', '16000',  
      '-b:a', '32k',   
      '-y', // Overwrite output
      outputName
    ]);

    console.log('📤 Reading compressed video...');
    const data = await ffmpeg.readFile(outputName);
    onProgress(100);
    
    return new Blob([data as any], { type: 'video/mp4' });

  } catch (error: any) {
    console.error('❌ Compression failed:', error);
    throw new Error(`Video compression failed: ${error.message}`);
  } finally {
    await safeCleanup(ffmpeg, inputName, outputName);
    ffmpeg.off('progress', progressListener);
  }
}

export async function mergeAudioWithVideo(
  videoUrl: string,
  audioUrl: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const ffmpeg = await FFmpegClient.getInstance();
  
  const videoName = generateFileName('video', 'mp4');
  const audioName = generateFileName('audio', 'mp3');
  const outputName = generateFileName('final', 'mp4');

  onProgress(0);
  
  const progressListener = ({ progress }: { progress: number }) => {
    onProgress(Math.min(99, Math.round(progress * 100)));
  };
  
  ffmpeg.on('progress', progressListener);

  try {
    console.log('📥 Loading video and audio...');
    await Promise.all([
      ffmpeg.writeFile(videoName, await fetchFile(videoUrl)),
      ffmpeg.writeFile(audioName, await fetchFile(audioUrl))
    ]);

    console.log('🎬 Merging audio with video...');
    await ffmpeg.exec([
      '-i', videoName,
      '-i', audioName,
      '-c:v', 'copy', 
      '-c:a', 'aac',
      '-b:a', '128k',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-shortest',
      '-y',
      outputName
    ]);

    console.log('📤 Reading final video...');
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: 'video/mp4' });
    onProgress(100);
    
    return URL.createObjectURL(blob);

  } catch (error: any) {
    console.error('❌ Merge failed:', error);
    throw new Error(`Audio merge failed: ${error.message}`);
  } finally {
    await safeCleanup(ffmpeg, videoName, audioName, outputName);
    ffmpeg.off('progress', progressListener);
  }
}

export async function trimVideo(
  videoUrl: string, 
  start: number, 
  end: number,
  onProgress: (progress: number) => void
): Promise<string> {
  const ffmpeg = await FFmpegClient.getInstance();

  const inputName = generateFileName('input', 'mp4');
  const outputName = generateFileName('trimmed', 'mp4');
  
  onProgress(0);

  const progressListener = ({ progress }: { progress: number }) => {
    onProgress(Math.min(99, Math.round(progress * 100)));
  };
  
  ffmpeg.on('progress', progressListener);

  try {
    console.log('📥 Loading video...');
    await ffmpeg.writeFile(inputName, await fetchFile(videoUrl));

    console.log(`✂️ Trimming video (${start}s to ${end}s)...`);
    await ffmpeg.exec([
      '-i', inputName,
      '-ss', start.toString(),
      '-to', end.toString(),
      '-c', 'copy',
      '-y',
      outputName
    ]);

    console.log('📤 Reading trimmed video...');
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: 'video/mp4' });
    onProgress(100);
    
    return URL.createObjectURL(blob);

  } catch (error: any) {
    console.error('❌ Trim failed:', error);
    throw new Error(`Video trim failed: ${error.message}`);
  } finally {
    await safeCleanup(ffmpeg, inputName, outputName);
    ffmpeg.off('progress', progressListener);
  }
}

export async function downscaleVideo(videoUrl: string): Promise<string> {
  const ffmpeg = await FFmpegClient.getInstance();
  
  const inputName = generateFileName('input_ds', 'mp4');
  const outputName = generateFileName('output_ds', 'mp4');

  try {
    console.log('📥 Loading video...');
    await ffmpeg.writeFile(inputName, await fetchFile(videoUrl));

    console.log('⬇️ Downscaling to 480p...');
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'scale=-2:480', 
      '-c:v', 'libx264',
      '-crf', '28',
      '-preset', 'ultrafast',
      '-y',
      outputName
    ]);

    console.log('📤 Reading downscaled video...');
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: 'video/mp4' });
    
    return URL.createObjectURL(blob);

  } catch (error: any) {
    console.error('❌ Downscale failed:', error);
    throw new Error(`Video downscale failed: ${error.message}`);
  } finally {
    await safeCleanup(ffmpeg, inputName, outputName);
  }
}