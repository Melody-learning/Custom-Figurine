'use server';

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { del } from '@vercel/blob';

/**
 * Server Action: Deletes a GeneratedAsset record and its associated Vercel Blob files.
 * Validates that the requesting user actually owns the asset.
 */
export async function deleteGeneratedAsset(assetId: string) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
       return { error: 'Unauthorized' };
    }

    // 1. Verify ownership and fetch URLs for blob cleanup
    const asset = await prisma.generatedAsset.findUnique({
       where: { id: assetId }
    });

    if (!asset) {
       return { error: 'Asset not found' };
    }

    if (asset.userId !== session.user.id) {
       return { error: 'Forbidden: You do not own this asset' };
    }

    // 2. Delete the database record first (referential integrity)
    await prisma.generatedAsset.delete({
       where: { id: assetId }
    });

    // 3. Purge orphaned files from Vercel Blob Storage in the background (fire and forget pattern for speed)
    // We swallow errors here because if the DB row is gone, the asset is logically deleted from the product.
    // Blob cleanup is a space-saving optimization.
    const urlsToDelete = [];
    const untypedAsset = asset as any;
    if (untypedAsset.resultImage) urlsToDelete.push(untypedAsset.resultImage);
    if (untypedAsset.sideImage) urlsToDelete.push(untypedAsset.sideImage);
    if (untypedAsset.backImage) urlsToDelete.push(untypedAsset.backImage);
    if (untypedAsset.originalImage) urlsToDelete.push(untypedAsset.originalImage);
    
    if (urlsToDelete.length > 0) {
       Promise.all(urlsToDelete.map(url => del(url))).catch(err => {
          console.error(`[Blob Cleanup Error] Failed to delete blobs for asset ${assetId}:`, err);
       });
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Delete Asset Error]:", error);
    return { error: error.message || "Failed to delete asset" };
  }
}
