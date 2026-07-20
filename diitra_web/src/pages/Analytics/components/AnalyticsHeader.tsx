import React from 'react';
import { RefreshCw, Download, Loader2 } from 'lucide-react';

export interface AnalyticsHeaderProps {
    refreshing: boolean;
    exporting: boolean;
    exportError: string | null;
    onReload: () => void;
    onExportPdf: () => void;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
    refreshing,
    exporting,
    exportError,
    onReload,
    onExportPdf
}) => {
    return (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-thin pb-5">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <span className="badge-vercel badge-vercel-info">
                        <span className="dot dot-info dot-pulse" />
                        CACES Acreditación
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-brand font-mono">Quito, Ecuador</span>
                </div>
                <h1 id="analytics-main-title" className="text-2xl font-semibold tracking-tight text-text-main font-sans">
                    Analíticas de Investigación e Innovación
                </h1>
                <p className="text-xs text-text-dim max-w-2xl leading-relaxed font-medium">
                    Consola directiva en tiempo real del <strong className="text-text-main font-semibold">IST Traversari</strong>. Seguimiento actualizado de proyectos y cumplimiento de estándares del CACES.
                </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={onReload}
                    disabled={refreshing}
                    className="btn-vercel-secondary !p-2 h-9 w-9 flex items-center justify-center rounded-lg"
                    title="Sincronizar base de datos en tiempo real"
                    id="refresh-analytics-btn"
                >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
                <button
                    onClick={onExportPdf}
                    disabled={exporting}
                    className="btn-vercel-primary flex items-center gap-2 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    id="export-pdf-report-btn"
                >
                    {exporting ? (
                        <Loader2 size={13} className="animate-spin" />
                    ) : (
                        <Download size={13} />
                    )}
                    <span>{exporting ? 'Generando...' : 'Exportar PDF'}</span>
                </button>
                {exportError && (
                    <p className="text-[10px] text-red-400 font-medium mt-1">{exportError}</p>
                )}
            </div>
        </header>
    );
};
