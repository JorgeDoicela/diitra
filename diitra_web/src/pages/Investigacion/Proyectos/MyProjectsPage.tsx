import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Plus, ArrowRight, Calendar, AlertCircle,
    Loader2, Search, Filter, BarChart3, Zap, Target, BookOpen
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

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    'Borrador':     { label: 'Borrador',      color: 'text-gray-400',   bg: 'bg-gray-500/10',   dot: 'bg-gray-500' },
    'Enviado':      { label: 'Enviado',        color: 'text-blue-400',   bg: 'bg-blue-500/10',   dot: 'bg-blue-500' },
    'En Revisión':  { label: 'En Revisión',    color: 'text-amber-400',  bg: 'bg-amber-500/10',  dot: 'bg-amber-500 animate-pulse' },
    'Aprobado':     { label: 'Aprobado',       color: 'text-emerald-400',bg: 'bg-emerald-500/10',dot: 'bg-emerald-500' },
    'En Ejecución': { label: 'En Ejecución',   color: 'text-violet-400', bg: 'bg-violet-500/10', dot: 'bg-violet-500 animate-pulse' },
    'Finalizado':   { label: 'Finalizado',     color: 'text-teal-400',   bg: 'bg-teal-500/10',   dot: 'bg-teal-500' },
    'Rechazado':    { label: 'Rechazado',      color: 'text-red-400',    bg: 'bg-red-500/10',    dot: 'bg-red-500' },
};

const estadoConfig = (estado: string) =>
    ESTADO_CONFIG[estado] ?? { label: estado, color: 'text-gray-400', bg: 'bg-gray-500/10', dot: 'bg-gray-500' };

const MyProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState<string>('todos');
    const [showNewProject, setShowNewProject] = useState(false);

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
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 animate-fade-up">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                        <ClipboardList size={10} className="text-primary" />
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
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-text-main text-bg-deep px-6 py-3 md:py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-xl"
                >
                    <Plus size={14} strokeWidth={3} />
                    Nueva Postulación
                </button>
            </header>

            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-up [animation-delay:100ms]">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por título o código..."
                        className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border-thin rounded-xl text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <Filter size={14} className="text-text-dim shrink-0" />
                    <select
                        value={filterEstado}
                        onChange={e => setFilterEstado(e.target.value)}
                        className="bg-surface border border-border-thin rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary cursor-pointer"
                    >
                        <option value="todos">Todos los estados</option>
                        {Object.keys(ESTADO_CONFIG).map(e => (
                            <option key={e} value={e}>{ESTADO_CONFIG[e].label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Estado de error */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Sin proyectos */}
            {!error && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
                    <div className="w-16 h-16 bg-surface border border-border-thin rounded-2xl flex items-center justify-center text-text-dim mb-6">
                        <Target size={28} />
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
                            className="flex items-center gap-2 bg-text-main text-bg-deep px-6 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            <Plus size={14} strokeWidth={3} /> Crear primer proyecto
                        </button>
                    )}
                </div>
            )}

            {/* Grid de proyectos */}
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
                            className="group relative bg-surface border border-border-thin rounded-2xl p-6 cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 active:scale-[0.99] overflow-hidden"
                        >
                            {/* Glow de fondo */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Cabecera */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0">
                                    {p.codigo_institucional && (
                                        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-1 font-mono">
                                            {p.codigo_institucional}
                                        </p>
                                    )}
                                    <h3 className="font-bold text-text-main text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                        {p.titulo}
                                    </h3>
                                </div>
                                <ArrowRight
                                    size={14}
                                    className="text-text-dim group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-0.5 ml-2"
                                />
                            </div>

                            {/* Badge de estado */}
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color} mb-4`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                                {p.rol_en_proyecto && (
                                    <span className="opacity-60 ml-1">· {p.rol_en_proyecto}</span>
                                )}
                            </div>

                            {/* Línea de investigación */}
                            {p.linea_investigacion && (
                                <div className="flex items-center gap-1.5 text-[10px] text-text-dim mb-4">
                                    <BookOpen size={10} />
                                    <span className="truncate">{p.linea_investigacion}</span>
                                </div>
                            )}

                            {/* Métricas */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                                    <p className="text-base font-bold text-text-main font-mono">{p.total_investigadores}</p>
                                    <p className="text-[9px] text-text-dim uppercase tracking-wide">Invest.</p>
                                </div>
                                <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                                    <p className="text-base font-bold text-text-main font-mono">{p.total_productos}</p>
                                    <p className="text-[9px] text-text-dim uppercase tracking-wide">Produc.</p>
                                </div>
                                <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                                    <p className="text-base font-bold text-text-main font-mono">
                                        {p.informes_aprobados}/{p.total_informes}
                                    </p>
                                    <p className="text-[9px] text-text-dim uppercase tracking-wide">Informes</p>
                                </div>
                            </div>

                            {/* Barra de ejecución presupuestaria */}
                            {p.presupuesto_total && p.presupuesto_total > 0 && (
                                <div className="mb-3">
                                    <div className="flex justify-between text-[10px] font-mono text-text-dim mb-1">
                                        <span>Ejecución presupuestaria</span>
                                        <span className="text-text-main font-bold">{presupuestoPorc.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-border-thin rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-700"
                                            style={{ width: `${presupuestoPorc}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] text-text-dim mt-1">
                                        <span>${(p.presupuesto_ejecutado ?? 0).toLocaleString('es-EC')}</span>
                                        <span>${(p.presupuesto_total).toLocaleString('es-EC')}</span>
                                    </div>
                                </div>
                            )}

                            {/* TRL y fecha */}
                            <div className="flex items-center justify-between pt-3 border-t border-border-thin text-[10px] text-text-dim">
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
                                        <Zap size={10} className="text-amber-400" />
                                        <span>TRL {p.trl_actual}/{p.trl_meta ?? '—'}</span>
                                    </div>
                                )}
                                {p.puntaje_evaluacion != null && (
                                    <div className="flex items-center gap-1">
                                        <BarChart3 size={10} className="text-emerald-400" />
                                        <span className="text-emerald-400 font-bold">{p.puntaje_evaluacion}/100</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lanzador de nuevo proyecto */}
            {showNewProject && (
                <CreateProjectModal
                    onClose={() => setShowNewProject(false)}
                />
            )}
        </main>
    );
};

export default MyProjectsPage;
