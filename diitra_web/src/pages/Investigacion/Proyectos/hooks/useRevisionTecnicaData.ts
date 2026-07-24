import { useState, useEffect, useCallback } from 'react';
import { FIELD_LABELS } from '../types/revisionTecnicaTypes';
import type { ProjectDetail, SectionComment } from '../types/revisionTecnicaTypes';
import api from '../../../../api/axios_config';

interface UseRevisionTecnicaDataParams {
    projectUuid: string | undefined;
    navigate: (path: string) => void;
    addToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number, onUndo?: () => void) => void;
    confirm: (options: { title: string; message: string; confirmText?: string; cancelText?: string; variant?: 'primary' | 'destructive' | 'warning' }) => Promise<boolean>;
    comments: Record<string, SectionComment[]>;
    setComments: React.Dispatch<React.SetStateAction<Record<string, SectionComment[]>>>;
    activeCommentField: string;
    setContextualInput: (val: string) => void;
}

export const useRevisionTecnicaData = ({
    projectUuid,
    navigate,
    addToast,
    confirm,
    comments,
    setComments,
    activeCommentField,
    setContextualInput
}: UseRevisionTecnicaDataParams) => {
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [investigadores, setInvestigadores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [docSnapshot, setDocSnapshot] = useState<any>({});

    const teachersWithExceedingHours = investigadores.filter(inv => {
        const proposed = inv.horasSemanales || 0;
        const available = inv.horasDisponibles || inv.horas_disponibles || 0;
        const assigned = inv.horasAsignadas || inv.horas_asignadas || 0;
        return (assigned + proposed) > available;
    });
    const isHoursOk = teachersWithExceedingHours.length === 0;

    const loadPdf = useCallback(async (uuid: string) => {
        setLoadingPdf(true);
        try {
            const instanceRes = await api.get(`/documents/instances/resolve`, {
                params: { templateCode: 'PROTOCOLO_INVESTIGACION', entityUuid: uuid }
            });
            const finalPath = instanceRes.data?.finalPdfPath || instanceRes.data?.final_pdf_path || instanceRes.data?.FinalPdfPath;

            if (finalPath) {
                const cleanPath = finalPath.replace(/\\/g, '/');
                const fileRes = await api.get(`/storage/${cleanPath}`, { responseType: 'blob' });
                const blobUrl = URL.createObjectURL(new Blob([fileRes.data], { type: 'application/pdf' }));
                setPdfUrl(blobUrl);
            } else {
                const projectRes = await api.get(`/projects/${uuid}/detail`);
                const pdfRes = await api.post(`/projects/generate-pdf?isDraft=true`, projectRes.data, { responseType: 'blob' });
                const blobUrl = URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
                setPdfUrl(blobUrl);
            }
        } catch (err) {
            console.error('[DIITRA] Error al cargar PDF:', err);
        } finally {
            setLoadingPdf(false);
        }
    }, []);

    const calculateMetrics = useCallback(async (uuid: string) => {
        try {
            const instanceRes = await api.get(`/documents/instances/resolve`, {
                params: { templateCode: 'PROTOCOLO_INVESTIGACION', entityUuid: uuid }
            });
            const dataJson = instanceRes.data?.dataSnapshotJson || instanceRes.data?.data_snapshot_json || '{}';
            const metadata = JSON.parse(dataJson);
            setDocSnapshot(metadata);
        } catch (e) {
            console.error('[DIITRA] Error al cargar snapshot:', e);
        }
    }, []);

    const loadProjectData = useCallback(async () => {
        if (!projectUuid) return;
        setLoading(true);
        try {
            const res = await api.get(`/projects/${projectUuid}/detail`);

            const directorObj = (res.data.investigadores || []).find((inv: any) =>
                inv.rol?.toLowerCase().includes('director') || inv.rol?.toLowerCase().includes('principal')
            );
            const directorNombre = directorObj
                ? (directorObj.nombres_completos || directorObj.nombresCompletos || `${directorObj.nombre || ''} ${directorObj.apellido || ''}`.trim())
                : 'No asignado';

            const projectDetail: ProjectDetail = {
                uuid: res.data.uuid,
                title: res.data.titulo?.trim() || '(Sin título)',
                status: res.data.estado || 'Borrador',
                presupuesto: res.data.costo_total || 0,
                convocatoriaMontoMaximo: res.data.convocatoria_monto_maximo ?? res.data.convocatoriaMontoMaximo ?? res.data.ConvocatoriaMontoMaximo ?? null,
                convocatoria: res.data.convocatoria_titulo || res.data.convocatoriaTitulo || '',
                linea: res.data.linea_investigacion || 'No definida',
                carrera: res.data.carrera || '',
                dominio: res.data.dominio || '',
                descripcion: res.data.descripcion_proyecto || res.data.descripcionProyecto || '',
                directorProyecto: directorNombre
            };

            setProject(projectDetail);
            setInvestigadores(res.data.investigadores || []);

            const savedComments = localStorage.getItem(`comments_${projectUuid}`);
            if (savedComments) {
                setComments(JSON.parse(savedComments));
            }

            loadPdf(projectUuid);
            await calculateMetrics(projectUuid);

            try {
                const collabRes = await api.get(`/collaboration/${projectUuid}/pulse`);
                if (collabRes.data && collabRes.data.comments) {
                    const backendComments: Record<string, SectionComment[]> = {};
                    collabRes.data.comments.forEach((c: any) => {
                        const content = c.contenido || '';
                        const match = content.match(/^\[(.*?)\]\s*\((.*?)\):\s*(.*)$/);
                        if (match) {
                            const label = match[1];
                            const statusStr = match[2];
                            const text = match[3];
                            const fieldKey = Object.keys(FIELD_LABELS).find(k => FIELD_LABELS[k] === label);
                            if (fieldKey) {
                                if (!backendComments[fieldKey]) {
                                    backendComments[fieldKey] = [];
                                }
                                backendComments[fieldKey].push({
                                    id: c.idComentario || c.id,
                                    status: statusStr === 'Aprobado' ? 'Aprobado' : 'Corregir',
                                    text: text,
                                    creadoEn: c.creadoEn,
                                    nombreUsuario: c.nombreUsuario
                                });
                            }
                        }
                    });

                    Object.keys(backendComments).forEach(key => {
                        backendComments[key].sort((a, b) => a.id - b.id);
                    });

                    if (Object.keys(backendComments).length > 0) {
                        setComments(prev => {
                            const merged = { ...prev, ...backendComments };
                            localStorage.setItem(`comments_${projectUuid}`, JSON.stringify(merged));
                            
                            if (merged[activeCommentField] && merged[activeCommentField].length > 0) {
                                setContextualInput(merged[activeCommentField][0].text || '');
                            }
                            
                            return merged;
                        });
                    }
                }
            } catch (err) {
                console.error('[DIITRA] Error al sincronizar comentarios de colaboración del backend:', err);
            }

        } catch (err) {
            console.error('[DIITRA] Error al cargar detalles de revisión:', err);
            addToast("Error", "No se pudo cargar la información del proyecto.", "error");
        } finally {
            setLoading(false);
        }
    }, [projectUuid, addToast, loadPdf, calculateMetrics, setComments, activeCommentField, setContextualInput]);

    useEffect(() => {
        loadProjectData();
    }, [loadProjectData]);

    const handleAprobar = async (generalFeedback: string) => {
        if (!project) return;

        const isBudgetOk = project.convocatoriaMontoMaximo ? project.presupuesto <= project.convocatoriaMontoMaximo : true;
        const hasTeam = investigadores.length > 0;

        if (!isBudgetOk || !hasTeam || !isHoursOk) {
            let msg = "La propuesta no cumple con todos los controles de consistencia automática.";
            if (!isHoursOk) {
                msg += ` Se detectó exceso de carga horaria en los siguientes docentes: ${teachersWithExceedingHours.map(t => t.nombres_completos || t.nombre).join(', ')}.`;
            }
            if (!await confirm({
                title: "Advertencia de Cumplimiento CACES",
                message: `${msg} ¿Desea aprobarla de todos modos?`,
                confirmText: "Aprobar de todos modos",
                cancelText: "Cancelar",
                variant: "warning"
            })) return;
        } else {
            if (!await confirm({
                title: "Aprobar Revisión Técnica",
                message: "¿Aprobar la consistencia del protocolo y enviarlo a la etapa de Evaluación por Pares?",
                confirmText: "Aprobar y Enviar",
                cancelText: "Cancelar",
                variant: "primary"
            })) return;
        }

        setSubmitting(true);
        try {
            const sectionIssues = Object.entries(comments)
                .filter(([_, list]) => list && list.length > 0)
                .map(([sec, list]) => {
                    const label = FIELD_LABELS[sec] || sec.toUpperCase();
                    return `[${label}]: ${list.map(c => c.text).join('; ')}`;
                })
                .join(' | ');

            const obs = generalFeedback.trim()
                || (sectionIssues ? `Revisión Técnica aprobada con observaciones menores: ${sectionIssues}` : 'Aprobación Técnica Inicial del Administrador. Protocolo completo y consistente.');

            const originalState = project.status;

            await api.post(`/projects/${project.uuid}/transition`, null, {
                params: {
                    newState: 'En Revisión',
                    observation: obs
                }
            });

            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));

            addToast(
                "Revisión Aprobada",
                "El protocolo ha avanzado a la fase de Evaluación por Pares.",
                "success",
                undefined,
                async () => {
                    try {
                        await api.post(`/projects/${project.uuid}/transition`, null, {
                            params: {
                                newState: originalState,
                                observation: "Reversión (Undo): Retorno al estado anterior por cancelación de la aprobación."
                            }
                        });
                        addToast("Acción Revertida", `La aprobación ha sido cancelada. Proyecto en estado: ${originalState}`, "info");
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                        navigate(`/investigacion/revision-tecnica/${projectUuid}`);
                    } catch (err) {
                        console.error("[Undo Approval] Failed:", err);
                        addToast("Error al Revertir", "No se pudo deshacer la aprobación del protocolo.", "error");
                    }
                }
            );
            navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`);
        } catch (err: any) {
            console.error(err);
            addToast("Error", err.response?.data?.error ?? "No se pudo realizar la transición del estado.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDevolver = async (generalFeedback: string) => {
        if (!project) return;

        const hasContextualComments = Object.values(comments).some(list => list && list.length > 0);
        if (!generalFeedback.trim() && !hasContextualComments) {
            addToast("Justificación Requerida", "Por favor redacte observaciones generales o específicas con las correcciones para el docente.", "warning");
            return;
        }

        if (!await confirm({
            title: "Devolver al Docente",
            message: "¿Retornar el proyecto a fase de formulación (En Corrección) con las observaciones descritas?",
            confirmText: "Devolver",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;

        setSubmitting(true);
        try {
            const sectionIssues = Object.entries(comments)
                .filter(([_, list]) => list && list.length > 0)
                .map(([sec, list]) => {
                    const label = FIELD_LABELS[sec] || sec.toUpperCase();
                    return `* ${label}:\n  ` + list.map(c => `- ${c.text}`).join('\n  ');
                })
                .join('\n');

            const fullObs = generalFeedback.trim()
                ? `${generalFeedback.trim()}\n\nObservaciones por Sección:\n${sectionIssues}`
                : `Correcciones solicitadas en las siguientes secciones:\n${sectionIssues}`;

            const originalState = project.status;

            await api.post(`/projects/${project.uuid}/transition`, null, {
                params: {
                    newState: 'En Corrección',
                    observation: fullObs
                }
            });

            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));

            addToast(
                "Proyecto Devuelto",
                "El protocolo ha sido devuelto al docente para correcciones.",
                "warning",
                undefined,
                async () => {
                    try {
                        await api.post(`/projects/${project.uuid}/transition`, null, {
                            params: {
                                newState: originalState,
                                observation: "Reversión (Undo): Retorno al estado anterior por cancelación de la devolución."
                            }
                        });
                        addToast("Acción Revertida", `La devolución ha sido cancelada. Proyecto en estado: ${originalState}`, "info");
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                        navigate(`/investigacion/revision-tecnica/${projectUuid}`);
                    } catch (err) {
                        console.error("[Undo Return] Failed:", err);
                        addToast("Error al Revertir", "No se pudo deshacer la devolución del proyecto.", "error");
                    }
                }
            );
            navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`);
        } catch (err: any) {
            console.error(err);
            addToast("Error", err.response?.data?.error ?? "No se pudo realizar la devolución del proyecto.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return {
        project,
        investigadores,
        loading,
        submitting,
        pdfUrl,
        loadingPdf,
        docSnapshot,
        teachersWithExceedingHours,
        isHoursOk,
        handleAprobar,
        handleDevolver
    };
};
