import type { ProyectoResumen, DashboardStats } from '../../types/analytics.types';
import type {
    CacesPlannerSimulationParams,
    CacesFormula1Result,
    CacesFormula2Result,
    CacesPlannerDiagnosis
} from '../types/cacesPlanner.types';

/**
 * Escala TRL Oficial adaptada a la educación superior tecnológica (CACES / NASA / SENESCYT)
 */
export const TRL_DEFINITIONS: Record<number, { level: number; label: string; phase: string; description: string }> = {
    1: { level: 1, label: 'TRL 1', phase: 'Investigación Básica', description: 'Principios básicos observados y reportados.' },
    2: { level: 2, label: 'TRL 2', phase: 'Concepto Tecnológico', description: 'Concepto tecnológico y/o aplicación formulada.' },
    3: { level: 3, label: 'TRL 3', phase: 'Prueba de Concepto', description: 'Prueba analítica y experimental de la función o característica.' },
    4: { level: 4, label: 'TRL 4', phase: 'Validación en Laboratorio', description: 'Validación de componentes en entorno de laboratorio.' },
    5: { level: 5, label: 'TRL 5', phase: 'Validación en Entorno Relevante', description: 'Prototipo básico validado en entorno industrial o real simulado. (Umbral CACES)' },
    6: { level: 6, label: 'TRL 6', phase: 'Demostración de Prototipo', description: 'Prototipo probado en entorno relevante del sector productivo.' },
    7: { level: 7, label: 'TRL 7', phase: 'Prototipo Operativo', description: 'Demostración del sistema o prototipo en el entorno operativo real.' },
    8: { level: 8, label: 'TRL 8', phase: 'Sistema Completo y Calificado', description: 'Tecnología completa y calificada a través de pruebas exitosas.' },
    9: { level: 9, label: 'TRL 9', phase: 'Despliegue y Transferencia', description: 'Sistema probado y desplegado con éxito en el mercado o sociedad.' }
};

/**
 * Calcula la Fórmula 1: Tasa de Producción Científica y Técnica del Claustro Docente
 * Tasa = (Productos Científicos) / (Investigadores * 0.5)
 */
export const calculateFormula1Production = (
    projects: ProyectoResumen[],
    stats: DashboardStats | null,
    params: CacesPlannerSimulationParams
): CacesFormula1Result => {
    // 1. Obtener número de investigadores base
    const baseResearchers = stats?.totalInvestigadoresActivos || projects.reduce((acc, p) => acc + (p.totalInvestigadores || 0), 0);
    const totalInvestigadores = params.investigadoresOverride !== null && params.investigadoresOverride >= 0
        ? params.investigadoresOverride
        : Math.max(1, baseResearchers);

    // 2. Obtener productos reales
    const productosReales = stats?.totalProductosPeriodo || projects.reduce((acc, p) => acc + (p.totalProductos || 0), 0);

    // 3. Sumar productos simulados
    const productosSimulados = 
        Math.max(0, params.extraArticulosScopus) +
        Math.max(0, params.extraArticulosLatindex) +
        Math.max(0, params.extraLibros) +
        Math.max(0, params.extraPonencias) +
        Math.max(0, params.extraPrototipos);

    const totalProductos = productosReales + productosSimulados;

    // 4. Meta del CACES para institutos técnicos: al menos 0.5 productos por docente investigador
    const metaFactor = 0.5;
    const metaProductosExigida = Math.max(1, Math.ceil(totalInvestigadores * metaFactor));

    // 5. Tasa y porcentaje de cumplimiento
    const tasaProduccion = Number((totalProductos / totalInvestigadores).toFixed(2));
    const porcentajeCumplimiento = Math.round((totalProductos / metaProductosExigida) * 100);

    // 6. Brecha faltante
    const brechaFaltante = Math.max(0, metaProductosExigida - totalProductos);

    // 7. Estado
    const estado: 'CUMPLIDO' | 'EN PROCESO' | 'ALERTA' = 
        porcentajeCumplimiento >= 100 ? 'CUMPLIDO' :
        porcentajeCumplimiento >= 50 ? 'EN PROCESO' : 'ALERTA';

    return {
        totalProductos,
        productosReales,
        productosSimulados,
        totalInvestigadores,
        metaProductosExigida,
        tasaProduccion,
        porcentajeCumplimiento,
        brechaFaltante,
        estado
    };
};

/**
 * Calcula la Fórmula 2: Índice de Madurez Tecnológica (TRL) y Transferencia con Sector Productivo
 * Pertinencia (%) = (Proyectos con TRL >= 5 o Alianza Empresarial / Total Proyectos) * 100
 * Meta CACES ISTT: >= 15%
 */
export const calculateFormula2Trl = (
    projects: ProyectoResumen[],
    params: CacesPlannerSimulationParams,
    trlMinimoUmbral = 5,
    metaPorcentualUmbral = 15
): CacesFormula2Result => {
    const totalProyectos = Math.max(1, projects.length);

    // Distribución por nivel TRL
    const distribucionTrl: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

    let proyectosCumplenTrl = 0;

    projects.forEach(p => {
        const override = params.projectOverrides[p.idProyecto];
        const effectiveTrl = override?.simulatedTrl ?? (p.trlActual || 1);
        const hasEffectivePartner = override?.simulatedEntidadAliada ?? Boolean(p.entidadAliada && p.entidadAliada.trim().length > 0);

        const clampedTrl = Math.min(9, Math.max(1, effectiveTrl));
        distribucionTrl[clampedTrl] = (distribucionTrl[clampedTrl] || 0) + 1;

        if (clampedTrl >= trlMinimoUmbral || hasEffectivePartner) {
            proyectosCumplenTrl += 1;
        }
    });

    const metaProyectosTrlExigida = Math.max(1, Math.ceil(totalProyectos * (metaPorcentualUmbral / 100)));
    const porcentajePertinencia = Math.round((proyectosCumplenTrl / totalProyectos) * 100);
    const brechaFaltante = Math.max(0, metaProyectosTrlExigida - proyectosCumplenTrl);

    const estado: 'CUMPLIDO' | 'EN PROCESO' | 'ALERTA' = 
        porcentajePertinencia >= metaPorcentualUmbral ? 'CUMPLIDO' :
        porcentajePertinencia >= (metaPorcentualUmbral / 2) ? 'EN PROCESO' : 'ALERTA';

    return {
        totalProyectos,
        proyectosCumplenTrl,
        metaProyectosTrlExigida,
        porcentajePertinencia,
        umbralMetaPct: metaPorcentualUmbral,
        brechaFaltante,
        estado,
        distribucionTrl
    };
};

/**
 * Ejecuta el diagnóstico integral y emite dictamen + recomendaciones
 */
export const runCacesPlannerDiagnosis = (
    projects: ProyectoResumen[],
    stats: DashboardStats | null,
    params: CacesPlannerSimulationParams
): CacesPlannerDiagnosis => {
    const f1 = calculateFormula1Production(projects, stats, params);
    const f2 = calculateFormula2Trl(projects, params);

    const f1Score = Math.min(100, f1.porcentajeCumplimiento);
    const f2Score = Math.min(100, Math.round((f2.porcentajePertinencia / f2.umbralMetaPct) * 100));

    // Ponderación de investigación en el CACES (50% Producción, 50% Transferencia/TRL)
    const puntajeEstimadoGlobal = Math.round((f1Score * 0.5) + (f2Score * 0.5));

    let dictamenGlobal: 'ACREDITABLE' | 'EN RIESGO' | 'NO ACREDITA' = 'NO ACREDITA';
    if (f1.estado === 'CUMPLIDO' && f2.estado === 'CUMPLIDO') {
        dictamenGlobal = 'ACREDITABLE';
    } else if (f1.estado !== 'ALERTA' && f2.estado !== 'ALERTA') {
        dictamenGlobal = 'EN RIESGO';
    } else {
        dictamenGlobal = 'NO ACREDITA';
    }

    const recomendaciones: string[] = [];

    // Recomendaciones Fórmula 1
    if (f1.brechaFaltante > 0) {
        recomendaciones.push(
            `Fórmula 1 (Producción): Se requiere programar al menos ${f1.brechaFaltante} producto(s) científico(s) adicional(es) en el período para alcanzar la tasa de 0.5 por docente investigador exigida por el CACES.`
        );
    } else {
        recomendaciones.push(
            `Fórmula 1 (Producción): Supera el estándar oficial con una tasa de ${f1.tasaProduccion} publicaciones por docente (Cumplimiento: ${f1.porcentajeCumplimiento}%).`
        );
    }

    // Recomendaciones Fórmula 2
    if (f2.brechaFaltante > 0) {
        recomendaciones.push(
            `Fórmula 2 (TRL & Pertinencia): Faltan ${f2.brechaFaltante} proyecto(s) con validación técnica en TRL ≥ 5 o con convenio productivo firmado para cumplir el ${f2.umbralMetaPct}% de pertinencia institucional.`
        );
    } else {
        recomendaciones.push(
            `Fórmula 2 (TRL & Pertinencia): Cumple la meta de transferencia tecnológica con un ${f2.porcentajePertinencia}% del portafolio en niveles de prototipo o con empresas aliadas.`
        );
    }

    // Recomendación de equilibrio de claustro
    if (f1.totalInvestigadores > 0 && f1.totalProductos < f1.totalInvestigadores * 0.2) {
        recomendaciones.push(
            'Recomendación Estratégica: Fomentar la coautoría docente en artículos regionales (Latindex Catálogo 2.0) para acelerar la tasa de acreditación sin sobrecargar a investigadores individuales.'
        );
    }

    const esModoSimulado = 
        params.investigadoresOverride !== null ||
        (params.extraArticulosScopus + params.extraArticulosLatindex + params.extraLibros + params.extraPonencias + params.extraPrototipos) > 0 ||
        Object.keys(params.projectOverrides).length > 0;

    return {
        formula1: f1,
        formula2: f2,
        dictamenGlobal,
        puntajeEstimadoGlobal,
        recomendaciones,
        esModoSimulado
    };
};
