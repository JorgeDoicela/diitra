import React, { useContext } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { SectionGuardContext, SectionLockContext } from '../../core/documents/context/DocumentDataContext';

interface SectionBlockGuardProps {
    id: string;
    title: string;
    children: React.ReactNode;
    showInlineLock?: boolean;
}

export const SectionBlockGuard: React.FC<SectionBlockGuardProps> = ({
    id,
    title,
    children,
    showInlineLock = false
}) => {
    const lockContext = useContext(SectionLockContext);
    
    // Safety fallback if context is not loaded
    if (!lockContext) {
        return <>{children}</>;
    }

    const { formData, readOnly, isDirectorOrAdmin, onUpdateField } = lockContext;

    const isBlocked = formData?.BlockedSections?.[id] === true;
    const isReadOnlyForUser = readOnly || (isBlocked && !isDirectorOrAdmin);

    const handleToggleLock = () => {
        if (onUpdateField) {
            const currentBlocked = formData?.BlockedSections || {};
            const nextBlocked = {
                ...currentBlocked,
                [id]: !isBlocked
            };
            onUpdateField('BlockedSections', nextBlocked);
        }
    };

    return (
        <SectionGuardContext.Provider value={{ 
            readOnly: isReadOnlyForUser,
            id,
            title,
            isBlocked,
            handleToggleLock
        }}>
            {showInlineLock && !readOnly && (
                <div className="flex justify-end mb-2 select-none">
                    <div className="flex items-center gap-2 bg-surface/50 border border-border-thin px-3 py-1 rounded-full animate-fade-in text-[9px] font-bold uppercase tracking-wider">
                        {isBlocked ? (
                            <>
                                <div className="flex items-center gap-1.5">
                                    <Lock size={11} className="text-amber-500 animate-pulse" />
                                    <span className="text-amber-500">Bloqueado</span>
                                </div>
                                {isDirectorOrAdmin && (
                                    <button
                                        onClick={handleToggleLock}
                                        className="ml-1 px-2.5 py-0.5 bg-text-main hover:opacity-90 text-bg-deep transition-all rounded-full font-black text-[8px]"
                                    >
                                        Desbloquear
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-1.5">
                                    <Unlock size={11} className="text-text-dim" />
                                    <span className="text-text-dim">Abierto</span>
                                </div>
                                {isDirectorOrAdmin && (
                                    <button
                                        onClick={handleToggleLock}
                                        className="ml-1 px-2.5 py-0.5 border border-border-thin hover:border-text-main hover:text-text-main text-text-dim transition-all rounded-full font-black text-[8px]"
                                    >
                                        Bloquear
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
            {children}
        </SectionGuardContext.Provider>
    );
};

export default SectionBlockGuard;
