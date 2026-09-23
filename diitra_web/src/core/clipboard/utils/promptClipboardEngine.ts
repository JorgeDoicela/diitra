import type { PromptClipboardContextData, CopyMode } from '../types/promptClipboard.types';

/** Tipo interno para objetos de datos estructurados (API/formData) */
type DataRecord = Record<string, unknown>;

/**
 * Limpia etiquetas HTML y entidades para obtener texto plano legible
 */
export const stripHtml = (html?: unknown): string => {
    if (!html) return '';
    if (typeof html !== 'string') return String(html);
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return (temp.textContent || temp.innerText || '').trim();
};

/**
 * Serializa de forma legible colecciones de datos (arrays de objetos) a Markdown.
 * Fallback heurístico cuando no se provee un serializer explícito.
 */
export const formatStructuredCollection = (key: string, items: DataRecord[]): string => {
    if (!Array.isArray(items) || items.length === 0) {
        return '(Sin registros ingresados)';
    }

    const lines: string[] = [];

    // Productos Esperados
    if (key.toLowerCase().includes('producto')) {
        items.forEach((item, index) => {
            const tipo = String(item.Categoria || item.categoria || item.Tipo || item.tipo || 'General');
            const subtipo = String(item.Subtipo || item.subtipo || '');
            const nombre = String(item.Nombre || item.nombre || item.Descripcion || item.descripcion || 'Sin especificar');
            const beneficiario = String(item.Beneficiarios || item.beneficiarios || '');
            lines.push(`${index + 1}. [${tipo}${subtipo ? ` / ${subtipo}` : ''}] ${nombre}`);
            if (beneficiario) lines.push(`   • Beneficiarios: ${beneficiario}`);
        });
        return lines.join('\n');
    }

    // Impactos
    if (key.toLowerCase().includes('impacto')) {
        items.forEach((item, index) => {
            const dimension = String(item.Dimension || item.dimension || item.Tipo || item.tipo || `Impacto ${index + 1}`);
            const desc = String(item.Descripcion || item.descripcion || item.Detalle || item.detalle || '');
            lines.push(`• **${dimension}**: ${desc || '(Sin descripción)'}`);
        });
        return lines.join('\n');
    }

    // Investigadores / Equipo
    if (key.toLowerCase().includes('investigador') || key.toLowerCase().includes('equipo')) {
        items.forEach((inv, index) => {
            const nom = String(inv.Nombres || inv.nombres || inv.Nombre || inv.nombre || 'Investigador');
            const rol = String(inv.Rol || inv.rol || inv.Tipo || 'Colaborador');
            const mail = String(inv.Correo || inv.correo || inv.Email || '');
            lines.push(`${index + 1}. ${nom} — Rol: ${rol}${mail ? ` (${mail})` : ''}`);
        });
        return lines.join('\n');
    }

    // Prerrequisitos (APE)
    if (key.toLowerCase().includes('prerrequisito')) {
        items.forEach((req, index) => {
            const titulo = String(req.Titulo || req.titulo || req.Asignatura || req.asignatura || `Prerrequisito ${index + 1}`);
            const desc = String(req.Descripcion || req.descripcion || '');
            lines.push(`${index + 1}. ${titulo}: ${desc}`);
        });
        return lines.join('\n');
    }

    // Actividades (Gantt / APE / Informe de Avance)
    if (key.toLowerCase().includes('actividad') || key.toLowerCase().includes('cronograma')) {
        items.forEach((act, index) => {
            const nom = String(act.Nombre || act.nombre || act.Descripcion || act.descripcion || `Actividad ${index + 1}`);
            const estado = act.Estado || act.estado;
            const pct = act.Porcentaje || act.porcentaje;
            const estadoStr = estado ? String(estado) : (pct != null ? `${String(pct)}%` : '');
            lines.push(`${index + 1}. ${nom}${estadoStr ? ` [Estado: ${estadoStr}]` : ''}`);
        });
        return lines.join('\n');
    }

    // Presupuesto / Recursos
    if (key.toLowerCase().includes('presupuesto') || key.toLowerCase().includes('recurso')) {
        items.forEach((rec, index) => {
            const rubro = String(rec.Rubro || rec.rubro || rec.Descripcion || rec.descripcion || `Ítem ${index + 1}`);
            const costo = String(rec.Costo || rec.costo || rec.Monto || rec.monto || '0.00');
            const fuente = String(rec.Fuente || rec.fuente || '');
            lines.push(`${index + 1}. ${rubro} — $${costo}${fuente ? ` (${fuente})` : ''}`);
        });
        return lines.join('\n');
    }

    // Fallback genérico para otros arrays
    items.forEach((item, index) => {
        const values = Object.entries(item)
            .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(', ');
        lines.push(`${index + 1}. ${values}`);
    });

    return lines.join('\n');
};

/**
 * Normaliza cualquier contenido (string HTML o estructura de datos) a texto plano para IA.
 *
 * @param content     - El valor crudo del campo (string HTML, array, objeto, etc.)
 * @param fieldKey    - Clave del campo; usado como fallback heurístico si no hay serializer.
 * @param serializer  - Serializador explícito con precedencia sobre la detección automática.
 */
export const resolveContentString = (
    content: unknown,
    fieldKey?: string,
    serializer?: (data: unknown) => string
): string => {
    if (content === null || content === undefined) return '';
    if (typeof content === 'string') return stripHtml(content);
    if (Array.isArray(content)) {
        // Serializer explícito tiene siempre precedencia
        if (serializer) return serializer(content);
        // Fallback heurístico por nombre de clave
        return formatStructuredCollection(fieldKey || '', content as DataRecord[]);
    }
    if (typeof content === 'object') {
        if (serializer) return serializer(content);
        try {
            return JSON.stringify(content, null, 2);
        } catch {
            return String(content);
        }
    }
    return String(content);
};

/**
 * Extrae un string de un campo de globalFormData de forma segura
 */
const fd = (formData: DataRecord, ...keys: string[]): string => {
    for (const key of keys) {
        const val = formData[key];
        if (val) return stripHtml(String(val));
    }
    return '';
};

/**
 * Genera el documento institucional completo estructurado en Markdown
 */
export const buildFullDocumentMarkdown = (
    formData: DataRecord = {},
    data: PromptClipboardContextData
): string => {
    const title    = fd(formData, 'NombreProyecto', 'nombre_proyecto', 'Titulo') || data.projectMetadata?.titulo || 'Proyecto de Investigación';
    const code     = fd(formData, 'CodigoProyecto', 'codigo_proyecto') || data.projectMetadata?.codigo || 'En formulación';
    const carrera  = fd(formData, 'Carrera', 'carrera') || data.projectMetadata?.carrera || 'No especificada';
    const linea    = fd(formData, 'LineaInvestigacion', 'linea_investigacion') || data.projectMetadata?.lineaInvestigacion || 'No especificada';
    const sublinea = fd(formData, 'SublineaInvestigacion', 'sublinea_investigacion');
    const tipo     = fd(formData, 'TipoInvestigacion', 'tipo_investigacion') || data.projectMetadata?.tipoInvestigacion || 'No especificado';

    const sections: string[] = [];

    sections.push(`# DOCUMENTO INSTITUCIONAL COMPLETO`);
    sections.push(`## 1. IDENTIFICACIÓN INSTITUCIONAL DEL PROYECTO
• Título: ${title}
• Código Oficial: ${code}
• Carrera / Unidad Académica: ${carrera}
• Línea de Investigación: ${linea}${sublinea ? ` / ${sublinea}` : ''}
• Tipo de Investigación: ${tipo}`);

    // Equipo de investigación
    const investigadores = formData.Investigadores || formData.investigadores;
    if (Array.isArray(investigadores) && investigadores.length > 0) {
        sections.push(`\n## 2. EQUIPO DE INVESTIGACIÓN\n${formatStructuredCollection('investigadores', investigadores as DataRecord[])}`);
    }

    // Especificación Técnica
    const techSections: { label: string; value: string }[] = [
        { label: '3.1 Antecedentes de la Problemática',          value: fd(formData, 'Antecedentes', 'antecedentes') },
        { label: '3.2 Descripción y Alcance del Proyecto',       value: fd(formData, 'DescripcionProyecto', 'descripcion_proyecto') },
        { label: '3.3 Justificación Académica e Institucional',  value: fd(formData, 'Justificacion', 'justificacion') },
        { label: '3.4.1 Objetivo General',                       value: fd(formData, 'ObjetivoGeneral', 'objetivo_general') },
        { label: '3.4.2 Objetivos Específicos',                  value: fd(formData, 'ObjetivosEspecificos', 'objetivos_especificos') },
        { label: '3.5 Marco Teórico y Conceptual',               value: fd(formData, 'MarcoTeorico', 'marco_teorico') },
        { label: '3.6 Metodología y Procedimientos Científicos', value: fd(formData, 'Metodologia', 'metodologia') },
        { label: '3.7 Criterios y Métricas de Evaluación',       value: fd(formData, 'Evaluacion', 'evaluacion') },
    ];

    const hasAnyTech = techSections.some(s => s.value && s.value.trim().length > 0);
    if (hasAnyTech) {
        sections.push(`\n## 3. ESPECIFICACIÓN TÉCNICA DEL PROYECTO`);
        techSections.forEach(sec => {
            sections.push(`### ${sec.label}\n${sec.value || '(Pendiente de redacción)'}\n`);
        });
    }

    // Productos Esperados — serializa con conocimiento de los campos reales del modelo
    const productos = formData.ProductosEsperados || formData.productos_esperados;
    if (Array.isArray(productos) && productos.length > 0) {
        const productosText = (productos as DataRecord[]).map((item, i) => {
            const nombre   = String(item.titulo || item.nombre || item.Nombre || `Entregable ${i + 1}`);
            const cat      = String(item.categoria || item.Categoria || '');
            const subtipo  = String(item.tipo || item.subtipo || item.Tipo || '');
            const cantidad = String(item.cantidad ?? item.Cantidad ?? '');
            const plazo    = String(item.plazo || item.Plazo || '');
            return [
                `${i + 1}. ${nombre}`,
                cat      ? `   • Categoría: ${cat}${subtipo ? ` / ${subtipo}` : ''}` : '',
                cantidad ? `   • Cantidad: ${cantidad}` : '',
                plazo    ? `   • Plazo: ${plazo}` : '',
            ].filter(Boolean).join('\n');
        }).join('\n\n');
        sections.push(`\n## 4. PRODUCTOS ESPERADOS (ENTREGABLES CACES)\n${productosText}`);
    }

    // Matriz de Impactos — almacenados como campos planos: Impacto_social, Impacto_cientifico, etc.
    const impactoKeys = Object.keys(formData).filter(k => k.startsWith('Impacto_'));
    if (impactoKeys.length > 0) {
        const impactoLines = impactoKeys
            .map(k => {
                const label = k.replace('Impacto_', '').replace(/_/g, ' ');
                const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
                const value = stripHtml(formData[k]);
                return value ? `• ${capitalized}: ${value}` : null;
            })
            .filter(Boolean)
            .join('\n');
        if (impactoLines) {
            sections.push(`\n## 5. MATRIZ DE IMPACTO\n${impactoLines}`);
        }
    }

    // Presupuesto
    const presupuesto = formData.Presupuesto || formData.presupuesto;
    if (Array.isArray(presupuesto) && presupuesto.length > 0) {
        sections.push(`\n## 6. RECURSOS Y FINANCIAMIENTO\n${formatStructuredCollection('presupuesto', presupuesto as DataRecord[])}`);
    }

    // Bibliografía
    const biblio = fd(formData, 'Bibliografia', 'bibliografia');
    if (biblio) {
        sections.push(`\n## 7. REFERENCIAS BIBLIOGRÁFICAS (APA 7ma Ed.)\n${biblio}`);
    }

    if (data.role === 'reviewer') {
        sections.push(`\n## PAUTAS PARA AUDITORÍA Y PRE-DICTAMEN INSTITUCIONAL (REVISOR):
1. Evaluar la trazabilidad y coherencia lógica transversal: problema → justificación → objetivos → metodología → cronograma → presupuesto.
2. Identificar inconsistencias en horas docentes, partidas presupuestarias no justificadas o debilidades metodológicas.
3. Formular observaciones técnicas constructivas, específicas y fundamentadas bajo normativa institucional y CACES para orientar la subsanación del docente.`);
    } else {
        sections.push(`\n## PAUTAS METODOLÓGICAS INSTITUCIONALES:
1. Mantener estricto rigor metodológico y coherencia lógica entre antecedentes, problema, objetivos y resultados.
2. Citar bajo norma APA 7ma edición con fuentes indexadas recientes (Scopus, WoS, Latindex Catálogo 2.0).
3. Asegurar lenguaje formal, tercera persona o voz pasiva impersonal, de acuerdo a los estándares del Instituto.`);
    }

    return sections.join('\n');
};

/**
 * Genera el texto estructurado según el modo de copiado
 */
export const buildClipboardPayload = (
    mode: CopyMode,
    data: PromptClipboardContextData,
    globalFormData?: DataRecord
): string => {
    const formData: DataRecord = globalFormData ?? {};

    const rawContent = data.currentContent !== undefined && data.currentContent !== null
        ? data.currentContent
        : (data.fieldKey ? formData[data.fieldKey] : '');

    const cleanContent = resolveContentString(rawContent, data.fieldKey, data.contentSerializer).trim();

    // 1. Solo contenido redactado
    if (mode === 'clean_content') {
        return cleanContent || '(Sin contenido redactado)';
    }

    // 2. Solo instrucciones y requisitos
    if (mode === 'instructions') {
        const parts: string[] = [];
        if (data.sectionTitle) parts.push(`SECCIÓN: ${data.sectionTitle}`);
        if (data.instructions) parts.push(`INSTRUCCIONES:\n${data.instructions}`);
        if (data.requirementText) parts.push(`REQUISITO INSTITUCIONAL:\n${data.requirementText}`);
        return parts.join('\n\n');
    }

    // 3. Resumen global del proyecto
    if (mode === 'project_summary') {
        const title    = fd(formData, 'NombreProyecto', 'nombre_proyecto', 'Titulo') || data.projectMetadata?.titulo || 'Sin Título';
        const code     = fd(formData, 'CodigoProyecto', 'codigo_proyecto') || data.projectMetadata?.codigo || 'En formulación';
        const carrera  = fd(formData, 'Carrera', 'carrera') || data.projectMetadata?.carrera || 'No especificada';
        const linea    = fd(formData, 'LineaInvestigacion', 'linea_investigacion') || data.projectMetadata?.lineaInvestigacion || 'No especificada';
        const tipo     = fd(formData, 'TipoInvestigacion', 'tipo_investigacion') || data.projectMetadata?.tipoInvestigacion || 'No especificado';

        return [
            `# RESUMEN GENERAL DEL PROYECTO DE INVESTIGACIÓN`,
            `• Título: ${title}`,
            `• Código: ${code}`,
            `• Carrera / Unidad Académica: ${carrera}`,
            `• Línea de Investigación: ${linea}`,
            `• Tipo de Investigación: ${tipo}`
        ].join('\n');
    }

    // 4. Documento Completo Estructurado
    if (mode === 'full_document') {
        return buildFullDocumentMarkdown(formData, data);
    }

    // 5. Copiado estructurado con criterios (Modo Principal por defecto)
    const projectTitle = fd(formData, 'NombreProyecto', 'nombre_proyecto', 'Titulo') || data.projectMetadata?.titulo || '';
    const carreraStr   = fd(formData, 'Carrera', 'carrera') || data.projectMetadata?.carrera || '';

    const lines: string[] = [];

    // Perfil de Auditor / Revisor Técnico
    if (data.role === 'reviewer') {
        lines.push(`# EVALUACIÓN TÉCNICA Y AUDITORÍA DE SECCIÓN`);
        if (projectTitle) lines.push(`• Proyecto de Investigación: ${projectTitle}`);
        if (carreraStr) lines.push(`• Carrera / Unidad Académica: ${carreraStr}`);
        if (data.sectionTitle) lines.push(`• Sección Auditada: ${data.sectionTitle}`);

        lines.push(`\n## CRITERIOS Y NORMATIVA DE EVALUACIÓN:`);
        if (data.instructions) {
            lines.push(data.instructions);
        }
        if (data.requirementText) {
            lines.push(`REQUISITO EXIGIDO: ${data.requirementText}`);
        }
        if (!data.instructions && !data.requirementText) {
            lines.push(`Validar rigor metodológico, viabilidad técnica, pertinencia institucional y cumplimiento con estándares CACES.`);
        }

        lines.push(`\n## CONTENIDO PRESENTADO POR EL INVESTIGADOR:`);
        lines.push(cleanContent || `(Sin contenido registrado en esta sección)`);

        lines.push(`\n## CONSIGNAS DE AUDITORÍA Y FORMULACIÓN DE OBSERVACIONES:`);
        lines.push(`1. Evaluar la solidez técnica, exhaustividad y coherencia interna de esta sección frente a los objetivos del proyecto.`);
        lines.push(`2. Identificar debilidades metodológicas, vacíos de información o incumplimientos normativos.`);
        lines.push(`3. Redactar una observación técnica formal, precisa y constructiva para que el evaluador/administrador solicite la subsanación correspondiente.`);

        return lines.join('\n');
    }

    // Perfil de Autor / Investigador (por defecto)
    lines.push(`# CONTEXTO INSTITUCIONAL`);
    if (projectTitle) lines.push(`• Tema del Proyecto: ${projectTitle}`);
    if (carreraStr) lines.push(`• Carrera: ${carreraStr}`);
    if (data.sectionTitle) lines.push(`• Sección Oficial: ${data.sectionTitle}`);

    lines.push(`\n## INSTRUCCIONES Y CRITERIOS DE EVALUACIÓN:`);
    if (data.instructions) {
        lines.push(data.instructions);
    }
    if (data.requirementText) {
        lines.push(`REQUISITO EXIGIDO: ${data.requirementText}`);
    }
    if (!data.instructions && !data.requirementText) {
        lines.push(`Seguir las pautas de rigor académico, metodología científica y estilo de citación APA 7ma edición.`);
    }

    lines.push(`\n## CONTENIDO ACTUAL (BORRADOR):`);
    lines.push(cleanContent || `(Aún no se ha redactado contenido en esta sección)`);

    lines.push(`\n## CONSIGNAS DE APOYO METODOLÓGICO:`);
    lines.push(`1. Revisar y redactar con lenguaje técnico, académico y preciso.`);
    lines.push(`2. Cumplir estrictamente con la extensión y requisitos normativos detallados arriba.`);
    lines.push(`3. Asegurar coherencia directa con el tema y objetivos de la propuesta institucional.`);

    return lines.join('\n');
};
