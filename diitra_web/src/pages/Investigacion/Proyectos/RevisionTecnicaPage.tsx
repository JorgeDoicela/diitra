import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Shield, AlertTriangle,
    RotateCcw, Scale, Loader2, FileText, CheckCircle,
    MessageSquare, AlertCircle, BarChart2, Eye, Mic,
    MicOff, Send, Users, Activity, DollarSign, Target,
    BookOpen, ChevronLeft, ChevronRight, Sun, Moon
} from 'lucide-react';
import api from '../../../api/axios_config';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';
import { useAuth } from '../../../api/AuthContext';

interface ProjectDetail {
    uuid: string;
    title: string;
    status: string;
    presupuesto: number;
    convocatoriaMontoMaximo: number | null;
    convocatoria: string;
    linea: string;
    carrera: string;
    dominio: string;
    descripcion: string;
    directorProyecto: string;
}

interface SectionComment {
    status: 'Pendiente' | 'Aprobado' | 'Corregir';
    text: string;
}

const FIELD_LABELS: Record<string, string> = {
    titulo: 'Tema / Nombre del Proyecto',
    programa: 'Programa del Proyecto',
    grupo: 'Grupo de Investigación',
    dominio_linea: 'Dominio y Líneas de Investigación',
    carrera: 'Carrera y Convocatoria',
    campos: 'Campos Detallados (CACES)',
    equipo: 'Equipo Humano de Investigación',
    antecedentes: 'Antecedentes de la Propuesta',
    justificacion: 'Justificación del Proyecto',
    objetivos: 'Objetivo General y Específicos',
    metodologia: 'Metodología y Diseño Técnico',
    presupuesto: 'Recursos y Presupuesto',
    impacto: 'Impacto y Productos Esperados',
    cronograma: 'Cronograma (Diagrama de Gantt)',
    bibliografia: 'Bibliografía y Firmas de Responsabilidad'
};

const SECTIONS = [
    { id: 'identificacion', label: 'Identificación', icon: FileText },
    { id: 'equipo', label: 'Equipo Humano', icon: Users },
    { id: 'plan_tecnico', label: 'Plan Técnico', icon: Activity },
    { id: 'recursos', label: 'Recursos & Financiamiento', icon: DollarSign },
    { id: 'impacto', label: 'Impacto & Productos', icon: Target },
    { id: 'cronograma', label: 'Cronograma (Gantt)', icon: Activity },
    { id: 'bibliografia', label: 'Bibliografía & Firmas', icon: BookOpen }
];

export const RevisionTecnicaPage: React.FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const navigate = useNavigate();
    const { addToast } = useNotifications();
    const confirm = useConfirm();
    const { user } = useAuth();

    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        return document.documentElement.getAttribute('data-theme') !== 'light';
    });

    const toggleTheme = () => {
        const nextMode = !isDarkMode;
        setIsDarkMode(nextMode);
        document.documentElement.setAttribute('data-theme', nextMode ? 'dark' : 'light');
        localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    };

    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [investigadores, setInvestigadores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rightSidebarTab, setRightSidebarTab] = useState<'consistencia' | 'metricas' | 'comentario'>('consistencia');

    // Modos de Vista
    const [viewMode, setViewMode] = useState<'interactive' | 'pdf'>('interactive');
    const [activeSection, setActiveSection] = useState<string>('identificacion');
    const [activeCommentField, setActiveCommentField] = useState<string>('titulo');
    const [contextualInput, setContextualInput] = useState('');
    const [isListening, setIsListening] = useState(false);

    // Columnas Ajustables e Interactivas (Estilo DIITRA Workspace)
    const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(() => {
        const saved = localStorage.getItem('rev_left_sidebar_width');
        return saved ? parseInt(saved, 10) : 260;
    });
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(() => {
        return localStorage.getItem('rev_left_sidebar_open') !== 'false';
    });

    const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
        const saved = localStorage.getItem('rev_right_sidebar_width');
        return saved ? parseInt(saved, 10) : 380;
    });
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(() => {
        return localStorage.getItem('rev_right_sidebar_open') !== 'false';
    });

    const leftSidebarRef = React.useRef<HTMLDivElement>(null);
    const rightSidebarRef = React.useRef<HTMLDivElement>(null);

    const startDraggingLeft = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        const startWidth = leftSidebarWidth;
        const startX = mouseDownEvent.clientX;

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const deltaX = mouseMoveEvent.clientX - startX;
            const newWidth = Math.max(220, Math.min(380, startWidth + deltaX));
            setLeftSidebarWidth(newWidth);
            localStorage.setItem('rev_left_sidebar_width', String(newWidth));
        };

        const stopDrag = () => {
            document.body.style.removeProperty('user-select');
            document.body.style.removeProperty('cursor');
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    };

    const startDraggingRight = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        const startWidth = rightSidebarWidth;
        const startX = mouseDownEvent.clientX;

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const deltaX = startX - mouseMoveEvent.clientX;
            const newWidth = Math.max(360, Math.min(650, startWidth + deltaX));
            setRightSidebarWidth(newWidth);
            localStorage.setItem('rev_right_sidebar_width', String(newWidth));
        };

        const stopDrag = () => {
            document.body.style.removeProperty('user-select');
            document.body.style.removeProperty('cursor');
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    };

    // Visor de PDF
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loadingPdf, setLoadingPdf] = useState(false);

    // Datos crudos del Snapshot del Documento
    const [docSnapshot, setDocSnapshot] = useState<any>({});

    // Métricas calculadas
    const [metrics, setMetrics] = useState({
        wordCount: 0,
        objectivesCount: 0,
        referencesCount: 0,
        progressPercent: 0
    });

    // Validación semántica
    const [semanticCheck, setSemanticCheck] = useState<{
        score: number;
        matches: string[];
        status: 'excelente' | 'bueno' | 'bajo';
        recommendation: string;
    } | null>(null);

    // Comentarios por sección
    const [comments, setComments] = useState<Record<string, SectionComment>>({
        titulo: { status: 'Pendiente', text: '' },
        programa: { status: 'Pendiente', text: '' },
        grupo: { status: 'Pendiente', text: '' },
        dominio_linea: { status: 'Pendiente', text: '' },
        carrera: { status: 'Pendiente', text: '' },
        campos: { status: 'Pendiente', text: '' },
        equipo: { status: 'Pendiente', text: '' },
        antecedentes: { status: 'Pendiente', text: '' },
        justificacion: { status: 'Pendiente', text: '' },
        objetivos: { status: 'Pendiente', text: '' },
        metodologia: { status: 'Pendiente', text: '' },
        presupuesto: { status: 'Pendiente', text: '' },
        impacto: { status: 'Pendiente', text: '' },
        cronograma: { status: 'Pendiente', text: '' },
        bibliografia: { status: 'Pendiente', text: '' }
    });

    const [generalFeedback, setGeneralFeedback] = useState('');

    // Validación de Carga Horaria (CACES/DIITRA Compliance)
    const teachersWithExceedingHours = investigadores.filter(inv => {
        const proposed = inv.horasSemanales || 0;
        const available = inv.horasDisponibles || inv.horas_disponibles || 0;
        const assigned = inv.horasAsignadas || inv.horas_asignadas || 0;
        return (assigned + proposed) > available;
    });
    const isHoursOk = teachersWithExceedingHours.length === 0;

    // Cargar datos
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

            // Cargar comentarios locales guardados si existen
            const savedComments = localStorage.getItem(`comments_${projectUuid}`);
            if (savedComments) {
                setComments(JSON.parse(savedComments));
            }

            // Cargar PDF
            loadPdf(projectUuid);

            // Calcular métricas dinámicas de la instancia del documento
            await calculateMetrics(projectUuid, projectDetail);

            // Cargar comentarios del backend (colaborativos) para reconstruir observaciones de revisión técnica
            try {
                const collabRes = await api.get(`/collaboration/${projectUuid}/pulse`);
                if (collabRes.data && collabRes.data.comments) {
                    const backendComments: Record<string, SectionComment> = {};
                    collabRes.data.comments.forEach((c: any) => {
                        const content = c.contenido || '';
                        const match = content.match(/^\[(.*?)\]\s*\((.*?)\):\s*(.*)$/);
                        if (match) {
                            const label = match[1];
                            const statusStr = match[2];
                            const text = match[3];
                            const fieldKey = Object.keys(FIELD_LABELS).find(k => FIELD_LABELS[k] === label);
                            if (fieldKey) {
                                backendComments[fieldKey] = {
                                    status: statusStr === 'Aprobado' ? 'Aprobado' : 'Corregir',
                                    text: text
                                };
                            }
                        }
                    });
                    if (Object.keys(backendComments).length > 0) {
                        setComments(prev => {
                            const merged = { ...prev, ...backendComments };
                            localStorage.setItem(`comments_${projectUuid}`, JSON.stringify(merged));
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
    }, [projectUuid, addToast]);

    useEffect(() => {
        loadProjectData();
    }, [loadProjectData]);

    // Inicializar input contextual al cambiar de campo activo
    useEffect(() => {
        if (comments[activeCommentField]) {
            setContextualInput(comments[activeCommentField].text || '');
        } else {
            setContextualInput('');
        }
    }, [activeCommentField, comments]);

    // Carga de PDF
    const loadPdf = async (uuid: string) => {
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
    };

    // Calcular métricas
    const calculateMetrics = async (uuid: string, details: ProjectDetail) => {
        try {
            const instanceRes = await api.get(`/documents/instances/resolve`, {
                params: { templateCode: 'PROTOCOLO_INVESTIGACION', entityUuid: uuid }
            });
            const dataJson = instanceRes.data?.dataSnapshotJson || instanceRes.data?.data_snapshot_json || '{}';
            const metadata = JSON.parse(dataJson);
            setDocSnapshot(metadata);

            // 1. Conteo de Palabras
            const textToCount = [
                metadata.Antecedentes || '',
                metadata.DescripcionProyecto || metadata.descripcionProyecto || '',
                metadata.Justificacion || '',
                metadata.MarcoTeorico || metadata.marcoTeorico || '',
                metadata.Metodologia || ''
            ].join(' ');
            const wordCount = textToCount.split(/\s+/).filter(w => w.length > 0).length;

            // 2. Objetivos
            const objectivesList = metadata.ObjetivosEspecificos || metadata.objetivosEspecificos || [];
            const objectivesCount = objectivesList.length;

            // 3. Referencias Bibliográficas
            const bibText = metadata.Bibliografia || metadata.bibliografia || '';
            const referencesCount = bibText.split('\n').filter((line: string) => line.trim().length > 10).length;

            // 4. Porcentaje de Avance
            const requiredKeys = ['Antecedentes', 'Justificacion', 'Metodologia', 'MarcoTeorico', 'ObjetivoGeneral'];
            const completedCount = requiredKeys.filter(k => (metadata[k] || '').trim().length > 10).length;
            const progressPercent = Math.round((completedCount / requiredKeys.length) * 100);

            setMetrics({
                wordCount,
                objectivesCount,
                referencesCount,
                progressPercent
            });

            // 5. Verificación Semántica Dinámica de Línea de Investigación (IA)
            const titleUpper = details.title.toUpperCase();
            const descUpper = details.descripcion.toUpperCase();
            const lineaUpper = details.linea.toUpperCase();
            const sublineaUpper = (metadata.SublineaInvestigacion || '').toUpperCase();

            // Filtrar stop-words en español
            const stopWords = new Set([
                'DE', 'LA', 'EL', 'Y', 'EN', 'LOS', 'LAS', 'PARA', 'CON', 'POR', 'O', 'UN', 'UNA', 'DEL', 'AL', 'SOBRE'
            ]);

            const wordsToCompare = `${lineaUpper} ${sublineaUpper}`
                .split(/[\s,./()]+/)
                .filter(w => w.length > 3 && !stopWords.has(w));

            let matchedKeywords: string[] = [];
            wordsToCompare.forEach(word => {
                if (titleUpper.includes(word) || descUpper.includes(word)) {
                    if (!matchedKeywords.includes(word)) {
                        matchedKeywords.push(word);
                    }
                }
            });

            let score = 30;
            if (matchedKeywords.length > 0) {
                score = Math.min(100, 40 + matchedKeywords.length * 12);
            }

            const status = score >= 70 ? 'excelente' : score >= 50 ? 'bueno' : 'bajo';
            let recommendation = '';
            if (status === 'excelente') {
                recommendation = `El protocolo presenta una alta correspondencia semántica con la línea institucional de "${details.linea}". Las palabras clave (${matchedKeywords.join(', ')}) están fuertemente alineadas.`;
            } else if (status === 'bueno') {
                recommendation = `El protocolo presenta una alineación aceptable con la línea de investigación. Se sugiere robustecer la justificación con más términos específicos sobre "${details.linea}".`;
            } else {
                recommendation = `Alerta: La correspondencia semántica con la línea institucional de "${details.linea}" es baja. Verifique si el proyecto pertenece a otra carrera o modifique la redacción del título.`;
            }

            setSemanticCheck({
                score,
                matches: matchedKeywords,
                status,
                recommendation
            });

        } catch (e) {
            console.error('[DIITRA] Error al calcular métricas:', e);
        }
    };

    // Guardar cambios en el localStorage y sincronizar con backend
    const handleCommentChange = async (section: string, field: 'status' | 'text', value: string) => {
        const updated = {
            ...comments,
            [section]: {
                ...comments[section],
                [field]: value
            }
        };
        setComments(updated);
        localStorage.setItem(`comments_${projectUuid}`, JSON.stringify(updated));

        // Sincronización si se cambia el estado (Aprobado / Corregir) y el comentario ya tiene texto
        if (field === 'status' && updated[section]?.text?.trim()) {
            try {
                const label = FIELD_LABELS[section] || section.toUpperCase();
                const statusLabel = value === 'Aprobado' ? 'Aprobado' : 'Observación';
                const content = `[${label}] (${statusLabel}): ${updated[section].text.trim()}`;
                await api.post('/collaboration/comments', {
                    documentoUuid: projectUuid,
                    contenido: content,
                    idPadre: null
                });
            } catch (e) {
                console.error("Error al sincronizar estado de comentario en backend", e);
            }
        }
    };

    // Guardar comentario contextual del input y sincronizar con backend
    const saveContextualComment = async () => {
        if (!contextualInput.trim()) return;
        const currentFieldStatus = comments[activeCommentField]?.status === 'Pendiente' ? 'Corregir' : comments[activeCommentField]?.status;

        try {
            // Guardar local
            await handleCommentChange(activeCommentField, 'text', contextualInput.trim());
            await handleCommentChange(activeCommentField, 'status', currentFieldStatus);

            // Persistir en backend como comentario de colaboración (coworking)
            const label = FIELD_LABELS[activeCommentField] || activeCommentField.toUpperCase();
            const statusLabel = currentFieldStatus === 'Aprobado' ? 'Aprobado' : 'Observación';
            const content = `[${label}] (${statusLabel}): ${contextualInput.trim()}`;

            await api.post('/collaboration/comments', {
                documentoUuid: projectUuid,
                contenido: content,
                idPadre: null
            });

            addToast("Observación guardada y sincronizada", `Comentario registrado para: ${label}`, "success");
        } catch (err: any) {
            console.error("Error al persistir comentario en backend:", err);
            addToast("Observación guardada localmente", `Se registró en caché local (Error de red backend).`, "warning");
        }
    };

    // Reconocimiento de Voz nativo (Speech-to-Text)
    const handleStartListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addToast("Reconocimiento de voz no soportado", "Su navegador no es compatible con el dictado por voz.", "warning");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'es-EC';
            recognition.interimResults = false;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onerror = (e: any) => {
                console.error(e);
                setIsListening(false);
                addToast("Error de grabación", "No se pudo transcribir el audio. Intente de nuevo.", "error");
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setContextualInput(prev => prev ? `${prev} ${transcript}` : transcript);
                    addToast("Audio transcrito", "Se ha insertado la nota de voz en las observaciones.", "success");
                }
            };

            recognition.start();
        } catch (err) {
            console.error(err);
            setIsListening(false);
        }
    };

    // Aprobación
    const handleAprobar = async () => {
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
                .filter(([_, c]) => c.status === 'Corregir')
                .map(([sec, c]) => `[${sec.toUpperCase()}]: ${c.text}`)
                .join('; ');

            const obs = generalFeedback.trim()
                || (sectionIssues ? `Revisión Técnica aprobada con observaciones menores: ${sectionIssues}` : 'Aprobación Técnica Inicial del Administrador. Protocolo completo y consistente.');

            const originalState = project.status;

            await api.post(`/projects/${project.uuid}/transition`, null, {
                params: {
                    newState: 'En Revisión',
                    observation: obs
                }
            });

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

    // Devolución
    const handleDevolver = async () => {
        if (!project) return;

        const hasContextualComments = Object.values(comments).some(c => c.text.trim().length > 0);
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
                .filter(([_, c]) => c.text.trim().length > 0)
                .map(([sec, c]) => `* ${FIELD_LABELS[sec] || sec.toUpperCase()} (${c.status}): ${c.text}`)
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

    if (loading || !project) {
        return (
            <main className="h-screen w-full bg-bg-deep flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-text-dim">
                    <Loader2 size={24} className="animate-spin text-brand" />
                    <span className="text-xs font-semibold uppercase tracking-widest font-mono">Cargando revisión técnica...</span>
                </div>
            </main>
        );
    }

    const showContextualPanel = rightSidebarTab === 'comentario' && isRightSidebarOpen;

    // Renderizar burbuja de comentario flotante al lado de las cabeceras de cada tarjeta
    const renderCommentButton = (fieldKey: string, _fieldName: string) => {
        const hasComment = (comments[fieldKey]?.text || '').trim().length > 0;
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setActiveCommentField(fieldKey);
                    setRightSidebarTab('comentario');
                    setIsRightSidebarOpen(true);
                }}
                className={`flex items-center gap-1 p-1 rounded-lg border transition-all active:scale-95 shrink-0 cursor-pointer ${hasComment
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-500 hover:bg-amber-500/10'
                    : 'border-transparent text-text-dim/40 hover:text-text-main hover:bg-surface-hover'
                    }`}
                title={hasComment ? 'Ver observación registrada' : 'Agregar observación contextual'}
            >
                <MessageSquare size={13} className={hasComment ? 'fill-amber-500/5 text-amber-500' : ''} />
                {hasComment && (
                    <span className="text-[8px] font-mono font-bold leading-none bg-amber-500 text-bg-deep px-1 py-0.5 rounded-full animate-pulse">
                        !
                    </span>
                )}
            </button>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-bg-deep overflow-hidden selection:bg-text-main selection:text-bg-deep transition-colors duration-300 font-sans">


            {/* Header de la Página */}
            <div className="px-4 md:px-8 py-3 border-b border-border-thin bg-bg-deep/75 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 z-[50] shrink-0">
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div className="flex items-center gap-3">
                        {/* Botón Volver/Cerrar */}
                        <button
                            onClick={() => navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`)}
                            className="flex items-center gap-2 py-1.5 text-text-dim hover:text-text-main transition-all duration-200 group cursor-pointer text-[10px] md:text-xs font-bold uppercase tracking-wider bg-transparent border-0 active:scale-95"
                            title="Salir del documento y guardar cambios"
                            aria-label="Salir del documento"
                        >
                            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                            <span>Volver</span>
                        </button>

                        {/* Divisor Vertical */}
                        <div className="h-5 w-[1px] bg-border-thin mx-1" />

                        {/* Identidad */}
                        <div className="min-w-0">
                            <h2 className="text-xs md:text-sm font-black text-text-main tracking-tighter uppercase leading-none truncate max-w-[150px] xs:max-w-[220px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[500px]" title={project ? project.title : ''}>
                                {project ? project.title : 'Cargando...'}
                            </h2>
                            <p className="text-[8px] text-text-dim font-bold uppercase tracking-widest mt-0.5 truncate max-w-[120px] xs:max-w-[200px] sm:max-w-[300px] md:max-w-[380px] lg:max-w-[500px]">
                                Revisión Técnica del Protocolo de Investigación
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Selector de Vista */}
                    <div className="flex items-center gap-1.5 border border-border-thin bg-surface-hover/30 p-1 rounded-xl">
                        <button
                            onClick={() => {
                                setViewMode('pdf');
                                setRightSidebarTab('consistencia');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${viewMode === 'pdf'
                                ? 'bg-text-main text-bg-deep font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                }`}
                        >
                            <FileText size={12} />
                            Vista PDF
                        </button>
                        <button
                            onClick={() => setViewMode('interactive')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${viewMode === 'interactive'
                                ? 'bg-text-main text-bg-deep font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                : 'text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                                }`}
                        >
                            <Eye size={12} />
                            Revisión Contextual
                        </button>
                    </div>
                </div>
            </div>

            {/* Layout Principal de Tres Columnas */}
            <div className="flex-1 flex overflow-hidden">

                {/* LADO IZQUIERDO: VISOR INTERACTIVO O PDF (FLEX-1) */}
                <div className="flex-1 h-full border-r border-border-thin bg-bg-deep flex overflow-hidden">
                    {viewMode === 'pdf' ? (
                        loadingPdf ? (
                            <div className="flex-1 flex items-center justify-center text-text-dim text-xs gap-2 font-mono">
                                <Loader2 size={16} className="animate-spin text-brand" /> Generando vista previa del PDF...
                            </div>
                        ) : pdfUrl ? (
                            <iframe
                                src={`${pdfUrl}#toolbar=0`}
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
                            {/* Menú de Secciones Colapsable y Resizable */}
                            <div
                                ref={leftSidebarRef}
                                style={{ width: isLeftSidebarOpen ? `${leftSidebarWidth}px` : '0px' }}
                                className="h-full bg-surface-hover/20 border-r border-border-thin flex flex-col shrink-0 relative overflow-hidden transition-all duration-300"
                            >
                                <div className="px-4 pb-3 pt-4 border-b border-border-thin/50 flex justify-between items-center shrink-0">
                                    <span className="text-[9px] font-black text-text-dim uppercase tracking-widest block font-mono">Secciones</span>
                                    <button
                                        onClick={() => {
                                            setIsLeftSidebarOpen(false);
                                            localStorage.setItem('rev_left_sidebar_open', 'false');
                                        }}
                                        className="p-1 hover:bg-surface-hover rounded text-text-dim hover:text-text-main cursor-pointer"
                                        title="Ocultar Secciones"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                </div>
                                <div className="p-4 flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar">
                                    {SECTIONS.map((sec) => {
                                        const SecIcon = sec.icon;
                                        const isActive = activeSection === sec.id;

                                        let hasActiveComments = false;
                                        if (sec.id === 'identificacion') {
                                            hasActiveComments = ['titulo', 'programa', 'grupo', 'dominio_linea', 'campos', 'carrera'].some(k => (comments[k]?.text || '').trim().length > 0);
                                        } else if (sec.id === 'equipo') {
                                            hasActiveComments = (comments.equipo?.text || '').trim().length > 0;
                                        } else if (sec.id === 'plan_tecnico') {
                                            hasActiveComments = ['antecedentes', 'justificacion', 'objetivos', 'metodologia'].some(k => (comments[k]?.text || '').trim().length > 0);
                                        } else if (sec.id === 'recursos') {
                                            hasActiveComments = (comments.presupuesto?.text || '').trim().length > 0;
                                        } else if (sec.id === 'impacto') {
                                            hasActiveComments = (comments.impacto?.text || '').trim().length > 0;
                                        } else if (sec.id === 'cronograma') {
                                            hasActiveComments = (comments.cronograma?.text || '').trim().length > 0;
                                        } else if (sec.id === 'bibliografia') {
                                            hasActiveComments = (comments.bibliografia?.text || '').trim().length > 0;
                                        }

                                        return (
                                            <button
                                                key={sec.id}
                                                onClick={() => setActiveSection(sec.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${isActive
                                                    ? 'bg-text-main text-bg-deep font-bold shadow-sm'
                                                    : 'text-text-dim hover:text-text-main hover:bg-surface-hover/60'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5 truncate">
                                                    <SecIcon size={14} className="shrink-0" />
                                                    <span className="text-[10px] uppercase tracking-wider truncate">{sec.label}</span>
                                                </div>
                                                {hasActiveComments && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse shrink-0 ml-1.5" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Tirador Resizer derecho */}
                                <div
                                    onMouseDown={startDraggingLeft}
                                    className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand/35 active:bg-brand/50 z-20 transition-all"
                                    title="Arrastra para cambiar ancho"
                                />
                            </div>

                            {/* Campos del Formulario de la Sección Activa */}
                            <div className="flex-1 h-full p-8 overflow-y-auto space-y-6 relative custom-scrollbar bg-bg-deep/20">
                                {/* Botón de reapertura del Dossier si está cerrado */}
                                {!isLeftSidebarOpen && (
                                    <button
                                        onClick={() => {
                                            setIsLeftSidebarOpen(true);
                                            localStorage.setItem('rev_left_sidebar_open', 'true');
                                        }}
                                        className="absolute left-4 top-4 z-30 p-2.5 bg-surface hover:bg-surface-hover border border-border-thin rounded-xl text-text-dim hover:text-text-main flex items-center gap-1.5 shadow-md transition-all duration-200"
                                        title="Mostrar Secciones"
                                    >
                                        <BookOpen size={14} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Secciones</span>
                                    </button>
                                )}
                                {/* Botón de reapertura del Panel de Auditoría si está cerrado */}
                                {!isRightSidebarOpen && (
                                    <button
                                        onClick={() => {
                                            setIsRightSidebarOpen(true);
                                            localStorage.setItem('rev_right_sidebar_open', 'true');
                                        }}
                                        className="absolute right-4 top-4 z-30 p-2.5 bg-surface hover:bg-surface-hover border border-border-thin rounded-xl text-text-dim hover:text-text-main flex items-center gap-1.5 shadow-md transition-all duration-200 animate-fade-in"
                                        title="Mostrar Panel de Auditoría"
                                    >
                                        <Shield size={14} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Auditoría</span>
                                    </button>
                                )}
                                {/* 1. IDENTIFICACIÓN */}
                                {activeSection === 'identificacion' && (
                                    <div className="space-y-5 animate-fade-in">
                                        <div className="border-b border-border-thin/60 pb-3">
                                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">1. Identificación del Proyecto</h3>
                                        </div>

                                        {/* TÍTULO */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-1 relative transition-all ${activeCommentField === 'titulo' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">TEMA / NOMBRE DEL PROYECTO (ESCRIBIR EN MAYÚSCULAS)</span>
                                                {renderCommentButton('titulo', 'Tema / Nombre del Proyecto')}
                                            </div>
                                            <p className="text-xs font-bold text-text-main uppercase leading-relaxed pr-6">{project.title}</p>
                                        </div>

                                        {/* PROGRAMA */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-1 relative transition-all ${activeCommentField === 'programa' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">PROGRAMA</span>
                                                {renderCommentButton('programa', 'Programa')}
                                            </div>
                                            <p className="text-xs font-medium text-text-main pr-6">{docSnapshot.Programa || 'Programa de Transformación Digital'}</p>
                                        </div>

                                        {/* GRUPO */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-2.5 relative transition-all ${activeCommentField === 'grupo' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">¿GRUPO DE INVESTIGACIÓN?</span>
                                                {renderCommentButton('grupo', 'Grupo de Investigación')}
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">¿Aplica Grupo?</span>
                                                    <p className="text-xs font-bold text-text-main mt-0.5">{docSnapshot.GrupoInvestigacionTipo || 'SI'}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Nombre del Grupo</span>
                                                    <p className="text-xs font-medium text-text-main mt-0.5">{docSnapshot.GrupoInvestigacionNombre || 'Grupo de Investigación en Ingeniería de Software y TI (GIIST)'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* DOMINIO, LÍNEA */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-2.5 relative transition-all ${activeCommentField === 'dominio_linea' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">DOMINIO Y LÍNEAS DE INVESTIGACIÓN</span>
                                                {renderCommentButton('dominio_linea', 'Dominio y Líneas')}
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Dominio Académico</span>
                                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{project.dominio || 'Tecnologías de la Información'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Línea de Investigación</span>
                                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{project.linea}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Sublínea</span>
                                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{docSnapshot.SublineaInvestigacion || 'Desarrollo de Software Multiplataforma'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CAMPOS CACES */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-2.5 relative transition-all ${activeCommentField === 'campos' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">CAMPOS METADATOS CACES</span>
                                                {renderCommentButton('campos', 'Campos CACES')}
                                            </div>
                                            <div className="grid grid-cols-4 gap-3">
                                                <div>
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Tipo</span>
                                                    <p className="text-xs font-bold text-text-main mt-0.5">{docSnapshot.TipoInvestigacion || 'APLICADA'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Campo Amplio</span>
                                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{docSnapshot.CampoAmplio || 'TI'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Campo Específico</span>
                                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{docSnapshot.CampoEspecifico || 'SOFTWARE'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Campo Detallado</span>
                                                    <p className="text-xs font-medium text-text-main mt-0.5 truncate">{docSnapshot.CampoDetallado || 'INGENIERÍA'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CARRERA */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-2.5 relative transition-all ${activeCommentField === 'carrera' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">CARRERA Y CONVOCATORIA ACTIVA</span>
                                                {renderCommentButton('carrera', 'Carrera')}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Carrera / Unidad</span>
                                                    <p className="text-xs font-semibold text-text-main mt-0.5">{project.carrera || 'DESARROLLO DE SOFTWARE'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Convocatoria</span>
                                                    <p className="text-xs font-semibold text-text-main mt-0.5 truncate">{project.convocatoria}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 2. EQUIPO HUMANO */}
                                {activeSection === 'equipo' && (
                                    <div className="space-y-5 animate-fade-in">
                                        <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">2. Equipo Humano del Proyecto</h3>
                                            {renderCommentButton('equipo', 'Equipo Humano')}
                                        </div>

                                        <div className="space-y-3">
                                            {investigadores.map((inv, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border border-border-thin bg-surface flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs font-bold text-text-main">{inv.nombres_completos || `${inv.nombre} ${inv.apellido}`}</p>
                                                        <p className="text-[10px] text-brand uppercase tracking-wider font-semibold mt-0.5">{inv.rol || 'Investigador'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Horas</p>
                                                        <p className="text-xs font-mono font-bold text-text-main">{inv.horasSemanales || 0} hrs</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. PLAN TÉCNICO */}
                                {activeSection === 'plan_tecnico' && (
                                    <div className="space-y-5 animate-fade-in">
                                        <div className="border-b border-border-thin/60 pb-3">
                                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">3. Plan Técnico de Investigación</h3>
                                        </div>

                                        {/* ANTECEDENTES */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-1 relative transition-all ${activeCommentField === 'antecedentes' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">ANTECEDENTES</span>
                                                {renderCommentButton('antecedentes', 'Antecedentes')}
                                            </div>
                                            <p className="text-xs text-text-main leading-relaxed text-justify font-mono whitespace-pre-line pr-4">{docSnapshot.Antecedentes || 'No redactado.'}</p>
                                        </div>

                                        {/* JUSTIFICACIÓN */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-1 relative transition-all ${activeCommentField === 'justificacion' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">JUSTIFICACIÓN DEL PROYECTO</span>
                                                {renderCommentButton('justificacion', 'Justificación')}
                                            </div>
                                            <p className="text-xs text-text-main leading-relaxed text-justify font-mono whitespace-pre-line pr-4">{docSnapshot.Justificacion || 'No redactado.'}</p>
                                        </div>

                                        {/* OBJETIVOS */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-2.5 relative transition-all ${activeCommentField === 'objetivos' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-1.5">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">OBJETIVOS INSTITUCIONALES</span>
                                                {renderCommentButton('objetivos', 'Objetivos')}
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-[8px] font-bold text-brand uppercase tracking-widest block">Objetivo General</span>
                                                    <p className="text-xs font-bold text-text-main mt-0.5 leading-relaxed">{docSnapshot.ObjetivoGeneral || 'No definido.'}</p>
                                                </div>
                                                <div className="border-t border-border-thin/30 pt-2">
                                                    <span className="text-[8px] font-bold text-brand uppercase tracking-widest block mb-1">Objetivos Específicos</span>
                                                    <ul className="list-disc pl-4 space-y-1 text-xs text-text-main">
                                                        {(docSnapshot.ObjetivosEspecificos || []).map((obj: string, i: number) => (
                                                            <li key={i}>{obj}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* METODOLOGÍA */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-1 relative transition-all ${activeCommentField === 'metodologia' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">METODOLOGÍA Y DISEÑO</span>
                                                {renderCommentButton('metodologia', 'Metodología')}
                                            </div>
                                            <p className="text-xs text-text-main leading-relaxed text-justify font-mono whitespace-pre-line pr-4">{docSnapshot.Metodologia || 'No redactada.'}</p>
                                        </div>
                                    </div>
                                )}

                                {/* 4. RECURSOS & FINANCIAMIENTO */}
                                {activeSection === 'recursos' && (
                                    <div className="space-y-5 animate-fade-in">
                                        <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">4. Recursos & Presupuesto</h3>
                                            {renderCommentButton('presupuesto', 'Presupuesto')}
                                        </div>

                                        <div className="p-5 rounded-2xl border border-border-thin bg-surface flex justify-between items-center">
                                            <div>
                                                <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest block">Presupuesto Planificado</span>
                                                <span className="text-base font-black text-success font-mono">${project.presupuesto.toLocaleString('es-EC')} USD</span>
                                            </div>
                                            {project.convocatoriaMontoMaximo && (
                                                <div className="text-right">
                                                    <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest block">Tope Permitido</span>
                                                    <span className="text-xs font-bold text-text-main font-mono">${project.convocatoriaMontoMaximo.toLocaleString('es-EC')} USD</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {(docSnapshot.RecursosNecesarios || []).map((r: any, idx: number) => (
                                                <div key={idx} className="p-3.5 rounded-xl border border-border-thin bg-surface/50 flex justify-between text-xs items-center">
                                                    <div>
                                                        <p className="font-semibold text-text-main">{r.Descripcion}</p>
                                                        <p className="text-[9px] text-text-dim font-mono mt-0.5">Cant: {r.Cantidad}</p>
                                                    </div>
                                                    <span className="font-mono text-text-main">${(Number(r.CostoUnitario) * Number(r.Cantidad)).toLocaleString()} USD</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 5. IMPACTO & PRODUCTOS */}
                                {activeSection === 'impacto' && (
                                    <div className="space-y-5 animate-fade-in">
                                        <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">5. Impacto & Productos Esperados</h3>
                                            {renderCommentButton('impacto', 'Impacto')}
                                        </div>

                                        <div className="space-y-3">
                                            {(docSnapshot.ProductosEsperados || []).map((p: any, idx: number) => (
                                                <div key={idx} className="p-3.5 rounded-xl border border-border-thin bg-surface flex justify-between text-xs items-center">
                                                    <span className="font-semibold text-text-main">{p.Tipo || 'Publicación Indexada'}</span>
                                                    <span className="badge-vercel badge-vercel-neutral font-mono">Cantidad: {p.Cantidad || 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 6. CRONOGRAMA */}
                                {activeSection === 'cronograma' && (
                                    <div className="space-y-5 animate-fade-in">
                                        <div className="border-b border-border-thin/60 pb-3 flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">6. Cronograma de Actividades (Gantt)</h3>
                                            {renderCommentButton('cronograma', 'Cronograma')}
                                        </div>

                                        <div className="space-y-3">
                                            {(docSnapshot.Cronograma || []).map((c: any, idx: number) => (
                                                <div key={idx} className="p-4 rounded-xl border border-border-thin bg-surface flex justify-between items-center text-xs">
                                                    <div>
                                                        <p className="font-bold text-text-main">{c.Actividad}</p>
                                                        <p className="text-[9px] text-text-dim font-mono mt-0.5">Recursos: {c.RecursosNecesarios || 'No especificados'}</p>
                                                    </div>
                                                    <span className="badge-vercel badge-vercel-info">Secuencia {c.Numero || idx + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 7. BIBLIOGRAFÍA & FIRMAS */}
                                {activeSection === 'bibliografia' && (
                                    <div className="space-y-5 animate-fade-in">
                                        <div className="border-b border-border-thin/60 pb-3">
                                            <h3 className="text-xs font-bold text-text-main uppercase tracking-widest font-mono">7. Bibliografía & Firmas</h3>
                                        </div>

                                        {/* BIBLIOGRAFÍA */}
                                        <div className={`p-4 rounded-xl border border-border-thin bg-surface space-y-1 relative transition-all ${activeCommentField === 'bibliografia' && showContextualPanel ? 'border-brand/40 bg-brand/[0.01]' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider">REFERENCIAS BIBLIOGRÁFICAS (APA)</span>
                                                {renderCommentButton('bibliografia', 'Bibliografía')}
                                            </div>
                                            <p className="text-xs text-text-main leading-relaxed text-justify font-mono whitespace-pre-line pr-4">{docSnapshot.Bibliografia || 'Sin bibliografía declarada.'}</p>
                                        </div>

                                        {/* FIRMAS */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl border border-border-thin bg-surface">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block">Director de Proyecto</span>
                                                <p className="text-xs font-bold text-text-main mt-1">{project.directorProyecto}</p>
                                                <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1 mt-2">
                                                    Firmado Digitalmente
                                                </span>
                                            </div>
                                            <div className="p-4 rounded-xl border border-border-thin bg-surface">
                                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block">Coordinador de Carrera</span>
                                                <p className="text-xs font-bold text-text-main mt-1">Coordinación DIITRA ISTPET</p>
                                                <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1 mt-2">
                                                    Firmado Digitalmente
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* LADO DERECHO: SIDEBAR AJUSTABLE Y COLAPSABLE DE AUDITORÍA */}
                <div
                    ref={rightSidebarRef}
                    style={{ width: isRightSidebarOpen ? `${rightSidebarWidth}px` : '0px' }}
                    className="h-full bg-surface border-l border-border-thin flex flex-col shrink-0 relative overflow-hidden transition-all duration-300"
                >
                    {/* Tirador Resizer izquierdo */}
                    <div
                        onMouseDown={startDraggingRight}
                        className="absolute top-0 left-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand/35 active:bg-brand/50 z-20 transition-all"
                        title="Arrastra para cambiar ancho"
                    />

                    {/* Cabecera / Pestañas */}
                    <div className="tabs-vercel shrink-0 px-6 border-b border-border-thin bg-surface-hover/20 flex items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRightSidebarTab('consistencia')}
                                className={`tab-vercel-item ${rightSidebarTab === 'consistencia' ? 'active' : ''}`}
                            >
                                <Shield size={12} className="mr-1.5" /> Consistencia
                            </button>
                            <button
                                onClick={() => setRightSidebarTab('metricas')}
                                className={`tab-vercel-item ${rightSidebarTab === 'metricas' ? 'active' : ''}`}
                            >
                                <BarChart2 size={12} className="mr-1.5" /> Métricas
                            </button>
                            {activeCommentField && (comments[activeCommentField]?.text || rightSidebarTab === 'comentario') && (
                                <button
                                    onClick={() => setRightSidebarTab('comentario')}
                                    className={`tab-vercel-item ${rightSidebarTab === 'comentario' ? 'active' : ''}`}
                                >
                                    <MessageSquare size={12} className="mr-1.5" /> Comentario
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setIsRightSidebarOpen(false);
                                localStorage.setItem('rev_right_sidebar_open', 'false');
                            }}
                            className="p-1 hover:bg-surface-hover rounded text-text-dim hover:text-text-main cursor-pointer"
                            title="Ocultar Auditoría"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Contenido Dinámico */}
                    <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                        {/* TAB 1: CONSISTENCIA */}
                        {rightSidebarTab === 'consistencia' && (
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest">Chequeos de Consistencia Automática</h3>

                                    <div className="p-4 rounded-xl border border-border-thin bg-bg-deep/30 flex items-start gap-3">
                                        {project.convocatoriaMontoMaximo && project.presupuesto > project.convocatoriaMontoMaximo ? (
                                            <AlertTriangle size={16} className="text-error mt-0.5 shrink-0 animate-bounce" />
                                        ) : (
                                            <CheckCircle size={16} className="text-success mt-0.5 shrink-0" />
                                        )}
                                        <div className="flex-1 leading-snug">
                                            <p className="text-xs font-bold text-text-main">Tope de Presupuesto Convocatoria</p>
                                            <p className="text-[10px] text-text-dim mt-0.5">
                                                Costo Planificado: <span className="font-mono">${project.presupuesto.toLocaleString('es-EC')}</span> USD
                                            </p>
                                            {project.convocatoriaMontoMaximo && (
                                                <p className="text-[9px] text-text-dim">Monto Máximo: ${project.convocatoriaMontoMaximo.toLocaleString('es-EC')} USD</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl border border-border-thin bg-bg-deep/30 flex items-start gap-3">
                                        {investigadores.length === 0 ? (
                                            <AlertTriangle size={16} className="text-error mt-0.5 shrink-0 animate-pulse" />
                                        ) : (
                                            <CheckCircle size={16} className="text-success mt-0.5 shrink-0" />
                                        )}
                                        <div className="flex-1 leading-snug">
                                            <p className="text-xs font-bold text-text-main">Conformación de Equipo Humano</p>
                                            <p className="text-[10px] text-text-dim mt-0.5">
                                                Se detectaron {investigadores.length} integrantes en el proyecto.
                                            </p>
                                            <p className="text-[9px] text-text-dim">Director: {project.directorProyecto}</p>
                                        </div>
                                    </div>

                                    {/* Carga Horaria Docente (CACES Compliance) */}
                                    <div className="p-4 rounded-xl border border-border-thin bg-bg-deep/30 flex items-start gap-3">
                                        {!isHoursOk ? (
                                            <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0 animate-pulse" />
                                        ) : (
                                            <CheckCircle size={16} className="text-success mt-0.5 shrink-0" />
                                        )}
                                        <div className="flex-1 leading-snug">
                                            <p className="text-xs font-bold text-text-main">Carga Horaria Docente</p>
                                            <p className="text-[10px] text-text-dim mt-0.5">
                                                {isHoursOk
                                                    ? 'Todos los docentes cuentan con carga horaria disponible.'
                                                    : `Exceso detectado en: ${teachersWithExceedingHours.map(t => t.nombres_completos || t.nombre || `${t.nombre || ''} ${t.apellido || ''}`).join(', ')}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {semanticCheck && (
                                    <div className="p-5 rounded-2xl border border-brand/20 bg-brand/[0.01] space-y-3.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Alineación Semántica IA</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${semanticCheck.status === 'excelente' ? 'text-success' : 'text-warning'
                                                }`}>
                                                Ajuste: {semanticCheck.score}%
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-medium text-text-main leading-relaxed">
                                                {semanticCheck.recommendation}
                                            </p>
                                            {semanticCheck.matches.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {semanticCheck.matches.map((w, idx) => (
                                                        <span key={idx} className="bg-brand/10 border border-brand/25 text-brand rounded px-1.5 py-0.5 text-[9px] font-medium font-mono lowercase">
                                                            #{w.toLowerCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: MÉTRICAS */}
                        {rightSidebarTab === 'metricas' && (
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                                <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest">Estadísticas Clave del Protocolo</h3>

                                <div className="grid grid-cols-2 gap-3.5">
                                    <div className="p-3.5 rounded-xl border border-border-thin bg-bg-deep/20 text-center space-y-1">
                                        <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Palabras</p>
                                        <p className="text-xl font-bold text-text-main font-mono">{metrics.wordCount}</p>
                                        <p className="text-[8px] text-text-dim">Mínimo: 1.500</p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-border-thin bg-bg-deep/20 text-center space-y-1">
                                        <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Objetivos</p>
                                        <p className="text-xl font-bold text-text-main font-mono">{metrics.objectivesCount}</p>
                                        <p className="text-[8px] text-text-dim">Sugerido: 3 a 5</p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-border-thin bg-bg-deep/20 text-center space-y-1">
                                        <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Referencias</p>
                                        <p className="text-xl font-bold text-text-main font-mono">{metrics.referencesCount}</p>
                                        <p className="text-[8px] text-text-dim">Norma APA 7</p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-border-thin bg-bg-deep/20 text-center space-y-1">
                                        <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Avance</p>
                                        <p className="text-xl font-bold text-brand font-mono">{metrics.progressPercent}%</p>
                                        <p className="text-[8px] text-text-dim">Obligatorios</p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-text-dim">
                                        <span>Completitud de Secciones</span>
                                        <span>{metrics.progressPercent}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                        <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${metrics.progressPercent}%` }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: OBSERVACIÓN CONTEXTUAL (ACOPLADA) */}
                        {rightSidebarTab === 'comentario' && (
                            <div className="flex-1 flex flex-col min-h-0 bg-surface">
                                {/* Historial o Vacío */}
                                <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-center items-center bg-bg-deep/5 custom-scrollbar text-center text-text-dim">
                                    <div className="w-full px-1 py-2 text-left mb-2.5 shrink-0">
                                        <p className="text-[8px] font-mono font-bold text-amber-500 uppercase tracking-widest leading-none mb-1">CAMPO BAJO INSPECCIÓN:</p>
                                        <p className="text-xs font-bold text-text-main uppercase tracking-tight truncate leading-tight" title={FIELD_LABELS[activeCommentField]}>
                                            {FIELD_LABELS[activeCommentField] || 'Sin selección'}
                                        </p>
                                    </div>

                                    {comments[activeCommentField]?.text ? (
                                        <div className="w-full bg-surface border border-border-thin p-4 rounded-xl text-left space-y-3.5 shadow-sm">
                                            <div className="flex items-center justify-between border-b border-border-thin/20 pb-1.5">
                                                <span className="text-[9px] font-bold text-brand uppercase tracking-wider font-mono">Dictamen del Auditor:</span>
                                                <span className={`text-[8px] font-mono font-bold uppercase tracking-widest ${comments[activeCommentField].status === 'Aprobado' ? 'text-success' : 'text-error'
                                                    }`}>
                                                    {comments[activeCommentField].status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-main font-mono leading-relaxed italic break-words">
                                                "{comments[activeCommentField].text}"
                                            </p>
                                            <div className="flex justify-end gap-2 pt-2 border-t border-border-thin/40">
                                                <button
                                                    onClick={() => handleCommentChange(activeCommentField, 'status', 'Aprobado')}
                                                    className="text-[8px] font-bold uppercase tracking-widest text-success px-2 py-1 rounded bg-success/5 hover:bg-success/10 transition-all cursor-pointer"
                                                >
                                                    Aprobado
                                                </button>
                                                <button
                                                    onClick={() => handleCommentChange(activeCommentField, 'status', 'Corregir')}
                                                    className="text-[8px] font-bold uppercase tracking-widest text-error px-2 py-1 rounded bg-error/5 hover:bg-error/10 transition-all cursor-pointer"
                                                >
                                                    Solicitar Corrección
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in flex flex-col items-center">
                                            <div className="p-3 bg-surface rounded-full border border-border-thin mb-3 shadow-sm text-amber-500">
                                                <MessageSquare size={16} />
                                            </div>
                                            <p className="text-[10px] font-black text-text-main uppercase tracking-wider">Sin observaciones aún</p>
                                            <p className="text-[9px] text-text-dim mt-1.5 max-w-[200px] leading-relaxed uppercase font-mono">
                                                Escriba retroalimentación específica o grabe con voz los ajustes requeridos para este campo.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Formulario de Comentario de Campo */}
                                <div className="shrink-0 p-4 border-t border-border-thin bg-surface-hover/20">
                                    <div className="flex items-center gap-2 bg-bg-deep border border-border-thin rounded-xl px-3 py-2.5 focus-within:border-brand/45 transition-all">
                                        <textarea
                                            value={contextualInput}
                                            onChange={(e) => setContextualInput(e.target.value)}
                                            placeholder="Escriba la retroalimentación..."
                                            className="flex-1 bg-transparent border-0 outline-none text-xs text-text-main placeholder:text-text-dim/60 resize-none h-10 font-mono leading-relaxed"
                                            disabled={submitting}
                                        />
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <style>{`
                                                @keyframes soundwave {
                                                    0% { height: 4px; }
                                                    100% { height: 20px; }
                                                }
                                            `}</style>
                                            {isListening && (
                                                <div className="flex items-center gap-0.5 px-1 shrink-0 h-6">
                                                    <span className="w-0.5 bg-error rounded-full animate-[soundwave_0.8s_infinite_ease-in-out_alternate]" style={{ animationDelay: '0.1s', height: '12px' }} />
                                                    <span className="w-0.5 bg-error rounded-full animate-[soundwave_0.8s_infinite_ease-in-out_alternate]" style={{ animationDelay: '0.4s', height: '18px' }} />
                                                    <span className="w-0.5 bg-error rounded-full animate-[soundwave_0.8s_infinite_ease-in-out_alternate]" style={{ animationDelay: '0.2s', height: '14px' }} />
                                                    <span className="w-0.5 bg-error rounded-full animate-[soundwave_0.8s_infinite_ease-in-out_alternate]" style={{ animationDelay: '0.6s', height: '16px' }} />
                                                    <span className="w-0.5 bg-error rounded-full animate-[soundwave_0.8s_infinite_ease-in-out_alternate]" style={{ animationDelay: '0.3s', height: '10px' }} />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleStartListening}
                                                className={`p-2 rounded-full border transition-all cursor-pointer ${isListening
                                                    ? 'bg-error/15 text-error border-error/30 animate-pulse'
                                                    : 'bg-surface hover:bg-surface-hover border-border-thin text-text-dim hover:text-text-main'
                                                    }`}
                                                title={isListening ? "Detener voz" : "Grabar explicación de voz"}
                                            >
                                                {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={saveContextualComment}
                                                disabled={!contextualInput.trim()}
                                                className="p-2 rounded-full bg-text-main hover:bg-text-main/90 text-bg-deep disabled:opacity-30 transition-all cursor-pointer"
                                                title="Guardar dictamen"
                                            >
                                                <Send size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Decisiones Generales (Sticky inferior persistente) */}
                    <div className="p-6 pb-20 border-t border-border-thin bg-surface-hover/30 space-y-4 shrink-0 font-sans">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-0.5">Observaciones Generales de la Auditoría</label>
                            <textarea
                                value={generalFeedback}
                                onChange={(e) => setGeneralFeedback(e.target.value)}
                                placeholder="Escriba la síntesis del informe o instrucciones generales de corrección para el docente..."
                                className="input-vercel !h-20 !text-xs resize-none"
                                disabled={submitting}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleAprobar}
                                disabled={submitting}
                                className="flex items-center justify-center gap-1.5 btn-vercel-primary py-3 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer animate-fade-in"
                            >
                                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Scale size={12} />}
                                Aprobar Requisitos
                            </button>

                            <button
                                onClick={handleDevolver}
                                disabled={submitting}
                                className="flex items-center justify-center gap-1.5 bg-transparent hover:bg-error/10 text-error border border-error/20 hover:border-error/40 rounded-xl py-3 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer animate-fade-in"
                            >
                                {submitting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                Devolver Proyecto
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default RevisionTecnicaPage;
