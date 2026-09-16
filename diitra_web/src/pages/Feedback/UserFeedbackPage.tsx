import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
    Bug, HelpCircle, CheckCircle2, 
    Clock, RefreshCw, ExternalLink, Image as ImageIcon, 
    Video, Plus, MessageSquare, X, ChevronLeft, ChevronRight, Play,
    Pencil, Trash2, AlertTriangle, Loader2
} from 'lucide-react';
import { 
    getMyFeedback, 
    getFeedbackMediaUrl, 
    updateUserFeedback, 
    deleteFeedback, 
    type FeedbackReporte, 
    type FeedbackAdjunto 
} from '../../services/feedbackService';
import { PageHeader } from '../../components/Common/PageHeader';

export const UserFeedbackPage: React.FC = () => {
    const [reportes, setReportes] = useState<FeedbackReporte[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Estado para el panel lateral derecho con soporte de carrusel de adjuntos
    const [activeReport, setActiveReport] = useState<FeedbackReporte | null>(null);
    const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);

    // Estados para Edición y Eliminación
    const [editingReport, setEditingReport] = useState<FeedbackReporte | null>(null);
    const [editTipo, setEditTipo] = useState<string>('ERROR');
    const [editTitulo, setEditTitulo] = useState<string>('');
    const [editDescripcion, setEditDescripcion] = useState<string>('');
    const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
    const [editError, setEditError] = useState<string | null>(null);

    const [deletingReport, setDeletingReport] = useState<FeedbackReporte | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const loadData = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const data = await getMyFeedback();
            setReportes(data);
            setActiveReport(prev => {
                if (!prev) return null;
                const prevId = prev.id_feedback || prev.idFeedback;
                return data.find(r => (r.id_feedback || r.idFeedback) === prevId) || prev;
            });
        } catch (err) {
            console.error('Error cargando incidencias del usuario:', err);
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Sincronización automática ante eventos de cambio de feedback
    useEffect(() => {
        const handleFeedbackChanged = () => loadData(true);
        window.addEventListener('diitra-feedback-changed', handleFeedbackChanged);

        return () => {
            window.removeEventListener('diitra-feedback-changed', handleFeedbackChanged);
        };
    }, [loadData]);

    const handleOpenDrawer = (report: FeedbackReporte, mediaIdx = 0) => {
        setActiveReport(report);
        setActiveMediaIndex(mediaIdx);
    };

    const handleCloseDrawer = () => {
        setActiveReport(null);
        setActiveMediaIndex(0);
    };

    // Soporte de navegación por teclado para el visor de capturas
    useEffect(() => {
        if (!activeReport) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseDrawer();
            } else if (e.key === 'ArrowLeft') {
                const total = activeReport.archivos?.length || 0;
                if (total > 1) {
                    setActiveMediaIndex(prev => (prev > 0 ? prev - 1 : total - 1));
                }
            } else if (e.key === 'ArrowRight') {
                const total = activeReport.archivos?.length || 0;
                if (total > 1) {
                    setActiveMediaIndex(prev => (prev < total - 1 ? prev + 1 : 0));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeReport]);

    const isEditable = (estado: string) => {
        const est = estado?.toUpperCase() || '';
        return est === 'PENDIENTE' || est === 'EN_ESPERA' || est === 'EN ESPERA';
    };

    const startEdit = (report: FeedbackReporte) => {
        setEditingReport(report);
        setEditTipo(report.tipo || 'ERROR');
        setEditTitulo(report.titulo || '');
        setEditDescripcion(report.descripcion || '');
        setEditError(null);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingReport) return;
        const id = editingReport.id_feedback || editingReport.idFeedback;
        if (!id) return;

        if (!editTitulo.trim() || !editDescripcion.trim()) {
            setEditError('El título y la descripción son obligatorios.');
            return;
        }

        setIsSavingEdit(true);
        setEditError(null);
        try {
            const updated = await updateUserFeedback(id, {
                tipo: editTipo,
                titulo: editTitulo.trim(),
                descripcion: editDescripcion.trim()
            });

            setReportes(prev => prev.map(r => {
                const rId = r.id_feedback || r.idFeedback;
                return rId === id ? { ...r, ...updated } : r;
            }));

            if (activeReport && (activeReport.id_feedback || activeReport.idFeedback) === id) {
                setActiveReport(prev => prev ? { ...prev, ...updated } : null);
            }

            setEditingReport(null);
            window.dispatchEvent(new CustomEvent('diitra-feedback-changed'));
        } catch (err: any) {
            console.error('Error al editar reporte:', err);
            setEditError(err.response?.data?.message || 'Error al guardar los cambios del reporte.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const confirmDelete = async () => {
        if (!deletingReport) return;
        const id = deletingReport.id_feedback || deletingReport.idFeedback;
        if (!id) return;

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await deleteFeedback(id);
            setReportes(prev => prev.filter(r => (r.id_feedback || r.idFeedback) !== id));
            if (activeReport && (activeReport.id_feedback || activeReport.idFeedback) === id) {
                setActiveReport(null);
            }
            setDeletingReport(null);
            window.dispatchEvent(new CustomEvent('diitra-feedback-changed'));
        } catch (err: any) {
            console.error('Error al eliminar reporte:', err);
            setDeleteError(err.response?.data?.message || 'Error al eliminar el reporte.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Bloquear scroll de fondo y navegación por teclado (ESC y flechas)
    useEffect(() => {
        const isAnyOpen = activeReport || editingReport || deletingReport;
        if (!isAnyOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (deletingReport) {
                    if (!isDeleting) setDeletingReport(null);
                } else if (editingReport) {
                    if (!isSavingEdit) setEditingReport(null);
                } else if (activeReport) {
                    handleCloseDrawer();
                }
            } else if (e.key === 'ArrowLeft' && activeReport) {
                const totalMedia = activeReport.archivos?.length || 0;
                if (totalMedia > 1) {
                    e.preventDefault();
                    setActiveMediaIndex(prev => (prev > 0 ? prev - 1 : totalMedia - 1));
                }
            } else if (e.key === 'ArrowRight' && activeReport) {
                const totalMedia = activeReport.archivos?.length || 0;
                if (totalMedia > 1) {
                    e.preventDefault();
                    setActiveMediaIndex(prev => (prev < totalMedia - 1 ? prev + 1 : 0));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeReport, editingReport, deletingReport, isDeleting, isSavingEdit]);

    const handleOpenModal = () => {
        window.dispatchEvent(new CustomEvent('diitra-open-feedback'));
    };

    const getTipoBadge = (tipo: string) => {
        switch (tipo) {
            case 'ERROR':
                return (
                    <span className="text-red-500 font-semibold text-[12.5px] flex items-center gap-1.5">
                        <Bug className="w-3.5 h-3.5 text-red-500" />
                        <span>Algo no funciona</span>
                    </span>
                );
            case 'DUDA':
                return (
                    <span className="text-amber-500 font-semibold text-[12.5px] flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Falta una opción</span>
                    </span>
                );
            default:
                return <span className="text-text-dim text-[12px] font-medium">{tipo}</span>;
        }
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE':
                return (
                    <span className="text-amber-500 font-semibold text-[12px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                        <span>En espera</span>
                    </span>
                );
            case 'EN_REVISION':
                return (
                    <span className="text-blue-500 font-semibold text-[12px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                        <span>En revisión</span>
                    </span>
                );
            case 'ATENDIDO':
                return (
                    <span className="text-emerald-500 font-semibold text-[12px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        <span>Resuelto</span>
                    </span>
                );
            case 'DESCARTADO':
                return (
                    <span className="text-text-dim font-semibold text-[12px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-text-dim inline-block"></span>
                        <span>Cerrado</span>
                    </span>
                );
            default:
                return <span className="text-text-dim text-[12px] font-medium">{estado}</span>;
        }
    };

    const getEstadoLabel = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE': return 'En espera';
            case 'EN_REVISION': return 'En revisión';
            case 'ATENDIDO': return 'Resuelto';
            case 'DESCARTADO': return 'Cerrado';
            default: return estado;
        }
    };

    const activeFiles = activeReport?.archivos || [];
    const currentMedia: FeedbackAdjunto | null = activeFiles.length > 0 ? activeFiles[activeMediaIndex] || activeFiles[0] : null;
    const isCurrentVideo = Boolean(currentMedia && (currentMedia.tipo_mime || currentMedia.tipoMime || '').startsWith('video/'));
    const currentMediaUrl = currentMedia ? getFeedbackMediaUrl(currentMedia.url) : '';

    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">
            {/* Header */}
            <PageHeader
                kicker="Atención y Soporte · DIITRA"
                icon={MessageSquare}
                title="Buzón de Incidencias"
                description="Canal directo para reportar fallos en el sistema, pantallas colgadas o datos y opciones faltantes en la plataforma."
            >
                <button
                    onClick={handleOpenModal}
                    className="btn-vercel-primary w-full lg:w-auto shrink-0 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                    <Plus size={14} strokeWidth={3} />
                    <span>Reportar Incidencia</span>
                </button>
            </PageHeader>

            {/* Main Content: Full Width Container */}
            <div className="space-y-4 animate-fade-up [animation-delay:100ms] relative z-10">
                {/* Listado de Mis Incidencias o Empty State */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-dim bento-card static">
                        <RefreshCw size={24} className="animate-spin text-brand" />
                        <span className="text-xs font-bold uppercase tracking-widest">Cargando tus incidencias...</span>
                    </div>
                ) : reportes.length === 0 ? (
                    <div className="empty-state py-20 bg-surface">
                        <div className="icon-circle icon-circle-brand !p-4 mb-4">
                            <MessageSquare size={36} strokeWidth={1.5} />
                        </div>
                        <p className="text-text-main font-bold uppercase tracking-widest text-sm">No tienes incidencias registradas</p>
                        <p className="text-text-dim text-xs mt-2 max-w-md">
                            Si encuentras algo que no funciona bien, una pantalla que se queda colgada o un dato que no puedes ingresar, repórtalo aquí para revisarlo.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reportes.map(r => {
                            const id = r.id_feedback || r.idFeedback || 0;
                            const fecha = r.fecha_creacion || r.fechaCreacion;
                            const observacion = r.observacion_admin || r.observacionAdmin;
                            const formattedDate = fecha ? new Date(fecha).toLocaleString('es-EC', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            }) : '';

                            return (
                                <div
                                    key={r.uuid || id}
                                    className="bento-card static p-5 space-y-4"
                                >
                                    {/* Encabezado de la Tarjeta */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-thin pb-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getTipoBadge(r.tipo)}
                                        </div>

                                        {/* Estado Visual sin fondo y Acciones */}
                                        <div className="flex items-center gap-3">
                                            {getEstadoBadge(r.estado)}
                                            {isEditable(r.estado) && (
                                                <div className="flex items-center gap-1.5 pl-2.5 border-l border-border-thin">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(r)}
                                                        className="w-8 h-8 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Editar reporte"
                                                        aria-label="Editar reporte"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingReport(r)}
                                                        className="w-8 h-8 rounded-lg text-text-dim hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Eliminar reporte"
                                                        aria-label="Eliminar reporte"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contenido Principal: Texto a la izquierda y Miniaturas al lado derecho */}
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <h3 className="text-[14.5px] font-semibold text-text-main">
                                                {r.titulo}
                                            </h3>
                                            <p className="text-[13px] text-text-dim whitespace-pre-wrap leading-relaxed">
                                                {r.descripcion}
                                            </p>

                                            {/* Respuesta del Equipo de Soporte */}
                                            {observacion && (
                                                <div className="p-3.5 rounded-lg border border-brand/20 bg-brand/5 space-y-1.5 mt-2">
                                                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-brand">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>Respuesta de Soporte:</span>
                                                    </div>
                                                    <p className="text-[12.5px] text-text-main leading-relaxed pl-5">
                                                        {observacion}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Miniaturas Visuales de Adjuntos al lado derecho */}
                                        {r.archivos && r.archivos.length > 0 && (
                                            <div className="flex items-center gap-2.5 shrink-0 self-start flex-wrap md:flex-nowrap">
                                                {r.archivos.map((adj, idx) => {
                                                    const isVideo = (adj.tipo_mime || adj.tipoMime || '').startsWith('video/');
                                                    const mediaUrl = getFeedbackMediaUrl(adj.url);
                                                    const fileName = adj.nombre_original || adj.nombreOriginal || 'Adjunto';

                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => handleOpenDrawer(r, idx)}
                                                            className="h-20 sm:h-24 rounded-lg overflow-hidden border border-border-thin hover:border-text-main/70 transition-colors group relative cursor-pointer inline-flex items-center justify-center p-0 bg-transparent shrink-0"
                                                            title={fileName}
                                                        >
                                                            {isVideo ? (
                                                                <div className="relative h-full flex items-center justify-center">
                                                                    <video 
                                                                        src={mediaUrl} 
                                                                        className="h-full w-auto max-w-[160px] object-contain block" 
                                                                        muted 
                                                                        preload="metadata"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                                                        <div className="w-6 h-6 rounded-full bg-surface/90 border border-border-thin flex items-center justify-center text-text-main shadow-sm">
                                                                            <Play size={10} className="ml-0.5" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-white text-[8px] font-mono">
                                                                        VIDEO
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <img 
                                                                    src={mediaUrl} 
                                                                    alt={fileName} 
                                                                    className="h-full w-auto max-w-[160px] object-contain block" 
                                                                    loading="lazy"
                                                                />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer con fecha y módulo */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-text-dim border-t border-border-thin">
                                        <div className="flex items-center gap-3">
                                            {r.ruta_origen && (
                                                <span>Pantalla: <code className="px-1.5 py-0.5 rounded bg-accents-1 text-text-main font-mono text-[10.5px]">{r.ruta_origen}</code></span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-text-dim" />
                                            <span className="font-mono text-[10.5px]">{formattedDate}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Panel Lateral Derecho: Visor Multimedia (Limpio, sin clonar la tarjeta ni botones externos) */}
            {activeReport && currentMedia && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex justify-end"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Visor de adjuntos: ${currentMedia.nombre_original || 'Captura'}`}
                >
                    {/* Backdrop Blur Overlay */}
                    <div 
                        className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={handleCloseDrawer}
                    />

                    {/* Panel Lateral Derecho */}
                    <div className="relative w-full max-w-xl sm:max-w-2xl h-full bg-white dark:bg-zinc-950 border-l border-border-thin shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        {/* Header del Panel */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-white dark:bg-zinc-950 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0 pr-4">
                                <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                    {isCurrentVideo ? <Video size={15} /> : <ImageIcon size={15} />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-[14.5px] font-bold text-text-main tracking-tight truncate">
                                        {isCurrentVideo ? 'Video Adjunto' : 'Captura Adjunta'}
                                    </h3>
                                    {activeFiles.length > 1 && (
                                        <p className="text-[11px] font-mono text-text-dim">
                                            Archivo {activeMediaIndex + 1} de {activeFiles.length}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseDrawer}
                                className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
                                title="Cerrar [ESC]"
                                aria-label="Cerrar visor"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body del Panel: Visualizador de Imagen / Video en fondo blanco (modo claro) y gris/oscuro (modo oscuro) */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between gap-4 bg-white dark:bg-zinc-950 custom-scrollbar">
                            {/* Visualizador Principal */}
                            <div className="relative flex-1 flex items-center justify-center min-h-[320px] rounded-xl border border-border-thin bg-white dark:bg-zinc-900/50 p-3 overflow-hidden shadow-xs">
                                {isCurrentVideo ? (
                                    <video 
                                        src={currentMediaUrl} 
                                        controls 
                                        autoPlay 
                                        className="max-h-[58vh] w-auto max-w-full rounded-lg object-contain" 
                                    />
                                ) : (
                                    <img 
                                        src={currentMediaUrl} 
                                        alt={currentMedia.nombre_original || 'Captura'} 
                                        className="max-h-[58vh] w-auto max-w-full rounded-lg object-contain select-none" 
                                    />
                                )}

                                {/* Flechas de navegación del carrusel */}
                                {activeFiles.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMediaIndex(prev => (prev > 0 ? prev - 1 : activeFiles.length - 1));
                                            }}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-border-thin text-text-main flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                            title="Anterior [←]"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMediaIndex(prev => (prev < activeFiles.length - 1 ? prev + 1 : 0));
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-border-thin text-text-main flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                            title="Siguiente [→]"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Tira inferior de miniaturas si hay más de 1 adjunto */}
                            {activeFiles.length > 1 && (
                                <div className="space-y-1.5 pt-1 shrink-0">
                                    <span className="text-[11px] font-mono text-text-dim uppercase tracking-wider font-semibold">
                                        Miniaturas ({activeFiles.length})
                                    </span>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scrollbar">
                                        {activeFiles.map((f, fIdx) => {
                                            const isV = (f.tipo_mime || f.tipoMime || '').startsWith('video/');
                                            const u = getFeedbackMediaUrl(f.url);
                                            const isSelected = fIdx === activeMediaIndex;

                                            return (
                                                <button
                                                    key={fIdx}
                                                    type="button"
                                                    onClick={() => setActiveMediaIndex(fIdx)}
                                                    className={`h-16 w-auto min-w-[54px] rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer relative bg-white dark:bg-zinc-900 ${
                                                        isSelected ? 'border-brand ring-2 ring-brand/20 scale-105' : 'border-border-thin opacity-70 hover:opacity-100'
                                                    }`}
                                                    title={f.nombre_original || 'Adjunto'}
                                                >
                                                    {isV ? (
                                                        <div className="w-full h-full flex items-center justify-center p-2 text-text-dim">
                                                            <Video size={16} />
                                                        </div>
                                                    ) : (
                                                        <img src={u} alt={f.nombre_original} className="h-full w-auto object-contain" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Nombre del archivo original */}
                            <div className="text-[11.5px] font-mono text-text-dim truncate px-1 shrink-0">
                                Archivo: <span className="text-text-main font-medium">{currentMedia.nombre_original || 'Sin nombre'}</span>
                            </div>
                        </div>

                        {/* Footer del Panel */}
                        <div className="p-4 border-t border-border-thin bg-white dark:bg-zinc-950 shrink-0 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={handleCloseDrawer}
                                className="btn-vercel-primary text-[12px] font-medium px-4 py-1.5 cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}

            {/* Panel Lateral Derecho (Drawer Vercel Geist) de Edición */}
            {editingReport && createPortal(
                <div
                    className="fixed inset-0 z-[10000] flex justify-end"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-feedback-title"
                >
                    {/* Backdrop Blur Overlay */}
                    <div 
                        className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => !isSavingEdit && setEditingReport(null)}
                    />

                    {/* Panel Lateral Derecho */}
                    <div className="relative w-full max-w-lg sm:max-w-xl h-full bg-white dark:bg-zinc-950 border-l border-border-thin shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        {/* Header del Drawer */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-white dark:bg-zinc-950 shrink-0">
                            <div className="flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-brand" />
                                <h3 id="edit-feedback-title" className="text-[15px] font-bold text-text-main tracking-tight">
                                    Editar Incidencia
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingReport(null)}
                                disabled={isSavingEdit}
                                className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                                aria-label="Cerrar panel"
                                title="Cerrar [ESC]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body del Drawer con Scroll */}
                        <form id="edit-feedback-form" onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-zinc-950 custom-scrollbar">
                            {editError && (
                                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2.5">
                                    <AlertTriangle size={16} className="shrink-0" />
                                    <span className="font-medium">{editError}</span>
                                </div>
                            )}

                            {/* Selector de tipo - Vercel Choice Cards */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-text-dim uppercase tracking-wider block">
                                    Tipo de incidencia
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {[
                                        {
                                            value: 'ERROR',
                                            label: 'Algo no funciona',
                                            desc: 'Error, pantalla rota o bloqueo al guardar.',
                                            icon: Bug,
                                            activeColor: 'text-red-500',
                                            activeBorder: 'border-red-500',
                                            activeBg: 'bg-white dark:bg-red-950/20',
                                            activeText: 'text-red-600 dark:text-red-400',
                                            activeDesc: 'text-text-main/80',
                                            activeRadio: 'border-red-500 bg-red-500'
                                        },
                                        {
                                            value: 'DUDA',
                                            label: 'Falta una opción',
                                            desc: 'Falta un campo, opción o dato en el formulario.',
                                            icon: HelpCircle,
                                            activeColor: 'text-amber-500',
                                            activeBorder: 'border-amber-500',
                                            activeBg: 'bg-white dark:bg-amber-950/20',
                                            activeText: 'text-amber-600 dark:text-amber-400',
                                            activeDesc: 'text-text-main/80',
                                            activeRadio: 'border-amber-500 bg-amber-500'
                                        },
                                    ].map(t => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setEditTipo(t.value)}
                                            className={`group p-3 rounded-lg border text-left transition-all cursor-pointer outline-none focus:outline-none ${
                                                editTipo === t.value
                                                    ? `${t.activeBorder} ${t.activeBg} shadow-xs`
                                                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <t.icon size={16} className={editTipo === t.value ? t.activeColor : 'text-text-dim'} />
                                                    <span className={`text-[12.5px] font-semibold ${editTipo === t.value ? t.activeText : 'text-text-dim group-hover:text-text-main'}`}>
                                                        {t.label}
                                                    </span>
                                                </div>
                                                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                                    editTipo === t.value
                                                        ? t.activeRadio
                                                        : 'border-zinc-200 dark:border-zinc-700 group-hover:border-text-dim'
                                                }`}>
                                                    {editTipo === t.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </span>
                                            </div>
                                            <p className={`text-[11px] leading-snug ${editTipo === t.value ? t.activeDesc : 'text-text-dim'}`}>
                                                {t.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Título */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-text-dim uppercase tracking-wider block">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    value={editTitulo}
                                    onChange={(e) => setEditTitulo(e.target.value)}
                                    placeholder="Breve resumen del problema o incidencia..."
                                    required
                                    className="w-full px-3.5 py-2.5 text-[13px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-text-main focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors shadow-2xs"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-text-dim uppercase tracking-wider block">
                                    Descripción detallada
                                </label>
                                <textarea
                                    value={editDescripcion}
                                    onChange={(e) => setEditDescripcion(e.target.value)}
                                    placeholder="Explica qué estabas haciendo y qué problema ocurrió..."
                                    rows={6}
                                    required
                                    className="w-full px-3.5 py-2.5 text-[13px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-text-main focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors resize-none custom-scrollbar leading-relaxed shadow-2xs"
                                />
                            </div>

                            {/* Adjuntos Existentes de Referencia (si los hay) */}
                            {editingReport.archivos && editingReport.archivos.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-border-thin">
                                    <span className="text-[11px] font-mono font-semibold text-text-dim uppercase tracking-wider block">
                                        Archivos adjuntos ({editingReport.archivos.length})
                                    </span>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                        {editingReport.archivos.map((adj, aIdx) => {
                                            const isV = (adj.tipo_mime || adj.tipoMime || '').startsWith('video/');
                                            const u = getFeedbackMediaUrl(adj.url);
                                            return (
                                                <div key={aIdx} className="h-16 w-auto min-w-[56px] rounded-lg overflow-hidden border border-border-thin shrink-0 bg-white dark:bg-zinc-900 flex items-center justify-center">
                                                    {isV ? (
                                                        <Video size={16} className="text-text-dim" />
                                                    ) : (
                                                        <img src={u} alt={adj.nombre_original} className="h-full w-auto object-contain" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Footer del Drawer con Botones de Acción */}
                        <div className="p-4 px-6 border-t border-border-thin bg-white dark:bg-zinc-950 shrink-0 flex items-center justify-between">
                            <span className="text-[11px] text-text-dim font-mono">
                                Estado: <strong>En espera</strong>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingReport(null)}
                                    disabled={isSavingEdit}
                                    className="btn-vercel-secondary text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    form="edit-feedback-form"
                                    disabled={isSavingEdit || !editTitulo.trim() || !editDescripcion.trim()}
                                    className="btn-vercel-primary text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {isSavingEdit && <Loader2 size={12} className="animate-spin" />}
                                    <span>Guardar cambios</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Panel Lateral Derecho (Drawer Vercel Geist) de Confirmación de Eliminación */}
            {deletingReport && createPortal(
                <div
                    className="fixed inset-0 z-[10000] flex justify-end"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-feedback-title"
                >
                    {/* Backdrop Blur Overlay */}
                    <div 
                        className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => !isDeleting && setDeletingReport(null)}
                    />

                    {/* Panel Lateral Derecho */}
                    <div className="relative w-full max-w-md sm:max-w-lg h-full bg-white dark:bg-zinc-950 border-l border-border-thin shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        {/* Header del Drawer */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-white dark:bg-zinc-950 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                                    <Trash2 size={15} />
                                </div>
                                <h3 id="delete-feedback-title" className="text-[15px] font-bold text-text-main tracking-tight">
                                    Eliminar Incidencia
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeletingReport(null)}
                                disabled={isDeleting}
                                className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                                aria-label="Cerrar panel"
                                title="Cerrar [ESC]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body del Drawer */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-zinc-950 custom-scrollbar">
                            {/* Alerta Destructiva */}
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                                <div className="flex items-center gap-2 text-red-500 font-semibold text-xs uppercase tracking-wider">
                                    <AlertTriangle size={15} />
                                    <span>Acción irreversible</span>
                                </div>
                                <p className="text-xs text-text-dim leading-relaxed">
                                    ¿Estás seguro de que deseas eliminar esta incidencia? Se borrarán permanentemente sus datos y los archivos adjuntos asociados.
                                </p>
                            </div>

                            {/* Ficha Resumen del Reporte */}
                            <div className="bento-card static p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    {getTipoBadge(deletingReport.tipo)}
                                    <span className="text-[11px] font-mono text-text-dim">
                                        Estado: <strong className="text-text-main">En espera</strong>
                                    </span>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <h4 className="text-[14px] font-bold text-text-main">
                                        {deletingReport.titulo}
                                    </h4>
                                    <p className="text-[12.5px] text-text-dim line-clamp-4 leading-relaxed">
                                        {deletingReport.descripcion}
                                    </p>
                                </div>

                                {deletingReport.archivos && deletingReport.archivos.length > 0 && (
                                    <div className="pt-2.5 border-t border-border-thin space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-mono text-text-dim">
                                            <span>Archivos adjuntos:</span>
                                            <span className="text-text-main font-semibold">
                                                {deletingReport.archivos.length} {deletingReport.archivos.length === 1 ? 'archivo' : 'archivos'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
                                            {deletingReport.archivos.map((adj, idx) => {
                                                const isVideo = (adj.tipo_mime || adj.tipoMime || '').startsWith('video/');
                                                const mediaUrl = getFeedbackMediaUrl(adj.url);
                                                const fileName = adj.nombre_original || adj.nombreOriginal || 'Adjunto';

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="h-16 w-auto min-w-[54px] rounded-lg overflow-hidden border border-border-thin bg-white dark:bg-zinc-900 shrink-0 relative flex items-center justify-center p-0.5"
                                                        title={fileName}
                                                    >
                                                        {isVideo ? (
                                                            <div className="w-full h-full flex items-center justify-center p-2 text-text-dim">
                                                                <Video size={16} />
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={mediaUrl}
                                                                alt={fileName}
                                                                className="h-full w-auto object-contain rounded"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {deleteError && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
                                    {deleteError}
                                </div>
                            )}
                        </div>

                        {/* Footer del Drawer */}
                        <div className="p-4 px-6 border-t border-border-thin bg-white dark:bg-zinc-950 shrink-0 flex items-center justify-between">
                            <span className="text-[11px] text-text-dim font-mono">
                                Confirmar eliminación
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingReport(null)}
                                    disabled={isDeleting}
                                    className="btn-vercel-secondary text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                                >
                                    {isDeleting && <Loader2 size={12} className="animate-spin" />}
                                    <span>Sí, eliminar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </main>
    );
};
