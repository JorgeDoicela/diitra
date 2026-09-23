import React, { useContext } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { SectionGuardContext, SectionLockContext } from '../../core/documents/context/DocumentDataContext';
import { useAuth } from '../../api/AuthContext';
import { BlockClipboardWrapper } from '../../core/clipboard/components/BlockClipboardWrapper';

interface SectionBlockGuardProps {
    id: string;
    title: string;
    children: React.ReactNode;
    showInlineLock?: boolean;
    instructions?: string;
    requirementText?: string;
    fieldKey?: string;
    /** Serializador explícito para el contenido estructurado de esta sección. */
    contentSerializer?: (data: unknown) => string;
}

export const SectionBlockGuard: React.FC<SectionBlockGuardProps> = ({
    id,
    title,
    children,
    showInlineLock = false,
    instructions,
    requirementText,
    fieldKey,
    contentSerializer
}) => {
    const { isAdmin } = useAuth();
    const lockContext = useContext(SectionLockContext);

    /**
     * IMPORTANTE: useMemo se declara ANTES del early return para cumplir con
     * React Rules of Hooks (los hooks deben llamarse en el mismo orden siempre).
     * Maneja lockContext = null de forma segura con optional chaining.
     */
    const shouldShowLock = React.useMemo(() => {
        if (!lockContext) return false;
        const { formData: fd, isDirectorOrAdmin } = lockContext;
        const isBlocked = fd?.BlockedSections?.[id] === true;
        if (isBlocked) return true;
        if (isAdmin) return true;
        if (isDirectorOrAdmin) {
            const hasMultipleResearchers = Array.isArray(fd?.Investigadores) && fd.Investigadores.length > 1;
            const hasResearchGroup = fd?.GrupoInvestigacionTipo === 'SI' || fd?.TieneGrupoInvestigacion;
            return hasMultipleResearchers || hasResearchGroup;
        }
        return false;
    }, [lockContext, id, isAdmin]);

    // Safety fallback si el contexto de bloqueo no está cargado
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
            <BlockClipboardWrapper
                title={title}
                fieldKey={fieldKey || id}
                instructions={instructions}
                requirementText={requirementText}
                contentSerializer={contentSerializer}
            >
                {showInlineLock && !readOnly && shouldShowLock && (
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
            </BlockClipboardWrapper>
        </SectionGuardContext.Provider>
    );
};

export default SectionBlockGuard;
