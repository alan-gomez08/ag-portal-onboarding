export interface OnboardingData {
  // BLOQUE 0
  mercadoLibreUser: string;
  templateSelected: 'T1' | 'T2' | 'T3' | 'T4' | '';
  
  // BLOQUE 1
  logoUrl: string;
  backgroundTone: 'Claros' | 'Oscuros' | 'Criterio del diseñador' | '';
  heroTitle: string;
  extraInfo: string;

  // BLOQUES T1 / T2 / T3 / T4 (Campos dinámicos)
  heroImage: string;
  categories: Array<{ name: string; images: string[] }>;
  highlightedItems: string[]; // Platos, servicios o esencia
  strengths: string;

  // BLOQUE 3
  reviews: string;
  reviewImages: string[];
  socialLinks: string;
  whatsapp: string;
  address: string;

  // BLOQUE 4
  domainType: 'Profesional' | 'Gratuito' | '';
  domainOptions: string;
}