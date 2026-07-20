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

export interface CacesIndicator {
    code: string;
    name: string;
    description: string;
    status: 'CUMPLIDO' | 'EN PROCESO' | 'ALERTA';
    progress: number;
    metaLabel: string;
    currentLabel: string;
}

export interface LineaInvestigacionData {
    nombre: string;
    proyectos: number;
    pres: number;
    pct: number;
    colorClass: string;
}

export interface ProcessedAnalyticsData {
    filteredProjects: ProyectoResumen[];
    linesData: LineaInvestigacionData[];
    proyectosPorEstado: EstadoConteo[];
    budgetTotal: number;
    budgetExecuted: number;
    cacesIndicators: readonly CacesIndicator[];
    dbPeriods: string[];
    dbCareers: string[];
}
