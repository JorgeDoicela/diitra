import React from 'react';
import {
    Award, Loader2, X
} from 'lucide-react';
import { useGroupDetail } from './GroupDetail/useGroupDetail';
import type { Group, Career, ResearchLine } from './GroupDetail/useGroupDetail';
import { GroupInfoTab } from './GroupDetail/GroupInfoTab';
import { GroupDocumentsTab } from './GroupDetail/GroupDocumentsTab';
import { GroupChatTab } from './GroupDetail/GroupChatTab';
import { GroupProjectsTab } from './GroupDetail/GroupProjectsTab';
import { FieldFeedbackDrawer } from './GroupDetail/FieldFeedbackDrawer';

interface Domain {
    id_dominio: number;
    nombre: string;
}

interface GroupDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    detailGroup: Group | null;
    setDetailGroup: React.Dispatch<React.SetStateAction<Group | null>>;
    isAdmin: boolean;
    user: any;
    dominios: Domain[];
    carreras: Career[];
    lines: ResearchLine[];
    formatCareerName: (name: string) => string;
    handleOpenReview: (group: Group) => void;
    fetchData?: () => void;
    isEditingInitial?: boolean;
}

export const GroupDetailDrawer: React.FC<GroupDetailDrawerProps> = ({
    isOpen,
    onClose,
    detailGroup,
    setDetailGroup,
    isAdmin,
    user,
    dominios,
    carreras,
    lines,
    formatCareerName,
    handleOpenReview,
    fetchData,
    isEditingInitial
}) => {
    const hook = useGroupDetail({
        isOpen,
        detailGroup,
        setDetailGroup,
        isAdmin,
        user,
        carreras,
        lines,
        isEditingInitial,
        fetchData,
        onClose
    });

    const {
        detailTab,
        setDetailTab,
        isEditing,
        setIsEditing,
        savingInline,
        handleCloseAttempt,
        handleSaveInlineChanges,
        canEdit,
        isMember,
        highlightedField,
        openFieldFeedbackDrawer,
        getFieldComments
    } = hook;

    if (!isOpen || !detailGroup) return null;

    const renderFieldFeedbackButton = (fieldKey: string, fieldName: string) => {
        const comments = getFieldComments(fieldKey);
        const hasComments = comments.length > 0;
        
        if (!isMember) return null;
        if (!hasComments && !isAdmin) return null;
        
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    openFieldFeedbackDrawer(fieldKey, fieldName);
                }}
                className={`flex items-center gap-1.5 p-1 rounded-lg border transition-all active:scale-95 shrink-0 ${
                    hasComments
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/30'
                        : 'border-transparent text-text-dim/40 hover:text-text-main hover:bg-surface-hover'
                }`}
                title={hasComments ? `Ver ${comments.length} observaciones` : 'Agregar observación contextual'}
            >
                <span className="text-[10px] font-medium leading-none">
                    {hasComments ? `${comments.length} obs` : '+ obs'}
                </span>
            </button>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <div 
                className="absolute inset-0 bg-bg-deep/60 backdrop-blur-sm transition-opacity" 
                onClick={() => handleCloseAttempt('close-drawer')}
            />

            <div className="relative flex h-full w-full max-w-2xl bg-surface border-l border-border-thin shadow-2xl flex-col z-10 animate-fade-in-right overflow-visible">
                {/* Field feedback lateral drawer */}
                <FieldFeedbackDrawer hook={hook} user={user} isAdmin={isAdmin} />

                {/* Header */}
                <div className="modal-header border-b border-border-thin flex justify-between items-center p-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="icon-circle icon-circle-brand shrink-0">
                            <Award size={20} />
                        </div>
                        <div
                            id="field-container-siglas"
                            className={`min-w-0 transition-all duration-500 rounded-lg px-2 py-1 flex-1 ${
                                highlightedField === 'siglas'
                                    ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                    : ''
                            }`}
                        >
                            <h3 className="text-lg font-semibold text-text-main tracking-tight truncate" title={detailGroup.nombre}>{detailGroup.nombre}</h3>
                            <div className="flex items-center gap-2">
                                <p className="section-label text-text-dim truncate">
                                    {detailGroup.tipo_grupo === 'Semillero' ? 'Semillero' : 'Grupo de Investigación'} — {detailGroup.siglas || 'SIN_SIGLAS'}
                                </p>
                                {renderFieldFeedbackButton('siglas', 'Siglas del Grupo')}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                        {canEdit && detailTab === 'info' && (
                            <button
                                onClick={() => {
                                    if (isEditing) {
                                        handleCloseAttempt('cancel-edit');
                                    } else {
                                        setIsEditing(true);
                                    }
                                }}
                                className="px-3.5 py-1.5 border border-border-thin bg-surface-hover hover:border-border-hover rounded-xl text-[9px] font-black uppercase tracking-widest text-text-main transition-all"
                            >
                                {isEditing ? 'Cancelar Edición' : 'Editar Grupo'}
                            </button>
                        )}
                        <button
                            onClick={() => handleCloseAttempt('close-drawer')}
                            className="p-2 hover:bg-surface-hover rounded-xl text-text-dim hover:text-text-main transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {!isEditing && (
                    <div className="flex border-b border-border-thin bg-bg-deep/20 shrink-0">
                        <button
                            onClick={() => setDetailTab('info')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                                detailTab === 'info'
                                    ? 'border-brand text-text-main bg-brand/5'
                                    : 'border-transparent text-text-dim/60 hover:text-text-main'
                            }`}
                        >
                            Información
                        </button>
                        <button
                            onClick={() => setDetailTab('documento')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                                detailTab === 'documento'
                                    ? 'border-brand text-text-main bg-brand/5'
                                    : 'border-transparent text-text-dim/60 hover:text-text-main'
                            }`}
                        >
                            Documento Oficial
                        </button>
                        {isMember && (
                            <button
                                onClick={() => setDetailTab('feedback')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                                    detailTab === 'feedback'
                                        ? 'border-brand text-text-main bg-brand/5'
                                        : 'border-transparent text-text-dim/60 hover:text-text-main'
                                }`}
                            >
                                Retroalimentación
                            </button>
                        )}
                        <button
                            onClick={() => setDetailTab('proyectos')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                                detailTab === 'proyectos'
                                    ? 'border-brand text-text-main bg-brand/5'
                                    : 'border-transparent text-text-dim/60 hover:text-text-main'
                            }`}
                        >
                            Proyectos
                        </button>
                    </div>
                )}

                {/* Content area */}
                {detailTab === 'info' && (
                    <GroupInfoTab
                        hook={hook}
                        dominios={dominios}
                        carreras={carreras}
                        lines={lines}
                        formatCareerName={formatCareerName}
                        renderFieldFeedbackButton={renderFieldFeedbackButton}
                    />
                )}

                {detailTab === 'documento' && (
                    <GroupDocumentsTab
                        hook={hook}
                    />
                )}

                {isMember && detailTab === 'feedback' && (
                    <GroupChatTab
                        hook={hook}
                        user={user}
                    />
                )}

                {detailTab === 'proyectos' && (
                    <GroupProjectsTab
                        hook={hook}
                    />
                )}

                {/* Footer */}
                <div className="modal-footer shrink-0 border-t border-border-thin p-4 flex justify-end gap-2 bg-bg-deep/10">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => handleCloseAttempt('cancel-edit')}
                                className="btn-vercel-secondary"
                                disabled={savingInline}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveInlineChanges}
                                className="btn-vercel-primary flex items-center gap-2"
                                disabled={savingInline}
                            >
                                {savingInline ? <Loader2 size={12} className="animate-spin" /> : null}
                                <span>Guardar Cambios</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleCloseAttempt('close-drawer')} className="btn-vercel-secondary">Cerrar</button>
                            {isAdmin && detailGroup.estado === 'Pendiente' && (
                                <button
                                    onClick={() => handleOpenReview(detailGroup)}
                                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-bg-deep font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/10 shrink-0"
                                >
                                    Evaluar Propuesta
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
