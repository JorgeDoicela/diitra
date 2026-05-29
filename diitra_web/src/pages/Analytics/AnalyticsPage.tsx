import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart3, PieChart, TrendingUp, DollarSign, Users,
    Clock, ArrowUpRight, BookOpen, Cpu, FileText,
    Filter, Globe, Building2, Download, RefreshCw, AlertCircle,
    FolderOpen, Loader2
} from 'lucide-react';
import api from '../../api/axios_config';
import { reportService } from '../../api/reportService';

// ============================================================================
// 1. DATA TYPES & INTERFACES (CONTRACTS)
// ============================================================================

export interface ProyectoResumen {
    idProyecto: number;
    uuid: string;
    codigoInstitucional: string | null;
    titulo: string;
    estado: string;
    lineaInvestigacion: string | null;
    carrera: string | null;
    presupuestoTotal: number | null;
    presupuestoEjecutado: number | null;
    puntajeEvaluacion: number | null;
    fechaRegistro: string | null;
    fechaModificacion: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
    tiempoEjecucion: string | null;
    convocatoriaTitulo: string | null;
    totalInvestigadores: number;
    totalProductos: number;
    totalInformes: number;
    informesAprobados: number;
    trlActual: number | null;
    trlMeta: number | null;
    totalEstudiantes?: number;
    entidadAliada?: string | null;
    objetivoPnd?: string | null;
    convocatoriaCodigo?: string | null;
}

export interface EstadoConteo {
    estado: string;
    cantidad: number;
    color: string;
}

export interface ActividadReciente {
    tipo: string;
    descripcion: string;
    fecha: string;
    uuid: string | null;
    estado: string | null;
}

export interface DashboardStats {
    totalProyectos: number;
    proyectosBorrador: number;
    proyectosEnRevision: number;
    proyectosAprobados: number;
    proyectosEnEjecucion: number;
    proyectosFinalizados: number;
    totalConvocatoriasAbiertas: number;
    totalInvestigadoresActivos: number;
    totalProductosPeriodo: number;
    articulosIndexados: number;
    prototipos: number;
    ponencias: number;
    presupuestoTotalAsignado: number;
    presupuestoTotalEjecutado: number;
    proyectosPorEstado: EstadoConteo[];
    actividadReciente: ActividadReciente[];
}

export interface GrupoInvestigacion {
    id_grupo: number;
    uuid: string;
    nombre: string;
    siglas: string;
    categoria_consolidacion?: string;
    activo: boolean;
    estado?: string;
    miembros?: any[];
}

// ============================================================================
// 2. COMPLIANCE ESTIMATOR HOOK (CACES ECUADOR STANDARD RULES)
// ============================================================================

const calculateCacesIndicators = (
    projects: ProyectoResumen[],
    stats: DashboardStats | null
) => {
    const totalProyectos = projects.length;
    const totalProductos = stats?.totalProductosPeriodo || projects.reduce((sum, p) => sum + (p.totalProductos || 0), 0);
    const totalInvestigadores = stats?.totalInvestigadoresActivos || projects.reduce((sum, p) => sum + (p.totalInvestigadores || 0), 0);

    // E1.PLAN: Líneas de investigación y grupos alineados al Plan Nacional de Desarrollo (PND)
    const distinctLines = Array.from(new Set(projects.map(p => p.lineaInvestigacion).filter(Boolean)));
    const alignedToPnd = projects.filter(p => p.objetivoPnd).length;
    const planProgress = totalProyectos > 0 ? Math.min(100, Math.round((alignedToPnd / totalProyectos) * 100)) : 0;

    // E2.PROD: Tasa de Publicación por Docente (Meta: 0.5 por investigador)
    const prodTarget = Math.max(1, Math.ceil(totalInvestigadores * 0.5));
    const prodProgress = Math.min(100, Math.round((totalProductos / prodTarget) * 100)) || 0;

    // E3.INNO: Innovación / Transferencia Tecnológica (Meta: 15% de proyectos con TRL >= 5 o empresas aliadas)
    const activeProjects = projects.filter(p => p.estado === 'En Ejecución' || p.estado === 'Aprobado' || p.estado === 'Finalizado');
    const innoTarget = Math.max(1, Math.ceil(activeProjects.length * 0.15));
    const highTrlOrLinkedProjects = activeProjects.filter(p => (p.trlActual || 0) >= 5 || p.entidadAliada).length;
    const innoProgress = Math.min(100, Math.round((highTrlOrLinkedProjects / innoTarget) * 100)) || 0;

    // E4.STUD: Vinculación Formativa / Semilleros (Meta: 30% de proyectos con estudiantes semilleristas activos)
    const studentTarget = Math.max(1, Math.ceil(totalProyectos * 0.3));
    const projectsWithStudents = projects.filter(p => (p.totalEstudiantes || 0) > 0).length;
    const studProgress = Math.min(100, Math.round((projectsWithStudents / studentTarget) * 100)) || 0;

    // E5.BUDG: Eficiencia y Ejecución Presupuestaria (Meta: >= 75% de ejecución sobre lo asignado)
    const budgetTotal = projects.reduce((sum, p) => sum + (p.presupuestoTotal || 0), 0);
    const budgetExecuted = projects.reduce((sum, p) => sum + (p.presupuestoEjecutado || 0), 0);
    const budgetProgress = budgetTotal > 0 ? Math.min(100, Math.round((budgetExecuted / budgetTotal) * 100)) : 0;

    return [
        {
            code: 'E1.PLAN',
            name: 'Alineación PND y POA',
            description: 'Líneas y sublíneas de investigación vigentes integradas en el POA y alineadas con los Objetivos del Plan Nacional de Desarrollo.',
            status: planProgress >= 80 ? 'CUMPLIDO' : planProgress >= 50 ? 'EN PROCESO' : 'ALERTA',
            progress: planProgress,
            metaLabel: `${alignedToPnd} de ${totalProyectos} Proyectos Aligerados al PND`,
            currentLabel: `${distinctLines.length} Líneas Activas`
        },
        {
            code: 'E2.PROD',
            name: 'Producción Científica del Claustro',
            description: 'Artículos en revistas indexadas (Latindex, Scopus) y ponencias en eventos académicos. Meta: 0.5 publicaciones por docente.',
            status: prodProgress >= 100 ? 'CUMPLIDO' : prodProgress >= 50 ? 'EN PROCESO' : 'ALERTA',
            progress: prodProgress,
            metaLabel: `Meta: ${prodTarget} Productos`,
            currentLabel: `${totalProductos} Productos Registrados`
        },
        {
            code: 'E3.INNO',
            name: 'Innovación y Transferencia Tecnológica',
            description: 'Proyectos vinculados a empresas (convenios) orientados al prototipado o maduración tecnológica (TRL 5 a TRL 7).',
            status: innoProgress >= 100 ? 'CUMPLIDO' : innoProgress >= 50 ? 'EN PROCESO' : 'ALERTA',
            progress: innoProgress,
            metaLabel: `Meta TRL>=5 / Vínculo: ${innoTarget} Proys`,
            currentLabel: `${highTrlOrLinkedProjects} Prototipos / Convenios Activos`
        },
        {
            code: 'E4.STUD',
            name: 'Vinculación Formativa (Semilleros)',
            description: 'Participación activa de estudiantes de tecnologías en semilleros de investigación y co-redacción formativa de artículos.',
            status: studProgress >= 100 ? 'CUMPLIDO' : studProgress >= 50 ? 'EN PROCESO' : 'ALERTA',
            progress: studProgress,
            metaLabel: `Meta: ${studentTarget} Proyectos con Alumnos`,
            currentLabel: `${projectsWithStudents} Proyectos con Semilleristas`
        },
        {
            code: 'E5.BUDG',
            name: 'Ejecución Presupuestaria',
            description: 'Eficiencia en el gasto de fondos de investigación asignados. Evaluado bajo auditoría anual del CACES.',
            status: budgetProgress >= 75 ? 'CUMPLIDO' : budgetProgress >= 40 ? 'EN PROCESO' : 'ALERTA',
            progress: budgetProgress,
            metaLabel: `Meta de Ejecución: >= 75%`,
            currentLabel: `Tasa de Gasto: ${budgetProgress}%`
        }
    ] as const;
};

// ============================================================================
// 3. ARCHITECTURE: CLIENT STATE & API ORCHESTRATION HOOK
// ============================================================================

const useAnalyticsData = (period: string, carrera: string) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [projects, setProjects] = useState<ProyectoResumen[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [groups, setGroups] = useState<GrupoInvestigacion[]>([]);
    const [allCareers, setAllCareers] = useState<any[]>([]);

    const loadData = async () => {
        setRefreshing(true);
        try {
            const [projectsRes, statsRes, groupsRes, careersRes] = await Promise.all([
                api.get('/projects'),
                api.get('/projects/stats'),
                api.get('/groups'),
                api.get('/catalogs/carreras')
            ]);

            if (projectsRes.data) setProjects(projectsRes.data);
            if (statsRes.data) setStats(statsRes.data);
            if (groupsRes.data) setGroups(groupsRes.data);
            if (careersRes.data) setAllCareers(careersRes.data);

        } catch (error) {
            console.error("[Analytics System API Error]", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ── PROCESAMIENTO REACTIVO DE CORTE (FILTROS) ──
    const processed = useMemo(() => {
        // 1. Filtrar proyectos por periodo y carrera
        const filteredProjects = projects.filter(p => {
            const matchesPeriod = period === 'TODOS' || 
                (p.convocatoriaTitulo && p.convocatoriaTitulo.toLowerCase().includes(period.toLowerCase()));
            
            const matchesCarrera = carrera === 'TODAS' || 
                (p.carrera && p.carrera.toUpperCase() === carrera.toUpperCase());

            return matchesPeriod && matchesCarrera;
        });

        // 2. Recalcular las líneas de investigación prioritarias del corte
        const linesMap: Record<string, { proyectos: number; pres: number }> = {};
        filteredProjects.forEach(p => {
            const line = p.lineaInvestigacion || "Línea General / No Asignada";
            if (!linesMap[line]) linesMap[line] = { proyectos: 0, pres: 0 };
            linesMap[line].proyectos += 1;
            linesMap[line].pres += p.presupuestoTotal || 0;
        });

        const colors = ["bg-brand", "bg-purple-500", "bg-amber-500", "bg-emerald-500", "bg-red-500", "bg-indigo-500"];
        const linesData = Object.entries(linesMap).map(([nombre, val], idx) => ({
            nombre,
            proyectos: val.proyectos,
            pres: val.pres,
            pct: (val.proyectos / (filteredProjects.length || 1)) * 100,
            colorClass: colors[idx % colors.length]
        })).sort((a, b) => b.proyectos - a.proyectos);

        // 3. Recalcular la distribución por estado del corte
        const stateColors: Record<string, string> = {
            "Borrador": "#6B7280",
            "Enviado": "#3B82F6",
            "En Revisión": "#F59E0B",
            "Aprobado": "#10B981",
            "En Ejecución": "#8B5CF6",
            "Finalizado": "#059669",
            "Rechazado": "#EF4444"
        };
        const counts: Record<string, number> = {};
        filteredProjects.forEach(p => {
            counts[p.estado] = (counts[p.estado] || 0) + 1;
        });
        const proyectosPorEstado = Object.entries(counts).map(([estado, cantidad]) => ({
            estado,
            cantidad,
            color: stateColors[estado] || "#6B7280"
        }));

        // 4. Calcular presupuesto acumulado
        const budgetTotal = filteredProjects.reduce((sum, p) => sum + (p.presupuestoTotal || 0), 0);
        const budgetExecuted = filteredProjects.reduce((sum, p) => sum + (p.presupuestoEjecutado || 0), 0);

        // 5. CACES compliance indicators
        const cacesIndicators = calculateCacesIndicators(filteredProjects, stats);

        // 6. Lista dinámica de periodos disponibles en la BD
        const dbPeriods = Array.from(new Set(
            projects.map(p => {
                // Intentar extraer el código de periodo si existe en el título de la convocatoria
                const match = p.convocatoriaTitulo?.match(/\d{4}-(?:I|II)/i);
                return match ? match[0].toUpperCase() : p.convocatoriaTitulo;
            }).filter(Boolean)
        )) as string[];

        // 7. Lista dinámica de carreras que tienen proyectos en la BD
        const dbCareers = Array.from(new Set(
            projects.map(p => p.carrera).filter(Boolean)
        )) as string[];

        return {
            filteredProjects,
            linesData,
            proyectosPorEstado,
            budgetTotal,
            budgetExecuted,
            cacesIndicators,
            dbPeriods,
            dbCareers
        };

    }, [projects, stats, groups, period, carrera]);

    return {
        loading,
        refreshing,
        projects,
        stats,
        groups,
        allCareers,
        processed,
        reload: loadData
    };
};

// ============================================================================
// 4. PRESENTATIONAL COMPONENTS (TYPED)
// ============================================================================

interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    badgeText?: string;
    subText?: string;
    accentColor?: string;
    footerItems?: { label: string; value: string | number; valueColorClass?: string }[];
}

const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    icon,
    badgeText,
    subText,
    accentColor = 'brand',
    footerItems
}) => {
    const badgeClass = {
        brand: 'badge-vercel-info',
        success: 'badge-vercel-success',
        warning: 'badge-vercel-warning',
        violet: 'badge-vercel-violet'
    }[accentColor] || 'badge-vercel-neutral';

    const iconBgClass = {
        brand: 'bg-brand-subtle text-brand',
        success: 'bg-success-subtle text-success',
        warning: 'bg-warning-subtle text-warning',
        violet: 'bg-purple-500/10 text-purple-500'
    }[accentColor] || 'bg-surface-hover text-text-dim';

    return (
        <div className="bento-card p-5 space-y-4 hover:border-border-hover relative overflow-hidden group select-none">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-dim font-mono">{title}</span>
                <span className={`p-2 rounded-lg transition-transform duration-300 group-hover:scale-105 ${iconBgClass}`}>
                    {icon}
                </span>
            </div>
            
            <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tight text-text-main font-sans">{value}</h3>
                {subText && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-text-dim uppercase">
                        {badgeText && (
                            <span className={`badge-vercel ${badgeClass} scale-90 -ml-1`}>
                                {badgeText}
                            </span>
                        )}
                        <span>{subText}</span>
                    </div>
                )}
            </div>

            {footerItems && footerItems.length > 0 && (
                <div className="grid grid-cols-2 gap-2 border-t border-border-thin pt-3 mt-2 text-[10px] font-bold">
                    {footerItems.map((item, idx) => (
                        <div key={idx}>
                            <span className="text-text-dim block text-[8px] uppercase tracking-wide">{item.label}</span>
                            <span className={`font-mono ${item.valueColorClass || 'text-text-main'}`}>{item.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface DonutChartProps {
    elements: EstadoConteo[];
    total: number;
    selectedSegment: string | null;
    setSelectedSegment: (seg: string | null) => void;
}

const DonutChart: React.FC<DonutChartProps> = ({
    elements,
    total,
    selectedSegment,
    setSelectedSegment
}) => {
    let accumulatedPercent = 0;

    return (
        <div className="flex justify-center items-center py-4 relative">
            <svg width="170" height="170" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="var(--border)"
                    strokeWidth="8"
                />
                {elements.map((item, idx) => {
                    const pct = (item.cantidad / (total || 1)) * 100;
                    const strokeDash = `${pct} ${100 - pct}`;
                    const currentOffset = accumulatedPercent;
                    accumulatedPercent += pct;

                    const isSelected = selectedSegment === item.estado;

                    return (
                        <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth={isSelected ? "11" : "8"}
                            strokeDasharray={strokeDash}
                            strokeDashoffset={100 - currentOffset}
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setSelectedSegment(item.estado)}
                            onMouseLeave={() => setSelectedSegment(null)}
                            style={{ transformOrigin: '50px 50px' }}
                        />
                    );
                })}
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
                {selectedSegment ? (
                    <>
                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider">
                            {selectedSegment}
                        </span>
                        <span className="text-xl font-black text-text-main font-mono">
                            {elements.find(i => i.estado === selectedSegment)?.cantidad}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-[8px] font-black text-text-dim uppercase tracking-widest">
                            TOTAL
                        </span>
                        <span className="text-2xl font-black text-text-main font-mono">
                            {total}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};

const SkeletonDashboard = () => (
    <div className="space-y-6 animate-pulse select-none">
        <div className="h-28 bg-surface-hover/30 rounded-2xl border border-border-thin p-5 flex flex-col justify-between">
            <div className="w-1/4 h-3 bg-border-thin/40 rounded"></div>
            <div className="w-2/3 h-6 bg-border-thin/40 rounded mt-2"></div>
            <div className="w-1/2 h-3 bg-border-thin/40 rounded mt-2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 bg-surface-hover/30 border border-border-thin rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="w-20 h-2 bg-border-thin/40 rounded"></div>
                        <div className="w-6 h-6 bg-border-thin/40 rounded-lg"></div>
                    </div>
                    <div className="w-14 h-8 bg-border-thin/40 rounded"></div>
                    <div className="w-24 h-3 bg-border-thin/40 rounded"></div>
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-surface-hover/30 border border-border-thin rounded-2xl lg:col-span-1"></div>
            <div className="h-96 bg-surface-hover/30 border border-border-thin rounded-2xl lg:col-span-2"></div>
        </div>
    </div>
);

// ============================================================================
// 5. MAIN COMPONENT (ARCHITECT STYLES INTEGRATION)
// ============================================================================

const AnalyticsPage = () => {
    const [period, setPeriod] = useState('TODOS');
    const [carrera, setCarrera] = useState('TODAS');
    const [activeTab, setActiveTab] = useState<'general' | 'caces' | 'productos'>('general');
    const [selectedChartSegment, setSelectedChartSegment] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const { loading, refreshing, projects, stats, groups, processed, reload } = useAnalyticsData(period, carrera);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val);
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
<main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto relative overflow-hidden space-y-6 pb-12 select-none">
                <SkeletonDashboard />
            </main>
        );
    }

    const {
        filteredProjects,
        linesData,
        proyectosPorEstado,
        budgetTotal,
        budgetExecuted,
        cacesIndicators,
        dbPeriods,
        dbCareers
    } = processed;

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto relative overflow-hidden space-y-6 pb-12 select-none">
            {/* Cabecera Principal */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-thin pb-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="badge-vercel badge-vercel-info">
                            <span className="dot dot-info dot-pulse" />
                            CACES Acreditación
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand font-mono">Quito, Ecuador</span>
                    </div>
                    <h1 id="analytics-main-title" className="text-2xl font-black tracking-tight text-text-main font-sans">
                        Analíticas de Investigación e Innovación
                    </h1>
                    <p className="text-xs text-text-dim max-w-2xl leading-relaxed font-medium">
                        Consola directiva en tiempo real del <strong className="text-text-main font-semibold">IST Traversari</strong>. Sincronización inmutable de proyectos y cumplimiento de estándares del CACES.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={reload}
                        disabled={refreshing}
                        className="btn-vercel-secondary !p-2.5 h-10 w-10"
                        title="Sincronizar base de datos en tiempo real"
                        id="refresh-analytics-btn"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={async () => {
                            setExporting(true);
                            setExportError(null);
                            try {
                                await reportService.downloadAnalyticsReport(period, carrera);
                            } catch (err: any) {
                                console.error('[Analytics] Error exporting PDF:', err);
                                setExportError(err?.response?.data?.error || err?.message || 'Error al generar el reporte');
                                setTimeout(() => setExportError(null), 5000);
                            } finally {
                                setExporting(false);
                            }
                        }}
                        disabled={exporting}
                        className="btn-vercel-primary flex items-center gap-2 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        id="export-pdf-report-btn"
                    >
                        {exporting ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : (
                            <Download size={13} />
                        )}
                        <span>{exporting ? 'Generando...' : 'Exportar PDF'}</span>
                    </button>
                    {exportError && (
                        <p className="text-[10px] text-red-400 font-medium mt-1">{exportError}</p>
                    )}
                </div>
            </header>

            {/* Panel de Filtros Bento */}
            <div className="bento-card static p-4 flex flex-wrap items-center justify-between gap-4 bg-surface/40 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Filter size={13} className="text-text-dim" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-main">Variables de Corte:</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Select Periodo */}
                    <div className="relative group">
                        <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="input-vercel !pl-8 !pr-7 !py-1.5 text-[10px] font-black uppercase tracking-wider bg-bg-deep cursor-pointer focus:border-text-main"
                            id="period-filter-select"
                        >
                            <option value="TODOS">Todos los Periodos</option>
                            {dbPeriods.map((p, idx) => (
                                <option key={idx} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    {/* Select Carrera */}
                    <div className="relative group">
                        <Building2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                        <select
                            value={carrera}
                            onChange={(e) => setCarrera(e.target.value)}
                            className="input-vercel !pl-8 !pr-7 !py-1.5 text-[10px] font-black uppercase tracking-wider bg-bg-deep cursor-pointer focus:border-text-main"
                            id="carrera-filter-select"
                        >
                            <option value="TODAS">Todas las Tecnologías</option>
                            {dbCareers.map((c, idx) => (
                                <option key={idx} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Navegación por Pestañas */}
            <div className="tabs-vercel">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`tab-vercel-item ${activeTab === 'general' ? 'active' : ''} text-[10px] font-black uppercase tracking-widest`}
                    id="tab-general"
                >
                    Métricas de I+D
                </button>
                <button
                    onClick={() => setActiveTab('caces')}
                    className={`tab-vercel-item ${activeTab === 'caces' ? 'active' : ''} text-[10px] font-black uppercase tracking-widest`}
                    id="tab-caces"
                >
                    Cumplimiento CACES
                </button>
                <button
                    onClick={() => setActiveTab('productos')}
                    className={`tab-vercel-item ${activeTab === 'productos' ? 'active' : ''} text-[10px] font-black uppercase tracking-widest`}
                    id="tab-productos"
                >
                    Proyectos y Producción
                </button>
            </div>

            {/* ZONA DE PROYECTOS VACÍOS (EMPTY STATE EXTREMO PREMIUM) */}
            {filteredProjects.length === 0 ? (
                <div className="bento-card static p-16 text-center space-y-4 flex flex-col items-center justify-center bg-surface/20">
                    <div className="p-4 bg-surface rounded-full border border-border-thin">
                        <FolderOpen size={32} className="text-text-dim/60" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-text-main uppercase tracking-wider">Sin registros en el corte</h3>
                        <p className="text-xs text-text-dim max-w-sm leading-relaxed">
                            No se encontraron proyectos de investigación registrados en el sistema para el periodo o carrera seleccionada.
                        </p>
                    </div>
                    <button
                        onClick={() => { setPeriod('TODOS'); setCarrera('TODAS'); }}
                        className="btn-vercel-secondary text-[9px]"
                    >
                        Restablecer Filtros
                    </button>
                </div>
            ) : (
                <>
                    {activeTab === 'general' && (
                        <>
                            {/* Bento Grid: KPIs Principales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <KPICard
                                    title="Proyectos de Investigación"
                                    value={filteredProjects.length}
                                    icon={<BarChart3 size={14} />}
                                    accentColor="brand"
                                    subText="Portafolio del corte"
                                    badgeText={`Total: ${projects.length}`}
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
                                        { label: 'Artículos Indexados', value: stats?.articulosIndexados || 0, valueColorClass: 'text-success' },
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
                                        { label: 'Ejecutado', value: formatCurrency(budgetExecuted), valueColorClass: 'text-warning' },
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
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Estado Donut Chart */}
                                <div className="bento-card static p-5 flex flex-col justify-between h-[360px]">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-text-dim">Estado de Proyectos</h4>
                                            <PieChart size={13} className="text-brand" />
                                        </div>
                                        <p className="text-xs text-text-dim mt-1 font-medium">Estado del portafolio actual</p>
                                    </div>

                                    <DonutChart
                                        elements={proyectosPorEstado}
                                        total={filteredProjects.length}
                                        selectedSegment={selectedChartSegment}
                                        setSelectedSegment={setSelectedChartSegment}
                                    />

                                    {/* Leyenda */}
                                    <div className="grid grid-cols-2 gap-1 text-[9px] font-bold border-t border-border-thin pt-3.5">
                                        {proyectosPorEstado.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center gap-1.5 p-1 rounded transition-colors cursor-pointer ${
                                                    selectedChartSegment === item.estado ? 'bg-surface-hover' : ''
                                                }`}
                                                onMouseEnter={() => setSelectedChartSegment(item.estado)}
                                                onMouseLeave={() => setSelectedChartSegment(null)}
                                            >
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                <span className="text-text-dim truncate">{item.estado}</span>
                                                <span className="ml-auto text-text-main font-mono">{item.cantidad}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Líneas de Investigación */}
                                <div className="bento-card static p-5 lg:col-span-2 flex flex-col justify-between h-[360px]">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-text-dim">
                                                Distribución por Línea de Investigación
                                            </h4>
                                            <TrendingUp size={13} className="text-emerald-500" />
                                        </div>
                                        <p className="text-xs text-text-dim mt-1 font-medium">Proyectos asociados a líneas oficiales del instituto</p>
                                    </div>

                                    <div className="space-y-2.5 flex-1 justify-center flex flex-col overflow-y-auto custom-scrollbar pr-1">
                                        {linesData.length === 0 ? (
                                            <span className="text-text-dim text-[10px] text-center font-bold block py-10 uppercase">
                                                Sin líneas vinculadas
                                            </span>
                                        ) : (
                                            linesData.map((line, idx) => (
                                                <div key={idx} className="space-y-1 p-2.5 bg-bg-deep/30 border border-border-thin rounded-xl hover:border-border-hover transition-all">
                                                    <div className="flex justify-between items-start text-[9.5px] font-bold">
                                                        <span className="text-text-main max-w-[80%] truncate leading-normal" title={line.nombre}>
                                                            {line.nombre}
                                                        </span>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-text-main font-mono block">{line.proyectos} Proyectos</span>
                                                            <span className="text-text-dim font-mono text-[8px] block">{formatCurrency(line.pres)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-border-thin/35 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-700 rounded-full ${line.colorClass}`}
                                                            style={{ width: `${line.pct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bitácora y Estado del Repositorio */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Actividad */}
                                <div className="bento-card static p-5 lg:col-span-2 space-y-4">
                                    <div>
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-text-dim">Bitácora Técnica de Investigación</h4>
                                        <p className="text-xs text-text-dim mt-1 font-medium">Historial reciente de auditoría de proyectos y entregables</p>
                                    </div>

                                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                        {stats?.actividadReciente && stats.actividadReciente.length > 0 ? (
                                            stats.actividadReciente.map((act, i) => (
                                                <div key={act.uuid || i} className="flex items-center gap-3 p-2.5 bg-surface/50 border border-border-thin rounded-xl hover:border-border-hover transition-all">
                                                    <span className={`p-2 rounded-lg shrink-0 ${
                                                        act.tipo === 'proyecto'
                                                            ? 'bg-brand-subtle text-brand'
                                                            : act.tipo === 'producto'
                                                                ? 'bg-success-subtle text-success'
                                                                : 'bg-warning-subtle text-warning'
                                                    }`}>
                                                        {act.tipo === 'proyecto' ? <Cpu size={13} /> : act.tipo === 'producto' ? <BookOpen size={13} /> : <FileText size={13} />}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-text-main truncate leading-relaxed">
                                                            {act.descripcion}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5 text-[8.5px] text-text-dim font-bold font-mono">
                                                            <span className="uppercase">{act.tipo}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(act.fecha)}</span>
                                                            {act.estado && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className={`px-1.5 py-0.5 rounded-full text-[7.5px] ${
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
                                            <span className="text-[10px] text-text-dim uppercase font-bold block text-center py-10">
                                                Sin actividad registrada
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Integraciones */}
                                <div className="bento-card static p-5 lg:col-span-1 flex flex-col justify-between gap-4 bg-gradient-to-b from-surface to-brand/5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-brand">
                                            <Globe size={14} />
                                            <h4 className="text-[9px] font-black uppercase tracking-widest">Servicios Conectados</h4>
                                        </div>
                                        <h3 className="text-sm font-black text-text-main">Preservación Digital DSpace</h3>
                                        <p className="text-xs text-text-dim leading-relaxed font-medium">
                                            Sincronización automatizada de metadatos firmados con el repositorio abierto del instituto. Se garantiza el resguardo digital permanente bajo las directrices del CACES.
                                        </p>
                                    </div>

                                    <div className="p-3.5 bg-bg-deep/80 border border-border-thin rounded-2xl space-y-2 text-[9.5px] font-bold font-mono">
                                        <div className="flex items-center justify-between">
                                            <span className="text-text-dim uppercase">Servidor DSpace</span>
                                            <span className="text-success flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                                ONLINE
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-text-dim uppercase">SSO Institucional</span>
                                            <span className="text-success flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                                ONLINE
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-text-dim uppercase">Firma Avanzada</span>
                                            <span className="text-success flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                                READY
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => alert("Redireccionando al portal del Repositorio Abierto del IST Traversari...")}
                                        className="btn-vercel-secondary w-full flex items-center justify-between group text-[9.5px]"
                                        id="dspace-redirect-btn"
                                    >
                                        <span>Ver Repositorio Abierto</span>
                                        <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'caces' && (
                        <div className="space-y-6">
                            {/* Alerta CACES */}
                            <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl flex items-start gap-3">
                                <AlertCircle size={16} className="text-brand mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black uppercase text-brand tracking-widest">Modelos de Evaluación del CACES</h4>
                                    <p className="text-xs text-text-dim leading-relaxed font-medium">
                                        Análisis dinámico de cumplimiento de estándares del Consejo de Aseguramiento de la Calidad de la Educación Superior (CACES) calculados a partir de los datos en tiempo real del sistema.
                                    </p>
                                </div>
                            </div>

                            {/* Tarjetas CACES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {cacesIndicators.map((ind, i) => {
                                    const badge = {
                                        CUMPLIDO: 'badge-vercel-success',
                                        'EN PROCESO': 'badge-vercel-warning',
                                        ALERTA: 'badge-vercel-error'
                                    }[ind.status] || 'badge-vercel-neutral';

                                    const borderHover = {
                                        CUMPLIDO: 'hover:border-success/30',
                                        'EN PROCESO': 'hover:border-warning/30',
                                        ALERTA: 'hover:border-error/30'
                                    }[ind.status] || 'hover:border-border-hover';

                                    const barColor = {
                                        CUMPLIDO: 'bg-success',
                                        'EN PROCESO': 'bg-warning',
                                        ALERTA: 'bg-error'
                                    }[ind.status] || 'bg-text-dim';

                                    return (
                                        <div key={i} className={`bento-card static p-5 space-y-4 hover:bg-surface-hover/20 transition-all ${borderHover}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-text-dim font-mono">
                                                    Estándar: {ind.code}
                                                </span>
                                                <span className={`badge-vercel ${badge}`}>{ind.status}</span>
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-black text-text-main leading-tight">{ind.name}</h3>
                                                <p className="text-xs text-text-dim leading-relaxed font-medium">{ind.description}</p>
                                            </div>

                                            <div className="space-y-2 border-t border-border-thin pt-3.5">
                                                <div className="w-full bg-border-thin/30 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-700 rounded-full ${barColor}`}
                                                        style={{ width: `${ind.progress}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex items-center justify-between text-[9px] font-bold font-mono text-text-dim">
                                                    <span>Cumplimiento: {ind.progress}%</span>
                                                    <span>{ind.metaLabel}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'productos' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Tabla de Proyectos y Productos Reales de la BD */}
                                <div className="bento-card static p-5 lg:col-span-2 space-y-4">
                                    <div>
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-text-dim">Portafolio de Proyectos y Productos de I+D</h4>
                                        <p className="text-xs text-text-dim mt-1 font-medium">Lista de proyectos registrados en base de datos con sus respectivos indicadores</p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-border-thin text-[8.5px] uppercase tracking-wider text-text-dim font-bold">
                                                    <th className="pb-3">Código / Proyecto</th>
                                                    <th className="pb-3">Línea de Investigación</th>
                                                    <th className="pb-3">Presupuesto</th>
                                                    <th className="pb-3 text-center">Alumnos</th>
                                                    <th className="pb-3 text-center">Productos</th>
                                                    <th className="pb-3 text-right">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-thin/30 font-medium">
                                                {filteredProjects.map((proj, idx) => (
                                                    <tr key={proj.uuid || idx} className="hover:bg-surface-hover/20 transition-colors">
                                                        <td className="py-3 pr-3">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span className="text-[9.5px] font-black text-brand uppercase tracking-wider font-mono">
                                                                    {proj.codigoInstitucional || `PROY-${proj.uuid.substring(0, 5).toUpperCase()}`}
                                                                </span>
                                                                {proj.entidadAliada && (
                                                                    <span className="text-[7px] font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 uppercase" title={`Empresa Aliada: ${proj.entidadAliada}`}>
                                                                        Co-Ejecutor
                                                                    </span>
                                                                )}
                                                                {proj.objetivoPnd && (
                                                                    <span className="text-[7px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase" title={`Plan Nacional de Desarrollo: ${proj.objetivoPnd}`}>
                                                                        PND
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-text-main text-xs block font-sans truncate max-w-[200px]" title={proj.titulo}>
                                                                {proj.titulo}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-text-dim text-[10px] max-w-[150px] truncate pr-2" title={proj.lineaInvestigacion || 'No Asignada'}>
                                                            {proj.lineaInvestigacion || 'General'}
                                                        </td>
                                                        <td className="py-3 font-mono text-text-main text-[10px]">
                                                            {proj.presupuestoTotal ? formatCurrency(proj.presupuestoTotal) : '$0.00'}
                                                        </td>
                                                        <td className="py-3 text-center font-mono font-bold text-text-main">
                                                            {proj.totalEstudiantes || 0}
                                                        </td>
                                                        <td className="py-3 text-center font-mono font-bold text-text-main">
                                                            {proj.totalProductos}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                                                                proj.estado === 'Aprobado' || proj.estado === 'En Ejecución'
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                            }`}>
                                                                {proj.estado}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Resumen del Claustro */}
                                <div className="bento-card static p-5 lg:col-span-1 flex flex-col justify-between gap-4">
                                    <div>
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-text-dim">Métricas de Participación</h4>
                                        <p className="text-xs text-text-dim mt-1 font-medium">Porcentaje de vinculación del cuerpo académico</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[9px] font-bold">
                                                <span className="text-text-dim uppercase">Docentes Vinculados</span>
                                                <span className="text-text-main">
                                                    {stats?.totalInvestigadoresActivos || 0} Activos
                                                </span>
                                            </div>
                                            <div className="w-full bg-border-thin/35 h-1.5 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, ((stats?.totalInvestigadoresActivos || 0) / 25) * 100)}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[9px] font-bold">
                                                <span className="text-text-dim uppercase">Grupos Consolidados</span>
                                                <span className="text-text-main">
                                                    {groups.filter(g => g.categoria_consolidacion === 'Consolidado').length} de {groups.length}
                                                </span>
                                            </div>
                                            <div className="w-full bg-border-thin/35 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-purple-500 rounded-full" 
                                                    style={{ width: `${Math.min(100, ((groups.filter(g => g.categoria_consolidacion === 'Consolidado').length / (groups.length || 1)) * 100))}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[9px] font-bold">
                                                <span className="text-text-dim uppercase">Estudios de Vinculación</span>
                                                <span className="text-text-main">
                                                    {filteredProjects.filter(p => p.totalInvestigadores > 1).length} Proyectos
                                                </span>
                                            </div>
                                            <div className="w-full bg-border-thin/35 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full" 
                                                    style={{ width: `${Math.min(100, ((filteredProjects.filter(p => p.totalInvestigadores > 1).length / (filteredProjects.length || 1)) * 100))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-border-thin pt-4 text-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-brand block mb-1">Crecimiento Global</span>
                                        <p className="text-xs text-text-main font-semibold leading-relaxed">
                                            El IST Traversari mantiene un portafolio activo sincronizado con inmutabilidad SHA-256.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
    );
};

export default AnalyticsPage;
