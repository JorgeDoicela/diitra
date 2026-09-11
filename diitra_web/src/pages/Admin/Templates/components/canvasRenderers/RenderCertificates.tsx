import React from 'react';
import { Award, User, ShieldCheck, Calendar, Sparkles, Building2, CheckCheck } from 'lucide-react';
import type { DocumentBlockConfig } from '../../types';

interface RenderCertBlockProps {
    config?: DocumentBlockConfig;
    themeConfig?: any;
}

export const RenderCertificateHeader: React.FC<RenderCertBlockProps> = ({ config }) => {
    const institutionName = (config as any)?.institutionName || 'INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI';
    const certTitle = (config as any)?.certificateTitle || 'CERTIFICADO DE COMPLETACIÓN';
    const certSubtitle = (config as any)?.certificateSubtitle || 'DIRECCIÓN DE INVESTIGACIÓN, INNOVACIÓN Y TRANSFERENCIA TECNOLÓGICA (DIITRA)';
    const certNumber = (config as any)?.certificateNumber || 'DIITRA-CERT-2026-XXXX';

    return (
        <div className="relative p-8 rounded-2xl bg-gradient-to-br from-amber-500/5 via-primary/5 to-transparent border-2 border-amber-500/20 shadow-sm text-center overflow-hidden">
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-[10px] font-mono font-bold tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>FORMATO INSTITUCIONAL OFICIAL</span>
            </div>

            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
                <Award className="w-7 h-7 stroke-[1.5]" />
            </div>

            <div className="text-xs md:text-sm font-extrabold tracking-widest text-text-secondary uppercase mb-1">
                {institutionName}
            </div>

            <p className="text-[11px] font-semibold text-text-tertiary tracking-wide uppercase max-w-md mx-auto mb-3">
                {certSubtitle}
            </p>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-primary uppercase font-display">
                {certTitle}
            </h1>

            <div className="mt-4 pt-3 border-t border-border-subtle inline-flex items-center gap-2 text-[10px] text-text-tertiary font-mono">
                <span>N° Registro:</span>
                <span className="font-bold text-text-secondary">{certNumber}</span>
            </div>
        </div>
    );
};

export const RenderCertificateRecipientBadge: React.FC<RenderCertBlockProps> = ({ config }) => {
    const conferralText = (config as any)?.conferralText || 'Otorgado a:';
    const defaultRecipient = (config as any)?.recipientName || '{{ RecipientName }}';
    const defaultRole = (config as any)?.recipientRole || '{{ RecipientRole }}';
    const defaultCedula = (config as any)?.recipientCedula || '{{ RecipientCedula }}';

    return (
        <div className="p-6 rounded-xl bg-surface border border-border-subtle shadow-sm my-3 flex flex-col items-center text-center">
            <p className="text-xs uppercase tracking-widest text-text-tertiary font-semibold mb-2">
                {conferralText}
            </p>
            
            <div className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight font-display mb-2 border-b-2 border-primary/40 pb-1 inline-block px-4">
                {defaultRecipient}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <User className="w-3 h-3" />
                    {defaultRole}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono text-text-secondary bg-bg-subtle border border-border-subtle">
                    C.I. / Identificación: {defaultCedula}
                </span>
            </div>
        </div>
    );
};

export const RenderCertificateBody: React.FC<RenderCertBlockProps> = ({ config }) => {
    const textAchievement = (config as any)?.textAchievement || 
        'Por haber culminado con éxito su participación y valiosos aportes en la ejecución del proyecto de investigación titulado:';
    const projectTitle = (config as any)?.projectTitle || '{{ ProjectTitle }}';
    const cityText = (config as any)?.cityText || 'la ciudad de Quito';
    const completionDate = (config as any)?.completionDate || '{{ IssueDate }}';
    const signatoryTitle = (config as any)?.signatoryTitle || 'Director(a) de Investigación y Transferencia Tecnológica';
    const signatoryName = (config as any)?.signatoryName || '';
    const signatoryInstitution = (config as any)?.signatoryInstitution || 'Instituto Superior Tecnológico Mayor Pedro Traversari';

    return (
        <div className="p-6 rounded-xl bg-surface border border-border-subtle space-y-5">
            <div className="text-sm text-text-secondary leading-relaxed text-center max-w-xl mx-auto">
                {textAchievement}
            </div>

            <div className="p-4 rounded-lg bg-bg-subtle border border-border-subtle/60 text-center">
                <p className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider mb-1">
                    Proyecto / Hito de Investigación
                </p>
                <p className="text-sm font-bold text-text-primary italic">
                    "{projectTitle}"
                </p>
            </div>

            <div className="text-center text-xs text-text-tertiary">
                Dado y firmado en <strong className="text-text-secondary">{cityText}</strong>, a la fecha oficial de emisión: <strong className="text-text-secondary">{completionDate}</strong>
            </div>

            {/* Bloque de Firma */}
            <div className="pt-4 border-t border-border-subtle/70 flex flex-col items-center text-center">
                <div className="w-48 border-t border-text-tertiary/40 mb-2"></div>
                {signatoryName && (
                    <div className="text-xs font-bold text-text-primary mb-0.5">{signatoryName}</div>
                )}
                <div className="text-xs font-semibold text-text-secondary">{signatoryTitle}</div>
                <div className="text-[11px] text-text-tertiary">{signatoryInstitution}</div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-text-tertiary">
                <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Fecha: <strong className="text-text-secondary">{completionDate}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-emerald-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verificación CACES & QR Oficial</span>
                </div>
            </div>
        </div>
    );
};
