import React from 'react';
import { Mail, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface EmailPreviewSectionProps {
    parsedPreview: {
        subject: string;
        body: string;
        fullHtml: string;
        recipientName: string;
    };
    previewReplacements: Record<string, string>;
}

export const EmailPreviewSection: React.FC<EmailPreviewSectionProps> = ({
    parsedPreview,
    previewReplacements
}) => {
    return (
        <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-2 ml-1">
                <Eye size={13} /> Vista previa (como lo verá el destinatario)
            </h4>

            <div className="rounded-xl border border-[#d1d1d1] overflow-hidden shadow-md bg-white min-h-[520px] flex flex-col">
                {/* Barra superior estilo Outlook */}
                <div className="bg-[#f0f0f0] border-b border-[#d1d1d1] px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#0078d4] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                            DI
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#242424] truncate">
                                DIITRA Investigación
                            </div>
                            <div className="text-xs text-[#616161] mt-0.5 truncate">
                                Para: <span className="font-medium text-[#242424]">{parsedPreview.recipientName}</span>
                                {previewReplacements['[[destinatario_email]]'] && (
                                    <span className="text-[#616161]"> &lt;{previewReplacements['[[destinatario_email]]']}&gt;</span>
                                )}
                            </div>
                            <div className="text-xs font-semibold text-[#242424] mt-1.5 truncate">
                                {parsedPreview.subject || '(Sin asunto)'}
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] text-[#616161] shrink-0 whitespace-nowrap">
                        {format(new Date(), "EEE dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                </div>

                {/* Cuerpo del correo con plantilla maestra */}
                <div className="flex-1 bg-[#fafafa] min-h-[420px]">
                    {parsedPreview.fullHtml ? (
                        <iframe
                            title="Vista previa del correo institucional"
                            srcDoc={parsedPreview.fullHtml}
                            className="w-full h-[min(72vh,640px)] border-0 bg-[#fafafa]"
                            sandbox="allow-scripts"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Mail size={32} className="stroke-1 opacity-40 mb-2" />
                            <span className="text-xs">Seleccione un tipo de comunicación</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailPreviewSection;
