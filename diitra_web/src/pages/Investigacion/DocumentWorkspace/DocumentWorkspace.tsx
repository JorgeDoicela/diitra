import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    FileText, 
    Users, 
    Shield, 
    Download, 
    History, 
    CheckCircle, 
    ArrowLeft,
    Clock,
    Eye
} from 'lucide-react';
import { useCoWork, CoWorkEditor } from '../../../core/cowork';
import api from '../../../api/axios_config';
import { useAuth } from '../../../api/AuthContext';

interface TemplateMetadata {
    code: string;
    name: string;
    description: string;
    collaborativeFieldsJson: string | null;
}

const DocumentWorkspace: React.FC = () => {
    const { documentUuid, templateCode } = useParams<{ documentUuid: string, templateCode: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [template, setTemplate] = useState<TemplateMetadata | null>(null);
    const [instance, setInstance] = useState<any>(null);
    const [sections, setSections] = useState<string[]>([]);
    const [activeSection, setActiveSection] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Cargar metadatos de la instancia y la plantilla
    useEffect(() => {
        const fetchWorkspaceData = async () => {
            try {
                // 1. Obtener la instancia (el documento real)
                const instanceRes = await api.get(`/documents/instances/${documentUuid}`);
                setInstance(instanceRes.data);

                // 2. Obtener la plantilla asociada
                const templateRes = await api.get(`/admin/templates/${instanceRes.data.templateCode}`);
                setTemplate(templateRes.data);
                
                if (templateRes.data.collaborativeFieldsJson) {
                    const fields = JSON.parse(templateRes.data.collaborativeFieldsJson);
                    setSections(fields);
                    if (fields.length > 0) setActiveSection(fields[0]);
                }
            } catch (error) {
                console.error("[DIITRA] Error cargando workspace:", error);
                // Si la instancia no existe, podríamos crear una nueva o navegar atrás
            } finally {
                setIsLoading(false);
            }
        };

        if (documentUuid) fetchWorkspaceData();
    }, [documentUuid, templateCode]);

    // Inicializar CoWork para la sección activa
    const cowork = useCoWork({
        documentId: `${documentUuid}_${activeSection}`, 
        readOnly: instance?.state === 3, // Bloquear si el estado es 'Signed' (3)
        user: {
            id: user?.id || 'anon',
            name: user?.nombreCompleto || 'Usuario',
            role: user?.rol || 'Investigador',
            color: '#4f46e9',
            initials: user?.nombreCompleto?.substring(0, 2).toUpperCase() || 'U'
        }
    });

    const handleGeneratePdf = async () => {
        if (!window.confirm("¿Está seguro de finalizar este documento? Una vez generado el PDF oficial, no se podrá editar el contenido.")) return;

        try {
            setIsLoading(true);
            // 1. Llamar a DIITRA Builder para generar el PDF (Simulado por ahora)
            const mockTraceCode = "DIITRA-TR-" + Math.random().toString(36).substring(7).toUpperCase();
            const mockHash = "SHA256-" + Math.random().toString(16).substring(10);
            
            // 2. Finalizar la instancia en el servidor
            await api.post(`/documents/instances/${documentUuid}/finalize`, {
                pdfPath: `/storage/docs/${documentUuid}.pdf`,
                hash: mockHash,
                traceabilityCode: mockTraceCode
            });

            // 3. Recargar datos para mostrar estado 'Firmado'
            window.location.reload();
        } catch (error) {
            alert("Error al finalizar el documento.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-bg-deep flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-deep flex flex-col selection:bg-primary/20">
            {/* Header Superior - Premium */}
            <header className="h-16 bg-surface border-b border-border-thin flex items-center justify-between px-6 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-bg-deep rounded-lg text-text-dim transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="h-8 w-[1px] bg-border-thin mx-1"></div>
                    <div>
                        <div className="flex items-center gap-2">
                            <FileText size={16} className="text-primary" />
                            <h1 className="text-sm font-bold text-text-main tracking-tight uppercase">
                                {template?.name || 'Documento'}
                            </h1>
                            {instance?.state === 3 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[9px] font-black text-green-500 uppercase tracking-widest">
                                    <Shield size={10} /> Firmado e Inmutable
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-text-dim font-medium flex items-center gap-2">
                            <span>ID: {documentUuid?.substring(0, 8)}...</span>
                            <span className="w-1 h-1 rounded-full bg-border-thin"></span>
                            <span className="flex items-center gap-1">
                                <Clock size={10} /> Editado recientemente
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Indicador de Usuarios Conectados */}
                    <div className="flex -space-x-2 mr-4">
                        {cowork.session.connectedUsers.map(u => (
                            <div 
                                key={u.id}
                                className="w-7 h-7 rounded-full border-2 border-surface bg-bg-deep flex items-center justify-center text-[9px] font-bold text-white shadow-sm transition-transform hover:scale-110"
                                style={{ backgroundColor: u.color }}
                                title={`${u.name} (${u.role})`}
                            >
                                {u.initials}
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => navigate(`/preview/${documentUuid}`)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-text-main hover:bg-bg-deep rounded-lg transition-all"
                    >
                        <Eye size={14} /> Vista Previa
                    </button>

                    <button 
                        onClick={handleGeneratePdf}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Download size={14} /> Finalizar y Generar PDF
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Izquierdo - Secciones Dinámicas */}
                <aside className="w-64 bg-surface border-r border-border-thin flex flex-col p-4">
                    <div className="mb-6 px-2">
                        <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Secciones del Documento</span>
                    </div>
                    <nav className="space-y-1 flex-1">
                        {sections.map(section => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                                    activeSection === section 
                                    ? 'bg-primary/10 text-primary shadow-sm border border-primary/20' 
                                    : 'text-text-dim hover:bg-bg-deep hover:text-text-main'
                                }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${activeSection === section ? 'bg-primary' : 'bg-transparent'}`}></div>
                                {section.replace(/_/g, ' ').toUpperCase()}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto p-4 bg-bg-deep rounded-xl border border-border-thin">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-main mb-2">
                            <Shield size={12} className="text-green-500" /> CUMPLIMIENTO LOPDP
                        </div>
                        <p className="text-[9px] text-text-dim leading-relaxed">
                            Este documento está siendo auditado en tiempo real según el Art. 26 de la LOPDP.
                        </p>
                    </div>
                </aside>

                {/* Área Principal - El Editor CoWork */}
                <main className="flex-1 bg-bg-deep p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8 flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-black text-text-main tracking-tighter capitalize">
                                    {activeSection.replace(/_/g, ' ')}
                                </h2>
                                <p className="text-text-dim text-sm mt-1">
                                    Redacción colaborativa para el campo oficial del documento.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim bg-surface px-3 py-1.5 rounded-full border border-border-thin">
                                <Users size={12} /> {cowork.session.connectedUsers.length} editando ahora
                            </div>
                        </div>

                        <div className="bg-surface rounded-2xl border border-border-thin shadow-2xl overflow-hidden min-h-[600px] transition-all focus-within:border-primary/30">
                            <CoWorkEditor 
                                cowork={cowork}
                                placeholder={`Empiece a redactar la sección de ${activeSection.replace(/_/g, ' ')}...`}
                            />
                        </div>

                        {/* Footer del Editor */}
                        <div className="mt-6 flex items-center justify-between text-[10px] text-text-dim font-medium italic">
                            <div className="flex items-center gap-2">
                                <History size={12} /> Auto-guardado en base de datos habilitado
                            </div>
                            <div>DIITRA CoWork Core v3.0</div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DocumentWorkspace;
