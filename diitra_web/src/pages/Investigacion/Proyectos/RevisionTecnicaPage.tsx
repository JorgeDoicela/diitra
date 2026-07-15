import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Shield,
    RotateCcw, Scale, Loader2, FileText,
    MessageSquare, AlertCircle, Eye, Users, Activity, DollarSign, Target,
    BookOpen, ChevronLeft, CheckCircle, X
} from 'lucide-react';
import api from '../../../api/axios_config';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';
import { ObservationsSidebar } from './components/ObservationsSidebar';
import { InteractiveSections } from './components/InteractiveSections';

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
    id: number;
    status: 'Pendiente' | 'Aprobado' | 'Corregir';
    text: string;
    creadoEn?: string;
    nombreUsuario?: string;
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

    const getSafeArray = (value: any): any[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) return parsed;
            } catch {}
        }
        return [];
    };

    const getFieldCardClasses = (fieldKey: string, extraClasses: string = 'space-y-1') => {
        const isActive = activeCommentField === fieldKey && showContextualPanel;
        
        const borderClass = 'border-border-thin bg-surface';
        
        const activeClass = isActive 
            ? '!border-brand/45 bg-brand/[0.003] shadow-[0_4px_20px_rgba(99,102,241,0.04)] ring-1 ring-brand/5 scale-[1.002]' 
            : '';
        
        return `p-4 rounded-xl border ${extraClasses} relative cursor-pointer hover:bg-surface-hover/80 active:scale-[0.99] transition-all duration-200 ${borderClass} ${activeClass}`;
    };

    const renderFieldStatusBadge = (_fieldKey: string) => {
        return null;
    };

    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [investigadores, setInvestigadores] = useState<any[]>([]);
    const [isDraggingLeft, setIsDraggingLeft] = useState(false);
    const [isDraggingRight, setIsDraggingRight] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

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

    const [auditoriaButtonTop, setAuditoriaButtonTop] = useState<number>(() => {
        const saved = localStorage.getItem('rev_auditoria_button_top');
        return saved ? parseInt(saved, 10) : 180;
    });
    const [auditoriaButtonLeft, setAuditoriaButtonLeft] = useState<number | null>(null);
    const [isDraggingButton, setIsDraggingButton] = useState(false);

    const handleButtonDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingButton(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startTop = auditoriaButtonTop;
        const buttonWidth = 34;
        const initialX = window.innerWidth - buttonWidth;
        let hasMoved = false;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                hasMoved = true;
            }

            let newX = initialX + deltaX;
            newX = Math.max(window.innerWidth / 2, Math.min(window.innerWidth - buttonWidth, newX));

            let newTop = startTop + deltaY;
            newTop = Math.max(70, Math.min(window.innerHeight - 150, newTop));

            setAuditoriaButtonLeft(newX);
            setAuditoriaButtonTop(newTop);
        };

        const handleMouseUp = (mouseUpEvent: MouseEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setIsDraggingButton(false);

            if (hasMoved) {
                setAuditoriaButtonLeft(null); // Snap back to right

                const finalY = startTop + (mouseUpEvent.clientY - startY);
                const boundedY = Math.max(70, Math.min(window.innerHeight - 150, finalY));
                setAuditoriaButtonTop(boundedY);
                localStorage.setItem('rev_auditoria_button_top', boundedY.toString());
            } else {
                setAuditoriaButtonLeft(null);
                setIsRightSidebarOpen(true);
                localStorage.setItem('rev_right_sidebar_open', 'true');
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const [seccionesButtonTop, setSeccionesButtonTop] = useState<number>(() => {
        const saved = localStorage.getItem('rev_secciones_button_top');
        return saved ? parseInt(saved, 10) : 180;
    });
    const [seccionesButtonLeft, setSeccionesButtonLeft] = useState<number | null>(null);
    const [isDraggingSeccionesButton, setIsDraggingSeccionesButton] = useState(false);

    const handleSeccionesButtonDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingSeccionesButton(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startTop = seccionesButtonTop;
        const buttonWidth = 36;
        const initialX = 0;
        let hasMoved = false;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                hasMoved = true;
            }

            let newX = initialX + deltaX;
            newX = Math.max(0, Math.min(window.innerWidth / 2 - buttonWidth, newX));

            let newTop = startTop + deltaY;
            newTop = Math.max(70, Math.min(window.innerHeight - 150, newTop));

            setSeccionesButtonLeft(newX);
            setSeccionesButtonTop(newTop);
        };

        const handleMouseUp = (mouseUpEvent: MouseEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setIsDraggingSeccionesButton(false);

            if (hasMoved) {
                setSeccionesButtonLeft(null); // Snap back to left

                const finalY = startTop + (mouseUpEvent.clientY - startY);
                const boundedY = Math.max(70, Math.min(window.innerHeight - 150, finalY));
                setSeccionesButtonTop(boundedY);
                localStorage.setItem('rev_secciones_button_top', boundedY.toString());
            } else {
                setSeccionesButtonLeft(null);
                setIsLeftSidebarOpen(true);
                localStorage.setItem('rev_left_sidebar_open', 'true');
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
        const saved = localStorage.getItem('rev_right_sidebar_width');
        return saved ? parseInt(saved, 10) : 380;
    });
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(() => {
        return localStorage.getItem('rev_right_sidebar_open') !== 'false';
    });

    const leftSidebarRef = React.useRef<HTMLDivElement>(null);

    const startDraggingLeft = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        setIsDraggingLeft(true);

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
            setIsDraggingLeft(false);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    };

    const startDraggingRight = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        setIsDraggingRight(true);

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
            setIsDraggingRight(false);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    };

    // Visor de PDF
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loadingPdf, setLoadingPdf] = useState(false);

    // Datos crudos del Snapshot del Documento
    const [docSnapshot, setDocSnapshot] = useState<any>({});

    // Removido estado metrics

    // Comentarios por sección (soporta múltiples observaciones)
    const [comments, setComments] = useState<Record<string, SectionComment[]>>({});

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
            await calculateMetrics(projectUuid);

            // Cargar comentarios del backend (colaborativos) para reconstruir observaciones de revisión técnica
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

                    // Ordenar observaciones cronológicamente por ID (más viejos primero en la lista)
                    Object.keys(backendComments).forEach(key => {
                        backendComments[key].sort((a, b) => a.id - b.id);
                    });

                    if (Object.keys(backendComments).length > 0) {
                        setComments(prev => {
                            const merged = { ...prev, ...backendComments };
                            localStorage.setItem(`comments_${projectUuid}`, JSON.stringify(merged));
                            
                            // Inicializar el input contextual con el comentario del campo activo por defecto
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
    }, [projectUuid, addToast]);

    useEffect(() => {
        loadProjectData();
    }, [loadProjectData]);

    useEffect(() => {
        const checkScreenSize = () => {
            if (window.innerWidth < 1100) {
                setIsLeftSidebarOpen(false);
                localStorage.setItem('rev_left_sidebar_open', 'false');
            }
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Inicializar input contextual al cambiar de campo activo
    useEffect(() => {
        setContextualInput('');
        setEditingCommentId(null);
    }, [activeCommentField]);

    // Auto-Scroll suave a la tarjeta seleccionada en el visor interactivo
    useEffect(() => {
        if (!activeCommentField || viewMode === 'pdf') return;
        const targetElement = document.getElementById(`field-card-${activeCommentField}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeCommentField, viewMode]);

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

    // Cargar datos del snapshot
    const calculateMetrics = async (uuid: string) => {
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
    };

    // Rastrear si estamos editando una observación específica
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);

    // Helpers locales para manipular el estado de arrays de comentarios
    const addCommentLocal = (section: string, comment: SectionComment) => {
        setComments(prev => {
            const current = prev[section] || [];
            const updated = {
                ...prev,
                [section]: [...current, comment]
            };
            localStorage.setItem(`comments_${projectUuid}`, JSON.stringify(updated));
            return updated;
        });
    };

    const updateCommentLocal = (section: string, id: number, text: string) => {
        setComments(prev => {
            const current = prev[section] || [];
            const updatedList = current.map(c => c.id === id ? { ...c, text } : c);
            const updated = {
                ...prev,
                [section]: updatedList
            };
            localStorage.setItem(`comments_${projectUuid}`, JSON.stringify(updated));
            return updated;
        });
    };

    const removeCommentLocal = (section: string, id: number) => {
        setComments(prev => {
            const current = prev[section] || [];
            const updatedList = current.filter(c => c.id !== id);
            const updated = {
                ...prev,
                [section]: updatedList
            };
            localStorage.setItem(`comments_${projectUuid}`, JSON.stringify(updated));
            return updated;
        });
    };

    // Guardar o modificar comentario contextual y sincronizar con backend
    const saveContextualComment = async () => {
        if (!contextualInput.trim()) return;
        const newStatus = 'Corregir';
        const label = FIELD_LABELS[activeCommentField] || activeCommentField.toUpperCase();
        const content = `[${label}] (Observación): ${contextualInput.trim()}`;

        try {
            if (editingCommentId) {
                // Modo Edición: Actualizar comentario existente (PUT)
                await api.put(`/collaboration/comments/${editingCommentId}`, {
                    contenido: content,
                    Contenido: content
                });

                // Actualizar localmente
                updateCommentLocal(activeCommentField, editingCommentId, contextualInput.trim());
                setEditingCommentId(null);
            } else {
                // Modo Creación: Crear nueva observación (POST)
                const res = await api.post('/collaboration/comments', {
                    documentoUuid: projectUuid,
                    DocumentoUuid: projectUuid,
                    documento_uuid: projectUuid,
                    contenido: content,
                    Contenido: content,
                    idPadre: null,
                    IdPadre: null,
                    id_padre: null
                });

                const newId = res.data?.idComentario || res.data?.id || Date.now();

                // Agregar localmente
                addCommentLocal(activeCommentField, {
                    id: newId,
                    status: newStatus,
                    text: contextualInput.trim()
                });
            }

            // Limpiar la caja de texto
            setContextualInput("");
        } catch (err: any) {
            console.error("Error al persistir comentario en backend:", err);
            addToast("Error de conexión", "No se pudo sincronizar el comentario con el servidor backend.", "error");
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
                console.error("Speech recognition error:", e);
                setIsListening(false);
                if (e.error === 'not-allowed') {
                    addToast("Permiso denegado", "Habilite el acceso al micrófono en su navegador para usar el dictado por voz.", "warning");
                } else if (e.error === 'no-speech') {
                    addToast("No se detectó voz", "No se escuchó ningún sonido. Intente hablar más fuerte o cerca del micrófono.", "info");
                } else {
                    addToast("Error de dictado", "No se pudo procesar el audio. Intente de nuevo.", "error");
                }
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

    // Devolución
    const handleDevolver = async () => {
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

    const showContextualPanel = isRightSidebarOpen;

    // Renderizar burbuja de comentario flotante al lado de las cabeceras de cada tarjeta
    const renderCommentButton = (fieldKey: string, _fieldName: string) => {
        const hasComment = comments[fieldKey] && comments[fieldKey].length > 0;
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setActiveCommentField(fieldKey);
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
                            onClick={() => setViewMode('pdf')}
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

                    {/* Botón de Finalizar Auditoría */}
                    <button
                        onClick={() => setIsFinalizeModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-brand text-white hover:bg-brand/90 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 duration-150"
                    >
                        <Scale size={12} />
                        Finalizar Auditoría
                    </button>
                </div>
            </div>

            {/* Layout Principal de Tres Columnas */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* LADO IZQUIERDO: VISOR INTERACTIVO O PDF (FLEX-1) */}
                <div className="flex-1 h-full border-r border-border-thin bg-bg-deep flex overflow-hidden relative">
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
                                className={`h-full bg-surface-hover/20 border-r border-border-thin flex flex-col shrink-0 relative overflow-hidden ${isDraggingLeft ? 'transition-none' : 'transition-all duration-300'
                                    }`}
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
                                            hasActiveComments = ['titulo', 'programa', 'grupo', 'dominio_linea', 'campos', 'carrera'].some(k => comments[k] && comments[k].length > 0);
                                        } else if (sec.id === 'equipo') {
                                            hasActiveComments = !!(comments.equipo && comments.equipo.length > 0);
                                        } else if (sec.id === 'plan_tecnico') {
                                            hasActiveComments = ['antecedentes', 'justificacion', 'objetivos', 'metodologia'].some(k => comments[k] && comments[k].length > 0);
                                        } else if (sec.id === 'recursos') {
                                            hasActiveComments = !!(comments.presupuesto && comments.presupuesto.length > 0);
                                        } else if (sec.id === 'impacto') {
                                            hasActiveComments = !!(comments.impacto && comments.impacto.length > 0);
                                        } else if (sec.id === 'cronograma') {
                                            hasActiveComments = !!(comments.cronograma && comments.cronograma.length > 0);
                                        } else if (sec.id === 'bibliografia') {
                                            hasActiveComments = !!(comments.bibliografia && comments.bibliografia.length > 0);
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
                                                    <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0 ml-1.5" />
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

                            <InteractiveSections
                                activeSection={activeSection}
                                project={project}
                                investigadores={investigadores}
                                docSnapshot={docSnapshot}
                                isLeftSidebarOpen={isLeftSidebarOpen}
                                setIsLeftSidebarOpen={setIsLeftSidebarOpen}
                                isHoursOk={isHoursOk}
                                teachersWithExceedingHours={teachersWithExceedingHours}
                                getFieldCardClasses={getFieldCardClasses}
                                renderFieldStatusBadge={renderFieldStatusBadge}
                                renderCommentButton={renderCommentButton}
                                setActiveCommentField={setActiveCommentField}
                                setIsRightSidebarOpen={setIsRightSidebarOpen}
                                getSafeArray={getSafeArray}
                            />
                        </div>
                    )}



                    {/* Botón flotante unificado de reapertura del Panel de Secciones (izquierda) si está cerrado */}
                    {!isLeftSidebarOpen && (
                        <div
                            onMouseDown={handleSeccionesButtonDragStart}
                            style={{ 
                                top: `${seccionesButtonTop}px`,
                                left: seccionesButtonLeft !== null ? `${seccionesButtonLeft}px` : '0px',
                            }}
                            className={`fixed z-[60] py-4 px-2.5 w-[36px] bg-surface hover:bg-surface-hover border border-border-thin rounded-full text-text-dim hover:text-text-main flex flex-col items-center gap-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] cursor-grab active:cursor-grabbing select-none active:scale-95 group font-bold ${
                                isDraggingSeccionesButton ? 'transition-none cursor-grabbing border-brand/50 ring-1 ring-brand/20 shadow-[0_8px_24px_rgba(99,102,241,0.18)]' : 'transition-all duration-300'
                            }`}
                            title="Arrastra libremente por la pantalla / Clic para abrir"
                        >
                            <BookOpen size={13} className="text-brand group-hover:scale-110 transition-transform shrink-0" />
                            <span className="[writing-mode:vertical-lr] tracking-widest text-[9px] font-black uppercase text-center cursor-pointer select-none">
                                Secciones
                            </span>
                        </div>
                    )}

                    {/* Botón flotante unificado de reapertura del Panel de Auditoría (derecha) si está cerrado */}
                    {!isRightSidebarOpen && (
                        <div
                            onMouseDown={handleButtonDragStart}
                            style={{ 
                                top: `${auditoriaButtonTop}px`,
                                left: auditoriaButtonLeft !== null ? `${auditoriaButtonLeft}px` : undefined,
                                right: auditoriaButtonLeft !== null ? 'auto' : '0px'
                            }}
                            className={`fixed z-[60] py-4 px-2.5 w-[36px] bg-surface hover:bg-surface-hover border border-border-thin rounded-full text-text-dim hover:text-text-main flex flex-col items-center gap-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] cursor-grab active:cursor-grabbing select-none active:scale-95 group font-bold ${
                                isDraggingButton ? 'transition-none cursor-grabbing border-brand/50 ring-1 ring-brand/20 shadow-[0_8px_24px_rgba(99,102,241,0.18)]' : 'transition-all duration-300'
                            }`}
                            title="Arrastra libremente por la pantalla / Clic para abrir"
                        >
                            <Shield size={13} className="text-brand group-hover:scale-110 transition-transform shrink-0" />
                            <span className="[writing-mode:vertical-lr] tracking-widest text-[9px] font-black uppercase text-center cursor-pointer select-none">
                                Auditoría
                            </span>
                        </div>
                    )}
                </div>

                {/* LADO DERECHO: SIDEBAR AJUSTABLE Y COLAPSABLE DE AUDITORÍA */}
                <ObservationsSidebar
                    isOpen={isRightSidebarOpen}
                    width={rightSidebarWidth}
                    isDragging={isDraggingRight}
                    startDragging={startDraggingRight}
                    toggleOpen={() => {
                        setIsRightSidebarOpen(false);
                        localStorage.setItem('rev_right_sidebar_open', 'false');
                    }}
                    activeCommentField={activeCommentField}
                    setActiveCommentField={setActiveCommentField}
                    comments={comments}
                    contextualInput={contextualInput}
                    setContextualInput={setContextualInput}
                    isListening={isListening}
                    submitting={submitting}
                    editingCommentId={editingCommentId}
                    setEditingCommentId={setEditingCommentId}
                    saveContextualComment={saveContextualComment}
                    handleStartListening={handleStartListening}
                    removeCommentLocal={removeCommentLocal}
                    FIELD_LABELS={FIELD_LABELS}
                />
            </div>

            {/* Modal de Finalización de Auditoría */}
            {isFinalizeModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in">
                    <div className="w-[500px] max-w-[90%] bg-surface border border-border-thin rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] p-5 space-y-4 animate-scale-up font-sans">
                        <div className="flex items-center justify-between border-b border-border-thin/50 pb-3.5">
                            <div className="flex items-center gap-2">
                                <Scale size={16} className="text-brand" />
                                <span className="text-[10px] font-black text-text-main uppercase tracking-widest font-mono">Finalizar Auditoría</span>
                            </div>
                            <button
                                onClick={() => setIsFinalizeModalOpen(false)}
                                className="p-1.5 hover:bg-surface-hover border border-border-thin rounded-lg text-text-dim hover:text-text-main transition-all cursor-pointer"
                                title="Cerrar modal"
                            >
                                <X size={12} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[8px] font-black text-text-dim uppercase tracking-widest block font-mono ml-0.5">Observaciones Generales de la Auditoría</label>
                            <textarea
                                value={generalFeedback}
                                onChange={(e) => setGeneralFeedback(e.target.value)}
                                placeholder="Escriba la síntesis del informe o instrucciones generales de corrección para el docente..."
                                className="w-full h-32 bg-bg-deep border border-border-thin rounded-xl p-3.5 text-xs text-text-main placeholder:text-text-dim/60 outline-none focus:border-brand/45 transition-all resize-none font-sans leading-relaxed custom-scrollbar"
                                disabled={submitting}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-t border-border-thin/50 pt-4">
                            <button
                                onClick={async () => {
                                    await handleAprobar();
                                    setIsFinalizeModalOpen(false);
                                }}
                                disabled={submitting}
                                className="flex items-center justify-center gap-1.5 btn-vercel-primary py-3 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
                            >
                                {submitting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                Aprobar Requisitos
                            </button>

                            <button
                                onClick={async () => {
                                    await handleDevolver();
                                    setIsFinalizeModalOpen(false);
                                }}
                                disabled={submitting}
                                className="flex items-center justify-center gap-1.5 bg-transparent hover:bg-error/10 text-error border border-error/20 hover:border-error/40 rounded-xl py-3 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                            >
                                {submitting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                Devolver Proyecto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

export default RevisionTecnicaPage;
