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
import { ChevronRight, FileText, CheckCircle2, UploadCloud, FileSignature, Settings, CheckSquare, BarChart, ArrowLeft, BookOpen, Trash2, ExternalLink, Users, UserPlus, Search, Plus, Sparkles, AlertCircle, RefreshCw, History, Activity, Shield } from 'lucide-react';
import api from '../../../../api/axios_config';
import { useAuth } from '../../../../api/AuthContext';
import { useNotifications } from '../../../../api/NotificationsContext';
import { useConfirm } from '../../../../api/ConfirmContext';
import { iniciarEjecucion } from '../../../../services/peerReviewService';
import DocumentEditor from '../Wizard/DocumentEditor';
import WorkspaceActivityPanel from './WorkspaceActivityPanel';
import { buildWorkspacePath, isLegacyTemplateUrlSegment, slugToTemplateCode } from '../../../../core/documents/templateUrl';


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

const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

export const ProjectWorkspace: React.FC = () => {
    const { documentUuid, templateCode: templateSlug } = useParams<{ documentUuid: string, templateCode: string }>();
    const templateCode = templateSlug ? slugToTemplateCode(templateSlug) : 'PROTOCOLO_INVESTIGACION';
    const { user, isAdmin, roles } = useAuth();
    const { addToast } = useNotifications();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const shouldEdit = queryParams.get('edit') === 'true';

    useEffect(() => {
        if (!templateSlug || !documentUuid || !isLegacyTemplateUrlSegment(templateSlug)) return;
        navigate(buildWorkspacePath(templateCode, documentUuid, location.search), { replace: true });
    }, [templateSlug, templateCode, documentUuid, location.search, navigate]);

    const [currentProject, setCurrentProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDocument, setActiveDocument] = useState<string | null>(() => {
        return shouldEdit ? templateCode : null;
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
    const [grupoInvestigacion, setGrupoInvestigacion] = useState<string>('');
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [isSyncingGroupMembers, setIsSyncingGroupMembers] = useState(false);
    const [isSavingTeam, setIsSavingTeam] = useState(false);
    const [teamMessage, setTeamMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [teamChangeRequests, setTeamChangeRequests] = useState<any[]>([]);
    const [isLoadingTeamChangeRequests, setIsLoadingTeamChangeRequests] = useState(false);
    const [isSubmittingTeamChangeRequest, setIsSubmittingTeamChangeRequest] = useState(false);
    const [teamChangeForm, setTeamChangeForm] = useState({
        tipo: 'ALTA',
        cedulaObjetivo: '',
        rolPropuesto: 'Co-Investigador (Docente)',
        motivo: '',
        resolucionReferencia: ''
    });

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
    const [iniciandoEjecucion, setIniciandoEjecucion] = useState(false);
    const [resolvedProjectUuid, setResolvedProjectUuid] = useState<string | null>(null);
    const [subDocumentUuids, setSubDocumentUuids] = useState<Record<string, string>>({});
    const [resolvingDocument, setResolvingDocument] = useState<string | null>(null);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [assignedRevisionUuid, setAssignedRevisionUuid] = useState<string | null>(null);
    const [assignedRevisionStatus, setAssignedRevisionStatus] = useState<string | null>(null);
    const approvedGroups = availableGroups.filter(g => g.activo && g.estado === 'Aprobado');
    const canReviewTeamChanges = isAdmin || roles?.includes('DIITRA_ADMIN') || roles?.includes('ADMIN_SISTEMA');

    useEffect(() => {
        const resolveUuid = async () => {
            if (!documentUuid) return;
            
            // Siempre intentamos resolver el EntityUuid real desde la instancia del documento,
            // ya que documentUuid en la URL suele ser el UUID de la instancia y no el del proyecto.
            try {
                const instanceRes = await api.get(`/documents/instances/${documentUuid}`);
                const entityUuid = instanceRes.data?.entity_uuid || instanceRes.data?.entityUuid || instanceRes.data?.EntityUuid;
                if (entityUuid) {
                    setResolvedProjectUuid(entityUuid);
                } else {
                    console.warn("[DIITRA] EntityUuid no encontrado en la instancia, usando fallback");
                    setResolvedProjectUuid(documentUuid);
                }
            } catch (err) {
                console.warn("[DIITRA] Fallback: No se pudo cargar la instancia, asumiendo documentUuid como proyecto", err);
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

    const fetchTeamChangeRequests = async (projectUuid?: string) => {
        const uuidToUse = projectUuid || currentProject?.uuid;
        if (!uuidToUse || !tieneGrupo) {
            setTeamChangeRequests([]);
            return;
        }
        setIsLoadingTeamChangeRequests(true);
        try {
            const res = await api.get(`/projects/${uuidToUse}/team-change-requests`);
            setTeamChangeRequests(res.data || []);
        } catch (err) {
            console.error("[DIITRA] Error al obtener solicitudes de cambio de equipo", err);
        } finally {
            setIsLoadingTeamChangeRequests(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setAvailableGroups(res.data || []);
        } catch (err) {
            console.error("[DIITRA] Error al cargar grupos de investigación", err);
        }
    };

    useEffect(() => {
        if (resolvedProjectUuid) {
            fetchProducts(resolvedProjectUuid);
            fetchProductTypes();
            fetchGroups();
        }
    }, [resolvedProjectUuid, activeDocument]);

    useEffect(() => {
        const checkPeerReviews = async () => {
            if (!resolvedProjectUuid || !user) return;
            try {
                const res = await api.get(`/PeerReviews/project/${resolvedProjectUuid}`);
                const data = res.data; // ArbitrajeProyectoDto
                
                // Buscar si el usuario actual es un revisor asignado
                const currentUserId = user.id_usuario;
                const userRevision = currentUserId
                    ? data.revisiones?.find((r: any) => 
                        (r.id_revisor ?? r.idRevisor ?? r.IdRevisor) === currentUserId
                      )
                    : null;
                
                if (userRevision) {
                    setAssignedRevisionUuid(userRevision.uuid ?? userRevision.Uuid);
                    setAssignedRevisionStatus(userRevision.estado ?? userRevision.Estado ?? null);
                }
            } catch (err) {
                console.warn("[DIITRA] No se pudieron cargar evaluaciones del proyecto o sin privilegios de visualización.", err);
            }
        };

        checkPeerReviews();
    }, [resolvedProjectUuid, user, activeDocument]);

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
            addToast("Producto Registrado", "Producto de investigación registrado con éxito.", "success");
        } catch (err) {
            console.error("[DIITRA] Error al crear producto", err);
            addToast("Error al Registrar", "Error al registrar el producto.", "error");
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!await confirm({
            title: "Eliminar Producto",
            message: "¿Está seguro de eliminar este producto de investigación?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;
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

    const handleIniciarEjecucion = async () => {
        const uuid = resolvedProjectUuid || currentProject?.uuid;
        if (!uuid) return;
        if (!await confirm({
            title: "Iniciar Ejecución",
            message: "¿Iniciar la fase de ejecución? Se habilitarán los informes de avance periódicos.",
            confirmText: "Iniciar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;
        setIniciandoEjecucion(true);
        try {
            await iniciarEjecucion(uuid);
            const res = await api.get(`/projects/${uuid}/detail`);
            setCurrentProject({
                ...currentProject,
                status: res.data.estado || 'En Ejecución',
                codigoInstitucional: res.data.codigo_institucional,
            });
            addToast("Inicio de Ejecución", "Se ha iniciado la fase de ejecución exitosamente.", "success");
        } catch (e: any) {
            addToast("Error al Iniciar Ejecución", e?.response?.data?.message ?? 'No se pudo iniciar la ejecución.', "error");
        } finally {
            setIniciandoEjecucion(false);
        }
    };

    useEffect(() => {
        const fetchProject = async () => {
            if (!resolvedProjectUuid) return;
            
            let retries = 3;
            let success = false;
            let res: any = null;
            let forbidden = false;
            let isNotFound = false;

            while (retries > 0 && !success) {
                try {
                    res = await api.get(`/projects/${resolvedProjectUuid}/detail`);
                    success = true;
                } catch (e: any) {
                    retries--;
                    if (e?.response?.status === 403 || e?.response?.status === 401) {
                        retries = 0;
                        forbidden = true;
                    } else if (e?.response?.status === 404) {
                        if (retries > 0) {
                            console.warn(`[DIITRA] Detalle de proyecto no encontrado (404), reintentando en 1s... (${retries} intentos restantes)`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } else {
                            isNotFound = true;
                        }
                    } else {
                        retries = 0;
                        console.error("[DIITRA] Error al cargar la instancia del proyecto", e);
                    }
                }
            }

            if (forbidden) {
                setIsUnauthorized(true);
                setIsLoading(false);
                return;
            }

            if (success && res) {
                setCurrentProject({
                    id: res.data.uuid.substring(0,8).toUpperCase(),
                    uuid: res.data.uuid,
                    title: res.data.titulo || 'Proyecto de Investigación (Sin Título)',
                    status: res.data.estado || 'Borrador',
                    presupuesto: res.data.costo_total || 0,
                    linea: res.data.linea_investigacion || 'No definida',
                    // FIX: fallback seguro — sin datos explícitos, denegamos edición (mínimo privilegio)
                    puedeEditar: (res.data.puede_editar ?? res.data.puedeEditar ?? res.data.PuedeEditar ?? false) &&
                                 (res.data.estado === 'Borrador' || res.data.estado === 'En Corrección'),
                    puedeSolicitarCambioEquipo: res.data.puedeSolicitarCambioEquipo ?? res.data.puede_solicitar_cambio_equipo ?? false,
                    puntajeEvaluacion: res.data.puntajeEvaluacion ?? res.data.PuntajeEvaluacion ?? null
                });
                setInvestigadores(res.data.investigadores || []);
                setTieneGrupo(res.data.tieneGrupoInvestigacion || false);
                setGrupoInvestigacion(res.data.grupoInvestigacionUuid || res.data.grupoInvestigacion || '');
                if (res.data.tieneGrupoInvestigacion) {
                    await fetchTeamChangeRequests(res.data.uuid);
                } else {
                    setTeamChangeRequests([]);
                }
            } else if (isNotFound) {
                // Solo permitimos el fallback si es un 404 real (creando nuevo borrador)
                setCurrentProject({
                    id: resolvedProjectUuid?.substring(0,8).toUpperCase() || 'NEW',
                    uuid: resolvedProjectUuid || '',
                    title: 'Nuevo Proyecto de Investigación',
                    status: 'Borrador',
                    presupuesto: 0,
                    linea: 'No definida',
                    puedeEditar: true,
                    puedeSolicitarCambioEquipo: false
                });
                setInvestigadores([]);
                setTieneGrupo(false);
                setGrupoInvestigacion('');
                setTeamChangeRequests([]);
            } else {
                // Ante cualquier otro error (500, Red, etc.), bloqueamos por Fail-Closed
                setIsUnauthorized(true);
            }
            setIsLoading(false);
        };
        
        fetchProject();
    }, [resolvedProjectUuid, activeDocument]);

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

    useEffect(() => {
        if (!grupoInvestigacion || approvedGroups.length === 0) return;

        const alreadyUuid = approvedGroups.some(g => g.uuid === grupoInvestigacion);
        if (alreadyUuid) return;

        const byLegacyName = approvedGroups.find(g => g.nombre === grupoInvestigacion || g.siglas === grupoInvestigacion);
        if (byLegacyName?.uuid) {
            setGrupoInvestigacion(byLegacyName.uuid);
        }
    }, [grupoInvestigacion, approvedGroups]);

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
            addToast("Validación de Relevo", "Por favor selecciona un nuevo director.", "warning");
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
                addToast("Transferencia Exitosa", "¡Transferencia de dirección realizada con éxito!", "success");
                setShowTransferModal(false);
                const updatedProjectRes = await api.get(`/projects/${currentProject.uuid}/detail`);
                setInvestigadores(updatedProjectRes.data.investigadores || []);
                setTieneGrupo(updatedProjectRes.data.tieneGrupoInvestigacion || false);
                setCurrentProject((prev: any) => ({
                    ...prev,
                    tieneGrupoInvestigacion: updatedProjectRes.data.tieneGrupoInvestigacion
                }));
            } else {
                addToast("Error de Transferencia", res.data.message || "Error al realizar la transferencia.", "error");
            }
        } catch (err: any) {
            console.error("[DIITRA] Error en transferencia de director", err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || "Error al realizar la transferencia.";
            addToast("Error de Transferencia", errMsg, "error");
        } finally {
            setIsTransferring(false);
        }
    };

    if (isLoading || !resolvedProjectUuid) {
        return (
            <div className="flex-1 bg-bg-deep flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-t-2 border-brand rounded-full"></div>
                    <p className="text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">Cargando proyecto...</p>
                </div>
            </div>
        );
    }

    if (isUnauthorized) {
        return (
            <div className="flex-1 bg-bg-deep flex items-center justify-center min-h-[60vh] p-6 text-center">
                <div className="bento-card static p-8 max-w-md w-full flex flex-col items-center gap-4">
                    <Shield size={48} className="text-error" />
                    <h3 className="text-sm font-semibold text-text-main uppercase tracking-widest">Acceso Restringido</h3>
                    <p className="text-xs text-text-dim leading-relaxed">
                        No tienes permisos para visualizar ni participar en este proyecto de investigación colaborativo.
                    </p>
                    <button onClick={() => navigate('/investigacion')} className="btn-vercel-primary text-xs w-full justify-center">
                        Volver a Proyectos
                    </button>
                </div>
            </div>
        );
    }

    const handleUpdateMember = (cedula: string, field: string, value: any) => {
        if (tieneGrupo) {
            addToast("Acción no permitida", "En proyectos asociativos la edición del equipo se realiza únicamente en /grupos.", "warning");
            return;
        }
        setInvestigadores(prev => prev.map(inv => inv.cedula === cedula ? { ...inv, [field]: value } : inv));
    };

    const handleRemoveMember = (cedula: string) => {
        if (tieneGrupo) {
            addToast("Acción no permitida", "No puedes remover integrantes de un grupo aprobado desde aquí. Hazlo en la sección de grupos.", "warning");
            return;
        }

        setInvestigadores(prev => prev.filter(inv => inv.cedula !== cedula));
    };

    const handleSyncGroupMembers = async () => {
        if (!grupoInvestigacion) {
            addToast("Sincronización", "Por favor seleccione un grupo de investigación adscrito primero.", "warning");
            return;
        }

        const selectedGroup = approvedGroups.find(g => g.uuid === grupoInvestigacion);
        if (!selectedGroup) {
            addToast("Sincronización", "Debe seleccionar un grupo aprobado y activo de la lista institucional.", "error");
            return;
        }

        setIsSyncingGroupMembers(true);
        try {
            const res = await api.get(`/groups/${selectedGroup.uuid}`);
            const groupDetail = res.data;
            const groupMembers = groupDetail.miembros || [];

            if (groupMembers.length === 0) {
                addToast("Sincronización", "El grupo seleccionado no tiene miembros activos registrados.", "warning");
                return;
            }

            let addedCount = 0;
            const updatedMembers = [...investigadores];

            groupMembers.forEach((m: any) => {
                const isActive = m.activo !== false;
                if (!isActive) return;
                
                const memberCedula = m.cedula?.trim();
                if (!memberCedula) return;

                const exists = updatedMembers.some(inv => inv.cedula?.trim() === memberCedula);
                if (!exists) {
                    const groupRol = m.rol || "";
                    let projectRol = "Co-Investigador (Docente)";
                    if (groupRol.toLowerCase().includes("coordinador") || groupRol.toLowerCase().includes("director")) {
                        const hasDirector = updatedMembers.some(inv => inv.rol?.toLowerCase().includes("director"));
                        projectRol = hasDirector ? "Co-Investigador (Docente)" : "Director de Proyecto";
                    } else if (groupRol.toLowerCase().includes("estudiante") || groupRol.toLowerCase().includes("alumno")) {
                        projectRol = "Co-Investigador (Estudiante)";
                    } else if (groupRol.toLowerCase().includes("tecnico") || groupRol.toLowerCase().includes("técnico")) {
                        projectRol = "Técnico de Apoyo";
                    }

                    updatedMembers.push({
                        nombre: m.nombre_completo || m.nombreCompleto || "Desconocido",
                        cedula: memberCedula,
                        rol: projectRol,
                        nivelAcademico: "Tercer Nivel",
                        telefono: "",
                        horasSemanales: 0,
                        horasDisponibles: 0,
                        horasAsignadas: 0,
                        carrera: m.carrera || ""
                    });
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                setInvestigadores(updatedMembers);
                addToast("Sincronización Exitosa", `Se han importado ${addedCount} miembros del grupo al equipo de trabajo.`, "success");
            } else {
                addToast("Sincronización", "Todos los miembros activos de este grupo ya forman parte del equipo.", "info");
            }
        } catch (err) {
            console.error("[DIITRA] Error al sincronizar miembros del grupo", err);
            addToast("Error de Sincronización", "No se pudieron obtener los miembros del grupo de investigación.", "error");
        } finally {
            setIsSyncingGroupMembers(false);
        }
    };

    const handleSaveTeam = async () => {
        setIsSavingTeam(true);
        setTeamMessage(null);
        try {
            if (tieneGrupo && !grupoInvestigacion) {
                addToast("Validación CACES", "Para proyectos asociativos debes seleccionar un grupo de investigación aprobado.", "warning");
                return;
            }

            const payload = investigadores.map(inv => ({
                nombre: inv.nombre,
                cedula: inv.cedula,
                rol: inv.rol,
                nivelAcademico: inv.nivelAcademico,
                telefono: inv.telefono || "",
                activo: inv.activo !== false,
                horasSemanales: inv.horasSemanales !== undefined && inv.horasSemanales !== null && inv.horasSemanales !== '' ? parseFloat(inv.horasSemanales) : null
            }));
            const res = await api.patch(`/projects/${currentProject.uuid}/team`, payload, {
                params: {
                    grupoInvestigacion: grupoInvestigacion || null,
                    tieneGrupoInvestigacion: tieneGrupo
                }
            });
            if (res.data.success) {
                addToast("Equipo de Trabajo", "¡Equipo de trabajo guardado y sincronizado con éxito!", "success");
                setCurrentProject((prev: any) => ({ ...prev, tieneGrupoInvestigacion: tieneGrupo, grupoInvestigacion: grupoInvestigacion }));

                const refreshed = await api.get(`/projects/${currentProject.uuid}/detail`);
                setInvestigadores(refreshed.data.investigadores || []);
                setTieneGrupo(refreshed.data.tieneGrupoInvestigacion || false);
                setGrupoInvestigacion(refreshed.data.grupoInvestigacionUuid || refreshed.data.grupoInvestigacion || '');
                setCurrentProject((prev: any) => ({
                    ...prev,
                    tieneGrupoInvestigacion: refreshed.data.tieneGrupoInvestigacion || false,
                    grupoInvestigacion: refreshed.data.grupoInvestigacion || null,
                    grupoInvestigacionUuid: refreshed.data.grupoInvestigacionUuid || null
                }));
                if (refreshed.data.tieneGrupoInvestigacion) {
                    await fetchTeamChangeRequests(currentProject.uuid);
                } else {
                    setTeamChangeRequests([]);
                }
            } else {
                addToast("Error al Guardar", res.data.message || 'Error al guardar los cambios.', "error");
            }
        } catch (err: any) {
            console.error("[DIITRA] Error al guardar equipo de trabajo", err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || 'Ocurrió un error inesperado al guardar.';
            addToast("Error al Guardar", errMsg, "error");
        } finally {
            setIsSavingTeam(false);
        }
    };

    const handleCreateTeamChangeRequest = async () => {
        if (!currentProject?.uuid || !tieneGrupo) return;
        if (!teamChangeForm.cedulaObjetivo.trim() || !teamChangeForm.motivo.trim()) {
            addToast("Solicitud incompleta", "Debes indicar cédula objetivo y motivo de la solicitud.", "warning");
            return;
        }

        setIsSubmittingTeamChangeRequest(true);
        try {
            const payload = {
                tipo: teamChangeForm.tipo,
                cedulaObjetivo: teamChangeForm.cedulaObjetivo.trim(),
                rolPropuesto: teamChangeForm.tipo === 'BAJA' ? null : teamChangeForm.rolPropuesto,
                motivo: teamChangeForm.motivo.trim(),
                resolucionReferencia: teamChangeForm.resolucionReferencia.trim() || null
            };
            const res = await api.post(`/projects/${currentProject.uuid}/team-change-requests`, payload);
            if (res.data?.success) {
                addToast("Solicitud registrada", "La solicitud de cambio quedó registrada para revisión.", "success");
                setTeamChangeForm({
                    tipo: 'ALTA',
                    cedulaObjetivo: '',
                    rolPropuesto: 'Co-Investigador (Docente)',
                    motivo: '',
                    resolucionReferencia: ''
                });
                await fetchTeamChangeRequests(currentProject.uuid);
            } else {
                addToast("No se pudo registrar", res.data?.message || "Error al registrar solicitud.", "error");
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'Error al registrar solicitud de cambio.';
            addToast("Error de Solicitud", errMsg, "error");
        } finally {
            setIsSubmittingTeamChangeRequest(false);
        }
    };

    const handleReviewTeamChangeRequest = async (requestUuid: string, aprobar: boolean) => {
        if (!currentProject?.uuid) return;
        try {
            const res = await api.patch(`/projects/${currentProject.uuid}/team-change-requests/${requestUuid}/review`, {
                aprobar,
                ejecutar: aprobar,
                observacionRevision: aprobar ? "Aprobado por autoridad competente." : "Rechazado por autoridad competente."
            });
            if (res.data?.success) {
                addToast("Revisión completada", res.data.message || "Solicitud procesada.", "success");
                await fetchTeamChangeRequests(currentProject.uuid);
                const refreshed = await api.get(`/projects/${currentProject.uuid}/detail`);
                setInvestigadores(refreshed.data.investigadores || []);
            } else {
                addToast("Error de revisión", res.data?.message || "No se pudo revisar la solicitud.", "error");
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "No se pudo revisar la solicitud.";
            addToast("Error de revisión", errMsg, "error");
        }
    };

    const handleToggleTieneGrupo = async (val: boolean) => {
        if (!val) {
            const director = investigadores.find(inv => inv.rol?.toLowerCase().includes('director')) || investigadores[0];
            if (investigadores.length > 1) {
                if (await confirm({
                    title: "Trabajo Individual",
                    message: "Al cambiar a Trabajo Individual, se removerán los demás co-investigadores y estudiantes. ¿Deseas continuar?",
                    confirmText: "Continuar",
                    cancelText: "Cancelar",
                    variant: "warning"
                })) {
                    setInvestigadores(director ? [director] : []);
                    setTieneGrupo(false);
                    setGrupoInvestigacion('');
                }
            } else {
                setTieneGrupo(false);
                setGrupoInvestigacion('');
            }
        } else {
            setTieneGrupo(true);
        }
    };

    const handleCloseEditor = () => {
        setActiveDocument(null);
        navigate(buildWorkspacePath(templateCode, documentUuid!), { replace: true });
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
            addToast("Error de Documento", "No se pudo abrir el documento. Inténtelo de nuevo.", "error");
        } finally {
            setResolvingDocument(null);
        }
    };

    if (activeDocument) {
        const isPrimaryDocument = activeDocument?.toUpperCase() === templateCode?.toUpperCase();

        const editorUuid = isPrimaryDocument
            ? documentUuid
            : subDocumentUuids[activeDocument];

        if (!isPrimaryDocument && !editorUuid) {
            return (
                <div className="flex-1 bg-bg-deep flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin h-8 w-8 border-t-2 border-brand rounded-full"></div>
                        <p className="text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">Resolviendo documento...</p>
                    </div>
                </div>
            );
        }

        // Determinar permisos de sólo lectura por tipo de documento y estado del proyecto
        let isReadOnly = false;
        let readOnlyReason: 'state' | 'membership' | 'review' = 'state';

        if (activeDocument === 'PROTOCOLO_INVESTIGACION' || activeDocument === 'PROTOCOLO_PEER_REVIEW') {
            isReadOnly = !currentProject.puedeEditar;
            readOnlyReason = (currentProject.status !== 'Borrador' && currentProject.status !== 'En Corrección') ? 'state' : 'membership';
        } else if (activeDocument === 'RUBRICA_EVALUACION') {
            isReadOnly = true;
            readOnlyReason = 'review';
        } else if (activeDocument === 'INFORME_AVANCE') {
            isReadOnly = currentProject.status === 'Finalizado';
            readOnlyReason = 'state';
        } else if (activeDocument === 'INFORME_FINAL_INVESTIGACION') {
            // El Informe Final es editable en ejecución o aprobado, pero de sólo lectura si ya está Finalizado o en fases tempranas
            isReadOnly = currentProject.status !== 'En Ejecución' && currentProject.status !== 'Aprobado';
            readOnlyReason = 'state';
        } else {
            isReadOnly = currentProject.status === 'Finalizado';
            readOnlyReason = 'state';
        }

        return (
            <DocumentEditor 
                templateCode={activeDocument} 
                initialData={{ Uuid: editorUuid }}
                entityUuid={resolvedProjectUuid || undefined}
                onClose={handleCloseEditor} 
                readOnly={isReadOnly}
                readOnlyReason={readOnlyReason}
                projectStatus={currentProject.status}
            />
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-bg-deep overflow-hidden selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
            {/* ── Header Único Responsivo ── */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-10 py-4 bg-bg-deep border-b border-border-thin z-50 gap-4 sm:gap-0">
                <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/investigacion')} className="p-2.5 rounded-xl bg-surface border border-border-thin hover:border-text-main text-text-dim hover:text-text-main transition-all">
                            <ArrowLeft size={14} />
                        </button>
                        <div className="h-4 w-[1px] bg-border-thin" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-surface border border-border-thin flex items-center justify-center text-[10px] font-semibold text-text-main uppercase">
                                DI
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                                    <Activity size={10} strokeWidth={2} className="text-brand" />
                                    <span>Proyecto · ISTPET</span>
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
                        <span className={`badge-vercel ${estadoConfig(currentProject.status).badge} text-[9px] font-semibold`}>
                            <span className={`dot ${estadoConfig(currentProject.status).dot}`} />
                            {currentProject.status}
                        </span>
                    </div>
                </div>
                
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto justify-end">
                    {/* Badge de estado en pantallas medianas y grandes */}
                    <div className="hidden sm:block mr-1">
                        <span className={`badge-vercel ${estadoConfig(currentProject.status).badge} text-[9px] font-semibold`}>
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
                                    addToast("Exportación CACES", "Metadatos CACES exportados con éxito.", "success");
                                } catch (err) {
                                    console.error("[DIITRA] Error al exportar metadatos CACES", err);
                                    addToast("Error de Exportación", "No se pudo realizar la exportación de metadatos CACES", "error");
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
                                    addToast("Publicación en DSpace", `¡Proyecto publicado con éxito en DSpace! URI: ${res.data.uri}`, "success");
                                } catch (err: any) {
                                    console.error("[DIITRA] Error al publicar en DSpace", err);
                                    const errMsg = err.response?.data?.error || "No se pudo realizar la publicación en DSpace";
                                    addToast("Error de Publicación", errMsg, "error");
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
            <div className="flex-1 overflow-y-auto">
                <main className="max-w-[1600px] mx-auto p-4 md:p-10 animate-fade-up">
                {/* ── Page Title (DashboardHeader pattern) ── */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6 md:gap-0">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-text-main uppercase tracking-[0.3em]">
                            <span className={`badge-vercel ${estadoConfig(currentProject.status).badge} text-[9px]`}>
                                <span className={`dot ${estadoConfig(currentProject.status).dot}`} />
                                {currentProject.status}
                            </span>
                            <span className="text-text-dim">·</span>
                            <span
                                className="text-text-dim font-mono"
                                title={currentProject.uuid}
                            >
                                {currentProject.uuid.split('-')[0]}
                            </span>
                            <span className="text-text-dim">·</span>
                            <span className="text-text-dim">{user?.role || 'Investigador'}</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">{currentProject.title}</h2>
                        <p className="text-sm text-text-dim max-w-lg font-medium">Gestión del ciclo de vida institucional del proyecto de investigación.</p>
                    </div>
                </header>

                {templateCode && templateCode !== 'PROTOCOLO_INVESTIGACION' && (
                    <div className="mb-8 p-6 rounded-2xl bg-surface border border-brand/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-5 -mt-5 group-hover:bg-brand/10 transition-colors duration-500" />
                        <div className="flex items-start gap-4">
                            <div className="icon-circle-brand shrink-0 !p-3">
                                <FileSignature size={18} className="text-brand" />
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-text-main uppercase tracking-widest">
                                    {templateCode === 'INFORME_FINAL_INVESTIGACION' ? 'Informe Final en Proceso' : 'Documento en Edición'}
                                </h3>
                                <p className="text-xs text-text-dim mt-1.5 leading-relaxed max-w-xl">
                                    Estás en el espacio de trabajo de este proyecto. Puedes continuar completando los campos colaborativos del {templateCode === 'INFORME_FINAL_INVESTIGACION' ? 'informe final' : 'documento'} o revisar el estado institucional abajo.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveDocument(templateCode)}
                            className="btn-vercel-primary py-3 px-6 text-xs w-full md:w-auto shrink-0 justify-center"
                        >
                            <FileSignature size={14} />
                            <span>Continuar Editando</span>
                        </button>
                    </div>
                )}

                <div className="px-2 grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2 flex flex-col gap-3">
                        {/* ── Flujo Institucional CACES ── */}
                        <div className="bento-card static p-6 flex flex-col justify-between group">
                            <div className="flex items-center gap-2.5 mb-2">
                                <Settings size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                                <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Flujo Institucional CACES</h3>
                            </div>
                            
                            <div className="relative pl-8 space-y-4 mt-6">
                                {/* Track line */}
                                <div className="absolute left-3 top-2.5 bottom-2.5 w-0.5 bg-border-thin"></div>
                                
                                {WorkflowPhases.map((phase, idx) => {
                                    const currentIdx = getPhaseIndex(currentProject.status);
                                    const isCurrent = currentIdx === idx;
                                    const isPast = currentIdx > idx;
                                    
                                    const isRevisionDone = phase.id === 'En Revisión' && assignedRevisionStatus === 'Completada';
                                    const showChecked = isPast || isRevisionDone;
                                    const isCurrentActive = isCurrent && !isRevisionDone;

                                    return (
                                        <div key={phase.id} className="relative group/step">
                                            {/* Connector segment colored green if past */}
                                            {idx < WorkflowPhases.length - 1 && (
                                                <div className={`absolute left-[-21px] top-6 bottom-[-20px] w-0.5 transition-colors duration-300 z-0 ${
                                                    isPast ? 'bg-success/50' : 'bg-border-thin'
                                                }`} />
                                            )}

                                            {/* Step Dot */}
                                            <div className={`absolute -left-[29px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300 z-10 ${
                                                showChecked 
                                                    ? 'bg-success/15 border-success text-success' 
                                                    : isCurrentActive 
                                                        ? 'bg-brand/10 border-brand text-brand shadow-[0_0_12px_rgba(0,112,243,0.3)]' 
                                                        : 'bg-surface border-border-thin text-text-dim'
                                            }`}>
                                                {showChecked ? (
                                                    <CheckCircle2 size={12} className="stroke-[2.5]" />
                                                ) : (
                                                    <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                                                )}
                                            </div>
                                            
                                            {/* Card Content */}
                                            <div className={`p-4 rounded-xl border transition-all duration-300 ${
                                                isCurrentActive 
                                                    ? 'bg-surface-hover/60 border-brand/20 shadow-[0_4px_20px_rgba(0,112,243,0.03)]' 
                                                    : 'bg-transparent border-transparent hover:border-border-thin/40 hover:bg-surface-hover/10'
                                            }`}>
                                                <h3 className={`text-xs font-semibold tracking-wider uppercase ${isCurrentActive ? 'text-text-main font-bold' : 'text-text-dim'}`}>
                                                    {phase.label}
                                                </h3>
                                                <p className="text-[11px] text-text-dim mt-1.5 leading-relaxed">
                                                    {phase.id === 'Borrador' && 'Construcción colaborativa del protocolo de investigación por parte del equipo.'}
                                                    {phase.id === 'En Revisión' && 'Revisión técnica anónima por pares evaluadores asignados por el Director.'}
                                                    {phase.id === 'Aprobado' && 'Validación final del consejo académico y firma electrónica de actas formales.'}
                                                    {phase.id === 'En Ejecución' && 'Seguimiento de hitos, envío de informes de avance y ejecución presupuestaria.'}
                                                </p>
                                                
                                                {phase.id === 'Borrador' && (
                                                    <div className="mt-4">
                                                        <button 
                                                            onClick={() => {
                                                                if (templateCode === 'PROTOCOLO_INVESTIGACION') {
                                                                    setActiveDocument('PROTOCOLO_INVESTIGACION');
                                                                } else {
                                                                    resolveDocumentInstance('PROTOCOLO_INVESTIGACION');
                                                                }
                                                            }}
                                                            className="btn-vercel-secondary !py-2"
                                                        >
                                                            <FileText size={14} />
                                                            <span>{(currentProject.puedeEditar === false || isPast) ? 'Ver Protocolo' : 'Editar Protocolo'}</span>
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {phase.id === 'En Revisión' && (isCurrent || isPast) && (
                                                    <div className="mt-4 animate-fade-in flex flex-col gap-3 w-full">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            {assignedRevisionUuid ? (
                                                                <button 
                                                                    onClick={() => navigate(`/revisiones/${assignedRevisionUuid}`)}
                                                                    className="btn-vercel-primary !py-2"
                                                                >
                                                                    <CheckSquare size={14} />
                                                                    <span>{(isPast || assignedRevisionStatus === 'Completada') ? 'Ver Mi Rúbrica' : 'Llenar Rúbrica de Arbitraje'}</span>
                                                                </button>
                                                            ) : (isAdmin || roles?.includes('DIRECTOR_INV')) ? (
                                                                <button 
                                                                    onClick={() => navigate(`/arbitraje/proyecto/${resolvedProjectUuid}`)}
                                                                    className="btn-vercel-primary !py-2"
                                                                >
                                                                    <Settings size={14} />
                                                                    <span>Gestionar Arbitraje Científico</span>
                                                                </button>
                                                            ) : (
                                                                <div className="flex items-start gap-2 bg-surface border border-border-thin rounded-lg p-3 max-w-xl text-text-dim text-xs leading-relaxed">
                                                                    <AlertCircle size={14} className="text-brand shrink-0 mt-0.5" />
                                                                    <span>
                                                                        El proyecto se encuentra en la etapa formal de **evaluación anónima por pares**. 
                                                                        Por motivos de confidencialidad de la evaluación anónima (CACES), los evaluadores asignados 
                                                                        y el desarrollo de sus rúbricas permanecen anónimos. Una vez concluido el arbitraje y 
                                                                        emitido el dictamen final, el puntaje obtenido y la resolución legal se publicarán aquí.
                                                                    </span>
                                                                 </div>
                                                            )}

                                                            {currentProject.puntajeEvaluacion !== null && (
                                                                <div className="badge-vercel badge-vercel-success !text-[11px] !py-2 flex items-center gap-1.5 font-semibold animate-fade-in">
                                                                    <span>Puntaje: {currentProject.puntajeEvaluacion}/100</span>
                                                                    <span className="text-text-dim">|</span>
                                                                    <span className="text-[10px] uppercase font-mono">{currentProject.puntajeEvaluacion >= 70 ? 'Aprobado' : 'Rechazado'}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {phase.id === 'Aprobado' && (isCurrent || isPast) && (
                                                    <div className="mt-4 animate-fade-in flex flex-wrap gap-3">
                                                        {currentProject.codigoInstitucional && (
                                                            <span className="badge-vercel badge-vercel-success !text-[11px] !py-2 font-mono">
                                                                {currentProject.codigoInstitucional}
                                                            </span>
                                                        )}
                                                        {currentProject.status === 'Aprobado' && (isAdmin || roles?.includes('DIRECTOR_INV')) && (
                                                            <button
                                                                onClick={handleIniciarEjecucion}
                                                                disabled={iniciandoEjecucion}
                                                                className="btn-vercel-primary !py-2"
                                                            >
                                                                <Settings size={14} className={iniciandoEjecucion ? 'animate-spin' : ''} />
                                                                <span>{iniciandoEjecucion ? 'Iniciando...' : 'Iniciar Ejecución'}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {phase.id === 'En Ejecución' && (isCurrent || isPast) && currentProject.status === 'En Ejecución' && (
                                                    <div className="mt-4 animate-fade-in flex flex-wrap gap-3">
                                                        <button 
                                                            onClick={() => navigate(`/investigacion/informes-avance/${currentProject.uuid}`)}
                                                            className="btn-vercel-primary !py-2"
                                                        >
                                                            <BarChart size={14} />
                                                            <span>Informes de Avance</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                if (templateCode === 'INFORME_FINAL_INVESTIGACION') {
                                                                    setActiveDocument('INFORME_FINAL_INVESTIGACION');
                                                                } else {
                                                                    resolveDocumentInstance('INFORME_FINAL_INVESTIGACION');
                                                                }
                                                            }}
                                                            disabled={resolvingDocument === 'INFORME_FINAL_INVESTIGACION'}
                                                            className="btn-vercel-primary !py-2"
                                                        >
                                                            <FileSignature size={14} />
                                                            <span>{currentProject.status === 'Finalizado' ? 'Ver Informe Final' : 'Informe Final'}</span>
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
                        <div className="bento-card static p-6 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <Users size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                                    <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Equipo de Trabajo</h3>
                                </div>
                                <p className="text-xs text-text-dim font-normal leading-relaxed">Gestión dinámica del talento humano del proyecto</p>
                            </div>

                            <div className="mt-6 space-y-4">
                                {/* Toggle Individual / Asociativo */}
                                <div className="flex bg-surface-hover p-1 rounded-md border border-border-thin">
                                    <button 
                                        type="button"
                                        disabled={currentProject.puedeEditar === false}
                                        onClick={() => handleToggleTieneGrupo(false)}
                                        className={`flex-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest rounded-sm transition-all duration-300 ${currentProject.puedeEditar === false ? 'opacity-50 cursor-not-allowed' : ''} ${!tieneGrupo ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:text-text-main'}`}
                                    >
                                        Individual
                                    </button>
                                    <button 
                                        type="button"
                                        disabled={currentProject.puedeEditar === false}
                                        onClick={() => handleToggleTieneGrupo(true)}
                                        className={`flex-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest rounded-sm transition-all duration-300 ${currentProject.puedeEditar === false ? 'opacity-50 cursor-not-allowed' : ''} ${tieneGrupo ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:text-text-main'}`}
                                    >
                                        Asociativo (Grupo)
                                    </button>
                                </div>

                                {/* Banner Informativo */}
                                {!tieneGrupo ? (
                                    <div className="badge-vercel badge-vercel-warning !rounded-md !p-3 !text-[11px] !font-normal !leading-relaxed w-full flex gap-2 items-start">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span><span className="font-semibold">Proyecto Independiente:</span> Liderado únicamente por el Director. Cambia a Asociativo para vincular a un Grupo de Investigación acreditado y agregar co-investigadores o estudiantes.</span>
                                    </div>
                                ) : (
                                    <div className="badge-vercel badge-vercel-info !rounded-md !p-3 !text-[11px] !font-normal !leading-relaxed w-full flex gap-2 items-start">
                                        <Sparkles size={14} className="shrink-0 mt-0.5" />
                                        <span><span className="font-semibold">Proyecto Asociativo CACES:</span> Permite asociar un Grupo de Investigación promotor y sincronizar/agregar docentes y estudiantes (semilleristas) al equipo.</span>
                                    </div>
                                )}

                                {/* Selector de Grupo de Investigación Adscrito */}
                                {tieneGrupo && (
                                    <div className="space-y-1.5 animate-fade-in">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Grupo de Investigación Adscrito</label>
                                            {grupoInvestigacion && (
                                                (() => {
                                                    const selectedGroupObj = approvedGroups.find(g => g.uuid === grupoInvestigacion);
                                                    return selectedGroupObj?.uuid ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/grupos?open=${selectedGroupObj.uuid}`)}
                                                            className="text-[9px] text-brand hover:text-brand-light font-bold flex items-center gap-0.5 hover:underline"
                                                            title="Ver Ficha del Grupo en Administración"
                                                        >
                                                            <span>Ficha del Grupo</span>
                                                            <ExternalLink size={10} />
                                                        </button>
                                                    ) : null;
                                                })()
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <select
                                                value={grupoInvestigacion}
                                                disabled={currentProject.puedeEditar === false}
                                                onChange={(e) => setGrupoInvestigacion(e.target.value)}
                                                className="flex-1 bg-surface border border-border-thin rounded px-2.5 py-2 text-xs text-text-main outline-none focus:border-text-main transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <option value="">-- Seleccione Grupo Aprobado --</option>
                                                {approvedGroups.map((g: any) => (
                                                    <option key={g.id_grupo || g.idGrupo} value={g.uuid}>
                                                        {g.nombre} {g.siglas ? `(${g.siglas})` : ''}
                                                     </option>
                                                ))}
                                            </select>

                                            {grupoInvestigacion && currentProject.puedeEditar !== false && (
                                                <button
                                                    type="button"
                                                    disabled={isSyncingGroupMembers}
                                                    onClick={handleSyncGroupMembers}
                                                    className="btn-vercel-secondary !py-2 !px-3 text-xs flex items-center justify-center gap-1.5 shrink-0"
                                                    title="Importa co-investigadores activos de este grupo"
                                                >
                                                    {isSyncingGroupMembers ? (
                                                        <RefreshCw size={12} className="animate-spin text-brand" />
                                                    ) : (
                                                        <RefreshCw size={12} className="text-brand" />
                                                    )}
                                                    <span>Sincronizar</span>
                                                </button>
                                            )}
                                        </div>
                                        {grupoInvestigacion && currentProject.puedeEditar !== false && (
                                            <p className="text-[9px] text-brand-light italic">
                                                * Al guardar, los miembros del grupo adscrito se consolidarán en la base de datos. Presiona "Sincronizar" para importarlos a la lista inferior antes de guardar.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Gestión bloqueada en modo asociativo */}
                                {tieneGrupo && currentProject.puedeEditar !== false && (
                                    <div className="badge-vercel badge-vercel-warning !rounded-md !p-3 !text-[11px] !font-normal !leading-relaxed w-full flex gap-2 items-start">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span>
                                            En proyectos asociativos no se permite agregar o quitar miembros desde esta vista.
                                            La conformación del grupo se administra en <span className="font-semibold">/grupos</span>; aquí solo se asigna y sincroniza el grupo aprobado.
                                        </span>
                                    </div>
                                )}

                                {tieneGrupo && (
                                    <div className="border border-border-thin rounded-md p-3 space-y-3 bg-bg-deep/50">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-main">Solicitudes Formales de Cambio</h4>
                                            <span className="text-[9px] text-text-dim">Con registro y revisión</span>
                                        </div>

                                        {currentProject.puedeSolicitarCambioEquipo && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <select
                                                    value={teamChangeForm.tipo}
                                                    onChange={(e) => setTeamChangeForm(prev => ({ ...prev, tipo: e.target.value }))}
                                                    className="bg-surface border border-border-thin rounded px-2 py-1.5 text-[11px] text-text-main outline-none focus:border-text-main"
                                                >
                                                    <option value="ALTA">Alta de integrante</option>
                                                    <option value="BAJA">Baja de integrante</option>
                                                    <option value="CAMBIO_DIRECTOR">Cambio de director</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={teamChangeForm.cedulaObjetivo}
                                                    onChange={(e) => setTeamChangeForm(prev => ({ ...prev, cedulaObjetivo: e.target.value }))}
                                                    placeholder="Cédula objetivo"
                                                    className="bg-surface border border-border-thin rounded px-2 py-1.5 text-[11px] text-text-main outline-none focus:border-text-main"
                                                />
                                                {teamChangeForm.tipo !== 'BAJA' && (
                                                    <select
                                                        value={teamChangeForm.rolPropuesto}
                                                        onChange={(e) => setTeamChangeForm(prev => ({ ...prev, rolPropuesto: e.target.value }))}
                                                        className="bg-surface border border-border-thin rounded px-2 py-1.5 text-[11px] text-text-main outline-none focus:border-text-main"
                                                    >
                                                        <option value="Co-Investigador (Docente)">Co-Investigador (Docente)</option>
                                                        <option value="Co-Investigador (Estudiante)">Co-Investigador (Estudiante)</option>
                                                        <option value="Director de Proyecto">Director de Proyecto</option>
                                                    </select>
                                                )}
                                                <input
                                                    type="text"
                                                    value={teamChangeForm.resolucionReferencia}
                                                    onChange={(e) => setTeamChangeForm(prev => ({ ...prev, resolucionReferencia: e.target.value }))}
                                                    placeholder="Referencia acta / memo (opcional)"
                                                    className="bg-surface border border-border-thin rounded px-2 py-1.5 text-[11px] text-text-main outline-none focus:border-text-main"
                                                />
                                                <textarea
                                                    value={teamChangeForm.motivo}
                                                    onChange={(e) => setTeamChangeForm(prev => ({ ...prev, motivo: e.target.value }))}
                                                    placeholder="Motivo formal del cambio"
                                                    className="md:col-span-2 bg-surface border border-border-thin rounded px-2 py-1.5 text-[11px] text-text-main outline-none focus:border-text-main min-h-[56px]"
                                                />
                                                <div className="md:col-span-2 flex justify-end">
                                                    <button
                                                        type="button"
                                                        disabled={isSubmittingTeamChangeRequest}
                                                        onClick={handleCreateTeamChangeRequest}
                                                        className={`btn-vercel-secondary !py-2 !px-3 text-xs ${isSubmittingTeamChangeRequest ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {isSubmittingTeamChangeRequest ? 'Registrando...' : 'Registrar Solicitud'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {currentProject.puedeEditar === false && currentProject.puedeSolicitarCambioEquipo && (
                                            <div className="badge-vercel badge-vercel-info !rounded-md !p-2.5 !text-[10px] !font-normal !leading-relaxed w-full">
                                                El protocolo está en solo lectura, pero como integrante del proyecto o del grupo puedes registrar solicitudes formales (alta, baja o cambio de director). Solo el administrador puede aprobarlas y ejecutarlas.
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {isLoadingTeamChangeRequests ? (
                                                <div className="text-[10px] text-text-dim uppercase tracking-wider">Cargando solicitudes...</div>
                                            ) : teamChangeRequests.length === 0 ? (
                                                <div className="text-[10px] text-text-dim uppercase tracking-wider">Sin solicitudes registradas</div>
                                            ) : (
                                                teamChangeRequests.map((req: any) => (
                                                    <div key={req.requestUuid} className="p-2 rounded border border-border-thin bg-surface">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[10px] font-semibold text-text-main uppercase">{req.tipo} · {req.estado}</span>
                                                            <span className="text-[9px] text-text-dim">{req.cedulaObjetivo || 'N/A'}</span>
                                                        </div>
                                                        <p className="text-[10px] text-text-dim mt-1">{req.motivo}</p>
                                                        {canReviewTeamChanges && req.estado === 'PENDIENTE' && (
                                                            <div className="flex gap-2 mt-2">
                                                                <button type="button" className="btn-vercel-secondary !py-1.5 !px-2 text-[10px]" onClick={() => handleReviewTeamChangeRequest(req.requestUuid, true)}>
                                                                    Aprobar y Ejecutar
                                                                </button>
                                                                <button type="button" className="btn-vercel-outline !py-1.5 !px-2 text-[10px]" onClick={() => handleReviewTeamChangeRequest(req.requestUuid, false)}>
                                                                    Rechazar
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Modo Solo Lectura Banner */}
                                {currentProject.puedeEditar === false && (
                                    <div className="badge-vercel badge-vercel-warning !rounded-xl !p-4 !text-[11px] !font-normal flex gap-2.5 leading-relaxed animate-fade-in mb-4 w-full items-start">
                                        <Shield size={14} className="shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold uppercase tracking-wider text-[10px] block">Modo Sólo Lectura</span>
                                            <span className="text-text-dim">No tienes permisos para modificar el equipo de investigadores o transferir la dirección del proyecto.</span>
                                        </div>
                                    </div>
                                )}

                                {/* Lista de Integrantes */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">
                                        Activos ({investigadores.filter((m: any) => m.activo !== false).length})
                                    </label>
                                    
                                    {investigadores.filter((member: any) => member.activo !== false).length === 0 ? (
                                        <div className="p-6 rounded-xl border border-dashed border-border-thin text-center text-[10px] text-text-dim uppercase tracking-wider font-mono">
                                            Sin investigadores activos
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {investigadores.filter((member: any) => member.activo !== false).map((member: any, idx: number) => {
                                                const isDirector = member.rol?.toLowerCase().includes('director');
                                                const isEstudiante = member.rol?.toLowerCase().includes('estudiante') || member.nivelAcademico === 'Pregrado';
                                                
                                                return (
                                                    <div 
                                                        key={member.cedula || idx} 
                                                        className="p-4 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover hover:bg-surface-hover/20 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                                                    >
                                                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                                            <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-[11px] font-semibold border transition-colors ${
                                                                isDirector 
                                                                    ? 'bg-brand/10 border-brand/20 text-brand' 
                                                                    : isEstudiante 
                                                                        ? 'bg-success/10 border-success/20 text-success' 
                                                                        : 'bg-surface border-border-thin text-text-main'
                                                            }`}>
                                                                {member.nombre ? member.nombre.substring(0, 2).toUpperCase() : 'IN'}
                                                            </div>
                                                            <div className="min-w-0 space-y-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-xs font-semibold text-text-main truncate">{formatNombre(member.nombre)}</span>
                                                                    <span className={`badge-vercel text-[8px] font-bold uppercase tracking-wider py-0.5 ${
                                                                        isDirector 
                                                                            ? 'badge-vercel-violet' 
                                                                            : isEstudiante 
                                                                                ? 'badge-vercel-success' 
                                                                                : 'badge-vercel-info'
                                                                    }`}>
                                                                        {member.rol}
                                                                    </span>
                                                                    {isDirector && currentProject.puedeEditar !== false && !tieneGrupo && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenTransferModal(member)}
                                                                            className="badge-vercel badge-vercel-warning text-[8px] font-bold uppercase tracking-wider hover:opacity-80 transition-all cursor-pointer flex items-center gap-1 py-0.5"
                                                                            title="Transferir Dirección"
                                                                        >
                                                                            <RefreshCw size={8} /> Relevo
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-text-dim flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                    {member.carrera && (
                                                                        <span className="text-[9px] text-brand-light font-medium bg-brand/5 border border-brand/10 px-2 py-0.5 rounded-md truncate max-w-[180px]" title={member.carrera}>
                                                                            {member.carrera}
                                                                        </span>
                                                                    )}
                                                                    <span className="font-mono">C.I. {member.cedula || 'N/A'}</span>
                                                                    <span>·</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-text-dim text-[10px]">Tel:</span>
                                                                        <input 
                                                                            type="text" 
                                                                            value={member.telefono || ''} 
                                                                            disabled={currentProject.puedeEditar === false || tieneGrupo}
                                                                            onChange={(e) => handleUpdateMember(member.cedula, 'telefono', e.target.value)}
                                                                            placeholder="Añadir..." 
                                                                            className="bg-transparent text-text-main placeholder:text-text-dim outline-none border-b border-border-thin hover:border-text-dim focus:border-text-main w-24 inline-block px-1 py-0 text-[10px] transition-colors" 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3.5 w-full xl:w-auto xl:justify-end">
                                                            {member.horasDisponibles !== undefined && member.horasDisponibles !== null && (
                                                                <div className={`text-[9px] px-2 py-1.5 rounded-lg border flex items-center gap-1 w-full sm:w-auto shrink-0 ${
                                                                    (member.horasSemanales || 0) > (member.horasDisponibles - (member.horasAsignadas || 0))
                                                                        ? 'bg-error/10 text-error border-error/20 animate-pulse font-semibold'
                                                                        : 'bg-info/5 text-info border-info/10'
                                                                }`}>
                                                                    <AlertCircle size={10} />
                                                                    <span>
                                                                        {(member.horasSemanales || 0) > (member.horasDisponibles - (member.horasAsignadas || 0))
                                                                            ? `Excede límite! Máx disp: ${Math.max(0, member.horasDisponibles - (member.horasAsignadas || 0))}h`
                                                                            : `Disp: ${member.horasDisponibles - (member.horasAsignadas || 0)}h / ${member.horasDisponibles}h`
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Rol Proyecto</span>
                                                                    <select
                                                                        value={member.rol}
                                                                        disabled={currentProject.puedeEditar === false || tieneGrupo}
                                                                        onChange={(e) => handleUpdateMember(member.cedula, 'rol', e.target.value)}
                                                                        className="bg-surface border border-border-thin rounded-lg p-2 text-xs text-text-main outline-none focus:border-text-main transition-all min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    >
                                                                        <option value="Director de Proyecto">Director</option>
                                                                        <option value="Co-Investigador (Docente)">Co-Investigador (Docente)</option>
                                                                        <option value="Co-Investigador (Estudiante)">Co-Investigador (Est.)</option>
                                                                        <option value="Técnico de Apoyo">Técnico de Apoyo</option>
                                                                    </select>
                                                                </div>
                                                                
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Nivel</span>
                                                                    <select
                                                                        value={member.nivelAcademico}
                                                                        disabled={currentProject.puedeEditar === false || tieneGrupo}
                                                                        onChange={(e) => handleUpdateMember(member.cedula, 'nivelAcademico', e.target.value)}
                                                                        className="bg-surface border border-border-thin rounded-lg p-2 text-xs text-text-main outline-none focus:border-text-main transition-all min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    >
                                                                        <option value="Tercer Nivel">Tercer Nivel</option>
                                                                        <option value="Cuarto Nivel (Maestría)">Maestría</option>
                                                                        <option value="Cuarto Nivel (PhD)">PhD</option>
                                                                        <option value="Pregrado">Pregrado</option>
                                                                    </select>
                                                                </div>

                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Horas</span>
                                                                    <input 
                                                                        type="number"
                                                                        value={member.horasSemanales ?? ''}
                                                                        disabled={currentProject.puedeEditar === false || tieneGrupo}
                                                                        onChange={(e) => handleUpdateMember(member.cedula, 'horasSemanales', e.target.value ? parseFloat(e.target.value) : null)}
                                                                        placeholder="0"
                                                                        min="0"
                                                                        max="40"
                                                                        className="bg-surface border border-border-thin rounded-lg p-2 text-xs text-text-main outline-none focus:border-text-main transition-all w-full disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {currentProject.puedeEditar !== false && !tieneGrupo && !isDirector && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveMember(member.cedula)}
                                                                    className="p-2 text-text-dim hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-lg transition-all self-end"
                                                                    title="Remover"
                                                                >
                                                                    <Trash2 size={13} />
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
                                            className="w-full flex items-center justify-between text-[10px] font-semibold text-text-dim uppercase tracking-wider hover:text-text-main transition-colors py-1 outline-none"
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
                                                                <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[9px] font-semibold border uppercase ${isExDirector ? 'icon-circle-brand !p-0 !w-7 !h-7' : 'bg-surface border-border-thin text-text-dim'}`}>
                                                                    {member.nombre ? member.nombre.substring(0, 2) : 'EX'}
                                                                </div>
                                                                <div>
                                                                    <span className="text-[11px] font-semibold text-text-main">{formatNombre(member.nombre)}</span>
                                                                    <span className="text-[9px] text-text-dim font-mono ml-1.5">C.I. {member.cedula || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <span className="badge-vercel badge-vercel-error text-[9px] font-semibold">
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
                        <div className="bento-card static p-6 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <BookOpen size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                                    <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Productos de Investigación</h3>
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
                                    <div className="p-8 text-center text-[10px] text-text-dim uppercase tracking-wider border border-dashed border-border-thin rounded-xl font-mono">
                                        Sin productos registrados
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {products.map((prod: any) => (
                                            <div key={prod.id_producto} className="p-4 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover hover:bg-surface-hover/20 transition-all flex flex-col justify-between group">
                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="badge-vercel badge-vercel-info text-[8px] font-bold uppercase tracking-wider py-0.5">
                                                            {prod.tipo_producto_nombre}
                                                        </span>
                                                        {currentProject.puedeEditar !== false && (
                                                            <button 
                                                                onClick={() => handleDeleteProduct(prod.id_producto)}
                                                                className="p-1.5 hover:bg-error/10 hover:text-error text-text-dim rounded-lg transition-all"
                                                                title="Eliminar producto"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-semibold text-text-main leading-relaxed mb-2" title={prod.titulo}>{prod.titulo}</p>
                                                </div>
                                                
                                                <div className="text-[10px] font-mono mt-2 space-y-1">
                                                    {prod.url_producto && (
                                                        <a href={prod.url_producto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-light hover:text-brand hover:underline">
                                                            <ExternalLink size={10} /> 
                                                            <span className="truncate max-w-[200px]">{prod.url_producto}</span>
                                                        </a>
                                                    )}
                                                    {prod.es_propiedad_intelectual && (
                                                        <div className="flex items-center gap-1 text-success font-medium">
                                                            <Shield size={10} />
                                                            <span>SENADI: {prod.numero_registro || 'En trámite'}</span>
                                                        </div>
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
                        <div className="bento-card static p-6 flex flex-col justify-between group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-brand/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-brand/10 transition-colors duration-500"></div>
                            <div>
                                <div className="flex items-center gap-2.5 mb-2">
                                    <Shield size={16} className="text-brand group-hover:text-text-main transition-colors" />
                                    <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Bóveda de Firmas</h3>
                                </div>
                                <p className="text-[10px] text-text-dim leading-relaxed mt-1">Sube tu certificado digital (.p12 o .pfx) para la firma electrónica del protocolo institucional.</p>
                            </div>
                            <div className="mt-5 space-y-2.5">
                                <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin flex items-center justify-between hover:border-border-hover hover:bg-surface-hover/20 transition-all">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-main">Director de Proyecto</p>
                                        <div className="flex items-center">
                                            <span className="badge-vercel badge-vercel-warning text-[9px] font-semibold py-0">
                                                <span className="dot dot-warning dot-pulse" />
                                                Pendiente
                                            </span>
                                        </div>
                                    </div>
                                    <button className="p-2.5 bg-surface border border-border-thin hover:border-text-main hover:bg-surface-hover text-text-dim hover:text-text-main rounded-xl transition-all shadow-sm cursor-pointer" title="Cargar certificado digital">
                                        <UploadCloud size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="bento-card static p-6 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center gap-2.5 mb-3">
                                    <BarChart size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                                    <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Datos normativos CACES</h3>
                                </div>
                            </div>
                            <div className="space-y-2.5 mt-2">
                                <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover transition-all space-y-1">
                                    <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest block">Línea de Investigación</span>
                                    <span className="text-xs font-medium text-text-main leading-relaxed">{currentProject.linea || 'No definida'}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover transition-all flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest block">Presupuesto Aprobado</span>
                                        <span className="text-sm font-bold text-success font-mono">
                                            ${Number(currentProject.presupuesto).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <span className="badge-vercel badge-vercel-success text-[8px] font-bold uppercase tracking-wider">USD</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Panel de Actividad Reciente (Desacoplado) ── */}
                        {resolvedProjectUuid && (
                            <div className="bento-card static flex flex-col overflow-hidden">
                                <WorkspaceActivityPanel
                                    projectUuid={resolvedProjectUuid}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>
            </div>

            {/* ══ Modal: Registrar Producto ══ */}
            {showProductModal && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-card animate-fade-up">
                        <div className="modal-header">
                            <div className="flex items-center gap-2">
                                <BookOpen size={16} className="text-brand" />
                                <h3 className="text-[10px] font-semibold uppercase tracking-widest">Registrar Producto</h3>
                            </div>
                            <button onClick={() => setShowProductModal(false)} className="text-text-dim hover:text-text-main transition-colors text-sm">✕</button>
                        </div>
                        
                        <form onSubmit={handleCreateProduct} className="modal-body space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Tipo de Producto</label>
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
                                <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Título del Producto</label>
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
                                    <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Cantidad</label>
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
                                    <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">URL / DOI</label>
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
                                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">N. Registro</label>
                                        <input 
                                            type="text"
                                            placeholder="SENADI-2026-0045"
                                            value={newProduct.numero_registro}
                                            onChange={(e) => setNewProduct({ ...newProduct, numero_registro: e.target.value })}
                                            className="input-vercel !text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Fecha de Registro</label>
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
                                <h3 className="text-[10px] font-semibold uppercase tracking-widest">Transferencia de Dirección</h3>
                            </div>
                            <button onClick={() => setShowTransferModal(false)} className="text-text-dim hover:text-text-main transition-colors text-sm">✕</button>
                        </div>

                        {transferDirector && (
                            <div className="mx-6 mt-4 badge-vercel badge-vercel-violet !rounded-md !p-3 !text-[11px] space-y-1">
                                <span className="font-semibold block uppercase tracking-wider text-[10px]">Director a Relevar:</span>
                                <p className="font-semibold text-text-main text-xs">{formatNombre(transferDirector.nombre)}</p>
                                <p className="text-text-dim font-mono text-[10px]">C.I. {transferDirector.cedula} | {transferDirector.rol}</p>
                            </div>
                        )}

                        <form onSubmit={handleConfirmTransfer} className="modal-body space-y-4">
                            <div className="relative space-y-1">
                                <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Buscar Nuevo Director</label>
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
                                                            setTransferSearchQuery(formatNombre(su.nombre));
                                                            setShowTransferSearchResults(false);
                                                        }}
                                                        className="w-full p-3 flex items-center justify-between hover:bg-surface text-left text-xs transition-colors border-b border-border-thin last:border-b-0"
                                                    >
                                                        <div>
                                                            <p className="font-semibold text-text-main">{formatNombre(su.nombre)}</p>
                                                            <p className="text-text-dim font-mono text-[10px]">C.I. {su.cedula}</p>
                                                        </div>
                                                        <span className={`badge-vercel text-[8px] font-semibold ${su.tipo === 'profesor' ? 'badge-vercel-violet' : 'badge-vercel-success'}`}>
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
                                        <p className="font-semibold text-text-main text-xs">{transferSearchQuery}</p>
                                        <p className="text-text-dim font-mono text-[10px]">C.I. {newDirectorCedula}</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => { setNewDirectorCedula(''); setTransferSearchQuery(''); }}
                                        className="text-[10px] text-error hover:opacity-80 font-semibold uppercase tracking-wider"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Motivo</label>
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
                                <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Justificación</label>
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