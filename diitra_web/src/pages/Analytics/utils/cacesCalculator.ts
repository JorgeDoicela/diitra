import type { ProyectoResumen, DashboardStats, CacesIndicator } from '../types/analytics.types';

export const calculateCacesIndicators = (
    projects: ProyectoResumen[],
    stats: DashboardStats | null
): readonly CacesIndicator[] => {
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

export const getProjectClassification = (projects: ProyectoResumen[], code: string) => {
    const poor: ProyectoResumen[] = [];
    const warning: ProyectoResumen[] = [];
    const great: ProyectoResumen[] = [];

    projects.forEach(p => {
        if (code === 'E1.PLAN') {
            if (!p.objetivoPnd) {
                poor.push(p);
            } else if (!p.lineaInvestigacion) {
                warning.push(p);
            } else {
                great.push(p);
            }
        } else if (code === 'E2.PROD') {
            if (p.totalProductos === 0) {
                poor.push(p);
            } else if (p.totalProductos === 1) {
                warning.push(p);
            } else {
                great.push(p);
            }
        } else if (code === 'E3.INNO') {
            const trl = p.trlActual || 0;
            if (trl < 3) {
                poor.push(p);
            } else if (trl < 5 && !p.entidadAliada) {
                warning.push(p);
            } else {
                great.push(p);
            }
        } else if (code === 'E4.STUD') {
            const students = p.totalEstudiantes || 0;
            if (students === 0) {
                poor.push(p);
            } else if (students === 1) {
                warning.push(p);
            } else {
                great.push(p);
            }
        } else if (code === 'E5.BUDG') {
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

export const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val);
};

export const formatDate = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
};
