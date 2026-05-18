import React, { useState, useEffect } from 'react';
import { Users, FileText, DollarSign, Calendar, Target, BookOpen } from 'lucide-react';
import api from '../../../../api/axios_config';
import DIITRABuilderShell from '../../../../components/DIITRA/DIITRABuilderShell';
import { useDIITRADocument } from '../../../../core/documents/hooks/useDIITRADocument';

// Atomic Sections
import { GeneralSection } from '../../../../components/DIITRA/sections/GeneralSection';
import { TeamSection } from '../../../../components/DIITRA/sections/TeamSection';
import { BudgetSection } from '../../../../components/DIITRA/sections/BudgetSection';
import { TimelineSection } from '../../../../components/DIITRA/sections/TimelineSection';
import { ImpactSection } from '../../../../components/DIITRA/sections/ImpactSection';
import { TechnicalSection } from '../../../../components/DIITRA/sections/TechnicalSection';

/**
 * PROJECT WIZARD - ARQUITECTURA PROFESIONAL DIITRA v2.0
 * ---------------------------------------------------
 * Este componente es ahora un "Ensamblador". No contiene lógica de negocio
 * pesada ni infraestructura de sincronización. Todo ha sido modularizado
 * para permitir la creación de 30+ documentos con esfuerzo mínimo.
 */

const InitialSchema = {
    Titulo: '',
    IdCarrera: 0,
    IdConvocatoria: 0,
    Periodo: '',
    TiempoEjecucion: '',
    Antecedentes: '',
    ObjetivoGeneral: '',
    Investigadores: [],
    RecursosDisponibles: [],
    RecursosNecesarios: [],
    Cronograma: [],
    ProductosEsperados: [],
    Impacto: { social: '', cientifico: '', economico: '', ambiental: '' },
    CostoTotal: 0
};

const ProjectWizard: React.FC<{ initialData?: any; onClose: () => void }> = ({ initialData, onClose }) => {
    // 1. Estados de Referencia (Catálogos)
    const [carreras, setCarreras] = useState([]);
    const [convocatorias, setConvocatorias] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);

    // 2. Hook Maestro (Logic v2.0)
    const { 
        formData, 
        setFormData, 
        coworkRef, 
        addItem, 
        removeItem, 
        updateItem, 
        updateField 
    } = useDIITRADocument(initialData || InitialSchema, {
        lists: ['Investigadores', 'RecursosDisponibles', 'RecursosNecesarios', 'Cronograma', 'ProductosEsperados']
    });
    
    // 3. Lógica de Cálculos (Costo Total)
    useEffect(() => {
        const total = (formData.RecursosNecesarios || []).reduce((acc: number, curr: any) => acc + (Number(curr.CostoTotal) || 0), 0);
        if (total !== formData.CostoTotal) {
            updateField('CostoTotal', total);
        }
    }, [formData.RecursosNecesarios, formData.CostoTotal, updateField]);

    // 3. Carga de Catálogos
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [rCarreras, rConvocatorias, rTipos] = await Promise.all([
                    api.get('/Carreras'),
                    api.get('/Convocatorias/activas'),
                    api.get('/metadata/tipos-producto')
                ]);
                setCarreras(rCarreras.data);
                setConvocatorias(rConvocatorias.data);
                setTiposProducto(rTipos.data);
            } catch (e) { console.error("Error al cargar metadatos"); }
        };
        loadMetadata();
    }, []);

    // 4. Definición de Secciones para la Shell
    const sections = [
        { id: 'identificacion', label: 'Identificación', icon: <BookOpen size={18} /> },
        { id: 'tecnico', label: 'Plan Técnico', icon: <FileText size={18} /> },
        { id: 'equipo', label: 'Equipo Humano', icon: <Users size={18} /> },
        { id: 'recursos', label: 'Recursos', icon: <DollarSign size={18} /> },
        { id: 'cronograma', label: 'Cronograma', icon: <Calendar size={18} /> },
        { id: 'impactos', label: 'Impactos', icon: <Target size={18} /> }
    ];

    const handleSave = async (data: any) => {
        const endpoint = data.Uuid ? `/projects/${data.Uuid}` : '/projects';
        const method = data.Uuid ? 'put' : 'post';
        const response = await api[method](endpoint, data);
        if (!data.Uuid && response.data.Uuid) {
            setFormData((prev: any) => ({ ...prev, Uuid: response.data.Uuid }));
        }
    };

    return (
        <DIITRABuilderShell
            title="Formato Proyecto de Investigación"
            subtitle="Planificación y Estructuración de Proyectos I+D+i"
            templateCode="PROTOCOLO_INVESTIGACION"
            sections={sections}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onClose={onClose}
        >
            {(activeTab, cowork) => {
                // Inyectamos el handle de cowork al hook maestro una sola vez
                if (!coworkRef.current) coworkRef.current = cowork;

                return (
                    <div className="pb-20">
                        {activeTab === 'identificacion' && (
                            <GeneralSection 
                                formData={formData} 
                                cowork={cowork} 
                                carreras={carreras} 
                                convocatorias={convocatorias} 
                                onUpdate={updateField}
                            />
                        )}

                        {activeTab === 'tecnico' && (
                            <TechnicalSection 
                                cowork={cowork} 
                                onUpdate={updateField} 
                            />
                        )}

                        {activeTab === 'equipo' && (
                            <TeamSection 
                                investigadores={formData.Investigadores} 
                                cowork={cowork}
                                onAdd={() => addItem('Investigadores', { Nombre: '', Cedula: '', Email: '', Telefono: '', NivelAcademico: '', Rol: 'Investigador' })}
                                onRemove={(i) => removeItem('Investigadores', i)}
                                onUpdate={(i, f, v) => updateItem('Investigadores', i, f, v)}
                            />
                        )}

                        {activeTab === 'recursos' && (
                            <BudgetSection 
                                recursosDisponibles={formData.RecursosDisponibles}
                                recursosNecesarios={formData.RecursosNecesarios}
                                costoTotal={formData.CostoTotal}
                                cowork={cowork}
                                onAddDisponible={() => addItem('RecursosDisponibles', { Descripcion: '', Cantidad: 1 })}
                                onRemoveDisponible={(i) => removeItem('RecursosDisponibles', i)}
                                onUpdateDisponible={(i, f, v) => updateItem('RecursosDisponibles', i, f, v)}
                                onAddNecesario={() => addItem('RecursosNecesarios', { Descripcion: '', Cantidad: 1, CostoUnitario: 0, CostoTotal: 0 })}
                                onRemoveNecesario={(i) => removeItem('RecursosNecesarios', i)}
                                onUpdateNecesario={(i, f, v) => updateItem('RecursosNecesarios', i, f, v)}
                            />
                        )}

                        {activeTab === 'cronograma' && (
                            <TimelineSection 
                                cronograma={formData.Cronograma}
                                cowork={cowork}
                                onAdd={() => addItem('Cronograma', { Actividad: '', Numero: formData.Cronograma.length + 1, RecursosNecesarios: '' })}
                                onRemove={(i) => removeItem('Cronograma', i)}
                                onUpdate={(i, f, v) => updateItem('Cronograma', i, f, v)}
                            />
                        )}

                        {activeTab === 'impactos' && (
                            <ImpactSection 
                                productosEsperados={formData.ProductosEsperados}
                                tiposProducto={tiposProducto}
                                cowork={cowork}
                                onAddProducto={() => addItem('ProductosEsperados', { tipo: '', cantidad: 1 })}
                                onRemoveProducto={(i) => removeItem('ProductosEsperados', i)}
                                onUpdateProducto={(i, f, v) => updateItem('ProductosEsperados', i, f, v)}
                                onUpdateImpacto={(t, v) => updateField('Impacto', { ...formData.Impacto, [t.toLowerCase()]: v })}
                            />
                        )}
                    </div>
                );
            }}
        </DIITRABuilderShell>
    );
};

export default ProjectWizard;
