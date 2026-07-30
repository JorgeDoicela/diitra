import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { ObservationsSidebar } from './components/ObservationsSidebar';
import { InteractiveSections } from './components/InteractiveSections';
import { FullscreenLoader } from '../../../components/Common/FullscreenLoader';
import { useRevisionTecnica } from './hooks/useRevisionTecnica';
import { RevisionHeader } from './components/RevisionHeader';
import { SectionsSidebar } from './components/SectionsSidebar';
import { FloatingSidebarButtons } from './components/FloatingSidebarButtons';
import { FinalizeAuditModal } from './components/FinalizeAuditModal';
import { FIELD_LABELS } from './types/revisionTecnicaTypes';

export const RevisionTecnicaPage: React.FC = () => {
    const {
        projectUuid,
        navigate,
        layout,
        commentsState,
        data,
        getSafeArray,
        getFieldCardClasses,
        renderFieldStatusBadge
    } = useRevisionTecnica();

    if (data.loading || !data.project) {
        return <FullscreenLoader message="Cargando revisión técnica..." />;
    }

    const renderCommentButton = (fieldKey: string, _fieldName: string) => {
        const hasComment = commentsState.comments[fieldKey] && commentsState.comments[fieldKey].length > 0;
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    layout.setActiveCommentField(fieldKey);
                    layout.setIsRightSidebarOpen(true);
                }}
                className={`flex items-center gap-1 p-1 rounded-lg border transition-all active:scale-95 shrink-0 cursor-pointer ${hasComment
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-500 hover:bg-amber-500/10'
                    : 'border-transparent text-text-dim/40 hover:text-text-main hover:bg-surface-hover'
                    }`}
                title={hasComment ? 'Ver observación registrada' : 'Agregar observación contextual'}
            >
                <MessageSquare size={13} className={hasComment ? 'fill-amber-500/5 text-amber-500' : ''} />
                {hasComment && (
                    <span className="text-[8px] font-mono font-bold leading-none bg-amber-500 text-bg-deep px-1 py-0.5 rounded-full">
                        !
                    </span>
                )}
            </button>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-bg-deep overflow-hidden selection:bg-text-main selection:text-bg-deep transition-colors duration-300 font-sans">
            {/* Header de la Página */}
            <RevisionHeader
                projectTitle={data.project.title}
                projectUuid={projectUuid}
                viewMode={layout.viewMode}
                setViewMode={layout.setViewMode}
                onNavigateBack={() => navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`)}
                onOpenFinalizeModal={() => layout.setIsFinalizeModalOpen(true)}
            />

            {/* Layout Principal de Tres Columnas */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* LADO IZQUIERDO: VISOR INTERACTIVO O PDF */}
                <div className="flex-1 h-full border-r border-border-thin bg-bg-deep flex overflow-hidden relative">
                    {layout.viewMode === 'pdf' ? (
                        data.loadingPdf ? (
                            <div className="flex-1 flex items-center justify-center text-text-dim text-xs gap-2 font-mono">
                                <Loader2 size={16} className="animate-spin text-brand" /> Generando vista previa del PDF...
                            </div>
                        ) : data.pdfUrl ? (
                            <iframe
                                src={`${data.pdfUrl}#toolbar=0`}
                                className="w-full h-full border-0 bg-bg-deep"
                                title="Visor PDF Protocolo"
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-dim gap-3">
                                <AlertCircle size={24} className="text-warning" />
                                <p className="text-xs font-semibold">No se pudo cargar el PDF del protocolo.</p>
                            </div>
                        )
                    ) : (
                        /* SECCIONES Y CAMPOS ESTRUCTURADOS */
                        <div className="flex-1 flex h-full overflow-hidden relative">
                            <SectionsSidebar
                                isOpen={layout.isLeftSidebarOpen}
                                width={layout.leftSidebarWidth}
                                isDraggingLeft={layout.isDraggingLeft}
                                leftSidebarRef={layout.leftSidebarRef}
                                activeSection={layout.activeSection}
                                setActiveSection={layout.setActiveSection}
                                onClose={() => layout.setIsLeftSidebarOpen(false)}
                                startDraggingLeft={layout.startDraggingLeft}
                                comments={commentsState.comments}
                                templateBlocks={data.templateBlocks}
                            />

                            <InteractiveSections
                                activeSection={layout.activeSection}
                                project={data.project}
                                investigadores={data.investigadores}
                                docSnapshot={data.docSnapshot}
                                templateBlocks={data.templateBlocks}
                                isLeftSidebarOpen={layout.isLeftSidebarOpen}
                                setIsLeftSidebarOpen={layout.setIsLeftSidebarOpen}
                                isHoursOk={data.isHoursOk}
                                teachersWithExceedingHours={data.teachersWithExceedingHours}
                                getFieldCardClasses={getFieldCardClasses}
                                renderFieldStatusBadge={renderFieldStatusBadge}
                                renderCommentButton={renderCommentButton}
                                setActiveCommentField={layout.setActiveCommentField}
                                setIsRightSidebarOpen={layout.setIsRightSidebarOpen}
                                getSafeArray={getSafeArray}
                            />
                        </div>
                    )}

                    {/* Botones Flotantes Reabribles */}
                    <FloatingSidebarButtons
                        isLeftSidebarOpen={layout.isLeftSidebarOpen}
                        seccionesButtonTop={layout.seccionesButtonTop}
                        seccionesButtonLeft={layout.seccionesButtonLeft}
                        isDraggingSeccionesButton={layout.isDraggingSeccionesButton}
                        handleSeccionesButtonDragStart={layout.handleSeccionesButtonDragStart}
                        isRightSidebarOpen={layout.isRightSidebarOpen}
                        auditoriaButtonTop={layout.auditoriaButtonTop}
                        auditoriaButtonLeft={layout.auditoriaButtonLeft}
                        isDraggingButton={layout.isDraggingButton}
                        handleButtonDragStart={layout.handleButtonDragStart}
                    />
                </div>

                {/* LADO DERECHO: SIDEBAR AJUSTABLE Y COLAPSABLE DE AUDITORÍA */}
                <ObservationsSidebar
                    isOpen={layout.isRightSidebarOpen}
                    width={layout.rightSidebarWidth}
                    isDragging={layout.isDraggingRight}
                    startDragging={layout.startDraggingRight}
                    toggleOpen={() => layout.setIsRightSidebarOpen(false)}
                    activeCommentField={layout.activeCommentField}
                    setActiveCommentField={layout.setActiveCommentField}
                    comments={commentsState.comments}
                    contextualInput={commentsState.contextualInput}
                    setContextualInput={commentsState.setContextualInput}
                    isListening={commentsState.isListening}
                    submitting={data.submitting}
                    editingCommentId={commentsState.editingCommentId}
                    setEditingCommentId={commentsState.setEditingCommentId}
                    saveContextualComment={commentsState.saveContextualComment}
                    handleStartListening={commentsState.handleStartListening}
                    removeCommentLocal={commentsState.removeCommentLocal}
                    FIELD_LABELS={FIELD_LABELS}
                />
            </div>

            {/* Modal de Finalización de Auditoría */}
            <FinalizeAuditModal
                isOpen={layout.isFinalizeModalOpen}
                onClose={() => layout.setIsFinalizeModalOpen(false)}
                generalFeedback={layout.generalFeedback}
                setGeneralFeedback={layout.setGeneralFeedback}
                submitting={data.submitting}
                onAprobar={() => data.handleAprobar(layout.generalFeedback)}
                onDevolver={() => data.handleDevolver(layout.generalFeedback)}
            />
        </div>,
        document.body
    );
};

export default RevisionTecnicaPage;
