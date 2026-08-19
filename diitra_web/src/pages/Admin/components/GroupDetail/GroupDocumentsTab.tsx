import React, { useState, useEffect } from 'react';
import type { useGroupDetail } from './useGroupDetail';
import api from '../../../../api/axios_config';
import { useNotifications } from '../../../../api/NotificationsContext';
import { downloadBlob, downloadFromApi } from '../../../../utils/downloadUtils';

export interface GroupDocumentsTabProps {
    hook: ReturnType<typeof useGroupDetail>;
}

export const GroupDocumentsTab: React.FC<GroupDocumentsTabProps> = ({ hook }) => {
    const { detailGroup } = hook;
    const { addToast } = useNotifications();
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const loadPdfPreview = async () => {
        if (!detailGroup?.uuid) return;
        try {
            setIsLoadingPdf(true);
            setLoadError(null);
            const response = await api.get(`/groups/${detailGroup.uuid}/proposal-document/pdf`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(prevUrl => {
                if (prevUrl) window.URL.revokeObjectURL(prevUrl);
                return url;
            });
        } catch (error: any) {
            console.error('Error al cargar documento PDF:', error);
            setLoadError('No se pudo generar la previsualización del documento.');
            addToast('Error', 'No se pudo cargar el documento oficial.', 'error');
        } finally {
            setIsLoadingPdf(false);
        }
    };

    useEffect(() => {
        loadPdfPreview();
        return () => {
            if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl);
            }
        };
    }, [detailGroup?.uuid]);

    if (!detailGroup) return null;

    const handleDownloadPdf = async () => {
        const filename = `Propuesta_Grupo_${detailGroup.siglas || detailGroup.uuid}.pdf`;

        if (previewUrl) {
            downloadBlob(previewUrl, filename);
            return;
        }

        try {
            setIsLoadingPdf(true);
            await downloadFromApi(`/groups/${detailGroup.uuid}/proposal-document/pdf`, filename);
        } catch (error: any) {
            console.error('Error al descargar el PDF:', error);
            addToast('Error', error.message || 'No se pudo generar el documento PDF.', 'error');
        } finally {
            setIsLoadingPdf(false);
        }
    };

    const handleOpenInNewTab = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        }
    };

    const statusBadgeClass =
        detailGroup.estado === 'Aprobado'
            ? 'badge-vercel-green'
            : detailGroup.estado === 'En Evaluación'
            ? 'badge-vercel-amber'
            : 'badge-vercel-neutral';

    return (
        <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto custom-scrollbar">
            {/* Header unificado y minimalista */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-thin">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text-main">
                            Propuesta de Creación de Grupo de Investigación
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${statusBadgeClass}`}>
                            {detailGroup.estado || 'Borrador'}
                        </span>
                    </div>
                    <p className="text-xs text-text-dim mt-0.5">
                        {detailGroup.siglas ? `${detailGroup.siglas} • ` : ''}Formato oficial institucional ISTPET
                    </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                        type="button"
                        onClick={handleOpenInNewTab}
                        disabled={isLoadingPdf || !previewUrl}
                        className="btn-vercel-secondary text-xs py-1.5 px-3"
                    >
                        Abrir Pestaña
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isLoadingPdf}
                        className="btn-vercel-primary text-xs py-1.5 px-3.5 shadow-sm"
                    >
                        {isLoadingPdf ? 'Generando...' : 'Descargar PDF'}
                    </button>
                </div>
            </div>

            {/* Contenedor del Visor PDF en directo */}
            <div className="w-full h-[620px] bg-bg-deep rounded-xl border border-border-thin overflow-hidden relative flex flex-col">
                {isLoadingPdf && !previewUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-xs space-y-2">
                        <p className="text-xs font-semibold text-text-main">Generando documento oficial...</p>
                        <p className="text-[11px] text-text-dim">Compilando plantilla y firmas institucionales</p>
                    </div>
                ) : loadError && !previewUrl ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                        <p className="text-xs font-semibold text-red-400">{loadError}</p>
                        <button
                            type="button"
                            onClick={loadPdfPreview}
                            className="btn-vercel-secondary text-xs py-1.5 px-4"
                        >
                            Reintentar Carga
                        </button>
                    </div>
                ) : previewUrl ? (
                    <iframe
                        src={previewUrl}
                        title="Documento Oficial de Propuesta"
                        className="w-full h-full flex-1 border-0"
                    />
                ) : null}
            </div>
        </div>
    );
};

