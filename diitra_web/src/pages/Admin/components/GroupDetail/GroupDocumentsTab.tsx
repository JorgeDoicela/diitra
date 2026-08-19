import React, { useState } from 'react';
import { FileText, Download, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, Users, BookOpen, AlertCircle, Eye } from 'lucide-react';
import type { useGroupDetail } from './useGroupDetail';
import api from '../../../../api/axios_config';
import { useNotifications } from '../../../../api/NotificationsContext';

export interface GroupDocumentsTabProps {
    hook: ReturnType<typeof useGroupDetail>;
}

export const GroupDocumentsTab: React.FC<GroupDocumentsTabProps> = ({ hook }) => {
    const { detailGroup } = hook;
    const { addToast } = useNotifications();
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    if (!detailGroup) return null;

    const handleDownloadPdf = async () => {
        try {
            setIsLoadingPdf(true);
            const response = await api.get(`/groups/${detailGroup.uuid}/proposal-document/pdf`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Propuesta_Grupo_${detailGroup.siglas || detailGroup.uuid}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            addToast('Descarga Exitosa', 'Documento PDF descargado correctamente.', 'success');
        } catch (error: any) {
            console.error('Error al descargar el PDF:', error);
            addToast('Error', 'No se pudo generar el documento PDF.', 'error');
        } finally {
            setIsLoadingPdf(false);
        }
    };

    const handleOpenInNewTab = async () => {
        try {
            setIsLoadingPdf(true);
            const response = await api.get(`/groups/${detailGroup.uuid}/proposal-document/pdf`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            addToast('Visualización', 'Abriendo documento oficial...', 'info');
        } catch (error: any) {
            console.error('Error al abrir el PDF:', error);
            addToast('Error', 'No se pudo visualizar el PDF.', 'error');
        } finally {
            setIsLoadingPdf(false);
        }
    };

    const handlePreviewInline = async () => {
        try {
            setIsLoadingPdf(true);
            const response = await api.get(`/groups/${detailGroup.uuid}/proposal-document/pdf`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (error: any) {
            console.error('Error al cargar la previsualización:', error);
            addToast('Error', 'No se pudo cargar la previsualización del documento.', 'error');
        } finally {
            setIsLoadingPdf(false);
        }
    };

    const miembrosCount = detailGroup.miembros?.length || 0;
    const docentesCount = (detailGroup.miembros || []).filter(m => (m.tipo_miembro || '').toLowerCase() !== 'estudiante').length;
    const estudiantesCount = (detailGroup.miembros || []).filter(m => (m.tipo_miembro || '').toLowerCase() === 'estudiante').length;

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Header Card */}
            <div className="bento-card p-5 border border-border-thin bg-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand/10 text-brand rounded-xl">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-text-main">
                                Propuesta de Creación de Grupo de Investigación
                            </h4>
                            <span className="badge-vercel-blue text-[10px]">
                                PROPUESTA_GRUPO_INVESTIGACION
                            </span>
                        </div>
                        <p className="text-xs text-text-dim mt-0.5">
                            Formato oficial ISTPET para la formulación, registro y trámite de conformación del grupo.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={handlePreviewInline}
                        disabled={isLoadingPdf}
                        className="btn-vercel-secondary flex-1 md:flex-initial flex items-center justify-center gap-1.5 text-xs py-2 px-3"
                        title="Ver visor integrado"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Previsualizar</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenInNewTab}
                        disabled={isLoadingPdf}
                        className="btn-vercel-secondary flex-1 md:flex-initial flex items-center justify-center gap-1.5 text-xs py-2 px-3"
                        title="Abrir en pestaña completa"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Pestaña</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isLoadingPdf}
                        className="btn-vercel-primary flex-1 md:flex-initial flex items-center justify-center gap-1.5 text-xs py-2 px-4 shadow-sm"
                    >
                        {isLoadingPdf ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Descargar PDF</span>
                    </button>
                </div>
            </div>

            {/* Checklist de Validez Documental */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-surface rounded-xl border border-border-thin flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-black tracking-wider text-text-dim">Estado del Documento</p>
                        <p className="text-xs font-bold text-text-main truncate">
                            {detailGroup.estado === 'Aprobado' ? 'Aprobado & Vigente' : (detailGroup.estado === 'En Evaluación' ? 'En Trámite DIITRA' : 'Borrador Oficial')}
                        </p>
                    </div>
                </div>

                <div className="p-3.5 bg-surface rounded-xl border border-border-thin flex items-center gap-3">
                    <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-black tracking-wider text-text-dim">Equipo Vinculado</p>
                        <p className="text-xs font-bold text-text-main truncate">
                            {docentesCount} Docentes, {estudiantesCount} Semilleristas
                        </p>
                    </div>
                </div>

                <div className="p-3.5 bg-surface rounded-xl border border-border-thin flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-black tracking-wider text-text-dim">Líneas de Investigación</p>
                        <p className="text-xs font-bold text-text-main truncate">
                            {detailGroup.lineas?.length || 0} Registradas
                        </p>
                    </div>
                </div>
            </div>

            {/* Visor Embebido de PDF si se activó */}
            {previewUrl ? (
                <div className="bento-card p-4 border border-border-thin bg-surface space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-text-main">Visor Oficial en Directo</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPreviewUrl(null)}
                            className="text-[10px] font-bold text-text-dim hover:text-text-main"
                        >
                            Cerrar Visor
                        </button>
                    </div>
                    <div className="w-full h-[480px] bg-bg-deep rounded-lg border border-border-thin overflow-hidden">
                        <iframe
                            src={previewUrl}
                            title="Previsualización de Propuesta de Grupo"
                            className="w-full h-full border-0"
                        />
                    </div>
                </div>
            ) : (
                <div className="p-6 border border-dashed border-border-thin rounded-2xl bg-surface/50 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-brand/5 border border-brand/20 flex items-center justify-center text-brand">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-text-main">
                            Documento Listo para Trámite Institucional
                        </p>
                        <p className="text-xs text-text-dim max-w-md mx-auto mt-1">
                            El documento incluye automáticamente los objetivos, misión, visión, líneas de investigación y nómina oficial con firmas de responsabilidad.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handlePreviewInline}
                        disabled={isLoadingPdf}
                        className="btn-vercel-secondary text-xs inline-flex items-center gap-1.5 py-1.5 px-4"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Cargar Visor de Documento</span>
                    </button>
                </div>
            )}
        </div>
    );
};
