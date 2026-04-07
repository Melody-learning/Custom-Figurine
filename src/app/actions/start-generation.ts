'use server';

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { put } from '@vercel/blob';
import { waitUntil } from '@vercel/functions';

interface StartGenerationPayload {
  originalImageB64: string;
  processedImageB64?: string; // 抠图后的图片 base64（可选）
  primaryModelId: string;     // Task 1 使用的模型（可能被风格覆盖）
  secondaryModelId: string;   // Task 2/3/4 使用的模型（始终全局默认）
  baseModelVariantId?: string;
  prompt?: string;
  promptOverride?: string; // 前端选中风格的主视图提示词（覆盖后端默认 PROMPT_PRIMARY）
  styleCategorySlug?: string; // 用户选择的风格大类 slug
  stylePresetSlug?: string;   // 用户选择的风格子类 slug
}

/**
 * Initiates an asynchronous Image-to-3D generation.
 * Immediately creates a PENDING record in the database for the user to see in their Profile Vault.
 * Then fires a background task to process the heavy VLM payloads.
 */
export async function startAsyncGeneration(payload: StartGenerationPayload) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
       return { success: false, reason: "unauthenticated" };
    }

    const userId = session.user.id;

    // === Quota Check (total limit only, whitelist users bypass) ===
    const quotaResult = await (async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isWhitelisted: true, maxTotalGenerations: true },
      });

      if (!user) {
        return { pass: false, reason: 'user_not_found' } as const;
      }

      // Whitelisted users have no limit
      if (user.isWhitelisted) {
        return { pass: true } as const;
      }

      // Total limit for non-whitelisted users
      const totalUsed = await prisma.generatedAsset.count({
        where: { userId, status: { in: ['PENDING', 'COMPLETE'] } },
      });
      if (totalUsed >= user.maxTotalGenerations) {
        return {
          pass: false,
          reason: 'LIMIT_REACHED',
          used: totalUsed,
          max: user.maxTotalGenerations,
        } as const;
      }

      return { pass: true } as const;
    })();

    if (!quotaResult.pass) {
      return { success: false, ...quotaResult };
    }

    // 1. Convert the heavy input Base64 into a CDN URL for safe DB storage
    let buffer: Buffer;
    let contentType = 'image/jpeg';
    if (payload.originalImageB64.startsWith('data:')) {
      const parts = payload.originalImageB64.split(';');
      contentType = parts[0].split(':')[1] || contentType;
      const rawData = parts[1].split(',')[1];
      buffer = Buffer.from(rawData, 'base64');
    } else {
      buffer = Buffer.from(payload.originalImageB64, 'base64');
    }

    const filename = `original-${userId}-${Date.now()}.jpg`;
    const blob = await put(`vault/${filename}`, buffer, {
      access: 'public',
      contentType,
    });

    // 2. If processed image (bg-removed) is provided, upload it too
    let processedBlobUrl: string | null = null;
    if (payload.processedImageB64) {
      let procBuffer: Buffer;
      let procContentType = 'image/png';
      if (payload.processedImageB64.startsWith('data:')) {
        const procParts = payload.processedImageB64.split(';');
        procContentType = procParts[0].split(':')[1] || procContentType;
        const procRawData = procParts[1].split(',')[1];
        procBuffer = Buffer.from(procRawData, 'base64');
      } else {
        procBuffer = Buffer.from(payload.processedImageB64, 'base64');
      }
      const procFilename = `processed-${userId}-${Date.now()}.png`;
      const procBlob = await put(`vault/${procFilename}`, procBuffer, {
        access: 'public',
        contentType: procContentType,
      });
      processedBlobUrl = procBlob.url;
    }

    // 3. Insert PENDING record
    const asset = await prisma.generatedAsset.create({
      data: {
        userId,
        originalImage: blob.url,
        status: 'PENDING',
        prompt: payload.prompt || null,
        baseModelVariantId: payload.baseModelVariantId || null,
        primaryModelId: payload.primaryModelId,
        secondaryModelId: payload.secondaryModelId,
        styleCategorySlug: payload.styleCategorySlug || null,
        stylePresetSlug: payload.stylePresetSlug || null,
      }
    });

    // 4. Fire the Webhook to process in the background.
    const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || vercelProdUrl || vercelUrl || 'http://localhost:3000';
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
       headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    }

    waitUntil(
      fetch(`${baseUrl}/api/webhooks/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
           assetId: asset.id, 
           primaryModelId: payload.primaryModelId,
           secondaryModelId: payload.secondaryModelId,
           originalImageUrl: blob.url,
           processedImageUrl: processedBlobUrl,
           promptOverride: payload.promptOverride || null
        })
      }).then(res => {
         if (!res.ok) console.error(`[StartAsyncGeneration] Webhook fetch error: ${res.status} ${res.statusText}`);
         else console.log(`[StartAsyncGeneration] Webhook successfully dispatched to ${baseUrl}`);
      }).catch(e => console.error("[StartAsyncGeneration] Webhook fetch network error:", e))
    );

    return { success: true, assetId: asset.id };
  } catch (error: any) {
    console.error("[StartAsyncGeneration Error]", error);
    return { success: false, error: error.message };
  }
}
