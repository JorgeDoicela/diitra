import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart3, PieChart, TrendingUp, DollarSign, Users,
    Clock, ArrowUpRight, BookOpen, Cpu, FileText,
    Filter, Globe, Building2, Download, RefreshCw, AlertCircle,
    FolderOpen, Loader2
} from 'lucide-react';
import api from '../../api/axios_config';
import { reportService } from '../../api/reportService';
import { useSearchParams } from 'react-router-dom';

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
        brand: 'bg-brand-subtle text-brand border border-brand/10',
        success: 'bg-success-subtle text-success border border-success/10',
        warning: 'bg-warning-subtle text-warning border border-warning/10',
        violet: 'bg-purple-500/10 text-purple-500 border border-purple-500/15'
    }[accentColor] || 'bg-surface-hover text-text-dim border border-border-thin';

    return (
        <div className="bento-card static p-5 space-y-4 relative overflow-hidden group select-none hover:-translate-y-1 hover:shadow-md hover:shadow-brand/5 hover:border-brand/35 transition-all duration-300">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-text-dim font-mono">{title}</span>
                <span className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-105 ${iconBgClass}`}>
                    {icon}
                </span>
            </div>
            
            <div className="space-y-1">
                <h3 className="text-3xl font-semibold tracking-tight text-text-main font-sans">{value}</h3>
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
                <div className="grid grid-cols-2 gap-2 border-t border-border-thin/60 pt-3.5 mt-2 text-[10px] font-bold">
                    {footerItems.map((item, idx) => (
                        <div key={idx}>
                            <span className="text-text-dim block text-[8px] uppercase tracking-wider font-mono">{item.label}</span>
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
                    strokeWidth="5"
                    className="opacity-45"
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
                            strokeWidth={isSelected ? "8" : "5"}
                            strokeDasharray={strokeDash}
                            strokeDashoffset={100 - currentOffset}
                            strokeLinecap="round"
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
                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider font-mono">
                            {selectedSegment}
                        </span>
                        <span className="text-2xl font-black text-text-main font-mono">
                            {elements.find(i => i.estado === selectedSegment)?.cantidad}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-[8px] font-black text-text-dim uppercase tracking-widest font-mono">
                            TOTAL
                        </span>
                        <span className="text-3xl font-black text-text-main font-mono leading-none">
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

const getProjectClassification = (projects: ProyectoResumen[], code: string) => {
    const poor: ProyectoResumen[] = [];
    const warning: ProyectoResumen[] = [];
    const great: ProyectoResumen[] = [];

    projects.forEach(p => {
        if (code === 'E1.PLAN') {
            // Alineación PND y POA
            if (!p.objetivoPnd) {
                poor.push(p);
            } else if (!p.lineaInvestigacion) {
                warning.push(p);
            } else {
                great.push(p);
            }
        } else if (code === 'E2.PROD') {
            // Producción Científica
            if (p.totalProductos === 0) {
                poor.push(p);
            } else if (p.totalProductos === 1) {
                warning.push(p);
            } else {
                great.push(p);
            }
        } else if (code === 'E3.INNO') {
            // Innovación y madurez tecnológica
            const trl = p.trlActual || 0;
            if (trl < 3) {
                poor.push(p);
            } else if (trl < 5 && !p.entidadAliada) {
                warning.push(p);
            } else {
                great.push(p);
            }
        } else if (code === 'E4.STUD') {
            // Vinculación Formativa (Semilleros)
            const students = p.totalEstudiantes || 0;
            if (students === 0) {
                poor.push(p);
            } else if (students === 1) {
                warning.push(p);
            } else {
                great.push(p);
            }
        } else if (code === 'E5.BUDG') {
            // Ejecución Presupuestaria
            const total = p.presupuestoTotal || 0;
            const executed = p.presupuestoEjecutado || 0;
            const pct = total > 0 ? (executed / total) * 100 : 0;
            if (pct < 40) {
                poor.push(p);
            } else if (pct < 75) {
                warning.push(p);
            } else {
                great.push(p);
            }
        } else {
            great.push(p);
        }
    });

    return { poor, warning, great };
};

const AnalyticsPage = () => {
    const [period, setPeriod] = useState('TODOS');
    const [carrera, setCarrera] = useState('TODAS');
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const activeTab = (tabParam === 'general' || tabParam === 'caces' || tabParam === 'productos') ? tabParam : 'general';
    
    const setActiveTab = (tab: 'general' | 'caces' | 'productos') => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    };
    const [selectedChartSegment, setSelectedChartSegment] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [activeCacesCode, setActiveCacesCode] = useState<string>('E1.PLAN');
    const [activeProjectUuid, setActiveProjectUuid] = useState<string | null>(null);

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
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-brand font-mono">Quito, Ecuador</span>
                    </div>
                    <h1 id="analytics-main-title" className="text-2xl font-semibold tracking-tight text-text-main font-sans">
                        Analíticas de Investigación e Innovación
                    </h1>
                    <p className="text-xs text-text-dim max-w-2xl leading-relaxed font-medium">
                        Consola directiva en tiempo real del <strong className="text-text-main font-semibold">IST Traversari</strong>. Seguimiento actualizado de proyectos y cumplimiento de estándares del CACES.
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
                        <h3 className="text-sm font-semibold text-text-main tracking-tight">Sin registros en el corte</h3>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
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
                                                    <BookOpen size={11} />,
                                                    <Cpu size={11} />,
                                                    <TrendingUp size={11} />,
                                                    <Users size={11} />,
                                                    <DollarSign size={11} />,
                                                    <Globe size={11} />
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
                    )}

                    {activeTab === 'caces' && (
                        <div className="space-y-6 animate-fade-up">
                            <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl flex items-start gap-3">
                                <AlertCircle size={16} className="text-brand mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-semibold uppercase text-brand tracking-widest">Modelos de Evaluación del CACES</h4>
                                    <p className="text-xs text-text-dim leading-relaxed font-medium">
                                        Análisis dinámico de cumplimiento de estándares del Consejo de Aseguramiento de la Calidad de la Educación Superior (CACES) calculados a partir de los datos en tiempo real del sistema.
                                    </p>
                                </div>
                            </div>

                            {/* Vercel Speed Insights Style Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                                
                                {/* Menú Lateral Izquierdo: Lista de Estándares (Filtros del Mockup) */}
                                <div className="space-y-2 lg:col-span-1">
                                    <span className="text-[9px] font-medium uppercase tracking-widest text-text-dim block mb-3 pl-1 font-mono">
                                        Estándares de Evaluación
                                    </span>
                                    {cacesIndicators.map((ind) => {
                                        const isActive = activeCacesCode === ind.code;
                                        const barColor = {
                                            CUMPLIDO: 'bg-success',
                                            'EN PROCESO': 'bg-warning',
                                            ALERTA: 'bg-error'
                                        }[ind.status] || 'bg-text-dim';

                                        const badgeColor = {
                                            CUMPLIDO: 'text-success bg-success/10 border-success/20',
                                            'EN PROCESO': 'text-warning bg-warning/10 border-warning/20',
                                            ALERTA: 'text-error bg-error/10 border-error/20'
                                        }[ind.status] || 'text-text-dim bg-surface border-border-thin';

                                        return (
                                            <button
                                                key={ind.code}
                                                onClick={() => setActiveCacesCode(ind.code)}
                                                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 select-none group flex flex-col gap-2.5 relative overflow-hidden ${
                                                    isActive 
                                                        ? 'bg-surface border-brand shadow-sm scale-102 z-10' 
                                                        : 'bg-surface/40 hover:bg-surface/80 border-border-thin hover:border-text-dim/30'
                                                }`}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />
                                                )}
                                                <div className="flex items-center justify-between gap-2 w-full">
                                                    <span className="text-[10px] font-medium font-mono text-text-dim">
                                                        {ind.code}
                                                    </span>
                                                    <span className={`text-[8.5px] font-medium px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                                        {ind.progress}%
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <h5 className="text-[11px] font-medium text-text-main group-hover:text-brand transition-colors line-clamp-1">
                                                        {ind.name}
                                                    </h5>
                                                    <div className="w-full bg-border-thin/35 h-1 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${barColor}`} 
                                                            style={{ width: `${ind.progress}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Panel Central de Detalle y Gráficos Visuales (Gráfico del Mockup) */}
                                <div className="lg:col-span-3 bento-card static p-6 flex flex-col justify-between h-auto min-h-[400px] bg-surface border border-border-thin shadow-sm rounded-xl">
                                    {(() => {
                                        const selectedInd = cacesIndicators.find(i => i.code === activeCacesCode) || cacesIndicators[0];
                                        const statusBadge = {
                                            CUMPLIDO: 'badge-vercel-success',
                                            'EN PROCESO': 'badge-vercel-warning',
                                            ALERTA: 'badge-vercel-error'
                                        }[selectedInd.status] || 'badge-vercel-neutral';

                                        const progressColor = {
                                            CUMPLIDO: 'text-success',
                                            'EN PROCESO': 'text-warning',
                                            ALERTA: 'text-error'
                                        }[selectedInd.status] || 'text-brand';

                                        const strokeColor = {
                                            CUMPLIDO: 'var(--success)',
                                            'EN PROCESO': 'var(--warning)',
                                            ALERTA: 'var(--error)'
                                        }[selectedInd.status] || 'var(--brand)';

                                        // Mapeo dinámico de clasificaciones
                                        const { poor, warning, great } = getProjectClassification(filteredProjects, activeCacesCode);
                                        const totalCount = poor.length + warning.length + great.length;

                                        return (
                                            <div className="space-y-6">
                                                {/* Header Detalle */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-thin/50 pb-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-medium font-mono text-brand uppercase tracking-wider">
                                                                Estándar {selectedInd.code}
                                                            </span>
                                                            <span className={`badge-vercel ${statusBadge}`}>
                                                                {selectedInd.status}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-medium text-text-main leading-snug">
                                                            {selectedInd.name}
                                                        </h3>
                                                    </div>
                                                    <div className="text-left sm:text-right shrink-0 bg-bg-deep/50 border border-border-thin px-4 py-2 rounded-xl">
                                                        <span className="text-[8px] font-medium uppercase text-text-dim block tracking-wider">Cumplimiento Global</span>
                                                        <span className={`text-2xl font-medium font-mono ${progressColor}`}>{selectedInd.progress}%</span>
                                                    </div>
                                                </div>

                                                {/* Descripción */}
                                                <p className="text-xs text-text-dim leading-relaxed font-medium">
                                                    {selectedInd.description}
                                                </p>

                                                {/* Gráfico SVG de Cumplimiento (Parámetro Visual del Mockup) */}
                                                <div className="p-5 bg-bg-deep/30 border border-border-thin/40 rounded-2xl flex flex-col md:flex-row items-center justify-around gap-6 select-none animate-fade-up">
                                                    {/* SVG Circular de Cumplimiento */}
                                                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                            <circle
                                                                cx="18"
                                                                cy="18"
                                                                r="15.915"
                                                                className="fill-none"
                                                                stroke="var(--border)"
                                                                strokeWidth="2.5"
                                                            />
                                                            <circle
                                                                cx="18"
                                                                cy="18"
                                                                r="15.915"
                                                                className="fill-none transition-all duration-1000"
                                                                stroke={strokeColor}
                                                                strokeWidth="3.2"
                                                                strokeDasharray={`${selectedInd.progress} ${100 - selectedInd.progress}`}
                                                                strokeDashoffset="0"
                                                                strokeLinecap="round"
                                                            />
                                                        </svg>
                                                        <div className="absolute flex flex-col items-center justify-center text-center">
                                                            <span className="text-[26px] font-medium text-text-main font-mono leading-none">
                                                                {selectedInd.progress}%
                                                            </span>
                                                            <span className="text-[8px] font-medium text-text-dim uppercase tracking-wider mt-1.5">
                                                                META INSTITUCIONAL
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Resumen de Métrica */}
                                                    <div className="space-y-4 max-w-sm w-full font-sans">
                                                        <div className="space-y-1">
                                                            <span className="text-[9px] font-medium text-text-dim uppercase tracking-wider block">Estado de Auditoría</span>
                                                            <p className="text-xs text-text-main font-medium leading-normal">
                                                                {selectedInd.metaLabel}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[9px] font-medium text-text-dim uppercase tracking-wider block">Estadística de Respaldo</span>
                                                            <p className="text-xs text-text-main font-medium leading-normal">
                                                                {selectedInd.currentLabel}
                                                            </p>
                                                        </div>
                                                        <div className="pt-2 border-t border-border-thin flex justify-between items-center text-[10px] font-mono font-medium text-text-dim">
                                                            <span>Total Proyectos Evaluados</span>
                                                            <span className="text-text-main">{totalCount}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        );
                                    })()}
                                </div>

                            </div>

                            {/* Fila Inferior: 3 Columnas Semánticas (El detalle de clasificación Poor / Needs Improvement / Great del Mockup) */}
                            {(() => {
                                const { poor, warning, great } = getProjectClassification(filteredProjects, activeCacesCode);
                                
                                return (
                                    <div className="space-y-3 mt-6 select-none animate-fade-up [animation-delay:150ms]">
                                        <span className="text-[9px] font-medium uppercase tracking-widest text-text-dim pl-1 font-mono block">
                                            Clasificación y Distribución del Portafolio de Proyectos
                                        </span>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            
                                            {/* Columna 1: Critico / Poor (<50 / Alerta) */}
                                            <div className="bento-card static bg-surface border border-border-thin rounded-2xl flex flex-col overflow-hidden min-h-[250px]">
                                                <div className="flex items-center justify-between px-5 py-4 border-b border-border-thin bg-error/5 select-none">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-error" />
                                                        <span className="text-[10px] font-medium text-error uppercase tracking-wider">Crítico / Alerta</span>
                                                    </div>
                                                    <span className="text-[9.5px] font-mono font-medium text-text-dim">
                                                        {poor.length}
                                                    </span>
                                                </div>
                                                <div className="p-4 flex-1 overflow-y-auto max-h-[300px] space-y-3 custom-scrollbar">
                                                    {poor.length === 0 ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
                                                            <p className="text-[10px] text-text-dim italic">No hay proyectos en estado crítico para esta métrica.</p>
                                                        </div>
                                                    ) : (
                                                        poor.map(p => (
                                                            <div key={p.uuid} className="p-3 bg-bg-deep/30 hover:bg-bg-deep/60 border border-border-thin rounded-xl transition-all flex flex-col gap-1.5">
                                                                <span className="text-[9px] font-medium text-brand uppercase tracking-wider font-mono">
                                                                    {p.codigoInstitucional || `PROY-${p.uuid.substring(0, 5).toUpperCase()}`}
                                                                </span>
                                                                <p className="text-[11px] font-medium text-text-main leading-normal line-clamp-2" title={p.titulo}>
                                                                    {p.titulo}
                                                                </p>
                                                                <div className="flex items-center justify-between text-[8px] font-medium text-text-dim uppercase font-mono mt-1 pt-1.5 border-t border-border-thin/40">
                                                                    <span>{p.carrera || 'Tecnología'}</span>
                                                                    <span className="text-error">{p.estado}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Columna 2: En Progreso / Needs Improvement (50-90 / En Proceso) */}
                                            <div className="bento-card static bg-surface border border-border-thin rounded-2xl flex flex-col overflow-hidden min-h-[250px]">
                                                <div className="flex items-center justify-between px-5 py-4 border-b border-border-thin bg-warning/5 select-none">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-warning" />
                                                        <span className="text-[10px] font-medium text-warning uppercase tracking-wider">En Progreso</span>
                                                    </div>
                                                    <span className="text-[9.5px] font-mono font-medium text-text-dim">
                                                        {warning.length}
                                                    </span>
                                                </div>
                                                <div className="p-4 flex-1 overflow-y-auto max-h-[300px] space-y-3 custom-scrollbar">
                                                    {warning.length === 0 ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
                                                            <p className="text-[10px] text-text-dim italic">No hay proyectos intermedios registrados.</p>
                                                        </div>
                                                    ) : (
                                                        warning.map(p => (
                                                            <div key={p.uuid} className="p-3 bg-bg-deep/30 hover:bg-bg-deep/60 border border-border-thin rounded-xl transition-all flex flex-col gap-1.5">
                                                                <span className="text-[9px] font-medium text-brand uppercase tracking-wider font-mono">
                                                                    {p.codigoInstitucional || `PROY-${p.uuid.substring(0, 5).toUpperCase()}`}
                                                                </span>
                                                                <p className="text-[11px] font-medium text-text-main leading-normal line-clamp-2" title={p.titulo}>
                                                                    {p.titulo}
                                                                </p>
                                                                <div className="flex items-center justify-between text-[8px] font-medium text-text-dim uppercase font-mono mt-1 pt-1.5 border-t border-border-thin/40">
                                                                    <span>{p.carrera || 'Tecnología'}</span>
                                                                    <span className="text-warning">{p.estado}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Columna 3: Excelente / Great (>90 / Cumplido) */}
                                            <div className="bento-card static bg-surface border border-border-thin rounded-2xl flex flex-col overflow-hidden min-h-[250px]">
                                                <div className="flex items-center justify-between px-5 py-4 border-b border-border-thin bg-success/5 select-none">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-success" />
                                                        <span className="text-[10px] font-medium text-success uppercase tracking-wider">Excelente</span>
                                                    </div>
                                                    <span className="text-[9.5px] font-mono font-medium text-text-dim">
                                                        {great.length}
                                                    </span>
                                                </div>
                                                <div className="p-4 flex-1 overflow-y-auto max-h-[300px] space-y-3 custom-scrollbar">
                                                    {great.length === 0 ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
                                                            <p className="text-[10px] text-text-dim italic">Ningún proyecto ha alcanzado la excelencia para esta métrica aún.</p>
                                                        </div>
                                                    ) : (
                                                        great.map(p => (
                                                            <div key={p.uuid} className="p-3 bg-bg-deep/30 hover:bg-bg-deep/60 border border-border-thin rounded-xl transition-all flex flex-col gap-1.5">
                                                                <span className="text-[9px] font-medium text-brand uppercase tracking-wider font-mono">
                                                                    {p.codigoInstitucional || `PROY-${p.uuid.substring(0, 5).toUpperCase()}`}
                                                                </span>
                                                                <p className="text-[11px] font-medium text-text-main leading-normal line-clamp-2" title={p.titulo}>
                                                                    {p.titulo}
                                                                </p>
                                                                <div className="flex items-center justify-between text-[8px] font-medium text-text-dim uppercase font-mono mt-1 pt-1.5 border-t border-border-thin/40">
                                                                    <span>{p.carrera || 'Tecnología'}</span>
                                                                    <span className="text-success">{p.estado}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {activeTab === 'productos' && (
                        <div className="space-y-6 animate-fade-up">
                            {/* Layout estilo Vercel de Proyectos e I+D */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                                
                                {/* Menú Lateral Izquierdo: Selector de Proyectos */}
                                <div className="space-y-2 lg:col-span-1 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                                    <span className="text-[9px] font-medium uppercase tracking-widest text-text-dim block mb-3 pl-1 font-mono">
                                        Proyectos en Portafolio
                                    </span>
                                    {filteredProjects.map((p) => {
                                        const isActive = (activeProjectUuid || filteredProjects[0]?.uuid) === p.uuid;
                                        const pctGasto = p.presupuestoTotal && p.presupuestoTotal > 0
                                            ? Math.min(100, Math.round(((p.presupuestoEjecutado || 0) / p.presupuestoTotal) * 100))
                                            : 0;

                                        return (
                                            <button
                                                key={p.uuid}
                                                onClick={() => setActiveProjectUuid(p.uuid)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 select-none group flex flex-col gap-2 relative overflow-hidden ${
                                                    isActive 
                                                        ? 'bg-surface border-brand shadow-sm scale-102 z-10' 
                                                        : 'bg-surface/40 hover:bg-surface/80 border-border-thin hover:border-text-dim/30'
                                                }`}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />
                                                )}
                                                <div className="flex items-center justify-between gap-1 w-full text-[9px] font-medium">
                                                    <span className="font-mono text-brand truncate">
                                                        {p.codigoInstitucional || `PROY-${p.uuid.substring(0, 5).toUpperCase()}`}
                                                    </span>
                                                    <span className="text-text-dim">
                                                        Gasto: {pctGasto}%
                                                    </span>
                                                </div>
                                                <h5 className="text-[10.5px] font-medium text-text-main line-clamp-2 leading-snug group-hover:text-brand transition-colors" title={p.titulo}>
                                                    {p.titulo}
                                                </h5>
                                                <div className="w-full bg-border-thin/35 h-0.5 rounded-full overflow-hidden mt-1">
                                                    <div 
                                                        className="h-full rounded-full bg-brand" 
                                                        style={{ width: `${pctGasto}%` }} 
                                                    />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Panel Central de Detalle del Proyecto Seleccionado */}
                                {(() => {
                                    const selectedProj = filteredProjects.find(p => p.uuid === (activeProjectUuid || filteredProjects[0]?.uuid)) || filteredProjects[0];
                                    if (!selectedProj) return null;

                                    const pctGasto = selectedProj.presupuestoTotal && selectedProj.presupuestoTotal > 0
                                        ? Math.min(100, Math.round(((selectedProj.presupuestoEjecutado || 0) / selectedProj.presupuestoTotal) * 100))
                                        : 0;

                                    return (
                                        <div className="lg:col-span-3 bento-card static p-6 flex flex-col justify-between h-auto min-h-[400px] bg-surface border border-border-thin shadow-sm rounded-xl space-y-6">
                                            {/* Header Proyecto */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-thin/50 pb-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="text-[10px] font-semibold font-mono text-brand uppercase tracking-wider">
                                                            {selectedProj.codigoInstitucional || `PROY-${selectedProj.uuid.substring(0, 5).toUpperCase()}`}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                                                            selectedProj.estado === 'Aprobado' || selectedProj.estado === 'En Ejecución'
                                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                            {selectedProj.estado}
                                                        </span>
                                                        {selectedProj.entidadAliada && (
                                                            <span className="text-[8px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase">
                                                                Co-Ejecutor
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-base font-semibold text-text-main leading-snug">
                                                        {selectedProj.titulo}
                                                    </h3>
                                                </div>
                                                <div className="text-left sm:text-right shrink-0 bg-bg-deep/50 border border-border-thin px-4 py-2.5 rounded-xl">
                                                    <span className="text-[8px] font-medium uppercase text-text-dim block tracking-wider">Presupuesto Asignado</span>
                                                    <span className="text-xl font-semibold font-mono text-text-main">{formatCurrency(selectedProj.presupuestoTotal || 0)}</span>
                                                </div>
                                            </div>

                                            {/* Fila Detalle KPIs */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-bg-deep/20 border border-border-thin/40 rounded-2xl select-none">
                                                <div>
                                                    <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Gasto Ejecutado</span>
                                                    <span className="text-xs font-bold font-mono text-text-main block mt-0.5">{formatCurrency(selectedProj.presupuestoEjecutado || 0)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Semilleristas (Alumnos)</span>
                                                    <span className="text-xs font-bold font-mono text-text-main block mt-0.5">{selectedProj.totalEstudiantes || 0} estudiantes</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Productos Científicos</span>
                                                    <span className="text-xs font-bold font-mono text-success block mt-0.5">{selectedProj.totalProductos || 0} registrados</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Nivel TRL Actual</span>
                                                    <span className="text-xs font-bold font-mono text-purple-400 block mt-0.5">TRL {selectedProj.trlActual || 1} / meta: TRL {selectedProj.trlMeta || 9}</span>
                                                </div>
                                            </div>

                                            {/* Visual Progress Scale (Mockup Chart styling) */}
                                            <div className="p-5 bg-bg-deep/30 border border-border-thin/40 rounded-2xl flex flex-col sm:flex-row items-center justify-around gap-6 select-none animate-fade-up">
                                                {/* Circular Gasto Progress */}
                                                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                        <circle
                                                            cx="18"
                                                            cy="18"
                                                            r="15.915"
                                                            className="fill-none"
                                                            stroke="var(--border)"
                                                            strokeWidth="2"
                                                        />
                                                        <circle
                                                            cx="18"
                                                            cy="18"
                                                            r="15.915"
                                                            className="fill-none transition-all duration-1000"
                                                            stroke="var(--brand)"
                                                            strokeWidth="2.8"
                                                            strokeDasharray={`${pctGasto} ${100 - pctGasto}`}
                                                            strokeDashoffset="0"
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <div className="absolute flex flex-col items-center justify-center text-center">
                                                        <span className="text-xl font-black text-text-main font-mono leading-none">
                                                            {pctGasto}%
                                                        </span>
                                                        <span className="text-[7.5px] font-black text-text-dim uppercase tracking-wider mt-1">
                                                            GASTO REALIZADO
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Línea de Investigación de Respaldo */}
                                                <div className="space-y-3.5 flex-1 max-w-md w-full">
                                                    <div className="space-y-0.5">
                                                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Línea de Investigación</span>
                                                        <p className="text-xs text-text-main font-semibold leading-normal truncate" title={selectedProj.lineaInvestigacion || 'General'}>
                                                            {selectedProj.lineaInvestigacion || 'Línea de Investigación General / Institucional'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Convocatoria de Origen</span>
                                                        <p className="text-xs text-text-main font-semibold leading-normal truncate" title={selectedProj.convocatoriaTitulo || 'General'}>
                                                            {selectedProj.convocatoriaTitulo || 'Sin convocatoria asignada'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Vinculación Plan Nacional (PND)</span>
                                                        <p className="text-xs text-text-main font-semibold leading-normal truncate" title={selectedProj.objetivoPnd || 'No requerido'}>
                                                            {selectedProj.objetivoPnd || 'No requerido para este tipo de proyecto'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Fila Inferior de Productos Entregables (Mapeo de 3 columnas del Mockup) */}
                                            <div className="space-y-3 pt-4 border-t border-brand/20 select-none animate-fade-up">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-dim pl-1 font-mono block">
                                                    Entregables Científicos de este Proyecto
                                                </span>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    
                                                    {/* Columna 1: Borrador / Planificación */}
                                                    <div className="border border-border-thin bg-surface rounded-xl p-3.5 space-y-2 min-h-[120px]">
                                                        <div className="flex items-center justify-between text-[9px] font-black text-text-dim uppercase pb-1.5 border-b border-border-thin">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                                                                Planificación
                                                            </span>
                                                            <span className="font-mono">1</span>
                                                        </div>
                                                        <div className="pt-1.5 space-y-2 text-[11px] font-semibold text-text-main">
                                                            <div className="p-2 bg-bg-deep/20 border border-border-thin/40 rounded-lg flex flex-col gap-1">
                                                                <p className="leading-snug line-clamp-2">Informe Técnico y Ficha de Viabilidad del Proyecto</p>
                                                                <span className="text-[7.5px] font-mono font-bold text-text-dim uppercase mt-0.5">Reporte Interno</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Columna 2: En Revisión (Pares / Comité) */}
                                                    <div className="border border-border-thin bg-surface rounded-xl p-3.5 space-y-2 min-h-[120px]">
                                                        <div className="flex items-center justify-between text-[9px] font-black text-warning uppercase pb-1.5 border-b border-border-thin">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                                                                En Revisión
                                                            </span>
                                                            <span className="font-mono">{selectedProj.totalProductos > 1 ? 1 : 0}</span>
                                                        </div>
                                                        <div className="pt-1.5 space-y-2 text-[11px] font-semibold text-text-main">
                                                            {selectedProj.totalProductos > 1 ? (
                                                                <div className="p-2 bg-bg-deep/20 border border-border-thin/40 rounded-lg flex flex-col gap-1">
                                                                    <p className="leading-snug line-clamp-2">Artículo de Investigación — Revisión Regional (Latindex)</p>
                                                                    <span className="text-[7.5px] font-mono font-bold text-warning uppercase mt-0.5">Peer Review</span>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] text-text-dim font-bold text-center py-5 italic">Sin entregables en revisión.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Columna 3: Validado / Publicado (Excelencia) */}
                                                    <div className="border border-border-thin bg-surface rounded-xl p-3.5 space-y-2 min-h-[120px]">
                                                        <div className="flex items-center justify-between text-[9px] font-black text-success uppercase pb-1.5 border-b border-border-thin">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                                                Publicado / Validado
                                                            </span>
                                                            <span className="font-mono">{selectedProj.totalProductos > 0 ? (selectedProj.totalProductos > 1 ? selectedProj.totalProductos - 1 : 1) : 0}</span>
                                                        </div>
                                                        <div className="pt-1.5 space-y-2 text-[11px] font-semibold text-text-main">
                                                            {selectedProj.totalProductos > 0 ? (
                                                                <div className="p-2 bg-bg-deep/20 border border-border-thin/40 rounded-lg flex flex-col gap-1">
                                                                    <p className="leading-snug line-clamp-2">Producto de Investigación o Innovación Científica</p>
                                                                    <span className="text-[7.5px] font-mono font-bold text-success uppercase mt-0.5">Scopus / Patente</span>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] text-text-dim font-bold text-center py-5 italic">No se han registrado publicaciones aún.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
    );
};

export default AnalyticsPage;
