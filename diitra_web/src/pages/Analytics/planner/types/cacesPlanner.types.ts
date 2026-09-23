import type { ProyectoResumen, DashboardStats } from '../../types/analytics.types';

export interface ProjectTrlOverride {
    idProyecto: number;
    simulatedTrl: number;
    simulatedEntidadAliada: boolean;
}

export interface CacesPlannerSimulationParams {
    /** Docentes investigadores con horas asignadas a I+D */
    investigadoresOverride: number | null;
    /** Publicaciones y productos adicionales simulados */
    extraArticulosScopus: number;
    extraArticulosLatindex: number;
    extraLibros: number;
    extraPonencias: number;
    extraPrototipos: number;
    /** Overrides individuales por proyecto para simular madurez TRL */
    projectOverrides: Record<number, ProjectTrlOverride>;
}

export interface CacesFormula1Result {
    /** Total de productos considerados (reales + simulados) */
    totalProductos: number;
    productosReales: number;
    productosSimulados: number;
    /** Total de investigadores (reales o modificados) */
    totalInvestigadores: number;
    /** Meta CACES mínima exigida: totalInvestigadores * factor (0.5 por defecto) */
    metaProductosExigida: number;
    /** Tasa de producción calculada: totalProductos / totalInvestigadores */
    tasaProduccion: number;
    /** Porcentaje de cumplimiento respecto a la meta (0% a 100%+) */
    porcentajeCumplimiento: number;
    /** Brecha matemática: cuántos productos faltan para el 100% */
    brechaFaltante: number;
    /** Estado cualitativo CACES */
    estado: 'CUMPLIDO' | 'EN PROCESO' | 'ALERTA';
}

export interface CacesFormula2Result {
    /** Total de proyectos evaluados en el portafolio */
    totalProyectos: number;
    /** Proyectos que alcanzan TRL >= 5 o convenio con entidad productiva */
    proyectosCumplenTrl: number;
    /** Meta mínima exigida por CACES para ISTT: 15% del total de proyectos */
    metaProyectosTrlExigida: number;
    /** Porcentaje de pertinencia tecnológica actual: (proyectosCumplenTrl / totalProyectos) * 100 */
    porcentajePertinencia: number;
    /** Meta porcentual estándar (15%) */
    umbralMetaPct: number;
    /** Brecha matemática: proyectos que faltan elevar a TRL >= 5 */
    brechaFaltante: number;
    /** Estado cualitativo CACES */
    estado: 'CUMPLIDO' | 'EN PROCESO' | 'ALERTA';
    /** Distribución de proyectos por cada nivel TRL (1 al 9) */
    distribucionTrl: Record<number, number>;
}

export interface CacesPlannerDiagnosis {
    formula1: CacesFormula1Result;
    formula2: CacesFormula2Result;
    /** Dictamen global predictivo ante una auditoría del CACES */
    dictamenGlobal: 'ACREDITABLE' | 'EN RIESGO' | 'NO ACREDITA';
    puntajeEstimadoGlobal: number; // 0 a 100
    recomendaciones: string[];
    esModoSimulado: boolean;
}
