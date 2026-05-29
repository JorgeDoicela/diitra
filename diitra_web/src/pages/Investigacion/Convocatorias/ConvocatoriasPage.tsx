import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
    
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
            if (newStatus === 'Abierta') {
                alert('Convocatoria publicada exitosamente. Se ha notificado a los docentes.');
            } else {
                alert(`Estado actualizado a ${newStatus}.`);
            }
            fetchConvocatorias();
        } catch (error: any) {
            const message = error?.response?.status === 403
                ? 'No tienes permisos para realizar esta accion.'
                : `Error al cambiar el estado: ${error?.response?.data?.message || error.message}`;
            alert(message);
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

    const getStatusBadgeClass = (estado: string) => {
        switch (estado) {
            case 'Abierta': return 'badge-vercel-success';
            case 'Borrador': return 'badge-vercel-neutral';
            case 'Cerrada': return 'badge-vercel-error';
            case 'Anulada': return 'badge-vercel-error';
            default: return 'badge-vercel-neutral';
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 lg:mb-16 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="section-label">
                        <Activity size={10} strokeWidth={2} />
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
                        className="btn-vercel-primary flex-1 lg:flex-none"
                    >
                        <Plus size={14} strokeWidth={3} />
                        Nueva Convocatoria
                    </button>
                    <button 
                        onClick={fetchConvocatorias}
                        className="p-3 border border-border-thin rounded-md hover:bg-surface-hover text-text-dim hover:text-text-main transition-all"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {/* Two-column Vercel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
                
                {/* Main Content: List View (Left Column) */}
                <div className="lg:col-span-3 space-y-4">
                    {convocatorias.map((conv) => (
                        <div 
                            key={conv.uuid} 
                            onClick={() => setSelectedConvocatoria(conv)}
                            className="bento-card p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center group cursor-pointer"
                        >
                            <div className="flex items-start md:items-center gap-4 md:gap-6 flex-1 w-full">
                                <div className="icon-circle-brand shrink-0">
                                    <FileText size={20} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                        <span className={getStatusBadgeClass(conv.estado)}>
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(conv.uuid, 'Abierta');
                                            }}
                                            className="p-2 text-text-dim hover:text-success hover:bg-surface-hover rounded transition-colors"
                                            title="Publicar Convocatoria"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(conv);
                                        }}
                                        className="p-2 text-text-dim hover:text-text-main hover:bg-surface-hover rounded transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(conv.uuid);
                                        }}
                                        className="p-2 text-text-dim hover:text-error hover:bg-surface-hover rounded transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {convocatorias.length === 0 && !loading && (
                        <div className="empty-state py-20">
                            <div className="icon-circle-neutral mb-4">
                                <AlertCircle size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-text-main font-bold uppercase tracking-widest">No hay convocatorias activas</p>
                                <p className="text-xs text-text-dim">Empieza creando una nueva convocatoria para este periodo.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Metrics (Right Column) */}
                <div className="space-y-6">
                    <VercelUsageCard 
                        title="Resumen del Periodo"
                        buttonLabel="Actualizar"
                        onButtonClick={fetchConvocatorias}
                        items={[
                            {
                                label: 'Total Anual',
                                value: convocatorias.length,
                                displayValue: `${convocatorias.length} ciclos`,
                                max: 10,
                                color: 'var(--brand)'
                            },
                            {
                                label: 'Abiertas',
                                value: convocatorias.filter(c => c.estado === 'Abierta').length,
                                displayValue: `${convocatorias.filter(c => c.estado === 'Abierta').length} vigentes`,
                                max: convocatorias.length || 1,
                                color: 'var(--success)'
                            },
                            {
                                label: 'Presupuesto Total',
                                value: convocatorias.reduce((acc, c) => acc + (c.presupuesto_total || 0), 0),
                                displayValue: `$${(convocatorias.reduce((acc, c) => acc + (c.presupuesto_total || 0), 0) / 1000).toFixed(0)}K`,
                                max: 150000,
                                color: 'var(--info)'
                            },
                            {
                                label: 'Próximas a Cerrar',
                                value: convocatorias.filter(c => c.estado === 'Abierta').length,
                                displayValue: `${convocatorias.filter(c => c.estado === 'Abierta').length} activas`,
                                max: convocatorias.length || 1,
                                color: 'var(--warning)'
                            }
                        ]}
                    />
                </div>
            </div>

            {/* Modal - Create/Edit */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-card modal-card--lg flex flex-col h-full md:max-h-[90vh]">
                        <div className="modal-header">
                            <div>
                                <h3 className="text-xl font-bold tracking-tighter text-text-main uppercase">
                                    {isEditing ? 'Editar Convocatoria' : 'Nueva Convocatoria'}
                                </h3>
                                <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest">Registro de Ciclo de Investigación</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-text-dim hover:text-text-main transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="modal-body space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Código Identificador</label>
                                    <input 
                                        required
                                        className="input-vercel"
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
                                        className="input-vercel"
                                        value={isNaN(formData.anio) ? '' : formData.anio}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setFormData({...formData, anio: isNaN(val) ? new Date().getFullYear() : val});
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Título de la Convocatoria</label>
                                <input 
                                    required
                                    className="input-vercel"
                                    placeholder="Nombre oficial de la convocatoria..."
                                    value={formData.titulo}
                                    onChange={e => setFormData({...formData, titulo: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Periodo SIGAFI (Inicio)</label>
                                    <select 
                                        className="input-vercel"
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
                                            className="input-vercel pl-9"
                                            value={isNaN(formData.presupuesto_total) ? '' : formData.presupuesto_total}
                                            onChange={e => {
                                                const val = parseFloat(e.target.value);
                                                setFormData({...formData, presupuesto_total: isNaN(val) ? 0 : val});
                                            }}
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
                                        className="input-vercel"
                                        value={formData.fecha_apertura}
                                        onChange={e => setFormData({...formData, fecha_apertura: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Fecha Cierre</label>
                                    <input 
                                        type="date"
                                        required
                                        className="input-vercel"
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
                                <div className="space-y-6 animate-fade-up">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Rúbrica de Evaluación</label>
                                            <select 
                                                className="input-vercel"
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
                                                className="input-vercel"
                                                value={isNaN(formData.puntaje_minimo_aprobacion) ? '' : formData.puntaje_minimo_aprobacion}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value);
                                                    setFormData({...formData, puntaje_minimo_aprobacion: isNaN(val) ? 0 : val});
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Tipo de Convocatoria</label>
                                            <select 
                                                className="input-vercel"
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
                                                className="input-vercel"
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
                                            className="input-vercel"
                                            placeholder="EJ: Artículo Scopus / Patente SENADI"
                                            value={formData.meta_produccion}
                                            onChange={e => setFormData({...formData, meta_produccion: e.target.value})}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 bg-surface p-4 rounded-md border border-border-thin">
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
                                                className="btn-vercel-secondary"
                                            >
                                                + Añadir Hito
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.hitos.map((hito, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-3 bg-surface p-3 rounded border border-border-thin relative group">
                                                    <div className="col-span-6">
                                                        <input 
                                                            className="input-vercel text-xs py-1.5"
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
                                                            className="input-vercel text-xs py-1.5"
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
                                                            className="text-text-dim hover:text-error transition-colors"
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
                                                className="btn-vercel-secondary"
                                            >
                                                + Añadir Documento
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.documentos_req.map((doc, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-surface p-3 rounded border border-border-thin relative group">
                                                    <input 
                                                        className="input-vercel flex-1 text-xs py-1.5"
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
                                                        className="text-text-dim hover:text-error transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    <Save size={14} />
                                    {isEditing ? 'Actualizar Convocatoria' : 'Guardar Convocatoria'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Panel */}
            {selectedConvocatoria && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                        onClick={() => setSelectedConvocatoria(null)}
                    />
                    
                    <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 bg-bg-deep text-text-dim border border-border-thin text-[10px] font-mono uppercase rounded-md">
                                    {selectedConvocatoria.codigo_convocatoria}
                                </span>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                                    <span className={`dot dot-pulse ${selectedConvocatoria.estado === 'Abierta' ? 'dot-success' : 'dot-warning'}`} />
                                    <span className={selectedConvocatoria.estado === 'Abierta' ? 'text-success' : 'text-warning'}>
                                        {selectedConvocatoria.estado === 'Abierta' ? 'Convocatoria Activa' : `Estado: ${selectedConvocatoria.estado}`}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedConvocatoria(null)}
                                className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight text-text-main leading-tight font-sans">
                                    {selectedConvocatoria.titulo}
                                </h2>
                                <p className="text-sm text-text-dim leading-relaxed font-medium">
                                    {selectedConvocatoria.descripcion || 'Sin descripción detallada.'}
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bento-card p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar size={12} /> Fecha de Apertura
                                    </div>
                                    <div className="text-sm font-bold text-text-main font-mono">
                                        {selectedConvocatoria.fecha_apertura}
                                    </div>
                                </div>
                                <div className="bento-card p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar size={12} className="text-error" /> Fecha de Cierre (Límite)
                                    </div>
                                    <div className="text-sm font-bold text-error font-mono">
                                        {selectedConvocatoria.fecha_cierre}
                                    </div>
                                </div>
                                <div className="bento-card p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <DollarSign size={12} className="text-success" /> Financiamiento Máximo
                                    </div>
                                    <div className="text-sm font-bold text-success font-mono">
                                        ${selectedConvocatoria.monto_maximo_proyecto?.toLocaleString() ?? '0.00'}
                                    </div>
                                </div>
                                <div className="bento-card p-5 space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <Layers size={12} /> Rúbrica Evaluativa
                                    </div>
                                    <div className="text-sm font-bold text-text-main truncate">
                                        {selectedConvocatoria.rubrica_nombre || 'Rúbrica Estándar ISTPET'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bento-card p-6 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-text-main uppercase tracking-wider">
                                    <BookOpen size={14} /> Configuración Académica & Auditoría
                                </div>
                                <p className="text-xs text-text-dim leading-relaxed font-medium">
                                    Esta convocatoria tiene un puntaje mínimo de aprobación de <strong>{selectedConvocatoria.puntaje_minimo_aprobacion}%</strong> para el proceso de pares doble ciego. Cualquier cambio de estado a "Abierta" publicará las bases a los docentes inmediatamente.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-text-main uppercase tracking-widest">Requisitos & Documentos Exigidos</h4>
                                <div className="space-y-2">
                                    {selectedConvocatoria.documentos_req && selectedConvocatoria.documentos_req.length > 0 ? (
                                        selectedConvocatoria.documentos_req.map((doc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bento-card text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-main">{doc.nombre_documento}</span>
                                                    {doc.descripcion && <span className="text-[10px] text-text-dim">{doc.descripcion}</span>}
                                                </div>
                                                <span className={doc.es_obligatorio ? 'badge-vercel-error' : 'badge-vercel-neutral'}>
                                                    {doc.es_obligatorio ? 'Obligatorio' : 'Opcional'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-text-dim">No se configuraron documentos específicos.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 border-t border-border-thin bg-surface flex gap-4">
                            <button 
                                onClick={() => {
                                    handleEdit(selectedConvocatoria);
                                    setSelectedConvocatoria(null);
                                }}
                                className="btn-vercel-primary flex-1"
                            >
                                Editar Convocatoria
                            </button>
                            {selectedConvocatoria.estado === 'Borrador' && (
                                <button 
                                    onClick={() => {
                                        handleStatusChange(selectedConvocatoria.uuid, 'Abierta');
                                        setSelectedConvocatoria(null);
                                    }}
                                    className="btn-brand flex-1"
                                >
                                    Publicar Ahora
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </main>
    );
};

const VercelUsageCard = ({ title, buttonLabel, onButtonClick, items }: any) => (
    <div className="bento-card p-5 flex flex-col relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-5">
            <span className="text-[14px] font-semibold text-text-main tracking-tight">{title}</span>
            {buttonLabel && (
                <button 
                    onClick={onButtonClick} 
                    className="px-3 py-1 bg-black text-white hover:bg-[#1a1a1a] dark:bg-white dark:text-black dark:hover:bg-[#eaeaea] rounded-md text-[11px] font-medium transition-all cursor-pointer shadow-sm active:scale-98"
                >
                    {buttonLabel}
                </button>
            )}
        </div>
        <div className="space-y-1">
            {items.map((item: any, idx: number) => {
                const percentage = item.max ? Math.min(100, Math.round((item.value / item.max) * 100)) : 0;
                const radius = 6.5;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (percentage / 100) * circumference;
                
                return (
                    <div 
                        key={idx} 
                        className="flex items-center justify-between py-2 px-3 rounded-md transition-all group"
                        style={{ backgroundColor: idx % 2 === 0 ? 'var(--accents-1)' : 'transparent' }}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-[18px] h-[18px] flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 18 18">
                                    <circle
                                        cx="9"
                                        cy="9"
                                        r={radius}
                                        className="fill-none"
                                        strokeWidth="1.8"
                                        style={{ stroke: 'var(--accents-2)' }}
                                    />
                                    <circle
                                        cx="9"
                                        cy="9"
                                        r={radius}
                                        className="fill-none transition-all duration-500"
                                        stroke={item.color || 'var(--brand)'}
                                        strokeWidth="1.8"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={item.max ? strokeDashoffset : 0}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13px] font-medium text-text-main truncate">
                                    {item.label}
                                </span>
                                <svg 
                                    className="w-3 h-3 text-text-dim/40 hover:text-text-main transition-colors shrink-0 cursor-help" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-[13px] font-mono font-medium text-text-main shrink-0 ml-2">
                            {item.displayValue || item.value}
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
);

const StatCard = ({ label, value, icon: Icon, type = 'brand', desc }: any) => {
    let circleClass = 'icon-circle-brand';
    if (type === 'success') circleClass = 'icon-circle-success bg-success-subtle text-success border-success/10';
    if (type === 'warning') circleClass = 'icon-circle-warning bg-warning-subtle text-warning border-warning/10';
    if (type === 'error') circleClass = 'icon-circle-error bg-error-subtle text-error border-error/10';
    if (type === 'info') circleClass = 'icon-circle-info bg-info-subtle text-info border-info/10';
    if (type === 'brand') circleClass = 'icon-circle bg-brand-subtle text-brand border-brand/10';

    return (
        <div className="bento-card p-6 flex items-center justify-between relative overflow-hidden vercel-card-glow">
            <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-text-dim uppercase tracking-wider mb-1 truncate">{label}</span>
                <span className="stat-number text-text-main truncate">{value}</span>
                {desc && (
                    <span className="text-[10px] text-text-dim mt-2 font-medium truncate">{desc}</span>
                )}
            </div>
            <div className={`icon-circle ${circleClass} !p-4 shrink-0`}>
                <Icon size={28} strokeWidth={1.5} />
            </div>
        </div>
    );
};

export default ConvocatoriasPage;
