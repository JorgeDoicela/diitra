import React, { useState, useEffect } from 'react';
import { 
    Users, Plus, Search, Edit2, 
    Trash2, CheckCircle, XCircle,
    BookOpen, Shield, Award, Calendar, FileText
} from 'lucide-react';
import api from '../../api/axios_config';

interface Group {
    id_grupo: number;
    uuid: string;
    nombre: string;
    siglas: string;
    id_coordinador: number | null;
    id_profesor_coordinador: string | null;
    nombre_coordinador: string;
    objetivo_general: string;
    mision: string;
    vision: string;
    resolucion_aprobacion: string;
    fecha_creacion: string;
    tipo_grupo: string;
    id_dominio: number | null;
    activo: boolean;
    lineas_ids: number[];
    carreras_ids: number[];
}

interface ResearchLine {
    id: number;
    nombre: string;
}

interface Teacher {
    id_usuario: number | null;
    id_profesor: string;
    nombre_completo: string;
}

interface Domain {
    id_dominio: number;
    nombre: string;
}

interface Career {
    id_carrera: number;
    carrera1: string;
}

const GroupsPage = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [lines, setLines] = useState<ResearchLine[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [dominios, setDominios] = useState<Domain[]>([]);
    const [carreras, setCarreras] = useState<Career[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        nombre: '',
        siglas: '',
        tipo_grupo: 'Investigación',
        id_dominio: '',
        id_profesor_coordinador: '',
        objetivo_general: '',
        mision: '',
        vision: '',
        resolucion_aprobacion: '',
        fecha_creacion: '',
        lineas_ids: [] as number[],
        carreras_ids: [] as number[]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [groupsRes, linesRes, teachersRes, dominiosRes, carrerasRes] = await Promise.all([
                api.get(`/Groups?search=${search}`),
                api.get('/Convocatorias/catalogos/lineas'),
                api.get('/Admin/users'),
                api.get('/catalogs/dominios'),
                api.get('/catalogs/carreras')
            ]);
            setGroups(groupsRes.data);
            setLines(linesRes.data);
            setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : (teachersRes.data.items || []));
            setDominios(dominiosRes.data);
            setCarreras(carrerasRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search]);

    const handleOpenModal = (group: Group | null = null) => {
        if (group) {
            setEditingGroup(group);
            setFormData({
                nombre: group.nombre,
                siglas: group.siglas || '',
                tipo_grupo: group.tipo_grupo || 'Investigación',
                id_dominio: group.id_dominio?.toString() || '',
                id_profesor_coordinador: group.id_profesor_coordinador || '',
                objetivo_general: group.objetivo_general || '',
                mision: group.mision || '',
                vision: group.vision || '',
                resolucion_aprobacion: group.resolucion_aprobacion || '',
                fecha_creacion: group.fecha_creacion ? group.fecha_creacion.split('T')[0] : '',
                lineas_ids: group.lineas_ids || [],
                carreras_ids: group.carreras_ids || []
            });
        } else {
            setEditingGroup(null);
            setFormData({
                nombre: '',
                siglas: '',
                tipo_grupo: 'Investigación',
                id_dominio: '',
                id_profesor_coordinador: '',
                objetivo_general: '',
                mision: '',
                vision: '',
                resolucion_aprobacion: '',
                fecha_creacion: '',
                lineas_ids: [],
                carreras_ids: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                id_profesor_coordinador: formData.id_profesor_coordinador || null,
                id_dominio: formData.id_dominio ? parseInt(formData.id_dominio) : null
            };

            if (editingGroup) {
                await api.put(`/Groups/${editingGroup.uuid}`, payload);
            } else {
                await api.post('/Groups', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error('Error saving group:', error);
            const detail = error.response?.data?.detail || error.response?.data?.message || '';
            alert(`Error al guardar el grupo: ${error.message}${detail ? `\n\nDetalle: ${detail}` : ''}`);
        }
    };

    const toggleLine = (id: number) => {
        setFormData(prev => ({
            ...prev,
            lineas_ids: prev.lineas_ids.includes(id) 
                ? prev.lineas_ids.filter(lineId => lineId !== id)
                : [...prev.lineas_ids, id]
        }));
    };

    const toggleCarrera = (id: number) => {
        setFormData(prev => ({
            ...prev,
            carreras_ids: prev.carreras_ids.includes(id) 
                ? prev.carreras_ids.filter(cId => cId !== id)
                : [...prev.carreras_ids, id]
        }));
    };

    const handleDelete = async (uuid: string, name: string) => {
        if (!window.confirm(`¿Está seguro de desactivar el grupo "${name}"?`)) return;
        
        try {
            await api.delete(`/Groups/${uuid}`);
            fetchData();
        } catch (error: any) {
            console.error('Error deactivating group:', error);
            alert('No se pudo desactivar el grupo: ' + error.message);
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 lg:mb-16 px-2 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                        <Shield size={10} className="text-text-main" />
                        <span>Administración Institucional</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">Grupos de Investigación</h2>
                    <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Configure las unidades organizativas de I+D+i y sus líneas de acción.
                    </p>
                </div>

                <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4">
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-text-main transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Buscar grupo o siglas..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-bg-deep border border-border-thin rounded-md pl-10 pr-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-text-main transition-all uppercase tracking-wider font-mono"
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 bg-text-main text-bg-deep px-6 py-3 md:py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                    >
                        <Plus size={14} strokeWidth={3} />
                        Crear Grupo
                    </button>
                </div>
            </header>

            <div className="bento-card overflow-hidden animate-fade-up [animation-delay:200ms]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                <th className="p-4 font-bold tracking-widest">Grupo / Identidad</th>
                                <th className="p-4 font-bold tracking-widest">Coordinador</th>
                                <th className="p-4 font-bold tracking-widest">Estado</th>
                                <th className="p-4 font-bold tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-thin">
                            {groups.map((g) => (
                                <tr key={g.uuid} className="hover:bg-surface/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded bg-text-main/10 border border-text-main/20 flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
                                                <Award size={18} />
                                            </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-text-main tracking-tight uppercase">{g.nombre}</p>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${
                                                    g.tipo_grupo === 'Semillero' 
                                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                }`}>
                                                    {g.tipo_grupo?.toUpperCase() || 'INVESTIGACIÓN'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <span className="text-[10px] text-text-dim font-mono bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin">{g.siglas || 'SIN_SIGLAS'}</span>
                                                {g.resolucion_aprobacion && (
                                                    <span className="text-[9px] text-text-dim/80 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                        <FileText size={8} /> {g.resolucion_aprobacion}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-surface border border-border-thin flex items-center justify-center text-text-dim">
                                            <Users size={12} />
                                        </div>
                                        <span className="text-xs text-text-main font-medium uppercase">{g.nombre_coordinador || 'No asignado'}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {g.activo ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-tighter border border-green-500/20">
                                            <CheckCircle size={10} strokeWidth={3} /> Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-tighter border border-red-500/20">
                                            <XCircle size={10} strokeWidth={3} /> Inactivo
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(g)}
                                            className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                            title="Editar Grupo"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(g.uuid, g.nombre)}
                                            className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-red-500 transition-all"
                                            title="Desactivar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {groups.length === 0 && !loading && (
                    <div className="py-20 text-center space-y-4">
                        <Users size={32} className="mx-auto text-text-dim/30" />
                        <p className="text-sm text-text-dim font-medium uppercase tracking-widest">No se encontraron grupos registrados</p>
                    </div>
                )}
                </div>
            </div>

            {/* Modal de Creación/Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-border-thin flex justify-between items-center bg-bg-deep/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-text-main/10 rounded-lg text-text-main">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingGroup ? 'Editar Grupo de Investigación' : 'Nuevo Grupo de Investigación'}
                                    </h3>
                                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Configuración administrativa y normativa</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-dim hover:text-text-main p-2">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
                            {/* Datos Básicos */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Nombre del Grupo</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-medium"
                                        placeholder="Ej: GRUPO DE INVESTIGACIÓN EN SISTEMAS INTELIGENTES"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Siglas / Acrónimo</label>
                                    <input 
                                        type="text" 
                                        value={formData.siglas}
                                        onChange={(e) => setFormData({...formData, siglas: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-mono"
                                        placeholder="GISI"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Tipo de Grupo</label>
                                    <select 
                                        required
                                        value={formData.tipo_grupo}
                                        onChange={(e) => setFormData({...formData, tipo_grupo: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all appearance-none"
                                    >
                                        <option value="Investigación">Grupo de Investigación</option>
                                        <option value="Semillero">Semillero de Investigación</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Dominio Académico</label>
                                    <select 
                                        required
                                        value={formData.id_dominio}
                                        onChange={(e) => setFormData({...formData, id_dominio: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all appearance-none"
                                    >
                                        <option value="">Seleccione Dominio...</option>
                                        {dominios.map(d => (
                                            <option key={d.id_dominio} value={d.id_dominio}>{d.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Coordinador Responsable</label>
                                    <select 
                                        required
                                        value={formData.id_profesor_coordinador}
                                        onChange={(e) => setFormData({...formData, id_profesor_coordinador: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all appearance-none"
                                    >
                                        <option value="">Seleccione un docente...</option>
                                        {teachers.map(t => (
                                            <option key={t.id_profesor} value={t.id_profesor}>{t.nombre_completo}</option>
                                        ))}
                                    </select>
                                </div>
                            </section>

                            {/* Normativa */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-bg-deep/30 rounded-2xl border border-border-thin">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={12} /> Resolución de Aprobación
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.resolucion_aprobacion}
                                        onChange={(e) => setFormData({...formData, resolucion_aprobacion: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase"
                                        placeholder="ACTA-DI-2026-001"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={12} /> Fecha de Creación
                                    </label>
                                    <input 
                                        type="date" 
                                        value={formData.fecha_creacion}
                                        onChange={(e) => setFormData({...formData, fecha_creacion: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all"
                                    />
                                </div>
                            </section>

                            {/* Identidad */}
                            <section className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Objetivo General</label>
                                    <textarea 
                                        rows={3}
                                        value={formData.objetivo_general}
                                        onChange={(e) => setFormData({...formData, objetivo_general: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Misión</label>
                                        <textarea 
                                            rows={3}
                                            value={formData.mision}
                                            onChange={(e) => setFormData({...formData, mision: e.target.value})}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Visión</label>
                                        <textarea 
                                            rows={3}
                                            value={formData.vision}
                                            onChange={(e) => setFormData({...formData, vision: e.target.value})}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Carreras Asociadas */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Users size={12} /> Carreras / Programas Académicos
                                    </label>
                                    <span className="text-[9px] font-bold text-text-main bg-text-main/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {formData.carreras_ids.length} seleccionadas
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {carreras.map(career => (
                                        <div 
                                            key={career.id_carrera}
                                            onClick={() => toggleCarrera(career.id_carrera)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                                                formData.carreras_ids.includes(career.id_carrera)
                                                    ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                                                    : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                                            }`}
                                        >
                                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                                                formData.carreras_ids.includes(career.id_carrera) ? 'border-blue-500 bg-blue-500' : 'border-border-thin'
                                            }`}>
                                                {formData.carreras_ids.includes(career.id_carrera) && <CheckCircle size={8} className="text-bg-deep" />}
                                            </div>
                                            <span className="text-[9px] font-bold uppercase truncate">{career.carrera1}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Líneas de Investigación (M:N) */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen size={12} /> Líneas de Investigación Institucionales
                                    </label>
                                    <span className="text-[9px] font-bold text-text-main bg-text-main/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {formData.lineas_ids.length} seleccionadas
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {lines.map(line => (
                                        <div 
                                            key={line.id}
                                            onClick={() => toggleLine(line.id)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                                                formData.lineas_ids.includes(line.id)
                                                    ? 'bg-text-main/10 border-text-main text-text-main'
                                                    : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                formData.lineas_ids.includes(line.id) ? 'border-text-main bg-text-main' : 'border-border-thin'
                                            }`}>
                                                {formData.lineas_ids.includes(line.id) && <CheckCircle size={10} className="text-bg-deep" />}
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-tight">{line.nombre}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </form>

                        <div className="p-6 border-t border-border-thin bg-bg-deep/50 flex justify-end gap-4">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className="bg-text-main text-bg-deep px-8 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-text-main/10"
                            >
                                {editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default GroupsPage;
