import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    Lightbulb, Bug, HelpCircle, 
    Clock, RefreshCw, Filter, ExternalLink, 
    Video, MessageSquare, X, ChevronLeft, ChevronRight, Play,
    CheckCircle2, Monitor, Wifi,
    Save, Send, Trash2, AlertTriangle, Loader2
} from 'lucide-react';
import { 
    getAllFeedback, updateFeedbackStatus, deleteFeedback, getFeedbackMediaUrl, 
    type FeedbackReporte, type FeedbackAdjunto 
} from '../../../services/feedbackService';
import { PageHeader } from '../../../components/Common/PageHeader';
import { GeistSelect } from '../../../components/Common/GeistSelect';

const TIPO_OPTIONS = [
    { value: 'TODOS', label: 'Todos los tipos' },
    { value: 'ERROR', label: 'Algo no funciona' },
    { value: 'DUDA', label: 'Falta una opción' },
    { value: 'SUGERENCIA', label: 'Ideas o sugerencias' }
];

const ESTADO_OPTIONS = [
    { value: 'TODOS', label: 'Todos los estados' },
    { value: 'PENDIENTE', label: 'En espera' },
    { value: 'EN_REVISION', label: 'En revisión' },
    { value: 'ATENDIDO', label: 'Resuelto' },
    { value: 'DESCARTADO', label: 'Cerrado' }
];

const ESTADO_ROW_OPTIONS = [
    { value: 'PENDIENTE', label: 'En espera' },
    { value: 'EN_REVISION', label: 'En revisión' },
    { value: 'ATENDIDO', label: 'Resuelto' },
    { value: 'DESCARTADO', label: 'Cerrado' }
];

export const AdminFeedbackPage: React.FC = () => {
    const [reportes, setReportes] = useState<FeedbackReporte[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState('TODOS');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    
    // Estado del Drawer de inspección y visor multimedia
    const [activeReport, setActiveReport] = useState<FeedbackReporte | null>(null);
    const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
    const [adminResponseText, setAdminResponseText] = useState('');
    const [isSavingResponse, setIsSavingResponse] = useState(false);
    const [responseSavedSuccess, setResponseSavedSuccess] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const [deletingReport, setDeletingReport] = useState<FeedbackReporte | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const confirmDeleteAdmin = async () => {
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

    const loadData = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const data = await getAllFeedback(filtroTipo, filtroEstado);
            setReportes(data);
            // Actualizar activeReport si está abierto de forma funcional y segura
            setActiveReport(prev => {
                if (!prev) return null;
                const prevId = prev.id_feedback || prev.idFeedback;
                return data.find(r => (r.id_feedback || r.idFeedback) === prevId) || prev;
            });
        } catch (err) {
            console.error('Error cargando reportes de feedback:', err);
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [filtroTipo, filtroEstado]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Sincronización automática ante eventos del sistema
    useEffect(() => {
        const handleFeedbackChanged = () => loadData(true);
        window.addEventListener('diitra-feedback-changed', handleFeedbackChanged);

        return () => {
            window.removeEventListener('diitra-feedback-changed', handleFeedbackChanged);
        };
    }, [loadData]);

    // Cuando se selecciona un reporte para inspeccionar en el drawer
    const handleOpenDrawer = (report: FeedbackReporte, mediaIdx = 0) => {
        setActiveReport(report);
        setActiveMediaIndex(mediaIdx);
        setAdminResponseText(report.observacion_admin || report.observacionAdmin || '');
        setResponseSavedSuccess(false);
    };

    const handleCloseDrawer = () => {
        setActiveReport(null);
        setActiveMediaIndex(0);
        setResponseSavedSuccess(false);
    };

    // Navegación con teclado en los Drawers
    useEffect(() => {
        const isAnyOpen = activeReport || deletingReport;
        if (!isAnyOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (deletingReport) {
                    if (!isDeleting) setDeletingReport(null);
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
    }, [activeReport, deletingReport, isDeleting]);

    const handleStatusChange = async (idFeedback: number, nuevoEstado: string) => {
        setUpdatingId(idFeedback);
        try {
            await updateFeedbackStatus(idFeedback, nuevoEstado);
            setReportes(prev => prev.map(r => {
                const id = r.id_feedback || r.idFeedback;
                if (id === idFeedback) {
                    return { ...r, estado: nuevoEstado };
                }
                return r;
            }));
            if (activeReport && (activeReport.id_feedback || activeReport.idFeedback) === idFeedback) {
                setActiveReport(prev => prev ? { ...prev, estado: nuevoEstado } : null);
            }
            window.dispatchEvent(new CustomEvent('diitra-feedback-changed'));
        } catch (err) {
            console.error('Error actualizando estado:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSaveAdminResponse = async () => {
        if (!activeReport) return;
        const id = activeReport.id_feedback || activeReport.idFeedback || 0;
        if (!id) return;

        setIsSavingResponse(true);
        try {
            await updateFeedbackStatus(id, activeReport.estado, adminResponseText.trim());
            setReportes(prev => prev.map(r => {
                const rId = r.id_feedback || r.idFeedback;
                if (rId === id) {
                    return { ...r, observacion_admin: adminResponseText.trim(), observacionAdmin: adminResponseText.trim() };
                }
                return r;
            }));
            setActiveReport(prev => prev ? { ...prev, observacion_admin: adminResponseText.trim(), observacionAdmin: adminResponseText.trim() } : null);
            setResponseSavedSuccess(true);
            window.dispatchEvent(new CustomEvent('diitra-feedback-changed'));
            setTimeout(() => setResponseSavedSuccess(false), 3000);
        } catch (err) {
            console.error('Error guardando respuesta:', err);
        } finally {
            setIsSavingResponse(false);
        }
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
            case 'SUGERENCIA':
                return (
                    <span className="text-text-main font-semibold text-[12.5px] flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-text-dim" />
                        <span>Idea o sugerencia</span>
                    </span>
                );
            default:
                return <span className="text-text-dim text-[12px] font-medium">{tipo}</span>;
        }
    };

    const activeFiles = activeReport?.archivos || [];
    const currentMedia: FeedbackAdjunto | null = activeFiles.length > 0 ? activeFiles[activeMediaIndex] || activeFiles[0] : null;
    const isCurrentVideo = Boolean(currentMedia && (currentMedia.tipo_mime || currentMedia.tipoMime || '').startsWith('video/'));
    const currentMediaUrl = currentMedia ? getFeedbackMediaUrl(currentMedia.url) : '';

    // Metadatos técnicos parseados
    const parsedMetadata = useMemo(() => {
        if (!activeReport) return null;
        const metaStr = activeReport.metadata_navegador || activeReport.metadataNavegador;
        if (!metaStr) return null;
        try {
            return JSON.parse(metaStr);
        } catch {
            return null;
        }
    }, [activeReport]);

    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">
            {/* Header */}
            <PageHeader
                kicker="Administración · DIITRA"
                icon={MessageSquare}
                title="Bandeja de Incidencias y Sugerencias"
                description="Registro centralizado de problemas reportados por los usuarios, datos u opciones faltantes y sugerencias para mejorar el sistema."
            />

            {/* Main Content: Full Width Container */}
            <div className="space-y-4 animate-fade-up [animation-delay:100ms] relative z-10">
                {/* Barra de Filtros con GeistSelect */}
                <div className="bento-card static p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[12px] text-text-dim font-medium">
                        <Filter className="w-3.5 h-3.5 text-text-dim" />
                        <span>Filtrar registros:</span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="w-48">
                            <GeistSelect
                                value={filtroTipo}
                                onChange={(val) => setFiltroTipo(String(val))}
                                options={TIPO_OPTIONS}
                            />
                        </div>
                        <div className="w-48">
                            <GeistSelect
                                value={filtroEstado}
                                onChange={(val) => setFiltroEstado(String(val))}
                                options={ESTADO_OPTIONS}
                            />
                        </div>
                    </div>
                </div>

                {/* Listado de Reportes o Empty State */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-dim bento-card static">
                        <RefreshCw size={24} className="animate-spin text-brand" />
                        <span className="text-xs font-bold uppercase tracking-widest">Cargando reportes...</span>
                    </div>
                ) : reportes.length === 0 ? (
                    <div className="empty-state py-20 bg-surface">
                        <div className="icon-circle icon-circle-brand !p-4 mb-4">
                            <MessageSquare size={36} strokeWidth={1.5} />
                        </div>
                        <p className="text-text-main font-bold uppercase tracking-widest text-sm">No se encontraron reportes</p>
                        <p className="text-text-dim text-xs mt-2 max-w-sm">
                            Cuando los usuarios envíen reportes de problemas o sugerencias aparecerán en este panel.
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
                                    {/* Header de la tarjeta */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-thin pb-3.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getTipoBadge(r.tipo)}
                                        </div>
                                        
                                        {/* Selector de Estado con GeistSelect */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] text-text-dim font-medium">Estado:</span>
                                            <div className="w-38">
                                                <GeistSelect
                                                    value={r.estado}
                                                    disabled={updatingId === id}
                                                    onChange={(val) => handleStatusChange(id, String(val))}
                                                    options={ESTADO_ROW_OPTIONS}
                                                />
                                            </div>
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

                                            {/* Observación / Respuesta registrada */}
                                            {observacion && (
                                                <div className="p-3 rounded-lg border border-brand/20 bg-brand/5 space-y-1 mt-2">
                                                    <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-brand">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>Respuesta enviada al usuario:</span>
                                                    </div>
                                                    <p className="text-[12px] text-text-main leading-relaxed pl-5">
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

                                    {/* Footer con Metadatos Rápidos y Botón de Inspección */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-text-dim border-t border-border-thin">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span>Remitente: <strong className="text-text-main font-medium">{r.nombre_usuario || r.nombreUsuario}</strong> {r.cedula ? `(${r.cedula})` : ''}</span>
                                            <span>Rol: <strong className="text-text-main font-medium">{r.rol_usuario || r.rolUsuario}</strong></span>
                                            {r.ruta_origen && (
                                                <span>Pantalla: <code className="px-1.5 py-0.5 rounded bg-accents-1 text-text-main font-mono text-[10.5px]">{r.ruta_origen}</code></span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-text-dim" />
                                                <span className="font-mono text-[10.5px]">{formattedDate}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenDrawer(r, 0)}
                                                className="btn-vercel-secondary text-[11px] font-medium px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>Inspeccionar reporte</span>
                                                <ExternalLink size={11} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingReport(r)}
                                                className="p-1.5 rounded-md text-text-dim hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                                title="Eliminar reporte permanentemente"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Panel Lateral Derecho (Drawer Vercel Geist) de Inspección y Visor Multimedia Completo */}
            {activeReport && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex justify-end"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Inspección: ${activeReport.titulo}`}
                >
                    {/* Backdrop Blur Overlay */}
                    <div 
                        className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={handleCloseDrawer}
                    />

                    {/* Panel Lateral Derecho */}
                    <div className="relative w-full max-w-2xl lg:max-w-4xl h-full bg-surface border-l border-border-thin shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        
                        {/* Header del Drawer */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0 pr-4">
                                {getTipoBadge(activeReport.tipo)}
                                <span className="text-text-dim text-[11px] font-mono shrink-0">
                                    #{activeReport.id_feedback || activeReport.idFeedback}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingReport(activeReport)}
                                    className="btn-vercel-secondary text-[11.5px] px-2.5 py-1 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20 flex items-center gap-1.5 cursor-pointer"
                                    title="Eliminar reporte"
                                >
                                    <Trash2 size={12} />
                                    <span>Eliminar</span>
                                </button>
                                <button
                                    onClick={handleCloseDrawer}
                                    className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer shrink-0"
                                    title="Cerrar [ESC]"
                                    aria-label="Cerrar panel"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Body del Drawer con scroll */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface custom-scrollbar">
                            
                            {/* 1. TÍTULO, DESCRIPCIÓN Y SELECTOR DE ESTADO */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="space-y-1.5 min-w-0 flex-1">
                                    <h3 className="text-[16px] font-bold text-text-main tracking-tight">
                                        {activeReport.titulo}
                                    </h3>
                                    <p className="text-[13.5px] text-text-dim whitespace-pre-wrap leading-relaxed">
                                        {activeReport.descripcion}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                    <span className="text-[11px] text-text-dim">Estado:</span>
                                    <div className="w-38">
                                        <GeistSelect
                                            value={activeReport.estado}
                                            onChange={(val) => handleStatusChange(activeReport.id_feedback || activeReport.idFeedback || 0, String(val))}
                                            options={ESTADO_ROW_OPTIONS}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2. VISOR MULTIMEDIA DEBAJO DE LA DESCRIPCIÓN */}
                            {activeFiles.length > 0 && (
                                <div className="space-y-3">
                                    {activeFiles.length > 1 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-mono font-semibold text-text-dim uppercase tracking-wider">
                                                {isCurrentVideo ? 'Video' : 'Captura'} ({activeMediaIndex + 1} de {activeFiles.length})
                                            </span>
                                        </div>
                                    )}

                                    {/* Visualizador Multimedia directo sin marco exterior sobrante */}
                                    <div className="relative flex items-center justify-center">
                                        {isCurrentVideo ? (
                                            <video 
                                                src={currentMediaUrl} 
                                                controls 
                                                autoPlay 
                                                className="max-h-[380px] sm:max-h-[420px] w-auto max-w-full rounded-xl border border-border-thin shadow-sm object-contain"
                                            />
                                        ) : (
                                            <img 
                                                src={currentMediaUrl} 
                                                alt={currentMedia?.nombre_original || 'Captura'} 
                                                className="max-h-[380px] sm:max-h-[420px] w-auto max-w-full rounded-xl border border-border-thin shadow-sm object-contain select-none"
                                            />
                                        )}

                                        {/* Botones de navegación Anterior / Siguiente si hay más de 1 archivo */}
                                        {activeFiles.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveMediaIndex(prev => (prev > 0 ? prev - 1 : activeFiles.length - 1))}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/90 border border-border-thin flex items-center justify-center text-text-main shadow-lg hover:bg-surface hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                                    title="Anterior [←]"
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveMediaIndex(prev => (prev < activeFiles.length - 1 ? prev + 1 : 0))}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/90 border border-border-thin flex items-center justify-center text-text-main shadow-lg hover:bg-surface hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                                    title="Siguiente [→]"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Tira inferior de miniaturas para cambio rápido */}
                                    {activeFiles.length > 1 && (
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
                                                        className={`h-16 w-auto min-w-[48px] rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer relative ${
                                                            isSelected ? 'border-brand ring-2 ring-brand/20 scale-105' : 'border-border-thin opacity-70 hover:opacity-100'
                                                        }`}
                                                    >
                                                        {isV ? (
                                                            <div className="w-full h-full bg-bg-deep flex items-center justify-center p-2">
                                                                <Video size={14} className="text-text-dim" />
                                                            </div>
                                                        ) : (
                                                            <img src={u} alt={f.nombre_original} className="h-full w-auto object-contain" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. METADATOS TÉCNICOS DETALLADOS (PARA IDENTIFICAR EL ERROR) */}
                            <div className="bento-card static p-4 space-y-3">
                                <h4 className="text-[12px] font-mono font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                                    <Monitor size={14} className="text-brand" />
                                    <span>Metadatos Técnicos del Entorno y Navegador</span>
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11.5px]">
                                    <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5">
                                        <span className="text-[10px] font-mono text-text-dim uppercase block">Navegador</span>
                                        <p className="font-semibold text-text-main truncate">
                                            {parsedMetadata?.browser || 'No registrado'}
                                        </p>
                                    </div>

                                    <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5">
                                        <span className="text-[10px] font-mono text-text-dim uppercase block">Sistema Operativo</span>
                                        <p className="font-semibold text-text-main truncate">
                                            {parsedMetadata?.os || 'No registrado'}
                                        </p>
                                    </div>

                                    <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5">
                                        <span className="text-[10px] font-mono text-text-dim uppercase block">Pantalla / Ventana</span>
                                        <p className="font-semibold text-text-main truncate">
                                            {parsedMetadata?.screen ? `${parsedMetadata.screen} (Ventana: ${parsedMetadata.viewport || ''})` : 'No registrado'}
                                        </p>
                                    </div>

                                    <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5">
                                        <span className="text-[10px] font-mono text-text-dim uppercase block">Pantalla / Ruta Afectada</span>
                                        <p className="font-mono text-[11px] text-brand font-semibold truncate">
                                            {activeReport.ruta_origen || parsedMetadata?.pathname || 'General'}
                                        </p>
                                    </div>

                                    <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5">
                                        <span className="text-[10px] font-mono text-text-dim uppercase block">Conexión</span>
                                        <p className="font-semibold text-text-main truncate flex items-center gap-1">
                                            <Wifi size={12} className="text-emerald-500" />
                                            <span>{parsedMetadata?.connectionType || (parsedMetadata?.isOnline ? 'En línea' : 'Desconocida')}</span>
                                        </p>
                                    </div>

                                    <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5">
                                        <span className="text-[10px] font-mono text-text-dim uppercase block">Hardware (Memoria / Cores)</span>
                                        <p className="font-semibold text-text-main truncate">
                                            {parsedMetadata?.deviceMemoryGB ? `${parsedMetadata.deviceMemoryGB} RAM` : ''} {parsedMetadata?.hardwareConcurrency ? `· ${parsedMetadata.hardwareConcurrency}` : ''} {!parsedMetadata?.deviceMemoryGB && !parsedMetadata?.hardwareConcurrency ? 'Estándar' : ''}
                                        </p>
                                    </div>
                                </div>

                                {parsedMetadata?.userAgent && (
                                    <div className="p-2 rounded bg-bg-deep border border-border-thin">
                                        <span className="text-[9.5px] font-mono text-text-dim block mb-0.5 uppercase">User-Agent Completo</span>
                                        <p className="font-mono text-[10px] text-text-dim break-all leading-tight">
                                            {parsedMetadata.userAgent}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 4. RESPUESTA DEL ADMINISTRADOR / RESOLUCIÓN */}
                            <div className="bento-card static p-4 space-y-3 border-brand/30">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[12px] font-mono font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                                        <Send size={13} />
                                        <span>Respuesta / Observación de Soporte</span>
                                    </h4>
                                    {responseSavedSuccess && (
                                        <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1 animate-fade-in">
                                            <CheckCircle2 size={13} /> Guardado exitosamente
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11.5px] text-text-dim leading-relaxed">
                                    Esta respuesta será visible para el usuario en su buzón de sugerencias e incidencias.
                                </p>
                                <textarea
                                    value={adminResponseText}
                                    onChange={e => setAdminResponseText(e.target.value)}
                                    placeholder="Escribe la solución aplicada, aclaración o respuesta al usuario..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-[12.5px] bg-bg-deep border border-border-thin rounded-xl text-text-main placeholder:text-text-dim/50 focus:border-brand focus:outline-none transition-colors resize-none"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSaveAdminResponse}
                                        disabled={isSavingResponse}
                                        className="btn-vercel-primary text-[12px] font-medium px-4 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        <Save size={13} />
                                        <span>{isSavingResponse ? 'Guardando...' : 'Guardar Respuesta'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer del Drawer */}
                        <div className="p-4 border-t border-border-thin bg-surface shrink-0 flex items-center justify-between">
                            <div className="text-[11px] text-text-dim font-mono">
                                Reportado por <strong>{activeReport.nombre_usuario || activeReport.nombreUsuario}</strong>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseDrawer}
                                className="btn-vercel-secondary text-[12px] font-medium px-4 py-1.5 cursor-pointer"
                            >
                                Cerrar Panel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Panel Lateral Derecho (Drawer Vercel Geist) de Confirmación de Eliminación (SuperAdmin) */}
            {deletingReport && createPortal(
                <div
                    className="fixed inset-0 z-[10000] flex justify-end"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="admin-delete-feedback-title"
                >
                    {/* Backdrop Blur Overlay */}
                    <div 
                        className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => !isDeleting && setDeletingReport(null)}
                    />

                    {/* Panel Lateral Derecho */}
                    <div className="relative w-full max-w-md sm:max-w-lg h-full bg-surface border-l border-border-thin shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        {/* Header del Drawer */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                                    <Trash2 size={15} />
                                </div>
                                <h3 id="admin-delete-feedback-title" className="text-[15px] font-bold text-text-main tracking-tight">
                                    Eliminar Reporte
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeletingReport(null)}
                                disabled={isDeleting}
                                className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                                aria-label="Cerrar panel"
                                title="Cerrar [ESC]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body del Drawer */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-surface custom-scrollbar">
                            {/* Alerta Destructiva */}
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                                <div className="flex items-center gap-2 text-red-500 font-semibold text-xs uppercase tracking-wider">
                                    <AlertTriangle size={15} />
                                    <span>Acción permanente de SuperAdmin</span>
                                </div>
                                <p className="text-xs text-text-dim leading-relaxed">
                                    Esta acción eliminará de forma irreversible el registro de la base de datos y suprimirá los archivos multimedia almacenados en el servidor.
                                </p>
                            </div>

                            {/* Ficha Resumen del Reporte */}
                            <div className="bento-card static p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    {getTipoBadge(deletingReport.tipo)}
                                    <span className="text-[11px] font-mono text-text-dim">
                                        ID: <strong className="text-text-main">#{deletingReport.id_feedback || deletingReport.idFeedback}</strong>
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

                                <div className="pt-2 border-t border-border-thin space-y-1 text-[11px] font-mono text-text-dim">
                                    <div>Usuario: <span className="text-text-main font-semibold">{deletingReport.nombre_usuario || deletingReport.nombreUsuario}</span></div>
                                    {deletingReport.archivos && deletingReport.archivos.length > 0 && (
                                        <div>Archivos adjuntos: <span className="text-text-main font-semibold">{deletingReport.archivos.length}</span></div>
                                    )}
                                </div>
                            </div>

                            {deleteError && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
                                    {deleteError}
                                </div>
                            )}
                        </div>

                        {/* Footer del Drawer */}
                        <div className="p-4 px-6 border-t border-border-thin bg-surface shrink-0 flex items-center justify-between">
                            <span className="text-[11px] text-text-dim font-mono">
                                SuperAdmin
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
                                    onClick={confirmDeleteAdmin}
                                    disabled={isDeleting}
                                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                                >
                                    {isDeleting && <Loader2 size={12} className="animate-spin" />}
                                    <span>Sí, eliminar reporte</span>
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
