import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, ChevronLeft, ChevronRight, Video, Image as ImageIcon,
    Monitor, Wifi, Trash2, MessageSquare
} from 'lucide-react';
import { 
    getFeedbackMediaUrl, 
    type FeedbackReporte, 
    type FeedbackAdjunto 
} from '../../../services/feedbackService';
import { getTipoBadge, getEstadoBadge, ESTADO_ROW_OPTIONS } from './FeedbackBadges';
import { GeistSelect } from '../../../components/Common/GeistSelect';
import { FeedbackDiscussionThread } from '../../../components/Feedback/FeedbackDiscussionThread';

interface FeedbackDetailDrawerProps {
    report: FeedbackReporte | null;
    initialMediaIndex?: number;
    isAdmin?: boolean;
    onClose: () => void;
    onStatusChange?: (id: number, nuevoEstado: string) => Promise<void>;
    onDeleteClick?: (report: FeedbackReporte) => void;
    onReportUpdated?: (updated: FeedbackReporte) => void;
}

export const FeedbackDetailDrawer: React.FC<FeedbackDetailDrawerProps> = ({
    report,
    initialMediaIndex = 0,
    isAdmin = false,
    onClose,
    onStatusChange,
    onDeleteClick,
    onReportUpdated
}) => {
    const [activeMediaIndex, setActiveMediaIndex] = useState<number>(initialMediaIndex);

    useEffect(() => {
        setActiveMediaIndex(initialMediaIndex);
    }, [initialMediaIndex, report]);

    // Bloquear scroll de fondo y soportar teclado (ESC y flechas)
    useEffect(() => {
        if (!report) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowLeft') {
                const total = report.archivos?.length || 0;
                if (total > 1) {
                    e.preventDefault();
                    setActiveMediaIndex(prev => (prev > 0 ? prev - 1 : total - 1));
                }
            } else if (e.key === 'ArrowRight') {
                const total = report.archivos?.length || 0;
                if (total > 1) {
                    e.preventDefault();
                    setActiveMediaIndex(prev => (prev < total - 1 ? prev + 1 : 0));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [report, onClose]);

    // Parseo de metadatos técnicos si están disponibles
    const parsedMetadata = useMemo(() => {
        if (!report) return null;
        const metaStr = report.metadata_navegador || report.metadataNavegador;
        if (!metaStr) return null;
        try {
            return JSON.parse(metaStr);
        } catch {
            return null;
        }
    }, [report]);

    if (!report) return null;

    const reportId = report.id_feedback || report.idFeedback || 0;
    const activeFiles = report.archivos || [];
    const currentMedia: FeedbackAdjunto | null = activeFiles.length > 0 ? activeFiles[activeMediaIndex] || activeFiles[0] : null;
    const isCurrentVideo = Boolean(currentMedia && (currentMedia.tipo_mime || currentMedia.tipoMime || '').startsWith('video/'));
    const currentMediaUrl = currentMedia ? getFeedbackMediaUrl(currentMedia.url) : '';

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de incidencia: ${report.titulo}`}
        >
            {/* Backdrop Blur Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Centrado */}
            <div className="relative w-full max-w-2xl lg:max-w-3xl max-h-[88vh] bg-surface border border-border-thin rounded-2xl shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                {/* Header del Panel */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0 pr-4">
                        <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <MessageSquare size={15} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                {getTipoBadge(report.tipo)}
                                {!isAdmin && getEstadoBadge(report.estado)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isAdmin && onDeleteClick && (
                            <button
                                type="button"
                                onClick={() => onDeleteClick(report)}
                                className="btn-vercel-secondary text-[11.5px] px-2.5 py-1 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20 flex items-center gap-1.5 cursor-pointer"
                                title="Eliminar reporte permanentemente"
                            >
                                <Trash2 size={12} />
                                <span>Eliminar</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                            title="Cerrar [ESC]"
                            aria-label="Cerrar panel"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body del Panel con Scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface custom-scrollbar">
                    {/* Título, Descripción y Selector de Estado en modo Admin */}
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                                <h3 className="text-[16px] font-bold text-text-main tracking-tight">
                                    {report.titulo}
                                </h3>
                                {report.ruta_origen && (
                                    <div className="text-[11px] font-mono text-text-dim flex items-center gap-1.5">
                                        <span>Pantalla:</span>
                                        <code className="px-1.5 py-0.5 rounded bg-accents-1 text-text-main text-[10.5px]">
                                            {report.ruta_origen}
                                        </code>
                                    </div>
                                )}
                            </div>

                            {isAdmin && onStatusChange && (
                                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                    <span className="text-[11px] text-text-dim font-medium">Estado:</span>
                                    <div className="w-38">
                                        <GeistSelect
                                            value={report.estado}
                                            onChange={(val) => onStatusChange(reportId, String(val))}
                                            options={ESTADO_ROW_OPTIONS}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin">
                            <p className="text-[13px] text-text-main whitespace-pre-wrap leading-relaxed">
                                {report.descripcion}
                            </p>
                        </div>
                    </div>

                    {/* Visor Multimedia si contiene archivos */}
                    {currentMedia && (
                        <div className="space-y-3 p-4 rounded-xl border border-border-thin bg-bg-deep/50">
                            <div className="flex items-center justify-between text-[11.5px] font-mono text-text-dim">
                                <span className="uppercase font-semibold flex items-center gap-1.5 text-text-main">
                                    {isCurrentVideo ? <Video size={13} /> : <ImageIcon size={13} />}
                                    <span>{isCurrentVideo ? 'Video Adjunto' : 'Captura Adjunta'}</span>
                                </span>
                                {activeFiles.length > 1 && (
                                    <span>{activeMediaIndex + 1} de {activeFiles.length}</span>
                                )}
                            </div>

                            <div className="relative flex items-center justify-center min-h-[220px] max-h-[380px] rounded-lg border border-border-thin bg-surface p-2 overflow-hidden">
                                {isCurrentVideo ? (
                                    <video
                                        src={currentMediaUrl}
                                        controls
                                        autoPlay
                                        className="max-h-[360px] w-auto max-w-full rounded object-contain"
                                    />
                                ) : (
                                    <img
                                        src={currentMediaUrl}
                                        alt={currentMedia.nombre_original || 'Captura'}
                                        className="max-h-[360px] w-auto max-w-full rounded object-contain select-none"
                                    />
                                )}

                                {activeFiles.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setActiveMediaIndex(prev => (prev > 0 ? prev - 1 : activeFiles.length - 1))}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/90 border border-border-thin text-text-main flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                            title="Anterior [←]"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveMediaIndex(prev => (prev < activeFiles.length - 1 ? prev + 1 : 0))}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/90 border border-border-thin text-text-main flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                            title="Siguiente [→]"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </>
                                )}
                            </div>

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
                                                className={`h-14 w-auto min-w-[48px] rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer relative bg-surface ${
                                                    isSelected ? 'border-brand ring-2 ring-brand/20 scale-105' : 'border-border-thin opacity-70 hover:opacity-100'
                                                }`}
                                                title={f.nombre_original || 'Adjunto'}
                                            >
                                                {isV ? (
                                                    <div className="w-full h-full flex items-center justify-center p-1 text-text-dim">
                                                        <Video size={14} />
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

                    {/* Metadatos Técnicos (exclusivo Admin o si existen) */}
                    {isAdmin && parsedMetadata && (
                        <div className="bento-card static p-4 space-y-3">
                            <h4 className="text-[12px] font-mono font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                                <Monitor size={14} className="text-brand" />
                                <span>Metadatos Técnicos del Entorno y Navegador</span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11.5px]">
                                <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5">
                                    <span className="text-[10px] font-mono text-text-dim uppercase block">Navegador</span>
                                    <p className="font-semibold text-text-main truncate">
                                        {parsedMetadata.browser || 'No registrado'}
                                    </p>
                                </div>

                                <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5">
                                    <span className="text-[10px] font-mono text-text-dim uppercase block">Sistema Operativo</span>
                                    <p className="font-semibold text-text-main truncate">
                                        {parsedMetadata.os || 'No registrado'}
                                    </p>
                                </div>

                                <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5">
                                    <span className="text-[10px] font-mono text-text-dim uppercase block">Pantalla / Ventana</span>
                                    <p className="font-semibold text-text-main truncate">
                                        {parsedMetadata.screen ? `${parsedMetadata.screen} (Ventana: ${parsedMetadata.viewport || ''})` : 'No registrado'}
                                    </p>
                                </div>

                                <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5">
                                    <span className="text-[10px] font-mono text-text-dim uppercase block">Conexión</span>
                                    <p className="font-semibold text-text-main truncate flex items-center gap-1">
                                        <Wifi size={12} className="text-emerald-500" />
                                        <span>{parsedMetadata.connectionType || (parsedMetadata.isOnline ? 'En línea' : 'Desconocida')}</span>
                                    </p>
                                </div>

                                <div className="p-2.5 rounded-lg border border-border-thin bg-bg-deep space-y-0.5 sm:col-span-2">
                                    <span className="text-[10px] font-mono text-text-dim uppercase block">Hardware (Memoria / Núcleos)</span>
                                    <p className="font-semibold text-text-main truncate">
                                        {parsedMetadata.deviceMemoryGB ? `${parsedMetadata.deviceMemoryGB} RAM` : ''} {parsedMetadata.hardwareConcurrency ? `· ${parsedMetadata.hardwareConcurrency}` : ''} {!parsedMetadata.deviceMemoryGB && !parsedMetadata.hardwareConcurrency ? 'Estándar' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hilo de Conversación Bidireccional */}
                    <div className="bento-card static p-4 space-y-3">
                        <FeedbackDiscussionThread
                            report={report}
                            isAdmin={isAdmin}
                            onMessageSent={(updated) => {
                                if (onReportUpdated) {
                                    onReportUpdated(updated);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Footer del Panel */}
                <div className="p-4 border-t border-border-thin bg-surface shrink-0 flex items-center justify-between">
                    <div className="text-[11px] text-text-dim font-mono">
                        {report.nombre_usuario || report.nombreUsuario
                            ? `Reportado por ${report.nombre_usuario || report.nombreUsuario}`
                            : 'Buzón de incidencias DIITRA'}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-vercel-secondary text-[12px] font-medium px-4 py-1.5 cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
