import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { image, filename } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // handle base64 image (assumes prefix data:image/...;base64,)
    let buffer: Buffer;
    let contentType = 'application/octet-stream';

    if (image.startsWith('data:')) {
      const parts = image.split(';');
      contentType = parts[0].split(':')[1];
      const base64Data = parts[1].split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const finalFilename = filename || `upload-${Date.now()}.png`;

    const blob = await put(finalFilename, buffer, {
      access: 'public',
      contentType,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading to blob:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
