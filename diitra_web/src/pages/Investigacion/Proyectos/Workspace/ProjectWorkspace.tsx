// ══════════════════════════════════════════════════════════════════════════════
// DIITRA ARCHITECTURE NOTE: DIRECTRIZ DE EXTENSIBILIDAD DE TRABAJO (DECISIÓN DE DISEÑO)
// ══════════════════════════════════════════════════════════════════════════════
//
// 1. ESTABILIDAD DEL WORKSPACE CORE:
//    - Este componente (ProjectWorkspace) es estable y resuelve las transiciones y carga de equipo.
//    - DECISIÓN: NO realizar refactorizaciones masivas ni fragmentaciones forzadas aquí.
//
// 2. ESTRATEGIA DE EXTENSIÓN POR MÓDULOS SATÉLITE (DESACOPLADO):
//    - Todo nuevo módulo del CACES/SENESCYT (ej: Rúbricas detalladas, Actas de Ética, Monitoreo Financiero)
//      debe crearse como una vista o página AUTOCONTENIDA en rutas independientes de navegación.
//    - El Workspace Core se comunicará con ellos únicamente mediante vínculos de navegación simples
//      o consumiendo resultados consolidados en la base de datos (ej: puntajes finales, estados).
//
// 3. PERSISTENCIA FLEXIBLE ORIENTADA A METADATOS (METADATA-DRIVEN):
//    - Si el CACES añade o cambia un campo en el formulario de un documento, NO crees columnas SQL.
//    - El sistema está diseñado para que estos campos vivan dinámicamente en el JSON de metadatos 
//      (MetadataCacesJson y ydoc reactivos) y se rendericen automáticamente vía plantillas.
//
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, FileText, CheckCircle2, Circle, UploadCloud, FileSignature, Settings, CheckSquare, BarChart, ArrowLeft, BookOpen, Trash2, ExternalLink, Users, UserPlus, Search, Plus, Sparkles, AlertCircle, RefreshCw, History, Activity, Shield } from 'lucide-react';
import api from '../../../../api/axios_config';
import { useAuth } from '../../../../api/AuthContext';
import DocumentEditor from '../Wizard/DocumentEditor';


const WorkflowPhases = [
    { id: 'Borrador', label: 'Formulación', icon: FileText },
    { id: 'En Revisión', label: 'Evaluación Pares', icon: CheckCircle2 },
    { id: 'Aprobado', label: 'Aprobación Legal', icon: FileSignature },
    { id: 'En Ejecución', label: 'Ejecución y Avance', icon: Settings },
];

const ESTADO_CONFIG: Record<string, { badge: string; dot: string }> = {
    'Borrador':     { badge: 'badge-vercel-neutral', dot: 'dot-neutral' },
    'Enviado':      { badge: 'badge-vercel-info',    dot: 'dot-info' },
    'En Revisión':  { badge: 'badge-vercel-warning', dot: 'dot-warning dot-pulse' },
    'Aprobado':     { badge: 'badge-vercel-success', dot: 'dot-success' },
    'En Ejecución': { badge: 'badge-vercel-violet',  dot: 'dot-brand dot-pulse' },
    'Finalizado':   { badge: 'badge-vercel-success', dot: 'dot-success' },
    'Rechazado':    { badge: 'badge-vercel-error',   dot: 'dot-error' },
};

const estadoConfig = (estado: string) =>
    ESTADO_CONFIG[estado] ?? { badge: 'badge-vercel-neutral', dot: 'dot-neutral' };

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
    
    const [newProduct, setNewProduct] = useState({
        id_tipo_producto: 1,
        titulo: '',
        cantidad: 1,
        url_producto: '',
        es_propiedad_intelectual: false,
        numero_registro: '',
        fecha_registro_senadi: ''
    });

    const [investigadores, setInvestigadores] = useState<any[]>([]);
    const [tieneGrupo, setTieneGrupo] = useState<boolean>(false);
    const [isSavingTeam, setIsSavingTeam] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [teamMessage, setTeamMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferDirector, setTransferDirector] = useState<any>(null);
    const [newDirectorCedula, setNewDirectorCedula] = useState('');
    const [transferMotivo, setTransferMotivo] = useState('Reasignación institucional');
    const [transferDescripcion, setTransferDescripcion] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferSearchQuery, setTransferSearchQuery] = useState('');
    const [transferSearchResults, setTransferSearchResults] = useState<any[]>([]);
    const [isTransferSearching, setIsTransferSearching] = useState(false);
    const [showTransferSearchResults, setShowTransferSearchResults] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [resolvedProjectUuid, setResolvedProjectUuid] = useState<string | null>(null);
    const [subDocumentUuids, setSubDocumentUuids] = useState<Record<string, string>>({});
    const [resolvingDocument, setResolvingDocument] = useState<string | null>(null);

    useEffect(() => {
        const resolveUuid = async () => {
            if (!documentUuid) return;
            
            if (templateCode && templateCode !== 'PROTOCOLO_INVESTIGACION') {
                try {
                    const instanceRes = await api.get(`/documents/instances/${documentUuid}`);
                    const entityUuid = instanceRes.data?.entity_uuid || instanceRes.data?.entityUuid;
                    if (entityUuid) {
                        setResolvedProjectUuid(entityUuid);
                    } else {
                        console.error("[DIITRA] EntityUuid no encontrado en la instancia del documento", instanceRes.data);
                        setResolvedProjectUuid(documentUuid);
                    }
                } catch (err) {
                    console.error("[DIITRA] Error al resolver el UUID del proyecto", err);
                    setResolvedProjectUuid(documentUuid);
                }
            } else {
                setResolvedProjectUuid(documentUuid);
            }
        };

        resolveUuid();
    }, [documentUuid, templateCode]);

    const fetchProducts = async (pUuid?: string) => {
        const uuidToUse = pUuid || resolvedProjectUuid;
        if (!uuidToUse) return;

        let retries = 3;
        let success = false;
        let res: any = null;
        while (retries > 0 && !success) {
            try {
                res = await api.get(`/ResearchProducts/project/${uuidToUse}`);
                success = true;
            } catch (err: any) {
                retries--;
                if (err?.response?.status === 404 && retries > 0) {
                    console.warn(`[DIITRA] Productos no encontrados (404), reintentando en 1s... (${retries} intentos restantes)`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    retries = 0;
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
        if (resolvedProjectUuid) {
            fetchProducts(resolvedProjectUuid);
            fetchProductTypes();
        }
    }, [resolvedProjectUuid]);

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resolvedProjectUuid) return;
        try {
            await api.post('/ResearchProducts', {
                projectUuid: resolvedProjectUuid,
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
            fetchProducts(resolvedProjectUuid);
        } catch (err) {
            console.error("[DIITRA] Error al crear producto", err);
            alert("Error al registrar el producto");
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!window.confirm("¿Está seguro de eliminar este producto de investigación?")) return;
        try {
            await api.delete(`/ResearchProducts/${id}`);
            fetchProducts(resolvedProjectUuid || undefined);
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
            if (!resolvedProjectUuid) return;
            
            let retries = 3;
            let success = false;
            let res: any = null;
            while (retries > 0 && !success) {
                try {
                    res = await api.get(`/projects/${resolvedProjectUuid}/detail`);
                    success = true;
                } catch (e: any) {
                    retries--;
                    if (e?.response?.status === 404 && retries > 0) {
                        console.warn(`[DIITRA] Detalle de proyecto no encontrado (404), reintentando en 1s... (${retries} intentos restantes)`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else {
                        retries = 0;
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
                    linea: res.data.linea_investigacion || 'No definida',
                    puedeEditar: (res.data.puede_editar ?? res.data.puedeEditar ?? res.data.PuedeEditar ?? true) &&
                                 (res.data.estado === 'Borrador' || res.data.estado === 'En Corrección'),
                    puntajeEvaluacion: res.data.puntajeEvaluacion ?? res.data.PuntajeEvaluacion ?? null
                });
                setInvestigadores(res.data.investigadores || []);
                setTieneGrupo(res.data.tieneGrupoInvestigacion || false);
            } else {
                setCurrentProject({
                    id: resolvedProjectUuid?.substring(0,8).toUpperCase() || 'NEW',
                    uuid: resolvedProjectUuid || '',
                    title: 'Nuevo Proyecto de Investigación',
                    status: 'Borrador',
                    presupuesto: 0,
                    linea: 'No definida',
                    puedeEditar: true
                });
                setInvestigadores([]);
                setTieneGrupo(false);
            }
            setIsLoading(false);
        };
        
        fetchProject();
    }, [resolvedProjectUuid]);

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

    useEffect(() => {
        if (!transferSearchQuery.trim()) {
            setTransferSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(async () => {
            setIsTransferSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(transferSearchQuery)}`);
                setTransferSearchResults(res.data || []);
                setShowTransferSearchResults(true);
            } catch (err) {
                console.error("[DIITRA] Error al buscar directores", err);
            } finally {
                setIsTransferSearching(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [transferSearchQuery]);

    const handleOpenTransferModal = (director: any) => {
        setTransferDirector(director);
        setNewDirectorCedula('');
        setTransferSearchQuery('');
        setTransferMotivo('Reasignación institucional');
        setTransferDescripcion('');
        setShowTransferModal(true);
    };

    const handleConfirmTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDirectorCedula) {
            alert("Por favor selecciona un nuevo director.");
            return;
        }
        setIsTransferring(true);
        try {
            const res = await api.post(`/projects/${currentProject.uuid}/transfer-director`, {
                nuevoDirectorCedula: newDirectorCedula,
                motivo: transferMotivo,
                descripcion: transferDescripcion
            });
            if (res.data.success) {
                setTeamMessage({ type: 'success', text: '¡Transferencia de dirección realizada con éxito!' });
                setShowTransferModal(false);
                const updatedProjectRes = await api.get(`/projects/${currentProject.uuid}/detail`);
                setInvestigadores(updatedProjectRes.data.investigadores || []);
                setTieneGrupo(updatedProjectRes.data.tieneGrupoInvestigacion || false);
                setCurrentProject((prev: any) => ({
                    ...prev,
                    tieneGrupoInvestigacion: updatedProjectRes.data.tieneGrupoInvestigacion
                }));
                setTimeout(() => setTeamMessage(null), 5000);
            } else {
                alert(res.data.message || "Error al realizar la transferencia.");
            }
        } catch (err: any) {
            console.error("[DIITRA] Error en transferencia de director", err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || "Error al realizar la transferencia.";
            alert(errMsg);
        } finally {
            setIsTransferring(false);
        }
    };

    if (isLoading || !resolvedProjectUuid) {
        return (
            <div className="flex-1 bg-bg-deep flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-t-2 border-brand rounded-full"></div>
                    <p className="text-[10px] font-bold text-text-dim uppercase tracking-[0.3em]">Cargando Workspace...</p>
                </div>
            </div>
        );
    }

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

    const handleUpdateMember = (cedula: string, field: string, value: any) => {
        setInvestigadores(prev => prev.map(inv => inv.cedula === cedula ? { ...inv, [field]: value } : inv));
    };

    const handleRemoveMember = (cedula: string) => {
        setInvestigadores(prev => prev.filter(inv => inv.cedula !== cedula));
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
                setCurrentProject((prev: any) => ({ ...prev, tieneGrupoInvestigacion: isGroup }));
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

    const resolveDocumentInstance = async (docTemplateCode: string) => {
        if (subDocumentUuids[docTemplateCode]) {
            setActiveDocument(docTemplateCode);
            return;
        }
        if (!resolvedProjectUuid) return;
        setResolvingDocument(docTemplateCode);
        try {
            const res = await api.get('/documents/instances/resolve', {
                params: {
                    templateCode: docTemplateCode,
                    entityUuid: resolvedProjectUuid,
                    title: `${docTemplateCode === 'RUBRICA_EVALUACION' ? 'Rúbrica de Evaluación' : docTemplateCode === 'INFORME_AVANCE' ? 'Informe de Avance' : docTemplateCode} — ${currentProject?.title || ''}`
                }
            });
            const instanceUuid = res.data?.uuid || res.data?.Uuid;
            if (instanceUuid) {
                setSubDocumentUuids(prev => ({ ...prev, [docTemplateCode]: instanceUuid }));
                setActiveDocument(docTemplateCode);
            }
        } catch (err) {
            console.error(`[DIITRA] Error al resolver instancia de documento ${docTemplateCode}:`, err);
            alert(`No se pudo abrir el documento. Inténtelo de nuevo.`);
        } finally {
            setResolvingDocument(null);
        }
    };

    if (activeDocument) {
        const editorUuid = activeDocument === templateCode
            ? documentUuid
            : subDocumentUuids[activeDocument];

        if (activeDocument !== templateCode && !editorUuid) {
            return (
                <div className="flex-1 bg-bg-deep flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin h-8 w-8 border-t-2 border-brand rounded-full"></div>
                        <p className="text-[10px] font-bold text-text-dim uppercase tracking-[0.3em]">Resolviendo documento...</p>
                    </div>
                </div>
            );
        }

        const isMainProtocol = activeDocument === templateCode;
        const isNotEditableState = currentProject.status !== 'Borrador' && currentProject.status !== 'En Corrección';
        
        // El protocolo principal se rige por puedeEditar.
        // La rúbrica de evaluación en este workspace es de sólo lectura para el investigador.
        // El informe de avance es editable a menos que el proyecto esté completamente finalizado.
        const isReadOnly = isMainProtocol
            ? !currentProject.puedeEditar
            : (activeDocument === 'RUBRICA_EVALUACION' ? true : currentProject.status === 'Finalizado');

        const readOnlyReason = isMainProtocol
            ? (isNotEditableState ? 'state' : 'membership')
            : (activeDocument === 'RUBRICA_EVALUACION' ? 'review' : 'state');

        return (
            <DocumentEditor 
                templateCode={activeDocument} 
                initialData={{ Uuid: editorUuid }}
                entityUuid={activeDocument === templateCode ? resolvedProjectUuid || undefined : resolvedProjectUuid || undefined}
                onClose={handleCloseEditor} 
                readOnly={isReadOnly}
                readOnlyReason={readOnlyReason}
                projectStatus={currentProject.status}
            />
        );
    }

    return (
        <div className="flex-1 bg-bg-deep overflow-y-auto selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
            {/* ── Header Único Responsivo ── */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-10 py-4 bg-bg-deep border-b border-border-thin sticky top-0 z-50 gap-4 sm:gap-0">
                <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/investigacion')} className="p-2.5 rounded-xl bg-surface border border-border-thin hover:border-text-main text-text-dim hover:text-text-main transition-all">
                            <ArrowLeft size={14} />
                        </button>
                        <div className="h-4 w-[1px] bg-border-thin" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-surface border border-border-thin flex items-center justify-center text-[10px] font-bold text-text-main uppercase">
                                DI
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-dim uppercase tracking-[0.3em]">
                                    <Activity size={10} strokeWidth={2} className="text-brand" />
                                    <span>Workspace · ISTPET</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-text-dim">
                                    <span>diitra</span>
                                    <ChevronRight size={10} />
                                    <span className="text-text-main font-mono">{currentProject.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Badge de estado en dispositivos móviles */}
                    <div className="sm:hidden">
                        <span className={`badge-vercel ${estadoConfig(currentProject.status).badge} text-[9px] font-bold`}>
                            <span className={`dot ${estadoConfig(currentProject.status).dot}`} />
                            {currentProject.status}
                        </span>
                    </div>
                </div>
                
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto justify-end">
                    {/* Badge de estado en pantallas medianas y grandes */}
                    <div className="hidden sm:block mr-1">
                        <span className={`badge-vercel ${estadoConfig(currentProject.status).badge} text-[9px] font-bold`}>
                            <span className={`dot ${estadoConfig(currentProject.status).dot}`} />
                            {currentProject.status}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
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
                            className="btn-vercel-secondary !py-2 text-xs flex-1 sm:flex-none justify-center"
                        >
                            <FileText size={14} />
                            <span>Exportar CACES</span>
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
                            className={`btn-vercel-primary !py-2 text-xs flex-1 sm:flex-none justify-center ${isPublishingDSpace ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <UploadCloud size={14} className={isPublishingDSpace ? "animate-pulse" : ""} />
                            <span>{isPublishingDSpace ? 'Publicando...' : 'DSpace'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="max-w-[1600px] mx-auto p-4 md:p-10 animate-fade-up">
                {/* ── Page Title (DashboardHeader pattern) ── */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 px-2 gap-6 md:gap-0">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                            <span className={`badge-vercel ${estadoConfig(currentProject.status).badge} text-[9px]`}>
                                <span className={`dot ${estadoConfig(currentProject.status).dot}`} />
                                {currentProject.status}
                            </span>
                            <span className="text-text-dim">·</span>
                            <span className="text-text-dim font-mono">{currentProject.uuid.split('-')[0]}</span>
                            <span className="text-text-dim">·</span>
                            <span className="text-text-dim">{user?.role || 'Investigador'}</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-bold text-text-main tracking-tighter">{currentProject.title}</h2>
                        <p className="text-sm text-text-dim max-w-lg font-medium">Gestión del ciclo de vida institucional del proyecto de investigación.</p>
                    </div>
                </header>

                <div className="px-2 grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2 flex flex-col gap-3">
                        {/* ── Flujo Institucional CACES ── */}
                        <div className="bento-card p-6 flex flex-col justify-between group">
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <Settings size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                                <h3 className="text-xs font-bold tracking-widest text-text-main uppercase opacity-90">Flujo Institucional CACES</h3>
                            </div>
                            <div className="mt-4 space-y-0">
                                {WorkflowPhases.map((phase, idx) => {
                                    const currentIdx = getPhaseIndex(currentProject.status);
                                    const isCurrent = currentIdx === idx;
                                    const isPast = currentIdx > idx;
                                    
                                    return (
                                        <div key={phase.id} className={`p-4 border-b border-border-thin last:border-b-0 flex items-start gap-3 transition-all duration-300 ${isCurrent ? 'bg-surface-hover border-l-2 border-l-brand' : ''}`}>
                                            <div className={`mt-0.5 transition-colors duration-300 ${isCurrent ? 'text-brand' : isPast ? 'text-success' : 'text-text-dim'}`}>
                                                {isPast ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`text-xs font-bold tracking-wider uppercase ${isCurrent ? 'text-text-main' : 'text-text-dim'}`}>{phase.label}</h3>
                                                <p className="text-[11px] text-text-dim mt-1 leading-relaxed">
                                                    {phase.id === 'Borrador' && 'Construcción colaborativa del protocolo de investigación por parte del equipo.'}
                                                    {phase.id === 'En Revisión' && 'Revisión técnica doble ciego por pares evaluadores asignados por el Director.'}
                                                    {phase.id === 'Aprobado' && 'Validación final del consejo académico y firma electrónica de actas formales.'}
                                                    {phase.id === 'En Ejecución' && 'Seguimiento de hitos, envío de informes de avance y ejecución presupuestaria.'}
                                                </p>
                                                
                                                {phase.id === 'Borrador' && (
                                                    <div className="mt-4">
                                                        <button 
                                                            onClick={() => setActiveDocument(templateCode || 'PROTOCOLO_INVESTIGACION')}
                                                            className="btn-vercel-secondary !py-2"
                                                        >
                                                            <FileText size={14} />
                                                            <span>{(currentProject.puedeEditar === false || isPast) ? 'Ver Protocolo' : 'Editar Protocolo'}</span>
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {phase.id === 'En Revisión' && (isCurrent || isPast) && (
                                                    <div className="mt-4 animate-fade-in flex flex-wrap items-center gap-3">
                                                        <button 
                                                            onClick={() => resolveDocumentInstance('RUBRICA_EVALUACION')}
                                                            disabled={resolvingDocument === 'RUBRICA_EVALUACION'}
                                                            className="btn-vercel-primary !py-2"
                                                        >
                                                            {resolvingDocument === 'RUBRICA_EVALUACION' ? (
                                                                <><div className="animate-spin h-3 w-3 border-t-2 border-bg-deep rounded-full" /> Cargando...</>
                                                            ) : (
                                                                <><CheckSquare size={14} /><span>{isPast ? 'Ver Rúbrica' : 'Llenar Rúbrica'}</span></>
                                                            )}
                                                        </button>

                                                        {currentProject.puntajeEvaluacion !== null && (
                                                            <div className="badge-vercel badge-vercel-success !text-[11px] !py-2 flex items-center gap-1.5 font-bold animate-fade-in">
                                                                <span>Puntaje: {currentProject.puntajeEvaluacion}/100</span>
                                                                <span className="text-text-dim">|</span>
                                                                <span className="text-[10px] uppercase font-mono">{currentProject.puntajeEvaluacion >= 70 ? 'Aprobado' : 'Rechazado'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {phase.id === 'En Ejecución' && (isCurrent || isPast) && (
                                                    <div className="mt-4 animate-fade-in flex flex-wrap gap-3">
                                                        <button 
                                                            onClick={() => resolveDocumentInstance('INFORME_AVANCE')}
                                                            disabled={resolvingDocument === 'INFORME_AVANCE'}
                                                            className="btn-vercel-primary !py-2"
                                                        >
                                                            <BarChart size={14} />
                                                            <span>Generar Informe</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => navigate(`/investigacion/monitoreo/${currentProject.uuid}`)}
                                                            className="btn-vercel-secondary !py-2"
                                                        >
                                                            <Activity size={14} className="text-brand animate-pulse" />
                                                            <span>Ver Monitoreo Financiero</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Equipo de Trabajo ── */}
                        <div className="bento-card p-6 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <Users size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                                    <h3 className="text-xs font-bold tracking-widest text-text-main uppercase opacity-90">Equipo de Trabajo</h3>
                                </div>
                                <p className="text-xs text-text-dim font-normal leading-relaxed">Gestión dinámica del talento humano del proyecto</p>
                            </div>

                            <div className="mt-6 space-y-4">
                                {/* Toggle Individual / Grupo */}
                                <div className="flex bg-surface-hover p-1 rounded-md border border-border-thin">
                                    <button 
                                        type="button"
                                        disabled={currentProject.puedeEditar === false}
                                        onClick={() => handleToggleTieneGrupo(false)}
                                        className={`flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all duration-300 ${currentProject.puedeEditar === false ? 'opacity-50 cursor-not-allowed' : ''} ${!tieneGrupo ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:text-text-main'}`}
                                    >
                                        Individual
                                    </button>
                                    <button 
                                        type="button"
                                        disabled={currentProject.puedeEditar === false}
                                        onClick={() => handleToggleTieneGrupo(true)}
                                        className={`flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all duration-300 ${currentProject.puedeEditar === false ? 'opacity-50 cursor-not-allowed' : ''} ${tieneGrupo ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:text-text-main'}`}
                                    >
                                        Grupo
                                    </button>
                                </div>

                                {/* Banner Informativo */}
                                {!tieneGrupo ? (
                                    <div className="badge-vercel badge-vercel-warning !rounded-md !p-3 !text-[11px] !font-normal !leading-relaxed w-full flex gap-2 items-start">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span><span className="font-bold">Individual:</span> Solo el Director ejecuta el proyecto. Cambia a Grupo para agregar colaboradores.</span>
                                    </div>
                                ) : (
                                    <div className="badge-vercel badge-vercel-info !rounded-md !p-3 !text-[11px] !font-normal !leading-relaxed w-full flex gap-2 items-start">
                                        <Sparkles size={14} className="shrink-0 mt-0.5" />
                                        <span><span className="font-bold">Grupo:</span> Usa el buscador para invitar docentes y estudiantes al equipo.</span>
                                    </div>
                                )}

                                {/* Buscador */}
                                {tieneGrupo && currentProject.puedeEditar !== false && (
                                    <div className="relative space-y-1.5">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Agregar Miembros</label>
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                            <input 
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onFocus={() => setShowResults(true)}
                                                placeholder="Buscar por nombre o cédula..."
                                                className="input-vercel !text-xs !py-3 !pl-9"
                                            />
                                            {isSearching && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="animate-spin h-3 w-3 border-2 border-t-transparent border-brand rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                        {showResults && searchQuery.trim() && (
                                            <>
                                                <div className="fixed inset-0 z-20" onClick={() => setShowResults(false)}></div>
                                                <div className="absolute left-0 right-0 top-full mt-1 bg-bg-deep border border-border-thin rounded-lg shadow-2xl max-h-48 overflow-y-auto z-30">
                                                    {searchResults.length === 0 ? (
                                                        <div className="p-4 text-center text-[10px] text-text-dim font-mono uppercase tracking-wider">Sin resultados</div>
                                                    ) : (
                                                        searchResults.map((su: any) => (
                                                            <button 
                                                                key={su.cedula}
                                                                type="button"
                                                                onClick={() => handleAddMember(su)}
                                                                className="w-full p-3 flex items-center justify-between hover:bg-surface text-left text-xs transition-colors border-b border-border-thin last:border-b-0"
                                                            >
                                                                <div>
                                                                    <p className="font-bold text-text-main text-xs">{su.nombre}</p>
                                                                    <p className="text-text-dim font-mono text-[10px]">C.I. {su.cedula}</p>
                                                                </div>
                                                                <span className={`badge-vercel text-[8px] font-bold ${
                                                                    su.tipo === 'profesor' ? 'badge-vercel-info' : 'badge-vercel-success'
                                                                }`}>
                                                                    {su.tipo === 'profesor' ? 'Docente' : 'Estudiante'}
                                                                </span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Modo Solo Lectura Banner */}
                                {currentProject.puedeEditar === false && (
                                    <div className="badge-vercel badge-vercel-warning !rounded-xl !p-4 !text-[11px] !font-normal flex gap-2.5 leading-relaxed animate-fade-in mb-4 w-full items-start">
                                        <Shield size={14} className="shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold uppercase tracking-wider text-[10px] block">Modo Sólo Lectura</span>
                                            <span className="text-text-dim">No tienes permisos para modificar el equipo de investigadores o transferir la dirección del proyecto.</span>
                                        </div>
                                    </div>
                                )}

                                {/* Lista de Integrantes */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                                        Activos ({investigadores.filter((m: any) => m.activo !== false).length})
                                    </label>
                                    
                                    {investigadores.filter((member: any) => member.activo !== false).length === 0 ? (
                                        <div className="p-4 rounded-md border border-dashed border-border-thin text-center text-[10px] text-text-dim uppercase tracking-wider">
                                            Sin investigadores activos
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {investigadores.filter((member: any) => member.activo !== false).map((member: any, idx: number) => {
                                                const isDirector = member.rol?.toLowerCase().includes('director');
                                                const isEstudiante = member.rol?.toLowerCase().includes('estudiante') || member.nivelAcademico === 'Pregrado';
                                                
                                                return (
                                                    <div 
                                                        key={member.cedula || idx} 
                                                        className="p-3 rounded-md bg-bg-deep border border-border-thin hover:border-text-dim transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border uppercase ${
                                                                isDirector 
                                                                    ? 'icon-circle-brand !p-0 !w-8 !h-8 border border-brand/30' 
                                                                    : isEstudiante 
                                                                        ? 'icon-circle-success !p-0 !w-8 !h-8' 
                                                                        : 'bg-surface border-border-thin text-text-dim'
                                                            }`}>
                                                                {member.nombre ? member.nombre.substring(0, 2) : 'IN'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-text-main">{member.nombre}</span>
                                                                    {isDirector && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="badge-vercel badge-vercel-info text-[8px] font-bold">
                                                                                Director
                                                                            </span>
                                                                            {currentProject.puedeEditar !== false && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleOpenTransferModal(member)}
                                                                                    className="badge-vercel badge-vercel-violet text-[8px] font-bold hover:opacity-80 transition-all cursor-pointer"
                                                                                    title="Transferir Dirección"
                                                                                >
                                                                                    <RefreshCw size={9} className="inline" /> Relevo
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-text-dim font-mono mt-0.5 flex items-center gap-x-2">
                                                                    <span>C.I. {member.cedula || 'N/A'}</span>
                                                                    <span>·</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <span>Tel:</span>
                                                                        <input 
                                                                            type="text" 
                                                                            value={member.telefono || ''} 
                                                                            disabled={currentProject.puedeEditar === false}
                                                                            onChange={(e) => handleUpdateMember(member.cedula, 'telefono', e.target.value)}
                                                                            placeholder={currentProject.puedeEditar === false ? "No asignado" : "Añadir..."} 
                                                                            className="bg-transparent text-text-dim placeholder:text-text-dim outline-none border-b border-border-thin hover:border-text-dim focus:border-text-main w-20 inline-block px-0.5 py-0 text-[10px] transition-colors" 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap sm:flex-nowrap items-end sm:items-center gap-3 w-full sm:w-auto">
                                                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                                                                <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Rol</span>
                                                                <select
                                                                    value={member.rol}
                                                                    disabled={currentProject.puedeEditar === false}
                                                                    onChange={(e) => handleUpdateMember(member.cedula, 'rol', e.target.value)}
                                                                    className="bg-surface border border-border-thin rounded p-1.5 text-[11px] text-text-dim outline-none focus:border-text-main transition-all w-full sm:w-40 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                >
                                                                    <option value="Director de Proyecto">Director</option>
                                                                    <option value="Co-Investigador (Docente)">Co-Investigador (Docente)</option>
                                                                    <option value="Co-Investigador (Estudiante)">Co-Investigador (Est.)</option>
                                                                    <option value="Técnico de Apoyo">Técnico de Apoyo</option>
                                                                </select>
                                                            </div>
                                                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                                                                <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Nivel</span>
                                                                <select
                                                                    value={member.nivelAcademico}
                                                                    disabled={currentProject.puedeEditar === false}
                                                                    onChange={(e) => handleUpdateMember(member.cedula, 'nivelAcademico', e.target.value)}
                                                                    className="bg-surface border border-border-thin rounded p-1.5 text-[11px] text-text-dim outline-none focus:border-text-main transition-all w-full sm:w-36 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                >
                                                                    <option value="Tercer Nivel">Tercer Nivel</option>
                                                                    <option value="Cuarto Nivel (Maestría)">Maestría</option>
                                                                    <option value="Cuarto Nivel (PhD)">PhD</option>
                                                                    <option value="Pregrado">Pregrado</option>
                                                                </select>
                                                            </div>
                                                            {currentProject.puedeEditar !== false && (!isDirector || tieneGrupo) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveMember(member.cedula)}
                                                                    className="p-1.5 text-text-dim hover:text-error hover:bg-error-subtle rounded transition-all sm:self-center self-end mb-1.5 sm:mb-0"
                                                                    title="Remover"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Historial de Ex-Integrantes */}
                                {investigadores.some((member: any) => member.activo === false) && (
                                    <div className="border-t border-border-thin pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                            className="w-full flex items-center justify-between text-[10px] font-bold text-text-dim uppercase tracking-wider hover:text-text-main transition-colors py-1 outline-none"
                                        >
                                            <div className="flex items-center gap-2">
                                                <History size={12} className="text-brand-light" />
                                                <span>Ex-Integrantes ({investigadores.filter((m: any) => m.activo === false).length})</span>
                                            </div>
                                            <span className="font-mono text-[10px]">{isHistoryExpanded ? '▲' : '▼'}</span>
                                        </button>
                                        {isHistoryExpanded && (
                                            <div className="mt-3 space-y-2 animate-fade-in">
                                                {investigadores.filter((member: any) => member.activo === false).map((member: any, idx: number) => {
                                                    const isExDirector = member.rol?.toLowerCase().includes('director');
                                                    return (
                                                        <div key={member.cedula || idx} className="p-3 rounded-md bg-bg-deep border border-border-thin/50 flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold border uppercase ${isExDirector ? 'icon-circle-brand !p-0 !w-7 !h-7' : 'bg-surface border-border-thin text-text-dim'}`}>
                                                                    {member.nombre ? member.nombre.substring(0, 2) : 'EX'}
                                                                </div>
                                                                <div>
                                                                    <span className="text-[11px] font-bold text-text-main">{member.nombre}</span>
                                                                    <span className="text-[9px] text-text-dim font-mono ml-1.5">C.I. {member.cedula || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <span className="badge-vercel badge-vercel-error text-[9px] font-bold">
                                                                Baja
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Toast */}
                                {teamMessage && (
                                    <div className={`badge-vercel !rounded-md !p-3 !text-[11px] flex gap-2 items-center leading-relaxed animate-fade-in w-full ${
                                        teamMessage.type === 'success' 
                                            ? 'badge-vercel-success' 
                                            : 'badge-vercel-error'
                                    }`}>
                                        <CheckSquare size={14} className="shrink-0" />
                                        <span className="font-medium">{teamMessage.text}</span>
                                    </div>
                                )}

                                {/* Guardar equipo */}
                                {currentProject.puedeEditar !== false && (
                                    <div className="flex justify-end pt-4 border-t border-border-thin">
                                        <button
                                            type="button"
                                            disabled={isSavingTeam}
                                            onClick={handleSaveTeam}
                                            className={`btn-vercel-primary !py-2.5 ${isSavingTeam ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isSavingTeam ? (
                                                <>
                                                    <div className="animate-spin h-3 w-3 border-2 border-t-transparent border-text-dim rounded-full"></div>
                                                    <span>Guardando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={12} />
                                                    <span>Guardar Equipo</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Productos de Investigación ── */}
                        <div className="bento-card p-6 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <BookOpen size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                                    <h3 className="text-xs font-bold tracking-widest text-text-main uppercase opacity-90">Productos de Investigación</h3>
                                </div>
                            </div>
                            <div className="mt-4 flex-1">
                                {currentProject.puedeEditar !== false && (
                                    <div className="flex justify-end mb-4">
                                        <button 
                                            onClick={() => setShowProductModal(true)}
                                            className="btn-vercel-primary !py-2"
                                        >
                                            <Plus size={12} />
                                            <span>Registrar</span>
                                        </button>
                                    </div>
                                )}
                                
                                {products.length === 0 ? (
                                    <div className="p-8 text-center text-[10px] text-text-dim uppercase tracking-wider border border-dashed border-border-thin rounded-md font-mono">
                                        Sin productos registrados
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {products.map((prod: any) => (
                                            <div key={prod.id_producto} className="p-3 rounded-md bg-bg-deep border border-border-thin hover:border-text-dim transition-all group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="badge-vercel badge-vercel-info text-[8px] font-bold">
                                                        {prod.tipo_producto_nombre}
                                                    </span>
                                                    {currentProject.puedeEditar !== false && (
                                                        <button 
                                                            onClick={() => handleDeleteProduct(prod.id_producto)}
                                                            className="p-1 hover:bg-error-subtle hover:text-error text-text-dim rounded transition-all"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-text-main line-clamp-1">{prod.titulo}</p>
                                                <div className="text-[10px] text-text-dim font-mono mt-1">
                                                    {prod.url_producto && (
                                                        <a href={prod.url_producto} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-light hover:underline">
                                                            <ExternalLink size={9} /> {prod.url_producto.length > 25 ? prod.url_producto.substring(0, 25) + '...' : prod.url_producto}
                                                        </a>
                                                    )}
                                                    {prod.es_propiedad_intelectual && (
                                                        <span className="flex items-center gap-1 text-success">★ SENADI: {prod.numero_registro || 'En trámite'}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Sidebar (1 col) ── */}
                    <div className="flex flex-col gap-3">
                        {/* Firmas */}
                        <div className="bento-card p-6 flex flex-col justify-between group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
                            <div>
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <FileSignature size={16} className="text-brand group-hover:text-text-main transition-colors" />
                                    <h3 className="text-xs font-bold tracking-widest text-text-main uppercase opacity-90">Bóveda de Firmas</h3>
                                </div>
                                <p className="text-[10px] text-text-dim leading-relaxed mt-1">Sube tu archivo PAdES · Firma auditada permanentemente por DocumentEngine.</p>
                            </div>
                            <div className="mt-4">
                                <div className="p-3 rounded-md bg-bg-deep border border-border-thin flex items-center justify-between hover:border-text-dim transition-colors">
                                    <div>
                                        <p className="text-xs font-bold text-text-main">Director</p>
                                        <p className="text-[10px] text-warning mt-0.5 flex items-center gap-1">
                                            <span className="dot dot-warning dot-pulse"></span> Pendiente
                                        </p>
                                    </div>
                                    <button className="p-2 bg-surface border border-border-thin hover:border-text-main text-text-dim hover:text-text-main rounded-md transition-all">
                                        <UploadCloud size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="bento-card p-6 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <BarChart size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                                    <h3 className="text-xs font-bold tracking-widest text-text-main uppercase opacity-90">Metadata Normativa</h3>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2 text-[11px] font-mono">
                                <div className="flex justify-between p-2 rounded-md bg-bg-deep border border-border-thin">
                                    <span className="text-text-dim uppercase tracking-wider text-[10px]">Línea Inv.</span>
                                    <span className="text-text-dim">{currentProject.linea || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between p-2 rounded-md bg-bg-deep border border-border-thin">
                                    <span className="text-text-dim uppercase tracking-wider text-[10px]">Presupuesto</span>
                                    <span className="text-brand-light font-bold">${currentProject.presupuesto || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ══ Modal: Registrar Producto ══ */}
            {showProductModal && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-card animate-fade-up">
                        <div className="modal-header">
                            <div className="flex items-center gap-2">
                                <BookOpen size={16} className="text-brand" />
                                <h3 className="text-[10px] font-bold uppercase tracking-widest">Registrar Producto</h3>
                            </div>
                            <button onClick={() => setShowProductModal(false)} className="text-text-dim hover:text-text-main transition-colors text-sm">✕</button>
                        </div>
                        
                        <form onSubmit={handleCreateProduct} className="modal-body space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Tipo de Producto</label>
                                <select 
                                    value={newProduct.id_tipo_producto}
                                    onChange={(e) => setNewProduct({ ...newProduct, id_tipo_producto: Number(e.target.value) })}
                                    className="input-vercel !text-xs"
                                >
                                    {productTypes.map((type) => (
                                        <option key={type.id_tipo_producto} value={type.id_tipo_producto}>
                                            {type.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Título del Producto</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Ej: Análisis comparativo de algoritmos CNN..."
                                    value={newProduct.titulo}
                                    onChange={(e) => setNewProduct({ ...newProduct, titulo: e.target.value })}
                                    className="input-vercel !text-xs"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Cantidad</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        required
                                        value={newProduct.cantidad}
                                        onChange={(e) => setNewProduct({ ...newProduct, cantidad: Number(e.target.value) })}
                                        className="input-vercel !text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">URL / DOI</label>
                                    <input 
                                        type="text"
                                        placeholder="https://doi.org/..."
                                        value={newProduct.url_producto}
                                        onChange={(e) => setNewProduct({ ...newProduct, url_producto: e.target.value })}
                                        className="input-vercel !text-xs"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-1">
                                <input 
                                    type="checkbox"
                                    id="es_propiedad_intelectual"
                                    checked={newProduct.es_propiedad_intelectual}
                                    onChange={(e) => setNewProduct({ ...newProduct, es_propiedad_intelectual: e.target.checked })}
                                    className="w-4 h-4 rounded border-border-thin bg-surface text-brand accent-text-main"
                                />
                                <label htmlFor="es_propiedad_intelectual" className="text-xs text-text-dim select-none">Propiedad Intelectual (SENADI)</label>
                            </div>
                            
                            {newProduct.es_propiedad_intelectual && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-thin animate-fade-in">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">N. Registro</label>
                                        <input 
                                            type="text"
                                            placeholder="SENADI-2026-0045"
                                            value={newProduct.numero_registro}
                                            onChange={(e) => setNewProduct({ ...newProduct, numero_registro: e.target.value })}
                                            className="input-vercel !text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Fecha de Registro</label>
                                        <input 
                                            type="date"
                                            value={newProduct.fecha_registro_senadi}
                                            onChange={(e) => setNewProduct({ ...newProduct, fecha_registro_senadi: e.target.value })}
                                            className="input-vercel !text-xs"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="modal-footer !px-0 !pb-0 !border-0 !bg-transparent">
                                <button 
                                    type="button" 
                                    onClick={() => setShowProductModal(false)}
                                    className="btn-vercel-secondary !py-2"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-vercel-primary !py-2"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Modal: Transferencia de Dirección ══ */}
            {showTransferModal && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-card modal-card--lg animate-fade-up">
                        <div className="modal-header">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={16} className="text-brand-light" />
                                <h3 className="text-[10px] font-bold uppercase tracking-widest">Transferencia de Dirección</h3>
                            </div>
                            <button onClick={() => setShowTransferModal(false)} className="text-text-dim hover:text-text-main transition-colors text-sm">✕</button>
                        </div>

                        {transferDirector && (
                            <div className="mx-6 mt-4 badge-vercel badge-vercel-violet !rounded-md !p-3 !text-[11px] space-y-1">
                                <span className="font-semibold block uppercase tracking-wider text-[10px]">Director a Relevar:</span>
                                <p className="font-bold text-text-main text-xs">{transferDirector.nombre}</p>
                                <p className="text-text-dim font-mono text-[10px]">C.I. {transferDirector.cedula} | {transferDirector.rol}</p>
                            </div>
                        )}

                        <form onSubmit={handleConfirmTransfer} className="modal-body space-y-4">
                            <div className="relative space-y-1">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Buscar Nuevo Director</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                    <input 
                                        type="text"
                                        value={transferSearchQuery}
                                        onChange={(e) => setTransferSearchQuery(e.target.value)}
                                        onFocus={() => setShowTransferSearchResults(true)}
                                        placeholder="Buscar por nombre o cédula..."
                                        className="input-vercel !text-xs !py-3 !pl-9"
                                    />
                                    {isTransferSearching && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin h-3 w-3 border-2 border-t-transparent border-brand rounded-full"></div>
                                        </div>
                                    )}
                                </div>

                                {showTransferSearchResults && transferSearchQuery.trim() && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setShowTransferSearchResults(false)}></div>
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-bg-deep border border-border-thin rounded-lg shadow-2xl max-h-48 overflow-y-auto z-30">
                                            {transferSearchResults.length === 0 ? (
                                                <div className="p-4 text-center text-[10px] text-text-dim uppercase tracking-wider">Sin resultados</div>
                                            ) : (
                                                transferSearchResults.map((su: any) => (
                                                    <button 
                                                        key={su.cedula}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewDirectorCedula(su.cedula);
                                                            setTransferSearchQuery(su.nombre);
                                                            setShowTransferSearchResults(false);
                                                        }}
                                                        className="w-full p-3 flex items-center justify-between hover:bg-surface text-left text-xs transition-colors border-b border-border-thin last:border-b-0"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-text-main">{su.nombre}</p>
                                                            <p className="text-text-dim font-mono text-[10px]">C.I. {su.cedula}</p>
                                                        </div>
                                                        <span className={`badge-vercel text-[8px] font-bold ${su.tipo === 'profesor' ? 'badge-vercel-violet' : 'badge-vercel-success'}`}>
                                                            {su.tipo === 'profesor' ? 'Docente' : 'Estudiante'}
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {newDirectorCedula && (
                                <div className="badge-vercel badge-vercel-success !rounded-md !p-3 !text-[11px] flex justify-between items-center animate-fade-in w-full">
                                    <div>
                                        <span className="font-semibold block uppercase tracking-wider text-[10px]">Nuevo Director:</span>
                                        <p className="font-bold text-text-main text-xs">{transferSearchQuery}</p>
                                        <p className="text-text-dim font-mono text-[10px]">C.I. {newDirectorCedula}</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => { setNewDirectorCedula(''); setTransferSearchQuery(''); }}
                                        className="text-[10px] text-error hover:opacity-80 font-bold uppercase tracking-wider"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Motivo</label>
                                <select 
                                    value={transferMotivo}
                                    onChange={(e) => setTransferMotivo(e.target.value)}
                                    className="input-vercel !text-xs"
                                >
                                    <option value="Reasignación institucional">Reasignación institucional</option>
                                    <option value="Renuncia voluntaria">Renuncia voluntaria</option>
                                    <option value="Licencia o permiso de estudios">Licencia o permiso de estudios</option>
                                    <option value="Otro motivo administrativo">Otro motivo administrativo</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Justificación</label>
                                <textarea 
                                    rows={3}
                                    required
                                    placeholder="Describe el motivo del relevo institucional..."
                                    value={transferDescripcion}
                                    onChange={(e) => setTransferDescripcion(e.target.value)}
                                    className="input-vercel !text-xs resize-none"
                                />
                            </div>

                            <div className="modal-footer !px-0 !pb-0 !border-0 !bg-transparent">
                                <button 
                                    type="button" 
                                    onClick={() => setShowTransferModal(false)}
                                    className="btn-vercel-secondary !py-2"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isTransferring || !newDirectorCedula}
                                    className={`btn-vercel-primary !py-2 ${isTransferring || !newDirectorCedula ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isTransferring ? (
                                        <>
                                            <div className="animate-spin h-3 w-3 border-2 border-t-transparent border-text-dim rounded-full"></div>
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={12} />
                                            <span>Confirmar Relevo</span>
                                        </>
                                    )}
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