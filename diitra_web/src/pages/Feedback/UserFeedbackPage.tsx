import React, { useState, useEffect, useCallback } from 'react';
import { 
    Plus, MessageSquare, RefreshCw, Pencil, Trash2, 
    Clock, ChevronDown, Play, CheckCircle2, Eye, FilterX
} from 'lucide-react';
import { 
    getMyFeedback, 
    getFeedbackMediaUrl, 
    updateUserFeedback, 
    deleteFeedback, 
    type FeedbackReporte 
} from '../../services/feedbackService';
import { PageHeader } from '../../components/Common/PageHeader';
import { FeedbackDiscussionThread } from '../../components/Feedback/FeedbackDiscussionThread';
import { getTipoBadge, getEstadoBadge } from './components/FeedbackBadges';
import { FeedbackFilterBar } from './components/FeedbackFilterBar';
import { FeedbackDetailDrawer } from './components/FeedbackDetailDrawer';
import { FeedbackEditDrawer } from './components/FeedbackEditDrawer';
import { FeedbackDeleteDrawer } from './components/FeedbackDeleteDrawer';
import { useFeedbackFilters } from './hooks/useFeedbackFilters';

export const UserFeedbackPage: React.FC = () => {
    const [reportes, setReportes] = useState<FeedbackReporte[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedThreadIds, setExpandedThreadIds] = useState<Set<number>>(new Set());

    // Drawer de Detalle y Visor Multimedia
    const [activeReport, setActiveReport] = useState<FeedbackReporte | null>(null);
    const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);

    // Drawer de Edición
    const [editingReport, setEditingReport] = useState<FeedbackReporte | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Drawer de Eliminación
    const [deletingReport, setDeletingReport] = useState<FeedbackReporte | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Filtros y Búsqueda reactiva
    const {
        searchQuery,
        setSearchQuery,
        filtroTipo,
        setFiltroTipo,
        filtroEstado,
        setFiltroEstado,
        filteredReportes,
        clearFilters
    } = useFeedbackFilters(reportes);

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

    // Sincronización ante eventos de actualización de feedback
    useEffect(() => {
        const handleFeedbackChanged = () => loadData(true);
        window.addEventListener('diitra-feedback-changed', handleFeedbackChanged);
        return () => window.removeEventListener('diitra-feedback-changed', handleFeedbackChanged);
    }, [loadData]);

    const handleOpenDrawer = (report: FeedbackReporte, mediaIdx = 0) => {
        setActiveReport(report);
        setActiveMediaIndex(mediaIdx);
    };

    const toggleThread = (id?: number) => {
        if (!id) return;
        setExpandedThreadIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const isEditable = (estado?: string) => {
        const est = estado?.toUpperCase() || '';
        return est === 'PENDIENTE' || est === 'EN_ESPERA' || est === 'EN ESPERA';
    };

    const handleSaveEdit = async (id: number, data: { tipo: string; titulo: string; descripcion: string }) => {
        setIsSavingEdit(true);
        setEditError(null);
        try {
            const updated = await updateUserFeedback(id, data);
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

    const handleConfirmDelete = async () => {
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

    return (
        <main className="flex-1 bg-bg-deep p-6 md:p-8 lg:p-10 space-y-6">
            {/* Header Principal */}
            <PageHeader
                kicker="Atención y Soporte · DIITRA"
                icon={MessageSquare}
                title="Buzón de Incidencias"
                description="Canal directo para reportar fallos en el sistema, pantallas colgadas o datos y opciones faltantes en la plataforma."
            >
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('diitra-open-feedback'))}
                    className="btn-vercel-primary w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                    <Plus size={14} strokeWidth={3} />
                    <span>Reportar Incidencia</span>
                </button>
            </PageHeader>

            {/* Barra de Búsqueda y Filtros */}
            <FeedbackFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filtroTipo={filtroTipo}
                onTipoChange={setFiltroTipo}
                filtroEstado={filtroEstado}
                onEstadoChange={setFiltroEstado}
                totalResultados={filteredReportes.length}
                totalOriginal={reportes.length}
            />

            {/* Contenido Principal: Listado de Reportes */}
            <div className="space-y-4">
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
                            Si encuentras algo que no funciona bien o un dato que no puedes ingresar, repórtalo aquí para revisarlo y darte soporte.
                        </p>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('diitra-open-feedback'))}
                            className="btn-vercel-primary text-xs mt-5 flex items-center gap-2 cursor-pointer"
                        >
                            <Plus size={13} />
                            <span>Reportar tu primera incidencia</span>
                        </button>
                    </div>
                ) : filteredReportes.length === 0 ? (
                    <div className="empty-state py-16 bg-surface">
                        <div className="icon-circle !p-3 mb-3 text-text-dim">
                            <FilterX size={28} />
                        </div>
                        <p className="text-text-main font-bold uppercase tracking-widest text-xs">No hay incidencias que coincidan con los filtros</p>
                        <p className="text-text-dim text-xs mt-1">Prueba cambiando la búsqueda o restableciendo los selectores.</p>
                        <button
                            onClick={clearFilters}
                            className="btn-vercel-secondary text-xs mt-4 cursor-pointer"
                        >
                            Restablecer filtros
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReportes.map(r => {
                            const id = r.id_feedback || r.idFeedback || 0;
                            const fecha = r.fecha_creacion || r.fechaCreacion;
                            const observacion = r.observacion_admin || r.observacionAdmin;
                            const formattedDate = fecha ? new Date(fecha).toLocaleString('es-EC', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            }) : '';

                            return (
                                <div key={r.uuid || id} className="bento-card static p-5 space-y-4">
                                    {/* Encabezado de la Tarjeta */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-thin pb-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getTipoBadge(r.tipo)}
                                            <span className="text-[11px] font-mono text-text-dim">#{id}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {getEstadoBadge(r.estado)}
                                            {isEditable(r.estado) && (
                                                <div className="flex items-center gap-1.5 pl-2.5 border-l border-border-thin">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingReport(r);
                                                            setEditError(null);
                                                        }}
                                                        className="w-8 h-8 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Editar reporte"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeletingReport(r);
                                                            setDeleteError(null);
                                                        }}
                                                        className="w-8 h-8 rounded-lg text-text-dim hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Eliminar reporte"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contenido Principal */}
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <h3 
                                                onClick={() => handleOpenDrawer(r, 0)}
                                                className="text-[14.5px] font-semibold text-text-main hover:text-brand transition-colors cursor-pointer"
                                            >
                                                {r.titulo}
                                            </h3>
                                            <p className="text-[13px] text-text-dim whitespace-pre-wrap leading-relaxed line-clamp-3">
                                                {r.descripcion}
                                            </p>

                                            {/* Respuesta de Soporte */}
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

                                        {/* Miniaturas de Archivos */}
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

                                    {/* Footer de Tarjeta con Apertura Universal al Detalle */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-text-dim border-t border-border-thin">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {r.ruta_origen && (
                                                <span>Pantalla: <code className="px-1.5 py-0.5 rounded bg-accents-1 text-text-main font-mono text-[10.5px]">{r.ruta_origen}</code></span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => toggleThread(id)}
                                                className={`inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-md text-[11.5px] transition-colors cursor-pointer ${
                                                    expandedThreadIds.has(id)
                                                        ? 'bg-brand/10 text-brand font-semibold'
                                                        : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
                                                }`}
                                            >
                                                <MessageSquare size={13} />
                                                <span>Conversación ({r.conversacion?.length || 0})</span>
                                                <ChevronDown 
                                                    size={13} 
                                                    className={`transition-transform duration-200 ${expandedThreadIds.has(id) ? 'rotate-180 text-brand' : ''}`} 
                                                />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenDrawer(r, 0)}
                                                className="btn-vercel-secondary text-[11px] font-medium px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
                                                title="Abrir inspección y visor multimedia"
                                            >
                                                <Eye size={12} />
                                                <span>Ver detalle</span>
                                            </button>

                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-text-dim" />
                                                <span className="font-mono text-[10.5px]">{formattedDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hilo de Conversación desplegable INLINE */}
                                    {expandedThreadIds.has(id) && (
                                        <div className="pt-4 border-t border-border-thin animate-fade-in">
                                            <FeedbackDiscussionThread
                                                report={r}
                                                isAdmin={false}
                                                onMessageSent={(updated) => {
                                                    setReportes(prev => prev.map(rep => {
                                                        const rId = rep.id_feedback || rep.idFeedback;
                                                        const uId = updated.id_feedback || updated.idFeedback;
                                                        return rId === uId ? updated : rep;
                                                    }));
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Drawer Lateral de Detalle y Visor Multimedia (Reutilizable) */}
            <FeedbackDetailDrawer
                report={activeReport}
                initialMediaIndex={activeMediaIndex}
                isAdmin={false}
                onClose={() => setActiveReport(null)}
                onReportUpdated={(updated) => {
                    setActiveReport(updated);
                    setReportes(prev => prev.map(r => {
                        const rId = r.id_feedback || r.idFeedback;
                        const uId = updated.id_feedback || updated.idFeedback;
                        return rId === uId ? updated : r;
                    }));
                }}
            />

            {/* Drawer de Edición (Reutilizable) */}
            <FeedbackEditDrawer
                report={editingReport}
                isSaving={isSavingEdit}
                error={editError}
                onClose={() => setEditingReport(null)}
                onSave={handleSaveEdit}
            />

            {/* Drawer de Confirmación de Eliminación (Reutilizable) */}
            <FeedbackDeleteDrawer
                report={deletingReport}
                isDeleting={isDeleting}
                deleteError={deleteError}
                isAdmin={false}
                onClose={() => setDeletingReport(null)}
                onConfirm={handleConfirmDelete}
            />
        </main>
    );
};
export default UserFeedbackPage;
