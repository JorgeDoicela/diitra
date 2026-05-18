import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, CheckCircle2, Circle, UploadCloud, FileSignature, Settings, CheckSquare, BarChart, ArrowLeft } from 'lucide-react';
import api from '../../../../api/axios_config';
import { useAuth } from '../../../../api/AuthContext';
import DocumentEditor from '../Wizard/DocumentEditor';

const WorkflowPhases = [
    { id: 'Borrador', label: 'Formulación', icon: FileText },
    { id: 'En Revisión', label: 'Evaluación Pares', icon: CheckCircle2 },
    { id: 'Aprobado', label: 'Aprobación Legal', icon: FileSignature },
    { id: 'En Ejecución', label: 'Ejecución y Avance', icon: Settings },
];

export const ProjectWorkspace: React.FC = () => {
    const { documentUuid, templateCode } = useParams<{ documentUuid: string, templateCode: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [currentProject, setCurrentProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDocument, setActiveDocument] = useState<string | null>(null);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                // Fetch de datos reales desde el backend
                const res = await api.get(`/documents/instances/${documentUuid}`);
                
                // Mapeo seguro del state
                let statusLabel = 'Borrador';
                if (res.data.state === 1) statusLabel = 'Borrador';
                if (res.data.state === 2) statusLabel = 'En Revisión';
                if (res.data.state === 3) statusLabel = 'Aprobado';
                
                setCurrentProject({
                    id: res.data.uuid.substring(0,8).toUpperCase(),
                    uuid: res.data.uuid,
                    title: res.data.metadata?.titulo || 'Proyecto de Investigación (Sin Título)',
                    status: statusLabel,
                    presupuesto: res.data.metadata?.CostoTotal || 0,
                    linea: res.data.metadata?.linea || 'No definida'
                });
            } catch (e) {
                console.error("[DIITRA] Error al cargar la instancia del proyecto", e);
                // Fallback graceful
                setCurrentProject({
                    id: documentUuid?.substring(0,8).toUpperCase() || 'NEW',
                    uuid: documentUuid || '',
                    title: 'Nuevo Proyecto de Investigación',
                    status: 'Borrador'
                });
            } finally {
                setIsLoading(false);
            }
        };
        
        if (documentUuid) fetchProject();
    }, [documentUuid]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full"></div>
                    <span className="text-gray-500 font-mono text-sm">Cargando Workspace...</span>
                </div>
            </div>
        );
    }

    // Render del Editor Genérico estructurado (Oculta el Dashboard)
    if (activeDocument) {
        return (
            <DocumentEditor 
                templateCode={activeDocument} 
                initialData={{ Uuid: currentProject.uuid }}
                onClose={() => setActiveDocument(null)} 
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-blue-500/30">
            <header className="border-b border-[#333] bg-[#000] px-8 py-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/investigacion')} className="p-1.5 hover:bg-[#222] rounded text-gray-400 transition-colors">
                        <ArrowLeft size={16} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        DI
                    </div>
                    <span className="text-gray-400 font-mono text-sm">diitra / workspace</span>
                    <ChevronRight size={14} className="text-gray-600" />
                    <span className="font-semibold text-sm">{currentProject.id}</span>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-1.5 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-100 transition-colors shadow-sm">
                        Exportar Metadatos CACES
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-8 py-12 animate-fade-in">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                        {currentProject.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
                        <span className="px-2.5 py-1 bg-[#111] border border-[#333] rounded-md flex items-center gap-2 shadow-inner">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
                            {currentProject.status}
                        </span>
                        <span>UUID: {currentProject.uuid.split('-')[0]}...</span>
                        <span>Rol: <strong className="text-white bg-[#222] px-2 py-0.5 rounded border border-[#333]">{user?.role || 'Investigador'}</strong></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Settings size={20} className="text-gray-400" />
                            Flujo Institucional CACES
                        </h2>
                        
                        <div className="border border-[#333] rounded-xl bg-[#0a0a0a] overflow-hidden shadow-2xl">
                            {WorkflowPhases.map((phase, idx) => {
                                const isCurrent = phase.id === currentProject.status;
                                const isPast = WorkflowPhases.findIndex(p => p.id === currentProject.status) > idx;
                                
                                return (
                                    <div key={phase.id} className={`p-6 border-b border-[#333] last:border-b-0 flex items-start gap-4 transition-all duration-300 ${isCurrent ? 'bg-[#111] border-l-2 border-l-blue-500' : ''}`}>
                                        <div className={`mt-1 transition-colors duration-300 ${isCurrent ? 'text-blue-500' : isPast ? 'text-green-500' : 'text-gray-600'}`}>
                                            {isPast ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-semibold ${isCurrent ? 'text-white' : 'text-gray-300'}`}>{phase.label}</h3>
                                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                                {phase.id === 'Borrador' && 'Construcción colaborativa del protocolo de investigación por parte del equipo.'}
                                                {phase.id === 'En Revisión' && 'Revisión técnica doble ciego por pares evaluadores asignados por el Director.'}
                                                {phase.id === 'Aprobado' && 'Validación final del consejo académico y firma electrónica de actas formales.'}
                                                {phase.id === 'En Ejecución' && 'Seguimiento de hitos, envío de informes de avance y ejecución presupuestaria.'}
                                            </p>
                                            
                                            {phase.id === 'Borrador' && (
                                                <div className="mt-5 flex gap-3">
                                                    <button 
                                                        onClick={() => setActiveDocument(templateCode || 'PROTOCOLO_INVESTIGACION')}
                                                        className="px-4 py-2 bg-[#1a1a1a] border border-[#333] hover:border-gray-500 hover:bg-[#222] text-sm rounded-lg transition-all flex items-center gap-2 shadow-sm"
                                                    >
                                                        <FileText size={16} className="text-gray-400" />
                                                        {isPast ? 'Ver Protocolo' : 'Editar Protocolo'}
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {phase.id === 'En Revisión' && (isCurrent || isPast) && (
                                                <div className="mt-5 flex gap-3 animate-fade-in">
                                                    <button 
                                                        onClick={() => setActiveDocument('RUBRICA_EVALUACION')}
                                                        className="px-4 py-2 bg-white text-black hover:bg-gray-200 text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                                    >
                                                        <CheckSquare size={16} />
                                                        {isPast ? 'Ver Rúbrica' : 'Llenar Rúbrica de Pares'}
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {phase.id === 'En Ejecución' && isCurrent && (
                                                <div className="mt-5 flex gap-3 animate-fade-in">
                                                    <button 
                                                        onClick={() => setActiveDocument('INFORME_AVANCE')}
                                                        className="px-4 py-2 bg-white text-black hover:bg-gray-200 text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                                    >
                                                        <BarChart size={16} />
                                                        Generar Informe de Avance
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="border border-[#333] rounded-xl bg-[#0a0a0a] p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <FileSignature size={18} className="text-blue-400" />
                                Bóveda de Firmas (.p12)
                            </h2>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                Sube tu archivo PAdES. La firma será auditada e insertada permanentemente por el DocumentEngine.
                            </p>
                            
                            <div className="space-y-3">
                                <div className="p-4 border border-[#333] rounded-lg bg-[#111] flex items-center justify-between group hover:border-blue-500/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium">Director de Investigación</p>
                                        <p className="text-[11px] text-yellow-500 mt-0.5 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Pendiente de Firma
                                        </p>
                                    </div>
                                    <button className="p-2.5 bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-blue-600 border border-[#333] hover:border-blue-500 rounded-md transition-all shadow-sm">
                                        <UploadCloud size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="border border-[#333] rounded-xl bg-[#0a0a0a] p-6 shadow-xl">
                            <h2 className="text-lg font-semibold mb-4">Metadata Normativa</h2>
                            <div className="space-y-3 text-sm font-mono">
                                <div className="flex justify-between border-b border-[#222] pb-2">
                                    <span className="text-gray-500">Línea Inv.</span>
                                    <span className="text-gray-300">{currentProject.linea || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-[#222] pb-2">
                                    <span className="text-gray-500">Presupuesto</span>
                                    <span className="text-blue-400">${currentProject.presupuesto || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProjectWorkspace;
