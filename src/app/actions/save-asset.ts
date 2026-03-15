'use server';

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { put } from '@vercel/blob';

interface SaveAssetPayload {
  originalImageB64?: string | null;
  primaryImageB64: string;
  backImageB64?: string | null;
  sideImageB64?: string | null;
  prompt?: string;
  baseModelVariantId?: string;
}

/**
 * Helper to upload a raw Base64 image to Vercel Blob and return its public URL.
 * It ignores the Data URI prefix if present.
 */
async function uploadBase64ToBlob(base64Str: string, prefix: string): Promise<string> {
    let buffer: Buffer;
    let contentType = 'image/jpeg'; // Default to jpeg as per Gemini output

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

/**
 * Saves a generated figurine asset (and its multiple views) to the user's Profile History (Vault).
 * Automatically converts heavy Base64 strings into lightweight Vercel Blob URLs before DB insertion.
 */
export async function saveGeneratedAsset(payload: SaveAssetPayload) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
       console.log("[SaveAsset] User is not authenticated. Skipping vault history save.");
       return { success: false, reason: "unauthenticated" };
    }

    const userId = session.user.id;
    console.log(`[SaveAsset] Initiating vault save for user ${userId}...`);

    // 1. Upload images in parallel to Vercel Blob CDNs to save PostgreSQL row size
    const uploadPromises = [];
    
    // Primary is strictly required
    const primaryUpload = uploadBase64ToBlob(payload.primaryImageB64, `primary-${userId}`);
    uploadPromises.push(primaryUpload);

    // Optional ones
    const originalUpload = payload.originalImageB64 
       ? uploadBase64ToBlob(payload.originalImageB64, `original-${userId}`) 
       : Promise.resolve(null);
    uploadPromises.push(originalUpload);

    const backUpload = payload.backImageB64 
       ? uploadBase64ToBlob(payload.backImageB64, `back-${userId}`) 
       : Promise.resolve(null);
    uploadPromises.push(backUpload);

    const sideUpload = payload.sideImageB64 
       ? uploadBase64ToBlob(payload.sideImageB64, `side-${userId}`) 
       : Promise.resolve(null);
    uploadPromises.push(sideUpload);

    // Wait for all CDN uploads to finish
    const [primaryUrl, originalUrl, backUrl, sideUrl] = await Promise.all(uploadPromises);

    // 2. Insert into Prisma
    const asset = await prisma.generatedAsset.create({
      data: {
        userId,
        resultImage: primaryUrl as string,
        originalImage: originalUrl as string | null,
        backImage: backUrl as string | null,
        sideImage: sideUrl as string | null,
        prompt: payload.prompt || null,
        baseModelVariantId: payload.baseModelVariantId || null,
      }
    });

    console.log(`[SaveAsset] Successfully saved asset ${asset.id} to vault.`);
    return { success: true, assetId: asset.id };
  } catch (error: any) {
    console.error("[SaveAsset Error]", error);
    return { success: false, error: error.message };
  }
}
