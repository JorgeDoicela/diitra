import React, { useState } from 'react';
import { BookOpen, Target, Users, Plus, Trash2, BarChart3, ListChecks, DollarSign, Award, Calendar } from 'lucide-react';
import api from '../../../../api/axios_config';
import DIITRABuilderShell from '../../../../components/DIITRA/DIITRABuilderShell';

interface ProjectWorkspaceProps {
    onClose: () => void;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ onClose }) => {
    const [formData, setFormData] = useState({
        Uuid: '',
        Titulo: '',
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
        NombreCoordinadorFirma: ''
    });

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
        setFormData(prev => ({ ...prev, [listName]: [...(prev as any)[listName], template] }));
    };

    const removeItem = (listName: string, index: number) => {
        setFormData(prev => ({ ...prev, [listName]: (prev as any)[listName].filter((_:any, i:number) => i !== index) }));
    };

    const updateItem = (listName: string, index: number, field: string, value: any) => {
        const newList = [...(formData as any)[listName]];
        newList[index] = { ...newList[index], [field]: value };
        setFormData(prev => ({ ...prev, [listName]: newList }));
    };

    const sections = [
        { id: 'general', label: '01. Identificación', icon: <BookOpen size={16} /> },
        { id: 'equipo', label: '02. Equipo', icon: <Users size={16} /> },
        { id: 'tecnico', label: '03. Especificación', icon: <Target size={16} /> },
        { id: 'recursos', label: '04. Recursos', icon: <DollarSign size={16} /> },
        { id: 'impactos', label: '05. Productos e Impactos', icon: <Award size={16} /> },
        { id: 'cronograma', label: '06. Cronograma', icon: <Calendar size={16} /> },
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
            {(activeTab) => (
                <div className="animate-fade-in space-y-8 pb-10">
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-2 p-6 bg-surface border border-border-thin rounded-2xl">
                                <label className="block text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-4">Título del Proyecto (En Mayúsculas)</label>
                                <textarea name="Titulo" value={formData.Titulo} onChange={handleChange} className="w-full bg-bg-deep border border-border-thin rounded-xl px-6 py-5 text-lg font-bold text-text-main focus:border-text-main outline-none transition-all resize-none h-28" />
                            </div>
                            <div className="space-y-6">
                                <div><label className="block text-[9px] font-black text-text-dim uppercase mb-2">Tecnología Superior en</label><input name="Carrera" value={formData.Carrera} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded-xl px-5 py-4 text-sm font-bold" /></div>
                                <div><label className="block text-[9px] font-black text-text-dim uppercase mb-2">Periodo Académico</label><input name="Periodo" value={formData.Periodo} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded-xl px-5 py-4 text-sm" /></div>
                                <div><label className="block text-[9px] font-black text-text-dim uppercase mb-2">Director del Proyecto (Tít. Abv., Nombres y Apellidos)</label><input name="NombreDirector" value={formData.NombreDirector} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded-xl px-5 py-4 text-sm font-bold" /></div>
                            </div>
                            <div className="space-y-6">
                                <div><label className="block text-[9px] font-black text-text-dim uppercase mb-2">Grupo de Investigación (Opcional)</label><input name="GrupoInvestigacion" value={formData.GrupoInvestigacion} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded-xl px-5 py-4 text-sm" placeholder="Escriba el nombre si aplica..." /></div>
                                <div><label className="block text-[9px] font-black text-text-dim uppercase mb-2">Tiempo de Ejecución</label><input name="TiempoEjecucion" value={formData.TiempoEjecucion} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded-xl px-5 py-4 text-sm" placeholder="Ej: 12 meses" /></div>
                                <div>
                                    <label className="block text-[9px] font-black text-text-dim uppercase mb-2">Tipo de Investigación</label>
                                    <select name="TipoInvestigacion" value={formData.TipoInvestigacion} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded-xl px-5 py-4 text-sm font-bold">
                                        <option value="Basica">BÁSICA</option>
                                        <option value="Aplicada">APLICADA</option>
                                        <option value="Experimental">DESARROLLO EXPERIMENTAL</option>
                                    </select>
                                </div>
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
                                {formData.Investigadores.map((inv, idx) => (
                                    <div key={idx} className="p-8 bg-surface border border-border-thin rounded-3xl shadow-sm animate-fade-in relative">
                                        <button onClick={()=>removeItem('Investigadores', idx)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={18}/></button>
                                        <div className="grid grid-cols-12 gap-6">
                                            <div className="col-span-5"><label className="text-[9px] font-black text-text-dim uppercase mb-2 block">Nombre y Apellidos Completos</label><input value={inv.nombre} onChange={(e)=>updateItem('Investigadores', idx, 'nombre', e.target.value)} className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs font-bold"/></div>
                                            <div className="col-span-3"><label className="text-[9px] font-black text-text-dim uppercase mb-2 block">N.° Cédula</label><input value={inv.cedula} onChange={(e)=>updateItem('Investigadores', idx, 'cedula', e.target.value)} className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"/></div>
                                            <div className="col-span-4"><label className="text-[9px] font-black text-text-dim uppercase mb-2 block">Email Institucional</label><input value={inv.email} onChange={(e)=>updateItem('Investigadores', idx, 'email', e.target.value)} className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"/></div>
                                            <div className="col-span-3"><label className="text-[9px] font-black text-text-dim uppercase mb-2 block">Teléfono de Contacto</label><input value={inv.telefono} onChange={(e)=>updateItem('Investigadores', idx, 'telefono', e.target.value)} className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"/></div>
                                            <div className="col-span-5"><label className="text-[9px] font-black text-text-dim uppercase mb-2 block">Nivel Académico (Título Senescyt)</label><input value={inv.nivel} onChange={(e)=>updateItem('Investigadores', idx, 'nivel', e.target.value)} className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs" placeholder="Ej: Magíster en..."/></div>
                                            <div className="col-span-4"><label className="text-[9px] font-black text-text-dim uppercase mb-2 block">Rol en el ISTPET</label><input value={inv.rol} onChange={(e)=>updateItem('Investigadores', idx, 'rol', e.target.value)} className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs"/></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tecnico' && (
                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-4">Antecedentes Específicos (Mín. 2 párrafos / 8-12 líneas)</label>
                                <textarea name="Antecedentes" value={formData.Antecedentes} onChange={handleChange} className="w-full h-56 bg-surface border border-border-thin rounded-2xl px-8 py-6 text-sm text-text-main outline-none resize-none shadow-inner" />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-text-dim uppercase mb-4">Descripción del Proyecto (Alcance)</label>
                                    <textarea name="DescripcionProyecto" value={formData.DescripcionProyecto} onChange={handleChange} className="w-full h-40 bg-surface border border-border-thin rounded-2xl px-6 py-5 text-sm outline-none resize-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-text-dim uppercase mb-4">Justificación Institucional</label>
                                    <textarea name="Justificacion" value={formData.Justificacion} onChange={handleChange} className="w-full h-40 bg-surface border border-border-thin rounded-2xl px-6 py-5 text-sm outline-none resize-none" />
                                </div>
                            </div>
                            <div className="p-8 bg-surface border border-border-thin rounded-3xl">
                                <label className="block text-[10px] font-black text-text-dim uppercase mb-4">Bibliografía (APA 7ma Edición - Mín. 10 fuentes)</label>
                                <textarea name="Bibliografia" value={formData.Bibliografia} onChange={handleChange} className="w-full h-48 bg-bg-deep border border-border-thin rounded-xl px-6 py-5 text-sm text-text-main outline-none resize-none font-mono" placeholder="1. Apellido, A. (Año). Título..." />
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
                                            {formData.RecursosDisponibles.map((r, i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <input value={r.descripcion} onChange={(e)=>updateItem('RecursosDisponibles', i, 'descripcion', e.target.value)} className="flex-1 bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs" placeholder="Descripción..."/>
                                                    <input type="number" value={r.cantidad} onChange={(e)=>updateItem('RecursosDisponibles', i, 'cantidad', e.target.value)} className="w-12 bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-center"/>
                                                    <button onClick={()=>removeItem('RecursosDisponibles', i)} className="text-red-500"><Trash2 size={14}/></button>
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
                                                    <input value={r.descripcion} onChange={(e)=>updateItem('RecursosNecesarios', i, 'descripcion', e.target.value)} className="flex-1 bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs" placeholder="Rubro..."/>
                                                    <input type="number" value={r.unitario} onChange={(e)=>{
                                                        const u = parseFloat(e.target.value);
                                                        updateItem('RecursosNecesarios', i, 'unitario', u);
                                                        updateItem('RecursosNecesarios', i, 'total', r.cantidad * u);
                                                    }} className="w-20 bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-right" placeholder="$ 0.00"/>
                                                    <button onClick={()=>removeItem('RecursosNecesarios', i)} className="text-red-500"><Trash2 size={14}/></button>
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
                                    {formData.ProductosEsperados.map((p, i) => (
                                        <div key={i} className="p-4 bg-surface border border-border-thin rounded-xl flex gap-4 items-center animate-fade-in">
                                            <input value={p.tipo} onChange={(e)=>updateItem('ProductosEsperados', i, 'tipo', e.target.value)} className="flex-1 bg-bg-deep border border-border-thin rounded-lg px-4 py-2 text-xs" placeholder="Ej: Publicación Científica..."/>
                                            <input type="number" value={p.cantidad} onChange={(e)=>updateItem('ProductosEsperados', i, 'cantidad', e.target.value)} className="w-16 bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-center"/>
                                            <button onClick={()=>removeItem('ProductosEsperados', i)} className="text-red-500"><Trash2 size={16}/></button>
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
                                                <input type="checkbox" name={`Impacto${tipo}`} checked={(formData as any)[`Impacto${tipo}`]} onChange={handleChange} className="w-4 h-4 rounded border-border-thin text-text-main" />
                                                <label className="text-[10px] font-black uppercase text-text-main">{tipo}</label>
                                            </div>
                                            <input name={`Impacto${tipo}Desc`} value={(formData as any)[`Impacto${tipo}Desc`]} onChange={handleChange} className="flex-1 bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-xs outline-none" placeholder="Descripción breve del impacto..." disabled={!(formData as any)[`Impacto${tipo}`]} />
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
                                {formData.Cronograma.map((c, i) => (
                                    <div key={i} className="p-6 bg-surface border border-border-thin rounded-2xl flex gap-6 items-end shadow-sm">
                                        <div className="flex-1"><label className="text-[8px] font-bold text-text-dim uppercase mb-1 block">Descripción de la Actividad</label><input value={c.actividad} onChange={(e)=>updateItem('Cronograma', i, 'actividad', e.target.value)} className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs font-bold"/></div>
                                        <div className="w-40"><label className="text-[8px] font-bold text-text-dim uppercase mb-1 block">Mes de Ejecución</label><input value={c.mes} onChange={(e)=>updateItem('Cronograma', i, 'mes', e.target.value)} className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs"/></div>
                                        <div className="w-48"><label className="text-[8px] font-bold text-text-dim uppercase mb-1 block">Recursos Necesarios</label><input value={c.recursos} onChange={(e)=>updateItem('Cronograma', i, 'recursos', e.target.value)} className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs"/></div>
                                        <button onClick={()=>removeItem('Cronograma', i)} className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </DIITRABuilderShell>
    );
};

export default ProjectWorkspace;
