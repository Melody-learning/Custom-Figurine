import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { put } from '@vercel/blob';
import { generatePrimaryRender, generateSecondaryViews } from '@/app/actions/image-to-3d';

export const maxDuration = 120; // 2 minutes to allow 4 generation calls (3-way parallel)

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
  let assetIdToFail = '';
  
  try {
    const { assetId, modelId, originalImageUrl, processedImageUrl } = await req.json();

    if (!assetId || !modelId || !originalImageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    assetIdToFail = assetId;

    console.log(`[Webhook:Generate] Starting async job for asset ${assetId}`);

    // Fetch original image (always needed for showcase / fallback)
    const imageResp = await fetch(originalImageUrl);
    const arrayBuffer = await imageResp.arrayBuffer();
    const originalBase64 = Buffer.from(arrayBuffer).toString('base64');
    
    const contentTypeFromUrl = imageResp.headers.get('content-type') || 'unknown';
    console.log(`[Webhook:Generate] Original image fetched: ${originalBase64.length} chars, content-type: ${contentTypeFromUrl}`);

    // Determine the input for primary render: use processed (bg-removed) if available
    let primaryInputBase64 = originalBase64;
    if (processedImageUrl) {
      try {
        const processedResp = await fetch(processedImageUrl);
        const processedBuffer = await processedResp.arrayBuffer();
        primaryInputBase64 = Buffer.from(processedBuffer).toString('base64');
        console.log(`[Webhook:Generate] Processed image fetched: ${primaryInputBase64.length} chars`);
      } catch (err) {
        console.warn(`[Webhook:Generate] Failed to fetch processed image, falling back to original:`, err);
      }
    }

    // 1. Generate Primary Render (提示词1 — 使用抠图后图片优先)
    const primaryResult = await generatePrimaryRender(primaryInputBase64, modelId);
    if (primaryResult.error || !primaryResult.b64_json) {
       console.error(`[Webhook:Generate] PRIMARY RENDER FAILED. Error: ${primaryResult.error}`);
       throw new Error(primaryResult.error || "Failed primary render");
    }
    const primaryB64 = primaryResult.b64_json;
    console.log(`[Webhook:Generate] Primary render success for asset ${assetId}`);

    // 2. Generate Secondary Views + Showcase (3-way parallel)
    // 提示词2 (showcase) 始终使用原始图片
    const secondaryResult = await generateSecondaryViews(primaryB64, modelId, originalBase64);
    let backB64 = secondaryResult.backViewB64;
    let sideB64 = secondaryResult.leftViewB64;
    let showcaseB64 = secondaryResult.showcaseB64;
    console.log(`[Webhook:Generate] Secondary views + showcase complete for asset ${assetId} (showcase: ${showcaseB64 ? 'yes' : 'failed/null'})`);

    // 3. Parallel Upload to Vercel CDN
    const uploadPromises = [
       uploadBase64ToBlob(primaryB64, `primary-${assetId}`),
       backB64 ? uploadBase64ToBlob(backB64, `back-${assetId}`) : Promise.resolve(null),
       sideB64 ? uploadBase64ToBlob(sideB64, `side-${assetId}`) : Promise.resolve(null),
       showcaseB64 ? uploadBase64ToBlob(showcaseB64, `showcase-${assetId}`) : Promise.resolve(null)
    ];

    const [primaryUrl, backUrl, sideUrl, showcaseUrl] = await Promise.all(uploadPromises);

    // 4. Update Database to COMPLETE (记录使用的模型)
    await prisma.generatedAsset.update({
      where: { id: assetId },
      data: {
         status: 'COMPLETE',
         resultImage: primaryUrl as string,
         backImage: backUrl as string | null,
         sideImage: sideUrl as string | null,
         showcaseImage: showcaseUrl as string | null,
         modelId: modelId,
      }
    });

    console.log(`[Webhook:Generate] Asset ${assetId} finalized successfully.`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(`[Webhook:Generate] FATAL ERROR:`, error);
    
    // Attempt to mark FAILED in DB if we extracted assetId originally
    if (assetIdToFail) {
       try {
          await prisma.generatedAsset.update({
             where: { id: assetIdToFail },
             data: { status: 'FAILED' }
          });
          console.log(`[Webhook:Generate] Marked asset ${assetIdToFail} as FAILED in database`);
       } catch (dbError) {
          console.error(`[Webhook:Generate] Failed to update DB status for ${assetIdToFail}:`, dbError);
       }
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
