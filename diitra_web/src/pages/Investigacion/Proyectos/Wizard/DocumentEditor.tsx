import React, { useState, useEffect } from 'react';
import api from '../../../../api/axios_config';
import DIITRABuilderShell from '../../../../components/DIITRA/DIITRABuilderShell';
import { useDIITRADocument } from '../../../../core/documents/hooks/useDIITRADocument';
import { DocumentTemplateRegistry } from '../../../../core/documents/registry/DocumentTemplateRegistry';
import { AgnosticSection } from '../../../../components/DIITRA/sections/AgnosticSection';
import { BookOpen, FileText, Users, DollarSign, Calendar, Target, CheckSquare, BarChart, Loader } from 'lucide-react';

const iconMap: Record<string, any> = {
    BookOpen,
    FileText,
    Users,
    DollarSign,
    Calendar,
    Target,
    CheckSquare,
    BarChart
};

/**
 * DOCUMENT EDITOR - ARQUITECTURA PROFESIONAL DIITRA v3.0 (Workspace)
 * ------------------------------------------------------------------
 * Este componente es completamente agnóstico y dinámico.
 * 1. Intenta cargar la interfaz en caliente desde el backend (Metadata-Driven).
 * 2. Si falla, hace fallback de forma segura a la configuración local (Registry).
 */

interface DocumentEditorProps {
    templateCode: string;
    initialData?: any;
    onClose: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ templateCode, initialData, onClose }) => {
    const [templateConfig, setTemplateConfig] = useState<any>(null);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

    // 1. Estados de Referencia (Catálogos globales)
    const [carreras, setCarreras] = useState([]);
    const [convocatorias, setConvocatorias] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);

    // 2. Cargar Configuración de la Plantilla en Caliente (Backend Metadata-Driven UI)
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await api.get(`/documents/instances/templates/${templateCode}/ui-config`);
                setTemplateConfig(response.data);
            } catch (err) {
                console.warn(`[DIITRA] Fallback a Registro local para plantilla ${templateCode}`);
                setTemplateConfig(DocumentTemplateRegistry[templateCode]);
            } finally {
                setIsLoadingTemplate(false);
            }
        };
        fetchConfig();
    }, [templateCode]);

    // 3. Carga de Catálogos (Agnóstico, se cargan si existen APIs)
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [rCarreras, rConvocatorias, rTipos] = await Promise.all([
                    api.get('/catalogs/carreras').catch(() => ({ data: [] })),
                    api.get('/Convocatorias').catch(() => ({ data: [] })),
                    api.get('/catalogs/tipo-producto').catch(() => ({ data: [] }))
                ]);
                setCarreras(rCarreras.data);
                const activeConvs = (rConvocatorias.data || []).filter((c: any) => c.estado === 'Abierta' || c.estado === 'Activa');
                setConvocatorias(activeConvs.length > 0 ? activeConvs : rConvocatorias.data);
                setTiposProducto(rTipos.data);
            } catch (e) { console.error("Error al cargar metadatos", e); }
        };
        loadMetadata();
    }, []);

    // 4. Hook Maestro con esquema dinámico
    const { 
        formData, 
        setFormData, 
        coworkRef, 
        addItem, 
        removeItem, 
        updateItem, 
        updateField 
    } = useDIITRADocument(initialData || (templateConfig?.schema || {}), {
        lists: templateConfig?.lists || []
    });
    
    // Sincronizar datos iniciales cuando el esquema termine de cargar
    useEffect(() => {
        if (templateConfig && !initialData) {
            setFormData(templateConfig.schema);
        }
    }, [templateConfig, initialData, setFormData]);

    // 5. Lógica de Cálculos Especiales (Solo si aplica)
    useEffect(() => {
        if (templateCode === 'PROTOCOLO_INVESTIGACION' && formData) {
            const total = (formData.RecursosNecesarios || []).reduce((acc: number, curr: any) => acc + (Number(curr.CostoTotal) || 0), 0);
            if (total !== formData.CostoTotal) {
                updateField('CostoTotal', total);
            }
        }
    }, [formData?.RecursosNecesarios, formData?.CostoTotal, updateField, templateCode]);

    const handleSave = async (data: any) => {
        try {
            if (data.Uuid) {
                await api.patch(`/documents/instances/${data.Uuid}/metadata`, data);
            } else {
                const response = await api.post('/documents/instances', { 
                    templateCode, 
                    entityUuid: 'GLOBAL', 
                    title: data.Titulo || data.title || `Documento ${templateCode}`
                });
                if (response.data?.uuid) {
                    setFormData((prev: any) => ({ ...prev, Uuid: response.data.uuid }));
                }
            }
        } catch (error) {
            console.error("[DIITRA] Error al guardar documento agnóstico:", error);
            throw error;
        }
    };

    if (isLoadingTemplate) {
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
                        No se pudo resolver la estructura de la plantilla "{templateCode}" ni cargar el respaldo de seguridad local.
                    </p>
                    <button onClick={onClose} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all text-xs uppercase tracking-widest">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    // Mapear los iconos del registry (o nombres de iconos del backend) a elementos de React
    const mappedSections = templateConfig.sections.map((sec: any) => {
        const IconComponent = sec.icon || iconMap[sec.iconName] || FileText;
        return {
            ...sec,
            icon: <IconComponent size={18} />
        };
    });

    return (
        <DIITRABuilderShell
            title={templateConfig.title}
            subtitle={templateConfig.subtitle}
            templateCode={templateCode}
            sections={mappedSections}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onClose={onClose}
        >
            {(activeTab, cowork) => {
                if (!coworkRef.current) coworkRef.current = cowork;

                const activeSectionConfig = templateConfig.sections.find((s: any) => s.id === activeTab);
                if (!activeSectionConfig) return null;
                
                const SectionComponent = activeSectionConfig.component || AgnosticSection;

                // Props específicas para compatibilidad
                let sectionProps: any = {};
                if (activeTab === 'equipo') {
                    sectionProps = {
                        onAdd: () => addItem('Investigadores', { Nombre: '', Cedula: '', Email: '', Telefono: '', NivelAcademico: '', Rol: '' }),
                        onRemove: (i: number) => removeItem('Investigadores', i),
                        onUpdate: (i: number, f: string, v: any) => updateItem('Investigadores', i, f, v)
                    };
                } else if (activeTab === 'cronograma') {
                    sectionProps = {
                        onAdd: () => addItem('Cronograma', { Actividad: '', Numero: 1, RecursosNecesarios: '' }),
                        onRemove: (i: number) => removeItem('Cronograma', i),
                        onUpdate: (i: number, f: string, v: any) => updateItem('Cronograma', i, f, v)
                    };
                }

                return (
                    <div className="pb-20">
                        <SectionComponent 
                            formData={formData}
                            cowork={cowork}
                            onUpdate={updateField}
                            activeTab={activeTab}
                            templateCode={templateCode}
                            carreras={carreras}
                            convocatorias={convocatorias}
                            tiposProducto={tiposProducto}
                            config={activeSectionConfig.config} // Inyectar config dinámico del backend para AgnosticSection
                            
                            // Props específicas para compatibilidad con secciones actuales
                            investigadores={formData?.Investigadores || []}
                            recursosDisponibles={formData?.RecursosDisponibles || []}
                            recursosNecesarios={formData?.RecursosNecesarios || []}
                            costoTotal={formData?.CostoTotal || 0}
                            cronograma={formData?.Cronograma || []}
                            productosEsperados={formData?.ProductosEsperados || []}
                            
                            // Handlers genéricos y específicos
                            onAdd={(list: string, tpl: any) => addItem(list, tpl)}
                            onRemove={(list: string, i: number) => removeItem(list, i)}
                            onUpdateItem={(list: string, i: number, f: string, v: any) => updateItem(list, i, f, v)}
                            
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
                            
                            // Overriding generic handlers
                            {...sectionProps}
                        />
                    </div>
                );
            }}
        </DIITRABuilderShell>
    );
};

export default DocumentEditor;
