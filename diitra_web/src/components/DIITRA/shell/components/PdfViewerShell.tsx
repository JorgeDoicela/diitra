import React, { useState, useRef, useMemo } from 'react';
import { 
    FileText, 
    Download, 
    Printer, 
    RotateCw, 
    ZoomIn, 
    ZoomOut, 
    Maximize2, 
    Minimize2,
    ChevronDown,
    Check
} from 'lucide-react';
import { FullscreenLoader } from '../../../Common/FullscreenLoader';

export interface PdfViewerShellProps {
    title: string;
    pdfUrl: string | null;
    isGenerating: boolean;
    onRegenerate: () => void;
    isDraftMode?: boolean;
}

const ZOOM_PRESETS = [
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
    { label: '125%', value: 125 },
    { label: '150%', value: 150 },
    { label: 'Ajustar al ancho', value: 'FitH' },
    { label: 'Página completa', value: 'Fit' },
];

const GoogleDriveIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className="shrink-0"
    >
        <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5zm8.58 0L9.74 9.5h13.11l-3.43-6h-3.13zM10.29 10.5l-6.56 11.5h13.12l6.56-11.5H10.29z"/>
    </svg>
);

export const PdfViewerShell: React.FC<PdfViewerShellProps> = ({
    title,
    pdfUrl,
    isGenerating,
    onRegenerate,
    isDraftMode = false
}) => {
    const [zoomLevel, setZoomLevel] = useState<number | 'FitH' | 'Fit'>('FitH');
    const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Calcular la URL optimizada para el iframe eliminando las barras genéricas
    const optimizedPdfUrl = useMemo(() => {
        if (!pdfUrl) return null;
        
        let viewParam = 'view=FitH';
        let zoomParam = '';

        if (zoomLevel === 'Fit') {
            viewParam = 'view=Fit';
        } else if (zoomLevel === 'FitH') {
            viewParam = 'view=FitH';
        } else if (typeof zoomLevel === 'number') {
            zoomParam = `&zoom=${zoomLevel}`;
        }

        return `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&${viewParam}${zoomParam}`;
    }, [pdfUrl, zoomLevel]);

    const handleZoomIn = () => {
        if (typeof zoomLevel === 'number') {
            setZoomLevel(Math.min(zoomLevel + 25, 250));
        } else {
            setZoomLevel(125);
        }
    };

    const handleZoomOut = () => {
        if (typeof zoomLevel === 'number') {
            setZoomLevel(Math.max(zoomLevel - 25, 50));
        } else {
            setZoomLevel(75);
        }
    };

    const handlePrint = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
                iframeRef.current.contentWindow.print();
                return;
            } catch {
                // Fallback si hay restricciones de navegador
            }
        }
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;
        const cleanName = title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\-_ ]/g, '').trim().replace(/\s+/g, '_');
        const fileName = `${cleanName}_${isDraftMode ? 'Borrador' : 'Oficial'}.pdf`;

        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveToDrive = () => {
        if (!pdfUrl) return;
        handleDownload();
        window.open('https://drive.google.com/drive/my-drive', '_blank');
    };

    const currentZoomLabel = useMemo(() => {
        if (zoomLevel === 'FitH') return 'Ancho';
        if (zoomLevel === 'Fit') return 'Página';
        return `${zoomLevel}%`;
    }, [zoomLevel]);

    return (
        <div className="flex-1 w-full h-full flex flex-col bg-bg-deep rounded-2xl border border-border-thin overflow-hidden shadow-inner relative">
            {/* ── BARRA SUPERIOR INTEGRADA VERCEL GEIST ── */}
            <div className="h-11 bg-surface border-b border-border-thin px-3 sm:px-4 flex items-center justify-between select-none z-20 shrink-0 gap-2">
                
                {/* 1. Izquierda: Título + Controles de Zoom directos a su derecha */}
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-text-main truncate max-w-[200px] xs:max-w-[260px] sm:max-w-[340px] md:max-w-[440px]" title={title}>
                        {title}
                    </span>

                    {pdfUrl && !isGenerating && (
                        <div className="flex items-center gap-0.5 text-text-dim shrink-0">
                            {/* Separador vertical sutil */}
                            <div className="h-3.5 w-[1px] bg-border-thin mx-1" />

                            <button
                                type="button"
                                onClick={handleZoomOut}
                                title="Reducir zoom (-)"
                                className="p-1 hover:text-text-main hover:bg-surface-hover rounded transition-colors cursor-pointer"
                            >
                                <ZoomOut size={13} />
                            </button>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
                                    className="px-1.5 py-0.5 text-[11px] font-semibold text-text-main hover:bg-surface-hover rounded flex items-center gap-0.5 transition-colors cursor-pointer"
                                >
                                    <span>{currentZoomLabel}</span>
                                    <ChevronDown size={10} className="text-text-dim" />
                                </button>

                                {isZoomMenuOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-30" 
                                            onClick={() => setIsZoomMenuOpen(false)} 
                                        />
                                        <div className="absolute top-full left-0 mt-1 w-36 bg-surface border border-border-thin rounded-xl shadow-xl py-1 z-40 animate-fade-in">
                                            {ZOOM_PRESETS.map((preset) => {
                                                const isSelected = zoomLevel === preset.value;
                                                return (
                                                    <button
                                                        key={preset.label}
                                                        type="button"
                                                        onClick={() => {
                                                            setZoomLevel(preset.value as any);
                                                            setIsZoomMenuOpen(false);
                                                        }}
                                                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-surface-hover transition-colors cursor-pointer ${
                                                            isSelected ? 'text-text-main font-bold bg-surface-hover/50' : 'text-text-dim'
                                                        }`}
                                                    >
                                                        <span>{preset.label}</span>
                                                        {isSelected && <Check size={12} className="text-text-main" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleZoomIn}
                                title="Aumentar zoom (+)"
                                className="p-1 hover:text-text-main hover:bg-surface-hover rounded transition-colors cursor-pointer"
                            >
                                <ZoomIn size={13} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setZoomLevel(zoomLevel === 'FitH' ? 'Fit' : 'FitH')}
                                title={zoomLevel === 'FitH' ? 'Ajustar a página completa' : 'Ajustar al ancho'}
                                className="p-1 hover:text-text-main hover:bg-surface-hover rounded transition-colors cursor-pointer"
                            >
                                {zoomLevel === 'FitH' ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                            </button>
                        </div>
                    )}
                </div>

                {/* 3. Derecha: Acciones Institucionales Directas */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={onRegenerate}
                        disabled={isGenerating}
                        title="Regenerar vista previa del documento"
                        className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-40"
                    >
                        <RotateCw size={14} />
                    </button>

                    {pdfUrl && (
                        <>
                            <button
                                type="button"
                                onClick={handleSaveToDrive}
                                disabled={isGenerating}
                                title="Guardar / Abrir en Google Drive"
                                className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center"
                            >
                                <GoogleDriveIcon size={14} />
                            </button>

                            <button
                                type="button"
                                onClick={handlePrint}
                                disabled={isGenerating}
                                title="Imprimir documento"
                                className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-40"
                            >
                                <Printer size={14} />
                            </button>

                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={isGenerating}
                                title="Descargar archivo PDF"
                                className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-40"
                            >
                                <Download size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── LIENZO DEL VISOR PDF ── */}
            <div className="flex-1 w-full h-full relative overflow-hidden bg-neutral-900 flex items-center justify-center">
                {isGenerating ? (
                    <FullscreenLoader 
                        fullscreen={false} 
                        message={[
                            "Generando documento oficial...",
                            "Preparando vista previa de alta resolución...",
                            "Compilando plantilla PDF...",
                            "Verificando firmas institucionales..."
                        ]} 
                    />
                ) : optimizedPdfUrl ? (
                    <iframe 
                        key={optimizedPdfUrl}
                        ref={iframeRef}
                        src={optimizedPdfUrl} 
                        className="w-full h-full border-none bg-neutral-900" 
                        title={`Vista previa — ${title}`} 
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-dim/30 p-8 select-none">
                        <FileText size={72} strokeWidth={0.6} className="mb-4" />
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-center text-text-dim">
                            Documento listo para generar
                        </p>
                        <p className="text-[11px] text-text-dim/70 text-center mt-1 max-w-xs">
                            Haga clic en generar para compilar el formato oficial con los datos actuales.
                        </p>
                        <button 
                            type="button"
                            onClick={onRegenerate} 
                            className="mt-5 btn-vercel-primary px-5 py-2 text-xs font-bold cursor-pointer"
                        >
                            Generar PDF Oficial
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfViewerShell;
