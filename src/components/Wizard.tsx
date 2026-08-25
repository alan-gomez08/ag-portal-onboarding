import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, PartyPopper, Sparkles, Image as ImageIcon, MapPin, Phone, AtSign, Monitor, Smartphone, Plus, Trash2, Star, Type, BarChart3, CalendarHeart, Award, HeartHandshake, CreditCard, Link as LinkIcon, Info, Loader2, ShieldCheck, ExternalLink, ShoppingCart, UploadCloud, CheckCircle2, Zap, TrendingUp, X } from 'lucide-react';
import type { OnboardingData } from '../types';
import ImageUpload from './ImageUpload';
import AddressAutocomplete from './AddressAutocomplete'; 

import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

type ProductItem = { id: string; name: string; description: string; price: string; image: string };
type Category = { name: string; items: ProductItem[] };
type ServiceItem = { id: string; title: string; description: string; iconHint: string };

interface ExtendedData extends Omit<OnboardingData, 'categories'> {
  wantsMobileHero: boolean; heroImageMobile: string;
  noLogo: boolean;
  primaryColor: string; secondaryColor: string; typography: string; customTypography: string;
  aboutImage: string; aboutText: string;
  stats: { label: string; value: string }[];
  offersEvents: boolean | null; eventTitle: string; eventDescription: string;
  t2Strengths: string[]; t2StoryText: string; t2StoryImage: string; t2MaterialsText: string; t2MaterialsImages: string[];
  services: ServiceItem[];
  categories: Category[]; featuredIds: string[];
  useGoogleMapsReviews: boolean; googleMapsLink: string; reviewsList: { name: string; text: string }[];
  domainOptionsList: string[];
  
  t1MenuMode: 'abierto' | 'ecommerce' | '';
  t1BulkUploadMode: boolean;
  t1BulkFileUrl: string;
  t1BulkFeatured: string[]; 
  t1DeliveryMethod: 'takeaway' | 'delivery' | 'ambos' | ''; 
  t1DeliveryZones: string; 
  t2Dynamic: 'productos' | 'servicios' | '';
  t2ProductMode: 'consulta' | 'vitrina' | '';
  t2AgendaMode: 'whatsapp' | 'link' | '';
  t2AgendaLink: string;
  t2ServicePricing: 'sin_precios' | 'con_precios' | '';
  acceptedTerms: boolean;
}

const generateEmptyItems = (): ProductItem[] => Array.from({ length: 6 }, () => ({ id: Math.random().toString(36).substring(7), name: '', description: '', price: '', image: '' }));
const generateEmptyServices = (): ServiceItem[] => Array.from({ length: 6 }, () => ({ id: Math.random().toString(36).substring(7), title: '', description: '', iconHint: '' }));

const initialData: ExtendedData = {
  mercadoLibreUser: '', templateSelected: '', logoUrl: '', noLogo: false,
  primaryColor: '', secondaryColor: '', typography: '', customTypography: '', backgroundTone: '', 
  heroTitle: '', extraInfo: '', heroImage: '', wantsMobileHero: false, heroImageMobile: '', 
  aboutImage: '', aboutText: '', stats: [{label:'', value:''}, {label:'', value:''}, {label:'', value:''}, {label:'', value:''}], 
  offersEvents: null, eventTitle: '', eventDescription: '',
  t2Strengths: ['', '', ''], t2StoryText: '', t2StoryImage: '', t2MaterialsText: '', t2MaterialsImages: ['', '', '', '', '', ''],
  services: generateEmptyServices(), 
  categories: [{ name: '', items: generateEmptyItems() }, { name: '', items: generateEmptyItems() }, { name: '', items: generateEmptyItems() }], 
  featuredIds: [], strengths: '', reviews: '', useGoogleMapsReviews: false, googleMapsLink: '', reviewsList: [{name:'', text:''}, {name:'', text:''}, {name:'', text:''}], reviewImages: [], socialLinks: '', whatsapp: '', address: '', domainType: '', domainOptionsList: ['', '', ''],
  t1MenuMode: '', t1BulkUploadMode: false, t1BulkFileUrl: '', t1BulkFeatured: ['', '', '', '', '', ''],
  t1DeliveryMethod: '', t1DeliveryZones: '',
  t2Dynamic: '', t2ProductMode: '', t2AgendaMode: '', t2AgendaLink: '', t2ServicePricing: '', acceptedTerms: false
};

const TEMPLATES = [
  { id: 'T1', name: 'Template 1 (Gastronomía)', img: '/assets/Template1.webp', link: 'https://landing-base-core-template1.vercel.app/' }, 
  { id: 'T2', name: 'Template 2 (Showroom/Turnos)', img: '/assets/Template2.webp', link: 'https://landing-base-core-template2.vercel.app/' },
  { id: 'T3', name: 'Template 3 (Corporativo)', img: '/assets/Template3.webp', link: 'https://landing-base-core-template3.vercel.app/' }, 
  { id: 'T4', name: 'Template 4 (Servicios Home)', img: '/assets/Template4.webp', link: 'https://landing-base-core-template4.vercel.app/' },
];

export default function Wizard() {
  const [data, setData] = useState<ExtendedData>(initialData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); 

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStepIndex]);

  const steps = useMemo(() => {
    const s = [{ id: 'WELCOME' }, { id: 'ML_USER' }, { id: 'TEMPLATE' }, { id: 'LOGO' }, { id: 'COLORS' }, { id: 'TYPOGRAPHY' }, { id: 'BACKGROUND' }, { id: 'HERO_TITLE' }, { id: 'HERO_DESKTOP' }];
    if (data.wantsMobileHero) s.push({ id: 'HERO_MOBILE' });

    if (data.templateSelected === 'T1') {
      s.push({ id: 'T1_ABOUT' }, { id: 'T1_UPSELL' }, { id: 'CATEGORIES_DEF' });
      if (!data.t1BulkUploadMode) {
        data.categories.forEach((cat, idx) => { if (cat.name.trim() !== '') s.push({ id: `CAT_UPLOAD_${idx}`, catIndex: idx }); });
        s.push({ id: 'FEATURED' });
      } else {
        s.push({ id: 'T1_BULK_UPLOAD' }, { id: 'T1_BULK_FEATURED' }); 
      }
      s.push({ id: 'T1_LOGISTICS' }); 
      s.push({ id: 'T1_STATS' }, { id: 'T1_EVENTS' });
    } 
    else if (data.templateSelected === 'T2') {
      s.push({ id: 'T2_DYNAMIC' });
      if (data.t2Dynamic === 'productos') {
        s.push({ id: 'T2_UPSELL_PROD' }, { id: 'T2_STORY' }, { id: 'T2_MATERIALS' }, { id: 'T2_STRENGTHS' }, { id: 'CATEGORIES_DEF' });
        data.categories.forEach((cat, idx) => { if (cat.name.trim() !== '') s.push({ id: `CAT_UPLOAD_${idx}`, catIndex: idx }); });
        s.push({ id: 'FEATURED' }); 
      } else if (data.t2Dynamic === 'servicios') {
        s.push(
          { id: 'T2_AGENDA' }, 
          { id: 'T2_UPSELL_SERV' }, 
          { id: 'T2_STORY' }, 
          { id: 'T2_STRENGTHS' }, 
          { id: 'T2_MATERIALS' }, 
          { id: 'CATEGORIES_DEF' }
        );
        data.categories.forEach((cat, idx) => { if (cat.name.trim() !== '') s.push({ id: `CAT_UPLOAD_${idx}`, catIndex: idx }); });
        s.push({ id: 'FEATURED' }); 
      }
    } 
    else if (data.templateSelected === 'T3' || data.templateSelected === 'T4') {
      s.push({ id: 'T1_ABOUT' }, { id: 'SERVICES_DEF' }, { id: 'STRENGTHS' });
    }
    
    s.push({ id: 'REVIEWS_NEW' }, { id: 'CONTACT_NEW' }, { id: 'DOMAIN_TYPE' });
    if (data.domainType !== '' && data.domainType !== 'GRATIS') s.push({ id: 'DOMAIN_OPTIONS' });
    s.push({ id: 'TERMS' }, { id: 'END' });
    return s;
  }, [data]);

  const currentStep = steps[currentStepIndex];
  const nextStep = () => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  const prevStep = () => setCurrentStepIndex((prev) => Math.max(0, prev - 1));

  const handleInputChange = (field: keyof ExtendedData, value: any) => setData((prev) => ({ ...prev, [field]: value }));

  const updateCategoryName = (index: number, name: string) => { const newCats = [...data.categories]; newCats[index].name = name; setData(prev => ({ ...prev, categories: newCats })); };
  const addCategory = () => { if (data.categories.length < 5) setData(prev => ({ ...prev, categories: [...prev.categories, { name: '', items: generateEmptyItems() }] })); };
  const removeCategory = (index: number) => setData(prev => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }));
  const updateProduct = (catIdx: number, itemIdx: number, field: keyof ProductItem, value: string) => { const newCats = [...data.categories]; newCats[catIdx].items[itemIdx] = { ...newCats[catIdx].items[itemIdx], [field]: value }; setData(prev => ({ ...prev, categories: newCats })); };
  const toggleFeatured = (id: string) => setData(prev => ({ ...prev, featuredIds: prev.featuredIds.includes(id) ? prev.featuredIds.filter(fId => fId !== id) : prev.featuredIds.length >= 6 ? prev.featuredIds : [...prev.featuredIds, id] }));
  const updateService = (index: number, field: keyof ServiceItem, value: string) => { const newS = [...data.services]; newS[index] = { ...newS[index], [field]: value }; setData(prev => ({ ...prev, services: newS })); };
  const updateStat = (index: number, field: 'label'|'value', val: string) => { const n = [...data.stats]; n[index][field] = val; setData(prev => ({ ...prev, stats: n })); };
  const updateT2Strength = (index: number, val: string) => { const n = [...data.t2Strengths]; n[index] = val; setData(prev => ({ ...prev, t2Strengths: n })); };
  const updateReview = (index: number, field: 'name'|'text', val: string) => { const n = [...data.reviewsList]; n[index][field] = val; setData(prev => ({ ...prev, reviewsList: n })); };
  const updateDomainOption = (index: number, val: string) => { const n = [...data.domainOptionsList]; n[index] = val; setData(prev => ({ ...prev, domainOptionsList: n })); };
  const updateT2MaterialImage = (index: number, val: string) => { const n = [...data.t2MaterialsImages]; n[index] = val; setData(prev => ({ ...prev, t2MaterialsImages: n })); };
  const updateBulkFeatured = (index: number, val: string) => { const n = [...data.t1BulkFeatured]; n[index] = val; setData(prev => ({ ...prev, t1BulkFeatured: n })); };

  // CALCULO DEL CARRITO INTELIGENTE
  const calculateTotal = () => {
    let total = 0;
    if (data.domainType === 'COM') total += 30000;
    if (data.domainType === 'ONLINE') total += 20000;
    
    if (data.templateSelected === 'T1' && data.t1MenuMode === 'ecommerce') total += 30000;
    if (data.templateSelected === 'T2' && data.t2Dynamic === 'productos' && data.t2ProductMode === 'vitrina') total += 30000;
    if (data.templateSelected === 'T2' && data.t2Dynamic === 'servicios' && data.t2ServicePricing === 'con_precios') total += 30000;
    
    return total;
  };

  const clearCartSelections = () => {
    setData(prev => ({
      ...prev,
      domainType: prev.domainType !== '' ? 'GRATIS' : prev.domainType,
      t1MenuMode: prev.t1MenuMode !== '' ? 'abierto' : prev.t1MenuMode,
      t2ProductMode: prev.t2ProductMode !== '' ? 'consulta' : prev.t2ProductMode,
      t2ServicePricing: prev.t2ServicePricing !== '' ? 'sin_precios' : prev.t2ServicePricing
    }));
  };

  const isNextDisabled = () => {
    const step = currentStep.id;

    if (step === 'ML_USER') return data.mercadoLibreUser.trim() === '';
    if (step === 'TEMPLATE') return data.templateSelected === '';
    if (step === 'LOGO') return !data.noLogo && data.logoUrl === '';
    if (step === 'COLORS') return data.primaryColor.trim() === '' || data.secondaryColor.trim() === '';
    if (step === 'TYPOGRAPHY') return data.typography === '' || (data.typography === 'Otra' && data.customTypography.trim() === '');
    if (step === 'BACKGROUND') return data.backgroundTone === '';
    if (step === 'HERO_TITLE') return data.heroTitle.trim() === '';
    if (step === 'HERO_DESKTOP') return data.heroImage === '';
    if (step === 'HERO_MOBILE') return data.heroImageMobile === '';

    // T1, T3, T4
    if (step === 'T1_ABOUT') return data.aboutImage === '' || data.aboutText.trim() === '';
    
    if (step === 'T1_UPSELL') return data.t1MenuMode === '';
    if (step === 'T1_BULK_UPLOAD') return data.t1BulkFileUrl.trim() === '';
    if (step === 'T1_BULK_FEATURED') return data.t1BulkFeatured.some(n => n.trim() === '');
    
    // T1 - Validación Logística
    if (step === 'T1_LOGISTICS') {
      if (data.t1DeliveryMethod === '') return true;
      if ((data.t1DeliveryMethod === 'delivery' || data.t1DeliveryMethod === 'ambos') && data.t1DeliveryZones.trim() === '') return true;
      return false;
    }

    if (step === 'T1_STATS') return data.stats.some(s => s.label.trim() === '' || s.value.trim() === '');
    if (step === 'T1_EVENTS') {
      if (data.offersEvents === null) return true;
      if (data.offersEvents === true) return data.eventTitle.trim() === '' || data.eventDescription.trim() === '';
      return false;
    }

    // T2
    if (step === 'T2_DYNAMIC') return data.t2Dynamic === '';
    if (step === 'T2_UPSELL_PROD') return data.t2ProductMode === '';
    if (step === 'T2_AGENDA') return data.t2AgendaMode === '' || (data.t2AgendaMode === 'link' && data.t2AgendaLink.trim() === '');
    if (step === 'T2_UPSELL_SERV') return data.t2ServicePricing === '';
    if (step === 'T2_STORY') return data.t2StoryText.trim() === '' || data.t2StoryImage === '';
    if (step === 'T2_MATERIALS') return data.t2MaterialsText.trim() === '' || !data.t2MaterialsImages.some(img => img !== '');
    if (step === 'T2_STRENGTHS') return data.t2Strengths.some(s => s.trim() === '');

    // Categorias & Portfolio (T1 y T2)
    if (step === 'CATEGORIES_DEF') {
      const validCats = data.categories.filter(c => c.name.trim() !== '');
      return validCats.length < 3 || validCats.length > 5;
    }
    if (step?.startsWith('CAT_UPLOAD_')) {
      const catIndex = currentStep.catIndex!;
      const items = data.categories[catIndex].items;
      
      // EXIGIR PRECIO EN LAS OPCIONES DE PAGO
      if (data.t1MenuMode === 'ecommerce' || data.t2ProductMode === 'vitrina' || data.t2ServicePricing === 'con_precios') {
        const hasImgWithoutPrice = items.some(item => item.image !== '' && item.price.trim() === '');
        if (hasImgWithoutPrice) return true;
      }
      return !items.some(item => item.image !== '');
    }
    if (step === 'FEATURED') return data.featuredIds.length === 0;

    // Servicios
    if (step === 'SERVICES_DEF') {
      const validServices = data.services.filter(s => s.title.trim() !== '' && s.description.trim() !== '');
      return validServices.length < 6;
    }
    if (step === 'STRENGTHS') return data.strengths.trim() === '';

    // Finales
    if (step === 'REVIEWS_NEW') {
      if (data.useGoogleMapsReviews) return data.googleMapsLink.trim() === '';
      return data.reviewsList.some(r => r.name.trim() === '' || r.text.trim() === '');
    }
    if (step === 'CONTACT_NEW') return data.whatsapp.trim() === ''; 
    if (step === 'DOMAIN_TYPE') return data.domainType === '';
    if (step === 'DOMAIN_OPTIONS') return data.domainOptionsList.some(d => d.trim() === '');
    if (step === 'TERMS') return !data.acceptedTerms;

    return false;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const cleanData = {
        fechaCreacion: serverTimestamp(),
        estadoProyecto: 'NUEVO',
        usuarioML: data.mercadoLibreUser,
        plantillaElegida: data.templateSelected,
        upsells: {
          t1Modo: data.t1MenuMode,
          t2Dinamica: data.t2Dynamic,
          t2ModoProd: data.t2ProductMode,
          t2AgendaModo: data.t2AgendaMode,
          t2AgendaLink: data.t2AgendaLink,
          t2ServicePricing: data.t2ServicePricing
        },
        identidad: {
          logoUrl: data.noLogo ? 'Requiere diseño de logo' : data.logoUrl,
          colorPrincipal: data.primaryColor,
          colorSecundario: data.secondaryColor,
          tipografia: data.typography === 'Otra' ? data.customTypography : data.typography,
          tonoFondo: data.backgroundTone
        },
        portada: {
          tituloPrincipal: data.heroTitle,
          imagenEscritorio: data.heroImage,
          imagenCelular: data.wantsMobileHero ? data.heroImageMobile : 'Usar la misma'
        },
        categorias: data.categories.filter(c => c.name.trim() !== '').map(c => ({
          nombreCategoria: c.name,
          productos: c.items.filter(i => i.image !== '').map(i => ({ nombre: i.name, descripcion: i.description, precio: i.price, urlImagen: i.image, destacado: data.featuredIds.includes(i.id) }))
        })),
        archivoCatalogoMasivo: { url: data.t1BulkFileUrl, destacadosEscritos: data.t1BulkUploadMode ? data.t1BulkFeatured : [] },
        servicios: data.services.filter(s => s.title.trim() !== '').map(s => ({ titulo: s.title, descripcion: s.description, iconoSugerido: s.iconHint })),
        
        ...(['T1', 'T3', 'T4'].includes(data.templateSelected) && {
          sobreNosotros: { texto: data.aboutText, imagen: data.aboutImage }
        }),
        
        ...(data.templateSelected === 'T1' && {
          logistica: {
            metodo: data.t1DeliveryMethod,
            zonas: ['delivery', 'ambos'].includes(data.t1DeliveryMethod) ? data.t1DeliveryZones : null
          },
          estadisticas: data.stats,
          eventos: data.offersEvents ? { titulo: data.eventTitle, descripcion: data.eventDescription } : null,
        }),
        ...(data.templateSelected === 'T2' && {
          inspiracionHistoria: { texto: data.t2StoryText, imagenPrincipal: data.t2StoryImage },
          diferencialMateriales: { texto: data.t2MaterialsText, imagenesGaleria: data.t2MaterialsImages.filter(img => img !== '') },
          puntosFuertes: data.t2Strengths,
        }),
        ...(['T3', 'T4'].includes(data.templateSelected) && { porQueElegirnos: data.strengths }),
        confianza: {
          origenResenas: data.useGoogleMapsReviews ? 'Google Maps' : 'Manuales',
          linkGoogleMaps: data.useGoogleMapsReviews ? data.googleMapsLink : null,
          resenasManuales: data.useGoogleMapsReviews ? null : data.reviewsList
        },
        contacto: { whatsapp: data.whatsapp, redSocial: data.socialLinks, direccionMapsLink: data.address || 'No tiene local' },
        dominio: { tipo: data.domainType, opcionesNombres: data.domainType !== 'GRATIS' ? data.domainOptionsList : [] }
      };

      const documentId = data.mercadoLibreUser.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, "proyectos", documentId), cleanData);
      
      const totalToPay = calculateTotal();

      if (totalToPay > 0) {
        
        // --- LÓGICA INTELIGENTE DE LINKS DE MERCADO PAGO ---
        let paymentLink = "";
        
        const isT1Upsell = data.templateSelected === 'T1' && data.t1MenuMode === 'ecommerce';
        const isT2Upsell = data.templateSelected === 'T2' && (data.t2ProductMode === 'vitrina' || data.t2ServicePricing === 'con_precios');

        if (isT1Upsell) {
            if (data.domainType === 'COM') paymentLink = "https://mpago.la/2FttjFq"; // 60k
            else if (data.domainType === 'ONLINE') paymentLink = "https://mpago.la/2xfJC7f"; // 50k
            else paymentLink = "https://mpago.la/2yNRhjy"; // 30k
        } else if (isT2Upsell) {
            if (data.domainType === 'COM') paymentLink = "https://mpago.la/21JKaF7"; // 60k
            else if (data.domainType === 'ONLINE') paymentLink = "https://mpago.la/21JoSgV"; // 50k
            else paymentLink = "https://mpago.la/2tUxTwD"; // 30k
        } else {
            // T1/T2 sin upsells o Clientes T3/T4
            if (data.domainType === 'COM') paymentLink = "https://mpago.la/1WttGMk"; // 30k
            else if (data.domainType === 'ONLINE') paymentLink = "https://mpago.la/1iLbwZF"; // 20k
        }

        if (paymentLink !== "") {
            alert(`¡Toda tu información se guardó correctamente! 🎉\n\nEl total de tus adicionales es de $${totalToPay.toLocaleString('es-AR')}.\n\nSerás redirigido a Mercado Pago para completar tu pedido.`);
            window.location.href = paymentLink;
        } else {
            alert("¡Éxito! 🎉\n\nTu formulario fue enviado a nuestro equipo. Como tu diseño y subdominio están bonificados, no tenés que abonar nada más. Nos pondremos a trabajar pronto.");
        }

      } else {
        alert("¡Éxito! 🎉\n\nTu formulario fue enviado a nuestro equipo. Como tu diseño y subdominio están bonificados, no tenés que abonar nada más. Nos pondremos a trabajar pronto.");
      }

    } catch (error) {
      alert("Hubo un problema guardando tu formulario. Por favor, revisá tu conexión o contactanos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = { enter: { y: 30, opacity: 0 }, center: { y: 0, opacity: 1 }, exit: { y: -30, opacity: 0 } };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col items-center pt-20 md:pt-24 px-4 relative selection:bg-blue-200">
      
      {/* NAVEGACIÓN SUPERIOR FIJA */}
      <div className="fixed top-0 left-0 w-full flex flex-col items-center z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm pt-safe-top pt-4 pb-3 px-4 md:px-12">
        <div className="w-full max-w-5xl flex items-center justify-between">
          <img src="/assets/Logo.webp" alt="Logo" className="h-7 md:h-10 w-auto opacity-90" />
          
          {currentStep.id !== 'WELCOME' && currentStep.id !== 'END' && (
            <div className="flex gap-1 md:gap-2">
              {steps.map((s, i) => (
                <div key={i} className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${i === currentStepIndex ? 'w-5 md:w-8 bg-blue-600' : i < currentStepIndex ? 'w-1.5 md:w-2 bg-blue-300' : 'w-1.5 md:w-2 bg-slate-200'}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="w-full max-w-4xl flex flex-col pb-36 md:pb-40 mt-6 md:mt-8">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep.id} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: "easeOut" }} className="w-full flex flex-col justify-center">
            
            {/* === WELCOME === */}
            {currentStep.id === 'WELCOME' && (
              <div className="flex flex-col items-center text-center gap-4 md:gap-6 py-10">
                <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5, duration: 0.8 }} className="w-24 h-24 md:w-28 md:h-28 bg-white text-blue-600 rounded-full flex items-center justify-center mb-2 shadow-xl shadow-blue-100/50"><PartyPopper size={48} className="md:w-14 md:h-14" /></motion.div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">¡Gracias por tu compra!</h1>
                <p className="text-lg md:text-2xl text-slate-500 max-w-2xl leading-relaxed">Estamos emocionados de empezar a construir tu nueva presencia digital. Diseñamos este asistente para que nos cuentes sobre tu marca de forma súper fácil y a tu ritmo.</p>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-2 max-w-xl text-left md:text-center">
                  <p className="text-blue-800 text-sm md:text-base"><span className="font-bold">💡 Tip importante:</span> No te preocupes por la redacción perfecta de los textos. Nuestro equipo va a revisar y optimizar todo para asegurar que quede profesional. Solo dejanos tus ideas.</p>
                </div>
                <button onClick={nextStep} className="mt-4 px-8 md:px-12 py-4 md:py-5 bg-blue-600 text-white rounded-full font-bold text-lg md:text-xl flex items-center gap-3 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/30 w-full md:w-auto justify-center">
                  <Sparkles size={24} /> Empezar a crear
                </button>
              </div>
            )}

            {currentStep.id === 'ML_USER' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto w-full py-6">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0 md:mb-2 text-center">Paso 1 de vinculación</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 text-center">¿Cuál es tu usuario de Mercado Libre?</h2>
                <p className="text-lg md:text-2xl text-slate-500 mb-2 text-center">Lo necesitamos obligatoriamente para vincular esta información con tu compra de forma segura.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2 md:mb-4">
                  <p className="text-slate-600 text-base md:text-lg text-center">Podés poner tu apodo de Mercado Libre (Ej: JUANPEREZ_VENTAS) o el correo electrónico con el que hiciste la compra.</p>
                </div>
                <input type="text" value={data.mercadoLibreUser} onChange={(e) => handleInputChange('mercadoLibreUser', e.target.value)} placeholder="Ej: JUANPEREZ_VENTAS" className="w-full text-xl md:text-2xl text-center bg-white border-2 border-slate-200 rounded-2xl md:rounded-3xl focus:border-blue-500 outline-none p-5 md:p-6 transition-all shadow-sm" autoFocus />
              </div>
            )}

            {/* SELECCIÓN DE TEMPLATE CON DEMOS */}
            {currentStep.id === 'TEMPLATE' && (
              <div className="flex flex-col gap-4 md:gap-6 w-full max-w-4xl mx-auto">
                <div className="flex flex-col text-center px-2">
                  <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-1">Estructura Base</p>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-2">¿Qué plantilla desea usar?</h2>
                  <p className="text-lg md:text-2xl text-slate-500 mb-0 max-w-2xl mx-auto">Puede ver una demostración en vivo tocando el botón azul de cada opción.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-2 md:px-4">
                  {TEMPLATES.map((tpl) => (
                    <div key={tpl.id} className={`group relative rounded-[1.5rem] md:rounded-[2rem] border-4 flex flex-col transition-all duration-300 overflow-hidden ${data.templateSelected === tpl.id ? 'border-blue-500 shadow-xl shadow-blue-500/20 scale-[1.02]' : 'border-white bg-white hover:border-blue-200 hover:shadow-md'}`}>
                      <button onClick={() => handleInputChange('templateSelected', tpl.id)} className="w-full text-left flex-1 focus:outline-none">
                        <div className="h-48 md:h-56 w-full overflow-hidden relative bg-slate-50 flex items-center justify-center p-4">
                          <img src={tpl.img} alt={tpl.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                          {data.templateSelected === tpl.id && <div className="absolute inset-0 bg-blue-500/5 transition-colors" />}
                        </div>
                        <div className="p-4 md:p-5 bg-white flex items-center justify-between border-t border-slate-100">
                          <span className={`font-black text-lg md:text-2xl ${data.templateSelected === tpl.id ? 'text-blue-600' : 'text-slate-800'}`}>{tpl.name}</span>
                          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-colors ${data.templateSelected === tpl.id ? 'border-blue-500 bg-blue-500' : 'border-slate-200'}`}>{data.templateSelected === tpl.id && <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-white rounded-full" />}</div>
                        </div>
                      </button>
                      <a href={tpl.link} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-center font-bold text-base md:text-lg flex justify-center items-center gap-2 border-t border-blue-100 transition-colors">
                        Ver Demo en vivo <ExternalLink size={18} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'LOGO' && (
              <div className="flex flex-col gap-4 md:gap-6 w-full max-w-xl mx-auto py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase text-center mb-0">Identidad Visual</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-center text-slate-900">Subí tu logo oficial</h2>
                <p className="text-lg md:text-2xl text-slate-500 text-center mb-2 md:mb-4 px-2">Si la imagen tiene fondo blanco o es cuadrada, subila igual. Nuestro equipo de diseño la va a limpiar y adaptar.</p>
                
                <AnimatePresence>
                  {!data.noLogo && (
                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="flex flex-col items-center w-full mb-2 px-2">
                      <div className="w-full bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="w-full bg-slate-50 border-b border-slate-200 h-12 md:h-14 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
                          <div className="px-3 py-1 bg-blue-100/50 rounded-lg flex items-center text-blue-600 relative z-10 font-black tracking-widest text-[10px] md:text-xs"><ImageIcon size={16} className="mr-2" /> AQUÍ VA TU LOGO</div>
                        </div>
                        <div className="p-4 md:p-6 bg-white">
                          <ImageUpload userId={data.mercadoLibreUser} value={data.logoUrl} onChange={(url) => handleInputChange('logoUrl', url)} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <label className="flex items-center gap-3 md:gap-4 p-4 md:p-6 bg-slate-50/50 border-2 border-slate-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all shadow-sm mx-2 md:mx-0">
                  <input type="checkbox" checked={data.noLogo} onChange={(e) => { handleInputChange('noLogo', e.target.checked); if(e.target.checked) handleInputChange('logoUrl', ''); }} className="w-6 h-6 md:w-8 md:h-8 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-bold text-lg md:text-xl">No tengo logo aún.</span>
                    <span className="text-slate-500 text-sm md:text-base">Marcá esta opción y nuestro equipo armará tu marca con una linda tipografía sin costo extra.</span>
                  </div>
                </label>
              </div>
            )}

            {currentStep.id === 'COLORS' && (
              <div className="flex flex-col gap-4 md:gap-6 w-full max-w-3xl mx-auto text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Identidad Visual</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">Definí tus colores</h2>
                <p className="text-lg md:text-2xl text-slate-500 mb-2">Es vital para que la web respete tu marca. Podés escribir el código exacto o contarnos qué tonos te gustan.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl md:rounded-2xl p-3 md:p-4 mb-2 text-left">
                  <p className="text-amber-800 text-sm md:text-base">⚠️ Si nos pediste que te diseñemos el logo en el paso anterior, acá decinos con qué colores te gustaría que lo hagamos.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 text-left">
                  <div className="flex-1 bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm focus-within:border-blue-500 transition-colors">
                    <label className="font-bold text-slate-700 text-lg md:text-xl flex items-center gap-2 mb-1"><div className="w-4 h-4 rounded-full bg-blue-600"></div> Color Principal</label>
                    <p className="text-sm md:text-base text-slate-400 mb-2 md:mb-3 min-h-[30px] md:min-h-[40px]">Se usará para botones, precios y detalles importantes que queremos destacar.</p>
                    <input type="text" value={data.primaryColor} onChange={(e)=>handleInputChange('primaryColor', e.target.value)} placeholder="Ej: 'Azul marino oscuro'" className="w-full text-lg md:text-xl bg-slate-50 rounded-xl outline-none p-4 text-slate-900 font-medium" />
                  </div>
                  <div className="flex-1 bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm focus-within:border-slate-400 transition-colors">
                    <label className="font-bold text-slate-700 text-lg md:text-xl flex items-center gap-2 mb-1"><div className="w-4 h-4 rounded-full border-2 border-slate-300"></div> Color Secundario</label>
                    <p className="text-sm md:text-base text-slate-400 mb-2 md:mb-3 min-h-[30px] md:min-h-[40px]">Se usará para fondos sutiles, secciones secundarias o bordes.</p>
                    <input type="text" value={data.secondaryColor} onChange={(e)=>handleInputChange('secondaryColor', e.target.value)} placeholder="Ej: 'Beige clarito tipo madera'" className="w-full text-lg md:text-xl bg-slate-50 rounded-xl outline-none p-4 text-slate-900 font-medium" />
                  </div>
                </div>
              </div>
            )}

            {currentStep.id === 'TYPOGRAPHY' && (
              <div className="flex flex-col gap-4 md:gap-6 w-full max-w-2xl mx-auto px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0 text-center">Identidad Visual</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-center text-slate-900">Estilo de letra</h2>
                <p className="text-lg md:text-2xl text-center text-slate-500 mb-2">Elegí la "vibra" que mejor represente a tu marca. Esto cambia por completo la sensación visual de la página.</p>
                <div className="grid gap-3 md:gap-4 mt-2">
                  <button onClick={() => handleInputChange('typography', 'Sans Serif')} className={`w-full text-left p-6 rounded-[2rem] border-4 transition-all flex items-center justify-between ${data.typography === 'Sans Serif' ? 'border-blue-500 bg-blue-50 shadow-xl scale-[1.02]' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex items-center gap-4 pr-2">
                      <div className={`p-4 rounded-2xl shrink-0 ${data.typography === 'Sans Serif' ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-400'}`}><Type size={28} /></div>
                      <div className="flex flex-col"><span className="text-2xl md:text-3xl font-bold text-slate-800 leading-none mb-1" style={{fontFamily: 'sans-serif'}}>Moderna y Limpia</span><span className="text-sm md:text-base text-slate-500 leading-tight">Estilo Sans Serif (Sin remates). Ideal para rubros tech o marcas jóvenes.</span></div>
                    </div>
                    <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center shrink-0 transition-colors ${data.typography === 'Sans Serif' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{data.typography === 'Sans Serif' && <div className="w-3 h-3 bg-white rounded-full" />}</div>
                  </button>
                  <button onClick={() => handleInputChange('typography', 'Serif')} className={`w-full text-left p-6 rounded-[2rem] border-4 transition-all flex items-center justify-between ${data.typography === 'Serif' ? 'border-blue-500 bg-blue-50 shadow-xl scale-[1.02]' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex items-center gap-4 pr-2">
                      <div className={`p-4 rounded-2xl shrink-0 ${data.typography === 'Serif' ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-400'}`}><Type size={28} /></div>
                      <div className="flex flex-col"><span className="text-2xl md:text-3xl font-bold text-slate-800 leading-none mb-1" style={{fontFamily: 'serif'}}>Clásica y Elegante</span><span className="text-sm md:text-base text-slate-500 leading-tight">Estilo Serif (Con remates). Ideal para mueblerías finas o marcas premium.</span></div>
                    </div>
                    <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center shrink-0 transition-colors ${data.typography === 'Serif' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{data.typography === 'Serif' && <div className="w-3 h-3 bg-white rounded-full" />}</div>
                  </button>
                  <button onClick={() => handleInputChange('typography', 'Otra')} className={`w-full text-left p-6 rounded-[2rem] border-4 transition-all flex flex-col gap-4 ${data.typography === 'Otra' ? 'border-blue-500 bg-blue-50 shadow-xl scale-[1.02]' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4 pr-2"><div className={`p-4 rounded-2xl shrink-0 ${data.typography === 'Otra' ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-400'}`}><Type size={28}/></div>
                      <div className="flex flex-col"><span className="text-2xl md:text-3xl font-bold text-slate-800 leading-none mb-1">Otra diferente</span><span className="text-sm md:text-base text-slate-500 leading-tight">Ya sé qué fuente de Google Fonts quiero usar.</span></div>
                      </div>
                      <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center shrink-0 transition-colors ${data.typography === 'Otra' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{data.typography === 'Otra' && <div className="w-3 h-3 bg-white rounded-full" />}</div>
                    </div>
                    {data.typography === 'Otra' && (
                      <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="w-full mt-1 pl-[4.5rem]">
                        <input type="text" value={data.customTypography} onChange={e=>handleInputChange('customTypography', e.target.value)} placeholder="Ej: Montserrat, Roboto..." className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all text-xl font-medium" autoFocus />
                      </motion.div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {currentStep.id === 'BACKGROUND' && (
              <div className="flex flex-col gap-4 md:gap-6 w-full max-w-2xl mx-auto px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0 text-center">Identidad Visual</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-center text-slate-900">Tono del fondo principal</h2>
                <p className="text-lg md:text-2xl text-center text-slate-500 mb-2">Definí la base sobre la que vamos a mostrar tus productos para que resalten al máximo.</p>
                <div className="grid gap-3 md:gap-4 mt-2">
                  {['Tonos Claros (Luminoso, limpio y clásico)', 'Tonos Oscuros (Elegante, premium y moderno)', 'A criterio del diseñador (Confío en ustedes)'].map((tono) => (
                    <button key={tono} onClick={() => handleInputChange('backgroundTone', tono)} className={`w-full text-left p-6 rounded-[2rem] border-4 transition-all flex items-center justify-between ${data.backgroundTone === tono ? 'border-blue-500 bg-blue-50 shadow-xl scale-[1.02]' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                      <span className="text-xl md:text-2xl font-bold text-slate-800 pr-2 leading-tight">{tono}</span>
                      <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center shrink-0 transition-colors ${data.backgroundTone === tono ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{data.backgroundTone === tono && <div className="w-3 h-3 bg-white rounded-full" />}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'HERO_TITLE' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Primer Impacto</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">¿Qué querés transmitir al entrar?</h2>
                <p className="text-lg md:text-2xl text-slate-500">Este será el título principal de tu web. Lo primero que leen.</p>
                <div className="flex items-start gap-4 bg-blue-50 p-5 rounded-2xl text-left border border-blue-100 shadow-sm mt-1">
                  <Info className="text-blue-500 shrink-0 mt-0.5" size={24} />
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-blue-900 text-base md:text-lg">No te compliques buscando la frase perfecta.</p>
                    <p className="text-blue-800 text-sm md:text-base leading-relaxed">Solo dejá tu idea en bruto (Ej: <i>"Vendemos muebles de autor en CABA"</i>) y nuestro equipo de SEO lo va a transformar en un título corto y súper atractivo que convierta.</p>
                  </div>
                </div>
                <div className="relative mt-2">
                  <textarea value={data.heroTitle} onChange={(e) => handleInputChange('heroTitle', e.target.value)} placeholder="Escribí tu idea principal acá. Es obligatorio para avanzar..." className="w-full text-xl md:text-2xl text-center bg-white border-2 border-slate-200 rounded-3xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none p-8 md:p-10 transition-all min-h-[160px] md:min-h-[220px] resize-none shadow-sm" autoFocus />
                </div>
              </div>
            )}

            {currentStep.id === 'HERO_DESKTOP' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-3xl mx-auto w-full px-2 md:px-0 py-4 text-center">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Primer Impacto</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-2">Foto de Portada Principal</h2>
                <p className="text-lg md:text-2xl text-slate-500 mb-4">Esta es la foto gigante que verán tus clientes al entrar desde una computadora. Debe ser la de mejor calidad que tengas.</p>
                
                <div className="w-full max-w-md mx-auto relative mb-4">
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-full bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
                    <div className="h-8 bg-slate-50 flex items-center px-4 gap-2 border-b border-slate-100"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
                    <div className="h-32 m-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
                      <span className="font-black tracking-widest text-xs text-blue-500 flex items-center gap-2"><Monitor size={16}/> FOTO HORIZONTAL</span>
                    </div>
                  </motion.div>
                </div>
                <div className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm"><ImageUpload userId={data.mercadoLibreUser} value={data.heroImage} onChange={(url) => handleInputChange('heroImage', url)} /></div>

                {data.templateSelected !== 'T4' && (
                  <label className="flex items-start md:items-center gap-4 p-6 bg-blue-50/50 border-2 border-blue-100 rounded-2xl cursor-pointer hover:border-blue-300 transition-colors mt-4 text-left">
                    <input type="checkbox" checked={data.wantsMobileHero} onChange={(e) => handleInputChange('wantsMobileHero', e.target.checked)} className="w-6 h-6 mt-1 md:mt-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-blue-900 font-bold text-lg md:text-xl leading-tight mb-1">Quiero subir una foto distinta adaptada para celulares.</span>
                      <span className="text-blue-700 text-sm md:text-base leading-relaxed">Altamente recomendado. Si no marcás esto, el sistema va a recortar automáticamente la foto horizontal de arriba.</span>
                    </div>
                  </label>
                )}
              </div>
            )}

            {currentStep.id === 'HERO_MOBILE' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-xl mx-auto w-full items-center text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Primer Impacto</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">Portada para Celular</h2>
                <p className="text-lg md:text-2xl text-slate-500">Más del 80% de tus clientes van a entrar a tu web desde el celu. Una foto vertical (formato Reel/Tiktok) hace que la página se vea inmensamente superior.</p>
                
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-40 h-64 bg-white rounded-[2rem] shadow-2xl shadow-slate-300/50 border-[6px] border-slate-800 overflow-hidden flex flex-col relative mb-4 mt-6">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-b-xl z-30"></div>
                   <div className="flex-1 m-3 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl relative flex items-center justify-center mt-8">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
                    <span className="font-black text-[10px] tracking-widest text-blue-500 flex flex-col items-center gap-1"><Smartphone size={24}/> VERTICAL</span>
                   </div>
                </motion.div>
                <div className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm"><ImageUpload userId={data.mercadoLibreUser} label="" value={data.heroImageMobile} onChange={(url) => handleInputChange('heroImageMobile', url)} /></div>
              </div>
            )}

            {currentStep.id === 'T1_ABOUT' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Sobre Nosotros</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-2">Contanos de ustedes</h2>
                <div className="flex items-start gap-4 bg-blue-50 p-5 rounded-2xl text-left border border-blue-100 max-w-2xl mx-auto mb-4">
                  <Info className="text-blue-500 shrink-0 mt-0.5" size={24} />
                  <p className="text-blue-800 text-sm md:text-base leading-relaxed">A los clientes les gusta saber quién está detrás del negocio. Hace cuánto hacen lo que hacen, por qué eligieron este rubro... Nuestro equipo de redacción se va a encargar de darle un tono emocional y profesional. ¡Ambos campos son obligatorios!</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-left">
                  <div className="flex flex-col gap-4 bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                    <label className="font-bold text-slate-700 text-lg md:text-xl">
                      {data.templateSelected === 'T1' 
                        ? 'Compartinos una foto linda del equipo, el mostrador o tu cocina (Horizontal)' 
                        : 'Compartinos una foto linda del equipo, la oficina o tu estudio (Horizontal)'}
                    </label>
                    <ImageUpload userId={data.mercadoLibreUser} value={data.aboutImage} onChange={(url) => handleInputChange('aboutImage', url)} />
                  </div>
                  <textarea 
                    value={data.aboutText} 
                    onChange={(e) => handleInputChange('aboutText', e.target.value)} 
                    placeholder={data.templateSelected === 'T1' 
                      ? "Ej: Todo empezó en 2018 con una receta familiar. Nos encanta ver a la gente disfrutar..." 
                      : "Ej: Somos un equipo de profesionales apasionados. Arrancamos hace unos años y hoy trabajamos para..."} 
                    className="w-full text-lg md:text-xl bg-white border-2 border-slate-100 rounded-[2rem] focus:border-blue-500 outline-none p-6 md:p-8 min-h-[220px] resize-none shadow-sm" 
                  />
                </div>
              </div>
            )}

            {/* --- UPSELL T1 (AGENCY LEVEL UI) --- */}
            {currentStep.id === 'T1_UPSELL' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-emerald-600 uppercase mb-0">Mejora tu Web</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-3"><ShoppingCart className="text-emerald-500 w-10 h-10"/> Elegí el modo de tu menú</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-left">
                  <button onClick={() => handleInputChange('t1MenuMode', 'abierto')} className={`relative w-full text-left p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-300 flex flex-col group ${data.t1MenuMode === 'abierto' ? 'border-blue-500 bg-blue-50/50 shadow-xl md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg'}`}>
                    <div className="flex justify-between items-start w-full mb-4">
                      <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.t1MenuMode === 'abierto' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                        {data.t1MenuMode === 'abierto' && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                      <span className="text-slate-400 font-bold tracking-widest text-xs uppercase bg-slate-100 px-3 py-1 rounded-full">Incluido</span>
                    </div>
                    <strong className="block text-2xl md:text-3xl font-black text-slate-800 mb-4">Catálogo Digital</strong>
                    <ul className="flex flex-col gap-3 w-full">
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Sin costo de mantenimiento mensual.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">El cliente envía su pedido libremente por WhatsApp.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Ideal para empezar con un menú sencillo.</span></li>
                    </ul>
                  </button>
                  
                  <button onClick={() => handleInputChange('t1MenuMode', 'ecommerce')} className={`relative w-full text-left p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-500 flex flex-col group ${data.t1MenuMode === 'ecommerce' ? 'border-emerald-500 bg-gradient-to-br from-emerald-50/50 to-white shadow-2xl shadow-emerald-500/20 md:-translate-y-2' : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xl'}`}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg flex items-center gap-2 w-max">
                      <TrendingUp size={14} /> POTENCIA TUS VENTAS
                    </div>
                    <div className="flex justify-between items-start w-full mb-4 mt-2">
                      <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.t1MenuMode === 'ecommerce' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                        {data.t1MenuMode === 'ecommerce' && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-emerald-700 font-black text-xl md:text-2xl leading-none">$30.000</span>
                        <span className="text-emerald-600/70 font-medium text-xs">/mensuales</span>
                      </div>
                    </div>
                    <strong className="block text-2xl md:text-3xl font-black text-slate-800 mb-4">E-Commerce Lite</strong>
                    <ul className="flex flex-col gap-3 w-full">
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Incluye mantenimiento y cambio de precios mensual.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Carrito de compras y cálculo automático del total.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Recepción de pedidos estructurados, listos para cobrar.</span></li>
                    </ul>
                  </button>
                </div>
              </div>
            )}

            {/* --- FLUJOS T2 --- */}
            {currentStep.id === 'T2_DYNAMIC' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-3xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Estructura</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">¿Cuál es la dinámica principal de tu negocio?</h2>
                
                <div className="flex flex-col gap-5 mt-4 text-left">
                  <button onClick={() => handleInputChange('t2Dynamic', 'productos')} className={`w-full text-left p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-300 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 ${data.t2Dynamic === 'productos' ? 'border-blue-500 bg-blue-50/30 shadow-xl md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'}`}>
                    <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center mt-1 ${data.t2Dynamic === 'productos' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>{data.t2Dynamic === 'productos' && <div className="w-3 h-3 bg-white rounded-full" />}</div>
                    <div>
                      <strong className="block text-2xl font-black text-slate-800 mb-2">Catálogo de Productos</strong>
                      <span className="text-base md:text-lg text-slate-500 leading-relaxed">Ideal para Showrooms, Deco, Indumentaria. Quiero que los clientes naveguen productos y me consulten/compren.</span>
                    </div>
                  </button>
                  <button onClick={() => handleInputChange('t2Dynamic', 'servicios')} className={`w-full text-left p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-300 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 ${data.t2Dynamic === 'servicios' ? 'border-blue-500 bg-blue-50/30 shadow-xl md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'}`}>
                    <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center mt-1 ${data.t2Dynamic === 'servicios' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>{data.t2Dynamic === 'servicios' && <div className="w-3 h-3 bg-white rounded-full" />}</div>
                    <div>
                      <strong className="block text-2xl font-black text-slate-800 mb-2">Servicios y Turnos</strong>
                      <span className="text-base md:text-lg text-slate-500 leading-relaxed">Ideal para Barberías, Salones, Consultorios. Quiero que vean mi portfolio y agenden un turno.</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* --- UPSELL T2 PRODUCTOS (AGENCY LEVEL UI) --- */}
            {currentStep.id === 'T2_UPSELL_PROD' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-emerald-600 uppercase mb-0">Mejora tu Web</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-3"><ShoppingCart className="text-emerald-500 w-10 h-10"/> Elegí el modo de tu catálogo</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-left">
                  <button onClick={() => handleInputChange('t2ProductMode', 'consulta')} className={`relative w-full text-left p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-500 flex flex-col group ${data.t2ProductMode === 'consulta' ? 'border-blue-500 bg-blue-50/50 shadow-xl md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg'}`}>
                    <div className="flex justify-between items-start w-full mb-4">
                      <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.t2ProductMode === 'consulta' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                        {data.t2ProductMode === 'consulta' && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                      <span className="text-slate-400 font-bold tracking-widest text-xs uppercase bg-slate-100 px-3 py-1 rounded-full">Incluido</span>
                    </div>
                    <strong className="block text-2xl md:text-3xl font-black text-slate-800 mb-4">Vitrina de Exhibición</strong>
                    <ul className="flex flex-col gap-3 w-full">
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Galería de alta calidad sin precios visibles.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Contacto directo manual por WhatsApp.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">100% autogestionado en la atención.</span></li>
                    </ul>
                  </button>
                  
                  <button onClick={() => handleInputChange('t2ProductMode', 'vitrina')} className={`relative w-full text-left p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-500 flex flex-col group ${data.t2ProductMode === 'vitrina' ? 'border-emerald-500 bg-gradient-to-br from-emerald-50/50 to-white shadow-2xl shadow-emerald-500/20 md:-translate-y-2' : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xl'}`}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg flex items-center gap-2 w-max">
                      <Zap size={14} className="fill-white"/> MÁXIMA CONVERSIÓN
                    </div>
                    <div className="flex justify-between items-start w-full mb-4 mt-2">
                      <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.t2ProductMode === 'vitrina' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                        {data.t2ProductMode === 'vitrina' && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-emerald-700 font-black text-xl md:text-2xl leading-none">$30.000</span>
                        <span className="text-emerald-600/70 font-medium text-xs">/mensuales</span>
                      </div>
                    </div>
                    <strong className="block text-2xl md:text-3xl font-black text-slate-800 mb-4">Catálogo Interactivo</strong>
                    <ul className="flex flex-col gap-3 w-full">
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Precios visibles y actualizados mes a mes.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Filtra curiosos, atrayendo mayor intención de compra.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Da imagen de marca transparente y premium.</span></li>
                    </ul>
                  </button>
                </div>
              </div>
            )}

            {currentStep.id === 'T2_AGENDA' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-3xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">¿Cómo recibís los turnos?</h2>
                <div className="flex flex-col gap-5 mt-4 text-left">
                  <button onClick={() => handleInputChange('t2AgendaMode', 'whatsapp')} className={`w-full text-left p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-300 flex flex-row items-start gap-4 md:gap-6 ${data.t2AgendaMode === 'whatsapp' ? 'border-blue-500 bg-blue-50/30 shadow-xl md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'}`}>
                    <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center mt-1 ${data.t2AgendaMode === 'whatsapp' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>{data.t2AgendaMode === 'whatsapp' && <div className="w-3 h-3 bg-white rounded-full" />}</div>
                    <strong className="block text-2xl font-black text-slate-800">Directo a mi WhatsApp (Incluido)</strong>
                  </button>
                  <div className={`w-full text-left p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-300 flex flex-col ${data.t2AgendaMode === 'link' ? 'border-blue-500 bg-blue-50/30 shadow-xl md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'}`}>
                    <button onClick={() => handleInputChange('t2AgendaMode', 'link')} className="flex flex-row items-start gap-4 md:gap-6 w-full text-left focus:outline-none">
                      <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center mt-1 ${data.t2AgendaMode === 'link' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>{data.t2AgendaMode === 'link' && <div className="w-3 h-3 bg-white rounded-full" />}</div>
                      <strong className="block text-2xl font-black text-slate-800">Ya uso Calendly / Booksy / etc.</strong>
                    </button>
                    {data.t2AgendaMode === 'link' && (
                      <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="w-full mt-4 pl-[3.5rem] md:pl-[4.5rem]">
                        <input type="text" value={data.t2AgendaLink} onChange={e=>handleInputChange('t2AgendaLink', e.target.value)} placeholder="Pegá el link de tu agenda acá..." className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 text-xl outline-none focus:border-blue-500 shadow-sm" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- UPSELL T2 SERVICIOS --- */}
            {currentStep.id === 'T2_UPSELL_SERV' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-emerald-600 uppercase mb-0">Mejora tu Web</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-3">¿Querés mostrar una lista de precios?</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-left">
                  <button onClick={() => handleInputChange('t2ServicePricing', 'sin_precios')} className={`relative w-full text-left p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-500 flex flex-col group ${data.t2ServicePricing === 'sin_precios' ? 'border-blue-500 bg-blue-50/50 shadow-xl md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg'}`}>
                    <div className="flex justify-between items-start w-full mb-4">
                      <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.t2ServicePricing === 'sin_precios' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                        {data.t2ServicePricing === 'sin_precios' && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                      <span className="text-slate-400 font-bold tracking-widest text-xs uppercase bg-slate-100 px-3 py-1 rounded-full">Incluido</span>
                    </div>
                    <strong className="block text-2xl md:text-3xl font-black text-slate-800 mb-4">Portfolio sin Precios</strong>
                    <ul className="flex flex-col gap-3 w-full">
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Visualización de tus trabajos sin precios fijos.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Llamado a la acción directo para agendar.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Ideal si tus precios varían según el cliente.</span></li>
                    </ul>
                  </button>
                  
                  <button onClick={() => handleInputChange('t2ServicePricing', 'con_precios')} className={`relative w-full text-left p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-500 flex flex-col group ${data.t2ServicePricing === 'con_precios' ? 'border-emerald-500 bg-gradient-to-br from-emerald-50/50 to-white shadow-2xl shadow-emerald-500/20 md:-translate-y-2' : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xl'}`}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg flex items-center gap-2 w-max">
                      <Star size={14} className="fill-white"/> TARIFARIO PREMIUM
                    </div>
                    <div className="flex justify-between items-start w-full mb-4 mt-2">
                      <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.t2ServicePricing === 'con_precios' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                        {data.t2ServicePricing === 'con_precios' && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-emerald-700 font-black text-xl md:text-2xl leading-none">$30.000</span>
                        <span className="text-emerald-600/70 font-medium text-xs">/mensuales</span>
                      </div>
                    </div>
                    <strong className="block text-2xl md:text-3xl font-black text-slate-800 mb-4">Servicios con Precios</strong>
                    <ul className="flex flex-col gap-3 w-full">
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Precios totalmente transparentes y actualizados.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Reduce el tiempo perdido en consultas repetitivas de valor.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Perfil profesional elevado tipo franquicia.</span></li>
                    </ul>
                  </button>
                </div>
              </div>
            )}

            {currentStep.id === 'CATEGORIES_DEF' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-3xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-1">Estructura</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">Armemos tu {data.templateSelected === 'T1' ? 'menú' : data.t2Dynamic === 'servicios' ? 'catálogo de trabajos' : 'catálogo'}</h2>
                <p className="text-lg md:text-2xl text-slate-500 mb-2">Agrupá tus productos/servicios en categorías para que los clientes los encuentren más fácil y naveguen cómodos.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2 text-left md:text-center">
                  <p className="text-slate-600 text-sm md:text-base"><span className="font-bold text-blue-600">Requisito:</span> Tenés que cargar un <strong>mínimo de 3 categorías</strong> y podés tener hasta un <strong>máximo de 5</strong>. Completá todas las cajas visibles para poder avanzar.</p>
                </div>
                <div className="flex flex-col gap-4 text-left">
                  {data.categories.map((cat, i) => (
                    <div key={i} className="flex gap-4 items-center group">
                      <div className="w-12 h-16 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm shrink-0">{i+1}</div>
                      <input value={cat.name} onChange={(e) => updateCategoryName(i, e.target.value)} placeholder={data.templateSelected === 'T1' ? `Ej: ${i === 0 ? 'Hamburguesas' : 'Bebidas Sin Alcohol'}` : data.t2Dynamic === 'servicios' ? `Ej: ${i === 0 ? 'Cortes Fade' : 'Barbería Tradicional'}` : `Ej: ${i === 0 ? 'Sillones y Sofás' : 'Mesas de Comedor'}`} className="w-full text-xl md:text-2xl bg-white border-2 border-slate-200 rounded-2xl focus:border-blue-500 outline-none p-5 transition-all shadow-sm" autoFocus={i === data.categories.length - 1} />
                      {i > 2 && <button onClick={() => removeCategory(i)} className="p-4 md:p-5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors shrink-0"><Trash2 size={28} /></button>}
                    </div>
                  ))}
                  {data.categories.length < 5 && (
                    <button onClick={addCategory} className="flex items-center justify-center gap-3 p-6 mt-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-2xl hover:bg-blue-50 font-bold transition-colors text-lg md:text-xl">
                      <Plus size={28} /> Añadir otra categoría
                    </button>
                  )}
                  {data.templateSelected === 'T1' && (
                    <div className="mt-4 p-5 bg-slate-100 border border-slate-200 rounded-2xl text-left">
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input type="checkbox" checked={data.t1BulkUploadMode} onChange={(e)=>handleInputChange('t1BulkUploadMode', e.target.checked)} className="w-6 h-6 mt-1 rounded text-blue-600 focus:ring-blue-500 shrink-0"/>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-lg md:text-xl">Prefiero subir mis productos en un archivo Excel/PDF</span>
                          <span className="text-slate-500 text-sm md:text-base">Marcá esta opción si ya tenés un menú armado y no querés cargar las fotos una por una en la siguiente pantalla.</span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep.id === 'T1_BULK_UPLOAD' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Carga Masiva</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-2">Subida de Archivos</h2>
                <p className="text-lg md:text-xl text-slate-600 mb-4">Subí un PDF, Excel o Word con tus productos (Máximo 6 categorías, 6 productos c/u). <br/>{data.t1MenuMode === 'abierto' && <strong className="text-blue-600">Al elegir el Modo Abierto, no hace falta que tenga precios.</strong>}</p>
                
                <label className="cursor-pointer flex flex-col items-center justify-center bg-white hover:bg-blue-50 border-4 border-dashed border-blue-200 rounded-[2rem] p-10 transition-colors w-full shadow-sm">
                  <UploadCloud className="w-16 h-16 text-blue-400 mb-4" />
                  <span className="text-xl md:text-2xl font-black text-slate-700 mb-2">Hacé clic para seleccionar tu archivo</span>
                  <span className="text-base text-slate-500 mb-6">Soporta PDF, Excel (.xlsx), CSV o Word</span>
                  <input type="file" className="hidden" accept=".pdf,.xls,.xlsx,.csv,.doc,.docx" onChange={(e) => {
                     if(e.target.files && e.target.files[0]) {
                         handleInputChange('t1BulkFileUrl', e.target.files[0].name);
                     }
                  }} />
                  <div className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full text-lg shadow-lg hover:bg-blue-700">Explorar archivos</div>
                </label>
                
                {data.t1BulkFileUrl && (
                  <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mt-4 p-5 bg-green-50 border-2 border-green-200 text-green-700 font-bold rounded-2xl flex items-center justify-center gap-3 text-lg md:text-xl shadow-sm">
                    <ShieldCheck size={28}/> Archivo cargado: {data.t1BulkFileUrl}
                  </motion.div>
                )}
              </div>
            )}

            {/* --- NUEVO PASO PARA ELEGIR DESTACADOS CUANDO SE SUBIÓ ARCHIVO EN T1 --- */}
            {currentStep.id === 'T1_BULK_FEATURED' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Exhibición</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-2 flex items-center justify-center gap-3"><Star className="text-yellow-400 fill-yellow-400 w-10 h-10"/> Tus Destacados</h2>
                <p className="text-lg md:text-xl text-slate-600 mb-4">Como subiste tu menú en un archivo, necesitamos que nos escribas los nombres de **los 6 productos principales** que querés mostrar en la galería destacada de la portada.</p>
                
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 text-left">
                  {[0,1,2,3,4,5].map((i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <div className="w-10 h-10 shrink-0 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center font-black">{i+1}</div>
                      <input value={data.t1BulkFeatured[i]} onChange={(e) => updateBulkFeatured(i, e.target.value)} placeholder={`Ej: Hamburguesa Doble Cheddar`} className="w-full text-lg bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-yellow-400 outline-none p-4 transition-all" autoFocus={i===0} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep.id?.startsWith('CAT_UPLOAD_') && (
              <div className="flex flex-col gap-4 md:gap-6 w-full max-w-6xl mx-auto px-2 md:px-0 py-4">
                <div className="flex flex-col text-center">
                  <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-1">Carga de Productos/Servicios</p>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-2">
                    <span className="text-blue-600">{data.categories[currentStep.catIndex!].name}</span>
                  </h2>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 max-w-2xl mx-auto text-left md:text-center">
                  <p className="text-slate-600 text-sm md:text-base">💡 Subí fotos de esta categoría. <strong className="text-blue-600">Es obligatorio subir por lo menos 1 foto</strong> para pasar al siguiente paso. Si no querés subir los 6, dejá las demás cajas vacías y se ocultarán automáticamente.</p>
                </div>
                {/* SOLUCIÓN AL BUG DE GRID STRETCH: Agregamos items-start */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                  {data.categories[currentStep.catIndex!].items.map((item, itemIdx) => (
                    <div key={item.id} className="bg-white border-2 border-slate-100 rounded-[2rem] p-5 md:p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col gap-5 h-fit">
                      {!item.image ? (
                        <ImageUpload userId={data.mercadoLibreUser} label={`Foto ${itemIdx + 1}`} value="" onChange={(url) => updateProduct(currentStep.catIndex!, itemIdx, 'image', url)} />
                      ) : (
                        <>
                          <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-50 group flex items-center justify-center p-2 border border-slate-100">
                            <img src={item.image} alt="Preview" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <button onClick={() => updateProduct(currentStep.catIndex!, itemIdx, 'image', '')} className="bg-white text-red-500 p-4 rounded-full hover:scale-110 shadow-xl transition-transform"><Trash2 size={24}/></button>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <input placeholder="Nombre..." value={item.name} onChange={(e) => updateProduct(currentStep.catIndex!, itemIdx, 'name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none p-4 font-bold text-slate-800 text-lg transition-colors" />
                            <textarea placeholder="Breve descripción (Opcional)..." value={item.description} onChange={(e) => updateProduct(currentStep.catIndex!, itemIdx, 'description', e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none p-4 text-slate-600 transition-colors resize-none h-24 text-sm md:text-base" />
                            
                            {/* CAMPO DE PRECIO SI ELIGIÓ UPSSELL */}
                            {(data.t1MenuMode === 'ecommerce' || data.t2ProductMode === 'vitrina' || data.t2ServicePricing === 'con_precios') && (
                              <div className="flex items-center gap-3 mt-1">
                                <span className="font-black text-slate-400 text-2xl">$</span>
                                <input placeholder="Precio (Ej: 15000)" value={item.price} onChange={(e) => updateProduct(currentStep.catIndex!, itemIdx, 'price', e.target.value)} className="w-full bg-green-50 border-2 border-green-200 focus:border-green-500 rounded-xl p-4 font-black text-green-700 outline-none text-xl transition-colors" />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- SECCIÓN DE LOGÍSTICA PARA TEMPLATE 1 --- */}
            {currentStep.id === 'T1_LOGISTICS' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-3xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Logística y Envíos</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">¿Qué métodos de entrega ofrecés?</h2>
                <p className="text-lg md:text-2xl text-slate-500 mb-2">Definí cómo vas a entregar los pedidos a tus clientes.</p>
                
                <div className="flex flex-col gap-4 mt-2 text-left">
                  <button onClick={() => handleInputChange('t1DeliveryMethod', 'takeaway')} className={`w-full text-left p-6 rounded-[2rem] border-4 transition-all duration-300 flex items-center gap-4 md:gap-6 ${data.t1DeliveryMethod === 'takeaway' ? 'border-blue-500 bg-blue-50/30 shadow-xl md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg'}`}>
                    <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.t1DeliveryMethod === 'takeaway' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                      {data.t1DeliveryMethod === 'takeaway' && <div className="w-3 h-3 bg-white rounded-full" />}
                    </div>
                    <strong className="block text-xl md:text-2xl font-black text-slate-800">Solo Retiro en Local (Takeaway)</strong>
                  </button>
                  
                  <button onClick={() => handleInputChange('t1DeliveryMethod', 'delivery')} className={`w-full text-left p-6 rounded-[2rem] border-4 transition-all duration-300 flex items-center gap-4 md:gap-6 ${data.t1DeliveryMethod === 'delivery' ? 'border-blue-500 bg-blue-50/30 shadow-xl md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg'}`}>
                    <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.t1DeliveryMethod === 'delivery' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                      {data.t1DeliveryMethod === 'delivery' && <div className="w-3 h-3 bg-white rounded-full" />}
                    </div>
                    <strong className="block text-xl md:text-2xl font-black text-slate-800">Solo Envío a Domicilio (Delivery)</strong>
                  </button>

                  <button onClick={() => handleInputChange('t1DeliveryMethod', 'ambos')} className={`w-full text-left p-6 rounded-[2rem] border-4 transition-all duration-300 flex items-center gap-4 md:gap-6 ${data.t1DeliveryMethod === 'ambos' ? 'border-blue-500 bg-blue-50/30 shadow-xl md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg'}`}>
                    <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.t1DeliveryMethod === 'ambos' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                      {data.t1DeliveryMethod === 'ambos' && <div className="w-3 h-3 bg-white rounded-full" />}
                    </div>
                    <strong className="block text-xl md:text-2xl font-black text-slate-800">Ambas opciones (Retiro y Delivery)</strong>
                  </button>
                </div>

                {/* SI TIENE DELIVERY, PREGUNTAMOS LAS ZONAS */}
                {(data.t1DeliveryMethod === 'delivery' || data.t1DeliveryMethod === 'ambos') && (
                  <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mt-4 text-left">
                    <div className="flex items-start gap-4 bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-4 shadow-sm">
                      <Info className="text-blue-500 shrink-0 mt-0.5" size={24} />
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-blue-900 text-base md:text-lg">Zonas de Envío</p>
                        <p className="text-blue-800 text-sm md:text-base leading-relaxed">Para garantizar que el sistema valide correctamente las direcciones de tus clientes, escribí los barrios o localidades exactas a las que llega tu delivery, <strong>ESTRICTAMENTE SEPARADAS POR COMA</strong> (Ejemplo: Ramos Mejía, San Justo, Villa Luzuriaga). Solo los clientes que seleccionen estas zonas podrán hacer un pedido con envío.</p>
                      </div>
                    </div>
                    <textarea 
                      value={data.t1DeliveryZones} 
                      onChange={e => handleInputChange('t1DeliveryZones', e.target.value)} 
                      placeholder="Ej: Palermo, Recoleta, Belgrano, Colegiales" 
                      className="w-full text-lg md:text-xl bg-white border-2 border-slate-200 rounded-[2rem] focus:border-blue-500 outline-none p-6 resize-none h-32 transition-all shadow-sm" 
                    />
                  </motion.div>
                )}
              </div>
            )}

            {currentStep.id === 'SERVICES_DEF' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-6xl mx-auto w-full px-2 md:px-0 py-4">
                <div className="flex flex-col text-center">
                  <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-1">Tus Soluciones</p>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 text-center mb-2">Detallá tus servicios</h2>
                  <p className="text-lg md:text-2xl text-slate-500 mb-2 max-w-2xl mx-auto">Explicá brevemente en qué consiste cada uno de tus servicios para que el cliente sepa qué está contratando.</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 max-w-2xl mx-auto text-left md:text-center">
                    <p className="text-slate-600 text-sm md:text-base">⚠️ <strong className="text-blue-600 font-bold">Por el diseño de la plantilla que compraste, es obligatorio rellenar los 6 servicios para poder continuar.</strong></p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-4 md:p-6">
                  {data.services.map((svc, i) => (
                    <div key={svc.id} className="bg-slate-50 p-5 md:p-6 rounded-3xl border-2 border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all flex flex-col gap-4">
                      <div className="flex items-center gap-4"><div className="w-12 h-12 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xl">{i+1}</div><input value={svc.title} onChange={e=>updateService(i,'title',e.target.value)} placeholder="Título del servicio..." className="w-full text-2xl font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-blue-200" /></div>
                      <textarea value={svc.description} onChange={e=>updateService(i,'description',e.target.value)} placeholder="Breve descripción de lo que incluye..." className="w-full text-lg text-slate-600 bg-white rounded-2xl p-4 outline-none resize-none h-28 border border-slate-200 focus:border-blue-300" />
                      <input value={svc.iconHint} onChange={e=>updateService(i,'iconHint',e.target.value)} placeholder="Idea para el ícono (Opcional - Ej: 'Una llave inglesa')" className="w-full text-sm md:text-base font-medium text-blue-500 bg-transparent outline-none border-b border-dashed border-blue-200 pb-1 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'FEATURED' && (
              <div className="flex flex-col gap-4 md:gap-6 w-full max-w-5xl mx-auto px-2 md:px-0 py-4">
                <div className="text-center">
                  <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Exhibición</p>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-3"><Star className="text-yellow-400 fill-yellow-400 w-10 h-10"/> Tus Destacados</h2>
                  <p className="text-lg md:text-2xl text-slate-500 mt-2 md:mt-4">Hacé clic en tus mejores productos para destacarlos bien arriba en la página.</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-4 max-w-md mx-auto text-left md:text-center">
                    <p className="text-slate-600 text-sm md:text-base">⚠️ Tenés que elegir <strong className="text-blue-600">al menos 1 producto destacado</strong> para continuar (Podés marcar hasta 6 haciendo clic en las fotos).</p>
                  </div>
                  <div className="inline-block mt-4 px-6 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-bold text-lg md:text-xl">Seleccionados: {data.featuredIds.length} / 6</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-2">
                  {data.categories.flatMap(c => c.items).filter(i => i.image).map(item => {
                    const isSelected = data.featuredIds.includes(item.id);
                    const isDisabled = !isSelected && data.featuredIds.length >= 6;
                    return (
                      <button key={item.id} onClick={() => toggleFeatured(item.id)} disabled={isDisabled} className={`relative rounded-3xl overflow-hidden border-4 flex flex-col bg-white text-left transition-all h-56 md:h-64 ${isSelected ? 'border-yellow-400 shadow-xl shadow-yellow-400/20 scale-[1.03]' : isDisabled ? 'border-slate-100 opacity-40 grayscale' : 'border-slate-100 hover:border-blue-300 hover:shadow-lg'}`}>
                        <div className="flex-1 w-full p-4 flex items-center justify-center overflow-hidden bg-slate-50/50"><img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-sm" /></div>
                        <div className="p-4 bg-white border-t border-slate-100 font-bold text-slate-800 text-center line-clamp-1 w-full text-sm md:text-base">{item.name || 'Sin nombre'}</div>
                        {isSelected && <div className="absolute top-3 right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-md"><Star size={16} className="fill-white"/></div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {currentStep.id === 'T1_STATS' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Prueba Social</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-4"><BarChart3 className="text-blue-500 w-10 h-10"/> Números de Éxito</h2>
                <p className="text-lg md:text-2xl text-slate-500 mb-0 max-w-2xl mx-auto">Los números venden. Cargá 4 estadísticas cortas que le den seguridad inmediata a los clientes al entrar a tu web.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2 max-w-2xl mx-auto text-left md:text-center">
                  <p className="text-slate-600 text-sm md:text-base">💡 <strong className="text-blue-600">Debes completar las 4 cajas.</strong> Ejemplos: "Años en el rubro", "Pedidos entregados", "Clientes felices" o "Estrellas de valoración".</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className="flex gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 focus-within:border-blue-500 transition-colors shadow-sm">
                      <input value={data.stats[i].value} onChange={e=>updateStat(i,'value',e.target.value)} placeholder={['Ej: 10K+', 'Ej: 5', 'Ej: 50+', 'Ej: 99%'][i]} className="w-2/5 text-2xl md:text-4xl font-black text-slate-800 bg-transparent outline-none text-center border-r-2 border-slate-100 placeholder:font-normal placeholder:text-slate-300" />
                      <input value={data.stats[i].label} onChange={e=>updateStat(i,'label',e.target.value)} placeholder={['Pedidos entregados', 'Años de experiencia', 'Opciones en menú', 'Clientes satisfechos'][i]} className="w-3/5 text-base md:text-xl font-medium text-slate-500 bg-transparent outline-none pl-3" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'T1_EVENTS' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-3xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Servicios Extra</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-4"><CalendarHeart className="text-blue-500 w-10 h-10"/> ¿Ofrecen algún servicio especial?</h2>
                <p className="text-lg md:text-2xl text-slate-500 mb-0">Podemos armar una sección especial en la web si además del día a día hacen eventos.</p>
                <div className="flex gap-4 md:gap-6 mt-4">
                  <button onClick={()=>handleInputChange('offersEvents', true)} className={`flex-1 p-6 md:p-8 rounded-3xl border-4 font-bold text-xl md:text-2xl transition-all ${data.offersEvents === true ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' : 'border-slate-200 bg-white hover:border-blue-300'}`}>Sí, ofrecemos</button>
                  <button onClick={()=>handleInputChange('offersEvents', false)} className={`flex-1 p-6 md:p-8 rounded-3xl border-4 font-bold text-xl md:text-2xl transition-all ${data.offersEvents === false ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>No por ahora</button>
                </div>
                {data.offersEvents === true && (
                  <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mt-6 text-left bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col gap-4 md:gap-5">
                    <input type="text" value={data.eventTitle} onChange={e=>handleInputChange('eventTitle', e.target.value)} placeholder="Título. Ej: Servicio de Catering Integral" className="w-full text-xl md:text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none p-4 md:p-5 transition-all" />
                    <textarea value={data.eventDescription} onChange={(e) => handleInputChange('eventDescription', e.target.value)} placeholder="Contanos brevemente de qué trata..." className="w-full text-lg md:text-xl text-slate-600 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none p-5 md:p-6 min-h-[140px] resize-none transition-all" />
                  </motion.div>
                )}
              </div>
            )}

            {currentStep.id === 'T2_STORY' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-3xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-amber-500 uppercase mb-0">Acerca de la marca</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">Nuestra Inspiración</h2>
                <div className="flex items-start gap-4 bg-amber-50 p-4 md:p-5 rounded-2xl text-left border border-amber-100 mt-2 text-sm md:text-base">
                  <Info className="text-amber-600 shrink-0 mt-0.5" size={24} />
                  <p className="text-amber-800 leading-relaxed">A los clientes que compran muebles premium les encanta conectar con la historia detrás del taller. Contanos de ustedes, hace cuánto están, qué los motiva.</p>
                </div>
                <div className="flex flex-col gap-6 md:gap-8 text-left mt-2">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <textarea value={data.t2StoryText} onChange={(e) => handleInputChange('t2StoryText', e.target.value)} placeholder="Ej: Somos un taller familiar. Arrancamos restaurando muebles para amigos..." className="w-full text-lg md:text-xl text-slate-600 bg-slate-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-2xl outline-none p-5 md:p-6 min-h-[160px] md:min-h-[200px] resize-none transition-all" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-lg md:text-xl mb-4 block px-2">Compartinos una foto del equipo o del taller (Horizontal)</label>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"><ImageUpload userId={data.mercadoLibreUser} value={data.t2StoryImage} onChange={(url) => handleInputChange('t2StoryImage', url)} /></div>
                  </div>
                </div>
              </div>
            )}

            {currentStep.id === 'T2_MATERIALS' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-amber-500 uppercase mb-0">Valor Agregado</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-2">Detalles y Calidad</h2>
                <p className="text-lg md:text-2xl text-slate-500 mb-0 max-w-2xl mx-auto">Contanos sobre la calidad de tus materiales o qué buscás transmitir en cada mueble.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2 max-w-2xl mx-auto text-left md:text-center">
                  <p className="text-slate-600 text-sm md:text-base">💡 Escribí el texto y subí <strong className="text-blue-600">al menos 1 foto</strong> de texturas, telas, maderas o muebles terminados para poder avanzar (podés subir hasta 6 para armar una buena galería).</p>
                </div>
                <div className="flex flex-col gap-6 mt-2">
                  <textarea value={data.t2MaterialsText} onChange={(e) => handleInputChange('t2MaterialsText', e.target.value)} placeholder="Ej: Trabajamos solo con materiales nobles. Desde madera maciza de petiribí hasta tapizados antimanchas..." className="w-full text-lg md:text-xl bg-white border-2 border-slate-200 focus:border-amber-400 rounded-3xl outline-none p-6 md:p-8 min-h-[160px] resize-none transition-all shadow-sm text-center shrink-0" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm shrink-0">
                    {[0,1,2,3,4,5].map(i => (
                      <div key={i} className="h-32 md:h-48 rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-amber-400 transition-colors relative">
                          <ImageUpload userId={data.mercadoLibreUser} label="" value={data.t2MaterialsImages[i] || ''} onChange={url=>updateT2MaterialImage(i,url)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep.id === 'T2_STRENGTHS' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-3xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-amber-500 uppercase mb-0">Exhibición</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-3"><Award className="text-amber-500 w-10 h-10"/> Puntos Fuertes</h2>
                <p className="text-lg md:text-2xl text-slate-500 mb-4">Nombrá 3 cosas puntuales por las que te destacás. Las pondremos como garantías visuales en tu web justo antes de mostrar tu catálogo.</p>
                <div className="flex flex-col gap-4 text-left">
                  {[0,1,2].map((i) => (
                    <input key={i} value={data.t2Strengths[i]} onChange={e=>updateT2Strength(i, e.target.value)} placeholder={['Punto fuerte 1', 'Punto fuerte 2', 'Punto fuerte 3'][i]} className="w-full text-xl md:text-2xl bg-white border-2 border-slate-200 rounded-[2rem] focus:border-amber-500 outline-none p-6 transition-all shadow-sm" />
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'STRENGTHS' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-3xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-0">Confianza</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-4"><HeartHandshake className="text-blue-500 w-10 h-10"/> ¿Por qué deberían elegirte?</h2>
                <div className="flex items-start gap-4 bg-blue-50 p-5 rounded-2xl text-left border border-blue-100 mt-2 mb-2 text-sm md:text-base">
                  <Info className="text-blue-500 shrink-0 mt-0.5" size={24} />
                  <p className="text-blue-800 leading-relaxed">En el rubro de los servicios, la confianza lo es todo. Tiranos un par de ideas sueltas (Ej: "Tengo matrícula al día", "Voy rápido si es urgencia", "Doy 6 meses de garantía"). Nuestro equipo lo redactará como un checklist profesional súper convincente.</p>
                </div>
                <textarea value={data.strengths} onChange={(e) => handleInputChange('strengths', e.target.value)} placeholder="Escribí tus puntos fuertes acá. Es obligatorio para avanzar..." className="w-full text-xl md:text-2xl text-slate-600 bg-white border-2 border-slate-200 rounded-[2rem] focus:border-blue-500 outline-none p-6 md:p-8 transition-all min-h-[200px] resize-none shadow-sm text-center" />
              </div>
            )}

            {currentStep.id === 'REVIEWS_NEW' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-5xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <div className="flex flex-col text-center">
                  <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-1">Prueba Social</p>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-2 md:mb-4">Las opiniones reales venden.</h2>
                  <p className="text-lg md:text-2xl text-slate-500 mb-4">Los clientes nuevos confían en los clientes viejos. Mostrales que hacés un buen trabajo.</p>
                </div>
                
                <label className="flex items-center justify-center gap-4 p-6 bg-blue-50 border-2 border-blue-200 rounded-3xl cursor-pointer hover:border-blue-400 transition-colors shadow-sm max-w-2xl mx-auto w-full mb-4">
                  <input type="checkbox" checked={data.useGoogleMapsReviews} onChange={(e) => handleInputChange('useGoogleMapsReviews', e.target.checked)} className="w-7 h-7 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-blue-900 font-bold text-xl md:text-2xl leading-tight mb-1">Tengo Google Maps. Sacá las reseñas de ahí.</span>
                    <span className="text-blue-700 text-sm md:text-base">Es la opción más recomendada porque da mucha transparencia.</span>
                  </div>
                </label>

                {data.useGoogleMapsReviews ? (
                  <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="max-w-xl mx-auto w-full">
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                      <label className="font-bold text-slate-700 text-base md:text-lg block text-left mb-3">Pegá el link a tu perfil de Google Maps acá (Obligatorio):</label>
                      <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 focus-within:border-blue-500 rounded-2xl px-4 py-2 transition-all">
                        <LinkIcon className="text-slate-400 w-6 h-6"/>
                        <input type="text" value={data.googleMapsLink} onChange={e=>handleInputChange('googleMapsLink', e.target.value)} placeholder="https://maps.app.goo.gl/..." className="w-full text-lg md:text-xl bg-transparent outline-none p-2" autoFocus />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <p className="col-span-full text-center text-slate-500 text-base md:text-lg">O podés copiar y pegar 3 reseñas manualmente (Debés completar las 3 para avanzar):</p>
                    {[0,1,2].map((i) => (
                      <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col gap-4 relative focus-within:border-blue-400 transition-all">
                        <div className="absolute -top-6 left-8 text-7xl text-blue-200 font-serif leading-none">"</div>
                        <textarea value={data.reviewsList[i].text} onChange={e=>updateReview(i,'text',e.target.value)} placeholder={`"Excelente atención, el pedido llegó rapidísimo..."`} className="w-full text-lg text-slate-600 bg-transparent outline-none resize-none h-32 md:h-40 relative z-10 pt-4" />
                        <div className="border-t border-slate-100 pt-5 mt-auto">
                          <input value={data.reviewsList[i].name} onChange={e=>updateReview(i,'name',e.target.value)} placeholder="Nombre (Ej: María G.)" className="w-full font-black text-xl text-slate-800 bg-transparent outline-none" />
                          <div className="flex gap-1 text-yellow-400 mt-2"><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/><Star size={18} fill="currentColor"/></div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {currentStep.id === 'CONTACT_NEW' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <div className="flex flex-col text-center">
                  <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-1">Información Final</p>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-2">Redes y Contacto</h2>
                  <p className="text-lg md:text-2xl text-slate-500 mb-0">A dónde querés que vayan a parar tus clientes cuando toquen los botones de contacto en tu web.</p>
                </div>
                <div className="flex flex-col gap-6 text-left mt-2">
                  <div className="flex items-center gap-6 bg-white border-2 border-slate-100 rounded-[2rem] p-5 focus-within:border-green-500 transition-all shadow-sm">
                    <div className="p-4 bg-green-50 text-green-500 rounded-2xl shrink-0"><Phone className="w-8 h-8" /></div>
                    <div className="flex flex-col w-full"><span className="text-sm font-bold text-slate-400 uppercase mb-1">WhatsApp Ventas <strong className="text-green-500">(Obligatorio)</strong></span><input type="text" value={data.whatsapp} onChange={(e) => handleInputChange('whatsapp', e.target.value)} placeholder="+54 9 11 0000-0000" className="w-full bg-transparent outline-none py-1 text-xl md:text-2xl font-black text-slate-800" /></div>
                  </div>
                  <div className="flex items-center gap-6 bg-white border-2 border-slate-100 rounded-[2rem] p-5 focus-within:border-pink-500 transition-all shadow-sm">
                    <div className="p-4 bg-pink-50 text-pink-500 rounded-2xl shrink-0"><AtSign className="w-8 h-8" /></div>
                    <div className="flex flex-col w-full"><span className="text-sm font-bold text-slate-400 uppercase mb-1">Instagram o Facebook <strong className="text-slate-400 font-normal normal-case">(Opcional)</strong></span><input type="text" value={data.socialLinks} onChange={(e) => handleInputChange('socialLinks', e.target.value)} placeholder="@tu_marca o link directo" className="w-full bg-transparent outline-none py-1 text-xl md:text-2xl font-black text-slate-800" /></div>
                  </div>
                  
                  <div className="flex items-center gap-6 bg-white border-2 border-slate-100 rounded-[2rem] p-5 focus-within:border-blue-500 transition-all shadow-sm">
                    <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl shrink-0"><MapPin className="w-8 h-8" /></div>
                    <div className="flex flex-col w-full">
                      <span className="text-sm font-bold text-slate-400 uppercase mb-1">Ubicación Física (Si tenés local - Opcional)</span>
                      <p className="text-xs text-slate-500 mb-2 leading-tight">Buscá tu calle y altura o nombre del local. Te generaremos un link de Google Maps automáticamente.</p>
                      <AddressAutocomplete value={data.address} onChange={(url) => handleInputChange('address', url)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- UPSELL DOMINIO (AGENCY LEVEL UI) --- */}
            {currentStep.id === 'DOMAIN_TYPE' && (
              <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <div className="mb-2">
                  <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-1">Despliegue Profesional</p>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-3">Tu identidad en internet</h2>
                  <p className="text-lg md:text-2xl text-slate-500 max-w-3xl mx-auto">Seleccioná cómo querés que te encuentren tus clientes. Un dominio profesional aumenta la confianza y las ventas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-4">
                  
                  <button onClick={() => handleInputChange('domainType', 'COM')} className={`relative w-full flex flex-col p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-500 md:order-1 group ${data.domainType === 'COM' ? 'border-violet-500 bg-gradient-to-br from-violet-50/50 to-white shadow-2xl shadow-violet-500/20 md:-translate-y-2' : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-xl'}`}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg flex items-center gap-2 w-max">
                      <Star size={14} className="fill-white"/> MÁS ELEGIDO
                    </div>
                    
                    <div className="flex justify-between items-start w-full mb-4 mt-2">
                      <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.domainType === 'COM' ? 'border-violet-600 bg-violet-600' : 'border-slate-300'}`}>
                        {data.domainType === 'COM' && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-violet-700 font-black text-xl md:text-2xl leading-none">$30.000</span>
                        <span className="text-violet-600/70 font-medium text-xs">/1er año</span>
                      </div>
                    </div>
                    
                    <strong className="block text-2xl md:text-3xl font-black text-slate-800 mb-4">Dominio .COM</strong>
                    <ul className="flex flex-col gap-3 w-full mt-auto">
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Opción de máxima autoridad global (Ej: www.tunegocio.com).</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Proyecta confianza absoluta a clientes nuevos.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">El estándar de la industria.</span></li>
                    </ul>
                  </button>

                  <button onClick={() => handleInputChange('domainType', 'ONLINE')} className={`relative w-full flex flex-col p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-500 md:order-2 group ${data.domainType === 'ONLINE' ? 'border-blue-500 bg-gradient-to-br from-blue-50/50 to-white shadow-2xl shadow-blue-500/20 md:-translate-y-2' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xl'}`}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg flex items-center gap-2 w-max">
                      <TrendingUp size={14} className="fill-white"/> MEJOR VALOR
                    </div>

                    <div className="flex justify-between items-start w-full mb-4 mt-2">
                      <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.domainType === 'ONLINE' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {data.domainType === 'ONLINE' && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-blue-700 font-black text-xl md:text-2xl leading-none">$20.000</span>
                        <span className="text-blue-600/70 font-medium text-xs">/1er año</span>
                      </div>
                    </div>
                    
                    <strong className="block text-2xl md:text-3xl font-black text-slate-800 mb-4">Dominio .ONLINE</strong>
                    <ul className="flex flex-col gap-3 w-full mt-auto">
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Alternativa moderna y económica (Ej: tunegocio.online).</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Ideal para tiendas virtuales o servicios digitales.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/><span className="text-slate-600 text-sm md:text-base leading-snug">Destaca por precio inteligente.</span></li>
                    </ul>
                  </button>

                  <button onClick={() => handleInputChange('domainType', 'GRATIS')} className={`relative w-full flex flex-col p-6 md:p-8 rounded-[2rem] border-4 transition-all duration-500 md:order-3 group ${data.domainType === 'GRATIS' ? 'border-slate-400 bg-slate-50 shadow-inner' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'}`}>
                    <div className="flex justify-between items-start w-full mb-4 mt-2">
                      <div className={`w-8 h-8 rounded-full border-[3px] flex shrink-0 items-center justify-center transition-colors ${data.domainType === 'GRATIS' ? 'border-slate-500 bg-slate-500' : 'border-slate-300'}`}>
                        {data.domainType === 'GRATIS' && <div className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-slate-500 font-black text-xl md:text-2xl leading-none">Gratis</span>
                      </div>
                    </div>
                    
                    <strong className="block text-2xl md:text-3xl font-bold text-slate-700 mb-4">Subdominio Estándar</strong>
                    <ul className="flex flex-col gap-3 w-full mt-auto">
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5"/><span className="text-slate-500 text-sm md:text-base leading-snug">Alojamiento veloz en Vercel.</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5"/><span className="text-slate-500 text-sm md:text-base leading-snug">Tu marca tendrá un sufijo (Ej: tunegocio.vercel.app).</span></li>
                      <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5"/><span className="text-slate-500 text-sm md:text-base leading-snug">100% funcional y seguro para empezar.</span></li>
                    </ul>
                  </button>

                </div>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <p className="text-sm md:text-base text-slate-600 font-medium">El pago del dominio se realiza de forma 100% segura a través de Mercado Pago al finalizar el formulario.</p>
                </div>
              </div>
            )}

            {currentStep.id === 'DOMAIN_OPTIONS' && (
              <div className="flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto w-full text-center px-2 md:px-0 py-4">
                <div className="flex flex-col text-center">
                  <p className="text-sm md:text-base font-bold tracking-widest text-blue-500 uppercase mb-1">Nombres</p>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">Elegí tu nombre web</h2>
                  <p className="text-lg md:text-2xl text-slate-500 mb-0 max-w-xl mx-auto">Dejanos 3 opciones en orden de prioridad. Nuestro equipo técnico va a chequear cuál está disponible para registrarlo a tu nombre.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2 md:mb-4">
                  <p className="text-slate-600 text-sm md:text-base">💡 Debés completar las 3 opciones para poder avanzar al último paso.</p>
                </div>
                <div className="flex flex-col gap-4 text-left bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  {[0,1,2].map((i) => (
                    <div key={i} className="flex gap-4 items-center group">
                      <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl">{i+1}</div>
                      <input value={data.domainOptionsList[i]} onChange={(e) => updateDomainOption(i, e.target.value)} placeholder={`Ej: ${['mitiendamuebles', 'mueblesmitienda', 'tiendamueblesarg'][i]}`} className="w-full text-xl md:text-2xl bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none p-4 transition-all" autoFocus={i===0} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- PASO DE TÉRMINOS --- */}
            {currentStep.id === 'TERMS' && (
              <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full text-center px-2 py-4">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2"><ShieldCheck size={40}/></div>
                <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900">Acuerdo de Servicio</h2>
                <div className="bg-white p-8 md:p-10 rounded-[2rem] border-2 border-slate-200 shadow-sm text-left">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input type="checkbox" checked={data.acceptedTerms} onChange={e=>handleInputChange('acceptedTerms', e.target.checked)} className="w-6 h-6 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
                    <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                      Entiendo que el servicio inicial incluye el diseño y puesta online de la web tal como se entrega hoy. Para garantizar la seguridad del código, la web no posee panel autogestionable. Si en el futuro deseo modificar textos, el logo o cambiar fotografías de la galería, podré solicitar un Ticket de Actualización a soporte por un costo de <strong>$15.000 ARS.</strong>
                    </p>
                  </label>
                </div>
              </div>
            )}

            {currentStep.id === 'END' && (
              <div className="text-center flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4 py-12">
                {isSubmitting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><Loader2 className="text-blue-500 mb-8 w-20 h-20" /></motion.div>
                ) : (
                  <Sparkles className="text-blue-500 mb-8 animate-pulse w-20 h-20" />
                )}
                
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">¡Todo listo! 🎉</h2>
                
                <div className="w-full bg-white border-2 border-slate-200 rounded-[2rem] p-8 mb-10 text-left shadow-sm">
                  <h3 className="font-bold text-xl text-slate-800 border-b border-slate-100 pb-4 mb-5">Resumen de tu proyecto:</h3>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg text-slate-600">Diseño Web ({data.templateSelected})</span>
                    <span className="text-lg font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">¡Bonificado!</span>
                  </div>
                  
                  {data.domainType === 'COM' && <div className="flex justify-between items-center mb-4"><span className="text-lg text-slate-600">Registro Dominio .COM</span><span className="text-lg font-bold text-slate-800">$30.000</span></div>}
                  {data.domainType === 'ONLINE' && <div className="flex justify-between items-center mb-4"><span className="text-lg text-slate-600">Registro Dominio .ONLINE</span><span className="text-lg font-bold text-slate-800">$20.000</span></div>}
                  {data.domainType === 'GRATIS' && <div className="flex justify-between items-center mb-4"><span className="text-lg text-slate-600">Subdominio Gratuito</span><span className="text-lg font-bold text-slate-800">$0</span></div>}
                  
                  {data.templateSelected === 'T1' && data.t1MenuMode === 'ecommerce' && <div className="flex justify-between items-center mb-4"><span className="text-lg text-slate-600">Módulo E-commerce Lite</span><span className="text-lg font-bold text-slate-800">$30.000</span></div>}
                  {data.templateSelected === 'T2' && data.t2Dynamic === 'productos' && data.t2ProductMode === 'vitrina' && <div className="flex justify-between items-center mb-4"><span className="text-lg text-slate-600">Módulo Vitrina con Precios</span><span className="text-lg font-bold text-slate-800">$30.000</span></div>}
                  {data.templateSelected === 'T2' && data.t2Dynamic === 'servicios' && data.t2ServicePricing === 'con_precios' && <div className="flex justify-between items-center mb-4"><span className="text-lg text-slate-600">Módulo Servicios + Precios</span><span className="text-lg font-bold text-slate-800">$30.000</span></div>}
                  
                  <div className="border-t-4 border-slate-100 pt-6 mt-6 flex justify-between items-center">
                    <span className="font-black text-2xl text-slate-900">TOTAL</span>
                    <span className="font-black text-4xl text-blue-600">${calculateTotal().toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={isSubmitting} className="w-full md:w-auto px-10 py-6 bg-blue-600 text-white rounded-full font-black text-2xl flex items-center justify-center gap-4 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/40 disabled:opacity-50 disabled:hover:scale-100">
                  {isSubmitting ? 'Procesando...' : calculateTotal() > 0 ? <><CreditCard className="w-8 h-8" /> Abonar y Enviar a Producción</> : 'Enviar a Producción'}
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* CARRITO FLOTANTE Y CON RESET (Inteligente por rutas) */}
      {calculateTotal() > 0 && currentStep.id !== 'END' && currentStep.id !== 'WELCOME' && (
        <>
          {/* BOTÓN FLOTANTE MOBILE (Pelotita) */}
          <button 
            onClick={() => setIsCartOpen(!isCartOpen)} 
            className="md:hidden fixed bottom-24 right-4 z-[60] w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isCartOpen ? <X size={24} /> : <ShoppingCart size={24} />}
            {/* Pequeño punto rojo indicador */}
            {!isCartOpen && <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full" />}
          </button>

          {/* PANEL DEL CARRITO (Visible en Desktop siempre, Toggle en Mobile) */}
          <motion.div 
            initial={false}
            animate={{ 
              opacity: isCartOpen ? 1 : 0, 
              y: isCartOpen ? 0 : 20,
              pointerEvents: isCartOpen ? 'auto' : 'none'
            }}
            className="fixed bottom-40 right-4 w-[calc(100%-2rem)] bg-white border-2 border-slate-200 shadow-2xl rounded-3xl z-[60] overflow-hidden md:!opacity-100 md:!y-0 md:!pointer-events-auto md:w-80 md:right-8 md:bottom-32"
          >
             <div className="bg-slate-900 text-white p-4 font-black flex items-center justify-between gap-2">
               <div className="flex items-center gap-2"><ShoppingCart size={20}/> Tu Proyecto</div>
             </div>
             <div className="p-5 flex flex-col gap-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Plantilla ({data.templateSelected})</span><span className="text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded">¡Pagado!</span></div>
                
                {data.domainType === 'COM' && <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Dominio .COM</span><span className="font-bold text-slate-800">$30.000</span></div>}
                {data.domainType === 'ONLINE' && <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Dominio .ONLINE</span><span className="font-bold text-slate-800">$20.000</span></div>}
                
                {data.templateSelected === 'T1' && data.t1MenuMode === 'ecommerce' && <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Modo E-commerce</span><span className="font-bold text-slate-800">$30.000</span></div>}
                {data.templateSelected === 'T2' && data.t2Dynamic === 'productos' && data.t2ProductMode === 'vitrina' && <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Modo Vitrina</span><span className="font-bold text-slate-800">$30.000</span></div>}
                {data.templateSelected === 'T2' && data.t2Dynamic === 'servicios' && data.t2ServicePricing === 'con_precios' && <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Lista de Precios</span><span className="font-bold text-slate-800">$30.000</span></div>}
                
                <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-center">
                  <span className="font-black text-slate-900 text-base">Total</span>
                  <span className="font-black text-blue-600 text-xl">${calculateTotal().toLocaleString('es-AR')}</span>
                </div>
                
                {/* BOTÓN PARA LIMPIAR EXTRAS */}
                <button onClick={() => {clearCartSelections(); setIsCartOpen(false);}} className="w-full mt-2 py-2.5 text-sm text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-red-100">
                  <Trash2 size={16} /> Limpiar extras de pago
                </button>
             </div>
          </motion.div>
        </>
      )}

      {currentStep.id !== 'WELCOME' && currentStep.id !== 'END' && (
        <div className="fixed bottom-0 left-0 w-full px-4 py-4 md:py-6 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-[50]">
          <div className="max-w-4xl mx-auto flex justify-between">
            <button onClick={prevStep} className="p-4 md:p-5 rounded-full bg-white shadow-md border border-slate-100 hover:bg-slate-50 transition-colors"><ArrowLeft className="w-6 h-6 md:w-8 md:h-8 text-slate-600"/></button>
            <button onClick={nextStep} disabled={isNextDisabled()} className={`px-8 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg md:text-xl flex items-center gap-3 ${isNextDisabled() ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:scale-105 shadow-xl shadow-blue-600/30 transition-all'}`}>
              {isNextDisabled() ? 'Falta info' : 'Siguiente'} <ArrowRight className="w-5 h-5 md:w-6 md:h-6"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}