import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, FileText, CheckCircle2, Circle, UploadCloud, FileSignature, Settings, CheckSquare, BarChart, ArrowLeft, BookOpen, Trash2, ExternalLink } from 'lucide-react';
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
