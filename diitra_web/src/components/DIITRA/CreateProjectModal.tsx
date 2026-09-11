import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, BookOpen, Lightbulb, Loader, FileText } from 'lucide-react';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { useNotifications } from '../../api/NotificationsContext';
import { useConfirm } from '../../api/ConfirmContext';
import { DocumentTemplateRegistry } from '../../core/documents/registry/DocumentTemplateRegistry';
import { GeistSelect } from '../Common/GeistSelect';

interface CreateProjectModalProps {
    preselectedConvocatoriaId?: number | null;
    onClose: () => void;
    onSuccess?: (targetUrl: string) => void;
    restoreDraftOnOpen?: boolean;
}

const isPastDeadline = (fechaCierre: string) => {
    if (!fechaCierre) return false;
    const deadline = new Date(fechaCierre);
    const now = new Date();
    if (isNaN(deadline.getTime())) return false;
    if (fechaCierre.length <= 10) {
        const [year, month, day] = fechaCierre.split('-').map(Number);
        const localDeadline = new Date(year, month - 1, day, 23, 59, 59, 999);
        return now > localDeadline;
    }
    return now > deadline;
};

const parseCurrencyInput = (val: string | number): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    let s = String(val).trim();
    if (s.includes('.') && s.includes(',')) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else {
            s = s.replace(/,/g, '');
        }
    } else if (s.includes(',')) {
        s = s.replace(',', '.');
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
};

const formatCurrency = (val: string | number) => {
    const num = parseCurrencyInput(val);
    if (isNaN(num) || num <= 0) return '';
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(num);
};

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    preselectedConvocatoriaId,
    onClose,
    onSuccess,
    restoreDraftOnOpen = false
}) => {
    const navigate = useNavigate();
    const { user, isDocente, isAdmin } = useAuth();
    const { addToast } = useNotifications();
    const confirm = useConfirm();

    const [modalidad, setModalidad] = useState<'INVESTIGACION' | 'INNOVACION'>('INVESTIGACION');
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [presupuestoEstimado, setPresupuestoEstimado] = useState<string>('');
    const [idCarrera, setIdCarrera] = useState<number>(0);
    const [idConvocatoria, setIdConvocatoria] = useState<number>(preselectedConvocatoriaId || 0);
    const [careerLocked, setCareerLocked] = useState(false);

    const [carreras, setCarreras] = useState<any[]>([]);
    const [convocatorias, setConvocatorias] = useState<any[]>([]);

    const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [creationStepMsg, setCreationStepMsg] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Draft management states
    const [isDraftRestored, setIsDraftRestored] = useState(false);
    const isInitializedRef = useRef(false);
    const [pendingDraft, setPendingDraft] = useState<{
        titulo: string;
        timestamp: number;
    } | null>(null);

    const getCarreraId = (c: any): number => c.idCarrera ?? c.id_carrera ?? 0;
    const getCarreraName = (c: any): string => c.carrera1 ?? c.nombre_carrera ?? c.carrera ?? 'Sin Nombre';

    const getConvocatoriaId = (c: any): number => c.id_convocatoria ?? c.idConvocatoria ?? 0;
    const getConvocatoriaName = (c: any): string => {
        const code = c.codigo_convocatoria ?? c.codigoConvocatoria ?? '';
        const title = c.titulo ?? '';
        return code ? `${code} - ${title}` : title;
    };

    const justRestoredRef = useRef(false);

    const handleRestoreDraft = () => {
        const draftStr = localStorage.getItem('preproposal_form_draft');
        if (draftStr) {
            try {
                const parsed = JSON.parse(draftStr);
                if (parsed) {
                    if (parsed.modalidad) setModalidad(parsed.modalidad);
                    setTitulo(parsed.titulo || '');
                    setDescripcion(parsed.descripcion || '');
                    setPresupuestoEstimado(parsed.presupuestoEstimado || '');
                    if (!careerLocked && parsed.idCarrera) {
                        setIdCarrera(parsed.idCarrera);
                    }
                    if (!preselectedConvocatoriaId && parsed.idConvocatoria) {
                        setIdConvocatoria(parsed.idConvocatoria);
                    }
                    setIsDraftRestored(true);
                }
            } catch (e) {
                console.error("Error restoring draft", e);
            }
        }
        justRestoredRef.current = true;
        isInitializedRef.current = true;
        setPendingDraft(null);
    };

    // Load draft metadata on mount & purge ghost drafts without content
    useEffect(() => {
        const draftStr = localStorage.getItem('preproposal_form_draft');
        const metaStr = localStorage.getItem('preproposal_draft_metadata');

        if (metaStr && draftStr) {
            try {
                const parsedDraft = JSON.parse(draftStr);
                // Validar que el borrador contenga contenido sustancial (título o descripción)
                if (!parsedDraft.titulo?.trim() && !parsedDraft.descripcion?.trim()) {
                    // Borrador vacío detectado: purgar inmediatamente para evitar inconsistencias
                    localStorage.removeItem('preproposal_form_draft');
                    localStorage.removeItem('preproposal_draft_metadata');
                    setPendingDraft(null);
                    isInitializedRef.current = true;
                } else if (restoreDraftOnOpen) {
                    handleRestoreDraft();
                } else {
                    setPendingDraft(JSON.parse(metaStr));
                    isInitializedRef.current = false;
                }
            } catch (e) {
                console.error("Error reading draft metadata", e);
                localStorage.removeItem('preproposal_form_draft');
                localStorage.removeItem('preproposal_draft_metadata');
                isInitializedRef.current = true;
            }
        } else {
            isInitializedRef.current = true;
        }
    }, [restoreDraftOnOpen]);

    // Auto-save draft on state changes - el último borrador siempre es el que cuenta
    useEffect(() => {
        if (!isInitializedRef.current) return;

        // Skip the very first save cycle right after a restore to avoid
        // overwriting localStorage with stale empty state before React applies the restored values.
        if (justRestoredRef.current) {
            justRestoredRef.current = false;
            return;
        }

        // Solo se considera borrador activo si el docente ha redactado título o descripción
        const hasContent = titulo.trim() !== '' || descripcion.trim() !== '';

        if (hasContent) {
            const draftData = {
                modalidad,
                titulo,
                descripcion,
                presupuestoEstimado,
                idCarrera,
                idConvocatoria
            };

            localStorage.setItem('preproposal_form_draft', JSON.stringify(draftData));

            const meta = {
                titulo: titulo.trim() || 'Postulación sin título',
                timestamp: Date.now()
            };
            localStorage.setItem('preproposal_draft_metadata', JSON.stringify(meta));
        } else {
            localStorage.removeItem('preproposal_form_draft');
            localStorage.removeItem('preproposal_draft_metadata');
        }
    }, [modalidad, titulo, descripcion, presupuestoEstimado, idCarrera, idConvocatoria]);

    const clearDraft = () => {
        localStorage.removeItem('preproposal_form_draft');
        localStorage.removeItem('preproposal_draft_metadata');
        setPendingDraft(null);
        setIsDraftRestored(false);
    };

    const handleDiscardDraft = () => {
        clearDraft();
        // Resetear todos los campos del formulario para garantizar limpieza absoluta
        setTitulo('');
        setDescripcion('');
        setPresupuestoEstimado('');
        if (!preselectedConvocatoriaId) {
            setIdConvocatoria(0);
        }
        setModalidad('INVESTIGACION');
        isInitializedRef.current = true;
    };

    // Tracking inputs for unsaved changes checks on close
    const stateRef = useRef({ titulo, descripcion, presupuestoEstimado, idCarrera, idConvocatoria });
    useEffect(() => {
        stateRef.current = { titulo, descripcion, presupuestoEstimado, idCarrera, idConvocatoria };
    }, [titulo, descripcion, presupuestoEstimado, idCarrera, idConvocatoria]);

    const hasUnsavedChanges = () => {
        const current = stateRef.current;
        return (
            current.titulo.trim() !== '' ||
            current.descripcion.trim() !== '' ||
            current.presupuestoEstimado.trim() !== '' ||
            (!careerLocked && current.idCarrera !== 0) ||
            (!preselectedConvocatoriaId && current.idConvocatoria !== 0)
        );
    };

    const handleRequestClose = async () => {
        if (hasUnsavedChanges()) {
            const confirmed = await confirm({
                title: "Salir del Formulario",
                message: "¿Está seguro de salir? Perderá todos los cambios no guardados en este formulario.",
                confirmText: "Salir",
                cancelText: "Cancelar",
                variant: "warning"
            });
            if (confirmed) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [rConvocatorias, rMiCarrera, rCarreras] = await Promise.all([
                    api.get('/Convocatorias').catch(() => ({ data: [] })),
                    isDocente ? api.get('/catalogs/mi-carrera').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                    api.get('/catalogs/carreras').catch(() => ({ data: [] }))
                ]);

                const allConvs = rConvocatorias.data || [];
                const activeConvs = allConvs.filter((c: any) => {
                    const isBorradorOrAbierta = c.estado === 'Abierta' || (isAdmin && c.estado === 'Borrador');
                    return isBorradorOrAbierta && !isPastDeadline(c.fecha_cierre || c.fechaCierre);
                });

                if (preselectedConvocatoriaId && !activeConvs.some((c: any) => getConvocatoriaId(c) === preselectedConvocatoriaId)) {
                    const preselected = allConvs.find((c: any) => getConvocatoriaId(c) === preselectedConvocatoriaId);
                    if (preselected) {
                        activeConvs.push(preselected);
                    }
                }

                setConvocatorias(activeConvs);

                const linkedCareers = Array.isArray(rMiCarrera.data) ? rMiCarrera.data : [];
                if (isDocente && linkedCareers.length > 0) {
                    setCarreras(linkedCareers);
                    if (linkedCareers.length === 1) {
                        // Solo auto-asignar carrera fija si tiene una sola
                        if (!restoreDraftOnOpen) {
                            setIdCarrera(getCarreraId(linkedCareers[0]));
                        }
                        setCareerLocked(true);
                    } else {
                        // Docente con múltiples carreras: selector desbloqueado
                        setCareerLocked(false);
                        if (!restoreDraftOnOpen && idCarrera === 0) {
                            setIdCarrera(getCarreraId(linkedCareers[0]));
                        }
                    }
                } else {
                    setCarreras(rCarreras.data || []);
                }

                if (preselectedConvocatoriaId) {
                    setIdConvocatoria(preselectedConvocatoriaId);
                }
            } catch (err) {
                console.error("[DIITRA] Error loading catalogs for wizard:", err);
                setError("No se pudieron cargar los catálogos institucionales.");
            } finally {
                setIsLoadingCatalogs(false);
            }
        };
        loadCatalogs();
    }, [preselectedConvocatoriaId, isDocente]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isCreating) {
                handleRequestClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCreating]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo.trim()) return setError("El título / tema del proyecto es obligatorio.");
        if (!descripcion.trim()) return setError("La descripción de la prepropuesta es obligatoria.");

        const parsedBudget = parseCurrencyInput(presupuestoEstimado);
        if (parsedBudget <= 0) {
            return setError("Debe ingresar un presupuesto estimado válido y mayor a cero.");
        }
        if (idCarrera === 0) {
            return setError(carreras.length > 0
                ? "Debe seleccionar una carrera para su postulación."
                : (isDocente
                    ? "No se encontró una carrera vinculada a su perfil docente. Contacte al administrador institucional."
                    : "Debe seleccionar una carrera asociada."));
        }
        if (idConvocatoria === 0) return setError("Debe vincular su propuesta a una convocatoria.");

        const selected = convocatorias.find(c => getConvocatoriaId(c) === idConvocatoria);
        if (selected && isPastDeadline(selected.fecha_cierre || selected.fechaCierre)) {
            return setError("La convocatoria seleccionada ha cerrado debido a que el plazo límite ha vencido.");
        }

        setIsCreating(true);
        setError(null);

        try {
            const isInnovacion = modalidad === 'INNOVACION';
            const templateCode = isInnovacion ? 'PROTOCOLO_INNOVACION' : 'PROTOCOLO_INVESTIGACION';

            setCreationStepMsg(isInnovacion 
                ? "Creando el expediente de innovación y transferencia..."
                : "Creando el expediente digital de investigación...");

            const response = await api.post('/documents/instances', {
                templateCode,
                entityUuid: 'GLOBAL',
                title: titulo.trim().toUpperCase()
            });

            const newUuid = response.data?.uuid;
            if (!newUuid) {
                throw new Error("No se recibió el identificador único del proyecto.");
            }

            setCreationStepMsg(isInnovacion
                ? "Vinculando convocatoria y estructurando secciones de innovación..."
                : "Vinculando convocatoria y estructurando secciones CACES...");

            const selectedConv = convocatorias.find(c => getConvocatoriaId(c) === idConvocatoria);
            const convPeriodoName = selectedConv?.periodo_nombre ?? selectedConv?.periodoNombre ?? selectedConv?.periodo ?? selectedConv?.id_periodo_navigation?.detalle ?? selectedConv?.idPeriodoNavigation?.detalle ?? '';
            const selectedCarreraObj = carreras.find(c => getCarreraId(c) === idCarrera);
            const carreraName = selectedCarreraObj ? getCarreraName(selectedCarreraObj) : '';

            const initialMetadata = isInnovacion ? {
                ...DocumentTemplateRegistry.PROTOCOLO_INNOVACION.schema,
                Uuid: newUuid,
                Titulo: titulo.trim().toUpperCase(),
                IdCarrera: idCarrera,
                Carrera: carreraName,
                IdConvocatoria: idConvocatoria,
                Periodo: convPeriodoName,
                DirectorProyecto: user?.nombre_completo || '',
                DescripcionProyecto: descripcion.trim(),
                DescripcionInnovacion: descripcion.trim(),
                ResumenProyecto: descripcion.trim(),
                CostoTotal: parsedBudget,
                costoTotal: parsedBudget,
                costo_total: parsedBudget,
                PresupuestoEstimado: parsedBudget,
                presupuestoEstimado: parsedBudget,
                presupuesto_estimado: parsedBudget,
                Estado: 'Prepropuesta'
            } : {
                ...DocumentTemplateRegistry.PROTOCOLO_INVESTIGACION.schema,
                Uuid: newUuid,
                Titulo: titulo.trim().toUpperCase(),
                IdCarrera: idCarrera,
                Carrera: carreraName,
                IdConvocatoria: idConvocatoria,
                Periodo: convPeriodoName,
                DirectorProyecto: user?.nombre_completo || '',
                DescripcionProyecto: descripcion.trim(),
                CostoTotal: parsedBudget,
                costoTotal: parsedBudget,
                costo_total: parsedBudget,
                PresupuestoEstimado: parsedBudget,
                presupuestoEstimado: parsedBudget,
                presupuesto_estimado: parsedBudget,
                Estado: 'Prepropuesta'
            };

            await api.patch(`/documents/instances/${newUuid}/metadata`, initialMetadata);

            setCreationStepMsg("Enviando prepropuesta a revisión institucional...");

            clearDraft();

            const targetPath = isInnovacion 
                ? '/innovacion' 
                : (isAdmin ? '/investigacion' : '/investigacion/mis-proyectos');

            const actionLabel = "Ver";

            addToast(
                isInnovacion ? "Propuesta de Innovación Enviada" : "Prepropuesta de Investigación Enviada",
                isInnovacion 
                    ? "Su propuesta fue enviada exitosamente para revisión."
                    : "Su prepropuesta fue registrada y enviada para revisión institucional.",
                "success",
                targetPath,
                undefined,
                actionLabel
            );

            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                if (onSuccess) {
                    onSuccess(targetPath);
                } else {
                    navigate(targetPath, { replace: true });
                    onClose();
                }
            }, 600);

        } catch (err: any) {
            console.error("[DIITRA] Error creating proposal:", err);
            setError(err.response?.data?.message || "Ocurrió un error inesperado al iniciar la postulación.");
            setIsCreating(false);
        }
    };

    const selectedCarrera = carreras.find(c => getCarreraId(c) === idCarrera);
    const selectedCarreraName = selectedCarrera ? getCarreraName(selectedCarrera) : "Seleccione una carrera asociada...";

    const selectedConvocatoria = convocatorias.find(c => getConvocatoriaId(c) === idConvocatoria);
    const selectedConvocatoriaLabel = selectedConvocatoria ? getConvocatoriaName(selectedConvocatoria) : "Seleccione una convocatoria...";
    const isSelectedExpired = selectedConvocatoria && isPastDeadline(selectedConvocatoria.fecha_cierre || selectedConvocatoria.fechaCierre);

    return createPortal(
        <div className="fixed inset-0 z-[110] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                onClick={() => !isCreating && handleRequestClose()}
            />

            <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">

                <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                    <div>
                        <h3 className="text-base font-semibold text-text-main tracking-tight">Iniciar Nueva Postulación</h3>
                    </div>
                    {!isCreating && (
                        <button
                            onClick={handleRequestClose}
                            className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-surface">
                    {isCreating ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-6 animate-fade-in text-center">
                            <div className="w-10 h-10 border-2 border-text-main border-t-transparent rounded-full animate-spin" />
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-text-main uppercase tracking-widest">Creando Proyecto</h4>
                                <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider px-4">{creationStepMsg}</p>
                            </div>
                        </div>
                    ) : isLoadingCatalogs ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-dim font-mono text-[10px] uppercase tracking-widest">
                            <Loader className="animate-spin text-text-main" size={20} />
                            <span>Cargando catálogos de investigación...</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Banner de Recuperación de Borrador */}
                            {pendingDraft && (
                                <div className="border border-border-thin bg-surface-hover rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in mb-6">
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} className="text-text-main shrink-0" />
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Borrador detectado</h4>
                                            <p className="text-xs text-text-dim">
                                                Tienes un borrador sin guardar de esta postulación.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleRestoreDraft}
                                            className="btn-vercel-primary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex-1 sm:flex-initial"
                                        >
                                            Restaurar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDiscardDraft}
                                            className="btn-vercel-secondary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex-1 sm:flex-initial"
                                        >
                                            Descartar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Banner de Borrador Restaurado */}
                            {isDraftRestored && (
                                <div className="border border-border-thin bg-surface-hover rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in mb-6">
                                    <div className="flex items-center gap-3">
                                        <FileText size={16} className="text-text-main shrink-0" />
                                        <p className="text-xs text-text-dim">
                                            <span className="text-text-main font-semibold">Borrador restaurado:</span> Se han recuperado tus datos no guardados localmente.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleDiscardDraft}
                                        className="text-xs font-medium text-brand hover:underline cursor-pointer shrink-0"
                                    >
                                        Descartar borrador
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="badge-vercel-error !rounded-md !p-3 text-[10px] font-black uppercase tracking-wider w-full">
                                    {error}
                                </div>
                            )}

                            {/* Selector de Modalidad: Investigación vs Innovación */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-text-main uppercase tracking-wider">
                                    Modalidad de Postulación Institucional
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalidad('INVESTIGACION')}
                                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                                            modalidad === 'INVESTIGACION'
                                                ? 'bg-surface border-text-main shadow-xs'
                                                : 'bg-surface border-border-thin hover:border-border-hover hover:bg-surface-hover/60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <BookOpen
                                                    size={16}
                                                    className={`transition-colors ${
                                                        modalidad === 'INVESTIGACION' ? 'text-text-main' : 'text-text-dim'
                                                    }`}
                                                />
                                                <span className="text-xs font-semibold text-text-main">Investigación Aplicada</span>
                                            </div>
                                            <span className={`text-[10px] font-mono transition-colors ${
                                                modalidad === 'INVESTIGACION' ? 'text-text-main font-semibold' : 'text-text-dim font-medium'
                                            }`}>
                                                I+D
                                            </span>
                                        </div>
                                        <p className="text-[11.5px] text-text-dim leading-relaxed">
                                            Proyectos con rigor empírico, enfoque en ODS y solución de problemáticas sociales o productivas.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setModalidad('INNOVACION')}
                                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                                            modalidad === 'INNOVACION'
                                                ? 'bg-surface border-text-main shadow-xs'
                                                : 'bg-surface border-border-thin hover:border-border-hover hover:bg-surface-hover/60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <Lightbulb
                                                    size={16}
                                                    className={`transition-colors ${
                                                        modalidad === 'INNOVACION' ? 'text-text-main' : 'text-text-dim'
                                                    }`}
                                                />
                                                <span className="text-xs font-semibold text-text-main">Innovación Tecnológica</span>
                                            </div>
                                            <span className={`text-[10px] font-mono transition-colors ${
                                                modalidad === 'INNOVACION' ? 'text-text-main font-semibold' : 'text-text-dim font-medium'
                                            }`}>
                                                I+D+i / TT
                                            </span>
                                        </div>
                                        <p className="text-[11.5px] text-text-dim leading-relaxed">
                                            Desarrollo de prototipos, software, procesos técnicos o modelos transferibles al sector empresarial.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-text-main uppercase tracking-wider">
                                    Título Preliminar de la Propuesta
                                </label>
                                <textarea
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder={modalidad === 'INNOVACION'
                                        ? "Estructura sugerida: [Acción/Objetivo] + [Tecnología o tema] + [Sector o población beneficiaria]\n\nEj: Diseño e implementación de un sistema IoT para la optimización del consumo energético en talleres automotrices del DMQ"
                                        : "Estructura sugerida: [Acción/Objetivo] + [Tecnología o tema] + [Sector o población beneficiaria]\n\nEj: Estudio empírico y modelo de gestión logística para la reducción de mermas en microempresas del sector textil"
                                    }
                                    className="input-vercel !h-28 !text-xs resize-none placeholder:!text-[10.5px] !placeholder:text-text-dim/50 leading-relaxed font-sans"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-text-main uppercase tracking-wider">
                                    Descripción y Justificación de la Prepropuesta
                                </label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder={`Síntesis inicial de la idea para revisión de pertinencia por la comisión de DIITRA (LOES · CACES).\n\n1. Problema identificado:\n(Describa la necesidad, deficiencia o problemática concreta que busca atender)\n\n2. Solución propuesta u objetivo preliminar:\n(Qué se propone investigar, desarrollar o implementar tecnológicamente)\n\n3. Impacto y beneficiarios:\n(Estudiantes, comunidad, sector productivo o institución)`}
                                    className="input-vercel !h-48 !text-xs resize-none placeholder:!text-[10.5px] !placeholder:text-text-dim/50 leading-relaxed font-sans"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-text-main uppercase tracking-wider">
                                    Presupuesto Referencial Estimado (USD)
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 text-xs font-bold text-text-dim/60 select-none">$</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={presupuestoEstimado}
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => {
                                            if (
                                                ['Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'].includes(e.key) ||
                                                e.ctrlKey || e.metaKey
                                            ) {
                                                return;
                                            }
                                            if (!/^[0-9.,]$/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onPaste={(e) => {
                                            const pasteData = e.clipboardData.getData('text');
                                            if (/[^0-9.,]/.test(pasteData)) {
                                                e.preventDefault();
                                                const cleaned = pasteData.replace(/[^0-9.,]/g, '');
                                                if (cleaned) {
                                                    const input = e.currentTarget;
                                                    const start = input.selectionStart || 0;
                                                    const end = input.selectionEnd || 0;
                                                    const nextVal = presupuestoEstimado.slice(0, start) + cleaned + presupuestoEstimado.slice(end);
                                                    setPresupuestoEstimado(nextVal.replace(/([.,]){2,}/g, '$1'));
                                                }
                                            }
                                        }}
                                        onChange={(e) => {
                                            const cleaned = e.target.value.replace(/[^0-9.,]/g, '').replace(/([.,]){2,}/g, '$1');
                                            setPresupuestoEstimado(cleaned);
                                        }}
                                        placeholder="500.00"
                                        className="input-vercel !pl-7 !text-xs !font-bold !placeholder:text-text-dim/40"
                                        required
                                    />
                                </div>

                                {presupuestoEstimado && parseCurrencyInput(presupuestoEstimado) > 0 && (
                                    <div className="text-[11px] font-medium text-text-dim/90 ml-1 mt-1 p-2 bg-surface-hover/80 border border-border-thin rounded-md animate-fade-in w-fit">
                                        <span>Valor referencial: {formatCurrency(presupuestoEstimado)} USD</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-text-main uppercase tracking-wider">
                                    Carrera / Unidad Académica Solicitante
                                </label>
                                <GeistSelect
                                    value={idCarrera || ''}
                                    onChange={(val) => setIdCarrera(Number(val))}
                                    placeholder="Seleccione la carrera asociada..."
                                    disabled={careerLocked}
                                    options={carreras.map(c => ({
                                        value: getCarreraId(c),
                                        label: getCarreraName(c)
                                    }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-text-main uppercase tracking-wider">
                                    Convocatoria Vinculada
                                </label>
                                <GeistSelect
                                    value={idConvocatoria || ''}
                                    onChange={(val) => setIdConvocatoria(Number(val))}
                                    placeholder="Seleccione una convocatoria..."
                                    disabled={!!preselectedConvocatoriaId}
                                    options={convocatorias.map(c => ({
                                        value: getConvocatoriaId(c),
                                        label: getConvocatoriaName(c)
                                    }))}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleRequestClose}
                                    className="btn-vercel-secondary flex-1 py-3"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!!isSelectedExpired}
                                    className="btn-vercel-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSelectedExpired ? "Convocatoria Cerrada" : "Enviar Prepropuesta"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
