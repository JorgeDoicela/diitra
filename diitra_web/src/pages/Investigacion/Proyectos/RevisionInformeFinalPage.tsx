import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, MessageSquare, Award, ArrowLeft, FileText, Eye, CheckCircle2 } from 'lucide-react';
import api from '../../../api/axios_config';
import { useAuth } from '../../../api/AuthContext';
import { useNotifications } from '../../../api/NotificationsContext';
import { FullscreenLoader } from '../../../components/Common/FullscreenLoader';
import { InteractiveFinalReportSections } from './components/InteractiveFinalReportSections';
import { FinalizeFinalReportModal } from './components/FinalizeFinalReportModal';
import { ObservationsSidebar } from './components/ObservationsSidebar';
import { FIELD_LABELS } from './types/revisionTecnicaTypes';

export const RevisionInformeFinalPage: React.FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { addToast } = useNotifications();

    const [project, setProject] = useState<any>(null);
    const [investigadores, setInvestigadores] = useState<any[]>([]);
    const [docSnapshot, setDocSnapshot] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'pdf' | 'interactive'>('interactive');
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [generalFeedback, setGeneralFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Sidebar de observaciones
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [activeCommentField, setActiveCommentField] = useState('general');
    const [comments, setComments] = useState<Record<string, any[]>>({});
    const [contextualInput, setContextualInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        if (!projectUuid) return;
        setLoading(true);
        try {
            // 1. Cargar datos del proyecto e investigadores
            const pRes = await api.get(`/projects/${projectUuid}/detail`);
            const pData = pRes.data?.proyecto || pRes.data;
            setProject(pData);
            setInvestigadores(pRes.data?.investigadores || pRes.data?.participantes || pData?.investigadores || []);

            // 3. Cargar snapshot del informe final
            try {
                const docRes = await api.get('/documents/instances/resolve', {
                    params: {
                        templateCode: 'INFORME_FINAL_INVESTIGACION',
                        entityUuid: projectUuid
                    }
                });
                if (docRes.data) {
                    if (docRes.data.dataSnapshotJson) {
                        try {
                            setDocSnapshot(JSON.parse(docRes.data.dataSnapshotJson));
                        } catch {}
                    }
                    if (docRes.data.finalPdfPath) {
                        setPdfUrl(`${api.defaults.baseURL || ''}/documents/instances/${docRes.data.uuid}/pdf?t=${Date.now()}`);
                    }
                }
            } catch {}
        } catch (e: any) {
            console.error('[DIITRA] Error al cargar revisión de informe final:', e);
            addToast('Error', 'No se pudo cargar la información del informe final.', 'error');
        } finally {
            setLoading(false);
        }
    }, [projectUuid, addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAprobarCierre = async (): Promise<boolean> => {
        if (!projectUuid) return false;
        setSubmitting(true);
        const originalState = project?.status || 'En Ejecución';
        try {
            await api.post(`/projects/${projectUuid}/transition`, null, {
                params: {
                    newState: 'Finalizado',
                    observation: generalFeedback.trim() || 'Aprobación Formal del Informe Final y Cierre Institucional CACES'
                }
            });
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            addToast(
                'Proyecto Culminado',
                'El informe final ha sido aprobado y el proyecto cerrado oficialmente.',
                'success',
                undefined,
                async () => {
                    try {
                        await api.post(`/projects/${projectUuid}/transition`, null, {
                            params: {
                                newState: originalState,
                                observation: 'Reversión (Undo): Retorno al estado anterior por cancelación de la aprobación del informe final.'
                            }
                        });
                        addToast('Acción Revertida', `La aprobación de cierre ha sido cancelada. Proyecto en estado: ${originalState}`, 'info');
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                        navigate(`/investigacion/revision-informe-final/${projectUuid}`);
                    } catch (err) {
                        console.error('[Undo Cierre] Error:', err);
                        addToast('Error al Revertir', 'No se pudo deshacer la aprobación de cierre del proyecto.', 'error');
                    }
                }
            );
            navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`);
            return true;
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error al aprobar el cierre';
            addToast('Error', msg, 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleDevolver = async (): Promise<boolean> => {
        if (!projectUuid) return false;
        if (!generalFeedback.trim()) {
            addToast('Observación requerida', 'Debe ingresar las observaciones para justificar la devolución.', 'warning');
            return false;
        }
        setSubmitting(true);
        try {
            await api.post(`/projects/${projectUuid}/devolver-informe-final`, null, {
                params: {
                    observation: generalFeedback.trim()
                }
            });
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            addToast('Informe Devuelto', 'El informe final ha sido reabierto para correcciones del equipo.', 'info');
            navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`);
            return true;
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error al devolver el informe';
            addToast('Error', msg, 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const getFieldCardClasses = (fieldKey: string, extraClasses: string = '') => {
        const isActive = activeCommentField === fieldKey && isRightSidebarOpen;
        const borderClass = 'border-border-thin bg-surface';
        const activeClass = isActive
            ? '!border-brand/45 bg-brand/[0.003] shadow-[0_4px_20px_rgba(99,102,241,0.04)] ring-1 ring-brand/5'
            : '';
        return `p-4 rounded-xl border ${extraClasses} relative cursor-pointer hover:bg-surface-hover/80 transition-all ${borderClass} ${activeClass}`;
    };

    const renderFieldStatusBadge = (fieldKey: string) => {
        const fieldComments = comments[fieldKey];
        if (fieldComments && fieldComments.length > 0) {
            return (
                <span className="inline-flex items-center gap-1 text-[8px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-mono uppercase">
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    Obs ({fieldComments.length})
                </span>
            );
        }
        return null;
    };

    const renderCommentButton = (fieldKey: string, _label: string) => {
        const hasComment = comments[fieldKey] && comments[fieldKey].length > 0;
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setActiveCommentField(fieldKey);
                    setIsRightSidebarOpen(true);
                }}
                className={`flex items-center gap-1 p-1 rounded-lg border transition-all cursor-pointer ${hasComment
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-500 hover:bg-amber-500/10'
                    : 'border-transparent text-text-dim/40 hover:text-text-main hover:bg-surface-hover'
                    }`}
                title="Agregar u observar campo"
            >
                <MessageSquare size={13} className={hasComment ? 'fill-amber-500/5 text-amber-500' : ''} />
            </button>
        );
    };

    const getSafeArray = (val: any): any[] => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try {
            const p = JSON.parse(val);
            if (Array.isArray(p)) return p;
        } catch {}
        return [];
    };

    if (loading || !project) {
        return <FullscreenLoader message="Cargando revisión del informe final..." />;
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-bg-deep overflow-hidden font-sans">
            {/* Header */}
            <header className="h-14 border-b border-border-thin bg-surface px-5 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`)}
                        className="p-1.5 hover:bg-surface-hover border border-border-thin rounded-xl text-text-dim hover:text-text-main transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    >
                        <ArrowLeft size={14} />
                        <span>Volver</span>
                    </button>
                    <div className="h-4 w-px bg-border-thin" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-bold text-text-main truncate max-w-md">
                                {project.title || 'Informe Final'}
                            </h2>
                            <span className="badge-vercel badge-vercel-primary !text-[9px] font-mono shrink-0">
                                Revisión de Cierre CACES
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Selector de modo */}
                    <div className="flex items-center bg-bg-deep p-0.5 border border-border-thin rounded-xl">
                        <button
                            onClick={() => setViewMode('interactive')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'interactive'
                                ? 'bg-surface text-text-main shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                                }`}
                        >
                            <Eye size={13} />
                            <span>Interactivo</span>
                        </button>
                        <button
                            onClick={() => setViewMode('pdf')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'pdf'
                                ? 'bg-surface text-text-main shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                                }`}
                        >
                            <FileText size={13} />
                            <span>PDF Oficial</span>
                        </button>
                    </div>

                    {/* Botón de Dictamen / Badge de Estado */}
                    {isAdmin && project.status !== 'Finalizado' ? (
                        <button
                            onClick={() => setIsFinalizeModalOpen(true)}
                            className="btn-vercel-primary !py-1.5 !px-4 text-xs font-bold flex items-center gap-1.5 !bg-emerald-600 hover:!bg-emerald-700 !text-white shadow-sm cursor-pointer"
                        >
                            <Award size={14} />
                            <span>Emitir Dictamen de Cierre</span>
                        </button>
                    ) : project.status === 'Finalizado' ? (
                        <span className="badge-vercel badge-vercel-success !text-[11px] !py-1.5 !px-3 font-semibold flex items-center gap-1.5">
                            <CheckCircle2 size={13} /> Cierre Aprobado Oficialmente
                        </span>
                    ) : (
                        <span className="badge-vercel badge-vercel-warning !text-[11px] !py-1.5 !px-3 font-semibold flex items-center gap-1.5">
                            En Auditoría por Coordinación
                        </span>
                    )}
                </div>
            </header>

            {/* Cuerpo */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 h-full flex overflow-hidden">
                    {viewMode === 'pdf' ? (
                        pdfUrl ? (
                            <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-full border-0 bg-bg-deep" title="Visor PDF Informe Final" />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-dim gap-2 font-mono text-xs">
                                <AlertCircle size={20} className="text-warning" />
                                <span>No se ha emitido un PDF oficial sellado para este informe final aún.</span>
                            </div>
                        )
                    ) : (
                        <InteractiveFinalReportSections
                            activeSection="general"
                            project={project}
                            investigadores={investigadores}
                            docSnapshot={docSnapshot}
                            templateBlocks={[]}
                            isLeftSidebarOpen={false}
                            setIsLeftSidebarOpen={() => {}}
                            getFieldCardClasses={getFieldCardClasses}
                            renderFieldStatusBadge={renderFieldStatusBadge}
                            renderCommentButton={renderCommentButton}
                            getSafeArray={getSafeArray}
                        />
                    )}
                </div>

                {/* Sidebar de observaciones */}
                <ObservationsSidebar
                    isOpen={isRightSidebarOpen}
                    width={380}
                    isDragging={false}
                    startDragging={() => {}}
                    toggleOpen={() => setIsRightSidebarOpen(false)}
                    activeCommentField={activeCommentField}
                    setActiveCommentField={setActiveCommentField}
                    comments={comments}
                    contextualInput={contextualInput}
                    setContextualInput={setContextualInput}
                    isListening={isListening}
                    submitting={submitting}
                    editingCommentId={editingCommentId}
                    setEditingCommentId={setEditingCommentId}
                    saveContextualComment={async () => {
                        if (!contextualInput.trim()) return;
                        setComments(prev => ({
                            ...prev,
                            [activeCommentField]: [
                                ...(prev[activeCommentField] || []),
                                {
                                    id: Date.now(),
                                    fieldKey: activeCommentField,
                                    comentario: contextualInput.trim(),
                                    createdAt: new Date().toISOString(),
                                    autorNombre: 'Administrador'
                                }
                            ]
                        }));
                        setContextualInput('');
                        addToast('Observación agregada', 'La nota ha sido vinculada al bloque.', 'info');
                    }}
                    handleStartListening={() => setIsListening(prev => !prev)}
                    removeCommentLocal={(fieldKey, id) => {
                        setComments(prev => ({
                            ...prev,
                            [fieldKey]: (prev[fieldKey] || []).filter(c => c.id !== id)
                        }));
                    }}
                    FIELD_LABELS={FIELD_LABELS}
                    templateBlocks={[]}
                />
            </div>

            {/* Modal de Finalización */}
            <FinalizeFinalReportModal
                isOpen={isFinalizeModalOpen}
                onClose={() => setIsFinalizeModalOpen(false)}
                generalFeedback={generalFeedback}
                setGeneralFeedback={setGeneralFeedback}
                submitting={submitting}
                onAprobar={handleAprobarCierre}
                onDevolver={handleDevolver}
            />
        </div>,
        document.body
    );
};

export default RevisionInformeFinalPage;
