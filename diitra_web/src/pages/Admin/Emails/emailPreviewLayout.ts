/**
 * Vista previa del correo con el mismo layout institucional que MasterLayout.html (backend).
 */
import { escapeHtml } from './emailEngineConfig';

const SKIP_EXTRA_KEYS = new Set([
    '[[destinatario_nombre]]',
    '[[destinatario_email]]',
    '[[anio_actual]]',
    '[[institucion_nombre]]',
    '[[sistema_url]]'
]);

const CONTEXT_TOKEN_PREFIXES: Record<string, string[]> = {
    Proyecto: ['proyecto_', 'linea_investigacion', 'url_adopcion', 'nombre_hito', 'fecha_limite_hito', 'fecha_postulacion'],
    Convocatoria: ['convocatoria_'],
    PeerReview: ['peer_review_', 'revisor_']
};

export function clearContextTokenValues(
    prev: Record<string, string>,
    contextType: string
): Record<string, string> {
    const prefixes = CONTEXT_TOKEN_PREFIXES[contextType] ?? [];
    const next = { ...prev };
    Object.keys(next).forEach(tok => {
        const inner = tok.replace(/\[\[|\]\]/g, '').toLowerCase();
        if (prefixes.some(p => inner.includes(p))) {
            next[tok] = '';
        }
    });
    return next;
}

/** Quita cabecera/pie duplicados de plantillas legacy (el layout maestro ya los incluye). */
export function extractInnerContent(html: string): string {
    if (!html?.trim()) return '<p></p>';

    let slice = html;

    const h2Match = slice.match(/<h2\b/i);
    if (h2Match?.index != null) {
        slice = slice.slice(h2Match.index);
        slice = slice.replace(/<h2[^>]*>[\s\S]*?<\/h2>\s*/i, '');
    }

    slice = slice.replace(
        /<div[^>]*border-top:\s*1px\s+solid\s+#eaeaea[\s\S]*$/i,
        ''
    );
    slice = slice.replace(
        /<p[^>]*>[\s\S]{0,200}correo automático[\s\S]*?<\/p>\s*/i,
        ''
    );

    slice = slice.replace(
        /<div[^>]*max-width:\s*600px[\s\S]*?<h2/i,
        '<h2'
    );
    slice = slice.replace(
        /<div[^>]*text-align:\s*center[\s\S]*?Departamento de Investigación[\s\S]*?<\/div>\s*/i,
        ''
    );
    slice = slice.replace(
        /<div[^>]*border-top:\s*1px\s+solid\s+#eaeaea[\s\S]*?correo automático[\s\S]*?<\/div>\s*<\/div>\s*$/i,
        ''
    );

    return slice.trim() || '<p></p>';
}

/** Elimina bloques embebidos de detalles (proyecto, convocatoria, etc.) sin instancia vinculada. */
export function stripEmbeddedContextBlocks(html: string): string {
    let result = html;
    result = result.replace(
        /<div[^>]*background-color:\s*#fafafa[^>]*>[\s\S]*?<\/table>\s*<\/div>/gi,
        ''
    );
    result = result.replace(
        /<div[^>]*>[\s\S]*?<h3[^>]*>[\s\S]*?Detalles del (?:Proyecto|Convocatoria)[\s\S]*?<\/table>\s*<\/div>/gi,
        ''
    );
    return result;
}

export function buildExtraDataForPreview(
    replacements: Record<string, string>
): Record<string, string> | undefined {
    const rows: Record<string, string> = {};
    Object.entries(replacements).forEach(([key, value]) => {
        if (SKIP_EXTRA_KEYS.has(key)) return;
        if (!value?.trim()) return;
        if (key.toLowerCase().includes('url') && value.startsWith('http')) return;
        const label = key
            .replace(/\[\[|\]\]/g, '')
            .replace(/_/g, ' ')
            .replace(/^\w/, c => c.toUpperCase());
        rows[label] = value.trim();
    });
    return Object.keys(rows).length > 0 ? rows : undefined;
}

export function resolveActionUrlForPreview(
    replacements: Record<string, string>,
    bodyHtml: string,
    origin: string
): string | undefined {
    const priorityKeys = [
        '[[proyecto_workspace_url]]',
        '[[url_adopcion]]',
        '[[convocatoria_bases_url]]'
    ];
    for (const key of priorityKeys) {
        const val = replacements[key]?.trim();
        if (!val) continue;
        if (val.startsWith('http')) return val;
        if (val.startsWith('/')) return `${origin.replace(/\/$/, '')}${val}`;
    }
    const hrefMatch = bodyHtml.match(/<a\s+[^>]*href=["']([^"']+)["']/i);
    if (hrefMatch) {
        const href = hrefMatch[1];
        if (href.startsWith('http')) return href;
        if (href.startsWith('/')) return `${origin.replace(/\/$/, '')}${href}`;
    }
    return undefined;
}

function escapeAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export interface MasterPreviewParams {
    title: string;
    recipientName: string;
    innerBodyHtml: string;
    origin: string;
    actionUrl?: string;
    extraData?: Record<string, string>;
}

/** HTML completo del correo institucional (equivalente a MasterLayout.html renderizado). */
export function renderMasterLayoutPreview(params: MasterPreviewParams): string {
    const {
        title,
        recipientName,
        innerBodyHtml,
        origin,
        actionUrl,
        extraData
    } = params;

    const logoIstpet = `${origin.replace(/\/$/, '')}${import.meta.env.BASE_URL}logo_istpet_negro.png`;
    const logoDiitra = `${origin.replace(/\/$/, '')}${import.meta.env.BASE_URL}logo_negro.png`;
    const bodyContent = extractInnerContent(innerBodyHtml);
    const anio = new Date().getFullYear();

    const extraRows = extraData
        ? Object.entries(extraData)
              .map(
                  ([key, value]) => `
            <tr>
                <td style="padding: 8px 0; color: #666666; width: 35%; vertical-align: top; border-bottom: 1px solid #fafafa; font-family: Segoe UI, Arial, sans-serif; font-size: 13px;">${escapeAttr(key)}:</td>
                <td style="padding: 8px 0; color: #000000; font-weight: 500; vertical-align: top; border-bottom: 1px solid #fafafa; font-family: Segoe UI, Arial, sans-serif; font-size: 13px;">${escapeHtml(value)}</td>
            </tr>`
              )
              .join('')
        : '';

    const extraBlock =
        extraRows.length > 0
            ? `
                    <div style="margin: 28px 0; background-color: #fafafa; border-radius: 8px; padding: 18px 20px; border: 1px solid #eaeaea; font-family: Segoe UI, Arial, sans-serif;">
                        <h3 style="margin: 0 0 12px 0; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Detalles de la Notificación</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
                            ${extraRows}
                        </table>
                    </div>`
            : '';

    const actionBlock = actionUrl
        ? `
                    <div style="text-align: center; margin: 32px 0 28px 0;">
                        <a href="${escapeAttr(actionUrl)}" style="background-color: #000000; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block; font-family: Segoe UI, Arial, sans-serif;">VER DETALLES EN DIITRA</a>
                    </div>`
        : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeAttr(title)}</title>
<style>
body, table, td, p, a, div, span, h1, h2, h3 { font-family: Segoe UI, Arial, sans-serif !important; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#fafafa;">
<div style="background-color:#fafafa;padding:24px 12px;">
<table align="center" border="0" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:8px;border:1px solid #eaeaea;">
<tr>
<td style="padding:32px 32px 12px 32px;">
<table width="100%"><tr>
<td align="left"><img src="${logoIstpet}" alt="ISTPET" height="38" style="display:block;border:0;"></td>
<td align="right"><img src="${logoDiitra}" alt="DIITRA" height="32" style="display:block;border:0;"></td>
</tr></table>
<div style="height:6px;">&nbsp;</div>
<p style="color:#000;margin:0;font-size:15px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-align:center;">SISTEMA DIITRA</p>
<p style="color:#666;margin:6px 0 0;font-size:10px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;text-align:center;">Departamento de Investigación e Innovación Traversari</p>
</td>
</tr>
<tr>
<td style="padding:24px 32px 32px 32px;">
<h2 style="color:#000;font-size:20px;margin:0 0 16px;font-weight:600;">Hola ${escapeAttr(recipientName)},</h2>
<div style="color:#333;font-size:14px;line-height:1.6;margin:0 0 20px;">${bodyContent}</div>
${extraBlock}
${actionBlock}
<p style="color:#888;font-size:12px;line-height:1.5;margin:28px 0 0;">Si tiene alguna duda sobre esta notificación, puede responder directamente a este correo o contactarnos a través de nuestra plataforma institucional.</p>
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #eaeaea;">
<p style="color:#000;font-size:13px;margin:0 0 2px;font-weight:600;">Tecnológico Traversari</p>
<p style="color:#888;font-size:11px;margin:0;">Excelencia Académica y Tecnológica · ISTPET ${anio}</p>
</div>
<div style="margin-top:20px;background:#fafafa;border-radius:8px;padding:14px;border:1px solid #eaeaea;">
<p style="color:#666;font-size:10.5px;line-height:1.6;margin:0;">Este mensaje ha sido generado automáticamente por el Sistema DIITRA. La información contenida está protegida bajo la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador.</p>
</div>
</td>
</tr>
</table>
</div>
</body>
</html>`;
}
