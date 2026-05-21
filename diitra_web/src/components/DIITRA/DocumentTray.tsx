import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Plus, 
    ExternalLink, 
    Download, 
    Clock, 
    MoreVertical,
    Shield,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios_config';

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

const getStatusBadge = (state: number) => {
    switch (state) {
        case 3: return "badge-vercel-success";
        case 1: return "badge-vercel-info";
        default: return "badge-vercel-neutral";
    }
};

const getStatusDot = (state: number) => {
    switch (state) {
        case 3: return "dot-success";
        case 1: return "dot-info";
        default: return "dot-neutral";
    }
};

const getStatusLabel = (state: number) => {
    switch (state) {
        case 1: return "Borrador";
        case 2: return "En Revisión";
        case 3: return "Firmado";
        case 4: return "Archivado";
        case 5: return "Anulado";
        default: return "Desconocido";
    }
};

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
            navigate(`/investigacion/workspace/PROTOCOLO_INVESTIGACION/${response.data.uuid}`);
        } catch (error) {
            alert("No se pudo crear el documento.");
        }
    };

    return (
        <div className="bento-card overflow-hidden">
            <div className="modal-header !px-6 !py-4">
                <div className="flex items-center gap-3">
                    <div className="icon-circle-brand !p-2">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-text-main tracking-tight">{title}</h3>
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Gestión de Ciclo de Vida Documental</p>
                    </div>
                </div>
                
                {entityUuid !== 'GLOBAL' && (
                    <button 
                        onClick={handleCreateNew}
                        className="btn-brand gap-2"
                    >
                        <Plus size={14} /> Nuevo Documento
                    </button>
                )}
            </div>

            <div className="divide-y divide-border-thin">
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
                        const state = doc.state ?? doc.State ?? doc.state ?? 1;
                        const docTitle = doc.title || doc.Title || doc.template_code || doc.templateCode || doc.TemplateCode;
                        const date = doc.created_at || doc.createdAt || doc.CreatedAt;
                        const trace = doc.traceability_code || doc.traceabilityCode || doc.TraceabilityCode;

                        return (
                        <div key={doc.uuid || doc.Uuid} className="p-4 flex items-center justify-between hover:bg-surface-hover transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="icon-circle !p-2">
                                    <FileText size={18} className="text-text-dim" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-text-main">
                                        {docTitle}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`badge-vercel ${getStatusBadge(state)} text-[8px] font-black`}>
                                            <span className={`dot ${getStatusDot(state)}`} />
                                            {getStatusLabel(state)}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-text-dim font-medium">
                                            <Clock size={10} /> { date ? new Date(date).toLocaleDateString() : 'Fecha Pendiente'}
                                        </span>
                                        {trace && (
                                            <span className="text-[10px] font-mono text-brand font-bold">
                                                {trace}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => navigate(`/investigacion/workspace/${doc.template_code || doc.templateCode || doc.TemplateCode}/${doc.uuid || doc.Uuid}`)}
                                    className="p-2 hover:bg-surface rounded-lg text-text-dim hover:text-brand transition-all"
                                    title="Abrir Espacio de Trabajo"
                                >
                                    <ExternalLink size={16} />
                                </button>
                                {state === 3 && (
                                    <button 
                                        className="p-2 hover:bg-surface rounded-lg text-text-dim hover:text-success transition-all"
                                        title="Descargar PDF Oficial"
                                    >
                                        <Download size={16} />
                                    </button>
                                )}
                                <button className="p-2 hover:bg-surface rounded-lg text-text-dim transition-all">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>
                        );
                    })
                )}
            </div>

            <div className="modal-footer !justify-center">
                <Shield size={10} className="text-text-dim" />
                <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Protocolo de Inmutabilidad DIITRA Activado</span>
            </div>
        </div>
    );
};

export default DocumentTray;
