import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DetailImageSegment, PageLength, ProductInfo } from "../types";

// Helper to get fresh AI instance with current key
const getAI = () => {
  // Safe access to process.env
  const envKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
  
  // Try to get key from LocalStorage first (User override), then Environment
  const apiKey = localStorage.getItem('gemini_api_key') || envKey;
  
  if (!apiKey) {
    throw new Error("API Key가 없습니다. 우측 상단 'API Key 설정' 버튼을 눌러 키를 입력해주세요.");
  }

  return new GoogleGenAI({ apiKey: apiKey });
};

// Helper to enhance error messages
const handleGeminiError = (error: any): never => {
  console.error("Gemini API Error:", error);
  const msg = error.toString().toLowerCase();

  if (msg.includes('permission denied') || msg.includes('403')) {
    throw new Error(
      "🚫 권한 오류 (Permission Denied)\n\n" +
      "1. 입력한 API Key가 올바른지 확인해주세요.\n" +
      "2. Google Cloud Console에서 'Generative Language API'가 활성화되어 있는지 확인하세요.\n" +
      "3. 무료 계정(Free Tier)인 경우 일부 모델(Pro/Vision) 접근이 제한될 수 있습니다."
    );
  }
  
  if (msg.includes('429') || msg.includes('resource exhausted')) {
    throw new Error("⚠️ 사용량 초과 (Quota Exceeded)\n\nAPI 요청 한도를 초과했습니다. 잠시 후 다시 시도하거나, 유료(Pay-as-you-go) 프로젝트인지 확인해주세요.");
  }

  if (msg.includes('400') || msg.includes('invalid argument')) {
    throw new Error("⚠️ 잘못된 요청 (Invalid Argument)\n\n입력 데이터나 프롬프트에 문제가 있습니다. 이미지 포맷 등을 확인해주세요.");
  }

  throw error;
};

export const suggestFeatures = async (name: string, category: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `
      상품명: ${name}
      카테고리: ${category}
      
      위 상품의 상세페이지에 들어갈만한 매력적인 특징(USP) 3~5가지를 한국어로 추천해줘. 
      단답형 리스트로 작성해.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || '';
  } catch (error) {
    handleGeminiError(error);
    return ""; // Unreachable due to throw
  }
};

export const planDetailPage = async (
  product: ProductInfo, 
  referenceImageBase64?: string
): Promise<DetailImageSegment[]> => {
  try {
    const ai = getAI();
    
    let lengthInstruction = "";
    if (product.lengthOption === 'auto') {
      lengthInstruction = "상품 특성을 분석하여 가장 효과적인 길이(5~9장 사이)를 스스로 판단해.";
    } else {
      lengthInstruction = `총 ${product.lengthOption}장의 이미지로 구성해.`;
    }

    const systemInstruction = `
      당신은 한국 스마트스토어/쿠팡 상세페이지 전문 전략가입니다.
      판매 논리(Seller Winning Logic)를 기반으로 상세페이지 기획안을 작성하세요.
      
      논리 구조 가이드:
      - 5장 (Short): Hook(후킹) -> Solution(해결) -> Clarity(스펙) -> Service(활용) -> Risk Reversal(신뢰)
      - 7장 (Standard): 위 구조에 Social Proof(리뷰), Detail Deep Dive 추가
      - 9장 (Long): 위 구조에 Brand Story, Competitor Comparison(차별화) 추가
      
      제약 사항:
      1. keyMessage는 이미지 안에 렌더링될 텍스트입니다. 반드시 **매력적인 한국어**로 작성하세요. 영어 헤드라인(Premium, Best 등)은 절대 금지합니다.
      2. visualPrompt는 이미지 생성 AI에게 전달할 프롬프트입니다. 제품이 돋보이는 구도와 조명을 상세히 묘사하세요.
      3. logicalSections는 해당 섹션이 어떤 전략(예: Hook, Solution)에 해당하는지 태그로 남기세요.
    `;

    const userPrompt = `
      상품명: ${product.name}
      카테고리: ${product.category}
      가격: ${product.price}
      특징: ${product.features}
      타겟: ${product.targetGender.join(', ')} / ${product.targetAge.join(', ')}
      프로모션: ${product.promotion}
      
      ${lengthInstruction}
      
      위 정보를 바탕으로 상세페이지 기획안을 JSON으로 생성해.
    `;

    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING, description: "섹션 제목 (예: 이미지 1 - 문제 제기)" },
          logicalSections: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "적용된 논리 태그 (예: Hook, Solution)"
          },
          keyMessage: { type: Type.STRING, description: "이미지에 렌더링될 한글 카피" },
          visualPrompt: { type: Type.STRING, description: "이미지 생성용 영문 프롬프트" }
        },
        required: ["id", "title", "logicalSections", "keyMessage", "visualPrompt"]
      }
    };

    const parts: any[] = [{ text: userPrompt }];
    
    // Add reference image context if available
    if (referenceImageBase64) {
      parts.unshift({
        inlineData: {
          mimeType: 'image/png', // Assuming PNG or standard image format from helper
          data: referenceImageBase64.split(',')[1] || referenceImageBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });
    
    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    handleGeminiError(error);
    return []; // Unreachable
  }
};

export const generateImageSection = async (
  segment: DetailImageSegment,
  referenceImageBase64?: string,
  ratio: '9:16' | '1:1' = '9:16'
): Promise<string> => {
  try {
    const ai = getAI();
    
    // Construct prompt for image generation
    const promptText = `
      Create a high-quality e-commerce product image.
      Aspect Ratio: ${ratio}.
      Visual Description: ${segment.visualPrompt}
      
      IMPORTANT: Render the following text clearly in Korean within the image in a stylish, professional typography that matches the product mood.
      Text to Render: "${segment.keyMessage}"
    `;

    const parts: any[] = [
      { text: promptText }
    ];

    if (referenceImageBase64) {
      parts.unshift({
        inlineData: {
          mimeType: 'image/png',
          data: referenceImageBase64.split(',')[1] || referenceImageBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
            aspectRatio: ratio, 
            // imageSize is NOT supported for 2.5 flash image
        }
      }
    });

    // Handle response to find image
    for (const cand of response.candidates || []) {
      for (const part of cand.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("이미지가 생성되지 않았습니다.");
  } catch (error) {
    handleGeminiError(error);
    return ""; // Unreachable
  }
};