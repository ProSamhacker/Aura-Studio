// src/app/api/video-proxy/route.ts - FIXED VERSION
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    // Extract File ID with better regex
    const idMatch = url.match(/(?:id=|\/d\/|\/file\/d\/)([\w-]+)/);
    const fileId = idMatch ? idMatch[1] : null;

    if (!fileId) {
      console.error('Invalid Drive URL:', url);
      return new NextResponse('Invalid Google Drive URL format', { status: 400 });
    }

    // Validate environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.error('Missing Google OAuth credentials');
      return new NextResponse('Server configuration error', { status: 500 });
    }

    // Setup OAuth2 Client
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({ 
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN 
    });

    const drive = google.drive({ version: 'v3', auth });

    // Get file metadata first to check if accessible
    let fileMetadata;
    try {
      const metadataResponse = await drive.files.get({
        fileId,
        fields: 'name, mimeType, size'
      });
      fileMetadata = metadataResponse.data;
    } catch (metaError: any) {
      console.error('File metadata error:', metaError);
      return new NextResponse('File not accessible or does not exist', { status: 404 });
    }

    // Fetch the actual file stream
    const response = await drive.files.get(
      { 
        fileId, 
        alt: 'media',
        supportsAllDrives: true 
      },
      { responseType: 'stream' }
    );

    // Create proper headers for video streaming
    const headers = new Headers();
    headers.set('Content-Type', fileMetadata.mimeType || 'video/mp4');
    
    if (fileMetadata.size) {
      headers.set('Content-Length', fileMetadata.size);
    }
    
    // CRITICAL: These headers enable cross-origin video playback
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Range');
    
    // Enable range requests for seeking
    headers.set('Accept-Ranges', 'bytes');
    
    // Cache for 1 hour
    headers.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(response.data as any, { 
      status: 200,
      headers 
    });

  } catch (error: any) {
    console.error('Video Proxy Error:', error);
    
    if (error.code === 403) {
      return new NextResponse('Access denied - Check Drive permissions', { status: 403 });
    }
    
    if (error.code === 404) {
      return new NextResponse('Video file not found', { status: 404 });
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Proxy failed', 
        details: error.message,
        code: error.code 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
    },
  });
}