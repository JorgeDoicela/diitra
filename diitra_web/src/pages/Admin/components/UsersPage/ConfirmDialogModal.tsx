import React from 'react';
import { XCircle, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import type { ConfirmDialog } from '../../hooks/useUsersPage';

interface ConfirmDialogModalProps {
    confirmDialog: ConfirmDialog;
    setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialog>> | ((dialog: ConfirmDialog | ((prev: ConfirmDialog) => ConfirmDialog)) => void);
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
    confirmDialog,
    setConfirmDialog
}) => {
    if (!confirmDialog.isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card animate-scale-up max-w-md">
                <div className="modal-header !py-4">
                    <div className="flex items-center gap-3">
                        <div className={`icon-circle ${confirmDialog.type === 'danger' ? 'icon-circle-error' :
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
                    <div className="text-xs text-text-dim leading-relaxed font-medium whitespace-pre-wrap">
                        {confirmDialog.message}
                    </div>
                </div>
                <div className="modal-footer bg-surface/50 !py-3">
                    {confirmDialog.type === 'success' ? (
                        <button
                            onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                            className="btn-vercel-primary !py-2 px-6"
                        >
                            Entendido
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                                className="btn-vercel-secondary !py-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                    await confirmDialog.onConfirm();
                                }}
                                className={`!py-2 ${confirmDialog.type === 'danger' ? 'bg-error hover:opacity-90 border border-error text-white font-bold text-[10px] uppercase tracking-widest px-5 rounded-md transition-all' :
                                    confirmDialog.type === 'warning' ? 'bg-warning hover:opacity-90 border border-warning text-white font-bold text-[10px] uppercase tracking-widest px-5 rounded-md transition-all' :
                                        'btn-vercel-primary'
                                    }`}
                            >
                                Confirmar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
