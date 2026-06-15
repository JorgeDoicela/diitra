import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Plus, FileCheck, ArrowRight, Calendar, AlertCircle,
    Loader2, Search, BarChart3, Zap, Target, BookOpen, Trash2, User, RefreshCw
} from 'lucide-react';
import api from '../../../api/axios_config';
import { CreateProjectModal } from '../../../components/DIITRA/CreateProjectModal';
import DocumentTray from '../../../components/DIITRA/DocumentTray';
import FinalReportLauncher from './components/FinalReportLauncher';
import { buildWorkspacePath } from '../../../core/documents/templateUrl';

export interface ProyectoResumen {
    uuid: string;
    codigo_institucional?: string;
    titulo: string;
    estado: string;
    linea_investigacion?: string;
    tipo_investigacion?: string;
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

const ESTADO_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
    'Borrador':     { label: 'Borrador',      badge: 'badge-vercel-neutral', dot: 'dot-neutral' },
    'Enviado':      { label: 'Enviado',        badge: 'badge-vercel-info',    dot: 'dot-info' },
    'En Revisión':  { label: 'En Revisión',    badge: 'badge-vercel-warning', dot: 'dot-warning dot-pulse' },
    'Aprobado':     { label: 'Aprobado',       badge: 'badge-vercel-success', dot: 'dot-success' },
    'En Ejecución': { label: 'En Ejecución',   badge: 'badge-vercel-violet',  dot: 'dot-brand dot-pulse' },
    'Finalizado':   { label: 'Finalizado',     badge: 'badge-vercel-success', dot: 'dot-success' },
    'Rechazado':    { label: 'Rechazado',      badge: 'badge-vercel-error',   dot: 'dot-error' },
};

const estadoConfig = (estado: string) =>
    ESTADO_CONFIG[estado] ?? { label: estado, badge: 'badge-vercel-neutral', dot: 'dot-neutral' };

const ResearchProjectsPage = () => {
    const navigate = useNavigate();
    const [showWizard, setShowWizard] = useState(false);
    const [showReportLauncher, setShowReportLauncher] = useState(false);
    
    const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    
    const [filterEstado, setFilterEstado] = useState<string>('todos');
    const [filterLinea, setFilterLinea] = useState<string>('todas');
    const [filterConvocatoria, setFilterConvocatoria] = useState<string>('todas');
    const [sortBy, setSortBy] = useState<string>('recientes');
    
    const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
    const [deletingTitle, setDeletingTitle] = useState<string>('');
    const [deletionError, setDeletionError] = useState<string | null>(null);

    const loadProjects = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const res = await api.get('/projects');
            setProyectos(res.data || []);
        } catch (err: any) {
            console.error('[DIITRA Admin] Error al cargar proyectos:', err);
            setError('No se pudieron obtener los proyectos registrados de la base de datos.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadProjects();
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
    }, [proyectos, search, filterEstado, filterLinea, filterConvocatoria, sortBy]);

    const abrirWorkspace = (p: ProyectoResumen) => {
        navigate(buildWorkspacePath('PROTOCOLO_INVESTIGACION', p.uuid, '', '/investigacion'));
    };

    const confirmarEliminar = (uuid: string, titulo: string) => {
        setDeletingUuid(uuid);
        setDeletingTitle(titulo || 'PROYECTO SIN TÍTULO');
        setDeletionError(null);
    };

    const ejecutarEliminacion = async () => {
        if (!deletingUuid) return;
        try {
            setDeletionError(null);
            await api.delete(`/projects/${deletingUuid}`);
            setProyectos(prev => prev.filter(p => p.uuid !== deletingUuid));
            setDeletingUuid(null);
            setDeletingTitle('');
        } catch (err: any) {
            console.error('[DIITRA Admin] Error al eliminar borrador:', err);
            setDeletionError(err.response?.data?.message || 'No se pudo eliminar el borrador del proyecto.');
        }
    };

    const hasActiveFilters = search !== '' || filterEstado !== 'todos' || filterLinea !== 'todas' || filterConvocatoria !== 'todas';

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto space-y-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 animate-fade-up gap-6 md:gap-0">
                <div className="space-y-2">
                    <div className="section-label text-brand">
                        <ClipboardList size={10} />
                        <span>Revisión Institucional de Proyectos</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-none">
                        Supervisión de Investigaciones
                    </h2>
                    <p className="text-xs text-text-dim max-w-lg font-medium leading-relaxed">
                        Administre y califique los proyectos de investigación registrados en el sistema, supervise su presupuesto y valide sus productos.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                    <button
                        onClick={() => loadProjects(true)}
                        disabled={refreshing || loading}
                        className="btn-vercel-secondary !p-2.5 h-10 w-10 flex items-center justify-center rounded-xl"
                        title="Actualizar proyectos"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => setShowReportLauncher(true)}
                        className="btn-vercel-secondary h-10 px-4 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold"
                    >
                        <FileCheck size={14} />
                        <span>Informe Final</span>
                    </button>
                    <button
                        onClick={() => setShowWizard(true)}
                        className="btn-vercel-primary h-10 px-4 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold"
                    >
                        <Plus size={14} strokeWidth={3} />
                        Nueva Postulación
                    </button>
                </div>
            </header>

            {error && (
                <div className="badge-vercel-error !rounded-xl !p-4 mb-6 w-full text-sm flex items-center gap-3">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* ── SECCIÓN DE FILTROS ── */}
            {!error && !loading && (
                <div className="flex flex-col gap-4 mb-8 animate-fade-up [animation-delay:50ms] bg-surface p-5 rounded-2xl border border-border-thin shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por título, código, director, carrera o convocatoria..."
                                className="input-vercel !pl-10 !rounded-xl !py-2.5 !text-sm !placeholder:text-text-dim w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="input-vercel !rounded-xl !py-2.5 !text-sm min-w-[150px] cursor-pointer"
                            >
                                <option value="recientes">Más recientes</option>
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
                                        setSortBy('recientes');
                                    }}
                                    className="btn-vercel-secondary !py-2.5 !px-4 !rounded-xl !text-xs whitespace-nowrap hover:bg-surface-hover hover:text-text-main transition-all"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border-thin">
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider pl-1">Estado</label>
                            <select
                                value={filterEstado}
                                onChange={e => setFilterEstado(e.target.value)}
                                className="input-vercel !rounded-xl !py-2 !text-xs w-full cursor-pointer"
                            >
                                <option value="todos">Todos los estados</option>
                                {Object.keys(ESTADO_CONFIG).map(e => (
                                    <option key={e} value={e}>{ESTADO_CONFIG[e].label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider pl-1">Línea de Investigación</label>
                            <select
                                value={filterLinea}
                                onChange={e => setFilterLinea(e.target.value)}
                                className="input-vercel !rounded-xl !py-2 !text-xs w-full cursor-pointer"
                            >
                                <option value="todas">Todas las líneas</option>
                                {lineasDisponibles.map(linea => (
                                    <option key={linea} value={linea}>{linea}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider pl-1">Convocatoria</label>
                            <select
                                value={filterConvocatoria}
                                onChange={e => setFilterConvocatoria(e.target.value)}
                                className="input-vercel !rounded-xl !py-2 !text-xs w-full cursor-pointer"
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
                        const cfg = estadoConfig(p.estado);
                        const presupuestoPorc = p.presupuesto_total && p.presupuesto_ejecutado
                            ? Math.min(100, (p.presupuesto_ejecutado / p.presupuesto_total) * 100)
                            : 0;

                        return (
                            <div
                                key={p.uuid}
                                onClick={() => abrirWorkspace(p)}
                                className="bento-card group relative p-6 cursor-pointer overflow-hidden flex flex-col justify-between"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-subtle rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            {p.codigo_institucional && (
                                                <p className="text-[10px] font-semibold text-text-dim uppercase tracking-[0.2em] mb-1 font-mono">
                                                    {p.codigo_institucional}
                                                </p>
                                            )}
                                            <h3 className="font-semibold text-text-main text-sm leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                                                {p.titulo?.trim() || '(Sin título)'}
                                            </h3>
                                            {p.director_nombre && (
                                                <div className="flex items-center gap-1.5 text-text-dim mt-2">
                                                    <User size={12} className="text-text-dim opacity-70" />
                                                    <span className="text-[11px] text-text-dim font-medium truncate">
                                                        Director: <span className="text-text-main font-semibold">{p.director_nombre}</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-2 mt-0.5">
                                            {(p.estado === 'Borrador' || p.estado === 'En Corrección') && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmarEliminar(p.uuid, p.titulo);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-error-subtle text-text-dim hover:text-error transition-colors"
                                                    title="Eliminar borrador"
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

                                    <div className={`badge-vercel ${cfg.badge} self-start`}>
                                        <span className={`dot ${cfg.dot}`} />
                                        {cfg.label}
                                        {p.rol_en_proyecto && (
                                            <span className="opacity-60 ml-1">· {p.rol_en_proyecto}</span>
                                        )}
                                    </div>

                                    {p.linea_investigacion && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-text-dim">
                                            <BookOpen size={10} />
                                            <span className="truncate">{p.linea_investigacion}</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                                            <p className="stat-number--sm !text-sm font-bold text-text-main font-mono">{p.total_investigadores}</p>
                                            <p className="text-[9px] text-text-dim uppercase tracking-wide">Invest.</p>
                                        </div>
                                        <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                                            <p className="stat-number--sm !text-sm font-bold text-text-main font-mono">{p.total_productos}</p>
                                            <p className="text-[9px] text-text-dim uppercase tracking-wide">Produc.</p>
                                        </div>
                                        <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                                            <p className="stat-number--sm !text-sm font-bold text-text-main font-mono">
                                                {p.informes_aprobados}/{p.total_informes}
                                            </p>
                                            <p className="text-[9px] text-text-dim uppercase tracking-wide">Informes</p>
                                        </div>
                                    </div>

                                    {p.presupuesto_total !== undefined && p.presupuesto_total > 0 && (
                                        <div className="pt-2">
                                            <div className="flex justify-between text-[10px] font-mono text-text-dim mb-1">
                                                <span>Ejecución presupuestaria</span>
                                                <span className="text-text-main font-bold">{presupuestoPorc.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-border-thin rounded-full overflow-hidden">
                                                <div
                                                    className="progress-fill progress-fill--brand"
                                                    style={{ width: `${presupuestoPorc}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[9px] text-text-dim mt-1">
                                                <span>${(p.presupuesto_ejecutado ?? 0).toLocaleString('es-EC')}</span>
                                                <span>${(p.presupuesto_total).toLocaleString('es-EC')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-border mt-4 text-[10px] text-text-dim">
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
                                            <span>TRL {p.trl_actual}/{p.trl_meta ?? '—'}</span>
                                        </div>
                                    )}
                                    {p.puntaje_evaluacion != null && (
                                        <div className="flex items-center gap-1">
                                            <BarChart3 size={10} className="text-success" />
                                            <span className="text-success font-bold">{p.puntaje_evaluacion}/100</span>
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
            {showReportLauncher && <FinalReportLauncher onClose={() => setShowReportLauncher(false)} />}

            {/* Modal de confirmación de borrado */}
            {deletingUuid && (
                <div className="modal-overlay !z-50 animate-fade-in">
                    <div className="modal-card animate-fade-up">
                        <div className="modal-body">
                            <div className="flex items-start gap-4">
                                <div className="icon-circle-error !p-3 shrink-0">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-text-main text-base">¿Eliminar borrador de investigación?</h4>
                                    <p className="text-text-dim text-xs leading-relaxed">
                                        Esta acción eliminará de forma permanente el borrador <strong className="text-text-main">"{deletingTitle}"</strong>, incluyendo todos sus objetivos, cronograma, presupuesto y participantes de la base de datos de DIITRA. Esta acción no se puede deshacer.
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
        </main>
    );
};

export default ResearchProjectsPage;
