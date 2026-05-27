import React, { useState, useEffect } from 'react';
import { 
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

const getEstadoDotClass = (estado: string) => {
    switch (estado?.toLowerCase()) {
        case 'borrador':
            return 'dot-neutral';
        case 'enviado':
            return 'dot-info';
        case 'en revisión':
        case 'en revision':
            return 'dot-warning';
        case 'aprobado':
        case 'finalizado':
            return 'dot-success';
        case 'en ejecución':
        case 'en ejecucion':
            return 'dot-brand dot-pulse';
        case 'rechazado':
            return 'dot-error';
        default:
            return 'dot-success';
    }
};

const FinalReportLauncher: React.FC<FinalReportLauncherProps> = ({ onClose }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await api.get('/projects');
                if (response.data && response.data.length > 0) {
                    setProjects(response.data);
                } else {
                    setProjects([
                        { uuid: 'p1', titulo: 'Desarrollo de IA para el ISTPET', codigoInstitucional: 'IST-2026-001', estado: 'En Ejecución' },
                        { uuid: 'p2', titulo: 'Estudio de Energías Renovables en Quito', codigoInstitucional: 'IST-2026-002', estado: 'Por Finalizar' }
                    ]);
                }
            } catch (err) {
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
            const response = await api.post('/documents/instances', {
                templateCode: 'INFORME_FINAL_INVESTIGACION',
                entityUuid: projectUuid,
                title: `Informe Final - ${projects.find(p => p.uuid === projectUuid)?.titulo}`
            });

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
        <div className="modal-overlay !items-end sm:!items-center !p-0 sm:!p-4">
            <div className="modal-card !max-w-2xl !rounded-t-2xl sm:!rounded-2xl animate-fade-up h-[90vh] sm:h-auto max-h-[90vh] sm:max-h-[80vh] flex flex-col">
                <div className="modal-header">
                    <div className="space-y-1">
                        <div className="section-label text-brand">
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
                        className="p-2 hover:bg-surface-hover rounded-xl text-text-dim transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 md:p-6 bg-bg-deep/30 border-b border-border-thin">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                        <input 
                            type="text"
                            placeholder="Buscar proyecto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-vercel !rounded-2xl !py-3 md:!py-4 !pl-12 !pr-4 !text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand mx-auto"></div>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="empty-state !border-solid my-0">
                            <Clipboard size={48} className="mb-4 text-text-dim" />
                            <p className="text-sm font-bold text-text-dim uppercase">No se encontraron proyectos</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredProjects.map(p => (
                                <div 
                                    key={p.uuid}
                                    onClick={() => handleLaunch(p.uuid)}
                                    className="bento-card flex items-center justify-between p-4 md:p-5 cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                        <div className="icon-circle-brand !p-2 md:!p-3 group-hover:scale-110 transition-transform shrink-0">
                                            <Target size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[9px] md:text-[10px] font-black text-brand uppercase tracking-widest mb-0.5 md:mb-1 truncate">{p.codigoInstitucional}</div>
                                            <h4 className="text-xs md:text-sm font-bold text-text-main group-hover:translate-x-1 transition-transform truncate">{p.titulo || 'PROYECTO SIN TÍTULO'}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`dot ${getEstadoDotClass(p.estado)}`} />
                                                <span className="text-[9px] md:text-[10px] text-text-dim font-bold uppercase">{p.estado || 'BORRADOR'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="icon-circle-brand !p-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 shrink-0">
                                        <ArrowRight size={18} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer !justify-between">
                    <span className="text-[9px] md:text-[10px] text-text-dim font-bold uppercase tracking-widest">
                        Trazabilidad Habilitada
                    </span>
                    <button 
                        onClick={onClose}
                        className="btn-vercel-secondary py-2"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinalReportLauncher;
