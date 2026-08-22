import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, PartyPopper, Sparkles, LayoutTemplate, Image as ImageIcon, MapPin, Phone, AtSign, Monitor, Smartphone, Plus, Trash2, Star, Type, BarChart3, CalendarHeart, Award, HeartHandshake, BoxSelect, CreditCard, Link as LinkIcon, Info, Loader2 } from 'lucide-react';
import type { OnboardingData } from '../types';
import ImageUpload from './ImageUpload';
import AddressAutocomplete from './AddressAutocomplete'; // <-- ACÁ IMPORTAMOS EL BUSCADOR MÁGICO

// --- IMPORTACIONES DE FIREBASE ---
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- TIPOS EXTENDIDOS ---
type ProductItem = { id: string; name: string; description: string; image: string };
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
}

const generateEmptyItems = (): ProductItem[] => Array.from({ length: 6 }, () => ({ id: Math.random().toString(36).substring(7), name: '', description: '', image: '' }));
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
  featuredIds: [], strengths: '', reviews: '', useGoogleMapsReviews: false, googleMapsLink: '', reviewsList: [{name:'', text:''}, {name:'', text:''}, {name:'', text:''}], reviewImages: [], socialLinks: '', whatsapp: '', address: '', domainType: '', domainOptionsList: ['', '', '']
};

const TEMPLATES = [
  { id: 'T1', name: 'Template 1', img: '/assets/Template1.webp' }, { id: 'T2', name: 'Template 2', img: '/assets/Template2.webp' },
  { id: 'T3', name: 'Template 3', img: '/assets/Template3.webp' }, { id: 'T4', name: 'Template 4', img: '/assets/Template4.webp' },
];

export default function Wizard() {
  const [data, setData] = useState<ExtendedData>(initialData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- MOTOR DE RUTAS ---
  const steps = useMemo(() => {
    const s = [{ id: 'WELCOME' }, { id: 'ML_USER' }, { id: 'TEMPLATE' }, { id: 'LOGO' }, { id: 'COLORS' }, { id: 'TYPOGRAPHY' }, { id: 'BACKGROUND' }, { id: 'HERO_TITLE' }, { id: 'HERO_DESKTOP' }];
    if (data.wantsMobileHero) s.push({ id: 'HERO_MOBILE' });

    if (data.templateSelected === 'T1') {
      s.push({ id: 'T1_ABOUT' }, { id: 'CATEGORIES_DEF' });
      data.categories.forEach((cat, idx) => { if (cat.name.trim() !== '') s.push({ id: `CAT_UPLOAD_${idx}`, catIndex: idx }); });
      s.push({ id: 'FEATURED' }, { id: 'T1_STATS' }, { id: 'T1_EVENTS' });
    } else if (data.templateSelected === 'T2') {
      s.push({ id: 'T2_STORY' }, { id: 'T2_MATERIALS' }, { id: 'T2_STRENGTHS' }, { id: 'CATEGORIES_DEF' });
      data.categories.forEach((cat, idx) => { if (cat.name.trim() !== '') s.push({ id: `CAT_UPLOAD_${idx}`, catIndex: idx }); });
    } else if (data.templateSelected === 'T3' || data.templateSelected === 'T4') {
      s.push({ id: 'SERVICES_DEF' }, { id: 'STRENGTHS' });
    }
    s.push({ id: 'REVIEWS_NEW' }, { id: 'CONTACT_NEW' }, { id: 'DOMAIN_TYPE' });
    if (data.domainType !== '') s.push({ id: 'DOMAIN_OPTIONS' });
    s.push({ id: 'END' });
    return s;
  }, [data.templateSelected, data.wantsMobileHero, data.categories, data.offersEvents, data.domainType]);

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

  // --- VALIDACIÓN ESTRICTA ---
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

    // T1
    if (step === 'T1_ABOUT') return data.aboutImage === '' || data.aboutText.trim() === '';
    if (step === 'T1_STATS') return data.stats.some(s => s.label.trim() === '' || s.value.trim() === '');
    if (step === 'T1_EVENTS') {
      if (data.offersEvents === null) return true;
      if (data.offersEvents === true) return data.eventTitle.trim() === '' || data.eventDescription.trim() === '';
      return false;
    }

    // T2
    if (step === 'T2_STORY') return data.t2StoryText.trim() === '' || data.t2StoryImage === '';
    if (step === 'T2_MATERIALS') return data.t2MaterialsText.trim() === '' || !data.t2MaterialsImages.some(img => img !== '');
    if (step === 'T2_STRENGTHS') return data.t2Strengths.some(s => s.trim() === '');

    // Categorías y Productos
    if (step === 'CATEGORIES_DEF') {
      const validCats = data.categories.filter(c => c.name.trim() !== '');
      return validCats.length < 3 || validCats.length > 5;
    }
    if (step?.startsWith('CAT_UPLOAD_')) {
      const catIndex = currentStep.catIndex!;
      return !data.categories[catIndex].items.some(item => item.image !== '');
    }
    if (step === 'FEATURED') return data.featuredIds.length === 0;

    // T3 y T4
    if (step === 'SERVICES_DEF') {
      const validServices = data.services.filter(s => s.title.trim() !== '' && s.description.trim() !== '');
      return validServices.length < 6; // OBLIGATORIO 6 SERVICIOS
    }
    if (step === 'STRENGTHS') return data.strengths.trim() === '';

    // Finales
    if (step === 'REVIEWS_NEW') {
      if (data.useGoogleMapsReviews) return data.googleMapsLink.trim() === '';
      return data.reviewsList.some(r => r.name.trim() === '' || r.text.trim() === '');
    }
    if (step === 'CONTACT_NEW') return data.whatsapp.trim() === '' || data.socialLinks.trim() === ''; 
    if (step === 'DOMAIN_TYPE') return data.domainType === '';
    if (step === 'DOMAIN_OPTIONS') return data.domainOptionsList.some(d => d.trim() === '');

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
          productos: c.items.filter(i => i.image !== '').map(i => ({ nombre: i.name, descripcion: i.description, urlImagen: i.image, destacado: data.featuredIds.includes(i.id) }))
        })),
        servicios: data.services.filter(s => s.title.trim() !== '').map(s => ({ titulo: s.title, descripcion: s.description, iconoSugerido: s.iconHint })),
        ...(data.templateSelected === 'T1' && {
          sobreNosotros: { texto: data.aboutText, imagen: data.aboutImage },
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
        dominio: { tipo: data.domainType, opcionesNombres: data.domainOptionsList }
      };

      const documentId = data.mercadoLibreUser.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, "proyectos", documentId), cleanData);
      
      if (data.domainType === 'Profesional') {
        const confirmacion = window.confirm("¡Toda tu información se guardó correctamente! 🎉\n\nAl hacer clic en Aceptar, vas a ser redirigido a MercadoPago para abonar los $15.000 de la gestión de tu dominio .com");
        if (confirmacion) {
          window.location.href = "TU_LINK_DE_MERCADO_PAGO_AQUI"; 
        }
      } else {
        alert("¡Éxito! 🎉\n\nTu formulario fue enviado a nuestro equipo. Nos pondremos a trabajar pronto.");
      }

    } catch (error) {
      alert("Hubo un problema guardando tu formulario. Por favor, revisá tu conexión o contactanos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = { enter: { y: 30, opacity: 0 }, center: { y: 0, opacity: 1 }, exit: { y: -30, opacity: 0 } };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col items-center pt-28 md:pt-24 px-4 relative overflow-x-hidden selection:bg-blue-200">
      
      {/* NAVEGACIÓN SUPERIOR (Logo + Progreso) */}
      <div className="absolute top-0 left-0 w-full flex flex-col items-center z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm py-3 px-6 md:px-12">
        <div className="w-full max-w-5xl flex items-center justify-between">
          <img src="/assets/Logo.webp" alt="Logo" className="h-8 md:h-10 w-auto opacity-90" />
          
          {/* Barra de progreso movida ARRIBA */}
          {currentStep.id !== 'WELCOME' && currentStep.id !== 'END' && (
            <div className="flex gap-1.5 md:gap-2">
              {steps.map((s, i) => (
                <div key={i} className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${i === currentStepIndex ? 'w-6 md:w-8 bg-blue-600' : i < currentStepIndex ? 'w-2 bg-blue-300' : 'w-2 bg-slate-200'}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="w-full max-w-4xl min-h-[700px] relative flex flex-col pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep.id} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: "easeOut" }} className="w-full h-full flex flex-col justify-center absolute inset-0 pt-8">
            
            {/* === WELCOME === */}
            {currentStep.id === 'WELCOME' && (
              <div className="flex flex-col items-center text-center gap-6">
                <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5, duration: 0.8 }} className="w-28 h-28 bg-white text-blue-600 rounded-full flex items-center justify-center mb-2 shadow-xl shadow-blue-100/50"><PartyPopper size={56} /></motion.div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">¡Gracias por tu compra!</h1>
                <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">Estamos emocionados de empezar a construir tu nueva presencia digital. Diseñamos este asistente para que nos cuentes sobre tu marca de forma súper fácil y a tu ritmo.</p>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-2 max-w-xl">
                  <p className="text-blue-800 text-sm"><span className="font-bold">💡 Tip importante:</span> No te preocupes por la redacción perfecta de los textos. Nuestro equipo va a revisar y optimizar todo para asegurar que quede profesional. Solo dejanos tus ideas.</p>
                </div>
                <button onClick={nextStep} className="mt-4 px-12 py-5 bg-blue-600 text-white rounded-full font-bold text-xl flex items-center gap-3 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-600/30">
                  <Sparkles size={24} /> Empezar a crear
                </button>
              </div>
            )}

            {currentStep.id === 'ML_USER' && (
              <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2 text-center">Paso 1 de vinculación</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900 text-center">¿Cuál es tu usuario de Mercado Libre?</h2>
                <p className="text-xl text-slate-500 mb-2 text-center">Lo necesitamos obligatoriamente para vincular esta información con tu compra de forma segura.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
                  <p className="text-slate-600 text-sm text-center">Podés poner tu apodo de Mercado Libre (Ej: JUANPEREZ_VENTAS) o el correo electrónico con el que hiciste la compra. Sin esto, no podremos avanzar.</p>
                </div>
                <input type="text" value={data.mercadoLibreUser} onChange={(e) => handleInputChange('mercadoLibreUser', e.target.value)} placeholder="Ej: JUANPEREZ_VENTAS" className="w-full text-2xl text-center bg-white border-2 border-slate-200 rounded-3xl focus:border-blue-500 outline-none p-6 transition-all shadow-sm" autoFocus />
              </div>
            )}

            {currentStep.id === 'TEMPLATE' && (
              <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase text-center mb-2">Estructura Base</p>
                <h2 className="text-4xl font-black leading-tight text-center text-slate-900 mb-2">¿Qué diseño compraste?</h2>
                <p className="text-center text-slate-500 mb-6 max-w-2xl mx-auto">Seleccioná la plantilla que adquiriste. Esto es clave porque nos va a ayudar a pedirte exactamente la información necesaria para ese formato específico.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                  {TEMPLATES.map((tpl) => (
                    <button key={tpl.id} onClick={() => handleInputChange('templateSelected', tpl.id)} className={`group relative overflow-hidden rounded-[2rem] border-4 text-left transition-all duration-300 ${data.templateSelected === tpl.id ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.02]' : 'border-white bg-white hover:border-blue-200 hover:shadow-xl'}`}>
                      <div className="h-56 w-full overflow-hidden relative bg-slate-50 flex items-center justify-center p-4">
                        <img src={tpl.img} alt={tpl.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                        {data.templateSelected === tpl.id && <div className="absolute inset-0 bg-blue-500/5 transition-colors" />}
                      </div>
                      <div className="p-5 bg-white flex items-center justify-between border-t border-slate-100">
                        <span className={`font-black text-xl ${data.templateSelected === tpl.id ? 'text-blue-600' : 'text-slate-800'}`}>{tpl.name}</span>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${data.templateSelected === tpl.id ? 'border-blue-500 bg-blue-500' : 'border-slate-200'}`}>{data.templateSelected === tpl.id && <div className="w-3 h-3 bg-white rounded-full" />}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* === LOGO REDISEÑADO === */}
            {currentStep.id === 'LOGO' && (
              <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2 text-center">Identidad Visual</p>
                <h2 className="text-4xl font-black leading-tight text-center text-slate-900">Subí tu logo oficial</h2>
                <p className="text-xl text-slate-500 text-center mb-4">Si la imagen tiene fondo blanco o es cuadrada, subila igual. Nuestro equipo de diseño la va a limpiar y adaptar para que quede perfecta en la web.</p>
                
                <AnimatePresence>
                  {!data.noLogo && (
                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="flex flex-col items-center w-full mb-4">
                      {/* Animación y Subidor unificados en una sola "Caja" */}
                      <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="w-full bg-slate-50 border-b border-slate-200 h-14 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
                          <div className="px-4 py-1.5 bg-blue-100/50 rounded-lg flex items-center text-blue-600 relative z-10 font-black tracking-widest text-[10px]"><ImageIcon size={14} className="mr-2" /> AQUÍ VA TU LOGO</div>
                        </div>
                        <div className="p-6 bg-white">
                          <ImageUpload userId={data.mercadoLibreUser} value={data.logoUrl} onChange={(url) => handleInputChange('logoUrl', url)} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <label className="flex items-center gap-4 p-6 bg-slate-50/50 border-2 border-slate-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all shadow-sm">
                  <input type="checkbox" checked={data.noLogo} onChange={(e) => { handleInputChange('noLogo', e.target.checked); if(e.target.checked) handleInputChange('logoUrl', ''); }} className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-bold text-lg">No tengo logo aún.</span>
                    <span className="text-slate-500 text-sm">Marcá esta opción y nuestro equipo armará tu marca con una linda tipografía sin costo extra.</span>
                  </div>
                </label>
              </div>
            )}

            {currentStep.id === 'COLORS' && (
              <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto text-center">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Identidad Visual</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900">Definí tus colores</h2>
                <p className="text-xl text-slate-500 mb-2">Es vital para que la web respete tu marca. Podés escribir el código exacto (ej: #FF0000) o contarnos qué tonos te gustan (Ej: "Negro y dorado").</p>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                  <p className="text-amber-800 text-sm">⚠️ Si nos pediste que te diseñemos el logo en el paso anterior, acá decinos con qué colores te gustaría que lo hagamos.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-6 text-left mt-2">
                  <div className="flex-1 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm focus-within:border-blue-500 transition-colors">
                    <label className="font-bold text-slate-700 text-lg flex items-center gap-2 mb-2"><div className="w-4 h-4 rounded-full bg-blue-600"></div> Color Principal</label>
                    <p className="text-sm text-slate-400 mb-3 min-h-[40px]">Se usará para botones, precios y detalles importantes que queremos destacar.</p>
                    <input type="text" value={data.primaryColor} onChange={(e)=>handleInputChange('primaryColor', e.target.value)} placeholder="Ej: 'Azul marino oscuro'" className="w-full text-lg bg-slate-50 rounded-xl outline-none p-4 text-slate-900 font-medium" />
                  </div>
                  <div className="flex-1 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm focus-within:border-slate-400 transition-colors">
                    <label className="font-bold text-slate-700 text-lg flex items-center gap-2 mb-2"><div className="w-4 h-4 rounded-full border-2 border-slate-300"></div> Color Secundario</label>
                    <p className="text-sm text-slate-400 mb-3 min-h-[40px]">Se usará para fondos sutiles, secciones secundarias o bordes.</p>
                    <input type="text" value={data.secondaryColor} onChange={(e)=>handleInputChange('secondaryColor', e.target.value)} placeholder="Ej: 'Beige clarito tipo madera'" className="w-full text-lg bg-slate-50 rounded-xl outline-none p-4 text-slate-900 font-medium" />
                  </div>
                </div>
              </div>
            )}

            {currentStep.id === 'TYPOGRAPHY' && (
              <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2 text-center">Identidad Visual</p>
                <h2 className="text-4xl font-black leading-tight text-center text-slate-900">Estilo de letra</h2>
                <p className="text-center text-slate-500 mb-2">Elegí la "vibra" que mejor represente a tu marca. Esto cambia por completo la sensación visual de la página.</p>
                <div className="grid gap-4 mt-2">
                  <button onClick={() => handleInputChange('typography', 'Sans Serif')} className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${data.typography === 'Sans Serif' ? 'border-blue-600 bg-white shadow-xl scale-[1.02]' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${data.typography === 'Sans Serif' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Type size={24}/></div>
                      <div className="flex flex-col"><span className="text-2xl font-bold text-slate-800" style={{fontFamily: 'sans-serif'}}>Moderna y Limpia</span><span className="text-sm text-slate-500">Estilo Sans Serif (Sin remates). Ideal para rubros tech o marcas jóvenes.</span></div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${data.typography === 'Sans Serif' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{data.typography === 'Sans Serif' && <div className="w-2.5 h-2.5 bg-white rounded-full" />}</div>
                  </button>
                  <button onClick={() => handleInputChange('typography', 'Serif')} className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${data.typography === 'Serif' ? 'border-blue-600 bg-white shadow-xl scale-[1.02]' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${data.typography === 'Serif' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Type size={24}/></div>
                      <div className="flex flex-col"><span className="text-3xl font-bold text-slate-800" style={{fontFamily: 'serif'}}>Clásica y Elegante</span><span className="text-sm text-slate-500">Estilo Serif (Con remates). Ideal para mueblerías finas o marcas premium.</span></div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${data.typography === 'Serif' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{data.typography === 'Serif' && <div className="w-2.5 h-2.5 bg-white rounded-full" />}</div>
                  </button>
                  <button onClick={() => handleInputChange('typography', 'Otra')} className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex flex-col gap-4 ${data.typography === 'Otra' ? 'border-blue-600 bg-white shadow-xl scale-[1.02]' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4"><div className={`p-3 rounded-xl ${data.typography === 'Otra' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Type size={24}/></div>
                      <div className="flex flex-col"><span className="text-xl font-bold text-slate-800">Otra diferente</span><span className="text-sm text-slate-500">Ya sé exactamente qué fuente de Google Fonts quiero usar.</span></div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${data.typography === 'Otra' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{data.typography === 'Otra' && <div className="w-2.5 h-2.5 bg-white rounded-full" />}</div>
                    </div>
                    {data.typography === 'Otra' && (
                      <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="w-full mt-2 pl-[3.25rem]">
                        <input type="text" value={data.customTypography} onChange={e=>handleInputChange('customTypography', e.target.value)} placeholder="Escribí el nombre (Ej: Montserrat, Roboto...)" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 focus:bg-white transition-all text-xl font-medium" autoFocus />
                      </motion.div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {currentStep.id === 'BACKGROUND' && (
              <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2 text-center">Identidad Visual</p>
                <h2 className="text-4xl font-black leading-tight text-center text-slate-900">Tono del fondo principal</h2>
                <p className="text-center text-slate-500 mb-2">Definí la base sobre la que vamos a mostrar tus productos para que resalten al máximo.</p>
                <div className="grid gap-4 mt-4">
                  {['Tonos Claros (Luminoso, limpio y clásico)', 'Tonos Oscuros (Elegante, premium y moderno)', 'A criterio del diseñador (Confío en ustedes)'].map((tono) => (
                    <button key={tono} onClick={() => handleInputChange('backgroundTone', tono)} className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${data.backgroundTone === tono ? 'border-blue-600 bg-white shadow-xl scale-[1.02]' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                      <span className="text-xl font-bold text-slate-800">{tono}</span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${data.backgroundTone === tono ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{data.backgroundTone === tono && <div className="w-2 h-2 bg-white rounded-full" />}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'HERO_TITLE' && (
              <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Primer Impacto</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900">¿Qué querés transmitir al entrar?</h2>
                <p className="text-xl text-slate-500">Este será el título principal de tu web. Lo primero que leen.</p>
                <div className="flex items-start gap-3 bg-blue-50 p-5 rounded-2xl text-left border border-blue-100 shadow-sm mt-2">
                  <Info className="text-blue-500 shrink-0 mt-0.5" size={24} />
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-blue-900">No te compliques buscando la frase perfecta.</p>
                    <p className="text-blue-800 text-sm leading-relaxed">Solo dejá tu idea en bruto (Ej: <i>"Vendemos muebles de autor a medida en CABA y hacemos envíos"</i>) y nuestro equipo de SEO lo va a transformar en un título corto y súper atractivo que convierta visitas en ventas.</p>
                  </div>
                </div>
                <div className="relative mt-2">
                  <textarea value={data.heroTitle} onChange={(e) => handleInputChange('heroTitle', e.target.value)} placeholder="Escribí tu idea principal acá. Es obligatorio para avanzar..." className="w-full text-2xl text-center bg-white border-2 border-slate-200 rounded-[2rem] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none p-10 transition-all min-h-[220px] resize-none shadow-sm" autoFocus />
                </div>
              </div>
            )}

            {currentStep.id === 'HERO_DESKTOP' && (
              <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2 text-center">Primer Impacto</p>
                <h2 className="text-4xl font-black leading-tight text-center text-slate-900">Foto de Portada Principal</h2>
                <p className="text-lg text-slate-500 text-center mb-4">Esta es la foto gigante que verán tus clientes al entrar desde una computadora. Debe ser la de mejor calidad que tengas.</p>
                
                <div className="w-full max-w-md mx-auto relative mb-6">
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
                    <div className="h-8 bg-slate-50 flex items-center px-4 gap-1.5 border-b border-slate-100"><div className="w-2.5 h-2.5 rounded-full bg-red-400"></div><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div><div className="w-2.5 h-2.5 rounded-full bg-green-400"></div></div>
                    <div className="h-28 m-3 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
                      <span className="font-black tracking-widest text-xs text-blue-500 flex items-center gap-2"><Monitor size={18}/> LA FOTO DEBE SER HORIZONTAL</span>
                    </div>
                  </motion.div>
                </div>
                <div className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm"><ImageUpload userId={data.mercadoLibreUser} value={data.heroImage} onChange={(url) => handleInputChange('heroImage', url)} /></div>

                {data.templateSelected !== 'T4' && (
                  <label className="flex items-center gap-4 p-6 bg-blue-50/50 border-2 border-blue-100 rounded-2xl cursor-pointer hover:border-blue-300 transition-colors mt-4">
                    <input type="checkbox" checked={data.wantsMobileHero} onChange={(e) => handleInputChange('wantsMobileHero', e.target.checked)} className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-blue-900 font-bold text-lg">Quiero subir una foto distinta adaptada para celulares.</span>
                      <span className="text-blue-700 text-sm">Altamente recomendado. Si no marcás esto, el sistema va a recortar automáticamente la foto horizontal de arriba para acomodarla en el celu.</span>
                    </div>
                  </label>
                )}
              </div>
            )}

            {currentStep.id === 'HERO_MOBILE' && (
              <div className="flex flex-col gap-6 max-w-xl mx-auto w-full items-center text-center mt-6">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Primer Impacto</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900">Portada para Celular</h2>
                <p className="text-lg text-slate-500">Más del 80% de tus clientes van a entrar a tu web desde el celu. Una foto vertical (formato Reel/Tiktok) hace que la página se vea inmensamente superior.</p>
                
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-36 h-56 bg-white rounded-[2rem] shadow-2xl shadow-slate-300/50 border-[6px] border-slate-800 overflow-hidden flex flex-col relative mb-4">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-slate-800 rounded-b-xl z-30"></div>
                   <div className="h-32 m-2 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl relative flex items-center justify-center mt-6">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
                    <span className="font-black text-[10px] tracking-widest text-blue-500 flex flex-col items-center gap-1"><Smartphone size={20}/> FOTO VERTICAL</span>
                   </div>
                </motion.div>
                <div className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm"><ImageUpload userId={data.mercadoLibreUser} label="" value={data.heroImageMobile} onChange={(url) => handleInputChange('heroImageMobile', url)} /></div>
              </div>
            )}

            {currentStep.id === 'T1_ABOUT' && (
              <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Sobre Nosotros</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900">Contanos de ustedes</h2>
                <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl text-left border border-blue-100 max-w-2xl mx-auto mb-4">
                  <Info className="text-blue-500 shrink-0 mt-1" size={20} />
                  <p className="text-blue-800 text-sm leading-relaxed">A los clientes les gusta saber quién está detrás del negocio. Hace cuánto hacen lo que hacen, por qué eligieron este rubro... Nuestro equipo de redacción se va a encargar de darle un tono emocional y profesional. ¡Ambos campos son obligatorios para avanzar!</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mt-2 text-left">
                  <div className="flex flex-col gap-4 bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                    <label className="font-bold text-slate-700 text-lg">Compartinos una foto linda del equipo, el mostrador o tu cocina (Horizontal)</label>
                    <ImageUpload userId={data.mercadoLibreUser} value={data.aboutImage} onChange={(url) => handleInputChange('aboutImage', url)} />
                  </div>
                  <textarea value={data.aboutText} onChange={(e) => handleInputChange('aboutText', e.target.value)} placeholder="Ej: Todo empezó en 2018 con una receta familiar. Nos encanta ver a la gente disfrutar..." className="w-full text-lg bg-white border-2 border-slate-100 rounded-[2rem] focus:border-blue-500 outline-none p-8 min-h-[220px] resize-none shadow-sm" />
                </div>
              </div>
            )}

            {currentStep.id === 'CATEGORIES_DEF' && (
              <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Estructura</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900">Armemos tu {data.templateSelected === 'T1' ? 'menú' : 'catálogo'}</h2>
                <p className="text-xl text-slate-500 mb-2">Agrupá tus productos en categorías para que los clientes los encuentren más fácil y naveguen cómodos.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
                  <p className="text-slate-600 text-sm"><span className="font-bold text-blue-600">Requisito:</span> Tenés que cargar un <strong>mínimo de 3 categorías</strong> y podés tener hasta un <strong>máximo de 5</strong>. Completá todas las cajas visibles para poder avanzar.</p>
                </div>
                <div className="flex flex-col gap-4 text-left">
                  {data.categories.map((cat, i) => (
                    <div key={i} className="flex gap-4 items-center group">
                      <div className="w-14 h-16 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm shrink-0">{i+1}</div>
                      <input value={cat.name} onChange={(e) => updateCategoryName(i, e.target.value)} placeholder={data.templateSelected === 'T1' ? `Ej: ${i === 0 ? 'Hamburguesas' : 'Bebidas Sin Alcohol'}` : `Ej: ${i === 0 ? 'Sillones y Sofás' : 'Mesas de Comedor'}`} className="w-full text-2xl bg-white border-2 border-slate-200 rounded-2xl focus:border-blue-500 outline-none p-5 transition-all shadow-sm" autoFocus={i === data.categories.length - 1} />
                      {i > 2 && <button onClick={() => removeCategory(i)} className="p-5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors shrink-0"><Trash2 size={28}/></button>}
                    </div>
                  ))}
                  {data.categories.length < 5 && (
                    <button onClick={addCategory} className="flex items-center justify-center gap-3 p-6 mt-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-2xl hover:bg-blue-50 font-bold transition-colors text-xl">
                      <Plus size={28} /> Añadir otra categoría
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentStep.id?.startsWith('CAT_UPLOAD_') && (
              <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2 text-center">Carga de Productos</p>
                <h2 className="text-4xl font-black leading-tight text-center text-slate-900 mb-2">
                  <span className="text-blue-600">{data.categories[currentStep.catIndex!].name}</span>
                </h2>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 max-w-2xl mx-auto text-center">
                  <p className="text-slate-600 text-sm">💡 Subí los productos estrella de esta categoría. <strong className="text-blue-600">Es obligatorio subir por lo menos 1 foto</strong> para poder pasar al siguiente paso. Si no querés subir los 6, dejá las demás cajas vacías y se ocultarán automáticamente.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto max-h-[60vh] p-4 hide-scrollbar">
                  {data.categories[currentStep.catIndex!].items.map((item, itemIdx) => (
                    <div key={item.id} className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col gap-5">
                      {!item.image ? (
                        <ImageUpload userId={data.mercadoLibreUser} label={`Producto ${itemIdx + 1}`} value="" onChange={(url) => updateProduct(currentStep.catIndex!, itemIdx, 'image', url)} />
                      ) : (
                        <>
                          <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-50 group flex items-center justify-center p-2 border border-slate-100">
                            <img src={item.image} alt="Preview" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <button onClick={() => updateProduct(currentStep.catIndex!, itemIdx, 'image', '')} className="bg-white text-red-500 p-4 rounded-full hover:scale-110 shadow-xl transition-transform"><Trash2 size={24} /></button>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <input placeholder="Nombre del producto..." value={item.name} onChange={(e) => updateProduct(currentStep.catIndex!, itemIdx, 'name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none p-4 font-bold text-slate-800 text-lg transition-colors" />
                            <textarea placeholder="Breve descripción (Opcional)..." value={item.description} onChange={(e) => updateProduct(currentStep.catIndex!, itemIdx, 'description', e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none p-4 text-slate-600 transition-colors resize-none h-24" />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'FEATURED' && (
              <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
                <div className="text-center">
                  <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Exhibición</p>
                  <h2 className="text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-3"><Star className="text-yellow-400 fill-yellow-400" size={40}/> Tus Destacados</h2>
                  <p className="text-xl text-slate-500 mt-4">Juntamos todas las fotos que subiste recién. Hacé clic en tus mejores productos para destacarlos bien arriba en la página.</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-4 max-w-md mx-auto">
                    <p className="text-slate-600 text-sm">⚠️ Tenés que elegir <strong className="text-blue-600">al menos 1 producto destacado</strong> para continuar (Podés marcar hasta 6 haciendo clic en las fotos).</p>
                  </div>
                  <div className="inline-block mt-4 px-6 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-bold text-lg">Seleccionados: {data.featuredIds.length} / 6</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 overflow-y-auto max-h-[50vh] p-4 hide-scrollbar">
                  {data.categories.flatMap(c => c.items).filter(i => i.image).map(item => {
                    const isSelected = data.featuredIds.includes(item.id);
                    const isDisabled = !isSelected && data.featuredIds.length >= 6;
                    return (
                      <button key={item.id} onClick={() => toggleFeatured(item.id)} disabled={isDisabled} className={`relative rounded-3xl overflow-hidden border-4 flex flex-col bg-white text-left transition-all h-56 ${isSelected ? 'border-yellow-400 shadow-2xl shadow-yellow-400/20 scale-[1.03]' : isDisabled ? 'border-slate-100 opacity-40 grayscale' : 'border-slate-100 hover:border-blue-300 hover:shadow-lg'}`}>
                        <div className="flex-1 w-full p-4 flex items-center justify-center overflow-hidden bg-slate-50/50"><img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-sm" /></div>
                        <div className="p-4 bg-white border-t border-slate-100 font-bold text-slate-800 text-center line-clamp-1 w-full">{item.name || 'Sin nombre'}</div>
                        {isSelected && <div className="absolute top-3 right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-md"><Star size={18} className="fill-white"/></div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {currentStep.id === 'T1_STATS' && (
              <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Prueba Social</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-4"><BarChart3 size={40} className="text-blue-500"/> Números de Éxito</h2>
                <p className="text-xl text-slate-500 mb-2 max-w-2xl mx-auto">Los números venden. Cargá 4 estadísticas cortas que le den seguridad inmediata a los clientes al entrar a tu web.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 max-w-2xl mx-auto">
                  <p className="text-slate-600 text-sm">💡 <strong className="text-blue-600">Debes completar las 4 cajas.</strong> Ejemplos: "Años en el rubro", "Pedidos entregados", "Clientes felices" o "Estrellas de valoración".</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className="flex gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 focus-within:border-blue-500 transition-colors shadow-sm">
                      <input value={data.stats[i].value} onChange={e=>updateStat(i,'value',e.target.value)} placeholder={['Ej: 10K+', 'Ej: 5', 'Ej: 50+', 'Ej: 99%'][i]} className="w-2/5 text-3xl font-black text-slate-800 bg-transparent outline-none text-center border-r-2 border-slate-100 placeholder:font-normal placeholder:text-slate-300" />
                      <input value={data.stats[i].label} onChange={e=>updateStat(i,'label',e.target.value)} placeholder={['Pedidos entregados', 'Años de experiencia', 'Opciones en menú', 'Clientes satisfechos'][i]} className="w-3/5 text-xl font-medium text-slate-500 bg-transparent outline-none pl-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'T1_EVENTS' && (
              <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Servicios Extra</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-4"><CalendarHeart size={40} className="text-blue-500"/> ¿Ofrecen algún servicio especial?</h2>
                <p className="text-xl text-slate-500 mb-2">Podemos armar una sección especial en la web si además del día a día hacen eventos, ideal para generar ventas grandes.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
                  <p className="text-slate-600 text-sm">Ejemplos: Catering para bodas, menú ejecutivo para oficinas, alquiler del salón para cumpleaños, etc. <strong className="text-blue-600">Elegí una opción para avanzar.</strong></p>
                </div>
                <div className="flex gap-6 mt-2">
                  <button onClick={()=>handleInputChange('offersEvents', true)} className={`flex-1 p-8 rounded-3xl border-4 font-bold text-2xl transition-all ${data.offersEvents === true ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xl' : 'border-slate-200 bg-white hover:border-blue-300'}`}>Sí, ofrecemos</button>
                  <button onClick={()=>handleInputChange('offersEvents', false)} className={`flex-1 p-8 rounded-3xl border-4 font-bold text-2xl transition-all ${data.offersEvents === false ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-200 bg-white hover:border-slate-300'}`}>No por ahora</button>
                </div>
                {data.offersEvents === true && (
                  <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mt-8 text-left bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col gap-5">
                    <input type="text" value={data.eventTitle} onChange={e=>handleInputChange('eventTitle', e.target.value)} placeholder="Título. Ej: Servicio de Catering Integral" className="w-full text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none p-5 transition-all" />
                    <textarea value={data.eventDescription} onChange={(e) => handleInputChange('eventDescription', e.target.value)} placeholder="Contanos brevemente de qué trata. Ej: Nos encargamos de toda la comida para tu evento corporativo o cumpleaños. Armamos un menú a medida según la cantidad de invitados..." className="w-full text-xl text-slate-600 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none p-6 min-h-[160px] resize-none transition-all" />
                  </motion.div>
                )}
              </div>
            )}

            {currentStep.id === 'T2_STORY' && (
              <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-amber-500 uppercase mb-2">Acerca de la marca</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900">Nuestra Inspiración</h2>
                <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl text-left border border-amber-100 mb-4">
                  <Info className="text-amber-600 shrink-0 mt-1" size={20} />
                  <p className="text-amber-800 text-sm leading-relaxed">A los clientes que compran muebles premium les encanta conectar con la historia detrás del taller. Contanos de ustedes, hace cuánto están, qué los motiva. ¡Ambos campos son obligatorios para poder armar la página!</p>
                </div>
                <div className="flex flex-col gap-8 text-left mt-2">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <textarea value={data.t2StoryText} onChange={(e) => handleInputChange('t2StoryText', e.target.value)} placeholder="Ej: Somos un taller familiar. Arrancamos restaurando muebles para amigos y hoy diseñamos a medida..." className="w-full text-xl text-slate-600 bg-slate-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-2xl outline-none p-6 min-h-[180px] resize-none transition-all" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-lg mb-4 block">Compartinos una foto del equipo o del taller (Horizontal)</label>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"><ImageUpload userId={data.mercadoLibreUser} value={data.t2StoryImage} onChange={(url) => handleInputChange('t2StoryImage', url)} /></div>
                  </div>
                </div>
              </div>
            )}

            {currentStep.id === 'T2_MATERIALS' && (
              <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-amber-500 uppercase mb-2">Valor Agregado</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900">Detalles y Calidad</h2>
                <p className="text-xl text-slate-500 mb-2 max-w-2xl mx-auto">Contanos sobre la calidad de tus materiales o qué buscás transmitir en cada mueble.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 max-w-2xl mx-auto">
                  <p className="text-slate-600 text-sm">💡 Escribí el texto y subí <strong className="text-blue-600">al menos 1 foto</strong> de texturas, telas, maderas o muebles terminados para poder avanzar (podés subir hasta 6 para armar una buena galería).</p>
                </div>
                <textarea value={data.t2MaterialsText} onChange={(e) => handleInputChange('t2MaterialsText', e.target.value)} placeholder="Ej: Trabajamos solo con materiales nobles. Desde madera maciza de petiribí hasta tapizados antimanchas. Cada mueble está pensado para durar toda la vida..." className="w-full text-xl bg-white border-2 border-slate-200 focus:border-amber-400 rounded-3xl outline-none p-8 min-h-[160px] resize-none transition-all shadow-sm text-center" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                   {[0,1,2,3,4,5].map(i => (
                     <div key={i} className="h-40 rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-amber-400 transition-colors relative">
                        <ImageUpload userId={data.mercadoLibreUser} label="" value={data.t2MaterialsImages[i] || ''} onChange={url=>updateT2MaterialImage(i,url)} />
                     </div>
                   ))}
                </div>
              </div>
            )}

            {currentStep.id === 'T2_STRENGTHS' && (
              <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-amber-500 uppercase mb-2">Exhibición</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-3"><Award size={40} className="text-amber-500"/> Puntos Fuertes</h2>
                <p className="text-xl text-slate-500 mb-4">Nombrá 3 cosas puntuales por las que te destacás. Las pondremos como garantías visuales en tu web justo antes de mostrar tu catálogo.</p>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
                  <p className="text-amber-800 text-sm">💡 <strong className="font-bold">Completá las 3 casillas para poder avanzar.</strong> Ejemplos: "Telas antimanchas premium", "Diseños 100% personalizados", "Envíos asegurados a todo el país".</p>
                </div>
                <div className="flex flex-col gap-5 text-left">
                  {[0,1,2].map((i) => (
                    <input key={i} value={data.t2Strengths[i]} onChange={e=>updateT2Strength(i, e.target.value)} placeholder={['Punto fuerte 1', 'Punto fuerte 2', 'Punto fuerte 3'][i]} className="w-full text-2xl bg-white border-2 border-slate-200 rounded-[2rem] focus:border-amber-500 outline-none p-6 transition-all shadow-sm" />
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'SERVICES_DEF' && (
              <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2 text-center">Tus Soluciones</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900 text-center mb-2">Detallá tus servicios</h2>
                <p className="text-center text-slate-500 mb-6 max-w-2xl mx-auto">Explicá brevemente en qué consiste cada uno de tus servicios para que el cliente sepa qué está contratando sin necesidad de preguntar.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 max-w-2xl mx-auto text-center">
                  <p className="text-slate-600 text-sm">⚠️ <strong className="text-blue-600 font-bold">Por el diseño de la plantilla que compraste, es obligatorio rellenar los 6 servicios para poder continuar.</strong></p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[60vh] p-4 hide-scrollbar bg-white rounded-[2rem] shadow-sm border border-slate-100">
                  {data.services.map((svc, i) => (
                    <div key={svc.id} className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all flex flex-col gap-5">
                      <div className="flex items-center gap-4"><div className="w-12 h-12 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xl">{i+1}</div><input value={svc.title} onChange={e=>updateService(i,'title',e.target.value)} placeholder="Título del servicio..." className="w-full text-2xl font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-blue-200" /></div>
                      <textarea value={svc.description} onChange={e=>updateService(i,'description',e.target.value)} placeholder="Breve descripción de lo que incluye. Ej: Revisión completa del tablero, cableado y enchufes..." className="w-full text-lg text-slate-600 bg-white rounded-2xl p-4 outline-none resize-none h-28 border border-slate-200 focus:border-blue-300" />
                      <input value={svc.iconHint} onChange={e=>updateService(i,'iconHint',e.target.value)} placeholder="Idea para el ícono (Opcional - Ej: 'Una llave inglesa' o 'Rayo')" className="w-full text-sm font-medium text-blue-500 bg-transparent outline-none border-b border-dashed border-blue-200" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'STRENGTHS' && (
              <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full text-center">
                 <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Confianza</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900 flex items-center justify-center gap-4"><HeartHandshake size={40} className="text-blue-500"/> ¿Por qué deberían elegirte?</h2>
                <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl text-left border border-blue-100 mt-2 mb-2">
                  <Info className="text-blue-500 shrink-0 mt-1" size={20} />
                  <p className="text-blue-800 text-sm leading-relaxed">En el rubro de los servicios, la confianza lo es todo. Tiranos un par de ideas sueltas (Ej: "Tengo matrícula al día", "Voy rápido si es urgencia", "Doy 6 meses de garantía"). Nuestro equipo lo redactará como un checklist profesional súper convincente.</p>
                </div>
                <textarea value={data.strengths} onChange={(e) => handleInputChange('strengths', e.target.value)} placeholder="Escribí tus puntos fuertes acá. Es obligatorio para avanzar..." className="w-full text-2xl text-slate-600 bg-white border-2 border-slate-200 rounded-[2rem] focus:border-blue-500 outline-none p-8 transition-all min-h-[200px] resize-none shadow-sm text-center" />
              </div>
            )}

            {currentStep.id === 'REVIEWS_NEW' && (
              <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Prueba Social</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900 mb-6">Las opiniones reales venden.</h2>
                <p className="text-xl text-slate-500 mb-4">Los clientes nuevos confían en los clientes viejos. Mostrales que hacés un buen trabajo.</p>
                
                <label className="flex items-center justify-center gap-4 p-6 bg-blue-50 border-2 border-blue-200 rounded-3xl cursor-pointer hover:border-blue-400 transition-colors shadow-sm max-w-2xl mx-auto w-full mb-4">
                  <input type="checkbox" checked={data.useGoogleMapsReviews} onChange={(e) => handleInputChange('useGoogleMapsReviews', e.target.checked)} className="w-7 h-7 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-blue-900 font-bold text-xl">Tengo Google Maps. Sacá las reseñas de ahí.</span>
                    <span className="text-blue-700 text-sm">Es la opción más recomendada porque da mucha transparencia.</span>
                  </div>
                </label>

                {data.useGoogleMapsReviews ? (
                  <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="max-w-xl mx-auto w-full">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                      <label className="font-bold text-slate-700 text-lg block text-left mb-2">Pegá el link a tu perfil de Google Maps acá (Obligatorio):</label>
                      <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 focus-within:border-blue-500 rounded-2xl px-4 py-2 transition-all">
                        <LinkIcon className="text-slate-400"/>
                        <input type="text" value={data.googleMapsLink} onChange={e=>handleInputChange('googleMapsLink', e.target.value)} placeholder="https://maps.app.goo.gl/..." className="w-full text-lg bg-transparent outline-none p-2" autoFocus />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid md:grid-cols-3 gap-6 text-left">
                    <p className="col-span-full text-center text-slate-500 text-lg">O podés copiar y pegar 3 reseñas manualmente (Debés completar las 3 para avanzar):</p>
                    {[0,1,2].map((i) => (
                      <div key={i} className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col gap-4 relative focus-within:border-blue-400 transition-all">
                        <div className="absolute -top-6 left-8 text-7xl text-blue-200 font-serif leading-none">"</div>
                        <textarea value={data.reviewsList[i].text} onChange={e=>updateReview(i,'text',e.target.value)} placeholder={`"Excelente atención, el pedido llegó rapidísimo..."`} className="w-full text-lg text-slate-600 bg-transparent outline-none resize-none h-40 relative z-10 pt-4" />
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
              <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Información Final</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900 mb-2">Redes y Contacto</h2>
                <p className="text-xl text-slate-500 mb-6">A dónde querés que vayan a parar tus clientes cuando toquen los botones de contacto en tu web.</p>
                <div className="flex flex-col gap-6 text-left">
                  <div className="flex items-center gap-6 bg-white border-2 border-slate-100 rounded-[2rem] p-5 focus-within:border-green-500 transition-all shadow-sm">
                    <div className="p-4 bg-green-50 text-green-500 rounded-2xl"><Phone size={32} /></div>
                    <div className="flex flex-col w-full"><span className="text-sm font-bold text-slate-400 uppercase mb-1">WhatsApp Ventas <strong className="text-green-500">(Obligatorio)</strong></span><input type="text" value={data.whatsapp} onChange={(e) => handleInputChange('whatsapp', e.target.value)} placeholder="+54 9 11 0000-0000" className="w-full bg-transparent outline-none py-1 text-2xl font-black text-slate-800" /></div>
                  </div>
                  <div className="flex items-center gap-6 bg-white border-2 border-slate-100 rounded-[2rem] p-5 focus-within:border-pink-500 transition-all shadow-sm">
                    <div className="p-4 bg-pink-50 text-pink-500 rounded-2xl"><AtSign size={32} /></div>
                    <div className="flex flex-col w-full"><span className="text-sm font-bold text-slate-400 uppercase mb-1">Link a Instagram o Facebook <strong className="text-pink-500">(Obligatorio)</strong></span><input type="text" value={data.socialLinks} onChange={(e) => handleInputChange('socialLinks', e.target.value)} placeholder="@tu_marca o link directo" className="w-full bg-transparent outline-none py-1 text-2xl font-black text-slate-800" /></div>
                  </div>
                  
                  {/* --- BLOQUE DE DIRECCIÓN CON AUTOCOMPLETE MÁGICO --- */}
                  <div className="flex items-center gap-6 bg-white border-2 border-slate-100 rounded-[2rem] p-5 focus-within:border-blue-500 transition-all shadow-sm">
                    <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl"><MapPin size={32} /></div>
                    <div className="flex flex-col w-full">
                      <span className="text-sm font-bold text-slate-400 uppercase mb-1">Ubicación Física (Si tenés local - Opcional)</span>
                      <p className="text-xs text-slate-500 mb-2">Buscá tu calle y altura o nombre del local. Te generaremos un link de Google Maps automáticamente.</p>
                      
                      <AddressAutocomplete 
                        value={data.address} 
                        onChange={(url) => handleInputChange('address', url)} 
                      />

                    </div>
                  </div>

                </div>
              </div>
            )}

            {currentStep.id === 'DOMAIN_TYPE' && (
              <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Despliegue</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900">¿Cómo querés que sea tu link web?</h2>
                <div className="flex flex-col gap-5 mt-6 text-left">
                  <button onClick={() => handleInputChange('domainType', 'Profesional')} className={`w-full text-left p-8 rounded-[2rem] border-4 transition-all flex items-start gap-6 ${data.domainType === 'Profesional' ? 'border-blue-600 bg-white shadow-2xl shadow-blue-600/20 scale-[1.02]' : 'border-white bg-white hover:border-blue-200 hover:shadow-xl'}`}>
                    <div className={`w-10 h-10 mt-1 rounded-full border-[4px] flex shrink-0 items-center justify-center ${data.domainType === 'Profesional' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{data.domainType === 'Profesional' && <div className="w-4 h-4 bg-white rounded-full" />}</div>
                    <div><strong className="block text-3xl font-black text-slate-800 mb-3">A) Dominio Profesional .com</strong><span className="text-xl text-slate-500 block leading-relaxed">Ej: www.tunegocio.com.<br/>Tiene un costo extra de $15.000 por la gestión y el primer año. <strong className="text-slate-700">(Renovación anual a cargo del cliente).</strong></span></div>
                  </button>
                  <button onClick={() => handleInputChange('domainType', 'Gratuito')} className={`w-full text-left p-8 rounded-[2rem] border-4 transition-all flex items-start gap-6 ${data.domainType === 'Gratuito' ? 'border-blue-600 bg-white shadow-2xl shadow-blue-600/20 scale-[1.02]' : 'border-white bg-white hover:border-blue-200 hover:shadow-xl'}`}>
                    <div className={`w-10 h-10 mt-1 rounded-full border-[4px] flex shrink-0 items-center justify-center ${data.domainType === 'Gratuito' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{data.domainType === 'Gratuito' && <div className="w-4 h-4 bg-white rounded-full" />}</div>
                    <div><strong className="block text-3xl font-black text-slate-800 mb-3">B) Versión Gratuita</strong><span className="text-xl text-slate-500 block leading-relaxed">Ej: tunegocio.vercel.app.<br/>Totalmente funcional, sin costo extra y para siempre.</span></div>
                  </button>
                </div>
              </div>
            )}

            {currentStep.id === 'DOMAIN_OPTIONS' && (
              <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full text-center">
                <p className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2">Nombres</p>
                <h2 className="text-4xl font-black leading-tight text-slate-900">Elegí tu nombre web</h2>
                <p className="text-xl text-slate-500 mb-6 max-w-xl mx-auto">Dejanos 3 opciones en orden de prioridad. Nuestro equipo técnico va a chequear cuál está disponible para registrarlo a tu nombre lo antes posible.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
                  <p className="text-slate-600 text-sm">💡 Debés completar las 3 opciones para poder avanzar al último paso.</p>
                </div>
                <div className="flex flex-col gap-4 text-left bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  {[0,1,2].map((i) => (
                    <div key={i} className="flex gap-4 items-center group">
                      <div className="w-14 h-14 shrink-0 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl">{i+1}</div>
                      <input value={data.domainOptionsList[i]} onChange={(e) => updateDomainOption(i, e.target.value)} placeholder={`Ej: ${['mitiendamuebles', 'mueblesmitienda', 'tiendamueblesarg'][i]}`} className="w-full text-2xl bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none p-4 transition-all" autoFocus={i===0} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep.id === 'END' && (
              <div className="text-center flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
                {isSubmitting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><Loader2 size={100} className="text-blue-500 mb-8" /></motion.div>
                ) : (
                  <Sparkles size={80} className="text-blue-500 mb-8 animate-pulse" />
                )}
                
                <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">¡Llegamos al final! 🎉</h2>
                <p className="text-2xl text-slate-500 leading-relaxed mb-10">Tenemos todo el material necesario para empezar a armar tu página web. Al hacer clic abajo, toda la información se enviará de forma segura a nuestro equipo.</p>
                
                {data.domainType === 'Profesional' ? (
                  <button onClick={handleSubmit} disabled={isSubmitting} className="px-12 py-6 bg-green-600 text-white rounded-full font-black text-2xl flex items-center gap-4 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-green-600/40 disabled:opacity-50 disabled:hover:scale-100">
                    {isSubmitting ? 'Procesando y redirigiendo...' : <><CreditCard size={28} /> Abonar Dominio y Enviar</>}
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={isSubmitting} className="px-12 py-6 bg-slate-900 text-white rounded-full font-black text-2xl flex items-center gap-4 hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/40 disabled:opacity-50 disabled:hover:scale-100">
                    {isSubmitting ? 'Enviando a la base de datos...' : 'Enviar a Producción'}
                  </button>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* NAVEGACIÓN INFERIOR (Solo botones) */}
      {currentStep.id !== 'WELCOME' && currentStep.id !== 'END' && (
        <div className="fixed bottom-6 w-full max-w-4xl px-4 md:px-0 flex justify-between items-center z-50">
          <button onClick={prevStep} className="p-5 rounded-full bg-white shadow-xl shadow-slate-200/50 border border-slate-100 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all"><ArrowLeft size={28} /></button>

          <button onClick={nextStep} disabled={isNextDisabled()} className={`px-10 py-5 rounded-full font-bold text-xl flex items-center gap-3 transition-all ${isNextDisabled() ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-2xl shadow-blue-600/40'}`}>
            {isNextDisabled() ? 'Completá para seguir' : 'Siguiente'} <ArrowRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}