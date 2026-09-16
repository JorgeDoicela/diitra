import React, { useState, useEffect, useCallback } from 'react';
import { 
    MessageSquare, RefreshCw, Clock, ChevronDown, 
    Play, Eye, Trash2, FilterX
} from 'lucide-react';
import { 
    getAllFeedback, 
    updateFeedbackStatus, 
    deleteFeedback, 
    getFeedbackMediaUrl, 
    type FeedbackReporte 
} from '../../../services/feedbackService';
import { PageHeader } from '../../../components/Common/PageHeader';
import { GeistSelect } from '../../../components/Common/GeistSelect';
import { FeedbackDiscussionThread } from '../../../components/Feedback/FeedbackDiscussionThread';
import { getTipoBadge, ESTADO_ROW_OPTIONS } from '../../Feedback/components/FeedbackBadges';
import { FeedbackFilterBar } from '../../Feedback/components/FeedbackFilterBar';
import { FeedbackDetailDrawer } from '../../Feedback/components/FeedbackDetailDrawer';
import { FeedbackDeleteDrawer } from '../../Feedback/components/FeedbackDeleteDrawer';
import { useFeedbackFilters } from '../../Feedback/hooks/useFeedbackFilters';

export const AdminFeedbackPage: React.FC = () => {
    const [reportes, setReportes] = useState<FeedbackReporte[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [expandedThreadIds, setExpandedThreadIds] = useState<Set<number>>(new Set());

    // Drawer de Inspección y Visor Multimedia
    const [activeReport, setActiveReport] = useState<FeedbackReporte | null>(null);
    const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);

    // Drawer de Eliminación
    const [deletingReport, setDeletingReport] = useState<FeedbackReporte | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Hook unificado de filtros y búsqueda textual
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
            const data = await getAllFeedback();
            setReportes(data);
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
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Sincronización ante eventos de cambio
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

    const handleStatusChange = async (idFeedback: number, nuevoEstado: string) => {
        setUpdatingId(idFeedback);
        try {
            await updateFeedbackStatus(idFeedback, nuevoEstado);
            setReportes(prev => prev.map(r => {
                const id = r.id_feedback || r.idFeedback;
                return id === idFeedback ? { ...r, estado: nuevoEstado } : r;
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
            {/* Header */}
            <PageHeader
                kicker="Administración · DIITRA"
                icon={MessageSquare}
                title="Bandeja de Incidencias"
                description="Registro centralizado de problemas reportados por los usuarios y datos u opciones faltantes para su revisión y solución."
            />

            {/* Barra de Búsqueda Textual y Filtros */}
            <FeedbackFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filtroTipo={filtroTipo}
                onTipoChange={setFiltroTipo}
                filtroEstado={filtroEstado}
                onEstadoChange={setFiltroEstado}
                placeholder="Buscar por remitente, cédula, título, contenido o #ID..."
                totalResultados={filteredReportes.length}
                totalOriginal={reportes.length}
            />

            {/* Contenido Principal: Listado de Reportes */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-dim bento-card static">
                        <RefreshCw size={24} className="animate-spin text-brand" />
                        <span className="text-xs font-bold uppercase tracking-widest">Cargando incidencias...</span>
                    </div>
                ) : reportes.length === 0 ? (
                    <div className="empty-state py-20 bg-surface">
                        <div className="icon-circle icon-circle-brand !p-4 mb-4">
                            <MessageSquare size={36} strokeWidth={1.5} />
                        </div>
                        <p className="text-text-main font-bold uppercase tracking-widest text-sm">No se encontraron incidencias</p>
                        <p className="text-text-dim text-xs mt-2 max-w-sm">
                            Cuando los usuarios reporten problemas o datos faltantes aparecerán en este panel.
                        </p>
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
                            const formattedDate = fecha ? new Date(fecha).toLocaleString('es-EC', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            }) : '';

                            return (
                                <div key={r.uuid || id} className="bento-card static p-5 space-y-4">
                                    {/* Header de la tarjeta */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-thin pb-3.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getTipoBadge(r.tipo)}
                                            <span className="text-[11px] font-mono text-text-dim">#{id}</span>
                                        </div>

                                        {/* Selector de Estado rápido */}
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

                                    {/* Footer con Metadatos Rápidos y Acciones */}
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

                                            <button
                                                type="button"
                                                onClick={() => handleOpenDrawer(r, 0)}
                                                className="btn-vercel-secondary text-[11px] font-medium px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                                                title="Inspeccionar reporte y metadatos técnicos"
                                            >
                                                <Eye size={12} />
                                                <span>Inspeccionar</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setDeletingReport(r)}
                                                className="w-8 h-8 rounded-lg text-text-dim hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                                                title="Eliminar reporte permanentemente"
                                                aria-label="Eliminar reporte"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Hilo de Conversación desplegable INLINE */}
                                    {expandedThreadIds.has(id) && (
                                        <div className="pt-4 border-t border-border-thin animate-fade-in">
                                            <FeedbackDiscussionThread
                                                report={r}
                                                isAdmin={true}
                                                onMessageSent={(updated) => {
                                                    setReportes(prev => prev.map(rep => {
                                                        const rId = rep.id_feedback || rep.idFeedback;
                                                        const uId = updated.id_feedback || updated.idFeedback;
                                                        return rId === uId ? updated : rep;
                                                    }));
                                                    if (activeReport && (activeReport.id_feedback || activeReport.idFeedback) === id) {
                                                        setActiveReport(updated);
                                                    }
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

            {/* Drawer de Detalle y Visor Multimedia (Reutilizable) */}
            <FeedbackDetailDrawer
                report={activeReport}
                initialMediaIndex={activeMediaIndex}
                isAdmin={true}
                onClose={() => setActiveReport(null)}
                onStatusChange={handleStatusChange}
                onDeleteClick={(rep) => setDeletingReport(rep)}
                onReportUpdated={(updated) => {
                    setActiveReport(updated);
                    setReportes(prev => prev.map(r => {
                        const rId = r.id_feedback || r.idFeedback;
                        const uId = updated.id_feedback || updated.idFeedback;
                        return rId === uId ? updated : r;
                    }));
                }}
            />

            {/* Drawer de Eliminación (Reutilizable) */}
            <FeedbackDeleteDrawer
                report={deletingReport}
                isDeleting={isDeleting}
                deleteError={deleteError}
                isAdmin={true}
                onClose={() => setDeletingReport(null)}
                onConfirm={handleConfirmDelete}
            />
        </main>
    );
};
export default AdminFeedbackPage;
