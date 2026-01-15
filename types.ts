export type PageLength = 5 | 7 | 9 | 'auto';

export interface DetailImageSegment {
  id: string;
  title: string;
  logicalSections: string[];
  keyMessage: string;
  visualPrompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
  error?: string;
}

export interface ProductInfo {
  name: string;
  category: string;
  price: string;
  features: string;
  targetGender: string[];
  targetAge: string[];
  promotion: string;
  lengthOption: PageLength;
}

export interface ThumbnailOptions {
  style: 'clean' | 'lifestyle' | 'creative';
  includeModel: boolean;
  textPosition: 'center' | 'top' | 'bottom' | 'none';
  customText: string;
}