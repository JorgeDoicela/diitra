import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Shield, BookOpen, Briefcase, Award, Loader, ChevronDown, Check, FileText, DollarSign, Sparkles, Lightbulb } from 'lucide-react';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { useNotifications } from '../../api/NotificationsContext';
import { useConfirm } from '../../api/ConfirmContext';
import { DocumentTemplateRegistry } from '../../core/documents/registry/DocumentTemplateRegistry';

interface CreateProjectModalProps {
    preselectedConvocatoriaId?: number | null;
    onClose: () => void;
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

const formatCurrency = (val: string) => {
    const num = parseFloat(val);
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

    const [isOpenCarrera, setIsOpenCarrera] = useState(false);
    const [isOpenConvocatoria, setIsOpenConvocatoria] = useState(false);

    const carreraRef = useRef<HTMLDivElement>(null);
    const convocatoriaRef = useRef<HTMLDivElement>(null);

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

    // Load draft metadata on mount
    useEffect(() => {
        if (restoreDraftOnOpen) {
            handleRestoreDraft();
            return;
        }

        const metaStr = localStorage.getItem('preproposal_draft_metadata');
        if (metaStr) {
            try {
                setPendingDraft(JSON.parse(metaStr));
                isInitializedRef.current = false;
            } catch (e) {
                console.error("Error reading draft metadata", e);
                isInitializedRef.current = true;
            }
        } else {
            isInitializedRef.current = true;
        }
    }, [restoreDraftOnOpen]);

    // Auto-save draft on state changes
    useEffect(() => {
        if (!isInitializedRef.current) return;

        // Skip the very first save cycle right after a restore to avoid
        // overwriting localStorage with stale empty state before React applies the restored values.
        if (justRestoredRef.current) {
            justRestoredRef.current = false;
            return;
        }

        const hasChanges =
            titulo.trim() !== '' ||
            descripcion.trim() !== '' ||
            presupuestoEstimado.trim() !== '' ||
            (!careerLocked && idCarrera !== 0) ||
            (!preselectedConvocatoriaId && idConvocatoria !== 0);

        if (hasChanges) {
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
                titulo: titulo || 'Postulación sin título',
                timestamp: Date.now()
            };
            localStorage.setItem('preproposal_draft_metadata', JSON.stringify(meta));
        } else {
            localStorage.removeItem('preproposal_form_draft');
            localStorage.removeItem('preproposal_draft_metadata');
        }
    }, [titulo, descripcion, presupuestoEstimado, idCarrera, idConvocatoria, careerLocked, preselectedConvocatoriaId]);

    const handleDiscardDraft = async () => {
        if (await confirm({
            title: "Descartar Borrador",
            message: "¿Está seguro de descartar el borrador guardado? Esta acción no se puede deshacer.",
            confirmText: "Descartar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) {
            clearDraft();
            isInitializedRef.current = true;
        }
    };

    const clearDraft = () => {
        localStorage.removeItem('preproposal_form_draft');
        localStorage.removeItem('preproposal_draft_metadata');
        setPendingDraft(null);
        setIsDraftRestored(false);
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
        const handleClickOutside = (event: MouseEvent) => {
            if (carreraRef.current && !carreraRef.current.contains(event.target as Node)) {
                setIsOpenCarrera(false);
            }
            if (convocatoriaRef.current && !convocatoriaRef.current.contains(event.target as Node)) {
                setIsOpenConvocatoria(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || isCreating) return;
            if (isOpenCarrera) {
                setIsOpenCarrera(false);
                return;
            }
            if (isOpenConvocatoria) {
                setIsOpenConvocatoria(false);
                return;
            }
            handleRequestClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCreating, isOpenCarrera, isOpenConvocatoria]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo.trim()) return setError("El título / tema del proyecto es obligatorio.");
        if (!descripcion.trim()) return setError("La descripción de la prepropuesta es obligatoria.");

        const parsedBudget = parseFloat(presupuestoEstimado);
        if (isNaN(parsedBudget) || parsedBudget <= 0) {
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

            const initialMetadata = isInnovacion ? {
                ...DocumentTemplateRegistry.PROTOCOLO_INNOVACION.schema,
                Uuid: newUuid,
                Titulo: titulo.trim().toUpperCase(),
                IdCarrera: idCarrera,
                IdConvocatoria: idConvocatoria,
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
                IdConvocatoria: idConvocatoria,
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

            addToast(
                isInnovacion ? "Propuesta de Innovación Enviada" : "Prepropuesta de Investigación Enviada",
                isInnovacion 
                    ? "Su propuesta de innovación y transferencia ha sido enviada exitosamente a la Coordinación."
                    : "Su prepropuesta de investigación ha sido registrada y enviada para revisión institucional.",
                "success"
            );

            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                navigate(isInnovacion ? '/innovacion' : '/investigacion/mis-proyectos', { replace: true });
                onClose();
            }, 800);

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
                    <div className="flex items-center gap-3">
                        <div className="text-text-main">
                            <Shield size={20} />
                        </div>
                        <div>
                            <span className="section-label text-text-dim !gap-0">Nueva postulación</span>
                            <h3 className="text-sm font-black text-text-main uppercase tracking-widest leading-none mt-1">Iniciar Nueva Postulación</h3>
                        </div>
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
                                        <div className="w-8 h-8 rounded-lg bg-bg-deep border border-border-thin flex items-center justify-center text-text-main shrink-0">
                                            <FileText size={16} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Borrador detectado</h4>
                                                <span className="badge-vercel badge-vercel-neutral text-[9px] font-mono py-0.5 px-2 leading-none shrink-0">
                                                    No guardado
                                                </span>
                                            </div>
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
                                        onClick={clearDraft}
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
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <Sparkles size={10} className="text-text-dim" />
                                    Modalidad de Postulación Institucional
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalidad('INVESTIGACION')}
                                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2 ${
                                            modalidad === 'INVESTIGACION'
                                                ? 'bg-brand/[0.06] border-brand shadow-[0_0_12px_rgba(0,112,243,0.12)]'
                                                : 'bg-surface border-border-thin hover:border-border-hover hover:bg-surface-hover'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${modalidad === 'INVESTIGACION' ? 'bg-brand text-white' : 'bg-bg-deep text-text-dim'}`}>
                                                    <BookOpen size={14} />
                                                </div>
                                                <span className="text-xs font-bold text-text-main">Investigación</span>
                                            </div>
                                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                                modalidad === 'INVESTIGACION' ? 'bg-brand/20 text-brand' : 'bg-bg-deep text-text-dim'
                                            }`}>
                                                I+D+i
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-text-dim leading-relaxed">
                                            Proyectos científicos, marco teórico, ODS y metodología académica.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setModalidad('INNOVACION')}
                                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2 ${
                                            modalidad === 'INNOVACION'
                                                ? 'bg-amber-500/[0.08] border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                                                : 'bg-surface border-border-thin hover:border-border-hover hover:bg-surface-hover'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${modalidad === 'INNOVACION' ? 'bg-amber-500 text-white' : 'bg-bg-deep text-text-dim'}`}>
                                                    <Lightbulb size={14} />
                                                </div>
                                                <span className="text-xs font-bold text-text-main">Innovación</span>
                                            </div>
                                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                                modalidad === 'INNOVACION' ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400' : 'bg-bg-deep text-text-dim'
                                            }`}>
                                                i+TT
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-text-dim leading-relaxed">
                                            Prototipos, tipo de innovación (producto/proceso) y transferencia ISTPET.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <BookOpen size={10} className="text-text-dim" />
                                    {modalidad === 'INNOVACION' ? 'Tema / Proyecto de Innovación (Mayúsculas)' : 'Tema / Nombre del Proyecto (Mayúsculas)'}
                                </label>
                                <textarea
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder={modalidad === 'INNOVACION'
                                        ? "EJ: SISTEMA AUTOMATIZADO IOT PARA MONITOREO DE CULTIVOS HIDROPÓNICOS Y TRANSFERENCIA TECNOLÓGICA..."
                                        : "EJ: AUTOMATIZACIÓN DEL DEPARTAMENTO DE INVESTIGACIÓN MEDIANTE PLATAFORMA DIGITAL..."
                                    }
                                    className="input-vercel !h-20 !font-bold !text-xs uppercase resize-none !placeholder:text-text-dim/30"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <FileText size={10} className="text-text-dim" />
                                    Descripción / Justificación de la Idea (Prepropuesta)
                                </label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Describa brevemente de qué se trata su propuesta de investigación, la problemática que resuelve y el impacto esperado..."
                                    className="input-vercel !h-24 !text-xs resize-none !placeholder:text-text-dim/30"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <DollarSign size={10} className="text-text-dim" />
                                    Presupuesto Estimado (USD)
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 text-xs font-bold text-text-dim/60 select-none">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={presupuestoEstimado}
                                        onChange={(e) => setPresupuestoEstimado(e.target.value)}
                                        placeholder="15000.00"
                                        className="input-vercel !pl-7 !text-xs !font-bold !placeholder:text-text-dim/30"
                                        required
                                    />
                                </div>

                                {presupuestoEstimado && !isNaN(parseFloat(presupuestoEstimado)) && parseFloat(presupuestoEstimado) > 0 && (
                                    <div className="text-[11px] font-medium text-text-dim/90 ml-1 mt-1.5 p-2 bg-bg-deep/80 border border-border-thin rounded animate-fade-in w-fit">
                                        <span>Valor: {formatCurrency(presupuestoEstimado)} USD</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2" ref={carreraRef}>
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <Briefcase size={10} className="text-text-dim" />
                                    Carrera / Unidad Solicitante
                                </label>
                                {careerLocked ? (
                                    <div className="input-vercel !font-bold !text-xs text-left opacity-80 cursor-not-allowed">
                                        {selectedCarreraName}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpenCarrera(!isOpenCarrera)}
                                            className="input-vercel !font-bold !text-xs text-left cursor-pointer flex items-center justify-between"
                                        >
                                            <span className={idCarrera === 0 ? 'text-text-dim opacity-50' : ''}>
                                                {selectedCarreraName}
                                            </span>
                                            <ChevronDown size={14} className="transition-transform duration-200" style={{ transform: isOpenCarrera ? 'rotate(180deg)' : 'none' }} />
                                        </button>

                                        {isOpenCarrera && (
                                            <div className="absolute z-[120] mt-1 w-full max-h-48 overflow-y-auto border border-border-thin rounded-md shadow-2xl py-1 bg-surface">
                                                {carreras.map(c => {
                                                    const cid = getCarreraId(c);
                                                    const cname = getCarreraName(c);
                                                    return (
                                                        <button
                                                            key={cid}
                                                            type="button"
                                                            onClick={() => {
                                                                setIdCarrera(cid);
                                                                setIsOpenCarrera(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer border-none outline-none ${idCarrera === cid ? 'bg-text-main text-bg-deep font-bold' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}
                                                        >
                                                            <span>{cname}</span>
                                                            {idCarrera === cid && <Check size={12} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2" ref={convocatoriaRef}>
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <Award size={10} className="text-text-dim" />
                                    Convocatoria Vinculada
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => !preselectedConvocatoriaId && setIsOpenConvocatoria(!isOpenConvocatoria)}
                                        disabled={!!preselectedConvocatoriaId}
                                        className="input-vercel !font-bold !text-xs text-left disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-between"
                                    >
                                        <span className={idConvocatoria === 0 ? 'text-text-dim opacity-50' : ''}>
                                            {selectedConvocatoriaLabel}
                                        </span>
                                        {!preselectedConvocatoriaId && (
                                            <ChevronDown size={14} className="transition-transform duration-200" style={{ transform: isOpenConvocatoria ? 'rotate(180deg)' : 'none' }} />
                                        )}
                                    </button>

                                    {isOpenConvocatoria && !preselectedConvocatoriaId && (
                                        <div className="absolute z-[120] mt-1 w-full max-h-48 overflow-y-auto border border-border-thin rounded-md shadow-2xl py-1 bg-surface">
                                            {convocatorias.map(c => {
                                                const coid = getConvocatoriaId(c);
                                                const coname = getConvocatoriaName(c);
                                                return (
                                                    <button
                                                        key={coid}
                                                        type="button"
                                                        onClick={() => {
                                                            setIdConvocatoria(coid);
                                                            setIsOpenConvocatoria(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer border-none outline-none ${idConvocatoria === coid ? 'bg-text-main text-bg-deep font-bold' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}
                                                    >
                                                        <span>{coname}</span>
                                                        {idConvocatoria === coid && <Check size={12} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
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
