import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Target, Users, Plus, Trash2, BarChart3, ListChecks, DollarSign, Award, Calendar } from 'lucide-react';
import api from '../../../../api/axios_config';
import DIITRABuilderShell from '../../../../components/DIITRA/DIITRABuilderShell';
import CoWorkField from '../../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../../core/cowork/types';

interface ProjectWorkspaceProps {
    onClose: () => void;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ onClose }) => {
    const coworkRef = React.useRef<CoWorkHandle | null>(null);
    const [formData, setFormData] = useState({
        Uuid: '',
        Titulo: '',
        // ... rest of state stays same for local preview/save
        Programa: '',
        GrupoInvestigacion: '',
        Dominio: '',
        LineaInvestigacion: '',
        SublineaInvestigacion: '',
        TipoInvestigacion: 'Aplicada',
        CampoAmplio: '',
        CampoEspecifico: '',
        CampoDetallado: '',
        Carrera: '',
        Periodo: 'MARZO 2025 – SEPTIEMBRE 2025',
        TiempoEjecucion: '',
        NombreDirector: '',
        FechaInicioEstimada: '',
        FechaFinEstimada: '',
        Investigadores: [] as any[],
        Antecedentes: '',
        DescripcionProyecto: '',
        Justificacion: '',
        ObjetivoGeneral: '',
        ObjetivosEspecificos: [] as string[],
        Ods: '',
        MarcoTeorico: '',
        Metodologia: '',
        Evaluacion: '',
        RecursosDisponibles: [] as any[],
        RecursosNecesarios: [] as any[],
        CostoTotal: 0,
        FinanciamientoIstpet: true,
        FinanciamientoOtras: false,
        FinanciamientoNombres: '',
        ProductosEsperados: [] as any[],
        ImpactoSocial: false, ImpactoSocialDesc: '',
        ImpactoCientifico: false, ImpactoCientificoDesc: '',
        ImpactoEconomico: false, ImpactoEconomicoDesc: '',
        ImpactoPolitico: false, ImpactoPoliticoDesc: '',
        ImpactoAmbiental: false, ImpactoAmbientalDesc: '',
        ImpactoOtro: false, ImpactoOtroDesc: '',
        Cronograma: [] as any[],
        Bibliografia: '',
        NombreCoordinadorFirma: '',
        IdConvocatoria: 0,
        IdObjetivoPnd: 0,
        MatrizMarcoLogico: [
            { nivel: 'Fin', resumen: '', indicadores: '', medios: '', supuestos: '' },
            { nivel: 'Propósito', resumen: '', indicadores: '', medios: '', supuestos: '' },
            { nivel: 'Componentes', resumen: '', indicadores: '', medios: '', supuestos: '' },
            { nivel: 'Actividades', resumen: '', indicadores: '', medios: '', supuestos: '' }
        ] as any[],
        DocumentosAdjuntos: [] as any[]
    });

    const [convocatorias, setConvocatorias] = useState<any[]>([]);
    const [, setObjetivosPnd] = useState<any[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [convRes, pndRes] = await Promise.all([
                    api.get('/convocatorias'),
                    api.get('/pnd/objetivos')
                ]);
                setConvocatorias(convRes.data);
                setObjetivosPnd(pndRes.data);
            } catch (err) {
                console.error("Error fetching metadata", err);
            }
        };
        fetchMetadata();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        const val = type === 'checkbox' ? (e.target as any).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSave = async (data: any) => {
        const response = await api.post('/projects/save-preview-data', data);
        if (response.data.uuid && !formData.Uuid) {
            setFormData(prev => ({ ...prev, Uuid: response.data.uuid }));
        }
    };

    const addItem = (listName: string, template: any) => {
        if (coworkRef.current?.ydoc) {
            const yarray = coworkRef.current.ydoc.getArray(listName);
            yarray.push([template]);
        }
        setFormData(prev => ({ ...prev, [listName]: [...(prev as any)[listName], template] }));
    };

    const removeItem = (listName: string, index: number) => {
        if (coworkRef.current?.ydoc) {
            const yarray = coworkRef.current.ydoc.getArray(listName);
            if (index >= 0 && index < yarray.length) {
                yarray.delete(index, 1);
            }
        }
        setFormData(prev => ({ ...prev, [listName]: (prev as any)[listName].filter((_:any, i:number) => i !== index) }));
    };

    const updateItem = (listName: string, index: number, field: string, value: any) => {
        if (coworkRef.current?.ydoc) {
            const yarray = coworkRef.current.ydoc.getArray(listName);
            const currentItem = yarray.get(index) as any;
            if (currentItem) {
                const updatedItem = { ...currentItem, [field]: value };
                // Usamos una transacción para que sea atómico
                coworkRef.current.ydoc.transact(() => {
                    yarray.delete(index, 1);
                    yarray.insert(index, [updatedItem]);
                });
            }
        }
        
        setFormData(prev => {
            const newList = [...(prev as any)[listName]];
            newList[index] = { ...newList[index], [field]: value };
            return { ...prev, [listName]: newList };
        });
    };

    // MOTOR DE SINCRONIZACIÓN DE LISTAS (Y.Array)
    useEffect(() => {
        if (!coworkRef.current?.ydoc) return;

        const syncList = (listName: string) => {
            const yarray = coworkRef.current!.ydoc.getArray(listName);

            const applyIfChanged = () => {
                const newArr = yarray.toArray();
                setFormData((prev: any) => {
                    const oldArr = prev[listName];
                    if (JSON.stringify(oldArr) === JSON.stringify(newArr)) return prev;
                    return { ...prev, [listName]: newArr };
                });
            };

            if (yarray.length > 0) applyIfChanged();

            const observer = (event: any) => {
                if (event.transaction.origin === 'remote') {
                    applyIfChanged();
                }
            };
            yarray.observe(observer);
            return () => yarray.unobserve(observer);
        };

        const cleanups = [
            syncList('Investigadores'),
            syncList('Cronograma'),
            syncList('RecursosDisponibles'),
            syncList('RecursosNecesarios'),
            syncList('ProductosEsperados'),
            syncList('ObjetivosEspecificos')
        ];

        return () => cleanups.forEach(c => c?.());
    }, [formData.Uuid]); // Re-sync when document ID changes

    const sections = [
        { id: 'general', label: '01. Identificación', icon: <BookOpen size={16} /> },
        { id: 'pnd', label: '02. Alineación PND', icon: <Target size={16} /> },
        { id: 'equipo', label: '03. Equipo', icon: <Users size={16} /> },
        { id: 'tecnico', label: '04. Especificación', icon: <Target size={16} /> },
        { id: 'mml', label: '05. Marco Lógico', icon: <BarChart3 size={16} /> },
        { id: 'recursos', label: '06. Recursos', icon: <DollarSign size={16} /> },
        { id: 'impactos', label: '07. Productos e Impactos', icon: <Award size={16} /> },
        { id: 'cronograma', label: '08. Cronograma', icon: <Calendar size={16} /> },
        { id: 'documentos', label: '09. Documentos', icon: <ListChecks size={16} /> }
    ];

    return (
        <DIITRABuilderShell
            title="1. Formato Proyecto de Investigación"
            subtitle="Protocolo Oficial ISTPET v14.0 - FIDELIDAD ABSOLUTA"
            templateCode="PROTOCOLO_INVESTIGACION"
            sections={sections}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onClose={onClose}
        >
            {(activeTab, cowork) => {
                coworkRef.current = cowork;
                return (
                    <div className="space-y-8 pb-10">
                        {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-2 p-8 bg-surface border border-border-thin rounded-3xl space-y-6 shadow-sm">
                                <CoWorkField 
                                    name="Titulo" 
                                    cowork={cowork} 
                                    type="textarea" 
                                    label="Título del Proyecto (Protocolo Oficial ISTPET)"
                                    onValueChange={(v) => setFormData(p => ({...p, Titulo: v}))}
                                    className="w-full bg-bg-deep border border-border-thin rounded-2xl px-6 py-5 text-xl font-bold text-text-main resize-none h-32" 
                                />
                                
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-text-dim mb-2 block ml-1 tracking-widest">Convocatoria de Investigación</label>
                                        <select 
                                            name="IdConvocatoria"
                                            value={formData.IdConvocatoria}
                                            onChange={handleChange}
                                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm text-text-main outline-none focus:border-text-main transition-colors appearance-none"
                                        >
                                            <option value={0}>Seleccione una convocatoria...</option>
                                            {convocatorias.map(c => (
                                                <option key={c.id_convocatoria} value={c.id_convocatoria}>{c.codigo_convocatoria} - {c.titulo}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <CoWorkField 
                                            name="CodigoInstitucional" 
                                            cowork={cowork} 
                                            label="Código del Proyecto"
                                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm text-text-dim font-mono" 
                                            placeholder="Auto-generado..."
                                            readOnly
                                        />
                                        <CoWorkField 
                                            name="Periodo" 
                                            cowork={cowork} 
                                            label="Periodo Académico"
                                            onValueChange={(v) => setFormData(p => ({...p, Periodo: v}))}
                                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-surface border border-border-thin rounded-2xl space-y-4">
                                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Estructura Académica</p>
                                    <CoWorkField 
                                        name="Carrera" 
                                        cowork={cowork} 
                                        label="Tecnología Superior en" 
                                        onValueChange={(v) => setFormData(p => ({...p, Carrera: v}))}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm font-bold" 
                                    />
                                    <CoWorkField 
                                        name="NombreDirector" 
                                        cowork={cowork} 
                                        label="Director del Proyecto" 
                                        onValueChange={(v) => setFormData(p => ({...p, NombreDirector: v}))}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm font-bold" 
                                    />
                                </div>
                                <div className="p-6 bg-surface border border-border-thin rounded-2xl space-y-4">
                                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Líneas y Sublíneas</p>
                                    <CoWorkField 
                                        name="LineaInvestigacion" 
                                        cowork={cowork} 
                                        label="Línea de Investigación Principal" 
                                        onValueChange={(v) => setFormData(p => ({...p, LineaInvestigacion: v}))}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm font-bold" 
                                    />
                                    <CoWorkField 
                                        name="SublineaInvestigacion" 
                                        cowork={cowork} 
                                        label="Sublínea de Investigación" 
                                        onValueChange={(v) => setFormData(p => ({...p, SublineaInvestigacion: v}))}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-surface border border-border-thin rounded-2xl space-y-4">
                                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Gestión Organizacional</p>
                                    <CoWorkField 
                                        name="Programa" 
                                        cowork={cowork} 
                                        label="Programa de Investigación" 
                                        onValueChange={(v) => setFormData(p => ({...p, Programa: v}))}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm font-bold" 
                                    />
                                    <CoWorkField 
                                        name="GrupoInvestigacion" 
                                        cowork={cowork} 
                                        label="Grupo de Investigación" 
                                        onValueChange={(v) => setFormData(p => ({...p, GrupoInvestigacion: v}))}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm" 
                                    />
                                    <CoWorkField 
                                        name="Dominio" 
                                        cowork={cowork} 
                                        label="Dominio Institucional" 
                                        onValueChange={(v) => setFormData(p => ({...p, Dominio: v}))}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm" 
                                    />
                                </div>
                                <CoWorkField 
                                    name="TipoInvestigacion" 
                                    cowork={cowork} 
                                    type="select"
                                    label="Tipo de Investigación (SENESCYT)" 
                                    onValueChange={(v) => setFormData(p => ({...p, TipoInvestigacion: v}))}
                                    className="w-full bg-surface border border-border-thin rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                                >
                                    <option value="Basica">BÁSICA</option>
                                    <option value="Aplicada">APLICADA</option>
                                    <option value="Experimental">DESARROLLO EXPERIMENTAL</option>
                                </CoWorkField>
                            </div>
                        </div>
                    )}

                    {activeTab === 'equipo' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Users size={18}/> 2. Investigadores (Docentes y Estudiantes)</h4>
                                <button onClick={() => addItem('Investigadores', { nombre: '', cedula: '', email: '', telefono: '', nivel: '', rol: 'Docente' })} className="px-5 py-2.5 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 shadow-lg"><Plus size={16}/> Añadir Investigador</button>
                            </div>
                            <div className="space-y-4">
                                {formData.Investigadores.map((_inv, idx) => (
                                    <div key={idx} className="p-8 bg-surface border border-border-thin rounded-3xl shadow-sm animate-fade-in relative">
                                        <button onClick={()=>removeItem('Investigadores', idx)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={18}/></button>
                                        <div className="grid grid-cols-12 gap-6">
                                            <div className="col-span-5">
                                                <CoWorkField 
                                                    name={`Inv_${idx}_nombre`} 
                                                    cowork={cowork} 
                                                    label="Nombre y Apellidos Completos"
                                                    onValueChange={(v) => updateItem('Investigadores', idx, 'nombre', v)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs font-bold"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <CoWorkField 
                                                    name={`Inv_${idx}_cedula`} 
                                                    cowork={cowork} 
                                                    label="N.° Cédula"
                                                    onValueChange={(v) => updateItem('Investigadores', idx, 'cedula', v)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <CoWorkField 
                                                    name={`Inv_${idx}_email`} 
                                                    cowork={cowork} 
                                                    label="Email Institucional"
                                                    onValueChange={(v) => updateItem('Investigadores', idx, 'email', v)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <CoWorkField 
                                                    name={`Inv_${idx}_telefono`} 
                                                    cowork={cowork} 
                                                    label="Teléfono de Contacto"
                                                    onValueChange={(v) => updateItem('Investigadores', idx, 'telefono', v)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                                />
                                            </div>
                                            <div className="col-span-5">
                                                <CoWorkField 
                                                    name={`Inv_${idx}_nivel`} 
                                                    cowork={cowork} 
                                                    label="Nivel Académico (Título Senescyt)"
                                                    onValueChange={(v) => updateItem('Investigadores', idx, 'nivel', v)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                                    placeholder="Ej: Magíster en..."
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <CoWorkField 
                                                    name={`Inv_${idx}_rol`} 
                                                    cowork={cowork} 
                                                    label="Rol en el ISTPET"
                                                    onValueChange={(v) => updateItem('Investigadores', idx, 'rol', v)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tecnico' && (
                        <div className="space-y-8">
                            <div>
                                <CoWorkField 
                                    name="Antecedentes" 
                                    cowork={cowork} 
                                    type="textarea" 
                                    label="Antecedentes Específicos (Mín. 2 párrafos / 8-12 líneas)"
                                    onValueChange={(v) => setFormData(p => ({...p, Antecedentes: v}))}
                                    className="w-full h-56 bg-surface border border-border-thin rounded-2xl px-8 py-6 text-sm text-text-main shadow-inner" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <CoWorkField 
                                        name="DescripcionProyecto" 
                                        cowork={cowork} 
                                        type="textarea" 
                                        label="Descripción del Proyecto (Alcance)"
                                        onValueChange={(v) => setFormData(p => ({...p, DescripcionProyecto: v}))}
                                        className="w-full h-40 bg-surface border border-border-thin rounded-2xl px-6 py-5 text-sm" 
                                    />
                                </div>
                                <div>
                                    <CoWorkField 
                                        name="Justificacion" 
                                        cowork={cowork} 
                                        type="textarea" 
                                        label="Justificación Institucional"
                                        onValueChange={(v) => setFormData(p => ({...p, Justificacion: v}))}
                                        className="w-full h-40 bg-surface border border-border-thin rounded-2xl px-6 py-5 text-sm" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-6 p-6 bg-surface border border-border-thin rounded-2xl">
                                <div className="flex justify-between items-center px-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-dim flex items-center gap-2"><Target size={14}/> Objetivos Específicos (Mín. 3)</h4>
                                    <button onClick={() => addItem('ObjetivosEspecificos', '')} className="p-2 bg-text-main text-bg-deep rounded-lg hover:opacity-90"><Plus size={14}/></button>
                                </div>
                                <div className="space-y-3">
                                    {formData.ObjetivosEspecificos.map((_obj, i) => (
                                        <div key={i} className="flex gap-4 items-start group">
                                            <div className="mt-4 w-2 h-2 rounded-full bg-text-main/20 group-hover:bg-text-main transition-colors" />
                                            <div className="flex-1">
                                                <CoWorkField 
                                                    name={`ObjEsp_${i}`} 
                                                    cowork={cowork} 
                                                    placeholder="Defina un objetivo específico..."
                                                    onValueChange={(v) => {
                                                        const newList = [...formData.ObjetivosEspecificos];
                                                        newList[i] = v;
                                                        setFormData(p => ({...p, ObjetivosEspecificos: newList}));
                                                        
                                                        // Sync to Y.Array
                                                        if (coworkRef.current?.ydoc) {
                                                            const yarray = coworkRef.current.ydoc.getArray('ObjetivosEspecificos');
                                                            yarray.delete(i, 1);
                                                            yarray.insert(i, [v]);
                                                        }
                                                    }}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm" 
                                                />
                                            </div>
                                            <button onClick={()=>removeItem('ObjetivosEspecificos', i)} className="mt-3 p-2 text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <CoWorkField 
                                    name="ObjetivoGeneral" 
                                    cowork={cowork} 
                                    type="textarea" 
                                    label="Objetivo General"
                                    onValueChange={(v) => setFormData(p => ({...p, ObjetivoGeneral: v}))}
                                    className="w-full h-32 bg-surface border border-border-thin rounded-2xl px-6 py-5 text-sm font-bold" 
                                />
                                <CoWorkField 
                                    name="MarcoTeorico" 
                                    cowork={cowork} 
                                    type="textarea" 
                                    label="Resumen del Marco Teórico"
                                    onValueChange={(v) => setFormData(p => ({...p, MarcoTeorico: v}))}
                                    className="w-full h-32 bg-surface border border-border-thin rounded-2xl px-6 py-5 text-sm" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <CoWorkField 
                                    name="Metodologia" 
                                    cowork={cowork} 
                                    type="textarea" 
                                    label="Metodología (Diseño, Población, Técnicas)"
                                    onValueChange={(v) => setFormData(p => ({...p, Metodologia: v}))}
                                    className="w-full h-48 bg-surface border border-border-thin rounded-2xl px-8 py-6 text-sm" 
                                />
                                <CoWorkField 
                                    name="Evaluacion" 
                                    cowork={cowork} 
                                    type="textarea" 
                                    label="Evaluación y Seguimiento"
                                    onValueChange={(v) => setFormData(p => ({...p, Evaluacion: v}))}
                                    className="w-full h-48 bg-surface border border-border-thin rounded-2xl px-8 py-6 text-sm" 
                                />
                            </div>
                            <div className="space-y-8">
                                <CoWorkField 
                                    name="Bibliografia" 
                                    cowork={cowork} 
                                    type="textarea" 
                                    label="Bibliografía (Normas APA 7ma Edición)"
                                    onValueChange={(v) => setFormData(p => ({...p, Bibliografia: v}))}
                                    className="w-full h-48 bg-bg-deep border border-border-thin rounded-xl px-6 py-5 text-sm text-text-main outline-none resize-none font-mono" 
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'mml' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center px-2">
                                <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><BarChart3 size={18}/> 5. Matriz de Marco Lógico (MML)</h4>
                                <div className="text-[9px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full uppercase">Requerido SENESCYT</div>
                            </div>
                            <div className="overflow-hidden border border-border-thin rounded-3xl bg-surface shadow-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-bg-deep/50 border-b border-border-thin">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim w-32">Nivel</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim">Resumen Narrativo</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim">Indicadores</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim">Medios de Verificación</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-text-dim">Supuestos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-thin">
                                        {formData.MatrizMarcoLogico.map((row, idx) => (
                                            <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-8 align-top">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-main">{row.nivel}</span>
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <CoWorkField 
                                                        name={`MML_${idx}_resumen`} 
                                                        cowork={cowork} 
                                                        type="textarea"
                                                        placeholder={`Escriba el ${row.nivel}...`}
                                                        onValueChange={(v) => {
                                                            const newMml = [...formData.MatrizMarcoLogico];
                                                            newMml[idx].resumen = v;
                                                            setFormData({...formData, MatrizMarcoLogico: newMml});
                                                        }}
                                                        className="w-full min-h-[120px] bg-bg-deep/50 border border-border-thin rounded-xl px-4 py-3 text-xs leading-relaxed focus:bg-bg-deep transition-all"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <CoWorkField 
                                                        name={`MML_${idx}_ind`} 
                                                        cowork={cowork} 
                                                        type="textarea"
                                                        onValueChange={(v) => {
                                                            const newMml = [...formData.MatrizMarcoLogico];
                                                            newMml[idx].indicadores = v;
                                                            setFormData({...formData, MatrizMarcoLogico: newMml});
                                                        }}
                                                        className="w-full min-h-[120px] bg-bg-deep/50 border border-border-thin rounded-xl px-4 py-3 text-xs"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <CoWorkField 
                                                        name={`MML_${idx}_medios`} 
                                                        cowork={cowork} 
                                                        type="textarea"
                                                        onValueChange={(v) => {
                                                            const newMml = [...formData.MatrizMarcoLogico];
                                                            newMml[idx].medios = v;
                                                            setFormData({...formData, MatrizMarcoLogico: newMml});
                                                        }}
                                                        className="w-full min-h-[120px] bg-bg-deep/50 border border-border-thin rounded-xl px-4 py-3 text-xs"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <CoWorkField 
                                                        name={`MML_${idx}_sup`} 
                                                        cowork={cowork} 
                                                        type="textarea"
                                                        onValueChange={(v) => {
                                                            const newMml = [...formData.MatrizMarcoLogico];
                                                            newMml[idx].supuestos = v;
                                                            setFormData({...formData, MatrizMarcoLogico: newMml});
                                                        }}
                                                        className="w-full min-h-[120px] bg-bg-deep/50 border border-border-thin rounded-xl px-4 py-3 text-xs"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'recursos' && (
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2"><DollarSign size={18}/> 4. Recursos y Presupuesto</h4>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-6 bg-surface border border-border-thin rounded-2xl">
                                        <div className="flex justify-between items-center mb-6">
                                            <p className="text-[10px] font-black uppercase text-text-dim">4.1 Recursos Disponibles</p>
                                            <button onClick={() => addItem('RecursosDisponibles', { descripcion: '', cantidad: 1, fuente: 'Instituto' })} className="p-2 bg-text-main text-bg-deep rounded-lg"><Plus size={14}/></button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.RecursosDisponibles.map((_r, i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <CoWorkField 
                                                        name={`RecDisp_${i}_desc`} 
                                                        cowork={cowork} 
                                                        placeholder="Descripción..."
                                                        onValueChange={(v) => updateItem('RecursosDisponibles', i, 'descripcion', v)}
                                                        className="flex-1 bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs" 
                                                    />
                                                    <div className="w-16">
                                                        <CoWorkField 
                                                            name={`RecDisp_${i}_cant`} 
                                                            cowork={cowork} 
                                                            onValueChange={(v) => updateItem('RecursosDisponibles', i, 'cantidad', v)}
                                                            className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-center" 
                                                        />
                                                    </div>
                                                    <button onClick={()=>removeItem('RecursosDisponibles', i)} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg"><Trash2 size={14}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-6 bg-surface border border-border-thin rounded-2xl">
                                        <div className="flex justify-between items-center mb-6">
                                            <p className="text-[10px] font-black uppercase text-text-dim">4.2 Recursos Necesarios (Gasto)</p>
                                            <button onClick={() => addItem('RecursosNecesarios', { descripcion: '', cantidad: 1, unitario: 0, total: 0 })} className="p-2 bg-text-main text-bg-deep rounded-lg"><Plus size={14}/></button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.RecursosNecesarios.map((r, i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <CoWorkField 
                                                        name={`RecNec_${i}_desc`} 
                                                        cowork={cowork} 
                                                        placeholder="Rubro..."
                                                        onValueChange={(v) => updateItem('RecursosNecesarios', i, 'descripcion', v)}
                                                        className="flex-1 bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs" 
                                                    />
                                                    <div className="w-24">
                                                        <CoWorkField 
                                                            name={`RecNec_${i}_unit`} 
                                                            cowork={cowork} 
                                                            onValueChange={(v) => {
                                                                const u = parseFloat(v);
                                                                updateItem('RecursosNecesarios', i, 'unitario', u);
                                                                updateItem('RecursosNecesarios', i, 'total', r.cantidad * u);
                                                            }}
                                                            className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-right" 
                                                            placeholder="$ 0.00"
                                                        />
                                                    </div>
                                                    <button onClick={()=>removeItem('RecursosNecesarios', i)} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg"><Trash2 size={14}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'impactos' && (
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Award size={18}/> 5. Productos Esperados</h4>
                                    <button onClick={() => addItem('ProductosEsperados', { tipo: '', cantidad: 1 })} className="px-4 py-2 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase">+ Añadir Producto</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {formData.ProductosEsperados.map((_p, i) => (
                                        <div key={i} className="p-4 bg-surface border border-border-thin rounded-xl flex gap-4 items-center animate-fade-in">
                                            <div className="flex-1">
                                                <CoWorkField 
                                                    name={`Prod_${i}_tipo`} 
                                                    cowork={cowork} 
                                                    placeholder="Ej: Publicación Científica..."
                                                    onValueChange={(v) => updateItem('ProductosEsperados', i, 'tipo', v)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2 text-xs" 
                                                />
                                            </div>
                                            <div className="w-16">
                                                <CoWorkField 
                                                    name={`Prod_${i}_cant`} 
                                                    cowork={cowork} 
                                                    onValueChange={(v) => updateItem('ProductosEsperados', i, 'cantidad', v)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-center" 
                                                />
                                            </div>
                                            <button onClick={()=>removeItem('ProductosEsperados', i)} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black uppercase tracking-widest px-2">6. Matriz de Impacto</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {['Social', 'Cientifico', 'Economico', 'Politico', 'Ambiental', 'Otro'].map((tipo) => (
                                        <div key={tipo} className="p-5 bg-surface border border-border-thin rounded-2xl flex gap-6 items-center">
                                            <div className="flex items-center gap-3 w-32">
                                                <CoWorkField 
                                                    name={`Impacto${tipo}`} 
                                                    cowork={cowork} 
                                                    type="checkbox" 
                                                    label={tipo}
                                                    onValueChange={(v) => setFormData(p => ({...p, [`Impacto${tipo}`]: v}))}
                                                />
                                            </div>
                                            <CoWorkField 
                                                name={`Impacto${tipo}Desc`} 
                                                cowork={cowork} 
                                                placeholder="Descripción breve del impacto..."
                                                onValueChange={(v) => setFormData(p => ({...p, [`Impacto${tipo}Desc`]: v}))}
                                                className="flex-1 bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-xs" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cronograma' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center px-2">
                                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Calendar size={18}/> 7. Cronograma de Actividades</h4>
                                <button onClick={() => addItem('Cronograma', { actividad: '', mes: 'Mes 1', recursos: '' })} className="px-5 py-2.5 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest">+ Nueva Actividad</button>
                            </div>
                            <div className="space-y-4">
                                {formData.Cronograma.map((_c, i) => (
                                    <div key={i} className="p-6 bg-surface border border-border-thin rounded-2xl flex gap-6 items-end shadow-sm">
                                        <div className="flex-1">
                                            <CoWorkField 
                                                name={`Cron_${i}_act`} 
                                                cowork={cowork} 
                                                label="Actividad"
                                                onValueChange={(v) => updateItem('Cronograma', i, 'actividad', v)}
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs font-bold"
                                            />
                                        </div>
                                        <div className="w-40">
                                            <CoWorkField 
                                                name={`Cron_${i}_mes`} 
                                                cowork={cowork} 
                                                label="Mes"
                                                onValueChange={(v) => updateItem('Cronograma', i, 'mes', v)}
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs"
                                            />
                                        </div>
                                        <div className="w-48">
                                            <CoWorkField 
                                                name={`Cron_${i}_rec`} 
                                                cowork={cowork} 
                                                label="Recursos"
                                                onValueChange={(v) => updateItem('Cronograma', i, 'recursos', v)}
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs"
                                            />
                                        </div>
                                        <button onClick={()=>removeItem('Cronograma', i)} className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'documentos' && (
                        <div className="space-y-8">
                            <div className="p-8 bg-surface border border-border-thin rounded-3xl space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ListChecks size={18}/> 9. Requisitos de Postulación</h4>
                                        <p className="text-[10px] text-text-dim">Cargue los anexos obligatorios según la convocatoria seleccionada.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-bg-deep border border-border-thin rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-text-main/10 flex items-center justify-center text-text-main font-black text-xs">
                                            {Math.round((formData.DocumentosAdjuntos.length / (convocatorias.find(c => c.id_convocatoria == formData.IdConvocatoria)?.documentos_req?.length || 1)) * 100)}%
                                        </div>
                                        <div className="text-[10px] font-black uppercase text-text-dim leading-none">Completado</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {convocatorias.find(c => c.id_convocatoria == formData.IdConvocatoria)?.documentos_req?.map((req: any) => (
                                        <div key={req.uuid} className="p-6 bg-bg-deep border border-border-thin rounded-2xl flex justify-between items-center group hover:border-text-main/30 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.DocumentosAdjuntos.find(d => d.idDocReq == req.id_doc_req) ? 'bg-green-500/10 text-green-500' : 'bg-surface text-text-dim'}`}>
                                                    <ListChecks size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-text-main">{req.nombre_documento}</p>
                                                    <div className="flex items-center gap-3">
                                                        {req.es_obligatorio && <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Obligatorio</span>}
                                                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-tighter">Formato: {req.formato_aceptado || 'PDF'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {formData.DocumentosAdjuntos.find(d => d.idDocReq == req.id_doc_req) ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-green-500 uppercase">Cargado</span>
                                                        <button className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"><Trash2 size={14}/></button>
                                                    </div>
                                                ) : (
                                                    <label className="px-6 py-2.5 bg-surface border border-border-thin rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-text-main hover:text-bg-deep transition-all">
                                                        Subir Archivo
                                                        <input type="file" className="hidden" accept=".pdf" />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!formData.IdConvocatoria || formData.IdConvocatoria == 0) && (
                                        <div className="p-12 text-center bg-bg-deep/50 border-2 border-dashed border-border-thin rounded-3xl">
                                            <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Debe seleccionar una convocatoria en la pestaña de Identificación para ver los requisitos.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                );
            }}
        </DIITRABuilderShell>
    );
};

export default ProjectWorkspace;
