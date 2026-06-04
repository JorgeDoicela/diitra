import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'destructive' | 'warning';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
    const resolveRef = useRef<(value: boolean) => void>(() => {});

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleCancel = useCallback(() => {
        setIsOpen(false);
        resolveRef.current(false);
    }, []);

    const handleConfirm = useCallback(() => {
        setIsOpen(false);
        resolveRef.current(true);
    }, []);

    // Esc listener to close modal on Escape key press
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleCancel]);

    // Determine confirm button class based on variant
    const getConfirmBtnClass = () => {
        const base = 'btn-vercel-primary transition-all active:scale-[0.98] font-bold text-xs uppercase tracking-widest';
        if (options.variant === 'destructive') {
            return `${base} !bg-red-600 hover:!bg-red-700 !border-red-600 !text-white`;
        }
        if (options.variant === 'warning') {
            return `${base} !bg-amber-500 hover:!bg-amber-600 !border-amber-500 !text-white`;
        }
        return base;
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {isOpen && (
                <div 
                    className="modal-overlay animate-fade-in" 
                    style={{ zIndex: 999999 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            handleCancel();
                        }
                    }}
                >
                    <div className="modal-card max-w-md animate-scale-up">
                        <div className="modal-header border-b border-border-thin flex justify-between items-center py-3.5 px-5">
                            <div className="flex items-center gap-2">
                                {options.variant === 'destructive' && (
                                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                )}
                                {options.variant === 'warning' && (
                                    <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                                )}
                                <h3 className="font-bold text-text-main text-xs uppercase tracking-widest">
                                    {options.title || 'Confirmación'}
                                </h3>
                            </div>
                            <button 
                                onClick={handleCancel} 
                                className="text-text-dim hover:text-text-main p-1 transition-colors rounded-lg hover:bg-surface-hover"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="modal-body p-5">
                            <p className="text-xs text-text-dim leading-relaxed font-medium">
                                {options.message}
                            </p>
                        </div>
                        <div className="modal-footer border-t border-border-thin py-3 px-5 flex justify-end gap-2 bg-transparent">
                            <button 
                                onClick={handleCancel} 
                                className="btn-vercel-secondary transition-all active:scale-[0.98] font-bold text-xs uppercase tracking-widest"
                            >
                                {options.cancelText || 'Cancelar'}
                            </button>
                            <button 
                                onClick={handleConfirm} 
                                className={getConfirmBtnClass()}
                            >
                                {options.confirmText || 'Aceptar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (context === undefined) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
};
