import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Users, DollarSign, Calendar, Target, CheckSquare, BarChart, Library, Award, Shield } from 'lucide-react';

import api from '../../../../api/axios_config';
import { useAuth } from '../../../../api/AuthContext';
import { useNotifications } from '../../../../api/NotificationsContext';
import { useTemplatePublishedListener } from '../../../../core/events/templateEvents';

// ── DIITRA CoWork — importar SOLO desde el índice público ────────
import { useCoWork, coworkUserFromAuth } from '../../../../core/cowork';
import { coworkLog } from '../../../../core/cowork/utils/log';
import { FullscreenLoader } from '../../../../components/Common/FullscreenLoader';


// ── DIITRA Documents ─────────────────────────────────────────────
import { useDIITRADocument } from '../../../../core/documents/hooks/useDIITRADocument';
import { DocumentTemplateRegistry } from '../../../../core/documents/registry/DocumentTemplateRegistry';
import { getDocumentSection, COMPONENT_MAP } from '../../../../core/documents/registry/DocumentComponentRegistry';

import DIITRABuilderShell from '../../../../components/DIITRA/DIITRABuilderShell';
import { buildWorkspacePath, templateCodeToEditParam } from '../../../../core/documents/templateUrl';

/**
 * Mapa de nombres de íconos (string del Registry) → componentes Lucide.
 * Esto permite que el DocumentTemplateRegistry sea puro JSON sin importar
 * módulos de React.
 */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
    BookOpen, FileText, Users, DollarSign, Calendar, Target, CheckSquare, BarChart, Library, Award, Shield
};

/**
 * Campos que son string? en ProyectoDto y deben enviarse siempre como cadena al backend.
 * Yjs puede convertir textos numéricos (ej: "2025") a Number al leerlos del documento colaborativo,
 * lo que rompería la deserialización de string? en C# con System.Text.Json.
 */
const PROTOCOLO_STRING_FIELDS: ReadonlyArray<string> = [
    'Titulo', 'Estado', 'CodigoInstitucional', 'Programa', 'GrupoInvestigacion',
    'GrupoInvestigacionUuid', 'GrupoInvestigacionTipo', 'GrupoInvestigacionNombre',
    'Dominio', 'LineaInvestigacion', 'SublineaInvestigacion', 'TipoInvestigacion',
    'CampoAmplio', 'CampoEspecifico', 'CampoDetallado', 'Carrera', 'PeriodoConvocatoria',
    'TiempoEjecucion', 'DirectorProyecto', 'FechaPresentacion', 'FechaInicioEstimada',
    'FechaFinEstimada', 'Periodo', 'FechaInicio', 'FechaFin', 'Antecedentes',
    'DescripcionProyecto', 'Justificacion', 'ObjetivoGeneral', 'Ods', 'MarcoTeorico',
    'Metodologia', 'Evaluacion', 'FuenteFinanciamiento', 'NombreOtraFuente',
    'NombreDirectorFirma', 'CargoDirectorFirma', 'NombreCoordinadorFirma',
    'CargoCoordinadorFirma', 'IdDspaceHandle', 'MetadataCacesJson',
] as const;

// ─────────────────────────────────────────────────────────────────
// DOCUMENT EDITOR — ARQUITECTURA DIITRA V1.0 (Workspace Colaborativo)
// ─────────────────────────────────────────────────────────────────
//
// RESPONSABILIDADES:
//   1. Resolver la configuración de la plantilla (Registry local > Backend dinámico)
//   2. Cargar catálogos institucionales (carreras, convocatorias, tipos de producto)
//   3. Instanciar useCoWork() con los datos del usuario autenticado  ← NUEVO V1.0
//   4. Instanciar useDIITRADocument() con el ydoc reactivo           ← NUEVO V1.0
//   5. Pasar el CoWorkHandle al DIITRABuilderShell como prop         ← NUEVO V1.0
//   6. Resolver los componentes de sección via DocumentComponentRegistry ← NUEVO V1.0
//
// SEPARACIÓN DE CAPAS:
//   DocumentTemplateRegistry → "qué campos y secciones existen" (puro JSON)
//   DocumentComponentRegistry → "qué componente renderiza cada sección" (solo UI)
//   useDIITRADocument → estado local + sincronización Yjs
//   useCoWork → canal de colaboración en tiempo real
//   DIITRABuilderShell → marco visual (auto-save, PDF, firma)
//
// GUÍA DE ESCALABILIDAD PARA NUEVOS DOCUMENTOS (CACES/SENESCYT):
//   Para crear cualquier nuevo documento oficial (ej. Acta de Ética, Informe de Progreso):
//   1. CERO CÓDIGO OPERATIVO: No crees nuevas vistas o formularios complejos.
//   2. REGISTRO JSON: Añade una nueva entrada JSON en `DocumentTemplateRegistry` definiendo
//      sus campos, secciones, campos de texto enriquecido (rich-text) y listas de datos.
//   3. RENDERIZADO AUTOMÁTICO: Este editor resolverá y cargará la interfaz colaborativa
//      de forma dinámica basándose enteramente en la configuración JSON del templateCode.
//   4. PLANTILLA PDF: Registra el formato HTML/CSS en `inv_document_templates` en el backend
//      para que el DocumentEngine pueda emitir y firmar digitalmente el PDF definitivo.
//   5. PERSISTENCIA: El documento se guardará automáticamente como snapshot JSON sin requerir
//      crear tablas relacionales a menos que sea un dato crítico a consultar por SQL.

// Cache global en memoria para evitar ráfagas redundantes de catálogos institucionales en re-montajes de DocumentEditor
const catalogsCache: Record<string, any> = {};

const getCachedOrFetch = async (key: string, fetchFn: () => Promise<any>) => {
    if (catalogsCache[key]) {
        return catalogsCache[key];
    }
    try {
        const res = await fetchFn();
        catalogsCache[key] = res;
        return res;
    } catch (err) {
        return { data: [] };
    }
};

const EMPTY_ARRAY: any[] = [];

interface DocumentEditorProps {
    templateCode: string;
    initialData?: any;
    entityUuid?: string;
    onClose: () => void;
    readOnly?: boolean;                                  // ← Bandera de sólo lectura
    readOnlyReason?: string;
    projectStatus?: string;
    canSign?: boolean;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ templateCode, initialData, entityUuid, onClose, readOnly = false, readOnlyReason, projectStatus, canSign = true }) => {
    const { isAdmin } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [templateConfig, setTemplateConfig] = useState<any>(null);
    const [docInstanceData, setDocInstanceData] = useState<any>(null);
    const [resolvedUuid, setResolvedUuid] = useState<string | null>(null);

    // Catálogos institucionales (agnóstico por plantilla)
    const [carreras, setCarreras] = useState<any[]>([]);
    const [convocatorias, setConvocatorias] = useState<any[]>([]);
    const [tiposProducto, setTiposProducto] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [dominios, setDominios] = useState<any[]>([]);
    const [lineas, setLineas] = useState<any[]>([]);
    const [sublineas, setSublineas] = useState<any[]>([]);
    const [customCatalogs, setCustomCatalogs] = useState<Record<string, any[]>>({});

    const [isInstanceSigned, setIsInstanceSigned] = useState<boolean>(false);

    const isSignedDocumentReadOnly = useMemo(() => {
        if (templateCode === 'OFICIO_APROBACION') {
            if (!isAdmin) return true;
            return isInstanceSigned;
        }
        return readOnly;
    }, [readOnly, isInstanceSigned, templateCode, isAdmin]);

    const effectiveConfig = useMemo(() => {
        if (!templateConfig) return null;
        if (isSignedDocumentReadOnly && templateCode === 'OFICIO_APROBACION') {
            return {
                ...templateConfig,
                sections: []
            };
        }
        return templateConfig;
    }, [templateConfig, isSignedDocumentReadOnly, templateCode]);

    // ── Carga paralela: configuración de plantilla + datos de instancia + catálogos ──
    useEffect(() => {
        const loadAll = async () => {
            // 1. Obtener la configuración local de respaldo (fallback)
            const localConfig = DocumentTemplateRegistry[templateCode];

            // 2. Lanzar peticiones de red
            const needsInstanceFetch = !!(initialData?.Uuid && !initialData.Uuid.startsWith('temp_'));

            const [configResult, instanceResult, carrerasRes, convsRes, tiposRes, groupsRes, dominiosRes, lineasRes, sublineasRes] = await Promise.all([
                needsInstanceFetch
                    ? api.get(`/documents/instances/${initialData.Uuid}/ui-config`).catch(() => ({ data: null }))
                    : api.get(`/documents/instances/templates/${templateCode}/ui-config`).catch(() => ({ data: null })),
                needsInstanceFetch
                    ? api.get(`/documents/instances/${initialData.Uuid}`).catch(() => ({ data: null }))
                    : Promise.resolve({ data: null }),
                getCachedOrFetch('carreras', () => api.get('/catalogs/carreras')),
                getCachedOrFetch('convocatorias', () => api.get('/Convocatorias')),
                getCachedOrFetch('tipos-producto', () => api.get('/catalogs/tipo-producto')),
                getCachedOrFetch('groups', () => api.get('/groups')),
                getCachedOrFetch('dominios', () => api.get('/catalogs/dominios')),
                getCachedOrFetch('lineas', () => api.get('/Convocatorias/catalogos/lineas')),
                getCachedOrFetch('sublineas', () => api.get('/catalogs/sublineas-investigacion')),
            ]);

            // Aplicar config de plantilla (prioriza backend, pero cae en localConfig si el backend retorna 0 secciones)
            const rawConfig = configResult?.data;
            const hasValidSections = Array.isArray(rawConfig?.sections) && rawConfig.sections.length > 0;
            const finalConfig = (hasValidSections ? rawConfig : (localConfig || rawConfig));
            setTemplateConfig(finalConfig);
            if (!finalConfig) {
                console.warn(`[DIITRA] No se encontró config para: ${templateCode}`);
            }

            // Detectar si hay campos personalizados que requieran cargar catálogos dinámicos por URL
            const templateBlocks = finalConfig?.blocks || finalConfig?.Blocks || [];
            const genBlock = templateBlocks.find((b: any) => b.type === 'project_general_section');
            if (genBlock && genBlock.config?.identificationMode === 'fields') {
                const customFields = genBlock.config.customFields || [];
                const urlsToFetch = customFields
                    .filter((f: any) => f.fieldType === 'select_catalog' && f.catalogUrl)
                    .map((f: any) => f.catalogUrl);

                if (urlsToFetch.length > 0) {
                    const customFetches = await Promise.all(
                        urlsToFetch.map((url: string) => getCachedOrFetch(url, () => api.get(url)))
                    );
                    const catalogMap: Record<string, any[]> = {};
                    urlsToFetch.forEach((url: string, idx: number) => {
                        catalogMap[url] = customFetches[idx]?.data || [];
                    });
                    setCustomCatalogs(catalogMap);
                }
            }

            // Aplicar datos de instancia
            if (instanceResult.data) {
                const hasSignedPdf = !!(
                    instanceResult.data.final_pdf_path ||
                    instanceResult.data.finalPdfPath ||
                    instanceResult.data.FinalPdfPath ||
                    instanceResult.data.is_signed ||
                    instanceResult.data.isSigned ||
                    instanceResult.data.IsSigned ||
                    instanceResult.data.signed_at ||
                    instanceResult.data.signedAt ||
                    instanceResult.data.estado === 'Firmado' ||
                    instanceResult.data.estado === 'Finalizado'
                );
                setIsInstanceSigned(hasSignedPdf);

                const realUuid = instanceResult.data.uuid || instanceResult.data.Uuid;
                if (realUuid) {
                    coworkLog(`[DIITRA] DocumentEditor resolved real document instance Uuid: ${realUuid}`);
                    setResolvedUuid(realUuid);
                }
                const snapshotStr = instanceResult.data.data_snapshot_json || instanceResult.data.dataSnapshotJson || instanceResult.data.DataSnapshotJson;
                if (snapshotStr) {
                    try {
                        const parsed = JSON.parse(snapshotStr);
                        if (parsed) {
                            if (!parsed.Impacto || parsed.Impacto === "[object Object]" || typeof parsed.Impacto === 'string') {
                                parsed.Impacto = { social: '', cientifico: '', economico: '', politico: '', ambiental: '', otro: '' };
                            }
                            if (!parsed.FirmasResponsabilidad || parsed.FirmasResponsabilidad === "[object Object]" || typeof parsed.FirmasResponsabilidad === 'string') {
                                parsed.FirmasResponsabilidad = {
                                    DirectorNombre: '',
                                    DirectorCargo: 'Director del Proyecto',
                                    CoordinadorNombre: '',
                                    CoordinadorCargo: 'Coordinador de Carrera'
                                };
                            }
                            if (parsed.FirmasResponsabilidad && !parsed.FirmasResponsabilidad.DirectorNombre && parsed.DirectorProyecto) {
                                parsed.FirmasResponsabilidad.DirectorNombre = parsed.DirectorProyecto;
                            }
                        }
                        setDocInstanceData(parsed);
                    } catch (e) {
                        console.error('[DIITRA] Error parsing dataSnapshotJson:', e);
                        setDocInstanceData({});
                    }
                } else {
                    setDocInstanceData({});
                }
            } else {
                setDocInstanceData({});
            }

            // Auto-completar metadatos del proyecto para oficio de aprobación si faltan valores iniciales
            if (entityUuid && entityUuid !== 'GLOBAL' && templateCode === 'OFICIO_APROBACION') {
                try {
                    const projRes = await api.get(`/projects/${entityUuid}/detail`);
                    if (projRes.data) {
                        const directorObj = (projRes.data.investigadores || []).find((inv: any) =>
                            inv.rol?.toLowerCase().includes('director') || inv.rol?.toLowerCase().includes('principal') || inv.es_director || inv.esDirector
                        );
                        const directorNombre = directorObj
                            ? (directorObj.nombres_completos || directorObj.nombresCompletos || `${directorObj.nombre || ''} ${directorObj.apellido || ''}`.trim())
                            : (projRes.data.director_proyecto || projRes.data.directorProyecto || '');
                        const directorCarrera = projRes.data.carrera || '';
                        const todaySpanish = new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

                        setDocInstanceData((prev: any) => ({
                            oficio_numero: prev?.oficio_numero || `01-ISTPET-INV-${new Date().getFullYear()}`,
                            oficio_fecha: prev?.oficio_fecha || todaySpanish,
                            director_nombre: prev?.director_nombre || directorNombre,
                            director_carrera: prev?.director_carrera || directorCarrera,
                            coordinador_nombre: prev?.coordinador_nombre || 'Ing. Estefani Sánchez Mgtr.',
                            ...prev
                        }));
                    }
                } catch (e) {
                    console.warn('[DIITRA] No se pudo autocompletar metadatos del proyecto:', e);
                }
            }

            // Aplicar catálogos
            setCarreras(carrerasRes.data || []);
            const allConvs = convsRes.data || [];
            const activeConvs = allConvs.filter((c: any) => c.estado === 'Abierta' || c.estado === 'Activa' || (isAdmin && c.estado === 'Borrador'));
            setConvocatorias(activeConvs.length > 0 ? activeConvs : allConvs.filter((c: any) => c.estado !== 'Borrador' || isAdmin));
            setTiposProducto(tiposRes.data || []);
            setGroups(groupsRes.data || []);
            setDominios(dominiosRes.data || []);
            setLineas(lineasRes.data || []);
            setSublineas(sublineasRes.data || []);

            setIsLoading(false);
        };

        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateCode, initialData?.Uuid, isAdmin]);

    if (isLoading) {
        return <FullscreenLoader message="Cargando editor colaborativo..." />;
    }

    if (!effectiveConfig) {
        return (
            <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-surface border border-red-500/30 p-8 rounded-3xl max-w-md shadow-2xl">
                    <h3 className="text-red-500 text-lg font-black uppercase tracking-wider mb-2">Error de Inicialización</h3>
                    <p className="text-text-dim text-sm font-medium mb-6">
                        No se pudo resolver la estructura de la plantilla "{templateCode}".
                    </p>
                    <button onClick={onClose} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all text-xs uppercase tracking-widest">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <DocumentEditorCore
            templateCode={templateCode}
            templateConfig={effectiveConfig}
            initialData={{ ...docInstanceData, Uuid: resolvedUuid || initialData?.Uuid }}
            entityUuid={entityUuid}
            carreras={carreras}
            convocatorias={convocatorias}
            tiposProducto={tiposProducto}
            groups={groups}
            dominios={dominios}
            lineas={lineas}
            sublineas={sublineas}
            customCatalogs={customCatalogs}
            onClose={onClose}
            readOnly={readOnly}
            readOnlyReason={readOnlyReason}
            projectStatus={projectStatus}
            canSign={canSign}
        />
    );
};

// ─────────────────────────────────────────────────────────────────
// DocumentEditorCore — El núcleo activo del editor
// Este componente se renderiza DESPUÉS de que la configuración se resolvió,
// garantizando que useCoWork y useDIITRADocument se llaman de forma estable.
// ─────────────────────────────────────────────────────────────────

interface DocumentEditorCoreProps {
    templateCode: string;
    templateConfig: any;
    initialData: any;
    entityUuid?: string;
    carreras: any[];
    convocatorias: any[];
    tiposProducto: any[];
    groups: any[];
    dominios: any[];
    lineas: any[];
    sublineas: any[];
    customCatalogs?: Record<string, any[]>;
    onClose: () => void;
    readOnly?: boolean;                                  // ← Bandera de sólo lectura
    readOnlyReason?: string;
    projectStatus?: string;
    canSign?: boolean;
}

const DocumentEditorCore: React.FC<DocumentEditorCoreProps> = ({
    templateCode,
    templateConfig,
    initialData,
    entityUuid,
    carreras,
    convocatorias,
    tiposProducto,
    groups,
    dominios,
    lineas,
    sublineas,
    customCatalogs = {},
    onClose,
    readOnly = false,
    readOnlyReason,
    projectStatus,
    canSign = true
}) => {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const { addToast } = useNotifications();
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);

    useEffect(() => {
        if (templateConfig?.has_template_update || templateConfig?.hasTemplateUpdate) {
            setShowUpgradeBanner(true);
        }
    }, [templateConfig]);

    useTemplatePublishedListener(() => {
        setShowUpgradeBanner(true);
    }, templateCode);

    const handleUpgradeTemplate = async () => {
        const documentId = initialData?.Uuid || initialData?.uuid;
        if (!documentId) return;
        setIsUpgrading(true);
        try {
            await api.post(`/documents/instances/${documentId}/upgrade-template`);
            addToast("Formato Actualizado", "El borrador ha sido adaptado al nuevo formato de plantilla con éxito.", "success");
            setShowUpgradeBanner(false);
            window.location.reload();
        } catch (err: any) {
            console.error("[DIITRA] Error al actualizar formato de plantilla:", err);
            addToast("Error al actualizar", err?.response?.data?.message || "No se pudo actualizar el formato.", "error");
        } finally {
            setIsUpgrading(false);
        }
    };

    // Log para depuración en caliente
    useEffect(() => {
        coworkLog(`[DIITRA] DocumentEditorCore cargado para la plantilla: ${templateCode}, ID: ${initialData?.Uuid || 'NUEVO'}, readOnly: ${readOnly}`);
    }, [templateCode, initialData?.Uuid, readOnly]);

    // ── Merge estable del esquema + datos iniciales (uuid, título, etc.) ──
    const mergedInitial = React.useMemo(() => ({
        ...(templateConfig?.schema || {}),
        EntityUuid: entityUuid,
        entityUuid: entityUuid,
        ...initialData
    }), [templateConfig, initialData, entityUuid]);

    const documentId = initialData?.Uuid || `temp_${Math.random().toString(36).substring(2, 9)}`;

    // ── 3. Instanciar CoWork (V1.0: se hace AQUÍ, en el padre del Shell) ──
    const coworkUser = React.useMemo(() => coworkUserFromAuth({
        userUuid: user?.id_referencia || 'anonymous',
        nombreCompleto: user?.nombre_completo || 'Usuario DIITRA',
        role: user?.role || 'Investigador',
    }), [user]);

    const cowork = useCoWork({
        documentId,
        user: coworkUser,
        enabled: true,
        readonly: readOnly,
    });

    // ── 4. Resolver campos de texto enriquecido (Rich-Text) para evitar colisión de constructores Yjs ──
    const richTexts = React.useMemo(() => {
        const list: string[] = [];
        const techSection = templateConfig?.sections?.find((s: any) => s.componentName === "TechnicalSection" || s.component_name === "TechnicalSection" || s.id === "tecnico");

        if (techSection) {
            const techSecs = techSection.config?.technicalSections || techSection.config?.TechnicalSections;
            if (Array.isArray(techSecs) && techSecs.length > 0) {
                techSecs.filter((s: any) => s.enabled !== false).forEach((s: any) => {
                    const key = s.fieldKey || s.id;
                    if (key && !list.includes(key)) {
                        list.push(key);
                    }
                });
            } else {
                // Fallback institucional por defecto
                ['Antecedentes', 'DescripcionProyecto', 'Justificacion', 'ObjetivoGeneral', 'ObjetivosEspecificos', 'MarcoTeorico', 'Metodologia', 'Evaluacion', 'Bibliografia'].forEach(k => {
                    if (!list.includes(k)) list.push(k);
                });
            }
        } else if (templateCode === 'PROTOCOLO_INVESTIGACION') {
            ['Antecedentes', 'DescripcionProyecto', 'Justificacion', 'ObjetivoGeneral', 'ObjetivosEspecificos', 'MarcoTeorico', 'Metodologia', 'Evaluacion', 'Bibliografia'].forEach(k => {
                if (!list.includes(k)) list.push(k);
            });
        } else if (templateCode === 'INFORME_AVANCE' && !templateConfig?.sections?.some((s: any) => s.id === "edicion_colaborativa")) {
            list.push('ConclusionesParciales');
        }

        if (templateConfig?.sections) {
            templateConfig.sections.forEach((sec: any) => {
                const fields = sec.config?.fields || sec.config?.Fields || sec.Config?.fields || sec.Config?.Fields || sec.fields || sec.Fields;
                if (Array.isArray(fields)) {
                    fields.forEach((f: any) => {
                        if (f.type === 'rich-text' && !list.includes(f.name)) {
                            list.push(f.name);
                        }
                    });
                }
            });
        }
        // Asegurar que 'Bibliografia' se registre como rich-text para evitar colisión de constructores Yjs
        const hasBibliographySection = templateConfig?.sections?.some((s: any) => s.id === "bibliografia");
        if (hasBibliographySection && !list.includes('Bibliografia')) {
            list.push('Bibliografia');
        }
        return list;
    }, [templateConfig, templateCode]);

    // Resolver campos confidenciales/privados para excluirlos de la sincronización de red CoWork (fugas ciego)
    const nonCollaborative = React.useMemo(() => {
        const list: string[] = [];
        if (templateConfig?.sections) {
            templateConfig.sections.forEach((sec: any) => {
                const fields = sec.config?.fields || sec.config?.Fields || sec.Config?.fields || sec.Config?.Fields || sec.fields || sec.Fields;
                if (Array.isArray(fields)) {
                    fields.forEach((f: any) => {
                        if (f.collaborative === false) {
                            list.push(f.name);
                        }
                    });
                }
            });
        }
        return list;
    }, [templateConfig]);

    // ── 5. Hook Maestro con ydoc REACTIVO (V1.0 — corrección bug reconexión) ──
    const {
        formData,
        setFormData,
        localChangeCount,
        remoteChangeCount,
        addItem,
        removeItem,
        updateItem,
        updateField,
        reorderItem
    } = useDIITRADocument(
        mergedInitial,
        cowork.ydoc,        // ← parámetro reactivo: React detecta cambios si SignalR reconecta
        {
            lists: templateConfig?.lists || EMPTY_ARRAY,
            richTexts,
            nonCollaborative: nonCollaborative || EMPTY_ARRAY,
            isHistoryLoaded: cowork.session.lastSyncedAt !== null
        }
    );

    // ── 6. Cálculos derivados específicos de la sección de Recursos ──
    useEffect(() => {
        const hasRecursosSection = templateConfig?.sections?.some((s: any) => s.id === "recursos");
        if (hasRecursosSection && formData?.RecursosNecesarios) {
            const total = (formData.RecursosNecesarios as any[]).reduce(
                (acc: number, curr: any) => acc + (Number(curr.CostoTotal) || 0),
                0
            );
            if (total !== formData.CostoTotal) {
                updateField('CostoTotal', total, { source: 'system' });
            }
        }
    }, [formData?.RecursosNecesarios, formData?.CostoTotal, updateField, templateConfig]);

    // ── 7. Persistencia en el backend ──
    const cleanDocumentData = (data: any) => {
        if (!data) return data;
        const cloned = JSON.parse(JSON.stringify(data));
        if (Array.isArray(cloned.RecursosDisponibles)) {
            cloned.RecursosDisponibles.forEach((r: any) => {
                if (r.Cantidad !== undefined && r.Cantidad !== null) {
                    r.Cantidad = String(r.Cantidad);
                }
            });
        }
        if (Array.isArray(cloned.RecursosNecesarios)) {
            cloned.RecursosNecesarios.forEach((r: any) => {
                if (r.Cantidad !== undefined && r.Cantidad !== null) {
                    r.Cantidad = String(r.Cantidad);
                }
            });
        }
        if (Array.isArray(cloned.ProductosEsperados)) {
            cloned.ProductosEsperados.forEach((p: any) => {
                if (p.cantidad !== undefined && p.cantidad !== null) {
                    p.cantidad = String(p.cantidad);
                }
                if (p.Cantidad !== undefined && p.Cantidad !== null) {
                    p.Cantidad = String(p.Cantidad);
                }
            });
        }

        if (cloned.GrupoInvestigacionTipo === 'SI' || cloned.GrupoInvestigacionTipo === 'si') {
            cloned.TieneGrupoInvestigacion = true;
            cloned.GrupoInvestigacion = cloned.GrupoInvestigacionNombre;
        } else if (cloned.GrupoInvestigacionTipo === 'NO' || cloned.GrupoInvestigacionTipo === 'no') {
            cloned.TieneGrupoInvestigacion = false;
            cloned.GrupoInvestigacionUuid = null;
            cloned.GrupoInvestigacionNombre = '';
            cloned.GrupoInvestigacion = '';
        }

        // Garantizar que todos los campos string del ProyectoDto sean cadenas de texto.
        // Yjs puede convertir valores numéricos a Number; esto los normaliza antes de enviar al backend.
        PROTOCOLO_STRING_FIELDS.forEach(field => {
            if (cloned[field] !== undefined && cloned[field] !== null && typeof cloned[field] !== 'string') {
                cloned[field] = String(cloned[field]);
            }
        });

        return cloned;
    };

    const handleSave = async (data: any) => {
        try {
            const cleanedData = cleanDocumentData(data);
            if (cleanedData.Uuid) {
                const response = await api.patch(`/documents/instances/${cleanedData.Uuid}/metadata`, cleanedData);
                // El backend puede haber asignado un nuevo UUID (Draft creado por documento sellado).
                // Actualizamos el estado local para que los siguientes autoguardados apunten al Draft correcto.
                const returnedUuid = response.data?.uuid;
                if (returnedUuid && returnedUuid !== cleanedData.Uuid) {
                    setFormData((prev: any) => ({ ...prev, Uuid: returnedUuid }));
                }
            } else {
                const response = await api.post('/documents/instances', {
                    templateCode,
                    entityUuid: entityUuid || 'GLOBAL',
                    title: cleanedData.Titulo || cleanedData.title || `Documento ${templateCode}`
                });
                if (response.data?.uuid) {
                    const newUuid = response.data.uuid;
                    setFormData((prev: any) => ({ ...prev, Uuid: newUuid }));
                    if (!window.location.pathname.includes('/workspace/')) {
                        await api.patch(`/documents/instances/${newUuid}/metadata`, { ...cleanedData, Uuid: newUuid });
                        const isMisProyectos = window.location.pathname.startsWith('/investigacion/mis-proyectos');
                        const prefix = isMisProyectos ? '/investigacion/mis-proyectos' : '/investigacion';
                        navigate(buildWorkspacePath(templateCode, newUuid, `?edit=${templateCodeToEditParam(templateCode)}`, prefix), { replace: true });
                        window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
                    }
                }
            }
        } catch (error: any) {
            console.error('[DIITRA] Error al guardar documento:', error);
            if (error.response?.data) {
                console.error('[DIITRA] Detalles de respuesta del servidor (400 Bad Request):', error.response.data);
            }
            throw error;
        }
    };

    // ── 8. Resolución de secciones: datos (Registry) + componentes (ComponentRegistry) ──
    const mappedSections = React.useMemo(() => {
        return (templateConfig.sections as any[]).map((sec: any) => {
            // Ícono: puede ser componente directo (legacy) o nombre string (nuevo)
            const iconName = sec.icon_name || sec.iconName;
            const IconComponent = sec.icon || (iconName ? ICON_MAP[iconName] : null) || FileText;
            // Config de campos: normalizado en una sola forma
            const normalizedConfig = sec.config || (sec.fields ? { fields: sec.fields } : undefined);
            // Componente de sección: resuelto dinámicamente por nombre o ID (soporta snake_case y camelCase)
            const componentName = sec.component_name || sec.componentName || sec.component;
            const SectionComponent = (componentName ? COMPONENT_MAP[componentName] : null) || getDocumentSection(sec.id, sec.component);

            return {
                ...sec,
                icon: <IconComponent size={18} />,
                config: normalizedConfig,
                component: SectionComponent,    // Siempre resuelto
            };
        });
    }, [templateConfig]);

    return (
        <DIITRABuilderShell
            title={templateConfig.title}
            subtitle={templateConfig.subtitle}
            templateCode={templateCode}
            sections={mappedSections}
            formData={formData}
            setFormData={setFormData}
            localChangeCount={localChangeCount}
            remoteChangeCount={remoteChangeCount}
            cowork={cowork}      // ← Inyectado al Shell (no lo crea él)
            onSave={handleSave}
            onClose={onClose}
            readOnly={readOnly}
            readOnlyReason={readOnlyReason}
            projectStatus={projectStatus}
            entityUuid={entityUuid}
            canSign={canSign}
            onUpdateField={updateField}
            signatureType={templateConfig?.signatureType || 'DIITRA'}
            documentUuid={formData.Uuid || formData.uuid || initialData?.Uuid || initialData?.uuid}
            hasTemplateUpdate={showUpgradeBanner}
            instanceVersion={templateConfig?.instance_version ?? templateConfig?.instanceVersion}
            templateVersion={templateConfig?.template_version ?? templateConfig?.templateVersion}
            onUpgradeTemplate={handleUpgradeTemplate}
            isUpgrading={isUpgrading}
        >
            {(activeTab, coworkHandle) => {
                const activeSectionConfig = mappedSections.find((s: any) => s.id === activeTab);
                if (!activeSectionConfig) return null;

                const SectionComponent = activeSectionConfig.component;

                // Props específicas de listas según la sección activa
                let listProps: any = {};
                if (activeTab === 'equipo') {
                    listProps = {
                        onAdd: () => addItem('Investigadores', { Nombre: '', Cedula: '', Email: '', Telefono: '', NivelAcademico: '', Rol: '', HorasSemanales: null }),
                        onRemove: (i: number) => removeItem('Investigadores', i),
                        onUpdate: (i: number, f: string, v: any) => updateItem('Investigadores', i, f, v)
                    };
                } else if (activeTab === 'cronograma') {
                    const getProjectWeeksCount = () => {
                        const startStr = formData.FechaInicio || formData.FechaInicioEstimada;
                        const endStr = formData.FechaFin || formData.FechaFinEstimada;
                        if (startStr && endStr) {
                            try {
                                const start = new Date(startStr);
                                const end = new Date(endStr);
                                if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
                                    const diffTime = end.getTime() - start.getTime();
                                    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                    return Math.ceil(totalDays / 7);
                                }
                            } catch (e) {
                                console.error("Error calculating project weeks:", e);
                            }
                        }
                        return 12;
                    };
                    listProps = {
                        onAdd: () => addItem('Cronograma', { 
                            Actividad: '', 
                            Numero: (formData.Cronograma?.length || 0) + 1, 
                            RecursosNecesarios: '', 
                            Responsable: '',
                            Entregable: '',
                            IdObjetivo: 0,
                            FechaInicioPrevista: '',
                            FechaFinPrevista: '',
                            Semanas: Array(getProjectWeeksCount()).fill(false) 
                        }),
                        onRemove: (i: number) => removeItem('Cronograma', i),
                        onUpdate: (i: number, f: string, v: any) => updateItem('Cronograma', i, f, v),
                        onReorder: (fromIdx: number, toIdx: number) => reorderItem('Cronograma', fromIdx, toIdx)
                    };
                }

                // Determinar si esta sección específica está bloqueada por el director
                const isSectionBlocked = formData?.BlockedSections?.[activeTab] === true;
                const isDirectorOrAdmin = canSign || isAdmin;
                
                // Si la sección está bloqueada y el usuario NO es director/admin, forzar readOnly = true
                const sectionReadOnly = readOnly || (isSectionBlocked && !isDirectorOrAdmin);

                return (
                    <div className="pb-20">
                        <SectionComponent
                            readOnly={sectionReadOnly}
                            formData={formData}
                            cowork={coworkHandle}
                            onUpdate={updateField}
                            canSign={canSign}
                            isAdmin={isAdmin}
                            activeTab={activeTab}
                            templateCode={templateCode}
                            carreras={carreras}
                            convocatorias={convocatorias}
                            tiposProducto={tiposProducto}
                            groups={groups}
                            dominios={dominios}
                            lineas={lineas}
                            sublineas={sublineas}
                            customCatalogs={customCatalogs}
                            config={activeSectionConfig.config}

                            // Props de listas para compatibilidad con secciones existentes
                            investigadores={formData?.Investigadores || []}
                            investigadoresReales={initialData?.investigadores || initialData?.Investigadores || []}
                            recursosDisponibles={formData?.RecursosDisponibles || []}
                            recursosNecesarios={formData?.RecursosNecesarios || []}
                            costoTotal={formData?.CostoTotal || 0}
                            cronograma={formData?.Cronograma || []}
                            productosEsperados={formData?.ProductosEsperados || []}

                            // Handlers genéricos de listas
                            onAdd={(list: string, tpl: any) => addItem(list, tpl)}
                            onRemove={(list: string, i: number) => removeItem(list, i)}
                            onUpdateItem={(list: string, i: number, f: string, v: any) => updateItem(list, i, f, v)}

                            // Handlers específicos para retrocompatibilidad
                            onAddDisponible={() => addItem('RecursosDisponibles', { Descripcion: '', Cantidad: '1', Fuente: '' })}
                            onRemoveDisponible={(i: number) => removeItem('RecursosDisponibles', i)}
                            onUpdateDisponible={(i: number, f: string, v: any) => updateItem('RecursosDisponibles', i, f, v)}
                            onAddNecesario={() => addItem('RecursosNecesarios', { Descripcion: '', Cantidad: '1', CostoUnitario: 0, CostoTotal: 0 })}
                            onRemoveNecesario={(i: number) => removeItem('RecursosNecesarios', i)}
                            onUpdateNecesario={(i: number, f: string, v: any) => updateItem('RecursosNecesarios', i, f, v)}
                            onAddProducto={() => addItem('ProductosEsperados', { categoria: '', tipo: '', titulo: '', requiere_senadi: false, registro_senadi: '', trl: '', indicador: '', medio_verificacion: '', cantidad: '1', plazo: '' })}
                            onRemoveProducto={(i: number) => removeItem('ProductosEsperados', i)}
                            onUpdateProducto={(i: number, f: string, v: any) => updateItem('ProductosEsperados', i, f, v)}
                            onUpdateImpacto={(t: string, v: any) => updateField('Impacto', (prev: any) => ({ ...(prev || {}), [t.toLowerCase()]: v }))}

                            {...listProps}
                        />
                    </div>
                );
            }}
        </DIITRABuilderShell>
    );
};

export default DocumentEditor;
