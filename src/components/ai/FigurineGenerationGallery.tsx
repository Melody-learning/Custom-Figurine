'use client';

import { useState, useEffect, useRef } from 'react';
import { startAsyncGeneration } from '@/app/actions/start-generation';
import { Loader2, ArrowLeft, ArrowRight, Rotate3D, LayoutGrid } from 'lucide-react';
import { ImageLightbox } from '@/components/ImageLightbox';

interface FigurineGenerationGalleryProps {
  subjectImageB64: string;   // The cropped/processed base64 image (bg-removed if applicable)
  originalImageForShowcase?: string; // User's original upload (before bg removal) for showcase generation
  initialViews?: { primary: string, back: string, side: string, showcase?: string } | null;
  stylePrompt?: string;      // 前端选中风格的主视图提示词（覆盖后端默认 PROMPT_PRIMARY）
  onCancel?: () => void;
  onComplete?: (generatedImages: { primary: string, back: string, side: string, showcase?: string }, generatedAssetId?: string) => void;
  onStatusChange?: (status: StepStatus) => void;
}

type StepStatus = 'IDLE' | 'GENERATING_PRIMARY' | 'PRIMARY_SUCCESS' | 'GENERATING_SECONDARY' | 'COMPLETE' | 'ERROR';

export default function FigurineGenerationGallery({ subjectImageB64, originalImageForShowcase, initialViews, stylePrompt, onCancel, onComplete, onStatusChange }: FigurineGenerationGalleryProps) {
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  
  // 从后台获取管理员配置的默认模型（第一个启用的模型）
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-image-preview');
  
  const [status, setStatus] = useState<StepStatus>(initialViews ? 'COMPLETE' : 'IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'primary' | 'back' | 'side' | 'showcase'>('primary');
  const [isReferenceExpanded, setIsReferenceExpanded] = useState<boolean>(true);
  const [currentAssetId, setCurrentAssetId] = useState<string | undefined>(undefined);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<'LIMIT_REACHED' | null>(null);
  const autoStartCalledRef = useRef<boolean>(false);

  // 自动获取后台配置的默认模型
  useEffect(() => {
    fetch('/api/ai-models')
      .then(res => res.json())
      .then(data => {
        if (data.models && data.models.length > 0) {
          setSelectedModel(data.models[0].modelId);
        }
      })
      .catch(err => {
        console.error('Failed to load default AI model, using fallback:', err);
      });
  }, []);

  // Status Change Effect
  useEffect(() => {
     if (onStatusChange) {
         onStatusChange(status);
     }
  }, [status, onStatusChange]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'GENERATING_PRIMARY' || status === 'GENERATING_SECONDARY') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Auto-start on mount if no initial views
  useEffect(() => {
    if (!initialViews && !autoStartCalledRef.current) {
      autoStartCalledRef.current = true;
      startGenerationFlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Result States
  const [primaryImage, setPrimaryImage] = useState<string | null>(initialViews?.primary || null);
  const [backImage, setBackImage] = useState<string | null>(initialViews?.back || null);
  const [sideImage, setSideImage] = useState<string | null>(initialViews?.side || null);
  const [showcaseImage, setShowcaseImage] = useState<string | null>(initialViews?.showcase || null);

  // Strip possible base64 URL prefix if passed incorrectly from parent, or support http URLs
  const validSubject = subjectImageB64 && subjectImageB64 !== "null" ? subjectImageB64 : null;
  const isHttpSrc = validSubject?.startsWith('http') || validSubject?.startsWith('blob:');
  const cleanB64 = validSubject && !isHttpSrc ? (validSubject.includes('base64,') ? validSubject.split('base64,')[1] : validSubject) : null;
  
  // Reference Image Source resolver
  const referenceImageSrc = isHttpSrc ? validSubject : (cleanB64 ? `data:image/jpeg;base64,${cleanB64}` : null);

  const startGenerationFlow = async () => {
     try {
         setErrorMessage(null);
         setElapsedTime(0);
         setStatus('GENERATING_PRIMARY');
         
         // 1. Dispatch Background Worker Job
         // Data flow: originalImageB64 -> DB + prompt2 (showcase), processedImageB64 -> prompt1 (figurine)
         const hasBgRemoved = !!(originalImageForShowcase && originalImageForShowcase !== subjectImageB64);
         let showcaseCleanB64 = cleanB64 || "";
         if (hasBgRemoved && originalImageForShowcase) {
           const isOrigHttp = originalImageForShowcase.startsWith('http') || originalImageForShowcase.startsWith('blob:');
           if (!isOrigHttp) {
             showcaseCleanB64 = originalImageForShowcase.includes('base64,') ? originalImageForShowcase.split('base64,')[1] : originalImageForShowcase;
           }
         }

         const initResult = await startAsyncGeneration({
            originalImageB64: hasBgRemoved ? showcaseCleanB64 : (cleanB64 || ""),
            processedImageB64: hasBgRemoved ? (cleanB64 ? `data:image/jpeg;base64,${cleanB64}` : undefined) : undefined,
            modelId: selectedModel,
            prompt: "Auto-generated 3D Render",
            promptOverride: stylePrompt || undefined,
         });

         if (!initResult.success || !initResult.assetId) {
             if (initResult.reason === 'LIMIT_REACHED') {
                setStatus('IDLE');
                setQuotaError('LIMIT_REACHED');
                return;
             }
             if (initResult.reason === 'unauthenticated' || initResult.reason === 'user_not_found') {
                throw new Error('Your session has expired. Please refresh the page and log in again.');
             }
             throw new Error(initResult.error || "Failed to initialize generation queue.");
          }

         const assetId = initResult.assetId;
         setCurrentAssetId(assetId);
         setStatus('GENERATING_SECONDARY'); // Represents "Polling" state

         // 2. Poll the Database via our GET Asset Route
         const MAX_POLLING_TIME_MS = 120000; // 2 minutes strict timeout
         const startTime = Date.now();

         const pollInterval = setInterval(async () => {
            try {
               // Check Timeout first
               if (Date.now() - startTime > MAX_POLLING_TIME_MS) {
                  clearInterval(pollInterval);
                  setErrorMessage("Generation timed out. The server took too long to respond. Please try again.");
                  setStatus('ERROR');
                  return;
               }

               const res = await fetch(`/api/assets/${assetId}`);
               if (!res.ok) return;
               const data = await res.json();
               
               if (data.asset) {
                  if (data.asset.status === 'COMPLETE') {
                     clearInterval(pollInterval);
                     setPrimaryImage(data.asset.resultImage);
                     setBackImage(data.asset.backImage || data.asset.resultImage);
                     setSideImage(data.asset.sideImage || data.asset.resultImage);
                      setShowcaseImage(data.asset.showcaseImage || null);
                     setStatus('COMPLETE');
                  } else if (data.asset.status === 'FAILED') {
                     clearInterval(pollInterval);
                     setErrorMessage("Background rendering failed.");
                     setStatus('ERROR');
                  }
               }
            } catch (pollErr) {
               console.error("Polling error:", pollErr);
            }
         }, 3000);

         // We save interval to clear it on unmount
         return () => clearInterval(pollInterval);

      } catch (err: any) {
         setErrorMessage(err.message);
         setStatus('ERROR');
      }
  };

  return (
    <div className="w-full mx-auto p-6 sm:p-8 space-y-8 bg-white dark:bg-zinc-950 rounded-3xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative overflow-hidden transition-all duration-700">
        <style jsx>{`
            @keyframes scanline {
                0% { transform: translateY(-100%); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(100%); opacity: 0; }
            }
            .animate-scanline {
                animation: scanline 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            @keyframes float-gentle {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            .animate-float-gentle {
                animation: float-gentle 4s ease-in-out infinite;
            }
        `}</style>
        
        {/* Header Setup & Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10">
             <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Rotate3D className="w-6 h-6 text-[var(--brand-primary)]" /> 
                    3D Figurine Studio
                 </h2>
                 {(status === 'GENERATING_PRIMARY' || status === 'GENERATING_SECONDARY') && elapsedTime > 0 && (
                     <span className="text-sm font-mono bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] px-3 py-1 rounded-md border border-black/10 dark:border-white/10">
                         {formatTime(elapsedTime)}
                     </span>
                 )}
             </div>
             
             <div className="flex items-center gap-3">
                 {quotaError === 'LIMIT_REACHED' && (
                     <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Generation Limit Reached</span>
                 )}
                 {status === 'ERROR' && (
                     <button
                         onClick={() => { setQuotaError(null); startGenerationFlow(); }}
                         className="font-medium px-6 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center gap-2"
                     >
                         <Loader2 className="w-4 h-4" /> Retry
                     </button>
                 )}
                 {status === 'COMPLETE' && (
                     <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                         <span>✓</span> Generation Complete
                     </div>
                 )}
             </div>
        </div>

        {/* Error State */}
        {status === 'ERROR' && errorMessage && (
            <div className="p-4 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl">
               <strong className="block mb-1">Rendering Encountered an Issue:</strong>
               {errorMessage}
               <p className="mt-2 text-xs opacity-80">This might happen if your custom API Key is invalid or the Endpoint format misaligns.</p>
            </div>
        )}

        {/* Main Cinematic Gallery Area */}
        <div className={`w-full bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden relative flex transition-all duration-700 shadow-inner ${status === 'COMPLETE' ? 'h-[450px] sm:h-[550px] flex-row' : 'min-h-[400px] py-12 flex-col'}`}>
            
            {/* Structural Blueprint Background (Visible during Loading/Idle) */}
            {status !== 'COMPLETE' && (
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]" style={{ backgroundSize: '40px 40px' }} />
            )}
            
            {/* Floating HUD: Reference Subject (Picture-in-Picture) */}
            {referenceImageSrc && (
                <div className={`absolute top-4 left-4 z-20 transition-all duration-300 ${isReferenceExpanded ? 'w-32 p-2' : 'w-10 p-1'} bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden`}>
                   
                   {/* Header Toggle */}
                   <button 
                      onClick={() => setIsReferenceExpanded(!isReferenceExpanded)}
                      className="w-full text-left flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded p-1 transition-colors"
                      title={isReferenceExpanded ? "Collapse Reference" : "Expand Reference"}
                   >
                       {isReferenceExpanded ? (
                           <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Reference</span>
                       ) : (
                           <LayoutGrid className="w-5 h-5 text-zinc-500 mx-auto" />
                       )}
                       {isReferenceExpanded && status === 'COMPLETE' && <span className="text-emerald-500 text-xs shrink-0">✓</span>}
                   </button>
                   
                   {/* Collapsible Content */}
                   {isReferenceExpanded && (
                       <div className="mt-1.5 animate-in slide-in-from-top-2 fade-in duration-200">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={referenceImageSrc!} className="w-full rounded bg-zinc-100 dark:bg-black object-contain aspect-square cursor-pointer hover:opacity-80 transition-opacity" alt="Target Subject" onClick={() => setLightboxSrc(referenceImageSrc)} />
                           
                           {/* Simplified Status Underneath */}
                           {status !== 'IDLE' && status !== 'COMPLETE' && status !== 'ERROR' && (
                               <div className="mt-2 flex items-center gap-1.5 justify-center bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] py-1 rounded border border-black/10 dark:border-white/10">
                                   <Loader2 className="w-3 h-3 animate-spin" />
                                   <span className="text-[10px] font-medium leading-none tracking-tight">Constructing Mesh</span>
                               </div>
                           )}
                       </div>
                   )}
                </div>
            )}

            {/* Central Viewport */}
            <div className="flex-1 w-full h-full relative flex items-center justify-center p-4">
                
                {status === 'IDLE' && (
                    <div className="text-center space-y-4 opacity-70 animate-float-gentle select-none">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 bg-[var(--brand-primary)]/10 blur-xl rounded-full pb-4"></div>
                            <LayoutGrid className="relative w-full h-full text-[var(--text-secondary)] drop-shadow-sm" />
                        </div>
                        <h3 className="text-xl font-medium text-[var(--text-primary)] tracking-tight">Ready to craft your figurine</h3>
                         <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">Your photo is being analyzed. Crafting will begin shortly.</p>
                    </div>
                )}

                {status !== 'IDLE' && status !== 'ERROR' && status !== 'COMPLETE' && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-10 animate-in fade-in duration-1000">
                        {/* Dimensional Scanning Visualizer */}
                        <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56">
                           {/* Base Holographic Platter */}
                           <div className="absolute bottom-4 w-3/4 h-8 bg-[var(--brand-primary)]/5 dark:bg-[var(--brand-primary)]/10 blur-xl rounded-[100%] animate-pulse"></div>
                           
                           {/* Orbiting Rings */}
                           <div className="absolute inset-0 rounded-full border border-black/5 dark:border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.02)]"></div>
                           <div className="absolute inset-2 rounded-full border-t border-[var(--brand-primary)] animate-spin" style={{ animationDuration: '4s' }}></div>
                           <div className="absolute inset-6 rounded-full border-l border-[var(--text-secondary)] opacity-50 animate-[spin_3s_linear_infinite_reverse]"></div>
                           <div className="absolute inset-10 rounded-full border border-dashed border-black/10 dark:border-white/10 animate-spin" style={{ animationDuration: '10s' }}></div>
                           
                           {/* Center Core */}
                           <div className="absolute inset-14 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 shadow-[0_0_40px_rgba(0,0,0,0.05)] rounded-full backdrop-blur-md border border-black/5 dark:border-white/5 z-10">
                               <Rotate3D className="w-10 h-10 text-[var(--brand-primary)] animate-float-gentle" />
                           </div>

                           {/* Vertical Laser Scan Line */}
                           <div className="absolute inset-x-8 top-8 bottom-8 overflow-hidden rounded-full z-20 pointer-events-none">
                               <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent shadow-[0_0_8px_var(--brand-primary)] animate-scanline"></div>
                           </div>
                        </div>

                        {/* Kinetic Typography Status */}
                        <div className="text-center space-y-3 max-w-sm relative z-30">
                           <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)] animate-pulse">
                               Bringing your photo to life...
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                               Capturing every detail to craft your handcrafted figurine.
                            </p>


                           
                           {/* Terminal readout aesthetic for time */}
                           <div className="mt-6 flex items-center justify-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-ping"></div>
                               <p className="text-xs font-mono text-[var(--text-tertiary)] tracking-widest uppercase">
                                   Process <span className="text-[var(--text-primary)] font-medium">Time {formatTime(elapsedTime)}</span>
                               </p>
                           </div>
                        </div>
                    </div>
                )}

                {status === 'COMPLETE' && (activeTab === 'primary' ? primaryImage : activeTab === 'back' ? backImage : activeTab === 'side' ? sideImage : showcaseImage) && (
                    <div 
                       className="w-full h-full relative cursor-pointer group"
                       onClick={() => {
                         const src = activeTab === 'primary' ? primaryImage : activeTab === 'back' ? backImage : activeTab === 'side' ? sideImage : showcaseImage;
                         if (src) setLightboxSrc(src);
                       }}
                    >
                       <img 
                          src={(activeTab === 'primary' ? primaryImage : activeTab === 'back' ? backImage : activeTab === 'side' ? sideImage : showcaseImage)!} 
                          className="w-full h-full object-contain drop-shadow-2xl transition-opacity animate-in zoom-in-[0.98] fade-in duration-700 ease-out" 
                          alt="Rendered View"
                       />
                    </div>
                )}
            </div>
            {/* Right HUD: Thumbnails Side Panel (Only on Complete) */}
            {status === 'COMPLETE' && (
                <div className="w-32 sm:w-40 flex-shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-l border-black/5 dark:border-white/5 flex flex-col items-center justify-center py-6 gap-6 z-20 shadow-[-10px_0_30px_rgb(0,0,0,0.02)]">
                    <span className="text-[10px] sm:text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest px-2 text-center w-full border-b border-black/10 dark:border-white/10 pb-3 mb-2">Views</span>
                    {[
                        { id: 'primary', img: primaryImage, label: 'Front Render', delay: 'delay-100' },
                        { id: 'back', img: backImage, label: 'Back Render', delay: 'delay-200' },
                        { id: 'side', img: sideImage, label: 'Left Render', delay: 'delay-300' },
                         ...(showcaseImage ? [{ id: 'showcase', img: showcaseImage, label: 'Showcase', delay: 'delay-[400ms]' }] : [])
                    ].map((thumb) => (
                        <button
                            key={thumb.id}
                            onClick={() => setActiveTab(thumb.id as any)}
                            className={`relative w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden border transition-all duration-500 ease-out animate-in slide-in-from-right-4 fade-in ${thumb.delay} fill-mode-both ${activeTab === thumb.id ? 'border-[var(--brand-primary)] shadow-[0_10px_20px_rgba(0,0,0,0.1)] ring-4 ring-[var(--brand-primary)]/10 scale-105 z-10' : 'border-black/5 dark:border-white/5 opacity-70 hover:opacity-100 hover:scale-100'}`}
                        >
                            <img src={thumb.img!} className="w-full h-full object-cover" alt={thumb.label} />
                            <div className="absolute inset-x-0 bottom-0 bg-white/95 dark:bg-black/95 backdrop-blur-md text-[var(--text-primary)] text-[10px] py-2 text-center font-bold leading-none border-t border-black/5 dark:border-white/10">
                                {thumb.label}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-black/10 dark:border-white/10">
             <button 
                onClick={onCancel}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                  <ArrowLeft className="w-4 h-4" /> {status === 'COMPLETE' ? 'Discard & Retake' : 'Cancel & Return'}
              </button>
              
              <button 
                onClick={() => {
                   if (onComplete && primaryImage && backImage && sideImage) {
                      onComplete({ primary: primaryImage, back: backImage, side: sideImage, showcase: showcaseImage || undefined }, currentAssetId);
                   }
                }}
                disabled={status !== 'COMPLETE'}
                className="bg-black dark:bg-white text-white dark:text-black hover:-translate-y-0.5 hover:shadow-lg disabled:hover:translate-y-0 disabled:opacity-30 disabled:cursor-not-allowed font-semibold px-6 py-2.5 rounded-full transition-all flex items-center gap-2"
              >
                 <ArrowRight className="w-4 h-4" /> View Results &amp; Order
              </button>
        </div>

         {/* Lightbox for viewing full-size images */}
         <ImageLightbox
            src={lightboxSrc || ''}
            alt="Full Size View"
            isOpen={!!lightboxSrc}
            onClose={() => setLightboxSrc(null)}
         />

    </div>
  );
}
