import React, { useState, useEffect } from 'react';
import { 
    Calendar, BookOpen, Plus, Search, Edit2, 
    Trash2, CheckCircle, XCircle, Settings2, FileText, Loader2, ArrowRight
} from 'lucide-react';
import api from '../../api/axios_config';

interface LineaInvestigacion {
    idLinea?: number;
    uuid?: string;
    codigoLinea: string;
    nombreLinea: string;
    descripcion?: string;
    activo?: boolean;
}

interface PeriodoAcademico {
    idPeriodo: string;
    detalle?: string;
    fechaInicial?: string;
    fechaFinal?: string;
    activo?: boolean;
    cerrado?: boolean;
}

const ConfiguracionPage = () => {
    const [activeTab, setActiveTab] = useState<'lineas' | 'periodos'>('lineas');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    
    // Data Lists
    const [lineas, setLineas] = useState<LineaInvestigacion[]>([]);
    const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);

    // Modals
    const [isLineaModalOpen, setIsLineaModalOpen] = useState(false);
    const [editingLinea, setEditingLinea] = useState<LineaInvestigacion | null>(null);
    const [lineaForm, setLineaForm] = useState({
        codigoLinea: '',
        nombreLinea: '',
        descripcion: ''
    });

    const [isPeriodoModalOpen, setIsPeriodoModalOpen] = useState(false);
    const [editingPeriodo, setEditingPeriodo] = useState<PeriodoAcademico | null>(null);
    const [periodoForm, setPeriodoForm] = useState({
        idPeriodo: '',
        detalle: '',
        fechaInicial: '',
        fechaFinal: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'lineas') {
                const res = await api.get('/catalogs/lineas-investigacion');
                setLineas(res.data || []);
            } else {
                const res = await api.get('/catalogs/periodos');
                setPeriodos(res.data || []);
            }
        } catch (error) {
            console.error('[DIITRA] Error al cargar configuración:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Search filter
    const filteredLineas = lineas.filter(l => 
        l.nombreLinea.toLowerCase().includes(search.toLowerCase()) || 
        l.codigoLinea.toLowerCase().includes(search.toLowerCase())
    );

    const filteredPeriodos = periodos.filter(p => 
        p.idPeriodo.toLowerCase().includes(search.toLowerCase()) || 
        (p.detalle || '').toLowerCase().includes(search.toLowerCase())
    );

    // LINEAS HANDLERS
    const handleOpenLineaModal = (item: LineaInvestigacion | null = null) => {
        if (item) {
            setEditingLinea(item);
            setLineaForm({
                codigoLinea: item.codigoLinea,
                nombreLinea: item.nombreLinea,
                descripcion: item.descripcion || ''
            });
        } else {
            setEditingLinea(null);
            setLineaForm({
                codigoLinea: '',
                nombreLinea: '',
                descripcion: ''
            });
        }
        setIsLineaModalOpen(true);
    };

    const handleSaveLinea = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingLinea) {
                await api.put(`/catalogs/lineas-investigacion/${editingLinea.uuid}`, {
                    ...editingLinea,
                    ...lineaForm
                });
            } else {
                await api.post('/catalogs/lineas-investigacion', lineaForm);
            }
            setIsLineaModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert('Error al guardar línea: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleToggleLinea = async (item: LineaInvestigacion) => {
        if (!window.confirm(`¿Está seguro de cambiar el estado de la línea "${item.nombreLinea}"?`)) return;
        try {
            await api.delete(`/catalogs/lineas-investigacion/${item.uuid}`);
            fetchData();
        } catch (error: any) {
            alert('Error al cambiar estado: ' + error.message);
        }
    };

    // PERIODOS HANDLERS
    const handleOpenPeriodoModal = (item: PeriodoAcademico | null = null) => {
        if (item) {
            setEditingPeriodo(item);
            setPeriodoForm({
                idPeriodo: item.idPeriodo,
                detalle: item.detalle || '',
                fechaInicial: item.fechaInicial ? item.fechaInicial.split('T')[0] : '',
                fechaFinal: item.fechaFinal ? item.fechaFinal.split('T')[0] : ''
            });
        } else {
            setEditingPeriodo(null);
            setPeriodoForm({
                idPeriodo: '',
                detalle: '',
                fechaInicial: '',
                fechaFinal: ''
            });
        }
        setIsPeriodoModalOpen(true);
    };

    const handleSavePeriodo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...editingPeriodo,
                ...periodoForm
            };
            if (editingPeriodo) {
                await api.put(`/catalogs/periodos/${editingPeriodo.idPeriodo}`, payload);
            } else {
                await api.post('/catalogs/periodos', payload);
            }
            setIsPeriodoModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert('Error al guardar período: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleTogglePeriodo = async (item: PeriodoAcademico) => {
        if (!window.confirm(`¿Está seguro de cambiar el estado de activación del período "${item.idPeriodo}"?`)) return;
        try {
            await api.delete(`/catalogs/periodos/${item.idPeriodo}`);
            fetchData();
        } catch (error: any) {
            alert('Error al cambiar estado: ' + error.message);
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 lg:mb-16 px-2 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                        <Settings2 size={10} className="text-text-main animate-spin-slow" />
                        <span>Configuración del Sistema</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">
                        Parámetros Normativos
                    </h2>
                    <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Administración de líneas de investigación institucionales y períodos académicos centralizados para postulación de convocatorias.
                    </p>
                </div>

                <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4">
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-text-main transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Buscar parámetros..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-bg-deep border border-border-thin rounded-md pl-10 pr-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-text-main transition-all uppercase tracking-wider font-mono"
                        />
                    </div>
                    {activeTab === 'lineas' ? (
                        <button 
                            onClick={() => handleOpenLineaModal()}
                            className="flex items-center justify-center gap-2 bg-text-main text-bg-deep px-6 py-3 md:py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nueva Línea
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleOpenPeriodoModal()}
                            className="flex items-center justify-center gap-2 bg-text-main text-bg-deep px-6 py-3 md:py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nuevo Período
                        </button>
                    )}
                </div>
            </header>

            {/* Premium Tabs */}
            <div className="flex border-b border-border-thin mb-8 px-2 gap-4">
                <button
                    onClick={() => { setActiveTab('lineas'); setSearch(''); }}
                    className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                        activeTab === 'lineas'
                            ? 'text-text-main border-text-main'
                            : 'text-text-dim border-transparent hover:text-text-main'
                    }`}
                >
                    <BookOpen size={14} />
                    <span>Líneas de Investigación</span>
                </button>
                <button
                    onClick={() => { setActiveTab('periodos'); setSearch(''); }}
                    className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                        activeTab === 'periodos'
                            ? 'text-text-main border-text-main'
                            : 'text-text-dim border-transparent hover:text-text-main'
                    }`}
                >
                    <Calendar size={14} />
                    <span>Períodos Académicos</span>
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-text-dim" size={24} />
                </div>
            ) : (
                <div className="bento-card overflow-hidden animate-fade-up [animation-delay:200ms]">
                    <div className="overflow-x-auto custom-scrollbar">
                        {activeTab === 'lineas' ? (
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                        <th className="p-4 font-bold tracking-widest">Código</th>
                                        <th className="p-4 font-bold tracking-widest">Línea de Investigación</th>
                                        <th className="p-4 font-bold tracking-widest">Descripción</th>
                                        <th className="p-4 font-bold tracking-widest">Estado</th>
                                        <th className="p-4 font-bold tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-thin">
                                    {filteredLineas.map((l) => (
                                        <tr key={l.uuid} className="hover:bg-surface/30 transition-colors group">
                                            <td className="p-4 text-xs font-mono font-bold text-text-dim">
                                                {l.codigoLinea}
                                            </td>
                                            <td className="p-4 text-sm font-bold text-text-main uppercase tracking-tight">
                                                {l.nombreLinea}
                                            </td>
                                            <td className="p-4 text-xs text-text-dim max-w-xs truncate">
                                                {l.descripcion || 'Sin descripción'}
                                            </td>
                                            <td className="p-4">
                                                {l.activo ? (
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
                                                        onClick={() => handleOpenLineaModal(l)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                                        title="Editar Línea"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleLinea(l)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-red-500 transition-all"
                                                        title="Activar/Desactivar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLineas.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                                No se encontraron líneas registradas
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                        <th className="p-4 font-bold tracking-widest">ID Período</th>
                                        <th className="p-4 font-bold tracking-widest">Detalle / Nombre</th>
                                        <th className="p-4 font-bold tracking-widest">Fecha Inicial</th>
                                        <th className="p-4 font-bold tracking-widest">Fecha Final</th>
                                        <th className="p-4 font-bold tracking-widest">Estado</th>
                                        <th className="p-4 font-bold tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-thin">
                                    {filteredPeriodos.map((p) => (
                                        <tr key={p.idPeriodo} className="hover:bg-surface/30 transition-colors group">
                                            <td className="p-4 text-xs font-mono font-bold text-text-main">
                                                {p.idPeriodo}
                                            </td>
                                            <td className="p-4 text-sm font-bold text-text-main uppercase tracking-tight">
                                                {p.detalle || 'N/A'}
                                            </td>
                                            <td className="p-4 text-xs text-text-dim font-mono">
                                                {p.fechaInicial ? p.fechaInicial.split('T')[0] : 'N/A'}
                                            </td>
                                            <td className="p-4 text-xs text-text-dim font-mono">
                                                {p.fechaFinal ? p.fechaFinal.split('T')[0] : 'N/A'}
                                            </td>
                                            <td className="p-4">
                                                {p.activo ? (
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
                                                        onClick={() => handleOpenPeriodoModal(p)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                                        title="Editar Período"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleTogglePeriodo(p)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-red-500 transition-all"
                                                        title="Activar/Desactivar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPeriodos.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                                No se encontraron períodos académicos registrados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL LINEA INVESTIGACION */}
            {isLineaModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-border-thin flex justify-between items-center bg-bg-deep/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-text-main/10 rounded-lg text-text-main">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingLinea ? 'Editar Línea de Investigación' : 'Nueva Línea de Investigación'}
                                    </h3>
                                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">
                                        Parámetros de catalogación CACES / SENESCYT
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsLineaModalOpen(false)} className="text-text-dim hover:text-text-main p-2">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveLinea} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                                    Código de Línea
                                </label>
                                <input 
                                    type="text" 
                                    value={lineaForm.codigoLinea}
                                    onChange={(e) => setLineaForm({...lineaForm, codigoLinea: e.target.value})}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-mono"
                                    placeholder="LIN-SOFTWARE (Opcional, se autogenera)"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                                    Nombre de la Línea
                                </label>
                                <input 
                                    required
                                    type="text" 
                                    value={lineaForm.nombreLinea}
                                    onChange={(e) => setLineaForm({...lineaForm, nombreLinea: e.target.value})}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-medium"
                                    placeholder="Ej: INTELIGENCIA ARTIFICIAL Y DESARROLLO DE SOFTWARE"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                                    Descripción / Áreas de Enfoque
                                </label>
                                <textarea 
                                    rows={3}
                                    value={lineaForm.descripcion}
                                    onChange={(e) => setLineaForm({...lineaForm, descripcion: e.target.value})}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none"
                                    placeholder="Detalles sobre sublíneas y pertinencia..."
                                />
                            </div>

                            <div className="border-t border-border-thin pt-6 flex justify-end gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsLineaModalOpen(false)}
                                    className="px-6 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-text-main text-bg-deep px-8 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                                >
                                    {editingLinea ? 'Guardar Cambios' : 'Crear Línea'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PERIODO ACADEMICO */}
            {isPeriodoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-border-thin flex justify-between items-center bg-bg-deep/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-text-main/10 rounded-lg text-text-main">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingPeriodo ? 'Editar Período Académico' : 'Nuevo Período Académico'}
                                    </h3>
                                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">
                                        Calendario y asignaciones institucionales
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsPeriodoModalOpen(false)} className="text-text-dim hover:text-text-main p-2">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePeriodo} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                                    Identificador del Período
                                </label>
                                <input 
                                    required
                                    disabled={editingPeriodo !== null}
                                    type="text" 
                                    value={periodoForm.idPeriodo}
                                    onChange={(e) => setPeriodoForm({...periodoForm, idPeriodo: e.target.value})}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-mono disabled:opacity-50"
                                    placeholder="Ej: 2026-A"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                                    Detalle / Nombre
                                </label>
                                <input 
                                    required
                                    type="text" 
                                    value={periodoForm.detalle}
                                    onChange={(e) => setPeriodoForm({...periodoForm, detalle: e.target.value})}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-medium"
                                    placeholder="Ej: PERÍODO MAYO - OCTUBRE 2026"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                                        Fecha de Inicio
                                    </label>
                                    <input 
                                        type="date" 
                                        value={periodoForm.fechaInicial}
                                        onChange={(e) => setPeriodoForm({...periodoForm, fechaInicial: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                                        Fecha de Fin
                                    </label>
                                    <input 
                                        type="date" 
                                        value={periodoForm.fechaFinal}
                                        onChange={(e) => setPeriodoForm({...periodoForm, fechaFinal: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-border-thin pt-6 flex justify-end gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsPeriodoModalOpen(false)}
                                    className="px-6 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-text-main text-bg-deep px-8 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                                >
                                    {editingPeriodo ? 'Guardar Cambios' : 'Crear Período'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ConfiguracionPage;
