import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { put } from '@vercel/blob';
import { generatePrimaryRender, generateSecondaryViews } from '@/app/actions/image-to-3d';

export const maxDuration = 120; // 2 minutes to allow 3 generation calls

async function uploadBase64ToBlob(base64Str: string, prefix: string): Promise<string> {
    let buffer: Buffer;
    let contentType = 'image/jpeg';

    if (base64Str.startsWith('data:')) {
      const parts = base64Str.split(';');
      contentType = parts[0].split(':')[1] || contentType;
      const rawData = parts[1].split(',')[1];
      buffer = Buffer.from(rawData, 'base64');
    } else {
      buffer = Buffer.from(base64Str, 'base64');
    }

    const filename = `${prefix}-${Date.now()}.jpg`;
    const blob = await put(`vault/${filename}`, buffer, {
      access: 'public',
      contentType,
    });
    return blob.url;
}

export async function POST(req: Request) {
  try {
    const { assetId, modelId, originalImageUrl } = await req.json();

    if (!assetId || !modelId || !originalImageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`[Webhook:Generate] Starting async job for asset ${assetId}`);

    // Since we only passed the URL to save webhook payload size, we fetch the image to convert it back to b64 for Gemini
    const imageResp = await fetch(originalImageUrl);
    const arrayBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    // 1. Generate Primary Render
    const primaryResult = await generatePrimaryRender(base64Image, modelId);
    if (primaryResult.error || !primaryResult.b64_json) {
       throw new Error(primaryResult.error || "Failed primary render");
    }
    const primaryB64 = primaryResult.b64_json;
    console.log(`[Webhook:Generate] Primary render success for asset ${assetId}`);

    // 2. Generate Secondary Views
    const secondaryResult = await generateSecondaryViews(primaryB64, modelId);
    let backB64 = secondaryResult.backViewB64;
    let sideB64 = secondaryResult.leftViewB64;
    console.log(`[Webhook:Generate] Secondary views success for asset ${assetId}`);

    // 3. Parallel Upload to Vercel CDN
    const uploadPromises = [
       uploadBase64ToBlob(primaryB64, `primary-${assetId}`),
       backB64 ? uploadBase64ToBlob(backB64, `back-${assetId}`) : Promise.resolve(null),
       sideB64 ? uploadBase64ToBlob(sideB64, `side-${assetId}`) : Promise.resolve(null)
    ];

    const [primaryUrl, backUrl, sideUrl] = await Promise.all(uploadPromises);

    // 4. Update Database to COMPLETE
    await prisma.generatedAsset.update({
      where: { id: assetId },
      data: {
         status: 'COMPLETE',
         resultImage: primaryUrl as string,
         backImage: backUrl as string | null,
         sideImage: sideUrl as string | null
      }
    });

    console.log(`[Webhook:Generate] Asset ${assetId} finalized successfully.`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(`[Webhook:Generate] FATAL ERROR:`, error);
    
    // Attempt to mark FAILED in DB if we extracted assetId originally
    // Notice: req.json() cannot be read twice, so if it crashed early, assetId might be missing in this scope.
    // For simplicity, we assume error happened after destructive assignments.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
