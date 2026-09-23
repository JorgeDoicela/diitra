import { stripHtml } from '../utils/promptClipboardEngine';

/** Tipo interno para registros de datos del documento */
type DataRecord = Record<string, unknown>;

export interface SectionClipboardMeta {
    title: string;
    fieldKey: string;
    instructions: string;
    requirementText: string;
    currentContent: unknown;
    contentSerializer?: (data: unknown) => string;
}

// ─────────────────────────────────────────────────────────────────
// SERIALIZADORES DEDICADOS POR SECCIÓN (ISTPET)
// ─────────────────────────────────────────────────────────────────

export const serializeGeneralSection = (data: unknown): string => {
    const fd = (data || {}) as DataRecord;
    const lines: string[] = [];

    const titulo = fd.Titulo || fd.NombreProyecto || fd.nombre_proyecto;
    if (titulo) lines.push(`• TEMA / TÍTULO DE INVESTIGACIÓN: ${String(titulo)}`);

    const codigo = fd.CodigoProyecto || fd.codigo_proyecto;
    if (codigo) lines.push(`• CÓDIGO DEL PROYECTO: ${String(codigo)}`);

    const carrera = fd.Carrera || fd.carrera;
    if (carrera) lines.push(`• CARRERA / UNIDAD ACADÉMICA: ${String(carrera)}`);

    const dominio = fd.Dominio || fd.dominio;
    if (dominio) lines.push(`• DOMINIO ACADÉMICO: ${String(dominio)}`);

    const linea = fd.LineaInvestigacion || fd.linea_investigacion;
    if (linea) lines.push(`• LÍNEA DE INVESTIGACIÓN: ${String(linea)}`);

    const sublinea = fd.SublineaInvestigacion || fd.sublinea_investigacion;
    if (sublinea) lines.push(`• SUBLÍNEA DE INVESTIGACIÓN: ${String(sublinea)}`);

    const tipo = fd.TipoInvestigacion || fd.tipo_investigacion;
    if (tipo) lines.push(`• TIPO DE INVESTIGACIÓN: ${String(tipo)}`);

    const programa = fd.ProgramaProyecto || fd.Programa || fd.programa;
    if (programa) lines.push(`• PROGRAMA DE INVESTIGACIÓN: ${String(programa)}`);

    const grupo = fd.GrupoInvestigacionNombre || fd.GrupoInvestigacion || fd.grupo_investigacion;
    if (grupo && String(grupo) !== 'NO') lines.push(`• GRUPO DE INVESTIGACIÓN: ${String(grupo)}`);

    const director = fd.DirectorProyecto || fd.director_proyecto;
    if (director) lines.push(`• DIRECTOR DE PROYECTO: ${String(director)}`);

    const fechaPres = fd.FechaPresentacion;
    if (fechaPres) lines.push(`• FECHA DE PRESENTACIÓN: ${String(fechaPres)}`);

    const fechaInicio = fd.FechaInicio;
    if (fechaInicio) lines.push(`• FECHA DE INICIO: ${String(fechaInicio)}`);

    const fechaFin = fd.FechaFin;
    if (fechaFin) lines.push(`• FECHA DE FINALIZACIÓN: ${String(fechaFin)}`);

    return lines.length > 0 ? lines.join('\n') : '(Sin datos de identificación registrados)';
};

export const serializeTeamSection = (data: unknown): string => {
    const fd = (data || {}) as DataRecord;
    const list = (fd.Investigadores || fd.investigadores || data) as unknown[];
    if (!Array.isArray(list) || list.length === 0) return '(Sin equipo de investigación registrado)';

    return list.map((item, i) => {
        const inv = item as DataRecord;
        const nombre = String(inv.Nombre || inv.nombre || inv.Nombres || 'Docente/Estudiante');
        const rol = String(inv.Rol || inv.rol || 'Investigador');
        const horas = inv.HorasSemanales || inv.horas_semanales || inv.DedicacionHoras;
        const horasStr = horas != null ? ` [${String(horas)} horas/sem]` : '';
        const nivel = inv.NivelAcademico || inv.nivel_academico;
        const nivelStr = nivel ? ` - ${String(nivel)}` : '';
        return `${i + 1}. ${nombre} (${rol}${horasStr})${nivelStr}`;
    }).join('\n');
};

export const serializeTechnicalSection = (data: unknown): string => {
    const fd = (data || {}) as DataRecord;
    const blocks: string[] = [];

    const appendField = (label: string, val: unknown) => {
        const text = stripHtml(val);
        if (text) blocks.push(`### ${label}\n${text}`);
    };

    appendField('Antecedentes', fd.Antecedentes || fd.antecedentes);
    appendField('Planteamiento del Problema', fd.DescripcionProyecto || fd.descripcion_proyecto || fd.Problema);
    appendField('Justificación', fd.Justificacion || fd.justificacion);
    appendField('Objetivo General', fd.ObjetivoGeneral || fd.objetivo_general);
    appendField('Objetivos Específicos', fd.ObjetivosEspecificos || fd.objetivos_especificos);
    appendField('Marco Teórico / Estado del Arte', fd.MarcoTeorico || fd.marco_teorico);
    appendField('Metodología', fd.Metodologia || fd.metodologia);

    return blocks.length > 0 ? blocks.join('\n\n') : '(Sin especificación técnica redactada)';
};

export const serializeBudgetSection = (data: unknown): string => {
    const fd = (data || {}) as DataRecord;
    const blocks: string[] = [];

    const disp = (fd.RecursosDisponibles || fd.recursos_disponibles) as unknown[];
    if (Array.isArray(disp) && disp.length > 0) {
        blocks.push('--- RECURSOS DISPONIBLES (INSTITUCIONALES) ---');
        disp.forEach((item, i) => {
            const r = item as DataRecord;
            const rubro = String(r.Rubro || r.rubro || r.Descripcion || `Ítem ${i + 1}`);
            const costo = String(r.Costo || r.costo || r.Valor || '0.00');
            blocks.push(`${i + 1}. ${rubro}: $${costo}`);
        });
    }

    const nec = (fd.RecursosNecesarios || fd.recursos_necesarios) as unknown[];
    if (Array.isArray(nec) && nec.length > 0) {
        blocks.push('\n--- RECURSOS NECESARIOS (PRESUPUESTO A FINANCIAR) ---');
        nec.forEach((item, i) => {
            const r = item as DataRecord;
            const rubro = String(r.Rubro || r.rubro || r.Descripcion || `Ítem ${i + 1}`);
            const costo = String(r.Costo || r.costo || r.Valor || '0.00');
            const fuente = r.Fuente || r.fuente ? ` [Fuente: ${String(r.Fuente || r.fuente)}]` : '';
            blocks.push(`${i + 1}. ${rubro}: $${costo}${fuente}`);
        });
    }

    return blocks.length > 0 ? blocks.join('\n') : '(Sin presupuesto ni recursos configurados)';
};

export const serializeExpectedProducts = (data: unknown): string => {
    const fd = (data || {}) as DataRecord;
    const list = (fd.ProductosEsperados || fd.productos_esperados || data) as unknown[];
    if (!Array.isArray(list) || list.length === 0) return '(Sin productos esperados registrados)';

    return list.map((item, i) => {
        const prod = item as DataRecord;
        const nombre = String(prod.Nombre || prod.nombre || prod.Descripcion || `Producto ${i + 1}`);
        const cat = prod.Categoria || prod.categoria || prod.Tipo || 'Científico';
        const medio = prod.MedioVerificacion || prod.medio_verificacion;
        const medioStr = medio ? ` | Verificación: ${String(medio)}` : '';
        return `${i + 1}. [${String(cat)}] ${nombre}${medioStr}`;
    }).join('\n');
};

export const serializeImpacts = (data: unknown): string => {
    const fd = (data || {}) as DataRecord;
    const impactoObj = (fd.Impacto || fd.impacto || data) as DataRecord;
    if (!impactoObj || typeof impactoObj !== 'object') return '(Sin impactos registrados)';

    const dimensions = [
        { key: 'social', label: 'Impacto Social' },
        { key: 'cientifico', label: 'Impacto Científico / Tecnológico' },
        { key: 'economico', label: 'Impacto Económico' },
        { key: 'politico', label: 'Impacto Político / Normativo' },
        { key: 'ambiental', label: 'Impacto Ambiental' },
        { key: 'otro', label: 'Otros Impactos' }
    ];

    const lines: string[] = [];
    dimensions.forEach(dim => {
        const val = stripHtml(impactoObj[dim.key] || impactoObj[dim.label]);
        if (val) lines.push(`• **${dim.label}**: ${val}`);
    });

    return lines.length > 0 ? lines.join('\n\n') : '(Sin impactos registrados)';
};

export const serializeTimeline = (data: unknown): string => {
    const fd = (data || {}) as DataRecord;
    const list = (fd.Cronograma || fd.cronograma || data) as unknown[];
    if (!Array.isArray(list) || list.length === 0) return '(Sin cronograma registrado)';

    return list.map((item, i) => {
        const act = item as DataRecord;
        const actDesc = String(act.Actividad || act.actividad || act.Nombre || `Actividad ${i + 1}`);
        const resp = act.Responsable || act.responsable ? ` (Resp: ${String(act.Responsable || act.responsable)})` : '';
        const inicio = act.FechaInicioPrevista || act.FechaInicio || '';
        const fin = act.FechaFinPrevista || act.FechaFin || '';
        const fechas = inicio && fin ? ` [${String(inicio)} al ${String(fin)}]` : '';
        return `${i + 1}. ${actDesc}${resp}${fechas}`;
    }).join('\n');
};

export const serializeBibliography = (data: unknown): string => {
    const fd = (data || {}) as DataRecord;
    const raw = fd.Bibliografia || fd.bibliografia || data;
    const text = stripHtml(raw);
    return text || '(Sin bibliografía registrada)';
};

// ─────────────────────────────────────────────────────────────────
// RESOLUTOR CENTRALIZADO DE PROMPTS Y METADATOS DE SECCIÓN
// ─────────────────────────────────────────────────────────────────

export function getSectionClipboardMeta(
    sectionId: string,
    label?: string,
    formData?: unknown,
    _secConfig?: unknown
): SectionClipboardMeta {
    const rawFd = (formData || {}) as DataRecord;
    const cleanId = (sectionId || '').toLowerCase().trim();

    switch (cleanId) {
        case 'identificacion':
        case 'general':
        case 'project_general_section':
            return {
                title: label || '1. IDENTIFICACIÓN DEL PROYECTO',
                fieldKey: 'identificacion',
                instructions: 'Verificar que el tema de investigación sea claro, conciso, delimitado temporal y espacialmente, y articulado con la línea, sublínea y dominio académico institucional. Asegurar la asignación correcta de carrera y tipo de investigación según la normativa ISTPET.',
                requirementText: 'Nombre del proyecto en mayúsculas, asignación precisa de carrera, dominio, línea y tipo de investigación ISTPET.',
                currentContent: rawFd,
                contentSerializer: serializeGeneralSection
            };

        case 'equipo':
        case 'investigadores':
        case 'researchers_table':
            return {
                title: label || '2. EQUIPO HUMANO DE INVESTIGACIÓN',
                fieldKey: 'Investigadores',
                instructions: 'Evaluar la idoneidad del equipo de investigación, pertinencia de los roles asignados (Director, Investigador, Asistente) y cumplimiento del límite de carga horaria semanal según distributivo docente ISTPET.',
                requirementText: 'Al menos un Director de proyecto designado, dedicación horaria dentro de límites normativos y roles coherentes con la experticia declarada.',
                currentContent: rawFd.Investigadores || rawFd.investigadores || rawFd,
                contentSerializer: serializeTeamSection
            };

        case 'tecnico':
        case 'especificacion':
        case 'project_technical_section':
            return {
                title: label || '3. ESPECIFICACIÓN DEL PROYECTO',
                fieldKey: 'tecnico',
                instructions: 'Evaluar la coherencia lógica interna entre antecedentes, formulación del problema, justificación, objetivo general y específicos. Verificar rigor metodológico y viabilidad del diseño propuesto.',
                requirementText: 'Objetivo general medible alineado con el título; objetivos específicos formulados con verbos en infinitivo que representen etapas metodológicas; justificación con sustento contextual.',
                currentContent: rawFd,
                contentSerializer: serializeTechnicalSection
            };

        case 'recursos':
        case 'presupuesto':
        case 'budget_table':
            return {
                title: label || '4. RECURSOS Y PRESUPUESTO',
                fieldKey: 'recursos',
                instructions: 'Revisar la justificación de costos, pertinencia de los rubros requeridos frente a los objetivos, y coherencia de las fuentes de financiamiento institucionales y externas.',
                requirementText: 'Detalle de rubros necesarios justificados frente a los objetivos, congruencia de valores unitarios y totales, y distinción clara de fondos propios/institucionales.',
                currentContent: rawFd,
                contentSerializer: serializeBudgetSection
            };

        case 'productos':
        case 'productos_esperados':
        case 'deliverables_list':
            return {
                title: label || '5. PRODUCTOS ESPERADOS',
                fieldKey: 'ProductosEsperados',
                instructions: 'Verificar correspondencia directa de los productos comprometidos con los objetivos específicos y líneas de producción científica reconocidas por el ISTPET (artículos, ponencias, software, prototipos).',
                requirementText: 'Definición de productos tangibles categorizados con sus respectivos medios de verificación y beneficiarios directos.',
                currentContent: rawFd.ProductosEsperados || rawFd.productos_esperados || rawFd,
                contentSerializer: serializeExpectedProducts
            };

        case 'impactos':
        case 'impact_grid':
            return {
                title: label || '6. IMPACTO DEL PROYECTO',
                fieldKey: 'Impacto',
                instructions: 'Analizar el alcance de la propuesta en las dimensiones social, tecnológica, económica y ambiental institucional o comunitaria.',
                requirementText: 'Descripción fundamentada de beneficios esperados en al menos dos dimensiones institucionales o sociales.',
                currentContent: rawFd.Impacto || rawFd.impacto || rawFd,
                contentSerializer: serializeImpacts
            };

        case 'cronograma':
        case 'gantt_chart':
            return {
                title: label || '7. CRONOGRAMA DE TRABAJO (GANTT)',
                fieldKey: 'Cronograma',
                instructions: 'Comprobar la viabilidad temporal del cronograma, secuencia lógica de actividades y asignación explícita de responsables en concordancia con los objetivos específicos.',
                requirementText: 'Actividades secuenciales desglosadas por semanas o meses, con asignación de responsables y fechas compatibles con el plazo total del proyecto.',
                currentContent: rawFd.Cronograma || rawFd.cronograma || rawFd,
                contentSerializer: serializeTimeline
            };

        case 'bibliografia':
        case 'bibliography_block':
            return {
                title: label || '8. BIBLIOGRAFÍA',
                fieldKey: 'Bibliografia',
                instructions: 'Verificar la actualidad de las fuentes bibliográficas (preferentemente de los últimos 5 años) y cumplimiento estricto del formato de citación académica APA / IEEE.',
                requirementText: 'Citas bibliográficas académicas actualizadas con fuentes indexadas y formato de referencia estandarizado.',
                currentContent: rawFd.Bibliografia || rawFd.bibliografia || rawFd,
                contentSerializer: serializeBibliography
            };

        default: {
            // Fallback Universal para cualquier nueva sección o bloque dinámico futuro
            const formattedTitle = label || sectionId.toUpperCase().replace(/_/g, ' ');
            const sectionData = rawFd[sectionId] || rawFd;
            return {
                title: formattedTitle,
                fieldKey: sectionId,
                instructions: `Revisar y validar el contenido de la sección "${formattedTitle}" asegurando consistencia técnica, claridad y cumplimiento de los lineamientos institucionales ISTPET.`,
                requirementText: `Redacción clara y alineada a los objetivos institucionales de la sección "${formattedTitle}".`,
                currentContent: sectionData
            };
        }
    }
}
