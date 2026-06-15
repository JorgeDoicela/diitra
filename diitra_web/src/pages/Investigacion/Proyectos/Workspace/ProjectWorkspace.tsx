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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import api from '../../../../api/axios_config';
import { useAuth } from '../../../../api/AuthContext';
import { useNotifications } from '../../../../api/NotificationsContext';
import { useConfirm } from '../../../../api/ConfirmContext';
import { iniciarEjecucion } from '../../../../services/peerReviewService';
import DocumentEditor from '../Wizard/DocumentEditor';
import { buildWorkspacePath, isLegacyTemplateUrlSegment, slugToTemplateCode } from '../../../../core/documents/templateUrl';

// Subcomponentes refactorizados
import WorkspaceHeader from './components/WorkspaceHeader';
import WorkspaceTitle from './components/WorkspaceTitle';
import CacesWorkflow from './components/CacesWorkflow';
import TeamManagement from './components/TeamManagement';
import ResearchProductsList from './components/ResearchProductsList';
import WorkspaceSidebar from './components/WorkspaceSidebar';
import ProductRegistrationModal from './components/ProductRegistrationModal';
import DirectorTransferModal from './components/DirectorTransferModal';
import { GroupDetailDrawer } from '../../../Admin/components/GroupDetailDrawer';

const formatCareerName = (name: string) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase())
        .replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, (m: string) => m.toLowerCase());
};

const mapInvestigador = (inv: any) => {
    if (!inv) return inv;
    return {
        ...inv,
        nivelAcademico: inv.nivelAcademico ?? inv.nivel_academico ?? null,
        fechaInicio: inv.fechaInicio ?? inv.fecha_inicio ?? null,
        fechaFin: inv.fechaFin ?? inv.fecha_fin ?? null,
        motivoCambio: inv.motivoCambio ?? inv.motivo_cambio ?? null,
        horasSemanales: inv.horasSemanales ?? inv.horas_semanales ?? null,
        horasDisponibles: inv.horasDisponibles ?? inv.horas_disponibles ?? null,
        horasAsignadas: inv.horasAsignadas ?? inv.horas_asignadas ?? null,
    };
};

export const ProjectWorkspace: React.FC = () => {
    const { documentUuid, templateCode: templateSlug } = useParams<{ documentUuid: string, templateCode: string }>();
    const templateCode = templateSlug ? slugToTemplateCode(templateSlug) : 'PROTOCOLO_INVESTIGACION';
    const { user, isAdmin, roles } = useAuth();
    const { addToast } = useNotifications();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const location = useLocation();

    const isMisProyectos = location.pathname.startsWith('/investigacion/mis-proyectos');
    const urlPrefix = isMisProyectos ? '/investigacion/mis-proyectos' : '/investigacion';

    const queryParams = new URLSearchParams(location.search);
    const editParam = queryParams.get('edit');
    const activeDocument = editParam ? (editParam === 'true' ? templateCode : editParam) : null;

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    useEffect(() => {
        const handleStateChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && typeof customEvent.detail.isCollapsed === 'boolean') {
                setIsSidebarCollapsed(customEvent.detail.isCollapsed);
            }
        };
        window.addEventListener('diitra-sidebar-state-change', handleStateChange);
        return () => window.removeEventListener('diitra-sidebar-state-change', handleStateChange);
    }, []);

    useEffect(() => {
        if (!templateSlug || !documentUuid || !isLegacyTemplateUrlSegment(templateSlug)) return;
        navigate(buildWorkspacePath(templateCode, documentUuid, location.search, urlPrefix), { replace: true });
    }, [templateSlug, templateCode, documentUuid, location.search, navigate, urlPrefix]);

    const [currentProject, setCurrentProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const setActiveDocument = useCallback((doc: string | null) => {
        const searchParams = new URLSearchParams(location.search);
        if (doc) {
            searchParams.set('edit', doc);
        } else {
            searchParams.delete('edit');
        }
        navigate({ search: searchParams.toString() }, { replace: true });
    }, [location.search, navigate]);

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
        rolPropuesto: 'Co-Investigador',
        motivo: '',
        resolucionReferencia: ''
    });

    const [availableProfessors, setAvailableProfessors] = useState<any[]>([]);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [requestSearchQuery, setRequestSearchQuery] = useState('');
    const [requestSearchResults, setRequestSearchResults] = useState<any[]>([]);
    const [isRequestSearching, setIsRequestSearching] = useState(false);
    const [showRequestSearchResults, setShowRequestSearchResults] = useState(false);

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
    const lastSyncedGroupRef = useRef<string | null>(null);
    const [resolvedProjectUuid, setResolvedProjectUuid] = useState<string | null>(null);
    const [subDocumentUuids, setSubDocumentUuids] = useState<Record<string, string>>({});
    const [resolvingDocument, setResolvingDocument] = useState<string | null>(null);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [assignedRevisionUuid, setAssignedRevisionUuid] = useState<string | null>(null);
    const [assignedRevisionStatus, setAssignedRevisionStatus] = useState<string | null>(null);
    const approvedGroups = availableGroups.filter(g => g.activo && g.estado === 'Aprobado');
    const canReviewTeamChanges = isAdmin || roles?.includes('DIITRA_ADMIN');

    // Group detail drawer state and lazy-loaded catalogs
    const [detailGroup, setDetailGroup] = useState<any>(null);
    const [isGroupDetailOpen, setIsGroupDetailOpen] = useState(false);
    const [dominios, setDominios] = useState<any[]>([]);
    const [carreras, setCarreras] = useState<any[]>([]);
    const [lines, setLines] = useState<any[]>([]);

    const handleOpenGroupDetail = async (groupUuid: string) => {
        const group = approvedGroups.find(g => g.uuid === groupUuid);
        if (!group) return;

        setDetailGroup(group);
        setIsGroupDetailOpen(true);

        if (dominios.length === 0 || carreras.length === 0 || lines.length === 0) {
            try {
                const [domRes, carRes, linRes] = await Promise.all([
                    api.get('/catalogs/dominios'),
                    api.get('/catalogs/carreras'),
                    api.get('/Convocatorias/catalogos/lineas')
                ]);
                setDominios(domRes.data || []);
                setCarreras(carRes.data || []);
                setLines(linRes.data || []);
            } catch (e) {
                console.error("Error loading catalogs for GroupDetailDrawer", e);
            }
        }
    };

    const handleCloseGroupDetail = () => {
        setIsGroupDetailOpen(false);
        setDetailGroup(null);
    };

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
        if (!uuidToUse) {
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
        const fetchAvailableUsers = async () => {
            try {
                const [profRes, alumRes] = await Promise.all([
                    api.get('/catalogs/search-users?tipo=profesor'),
                    api.get('/catalogs/search-users?tipo=alumno')
                ]);
                setAvailableProfessors(profRes.data || []);
                setAvailableStudents(alumRes.data || []);
            } catch (err) {
                console.error("[DIITRA] Error fetching available users for request form", err);
            }
        };
        if (resolvedProjectUuid) {
            fetchAvailableUsers();
        }
    }, [resolvedProjectUuid]);

    useEffect(() => {
        if (!requestSearchQuery.trim() || requestSearchQuery.length < 2) {
            setRequestSearchResults([]);
            return;
        }

        const targetTipo = (teamChangeForm.tipo === 'CAMBIO_DIRECTOR') ? 'profesor' :
            (['Semillerista', 'SEMILLERISTA'].includes(teamChangeForm.rolPropuesto) ? 'alumno' : 'profesor');

        const isAlreadySelected = (targetTipo === 'profesor' ? availableProfessors : availableStudents)
            .some(u => u.nombre === requestSearchQuery);
        if (isAlreadySelected) return;

        const delayDebounceFn = setTimeout(async () => {
            setIsRequestSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(requestSearchQuery)}&tipo=${targetTipo}`);
                setRequestSearchResults(res.data || []);
                setShowRequestSearchResults(true);
            } catch (err) {
                console.error("[DIITRA] Error searching users", err);
            } finally {
                setIsRequestSearching(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [requestSearchQuery, teamChangeForm.rolPropuesto, teamChangeForm.tipo]);

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
            // NOTA: Se usan claves snake_case para que coincidan con la política global de 
            // serialización del backend (SnakeCaseLower) y se enlacen con ProductCreateDto.
            await api.post('/ResearchProducts', {
                project_uuid: resolvedProjectUuid,
                id_tipo_producto: Number(newProduct.id_tipo_producto),
                titulo: newProduct.titulo,
                cantidad: Number(newProduct.cantidad),
                url_producto: newProduct.url_producto || null,
                es_propiedad_intelectual: newProduct.es_propiedad_intelectual,
                numero_registro: newProduct.es_propiedad_intelectual ? newProduct.numero_registro : null,
                fecha_registro_senadi: newProduct.es_propiedad_intelectual && newProduct.fecha_registro_senadi ? newProduct.fecha_registro_senadi : null
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
                    puedeSolicitarCambioEquipo: res.data.puede_solicitar_cambio_equipo ?? res.data.puedeSolicitarCambioEquipo ?? false,
                    puedeFirmar: res.data.puede_firmar ?? res.data.puedeFirmar ?? res.data.PuedeFirmar ?? false,
                    puntajeEvaluacion: res.data.puntaje_evaluacion ?? res.data.puntajeEvaluacion ?? res.data.PuntajeEvaluacion ?? null
                });
                setInvestigadores((res.data.investigadores || []).map(mapInvestigador));
                
                const groupUuid = res.data.grupo_investigacion_uuid ?? res.data.grupoInvestigacionUuid ?? res.data.grupo_investigacion ?? res.data.grupoInvestigacion ?? '';
                const hasGroup = !!(res.data.tiene_grupo_investigacion ?? res.data.tieneGrupoInvestigacion ?? false) || !!groupUuid;
                setTieneGrupo(hasGroup);
                setGrupoInvestigacion(groupUuid);
                await fetchTeamChangeRequests(res.data.uuid);
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
                    puedeSolicitarCambioEquipo: false,
                    puedeFirmar: true
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

    const handleSyncGroupMembers = useCallback(async (options?: { groupUuid?: string; silent?: boolean }) => {
        const targetGroupUuid = options?.groupUuid ?? grupoInvestigacion;
        const silent = options?.silent ?? false;

        if (!targetGroupUuid) {
            if (!silent) {
                addToast("Sincronización", "Por favor seleccione un grupo de investigación adscrito primero.", "warning");
            }
            return;
        }

        const selectedGroup = approvedGroups.find(g => g.uuid === targetGroupUuid);
        if (!selectedGroup) {
            if (!silent) {
                addToast("Sincronización", "Debe seleccionar un grupo aprobado y activo de la lista institucional.", "error");
            }
            return;
        }

        setIsSyncingGroupMembers(true);
        try {
            const res = await api.get(`/groups/${selectedGroup.uuid}`);
            const groupDetail = res.data;
            const groupMembers = groupDetail.miembros || [];

            if (groupMembers.length === 0) {
                if (!silent) {
                    addToast("Sincronización", "El grupo seleccionado no tiene miembros activos registrados.", "warning");
                }
                return;
            }

            let addedCount = 0;
            setInvestigadores(prev => {
                const updatedMembers = [...prev];

                groupMembers.forEach((m: any) => {
                    const isActive = m.activo !== false;
                    if (!isActive) return;

                    const memberCedula = m.cedula?.trim();
                    if (!memberCedula) return;

                    const exists = updatedMembers.some(inv => inv.cedula?.trim() === memberCedula);
                    if (!exists) {
                        const groupRol = m.rol || "";
                        let projectRol = "Co-Investigador";
                        if (groupRol.toLowerCase().includes("coordinador") || groupRol.toLowerCase().includes("director")) {
                            const hasDirector = updatedMembers.some(inv => inv.rol?.toLowerCase().includes("director"));
                            projectRol = hasDirector ? "Co-Investigador" : "Director de Proyecto";
                        } else if (groupRol.toLowerCase().includes("estudiante") || groupRol.toLowerCase().includes("alumno") || groupRol.toLowerCase().includes("semillerista")) {
                            projectRol = "Semillerista";
                        } else if (groupRol.toLowerCase().includes("tecnico") || groupRol.toLowerCase().includes("técnico")) {
                            projectRol = "Co-Investigador";
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

                return addedCount > 0 ? updatedMembers : prev;
            });

            if (addedCount > 0) {
                addToast("Equipo actualizado", `Se importaron ${addedCount} miembro${addedCount !== 1 ? 's' : ''} del grupo automáticamente.`, "success");
            } else if (!silent) {
                addToast("Sincronización", "Todos los miembros activos de este grupo ya forman parte del equipo.", "info");
            }
        } catch (err) {
            console.error("[DIITRA] Error al sincronizar miembros del grupo", err);
            lastSyncedGroupRef.current = null;
            addToast("Error de Sincronización", "No se pudieron obtener los miembros del grupo de investigación.", "error");
        } finally {
            setIsSyncingGroupMembers(false);
        }
    }, [grupoInvestigacion, approvedGroups, addToast]);

    useEffect(() => {
        if (!grupoInvestigacion) {
            lastSyncedGroupRef.current = null;
            return;
        }
        if (!tieneGrupo || isLoading || currentProject?.puedeEditar === false) return;
        if (lastSyncedGroupRef.current === grupoInvestigacion) return;

        const selectedGroup = availableGroups.find(
            g => g.uuid === grupoInvestigacion && g.activo && g.estado === 'Aprobado'
        );
        if (!selectedGroup) return;

        lastSyncedGroupRef.current = grupoInvestigacion;
        handleSyncGroupMembers({ groupUuid: grupoInvestigacion, silent: true });
    }, [tieneGrupo, grupoInvestigacion, availableGroups, currentProject?.puedeEditar, isLoading, handleSyncGroupMembers]);

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
            // NOTA: Se usan claves snake_case (nuevo_director_cedula) para cumplir con la política
            // global de serialización SnakeCaseLower del backend y mapear a TransferDirectorRequest.
            const res = await api.post(`/projects/${currentProject.uuid}/transfer-director`, {
                nuevo_director_cedula: newDirectorCedula,
                motivo: transferMotivo,
                descripcion: transferDescripcion
            });
            if (res.data.success) {
                addToast("Transferencia Exitosa", "¡Transferencia de dirección realizada con éxito!", "success");
                setShowTransferModal(false);
                const updatedProjectRes = await api.get(`/projects/${currentProject.uuid}/detail`);
                setInvestigadores((updatedProjectRes.data.investigadores || []).map(mapInvestigador));
                
                const groupUuid = updatedProjectRes.data.grupo_investigacion_uuid ?? updatedProjectRes.data.grupoInvestigacionUuid ?? updatedProjectRes.data.grupo_investigacion ?? updatedProjectRes.data.grupoInvestigacion ?? '';
                const hasGroup = !!(updatedProjectRes.data.tiene_grupo_investigacion ?? updatedProjectRes.data.tieneGrupoInvestigacion ?? false) || !!groupUuid;
                setTieneGrupo(hasGroup);
                
                setCurrentProject((prev: any) => ({
                    ...prev,
                    tieneGrupoInvestigacion: hasGroup
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

    const resolveDocumentInstance = useCallback(async (docTemplateCode: string) => {
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
    }, [resolvedProjectUuid, subDocumentUuids, currentProject?.title, addToast]);

    // Autoresolver subdocumentos al recargar la página si están especificados en la URL
    useEffect(() => {
        if (activeDocument && resolvedProjectUuid) {
            const isPrimaryDocument = activeDocument.toUpperCase() === templateCode.toUpperCase();
            if (!isPrimaryDocument && !subDocumentUuids[activeDocument] && !resolvingDocument) {
                resolveDocumentInstance(activeDocument);
            }
        }
    }, [activeDocument, resolvedProjectUuid, templateCode, subDocumentUuids, resolvingDocument, resolveDocumentInstance]);

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
                    <button onClick={() => navigate(urlPrefix)} className="btn-vercel-primary text-xs w-full justify-center">
                        Volver a Proyectos
                    </button>
                </div>
            </div>
        );
    }

    const handleUpdateMember = (cedula: string, field: string, value: any) => {
        if (tieneGrupo && field !== 'horasSemanales') {
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

    const handleSaveTeam = async () => {
        setIsSavingTeam(true);
        setTeamMessage(null);
        try {
            if (tieneGrupo && !grupoInvestigacion) {
                addToast("Validación CACES", "Para proyectos asociativos debes seleccionar un grupo de investigación aprobado.", "warning");
                return;
            }

            // NOTA: Se usan claves snake_case (nivel_academico, horas_semanales) en el cuerpo de la 
            // solicitud para cumplir con la política SnakeCaseLower de deserialización a InvestigadorDto.
            // Los parámetros de consulta (query string) como grupoInvestigacion/tieneGrupoInvestigacion
            // se mantienen en camelCase ya que se enlazan directamente con los argumentos del controlador en C#.
            const payload = investigadores.map(inv => ({
                nombre: inv.nombre,
                cedula: inv.cedula,
                rol: inv.rol,
                nivel_academico: inv.nivelAcademico,
                telefono: inv.telefono || "",
                activo: inv.activo !== false,
                horas_semanales: inv.horasSemanales !== undefined && inv.horasSemanales !== null && inv.horasSemanales !== '' ? parseFloat(inv.horasSemanales) : null
            }));
            const res = await api.patch(`/projects/${currentProject.uuid}/team`, payload, {
                params: {
                    grupoInvestigacion: grupoInvestigacion || null,
                    tieneGrupoInvestigacion: tieneGrupo
                }
            });
            if (res.data.success) {
                addToast(
                    tieneGrupo ? "Equipo de Trabajo" : "Personal del Proyecto",
                    tieneGrupo ? "¡Equipo de trabajo guardado y sincronizado con éxito!" : "¡Personal del proyecto guardado con éxito!",
                    "success"
                );
                
                const refreshed = await api.get(`/projects/${currentProject.uuid}/detail`);
                setInvestigadores((refreshed.data.investigadores || []).map(mapInvestigador));
                
                const groupUuid = refreshed.data.grupo_investigacion_uuid ?? refreshed.data.grupoInvestigacionUuid ?? refreshed.data.grupo_investigacion ?? refreshed.data.grupoInvestigacion ?? '';
                const hasGroup = !!(refreshed.data.tiene_grupo_investigacion ?? refreshed.data.tieneGrupoInvestigacion ?? false) || !!groupUuid;
                setTieneGrupo(hasGroup);
                setGrupoInvestigacion(groupUuid);
                
                setCurrentProject((prev: any) => ({
                    ...prev,
                    tieneGrupoInvestigacion: hasGroup,
                    grupoInvestigacion: refreshed.data.grupo_investigacion ?? refreshed.data.grupoInvestigacion ?? null,
                    grupoInvestigacionUuid: refreshed.data.grupo_investigacion_uuid ?? refreshed.data.grupoInvestigacionUuid ?? null
                }));
                await fetchTeamChangeRequests(currentProject.uuid);
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
        if (!currentProject?.uuid) return;
        if (!teamChangeForm.cedulaObjetivo.trim() || !teamChangeForm.motivo.trim()) {
            addToast("Solicitud incompleta", "Debes indicar cédula objetivo y motivo de la solicitud.", "warning");
            return;
        }

        setIsSubmittingTeamChangeRequest(true);
        try {
            // NOTA: Se usan claves snake_case (cedula_objetivo, rol_propuesto, resolucion_referencia)
            // para cumplir con la política global de serialización del backend (SnakeCaseLower)
            // al mapear contra la clase TeamChangeRequestDto.
            const payload = {
                tipo: teamChangeForm.tipo,
                cedula_objetivo: teamChangeForm.cedulaObjetivo.trim(),
                rol_propuesto: teamChangeForm.tipo === 'BAJA' ? null : teamChangeForm.rolPropuesto,
                motivo: teamChangeForm.motivo.trim(),
                resolucion_referencia: teamChangeForm.resolucionReferencia.trim() || null
            };
            const res = await api.post(`/projects/${currentProject.uuid}/team-change-requests`, payload);
            if (res.data?.success) {
                addToast("Solicitud registrada", "La solicitud de cambio quedó registrada para revisión.", "success");
                setTeamChangeForm({
                    tipo: 'ALTA',
                    cedulaObjetivo: '',
                    rolPropuesto: 'Co-Investigador',
                    motivo: '',
                    resolucionReferencia: ''
                });
                setRequestSearchQuery('');
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
            // NOTA: Se usan claves snake_case (observacion_revision) para cumplir con la política
            // global de serialización del backend (SnakeCaseLower) al mapear contra la clase TeamChangeReviewDto.
            const res = await api.patch(`/projects/${currentProject.uuid}/team-change-requests/${requestUuid}/review`, {
                aprobar,
                ejecutar: aprobar,
                observacion_revision: aprobar ? "Aprobado por autoridad competente." : "Rechazado por autoridad competente."
            });
            if (res.data?.success) {
                addToast("Revisión completada", res.data.message || "Solicitud procesada.", "success");
                await fetchTeamChangeRequests(currentProject.uuid);
                const refreshed = await api.get(`/projects/${currentProject.uuid}/detail`);
                setInvestigadores((refreshed.data.investigadores || []).map(mapInvestigador));
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
                    lastSyncedGroupRef.current = null;
                }
            } else {
                setTieneGrupo(false);
                setGrupoInvestigacion('');
                lastSyncedGroupRef.current = null;
            }
        } else {
            setTieneGrupo(true);
        }
    };

    const handleCloseEditor = () => {
        setActiveDocument(null);
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
                canSign={currentProject.puedeFirmar}
            />
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-bg-deep overflow-hidden selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
            <WorkspaceHeader
                currentProject={currentProject}
                isSidebarCollapsed={isSidebarCollapsed}
                isPublishingDSpace={isPublishingDSpace}
                urlPrefix={urlPrefix}
                navigate={navigate}
                onExportCaces={async () => {
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
                onPublishDSpace={async () => {
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
            />

            <div className="flex-1 overflow-y-auto">
                <main className="max-w-[1600px] mx-auto p-4 md:p-10 animate-fade-up">
                    <WorkspaceTitle
                        currentProject={currentProject}
                        user={user}
                        templateCode={templateCode}
                        setActiveDocument={setActiveDocument}
                    />

                    {/* Layout dos columnas: contenido principal izquierda, panel info derecha */}
                    <div className="px-2 flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-3 lg:items-start">

                        {/* Columna izquierda */}
                        <div className="flex flex-col gap-3">
                            <CacesWorkflow
                                currentProject={currentProject}
                                templateCode={templateCode}
                                assignedRevisionUuid={assignedRevisionUuid}
                                assignedRevisionStatus={assignedRevisionStatus}
                                isAdmin={isAdmin}
                                iniciandoEjecucion={iniciandoEjecucion}
                                resolvingDocument={resolvingDocument}
                                urlPrefix={urlPrefix}
                                resolvedProjectUuid={resolvedProjectUuid}
                                setActiveDocument={setActiveDocument}
                                resolveDocumentInstance={resolveDocumentInstance}
                                handleIniciarEjecucion={handleIniciarEjecucion}
                                navigate={navigate}
                            />

                            <TeamManagement
                                currentProject={currentProject}
                                investigadores={investigadores}
                                tieneGrupo={tieneGrupo}
                                grupoInvestigacion={grupoInvestigacion}
                                approvedGroups={approvedGroups}
                                isSyncingGroupMembers={isSyncingGroupMembers}
                                isSavingTeam={isSavingTeam}
                                teamMessage={teamMessage}
                                teamChangeRequests={teamChangeRequests}
                                isLoadingTeamChangeRequests={isLoadingTeamChangeRequests}
                                isSubmittingTeamChangeRequest={isSubmittingTeamChangeRequest}
                                teamChangeForm={teamChangeForm}
                                setTeamChangeForm={setTeamChangeForm}
                                availableProfessors={availableProfessors}
                                setAvailableProfessors={setAvailableProfessors}
                                availableStudents={availableStudents}
                                setAvailableStudents={setAvailableStudents}
                                requestSearchQuery={requestSearchQuery}
                                setRequestSearchQuery={setRequestSearchQuery}
                                requestSearchResults={requestSearchResults}
                                isRequestSearching={isRequestSearching}
                                showRequestSearchResults={showRequestSearchResults}
                                setShowRequestSearchResults={setShowRequestSearchResults}
                                canReviewTeamChanges={canReviewTeamChanges}
                                isHistoryExpanded={isHistoryExpanded}
                                setIsHistoryExpanded={setIsHistoryExpanded}
                                onToggleTieneGrupo={handleToggleTieneGrupo}
                                onSetGrupoInvestigacion={setGrupoInvestigacion}
                                onSaveTeam={handleSaveTeam}
                                onCreateTeamChangeRequest={handleCreateTeamChangeRequest}
                                onReviewTeamChangeRequest={handleReviewTeamChangeRequest}
                                onOpenTransferModal={handleOpenTransferModal}
                                onUpdateMember={handleUpdateMember}
                                onRemoveMember={handleRemoveMember}
                                onOpenGroupDetail={handleOpenGroupDetail}
                            />

                            <ResearchProductsList
                                currentProject={currentProject}
                                products={products}
                                onOpenRegisterModal={() => setShowProductModal(true)}
                                onDeleteProduct={handleDeleteProduct}
                            />
                        </div>

                        {/* Columna derecha: info del proyecto sticky */}
                        <div className="lg:sticky lg:top-0 flex flex-col gap-3">
                            <WorkspaceSidebar
                                currentProject={currentProject}
                                resolvedProjectUuid={resolvedProjectUuid}
                                setActiveDocument={setActiveDocument}
                            />
                        </div>
                    </div>
                </main>
            </div>

            <ProductRegistrationModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                onSubmit={handleCreateProduct}
                newProduct={newProduct}
                setNewProduct={setNewProduct}
                productTypes={productTypes}
            />

            <DirectorTransferModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                onSubmit={handleConfirmTransfer}
                transferDirector={transferDirector}
                transferSearchQuery={transferSearchQuery}
                setTransferSearchQuery={setTransferSearchQuery}
                showTransferSearchResults={showTransferSearchResults}
                setShowTransferSearchResults={setShowTransferSearchResults}
                transferSearchResults={transferSearchResults}
                isTransferSearching={isTransferSearching}
                newDirectorCedula={newDirectorCedula}
                setNewDirectorCedula={setNewDirectorCedula}
                transferMotivo={transferMotivo}
                setTransferMotivo={setTransferMotivo}
                transferDescripcion={transferDescripcion}
                setTransferDescripcion={setTransferDescripcion}
                isTransferring={isTransferring}
                investigadores={investigadores}
            />

            <GroupDetailDrawer
                isOpen={isGroupDetailOpen}
                onClose={handleCloseGroupDetail}
                detailGroup={detailGroup}
                setDetailGroup={setDetailGroup}
                isAdmin={isAdmin}
                user={user}
                dominios={dominios}
                carreras={carreras}
                lines={lines}
                formatCareerName={formatCareerName}
                handleOpenReview={() => {}}
            />
        </div>
    );
};

export default ProjectWorkspace;