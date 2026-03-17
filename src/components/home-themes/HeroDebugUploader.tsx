import React, { useState } from 'react';
import Image from 'next/image';
import { Settings, X, Upload } from 'lucide-react';

export interface SceneData {
  id: number;
  tag: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  image: string;
  thumb: string;
  accent: string;
}

interface HeroDebugUploaderProps {
  scenes: SceneData[];
  setScenes: React.Dispatch<React.SetStateAction<SceneData[]>>;
}

export default function HeroDebugUploader({ scenes, setScenes }: HeroDebugUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  // File upload handler
  const handleFileUpload = (sceneId: number, type: 'image' | 'thumb', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setScenes(prev => prev.map(scene => 
        scene.id === sceneId ? { ...scene, [type]: dataUrl } : scene
      ));
    };
    reader.readAsDataURL(file);
    // Reset input value so the same file could be loaded again if needed
    e.target.value = '';
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl transition-transform hover:scale-105 backdrop-blur-md"
        title="Debug Image Uploader"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Upload Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-gray-900 border-l border-gray-800 shadow-2xl z-[60] overflow-y-auto p-6 text-white text-sm animate-[slideInRight_0.3s_ease-out_forwards]">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-900/90 backdrop-blur pb-2 z-10 border-b border-gray-800">
            <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
              临时调试：换图上传
            </h2>
            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {scenes.map((scene) => (
              <div key={scene.id} className="bg-gray-800/60 p-5 rounded-2xl border border-gray-700 shadow-inner">
                <div className="font-bold text-lg mb-4 flex items-center gap-2">
                   <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs">{scene.id + 1}</span>
                   {scene.titleZh}
                </div>
                
                {/* Background Image Replace */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-400 font-medium">替换背景大图 (8:3)</label>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md cursor-pointer transition-colors text-xs border border-gray-600">
                      <Upload className="w-3.5 h-3.5" />
                      <span>选择文件</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(scene.id, 'image', e)} 
                      />
                    </label>
                  </div>
                  <div className="mt-2 h-[100px] relative rounded-lg overflow-hidden border border-gray-700 bg-black">
                     <Image src={scene.image} alt="preview bg" fill className="object-cover" />
                  </div>
                </div>

                {/* Thumbnail Image Replace */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                     <label className="text-xs text-gray-400 font-medium">替换缩略图 (16:9)</label>
                     <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md cursor-pointer transition-colors text-xs border border-gray-600">
                      <Upload className="w-3.5 h-3.5" />
                      <span>选择文件</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(scene.id, 'thumb', e)} 
                      />
                    </label>
                  </div>
                  <div className="mt-2 w-[160px] h-[90px] relative rounded-lg overflow-hidden border border-gray-700 bg-black">
                     <Image src={scene.thumb} alt="preview thumb" fill className="object-cover" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-gray-800 text-xs text-gray-500 text-center leading-relaxed">
            * 此功能仅供本地截图预览调试使用。<br/>
            刷新页面后恢复默认，不会修改实际源文件。<br/>
            如需卸载，删除此组件的引用即可。
          </div>
        </div>
      )}

      {/* Basic Keyframe for sliding panel */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </>
  );
}
