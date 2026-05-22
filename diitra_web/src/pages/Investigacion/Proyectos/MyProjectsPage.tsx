import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Plus, ArrowRight, Calendar, AlertCircle,
    Loader2, Search, Filter, BarChart3, Zap, Target, BookOpen, Trash2
} from 'lucide-react';
import api from '../../../api/axios_config';
import { CreateProjectModal } from '../../../components/DIITRA/CreateProjectModal';

interface ProyectoResumen {
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

const MyProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState<string>('todos');
    const [showNewProject, setShowNewProject] = useState(false);
    const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
    const [deletingTitle, setDeletingTitle] = useState<string>('');
    const [deletionError, setDeletionError] = useState<string | null>(null);

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
            console.error('[DIITRA] Error al eliminar borrador:', err);
            setDeletionError(err.response?.data?.message || 'No se pudo eliminar el borrador de investigación debido a un error del servidor.');
        }
    };

    useEffect(() => {
        const fetchProyectos = async () => {
            try {
                setLoading(true);
                const res = await api.get('/projects/my');
                setProyectos(res.data);
            } catch (e: any) {
                setError('No se pudieron cargar tus proyectos. Verifica la conexión con el servidor.');
                console.error('[DIITRA] Error al cargar proyectos:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchProyectos();
    }, []);

    const filtered = proyectos.filter(p => {
        const matchSearch = p.titulo.toLowerCase().includes(search.toLowerCase())
            || (p.codigo_institucional || '').toLowerCase().includes(search.toLowerCase());
        const matchEstado = filterEstado === 'todos' || p.estado === filterEstado;
        return matchSearch && matchEstado;
    });

    const abrirWorkspace = (p: ProyectoResumen) => {
        navigate(`/investigacion/workspace/PROTOCOLO_INVESTIGACION/${p.uuid}`);
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-text-dim" size={32} />
                <p className="text-text-dim text-sm font-mono uppercase tracking-widest">Cargando proyectos...</p>
            </div>
        </div>
    );

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 animate-fade-up">
                <div className="space-y-2">
                    <div className="section-label text-brand">
                        <ClipboardList size={10} />
                        <span>Mis Investigaciones</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">
                        Mis Proyectos de I+D+i
                    </h2>
                    <p className="text-xs text-text-dim max-w-lg font-medium">
                        {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} en tu expediente institucional.
                    </p>
                </div>
                <button
                    onClick={() => setShowNewProject(true)}
                    className="btn-vercel-primary w-full md:w-auto px-6 py-3 md:py-2.5"
                >
                    <Plus size={14} strokeWidth={3} />
                    Nueva Postulación
                </button>
            </header>

            <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-up [animation-delay:100ms]">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por título o código..."
                        className="input-vercel !pl-9 !rounded-xl !py-2.5 !text-sm !placeholder:text-text-dim"
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <Filter size={14} className="text-text-dim shrink-0" />
                    <select
                        value={filterEstado}
                        onChange={e => setFilterEstado(e.target.value)}
                        className="input-vercel !rounded-xl !py-2.5 !text-sm !w-auto"
                    >
                        <option value="todos">Todos los estados</option>
                        {Object.keys(ESTADO_CONFIG).map(e => (
                            <option key={e} value={e}>{ESTADO_CONFIG[e].label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="badge-vercel-error !rounded-xl !p-4 mb-6 w-full text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {!error && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
                    <div className="icon-circle !p-4 bg-surface mb-6">
                        <Target size={28} className="text-text-dim" />
                    </div>
                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight mb-2">
                        {search || filterEstado !== 'todos' ? 'Sin resultados' : 'Aún no tienes proyectos'}
                    </h3>
                    <p className="text-sm text-text-dim max-w-xs mb-6">
                        {search || filterEstado !== 'todos'
                            ? 'Prueba con otros filtros de búsqueda.'
                            : 'Crea tu primera propuesta de investigación para comenzar.'}
                    </p>
                    {filterEstado === 'todos' && !search && (
                        <button
                            onClick={() => setShowNewProject(true)}
                            className="btn-vercel-primary px-6 py-2.5"
                        >
                            <Plus size={14} strokeWidth={3} /> Crear primer proyecto
                        </button>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-up [animation-delay:150ms]">
                {filtered.map((p) => {
                    const cfg = estadoConfig(p.estado);
                    const presupuestoPorc = p.presupuesto_total && p.presupuesto_ejecutado
                        ? Math.min(100, (p.presupuesto_ejecutado / p.presupuesto_total) * 100)
                        : 0;

                    return (
                        <div
                            key={p.uuid}
                            onClick={() => abrirWorkspace(p)}
                            className="bento-card group relative p-6 cursor-pointer overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-subtle rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0">
                                    {p.codigo_institucional && (
                                        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-1 font-mono">
                                            {p.codigo_institucional}
                                        </p>
                                    )}
                                    <h3 className="font-bold text-text-main text-sm leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                                        {p.titulo}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2 mt-0.5">
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

                            <div className={`badge-vercel ${cfg.badge} mb-4`}>
                                <span className={`dot ${cfg.dot}`} />
                                {cfg.label}
                                {p.rol_en_proyecto && (
                                    <span className="opacity-60 ml-1">· {p.rol_en_proyecto}</span>
                                )}
                            </div>

                            {p.linea_investigacion && (
                                <div className="flex items-center gap-1.5 text-[10px] text-text-dim mb-4">
                                    <BookOpen size={10} />
                                    <span className="truncate">{p.linea_investigacion}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                                    <p className="stat-number--sm !text-base font-bold text-text-main font-mono">{p.total_investigadores}</p>
                                    <p className="text-[9px] text-text-dim uppercase tracking-wide">Invest.</p>
                                </div>
                                <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                                    <p className="stat-number--sm !text-base font-bold text-text-main font-mono">{p.total_productos}</p>
                                    <p className="text-[9px] text-text-dim uppercase tracking-wide">Produc.</p>
                                </div>
                                <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                                    <p className="stat-number--sm !text-base font-bold text-text-main font-mono">
                                        {p.informes_aprobados}/{p.total_informes}
                                    </p>
                                    <p className="text-[9px] text-text-dim uppercase tracking-wide">Informes</p>
                                </div>
                            </div>

                            {p.presupuesto_total !== undefined && p.presupuesto_total > 0 && (
                                <div className="mb-3">
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

            {showNewProject && (
                <CreateProjectModal
                    onClose={() => setShowNewProject(false)}
                />
            )}

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

export default MyProjectsPage;
