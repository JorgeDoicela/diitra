import React, { useState, useEffect } from 'react';
import {
    FileText,
    Plus,
    ExternalLink,
    Download,
    AlertCircle,
    Fingerprint,
    Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios_config';
import { buildWorkspacePath } from '../../core/documents/templateUrl';

interface DocumentInstance {
    uuid: string;
    templateCode?: string;
    title?: string;
    state?: number;
    createdAt?: string;
    traceabilityCode?: string;
    created_at?: string;
    template_code?: string;
    traceability_code?: string;
    Uuid?: string;
    TemplateCode?: string;
    Title?: string;
    State?: number;
    CreatedAt?: string;
    TraceabilityCode?: string;
}

interface DocumentTrayProps {
    entityUuid: string;
    title?: string;
}

const DocumentTray: React.FC<DocumentTrayProps> = ({ entityUuid, title = "Expediente Documental" }) => {
    const [documents, setDocuments] = useState<DocumentInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchDocuments = async () => {
        try {
            const url = entityUuid === 'GLOBAL'
                ? '/documents/instances/global'
                : `/documents/instances/entity/${entityUuid}`;

            const response = await api.get(url);
            setDocuments(response.data);
        } catch (error) {
            console.error("[DIITRA] Error al cargar bandeja de documentos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (entityUuid) fetchDocuments();
    }, [entityUuid]);

    const handleCreateNew = async () => {
        try {
            const response = await api.post('/documents/instances', {
                templateCode: 'PROTOCOLO_INVESTIGACION',
                entityUuid: entityUuid,
                title: `Protocolo - ${new Date().toLocaleDateString()}`
            });
            navigate(buildWorkspacePath('PROTOCOLO_INVESTIGACION', response.data.uuid));
        } catch (error) {
            alert("No se pudo crear el documento.");
        }
    };

    return (
        <div className="bg-surface border border-border-thin shadow-sm rounded-xl overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin">
                <div className="flex items-center gap-2">
                    <FileText size={14} className="text-text-dim" />
                    <span className="text-sm font-medium text-text-dim">{title}</span>
                </div>

                {entityUuid !== 'GLOBAL' && (
                    <button
                        onClick={handleCreateNew}
                        className="btn-vercel-primary px-3 py-1.5 text-xs gap-1.5"
                    >
                        <Plus size={12} strokeWidth={2.5} /> Nuevo Documento
                    </button>
                )}
            </div>

            <div className="divide-y divide-border-thin bg-bg-deep/10">
                {isLoading ? (
                    <div className="p-12 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-brand border-t-transparent rounded-full"></div></div>
                ) : documents.length === 0 ? (
                    <div className="empty-state !border-solid my-0 mx-0">
                        <div className="icon-circle !p-3 bg-surface mb-4">
                            <AlertCircle size={24} className="text-text-dim" />
                        </div>
                        <p className="text-xs text-text-dim font-medium">No hay documentos generados aún.</p>
                    </div>
                ) : (
                    documents.map(doc => {
                        const state = doc.state ?? doc.State ?? 1;
                        const docTitle = doc.title || doc.Title || doc.template_code || doc.templateCode || doc.TemplateCode || 'Documento sin título';
                        const date = doc.created_at || doc.createdAt || doc.CreatedAt;
                        const trace = doc.traceability_code || doc.traceabilityCode || doc.TraceabilityCode;
                        const tCode = doc.template_code || doc.templateCode || doc.TemplateCode || 'DOCUMENTO';

                        // 1. Status Dot & Text
                        let statusColor = 'bg-neutral';
                        let statusText = 'Borrador';
                        if (state === 3) {
                            statusColor = 'bg-success';
                            statusText = 'Firmado';
                        } else if (state === 2) {
                            statusColor = 'bg-warning';
                            statusText = 'En Revisión';
                        } else if (state === 4) {
                            statusColor = 'bg-info';
                            statusText = 'Archivado';
                        } else if (state === 5) {
                            statusColor = 'bg-error';
                            statusText = 'Anulado';
                        }

                        const isProtocolo = tCode.toUpperCase().includes('PROTOCOLO');

                        return (
                            <div
                                key={doc.uuid || doc.Uuid}
                                onClick={() => navigate(buildWorkspacePath(tCode, doc.uuid || doc.Uuid!))}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-3.5 hover:bg-surface-hover/30 transition-all duration-150 group cursor-pointer"
                            >
                                {/* Col 1: Documento / Actividad */}
                                <div className="flex-1 min-w-0 md:max-w-xs lg:max-w-md xl:max-w-2xl">
                                    <h4 className="text-xs font-medium text-text-main truncate group-hover:text-brand transition-colors" title={docTitle}>
                                        {docTitle}
                                    </h4>
                                </div>

                                {/* Columns Group */}
                                <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end gap-x-8 gap-y-2 text-[11px] text-text-dim font-medium w-full md:w-auto">

                                    {/* Col 2: Estado */}
                                    <div className="flex items-center gap-1.5 min-w-[90px]">
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor} shrink-0`} />
                                        <span className="capitalize text-text-main/80">{statusText}</span>
                                    </div>

                                    {/* Col 3: Tipo Badge */}
                                    <div className="shrink-0 min-w-[100px]">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isProtocolo
                                            ? 'bg-brand/10 text-brand border border-brand/20'
                                            : 'bg-info/10 text-info border border-info/20'
                                            }`}>
                                            {isProtocolo ? <Layers size={10} /> : <FileText size={10} />}
                                            {isProtocolo ? 'Protocolo' : 'Informe'}
                                        </span>
                                    </div>

                                    {/* Col 4: Traceability Code / Hash */}
                                    <div className="hidden sm:flex items-center gap-1.5 min-w-[110px]">
                                        <Fingerprint size={11} className="opacity-50" />
                                        <span className="font-mono text-[10px] text-text-main/70 uppercase tracking-tight" title={`Trace: ${trace || 'Ninguna'}`}>{trace ? trace.substring(0, 8) : 'Sello Pend.'}</span>
                                    </div>

                                    {/* Col 5: Fecha & Acciones */}
                                    <div className="min-w-[90px] text-right ml-auto md:ml-0 flex items-center justify-end gap-2.5">
                                        <span className="text-[10px] text-text-dim/80 font-mono">
                                            {date ? new Date(date).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' }) : 'Pendiente'}
                                        </span>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {state === 3 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`/api/projects/generate-pdf?isDraft=false`, '_blank');
                                                    }}
                                                    className="p-1 hover:bg-surface rounded text-text-dim hover:text-success transition-all shrink-0"
                                                    title="Descargar PDF Oficial"
                                                >
                                                    <Download size={11} />
                                                </button>
                                            )}
                                            <ExternalLink size={10} className="text-text-dim group-hover:text-brand transition-all duration-150 shrink-0" />
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DocumentTray;
