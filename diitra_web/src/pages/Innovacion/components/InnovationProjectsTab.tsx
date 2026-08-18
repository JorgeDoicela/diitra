import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
    Search, 
    Plus, 
    ArrowRight, 
    User, 
    Sparkles, 
    CheckCircle2, 
    RotateCcw,
    Layers,
    DollarSign,
    Loader2,
    Target,
    Pin
} from 'lucide-react';
import api from '../../../api/axios_config';
import { useAuth } from '../../../api/AuthContext';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';
import { buildWorkspacePath } from '../../../core/documents/templateUrl';
import { useWorkflowStates } from '../../../hooks/useWorkflowStates';
import { useProjectPreferences } from '../../Investigacion/Proyectos/hooks/useProjectPreferences';

export interface ProyectoInnovacionResumen {
    id_proyecto: number;
    uuid: string;
    codigo_institucional?: string;
    titulo: string;
    estado: string;
    linea_investigacion?: string;
    tipo_investigacion?: string;
    carrera?: string;
    presupuesto_total?: number;
    presupuesto_ejecutado?: number;
    fecha_registro?: string;
    fecha_modificacion?: string;
    convocatoria_titulo?: string;
    total_investigadores: number;
    total_productos: number;
    total_informes: number;
    informes_aprobados: number;
    trl_actual?: number;
    trl_meta?: number;
    director_nombre?: string;
    template_code?: string;
}

interface Props {
    onCountChange?: (count: number) => void;
}

export const InnovationProjectsTab: React.FC<Props> = ({ onCountChange }) => {
    const { isAdmin } = useAuth();
    const { addToast } = useNotifications();
    const confirm = useConfirm();
    const { getEstadoConfig } = useWorkflowStates();

    const [proyectos, setProyectos] = useState<ProyectoInnovacionResumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [carreraFilter, setCarreraFilter] = useState('todas');
    const [sortBy, setSortBy] = useState<string>('mi_actividad');
    const [processingUuid, setProcessingUuid] = useState<string | null>(null);

    const { recentVisitsMap, togglePin, isPinned } = useProjectPreferences();

    const loadProjects = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/projects');
            const allProjects: any[] = res.data || [];
            
            // Filtrar exclusivamente proyectos de Innovación (PROTOCOLO_INNOVACION)
            const innovacionProjects = allProjects.filter((p: any) => {
                const code = p.template_code || p.templateCode || '';
                const tipo = (p.tipo_investigacion || p.tipoInvestigacion || '').toUpperCase();
                return code === 'PROTOCOLO_INNOVACION' || tipo === 'INNOVACION';
            }).map((p: any) => ({
                id_proyecto: p.id_proyecto ?? p.idProyecto,
                uuid: p.uuid,
                codigo_institucional: p.codigo_institucional ?? p.codigoInstitucional,
                titulo: p.titulo,
                estado: p.estado,
                linea_investigacion: p.linea_investigacion ?? p.lineaInvestigacion,
                tipo_investigacion: p.tipo_investigacion ?? p.tipoInvestigacion,
                carrera: p.carrera,
                presupuesto_total: p.presupuesto_total ?? p.presupuestoTotal,
                presupuesto_ejecutado: p.presupuesto_ejecutado ?? p.presupuestoEjecutado,
                fecha_registro: p.fecha_registro ?? p.fechaRegistro,
                fecha_modificacion: p.fecha_modificacion ?? p.fechaModificacion,
                convocatoria_titulo: p.convocatoria_titulo ?? p.convocatoriaTitulo,
                total_investigadores: p.total_investigadores ?? p.totalInvestigadores ?? 0,
                total_productos: p.total_productos ?? p.totalProductos ?? 0,
                total_informes: p.total_informes ?? p.totalInformes ?? 0,
                informes_aprobados: p.informes_aprobados ?? p.informesAprobados ?? 0,
                trl_actual: p.trl_actual ?? p.trlActual ?? 1,
                trl_meta: p.trl_meta ?? p.trlMeta ?? 4,
                director_nombre: p.director_nombre ?? p.directorNombre,
                template_code: p.template_code ?? p.templateCode ?? 'PROTOCOLO_INNOVACION'
            }));

            setProyectos(innovacionProjects);
            if (onCountChange) {
                onCountChange(innovacionProjects.length);
            }
        } catch (err) {
            console.error('[DIITRA] Error loading innovation projects:', err);
        } finally {
            setLoading(false);
        }
    }, [onCountChange]);

    useEffect(() => {
        loadProjects();
        const handleProjectsChanged = () => loadProjects();
        const handleFocus = () => {
            if (document.visibilityState === 'visible') {
                loadProjects();
            }
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('diitra-projects-changed', handleProjectsChanged);

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadProjects();
            }
        }, 45000);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('diitra-projects-changed', handleProjectsChanged);
            clearInterval(interval);
        };
    }, [loadProjects]);

    const carrerasDisponibles = useMemo(() => {
        return Array.from(new Set(proyectos.map(p => p.carrera).filter(Boolean))) as string[];
    }, [proyectos]);

    const filteredProjects = useMemo(() => {
        return proyectos
            .filter(p => {
                const matchesSearch = !search.trim() ||
                    p.titulo.toLowerCase().includes(search.toLowerCase()) ||
                    (p.director_nombre && p.director_nombre.toLowerCase().includes(search.toLowerCase())) ||
                    (p.codigo_institucional && p.codigo_institucional.toLowerCase().includes(search.toLowerCase()));

                const matchesEstado = estadoFilter === 'todos' || p.estado.toLowerCase() === estadoFilter.toLowerCase();
                const matchesCarrera = carreraFilter === 'todas' || p.carrera === carreraFilter;

                return matchesSearch && matchesEstado && matchesCarrera;
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
                        'prepropuesta': 1,
                        'enviado': 2,
                        'formulacion': 3,
                        'enrevision': 4,
                        'correccion': 5,
                        'aprobado': 6,
                        'ejecucion': 7,
                        'finalizado': 8,
                        'rechazado': 9
                    };
                    const pA = actionPriority[a.estado.toLowerCase()] || 50;
                    const pB = actionPriority[b.estado.toLowerCase()] || 50;
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
                if (sortBy === 'trl_mayor') {
                    return (b.trl_actual ?? 0) - (a.trl_actual ?? 0);
                }
                if (sortBy === 'titulo') {
                    return (a.titulo || '').localeCompare(b.titulo || '');
                }
                if (sortBy === 'presupuesto') {
                    return (b.presupuesto_total || 0) - (a.presupuesto_total || 0);
                }
                return 0;
            });
    }, [proyectos, search, estadoFilter, carreraFilter, sortBy, isPinned, recentVisitsMap]);

    const hasActiveFilters = search.trim() !== '' || estadoFilter !== 'todos' || carreraFilter !== 'todas';

    const handleAprobarIdea = async (e: React.MouseEvent, p: ProyectoInnovacionResumen) => {
        e.preventDefault();
        e.stopPropagation();

        const ok = await confirm({
            title: "¿Aprobar Prepropuesta de Innovación?",
            message: `¿Desea aprobar la idea del proyecto '${p.titulo}'? El equipo podrá iniciar la formulación del documento oficial ISTPET.`,
            confirmText: "Aprobar Prepropuesta",
            variant: "primary"
        });

        if (!ok) return;

        setProcessingUuid(p.uuid);
        try {
            await api.patch(`/documents/instances/${p.uuid}/metadata`, { Estado: 'Formulacion' });
            addToast("Prepropuesta Aprobada", "El proyecto ha pasado a la fase de formulación técnica.", "success");
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            loadProjects();
        } catch (err: any) {
            addToast("Error", err.response?.data?.message || "No se pudo aprobar la prepropuesta.", "error");
        } finally {
            setProcessingUuid(null);
        }
    };

    const handleDevolver = async (e: React.MouseEvent, p: ProyectoInnovacionResumen) => {
        e.preventDefault();
        e.stopPropagation();

        const ok = await confirm({
            title: "¿Devolver Prepropuesta con Observaciones?",
            message: `El proyecto '${p.titulo}' volverá al docente para que realice los ajustes solicitados.`,
            confirmText: "Devolver a Ajustes",
            variant: "destructive"
        });

        if (!ok) return;

        setProcessingUuid(p.uuid);
        try {
            await api.patch(`/documents/instances/${p.uuid}/metadata`, { Estado: 'Borrador' });
            addToast("Prepropuesta Devuelta", "El proyecto ha vuelto a estado borrador para ajustes.", "info");
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            loadProjects();
        } catch (err: any) {
            addToast("Error", err.response?.data?.message || "No se pudo devolver la prepropuesta.", "error");
        } finally {
            setProcessingUuid(null);
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-text-dim">
                <Loader2 className="animate-spin text-brand" size={24} />
                <span className="text-xs font-mono uppercase tracking-widest">Cargando proyectos de innovación...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Barra de Búsqueda y Filtros */}
            <div className="flex flex-col lg:flex-row gap-3 bg-surface p-4 rounded-2xl border border-border-thin shadow-sm">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar proyectos de innovación por título, director, código..."
                        className="input-vercel !pl-10 !rounded-xl !py-2 !text-xs w-full"
                    />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="input-vercel !rounded-xl !py-2 !text-xs min-w-[160px] cursor-pointer"
                    >
                        <option value="mi_actividad">Mi actividad reciente</option>
                        <option value="accion_requerida">Requieren atención</option>
                        <option value="recientes">Modificados recientemente</option>
                        <option value="antiguos">Más antiguos</option>
                        <option value="trl_mayor">Mayor madurez TRL</option>
                        <option value="titulo">Título (A-Z)</option>
                        <option value="presupuesto">Presupuesto mayor</option>
                    </select>

                    <select
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value)}
                        className="input-vercel !rounded-xl !py-2 !text-xs min-w-[140px] cursor-pointer"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="prepropuesta">Prepropuestas</option>
                        <option value="formulacion">En Formulación</option>
                        <option value="enrevision">En Evaluación</option>
                        <option value="aprobado">Aprobados</option>
                        <option value="ejecucion">En Ejecución</option>
                        <option value="finalizado">Finalizados</option>
                    </select>

                    {carrerasDisponibles.length > 0 && (
                        <select
                            value={carreraFilter}
                            onChange={(e) => setCarreraFilter(e.target.value)}
                            className="input-vercel !rounded-xl !py-2 !text-xs min-w-[140px] cursor-pointer"
                        >
                            <option value="todas">Todas las carreras</option>
                            {carrerasDisponibles.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    )}

                </div>
            </div>

            {/* Listado de Proyectos */}
            {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
                    <div className="icon-circle !p-4 bg-surface mb-6">
                        <Target size={28} className="text-text-dim" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-main tracking-tight mb-2">
                        {hasActiveFilters ? 'Sin resultados' : 'Aún no tienes proyectos'}
                    </h3>
                    <p className="text-sm text-text-dim max-w-xs mb-6">
                        {hasActiveFilters
                            ? 'Prueba con otros filtros de búsqueda.'
                            : 'Crea tu primera propuesta de innovación para comenzar.'}
                    </p>
                    {!hasActiveFilters && (
                        <Link
                            to="/convocatorias"
                            className="btn-vercel-primary px-6 py-2.5 flex items-center justify-center gap-2"
                        >
                            <Plus size={14} strokeWidth={3} /> Postular a Convocatoria
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((p) => {
                        const isPrepropuesta = p.estado?.toLowerCase() === 'prepropuesta';
                        const cfg = getEstadoConfig(p.estado);
                        const isProcessing = processingUuid === p.uuid;

                        return (
                            <div
                                key={p.uuid}
                                className="bento-card group relative p-6 flex flex-col justify-between overflow-hidden cursor-pointer"
                            >
                                {/* Enlace global de la tarjeta para acceso directo e inmediato */}
                                <Link
                                    to={buildWorkspacePath('PROTOCOLO_INNOVACION', p.uuid)}
                                    className="absolute inset-0 z-10"
                                />
                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-subtle rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="space-y-4">
                                    {/* Header de la tarjeta con flecha y estado */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1 min-w-0 flex-1">
                                            {p.codigo_institucional && (
                                                <span className="text-[10px] font-mono font-bold text-text-dim uppercase tracking-wider block truncate">
                                                    {p.codigo_institucional}
                                                </span>
                                            )}
                                            <h3 className="text-sm font-semibold text-text-main line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                                                {p.titulo?.trim() || '(Sin título)'}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 relative z-20">
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
                                            <span className={`badge-vercel ${cfg.badge} text-[9px] font-mono uppercase px-2 py-0.5`} style={cfg.style}>
                                                {cfg.label}
                                            </span>
                                            <ArrowRight size={14} className="text-text-dim group-hover:text-brand group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>

                                    {/* Director y Carrera */}
                                    <div className="space-y-1 pt-2 border-t border-border-thin/60">
                                        {p.director_nombre && (
                                             <div className="flex items-center gap-1.5 text-xs text-text-dim">
                                                <User size={12} className="shrink-0 text-text-dim opacity-70" />
                                                <span className="truncate">Director: <strong className="text-text-main font-medium">{p.director_nombre}</strong></span>
                                            </div>
                                        )}
                                        {p.carrera && (
                                            <div className="flex items-center gap-1.5 text-[11px] text-text-dim font-mono">
                                                <Layers size={11} className="shrink-0 text-text-dim opacity-70" />
                                                <span className="truncate">{p.carrera}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Métricas de Innovación (TRL y Presupuesto) */}
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div className="p-2.5 rounded-xl bg-bg-deep border border-border-thin flex flex-col justify-center">
                                            <span className="text-[9px] font-mono uppercase text-text-dim font-bold flex items-center gap-1">
                                                <Sparkles size={10} className="text-brand" />
                                                Madurez TRL
                                            </span>
                                            <span className="text-xs font-bold text-text-main mt-0.5">
                                                TRL {p.trl_actual ?? 1} <span className="text-[10px] text-text-dim font-normal">/ {p.trl_meta ?? 4}</span>
                                            </span>
                                        </div>

                                        <div className="p-2.5 rounded-xl bg-bg-deep border border-border-thin flex flex-col justify-center">
                                            <span className="text-[9px] font-mono uppercase text-text-dim font-bold flex items-center gap-1">
                                                <DollarSign size={10} className="text-emerald-500" />
                                                Presupuesto
                                            </span>
                                            <span className="text-xs font-bold text-text-main mt-0.5">
                                                ${(p.presupuesto_total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Botones de Prepropuesta para Admin (con z-20 para no interferir con la tarjeta) */}
                                    {isAdmin && isPrepropuesta && (
                                        <div className="flex gap-2 pt-2 border-t border-border-thin relative z-20">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAprobarIdea(e, p);
                                                }}
                                                disabled={isProcessing}
                                                className="btn-vercel-primary !py-1.5 !px-2.5 !text-[11px] font-bold flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
                                            >
                                                <CheckCircle2 size={12} />
                                                <span>Aprobar Idea</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDevolver(e, p);
                                                }}
                                                disabled={isProcessing}
                                                className="btn-vercel-secondary !py-1.5 !px-2.5 !text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <RotateCcw size={12} />
                                                <span>Devolver</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Footer de la tarjeta */}
                                <div className="pt-3 mt-3 border-t border-border-thin/60 flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-text-dim">
                                        {p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString() : ''}
                                    </span>
                                    <span className="text-[11px] font-semibold text-brand flex items-center gap-1 group-hover:underline">
                                        Ingresar al Proyecto <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
