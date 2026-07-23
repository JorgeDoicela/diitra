import React from 'react';
import { RefreshCw, Download, BarChart2 } from 'lucide-react';
import { PageHeader } from '../../../components/Common/PageHeader';

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
        <PageHeader
            kicker="CACES Acreditación — IST Traversari"
            icon={BarChart2}
            title="Analíticas de Investigación e Innovación"
            description="Consola directiva en tiempo real. Seguimiento actualizado de proyectos y cumplimiento de estándares del CACES."
        >
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={onReload}
                        disabled={refreshing}
                        className="btn-vercel-secondary !p-2 h-9 w-9 flex items-center justify-center rounded-lg cursor-pointer"
                        title="Sincronizar base de datos en tiempo real"
                        id="refresh-analytics-btn"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={onExportPdf}
                        disabled={exporting}
                        className="btn-vercel-primary flex items-center gap-2 h-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        id="export-pdf-report-btn"
                    >
                        <Download size={13} className={exporting ? "animate-spin" : ""} />
                        <span>{exporting ? 'Generando...' : 'Exportar PDF'}</span>
                    </button>
                </div>
                {exportError && (
                    <p className="text-[10px] text-red-400 font-medium mt-1">{exportError}</p>
                )}
            </div>
        </PageHeader>
    );
};
