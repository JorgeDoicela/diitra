import React, { useState, useEffect } from 'react';
import { 
    FileCheck, 
    Search, 
    ArrowRight, 
    X,
    Target,
    Activity,
    Clipboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../api/axios_config';

interface Project {
    uuid: string;
    titulo: string;
    codigoInstitucional: string;
    estado: string;
}

interface FinalReportLauncherProps {
    onClose: () => void;
}

const FinalReportLauncher: React.FC<FinalReportLauncherProps> = ({ onClose }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Endpoint unificado en ProjectsController
                const response = await api.get('/projects');
                setProjects(response.data);
            } catch (err) {
                // Fallback con datos de ejemplo profesionales
                setProjects([
                    { uuid: 'p1', titulo: 'Desarrollo de IA para el ISTPET', codigoInstitucional: 'IST-2026-001', estado: 'En Ejecución' },
                    { uuid: 'p2', titulo: 'Estudio de Energías Renovables en Quito', codigoInstitucional: 'IST-2026-002', estado: 'Por Finalizar' }
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const handleLaunch = async (projectUuid: string) => {
        try {
            // 1. Crear la instancia del Informe Final vinculada al proyecto
            const response = await api.post('/documents/instances', {
                templateCode: 'INFORME_FINAL_INVESTIGACION',
                entityUuid: projectUuid,
                title: `Informe Final - ${projects.find(p => p.uuid === projectUuid)?.titulo}`
            });

            // 2. Navegar al Workspace Premium (Ruta estandarizada)
            navigate(`/investigacion/workspace/INFORME_FINAL_INVESTIGACION/${response.data.uuid}`);
            onClose();
        } catch (err: any) {
            console.error("[DIITRA] Error al lanzar informe:", err.response?.data || err.message);
            alert(`Error: ${err.response?.data?.message || "No se pudo inicializar el Informe Final."}`);
        }
    };

    const filteredProjects = projects.filter(p => 
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.codigoInstitucional.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-surface border-t sm:border border-border-thin w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-up h-[90vh] sm:h-auto flex flex-col">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-border-thin bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                                <Activity size={12} className="animate-pulse" />
                                <span>DIITRA Launcher</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-text-main tracking-tighter uppercase leading-tight">
                                Informe Final
                            </h2>
                            <p className="text-text-dim text-[11px] md:text-sm font-medium">
                                Seleccione el proyecto para consolidar resultados.
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-bg-deep rounded-xl text-text-dim transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 md:p-6 bg-bg-deep/30 border-b border-border-thin">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                        <input 
                            type="text"
                            placeholder="Buscar proyecto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-border-thin rounded-2xl py-3 md:py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Project List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto"></div>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="py-20 text-center opacity-50">
                            <Clipboard size={48} className="mx-auto mb-4 text-text-dim" />
                            <p className="text-sm font-bold text-text-dim uppercase">No se encontraron proyectos</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredProjects.map(p => (
                                <div 
                                    key={p.uuid}
                                    onClick={() => handleLaunch(p.uuid)}
                                    className="flex items-center justify-between p-4 md:p-5 bg-surface border border-border-thin rounded-2xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group shadow-sm"
                                >
                                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                        <div className="p-2 md:p-3 bg-bg-deep rounded-xl text-text-dim group-hover:text-primary transition-colors shrink-0">
                                            <Target size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest mb-0.5 md:mb-1 truncate">{p.codigoInstitucional}</div>
                                            <h4 className="text-xs md:text-sm font-bold text-text-main group-hover:translate-x-1 transition-transform truncate">{p.titulo}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                <span className="text-[9px] md:text-[10px] text-text-dim font-bold uppercase">{p.estado}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 shrink-0">
                                        <ArrowRight size={18} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-border-thin bg-bg-deep/50 flex justify-between items-center">
                    <p className="text-[9px] md:text-[10px] text-text-dim font-bold uppercase tracking-widest">
                        Trazabilidad Habilitada
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 text-xs font-black text-text-dim uppercase hover:text-text-main transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinalReportLauncher;
