import React, { useState, useRef } from 'react';
import { ProductInfo, DetailImageSegment, PageLength } from '../types';
import { suggestFeatures, planDetailPage, generateImageSection } from '../services/geminiService';
import { overlayTextOnImage } from '../utils/imageUtils';

const DetailPlanner: React.FC = () => {
  // State for Input Step
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    name: '',
    category: '',
    price: '',
    features: '',
    targetGender: [],
    targetAge: [],
    promotion: '',
    lengthOption: 'auto'
  });
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  // State for Planning/Generation Steps
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPlanning, setIsPlanning] = useState(false);
  const [segments, setSegments] = useState<DetailImageSegment[]>([]);
  const [generatingCount, setGeneratingCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductInfo(prev => ({ ...prev, [name]: value }));
  };

  const toggleTarget = (type: 'gender' | 'age', value: string) => {
    setProductInfo(prev => {
      const list = type === 'gender' ? prev.targetGender : prev.targetAge;
      const newList = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
      return type === 'gender' ? { ...prev, targetGender: newList } : { ...prev, targetAge: newList };
    });
  };

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

  const handleSuggestFeatures = async () => {
    if (!productInfo.name || !productInfo.category) {
      alert("상품명과 카테고리를 먼저 입력해주세요.");
      return;
    }
    setIsSuggesting(true);
    try {
      const suggestion = await suggestFeatures(productInfo.name, productInfo.category);
      setProductInfo(prev => ({ ...prev, features: suggestion }));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handlePlanDetail = async () => {
    if (!refImage) {
      alert("레퍼런스 이미지는 필수입니다.");
      return;
    }
    setIsPlanning(true);
    try {
      const plannedSegments = await planDetailPage(productInfo, refImage);
      setSegments(plannedSegments);
      setStep(2);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleUpdateSegment = (id: string, field: keyof DetailImageSegment, value: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleGenerateAll = async () => {
    setStep(3);
    setGeneratingCount(segments.length);
    
    const generatePromises = segments.map(async (segment) => {
      // Mark as generating
      setSegments(prev => prev.map(s => s.id === segment.id ? { ...s, isGenerating: true, error: undefined } : s));
      
      try {
        // 1. Generate Clean Image (No text)
        const rawImageUrl = await generateImageSection(segment, refImage || undefined, '9:16');
        
        // 2. Overlay Text Client-side
        const finalImageUrl = await overlayTextOnImage(rawImageUrl, segment.keyMessage);

        setSegments(prev => prev.map(s => s.id === segment.id ? { ...s, imageUrl: finalImageUrl, isGenerating: false } : s));
      } catch (error: any) {
        console.error(`Failed to generate ${segment.id}`, error);
        setSegments(prev => prev.map(s => s.id === segment.id ? { ...s, isGenerating: false, error: error.message || "생성 실패" } : s));
      } finally {
        setGeneratingCount(prev => prev - 1);
      }
    });

    try {
        await Promise.all(generatePromises);
    } catch (e: any) {
        console.error("Batch generation finished with some errors");
    }
  };

  // Render Functions
  const renderStep1 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Basic Info */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2">기본 정보 입력</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">상품명</label>
              <input 
                name="name"
                value={productInfo.name}
                onChange={handleInputChange}
                className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                placeholder="예: 퓨어 슬립 베개"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">카테고리</label>
                <select 
                  name="category"
                  value={productInfo.category}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                >
                  <option value="">선택</option>
                  <option value="패션/의류">패션/의류</option>
                  <option value="뷰티/화장품">뷰티/화장품</option>
                  <option value="식품">식품</option>
                  <option value="생활용품">생활용품</option>
                  <option value="디지털/가전">디지털/가전</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">가격</label>
                <input 
                  name="price"
                  value={productInfo.price}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-md p-2 bg-white text-slate-900"
                  placeholder="예: 39,000원"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">상품 특징 (USP)</label>
                <button 
                  onClick={handleSuggestFeatures}
                  disabled={isSuggesting}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  {isSuggesting ? '생성 중...' : '✨ AI 자동 추천'}
                </button>
              </div>
              <textarea 
                name="features"
                value={productInfo.features}
                onChange={handleInputChange}
                className="w-full border border-slate-300 rounded-md p-2 h-24 text-sm bg-white text-slate-900"
                placeholder="상품의 핵심 특징을 입력하거나 AI 추천을 받아보세요."
              />
            </div>
          </div>
        </div>

        {/* Right: Target & Image */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2">타겟 및 이미지</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">타겟 성별</label>
            <div className="flex gap-2">
              {['남성', '여성', '전체'].map(g => (
                <button
                  key={g}
                  onClick={() => toggleTarget('gender', g)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border ${
                    productInfo.targetGender.includes(g)
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">타겟 연령대</label>
            <div className="flex flex-wrap gap-2">
              {['10대', '20대', '30대', '40대', '50대', '60대 이상'].map(age => (
                <button
                  key={age}
                  onClick={() => toggleTarget('age', age)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    productInfo.targetAge.includes(age)
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              레퍼런스 이미지 (필수) <span className="text-red-500">*</span>
            </label>
            <div 
              className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer bg-slate-50 relative overflow-hidden group"
              onClick={() => fileInputRef.current?.click()}
            >
              {refImage ? (
                <img src={refImage} alt="Ref" className="h-48 w-full object-contain mx-auto" />
              ) : (
                <div className="text-slate-500">
                  <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-1 text-sm">클릭하여 이미지 업로드</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-3 text-center">상세페이지 길이 (구조) 선택</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { value: 'auto', label: 'AI 자동 추천', desc: '상품 맞춤형' },
            { value: 5, label: '5장 (Short)', desc: '저관여/심플' },
            { value: 7, label: '7장 (Standard)', desc: '표준 구성' },
            { value: 9, label: '9장 (Long)', desc: '설득력 강화' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setProductInfo(prev => ({ ...prev, lengthOption: opt.value as any }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                productInfo.lengthOption === opt.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold">{opt.label}</div>
              <div className="text-xs opacity-70 mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={handlePlanDetail}
          disabled={isPlanning || !refImage}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-4 px-12 rounded-full shadow-lg transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPlanning ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              전략 기획 중...
            </>
          ) : (
            '상세페이지 기획 시작 🚀'
          )}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Step 2. 전략 기획 확인</h2>
          <p className="text-slate-500 mt-1">AI가 설계한 판매 논리입니다. 텍스트를 수정하거나 바로 생성을 시작하세요.</p>
        </div>
        <button 
          onClick={() => setStep(1)} 
          className="text-sm text-slate-500 hover:text-slate-800 underline"
        >
          뒤로 가기
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment, idx) => (
          <div key={segment.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-700 text-sm">#{idx + 1} {segment.title}</span>
              <div className="flex gap-1">
                {segment.logicalSections.map(tag => (
                  <span key={tag} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="p-4 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Key Message (카피)</label>
                <textarea 
                  value={segment.keyMessage}
                  onChange={(e) => handleUpdateSegment(segment.id, 'keyMessage', e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded bg-yellow-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors h-20 resize-none font-medium text-slate-800"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Visual Prompt (AI 지시문)</label>
                <textarea 
                  value={segment.visualPrompt}
                  onChange={(e) => handleUpdateSegment(segment.id, 'visualPrompt', e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors h-20 resize-none text-slate-600"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-8 pb-20">
        <button
          onClick={handleGenerateAll}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-4 px-16 rounded-full shadow-xl transform transition-all hover:scale-105 flex items-center gap-3"
        >
          <span>이미지 일괄 생성하기</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-fade-in pb-20">
       <div className="flex justify-between items-center border-b pb-4 sticky top-16 bg-slate-50/95 backdrop-blur z-40 py-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Step 3. 결과물 확인</h2>
          <p className="text-slate-500 text-sm">
            {generatingCount > 0 
              ? `${generatingCount}개의 이미지를 생성하고 있습니다...` 
              : '모든 이미지가 처리되었습니다.'}
          </p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg"
            >
                수정하기
            </button>
            <button 
                onClick={() => alert("준비 중입니다. (이미지를 우클릭하여 저장하세요)")}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
            >
                전체 다운로드
            </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-none overflow-hidden min-h-screen">
        {segments.map((segment) => (
            <div key={segment.id} className="relative w-full bg-slate-100 border-b border-slate-200 min-h-[400px]">
                {segment.imageUrl ? (
                    <img 
                        src={segment.imageUrl} 
                        alt={segment.title} 
                        className="w-full h-auto block"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                        {segment.isGenerating ? (
                             <div className="flex flex-col items-center">
                                <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-blue-600 font-medium animate-pulse">AI가 이미지를 생성 중입니다...</p>
                                <p className="text-slate-400 text-sm mt-2">"{segment.keyMessage}"</p>
                             </div>
                        ) : segment.error ? (
                            <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200 max-w-sm">
                                <svg className="w-8 h-8 mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                <p className="font-bold mb-1">생성 실패</p>
                                <p className="text-sm opacity-80">{segment.error}</p>
                            </div>
                        ) : (
                            <div className="text-slate-400">
                                <p>대기 중...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};

export default DetailPlanner;