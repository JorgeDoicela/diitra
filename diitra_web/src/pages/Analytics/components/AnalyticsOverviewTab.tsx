import React from 'react';
import {
    BarChart3, PieChart, TrendingUp, DollarSign, Users,
    Clock, ArrowUpRight, BookOpen, Cpu, FileText, Globe
} from 'lucide-react';
import { KPICard } from './KPICard';
import { DonutChart } from './DonutChart';
import type {
    ProyectoResumen,
    DashboardStats,
    GrupoInvestigacion,
    LineaInvestigacionData,
    EstadoConteo
} from '../types/analytics.types';
import { formatCurrency, formatDate } from '../utils/cacesCalculator';

export interface AnalyticsOverviewTabProps {
    filteredProjects: ProyectoResumen[];
    allProjects: ProyectoResumen[];
    stats: DashboardStats | null;
    groups: GrupoInvestigacion[];
    linesData: LineaInvestigacionData[];
    proyectosPorEstado: EstadoConteo[];
    budgetTotal: number;
    budgetExecuted: number;
    selectedChartSegment: string | null;
    setSelectedChartSegment: (seg: string | null) => void;
}

export const AnalyticsOverviewTab: React.FC<AnalyticsOverviewTabProps> = ({
    filteredProjects,
    allProjects,
    stats,
    groups,
    linesData,
    proyectosPorEstado,
    budgetTotal,
    budgetExecuted,
    selectedChartSegment,
    setSelectedChartSegment
}) => {
    return (
        <>
            {/* Bento Grid: KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
                <KPICard
                    title="Proyectos de Investigación"
                    value={filteredProjects.length}
                    icon={<BarChart3 size={14} />}
                    accentColor="brand"
                    subText="Portafolio del corte"
                    badgeText={`Total: ${allProjects.length}`}
                    footerItems={[
                        { label: 'En Ejecución', value: filteredProjects.filter(p => p.estado === 'En Ejecución').length },
                        { label: 'Borrador', value: filteredProjects.filter(p => p.estado === 'Borrador').length }
                    ]}
                />
                <KPICard
                    title="Producción Científica"
                    value={filteredProjects.reduce((acc, p) => acc + (p.totalProductos || 0), 0)}
                    icon={<BookOpen size={14} />}
                    accentColor="success"
                    subText="Entregables vinculados"
                    badgeText={`Total Periodo: ${stats?.totalProductosPeriodo || 0}`}
                    footerItems={[
                        { label: 'Artículos Indexados', value: stats?.articulosIndexados || 0, valueColorClass: 'text-success font-semibold' },
                        { label: 'Prototipos', value: stats?.prototipos || 0 }
                    ]}
                />
                <KPICard
                    title="Presupuesto Asignado"
                    value={formatCurrency(budgetTotal)}
                    icon={<DollarSign size={14} />}
                    accentColor="warning"
                    subText={`${budgetTotal > 0 ? Math.round((budgetExecuted / budgetTotal) * 100) : 0}% de ejecución`}
                    footerItems={[
                        { label: 'Ejecutado', value: formatCurrency(budgetExecuted), valueColorClass: 'text-warning font-semibold' },
                        { label: 'Restante', value: formatCurrency(budgetTotal - budgetExecuted) }
                    ]}
                />
                <KPICard
                    title="Estructura de Redes"
                    value={groups.length}
                    icon={<Users size={14} />}
                    accentColor="violet"
                    subText="Grupos de Investigación"
                    footerItems={[
                        { label: 'Docentes Activos', value: stats?.totalInvestigadoresActivos || 0 },
                        { label: 'Convocatorias', value: stats?.totalConvocatoriasAbiertas || 0 }
                    ]}
                />
            </div>

            {/* Gráficos Consolidados */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up [animation-delay:100ms]">
                {/* Estado Donut Chart */}
                <div className="bento-card static p-5 flex flex-col justify-between h-[360px] border border-border-thin hover:border-brand/20 transition-all duration-300">
                    <div>
                        <div className="flex items-center justify-between">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-text-dim font-mono">Estado de Proyectos</h4>
                            <PieChart size={13} className="text-brand" />
                        </div>
                        <p className="text-xs text-text-dim mt-1 font-medium font-sans">Estado del portafolio actual</p>
                    </div>

                    <DonutChart
                        elements={proyectosPorEstado}
                        total={filteredProjects.length}
                        selectedSegment={selectedChartSegment}
                        setSelectedSegment={setSelectedChartSegment}
                    />

                    {/* Leyenda */}
                    <div className="grid grid-cols-2 gap-1 text-[9px] font-bold border-t border-border-thin/60 pt-3.5">
                        {proyectosPorEstado.map((item, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-1.5 p-1 rounded transition-colors cursor-pointer ${
                                    selectedChartSegment === item.estado ? 'bg-surface-hover' : ''
                                }`}
                                onMouseEnter={() => setSelectedChartSegment(item.estado)}
                                onMouseLeave={() => setSelectedChartSegment(null)}
                            >
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-text-dim truncate">{item.estado}</span>
                                <span className="ml-auto text-text-main font-mono">{item.cantidad}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Líneas de Investigación */}
                <div className="bento-card static p-5 lg:col-span-2 flex flex-col justify-between h-[360px] border border-border-thin hover:border-brand/20 transition-all duration-300">
                    <div>
                        <div className="flex items-center justify-between">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-text-dim font-mono">
                                Distribución por Línea de Investigación
                            </h4>
                            <TrendingUp size={13} className="text-emerald-500" />
                        </div>
                        <p className="text-xs text-text-dim mt-1 font-medium font-sans">Proyectos asociados a líneas oficiales del instituto</p>
                    </div>

                    <div className="space-y-2.5 flex-1 justify-center flex flex-col overflow-y-auto custom-scrollbar pr-1 mt-4">
                        {linesData.length === 0 ? (
                            <span className="text-text-dim text-[10px] text-center font-bold block py-10 uppercase font-mono">
                                Sin líneas vinculadas
                            </span>
                        ) : (
                            linesData.map((line, idx) => {
                                const lineIcons = [
                                    <BookOpen size={11} key={1} />,
                                    <Cpu size={11} key={2} />,
                                    <TrendingUp size={11} key={3} />,
                                    <Users size={11} key={4} />,
                                    <DollarSign size={11} key={5} />,
                                    <Globe size={11} key={6} />
                                ];
                                return (
                                    <div key={idx} className="space-y-2 p-3 bg-surface/30 hover:bg-surface/50 border border-border-thin/60 hover:border-border-thin rounded-xl transition-all duration-300 group">
                                        <div className="flex justify-between items-start gap-3 text-[10px] font-bold">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="p-1.5 rounded-md bg-bg-deep border border-border-thin text-text-dim group-hover:text-brand group-hover:border-brand/30 transition-all duration-300 shrink-0">
                                                    {lineIcons[idx % lineIcons.length]}
                                                </span>
                                                <span className="text-text-main truncate leading-normal" title={line.nombre}>
                                                    {line.nombre}
                                                </span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-text-main font-mono block">{line.proyectos} {line.proyectos === 1 ? 'Proyecto' : 'Proyectos'}</span>
                                                <span className="text-text-dim font-mono text-[8px] block">{formatCurrency(line.pres)}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-border-thin/35 h-1 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 rounded-full ${line.colorClass}`}
                                                style={{ width: `${line.pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Bitácora y Estado del Repositorio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up [animation-delay:200ms]">
                {/* Actividad */}
                <div className="bento-card static p-5 lg:col-span-2 space-y-4 border border-border-thin hover:border-brand/20 transition-all duration-300">
                    <div>
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-text-dim font-mono">Bitácora Técnica de Investigación</h4>
                        <p className="text-xs text-text-dim mt-1 font-medium font-sans">Historial reciente de auditoría de proyectos y entregables</p>
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {stats?.actividadReciente && stats.actividadReciente.length > 0 ? (
                            stats.actividadReciente.map((act, i) => (
                                <div key={act.uuid || i} className="flex items-center gap-3.5 p-3 bg-surface/30 hover:bg-surface/60 border border-border-thin/50 hover:border-border-thin rounded-xl transition-all duration-300 select-none group">
                                    <span className={`p-2 rounded-lg shrink-0 border transition-all duration-300 ${
                                        act.tipo === 'proyecto'
                                            ? 'bg-brand-subtle text-brand border-brand/10 group-hover:border-brand/35'
                                            : act.tipo === 'producto'
                                                ? 'bg-success-subtle text-success border-success/10 group-hover:border-success/35'
                                                : 'bg-warning-subtle text-warning border-warning/10 group-hover:border-warning/35'
                                    }`}>
                                        {act.tipo === 'proyecto' ? <Cpu size={13} /> : act.tipo === 'producto' ? <BookOpen size={13} /> : <FileText size={13} />}
                                    </span>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p className="text-[11.5px] font-semibold text-text-main group-hover:text-brand transition-colors truncate leading-relaxed">
                                            {act.descripcion}
                                        </p>
                                        <div className="flex items-center gap-2 text-[8.5px] text-text-dim font-bold font-mono">
                                            <span className="uppercase tracking-wider">{act.tipo}</span>
                                            <span>•</span>
                                            <span>{formatDate(act.fecha)}</span>
                                            {act.estado && (
                                                <>
                                                    <span>•</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[7.5px] font-extrabold ${
                                                        act.estado === 'Aprobado' || act.estado === 'En Ejecución'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                        {act.estado}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-14 px-6 border border-dashed border-border-thin/70 rounded-2xl bg-bg-deep/10 text-center select-none space-y-3.5 animate-fade-up">
                                <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-surface border border-border-thin text-text-dim/60 shadow-sm">
                                    <Clock size={16} className="text-brand/80" />
                                    <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-brand animate-pulse shadow-[0_0_6px_rgba(var(--brand),0.5)]" />
                                </div>
                                <div className="space-y-1 max-w-xs">
                                    <h5 className="text-[10.5px] font-black uppercase text-text-main tracking-wider">Bitácora Técnica Inactiva</h5>
                                    <p className="text-[10px] text-text-dim leading-relaxed font-medium">
                                        No se registran firmas ni cambios de estado en este periodo. Los cambios del portafolio se reflejan aquí en tiempo real.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Integraciones */}
                <div className="bento-card static p-5 lg:col-span-1 flex flex-col justify-between gap-4 bg-gradient-to-b from-surface to-brand/5 border border-border-thin/60 hover:border-brand/20 transition-all duration-300">
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-brand">
                            <Globe size={14} className="animate-pulse" />
                            <h4 className="text-[9px] font-semibold uppercase tracking-widest font-mono">Servicios Conectados</h4>
                        </div>
                        <h3 className="text-sm font-semibold text-text-main font-sans tracking-tight">Preservación Digital DSpace</h3>
                        <p className="text-xs text-text-dim leading-relaxed font-medium">
                            Sincronización automatizada de documentos firmados con el repositorio abierto del instituto. Se garantiza el resguardo digital permanente bajo las directrices del CACES.
                        </p>
                    </div>

                    <div className="p-3.5 bg-bg-deep/60 border border-border-thin/80 rounded-2xl space-y-3 text-[9.5px] font-bold font-mono">
                        <div className="flex items-center justify-between">
                            <span className="text-text-dim uppercase tracking-wider text-[8px]">Servidor DSpace</span>
                            <span className="text-success flex items-center gap-1.5 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
                                En línea
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-text-dim uppercase tracking-wider text-[8px]">Acceso institucional</span>
                            <span className="text-success flex items-center gap-1.5 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
                                En línea
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-text-dim uppercase tracking-wider text-[8px]">Integridad de Firma</span>
                            <span className="text-success flex items-center gap-1.5 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                                Seguro
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => alert("Redireccionando al portal del Repositorio Abierto del IST Traversari...")}
                        className="btn-vercel-secondary w-full flex items-center justify-between group text-[9.5px] !py-2.5"
                        id="dspace-redirect-btn"
                    >
                        <span>Ver Repositorio Abierto</span>
                        <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    </button>
                </div>
            </div>
        </>
    );
};
