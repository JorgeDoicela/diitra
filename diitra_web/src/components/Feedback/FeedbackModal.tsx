import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Send, Lightbulb, Bug, HelpCircle, 
    UploadCloud, Trash2, Image as ImageIcon, Video, CheckCircle2, 
    ExternalLink, AlertCircle, Info
} from 'lucide-react';
import { useAuth } from '../../api/AuthContext';
import { useLocation } from 'react-router-dom';
import { getSupportConfig, sendFeedback, type SupportConfig } from '../../services/feedbackService';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FeedbackType = 'SUGERENCIA' | 'ERROR' | 'DUDA';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const { user, roleDisplayName } = useAuth();
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tipo, setTipo] = useState<FeedbackType>('SUGERENCIA');
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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // Bloquear scroll de fondo
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Tecla Escape para cerrar y Cmd/Ctrl+Enter para enviar
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                const form = document.getElementById('feedback-drawer-form') as HTMLFormElement | null;
                if (form) form.requestSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            getSupportConfig().then(cfg => {
                if (cfg) setSupportConfig(cfg);
            });
            setIsSuccess(false);
            setErrorMessage(null);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            previews.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, [previews]);

    if (!isOpen) return null;

    const maxImgBytes = supportConfig.maxImageSizeBytes || supportConfig.max_image_size_bytes || 5 * 1024 * 1024;
    const maxVidBytes = supportConfig.maxVideoSizeBytes || supportConfig.max_video_size_bytes || 15 * 1024 * 1024;
    const whatsAppNum = supportConfig.whatsAppNumber || supportConfig.whats_app_number || '593969677280';

    const formatBytes = (bytes: number): string => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const processFiles = (selectedFiles: File[]) => {
        setErrorMessage(null);
        if (selectedFiles.length === 0) return;

        const currentImages = archivos.filter(f => f.type.startsWith('image/'));
        const currentVideos = archivos.filter(f => f.type.startsWith('video/'));

        const newFilesToAdd: File[] = [];
        const newPreviewsToAdd: { name: string; url: string; isVideo: boolean; size: string }[] = [];

        for (const file of selectedFiles) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (!isImage && !isVideo) {
                setErrorMessage(`El archivo "${file.name}" no es una imagen ni un video válido.`);
                continue;
            }

            if (isImage) {
                if (currentImages.length + newFilesToAdd.filter(f => f.type.startsWith('image/')).length >= 3) {
                    setErrorMessage('Solo puedes adjuntar hasta 3 imágenes.');
                    break;
                }
                if (file.size > maxImgBytes) {
                    setErrorMessage(`La imagen "${file.name}" (${formatBytes(file.size)}) supera el límite de ${formatBytes(maxImgBytes)}.`);
                    continue;
                }
            }

            if (isVideo) {
                if (currentVideos.length + newFilesToAdd.filter(f => f.type.startsWith('video/')).length >= 1) {
                    setErrorMessage('Solo puedes adjuntar hasta 1 clip de video.');
                    break;
                }
                if (file.size > maxVidBytes) {
                    setErrorMessage(`El video "${file.name}" (${formatBytes(file.size)}) supera el límite de ${formatBytes(maxVidBytes)}.`);
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
    };

    const handleWhatsAppClick = () => {
        const nombre = user?.nombre_completo || 'Usuario';
        const cedula = user?.id_referencia || '';
        const rol = roleDisplayName || 'Usuario';
        const ruta = location.pathname;

        const lines = [
            `*Soporte DIITRA (v1.0)*`,
            `Usuario: ${nombre} ${cedula ? `(${cedula})` : ''}`,
            `Rol: ${rol}`,
            `Modulo: ${ruta}`,
            tipo ? `Tipo: ${tipo}` : '',
            titulo ? `Asunto: ${titulo}` : '',
            descripcion ? `Detalle: ${descripcion}` : ''
        ].filter(Boolean);

        const text = encodeURIComponent(lines.join('\n'));
        const url = `https://wa.me/${whatsAppNum}?text=${text}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!titulo.trim()) {
            setErrorMessage('Ingresa un título para tu sugerencia o reporte.');
            return;
        }

        if (!descripcion.trim()) {
            setErrorMessage('Ingresa la descripción detallada.');
            return;
        }

        setIsSubmitting(true);

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
                setTitulo('');
                setDescripcion('');
                setArchivos([]);
                setPreviews([]);
                setIsSuccess(false);
            }, 2000);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al enviar el reporte. Puedes contactar por WhatsApp.';
            setErrorMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSubmitLabel = () => {
        switch (tipo) {
            case 'ERROR': return 'Reportar Problema';
            case 'DUDA': return 'Reportar Opción Faltante';
            case 'SUGERENCIA': return 'Enviar Sugerencia';
        }
    };

    const getTitlePlaceholder = () => {
        switch (tipo) {
            case 'ERROR': return 'Ej: El botón de guardar no responde / La pantalla se queda en blanco...';
            case 'DUDA': return 'Ej: No me permite ingresar mi teléfono / Falta el campo de coautor...';
            case 'SUGERENCIA': return 'Ej: Sería útil poder ordenar la lista por fecha...';
        }
    };

    const getDescPlaceholder = () => {
        switch (tipo) {
            case 'ERROR': return 'Describe qué estabas intentando hacer, en qué pantalla ocurrió y qué problema apareció...';
            case 'DUDA': return 'Indica qué dato u opción consideras que hace falta o no te permite completar tu registro...';
            case 'SUGERENCIA': return 'Describe tu idea para mejorar esta sección...';
        }
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Buzón de Incidencias y Sugerencias DIITRA"
        >
            {/* Backdrop Blur Overlay */}
            <div 
                className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={onClose}
            />

            {/* Panel Lateral Derecho (Drawer Vercel Geist Oficial) */}
            <div className="relative w-full max-w-lg md:max-w-xl h-full bg-surface border-l border-border-thin shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
                
                {/* Header Institucional Limpio */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[14px] font-semibold text-text-main tracking-tight">
                            Buzón de Incidencias y Sugerencias
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        title="Cerrar [ESC]"
                        aria-label="Cerrar panel"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body: Contenido con scroll vertical */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-surface custom-scrollbar">
                    {/* Banner Informativo Sin Tecnicismos */}
                    <div className="p-3.5 rounded-xl bg-surface-hover/60 border border-border-thin flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                        <p className="text-[12px] text-text-dim leading-relaxed">
                            <strong className="font-semibold text-text-main">¿Encontraste un problema?</strong> Si algo no funciona bien, una pantalla se queda colgada, falta un dato o tienes una idea de mejora, repórtalo aquí para revisarlo. <span className="text-text-dim/80">(Para aprender a usar el sistema, por favor consulta el botón de Ayuda).</span>
                        </p>
                    </div>

                    {isSuccess ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
                            <div className="w-12 h-12 rounded-full bg-surface-hover border border-border-thin flex items-center justify-center text-emerald-500">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-[14.5px] font-semibold text-text-main">
                                Reporte recibido con éxito
                            </h3>
                            <p className="text-[12px] text-text-dim max-w-xs leading-relaxed">
                                El reporte ha sido registrado para ser revisado y corregido. Podrás ver el avance y la respuesta en esta misma sección.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} id="feedback-drawer-form" className="space-y-4">
                            {/* Segmented Control - Vercel Tabs Style */}
                            <div>
                                <label className="block text-[11px] font-mono font-semibold text-text-dim uppercase tracking-wider mb-2">
                                    ¿De qué se trata?
                                </label>
                                <div className="p-1 bg-surface-hover rounded-xl border border-border-thin grid grid-cols-3 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setTipo('ERROR')}
                                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] transition-all cursor-pointer ${
                                            tipo === 'ERROR'
                                                ? 'bg-surface text-text-main font-semibold shadow-xs border border-border-thin'
                                                : 'text-text-dim hover:text-text-main font-medium'
                                        }`}
                                    >
                                        <Bug className="w-3.5 h-3.5" />
                                        <span>Algo no funciona</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTipo('DUDA')}
                                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] transition-all cursor-pointer ${
                                            tipo === 'DUDA'
                                                ? 'bg-surface text-text-main font-semibold shadow-xs border border-border-thin'
                                                : 'text-text-dim hover:text-text-main font-medium'
                                        }`}
                                    >
                                        <HelpCircle className="w-3.5 h-3.5" />
                                        <span>Falta una opción</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTipo('SUGERENCIA')}
                                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] transition-all cursor-pointer ${
                                            tipo === 'SUGERENCIA'
                                                ? 'bg-surface text-text-main font-semibold shadow-xs border border-border-thin'
                                                : 'text-text-dim hover:text-text-main font-medium'
                                        }`}
                                    >
                                        <Lightbulb className="w-3.5 h-3.5" />
                                        <span>Idea o sugerencia</span>
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
                                    onChange={e => setTitulo(e.target.value)}
                                    placeholder={getTitlePlaceholder()}
                                    className="w-full px-3.5 py-2 text-[13px] bg-surface border border-border-thin rounded-lg text-text-main placeholder:text-text-dim/50 focus:border-text-main focus:outline-none transition-colors"
                                    maxLength={200}
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-[11px] font-mono font-semibold text-text-dim uppercase tracking-wider mb-1.5">
                                    Detalle del reporte
                                </label>
                                <textarea
                                    value={descripcion}
                                    onChange={e => setDescripcion(e.target.value)}
                                    placeholder={getDescPlaceholder()}
                                    rows={5}
                                    className="w-full px-3.5 py-2 text-[13px] bg-surface border border-border-thin rounded-lg text-text-main placeholder:text-text-dim/50 focus:border-text-main focus:outline-none transition-colors resize-none"
                                />
                            </div>

                            {/* Adjuntos / Drag & Drop Dropzone */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11px] font-mono font-semibold text-text-dim uppercase tracking-wider">
                                        Capturas o videos (Opcional)
                                    </label>
                                    <span className="text-[10.5px] font-mono text-text-dim">
                                        Máx. 3 img (5MB) • 1 video (15MB)
                                    </span>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                                    onDragLeave={() => setIsDraggingOver(false)}
                                    onDrop={handleDrop}
                                    className={`border border-dashed rounded-xl py-8 px-4 transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer text-center ${
                                        isDraggingOver 
                                            ? 'border-blue-500 bg-blue-500/5 scale-[0.99]' 
                                            : 'border-border-thin hover:border-text-dim/60 bg-surface-hover/30 hover:bg-surface-hover/60'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-surface border border-border-thin flex items-center justify-center text-text-dim shadow-xs">
                                        <UploadCloud className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-medium text-text-main">
                                            Haz clic o arrastra capturas y videos aquí
                                        </p>
                                        <p className="text-[11px] text-text-dim">
                                            Formatos de imagen y video admitidos
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-dim mt-1">
                                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border-thin">PNG</span>
                                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border-thin">JPG</span>
                                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border-thin">WEBP</span>
                                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border-thin">MP4</span>
                                    </div>
                                </div>

                                {previews.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        {previews.map((file, idx) => (
                                            <div 
                                                key={idx}
                                                className="border border-border-thin rounded-lg p-2 bg-surface-hover/50 flex items-center gap-2"
                                            >
                                                <div className="w-8 h-8 rounded bg-surface flex items-center justify-center shrink-0 overflow-hidden border border-border-thin">
                                                    {file.isVideo ? (
                                                        <Video className="w-4 h-4 text-text-dim" />
                                                    ) : (
                                                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-medium text-text-main truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-[9.5px] font-mono text-text-dim">
                                                        {file.size}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveFile(idx);
                                                    }}
                                                    className="p-1 rounded text-text-dim hover:text-text-main transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Alerta de Error */}
                            {errorMessage && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[12px] flex items-center gap-2 animate-fade-in">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* Footer Acciones */}
                {!isSuccess && (
                    <div className="p-4 border-t border-border-thin bg-surface shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handleWhatsAppClick}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11.5px] font-medium transition-all cursor-pointer"
                        >
                            <span>WhatsApp Directo</span>
                            <ExternalLink className="w-3 h-3" />
                        </button>

                        <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="border border-border-thin bg-surface text-text-main text-[12px] font-medium h-8.5 px-3.5 rounded-lg hover:bg-surface-hover transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="feedback-drawer-form"
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center gap-1.5 bg-text-main text-surface text-[12px] font-medium h-8.5 px-4 rounded-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-surface/40 border-t-surface rounded-full animate-spin" />
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
        </div>,
        document.body
    );
};
