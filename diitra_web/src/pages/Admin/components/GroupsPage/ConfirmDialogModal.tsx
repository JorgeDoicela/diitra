import React from 'react';
import { XCircle, AlertTriangle, CheckCircle, Shield, Loader2 } from 'lucide-react';
import type { ConfirmDialogState } from './types';

interface ConfirmDialogModalProps {
    confirmDialog: ConfirmDialogState;
    setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState>>;
    isConfirming?: boolean;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
    confirmDialog,
    setConfirmDialog,
    isConfirming = false,
}) => {
    if (!confirmDialog.isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[10005] flex justify-end"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isConfirming) {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }}
        >
            <div className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm animate-fade-in" />
            <div className="relative w-full max-w-md h-full bg-surface border-l border-border-thin flex flex-col z-10 shadow-2xl animate-slide-in-right">
                <div className="modal-header border-b border-border-thin flex justify-between items-center py-4 px-6 bg-surface">
                    <div className="flex items-center gap-3">
                        <div className={`icon-circle ${
                            confirmDialog.type === 'danger' ? 'icon-circle-error' :
                            confirmDialog.type === 'warning' ? 'icon-circle-warning' :
                            confirmDialog.type === 'success' ? 'icon-circle-success' :
                            'icon-circle-info'
                        }`}>
                            {confirmDialog.type === 'danger' && <XCircle size={18} />}
                            {confirmDialog.type === 'warning' && <AlertTriangle size={18} />}
                            {confirmDialog.type === 'success' && <CheckCircle size={18} />}
                            {confirmDialog.type === 'info' && <Shield size={18} />}
                        </div>
                        <h3 className="text-sm font-semibold text-text-main tracking-tight">
                            {confirmDialog.title}
                        </h3>
                    </div>
                </div>
                <div className="modal-body flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <p className="text-xs text-text-dim leading-relaxed font-medium">
                        {confirmDialog.message}
                    </p>
                </div>
                <div className="modal-footer border-t border-border-thin py-4 px-6 flex justify-end gap-2.5 bg-surface">
                    {!confirmDialog.isAlert && (
                        <button
                            onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                            disabled={isConfirming}
                            className="btn-vercel-secondary !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        disabled={isConfirming}
                        onClick={async () => {
                            try {
                                await confirmDialog.onConfirm();
                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                            } catch {
                                // onConfirm handles errors internally
                            }
                        }}
                        className={`!py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            confirmDialog.isAlert ? 'btn-vercel-primary' :
                            confirmDialog.type === 'danger' ? 'bg-error hover:opacity-90 border border-error text-white font-bold text-[10px] uppercase tracking-widest px-5 rounded-md transition-all' :
                            confirmDialog.type === 'warning' ? 'bg-warning hover:opacity-90 border border-warning text-white font-bold text-[10px] uppercase tracking-widest px-5 rounded-md transition-all' :
                            'btn-vercel-primary'
                        }`}
                    >
                        {isConfirming && <Loader2 size={14} className="animate-spin" />}
                        {isConfirming ? 'Procesando...' : (confirmDialog.confirmText || (confirmDialog.isAlert ? 'Aceptar' : 'Confirmar'))}
                    </button>
                </div>
            </div>
        </div>
    );
};
