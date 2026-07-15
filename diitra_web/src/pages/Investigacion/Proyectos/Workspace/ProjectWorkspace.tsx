// ══════════════════════════════════════════════════════════════════════════════
// DIITRA ARCHITECTURE NOTE: DIRECTRIZ DE EXTENSIBILIDAD DE TRABAJO (DECISIÓN DE DISEÑO)
// ══════════════════════════════════════════════════════════════════════════════
//
// TODO: WORKFLOW DE REVISIÓN INTEGRAL (ESTADO: COMPLETADO)
// - `[x]` Ejecutar script SQL `update_workflow_transitions.sql` en base de datos.
// - `[x]` Modificar backend C# (`PeerReviewService.cs`): limitar asignación a estado "En Revisión" y remover transición automática.
// - `[x]` Modificar frontend TypeScript (`CacesWorkflow.tsx`): ampliar a 5 fases e indexación.
// - `[x]` Modificar frontend TypeScript (`ProjectWorkspace.tsx`): implementar Panel de Revisión del Administrador y banners informativos.
// - `[x]` Modificar `RevisionTecnicaPage.tsx`: agregar selector de modo de vista (PDF vs Interactivo).
// - `[x]` Diseñar formulario estructurado de lectura en el panel izquierdo con burbujas de comentarios.
// - `[x]` Diseñar panel "Observación Contextual" a la derecha (cabecera, historial, input, Speech-to-Text y enviar).
// - `[x]` Integrar la Web Speech API para reconocimiento de voz en tiempo real.
// - `[x]` Guardar y concatenar los comentarios por sección en la transición final.
// - `[x]` Probar el flujo completo de extremo a extremo.
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
import { Shield, Check, RotateCcw } from 'lucide-react';
import api from '../../../../api/axios_config';
import { useAuth } from '../../../../api/AuthContext';
import { useNotifications } from '../../../../api/NotificationsContext';
import { useConfirm } from '../../../../api/ConfirmContext';
import { iniciarEjecucion } from '../../../../services/peerReviewService';
import DocumentEditor from '../Wizard/DocumentEditor';
import {
    buildWorkspacePath,
    editParamToTemplateCode,
    isLegacyEditParam,
    isLegacyTemplateUrlSegment,
    slugToTemplateCode,
    templateCodeToEditParam,
} from '../../../../core/documents/templateUrl';

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
    const sectionParam = queryParams.get('section');
    const activeDocument = editParam
        ? editParamToTemplateCode(editParam, templateCode)
        : (sectionParam ? templateCode : null);

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

    useEffect(() => {
        if (!editParam || !isLegacyEditParam(editParam)) return;
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('edit', templateCodeToEditParam(editParamToTemplateCode(editParam, templateCode)));
        navigate({ search: searchParams.toString() }, { replace: true });
    }, [editParam, templateCode, location.search, navigate]);

    const [currentProject, setCurrentProject] = useState<any>(null);
    const isPreproposalState = currentProject?.status === 'Prepropuesta' || currentProject?.status === 'Prepropuesta Rechazada';
    const [isLoading, setIsLoading] = useState(true);
    const [adminObservation, setAdminObservation] = useState('');
    const [isSubmittingAdminReview, setIsSubmittingAdminReview] = useState(false);

    const setActiveDocument = useCallback((doc: string | null) => {
        const searchParams = new URLSearchParams(location.search);
        if (doc) {
            searchParams.set('edit', templateCodeToEditParam(doc));
        } else {
            searchParams.delete('edit');
            searchParams.delete('section');
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
    const [isChangeRequestsExpanded, setIsChangeRequestsExpanded] = useState(false);
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
    const [editTitulo, setEditTitulo] = useState('');
    const [editDescripcion, setEditDescripcion] = useState('');
    const [isSavingPreproposal, setIsSavingPreproposal] = useState(false);
    const [trazabilidad, setTrazabilidad] = useState<any[]>([]);
    const [isLoadingTrazabilidad, setIsLoadingTrazabilidad] = useState(false);

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

    const fetchGroups = useCallback(async () => {
        try {
            const params: any = {};
            if (!isAdmin && user?.id_referencia) {
                params.memberCedula = user.id_referencia;
            }
            const res = await api.get('/groups', { params });
            setAvailableGroups(res.data || []);
        } catch (err) {
            console.error("[DIITRA] Error al cargar grupos de investigación", err);
        }
    }, [isAdmin, user]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

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

        // Catálogos globales: no dependen del resolvedProjectUuid, se cargan en paralelo
        resolveUuid();
        fetchProductTypes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const fetchTeamChangeRequests = useCallback(async (projectUuid?: string) => {
        const uuidToUse = projectUuid || currentProject?.uuid || resolvedProjectUuid;
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
    }, [currentProject?.uuid, resolvedProjectUuid]);

    useEffect(() => {
        if (resolvedProjectUuid && !isPreproposalState) {
            fetchProducts(resolvedProjectUuid);
        }
    }, [resolvedProjectUuid, activeDocument, isPreproposalState]);

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
        if (resolvedProjectUuid && isChangeRequestsExpanded) {
            fetchAvailableUsers();
        }
    }, [resolvedProjectUuid, isChangeRequestsExpanded]);

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
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
        } catch (e: any) {
            addToast("Error al Iniciar Ejecución", e?.response?.data?.message ?? 'No se pudo iniciar la ejecución.', "error");
        } finally {
            setIniciandoEjecucion(false);
        }
    };

    const fetchProject = useCallback(async () => {
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
            const directorObj = (res.data.investigadores || []).find((inv: any) =>
                inv.rol?.toLowerCase().includes('director') || inv.rol?.toLowerCase().includes('principal')
            );
            const directorNombre = directorObj
                ? (directorObj.nombres_completos || directorObj.nombresCompletos || `${directorObj.nombre || ''} ${directorObj.apellido || ''}`.trim())
                : '';

            setCurrentProject({
                id: res.data.uuid.substring(0, 8).toUpperCase(),
                uuid: res.data.uuid,
                title: res.data.titulo?.trim() || '(Sin título)',
                status: res.data.estado || 'Borrador',
                presupuesto: res.data.costo_total || 0,
                linea: res.data.linea_investigacion || 'No definida',
                directorProyecto: directorNombre,
                puedeEditar: (res.data.puede_editar ?? res.data.puedeEditar ?? res.data.PuedeEditar ?? false) &&
                    (res.data.estado === 'Borrador' || res.data.estado === 'En Corrección' || res.data.estado === 'Prepropuesta' || res.data.estado === 'Prepropuesta Rechazada'),
                puedeSolicitarCambioEquipo: res.data.puede_solicitar_cambio_equipo ?? res.data.puedeSolicitarCambioEquipo ?? false,
                puedeFirmar: res.data.puede_firmar ?? res.data.puedeFirmar ?? res.data.PuedeFirmar ?? false,
                puntajeEvaluacion: res.data.puntaje_evaluacion ?? res.data.puntajeEvaluacion ?? res.data.PuntajeEvaluacion ?? null,
                grupoInvestigacion: res.data.grupo_investigacion || res.data.grupoInvestigacion || '',
                grupoInvestigacionUuid: res.data.grupo_investigacion_uuid || res.data.grupoInvestigacionUuid || '',
                tieneGrupoInvestigacion: !!(res.data.tiene_grupo_investigacion ?? res.data.tieneGrupoInvestigacion ?? false) || !!(res.data.grupo_investigacion_uuid || res.data.grupoInvestigacionUuid),
                dominio: res.data.dominio || '',
                descripcion: res.data.descripcion_proyecto || res.data.descripcionProyecto || '',
                carrera: res.data.carrera || '',
                convocatoria: res.data.convocatoria_titulo || res.data.convocatoriaTitulo || '',
                convocatoriaMontoMaximo: res.data.convocatoria_monto_maximo ?? res.data.convocatoriaMontoMaximo ?? res.data.ConvocatoriaMontoMaximo ?? null
            });
            setInvestigadores((res.data.investigadores || []).map(mapInvestigador));

            const groupUuid = res.data.grupo_investigacion_uuid ?? res.data.grupoInvestigacionUuid ?? res.data.grupo_invest_uuid ?? res.data.grupoInvestigacion ?? '';
            const hasGroup = !!(res.data.tiene_grupo_investigacion ?? res.data.tieneGrupoInvestigacion ?? false) || !!groupUuid;
            setTieneGrupo(hasGroup);
            setGrupoInvestigacion(groupUuid);
            if (res.data.estado !== 'Prepropuesta' && res.data.estado !== 'Prepropuesta Rechazada') {
                await fetchTeamChangeRequests(res.data.uuid);
            }
        } else if (isNotFound) {
            // Solo permitimos el fallback si es un 404 real (creando nuevo borrador)
            setCurrentProject({
                id: resolvedProjectUuid?.substring(0, 8).toUpperCase() || 'NEW',
                uuid: resolvedProjectUuid || '',
                title: 'Nuevo Proyecto de Investigación',
                status: 'Borrador',
                presupuesto: 0,
                linea: 'No definida',
                directorProyecto: user?.nombres_completos || user?.nombre || '',
                puedeEditar: true,
                puedeSolicitarCambioEquipo: false,
                puedeFirmar: true,
                grupoInvestigacion: '',
                grupoInvestigacionUuid: '',
                tieneGrupoInvestigacion: false,
                dominio: ''
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
    }, [resolvedProjectUuid, fetchTeamChangeRequests]);

    useEffect(() => {
        fetchProject();

        const handleProjectsChanged = () => {
            console.log("[DIITRA] Evento diitra-projects-changed capturado. Recargando datos del proyecto...");
            fetchProject();
        };

        window.addEventListener('diitra-projects-changed', handleProjectsChanged);
        return () => {
            window.removeEventListener('diitra-projects-changed', handleProjectsChanged);
        };
    }, [fetchProject, activeDocument]);

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
        const fetchTrazabilidad = async () => {
            if (!resolvedProjectUuid) return;
            setIsLoadingTrazabilidad(true);
            try {
                const res = await api.get(`/projects/${resolvedProjectUuid}/traceability`);
                setTrazabilidad(res.data || []);
            } catch (e) {
                console.error("Error al cargar la trazabilidad", e);
            } finally {
                setIsLoadingTrazabilidad(false);
            }
        };
        fetchTrazabilidad();
    }, [resolvedProjectUuid]);

    useEffect(() => {
        if (currentProject) {
            setEditTitulo(currentProject.title || '');
            setEditDescripcion(currentProject.descripcion || '');
        }
    }, [currentProject]);

    const handleGuardarYReenviar = async (nuevoTitulo: string, nuevaDescripcion: string) => {
        if (!nuevoTitulo.trim()) {
            addToast("Validación", "El título de la prepropuesta es obligatorio.", "warning");
            return;
        }
        if (!nuevaDescripcion.trim()) {
            addToast("Validación", "La descripción de la prepropuesta es obligatoria.", "warning");
            return;
        }

        setIsSavingPreproposal(true);
        try {
            const docInstanceRes = await api.get(`/documents/instances/resolve`, {
                params: {
                    templateCode: 'PROTOCOLO_INVESTIGACION',
                    entityUuid: resolvedProjectUuid
                }
            });
            const pInstanceUuid = docInstanceRes.data?.uuid || docInstanceRes.data?.Uuid;
            if (!pInstanceUuid) throw new Error("No se pudo resolver el expediente del protocolo.");

            const instanceRes = await api.get(`/documents/instances/${pInstanceUuid}`);
            const currentMetadata = instanceRes.data?.data_snapshot_json
                ? JSON.parse(instanceRes.data.data_snapshot_json)
                : {};

            const updatedMetadata = {
                ...currentMetadata,
                Titulo: nuevoTitulo.trim().toUpperCase(),
                DescripcionProyecto: nuevaDescripcion.trim(),
                Estado: 'Prepropuesta'
            };

            await api.patch(`/documents/instances/${pInstanceUuid}/metadata`, updatedMetadata);

            await api.post(`/projects/${currentProject.uuid}/transition?newState=Prepropuesta&observation=${encodeURIComponent("Reenvío de prepropuesta corregida")}`);

            addToast("Reenvío Exitoso", "Su prepropuesta ha sido corregida y reenviada para revisión.", "success");
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            await fetchProject();
        } catch (e: any) {
            console.error("Error al reenviar prepropuesta", e);
            addToast("Error al Reenviar", e.response?.data?.message || "Ocurrió un error al intentar reenviar la prepropuesta.", "error");
        } finally {
            setIsSavingPreproposal(false);
        }
    };

    const handleAdminAprobarPrepropuesta = async () => {
        if (!currentProject?.uuid) return;
        if (!await confirm({
            title: "Aprobar Prepropuesta",
            message: `¿Está seguro de aprobar la idea del proyecto "${currentProject.title}"? Esto habilitará al docente para iniciar la formulación completa.`,
            confirmText: "Aprobar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;

        setIsSubmittingAdminReview(true);
        try {
            const obs = adminObservation.trim() || "Idea de proyecto aprobada por Dirección de Investigación";
            await api.post(`/projects/${currentProject.uuid}/transition?newState=Borrador&observation=${encodeURIComponent(obs)}`);
            addToast("Idea Aprobada", "La prepropuesta ha sido aprobada con éxito. Se ha notificado al docente.", "success");
            setAdminObservation('');
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            await fetchProject();
        } catch (e: any) {
            console.error("Error al aprobar prepropuesta", e);
            addToast("Error", e.response?.data?.message || "Ocurrió un error al intentar aprobar la prepropuesta.", "error");
        } finally {
            setIsSubmittingAdminReview(false);
        }
    };

    const handleAdminDevolverPrepropuesta = async () => {
        if (!currentProject?.uuid) return;
        if (!adminObservation.trim()) {
            addToast("Validación", "Debe ingresar una observación detallando los motivos de la devolución.", "warning");
            return;
        }
        if (!await confirm({
            title: "Devolver Prepropuesta",
            message: "¿Está seguro de devolver esta prepropuesta al docente para correcciones?",
            confirmText: "Devolver",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;

        setIsSubmittingAdminReview(true);
        try {
            await api.post(`/projects/${currentProject.uuid}/transition?newState=Prepropuesta%20Rechazada&observation=${encodeURIComponent(adminObservation.trim())}`);
            addToast("Prepropuesta Devuelta", "La prepropuesta ha sido devuelta al docente con sus observaciones.", "success");
            setAdminObservation('');
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
            await fetchProject();
        } catch (e: any) {
            console.error("Error al devolver prepropuesta", e);
            addToast("Error", e.response?.data?.message || "Ocurrió un error al intentar devolver la prepropuesta.", "error");
        } finally {
            setIsSubmittingAdminReview(false);
        }
    };

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

            // Consultar disponibilidad y horas asignadas en paralelo para cada miembro activo del grupo
            const memberHoursMap: Record<string, { horasDisponibles: number, horasAsignadas: number }> = {};
            const activeMembers = groupMembers.filter((m: any) => m.activo !== false && m.cedula?.trim());

            if (activeMembers.length > 0) {
                await Promise.all(activeMembers.map(async (m: any) => {
                    const ced = m.cedula.trim();
                    try {
                        const searchRes = await api.get(`/catalogs/search-users`, {
                            params: { q: ced }
                        });
                        const found = (searchRes.data || []).find((u: any) => u.cedula === ced);
                        if (found) {
                            memberHoursMap[ced] = {
                                horasDisponibles: found.horasDisponibles ?? found.horas_disponibles ?? 0,
                                horasAsignadas: found.horasAsignadas ?? found.horas_asignadas ?? 0
                            };
                        }
                    } catch (e) {
                        console.error("[DIITRA] Error al consultar capacidad de miembro: " + ced, e);
                    }
                }));
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

                        const hoursData = memberHoursMap[memberCedula] || { horasDisponibles: 0, horasAsignadas: 0 };

                        updatedMembers.push({
                            nombre: m.nombre_completo || m.nombreCompleto || "Desconocido",
                            cedula: memberCedula,
                            rol: projectRol,
                            nivelAcademico: "Tercer Nivel",
                            telefono: "",
                            horasSemanales: 0,
                            horasDisponibles: hoursData.horasDisponibles,
                            horasAsignadas: hoursData.horasAsignadas,
                            carrera: m.carrera || ""
                        });
                        addedCount++;
                    }
                });

                return addedCount > 0 ? updatedMembers : prev;
            });

            if (addedCount > 0 && !silent) {
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

        const preloadedData = { Uuid: editorUuid };

        return (
            <DocumentEditor
                templateCode={activeDocument}
                initialData={preloadedData}
                entityUuid={resolvedProjectUuid || undefined}
                onClose={handleCloseEditor}
                readOnly={isReadOnly}
                readOnlyReason={readOnlyReason}
                projectStatus={currentProject.status}
                canSign={currentProject.puedeFirmar}
            />
        );
    }


    const ultimaObservacion = isLoadingTrazabilidad
        ? "Cargando observaciones..."
        : (trazabilidad.find(t => t.estadoNuevo === 'Prepropuesta Rechazada' || t.EstadoNuevo === 'Prepropuesta Rechazada')?.observacion || 'Sin observaciones especificadas.');

    if (isPreproposalState) {
        if (isAdmin) {
            // PANTALLA PERSONALIZADA PARA EL ADMINISTRADOR (EVALUACIÓN Y TRAZABILIDAD)
            return (
                <div className="h-screen w-full flex flex-col bg-bg-deep overflow-y-auto pb-20 selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
                    <WorkspaceHeader
                        currentProject={currentProject}
                        isSidebarCollapsed={isSidebarCollapsed}
                        isPublishingDSpace={false}
                        urlPrefix={urlPrefix}
                        navigate={navigate}
                        onExportCaces={() => { }}
                        onPublishDSpace={() => { }}
                    />

                    <main className="max-w-6xl mx-auto p-6 md:p-12 animate-fade-up w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Panel Izquierdo: Contenido de la Prepropuesta */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bento-card p-8 space-y-6 rounded-2xl border border-border-thin shadow-sm bg-surface">
                                <div className="border-b border-border pb-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Detalle de la Prepropuesta</h3>
                                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Convocatoria: {currentProject.convocatoria || 'No especificada'}</p>
                                    </div>
                                    <span className="text-[9px] font-bold bg-brand/10 border border-brand/20 text-brand px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                                        Fase de Idea
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Carrera / Unidad Postulante</label>
                                        <div className="input-vercel opacity-70 bg-bg-deep select-none">{currentProject.carrera || 'No definida'}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Tema / Título de la Investigación</label>
                                        <div className="input-vercel opacity-80 bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[50px] !h-auto font-bold uppercase">{currentProject.title}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Descripción / Justificación detallada</label>
                                        <div className="input-vercel opacity-80 bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[150px] !h-auto text-xs leading-relaxed">{currentProject.descripcion || 'Sin descripción ingresada.'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel Derecho: Panel de Evaluación o Historial */}
                        <div className="space-y-6">
                            {currentProject.status === 'Prepropuesta' ? (
                                <div className="bento-card p-8 rounded-2xl border border-brand/20 bg-brand/[0.01] shadow-md space-y-6">
                                    <div className="border-b border-border pb-4">
                                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                            Panel de Evaluación
                                        </h3>
                                        <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-1">Revisión de Idea de Investigación</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Observaciones / Retroalimentación</label>
                                            <textarea
                                                value={adminObservation}
                                                onChange={(e) => setAdminObservation(e.target.value)}
                                                placeholder="Ingrese las observaciones sobre el tema o justificación de la idea..."
                                                className="input-vercel !h-32 !text-xs resize-none"
                                            />
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <button
                                                onClick={handleAdminAprobarPrepropuesta}
                                                disabled={isSubmittingAdminReview}
                                                className="w-full flex items-center justify-center gap-2 btn-vercel-primary py-3 px-6 text-xs font-bold uppercase tracking-wider"
                                            >
                                                <Check size={14} />
                                                Aprobar Prepropuesta
                                            </button>

                                            <button
                                                onClick={handleAdminDevolverPrepropuesta}
                                                disabled={isSubmittingAdminReview || !adminObservation.trim()}
                                                className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-error/10 text-error border border-error/30 hover:border-error/50 rounded-lg py-3 px-6 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <RotateCcw size={14} />
                                                Devolver al Docente
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bento-card p-8 rounded-2xl border border-border-thin shadow-sm space-y-6 bg-surface">
                                    <div className="border-b border-border pb-4">
                                        <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                            <RotateCcw size={16} className="text-error" />
                                            Prepropuesta Devuelta
                                        </h3>
                                        <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-1">Esperando Correcciones</p>
                                    </div>

                                    <div className="bg-error/[0.02] border border-error/20 p-4 rounded-xl space-y-2">
                                        <h4 className="text-[10px] font-bold text-error uppercase tracking-wider">Última Observación Enviada:</h4>
                                        <p className="text-xs text-text-main italic font-mono leading-relaxed break-words">{ultimaObservacion}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Línea de Tiempo del Estado</label>
                                        {isLoadingTrazabilidad ? (
                                            <div className="text-[10px] text-text-dim animate-pulse pl-2 font-mono">Cargando historial...</div>
                                        ) : trazabilidad.length === 0 ? (
                                            <div className="text-[10px] text-text-dim italic pl-2">Sin transiciones registradas.</div>
                                        ) : (
                                            <div className="space-y-4 pl-2 border-l border-border-thin ml-2">
                                                {trazabilidad.map((item: any, index: number) => {
                                                    const statusName = String(item.estadoNuevo ?? item.EstadoNuevo ?? 'Estado Desconocido');
                                                    const dateStr = item.fechaTransicion ?? item.FechaTransicion;
                                                    const formattedDate = dateStr ? new Date(dateStr).toLocaleString('es-EC') : '';
                                                    const observationText = String(item.observacion ?? item.Observacion ?? '');
                                                    const isErrorState = statusName.toLowerCase().includes('rechazado') || statusName.toLowerCase().includes('devuelto');

                                                    return (
                                                        <div key={index} className="relative">
                                                            <div className={`absolute -left-[13px] top-1.5 w-1.5 h-1.5 rounded-full ${isErrorState ? 'bg-error animate-pulse' : 'bg-success'
                                                                }`} />
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-text-main uppercase tracking-widest">{statusName}</p>
                                                                {formattedDate && <p className="text-[8px] text-text-dim font-mono">{formattedDate}</p>}
                                                                {observationText && (
                                                                    <p className="text-[10px] text-text-dim italic bg-bg-deep p-2 rounded border border-border-thin mt-1 break-words font-mono">
                                                                        {observationText}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            );
        }

        // PANTALLA PERSONALIZADA PARA EL DOCENTE/AUTOR
        return (
            <div className="h-screen w-full flex flex-col bg-bg-deep overflow-y-auto pb-20 selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
                <WorkspaceHeader
                    currentProject={currentProject}
                    isSidebarCollapsed={isSidebarCollapsed}
                    isPublishingDSpace={false}
                    urlPrefix={urlPrefix}
                    navigate={navigate}
                    onExportCaces={() => { }}
                    onPublishDSpace={() => { }}
                />

                <main className="max-w-4xl mx-auto p-6 md:p-12 space-y-8 animate-fade-up w-full">
                    {/* Banner de Revisión */}
                    {currentProject.status === 'Prepropuesta' && (
                        <div className="bento-card border-brand/35 bg-brand/[0.03] p-6 flex items-start gap-4 rounded-2xl shadow-sm">
                            <Shield className="text-brand shrink-0 mt-0.5" size={24} />
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-bold text-text-main uppercase tracking-wider">Idea de Proyecto en Revisión</h4>
                                <p className="text-xs text-text-dim leading-relaxed">
                                    Su propuesta de idea de investigación está bajo análisis del Departamento de Investigación e Innovación.
                                    Se le notificará en cuanto sea aprobada para proceder con el protocolo completo.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Banner de Devolución */}
                    {currentProject.status === 'Prepropuesta' ? null : (
                        <div className="bento-card border-error/30 bg-error/[0.03] p-6 flex flex-col gap-4 rounded-2xl shadow-sm">
                            <div className="flex items-start gap-4">
                                <Shield className="text-error shrink-0 mt-0.5" size={24} />
                                <div className="space-y-1.5 flex-1">
                                    <h4 className="text-sm font-bold text-error uppercase tracking-wider">Prepropuesta Devuelta / Rechazada</h4>
                                    <p className="text-xs text-text-dim leading-relaxed">
                                        Su propuesta ha sido devuelta por la Dirección de Investigación con observaciones.
                                        Corrija el tema y la descripción en el formulario a continuación y reenvíe la prepropuesta para su revisión.
                                    </p>
                                </div>
                            </div>
                            <div className="border-t border-error/20 pt-3 pl-10">
                                <p className="text-[10px] font-bold text-error uppercase tracking-wider">Observaciones del Administrador:</p>
                                <p className="text-xs text-text-main font-medium italic mt-1 font-mono break-words">{ultimaObservacion}</p>
                            </div>
                        </div>
                    )}

                    {/* Formulario */}
                    <div className="bento-card p-8 space-y-6 rounded-2xl border border-border-thin shadow-sm">
                        <div className="border-b border-border pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Datos de la Prepropuesta</h3>
                                <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Convocatoria: {currentProject.convocatoria || 'No especificada'}</p>
                            </div>
                            {!currentProject.puedeEditar && (
                                <span className="text-[9px] font-bold bg-surface border border-border-thin text-text-dim px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    Modo Lectura
                                </span>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Carrera / Unidad Postulante</label>
                                <div className="input-vercel opacity-70 bg-bg-deep select-none">{currentProject.carrera || 'No definida'}</div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Tema / Título de la Investigación</label>
                                {currentProject.status === 'Prepropuesta Rechazada' && currentProject.puedeEditar ? (
                                    <textarea
                                        value={editTitulo}
                                        onChange={(e) => setEditTitulo(e.target.value.toUpperCase())}
                                        className="input-vercel !h-20 !font-bold !text-xs uppercase resize-none"
                                    />
                                ) : (
                                    <div className="input-vercel opacity-80 bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[50px] !h-auto font-bold uppercase">{currentProject.title}</div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Descripción / Justificación detallada</label>
                                {currentProject.status === 'Prepropuesta Rechazada' && currentProject.puedeEditar ? (
                                    <div className="space-y-1.5">
                                        <textarea
                                            value={editDescripcion}
                                            onChange={(e) => setEditDescripcion(e.target.value)}
                                            className="input-vercel !h-40 !text-xs resize-none"
                                        />
                                        <div className="text-[9px] text-text-dim/60 ml-1 flex justify-end">
                                            <span>Caracteres ingresados: {editDescripcion.length}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="input-vercel opacity-80 bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[100px] !h-auto text-xs">{currentProject.descripcion || 'Sin descripción ingresada.'}</div>
                                )}
                            </div>
                        </div>

                        {currentProject.status === 'Prepropuesta Rechazada' && currentProject.puedeEditar && (
                            <div className="pt-4 border-t border-border flex justify-end">
                                <button
                                    onClick={() => handleGuardarYReenviar(editTitulo, editDescripcion)}
                                    disabled={isSavingPreproposal || !editDescripcion.trim() || !editTitulo.trim()}
                                    className="btn-vercel-primary py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingPreproposal ? "Guardando..." : "Corregir y Reenviar Prepropuesta"}
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
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
                                isChangeRequestsExpanded={isChangeRequestsExpanded}
                                setIsChangeRequestsExpanded={setIsChangeRequestsExpanded}
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
                                isAdmin={isAdmin}
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
                handleOpenReview={() => { }}
            />
        </div>
    );
};

export default ProjectWorkspace;
