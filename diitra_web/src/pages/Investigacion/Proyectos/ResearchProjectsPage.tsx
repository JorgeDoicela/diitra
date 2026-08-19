import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/Common/PageHeader';
import {
    ClipboardList, Plus, ArrowRight, Calendar, AlertCircle,
    Loader2, Search, BarChart3, Zap, Target, BookOpen, Trash2, User, Award, Pin
} from 'lucide-react';
import api from '../../../api/axios_config';
import { CreateProjectModal } from '../../../components/DIITRA/CreateProjectModal';
import DocumentTray from '../../../components/DIITRA/DocumentTray';
import { buildWorkspacePath } from '../../../core/documents/templateUrl';
import { useWorkflowStates } from '../../../hooks/useWorkflowStates';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';
import { useProjectPreferences } from './hooks/useProjectPreferences';

export interface ProyectoResumen {
    uuid: string;
    codigo_institucional?: string;
    titulo: string;
    estado: string;
    linea_investigacion?: string;
    tipo_investigacion?: string;
    template_code?: string;
    templateCode?: string;
    presupuesto_total?: number;
    presupuesto_ejecutado?: number;
    puntaje_evaluacion?: number;
    fecha_registro?: string;
    fecha_modificacion?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    tiempo_ejecucion?: string;
    convocatoria_titulo?: string;
    rol_en_proyecto?: string;
    total_investigadores: number;
    total_productos: number;
    total_informes: number;
    informes_aprobados: number;
    trl_actual?: number;
    trl_meta?: number;
    director_nombre?: string;
    carrera?: string;
}

const formatNombre = (name?: string) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map(w => ['de', 'la', 'del', 'los', 'las', 'y'].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

const ResearchProjectsPage = () => {
    const { states, getEstadoConfig } = useWorkflowStates();
    const { addToast } = useNotifications();
    const confirm = useConfirm();
    const [showWizard, setShowWizard] = useState(false);
    
    const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    
    const { recentVisitsMap, togglePin, isPinned } = useProjectPreferences();

    const [filterEstado, setFilterEstado] = useState<string>('todos');
    const [filterLinea, setFilterLinea] = useState<string>('todas');
    const [filterConvocatoria, setFilterConvocatoria] = useState<string>('todas');
    const [sortBy, setSortBy] = useState<string>('mi_actividad');
    
    const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
    const [deletingTitle, setDeletingTitle] = useState<string>('');
    const [deletionError, setDeletionError] = useState<string | null>(null);
    const [rejectingProject, setRejectingProject] = useState<ProyectoResumen | null>(null);
    const [rejectObservation, setRejectObservation] = useState('');
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const lastFetchRef = useRef<number>(0);

    const loadProjects = async (isManual = false, isBackground = false) => {
        if (isBackground) {
            // Recarga silenciosa en segundo plano
        } else if (isManual) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);
        try {
            const res = await api.get('/projects');
            setProyectos(res.data || []);
            lastFetchRef.current = Date.now();
        } catch (err: any) {
            console.error('[DIITRA Admin] Error al cargar proyectos:', err);
            if (!isBackground) {
                setError('No se pudieron obtener los proyectos registrados de la base de datos.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        const handleFocus = () => {
            if (Date.now() - lastFetchRef.current > 30000) {
                loadProjects(false, true);
            }
        };
        const handleProjectsChanged = () => {
            loadProjects(false, true);
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('diitra-projects-changed', handleProjectsChanged);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('diitra-projects-changed', handleProjectsChanged);
        };
    }, []);

    // Sondeo periódico (polling) de respaldo de 60 segundos si la pestaña está visible
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible' && Date.now() - lastFetchRef.current > 30000) {
                loadProjects(false, true);
            }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const lineasDisponibles = useMemo(() => {
        return Array.from(
            new Set(proyectos.map(p => p.linea_investigacion).filter(Boolean))
        ) as string[];
    }, [proyectos]);

    const convocatoriasDisponibles = useMemo(() => {
        return Array.from(
            new Set(proyectos.map(p => p.convocatoria_titulo).filter(Boolean))
        ) as string[];
    }, [proyectos]);

    const filteredProjects = useMemo(() => {
        return proyectos
            .filter(p => {
                // Desacoplamiento estricto: Solo proyectos de Investigación I+D+i
                const isInnovacion = (p.template_code || (p as any).templateCode) === 'PROTOCOLO_INNOVACION' || ((p as any).tipo_investigacion || '').toUpperCase() === 'INNOVACION';
                if (isInnovacion) return false;

                const query = search.toLowerCase();
                const matchSearch = 
                    (p.titulo || '').toLowerCase().includes(query) ||
                    (p.codigo_institucional || '').toLowerCase().includes(query) ||
                    (p.director_nombre || '').toLowerCase().includes(query) ||
                    (p.linea_investigacion || '').toLowerCase().includes(query) ||
                    (p.convocatoria_titulo || '').toLowerCase().includes(query) ||
                    (p.carrera || '').toLowerCase().includes(query);

                const matchEstado = filterEstado === 'todos' || p.estado === filterEstado;
                const matchLinea = filterLinea === 'todas' || p.linea_investigacion === filterLinea;
                const matchConvocatoria = filterConvocatoria === 'todas' || p.convocatoria_titulo === filterConvocatoria;

                return matchSearch && matchEstado && matchLinea && matchConvocatoria;
            })
            .sort((a, b) => {
                if (sortBy === 'mi_actividad') {
                    const aPinned = isPinned(a.uuid);
                    const bPinned = isPinned(b.uuid);
                    if (aPinned && !bPinned) return -1;
                    if (!aPinned && bPinned) return 1;

                    const aVisit = recentVisitsMap.get(a.uuid) || 0;
                    const bVisit = recentVisitsMap.get(b.uuid) || 0;
                    if (aVisit !== bVisit) {
                        return bVisit - aVisit;
                    }

                    const dateA = a.fecha_modificacion || a.fecha_registro || '';
                    const dateB = b.fecha_modificacion || b.fecha_registro || '';
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                }
                if (sortBy === 'accion_requerida') {
                    const actionPriority: Record<string, number> = {
                        'Enviado': 1,
                        'Revisión Técnica': 2,
                        'En Corrección': 3,
                        'Prepropuesta': 4,
                        'En Dictamen': 5,
                        'Pendiente Firma': 6,
                        'Borrador': 7,
                        'Aprobado': 8,
                        'En Ejecución': 9,
                        'Finalizado': 10,
                        'Rechazado': 11
                    };
                    const pA = actionPriority[a.estado] || 50;
                    const pB = actionPriority[b.estado] || 50;
                    if (pA !== pB) return pA - pB;

                    const dateA = a.fecha_modificacion || a.fecha_registro || '';
                    const dateB = b.fecha_modificacion || b.fecha_registro || '';
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                }
                if (sortBy === 'recientes') {
                    const dateA = a.fecha_modificacion || a.fecha_registro || '';
                    const dateB = b.fecha_modificacion || b.fecha_registro || '';
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                }
                if (sortBy === 'antiguos') {
                    const dateA = a.fecha_modificacion || a.fecha_registro || '';
                    const dateB = b.fecha_modificacion || b.fecha_registro || '';
                    return new Date(dateA).getTime() - new Date(dateB).getTime();
                }
                if (sortBy === 'titulo') {
                    return (a.titulo || '').localeCompare(b.titulo || '');
                }
                if (sortBy === 'presupuesto') {
                    return (b.presupuesto_total || 0) - (a.presupuesto_total || 0);
                }
                return 0;
            });
    }, [proyectos, search, filterEstado, filterLinea, filterConvocatoria, sortBy, isPinned, recentVisitsMap]);

    const confirmarEliminar = (uuid: string, titulo: string) => {
        setDeletingUuid(uuid);
        setDeletingTitle(titulo || 'PROYECTO SIN TÍTULO');
        setDeletionError(null);
    };

    const ejecutarEliminacion = async () => {
        if (!deletingUuid) return;
        const projectUuid = deletingUuid;
        const projectTitle = deletingTitle;
        try {
            setDeletionError(null);
            await api.delete(`/projects/${projectUuid}`);
            setProyectos(prev => prev.filter(p => p.uuid !== projectUuid));
            setDeletingUuid(null);
            setDeletingTitle('');
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            addToast(
                "Propuesta Eliminada",
                `La propuesta "${projectTitle}" se envió a la papelera de reciclaje.`,
                "success",
                undefined,
                async () => {
                    try {
                        await api.post(`/recyclebin/restore/project/${projectUuid}`);
                        addToast("Acción Revertida", "La propuesta de investigación ha sido restaurada con éxito.", "success");
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                        loadProjects(true);
                    } catch (err: any) {
                        console.error("[Undo Delete] Failed:", err);
                        addToast("Error al Restaurar", err.response?.data?.message || "No se pudo restaurar la propuesta.", "error");
                    }
                }
            );
        } catch (err: any) {
            console.error('[DIITRA Admin] Error al eliminar borrador:', err);
            setDeletionError(err.response?.data?.message || 'No se pudo eliminar el borrador del proyecto.');
        }
    };

    const handleAprobarIdea = async (project: ProyectoResumen) => {
        if (!await confirm({
            title: "Aprobar Prepropuesta",
            message: `¿Está seguro de aprobar la idea del proyecto "${project.titulo}"? Esto habilitará al docente para iniciar la formulación completa.`,
            confirmText: "Aprobar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;

        try {
            await api.post(`/projects/${project.uuid}/transition?newState=Borrador&observation=${encodeURIComponent("Idea de proyecto aprobada por Dirección de Investigación")}`);
            addToast(
                "Idea Aprobada",
                "La prepropuesta ha sido aprobada con éxito. Se ha notificado al docente.",
                "success",
                undefined,
                async () => {
                    try {
                        await api.post(`/projects/${project.uuid}/transition?newState=Prepropuesta&observation=${encodeURIComponent("Reversión (Undo): Cancelación de la aprobación de la prepropuesta.")}`);
                        addToast("Acción Revertida", "La aprobación ha sido cancelada. Proyecto en estado: Prepropuesta", "info");
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                        loadProjects();
                    } catch (err: any) {
                        console.error("[Undo Approval] Failed:", err);
                        addToast("Error al Revertir", err.response?.data?.error || "No se pudo deshacer la aprobación de la prepropuesta.", "error");
                    }
                }
            );
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            loadProjects();
        } catch (e: any) {
            console.error("Error al aprobar prepropuesta", e);
            addToast("Error", e.response?.data?.message || "Ocurrió un error al intentar aprobar la prepropuesta.", "error");
        }
    };

    const handleRechazarIdeaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectObservation.trim() || !rejectingProject) return;
        setIsSubmittingReview(true);
        setReviewError(null);
        try {
            const projectUuid = rejectingProject.uuid;
            await api.post(`/projects/${projectUuid}/transition?newState=Prepropuesta%20Rechazada&observation=${encodeURIComponent(rejectObservation.trim())}`);
            addToast(
                "Prepropuesta Devuelta",
                "La prepropuesta ha sido devuelta al docente con sus observaciones.",
                "success",
                undefined,
                async () => {
                    try {
                        await api.post(`/projects/${projectUuid}/transition?newState=Prepropuesta&observation=${encodeURIComponent("Reversión (Undo): Cancelación de la devolución de la prepropuesta.")}`);
                        addToast("Acción Revertida", "La devolución ha sido cancelada. Proyecto en estado: Prepropuesta", "info");
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                        loadProjects();
                    } catch (err: any) {
                        console.error("[Undo Return] Failed:", err);
                        addToast("Error al Revertir", err.response?.data?.error || "No se pudo deshacer la devolución de la prepropuesta.", "error");
                    }
                }
            );
            setRejectingProject(null);
            setRejectObservation('');
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            loadProjects();
        } catch (e: any) {
            console.error("Error al rechazar prepropuesta", e);
            setReviewError(e.response?.data?.message || "Ocurrió un error al intentar rechazar la prepropuesta.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const hasActiveFilters = search !== '' || filterEstado !== 'todos' || filterLinea !== 'todas' || filterConvocatoria !== 'todas';

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto space-y-10">
            <PageHeader
                kicker="Revisión Institucional de Proyectos"
                icon={ClipboardList}
                title="Supervisión de Investigaciones"
                description={
                    <span className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1">
                        <span>
                            Administre y califique los proyectos de investigación registrados en el sistema, supervise su presupuesto y valide sus productos.
                        </span>
                        {refreshing && (
                            <span className="flex items-center gap-1 text-brand text-[10px] uppercase tracking-wider font-mono animate-pulse shrink-0">
                                <Loader2 className="animate-spin" size={10} />
                                Sincronizando...
                            </span>
                        )}
                    </span>
                }
            >
                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                    <Link
                        to="/investigacion/adopcion"
                        className="btn-vercel-secondary h-10 px-4 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold"
                        title="Adoptar proyectos de investigación inconclusos"
                    >
                        <Award size={14} />
                        <span>Adopción</span>
                    </Link>
                    <button
                        onClick={() => setShowWizard(true)}
                        className="btn-vercel-primary h-10 px-4 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold"
                    >
                        <Plus size={14} strokeWidth={3} />
                        Nueva Postulación
                    </button>
                </div>
            </PageHeader>

            {error && (
                <div className="badge-vercel-error !rounded-xl !p-4 mb-6 w-full text-sm flex items-center gap-3">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* ── SECCIÓN DE FILTROS ── */}
            {!error && !loading && (
                <div className="flex flex-col gap-3 mb-8 animate-fade-up [animation-delay:50ms] bg-surface p-4 rounded-xl border border-border-thin shadow-2xs">
                    <div className="flex flex-col lg:flex-row gap-2.5">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por título, código, director, carrera o convocatoria..."
                                className="input-vercel !pl-10 !rounded-lg !py-2 !text-xs !placeholder:text-text-dim w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="input-vercel !rounded-lg !py-2 !text-xs min-w-[160px] cursor-pointer"
                            >
                                <option value="mi_actividad">Mi actividad reciente</option>
                                <option value="accion_requerida">Requieren atención</option>
                                <option value="recientes">Modificados recientemente</option>
                                <option value="antiguos">Más antiguos</option>
                                <option value="titulo">Título (A-Z)</option>
                                <option value="presupuesto">Presupuesto mayor</option>
                            </select>
                            {hasActiveFilters && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setFilterEstado('todos');
                                        setFilterLinea('todas');
                                        setFilterConvocatoria('todas');
                                        setSortBy('mi_actividad');
                                    }}
                                    className="btn-vercel-secondary !py-2 !px-3 !rounded-lg !text-xs whitespace-nowrap"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border-thin">
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider pl-0.5">Estado</label>
                            <select
                                value={filterEstado}
                                onChange={e => setFilterEstado(e.target.value)}
                                className="input-vercel !rounded-lg !py-1.5 !text-xs w-full cursor-pointer"
                            >
                                <option value="todos">Todos los estados</option>
                                {states.map(s => (
                                    <option key={s.estado} value={s.estado}>{s.etiqueta}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider pl-0.5">Línea de Investigación</label>
                            <select
                                value={filterLinea}
                                onChange={e => setFilterLinea(e.target.value)}
                                className="input-vercel !rounded-lg !py-1.5 !text-xs w-full cursor-pointer"
                            >
                                <option value="todas">Todas las líneas</option>
                                {lineasDisponibles.map(linea => (
                                    <option key={linea} value={linea}>{linea}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider pl-0.5">Convocatoria</label>
                            <select
                                value={filterConvocatoria}
                                onChange={e => setFilterConvocatoria(e.target.value)}
                                className="input-vercel !rounded-lg !py-1.5 !text-xs w-full cursor-pointer"
                            >
                                <option value="todas">Todas las convocatorias</option>
                                {convocatoriasDisponibles.map(conv => (
                                    <option key={conv} value={conv}>{conv}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* ── LISTADO O SKELETON ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-text-dim" size={32} />
                </div>
            ) : !error && filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
                    <div className="icon-circle !p-4 bg-surface mb-6">
                        <Target size={28} className="text-text-dim" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-main tracking-tight mb-2">
                        {hasActiveFilters ? 'Sin resultados' : 'Aún no hay proyectos registrados'}
                    </h3>
                    <p className="text-sm text-text-dim max-w-xs mb-6">
                        {hasActiveFilters
                            ? 'Prueba modificando los filtros de búsqueda.'
                            : 'Utilice el botón de nueva postulación para ingresar una propuesta.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-up [animation-delay:100ms]">
                    {filteredProjects.map((p) => {
                        const cfg = getEstadoConfig(p.estado);
                        const presupuestoPorc = p.presupuesto_total && p.presupuesto_ejecutado
                            ? Math.min(100, (p.presupuesto_ejecutado / p.presupuesto_total) * 100)
                            : 0;

                        return (
                            <div
                                key={p.uuid}
                                className="bento-card group relative p-6 overflow-hidden flex flex-col justify-between"
                            >
                                <Link
                                    to={buildWorkspacePath('PROTOCOLO_INVESTIGACION', p.uuid, '', '/investigacion')}
                                    className="absolute inset-0 z-10"
                                />
                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-subtle rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="space-y-3.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            {p.codigo_institucional && (
                                                <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-1 font-mono">
                                                    {p.codigo_institucional}
                                                </p>
                                            )}
                                            <h3 className="font-semibold text-text-main text-sm leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                                                {p.titulo?.trim() || '(Sin título)'}
                                            </h3>
                                            {p.director_nombre && (
                                                <p className="text-[11px] text-text-dim font-medium truncate mt-1.5 flex items-center gap-1">
                                                    <User size={11} className="shrink-0 opacity-70" />
                                                    <span>Director: <strong className="text-text-main font-semibold">{formatNombre(p.director_nombre)}</strong></span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 ml-1 mt-0.5 relative z-20">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    togglePin(p.uuid);
                                                }}
                                                className={`p-1.5 rounded-lg transition-colors ${
                                                    isPinned(p.uuid)
                                                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                                        : 'hover:bg-surface-hover text-text-dim hover:text-amber-400'
                                                }`}
                                                title={isPinned(p.uuid) ? 'Desfijar de accesos prioritarios' : 'Fijar en accesos prioritarios'}
                                            >
                                                <Pin size={13} className={isPinned(p.uuid) ? 'fill-amber-400 text-amber-400' : ''} />
                                            </button>
                                            {(p.estado === 'Borrador' || p.estado === 'En Corrección' || p.estado === 'Prepropuesta' || p.estado === 'Prepropuesta Rechazada') && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmarEliminar(p.uuid, p.titulo);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-error-subtle text-text-dim hover:text-error transition-colors"
                                                    title="Eliminar propuesta"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                            <ArrowRight
                                                size={14}
                                                className="text-text-dim group-hover:text-brand group-hover:translate-x-1 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Estado y Línea de Investigación */}
                                    <div className="flex items-center flex-wrap gap-2 pt-0.5">
                                        <span className={`badge-vercel ${cfg.badge} text-[10px] !py-0.5 !px-2 font-medium`} style={cfg.style}>
                                            <span className={`dot ${cfg.dot}`} style={cfg.dotStyle} />
                                            {cfg.label}
                                        </span>
                                        {p.linea_investigacion && (
                                            <span className="text-[10px] text-text-dim truncate max-w-[180px] flex items-center gap-1" title={p.linea_investigacion}>
                                                <BookOpen size={10} className="shrink-0 opacity-70" />
                                                <span className="truncate">{p.linea_investigacion}</span>
                                            </span>
                                        )}
                                    </div>

                                    {p.estado === 'Prepropuesta' && (
                                        <div className="flex gap-2 pt-1 relative z-20" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleAprobarIdea(p)}
                                                className="btn-vercel-primary !py-1 !px-2.5 !text-[10px] font-bold uppercase tracking-wider bg-brand text-white border-brand hover:bg-transparent hover:text-brand"
                                            >
                                                Aprobar Idea
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRejectingProject(p);
                                                    setRejectObservation('');
                                                    setReviewError(null);
                                                }}
                                                className="btn-vercel-secondary !py-1 !px-2.5 !text-[10px] font-bold uppercase tracking-wider hover:bg-error/10 hover:text-error hover:border-error/30"
                                            >
                                                Devolver
                                            </button>
                                        </div>
                                    )}

                                    {/* Métricas Integradas en una Sola Barra Limpia */}
                                    <div className="flex items-center justify-between py-1.5 px-3 bg-surface/50 rounded-lg border border-border-thin text-[11px] text-text-dim">
                                        <span className="flex items-center gap-1 font-medium">
                                            <span className="font-semibold text-text-main font-mono">{p.total_investigadores}</span>
                                            <span className="text-[10px]">invest.</span>
                                        </span>
                                        <span className="text-border-thin">·</span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <span className="font-semibold text-text-main font-mono">{p.total_productos}</span>
                                            <span className="text-[10px]">prod.</span>
                                        </span>
                                        <span className="text-border-thin">·</span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <span className="font-semibold text-text-main font-mono">{p.informes_aprobados}/{p.total_informes}</span>
                                            <span className="text-[10px]">informes</span>
                                        </span>
                                    </div>

                                    {p.presupuesto_total !== undefined && p.presupuesto_total > 0 && (
                                        <div className="space-y-1 pt-1">
                                            <div className="flex justify-between text-[10px] font-mono text-text-dim">
                                                <span>Presupuesto</span>
                                                <span className="text-text-main font-medium">
                                                    ${(p.presupuesto_ejecutado ?? 0).toLocaleString('es-EC')} / ${(p.presupuesto_total).toLocaleString('es-EC')}
                                                    <span className="text-text-dim ml-1">({presupuestoPorc.toFixed(0)}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full h-1 bg-border-thin rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-brand rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, presupuestoPorc)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-border-thin mt-4 text-[10px] text-text-dim">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={10} />
                                        <span>
                                            {p.fecha_modificacion
                                                ? new Date(p.fecha_modificacion).toLocaleDateString('es-EC')
                                                : p.fecha_registro
                                                ? new Date(p.fecha_registro).toLocaleDateString('es-EC')
                                                : '—'}
                                        </span>
                                    </div>
                                    {p.trl_actual != null && (
                                        <div className="flex items-center gap-1">
                                            <Zap size={10} className="text-warning" />
                                            <span className="font-mono font-medium">TRL {p.trl_actual}/{p.trl_meta ?? '—'}</span>
                                        </div>
                                    )}
                                    {p.puntaje_evaluacion != null && (
                                        <div className="flex items-center gap-1">
                                            <BarChart3 size={10} className="text-success" />
                                            <span className="text-success font-bold font-mono">{p.puntaje_evaluacion}/100</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── REGISTRO DOCUMENTAL COMPLETO ── */}
            <section className="space-y-6 animate-fade-up [animation-delay:200ms] border-t border-border-thin pt-8">
                <div>
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-3">
                        Documentos Generados
                    </h3>
                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">
                        Historial inmutable de resoluciones, contratos y actas de acreditación firmadas con PAdES.
                    </p>
                </div>

                <div className="bg-surface rounded-2xl border border-border-thin overflow-hidden shadow-sm">
                    <DocumentTray
                        entityUuid="GLOBAL"
                        title="Bandeja de Firma y Registro Documental Institucional"
                    />
                </div>
            </section>

            {showWizard && <CreateProjectModal onClose={() => setShowWizard(false)} />}

            {/* Modal de confirmación de borrado */}
            {deletingUuid && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-card animate-fade-up">
                        <div className="modal-body">
                            <div className="flex items-start gap-4">
                                <div className="icon-circle-error !p-3 shrink-0">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-text-main text-base">¿Eliminar propuesta de investigación?</h4>
                                    <p className="text-text-dim text-xs leading-relaxed">
                                        Esta acción enviará la prepropuesta o borrador <strong className="text-text-main">"{deletingTitle}"</strong> a la papelera de reciclaje, donde se conservará por 30 días antes de eliminarse permanentemente de forma automática.
                                    </p>
                                    {deletionError && (
                                        <div className="badge-vercel-error !rounded-lg !p-3 text-[11px] leading-relaxed w-full">
                                            {deletionError}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => {
                                    setDeletingUuid(null);
                                    setDeletingTitle('');
                                    setDeletionError(null);
                                }}
                                className="btn-vercel-secondary py-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={ejecutarEliminacion}
                                className="btn-brand !bg-error !border-error hover:!text-error hover:!bg-transparent py-2"
                            >
                                Confirmar y Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de confirmación de rechazo de prepropuesta */}
            {rejectingProject && (
                <div className="modal-overlay animate-fade-in">
                    <form onSubmit={handleRechazarIdeaSubmit} className="modal-card animate-fade-up">
                        <div className="modal-body">
                            <div className="flex items-start gap-4">
                                <div className="icon-circle-error !p-3 shrink-0">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="space-y-3 flex-1">
                                    <h4 className="font-bold text-text-main text-base">Rechazar / Devolver Prepropuesta</h4>
                                    <p className="text-text-dim text-xs leading-relaxed">
                                        Indique detalladamente las observaciones o correcciones requeridas para el tema <strong className="text-text-main">"{rejectingProject.titulo}"</strong>. El docente recibirá esta notificación para poder realizar las correcciones respectivas.
                                    </p>
                                    <textarea
                                        value={rejectObservation}
                                        onChange={(e) => setRejectObservation(e.target.value)}
                                        placeholder="Ingrese aquí las observaciones detalladas..."
                                        className="input-vercel !h-28 !text-xs resize-none w-full"
                                        required
                                    />
                                    {reviewError && (
                                        <div className="badge-vercel-error !rounded-lg !p-3 text-[11px] leading-relaxed w-full">
                                            {reviewError}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={() => {
                                    setRejectingProject(null);
                                    setRejectObservation('');
                                    setReviewError(null);
                                }}
                                className="btn-vercel-secondary py-2"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmittingReview}
                                className="btn-brand !bg-error !border-error hover:!text-error hover:!bg-transparent py-2"
                            >
                                {isSubmittingReview ? "Enviando..." : "Confirmar Devolución"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
};

export default ResearchProjectsPage;
