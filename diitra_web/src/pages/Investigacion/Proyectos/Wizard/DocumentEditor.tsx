import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { BookOpen, FileText, Users, DollarSign, Calendar, Target, CheckSquare, BarChart } from 'lucide-react';

import api from '../../../../api/axios_config';
import { useAuth } from '../../../../api/AuthContext';

// ── DIITRA CoWork — importar SOLO desde el índice público ────────
import { useCoWork, coworkUserFromAuth } from '../../../../core/cowork';

// ── DIITRA Documents ─────────────────────────────────────────────
import { useDIITRADocument } from '../../../../core/documents/hooks/useDIITRADocument';
import { DocumentTemplateRegistry } from '../../../../core/documents/registry/DocumentTemplateRegistry';
import { getDocumentSection } from '../../../../core/documents/registry/DocumentComponentRegistry';

import DIITRABuilderShell from '../../../../components/DIITRA/DIITRABuilderShell';

/**
 * Mapa de nombres de íconos (string del Registry) → componentes Lucide.
 * Esto permite que el DocumentTemplateRegistry sea puro JSON sin importar
 * módulos de React.
 */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
    BookOpen, FileText, Users, DollarSign, Calendar, Target, CheckSquare, BarChart
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
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ templateCode, initialData, entityUuid, onClose, readOnly = false, readOnlyReason, projectStatus }) => {
    const [templateConfig, setTemplateConfig] = useState<any>(null);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
    const [docInstanceData, setDocInstanceData] = useState<any>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [resolvedUuid, setResolvedUuid] = useState<string | null>(null);

    // Catálogos institucionales (agnóstico por plantilla)
    const [carreras, setCarreras] = useState<any[]>([]);
    const [convocatorias, setConvocatorias] = useState<any[]>([]);
    const [tiposProducto, setTiposProducto] = useState<any[]>([]);

    // 1. Resolución de configuración de la plantilla y carga de datos de la instancia
    useEffect(() => {
        const fetchConfig = async () => {
            // PRIORIDAD 1: Registry local (esquema puro, sin componentes React)
            const localConfig = DocumentTemplateRegistry[templateCode];
            if (localConfig) {
                setTemplateConfig(localConfig);
                setIsLoadingTemplate(false);
                return;
            }

            // PRIORIDAD 2: Backend dinámico (plantillas custom creadas en BD)
            try {
                const response = await api.get(`/documents/instances/templates/${templateCode}/ui-config`);
                setTemplateConfig(response.data);
            } catch (err) {
                console.warn(`[DIITRA] No se encontró config para: ${templateCode}`);
                setTemplateConfig(null);
            } finally {
                setIsLoadingTemplate(false);
            }
        };
        fetchConfig();
    }, [templateCode]);

    useEffect(() => {
        const fetchDocData = async () => {
            if (!initialData?.Uuid || initialData.Uuid.startsWith('temp_')) {
                setDocInstanceData({});
                setIsLoadingData(false);
                return;
            }
            try {
                const response = await api.get(`/documents/instances/${initialData.Uuid}`);
                if (response.data) {
                    const realUuid = response.data.uuid || response.data.Uuid;
                    if (realUuid) {
                        console.log(`[DIITRA] DocumentEditor resolved real document instance Uuid: ${realUuid}`);
                        setResolvedUuid(realUuid);
                    }
                    const snapshotStr = response.data.dataSnapshotJson || response.data.DataSnapshotJson;
                    if (snapshotStr) {
                        try {
                            const parsed = JSON.parse(snapshotStr);
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
            } catch (err) {
                console.error('[DIITRA] Error loading document instance data:', err);
                setDocInstanceData({});
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchDocData();
    }, [initialData?.Uuid]);

    // 2. Carga de catálogos institucionales
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [rCarreras, rConvocatorias, rTipos] = await Promise.all([
                    api.get('/catalogs/carreras').catch(() => ({ data: [] })),
                    api.get('/Convocatorias').catch(() => ({ data: [] })),
                    api.get('/catalogs/tipo-producto').catch(() => ({ data: [] }))
                ]);
                setCarreras(rCarreras.data || []);
                const activeConvs = (rConvocatorias.data || []).filter((c: any) => c.estado === 'Abierta' || c.estado === 'Activa');
                setConvocatorias(activeConvs.length > 0 ? activeConvs : (rConvocatorias.data || []));
                setTiposProducto(rTipos.data || []);
            } catch (e) {
                console.error('[DIITRA] Error al cargar metálogos institucionales:', e);
            }
        };
        loadMetadata();
    }, []);

    if (isLoadingTemplate || isLoadingData) {
        return (
            <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center gap-4">
                <Loader size={48} className="animate-spin text-primary" />
                <p className="text-text-dim text-sm font-black uppercase tracking-widest animate-pulse">
                    Cargando Workspace Colaborativo...
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
            initialData={{ ...docInstanceData, ...initialData, Uuid: resolvedUuid || initialData?.Uuid }}
            entityUuid={entityUuid}
            carreras={carreras}
            convocatorias={convocatorias}
            tiposProducto={tiposProducto}
            onClose={onClose}
            readOnly={readOnly}
            readOnlyReason={readOnlyReason}
            projectStatus={projectStatus}
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
    onClose: () => void;
    readOnly?: boolean;                                  // ← Bandera de sólo lectura
    readOnlyReason?: string;
    projectStatus?: string;
}

const DocumentEditorCore: React.FC<DocumentEditorCoreProps> = ({
    templateCode,
    templateConfig,
    initialData,
    entityUuid,
    carreras,
    convocatorias,
    tiposProducto,
    onClose,
    readOnly = false,
    readOnlyReason,
    projectStatus
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Log para depuración en caliente
    useEffect(() => {
        console.log(`[DIITRA] DocumentEditorCore cargado para la plantilla: ${templateCode}, ID: ${initialData?.Uuid || 'NUEVO'}, readOnly: ${readOnly}`);
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
        addItem,
        removeItem,
        updateItem,
        updateField
    } = useDIITRADocument(
        mergedInitial,
        cowork.ydoc,        // ← parámetro reactivo: React detecta cambios si SignalR reconecta
        {
            lists: templateConfig?.lists || [],
            richTexts,
            nonCollaborative
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
                updateField('CostoTotal', total);
            }
        }
    }, [formData?.RecursosNecesarios, formData?.CostoTotal, updateField, templateCode]);

    // ── 7. Persistencia en el backend ──
    const handleSave = async (data: any) => {
        try {
            if (data.Uuid) {
                await api.patch(`/documents/instances/${data.Uuid}/metadata`, data);
            } else {
                const response = await api.post('/documents/instances', {
                    templateCode,
                    entityUuid: entityUuid || 'GLOBAL',
                    title: data.Titulo || data.title || `Documento ${templateCode}`
                });
                if (response.data?.uuid) {
                    const newUuid = response.data.uuid;
                    setFormData((prev: any) => ({ ...prev, Uuid: newUuid }));
                    if (!window.location.pathname.includes('/workspace/')) {
                        await api.patch(`/documents/instances/${newUuid}/metadata`, { ...data, Uuid: newUuid });
                        navigate(`/investigacion/workspace/${templateCode}/${newUuid}?edit=true`, { replace: true });
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
            cowork={cowork}      // ← Inyectado al Shell (no lo crea él)
            onSave={handleSave}
            onClose={onClose}
            readOnly={readOnly}
            readOnlyReason={readOnlyReason}
            projectStatus={projectStatus}
            entityUuid={entityUuid}
        >
            {(activeTab, coworkHandle) => {
                const activeSectionConfig = mappedSections.find((s: any) => s.id === activeTab);
                if (!activeSectionConfig) return null;

                const SectionComponent = activeSectionConfig.component;

                // Props específicas de listas según la sección activa
                let listProps: any = {};
                if (activeTab === 'equipo') {
                    listProps = {
                        onAdd: () => addItem('Investigadores', { Nombre: '', Cedula: '', Email: '', Telefono: '', NivelAcademico: '', Rol: '' }),
                        onRemove: (i: number) => removeItem('Investigadores', i),
                        onUpdate: (i: number, f: string, v: any) => updateItem('Investigadores', i, f, v)
                    };
                } else if (activeTab === 'cronograma') {
                    listProps = {
                        onAdd: () => addItem('Cronograma', { Actividad: '', Numero: 1, RecursosNecesarios: '' }),
                        onRemove: (i: number) => removeItem('Cronograma', i),
                        onUpdate: (i: number, f: string, v: any) => updateItem('Cronograma', i, f, v)
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
                            onAddDisponible={() => addItem('RecursosDisponibles', { Descripcion: '', Cantidad: 1 })}
                            onRemoveDisponible={(i: number) => removeItem('RecursosDisponibles', i)}
                            onUpdateDisponible={(i: number, f: string, v: any) => updateItem('RecursosDisponibles', i, f, v)}
                            onAddNecesario={() => addItem('RecursosNecesarios', { Descripcion: '', Cantidad: 1, CostoUnitario: 0, CostoTotal: 0 })}
                            onRemoveNecesario={(i: number) => removeItem('RecursosNecesarios', i)}
                            onUpdateNecesario={(i: number, f: string, v: any) => updateItem('RecursosNecesarios', i, f, v)}
                            onAddProducto={() => addItem('ProductosEsperados', { tipo: '', cantidad: 1 })}
                            onRemoveProducto={(i: number) => removeItem('ProductosEsperados', i)}
                            onUpdateProducto={(i: number, f: string, v: any) => updateItem('ProductosEsperados', i, f, v)}
                            onUpdateImpacto={(t: string, v: any) => updateField('Impacto', { ...(formData?.Impacto || {}), [t.toLowerCase()]: v })}

                            {...listProps}
                        />
                    </div>
                );
            }}
        </DIITRABuilderShell>
    );
};

export default DocumentEditor;
