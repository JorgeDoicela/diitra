import React, { useState, useEffect } from 'react';
import { 
    Plus, Calendar, DollarSign, FileText, CheckCircle, 
    Clock, Trash2, Edit2, Activity, 
    AlertCircle, RefreshCw,
    ChevronRight, CalendarDays, X, Save, ShieldCheck,
    BookOpen, Layers
} from 'lucide-react';
import api from '../../../api/axios_config';

interface Convocatoria {
    uuid: string;
    codigo_convocatoria: string;
    titulo: string;
    id_periodo: string;
    periodo_nombre: string;
    anio: number;
    descripcion: string;
    presupuesto_total: number;
    monto_maximo_proyecto: number;
    url_bases: string;
    requisitos_minimos: string;
    id_tipo_convocatoria?: number;
    id_agenda_zonal?: number;
    id_rubrica?: number;
    rubrica_nombre?: string;
    puntaje_minimo_aprobacion: number;
    financiamiento_ext: boolean;
    meta_produccion?: string;
    fecha_apertura: string;
    fecha_cierre: string;
    estado: 'Borrador' | 'Abierta' | 'Cerrada' | 'Anulada';
    lineas_ids: number[];
    hitos: { uuid?: string; nombre_hito: string; fecha_hito: string; es_critico: boolean; descripcion?: string }[];
    documentos_req: { uuid?: string; nombre_documento: string; descripcion?: string; es_obligatorio: boolean }[];
}

interface Periodo {
    id_periodo: string;
    detalle: string;
}

interface Catalogo {
    id: number;
    nombre: string;
}

const ConvocatoriasPage = () => {
    const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [tiposConv, setTiposConv] = useState<Catalogo[]>([]);
    const [agendas, setAgendas] = useState<Catalogo[]>([]);
    const [rubricas, setRubricas] = useState<Catalogo[]>([]);
    const [lineas, setLineas] = useState<Catalogo[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
    
    // Form State
    const [formData, setFormData] = useState({
        codigo_convocatoria: '',
        titulo: '',
        id_periodo: '',
        anio: new Date().getFullYear(),
        descripcion: '',
        presupuesto_total: 0,
        monto_maximo_proyecto: 0,
        url_bases: '',
        requisitos_minimos: '',
        id_tipo_convocatoria: undefined as number | undefined,
        id_agenda_zonal: undefined as number | undefined,
        id_rubrica: undefined as number | undefined,
        puntaje_minimo_aprobacion: 70.00,
        financiamiento_ext: false,
        meta_produccion: '',
        fecha_apertura: '',
        fecha_cierre: '',
        lineas_ids: [] as number[],
        hitos: [] as { nombre_hito: string; fecha_hito: string; es_critico: boolean; descripcion?: string }[],
        documentos_req: [] as { nombre_documento: string; descripcion?: string; es_obligatorio: boolean }[]
    });

    const fetchConvocatorias = async () => {
        setLoading(true);
        try {
            const response = await api.get('/Convocatorias');
            setConvocatorias(response.data);
        } catch (error) {
            console.error('Error fetching convocatorias:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalogos = async () => {
        try {
            const [pRes, tRes, aRes, rRes, lRes] = await Promise.all([
                api.get('/Convocatorias/periodos'),
                api.get('/Convocatorias/catalogos/tipos'),
                api.get('/Convocatorias/catalogos/agendas'),
                api.get('/Convocatorias/catalogos/rubricas'),
                api.get('/Convocatorias/catalogos/lineas')
            ]);
            setPeriodos(pRes.data);
            setTiposConv(tRes.data);
            setAgendas(aRes.data);
            setRubricas(rRes.data);
            setLineas(lRes.data);
            
            if (pRes.data.length > 0 && !formData.id_periodo) {
                setFormData(prev => ({ ...prev, id_periodo: pRes.data[0].id_periodo }));
            }
        } catch (error) {
            console.error('Error fetching catalogos:', error);
        }
    };

    useEffect(() => {
        fetchConvocatorias();
        fetchCatalogos();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && selectedUuid) {
                await api.put(`/Convocatorias/${selectedUuid}`, formData);
            } else {
                await api.post('/Convocatorias', formData);
            }
            setShowModal(false);
            fetchConvocatorias();
            resetForm();
        } catch (error) {
            console.error('Error saving convocatoria:', error);
        }
    };

    const handleEdit = (conv: Convocatoria) => {
        setIsEditing(true);
        setSelectedUuid(conv.uuid);
        setFormData({
            codigo_convocatoria: conv.codigo_convocatoria,
            titulo: conv.titulo,
            id_periodo: conv.id_periodo,
            anio: conv.anio,
            descripcion: conv.descripcion || '',
            presupuesto_total: conv.presupuesto_total || 0,
            monto_maximo_proyecto: conv.monto_maximo_proyecto || 0,
            url_bases: conv.url_bases || '',
            requisitos_minimos: conv.requisitos_minimos || '',
            id_tipo_convocatoria: conv.id_tipo_convocatoria,
            id_agenda_zonal: conv.id_agenda_zonal,
            id_rubrica: conv.id_rubrica,
            puntaje_minimo_aprobacion: conv.puntaje_minimo_aprobacion || 70,
            financiamiento_ext: conv.financiamiento_ext,
            meta_produccion: conv.meta_produccion || '',
            fecha_apertura: conv.fecha_apertura,
            fecha_cierre: conv.fecha_cierre,
            lineas_ids: conv.lineas_ids || [],
            hitos: conv.hitos || [],
            documentos_req: conv.documentos_req || []
        });
        setShowModal(true);
    };

    const handleDelete = async (uuid: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta convocatoria?')) return;
        try {
            await api.delete(`/Convocatorias/${uuid}`);
            fetchConvocatorias();
        } catch (error) {
            console.error('Error deleting convocatoria:', error);
        }
    };

    const handleStatusChange = async (uuid: string, newStatus: string) => {
        try {
            await api.patch(`/Convocatorias/${uuid}/status?status=${newStatus}`);
            fetchConvocatorias();
        } catch (error) {
            console.error('Error changing status:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            codigo_convocatoria: '',
            titulo: '',
            id_periodo: periodos[0]?.id_periodo || '',
            anio: new Date().getFullYear(),
            descripcion: '',
            presupuesto_total: 0,
            monto_maximo_proyecto: 0,
            url_bases: '',
            requisitos_minimos: '',
            id_tipo_convocatoria: undefined,
            id_agenda_zonal: undefined,
            id_rubrica: undefined,
            puntaje_minimo_aprobacion: 70.00,
            financiamiento_ext: false,
            meta_produccion: '',
            fecha_apertura: '',
            fecha_cierre: '',
            lineas_ids: [],
            hitos: [],
            documentos_req: []
        });
        setIsEditing(false);
        setSelectedUuid(null);
        setShowAdvanced(false);
    };

    const toggleLinea = (id: number) => {
        setFormData(prev => ({
            ...prev,
            lineas_ids: prev.lineas_ids.includes(id) 
                ? prev.lineas_ids.filter(lineaId => lineaId !== id)
                : [...prev.lineas_ids, id]
        }));
    };

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'Abierta': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'Borrador': return 'text-text-dim bg-surface border-border-thin';
            case 'Cerrada': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-text-dim bg-surface border-border-thin';
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto transition-colors duration-300">
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 lg:mb-16 px-2 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                        <Activity size={10} strokeWidth={2} className="text-text-main" />
                        <span>Gestión de Investigación - Convocatorias</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">Ciclos de Investigación</h2>
                    <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Administración de convocatorias anuales para proyectos de I+D+i. 
                        Alineado con estándares CACES y SENESCYT.
                    </p>
                </div>

                <div className="w-full lg:w-auto flex gap-4">
                    <button 
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-text-main text-bg-deep px-6 py-3 lg:py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                    >
                        <Plus size={14} strokeWidth={3} />
                        Nueva Convocatoria
                    </button>
                    <button 
                        onClick={fetchConvocatorias}
                        className="p-3 border border-border-thin rounded-md hover:bg-surface text-text-dim hover:text-text-main transition-all"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {/* Grid of Stats (Quick View) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-fade-up [animation-delay:100ms]">
                <StatCard label="Total Anual" value={convocatorias.length} icon={CalendarDays} />
                <StatCard label="Abiertas" value={convocatorias.filter(c => c.estado === 'Abierta').length} icon={CheckCircle} color="text-green-500" />
                <StatCard label="Presupuesto Total" value={`$${convocatorias.reduce((acc, c) => acc + (c.presupuesto_total || 0), 0).toLocaleString()}`} icon={DollarSign} />
                <StatCard label="Próximas a Cerrar" value={convocatorias.filter(c => c.estado === 'Abierta').length} icon={Clock} />
            </div>

            {/* List View */}
            <div className="space-y-4 animate-fade-up [animation-delay:200ms]">
                {convocatorias.map((conv) => (
                    <div key={conv.uuid} className="bento-card p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-text-main transition-all gap-6 md:gap-0">
                        <div className="flex items-start md:items-center gap-4 md:gap-6 flex-1 w-full">
                            <div className="p-3 rounded-lg bg-surface border border-border-thin group-hover:border-text-main transition-colors text-text-dim group-hover:text-text-main shrink-0">
                                <FileText size={20} strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border ${getStatusColor(conv.estado)}`}>
                                        {conv.estado}
                                    </span>
                                    <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">{conv.codigo_convocatoria}</span>
                                </div>
                                <h4 className="text-base md:text-lg font-bold tracking-tight text-text-main group-hover:translate-x-1 transition-transform truncate">{conv.titulo}</h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-dim font-medium uppercase tracking-tight">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {conv.anio}</span>
                                    <span className="flex items-center gap-1"><ShieldCheck size={12} /> {conv.periodo_nombre || conv.id_periodo}</span>
                                    <span className="flex items-center gap-1 text-text-main whitespace-nowrap"><DollarSign size={12} /> Max: ${conv.monto_maximo_proyecto?.toLocaleString()}</span>
                                    {conv.rubrica_nombre && <span className="flex items-center gap-1"><Layers size={12} /> {conv.rubrica_nombre}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 border-border-thin pt-4 md:pt-0">
                            <div className="text-left md:text-right md:mr-4">
                                <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Cierre</p>
                                <p className="text-xs font-mono text-text-main">{conv.fecha_cierre}</p>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                {conv.estado === 'Borrador' && (
                                    <button 
                                        onClick={() => handleStatusChange(conv.uuid, 'Abierta')}
                                        className="p-2 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                                        title="Publicar Convocatoria"
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => handleEdit(conv)}
                                    className="p-2 text-text-dim hover:text-text-main hover:bg-surface rounded transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={18} />
                                </button>
                                
                                <button 
                                    onClick={() => handleDelete(conv.uuid)}
                                    className="p-2 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {convocatorias.length === 0 && !loading && (
                    <div className="py-20 text-center space-y-4 bento-card border-dashed">
                        <div className="inline-flex p-4 rounded-full bg-surface border border-border-thin text-text-dim">
                            <AlertCircle size={24} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-text-main font-bold uppercase tracking-widest">No hay convocatorias activas</p>
                            <p className="text-xs text-text-dim">Empieza creando una nueva convocatoria para este periodo.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal - Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-bg-deep/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg-deep border border-border-thin w-full max-w-2xl md:rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-full md:max-h-[90vh]">
                        <header className="p-6 border-b border-border-thin flex justify-between items-center bg-surface/30 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold tracking-tighter text-text-main uppercase">
                                    {isEditing ? 'Editar Convocatoria' : 'Nueva Convocatoria'}
                                </h3>
                                <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest">Registro de Ciclo de Investigación</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-text-dim hover:text-text-main transition-colors">
                                <X size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleSave} className="p-4 md:p-8 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Código Identificador</label>
                                    <input 
                                        required
                                        className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all"
                                        placeholder="EJ: CONV-2024-TEC"
                                        value={formData.codigo_convocatoria}
                                        onChange={e => setFormData({...formData, codigo_convocatoria: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Año Calendario</label>
                                    <input 
                                        type="number"
                                        required
                                        className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all"
                                        value={formData.anio}
                                        onChange={e => setFormData({...formData, anio: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Título de la Convocatoria</label>
                                <input 
                                    required
                                    className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all"
                                    placeholder="Nombre oficial de la convocatoria..."
                                    value={formData.titulo}
                                    onChange={e => setFormData({...formData, titulo: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Periodo SIGAFI (Inicio)</label>
                                    <select 
                                        className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all appearance-none"
                                        value={formData.id_periodo}
                                        onChange={e => setFormData({...formData, id_periodo: e.target.value})}
                                    >
                                        {periodos.map(p => (
                                            <option key={p.id_periodo} value={p.id_periodo}>{p.detalle}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Presupuesto Total (Fondo)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                                        <input 
                                            type="number"
                                            className="w-full bg-surface border border-border-thin rounded pl-9 pr-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all"
                                            value={formData.presupuesto_total}
                                            onChange={e => setFormData({...formData, presupuesto_total: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Fecha Apertura</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all [color-scheme:dark]"
                                        value={formData.fecha_apertura}
                                        onChange={e => setFormData({...formData, fecha_apertura: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Fecha Cierre</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all [color-scheme:dark]"
                                        value={formData.fecha_cierre}
                                        onChange={e => setFormData({...formData, fecha_cierre: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Section: Líneas de Investigación */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <BookOpen size={12} /> Líneas de Investigación Habilitadas
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {lineas.map(l => (
                                        <button
                                            key={l.id}
                                            type="button"
                                            onClick={() => toggleLinea(l.id)}
                                            className={`text-left px-3 py-2 rounded border text-[11px] transition-all ${
                                                formData.lineas_ids.includes(l.id)
                                                    ? 'bg-text-main/10 border-text-main text-text-main font-bold'
                                                    : 'bg-surface border-border-thin text-text-dim hover:border-text-main'
                                            }`}
                                        >
                                            {l.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Advanced Section Toggle */}
                            <div className="pt-4 border-t border-border-thin">
                                <button 
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase tracking-widest hover:text-text-main transition-colors"
                                >
                                    <ChevronRight size={14} className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                                    Configuración Avanzada (Excelencia 2026)
                                </button>
                            </div>

                            {showAdvanced && (
                                <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Rúbrica de Evaluación</label>
                                            <select 
                                                className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all appearance-none"
                                                value={formData.id_rubrica || ''}
                                                onChange={e => setFormData({...formData, id_rubrica: e.target.value ? parseInt(e.target.value) : undefined})}
                                            >
                                                <option value="">Seleccionar Rúbrica...</option>
                                                {rubricas.map(r => (
                                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Puntaje Mínimo (Aprobación)</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all"
                                                value={formData.puntaje_minimo_aprobacion}
                                                onChange={e => setFormData({...formData, puntaje_minimo_aprobacion: parseFloat(e.target.value)})}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Tipo de Convocatoria</label>
                                            <select 
                                                className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all appearance-none"
                                                value={formData.id_tipo_convocatoria || ''}
                                                onChange={e => setFormData({...formData, id_tipo_convocatoria: e.target.value ? parseInt(e.target.value) : undefined})}
                                            >
                                                <option value="">Seleccionar Tipo...</option>
                                                {tiposConv.map(t => (
                                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Agenda Zonal Prioritaria</label>
                                            <select 
                                                className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all appearance-none"
                                                value={formData.id_agenda_zonal || ''}
                                                onChange={e => setFormData({...formData, id_agenda_zonal: e.target.value ? parseInt(e.target.value) : undefined})}
                                            >
                                                <option value="">Seleccionar Agenda...</option>
                                                {agendas.map(a => (
                                                    <option key={a.id} value={a.id}>{a.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Meta de Producción Esperada</label>
                                        <input 
                                            className="w-full bg-surface border border-border-thin rounded px-4 py-2.5 text-sm text-text-main focus:border-text-main outline-none transition-all"
                                            placeholder="EJ: Artículo Scopus / Patente SENADI"
                                            value={formData.meta_produccion}
                                            onChange={e => setFormData({...formData, meta_produccion: e.target.value})}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 bg-surface/30 p-4 rounded-md border border-border-thin">
                                        <input 
                                            type="checkbox"
                                            id="financiamiento_ext"
                                            className="w-4 h-4 rounded bg-bg-deep border-border-thin text-text-main focus:ring-0"
                                            checked={formData.financiamiento_ext}
                                            onChange={e => setFormData({...formData, financiamiento_ext: e.target.checked})}
                                        />
                                        <label htmlFor="financiamiento_ext" className="text-xs text-text-main font-medium cursor-pointer">
                                            Requiere Cofinanciamiento Externo (Empresa/ONG)
                                        </label>
                                    </div>

                                    {/* Nueva Sección: Calendario del Proceso (Hitos) */}
                                    <div className="space-y-4 pt-4 border-t border-border-thin">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <CalendarDays size={12} /> Calendario del Proceso (Hitos)
                                            </label>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, hitos: [...formData.hitos, { nombre_hito: '', fecha_hito: '', es_critico: false }]})}
                                                className="text-[10px] font-bold text-text-main uppercase hover:underline"
                                            >
                                                + Añadir Hito
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.hitos.map((hito, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-3 bg-surface/30 p-3 rounded border border-border-thin relative group">
                                                    <div className="col-span-6">
                                                        <input 
                                                            className="w-full bg-bg-deep border border-border-thin rounded px-3 py-1.5 text-xs text-text-main outline-none"
                                                            placeholder="Nombre del hito (Ej: Resultados)"
                                                            value={hito.nombre_hito}
                                                            onChange={e => {
                                                                const newHitos = [...formData.hitos];
                                                                newHitos[idx].nombre_hito = e.target.value;
                                                                setFormData({...formData, hitos: newHitos});
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-span-4">
                                                        <input 
                                                            type="date"
                                                            className="w-full bg-bg-deep border border-border-thin rounded px-3 py-1.5 text-xs text-text-main outline-none [color-scheme:dark]"
                                                            value={hito.fecha_hito}
                                                            onChange={e => {
                                                                const newHitos = [...formData.hitos];
                                                                newHitos[idx].fecha_hito = e.target.value;
                                                                setFormData({...formData, hitos: newHitos});
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <button 
                                                            type="button"
                                                            onClick={() => setFormData({...formData, hitos: formData.hitos.filter((_, i) => i !== idx)})}
                                                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Nueva Sección: Documentación Requerida */}
                                    <div className="space-y-4 pt-4 border-t border-border-thin">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <FileText size={12} /> Documentación Obligatoria (Checklist)
                                            </label>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, documentos_req: [...formData.documentos_req, { nombre_documento: '', es_obligatorio: true }]})}
                                                className="text-[10px] font-bold text-text-main uppercase hover:underline"
                                            >
                                                + Añadir Documento
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.documentos_req.map((doc, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-surface/30 p-3 rounded border border-border-thin relative group">
                                                    <input 
                                                        className="flex-1 bg-bg-deep border border-border-thin rounded px-3 py-1.5 text-xs text-text-main outline-none"
                                                        placeholder="Nombre del documento (Ej: Certificado de Título)"
                                                        value={doc.nombre_documento}
                                                        onChange={e => {
                                                            const newDocs = [...formData.documentos_req];
                                                            newDocs[idx].nombre_documento = e.target.value;
                                                            setFormData({...formData, documentos_req: newDocs});
                                                        }}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="checkbox"
                                                            checked={doc.es_obligatorio}
                                                            onChange={e => {
                                                                const newDocs = [...formData.documentos_req];
                                                                newDocs[idx].es_obligatorio = e.target.checked;
                                                                setFormData({...formData, documentos_req: newDocs});
                                                            }}
                                                        />
                                                        <span className="text-[9px] font-bold text-text-dim uppercase">Obligatorio</span>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setFormData({...formData, documentos_req: formData.documentos_req.filter((_, i) => i !== idx)})}
                                                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 flex justify-end gap-4 border-t border-border-thin shrink-0">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-text-main text-bg-deep px-8 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                                >
                                    <Save size={14} />
                                    {isEditing ? 'Actualizar Convocatoria' : 'Guardar Convocatoria'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

const StatCard = ({ label, value, icon: Icon, color = 'text-text-main' }: any) => (
    <div className="bento-card p-5 flex items-center gap-4 hover:border-text-main transition-all">
        <div className="p-2.5 rounded bg-surface border border-border-thin">
            <Icon size={16} className="text-text-dim" />
        </div>
        <div>
            <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">{label}</p>
            <p className={`text-xl font-bold tracking-tighter ${color}`}>{value}</p>
        </div>
    </div>
);

export default ConvocatoriasPage;
