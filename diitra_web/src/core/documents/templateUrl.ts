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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Convierte un código interno de plantilla al valor de ?edit= (protocolo-investigacion). */
export function templateCodeToEditParam(templateCode: string): string {
    return templateCodeToSlug(templateCode);
}

/** Interpreta ?edit= como código interno de plantilla. */
export function editParamToTemplateCode(editParam: string, defaultTemplateCode: string): string {
    if (editParam === 'true') return defaultTemplateCode;
    if (UUID_RE.test(editParam)) return editParam;
    return slugToTemplateCode(editParam.replace(/_/g, '-'));
}

/** Indica si ?edit= usa el formato legado en mayúsculas/underscores. */
export function isLegacyEditParam(value: string): boolean {
    if (value === 'true' || UUID_RE.test(value)) return false;
    return value.includes('_') || value !== value.toLowerCase();
}
