import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, AlertTriangle, Loader2, Video } from 'lucide-react';
import { getFeedbackMediaUrl, type FeedbackReporte } from '../../../services/feedbackService';
import { getTipoBadge } from './FeedbackBadges';

interface FeedbackDeleteDrawerProps {
    report: FeedbackReporte | null;
    isDeleting: boolean;
    deleteError: string | null;
    isAdmin?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const FeedbackDeleteDrawer: React.FC<FeedbackDeleteDrawerProps> = ({
    report,
    isDeleting,
    deleteError,
    isAdmin = false,
    onClose,
    onConfirm
}) => {
    useEffect(() => {
        if (!report) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isDeleting) {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [report, isDeleting, onClose]);

    if (!report) return null;

    const reportId = report.id_feedback || report.idFeedback;

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-delete-drawer-title"
        >
            {/* Backdrop Blur Overlay */}
            <div
                className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs cursor-pointer animate-fade-in"
                onClick={() => !isDeleting && onClose()}
            />

            {/* Panel Lateral Deslizante a la Derecha */}
            <div className="relative w-full max-w-md sm:max-w-lg h-full bg-surface border-l border-border-thin shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
                {/* Header del Drawer */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                            <Trash2 size={15} />
                        </div>
                        <h3 id="feedback-delete-drawer-title" className="text-[15px] font-bold text-text-main tracking-tight">
                            Eliminar Incidencia
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-50"
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
                            <span>{isAdmin ? 'Acción permanente de Administrador' : 'Acción irreversible'}</span>
                        </div>
                        <p className="text-xs text-text-dim leading-relaxed">
                            {isAdmin
                                ? 'Esta acción eliminará de forma irreversible el registro de la base de datos y suprimirá los archivos multimedia almacenados en el servidor.'
                                : '¿Estás seguro de que deseas eliminar esta incidencia? Se borrarán permanentemente sus datos y los archivos adjuntos asociados.'}
                        </p>
                    </div>

                    {/* Ficha Resumen del Reporte */}
                    <div className="bento-card static p-4 space-y-3">
                        <div className="flex items-center">
                            {getTipoBadge(report.tipo)}
                        </div>

                        <div className="space-y-1.5 pt-1">
                            <h4 className="text-[14px] font-bold text-text-main">
                                {report.titulo}
                            </h4>
                            <p className="text-[12.5px] text-text-dim line-clamp-4 leading-relaxed whitespace-pre-wrap">
                                {report.descripcion}
                            </p>
                        </div>

                        {/* Remitente si es vista Admin */}
                        {isAdmin && (report.nombre_usuario || report.nombreUsuario) && (
                            <div className="pt-2 border-t border-border-thin text-[11px] font-mono text-text-dim">
                                Remitente: <span className="text-text-main font-semibold">{report.nombre_usuario || report.nombreUsuario}</span>
                            </div>
                        )}

                        {/* Adjuntos en el resumen si existen */}
                        {report.archivos && report.archivos.length > 0 && (
                            <div className="pt-2.5 border-t border-border-thin space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-mono text-text-dim">
                                    <span>Archivos adjuntos:</span>
                                    <span className="text-text-main font-semibold">
                                        {report.archivos.length} {report.archivos.length === 1 ? 'archivo' : 'archivos'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
                                    {report.archivos.map((adj, idx) => {
                                        const isVideo = (adj.tipo_mime || adj.tipoMime || '').startsWith('video/');
                                        const mediaUrl = getFeedbackMediaUrl(adj.url);
                                        const fileName = adj.nombre_original || adj.nombreOriginal || 'Adjunto';

                                        return (
                                            <div
                                                key={idx}
                                                className="h-16 w-auto min-w-[54px] rounded-lg overflow-hidden border border-border-thin bg-surface shrink-0 relative flex items-center justify-center p-0.5"
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
                <div className="p-4 px-6 border-t border-border-thin bg-surface shrink-0 flex items-center justify-between">
                    <span className="text-[11px] text-text-dim font-mono">
                        Confirmar eliminación
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="btn-vercel-secondary text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
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
    );
};
