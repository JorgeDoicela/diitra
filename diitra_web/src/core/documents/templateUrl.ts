/** Convierte un código interno (PROTOCOLO_INVESTIGACION) a slug de URL (protocolo-investigacion). */
export function templateCodeToSlug(code: string): string {
    return code.toLowerCase().replace(/_/g, '-');
}

/** Convierte un segmento de URL a código interno de plantilla. */
export function slugToTemplateCode(slug: string): string {
    return slug.replace(/-/g, '_').toUpperCase();
}

export function buildWorkspacePath(templateCode: string, documentUuid: string, search = '', prefix = '/investigacion'): string {
    return `${prefix}/workspace/${templateCodeToSlug(templateCode)}/${documentUuid}${search}`;
}

/** Indica si el segmento de URL usa el formato legado en mayúsculas/underscores. */
export function isLegacyTemplateUrlSegment(segment: string): boolean {
    return segment.includes('_') || segment !== segment.toLowerCase();
}
