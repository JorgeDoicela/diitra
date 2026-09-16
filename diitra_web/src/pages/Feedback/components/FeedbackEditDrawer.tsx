import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, X, Bug, HelpCircle, AlertTriangle, Loader2, Video } from 'lucide-react';
import { getFeedbackMediaUrl, type FeedbackReporte } from '../../../services/feedbackService';

interface FeedbackEditDrawerProps {
    report: FeedbackReporte | null;
    isSaving: boolean;
    error: string | null;
    onClose: () => void;
    onSave: (id: number, data: { tipo: string; titulo: string; descripcion: string }) => Promise<void>;
}

export const FeedbackEditDrawer: React.FC<FeedbackEditDrawerProps> = ({
    report,
    isSaving,
    error,
    onClose,
    onSave
}) => {
    const [tipo, setTipo] = useState<string>('ERROR');
    const [titulo, setTitulo] = useState<string>('');
    const [descripcion, setDescripcion] = useState<string>('');
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (report) {
            setTipo(report.tipo || 'ERROR');
            setTitulo(report.titulo || '');
            setDescripcion(report.descripcion || '');
            setValidationError(null);
        }
    }, [report]);

    useEffect(() => {
        if (!report) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSaving) {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [report, isSaving, onClose]);

    if (!report) return null;

    const reportId = report.id_feedback || report.idFeedback;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportId) return;

        if (!titulo.trim() || !descripcion.trim()) {
            setValidationError('El título y la descripción son obligatorios.');
            return;
        }

        setValidationError(null);
        await onSave(reportId, {
            tipo,
            titulo: titulo.trim(),
            descripcion: descripcion.trim()
        });
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-edit-drawer-title"
        >
            {/* Backdrop Blur Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={() => !isSaving && onClose()}
            />

            {/* Modal Centrado */}
            <div className="relative w-full max-w-lg sm:max-w-xl max-h-[88vh] bg-surface border border-border-thin rounded-2xl shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                {/* Header del Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface shrink-0">
                    <div className="flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-brand" />
                        <h3 id="feedback-edit-drawer-title" className="text-[15px] font-bold text-text-main tracking-tight">
                            Editar Incidencia
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-50"
                        aria-label="Cerrar panel"
                        title="Cerrar [ESC]"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Formulario */}
                <form
                    id="edit-feedback-form"
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface custom-scrollbar"
                >
                    {(error || validationError) && (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2.5">
                            <AlertTriangle size={16} className="shrink-0" />
                            <span className="font-medium">{validationError || error}</span>
                        </div>
                    )}

                    {/* Selector de Tipo (Choice Cards) */}
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
                                    activeBg: 'bg-red-500/5',
                                    activeText: 'text-red-500',
                                    activeRadio: 'border-red-500 bg-red-500'
                                },
                                {
                                    value: 'DUDA',
                                    label: 'Falta una opción',
                                    desc: 'Falta un campo, opción o dato en el formulario.',
                                    icon: HelpCircle,
                                    activeColor: 'text-amber-500',
                                    activeBorder: 'border-amber-500',
                                    activeBg: 'bg-amber-500/5',
                                    activeText: 'text-amber-500',
                                    activeRadio: 'border-amber-500 bg-amber-500'
                                }
                            ].map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setTipo(t.value)}
                                    className={`group p-3 rounded-lg border text-left transition-all cursor-pointer outline-none focus:outline-none ${
                                        tipo === t.value
                                            ? `${t.activeBorder} ${t.activeBg} shadow-xs`
                                            : 'border-border-thin bg-surface-hover/50 hover:border-border-hover'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                            <t.icon size={16} className={tipo === t.value ? t.activeColor : 'text-text-dim'} />
                                            <span className={`text-[12.5px] font-semibold ${tipo === t.value ? t.activeText : 'text-text-dim group-hover:text-text-main'}`}>
                                                {t.label}
                                            </span>
                                        </div>
                                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                            tipo === t.value
                                                ? t.activeRadio
                                                : 'border-border-thin group-hover:border-text-dim'
                                        }`}>
                                            {tipo === t.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-text-dim leading-snug">
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
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Breve resumen del problema o incidencia..."
                            required
                            className="w-full px-3.5 py-2.5 text-[13px] bg-bg-deep border border-border-thin rounded-lg text-text-main focus:outline-none focus:border-brand transition-colors"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-dim uppercase tracking-wider block">
                            Descripción detallada
                        </label>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Explica qué estabas haciendo y qué problema ocurrió..."
                            rows={6}
                            required
                            className="w-full px-3.5 py-2.5 text-[13px] bg-bg-deep border border-border-thin rounded-lg text-text-main focus:outline-none focus:border-brand transition-colors resize-none custom-scrollbar leading-relaxed"
                        />
                    </div>

                    {/* Adjuntos existentes como referencia */}
                    {report.archivos && report.archivos.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border-thin">
                            <span className="text-[11px] font-mono font-semibold text-text-dim uppercase tracking-wider block">
                                Archivos adjuntos ({report.archivos.length})
                            </span>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                {report.archivos.map((adj, aIdx) => {
                                    const isV = (adj.tipo_mime || adj.tipoMime || '').startsWith('video/');
                                    const u = getFeedbackMediaUrl(adj.url);
                                    return (
                                        <div key={aIdx} className="h-16 w-auto min-w-[56px] rounded-lg overflow-hidden border border-border-thin shrink-0 bg-bg-deep flex items-center justify-center p-0.5">
                                            {isV ? (
                                                <Video size={16} className="text-text-dim" />
                                            ) : (
                                                <img src={u} alt={adj.nombre_original} className="h-full w-auto object-contain rounded" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer del Drawer */}
                <div className="p-4 px-6 border-t border-border-thin bg-surface shrink-0 flex items-center justify-between">
                    <span className="text-[11px] text-text-dim font-mono">
                        Estado: <strong>En espera</strong>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="btn-vercel-secondary text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="edit-feedback-form"
                            disabled={isSaving || !titulo.trim() || !descripcion.trim()}
                            className="btn-vercel-primary text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {isSaving && <Loader2 size={12} className="animate-spin" />}
                            <span>Guardar cambios</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
