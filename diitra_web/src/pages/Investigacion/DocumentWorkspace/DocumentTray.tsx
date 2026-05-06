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
import api from '../../../api/axios_config';

interface DocumentInstance {
    uuid: string;
    templateCode: string;
    title: string;
    state: number; // 1: Draft, 2: Review, 3: Signed...
    createdAt: string;
    traceabilityCode?: string;
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
            const response = await api.get(`/documents/instances/entity/${entityUuid}`);
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

    const getStatusStyles = (state: number) => {
        switch (state) {
            case 3: // Signed
                return "bg-green-500/10 text-green-500 border-green-500/20";
            case 1: // Draft
                return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            default:
                return "bg-bg-deep text-text-dim border-border-thin";
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

    const handleCreateNew = async () => {
        // En una implementación real, abriría un modal para elegir la plantilla
        // Por ahora, crearemos un Protocolo de prueba para demostrar el flujo
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
        <div className="bg-surface border border-border-thin rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div className="p-6 border-b border-border-thin flex justify-between items-center bg-bg-deep/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-text-main tracking-tight">{title}</h3>
                        <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider">Gestión de Ciclo de Vida Documental</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={14} /> Nuevo Documento
                </button>
            </div>

            <div className="divide-y divide-border-thin">
                {isLoading ? (
                    <div className="p-12 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div></div>
                ) : documents.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 bg-bg-deep rounded-full flex items-center justify-center mx-auto mb-4 text-text-dim/30">
                            <AlertCircle size={24} />
                        </div>
                        <p className="text-xs text-text-dim font-medium">No hay documentos generados aún.</p>
                    </div>
                ) : (
                    documents.map(doc => (
                        <div key={doc.uuid} className="p-4 flex items-center justify-between hover:bg-bg-deep/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl border ${getStatusStyles(doc.state)} transition-all group-hover:scale-110`}>
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-text-main">{doc.title || doc.templateCode}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusStyles(doc.state)}`}>
                                            {getStatusLabel(doc.state)}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-text-dim font-medium">
                                            <Clock size={10} /> {new Date(doc.createdAt).toLocaleDateString()}
                                        </span>
                                        {doc.traceabilityCode && (
                                            <span className="text-[10px] font-mono text-primary font-bold">
                                                {doc.traceabilityCode}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => navigate(`/investigacion/workspace/${doc.templateCode}/${doc.uuid}`)}
                                    className="p-2 hover:bg-surface rounded-lg text-text-dim hover:text-primary transition-all"
                                    title="Abrir Espacio de Trabajo"
                                >
                                    <ExternalLink size={16} />
                                </button>
                                {doc.state === 3 && (
                                    <button 
                                        className="p-2 hover:bg-surface rounded-lg text-text-dim hover:text-green-500 transition-all"
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
                    ))
                )}
            </div>

            <div className="p-3 bg-bg-deep/50 border-t border-border-thin flex items-center justify-center gap-2">
                <Shield size={10} className="text-text-dim" />
                <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Protocolo de Inmutabilidad DIITRA Activado</span>
            </div>
        </div>
    );
};

export default DocumentTray;
