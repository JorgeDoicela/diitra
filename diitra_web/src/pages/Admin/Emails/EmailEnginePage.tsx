import React, { useState, useEffect } from 'react';
import { Mail, Send, History, Layers, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/Common/PageHeader';
import { useEmailEngineData } from './hooks/useEmailEngineData';
import { useEmailComposer } from './hooks/useEmailComposer';
import { useEmailTemplates } from './hooks/useEmailTemplates';
import { useEmailHistory } from './hooks/useEmailHistory';

import EmailComposerSection from './components/EmailComposerSection';
import EmailPreviewSection from './components/EmailPreviewSection';
import EmailTemplatesSection from './components/EmailTemplatesSection';
import EmailTemplateModal from './components/EmailTemplateModal';
import EmailHistorySection from './components/EmailHistorySection';
import EmailHistoryDrawer from './components/EmailHistoryDrawer';

const EmailEnginePage: React.FC = () => {
    // Tab State: 'send' | 'templates' | 'history'
    const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'history'>('send');

    // 1. Data Orchestration Hook
    const dataHook = useEmailEngineData();
    const { templates, setTemplates, carreras, projects, convocatorias, peerReviews, loading } = dataHook;

    // 2. Email Composer Hook
    const composerHook = useEmailComposer({
        templates,
        projects,
        convocatorias,
        peerReviews
    });

    // 3. Templates CRUD Hook
    const templatesHook = useEmailTemplates({
        templates,
        setTemplates
    });

    // 4. Audit History Log Hook
    const historyHook = useEmailHistory();
    const { fetchHistory } = historyHook;

    // Load history when tab changes to 'history'
    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab, fetchHistory]);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto">
                {/* Brand Header */}
                <PageHeader
                    kicker="Comunicaciones de Investigación"
                    icon={Mail}
                    title="Correos DIITRA"
                    description="Comunicaciones guiadas por plantillas del sistema: el contenido se arma automáticamente según el contexto que seleccione."
                >
                    {/* Tabs Control */}
                    <div className="flex border border-border-thin bg-surface rounded-lg p-1 select-none">
                        <button
                            onClick={() => setActiveTab('send')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeTab === 'send'
                                ? 'bg-bg-deep border border-border-thin text-text-main shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                                }`}
                        >
                            <Send size={12} />
                            Redactar
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeTab === 'templates'
                                ? 'bg-bg-deep border border-border-thin text-text-main shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                                }`}
                        >
                            <Layers size={12} />
                            Plantillas
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeTab === 'history'
                                ? 'bg-bg-deep border border-border-thin text-text-main shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                                }`}
                        >
                            <History size={12} />
                            Historial
                        </button>
                    </div>
                </PageHeader>

                {/* Loading state indicator */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-brand" size={32} />
                    </div>
                )}

                {!loading && (
                    <div className="animate-fade-up [animation-delay:100ms]">
                        {/* TAB 1: REDACTAR CORREO */}
                        {activeTab === 'send' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <EmailComposerSection
                                    composer={composerHook}
                                    templates={templates}
                                    carreras={carreras}
                                    projects={projects}
                                    convocatorias={convocatorias}
                                    peerReviews={peerReviews}
                                />
                                <EmailPreviewSection
                                    parsedPreview={composerHook.parsedPreview}
                                    previewReplacements={composerHook.parsedPreview ? {
                                        ...composerHook.tokenValues,
                                        ...(composerHook.selectedPeople[0] ? {
                                            '[[destinatario_nombre]]': composerHook.selectedPeople[0].nombre,
                                            '[[destinatario_email]]': composerHook.selectedPeople[0].email
                                        } : {})
                                    } : {}}
                                />
                            </div>
                        )}

                        {/* TAB 2: GESTIÓN DE PLANTILLAS */}
                        {activeTab === 'templates' && (
                            <EmailTemplatesSection
                                templates={templates}
                                openCreateTemplateModal={templatesHook.openCreateTemplateModal}
                                openEditTemplateModal={templatesHook.openEditTemplateModal}
                                handleDeleteTemplate={templatesHook.handleDeleteTemplate}
                            />
                        )}

                        {/* TAB 3: HISTORIAL DE ENVÍOS */}
                        {activeTab === 'history' && (
                            <EmailHistorySection historyHook={historyHook} />
                        )}
                    </div>
                )}
            </div>

            {/* MODAL: CREAR/EDITAR PLANTILLA */}
            <EmailTemplateModal templatesHook={templatesHook} />

            {/* DRAWER: DETALLE INSPECCIÓN DE ENVÍO */}
            <EmailHistoryDrawer historyHook={historyHook} />
        </main>
    );
};

export default EmailEnginePage;
