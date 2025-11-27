// src/app/api/ai/analyze/route.ts
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow this API to handle large requests (like video analysis)
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt, fileData } = await req.json();

    // 1. Construct the prompt for Gemini
    const userPrompt = `
      You are an expert Video Editor and YouTube Strategist.
      Analyze this video data and provide:
      1. A summary of what happens.
      2. The mood and pacing (fast, slow, energetic).
      3. A viral title suggestion.
      4. A suggested script for a voiceover that matches the visual flow.
      
      Context provided by user: ${prompt}
    `;

    // 2. Call Gemini 1.5 Pro (it has a huge context window for video)
    const result = streamText({
      model: google('gemini-2.5-pro'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            // In a real app, you would pass the video as a buffer or URL here.
            // For this prototype, we are simulating the text context first.
          ],
        },
      ],
    });

    // 3. Stream the text back to the frontend
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return new Response("Error analyzing video", { status: 500 });
  }
}