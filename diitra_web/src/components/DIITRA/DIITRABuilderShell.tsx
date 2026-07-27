import React from 'react';
import { Lock, Unlock, Shield, Award } from 'lucide-react';
import type { CoWorkHandle } from '../../core/cowork/types';
import CollaborationSidebar from './CollaborationSidebar';
import { DocumentDataContext, DocumentMetadataContext, SectionLockContext } from '../../core/documents/context/DocumentDataContext';
import { useDIITRABuilderShell } from './shell/hooks/useDIITRABuilderShell';
import { BuilderHeader } from './shell/components/BuilderHeader';
import { BuilderNavigationSidebar } from './shell/components/BuilderNavigationSidebar';
import { BuilderFloatingTab } from './shell/components/BuilderFloatingTab';
import { OutputSection } from './shell/components/OutputSection';
import type { BuilderSection } from './shell/hooks/useBuilderLayout';

export type { BuilderSection };

export interface DIITRABuilderShellProps {
    title: string;
    subtitle: string;
    templateCode: string;
    sections: BuilderSection[];
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    localChangeCount?: number;
    remoteChangeCount?: number;
    cowork: CoWorkHandle;
    onSave?: (data: any) => Promise<void>;
    onClose: () => void;
    readOnly?: boolean;
    readOnlyReason?: string;
    projectStatus?: string;
    entityUuid?: string;
    children: (activeTab: string, cowork: CoWorkHandle) => React.ReactNode;
    canSign?: boolean;
    onUpdateField?: (name: string, value: any) => void;
    signatureType?: string;
    documentUuid?: string;
    hasTemplateUpdate?: boolean;
    instanceVersion?: number;
    templateVersion?: number;
    onUpgradeTemplate?: () => Promise<void>;
    isUpgrading?: boolean;
}

const DIITRABuilderShell: React.FC<DIITRABuilderShellProps> = (props) => {
    const {
        title,
        subtitle,
        sections,
        formData,
        cowork,
        readOnly = false,
        readOnlyReason,
        projectStatus,
        entityUuid,
        children,
        canSign = true,
        onUpdateField,
        signatureType = 'DIITRA',
        documentUuid,
        hasTemplateUpdate = false,
        instanceVersion,
        templateVersion,
        onUpgradeTemplate,
        isUpgrading = false
    } = props;

    const { layout, autoSave, pdfAndSign, network } = useDIITRABuilderShell(props);

    return (
        <DocumentDataContext.Provider value={formData}>
            <DocumentMetadataContext.Provider value={{ readOnlyReason }}>
                <SectionLockContext.Provider value={{
                    formData,
                    readOnly,
                    isDirectorOrAdmin: layout.isDirectorOrAdmin,
                    onUpdateField
                }}>
                    <div className="fixed inset-0 z-[100] bg-bg-deep flex justify-center items-center p-0 md:p-0 backdrop-blur-sm">
                        <div className="bg-surface w-full h-full flex flex-col shadow-2xl overflow-hidden animate-fade-in">
                            {/* ── Header Universal ── */}
                            <BuilderHeader
                                title={title}
                                subtitle={subtitle}
                                readOnly={readOnly}
                                isSyncing={network.isSyncing}
                                isDirty={autoSave.isDirty}
                                lastSaved={autoSave.lastSaved}
                                isOnline={network.isOnline}
                                isSlowConnection={network.isSlowConnection}
                                users={network.users}
                                isDarkMode={layout.isDarkMode}
                                onClose={autoSave.handleClose}
                                onSave={autoSave.handleSave}
                                toggleTheme={layout.toggleTheme}
                            />

                            <div className="flex flex-1 overflow-hidden relative" ref={layout.bodyContainerRef}>
                                {/* Pestaña de reabrir Navegación (Izquierda) */}
                                {(!layout.isLeftSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024 && !layout.showMobileSections)) && (
                                    <BuilderFloatingTab
                                        position="left"
                                        topPercent={layout.navTopPercent}
                                        xOffset={layout.navXOffset}
                                        isDragging={layout.isDraggingNav}
                                        onMouseDown={layout.startDraggingNav}
                                        onTouchStart={layout.startDraggingNav}
                                    />
                                )}

                                {/* Pestaña de reabrir Actividad (Derecha) */}
                                {!layout.isSidebarOpen && (
                                    <BuilderFloatingTab
                                        position="right"
                                        topPercent={layout.chatTopPercent}
                                        xOffset={layout.chatXOffset}
                                        isDragging={layout.isDraggingChat}
                                        isOnline={network.isOnline}
                                        onMouseDown={layout.startDraggingChat}
                                        onTouchStart={layout.startDraggingChat}
                                    />
                                )}

                                {/* ── Sidebar de Navegación (Izquierda) ── */}
                                <BuilderNavigationSidebar
                                    sections={sections}
                                    activeTab={layout.activeTab}
                                    formData={formData}
                                    isLeftSidebarOpen={layout.isLeftSidebarOpen}
                                    leftSidebarWidth={layout.leftSidebarWidth}
                                    showMobileSections={layout.showMobileSections}
                                    leftSidebarRef={layout.leftSidebarRef}
                                    setActiveTab={layout.setActiveTab}
                                    setIsLeftSidebarOpen={layout.setIsLeftSidebarOpen}
                                    setShowMobileSections={layout.setShowMobileSections}
                                />

                                {/* Drag Handle Left */}
                                {layout.isLeftSidebarOpen && !layout.showMobileSections && (
                                    <div
                                        onMouseDown={layout.startDraggingLeft}
                                        className="hidden lg:block w-[6px] -mx-[3px] bg-transparent hover:bg-border-hover/50 active:bg-text-dim cursor-col-resize select-none shrink-0 transition-colors duration-150 z-50 h-full relative"
                                    />
                                )}

                                {/* ── Área Principal: Editor & Visor PDF ── */}
                                <div className="flex-1 bg-bg-deep overflow-hidden flex">
                                    {layout.activeTab !== 'output' ? (
                                        <div className="flex-1 pt-4 pb-8 px-3 sm:pt-6 sm:pb-12 sm:px-6 md:pt-8 md:pb-16 md:px-12 overflow-y-auto custom-scrollbar">
                                            <div className="w-full mx-auto transition-all duration-300 max-w-[98%] sm:max-w-[94%]">
                                                <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-lg sm:text-2xl font-black text-text-main tracking-tighter uppercase">{layout.activeSectionLabel}</h3>
                                                        <div className="w-12 sm:w-20 h-1 md:h-1.5 bg-text-main mt-2 md:mt-3 rounded-full" />
                                                    </div>

                                                    {/* Compact Section Lock Control */}
                                                    {!readOnly && layout.activeTab !== 'output' && (
                                                        <div className="flex items-center gap-2 bg-surface border border-border-thin px-3 py-1.5 rounded-full animate-fade-in text-[9px] font-bold uppercase tracking-wider self-start sm:self-center select-none">
                                                            {layout.isSectionBlocked ? (
                                                                <>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Lock size={12} className="text-amber-500 animate-pulse" />
                                                                        <span className="text-amber-500">Sección Bloqueada</span>
                                                                    </div>
                                                                    {layout.isDirectorOrAdmin && (
                                                                        <button
                                                                            onClick={() => autoSave.handleToggleSectionLock(layout.activeTab)}
                                                                            className="ml-1 px-2.5 py-0.5 bg-text-main hover:opacity-90 text-bg-deep transition-all rounded-full font-black text-[8px]"
                                                                        >
                                                                            Desbloquear
                                                                        </button>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Unlock size={12} className="text-text-dim" />
                                                                        <span className="text-text-dim">Edición Abierta</span>
                                                                    </div>
                                                                    {layout.isDirectorOrAdmin && (
                                                                        <button
                                                                            onClick={() => autoSave.handleToggleSectionLock(layout.activeTab)}
                                                                            className="ml-1 px-2.5 py-0.5 border border-border-thin hover:border-text-main hover:text-text-main text-text-dim transition-all rounded-full font-black text-[8px]"
                                                                        >
                                                                            Bloquear
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {hasTemplateUpdate && !readOnly && onUpgradeTemplate && (
                                                    <div className="callout-vercel callout-vercel-info mb-8 animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                        <div className="flex gap-3">
                                                            <Award size={16} className="text-info mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="callout-vercel-title">Nueva versión de plantilla disponible</p>
                                                                <p className="callout-vercel-body">
                                                                    El administrador ha actualizado el formato oficial de esta plantilla a la versión {templateVersion}. Tu borrador actual utiliza la versión {instanceVersion}. Puedes actualizar para aplicar las últimas secciones y formatos. Tus datos actuales se conservarán.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={onUpgradeTemplate}
                                                            disabled={isUpgrading}
                                                            className="px-4 py-2 bg-info hover:bg-info/90 text-white rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 disabled:opacity-50 transition-all flex items-center gap-1.5"
                                                        >
                                                            {isUpgrading ? (
                                                                <>
                                                                    <span className="animate-spin mr-1">⌛</span> Actualizando...
                                                                </>
                                                            ) : (
                                                                "Actualizar Formato"
                                                            )}
                                                        </button>
                                                    </div>
                                                )}

                                                {readOnly && (
                                                    <div className="callout-vercel callout-vercel-warning mb-8 animate-fade-in">
                                                        <Shield size={16} className="text-warning mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="callout-vercel-title">Vista de solo lectura activa</p>
                                                            <p className="callout-vercel-body">
                                                                {readOnlyReason === 'state' ? (
                                                                    `Este documento ha sido emitido y firmado formalmente (se encuentra en estado "${projectStatus || 'Oficial'}"), por lo que su contenido ha sido sellado para garantizar la integridad institucional. No se admiten modificaciones.`
                                                                ) : readOnlyReason === 'review' ? (
                                                                    "Estás visualizando este documento en modo de solo lectura para fines de revisión y auditoría académica."
                                                                ) : (
                                                                    "Has accedido a este documento en modalidad de solo lectura debido a que no figuras como un miembro activo con permisos de escritura en este proyecto. No podrás realizar modificaciones."
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Render de los componentes hijos del documento con el cowork handle */}
                                                {children(layout.activeTab, cowork)}
                                            </div>
                                        </div>
                                    ) : (
                                        /* ── Panel de Finalización y Firma ── */
                                        <OutputSection
                                            title={title}
                                            projectStatus={projectStatus}
                                            canSign={canSign}
                                            signatureType={signatureType}
                                            documentUuid={documentUuid}
                                            formData={formData}
                                            pdfUrl={pdfAndSign.pdfUrl}
                                            isGenerating={pdfAndSign.isGenerating}
                                            isDraftMode={pdfAndSign.isDraftMode}
                                            setIsDraftMode={pdfAndSign.setIsDraftMode}
                                            handleGeneratePdf={pdfAndSign.handleGeneratePdf}
                                            isSigning={pdfAndSign.isSigning}
                                            institutionalPassword={pdfAndSign.institutionalPassword}
                                            setInstitutionalPassword={pdfAndSign.setInstitutionalPassword}
                                            handleSignDiitra={pdfAndSign.handleSignDiitra}
                                            signatureCertFile={pdfAndSign.signatureCertFile}
                                            setSignatureCertFile={pdfAndSign.setSignatureCertFile}
                                            signaturePassword={pdfAndSign.signaturePassword}
                                            setSignaturePassword={pdfAndSign.setSignaturePassword}
                                            handleSign={pdfAndSign.handleSign}
                                            signatureRefreshTrigger={pdfAndSign.signatureRefreshTrigger}
                                        />
                                    )}
                                </div>

                                {/* Drag Handle Right */}
                                {layout.isSidebarOpen && (
                                    <div
                                        onMouseDown={layout.startDraggingRight}
                                        className="hidden lg:block w-[6px] -mx-[3px] bg-transparent hover:bg-border-hover/50 active:bg-text-dim cursor-col-resize select-none shrink-0 transition-colors duration-150 z-50 h-full relative"
                                    />
                                )}

                                {/* ── Collaboration Sidebar (Derecha) ── */}
                                <div
                                    ref={layout.rightSidebarRef}
                                    style={{
                                        '--right-sidebar-width': `${layout.rightSidebarWidth}px`,
                                        width: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                            ? undefined
                                            : (layout.isSidebarOpen ? `${layout.rightSidebarWidth}px` : '0px'),
                                        transform: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                            ? (layout.isSidebarOpen ? 'translateX(0)' : 'translateX(100%)')
                                            : undefined,
                                        transition: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                            ? 'transform 300ms ease-in-out, visibility 300ms ease-in-out'
                                            : 'width 300ms ease-in-out',
                                        visibility: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                            ? (layout.isSidebarOpen ? 'visible' : 'hidden')
                                            : 'visible'
                                    } as React.CSSProperties}
                                    className={`
                                        overflow-hidden flex shrink-0 bg-bg-deep shadow-2xl lg:shadow-none z-40
                                        ${typeof window !== 'undefined' && window.innerWidth < 1024
                                            ? 'fixed inset-y-0 right-0 top-[60px] z-[70] h-[calc(100vh-60px)] border-l border-border-thin !w-[85vw] sm:!w-[320px]'
                                            : (layout.isSidebarOpen ? 'border-l border-border-thin lg:flex' : 'hidden lg:flex')
                                        }
                                    `}
                                >
                                    <div className="h-full w-full lg:w-[var(--right-sidebar-width)] flex flex-col shrink-0">
                                        <CollaborationSidebar
                                            instanceUuid={cowork.session.documentId}
                                            sectionName={layout.activeTab}
                                            cowork={cowork}
                                            allSections={sections.map(s => s.id)}
                                            entityUuid={entityUuid}
                                            projectStatus={projectStatus}
                                            onClose={() => layout.setIsSidebarOpen(false)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionLockContext.Provider>
            </DocumentMetadataContext.Provider>
        </DocumentDataContext.Provider>
    );
};

export default React.memo(DIITRABuilderShell);
