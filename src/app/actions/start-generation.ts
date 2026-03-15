'use server';

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { put } from '@vercel/blob';
import { waitUntil } from '@vercel/functions';

interface StartGenerationPayload {
  originalImageB64: string;
  modelId: string;
  baseModelVariantId?: string;
  prompt?: string;
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

    // 2. Insert PENDING record
    const asset = await prisma.generatedAsset.create({
      data: {
        userId,
        originalImage: blob.url,
        status: 'PENDING',
        prompt: payload.prompt || null,
        baseModelVariantId: payload.baseModelVariantId || null,
      }
    });

    // 3. Fire the Webhook to process in the background.
    // In Vercel, un-awaited promises are immediately killed when the response returns.
    // We MUST use waitUntil() to keep the container execution context alive just long enough to dispatch the fetch.
    
    // Robust URL resolution: prioritize Production Domain to bypass Preview Password Protections naturally
    const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || vercelProdUrl || vercelUrl || 'http://localhost:3000';
    
    // Inject bypass token in case the environment strictly forces Vercel Authentication
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
       headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    }

    // We don't await the fetch so the UI unblocks instantly, but we tell Vercel to wait for its network dispatch to complete.
    waitUntil(
      fetch(`${baseUrl}/api/webhooks/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
           assetId: asset.id, 
           modelId: payload.modelId,
           originalImageUrl: blob.url
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
