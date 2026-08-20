// ══════════════════════════════════════════════════════════════════════════════
// DIITRA ARCHITECTURE NOTE: DIRECTRIZ DE EXTENSIBILIDAD DE TRABAJO (DECISIÓN DE DISEÑO)
// ══════════════════════════════════════════════════════════════════════════════
//
// 1. ESTABILIDAD DEL WORKSPACE CORE:
//    - Este componente (ProjectWorkspace) es un orquestador desacoplado ultraliviano.
//    - Lógica de estado delegada a Custom Hooks de Orquestación (useProjectCore, useProjectTeam,
//      useResearchProducts, usePreproposalState).
//    - Paneles extensos desacoplados en subcomponentes dedicados (PreproposalAdminView, PreproposalAuthorView).
//
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import api from '../../../../api/axios_config';
import { useNotifications } from '../../../../api/NotificationsContext';
import { FullscreenLoader } from '../../../../components/Common/FullscreenLoader';
import DocumentEditor from '../Wizard/DocumentEditor';

// Hooks de Orquestación
import { useProjectCore } from './hooks/useProjectCore';
import { useProjectTeam } from './hooks/useProjectTeam';
import { usePreproposalState } from './hooks/usePreproposalState';
import { useProjectPreferences } from '../hooks/useProjectPreferences';

// Subcomponentes Desacoplados
import WorkspaceHeader from './components/WorkspaceHeader';
import WorkspaceTitle from './components/WorkspaceTitle';
import CacesWorkflow from './components/CacesWorkflow';
import TeamManagement from './components/TeamManagement';
import WorkspaceSidebar from './components/WorkspaceSidebar';
import DirectorTransferModal from './components/DirectorTransferModal';
import { GroupDetailDrawer } from '../../../Admin/components/GroupDetailDrawer';
import { PreproposalAdminView } from './components/PreproposalAdminView';
import { PreproposalAuthorView } from './components/PreproposalAuthorView';

export const ProjectWorkspace: React.FC = () => {
    const { addToast } = useNotifications();

    const core = useProjectCore();
    const {
        templateCode,
        user,
        isAdmin,
        navigate,
        urlPrefix,
        activeDocument,
        setActiveDocument,
        isSidebarCollapsed,
        currentProject,
        setCurrentProject,
        projectDocuments,
        isLoading,
        resolvedProjectUuid,
        subDocumentUuids,
        resolvingDocument,
        isUnauthorized,
        isNotFound,
        assignedRevisionUuid,
        assignedRevisionStatus,
        iniciandoEjecucion,
        isPublishingDSpace,
        setIsPublishingDSpace,
        isPreproposalState,
        fetchProject,
        resolveDocumentInstance,
        handleIniciarEjecucion
    } = core;

    const team = useProjectTeam(
        currentProject,
        setCurrentProject,
        resolvedProjectUuid,
        isLoading,
        isPreproposalState
    );

    const preproposal = usePreproposalState(
        currentProject,
        resolvedProjectUuid,
        fetchProject
    );

    const { touchProject } = useProjectPreferences();

    useEffect(() => {
        if (currentProject?.uuid) {
            touchProject(
                currentProject.uuid,
                currentProject.titulo,
                currentProject.codigo_institucional || (currentProject as any).codigo
            );
        }
    }, [currentProject?.uuid, currentProject?.titulo, (currentProject as any)?.codigo_institucional, touchProject]);

    const editorUuid = activeDocument ? subDocumentUuids[activeDocument] : undefined;
    const preloadedData = React.useMemo(() => ({ Uuid: editorUuid }), [editorUuid]);

    const handleProjectsChanged = useCallback(() => {
        console.log("[DIITRA] Recargando datos del proyecto por evento, enfoque de ventana o polling...");
        fetchProject((data) => {
            if (data) team.populateTeamFromProject(data);
        });
        preproposal.fetchTrazabilidad();
    }, [fetchProject, team.populateTeamFromProject, preproposal.fetchTrazabilidad]);

    useEffect(() => {
        if (resolvedProjectUuid) {
            handleProjectsChanged();
        }
    }, [resolvedProjectUuid, activeDocument, handleProjectsChanged]);

    useEffect(() => {
        window.addEventListener('diitra-projects-changed', handleProjectsChanged);

        const handleFocus = () => {
            handleProjectsChanged();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleProjectsChanged();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('diitra-projects-changed', handleProjectsChanged);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleProjectsChanged]);

    // Polling en segundo plano cuando el proyecto está en un estado activo o pendiente de revisión
    useEffect(() => {
        if (!currentProject?.status) return;

        const isPendingState = ['Enviado', 'Prepropuesta', 'Prepropuesta Rechazada', 'En Revisión', 'En Corrección'].includes(currentProject.status);
        if (!isPendingState) return;

        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                handleProjectsChanged();
            }
        }, 15000); // Polling suave cada 15 segundos

        return () => clearInterval(intervalId);
    }, [currentProject?.status, handleProjectsChanged]);

    if (isLoading || !resolvedProjectUuid) {
        return <FullscreenLoader message="Cargando proyecto..." />;
    }

    if (isNotFound) {
        return (
            <div className="flex-1 bg-bg-deep flex items-center justify-center min-h-[60vh] p-6 text-center">
                <div className="bento-card static p-8 max-w-md w-full flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-text-main uppercase tracking-widest">Proyecto no encontrado</h3>
                    <p className="text-xs text-text-dim leading-relaxed">
                        El proyecto solicitado no existe o ha sido eliminado del sistema.
                    </p>
                    <button onClick={() => navigate(urlPrefix)} className="btn-vercel-primary text-xs w-full justify-center">
                        Volver a Proyectos
                    </button>
                </div>
            </div>
        );
    }

    if (isUnauthorized) {
        return (
            <div className="flex-1 bg-bg-deep flex items-center justify-center min-h-[60vh] p-6 text-center">
                <div className="bento-card static p-8 max-w-md w-full flex flex-col items-center gap-4">
                    <Shield size={48} className="text-error" />
                    <h3 className="text-sm font-semibold text-text-main uppercase tracking-widest">Acceso Restringido</h3>
                    <p className="text-xs text-text-dim leading-relaxed">
                        No tienes permisos para visualizar ni participar en este proyecto de investigación colaborativo.
                    </p>
                    <button onClick={() => navigate(urlPrefix)} className="btn-vercel-primary text-xs w-full justify-center">
                        Volver a Proyectos
                    </button>
                </div>
            </div>
        );
    }

    const handleCloseEditor = () => {
        setActiveDocument(null);
    };

    if (activeDocument) {
        const editorUuid = subDocumentUuids[activeDocument];

        if (!editorUuid) {
            return <FullscreenLoader message="Resolviendo documento..." />;
        }

        let isReadOnly = false;
        let readOnlyReason: 'state' | 'membership' | 'review' = 'state';

        if (activeDocument === 'PROTOCOLO_INVESTIGACION' || activeDocument === 'PROTOCOLO_PEER_REVIEW') {
            isReadOnly = !currentProject.puedeEditar;
            readOnlyReason = (currentProject.status !== 'Borrador' && currentProject.status !== 'En Corrección') ? 'state' : 'membership';
        } else if (activeDocument === 'PLAN_APRENDIZAJE') {
            const isTeamMember = currentProject.puedeEditar || currentProject.esParticipante || isAdmin;
            isReadOnly = !isTeamMember || currentProject.status === 'Finalizado';
            readOnlyReason = !isTeamMember ? 'membership' : 'state';
        } else if (activeDocument === 'EVALUACION_PLAN_APRENDIZAJE') {
            isReadOnly = !isAdmin;
            readOnlyReason = !isAdmin ? 'membership' : 'state';
        } else if (activeDocument === 'RUBRICA_EVALUACION') {
            isReadOnly = true;
            readOnlyReason = 'review';
        } else if (activeDocument === 'INFORME_AVANCE') {
            isReadOnly = currentProject.status === 'Finalizado';
            readOnlyReason = 'state';
        } else if (activeDocument === 'INFORME_FINAL_INVESTIGACION') {
            isReadOnly = currentProject.status !== 'En Ejecución' && currentProject.status !== 'Aprobado';
            readOnlyReason = 'state';
        } else if (activeDocument === 'OFICIO_APROBACION') {
            isReadOnly = !isAdmin;
            readOnlyReason = !isAdmin ? 'membership' : 'state';
        } else {
            isReadOnly = currentProject.status === 'Finalizado';
            readOnlyReason = 'state';
        }

        const canSignDocument = (activeDocument === 'OFICIO_APROBACION' || activeDocument === 'EVALUACION_PLAN_APRENDIZAJE')
            ? isAdmin
            : (activeDocument === 'PLAN_APRENDIZAJE' ? (currentProject.puedeFirmar || isAdmin) : currentProject.puedeFirmar);

        return (
            <DocumentEditor
                templateCode={activeDocument}
                initialData={preloadedData}
                entityUuid={resolvedProjectUuid || undefined}
                onClose={handleCloseEditor}
                readOnly={isReadOnly}
                readOnlyReason={readOnlyReason}
                projectStatus={currentProject.status}
                canSign={canSignDocument}
            />
        );
    }

    if (isPreproposalState) {
        if (isAdmin) {
            return (
                <PreproposalAdminView
                    currentProject={currentProject}
                    isSidebarCollapsed={isSidebarCollapsed}
                    urlPrefix={urlPrefix}
                    navigate={navigate}
                    feedbackMode={preproposal.feedbackMode}
                    setFeedbackMode={preproposal.setFeedbackMode}
                    activeSectionTab={preproposal.activeSectionTab}
                    setActiveSectionTab={preproposal.setActiveSectionTab}
                    adminObservation={preproposal.adminObservation}
                    setAdminObservation={preproposal.setAdminObservation}
                    sectionObservations={preproposal.sectionObservations}
                    setSectionObservations={preproposal.setSectionObservations}
                    isSubmittingAdminReview={preproposal.isSubmittingAdminReview}
                    handleAdminAprobarPrepropuesta={preproposal.handleAdminAprobarPrepropuesta}
                    handleAdminDevolverPrepropuesta={preproposal.handleAdminDevolverPrepropuesta}
                    trazabilidad={preproposal.trazabilidad}
                    isLoadingTrazabilidad={preproposal.isLoadingTrazabilidad}
                />
            );
        }

        return (
            <PreproposalAuthorView
                currentProject={currentProject}
                isSidebarCollapsed={isSidebarCollapsed}
                urlPrefix={urlPrefix}
                navigate={navigate}
                editTitulo={preproposal.editTitulo}
                setEditTitulo={preproposal.setEditTitulo}
                editDescripcion={preproposal.editDescripcion}
                setEditDescripcion={preproposal.setEditDescripcion}
                editPresupuesto={preproposal.editPresupuesto}
                setEditPresupuesto={preproposal.setEditPresupuesto}
                isSavingPreproposal={preproposal.isSavingPreproposal}
                handleGuardarYReenviar={preproposal.handleGuardarYReenviar}
                trazabilidad={preproposal.trazabilidad}
                isLoadingTrazabilidad={preproposal.isLoadingTrazabilidad}
            />
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-bg-deep overflow-hidden selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
            <WorkspaceHeader
                currentProject={currentProject}
                isSidebarCollapsed={isSidebarCollapsed}
                isPublishingDSpace={isPublishingDSpace}
                urlPrefix={urlPrefix}
                onExportCaces={async () => {
                    try {
                        const response = await api.get(`/projects/${currentProject.uuid}/export-caces`, { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `CACES_METADATA_${currentProject.id}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        addToast("Exportación CACES", "Metadatos CACES exportados con éxito.", "success");
                    } catch (err) {
                        console.error("[DIITRA] Error al exportar metadatos CACES", err);
                        addToast("Error de Exportación", "No se pudo realizar la exportación de metadatos CACES", "error");
                    }
                }}
                onPublishDSpace={async () => {
                    try {
                        setIsPublishingDSpace(true);
                        const res = await api.post(`/projects/${currentProject.uuid}/publish-dspace`);
                        addToast("Publicación en DSpace", `¡Proyecto publicado con éxito en DSpace! URI: ${res.data.uri}`, "success");
                    } catch (err: any) {
                        console.error("[DIITRA] Error al publicar en DSpace", err);
                        const errMsg = err.response?.data?.error || "No se pudo realizar la publicación en DSpace";
                        addToast("Error de Publicación", errMsg, "error");
                    } finally {
                        setIsPublishingDSpace(false);
                    }
                }}
            />

            <div className="flex-1 overflow-y-auto">
                <main className="max-w-[1600px] mx-auto p-4 md:p-10 animate-fade-up">
                    <WorkspaceTitle
                        currentProject={currentProject}
                        user={user}
                        templateCode={templateCode}
                        setActiveDocument={setActiveDocument}
                    />

                    <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-4 lg:items-start">
                        <div className="flex flex-col gap-3">
                            <CacesWorkflow
                                currentProject={currentProject}
                                projectDocuments={projectDocuments}
                                templateCode={templateCode}
                                assignedRevisionUuid={assignedRevisionUuid}
                                assignedRevisionStatus={assignedRevisionStatus}
                                isAdmin={isAdmin}
                                iniciandoEjecucion={iniciandoEjecucion}
                                resolvingDocument={resolvingDocument}
                                urlPrefix={urlPrefix}
                                resolvedProjectUuid={resolvedProjectUuid}
                                setActiveDocument={setActiveDocument}
                                resolveDocumentInstance={resolveDocumentInstance}
                                handleIniciarEjecucion={handleIniciarEjecucion}
                                navigate={navigate}
                            />

                            <TeamManagement
                                currentProject={currentProject}
                                investigadores={team.investigadores}
                                tieneGrupo={team.tieneGrupo}
                                grupoInvestigacion={team.grupoInvestigacion}
                                approvedGroups={team.approvedGroups}
                                isSyncingGroupMembers={team.isSyncingGroupMembers}
                                isSavingTeam={team.isSavingTeam}
                                teamMessage={team.teamMessage}
                                teamChangeRequests={team.teamChangeRequests}
                                isLoadingTeamChangeRequests={team.isLoadingTeamChangeRequests}
                                isSubmittingTeamChangeRequest={team.isSubmittingTeamChangeRequest}
                                teamChangeForm={team.teamChangeForm}
                                setTeamChangeForm={team.setTeamChangeForm}
                                availableProfessors={team.availableProfessors}
                                setAvailableProfessors={team.setAvailableProfessors}
                                availableStudents={team.availableStudents}
                                setAvailableStudents={team.setAvailableStudents}
                                requestSearchQuery={team.requestSearchQuery}
                                setRequestSearchQuery={team.setRequestSearchQuery}
                                requestSearchResults={team.requestSearchResults}
                                isRequestSearching={team.isRequestSearching}
                                showRequestSearchResults={team.showRequestSearchResults}
                                setShowRequestSearchResults={team.setShowRequestSearchResults}
                                canReviewTeamChanges={team.canReviewTeamChanges}
                                isHistoryExpanded={team.isHistoryExpanded}
                                setIsHistoryExpanded={team.setIsHistoryExpanded}
                                isChangeRequestsExpanded={team.isChangeRequestsExpanded}
                                setIsChangeRequestsExpanded={team.setIsChangeRequestsExpanded}
                                onToggleTieneGrupo={team.handleToggleTieneGrupo}
                                onSetGrupoInvestigacion={team.setGrupoInvestigacion}
                                onSaveTeam={team.handleSaveTeam}
                                onCreateTeamChangeRequest={team.handleCreateTeamChangeRequest}
                                onReviewTeamChangeRequest={team.handleReviewTeamChangeRequest}
                                onOpenTransferModal={team.handleOpenTransferModal}
                                onUpdateMember={team.handleUpdateMember}
                                onRemoveMember={team.handleRemoveMember}
                                onOpenGroupDetail={team.handleOpenGroupDetail}
                            />
                        </div>

                        <div className="lg:sticky lg:top-0 flex flex-col gap-3">
                            <WorkspaceSidebar
                                currentProject={currentProject}
                                projectDocuments={projectDocuments}
                                resolvedProjectUuid={resolvedProjectUuid}
                                setActiveDocument={setActiveDocument}
                                isAdmin={isAdmin}
                            />
                        </div>
                    </div>
                </main>
            </div>

            <DirectorTransferModal
                isOpen={team.showTransferModal}
                onClose={() => team.setShowTransferModal(false)}
                onSubmit={team.handleConfirmTransfer}
                transferDirector={team.transferDirector}
                transferSearchQuery={team.transferSearchQuery}
                setTransferSearchQuery={team.setTransferSearchQuery}
                showTransferSearchResults={team.showTransferSearchResults}
                setShowTransferSearchResults={team.setShowTransferSearchResults}
                transferSearchResults={team.transferSearchResults}
                isTransferSearching={team.isTransferSearching}
                newDirectorCedula={team.newDirectorCedula}
                setNewDirectorCedula={team.setNewDirectorCedula}
                transferMotivo={team.transferMotivo}
                setTransferMotivo={team.setTransferMotivo}
                transferDescripcion={team.transferDescripcion}
                setTransferDescripcion={team.setTransferDescripcion}
                isTransferring={team.isTransferring}
                investigadores={team.investigadores}
            />

            <GroupDetailDrawer
                isOpen={team.isGroupDetailOpen}
                onClose={team.handleCloseGroupDetail}
                detailGroup={team.detailGroup}
                setDetailGroup={team.setDetailGroup}
                isAdmin={isAdmin}
                user={user}
                dominios={team.dominios}
                carreras={team.carreras}
                lines={team.lines}
                formatCareerName={team.formatCareerName}
                handleOpenReview={() => { }}
            />
        </div>
    );
};

export default ProjectWorkspace;
