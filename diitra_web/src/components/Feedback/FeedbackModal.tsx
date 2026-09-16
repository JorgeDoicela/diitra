import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Send, Bug, HelpCircle, 
    UploadCloud, Trash2, Image as ImageIcon, Video, CheckCircle2, 
    ExternalLink, AlertCircle, Info, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { useAuth } from '../../api/AuthContext';
import { useLocation } from 'react-router-dom';
import { getSupportConfig, sendFeedback, type SupportConfig } from '../../services/feedbackService';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FeedbackType = 'ERROR' | 'DUDA';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const { user, roleDisplayName } = useAuth();
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tipo, setTipo] = useState<FeedbackType>('ERROR');
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [archivos, setArchivos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<{ name: string; url: string; isVideo: boolean; size: string }[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    
    const [supportConfig, setSupportConfig] = useState<SupportConfig>({
        whatsAppNumber: '593969677280',
        maxImageSizeBytes: 5 * 1024 * 1024,
        maxVideoSizeBytes: 15 * 1024 * 1024
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ titulo?: string; descripcion?: string; archivos?: string; general?: string }>({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [previewModalIndex, setPreviewModalIndex] = useState<number | null>(null);

    // Bloquear scroll de fondo
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Tecla Escape para cerrar (modal o preview) y Flechas para navegar en preview
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (previewModalIndex !== null) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setPreviewModalIndex(null);
                    return;
                }
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setPreviewModalIndex(prev => prev !== null ? (prev > 0 ? prev - 1 : previews.length - 1) : null);
                    return;
                }
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    setPreviewModalIndex(prev => prev !== null ? (prev < previews.length - 1 ? prev + 1 : 0) : null);
                    return;
                }
            } else {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                }
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    const form = document.getElementById('feedback-drawer-form') as HTMLFormElement | null;
                    if (form) form.requestSubmit();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, previewModalIndex, previews.length]);

    useEffect(() => {
        if (isOpen) {
            getSupportConfig().then(cfg => {
                if (cfg) setSupportConfig(cfg);
            });
            setIsSuccess(false);
            setErrors({});
        }
    }, [isOpen]);

    const previewsRef = useRef(previews);
    previewsRef.current = previews;

    // Limpieza de URLs blob únicamente cuando se desmonta el componente
    useEffect(() => {
        return () => {
            previewsRef.current.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, []);

    if (!isOpen) return null;

    const maxImgBytes = supportConfig.maxImageSizeBytes || supportConfig.max_image_size_bytes || 5 * 1024 * 1024;
    const maxVidBytes = supportConfig.maxVideoSizeBytes || supportConfig.max_video_size_bytes || 15 * 1024 * 1024;
    const whatsAppNum = supportConfig.whatsAppNumber || supportConfig.whats_app_number || '593969677280';

    const formatBytes = (bytes: number): string => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const processFiles = (selectedFiles: File[]) => {
        setErrors(prev => ({ ...prev, archivos: undefined }));
        if (selectedFiles.length === 0) return;

        const currentImages = archivos.filter(f => f.type.startsWith('image/'));
        const currentVideos = archivos.filter(f => f.type.startsWith('video/'));

        const newFilesToAdd: File[] = [];
        const newPreviewsToAdd: { name: string; url: string; isVideo: boolean; size: string }[] = [];

        for (const file of selectedFiles) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (!isImage && !isVideo) {
                setErrors(prev => ({ ...prev, archivos: `El archivo "${file.name}" no es una imagen ni un video válido.` }));
                continue;
            }

            if (isImage) {
                if (currentImages.length + newFilesToAdd.filter(f => f.type.startsWith('image/')).length >= 3) {
                    setErrors(prev => ({ ...prev, archivos: 'Solo puedes adjuntar hasta 3 imágenes.' }));
                    break;
                }
                if (file.size > maxImgBytes) {
                    setErrors(prev => ({ ...prev, archivos: `La imagen "${file.name}" (${formatBytes(file.size)}) supera el límite de ${formatBytes(maxImgBytes)}.` }));
                    continue;
                }
            }

            if (isVideo) {
                if (currentVideos.length + newFilesToAdd.filter(f => f.type.startsWith('video/')).length >= 1) {
                    setErrors(prev => ({ ...prev, archivos: 'Solo puedes adjuntar hasta 1 clip de video.' }));
                    break;
                }
                if (file.size > maxVidBytes) {
                    setErrors(prev => ({ ...prev, archivos: `El video "${file.name}" (${formatBytes(file.size)}) supera el límite de ${formatBytes(maxVidBytes)}.` }));
                    continue;
                }
            }

            newFilesToAdd.push(file);
            newPreviewsToAdd.push({
                name: file.name,
                url: URL.createObjectURL(file),
                isVideo,
                size: formatBytes(file.size)
            });
        }

        setArchivos(prev => [...prev, ...newFilesToAdd]);
        setPreviews(prev => [...prev, ...newPreviewsToAdd]);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(Array.from(e.target.files || []));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const files = Array.from(e.dataTransfer.files || []);
        processFiles(files);
    };

    const handleRemoveFile = (index: number) => {
        URL.revokeObjectURL(previews[index].url);
        setArchivos(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
        setErrors(prev => ({ ...prev, archivos: undefined }));
        if (previewModalIndex === index) {
            setPreviewModalIndex(null);
        } else if (previewModalIndex !== null && previewModalIndex > index) {
            setPreviewModalIndex(previewModalIndex - 1);
        }
    };

    const handleWhatsAppClick = () => {
        const nombre = user?.nombre_completo || 'Usuario';
        const rol = roleDisplayName || 'Usuario';
        const ruta = location.pathname.replace(/^\//, '') || 'inicio';

        const asuntoTexto = titulo.trim();
        const detalleTexto = descripcion.trim();

        const lines: string[] = [
            'Hola, necesito ayuda con una incidencia en DIITRA.',
            '',
            `Usuario: ${nombre}`,
            `Rol: ${rol}`,
            `Pantalla: ${ruta}`,
            '',
            `Asunto: ${asuntoTexto}`,
            `Detalle: ${detalleTexto}`
        ];

        const text = encodeURIComponent(lines.join('\n'));
        const url = `https://wa.me/${whatsAppNum}?text=${text}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const newErrors: { titulo?: string; descripcion?: string; archivos?: string; general?: string } = {};

        if (!titulo.trim()) {
            newErrors.titulo = 'Ingresa un título para tu reporte de incidencia.';
        }

        if (!descripcion.trim()) {
            newErrors.descripcion = 'Describe el problema con suficiente detalle para poder revisarlo.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const formData = new FormData();
            formData.append('Tipo', tipo);
            formData.append('Titulo', titulo.trim());
            formData.append('Descripcion', descripcion.trim());
            formData.append('RutaOrigen', location.pathname);
            const ua = navigator.userAgent;
            let os = 'Desconocido';
            if (/win/i.test(ua)) os = 'Windows';
            else if (/android/i.test(ua)) os = 'Android';
            else if (/ipad|iphone|ipod/i.test(ua)) os = 'iOS';
            else if (/mac/i.test(ua)) os = 'macOS';
            else if (/linux/i.test(ua)) os = 'Linux';

            let browser = 'Desconocido';
            if (/edg/i.test(ua)) browser = 'Microsoft Edge';
            else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
            else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
            else if (/safari/i.test(ua)) browser = 'Apple Safari';
            else if (/opera|opr/i.test(ua)) browser = 'Opera';

            const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

            const richMetadata = {
                browser,
                os,
                url: window.location.href,
                pathname: location.pathname,
                screen: `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                devicePixelRatio: window.devicePixelRatio || 1,
                language: navigator.language || 'es-EC',
                isOnline: navigator.onLine,
                connectionType: navConn?.effectiveType || (navigator.onLine ? 'Estable' : 'Offline'),
                deviceMemoryGB: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : undefined,
                hardwareConcurrency: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} núcleos` : undefined,
                userAgent: ua,
                timestamp: new Date().toISOString(),
                userRef: user?.id_referencia || '',
                userName: user?.nombre_completo || '',
                userRole: roleDisplayName || ''
            };

            formData.append('MetadataNavegador', JSON.stringify(richMetadata));

            archivos.forEach(file => {
                formData.append('Archivos', file);
            });

            await sendFeedback(formData);
            window.dispatchEvent(new CustomEvent('diitra-feedback-changed'));
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                previews.forEach(p => URL.revokeObjectURL(p.url));
                setTitulo('');
                setDescripcion('');
                setArchivos([]);
                setPreviews([]);
                setPreviewModalIndex(null);
                setIsSuccess(false);
                setErrors({});
            }, 2000);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al enviar el reporte. Puedes contactar por WhatsApp.';
            setErrors({ general: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSubmitLabel = () => {
        switch (tipo) {
            case 'ERROR': return 'Reportar Problema';
            case 'DUDA': return 'Reportar Opción Faltante';
            default: return 'Enviar Incidencia';
        }
    };

    const getTitlePlaceholder = () => {
        switch (tipo) {
            case 'ERROR': return 'Ej: El botón de guardar no responde / La pantalla se queda en blanco...';
            case 'DUDA': return 'Ej: No me permite ingresar mi teléfono / Falta el campo de coautor...';
            default: return 'Ej: Describe brevemente la incidencia...';
        }
    };

    const getDescPlaceholder = () => {
        switch (tipo) {
            case 'ERROR': return 'Describe qué estabas intentando hacer, en qué pantalla ocurrió y qué problema apareció...';
            case 'DUDA': return 'Indica qué dato u opción consideras que hace falta o no te permite completar tu registro...';
            default: return 'Describe los detalles de la incidencia...';
        }
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Buzón de Incidencias DIITRA"
        >
            {/* Backdrop Blur Overlay */}
            <div 
                className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={onClose}
            />

            {/* Panel Lateral Derecho (Drawer Vercel Geist Oficial) */}
            <div className="relative w-full max-w-lg md:max-w-xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
                
                {/* Header Institucional Limpio */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[14px] font-semibold text-text-main tracking-tight">
                            Buzón de Incidencias
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Cerrar [ESC]"
                        aria-label="Cerrar panel"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body: Contenido con scroll vertical */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-zinc-950 custom-scrollbar">
                    {/* Banner Informativo Sin Tecnicismos */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex items-start gap-2.5 shadow-2xs">
                        <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                        <p className="text-[12px] text-text-dim leading-relaxed">
                            <strong className="font-semibold text-text-main">¿Encontraste un problema?</strong> Si algo no funciona bien, una pantalla se queda colgada o falta un dato, repórtalo aquí para revisarlo. <span className="text-text-dim/80">(Para aprender a usar el sistema, por favor consulta el botón de Ayuda).</span>
                        </p>
                    </div>

                    {/* Mensaje de Error General (Servidor o Red) */}
                    {errors.general && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[12px] flex items-center justify-between gap-2 animate-fade-in">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                                <span className="font-medium">{errors.general}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setErrors(prev => ({ ...prev, general: undefined }))}
                                className="text-red-400 hover:text-red-500 p-0.5 cursor-pointer rounded"
                                title="Cerrar aviso"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {isSuccess ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-emerald-500 shadow-xs">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-[14.5px] font-semibold text-text-main">
                                Incidencia registrada con éxito
                            </h3>
                            <p className="text-[12px] text-text-dim max-w-xs leading-relaxed">
                                La incidencia ha sido registrada para ser revisada y corregida. Podrás ver el avance y la respuesta en esta misma sección.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} id="feedback-drawer-form" className="space-y-4">
                            {/* Selector de Tipo - Vercel Choice Cards */}
                            <div>
                                <label className="block text-[11px] font-mono font-semibold text-text-dim uppercase tracking-wider mb-2">
                                    ¿De qué se trata?
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {/* Opción 1: Algo no funciona */}
                                    <button
                                        type="button"
                                        onClick={() => setTipo('ERROR')}
                                        className={`group relative p-3 rounded-lg border text-left transition-all cursor-pointer outline-none focus:outline-none ${
                                            tipo === 'ERROR'
                                                ? 'border-red-500 bg-white dark:bg-red-950/20 shadow-xs'
                                                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <Bug className={`w-4 h-4 ${tipo === 'ERROR' ? 'text-red-500' : 'text-text-dim'}`} />
                                                <span className={`text-[12.5px] font-semibold ${tipo === 'ERROR' ? 'text-red-500' : 'text-text-dim group-hover:text-text-main'}`}>
                                                    Algo no funciona
                                                </span>
                                            </div>
                                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                                tipo === 'ERROR'
                                                    ? 'border-red-500 bg-red-500'
                                                    : 'border-zinc-200 dark:border-zinc-700 group-hover:border-text-dim'
                                            }`}>
                                                {tipo === 'ERROR' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </span>
                                        </div>
                                        <p className={`text-[11px] leading-snug ${tipo === 'ERROR' ? 'text-text-main/80' : 'text-text-dim'}`}>
                                            Error, fallo en la pantalla o bloqueo al guardar.
                                        </p>
                                    </button>

                                    {/* Opción 2: Falta una opción */}
                                    <button
                                        type="button"
                                        onClick={() => setTipo('DUDA')}
                                        className={`group relative p-3 rounded-lg border text-left transition-all cursor-pointer outline-none focus:outline-none ${
                                            tipo === 'DUDA'
                                                ? 'border-amber-500 bg-white dark:bg-amber-950/20 shadow-xs'
                                                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <HelpCircle className={`w-4 h-4 ${tipo === 'DUDA' ? 'text-amber-500' : 'text-text-dim'}`} />
                                                <span className={`text-[12.5px] font-semibold ${tipo === 'DUDA' ? 'text-amber-500' : 'text-text-dim group-hover:text-text-main'}`}>
                                                    Falta una opción
                                                </span>
                                            </div>
                                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                                tipo === 'DUDA'
                                                    ? 'border-amber-500 bg-amber-500'
                                                    : 'border-zinc-200 dark:border-zinc-700 group-hover:border-text-dim'
                                            }`}>
                                                {tipo === 'DUDA' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </span>
                                        </div>
                                        <p className={`text-[11px] leading-snug ${tipo === 'DUDA' ? 'text-text-main/80' : 'text-text-dim'}`}>
                                            Falta un campo, opción o dato en el formulario.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Título */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11px] font-mono font-semibold text-text-dim uppercase tracking-wider">
                                        Título / Resumen
                                    </label>
                                    <span className="text-[10px] font-mono text-text-dim">
                                        {titulo.length}/200
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={titulo}
                                    onChange={e => {
                                        setTitulo(e.target.value);
                                        if (errors.titulo) setErrors(prev => ({ ...prev, titulo: undefined }));
                                    }}
                                    placeholder={getTitlePlaceholder()}
                                    className={`w-full px-3.5 py-2 text-[13px] bg-white dark:bg-zinc-950 border rounded-lg text-text-main placeholder:text-text-dim/50 focus:outline-none transition-colors shadow-2xs ${
                                        errors.titulo
                                            ? 'border-red-500 focus:border-red-500'
                                            : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100'
                                    }`}
                                    maxLength={200}
                                />
                                {errors.titulo && (
                                    <p className="text-[11.5px] text-red-500 mt-1.5 flex items-center gap-1.5 font-medium animate-fade-in">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>{errors.titulo}</span>
                                    </p>
                                )}
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-[11px] font-mono font-semibold text-text-dim uppercase tracking-wider mb-1.5">
                                    Detalle del reporte
                                </label>
                                <textarea
                                    value={descripcion}
                                    onChange={e => {
                                        setDescripcion(e.target.value);
                                        if (errors.descripcion) setErrors(prev => ({ ...prev, descripcion: undefined }));
                                    }}
                                    placeholder={getDescPlaceholder()}
                                    rows={5}
                                    className={`w-full px-3.5 py-2 text-[13px] bg-white dark:bg-zinc-950 border rounded-lg text-text-main placeholder:text-text-dim/50 focus:outline-none transition-colors resize-none shadow-2xs ${
                                        errors.descripcion
                                            ? 'border-red-500 focus:border-red-500'
                                            : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100'
                                    }`}
                                />
                                {errors.descripcion && (
                                    <p className="text-[11.5px] text-red-500 mt-1.5 flex items-center gap-1.5 font-medium animate-fade-in">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>{errors.descripcion}</span>
                                    </p>
                                )}
                            </div>

                            {/* Adjuntos / Drag & Drop Dropzone */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11px] font-mono font-semibold text-text-dim uppercase tracking-wider">
                                        Capturas o videos (Opcional)
                                    </label>
                                    <span className={`text-[10.5px] font-mono px-2 py-0.5 rounded transition-all ${
                                        archivos.filter(f => f.type.startsWith('image/')).length >= 3
                                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30'
                                            : 'text-text-dim'
                                    }`}>
                                        {archivos.filter(f => f.type.startsWith('image/')).length}/3 img • {archivos.filter(f => f.type.startsWith('video/')).length}/1 video
                                    </span>
                                </div>

                                {/* Mensaje de Error Exclusivo de Archivos */}
                                {errors.archivos && (
                                    <div className="mb-2.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[12px] flex items-center justify-between gap-2 animate-fade-in">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                                            <span className="font-medium">{errors.archivos}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setErrors(prev => ({ ...prev, archivos: undefined }))}
                                            className="text-red-400 hover:text-red-500 p-0.5 cursor-pointer rounded"
                                            title="Cerrar aviso"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {archivos.filter(f => f.type.startsWith('image/')).length >= 3 && archivos.filter(f => f.type.startsWith('video/')).length >= 1 ? (
                                    /* Estado cuando ya no se pueden agregar más archivos */
                                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-white dark:bg-zinc-900/30 text-center">
                                        <p className="text-[12px] font-medium text-text-main">
                                            ✓ Límite de adjuntos alcanzado (3 imágenes y 1 video)
                                        </p>
                                        <p className="text-[11px] text-text-dim mt-0.5">
                                            Para adjuntar un archivo diferente, elimina alguno de la lista inferior.
                                        </p>
                                    </div>
                                ) : (
                                    /* Dropzone blanco limpio en modo claro, oscuro sobrio en dark mode */
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                                        onDragLeave={() => setIsDraggingOver(false)}
                                        onDrop={handleDrop}
                                        className={`border border-dashed rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer text-center ${
                                            previews.length > 0 ? 'py-4 px-3 gap-2' : 'py-8 px-4 gap-2.5'
                                        } ${
                                            isDraggingOver 
                                                ? 'border-blue-500 bg-blue-500/5 scale-[0.99]' 
                                                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 hover:border-zinc-300 dark:hover:border-zinc-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-text-dim shadow-2xs shrink-0">
                                                <UploadCloud className="w-4 h-4" />
                                            </div>
                                            <p className="text-[13px] font-medium text-text-main">
                                                {archivos.filter(f => f.type.startsWith('image/')).length >= 3
                                                    ? 'Límite de imágenes alcanzado. Clic aquí para adjuntar video (máx 1)'
                                                    : 'Haz clic o arrastra capturas y videos aquí'
                                                }
                                            </p>
                                        </div>
                                        {previews.length === 0 && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-dim">
                                                <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">PNG</span>
                                                <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">JPG</span>
                                                <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">WEBP</span>
                                                <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">MP4</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {previews.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-2.5">
                                        {previews.map((file, idx) => (
                                            <div 
                                                key={idx}
                                                onClick={() => setPreviewModalIndex(idx)}
                                                className="group border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg p-2 bg-white dark:bg-zinc-900/40 flex items-center gap-2 transition-all cursor-pointer select-none shadow-2xs"
                                                title="Clic para previsualizar"
                                            >
                                                <div className="w-8 h-8 rounded bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 relative">
                                                    {file.isVideo ? (
                                                        <Video className="w-4 h-4 text-text-dim" />
                                                    ) : (
                                                        <img src={file.url} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Eye className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-medium text-text-main truncate group-hover:text-blue-500 transition-colors">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-[9.5px] font-mono text-text-dim">
                                                        {file.size} • Ver
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveFile(idx);
                                                    }}
                                                    className="p-1 rounded text-text-dim hover:text-red-500 transition-colors cursor-pointer shrink-0"
                                                    title="Eliminar archivo"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Acciones */}
                {!isSuccess && (
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handleWhatsAppClick}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11.5px] font-medium transition-all cursor-pointer"
                        >
                            <span>WhatsApp</span>
                        </button>

                        <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-text-main text-[12px] font-medium h-8.5 px-3.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="feedback-drawer-form"
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center gap-1.5 bg-text-main text-white dark:text-black text-[12px] font-medium h-8.5 px-4 rounded-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/40 dark:border-black/40 border-t-white dark:border-t-black rounded-full animate-spin" />
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-3 h-3" />
                                        <span>{getSubmitLabel()}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* Panel Lateral Derecho (Drawer) de Previsualización de Adjuntos */}
            {previewModalIndex !== null && previews[previewModalIndex] && createPortal(
                <div 
                    className="fixed inset-0 z-[100000] flex justify-end"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Previsualización de adjunto"
                >
                    {/* Backdrop Blur Overlay */}
                    <div 
                        className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setPreviewModalIndex(null)}
                    />

                    {/* Panel Lateral Derecho */}
                    <div className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        
                        {/* Header del Drawer */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                {previews[previewModalIndex].isVideo ? (
                                    <Video className="w-4 h-4 text-blue-500 shrink-0" />
                                ) : (
                                    <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <h3 className="text-[13.5px] font-semibold text-text-main truncate">
                                        {previews[previewModalIndex].name}
                                    </h3>
                                    <p className="text-[11px] text-text-dim font-mono">
                                        {previews[previewModalIndex].size} {previews.length > 1 && `• ${previewModalIndex + 1} de ${previews.length}`}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewModalIndex(null)}
                                className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
                                title="Cerrar vista previa [ESC]"
                                aria-label="Cerrar panel"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body del Drawer */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-zinc-950 custom-scrollbar flex flex-col items-center justify-between">
                            
                            {/* Visualizador Multimedia Proporcional */}
                            <div className="relative w-full flex-1 flex items-center justify-center min-h-[300px] max-h-[60vh]">
                                {previews[previewModalIndex].isVideo ? (
                                    <video
                                        src={previews[previewModalIndex].url}
                                        controls
                                        autoPlay
                                        className="max-h-full max-w-full rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md object-contain bg-black"
                                    />
                                ) : (
                                    <img
                                        src={previews[previewModalIndex].url}
                                        alt={previews[previewModalIndex].name}
                                        className="max-h-full max-w-full rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md object-contain select-none bg-white dark:bg-zinc-950"
                                    />
                                )}

                                {/* Flechas Flotantes de Navegación */}
                                {previews.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewModalIndex(prev => prev !== null ? (prev > 0 ? prev - 1 : previews.length - 1) : null);
                                            }}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-text-main flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                            title="Anterior [←]"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewModalIndex(prev => prev !== null ? (prev < previews.length - 1 ? prev + 1 : 0) : null);
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-text-main flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                            title="Siguiente [→]"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Tira Inferior de Miniaturas para alternar */}
                            {previews.length > 1 && (
                                <div className="w-full flex items-center justify-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto custom-scrollbar shrink-0">
                                    {previews.map((p, pIdx) => (
                                        <button
                                            key={pIdx}
                                            type="button"
                                            onClick={() => setPreviewModalIndex(pIdx)}
                                            className={`h-14 w-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-white dark:bg-zinc-900 flex items-center justify-center ${
                                                pIdx === previewModalIndex
                                                    ? 'border-brand ring-2 ring-brand/20 scale-105 opacity-100 shadow-xs'
                                                    : 'border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100'
                                            }`}
                                            title={`Ver archivo ${pIdx + 1}`}
                                        >
                                            {p.isVideo ? (
                                                <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                                    <Video size={16} className="text-text-dim" />
                                                </div>
                                            ) : (
                                                <img src={p.url} alt="" className="w-full h-full object-cover select-none" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer del Drawer */}
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    handleRemoveFile(previewModalIndex);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-[12px] font-medium transition-colors cursor-pointer"
                            >
                                <Trash2 size={13} />
                                <span>Eliminar este archivo</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPreviewModalIndex(null)}
                                className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-text-main text-[12px] font-medium h-8.5 px-4 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                            >
                                Volver al formulario
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>,
        document.body
    );
};
