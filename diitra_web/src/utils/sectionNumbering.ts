/**
 * @file sectionNumbering.ts
 * @description Utilidades para la normalización y numeración inteligente y dinámica
 * de secciones y bloques en documentos, navegación lateral y workspace de DIITRA.
 */

/**
 * Limpia cualquier prefijo numérico manual existente en el título o etiqueta de la sección.
 * Ejemplos:
 * - "1. IDENTIFICACIÓN DEL PROYECTO" -> "IDENTIFICACIÓN DEL PROYECTO"
 * - "1.- IDENTIFICACIÓN" -> "IDENTIFICACIÓN"
 * - "1) IDENTIFICACIÓN" -> "IDENTIFICACIÓN"
 * - "3. ESPECIFICACIÓN DEL PROYECTO" -> "ESPECIFICACIÓN DEL PROYECTO"
 * - "8. BIBLIOGRAFÍA" -> "BIBLIOGRAFÍA"
 * - "EQUIPO HUMANO" -> "EQUIPO HUMANO"
 */
export const cleanSectionTitle = (rawTitle?: string | null): string => {
    if (!rawTitle || typeof rawTitle !== 'string') return '';
    return rawTitle
        .replace(/^(\d+[\.\-\)\s]*)+\s*/i, '')
        .trim();
};

/**
 * Formatea un título de sección anteponiendo de manera secuencial y dinámica
 * su número de bloque/sección en base a su índice actual (1-indexed).
 *
 * @param rawTitle - Título original de la sección (con o sin número manual previo).
 * @param index - Índice posicional en la lista de secciones activas (0-indexed).
 * @returns Título formateado con numeración secuencial dinámica (ej: "2. EQUIPO HUMANO").
 */
export const formatDynamicSectionLabel = (rawTitle?: string | null, index: number = 0): string => {
    const cleaned = cleanSectionTitle(rawTitle);
    const baseText = cleaned || rawTitle || 'Sección';
    return `${index + 1}. ${baseText}`;
};

/**
 * Normaliza y numera dinámicamente un arreglo de secciones de documento.
 */
export const applyDynamicSectionNumbering = <T extends { label?: string; title?: string }>(
    sections: T[]
): T[] => {
    if (!Array.isArray(sections)) return [];
    return sections.map((sec, index) => {
        const rawLabel = sec.label || sec.title || '';
        const dynamicLabel = formatDynamicSectionLabel(rawLabel, index);
        return {
            ...sec,
            label: dynamicLabel,
        };
    });
};
