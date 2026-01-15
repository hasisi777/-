import React, { useState, useRef } from 'react';
import { ThumbnailOptions } from '../types';
import { generateImageSection } from '../services/geminiService';

const ThumbnailGenerator: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [refImage, setRefImage] = useState<string | null>(null);
  const [options, setOptions] = useState<ThumbnailOptions>({
    style: 'clean',
    includeModel: false,
    textPosition: 'center',
    customText: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!refImage) {
      alert("원본 이미지를 업로드해주세요.");
      return;
    }
    setIsGenerating(true);
    setResultImage(null);

    // Construct a pseudo-segment for the service
    const visualPrompt = `
      Create a clickable Youtube/E-commerce style thumbnail.
      Style: ${options.style}.
      ${options.includeModel ? 'Include a human model interacting with the product.' : 'Focus solely on the product.'}
      Background should be eye-catching but not overwhelming.
      High contrast, vibrant colors.
    `;

    const dummySegment = {
      id: 'thumb',
      title: 'Thumbnail',
      logicalSections: [],
      keyMessage: options.customText || productName,
      visualPrompt: visualPrompt
    };

    try {
      const url = await generateImageSection(dummySegment, refImage, '1:1');
      setResultImage(url);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Controls */}
        <div className="p-8 w-full md:w-1/2 space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">썸네일 제작</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">상품명</label>
            <input 
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
              placeholder="상품명 입력"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">이미지 업로드</label>
             <div 
                className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
             >
               {refImage ? (
                 <img src={refImage} className="h-32 mx-auto object-contain" alt="ref"/>
               ) : (
                 <span className="text-slate-500 text-sm">클릭하여 원본 업로드</span>
               )}
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*"/>
             </div>
          </div>

          <div className="space-y-3">
             <label className="block text-sm font-medium text-slate-700">스타일 옵션</label>
             <div className="flex gap-2">
               {['clean', 'lifestyle', 'creative'].map(s => (
                 <button 
                   key={s}
                   onClick={() => setOptions({...options, style: s as any})}
                   className={`flex-1 py-2 text-sm rounded border capitalize ${
                     options.style === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'
                   }`}
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={options.includeModel}
                onChange={(e) => setOptions({...options, includeModel: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-slate-700">인물/손 모델 포함 (AI 합성)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">썸네일 텍스트</label>
            <input 
              value={options.customText}
              onChange={(e) => setOptions({...options, customText: e.target.value})}
              className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
              placeholder="강조할 문구 (비워두면 상품명 사용)"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !refImage}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition-colors disabled:opacity-50"
          >
            {isGenerating ? '생성 중...' : '썸네일 생성하기'}
          </button>
        </div>

        {/* Preview */}
        <div className="bg-slate-100 w-full md:w-1/2 p-8 flex items-center justify-center border-l border-slate-200">
           {resultImage ? (
             <div className="relative shadow-2xl rounded-lg overflow-hidden group">
               <img src={resultImage} alt="Generated Thumbnail" className="w-full h-auto max-w-[400px]" />
               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                 <a 
                   href={resultImage} 
                   download={`thumbnail-${productName}.png`}
                   className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold hover:bg-slate-200"
                 >
                   다운로드
                 </a>
               </div>
             </div>
           ) : (
             <div className="text-center text-slate-400">
               <div className="w-64 h-64 border-2 border-slate-300 border-dashed rounded-lg mx-auto flex items-center justify-center mb-4">
                 <span className="text-4xl">1:1</span>
               </div>
               <p>미리보기 영역</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ThumbnailGenerator;