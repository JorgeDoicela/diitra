import type { DocumentBlock } from '../../types';

export const generateCertificateHeaderHtml = (block: DocumentBlock, themeConfig?: any): string => {
    const certTitle = (block.config as any)?.certificateTitle || 'CERTIFICADO DE COMPLETACIÓN';
    const certSubtitle = (block.config as any)?.certificateSubtitle || 'DIRECCIÓN DE INVESTIGACIÓN, DESARROLLO E INNOVACIÓN (DIITRA)';

    return `
    <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 13pt; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #0f172a; margin-bottom: 4px;">
            INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI
        </div>
        <div style="font-size: 8.5pt; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 14px;">
            ${certSubtitle}
        </div>
        <div style="font-size: 22pt; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 3px; margin: 10px 0 6px 0;">
            ${certTitle}
        </div>
    </div>
    `;
};

export const generateCertificateRecipientBadgeHtml = (block: DocumentBlock): string => {
    return `
    <div style="text-align: center; margin: 14px 0;">
        <div style="font-size: 10pt; color: #475569; margin-bottom: 4px;">Otorgado a:</div>
        <div style="font-size: 20pt; font-weight: 800; color: #0f172a; border-bottom: 1.5px solid #0284c7; display: inline-block; padding-bottom: 3px; margin: 4px 0 8px 0;">
            {{ data.recipient_name }}
        </div>
        <br>
        <div style="font-size: 9pt; font-weight: 700; color: #0284c7; background-color: #e0f2fe; padding: 3px 14px; border-radius: 10px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
            {{ data.recipient_role }}
        </div>
    </div>
    `;
};

export const generateCertificateBodyHtml = (block: DocumentBlock): string => {
    const textAchievement = (block.config as any)?.textAchievement || 
        'Por haber culminado con éxito su participación y valiosos aportes en la ejecución del proyecto de investigación titulado:';

    return `
    <div style="text-align: center; margin: 12px 0;">
        <div style="font-size: 10pt; line-height: 1.5; color: #334155; max-width: 82%; margin: 0 auto 10px auto;">
            ${textAchievement}<br>
            <strong style="font-style: italic; color: #0f172a;">"{{ data.project_title | default: data.certificate_title | default: data.group_name }}"</strong>
        </div>

        <div style="font-size: 9.5pt; color: #475569; margin: 12px 0 18px 0;">
            Dado y firmado en la ciudad de Quito, a los {{ data.completion_date | default: data.issue_date }}.
        </div>

        <div style="margin-top: 18px; text-align: center;">
            <div style="width: 220px; border-top: 1px solid #94a3b8; margin: 0 auto 4px auto;"></div>
            <div style="font-size: 8.5pt; font-weight: 700; color: #1e293b;">Director(a) de Investigación y Transferencia Tecnológica</div>
            <div style="font-size: 7.5pt; color: #64748b;">Instituto Superior Tecnológico Mayor Pedro Traversari</div>
        </div>
    </div>
    `;
};
