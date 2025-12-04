import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow this API to handle large requests (video processing takes time)
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 1. Get the video data sent from the frontend
    const { prompt, videoData, mimeType } = await req.json();

    // 2. Call Gemini with BOTH text and video
    const result = streamText({
      model: google('gemini-2.5-flash'), // Best model for video analysis
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt }, 
         { 
              type: 'file', 
              data: videoData, 
              mediaType: mimeType || 'video/mp4' 
            },
          ],
        },
      ],
    });

    // 3. Stream the response back
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to analyze video" }), { status: 500 });
  }
}