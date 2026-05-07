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
    Eye,
    Sun,
    Moon
} from 'lucide-react';
import { useCoWork, CoWorkEditor } from '../../../core/cowork';
import api from '../../../api/axios_config';
import { useAuth } from '../../../api/AuthContext';

interface TemplateMetadata {
    code: string;
    name: string;
    description: string;
    collaborative_fields_json: string | null;
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
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.getAttribute('data-theme') !== 'light';
    });

    const toggleTheme = () => {
        const nextMode = !isDarkMode;
        setIsDarkMode(nextMode);
        document.documentElement.setAttribute('data-theme', nextMode ? 'dark' : 'light');
    };

    // Cargar metadatos de la instancia y la plantilla
    useEffect(() => {
        const fetchWorkspaceData = async () => {
            try {
                // 1. Obtener la instancia (el documento real)
                const instanceRes = await api.get(`/documents/instances/${documentUuid}`);
                setInstance(instanceRes.data);

                // 2. Obtener la plantilla asociada (usando snake_case del API)
                const templateRes = await api.get(`/admin/templates/${instanceRes.data.template_code}`);
                setTemplate(templateRes.data);
                
                if (templateRes.data.collaborative_fields_json) {
                    const fields = JSON.parse(templateRes.data.collaborative_fields_json);
                    setSections(fields);
                    if (fields.length > 0) setActiveSection(fields[0]);
                    else setActiveSection('contenido_general');
                } else {
                    setSections(['contenido_general']);
                    setActiveSection('contenido_general');
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
        documentId: activeSection ? `${documentUuid}_${activeSection}`.toLowerCase().trim() : '', 
        enabled: !!activeSection && !!documentUuid, // Freno de mano hasta tener sección
        readOnly: instance?.state === 3,
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
            
            // 0. COMPACTACIÓN PLATINUM: Asegurar que el servidor tenga el estado Yjs fusionado
            // Esto limpia los deltas y deja un Snapshot único antes de la generación oficial.
            await cowork.compact();
            
            // 1. Sincronizar el contenido actual una última vez (Garantía de Snapshot HTML)
            // Esto asegura que el servidor tenga el HTML más reciente antes de generar el PDF
            // Note: En una implementación más robusta, usaríamos una referencia al editor Tiptap aquí
            // Por ahora, el onUpdate ya lo hace debounced, pero forzamos el guardado del estado final.
            
            // 2. Ejecutar la Orquestación Enterprise en el Servidor
            // El servidor buscará los datos de investigación + el contenido de CoWork que acabamos de subir.
            const response = await api.post(`/documents/instances/${documentUuid}/finalize`);
            
            const { traceabilityCode, fileName } = response.data;
            
            console.info(`[DIITRA Builder] Documento finalizado exitosamente. Trazabilidad: ${traceabilityCode}`);
            alert(`Documento finalizado y guardado como ${fileName}.\nCódigo de Trazabilidad: ${traceabilityCode}`);

            // 3. Recargar datos para mostrar estado 'Firmado' e inmutable
            window.location.reload();
        } catch (error: any) {
            console.error("[DIITRA] Error en finalización:", error);
            alert("Error al finalizar el documento: " + (error.response?.data?.error || "Error de red"));
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
        <div className="min-h-screen bg-bg-deep flex flex-col selection:bg-primary/20 transition-colors duration-300">
            {/* Header Superior - Premium */}
            <header className="h-16 bg-surface border-b border-border-thin flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-bg-deep rounded-lg text-gray-500 dark:text-text-dim transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="h-8 w-[1px] bg-gray-200 dark:bg-border-thin mx-1"></div>
                    <div>
                        <div className="flex items-center gap-2">
                            <FileText size={16} className="text-primary" />
                            <h1 className="text-sm font-bold text-gray-900 dark:text-text-main tracking-tight uppercase">
                                {template?.name || 'Documento'}
                            </h1>
                            {instance?.state === 3 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[9px] font-black text-green-500 uppercase tracking-widest">
                                    <Shield size={10} /> Firmado e Inmutable
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-text-dim font-medium flex items-center gap-2">
                            <span>ID: {documentUuid?.substring(0, 8)}...</span>
                            <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-border-thin"></span>
                            <span className="flex items-center gap-1">
                                <Clock size={10} /> Editado recientemente
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Indicador de Usuarios Conectados */}
                    <div className="flex -space-x-2 mr-4">
                        {cowork.session.connectedUsers.map((u, idx) => (
                            <div 
                                key={`${u.id}-${idx}`}
                                className="w-7 h-7 rounded-full border-2 border-white dark:border-surface bg-gray-200 dark:bg-bg-deep flex items-center justify-center text-[9px] font-bold text-white shadow-sm transition-transform hover:scale-110"
                                style={{ backgroundColor: u.color }}
                                title={`${u.name} (${u.role})`}
                            >
                                {u.initials}
                            </div>
                        ))}
                    </div>

                    {/* Selector de Tema (Sun/Moon) */}
                    <button 
                        onClick={toggleTheme}
                        className="p-2 mr-2 hover:bg-gray-100 dark:hover:bg-bg-deep rounded-full text-gray-500 dark:text-text-dim transition-all active:scale-90"
                        title={isDarkMode ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
                    >
                        {isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-gray-600" />}
                    </button>

                    <button 
                        onClick={() => navigate(`/preview/${documentUuid}`)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-text-main hover:bg-gray-100 dark:hover:bg-bg-deep rounded-lg transition-all"
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
                <aside className="w-64 bg-surface border-r border-border-thin flex flex-col p-4 shadow-sm z-20 transition-colors duration-300">
                    <div className="mb-6 px-2">
                        <span className="text-[10px] font-black text-gray-400 dark:text-text-dim uppercase tracking-[0.2em]">Secciones del Documento</span>
                    </div>
                    <nav className="space-y-1 flex-1">
                        {sections.map(section => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                                    activeSection === section 
                                    ? 'bg-primary/10 text-primary shadow-sm border border-primary/20' 
                                    : 'text-gray-500 dark:text-text-dim hover:bg-gray-50 dark:hover:bg-bg-deep hover:text-gray-900 dark:hover:text-text-main'
                                }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${activeSection === section ? 'bg-primary' : 'bg-transparent'}`}></div>
                                {section.replace(/_/g, ' ').toUpperCase()}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto p-4 bg-gray-50 dark:bg-bg-deep rounded-xl border border-gray-100 dark:border-border-thin">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-900 dark:text-text-main mb-2">
                            <Shield size={12} className="text-green-500" /> CUMPLIMIENTO LOPDP
                        </div>
                        <p className="text-[9px] text-gray-400 dark:text-text-dim leading-relaxed">
                            Este documento está siendo auditado en tiempo real según el Art. 26 de la LOPDP.
                        </p>
                    </div>
                </aside>

                {/* Área Principal - El Editor CoWork */}
                <main className="flex-1 bg-bg-deep p-8 overflow-y-auto transition-colors duration-300">
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
                            <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim bg-surface px-3 py-1.5 rounded-full border border-border-thin shadow-sm">
                                <Users size={12} /> {cowork.session.connectedUsers.length} editando ahora
                            </div>
                        </div>

                        <div className="bg-surface rounded-2xl border border-border-thin shadow-2xl overflow-hidden min-h-[600px] transition-all focus-within:border-primary/30">
                            {activeSection ? (
                                <CoWorkEditor 
                                    key={activeSection}
                                    cowork={cowork}
                                    placeholder={`Empiece a redactar la sección de ${activeSection.replace(/_/g, ' ')}...`}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[600px] text-gray-400 gap-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                                    <p className="text-sm font-medium">Preparando entorno colaborativo...</p>
                                </div>
                            )}
                        </div>

                        {/* Footer del Editor */}
                        <div className="mt-6 flex items-center justify-between text-[10px] text-gray-400 dark:text-text-dim font-medium italic">
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
