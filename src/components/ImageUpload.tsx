import { useState, useCallback } from 'react';
import { X, ImagePlus, Loader2 } from 'lucide-react';

interface Props {
  label?: string;
  onChange: (fileUrl: string) => void;
  value?: string;
  userId?: string; // NUEVO: Recibe el usuario para crear la carpeta
}

export default function ImageUpload({ label, onChange, value, userId }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 👇 PONÉ TUS DATOS DE CLOUDINARY ACÁ 👇
  const CLOUD_NAME = "t8nl8hwm";
  const UPLOAD_PRESET = "portal_imagenes";

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadToCloudinary(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadToCloudinary(e.target.files[0]);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    if (!CLOUD_NAME || CLOUD_NAME === "TU_CLOUD_NAME") {
      alert("Falta configurar el Cloud Name de Cloudinary en el código.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    // MAGIA: Si pasaron un usuario, Cloudinary crea una carpeta con ese nombre
    if (userId && userId.trim() !== '') {
      // Limpia el nombre para evitar caracteres que rompan la URL
      const safeFolder = userId.replace(/[^a-zA-Z0-9]/g, '_');
      formData.append('folder', safeFolder);
    }

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.secure_url) {
        onChange(data.secure_url);
      } else {
        alert("Error al subir la imagen. Revisá la configuración.");
      }
    } catch (error) {
      console.error("Error subiendo a Cloudinary:", error);
      alert("Hubo un problema de conexión al subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => onChange('');

  return (
    <div className="w-full flex flex-col gap-2">
      {label && <span className="text-sm font-bold text-slate-500 ml-1">{label}</span>}
      
      {value ? (
        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 bg-white group flex items-center justify-center p-2 shadow-sm">
          <img src={value} alt="Preview" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <button onClick={clearImage} className="bg-white text-red-500 p-3 rounded-full hover:scale-110 shadow-xl transition-transform">
              <X size={24} />
            </button>
          </div>
        </div>
      ) : (
        <label
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl transition-all duration-300
            ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'}
            ${isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-blue-600">
              <Loader2 size={32} className="animate-spin" />
              <span className="font-bold text-sm">Subiendo foto...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-4 text-center">
              <div className={`p-4 rounded-full transition-colors duration-300 shadow-sm ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 border border-slate-100'}`}>
                <ImagePlus size={28} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-0.5"><span className="text-blue-600">Subir imagen</span></p>
                <p className="text-xs text-slate-400 font-medium">Hacé clic o arrastrá acá</p>
              </div>
            </div>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleChange} disabled={isUploading} />
        </label>
      )}
    </div>
  );
}