import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (addressUrl: string) => void;
}

export default function AddressAutocomplete({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú si hacemos clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscador con delay (debounce) para no saturar la API gratuita
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Usamos OpenStreetMap que es 100% gratis y sin API Key
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ar`);
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Error buscando dirección:", error);
      } finally {
        setIsSearching(false);
      }
    }, 600); // Espera 600ms después de que el cliente deja de escribir

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (addressName: string) => {
    setQuery(addressName);
    setIsOpen(false);
    
    // EL TRUCO: Armamos el link de Google Maps con la dirección elegida
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressName)}`;
    onChange(googleMapsLink);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-blue-500 rounded-2xl px-4 py-1 transition-all">
        <MapPin className="text-slate-400 shrink-0" size={24}/>
        <input
          type="text"
          value={query || value.replace('https://www.google.com/maps/search/?api=1&query=', decodeURIComponent)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(''); // Limpiamos el link viejo si vuelven a escribir
          }}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Empezá a escribir tu dirección..."
          className="w-full text-xl bg-transparent outline-none p-3 font-bold text-slate-800"
        />
        {isSearching && <Loader2 className="animate-spin text-blue-500 shrink-0" size={20} />}
      </div>

      {/* Menú desplegable flotante estilo "Google" */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => handleSelect(result.display_name)}
              className="w-full text-left px-5 py-4 hover:bg-blue-50 border-b border-slate-50 last:border-b-0 transition-colors flex flex-col gap-1"
            >
              <span className="font-bold text-slate-800 text-lg line-clamp-1">{result.display_name.split(',')[0]}</span>
              <span className="text-sm text-slate-500 line-clamp-1">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}