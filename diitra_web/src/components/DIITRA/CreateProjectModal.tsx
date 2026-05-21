import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Shield, BookOpen, Briefcase, Award, Loader, ChevronDown, Check } from 'lucide-react';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { DocumentTemplateRegistry } from '../../core/documents/registry/DocumentTemplateRegistry';

interface CreateProjectModalProps {
    preselectedConvocatoriaId?: number | null;
    onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    preselectedConvocatoriaId,
    onClose
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [titulo, setTitulo] = useState('');
    const [idCarrera, setIdCarrera] = useState<number>(0);
    const [idConvocatoria, setIdConvocatoria] = useState<number>(preselectedConvocatoriaId || 0);

    const [isOpenCarrera, setIsOpenCarrera] = useState(false);
    const [isOpenConvocatoria, setIsOpenConvocatoria] = useState(false);

    const carreraRef = useRef<HTMLDivElement>(null);
    const convocatoriaRef = useRef<HTMLDivElement>(null);

    const [carreras, setCarreras] = useState<any[]>([]);
    const [convocatorias, setConvocatorias] = useState<any[]>([]);
    
    const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [creationStepMsg, setCreationStepMsg] = useState('');
    const [error, setError] = useState<string | null>(null);

    const getCarreraId = (c: any): number => c.idCarrera ?? c.id_carrera ?? 0;
    const getCarreraName = (c: any): string => c.carrera1 ?? c.nombre_carrera ?? c.carrera ?? 'Sin Nombre';

    const getConvocatoriaId = (c: any): number => c.id_convocatoria ?? c.idConvocatoria ?? 0;
    const getConvocatoriaName = (c: any): string => {
        const code = c.codigo_convocatoria ?? c.codigoConvocatoria ?? '';
        const title = c.titulo ?? '';
        return code ? `${code} - ${title}` : title;
    };

    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [rCarreras, rConvocatorias] = await Promise.all([
                    api.get('/catalogs/carreras').catch(() => ({ data: [] })),
                    api.get('/Convocatorias').catch(() => ({ data: [] }))
                ]);
                setCarreras(rCarreras.data || []);
                setConvocatorias(rConvocatorias.data || []);
                
                if (preselectedConvocatoriaId) {
                    setIdConvocatoria(preselectedConvocatoriaId);
                }
            } catch (err) {
                console.error("[DIITRA] Error loading catalogs for wizard:", err);
                setError("No se pudieron cargar los catálogos institucionales.");
            } finally {
                setIsLoadingCatalogs(false);
            }
        };
        loadCatalogs();
    }, [preselectedConvocatoriaId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (carreraRef.current && !carreraRef.current.contains(event.target as Node)) {
                setIsOpenCarrera(false);
            }
            if (convocatoriaRef.current && !convocatoriaRef.current.contains(event.target as Node)) {
                setIsOpenConvocatoria(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo.trim()) return setError("El título / tema del proyecto es obligatorio.");
        if (idCarrera === 0) return setError("Debe seleccionar una carrera asociada.");
        if (idConvocatoria === 0) return setError("Debe vincular su propuesta a una convocatoria.");

        setIsCreating(true);
        setError(null);

        try {
            setCreationStepMsg("Generando expediente digital en el núcleo...");
            const response = await api.post('/documents/instances', { 
                templateCode: 'PROTOCOLO_INVESTIGACION', 
                entityUuid: 'GLOBAL', 
                title: titulo.trim().toUpperCase()
            });

            const newUuid = response.data?.uuid;
            if (!newUuid) {
                throw new Error("No se recibió el identificador único del proyecto.");
            }

            setCreationStepMsg("Vinculando convocatoria y estructurando secciones CACES...");
            const initialMetadata = {
                ...DocumentTemplateRegistry.PROTOCOLO_INVESTIGACION.schema,
                Uuid: newUuid,
                Titulo: titulo.trim().toUpperCase(),
                IdCarrera: idCarrera,
                IdConvocatoria: idConvocatoria,
                DirectorProyecto: user?.nombre_completo || ''
            };

            await api.patch(`/documents/instances/${newUuid}/metadata`, initialMetadata);

            setCreationStepMsg("Estableciendo entorno colaborativo en CoWork...");
            setTimeout(() => {
                navigate(`/investigacion/workspace/PROTOCOLO_INVESTIGACION/${newUuid}?edit=true`, { replace: true });
                onClose();
            }, 800);

        } catch (err: any) {
            console.error("[DIITRA] Error creating proposal:", err);
            setError(err.response?.data?.message || "Ocurrió un error inesperado al iniciar la postulación.");
            setIsCreating(false);
        }
    };

    const selectedCarrera = carreras.find(c => getCarreraId(c) === idCarrera);
    const selectedCarreraName = selectedCarrera ? getCarreraName(selectedCarrera) : "Seleccione una carrera asociada...";

    const selectedConvocatoria = convocatorias.find(c => getConvocatoriaId(c) === idConvocatoria);
    const selectedConvocatoriaLabel = selectedConvocatoria ? getConvocatoriaName(selectedConvocatoria) : "Seleccione una convocatoria...";

    return (
        <div className="modal-overlay">
            <div className="modal-card bg-glow animate-fade-up">
                
                {!isCreating && (
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                )}

                <div className="p-8">
                    
                    <div className="flex items-center gap-3 mb-8 pb-4 divider-vercel !my-0">
                        <div className="text-text-main">
                            <Shield size={20} />
                        </div>
                        <div>
                            <span className="section-label text-text-dim !gap-0">DIITRA Builder</span>
                            <h3 className="text-sm font-black text-text-main uppercase tracking-widest leading-none mt-1">Iniciar Nueva Postulación</h3>
                        </div>
                    </div>

                    {isCreating ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-6 animate-fade-in text-center">
                            <div className="w-10 h-10 border-2 border-text-main border-t-transparent rounded-full animate-spin" />
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-text-main uppercase tracking-widest">Creando Proyecto</h4>
                                <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider px-4">{creationStepMsg}</p>
                            </div>
                        </div>
                    ) : isLoadingCatalogs ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-dim font-mono text-[10px] uppercase tracking-widest">
                            <Loader className="animate-spin text-text-main" size={20} />
                            <span>Cargando catálogos de investigación...</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            {error && (
                                <div className="badge-vercel-error !rounded-md !p-3 text-[10px] font-black uppercase tracking-wider w-full">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <BookOpen size={10} className="text-text-dim" />
                                    Tema / Nombre del Proyecto (Mayúsculas)
                                </label>
                                <textarea
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="EJ: AUTOMATIZACIÓN DEL DEPARTAMENTO DE INVESTIGACIÓN CON METADATA-DRIVEN UI..."
                                    className="input-vercel !h-20 !font-bold !text-xs uppercase resize-none !placeholder:text-text-dim/30"
                                    required
                                />
                            </div>

                            <div className="space-y-2" ref={carreraRef}>
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <Briefcase size={10} className="text-text-dim" />
                                    Carrera / Unidad Solicitante
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpenCarrera(!isOpenCarrera)}
                                        className="input-vercel !font-bold !text-xs text-left cursor-pointer flex items-center justify-between"
                                    >
                                        <span className={idCarrera === 0 ? 'text-text-dim opacity-50' : ''}>
                                            {selectedCarreraName}
                                        </span>
                                        <ChevronDown size={14} className="transition-transform duration-200" style={{ transform: isOpenCarrera ? 'rotate(180deg)' : 'none' }} />
                                    </button>
                                    
                                    {isOpenCarrera && (
                                        <div className="absolute z-[120] mt-1 w-full max-h-48 overflow-y-auto border border-border-thin rounded-md shadow-2xl py-1 bg-surface">
                                            {carreras.map(c => {
                                                const cid = getCarreraId(c);
                                                const cname = getCarreraName(c);
                                                return (
                                                    <button
                                                        key={cid}
                                                        type="button"
                                                        onClick={() => {
                                                            setIdCarrera(cid);
                                                            setIsOpenCarrera(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer border-none outline-none ${idCarrera === cid ? 'bg-text-main text-bg-deep font-bold' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}
                                                    >
                                                        <span>{cname}</span>
                                                        {idCarrera === cid && <Check size={12} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2" ref={convocatoriaRef}>
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <Award size={10} className="text-text-dim" />
                                    Convocatoria Vinculada
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => !preselectedConvocatoriaId && setIsOpenConvocatoria(!isOpenConvocatoria)}
                                        disabled={!!preselectedConvocatoriaId}
                                        className="input-vercel !font-bold !text-xs text-left disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-between"
                                    >
                                        <span className={idConvocatoria === 0 ? 'text-text-dim opacity-50' : ''}>
                                            {selectedConvocatoriaLabel}
                                        </span>
                                        {!preselectedConvocatoriaId && (
                                            <ChevronDown size={14} className="transition-transform duration-200" style={{ transform: isOpenConvocatoria ? 'rotate(180deg)' : 'none' }} />
                                        )}
                                    </button>
                                    
                                    {isOpenConvocatoria && !preselectedConvocatoriaId && (
                                        <div className="absolute z-[120] mt-1 w-full max-h-48 overflow-y-auto border border-border-thin rounded-md shadow-2xl py-1 bg-surface">
                                            {convocatorias.map(c => {
                                                const coid = getConvocatoriaId(c);
                                                const coname = getConvocatoriaName(c);
                                                return (
                                                    <button
                                                        key={coid}
                                                        type="button"
                                                        onClick={() => {
                                                            setIdConvocatoria(coid);
                                                            setIsOpenConvocatoria(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer border-none outline-none ${idConvocatoria === coid ? 'bg-text-main text-bg-deep font-bold' : 'bg-transparent text-text-main hover:bg-surface-hover'}`}
                                                    >
                                                        <span>{coname}</span>
                                                        {idConvocatoria === coid && <Check size={12} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-vercel-secondary flex-1 py-3"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-vercel-primary flex-1 py-3"
                                >
                                    Iniciar Formulación
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
