/**
 * Convierte contenido HTML (p. ej. plantillas de correo) en texto plano legible.
 */
export function stripHtmlToText(html: string): string {
    if (!html) return '';

    if (typeof document !== 'undefined') {
        const withBreaks = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<\/div>/gi, '\n');
        const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
        return (doc.body.textContent || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    return html
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/p>/gi, ' ')
        .replace(/<\/div>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}
