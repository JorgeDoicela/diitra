import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { BookOpen, FileText, Users, DollarSign, Calendar, Target, CheckSquare, BarChart, Library, Award, Shield } from 'lucide-react';

import api from '../../../../api/axios_config';
import { useAuth } from '../../../../api/AuthContext';

// ── DIITRA CoWork — importar SOLO desde el índice público ────────
import { useCoWork, coworkUserFromAuth } from '../../../../core/cowork';
import { coworkLog } from '../../../../core/cowork/utils/log';


// ── DIITRA Documents ─────────────────────────────────────────────
import { useDIITRADocument } from '../../../../core/documents/hooks/useDIITRADocument';
import { DocumentTemplateRegistry } from '../../../../core/documents/registry/DocumentTemplateRegistry';
import { getDocumentSection } from '../../../../core/documents/registry/DocumentComponentRegistry';

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

    // ── Carga paralela: configuración de plantilla + datos de instancia + catálogos ──
    // Todo en un solo Promise.all para eliminar el waterfall de requests seriales.
    useEffect(() => {
        const loadAll = async () => {
            // 1. Obtener la configuración local de respaldo (fallback)
            const localConfig = DocumentTemplateRegistry[templateCode];

            // 2. Lanzar todas las peticiones de red en paralelo
            const needsInstanceFetch = !!(initialData?.Uuid && !initialData.Uuid.startsWith('temp_'));

            const [configResult, instanceResult, carrerasRes, convsRes, tiposRes, groupsRes, dominiosRes, lineasRes, sublineasRes] = await Promise.all([
                // Intentar cargar la configuración dinámica desde la API
                api.get(`/documents/instances/templates/${templateCode}/ui-config`).catch(() => ({ data: null })),
                // Datos de la instancia: siempre fresco desde backend si existe
                needsInstanceFetch
                    ? api.get(`/documents/instances/${initialData.Uuid}`).catch(() => ({ data: null }))
                    : Promise.resolve({ data: null }),
                // Catálogos institucionales
                api.get('/catalogs/carreras').catch(() => ({ data: [] })),
                api.get('/Convocatorias').catch(() => ({ data: [] })),
                api.get('/catalogs/tipo-producto').catch(() => ({ data: [] })),
                api.get('/groups').catch(() => ({ data: [] })),
                api.get('/catalogs/dominios').catch(() => ({ data: [] })),
                api.get('/Convocatorias/catalogos/lineas').catch(() => ({ data: [] })),
                api.get('/catalogs/sublineas-investigacion').catch(() => ({ data: [] })),
            ]);

            // Aplicar config de plantilla (prioriza la API, cae en la localConfig si la API no retorna nada o falla)
            const finalConfig = configResult?.data ?? localConfig;
            setTemplateConfig(finalConfig);
            if (!finalConfig) {
                console.warn(`[DIITRA] No se encontró config para: ${templateCode}`);
            }

            // Aplicar datos de instancia
            if (instanceResult.data) {
                const realUuid = instanceResult.data.uuid || instanceResult.data.Uuid;
                if (realUuid) {
                    coworkLog(`[DIITRA] DocumentEditor resolved real document instance Uuid: ${realUuid}`);
                    setResolvedUuid(realUuid);
                }
                // FALLBACK PATTERN: Se tolera cualquier casing del backend (snake_case, camelCase, PascalCase)
                // para evitar roturas si la serialización de snapshots varía o si la propiedad viene de un DTO mapeado.
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
        return (
            <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center gap-4">
                <Loader size={48} className="animate-spin text-primary" />
                <p className="text-text-dim text-sm font-black uppercase tracking-widest animate-pulse">
                    Cargando editor colaborativo...
                </p>
            </div>
        );
    }

    if (!templateConfig) {
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
            templateConfig={templateConfig}
            initialData={{ ...docInstanceData, Uuid: resolvedUuid || initialData?.Uuid }}
            entityUuid={entityUuid}
            carreras={carreras}
            convocatorias={convocatorias}
            tiposProducto={tiposProducto}
            groups={groups}
            dominios={dominios}
            lineas={lineas}
            sublineas={sublineas}
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
    onClose,
    readOnly = false,
    readOnlyReason,
    projectStatus,
    canSign = true
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

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
        if (templateCode === 'PROTOCOLO_INVESTIGACION') {
            return [
                'Antecedentes', 'DescripcionProyecto', 'Justificacion',
                'ObjetivoGeneral', 'ObjetivosEspecificos', 'MarcoTeorico',
                'Metodologia', 'Evaluacion', 'Bibliografia'
            ];
        }
        if (templateCode === 'INFORME_AVANCE') {
            return ['ConclusionesParciales'];
        }
        if (templateConfig?.sections) {
            templateConfig.sections.forEach((sec: any) => {
                const fields = sec.config?.fields || sec.fields;
                if (Array.isArray(fields)) {
                    fields.forEach((f: any) => {
                        if (f.type === 'rich-text') {
                            list.push(f.name);
                        }
                    });
                }
            });
        }
        return list;
    }, [templateConfig, templateCode]);

    // Resolver campos confidenciales/privados para excluirlos de la sincronización de red CoWork (fugas ciego)
    const nonCollaborative = React.useMemo(() => {
        const list: string[] = [];
        if (templateConfig?.sections) {
            templateConfig.sections.forEach((sec: any) => {
                const fields = sec.config?.fields || sec.fields;
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
        addItem,
        removeItem,
        updateItem,
        updateField,
        reorderItem
    } = useDIITRADocument(
        mergedInitial,
        cowork.ydoc,        // ← parámetro reactivo: React detecta cambios si SignalR reconecta
        {
            lists: templateConfig?.lists || [],
            richTexts,
            nonCollaborative,
            isHistoryLoaded: cowork.session.lastSyncedAt !== null
        }
    );

    // ── 6. Cálculos derivados específicos del Protocolo de Investigación ──
    useEffect(() => {
        if (templateCode === 'PROTOCOLO_INVESTIGACION' && formData?.RecursosNecesarios) {
            const total = (formData.RecursosNecesarios as any[]).reduce(
                (acc: number, curr: any) => acc + (Number(curr.CostoTotal) || 0),
                0
            );
            if (total !== formData.CostoTotal) {
                updateField('CostoTotal', total, { source: 'system' });
            }
        }
    }, [formData?.RecursosNecesarios, formData?.CostoTotal, updateField, templateCode]);

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

        return cloned;
    };

    const handleSave = async (data: any) => {
        try {
            const cleanedData = cleanDocumentData(data);
            if (cleanedData.Uuid) {
                await api.patch(`/documents/instances/${cleanedData.Uuid}/metadata`, cleanedData);
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
            const IconComponent = sec.icon || ICON_MAP[sec.iconName] || FileText;
            // Config de campos: normalizado en una sola forma
            const normalizedConfig = sec.config || (sec.fields ? { fields: sec.fields } : undefined);
            // Componente de sección: Registry > Agnostic fallback
            const SectionComponent = getDocumentSection(sec.id, sec.component);

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
            cowork={cowork}      // ← Inyectado al Shell (no lo crea él)
            onSave={handleSave}
            onClose={onClose}
            readOnly={readOnly}
            readOnlyReason={readOnlyReason}
            projectStatus={projectStatus}
            entityUuid={entityUuid}
            canSign={canSign}
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
                        if (formData?.FechaInicio && formData?.FechaFin) {
                            try {
                                const start = new Date(formData.FechaInicio);
                                const end = new Date(formData.FechaFin);
                                if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
                                    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                                    const months = Math.max(1, diffMonths + 1);
                                    return months * 4;
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

                return (
                    <div className="pb-20">
                        <SectionComponent
                            readOnly={readOnly}
                            formData={formData}
                            cowork={coworkHandle}
                            onUpdate={updateField}
                            activeTab={activeTab}
                            templateCode={templateCode}
                            carreras={carreras}
                            convocatorias={convocatorias}
                            tiposProducto={tiposProducto}
                            groups={groups}
                            dominios={dominios}
                            lineas={lineas}
                            sublineas={sublineas}
                            config={activeSectionConfig.config}

                            // Props de listas para compatibilidad con secciones existentes
                            investigadores={formData?.Investigadores || []}
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
                            onAddProducto={() => addItem('ProductosEsperados', { tipo: '', cantidad: '1' })}
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
