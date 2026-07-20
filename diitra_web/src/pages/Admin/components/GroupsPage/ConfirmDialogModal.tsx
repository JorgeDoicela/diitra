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
        <div className="modal-overlay" style={{ zIndex: 10005 }}>
            <div className="modal-card animate-scale-up max-w-md">
                <div className="modal-header !py-4">
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
                <div className="modal-body py-6">
                    <p className="text-xs text-text-dim leading-relaxed font-medium">
                        {confirmDialog.message}
                    </p>
                </div>
                <div className="modal-footer bg-surface/50 !py-3">
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
