import React from 'react';
import { Scale, X, Loader2, CheckCircle, RotateCcw } from 'lucide-react';

interface FinalizeAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    generalFeedback: string;
    setGeneralFeedback: (val: string) => void;
    submitting: boolean;
    onAprobar: () => Promise<void>;
    onDevolver: () => Promise<void>;
}

export const FinalizeAuditModal: React.FC<FinalizeAuditModalProps> = ({
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in">
            <div className="w-[500px] max-w-[90%] bg-surface border border-border-thin rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] p-5 space-y-4 animate-scale-up font-sans">
                <div className="flex items-center justify-between border-b border-border-thin/50 pb-3.5">
                    <div className="flex items-center gap-2">
                        <Scale size={16} className="text-brand" />
                        <span className="text-[10px] font-black text-text-main uppercase tracking-widest font-mono">Finalizar Auditoría</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-surface-hover border border-border-thin rounded-lg text-text-dim hover:text-text-main transition-all cursor-pointer"
                        title="Cerrar modal"
                    >
                        <X size={12} />
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="text-[8px] font-black text-text-dim uppercase tracking-widest block font-mono ml-0.5">Observaciones Generales de la Auditoría</label>
                    <textarea
                        value={generalFeedback}
                        onChange={(e) => setGeneralFeedback(e.target.value)}
                        placeholder="Escriba la síntesis del informe o instrucciones generales de corrección para el docente..."
                        className="w-full h-32 bg-bg-deep border border-border-thin rounded-xl p-3.5 text-xs text-text-main placeholder:text-text-dim/60 outline-none focus:border-brand/45 transition-all resize-none font-sans leading-relaxed custom-scrollbar"
                        disabled={submitting}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border-thin/50 pt-4">
                    <button
                        onClick={async () => {
                            await onAprobar();
                            onClose();
                        }}
                        disabled={submitting}
                        className="flex items-center justify-center gap-1.5 btn-vercel-primary py-3 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
                    >
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Aprobar Requisitos
                    </button>

                    <button
                        onClick={async () => {
                            await onDevolver();
                            onClose();
                        }}
                        disabled={submitting}
                        className="flex items-center justify-center gap-1.5 bg-transparent hover:bg-error/10 text-error border border-error/20 hover:border-error/40 rounded-xl py-3 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                    >
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                        Devolver Proyecto
                    </button>
                </div>
            </div>
        </div>
    );
};
