'use client';

import { useState, useRef } from 'react';
import { detectImageSubjects, SubjectDetectionResult } from '@/app/actions/ai-subject';

const BOX_COLORS = [
  { border: 'border-blue-500/80', bg: 'bg-blue-500/10', hover: 'hover:bg-blue-500/30', textBg: 'bg-blue-600', hex: 'rgba(59, 130, 246, 0.8)', selectedRing: 'ring-blue-600', selectedBg: 'bg-blue-600', selectedBorder: 'border-blue-600', shadow: 'shadow-blue-500/20' },
  { border: 'border-emerald-500/80', bg: 'bg-emerald-500/10', hover: 'hover:bg-emerald-500/30', textBg: 'bg-emerald-600', hex: 'rgba(16, 185, 129, 0.8)', selectedRing: 'ring-emerald-600', selectedBg: 'bg-emerald-600', selectedBorder: 'border-emerald-600', shadow: 'shadow-emerald-500/20' },
  { border: 'border-rose-500/80', bg: 'bg-rose-500/10', hover: 'hover:bg-rose-500/30', textBg: 'bg-rose-600', hex: 'rgba(244, 63, 94, 0.8)', selectedRing: 'ring-rose-600', selectedBg: 'bg-rose-600', selectedBorder: 'border-rose-600', shadow: 'shadow-rose-500/20' },
  { border: 'border-amber-500/80', bg: 'bg-amber-500/10', hover: 'hover:bg-amber-500/30', textBg: 'bg-amber-600', hex: 'rgba(245, 158, 11, 0.8)', selectedRing: 'ring-amber-600', selectedBg: 'bg-amber-600', selectedBorder: 'border-amber-600', shadow: 'shadow-amber-500/20' },
  { border: 'border-fuchsia-500/80', bg: 'bg-fuchsia-500/10', hover: 'hover:bg-fuchsia-500/30', textBg: 'bg-fuchsia-600', hex: 'rgba(217, 70, 239, 0.8)', selectedRing: 'ring-fuchsia-600', selectedBg: 'bg-fuchsia-600', selectedBorder: 'border-fuchsia-600', shadow: 'shadow-fuchsia-500/20' },
  { border: 'border-cyan-500/80', bg: 'bg-cyan-500/10', hover: 'hover:bg-cyan-500/30', textBg: 'bg-cyan-600', hex: 'rgba(6, 182, 212, 0.8)', selectedRing: 'ring-cyan-600', selectedBg: 'bg-cyan-600', selectedBorder: 'border-cyan-600', shadow: 'shadow-cyan-500/20' },
];

interface SubjectSelectorCanvasProps {
  onSelectionConfirmed?: (originalImage: string, maskedImage: string, subjectId: string) => void;
}

export default function SubjectSelectorCanvas({ onSelectionConfirmed }: SubjectSelectorCanvasProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geminiResult, setGeminiResult] = useState<SubjectDetectionResult | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  
  const originalImgRef = useRef<HTMLImageElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    setGeminiResult(null);
    setSelectedSubjectId(null);
    setGeminiError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const b64Original = e.target?.result as string;
      
      const img = new window.Image();
      img.onload = async () => {
        const MAX_DIMENSION = 1024; // Normalized 1024 constraint
        let width = img.width;
        let height = img.height;
        
        if (Math.max(width, height) > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.drawImage(img, 0, 0, width, height);
           const b64Small = canvas.toDataURL('image/jpeg', 0.8);
           
           setIsAnalyzing(true);
           const base64Data = b64Small.split(',')[1];
           const result = await detectImageSubjects(base64Data, "image/jpeg");
           
           setIsAnalyzing(false);
           
           if (result.error && result.subjects.length === 0) {
             setGeminiError(result.error);
           } else {
             setGeminiResult(result);
           }
        }
      };
      img.src = b64Original;
    };
    reader.readAsDataURL(file);
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectId(prev => prev === subjectId ? null : subjectId);
  };

  const generateCropAndConfirm = () => {
    if (!selectedSubjectId || !geminiResult || !originalImgRef.current || !onSelectionConfirmed || !fileUrl) return;

    const subject = geminiResult.subjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    // Use offscreen canvas to physically crop the exact box boundaries
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [ymin, xmin, ymax, xmax] = subject.box_2d;
    const img = originalImgRef.current;
    
    // Scale normalized 0-1000 coordinates back to original image true pixel dimensions
    const sx = (xmin / 1000) * img.naturalWidth;
    const sy = (ymin / 1000) * img.naturalHeight;
    const sw = ((xmax - xmin) / 1000) * img.naturalWidth;
    const sh = ((ymax - ymin) / 1000) * img.naturalHeight;

    canvas.width = sw;
    canvas.height = sh;
    
    // Draw only the sliced box portion
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    
    const croppedBase64 = canvas.toDataURL('image/png');
    
    // Sending the bounding box rectangle crop as the "maskedImage" to fulfill parent protocol constraints effortlessly!
    onSelectionConfirmed(fileUrl, croppedBase64, selectedSubjectId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 shadow-sm relative overflow-hidden">
      
      {/* Upload Step */}
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
        <label className="cursor-pointer flex flex-col items-center">
           <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
           </div>
           <span className="font-medium text-zinc-900 dark:text-zinc-100">Upload Family/Pet Photo</span>
           <span className="text-sm text-zinc-500 mt-1">AI 将自动扫描识别目标区域坐标</span>
           <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {fileUrl && (
        <div className="space-y-6">
          <div className="relative w-full flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-800/20 rounded-2xl overflow-hidden shadow-inner p-2 md:p-6 border border-zinc-200/50 dark:border-zinc-700/50">
            
            {/* INTRINSIC DOM IMAGE WRAPPER (Never Skews) */}
            <div className="relative inline-block w-full max-w-full leading-none overflow-hidden rounded-xl shadow ring-1 ring-zinc-900/5 dark:ring-white/10 select-none">
              <img 
                ref={originalImgRef} 
                src={fileUrl} 
                alt="Original Subject" 
                className="w-full h-auto block" 
                crossOrigin="anonymous" 
              />
              
              {isAnalyzing && (
                 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-4"></div>
                   <p className="font-medium tracking-wider animate-pulse text-sm">Gemini AI Semantic Scanning...</p>
                 </div>
              )}
              
              {/* Box Clickers */}
              {geminiResult?.subjects.map((s, index) => {
                 const [ymin, xmin, ymax, xmax] = s.box_2d;
                 const top = `${(ymin / 1000) * 100}%`;
                 const left = `${(xmin / 1000) * 100}%`;
                 const height = `${((ymax - ymin) / 1000) * 100}%`;
                 const width = `${((xmax - xmin) / 1000) * 100}%`;
                 
                 const colorObj = BOX_COLORS[index % BOX_COLORS.length];
                 const isSelected = selectedSubjectId === s.id;
                 const isOtherSelected = selectedSubjectId !== null && selectedSubjectId !== s.id;
                 
                 return (
                   <div 
                     key={s.id}
                     className={`absolute transition-all duration-300 cursor-pointer group rounded-sm
                        ${isSelected ? `border-4 ${colorObj.border} shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-transparent z-40` : `border-2 ${colorObj.border} ${colorObj.bg} ${colorObj.hover} z-20`}
                        ${isOtherSelected ? 'opacity-30 mix-blend-luminosity grayscale' : 'opacity-100'}
                     `}
                     style={{ top, left, width, height }}
                     onClick={() => handleSubjectToggle(s.id)}
                   >
                     {/* Floating Precise Name Tags */}
                     <span className={`absolute -top-7 left-0 ${colorObj.textBg} text-white text-[12px] uppercase font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-50 transition-transform origin-bottom-left tracking-tight
                        ${isSelected ? 'opacity-100 scale-105' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}`}
                     >
                        {isSelected && <span className="mr-1.5 inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                       {s.description}
                     </span>
                   </div>
                 );
              })}
            </div>
          </div>

          {geminiError && (
            <div className="p-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-900/30">
              Error detecting subjects: {geminiError}
            </div>
          )}

          {/* Confirm Button Block */}
          {selectedSubjectId && (
            <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2">
               <div className="text-sm font-medium text-zinc-500">
                  <span className="text-purple-600 font-bold mr-2">✓</span>
                  已锁定人物轮廓区域
               </div>
               <button 
                className="bg-black dark:bg-white text-white dark:text-black font-semibold px-6 py-2.5 rounded-full hover:scale-105 transition-transform shadow-lg"
                onClick={generateCropAndConfirm}
               >
                 Create 3D Figurine
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
