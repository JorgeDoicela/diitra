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

    // Form states
    const [titulo, setTitulo] = useState('');
    const [idCarrera, setIdCarrera] = useState<number>(0);
    const [idConvocatoria, setIdConvocatoria] = useState<number>(preselectedConvocatoriaId || 0);

    // Custom dropdown states
    const [isOpenCarrera, setIsOpenCarrera] = useState(false);
    const [isOpenConvocatoria, setIsOpenConvocatoria] = useState(false);

    // Refs for click outside detection
    const carreraRef = useRef<HTMLDivElement>(null);
    const convocatoriaRef = useRef<HTMLDivElement>(null);

    // Catalog states
    const [carreras, setCarreras] = useState<any[]>([]);
    const [convocatorias, setConvocatorias] = useState<any[]>([]);

    // UI states
    const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [creationStepMsg, setCreationStepMsg] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Load catalogs
    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [rCarreras, rConvocatorias] = await Promise.all([
                    api.get('/catalogs/carreras').catch(() => ({ data: [] })),
                    api.get('/Convocatorias').catch(() => ({ data: [] }))
                ]);
                setCarreras(rCarreras.data || []);
                setConvocatorias(rConvocatorias.data || []);

                // If convocatoria is pre-selected, lock it in
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

    // Click outside handler to close custom dropdowns
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
            // Step 1: Create instance
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

            // Step 2: Inject metadata and initial template schema
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

            // Step 3: Establish environment & redirect
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

    const selectedCarreraName = carreras.find(c => c.id_carrera === idCarrera)?.nombre_carrera || "Seleccione una carrera asociada...";
    const selectedConvocatoriaLabel = convocatorias.find(c => c.id_convocatoria === idConvocatoria)
        ? `${convocatorias.find(c => c.id_convocatoria === idConvocatoria).codigo_convocatoria} - ${convocatorias.find(c => c.id_convocatoria === idConvocatoria).titulo}`
        : "Seleccione una convocatoria...";

    return (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border-thin w-full max-w-md rounded-lg overflow-hidden shadow-2xl relative animate-fade-up bg-glow">

                {/* Close Button */}
                {!isCreating && (
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                )}

                {/* Main Content */}
                <div className="p-8">

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border-thin">
                        <div className="text-text-main">
                            <Shield size={20} />
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.3em]">DIITRA Builder</span>
                            <h3 className="text-sm font-black text-text-main uppercase tracking-widest leading-none mt-1">Iniciar Nueva Postulación</h3>
                        </div>
                    </div>

                    {/* Loader overlay during creation */}
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

                            {/* Error Alert */}
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-[10px] font-black uppercase tracking-wider">
                                    {error}
                                </div>
                            )}

                            {/* Campo 1: Título / Tema */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <BookOpen size={10} className="text-text-dim" />
                                    Tema / Nombre del Proyecto (Mayúsculas)
                                </label>
                                <textarea
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="EJ: AUTOMATIZACIÓN DEL DEPARTAMENTO DE INVESTIGACIÓN CON METADATA-DRIVEN UI..."
                                    className="w-full bg-bg-deep border border-border-thin text-text-main text-xs font-bold rounded-md px-4 py-3 h-20 focus:border-text-main outline-none transition-all placeholder:text-text-dim/30 resize-none uppercase"
                                    required
                                />
                            </div>

                            {/* Campo 2: Carrera (Custom Dropdown) */}
                            <div className="space-y-2" ref={carreraRef}>
                                <label className="flex items-center gap-2 text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                                    <Briefcase size={10} className="text-text-dim" />
                                    Carrera / Unidad Solicitante
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpenCarrera(!isOpenCarrera)}
                                        className="w-full flex items-center justify-between bg-bg-deep border border-border-thin text-text-main text-xs font-bold rounded-md px-4 py-3 focus:border-text-main outline-none transition-all text-left cursor-pointer"
                                    >
                                        <span className={idCarrera === 0 ? 'text-text-dim/40' : 'text-text-main'}>
                                            {selectedCarreraName}
                                        </span>
                                        <ChevronDown size={14} className={`text-text-dim transition-transform duration-200 ${isOpenCarrera ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isOpenCarrera && (
                                        <div className="absolute z-[120] mt-1 w-full max-h-48 overflow-y-auto bg-surface border border-border-thin rounded-md shadow-2xl py-1 custom-scrollbar">
                                            {carreras.map(c => (
                                                <button
                                                    key={c.id_carrera}
                                                    type="button"
                                                    onClick={() => {
                                                        setIdCarrera(c.id_carrera);
                                                        setIsOpenCarrera(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer bg-transparent ${idCarrera === c.id_carrera
                                                            ? 'bg-text-main text-bg-deep font-bold'
                                                            : 'text-text-main hover:bg-surface-hover'
                                                        }`}
                                                >
                                                    <span>{c.nombre_carrera}</span>
                                                    {idCarrera === c.id_carrera && <Check size={12} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Campo 3: Convocatoria (Custom Dropdown) */}
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
                                        className="w-full flex items-center justify-between bg-bg-deep border border-border-thin text-text-main text-xs font-bold rounded-md px-4 py-3 focus:border-text-main outline-none transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <span className={idConvocatoria === 0 ? 'text-text-dim/40' : 'text-text-main'}>
                                            {selectedConvocatoriaLabel}
                                        </span>
                                        {!preselectedConvocatoriaId && (
                                            <ChevronDown size={14} className={`text-text-dim transition-transform duration-200 ${isOpenConvocatoria ? 'rotate-180' : ''}`} />
                                        )}
                                    </button>

                                    {isOpenConvocatoria && !preselectedConvocatoriaId && (
                                        <div className="absolute z-[120] mt-1 w-full max-h-48 overflow-y-auto bg-surface border border-border-thin rounded-md shadow-2xl py-1 custom-scrollbar">
                                            {convocatorias.map(c => (
                                                <button
                                                    key={c.id_convocatoria}
                                                    type="button"
                                                    onClick={() => {
                                                        setIdConvocatoria(c.id_convocatoria);
                                                        setIsOpenConvocatoria(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer bg-transparent ${idConvocatoria === c.id_convocatoria
                                                            ? 'bg-text-main text-bg-deep font-bold'
                                                            : 'text-text-main hover:bg-surface-hover'
                                                        }`}
                                                >
                                                    <span>{c.codigo_convocatoria} - {c.titulo}</span>
                                                    {idConvocatoria === c.id_convocatoria && <Check size={12} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-transparent hover:bg-surface-hover border border-border-thin text-text-dim hover:text-text-main rounded-md text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-text-main hover:opacity-90 text-bg-deep rounded-md text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer"
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
