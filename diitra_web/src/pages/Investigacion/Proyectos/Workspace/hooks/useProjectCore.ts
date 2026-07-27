import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../../../../api/axios_config';
import { useAuth } from '../../../../../api/AuthContext';
import { useNotifications } from '../../../../../api/NotificationsContext';
import { useConfirm } from '../../../../../api/ConfirmContext';
import { iniciarEjecucion } from '../../../../../services/peerReviewService';
import {
    buildWorkspacePath,
    editParamToTemplateCode,
    isLegacyEditParam,
    isLegacyTemplateUrlSegment,
    slugToTemplateCode,
    templateCodeToEditParam,
} from '../../../../../core/documents/templateUrl';

export const mapInvestigador = (inv: any) => {
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

export function useProjectCore() {
    const { projectUuid, templateCode: templateSlug } = useParams<{ projectUuid: string; templateCode: string }>();
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
        if (!templateSlug || !projectUuid || !isLegacyTemplateUrlSegment(templateSlug)) return;
        navigate(buildWorkspacePath(templateCode, projectUuid, location.search, urlPrefix), { replace: true });
    }, [templateSlug, templateCode, projectUuid, location.search, navigate, urlPrefix]);

    useEffect(() => {
        if (!editParam || !isLegacyEditParam(editParam)) return;
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('edit', templateCodeToEditParam(editParamToTemplateCode(editParam, templateCode)));
        navigate({ search: searchParams.toString() }, { replace: true });
    }, [editParam, templateCode, location.search, navigate]);

    const [currentProject, setCurrentProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [resolvedProjectUuid, setResolvedProjectUuid] = useState<string | null>(projectUuid || null);
    const [subDocumentUuids, setSubDocumentUuids] = useState<Record<string, string>>({});
    const [resolvingDocument, setResolvingDocument] = useState<string | null>(null);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [isNotFound, setIsNotFound] = useState(false);
    const [assignedRevisionUuid, setAssignedRevisionUuid] = useState<string | null>(null);
    const [assignedRevisionStatus, setAssignedRevisionStatus] = useState<string | null>(null);
    const [iniciandoEjecucion, setIniciandoEjecucion] = useState(false);
    const [isPublishingDSpace, setIsPublishingDSpace] = useState(false);

    const isPreproposalState = currentProject?.status === 'Prepropuesta' || currentProject?.status === 'Prepropuesta Rechazada';

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

    useEffect(() => {
        if (projectUuid) {
            setResolvedProjectUuid(projectUuid);
        }
    }, [projectUuid]);

    const fetchProject = useCallback(async (onProjectFetched?: (data: any) => void) => {
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

            const projectData = {
                id: res.data.uuid.substring(0, 8).toUpperCase(),
                uuid: res.data.uuid,
                title: res.data.titulo?.trim() || '(Sin título)',
                status: res.data.estado || 'Borrador',
                presupuesto: res.data.costoTotal ?? res.data.costo_total ?? res.data.CostoTotal ?? 0,
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
            };
            setCurrentProject(projectData);
            setIsNotFound(false);
            if (onProjectFetched) {
                onProjectFetched(res.data);
            }
        } else if (isNotFound) {
            setIsNotFound(true);
            setCurrentProject(null);
            if (onProjectFetched) {
                onProjectFetched(null);
            }
        } else {
            setIsUnauthorized(true);
        }
        setIsLoading(false);
    }, [resolvedProjectUuid, user]);

    useEffect(() => {
        const checkPeerReviews = async () => {
            if (!resolvedProjectUuid || !user) return;
            try {
                const res = await api.get(`/PeerReviews/project/${resolvedProjectUuid}`);
                const data = res.data;
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
    }, [resolvedProjectUuid, subDocumentUuids, currentProject?.title, addToast, setActiveDocument]);

    useEffect(() => {
        if (activeDocument && resolvedProjectUuid) {
            const isPrimaryDocument = activeDocument.toUpperCase() === templateCode.toUpperCase();
            const needsResolve = !isPrimaryDocument 
                ? !subDocumentUuids[activeDocument] 
                : !subDocumentUuids[activeDocument]; // El principal ahora también se resuelve dinámicamente

            if (needsResolve && !resolvingDocument) {
                resolveDocumentInstance(activeDocument);
            }
        }
    }, [activeDocument, resolvedProjectUuid, templateCode, subDocumentUuids, resolvingDocument, resolveDocumentInstance, projectUuid]);

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
            setCurrentProject((prev: any) => ({
                ...prev,
                status: res.data.estado || 'En Ejecución',
                codigoInstitucional: res.data.codigo_institucional,
            }));
            addToast("Inicio de Ejecución", "Se ha iniciado la fase de ejecución exitosamente.", "success");
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
        } catch (e: any) {
            addToast("Error al Iniciar Ejecución", e?.response?.data?.message ?? 'No se pudo iniciar la ejecución.', "error");
        } finally {
            setIniciandoEjecucion(false);
        }
    };

    return {
        projectUuid,
        templateSlug,
        templateCode,
        user,
        isAdmin,
        roles,
        navigate,
        location,
        urlPrefix,
        activeDocument,
        setActiveDocument,
        isSidebarCollapsed,
        currentProject,
        setCurrentProject,
        isLoading,
        resolvedProjectUuid,
        subDocumentUuids,
        resolvingDocument,
        isUnauthorized,
        isNotFound,
        assignedRevisionUuid,
        assignedRevisionStatus,
        iniciandoEjecucion,
        isPublishingDSpace,
        setIsPublishingDSpace,
        isPreproposalState,
        fetchProject,
        resolveDocumentInstance,
        handleIniciarEjecucion
    };
}
