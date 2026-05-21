import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, FileText, CheckCircle2, Circle, UploadCloud, FileSignature, Settings, CheckSquare, BarChart, ArrowLeft, BookOpen, Trash2, ExternalLink, Users, UserPlus, Search, Plus, Sparkles, AlertCircle } from 'lucide-react';
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
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const shouldEdit = queryParams.get('edit') === 'true';

    const [currentProject, setCurrentProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDocument, setActiveDocument] = useState<string | null>(() => {
        return shouldEdit ? (templateCode || 'PROTOCOLO_INVESTIGACION') : null;
    });
    const [isPublishingDSpace, setIsPublishingDSpace] = useState(false);

    const [products, setProducts] = useState<any[]>([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [productTypes, setProductTypes] = useState<any[]>([]);
    
    // Modal Form States
    const [newProduct, setNewProduct] = useState({
        id_tipo_producto: 1,
        titulo: '',
        cantidad: 1,
        url_producto: '',
        es_propiedad_intelectual: false,
        numero_registro: '',
        fecha_registro_senadi: ''
    });

    // --- Dynamic Team Management States ---
    const [investigadores, setInvestigadores] = useState<any[]>([]);
    const [tieneGrupo, setTieneGrupo] = useState<boolean>(false);
    const [isSavingTeam, setIsSavingTeam] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [teamMessage, setTeamMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchProducts = async () => {
        let retries = 3;
        let success = false;
        let res: any = null;
        while (retries > 0 && !success) {
            try {
                res = await api.get(`/ResearchProducts/project/${documentUuid}`);
                success = true;
            } catch (err: any) {
                retries--;
                if (err?.response?.status === 404 && retries > 0) {
                    console.warn(`[DIITRA] Productos no encontrados (404), reintentando en 1s... (${retries} intentos restantes)`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    retries = 0; // abortar otros errores o intentos agotados
                    console.error("[DIITRA] Error al cargar productos", err);
                }
            }
        }
        if (success && res) {
            setProducts(res.data);
        }
    };

    const fetchProductTypes = async () => {
        try {
            const res = await api.get('/catalogs/tipo-producto');
            setProductTypes(res.data);
            if (res.data.length > 0) {
                setNewProduct(prev => ({ ...prev, id_tipo_producto: res.data[0].id_tipo_producto }));
            }
        } catch (err) {
            console.error("[DIITRA] Error al cargar tipos de producto", err);
        }
    };

    useEffect(() => {
        if (documentUuid) {
            fetchProducts();
            fetchProductTypes();
        }
    }, [documentUuid]);

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/ResearchProducts', {
                projectUuid: documentUuid,
                idTipoProducto: Number(newProduct.id_tipo_producto),
                titulo: newProduct.titulo,
                cantidad: Number(newProduct.cantidad),
                urlProducto: newProduct.url_producto || null,
                esPropiedadIntelectual: newProduct.es_propiedad_intelectual,
                numeroRegistro: newProduct.es_propiedad_intelectual ? newProduct.numero_registro : null,
                fechaRegistroSenadi: newProduct.es_propiedad_intelectual && newProduct.fecha_registro_senadi ? newProduct.fecha_registro_senadi : null
            });
            setShowProductModal(false);
            setNewProduct({
                id_tipo_producto: productTypes[0]?.id_tipo_producto || 1,
                titulo: '',
                cantidad: 1,
                url_producto: '',
                es_propiedad_intelectual: false,
                numero_registro: '',
                fecha_registro_senadi: ''
            });
            fetchProducts();
        } catch (err) {
            console.error("[DIITRA] Error al crear producto", err);
            alert("Error al registrar el producto");
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!window.confirm("¿Está seguro de eliminar este producto de investigación?")) return;
        try {
            await api.delete(`/ResearchProducts/${id}`);
            fetchProducts();
        } catch (err) {
            console.error("[DIITRA] Error al eliminar producto", err);
        }
    };

    const getPhaseIndex = (status: string) => {
        if (status === 'Borrador') return 0;
        if (status === 'Enviado' || status === 'En Revisión') return 1;
        if (status === 'Aprobado') return 2;
        if (status === 'En Ejecución' || status === 'Finalizado') return 3;
        return -1;
    };

    useEffect(() => {
        const fetchProject = async () => {
            let retries = 3;
            let success = false;
            let res: any = null;
            while (retries > 0 && !success) {
                try {
                    res = await api.get(`/projects/${documentUuid}/detail`);
                    success = true;
                } catch (e: any) {
                    retries--;
                    if (e?.response?.status === 404 && retries > 0) {
                        console.warn(`[DIITRA] Detalle de proyecto no encontrado (404), reintentando en 1s... (${retries} intentos restantes)`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else {
                        retries = 0; // abortar otros errores o intentos agotados
                        console.error("[DIITRA] Error al cargar la instancia del proyecto", e);
                    }
                }
            }

            if (success && res) {
                setCurrentProject({
                    id: res.data.uuid.substring(0,8).toUpperCase(),
                    uuid: res.data.uuid,
                    title: res.data.titulo || 'Proyecto de Investigación (Sin Título)',
                    status: res.data.estado || 'Borrador',
                    presupuesto: res.data.costo_total || 0,
                    linea: res.data.linea_investigacion || 'No definida'
                });
                setInvestigadores(res.data.investigadores || []);
                setTieneGrupo(res.data.tieneGrupoInvestigacion || false);
            } else {
                // Fallback graceful
                setCurrentProject({
                    id: documentUuid?.substring(0,8).toUpperCase() || 'NEW',
                    uuid: documentUuid || '',
                    title: 'Nuevo Proyecto de Investigación',
                    status: 'Borrador',
                    presupuesto: 0,
                    linea: 'No definida'
                });
                setInvestigadores([]);
                setTieneGrupo(false);
            }
            setIsLoading(false);
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

    // --- Autocomplete search effect for working groups ---
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(res.data || []);
                setShowResults(true);
            } catch (err) {
                console.error("[DIITRA] Error al buscar usuarios", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleAddMember = (selectedUser: any) => {
        if (investigadores.some(inv => inv.cedula?.trim() === selectedUser.cedula?.trim())) {
            alert("Esta persona ya está registrada en el equipo de trabajo.");
            return;
        }

        const newMember = {
            nombre: selectedUser.nombre,
            cedula: selectedUser.cedula,
            rol: selectedUser.rol || "Co-Investigador (Docente)",
            nivelAcademico: selectedUser.nivelAcademico || "Tercer Nivel",
            telefono: selectedUser.telefono || ""
        };

        setInvestigadores(prev => [...prev, newMember]);
        setSearchQuery('');
        setShowResults(false);
    };

    const handleUpdateMember = (index: number, field: string, value: any) => {
        setInvestigadores(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const handleRemoveMember = (index: number) => {
        setInvestigadores(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveTeam = async () => {
        setIsSavingTeam(true);
        setTeamMessage(null);
        try {
            const payload = investigadores.map(inv => ({
                nombre: inv.nombre,
                cedula: inv.cedula,
                rol: inv.rol,
                nivelAcademico: inv.nivelAcademico,
                telefono: inv.telefono || ""
            }));

            const res = await api.patch(`/projects/${currentProject.uuid}/team`, payload);
            if (res.data.success) {
                setTeamMessage({ type: 'success', text: '¡Equipo de trabajo guardado y sincronizado con éxito!' });
                const isGroup = investigadores.length > 1;
                setTieneGrupo(isGroup);
                setCurrentProject(prev => ({
                    ...prev,
                    tieneGrupoInvestigacion: isGroup
                }));
                setTimeout(() => setTeamMessage(null), 4000);
            } else {
                setTeamMessage({ type: 'error', text: res.data.message || 'Error al guardar los cambios.' });
            }
        } catch (err: any) {
            console.error("[DIITRA] Error al guardar equipo de trabajo", err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || 'Ocurrió un error inesperado al guardar.';
            setTeamMessage({ type: 'error', text: errMsg });
        } finally {
            setIsSavingTeam(false);
        }
    };

    const handleToggleTieneGrupo = (val: boolean) => {
        if (!val) {
            const director = investigadores.find(inv => inv.rol?.toLowerCase().includes('director')) || investigadores[0];
            if (investigadores.length > 1) {
                if (window.confirm("Al cambiar a Trabajo Individual, se removerán los demás co-investigadores y estudiantes. ¿Deseas continuar?")) {
                    setInvestigadores(director ? [director] : []);
                    setTieneGrupo(false);
                }
            } else {
                setTieneGrupo(false);
            }
        } else {
            setTieneGrupo(true);
        }
    };

    const handleCloseEditor = () => {
        setActiveDocument(null);
        navigate(`/investigacion/workspace/${templateCode}/${documentUuid}`, { replace: true });
    };

    // Render del Editor Genérico estructurado (Oculta el Dashboard)
    if (activeDocument) {
        return (
            <DocumentEditor 
                templateCode={activeDocument} 
                initialData={{ Uuid: currentProject.uuid }}
                onClose={handleCloseEditor} 
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
                    <button 
                        onClick={async () => {
                            try {
                                const response = await api.get(`/projects/${currentProject.uuid}/export-caces`, { responseType: 'blob' });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `CACES_METADATA_${currentProject.id}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                            } catch (err) {
                                console.error("[DIITRA] Error al exportar metadatos CACES", err);
                                alert("No se pudo realizar la exportación de metadatos CACES");
                            }
                        }}
                        className="px-4 py-1.5 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        Exportar Metadatos CACES
                    </button>

                    <button 
                        disabled={isPublishingDSpace}
                        onClick={async () => {
                            try {
                                setIsPublishingDSpace(true);
                                const res = await api.post(`/projects/${currentProject.uuid}/publish-dspace`);
                                alert(`¡Proyecto publicado con éxito en DSpace! URI: ${res.data.uri}`);
                            } catch (err: any) {
                                console.error("[DIITRA] Error al publicar en DSpace", err);
                                const errMsg = err.response?.data?.error || "No se pudo realizar la publicación en DSpace";
                                alert(errMsg);
                            } finally {
                                setIsPublishingDSpace(false);
                            }
                        }}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors shadow-sm flex items-center gap-1.5 ${
                            isPublishingDSpace 
                                ? 'bg-[#222] text-gray-500 cursor-not-allowed border border-[#333]' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                    >
                        <UploadCloud size={16} className={isPublishingDSpace ? "animate-pulse" : ""} />
                        {isPublishingDSpace ? 'Publicando...' : 'Publicar en DSpace'}
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
                                const currentIdx = getPhaseIndex(currentProject.status);
                                const isCurrent = currentIdx === idx;
                                const isPast = currentIdx > idx;
                                
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
                                );
                            })}
                        </div>

                        {/* EQUIPO DE TRABAJO (Gestión de Grupo / Solo) */}
                        <div className="border border-[#333] rounded-xl bg-[#0a0a0a] p-6 shadow-2xl space-y-6 mt-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#222]">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Users size={22} className="text-blue-400" />
                                        Equipo de Trabajo
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1 font-mono">
                                        Gestión dinámica del talento humano del proyecto
                                    </p>
                                </div>
                                
                                {/* Dynamic Toggle (Solo vs. Team) */}
                                <div className="flex bg-[#111] p-1 rounded-lg border border-[#222]">
                                    <button 
                                        type="button"
                                        onClick={() => handleToggleTieneGrupo(false)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 ${!tieneGrupo ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Trabajo Individual
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleToggleTieneGrupo(true)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 ${tieneGrupo ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Grupo de Trabajo
                                    </button>
                                </div>
                            </div>

                            {/* Banner Informativo */}
                            {!tieneGrupo ? (
                                <div className="p-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 text-yellow-400/90 text-xs flex gap-3 leading-relaxed">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold text-yellow-400">Modalidad Individual:</span> El proyecto está asignado para ser ejecutado únicamente por el Director del proyecto. Para agregar más docentes, co-investigadores o estudiantes de apoyo, cambia la modalidad a <strong>Grupo de Trabajo</strong> en el selector superior.
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-blue-400/90 text-xs flex gap-3 leading-relaxed">
                                    <Sparkles size={18} className="shrink-0 mt-0.5 text-blue-400 animate-pulse" />
                                    <div>
                                        <span className="font-semibold text-blue-300">Modalidad Grupal:</span> Puedes invitar a otros docentes e investigadores como co-investigadores, o a estudiantes de la institución como ayudantes de investigación o tesistas. Utiliza el buscador a continuación.
                                    </div>
                                </div>
                            )}

                            {/* Autocomplete Search input (only visible in Group Mode) */}
                            {tieneGrupo && (
                                <div className="relative space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Agregar Miembros del IST</label>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input 
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => setShowResults(true)}
                                            placeholder="Buscar docente o estudiante por nombre o cédula..."
                                            className="w-full bg-[#111] border border-[#222] hover:border-[#444] focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-colors text-white placeholder:text-gray-600"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-blue-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dropdown Suggestions */}
                                    {showResults && searchQuery.trim() && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={() => setShowResults(false)}></div>
                                            <div className="absolute left-0 right-0 top-full mt-2 bg-[#0e0e0e] border border-[#333] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-30 divide-y divide-[#222] backdrop-blur-md">
                                                {searchResults.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-gray-500 font-mono">
                                                        No se encontraron resultados institucionales.
                                                    </div>
                                                ) : (
                                                    searchResults.map((selectedUser: any) => (
                                                        <button 
                                                            key={selectedUser.cedula}
                                                            type="button"
                                                            onClick={() => handleAddMember(selectedUser)}
                                                            className="w-full p-3.5 flex items-center justify-between hover:bg-[#161616] text-left text-xs transition-colors"
                                                        >
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-white text-sm">{selectedUser.nombre}</p>
                                                                <p className="text-gray-500 font-mono text-[10px]">C.I. {selectedUser.cedula} | {selectedUser.email}</p>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded text-[9px] font-bold tracking-wider uppercase border ${
                                                                selectedUser.tipo === 'profesor' 
                                                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                                                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                            }`}>
                                                                {selectedUser.tipo === 'profesor' ? 'Docente' : 'Estudiante'}
                                                            </span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Investigators List */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Integrantes del Equipo ({investigadores.length})</label>
                                
                                {investigadores.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 border border-dashed border-[#222] rounded-xl font-mono text-xs">
                                        No hay investigadores asignados a este proyecto.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {investigadores.map((member: any, index: number) => {
                                            const isDirector = member.rol?.toLowerCase().includes('director');
                                            const isEstudiante = member.rol?.toLowerCase().includes('estudiante') || member.nivelAcademico === 'Pregrado';
                                            
                                            return (
                                                <div 
                                                    key={member.cedula || index} 
                                                    className="p-4 border border-[#222] rounded-xl bg-[#111]/50 hover:bg-[#111] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative group animate-fade-in"
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm border uppercase shadow-sm ${
                                                            isDirector 
                                                                ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-400/30 text-white' 
                                                                : isEstudiante 
                                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                                    : 'bg-[#222] border-[#333] text-gray-400'
                                                        }`}>
                                                            {member.nombre ? member.nombre.substring(0, 2) : 'IN'}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                                                {member.nombre}
                                                                {isDirector && (
                                                                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                                                                        Director
                                                                    </span>
                                                                )}
                                                            </h4>
                                                            <div className="text-[11px] text-gray-500 font-mono mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                <span>C.I. {member.cedula || 'N/A'}</span>
                                                                <span>•</span>
                                                                <div className="flex items-center gap-1">
                                                                    <span>Tel:</span>
                                                                    <input 
                                                                        type="text" 
                                                                        value={member.telefono || ''} 
                                                                        onChange={(e) => handleUpdateMember(index, 'telefono', e.target.value)}
                                                                        placeholder="Añadir..." 
                                                                        className="bg-transparent text-gray-300 placeholder:text-gray-700 focus:outline-none border-b border-[#333] hover:border-gray-500 focus:border-blue-500 w-24 inline-block px-1 py-0.5 text-[11px] transition-colors" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 self-end md:self-auto">
                                                        {/* Role Dropdown */}
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Rol</span>
                                                            <select
                                                                value={member.rol}
                                                                onChange={(e) => handleUpdateMember(index, 'rol', e.target.value)}
                                                                className="bg-[#0e0e0e] border border-[#222] rounded-lg py-1.5 px-2.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 transition-colors w-44"
                                                            >
                                                                <option value="Director de Proyecto">Director de Proyecto</option>
                                                                <option value="Co-Investigador (Docente)">Co-Investigador (Docente)</option>
                                                                <option value="Co-Investigador (Estudiante)">Co-Investigador (Estudiante)</option>
                                                                <option value="Técnico de Apoyo">Técnico de Apoyo</option>
                                                            </select>
                                                        </div>

                                                        {/* Academic Level Dropdown */}
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Nivel Académico</span>
                                                            <select
                                                                value={member.nivelAcademico}
                                                                onChange={(e) => handleUpdateMember(index, 'nivelAcademico', e.target.value)}
                                                                className="bg-[#0e0e0e] border border-[#222] rounded-lg py-1.5 px-2.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500 transition-colors w-40"
                                                            >
                                                                <option value="Tercer Nivel">Tercer Nivel</option>
                                                                <option value="Cuarto Nivel (Maestría)">Cuarto Nivel (Maestría)</option>
                                                                <option value="Cuarto Nivel (PhD)">Cuarto Nivel (PhD)</option>
                                                                <option value="Pregrado">Pregrado</option>
                                                            </select>
                                                        </div>

                                                        {/* Delete member button (only if not the only member or if it is group mode) */}
                                                        {(!isDirector || tieneGrupo) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMember(index)}
                                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all md:mt-4"
                                                                title="Remover integrante"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Notifications / Toast Area */}
                            {teamMessage && (
                                <div className={`p-4 rounded-xl border text-xs flex gap-3 items-center leading-relaxed animate-in fade-in duration-200 ${
                                    teamMessage.type === 'success' 
                                        ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                                        : 'border-red-500/20 bg-red-500/5 text-red-400'
                                }`}>
                                    <CheckSquare size={16} className="shrink-0" />
                                    <span className="font-medium">{teamMessage.text}</span>
                                </div>
                            )}

                            {/* Glowing Save Button */}
                            <div className="flex justify-end pt-4 border-t border-[#222]">
                                <button
                                    type="button"
                                    disabled={isSavingTeam}
                                    onClick={handleSaveTeam}
                                    className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg ${
                                        isSavingTeam 
                                            ? 'bg-[#222] text-gray-500 border border-[#333] cursor-not-allowed shadow-none' 
                                            : 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-blue-500/20 shadow-blue-500/10'
                                    }`}
                                >
                                    {isSavingTeam ? (
                                        <>
                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-t-transparent border-gray-500 rounded-full"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={14} />
                                            Guardar Cambios del Equipo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* MÓDULO DE PRODUCTOS DE INVESTIGACIÓN (CACES Compliance) */}
                        <div className="border border-[#333] rounded-xl bg-[#0a0a0a] p-6 shadow-2xl space-y-6 mt-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <BookOpen size={20} className="text-gray-400" />
                                    Productos de Investigación Registrados
                                </h2>
                                <button 
                                    onClick={() => setShowProductModal(true)}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-500 transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/10"
                                >
                                    + Registrar Producto
                                </button>
                            </div>
                            
                            {products.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border border-dashed border-[#222] rounded-xl font-mono text-xs">
                                    No hay productos declarados para este proyecto de investigación.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {products.map((prod: any) => (
                                        <div key={prod.id_producto} className="p-4 border border-[#222] rounded-xl bg-[#111] space-y-2 relative group hover:border-[#444] transition-all">
                                            <div className="flex justify-between items-start">
                                                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded">
                                                    {prod.tipo_producto_nombre}
                                                </span>
                                                <button 
                                                    onClick={() => handleDeleteProduct(prod.id_producto)}
                                                    className="p-1 hover:bg-red-500/20 hover:text-red-500 text-gray-500 rounded transition-all"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                            <h3 className="font-bold text-sm text-white line-clamp-1">{prod.titulo}</h3>
                                            <div className="text-[11px] text-gray-500 space-y-1 font-mono">
                                                {prod.url_producto && (
                                                    <a href={prod.url_producto} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                                                        <ExternalLink size={10} /> {prod.url_producto.length > 30 ? prod.url_producto.substring(0, 30) + '...' : prod.url_producto}
                                                    </a>
                                                )}
                                                {prod.es_propiedad_intelectual && (
                                                    <p className="text-emerald-500 flex items-center gap-1">
                                                        <span>★ SENADI:</span> {prod.numero_registro || 'En trámite'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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

            {/* Modal de Registro de Producto */}
            {showProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0c0c0c] border border-[#333] w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-white">
                        <div className="flex justify-between items-center border-b border-[#222] pb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <BookOpen size={18} className="text-blue-500" />
                                Registrar Producto de Investigación
                            </h3>
                            <button onClick={() => setShowProductModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateProduct} className="space-y-4 text-sm">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tipo de Producto</label>
                                <select 
                                    value={newProduct.id_tipo_producto}
                                    onChange={(e) => setNewProduct({ ...newProduct, id_tipo_producto: Number(e.target.value) })}
                                    className="w-full bg-[#111] border border-[#333] rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                                >
                                    {productTypes.map((type) => (
                                        <option key={type.id_tipo_producto} value={type.id_tipo_producto}>
                                            {type.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Título del Producto / Artículo</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Ej: Análisis comparativo de algoritmos CNN en cultivos..."
                                    value={newProduct.titulo}
                                    onChange={(e) => setNewProduct({ ...newProduct, titulo: e.target.value })}
                                    className="w-full bg-[#111] border border-[#333] rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-gray-600"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cantidad</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        required
                                        value={newProduct.cantidad}
                                        onChange={(e) => setNewProduct({ ...newProduct, cantidad: Number(e.target.value) })}
                                        className="w-full bg-[#111] border border-[#333] rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">URL / DOI / ISSN</label>
                                    <input 
                                        type="text"
                                        placeholder="Ej: https://doi.org/10..."
                                        value={newProduct.url_producto}
                                        onChange={(e) => setNewProduct({ ...newProduct, url_producto: e.target.value })}
                                        className="w-full bg-[#111] border border-[#333] rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-gray-600"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox"
                                    id="es_propiedad_intelectual"
                                    checked={newProduct.es_propiedad_intelectual}
                                    onChange={(e) => setNewProduct({ ...newProduct, es_propiedad_intelectual: e.target.checked })}
                                    className="rounded bg-[#111] border-[#333] text-blue-500 focus:ring-0 focus:ring-offset-0"
                                />
                                <label htmlFor="es_propiedad_intelectual" className="text-xs font-medium text-gray-300 select-none">
                                    ¿Es Propiedad Intelectual Registrada (SENADI)?
                                </label>
                            </div>
                            
                            {newProduct.es_propiedad_intelectual && (
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#222] animate-in fade-in duration-200">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Número de Registro</label>
                                        <input 
                                            type="text"
                                            placeholder="Ej: SENADI-2026-0045"
                                            value={newProduct.numero_registro}
                                            onChange={(e) => setNewProduct({ ...newProduct, numero_registro: e.target.value })}
                                            className="w-full bg-[#111] border border-[#333] rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fecha de Registro</label>
                                        <input 
                                            type="date"
                                            value={newProduct.fecha_registro_senadi}
                                            onChange={(e) => setNewProduct({ ...newProduct, fecha_registro_senadi: e.target.value })}
                                            className="w-full bg-[#111] border border-[#333] rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex justify-end gap-3 pt-4 border-t border-[#222]">
                                <button 
                                    type="button" 
                                    onClick={() => setShowProductModal(false)}
                                    className="px-4 py-2 border border-[#333] hover:bg-[#222] hover:text-white text-gray-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-blue-500/10"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectWorkspace;
