// src/core/ffmpeg/actions.ts
import { fetchFile } from '@ffmpeg/util';
import { FFmpegClient } from './client';

export async function trimVideo(
  videoUrl: string, 
  start: number, 
  end: number,
  onProgress: (progress: number) => void
): Promise<string> {
  const ffmpeg = await FFmpegClient.getInstance();

  // Use unique names to prevent conflicts
  const inputName = `input_${Date.now()}.mp4`;
  const outputName = `output_${Date.now()}.mp4`;
  
  // Reset progress to 0 initially
  onProgress(0);

  // Define the listener
  const progressListener = ({ progress }: { progress: number }) => {
    onProgress(Math.round(progress * 100));
  };
  
  // Add listener
  ffmpeg.on('progress', progressListener);

  try {
    // 1. Write file
    await ffmpeg.writeFile(inputName, await fetchFile(videoUrl));

    // 2. Run Trim
    await ffmpeg.exec([
      '-i', inputName,
      '-ss', start.toString(),
      '-to', end.toString(),
      '-c', 'copy', // Fast copy (no re-encoding)
      outputName
    ]);

    // 3. Read result
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: 'video/mp4' });
    return URL.createObjectURL(blob);

  } finally {
    // CRITICAL: Cleanup files and listeners to prevent memory leaks/crashes
    try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
    } catch(e) {
        console.warn("Cleanup error:", e);
    }
    ffmpeg.off('progress', progressListener);
  }
}

export async function downscaleVideo(videoUrl: string): Promise<string> {
  const ffmpeg = await FFmpegClient.getInstance();
  const inputName = `input_ds_${Date.now()}.mp4`;
  const outputName = `output_ds_${Date.now()}.mp4`;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(videoUrl));

    // Scale to 480p
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'scale=-2:480', 
      '-c:v', 'libx264',
      '-crf', '28',
      '-preset', 'ultrafast',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: 'video/mp4' });
    return URL.createObjectURL(blob);

  } finally {
    // Cleanup
    try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
    } catch(e) {}
  }
}

export async function compressVideo(
  videoUrl: string,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await FFmpegClient.getInstance();
  
  // Unique filenames to prevent memory collisions
  const inputName = `input_${Date.now()}.mp4`;
  const outputName = `output_${Date.now()}.mp4`;

  onProgress(0);
  
  // Enhanced Progress Listener with Logging
  const progressListener = ({ progress }: { progress: number }) => {
    const pct = Math.round(progress * 100);
    console.log(`Processing: ${pct}%`); // Check console if it sticks again
    onProgress(pct);
  };
  
  ffmpeg.on('progress', progressListener);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(videoUrl));

    // THE SPEED HACK COMMAND
    await ffmpeg.exec([
      '-i', inputName,
      // 1. Scale to 360p (40% faster than 480p, AI sees it fine)
      '-vf', 'scale=-2:360,fps=15', 
      // 2. Use H.264 Ultrafast preset (The real speed booster)
      '-c:v', 'libx264',
      '-preset', 'ultrafast', 
      // 3. High compression (CRF 32) -> Smaller file -> Faster AI upload
      '-crf', '32', 
      // 4. Audio settings
      '-c:a', 'aac',
      '-ar', '16000',  
      '-b:a', '32k',   
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    
    // Create blob from the result
    return new Blob([data as any], { type: 'video/mp4' });

  } finally {
    // Cleanup
    try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
    } catch(e) { console.warn("Cleanup warning:", e); }
    
    ffmpeg.off('progress', progressListener);
  }
}
// Add this to src/core/ffmpeg/actions.ts

export async function mergeAudioWithVideo(
  videoUrl: string,
  audioUrl: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const ffmpeg = await FFmpegClient.getInstance();
  const videoName = `video_${Date.now()}.mp4`;
  const audioName = `audio_${Date.now()}.mp3`;
  const outputName = `final_${Date.now()}.mp4`;

  onProgress(0);
  
  const progressListener = ({ progress }: { progress: number }) => {
    onProgress(Math.round(progress * 100));
  };
  ffmpeg.on('progress', progressListener);

  try {
    // 1. Write both files to memory
    await ffmpeg.writeFile(videoName, await fetchFile(videoUrl));
    await ffmpeg.writeFile(audioName, await fetchFile(audioUrl));

    // 2. Run Merge Command
    // -map 0:v = Take video from first input
    // -map 1:a = Take audio from second input (Replces original audio)
    // -c:v copy = Don't re-encode video (Super Fast!)
    // -shortest = Stop when the shortest input ends
    await ffmpeg.exec([
      '-i', videoName,
      '-i', audioName,
      '-c:v', 'copy', 
      '-c:a', 'aac',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-shortest',
      outputName
    ]);

    // 3. Read Result
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: 'video/mp4' });
    return URL.createObjectURL(blob);

  } finally {
    // Cleanup
    try {
        await ffmpeg.deleteFile(videoName);
        await ffmpeg.deleteFile(audioName);
        await ffmpeg.deleteFile(outputName);
    } catch(e) {}
    ffmpeg.off('progress', progressListener);
  }
}