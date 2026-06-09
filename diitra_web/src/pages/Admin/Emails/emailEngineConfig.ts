import type { EmailTemplate } from './emailEngineTypes';

export interface SubjectVariant {
    id: string;
    label: string;
    asunto: string;
}

export const AUTO_TOKENS = new Set([
    '[[destinatario_nombre]]',
    '[[destinatario_email]]',
    '[[anio_actual]]',
    '[[institucion_nombre]]',
    '[[sistema_url]]'
]);

export const TOKEN_LABELS: Record<string, { label: string; hint?: string }> = {
    '[[destinatario_nombre]]': { label: 'Nombre del destinatario' },
    '[[destinatario_email]]': { label: 'Correo del destinatario' },
    '[[anio_actual]]': { label: 'Año en curso' },
    '[[institucion_nombre]]': { label: 'Institución' },
    '[[sistema_url]]': { label: 'Enlace al sistema' },
    '[[proyecto_titulo]]': { label: 'Título del proyecto' },
    '[[proyecto_codigo]]': { label: 'Código del proyecto' },
    '[[proyecto_descripcion]]': { label: 'Descripción del proyecto' },
    '[[proyecto_estado]]': { label: 'Estado del proyecto' },
    '[[proyecto_director]]': { label: 'Director del proyecto' },
    '[[proyecto_director_email]]': { label: 'Correo del director' },
    '[[linea_investigacion]]': { label: 'Línea de investigación' },
    '[[proyecto_sublinea]]': { label: 'Sublínea de investigación' },
    '[[proyecto_workspace_url]]': { label: 'Enlace al proyecto' },
    '[[url_adopcion]]': { label: 'Enlace de adopción' },
    '[[convocatoria_titulo]]': { label: 'Título de la convocatoria' },
    '[[convocatoria_codigo]]': { label: 'Código de convocatoria' },
    '[[convocatoria_anio]]': { label: 'Año de la convocatoria' },
    '[[convocatoria_apertura]]': { label: 'Fecha de apertura' },
    '[[convocatoria_cierre]]': { label: 'Fecha de cierre' },
    '[[convocatoria_presupuesto]]': { label: 'Presupuesto total' },
    '[[convocatoria_monto_maximo]]': { label: 'Monto máximo por proyecto' },
    '[[convocatoria_bases_url]]': { label: 'URL de las bases' },
    '[[convocatoria_estado]]': { label: 'Estado de la convocatoria' },
    '[[revisor_nombre]]': { label: 'Nombre del revisor' },
    '[[revisor_email]]': { label: 'Correo del revisor' },
    '[[peer_review_dictamen]]': { label: 'Dictamen del revisor' },
    '[[peer_review_estado]]': { label: 'Estado de la revisión' },
    '[[peer_review_fecha_limite]]': { label: 'Fecha límite de revisión' },
    '[[peer_review_puntaje]]': { label: 'Puntaje de evaluación' },
    '[[peer_review_observaciones]]': { label: 'Observaciones del revisor' },
    '[[peer_review_tipo]]': { label: 'Tipo de revisor' },
    '[[peer_review_anonimo]]': { label: 'Modalidad de evaluación' },
    '[[fecha_postulacion]]': { label: 'Fecha de postulación' },
    '[[nombre_hito]]': { label: 'Nombre del hito del cronograma' },
    '[[fecha_limite_hito]]': { label: 'Fecha límite del hito' },
    '[[mensaje_adicional]]': { label: 'Nota adicional' }
};

/** Contexto recomendado por tipo de comunicación */
export const TEMPLATE_RECOMMENDED_CONTEXT: Record<string, { entityType: string; hint: string }> = {
    PROYECTO_INCONCLUSO_DISPONIBLE: { entityType: 'Proyecto', hint: 'Seleccione el proyecto que se ofrece en adopción.' },
    NUEVA_CONVOCATORIA: { entityType: 'Convocatoria', hint: 'Seleccione la convocatoria que se está abriendo.' },
    PROYECTO_POSTULADO: { entityType: 'Proyecto', hint: 'Seleccione el proyecto postulado.' },
    ASIGNACION_REVISOR: { entityType: 'PeerReview', hint: 'Seleccione la evaluación de pares asignada.' },
    DICTAMEN_DISPONIBLE: { entityType: 'PeerReview', hint: 'Seleccione la revisión con dictamen consolidado (o el proyecto relacionado).' },
    ALERTA_HITO_VENCIMIENTO: { entityType: 'Proyecto', hint: 'Seleccione el proyecto cuyo hito está por vencer.' }
};

export const SUBJECT_VARIANTS: Record<string, SubjectVariant[]> = {
    PROYECTO_INCONCLUSO_DISPONIBLE: [
        { id: 'default', label: 'Oportunidad de adopción', asunto: 'DIITRA: Oportunidad de Adopción de Proyecto - [[proyecto_titulo]]' },
        { id: 'urgente', label: 'Prioridad alta', asunto: 'DIITRA [URGENTE]: Proyecto disponible para adopción - [[proyecto_titulo]]' }
    ],
    NUEVA_CONVOCATORIA: [
        { id: 'default', label: 'Apertura oficial', asunto: 'DIITRA: Apertura de Convocatoria Oficial - [[convocatoria_titulo]]' },
        { id: 'recordatorio', label: 'Recordatorio de cierre', asunto: 'DIITRA: Recordatorio — Cierre de convocatoria [[convocatoria_codigo]]' }
    ],
    PROYECTO_POSTULADO: [
        { id: 'default', label: 'Confirmación de recepción', asunto: 'DIITRA: Postulación de Proyecto Recibida - [[proyecto_titulo]]' },
        { id: 'formal', label: 'Acuse formal', asunto: 'DIITRA: Acuse de Recibo — Protocolo [[proyecto_codigo]]' }
    ],
    ASIGNACION_REVISOR: [
        { id: 'default', label: 'Solicitud de evaluación', asunto: 'DIITRA: Solicitud de evaluación anónima por pares' },
        { id: 'plazo', label: 'Recordatorio de plazo', asunto: 'DIITRA: Recordatorio — Evaluación pendiente hasta [[peer_review_fecha_limite]]' }
    ],
    DICTAMEN_DISPONIBLE: [
        { id: 'default', label: 'Dictamen oficial', asunto: 'DIITRA: Dictamen de Evaluación Oficial - [[proyecto_titulo]]' },
        { id: 'resultado', label: 'Resultado consolidado', asunto: 'DIITRA: Resultado [[peer_review_dictamen]] — [[proyecto_titulo]]' }
    ],
    ALERTA_HITO_VENCIMIENTO: [
        { id: 'default', label: 'Alerta de hito', asunto: 'DIITRA Alerta: Vencimiento de Hito Próximo - [[nombre_hito]]' },
        { id: 'urgente', label: 'Alerta urgente', asunto: 'DIITRA [URGENTE]: Hito vence pronto — [[nombre_hito]]' }
    ]
};

export function getSubjectVariants(template: EmailTemplate): SubjectVariant[] {
    const variants = SUBJECT_VARIANTS[template.codigo];
    if (variants?.length) return variants;
    return [{ id: 'default', label: 'Asunto estándar', asunto: template.asunto }];
}

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function buildBodyWithAdditionalMessage(bodyHtml: string, additionalMessage: string): string {
    const note = additionalMessage.trim();
    if (!note) return bodyHtml;

    const escaped = escapeHtml(note).replace(/\n/g, '<br/>');
    if (bodyHtml.includes('[[mensaje_adicional]]')) {
        return bodyHtml.replace(/\[\[mensaje_adicional\]\]/g, escaped);
    }

    const insert = `<p style="color:#444444;font-size:14px;line-height:1.6;margin:16px 0 20px 0;">${escaped}</p>`;
    const footerMatch = bodyHtml.match(/<div style="border-top: 1px solid #eaeaea/i);
    if (footerMatch && footerMatch.index !== undefined) {
        return bodyHtml.slice(0, footerMatch.index) + insert + bodyHtml.slice(footerMatch.index);
    }
    return bodyHtml + insert;
}

export function getTokenLabel(token: string): string {
    return TOKEN_LABELS[token]?.label ?? token.replace(/\[\[|\]\]/g, '').replace(/_/g, ' ');
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Valores de ejemplo para la vista previa (no se envían al backend si están vacíos en el formulario) */
export function getPreviewDefaults(origin: string): Record<string, string> {
    return {
        '[[destinatario_nombre]]': 'Juan Pérez (Ejemplo)',
        '[[destinatario_email]]': 'juan.perez@traversari.edu.ec',
        '[[anio_actual]]': new Date().getFullYear().toString(),
        '[[institucion_nombre]]': 'Instituto Superior Tecnológico Traversari',
        '[[sistema_url]]': origin
    };
}

/** Solo incluye valores no vacíos; los defaults de preview no se pisan con strings vacíos */
export function mergeTokenReplacements(
    tokenValues: Record<string, string>,
    origin: string
): Record<string, string> {
    const merged = { ...getPreviewDefaults(origin) };
    Object.entries(tokenValues).forEach(([tok, val]) => {
        if (val?.trim()) merged[tok] = val.trim();
    });
    return merged;
}

/** Sustituye tokens. En asunto siempre texto plano; en cuerpo HTML escapa valores y marca pendientes sin romper etiquetas */
export function applyTokenReplacements(
    template: string,
    replacements: Record<string, string>,
    mode: 'text' | 'html'
): string {
    let result = template;

    Object.entries(replacements).forEach(([tok, val]) => {
        const safeVal = mode === 'html' ? escapeHtml(val) : val;
        result = result.replace(new RegExp(escapeRegExp(tok), 'g'), safeVal);
    });

    result = result.replace(/\[\[([a-zA-Z0-9_]+)\]\]/g, (match) => {
        const label = getTokenLabel(match);
        if (mode === 'text') return `«${label}»`;
        return `<span class="email-preview-pending" style="background:rgba(245,166,35,0.15);border:1px dashed #f5a623;padding:0 4px;border-radius:4px;color:#b87200;font-size:12px;">«${escapeHtml(label)}»</span>`;
    });

    return result;
}

/** Datos que se envían al API: sin claves con valor vacío */
export function buildTemplateDataForSend(tokenValues: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(tokenValues).filter(([, v]) => Boolean(v?.trim()))
    );
}

/** Payload en snake_case (convención del API .NET) */
export function buildEmailSendPayload(input: {
    templateCodigo: string;
    destinatariosEmails: string[];
    destinatariosUserIds?: number[];
    targetRole: string | null;
    targetCarreraId: number | null;
    customSubject: string;
    customBody: string;
    templateData: Record<string, string>;
    attachments: Array<{
        nombreArchivo: string;
        base64Content?: string;
        rutaArchivo?: string;
        contentType?: string;
    }>;
    entityUuid: string | null;
    entityType: string | null;
    certificateBase64: string | null;
    signaturePassword: string | null;
}) {
    return {
        template_codigo: input.templateCodigo,
        destinatarios_emails: input.destinatariosEmails,
        destinatarios_user_ids: input.destinatariosUserIds ?? [],
        target_role: input.targetRole,
        target_carrera_id: input.targetCarreraId,
        custom_subject: input.customSubject,
        custom_body: input.customBody,
        template_data: input.templateData,
        attachments: input.attachments.map(a => ({
            nombre_archivo: a.nombreArchivo,
            base64_content: a.base64Content ?? null,
            ruta_archivo: a.rutaArchivo ?? null,
            content_type: a.contentType ?? null
        })),
        entity_uuid: input.entityUuid,
        entity_type: input.entityType,
        certificate_base64: input.certificateBase64,
        signature_password: input.signaturePassword
    };
}
