'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Trash2, CalendarHeart, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { deleteGeneratedAsset } from '@/app/actions/delete-asset';
import { toast } from 'sonner';

interface Asset {
  id: string;
  status: 'PENDING' | 'COMPLETE' | 'FAILED';
  resultImage?: string | null;
  sideImage?: string | null;
  backImage?: string | null;
  originalImage?: string | null;
  modelId?: string | null;
  createdAt?: string | Date;
}

interface GenerationVaultListProps {
  initialAssets: Asset[];
}

export default function GenerationVaultList({ initialAssets }: GenerationVaultListProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [clearingStale, setClearingStale] = useState(false);

  // 超过 2 小时的 PENDING 资产视为 “Stale”，直接展示为失败状态
  const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2小时
  const isStale = (asset: Asset): boolean => {
    if (asset.status !== 'PENDING') return false;
    if (!asset.createdAt) return true; // 无时间戳的也不信任
    const age = Date.now() - new Date(asset.createdAt).getTime();
    return age > STALE_THRESHOLD_MS;
  };
  const staleAssets = assets.filter(isStale);
  const failedAssets = assets.filter(a => a.status === 'FAILED' || (failedImageIds.has(a.id) && !isStale(a)));
  
  const router = useRouter();
  const { setUploadedImage, setGeneratedImage, setGeneratedViews, setGenerationStatus, setEditingVaultAssetId } = useStore();

  useEffect(() => {
    // Collect all pending asset IDs
    const pendingIds = assets.filter(a => a.status === 'PENDING').map(a => a.id);
    
    if (pendingIds.length === 0) return;

    // Set up a polling interval for just the pending ones
    const interval = setInterval(async () => {
      let anyChanged = false;
      const newAssets = [...assets];

      for (let i = 0; i < newAssets.length; i++) {
        const asset = newAssets[i];
        if (asset.status === 'PENDING') {
          try {
            const res = await fetch(`/api/assets/${asset.id}`);
            if (res.ok) {
              const data = await res.json();
              if (data.asset && data.asset.status !== 'PENDING') {
                newAssets[i] = data.asset;
                anyChanged = true;
              }
            }
          } catch (e) {
             console.error(`Error polling asset ${asset.id}:`, e);
          }
        }
      }

      if (anyChanged) {
        setAssets(newAssets);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [assets]);

  const handleCheckout = (asset: Asset) => {
     if (!asset.resultImage) return;
     
     // Detect literal "null" string from poorly serialized legacy JSON
     const validOriginal = asset.originalImage && asset.originalImage !== "null" ? asset.originalImage : '';
     
     // Inject to Zustand Store to revive the checkout flow
     setUploadedImage(validOriginal);
     setGeneratedImage(asset.resultImage);
     setGeneratedViews({ 
        primary: asset.resultImage, 
        back: asset.backImage || '', 
        side: asset.sideImage || '' 
     });
     setGenerationStatus('success');
     setEditingVaultAssetId(asset.id);
     
     toast.success("Design loaded! Preparing checkout...");
     // Redirect to Customize Step 3 (Select Model/Size)
     router.push('/customize?source=vault');
  };

  const handleDelete = async (assetId: string) => {
     try {
        setDeletingIds(prev => new Set(prev).add(assetId));
        const res = await deleteGeneratedAsset(assetId);
        if (res.error) throw new Error(res.error);
        
        // Optimistically remove from UI
        setAssets(prev => prev.filter(a => a.id !== assetId));
        toast.success("Concept erased from the vault.");
     } catch (err: any) {
        toast.error(err.message || "Failed to delete concept.");
     } finally {
        setDeletingIds(prev => {
           const next = new Set(prev);
           next.delete(assetId);
           return next;
        });
     }
  };

  // 批量删除失败/挂起的异常记录
  const handleClearStale = async () => {
    const targets = assets.filter(a => isStale(a) || a.status === 'FAILED' || failedImageIds.has(a.id));
    if (targets.length === 0) return;
    try {
      setClearingStale(true);
      await Promise.all(targets.map(a => deleteGeneratedAsset(a.id)));
      setAssets(prev => prev.filter(a => !targets.some(t => t.id === a.id)));
      toast.success(`Cleared ${targets.length} incomplete record${targets.length > 1 ? 's' : ''}.`);
    } catch {
      toast.error('Failed to clear some records.');
    } finally {
      setClearingStale(false);
    }
  };

  if (assets.length === 0) {
    return (
       <div className="w-full flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
          <Sparkles className="w-8 h-8 text-[var(--text-tertiary)] mb-4 opacity-50" />
          <p className="text-[var(--text-secondary)] text-center">Your vault is empty.<br/>Go unleash your creativity in the Customizer.</p>
       </div>
    );
  }

  // 有失败/挂起记录时展示清理按鈕
  const hasAbnormal = assets.some(a => isStale(a) || a.status === 'FAILED' || failedImageIds.has(a.id));

  return (
     <div className="space-y-4">
       {/* 清理异常记录提示栏 */}
       {hasAbnormal && (
         <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
           <div className="flex items-center gap-2 text-sm text-amber-400">
             <AlertTriangle className="w-4 h-4 shrink-0" />
             <span>{staleAssets.length + (assets.filter(a => a.status === 'FAILED').length)} incomplete generation{(staleAssets.length + assets.filter(a => a.status === 'FAILED').length) > 1 ? 's' : ''} found</span>
           </div>
           <button
             onClick={handleClearStale}
             disabled={clearingStale}
             className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
           >
             {clearingStale ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Clear All'}
           </button>
         </div>
       )}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assets.map((asset) => {
           if (asset.status === 'PENDING') {
              // 超时的 PENDING 直接当失败展示（下面的 FAILED 递归就会处理）
              if (isStale(asset)) {
                // fall through to the failed check below
              } else {
                return (
                   <div key={asset.id} className="group relative rounded-2xl overflow-hidden bg-[var(--surface-sunken)] border border-dashed border-[var(--border-subtle)] p-3 flex flex-col justify-center items-center min-h-[300px] gap-4">
                     <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
                     <div className="text-center">
                        <p className="font-medium text-[var(--text-primary)] mb-1">Asset Generation in Progress</p>
                        <p className="text-xs text-[var(--text-tertiary)]">The VLM is currently rendering 3D views.</p>
                     </div>
                   </div>
                );
              }
           }

           const views = [];
           const isValidResult = asset.resultImage && asset.resultImage !== "null" && asset.resultImage.trim() !== '';
           
           // 判断是否展示失败态（FAILED 或 stale PENDING 或 resultImage 缺失）
           const showAsFailed = asset.status === 'FAILED' || isStale(asset) || failedImageIds.has(asset.id) || !isValidResult;
           
           if (isValidResult) views.push(asset.resultImage);
           if (asset.sideImage && asset.sideImage !== "null") views.push(asset.sideImage);
           if (asset.backImage && asset.backImage !== "null") views.push(asset.backImage);

           // Handle corrupted/failed states where status is complete but images are missing/broken
           if (showAsFailed) {
              return (
                 <div key={asset.id} className="group relative rounded-2xl overflow-hidden bg-[var(--surface-sunken)] border border-dashed border-[var(--border-subtle)] p-4 flex flex-col justify-center items-center min-h-[350px] gap-3 transition-opacity">
                   <div className="w-8 h-8 rounded shrink-0 bg-white/5 flex items-center justify-center text-[var(--text-tertiary)]">
                      <span className="text-xl opacity-50">⊘</span>
                   </div>
                   <div className="text-center">
                      <p className="font-medium text-[var(--text-secondary)] mb-1">Incomplete Concept</p>
                      <p className="text-xs text-[var(--text-tertiary)]">Generation aborted or payload missing.</p>
                   </div>
                   
                   {/* Delete Trash Button */}
                   <button 
                      onClick={() => handleDelete(asset.id)}
                      disabled={deletingIds.has(asset.id)}
                      className="absolute right-4 top-4 p-2 rounded-full bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-[var(--text-tertiary)] transition-colors backdrop-blur-md border border-white/5"
                    >
                      {deletingIds.has(asset.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                   </button>
                 </div>
              );
           }

           const dateLabel = asset.createdAt ? new Date(asset.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown Date';

           return (
              <div 
                 key={asset.id} 
                 onClick={() => handleCheckout(asset)}
                 className="group relative rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50 transition-all p-3 flex flex-col gap-3 shadow-lg hover:shadow-xl hover:shadow-[var(--brand-primary)]/10 cursor-pointer"
              >
                 
                 {/* Top Image Render */}
                 <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                     <Image 
                        src={asset.resultImage!} 
                        alt="Main View" 
                        fill 
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                        onError={() => {
                           setFailedImageIds(prev => new Set(prev).add(asset.id));
                        }}
                     />
                     
                     {/* View Design Hover Overlay */}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px] pointer-events-none">
                        <div className="translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border border-white/30 text-white font-medium shadow-xl">
                           <Sparkles className="w-4 h-4" />
                           <span>View Design</span>
                        </div>
                     </div>

                     {/* Glassmorphism Delete Overlay (appears on Hover) */}
                     <button 
                        onClick={(e) => {
                           e.stopPropagation();
                           handleDelete(asset.id);
                        }}
                        disabled={deletingIds.has(asset.id)}
                        className="absolute right-3 top-3 p-2 rounded-full bg-black/40 hover:bg-red-500/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/10"
                        title="Delete this concept"
                     >
                        {deletingIds.has(asset.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                     </button>
                 </div>
                 
                 {/* Secondary Views grid */}
                 {views.length > 1 && (
                    <div className="grid grid-cols-2 gap-2">
                        {asset.sideImage && (
                           <div className="relative aspect-square rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-white/5">
                              <Image 
                                 src={asset.sideImage} 
                                 alt="Side View" 
                                 fill 
                                 className="object-cover" 
                                 onError={() => setFailedImageIds(prev => new Set(prev).add(asset.id))}
                              />
                           </div>
                        )}
                        {asset.backImage && (
                           <div className="relative aspect-square rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-white/5">
                              <Image 
                                 src={asset.backImage} 
                                 alt="Back View" 
                                 fill 
                                 className="object-cover" 
                                 onError={() => setFailedImageIds(prev => new Set(prev).add(asset.id))}
                              />
                           </div>
                        )}
                    </div>
                 )}

                 {/* Information Footer */}
                 <div className="flex flex-col gap-3 pt-2">
                     <div className="flex items-center justify-end text-xs px-1">
                        <span className="text-[var(--text-tertiary)] flex items-center gap-1 opacity-70">
                           <CalendarHeart className="w-3 h-3" />
                           {dateLabel}
                        </span>
                     </div>
                 </div>
              </div>
           );
        })}
       </div>
     </div>
  );
}
