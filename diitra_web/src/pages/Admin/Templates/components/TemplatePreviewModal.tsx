/**
 * @file TemplatePreviewModal.tsx
 * @description Modal institucional de previsualización y descarga en vivo de plantillas oficiales de DIITRA.
 *
 * @architecture
 * Implementa el patrón Vercel Geist:
 * - Visor PDF oficial de alta fidelidad (iText) a pantalla completa con paginación y cabeceras legales.
 * - Soporte para conmutación de modo Borrador (marca de agua) / Oficial.
 * - Acciones directas: Descargar PDF oficial, Imprimir y Abrir en pestaña independiente.
 * - Gestión rigurosa de blobs y revocación de ObjectURL para prevenir memory leaks.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    X,
    FileText,
    Download,
    Printer
} from 'lucide-react';
import { FullscreenLoader } from '../../../../components/Common/FullscreenLoader';
import api from '../../../../api/axios_config';
import { useNotifications } from '../../../../api/NotificationsContext';
import type { DocumentTemplateDto, DocumentBlock } from '../types';
import { generateHtmlFromBlocks } from '../utils/HtmlGenerator';
import { mergeWithDefaults } from '../utils/theme-schema';

interface TemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: DocumentTemplateDto | null;
    blocks?: DocumentBlock[];
    themeConfig?: any;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
    isOpen,
    onClose,
    template,
    blocks,
    themeConfig
}) => {
    const { addToast } = useNotifications();

    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    // Cerrar con Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Generar el PDF oficial desde el backend
    const loadPdfPreview = useCallback(async () => {
        if (!template) return;

        setIsLoadingPdf(true);
        try {
            let response;
            if (blocks && blocks.length > 0) {
                const mergedTheme = themeConfig || mergeWithDefaults(template.themeConfigJson);
                const generatedHtml = generateHtmlFromBlocks(blocks, mergedTheme);

                response = await api.post(
                    `/admin/templates/${template.code}/render-pdf?isDraft=false&download=false`,
                    {
                        htmlContent: generatedHtml,
                        customCss: template.customCss || null,
                        themeConfigJson: JSON.stringify(mergedTheme)
                    },
                    { responseType: 'blob' }
                );
            } else {
                response = await api.get(
                    `/admin/templates/${template.code}/render-pdf?isDraft=false&download=false`,
                    { responseType: 'blob' }
                );
            }

            const blob = new Blob([response.data], { type: 'application/pdf' });
            setPdfBlob(blob);
        } catch (error: any) {
            console.error('Error al generar PDF de previsualización:', error);
            addToast('Error de Previsualización', 'No se pudo generar el visor del documento PDF oficial.', 'error');
        } finally {
            setIsLoadingPdf(false);
        }
    }, [template, blocks, themeConfig, addToast]);

    // Cargar PDF cuando se abre el modal
    useEffect(() => {
        if (isOpen && template) {
            loadPdfPreview();
        } else {
            setPdfBlob(null);
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
            }
        }
    }, [isOpen, template, loadPdfPreview]);

    // Manejo de ObjectURL reactivo para evitar memory leaks
    useEffect(() => {
        if (!pdfBlob) return;

        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [pdfBlob]);

    // Descarga directa del archivo PDF
    const handleDownloadPdf = async () => {
        if (!template) return;

        setIsDownloading(true);
        try {
            const cleanTitle = (template.name || template.code).replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\-_ ]/g, '').trim().replace(/\s+/g, '_');
            const fileName = `${cleanTitle}_Oficial.pdf`;

            let downloadBlob: Blob;

            // Si ya tenemos el blob cargado con el mismo modo, reutilizarlo
            if (pdfBlob) {
                downloadBlob = pdfBlob;
            } else {
                // Solicitar descarga directa al backend (soporta cambios en caliente)
                if (blocks && blocks.length > 0) {
                    const mergedTheme = themeConfig || mergeWithDefaults(template.themeConfigJson);
                    const generatedHtml = generateHtmlFromBlocks(blocks, mergedTheme);
                    const response = await api.post(
                        `/admin/templates/${template.code}/render-pdf?isDraft=false&download=true`,
                        {
                            htmlContent: generatedHtml,
                            customCss: template.customCss || null,
                            themeConfigJson: JSON.stringify(mergedTheme)
                        },
                        { responseType: 'blob' }
                    );
                    downloadBlob = new Blob([response.data], { type: 'application/pdf' });
                } else {
                    const response = await api.get(
                        `/admin/templates/${template.code}/render-pdf?isDraft=false&download=true`,
                        { responseType: 'blob' }
                    );
                    downloadBlob = new Blob([response.data], { type: 'application/pdf' });
                }
            }

            const link = document.createElement('a');
            const downloadUrl = URL.createObjectURL(downloadBlob);
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(downloadUrl), 500);
            addToast('Documento Descargado', `Se descargó el archivo '${fileName}'.`, 'success');
        } catch (err) {
            console.error('Error al descargar PDF:', err);
            addToast('Error de Descarga', 'No se pudo generar la descarga del PDF.', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    // Imprimir
    const handlePrint = () => {
        if (pdfUrl) {
            const iframe = document.getElementById('preview-pdf-iframe') as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.print();
                return;
            }
        }
        window.print();
    };

    if (!isOpen || !template) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-6xl h-[92vh] bg-surface border border-border-thin rounded-xl shadow-2xl flex flex-col z-10 overflow-hidden animate-scale-up">
                
                {/* ── BARRA SUPERIOR VERCEL GEIST ── */}
                <div className="relative flex items-center justify-between px-5 py-3 border-b border-border-thin bg-surface shrink-0">
                    {/* Espaciador izquierdo para balance */}
                    <div className="w-20 shrink-0 hidden sm:block" />

                    {/* Título centrado en la mitad */}
                    <div className="absolute left-1/2 -translate-x-1/2 max-w-[55%] text-center truncate">
                        <h2 className="text-xs md:text-sm font-bold text-text-main truncate">
                            {template.name}
                        </h2>
                    </div>

                    {/* Acciones principales con orden invertido: Descargar primero, luego Imprimir */}
                    <div className="flex items-center gap-1.5 shrink-0 z-10 ml-auto">
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isDownloading || isLoadingPdf}
                            title="Descargar PDF oficial"
                            className="p-1.5 rounded-md text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-40"
                        >
                            {isDownloading ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handlePrint}
                            title="Imprimir documento"
                            className="p-1.5 rounded-md text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                        </button>

                        {/* Separador */}
                        <div className="h-4 w-px bg-border-thin mx-1.5" />

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-md text-black dark:text-white hover:bg-surface-hover transition-colors cursor-pointer"
                            title="Cerrar vista previa (Esc)"
                        >
                            <X className="w-4 h-4 text-black dark:text-white" />
                        </button>
                    </div>
                </div>

                {/* ── CUERPO DEL VISOR PDF ── */}
                <div className="flex-1 relative bg-bg-deep overflow-hidden flex flex-col">
                    <div className="w-full h-full relative flex items-center justify-center">
                        {isLoadingPdf && (
                            <FullscreenLoader
                                fullscreen={false}
                                message={[
                                    'Generando documento oficial...',
                                    'Compilando estructura institucional...',
                                    'Renderizando visor de alta fidelidad...'
                                ]}
                            />
                        )}

                        {pdfUrl ? (
                            <iframe
                                id="preview-pdf-iframe"
                                src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                                title={`Vista Previa: ${template.name}`}
                                className="w-full h-full border-none bg-neutral-100 dark:bg-neutral-900"
                            />
                        ) : !isLoadingPdf && (
                            <div className="p-8 text-center max-w-sm space-y-3">
                                <FileText className="w-10 h-10 text-text-dim/40 mx-auto" />
                                <p className="text-xs font-semibold text-text-main">
                                    No se pudo cargar el visor embebido
                                </p>
                                <p className="text-[11px] text-text-dim leading-relaxed">
                                    Puedes descargar el PDF oficial directamente a tu equipo o abrirlo en una nueva pestaña del navegador.
                                </p>
                                <div className="flex justify-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={loadPdfPreview}
                                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-border-thin bg-surface hover:bg-surface-hover text-text-main cursor-pointer"
                                    >
                                        Reintentar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownloadPdf}
                                        className="btn-vercel-primary px-3 py-1.5 text-xs font-semibold cursor-pointer"
                                    >
                                        Descargar PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
