import React from 'react';
import { X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import type { UseEmailHistoryResult } from '../hooks/useEmailHistory';

const sanitize = (html: string): string =>
    DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

export interface EmailHistoryDrawerProps {
    historyHook: UseEmailHistoryResult;
}

export const EmailHistoryDrawer: React.FC<EmailHistoryDrawerProps> = ({ historyHook }) => {
    const {
        isHistoryDrawerOpen,
        setIsHistoryDrawerOpen,
        selectedHistoryLog,
        getStatusBadge,
        getStatusDot
    } = historyHook;

    if (!isHistoryDrawerOpen || !selectedHistoryLog) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div
                className="absolute inset-0 bg-black/70 cursor-pointer animate-fade-in"
                onClick={() => setIsHistoryDrawerOpen(false)}
            />
            <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                <header className="modal-header">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold tracking-tighter text-text-main uppercase">Bitácora de Despacho</h3>
                        <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">ID Log: {selectedHistoryLog.uuid}</p>
                    </div>
                    <button onClick={() => setIsHistoryDrawerOpen(false)} className="text-text-dim hover:text-text-main transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bento-card static p-4">
                            <label className="section-label text-text-dim mb-2">Fecha y Hora</label>
                            <div className="text-xs font-bold text-text-main">
                                {format(new Date(selectedHistoryLog.fechaEnvio), "dd/MM/yyyy", { locale: es })}
                            </div>
                            <div className="text-[10px] text-text-dim mt-1 font-mono">
                                {format(new Date(selectedHistoryLog.fechaEnvio), "HH:mm:ss.SSS")}
                            </div>
                        </div>
                        <div className="bento-card static p-4">
                            <label className="section-label text-text-dim mb-2">Estado del servidor de correo</label>
                            <span className={`status-tag ${getStatusBadge(selectedHistoryLog.estado)}`}>
                                <span className={`dot ${getStatusDot(selectedHistoryLog.estado)}`} />
                                {selectedHistoryLog.estado}
                            </span>
                        </div>
                    </div>

                    <div className="bento-card static p-4 space-y-3">
                        <label className="section-label text-text-dim">Destinatario</label>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                                {selectedHistoryLog.nombreDestinatario ? selectedHistoryLog.nombreDestinatario.substring(0, 2).toUpperCase() : 'EX'}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-text-main">
                                    {selectedHistoryLog.nombreDestinatario || 'Destinatario Externo'}
                                </div>
                                <div className="text-xs text-text-dim font-mono mt-1">
                                    {selectedHistoryLog.destinatario}
                                </div>
                                {selectedHistoryLog.idUsuarioDestinatario && (
                                    <span className="inline-block mt-2 badge-vercel badge-vercel-neutral text-[9px] font-mono">
                                        ID Usuario: {selectedHistoryLog.idUsuarioDestinatario}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Attachments list if any */}
                    {selectedHistoryLog.adjuntosJson && (
                        <div className="space-y-2">
                            <label className="section-label text-text-dim">Adjuntos Registrados</label>
                            <div className="divide-y divide-border-thin border border-border-thin rounded-xl overflow-hidden bg-bg-deep/40 p-1.5 space-y-1">
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(selectedHistoryLog.adjuntosJson);
                                        if (Array.isArray(parsed) && parsed.length > 0) {
                                            return parsed.map((att: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2 p-2 text-xs">
                                                    <FileText size={14} className="text-text-dim shrink-0" />
                                                    <span className="font-mono text-xs truncate text-text-main">{att.nombre}</span>
                                                    <span className="text-[10px] text-text-dim/60 font-mono">({att.ruta || 'Base64'})</span>
                                                </div>
                                            ));
                                        }
                                    } catch { }
                                    return <span className="text-[10px] text-text-dim italic p-2 block">Ninguno</span>;
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Error trace if failed */}
                    {selectedHistoryLog.errorMensaje && (
                        <div className="space-y-2">
                            <label className="section-label text-error">Detalle del error de envío</label>
                            <pre className="text-[10px] font-mono bg-error-subtle border border-error/20 p-4 rounded-xl text-error leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                                {selectedHistoryLog.errorMensaje}
                            </pre>
                        </div>
                    )}

                    {/* Sent content HTML preview */}
                    <div className="space-y-2">
                        <label className="section-label text-text-dim">Contenido HTML Enviado</label>
                        <div className="bento-card static p-4 bg-white text-black rounded-xl max-h-96 overflow-y-auto border border-border-thin">
                            <div
                                dangerouslySetInnerHTML={{ __html: sanitize(selectedHistoryLog.cuerpo) }}
                                className="prose prose-sm text-black max-w-none font-sans"
                            />
                        </div>
                    </div>
                </div>

                <footer className="p-4 bg-surface/50 border-t border-border-thin text-right">
                    <button
                        onClick={() => setIsHistoryDrawerOpen(false)}
                        className="btn-vercel-secondary text-xs uppercase py-2 cursor-pointer"
                    >
                        Cerrar Inspección
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default EmailHistoryDrawer;
