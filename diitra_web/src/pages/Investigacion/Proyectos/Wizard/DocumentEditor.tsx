import React, { useState, useEffect } from 'react';
import api from '../../../../api/axios_config';
import DIITRABuilderShell from '../../../../components/DIITRA/DIITRABuilderShell';
import { useDIITRADocument } from '../../../../core/documents/hooks/useDIITRADocument';
import { DocumentTemplateRegistry } from '../../../../core/documents/registry/DocumentTemplateRegistry';

/**
 * DOCUMENT EDITOR - ARQUITECTURA PROFESIONAL DIITRA v3.0 (Workspace)
 * ------------------------------------------------------------------
 * Este componente es completamente agnóstico. Renderiza dinámicamente
 * el esquema y las secciones basándose en el templateCode inyectado
 * por el Workspace (ej: PROTOCOLO_INVESTIGACION, RUBRICA_EVALUACION).
 */

interface DocumentEditorProps {
    templateCode: string;
    initialData?: any;
    onClose: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ templateCode, initialData, onClose }) => {
    const templateConfig = DocumentTemplateRegistry[templateCode];
    if (!templateConfig) {
        return <div className="p-8 text-red-500">Error: Plantilla {templateCode} no encontrada en el Registry.</div>;
    }

    // 1. Estados de Referencia (Catálogos globales)
    const [carreras, setCarreras] = useState([]);
    const [convocatorias, setConvocatorias] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);

    // 2. Hook Maestro con esquema dinámico
    const { 
        formData, 
        setFormData, 
        coworkRef, 
        addItem, 
        removeItem, 
        updateItem, 
        updateField 
    } = useDIITRADocument(initialData || templateConfig.schema, {
        lists: templateConfig.lists
    });
    
    // 3. Lógica de Cálculos Especiales (Solo si aplica)
    useEffect(() => {
        if (templateCode === 'PROTOCOLO_INVESTIGACION') {
            const total = (formData.RecursosNecesarios || []).reduce((acc: number, curr: any) => acc + (Number(curr.CostoTotal) || 0), 0);
            if (total !== formData.CostoTotal) {
                updateField('CostoTotal', total);
            }
        }
    }, [formData.RecursosNecesarios, formData.CostoTotal, updateField, templateCode]);

    // 4. Carga de Catálogos (Agnóstico, se cargan si existen APIs)
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

    const handleSave = async (data: any) => {
        try {
            if (data.Uuid) {
                // Actualización Agnóstica (Guarda el JSON puro en la base de datos sin mapeos forzados)
                await api.patch(`/documents/instances/${data.Uuid}/metadata`, data);
            } else {
                // Creación de nueva instancia agnóstica si no existe
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
            throw error; // Lanzamos el error para que el DIITRABuilderShell muestre el toast rojo
        }
    };

    // Mapear los iconos del registry a elementos de React
    const mappedSections = templateConfig.sections.map((sec: any) => ({
        ...sec,
        icon: <sec.icon size={18} />
    }));

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
                
                const SectionComponent = activeSectionConfig.component;

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
                            
                            // Props específicas para compatibilidad con secciones actuales
                            investigadores={formData.Investigadores}
                            recursosDisponibles={formData.RecursosDisponibles}
                            recursosNecesarios={formData.RecursosNecesarios}
                            costoTotal={formData.CostoTotal}
                            cronograma={formData.Cronograma}
                            productosEsperados={formData.ProductosEsperados}
                            
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
                            onUpdateImpacto={(t: string, v: any) => updateField('Impacto', { ...formData.Impacto, [t.toLowerCase()]: v })}
                        />
                    </div>
                );
            }}
        </DIITRABuilderShell>
    );
};

export default DocumentEditor;
