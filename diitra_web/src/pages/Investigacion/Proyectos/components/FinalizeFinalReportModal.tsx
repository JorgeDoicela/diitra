import React from 'react';
import { Award, X, Loader2, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

interface FinalizeFinalReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    generalFeedback: string;
    setGeneralFeedback: (val: string) => void;
    submitting: boolean;
    onAprobar: () => Promise<boolean>;
    onDevolver: () => Promise<boolean>;
}

export const FinalizeFinalReportModal: React.FC<FinalizeFinalReportModalProps> = ({
    isOpen,
    onClose,
    generalFeedback,
    setGeneralFeedback,
    submitting,
    onAprobar,
    onDevolver
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in font-sans">
            <div className="w-[540px] max-w-[92%] bg-surface border border-border-thin rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] p-6 space-y-4 animate-scale-up">
                <div className="flex items-center justify-between border-b border-border-thin/50 pb-3.5">
                    <div className="flex items-center gap-2">
                        <Award size={18} className="text-emerald-500" />
                        <span className="text-xs font-black text-text-main uppercase tracking-widest font-mono">
                            Dictamen de Cierre Institucional
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-surface-hover border border-border-thin rounded-lg text-text-dim hover:text-text-main transition-all cursor-pointer"
                        title="Cerrar modal"
                    >
                        <X size={13} />
                    </button>
                </div>

                <div className="p-3.5 bg-brand/10 border border-brand/20 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-text-main flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-brand" /> Resolución Oficial CACES
                    </p>
                    <p className="text-[11px] text-text-dim leading-relaxed">
                        Al aprobar el cierre, el proyecto pasará al estado inmutable <strong>Finalizado</strong>, se emitirá el Acta de Cierre y se generarán los certificados de acreditación institucional para todo el equipo.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block font-mono">
                        Observaciones y Dictamen Técnico
                    </label>
                    <textarea
                        value={generalFeedback}
                        onChange={(e) => setGeneralFeedback(e.target.value)}
                        placeholder="Ingrese la fundamentación del dictamen de cierre o las observaciones específicas en caso de requerir correcciones..."
                        className="w-full h-28 bg-bg-deep border border-border-thin rounded-xl p-3 text-xs text-text-main placeholder:text-text-dim/60 outline-none focus:border-brand/45 transition-all resize-none leading-relaxed custom-scrollbar"
                        disabled={submitting}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border-thin/50 pt-4">
                    <button
                        onClick={async () => {
                            const success = await onAprobar();
                            if (success) onClose();
                        }}
                        disabled={submitting}
                        className="flex items-center justify-center gap-1.5 btn-vercel-primary !bg-emerald-600 hover:!bg-emerald-700 !text-white py-3 text-xs font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
                    >
                        {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Aprobar Cierre
                    </button>

                    <button
                        onClick={async () => {
                            const success = await onDevolver();
                            if (success) onClose();
                        }}
                        disabled={submitting}
                        className="flex items-center justify-center gap-1.5 bg-transparent hover:bg-error/10 text-error border border-error/20 hover:border-error/40 rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                    >
                        {submitting ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                        Devolver para Ajustes
                    </button>
                </div>
            </div>
        </div>
    );
};
