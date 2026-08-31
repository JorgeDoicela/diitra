import React from 'react';
import { Award, ChevronRight, FileText, Shield } from 'lucide-react';
import type { GroupFormDrawerProps } from './GroupFormDrawer/types';
import { useGroupFormDrawer } from './GroupFormDrawer/hooks/useGroupFormDrawer';
import { BasicConfigSection } from './GroupFormDrawer/components/BasicConfigSection';
import { CoordinatorSection } from './GroupFormDrawer/components/CoordinatorSection';
import { LinkedCareersSection } from './GroupFormDrawer/components/LinkedCareersSection';
import { IdentityStatementsSection } from './GroupFormDrawer/components/IdentityStatementsSection';
import { ResearchLinesSection } from './GroupFormDrawer/components/ResearchLinesSection';
import { TeamMembersSection } from './GroupFormDrawer/components/TeamMembersSection';

// Re-export types for backward compatibility
export type { GroupMember, Group, ResearchLine, Domain, Career, GroupFormDrawerProps } from './GroupFormDrawer/types';

export const GroupFormDrawer: React.FC<GroupFormDrawerProps> = (props) => {
    const { isOpen, dominios, carreras, lines, formatCareerName } = props;

    const {
        isDraftRestored,
        discardDraft,
        formData,
        setFormData,
        groupMembers,
        selectedCoordName,
        selectedCoordCareer,
        handleSelectCoordinator,
        handleAddMember,
        handleRemoveMember,
        toggleLine,
        handleSubmitForm,
        handleCloseModal
    } = useGroupFormDrawer(props);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={handleCloseModal}
            />

            <div className="relative h-full flex items-center">
                <div className="relative w-full max-w-3xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                    {/* Header */}
                    <div className="modal-header">
                        <div className="flex items-center gap-3">
                            <div className="icon-circle icon-circle-brand">
                                <Award size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-main tracking-tight">
                                    Nuevo Grupo de Investigación
                                </h3>
                                <p className="section-label text-text-dim">Configuración de propuesta y equipo inicial</p>
                            </div>
                        </div>
                        <button onClick={handleCloseModal} className="text-text-dim hover:text-text-main transition-colors cursor-pointer">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Form body */}
                    <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
                        {isDraftRestored && (
                            <div className="border border-border-thin bg-surface-hover rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in">
                                <div className="flex items-center gap-3">
                                    <FileText size={16} className="text-text-main shrink-0" />
                                    <p className="text-xs text-text-dim">
                                        <span className="text-text-main font-semibold">Borrador restaurado:</span> Se han recuperado tus datos no guardados localmente.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={discardDraft}
                                    className="text-xs font-medium text-brand hover:underline cursor-pointer shrink-0"
                                >
                                    Descartar borrador
                                </button>
                            </div>
                        )}

                        <div className="space-y-3 animate-fade-up">
                            <div className="border border-border-thin bg-surface-hover rounded-lg p-3 flex items-center gap-3">
                                <Shield size={16} className="text-text-main shrink-0" />
                                <p className="text-xs text-text-dim">
                                    Las propuestas se envían en estado <span className="text-text-main font-semibold">Pendiente</span> para su revisión y requieren aprobación formal del administrador antes de su activación.
                                </p>
                            </div>
                        </div>

                        {/* Subcomponent Sections */}
                        <BasicConfigSection
                            formData={formData}
                            setFormData={setFormData}
                            dominios={dominios}
                        />

                        <CoordinatorSection
                            selectedCoordName={selectedCoordName}
                            selectedCoordCedula={formData.id_profesor_coordinador || ''}
                            selectedCoordCareer={selectedCoordCareer}
                            handleSelectCoordinator={handleSelectCoordinator}
                        />

                        <LinkedCareersSection
                            carreras_ids={formData.carreras_ids}
                            carreras={carreras}
                            formatCareerName={formatCareerName}
                        />

                        <IdentityStatementsSection
                            formData={formData}
                            setFormData={setFormData}
                        />

                        <ResearchLinesSection
                            lines={lines}
                            selectedLineIds={formData.lineas_ids}
                            toggleLine={toggleLine}
                        />

                        <TeamMembersSection
                            groupMembers={groupMembers}
                            handleRemoveMember={handleRemoveMember}
                            formatCareerName={formatCareerName}
                            handleAddMember={handleAddMember}
                            coordinatorCedula={formData.id_profesor_coordinador}
                        />
                    </form>

                    {/* Footer */}
                    <div className="modal-footer shrink-0 border-t border-border-thin bg-surface">
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="btn-vercel-secondary !py-2 !px-4 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitForm}
                                className="btn-vercel-primary !py-2 !px-5 cursor-pointer"
                            >
                                Enviar Propuesta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
