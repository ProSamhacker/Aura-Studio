import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // Accept mimeType from the frontend
    const { mediaData, mimeType } = await req.json();

    const schema = z.object({
      captions: z.array(z.object({
        start: z.string().describe("Start time in seconds (e.g. 0.5)"),
        end: z.string().describe("End time in seconds (e.g. 2.5)"),
        text: z.string().describe("The spoken words"),
      }))
    });

    const result = await generateObject({
      model: google('gemini-2.5-pro'),
      schema: schema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: "Transcribe this audio/video. Return precise timestamps and text chunks." },
            { 
              type: 'file', 
              data: mediaData, 
              mediaType: mimeType || 'video/mp4' // Use provided type or default to video
            },
          ],
        },
      ],
    });

    return Response.json(result.object);

  } catch (error) {
    console.error("Transcription Error:", error);
    return new Response(JSON.stringify({ error: "Failed to transcribe" }), { status: 500 });
  }
}