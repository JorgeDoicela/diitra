import React, { useState, useEffect } from 'react';
import { 
    Calendar, BookOpen, Plus, Search, Edit2, 
    Trash2, CheckCircle, XCircle, Settings2, Loader2,
    Tag, Globe, BarChart2, ChevronRight
} from 'lucide-react';
import api from '../../api/axios_config';
import { useConfirm } from '../../api/ConfirmContext';

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

interface TipoProducto {
    idTipoProducto?: number;
    uuid?: string;
    nombre: string;
    categoria: string;
    requiereRegistro?: boolean;
    activo?: boolean;
}

interface DominioAcademico {
    idDominio?: number;
    uuid?: string;
    nombre: string;
    activo?: boolean;
    fechaRegistro?: string;
}

interface ConfigIndicador {
    idConfig?: number;
    idInstitucion?: number;
    codigoIndicador: string;
    nombreIndicador: string;
    descripcion?: string;
    tipoDato?: string;
    valorReferencia?: number;
    añoNormativa: number;
    activo?: boolean;
}

const ConfiguracionPage = () => {
    const [activeTab, setActiveTab] = useState<'lineas' | 'periodos' | 'productos' | 'dominios' | 'indicadores'>('lineas');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const confirm = useConfirm();
    
    const [detailItem, setDetailItem] = useState<{
        type: 'linea' | 'periodo' | 'producto' | 'dominio' | 'indicador';
        data: any;
    } | null>(null);

    const [lineas, setLineas] = useState<LineaInvestigacion[]>([]);
    const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
    const [productos, setProductos] = useState<TipoProducto[]>([]);
    const [dominios, setDominios] = useState<DominioAcademico[]>([]);
    const [indicadores, setIndicadores] = useState<ConfigIndicador[]>([]);

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

    const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
    const [editingProducto, setEditingProducto] = useState<TipoProducto | null>(null);
    const [productoForm, setProductoForm] = useState({
        nombre: '',
        categoria: 'Académico',
        requiereRegistro: false
    });

    const [isDominioModalOpen, setIsDominioModalOpen] = useState(false);
    const [editingDominio, setEditingDominio] = useState<DominioAcademico | null>(null);
    const [dominioForm, setDominioForm] = useState({
        nombre: ''
    });

    const [isIndicadorModalOpen, setIsIndicadorModalOpen] = useState(false);
    const [editingIndicador, setEditingIndicador] = useState<ConfigIndicador | null>(null);
    const [indicadorForm, setIndicadorForm] = useState({
        codigoIndicador: '',
        nombreIndicador: '',
        descripcion: '',
        tipoDato: 'Cantidad',
        valorReferencia: 0,
        añoNormativa: new Date().getFullYear()
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'lineas') {
                const res = await api.get('/catalogs/lineas-investigacion');
                const rawData = res.data || [];
                const mappedData = rawData.map((l: any) => ({
                    idLinea: l.id_linea,
                    uuid: l.uuid,
                    codigoLinea: l.codigo_linea || '',
                    nombreLinea: l.nombre_linea || '',
                    descripcion: l.descripcion,
                    activo: l.activo
                }));
                setLineas(mappedData);
            } else if (activeTab === 'periodos') {
                const res = await api.get('/catalogs/periodos');
                const rawData = res.data || [];
                const mappedData = rawData.map((p: any) => ({
                    idPeriodo: p.id_periodo || '',
                    detalle: p.detalle,
                    fechaInicial: p.fecha_inicial,
                    fechaFinal: p.fecha_final,
                    activo: p.activo,
                    cerrado: p.cerrado
                }));
                setPeriodos(mappedData);
            } else if (activeTab === 'productos') {
                const res = await api.get('/catalogs/tipo-producto');
                const rawData = res.data || [];
                const mappedData = rawData.map((t: any) => ({
                    idTipoProducto: t.id_tipo_producto,
                    uuid: t.uuid,
                    nombre: t.nombre || '',
                    categoria: t.categoria || 'Académico',
                    requiereRegistro: t.requiere_registro,
                    activo: t.activo
                }));
                setProductos(mappedData);
            } else if (activeTab === 'dominios') {
                const res = await api.get('/catalogs/dominios');
                const rawData = res.data || [];
                const mappedData = rawData.map((d: any) => ({
                    idDominio: d.id_dominio,
                    uuid: d.uuid,
                    nombre: d.nombre || '',
                    activo: d.activo,
                    fechaRegistro: d.fecha_registro
                }));
                setDominios(mappedData);
            } else if (activeTab === 'indicadores') {
                const res = await api.get('/catalogs/config-indicadores');
                const rawData = res.data || [];
                const mappedData = rawData.map((i: any) => ({
                    idConfig: i.id_config,
                    idInstitucion: i.id_institucion,
                    codigoIndicador: i.codigo_indicador || '',
                    nombreIndicador: i.nombre_indicador || '',
                    descripcion: i.descripcion || '',
                    tipoDato: i.tipo_dato || 'Cantidad',
                    valorReferencia: i.valor_referencia || 0,
                    añoNormativa: i.año_normativa || new Date().getFullYear(),
                    activo: i.activo
                }));
                setIndicadores(mappedData);
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

    const filteredLineas = lineas.filter(l => 
        (l.nombreLinea || '').toLowerCase().includes(search.toLowerCase()) || 
        (l.codigoLinea || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredPeriodos = periodos.filter(p => 
        (p.idPeriodo || '').toLowerCase().includes(search.toLowerCase()) || 
        (p.detalle || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredProductos = productos.filter(t => 
        (t.nombre || '').toLowerCase().includes(search.toLowerCase()) || 
        (t.categoria || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredDominios = dominios.filter(d => 
        (d.nombre || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredIndicadores = indicadores.filter(i => 
        (i.codigoIndicador || '').toLowerCase().includes(search.toLowerCase()) || 
        (i.nombreIndicador || '').toLowerCase().includes(search.toLowerCase()) || 
        (i.descripcion || '').toLowerCase().includes(search.toLowerCase())
    );

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
            const payload = {
                codigo_linea: lineaForm.codigoLinea,
                nombre_linea: lineaForm.nombreLinea,
                descripcion: lineaForm.descripcion,
                activo: editingLinea ? editingLinea.activo : true
            };
            if (editingLinea) {
                await api.put(`/catalogs/lineas-investigacion/${editingLinea.uuid}`, {
                    uuid: editingLinea.uuid,
                    ...payload
                });
            } else {
                await api.post('/catalogs/lineas-investigacion', payload);
            }
            setIsLineaModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert('Error al guardar línea: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleToggleLinea = async (item: LineaInvestigacion) => {
        if (!await confirm({
            title: "Cambiar Estado de Línea",
            message: `¿Está seguro de cambiar el estado de la línea "${item.nombreLinea}"?`,
            confirmText: "Cambiar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;
        try {
            await api.delete(`/catalogs/lineas-investigacion/${item.uuid}`);
            fetchData();
        } catch (error: any) {
            alert('Error al cambiar estado: ' + error.message);
        }
    };

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
                id_periodo: periodoForm.idPeriodo,
                detalle: periodoForm.detalle,
                fecha_inicial: periodoForm.fechaInicial || null,
                fecha_final: periodoForm.fechaFinal || null,
                activo: editingPeriodo ? editingPeriodo.activo : true,
                cerrado: editingPeriodo ? editingPeriodo.cerrado : false
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
        if (!await confirm({
            title: "Cambiar Estado de Período",
            message: `¿Está seguro de cambiar el estado de activación del período "${item.idPeriodo}"?`,
            confirmText: "Cambiar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;
        try {
            await api.delete(`/catalogs/periodos/${item.idPeriodo}`);
            fetchData();
        } catch (error: any) {
            alert('Error al cambiar estado: ' + error.message);
        }
    };

    const handleOpenProductoModal = (item: TipoProducto | null = null) => {
        if (item) {
            setEditingProducto(item);
            setProductoForm({
                nombre: item.nombre,
                categoria: item.categoria,
                requiereRegistro: item.requiereRegistro || false
            });
        } else {
            setEditingProducto(null);
            setProductoForm({
                nombre: '',
                categoria: 'Académico',
                requiereRegistro: false
            });
        }
        setIsProductoModalOpen(true);
    };

    const handleSaveProducto = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                nombre: productoForm.nombre,
                categoria: productoForm.categoria,
                requiere_registro: productoForm.requiereRegistro,
                activo: editingProducto ? editingProducto.activo : true
            };
            if (editingProducto) {
                await api.put(`/catalogs/tipo-producto/${editingProducto.uuid}`, {
                    uuid: editingProducto.uuid,
                    ...payload
                });
            } else {
                await api.post('/catalogs/tipo-producto', payload);
            }
            setIsProductoModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert('Error al guardar tipo de producto: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleToggleProducto = async (item: TipoProducto) => {
        if (!await confirm({
            title: "Cambiar Estado de Producto",
            message: `¿Está seguro de cambiar el estado del tipo de producto "${item.nombre}"?`,
            confirmText: "Cambiar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;
        try {
            await api.delete(`/catalogs/tipo-producto/${item.uuid}`);
            fetchData();
        } catch (error: any) {
            alert('Error al cambiar estado: ' + error.message);
        }
    };

    const handleOpenDominioModal = (item: DominioAcademico | null = null) => {
        if (item) {
            setEditingDominio(item);
            setDominioForm({
                nombre: item.nombre
            });
        } else {
            setEditingDominio(null);
            setDominioForm({
                nombre: ''
            });
        }
        setIsDominioModalOpen(true);
    };

    const handleSaveDominio = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                nombre: dominioForm.nombre,
                activo: editingDominio ? editingDominio.activo : true
            };
            if (editingDominio) {
                await api.put(`/catalogs/dominios/${editingDominio.uuid}`, {
                    uuid: editingDominio.uuid,
                    ...payload
                });
            } else {
                await api.post('/catalogs/dominios', payload);
            }
            setIsDominioModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert('Error al guardar dominio: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleToggleDominio = async (item: DominioAcademico) => {
        if (!await confirm({
            title: "Cambiar Estado de Dominio",
            message: `¿Está seguro de cambiar el estado del dominio "${item.nombre}"?`,
            confirmText: "Cambiar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;
        try {
            await api.delete(`/catalogs/dominios/${item.uuid}`);
            fetchData();
        } catch (error: any) {
            alert('Error al cambiar estado: ' + error.message);
        }
    };

    const handleOpenIndicadorModal = (item: ConfigIndicador | null = null) => {
        if (item) {
            setEditingIndicador(item);
            setIndicadorForm({
                codigoIndicador: item.codigoIndicador,
                nombreIndicador: item.nombreIndicador,
                descripcion: item.descripcion || '',
                tipoDato: item.tipoDato || 'Cantidad',
                valorReferencia: item.valorReferencia || 0,
                añoNormativa: item.añoNormativa || new Date().getFullYear()
            });
        } else {
            setEditingIndicador(null);
            setIndicadorForm({
                codigoIndicador: '',
                nombreIndicador: '',
                descripcion: '',
                tipoDato: 'Cantidad',
                valorReferencia: 0,
                añoNormativa: new Date().getFullYear()
            });
        }
        setIsIndicadorModalOpen(true);
    };

    const handleSaveIndicador = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                codigo_indicador: indicadorForm.codigoIndicador,
                nombre_indicador: indicadorForm.nombreIndicador,
                descripcion: indicadorForm.descripcion,
                tipo_dato: indicadorForm.tipoDato,
                valor_referencia: Number(indicadorForm.valorReferencia),
                año_normativa: Number(indicadorForm.añoNormativa),
                activo: editingIndicador ? editingIndicador.activo : true
            };
            if (editingIndicador) {
                await api.put(`/catalogs/config-indicadores/${editingIndicador.idConfig}`, {
                    id_config: editingIndicador.idConfig,
                    ...payload
                });
            } else {
                await api.post('/catalogs/config-indicadores', payload);
            }
            setIsIndicadorModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert('Error al guardar indicador: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleToggleIndicador = async (item: ConfigIndicador) => {
        if (!await confirm({
            title: "Cambiar Estado de Indicador",
            message: `¿Está seguro de cambiar el estado del indicador "${item.nombreIndicador}"?`,
            confirmText: "Cambiar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;
        try {
            await api.delete(`/catalogs/config-indicadores/${item.idConfig}`);
            fetchData();
        } catch (error: any) {
            alert('Error al cambiar estado: ' + error.message);
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 lg:mb-16 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="section-label text-text-main">
                        <Settings2 size={10} className="text-text-main animate-spin-slow" />
                        <span>Configuración del Sistema</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">
                        Parámetros Normativos
                    </h2>
                    <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Administración de líneas de investigación, períodos académicos, dominios institucionales y métricas del CACES / SENESCYT.
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
                            className="input-vercel pl-10 pr-4 py-2.5 text-xs uppercase tracking-wider font-mono"
                        />
                    </div>
                    {activeTab === 'lineas' && (
                        <button 
                            onClick={() => handleOpenLineaModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nueva Línea
                        </button>
                    )}
                    {activeTab === 'periodos' && (
                        <button 
                            onClick={() => handleOpenPeriodoModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nuevo Período
                        </button>
                    )}
                    {activeTab === 'productos' && (
                        <button 
                            onClick={() => handleOpenProductoModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nuevo Tipo
                        </button>
                    )}
                    {activeTab === 'dominios' && (
                        <button 
                            onClick={() => handleOpenDominioModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nuevo Dominio
                        </button>
                    )}
                    {activeTab === 'indicadores' && (
                        <button 
                            onClick={() => handleOpenIndicadorModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nuevo Indicador
                        </button>
                    )}
                </div>
            </header>

            <div className="tabs-vercel">
                <button
                    onClick={() => { setActiveTab('lineas'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                        activeTab === 'lineas' ? 'active' : ''
                    }`}
                >
                    <BookOpen size={14} />
                    <span>Líneas de Investigación</span>
                </button>
                <button
                    onClick={() => { setActiveTab('periodos'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                        activeTab === 'periodos' ? 'active' : ''
                    }`}
                >
                    <Calendar size={14} />
                    <span>Períodos Académicos</span>
                </button>
                <button
                    onClick={() => { setActiveTab('productos'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                        activeTab === 'productos' ? 'active' : ''
                    }`}
                >
                    <Tag size={14} />
                    <span>Tipos de Producto</span>
                </button>
                <button
                    onClick={() => { setActiveTab('dominios'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                        activeTab === 'dominios' ? 'active' : ''
                    }`}
                >
                    <Globe size={14} />
                    <span>Dominios Académicos</span>
                </button>
                <button
                    onClick={() => { setActiveTab('indicadores'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                        activeTab === 'indicadores' ? 'active' : ''
                    }`}
                >
                    <BarChart2 size={14} />
                    <span>Indicadores CACES</span>
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-text-dim" size={24} />
                </div>
            ) : (
                <div className="bento-card static overflow-hidden animate-fade-up [animation-delay:200ms]">
                    <div className="overflow-x-auto custom-scrollbar">
                        {activeTab === 'lineas' && (
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
                                        <tr key={l.uuid} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'linea', data: l })}>
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
                                                    <span className="badge-vercel badge-vercel-success">
                                                        <CheckCircle size={10} strokeWidth={3} /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-error">
                                                        <XCircle size={10} strokeWidth={3} /> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
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
                        )}

                        {activeTab === 'periodos' && (
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
                                        <tr key={p.idPeriodo} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'periodo', data: p })}>
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
                                                    <span className="badge-vercel badge-vercel-success">
                                                        <CheckCircle size={10} strokeWidth={3} /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-error">
                                                        <XCircle size={10} strokeWidth={3} /> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
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

                        {activeTab === 'productos' && (
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                        <th className="p-4 font-bold tracking-widest">Nombre del Producto</th>
                                        <th className="p-4 font-bold tracking-widest">Categoría</th>
                                        <th className="p-4 font-bold tracking-widest">Requiere PI/Indexación</th>
                                        <th className="p-4 font-bold tracking-widest">Estado</th>
                                        <th className="p-4 font-bold tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-thin">
                                    {filteredProductos.map((t) => (
                                        <tr key={t.uuid} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'producto', data: t })}>
                                            <td className="p-4 text-sm font-bold text-text-main uppercase tracking-tight">
                                                {t.nombre}
                                            </td>
                                            <td className="p-4 text-xs font-mono font-bold text-text-dim uppercase">
                                                {t.categoria}
                                            </td>
                                            <td className="p-4 text-xs text-text-dim">
                                                {t.requiereRegistro ? 'Sí (SENADI / Indexación)' : 'No'}
                                            </td>
                                            <td className="p-4">
                                                {t.activo ? (
                                                    <span className="badge-vercel badge-vercel-success">
                                                        <CheckCircle size={10} strokeWidth={3} /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-error">
                                                        <XCircle size={10} strokeWidth={3} /> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleOpenProductoModal(t)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                                        title="Editar Tipo de Producto"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleProducto(t)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
                                                        title="Activar/Desactivar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProductos.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                                No se encontraron tipos de producto registrados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'dominios' && (
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                        <th className="p-4 font-bold tracking-widest">Nombre del Dominio</th>
                                        <th className="p-4 font-bold tracking-widest">Fecha de Registro</th>
                                        <th className="p-4 font-bold tracking-widest">Estado</th>
                                        <th className="p-4 font-bold tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-thin">
                                    {filteredDominios.map((d) => (
                                        <tr key={d.uuid} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'dominio', data: d })}>
                                            <td className="p-4 text-sm font-bold text-text-main uppercase tracking-tight">
                                                {d.nombre}
                                            </td>
                                            <td className="p-4 text-xs text-text-dim font-mono">
                                                {d.fechaRegistro ? d.fechaRegistro.split('T')[0] : 'N/A'}
                                            </td>
                                            <td className="p-4">
                                                {d.activo ? (
                                                    <span className="badge-vercel badge-vercel-success">
                                                        <CheckCircle size={10} strokeWidth={3} /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-error">
                                                        <XCircle size={10} strokeWidth={3} /> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleOpenDominioModal(d)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                                        title="Editar Dominio"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleDominio(d)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
                                                        title="Activar/Desactivar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredDominios.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                                No se encontraron dominios académicos registrados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'indicadores' && (
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                        <th className="p-4 font-bold tracking-widest">Código</th>
                                        <th className="p-4 font-bold tracking-widest">Nombre del Indicador</th>
                                        <th className="p-4 font-bold tracking-widest">Descripción</th>
                                        <th className="p-4 font-bold tracking-widest">Valor Referencia</th>
                                        <th className="p-4 font-bold tracking-widest">Año Normativa</th>
                                        <th className="p-4 font-bold tracking-widest">Estado</th>
                                        <th className="p-4 font-bold tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-thin">
                                    {filteredIndicadores.map((i) => (
                                        <tr key={i.idConfig} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'indicador', data: i })}>
                                            <td className="p-4 text-xs font-mono font-bold text-text-dim">
                                                {i.codigoIndicador}
                                            </td>
                                            <td className="p-4 text-sm font-bold text-text-main uppercase tracking-tight">
                                                {i.nombreIndicador}
                                            </td>
                                            <td className="p-4 text-xs text-text-dim max-w-xs truncate" title={i.descripcion}>
                                                {i.descripcion || 'Sin descripción'}
                                            </td>
                                            <td className="p-4 text-xs font-mono font-bold text-text-main">
                                                {i.valorReferencia} {i.tipoDato === 'Porcentaje' ? '%' : i.tipoDato === 'Monto' ? '$' : ''}
                                            </td>
                                            <td className="p-4 text-xs font-mono text-text-dim">
                                                {i.añoNormativa}
                                            </td>
                                            <td className="p-4">
                                                {i.activo ? (
                                                    <span className="badge-vercel badge-vercel-success">
                                                        <CheckCircle size={10} strokeWidth={3} /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-error">
                                                        <XCircle size={10} strokeWidth={3} /> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleOpenIndicadorModal(i)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                                        title="Editar Indicador"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleIndicador(i)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
                                                        title="Activar/Desactivar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredIndicadores.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                                No se encontraron indicadores registrados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {isLineaModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsLineaModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingLinea ? 'Editar Línea de Investigación' : 'Nueva Línea de Investigación'}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        Parámetros de catalogación CACES / SENESCYT
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsLineaModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveLinea} className="flex-1 flex flex-col overflow-hidden">
                            <div className="modal-body space-y-6">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Código de Línea
                                    </label>
                                    <input 
                                        type="text" 
                                        value={lineaForm.codigoLinea}
                                        onChange={(e) => setLineaForm({...lineaForm, codigoLinea: e.target.value})}
                                        className="input-vercel uppercase font-mono"
                                        placeholder="LIN-SOFTWARE (Opcional, se autogenera)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Nombre de la Línea
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        value={lineaForm.nombreLinea}
                                        onChange={(e) => setLineaForm({...lineaForm, nombreLinea: e.target.value})}
                                        className="input-vercel uppercase font-medium"
                                        placeholder="Ej: INTELIGENCIA ARTIFICIAL Y DESARROLLO DE SOFTWARE"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Descripción / Áreas de Enfoque
                                    </label>
                                    <textarea 
                                        rows={4}
                                        value={lineaForm.descripcion}
                                        onChange={(e) => setLineaForm({...lineaForm, descripcion: e.target.value})}
                                        className="input-vercel resize-none"
                                        placeholder="Detalles sobre sublíneas y pertinencia..."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsLineaModalOpen(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    {editingLinea ? 'Guardar Cambios' : 'Crear Línea'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPeriodoModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsPeriodoModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingPeriodo ? 'Editar Período Académico' : 'Nuevo Período Académico'}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        Calendario y asignaciones institucionales
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsPeriodoModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePeriodo} className="flex-1 flex flex-col overflow-hidden">
                            <div className="modal-body space-y-6">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Identificador del Período
                                    </label>
                                    <input 
                                        required
                                        disabled={editingPeriodo !== null}
                                        type="text" 
                                        value={periodoForm.idPeriodo}
                                        onChange={(e) => setPeriodoForm({...periodoForm, idPeriodo: e.target.value})}
                                        className="input-vercel uppercase font-mono disabled:opacity-50"
                                        placeholder="Ej: 2026-A"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Detalle / Nombre
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        value={periodoForm.detalle}
                                        onChange={(e) => setPeriodoForm({...periodoForm, detalle: e.target.value})}
                                        className="input-vercel uppercase font-medium"
                                        placeholder="Ej: PERÍODO MAYO - OCTUBRE 2026"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Fecha de Inicio
                                        </label>
                                        <input 
                                            type="date" 
                                            value={periodoForm.fechaInicial}
                                            onChange={(e) => setPeriodoForm({...periodoForm, fechaInicial: e.target.value})}
                                            className="input-vercel"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Fecha de Fin
                                        </label>
                                        <input 
                                            type="date" 
                                            value={periodoForm.fechaFinal}
                                            onChange={(e) => setPeriodoForm({...periodoForm, fechaFinal: e.target.value})}
                                            className="input-vercel"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsPeriodoModalOpen(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    {editingPeriodo ? 'Guardar Cambios' : 'Crear Período'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isProductoModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsProductoModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingProducto ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        Clasificación y Puntuación CACES / SENADI
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsProductoModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProducto} className="flex-1 flex flex-col overflow-hidden">
                            <div className="modal-body space-y-6">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Nombre del Tipo de Producto
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        value={productoForm.nombre}
                                        onChange={(e) => setProductoForm({...productoForm, nombre: e.target.value})}
                                        className="input-vercel uppercase font-medium"
                                        placeholder="Ej: Artículo Científico Indexado, Libro, Prototipo Industrial"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Categoría
                                    </label>
                                    <select 
                                        value={productoForm.categoria}
                                        onChange={(e) => setProductoForm({...productoForm, categoria: e.target.value})}
                                        className="input-vercel font-medium"
                                    >
                                        <option value="Académico">Académico</option>
                                        <option value="Tecnológico">Tecnológico</option>
                                        <option value="Innovación">Innovación</option>
                                        <option value="Transferencia">Transferencia</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-bg-deep/50 rounded-lg border border-border-thin">
                                    <input 
                                        type="checkbox"
                                        id="requiereRegistro"
                                        checked={productoForm.requiereRegistro}
                                        onChange={(e) => setProductoForm({...productoForm, requiereRegistro: e.target.checked})}
                                        className="accent-text-main w-4 h-4 rounded"
                                    />
                                    <label htmlFor="requiereRegistro" className="text-xs text-text-main font-bold uppercase tracking-wide cursor-pointer select-none">
                                        Requiere Registro de Propiedad Intelectual o Indexación (SENADI/ISSN)
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsProductoModalOpen(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    {editingProducto ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDominioModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsDominioModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingDominio ? 'Editar Dominio Académico' : 'Nuevo Dominio Académico'}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        Líneas y Carreras aprobadas por el CES
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsDominioModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDominio} className="flex-1 flex flex-col overflow-hidden">
                            <div className="modal-body space-y-6">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Nombre del Dominio Académico
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        value={dominioForm.nombre}
                                        onChange={(e) => setDominioForm({...dominioForm, nombre: e.target.value})}
                                        className="input-vercel uppercase font-medium"
                                        placeholder="Ej: TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIÓN, SERVICIOS SOCIALES"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsDominioModalOpen(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    {editingDominio ? 'Guardar Cambios' : 'Crear Dominio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isIndicadorModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsIndicadorModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <BarChart2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingIndicador ? 'Editar Indicador CACES' : 'Nuevo Indicador CACES'}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        Parámetros de Evaluación y Acreditación de Calidad
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsIndicadorModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveIndicador} className="flex-1 flex flex-col overflow-hidden">
                            <div className="modal-body space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Código de Indicador
                                        </label>
                                        <input 
                                            required
                                            type="text" 
                                            value={indicadorForm.codigoIndicador}
                                            onChange={(e) => setIndicadorForm({...indicadorForm, codigoIndicador: e.target.value})}
                                            className="input-vercel uppercase font-mono"
                                            placeholder="Ej: IND-PUB-ART"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Año de la Normativa
                                        </label>
                                        <input 
                                            required
                                            type="number" 
                                            value={indicadorForm.añoNormativa}
                                            onChange={(e) => setIndicadorForm({...indicadorForm, añoNormativa: Number(e.target.value)})}
                                            className="input-vercel font-mono"
                                            placeholder="Ej: 2026"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Nombre del Indicador
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        value={indicadorForm.nombreIndicador}
                                        onChange={(e) => setIndicadorForm({...indicadorForm, nombreIndicador: e.target.value})}
                                        className="input-vercel uppercase font-medium"
                                        placeholder="Ej: Tasa de Publicación Científica por Docente TC"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Descripción / Metodología de Cálculo
                                    </label>
                                    <textarea 
                                        rows={3}
                                        value={indicadorForm.descripcion}
                                        onChange={(e) => setIndicadorForm({...indicadorForm, descripcion: e.target.value})}
                                        className="input-vercel resize-none"
                                        placeholder="Detalle sobre el cálculo y pertinencia del indicador..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Tipo de Dato
                                        </label>
                                        <select 
                                            value={indicadorForm.tipoDato}
                                            onChange={(e) => setIndicadorForm({...indicadorForm, tipoDato: e.target.value})}
                                            className="input-vercel font-medium"
                                        >
                                            <option value="Cantidad">Cantidad</option>
                                            <option value="Monto">Monto / Presupuesto</option>
                                            <option value="Porcentaje">Porcentaje</option>
                                            <option value="Booleano">Booleano</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Valor de Referencia / Meta
                                        </label>
                                        <input 
                                            required
                                            type="number" 
                                            step="0.01"
                                            value={indicadorForm.valorReferencia}
                                            onChange={(e) => setIndicadorForm({...indicadorForm, valorReferencia: Number(e.target.value)})}
                                            className="input-vercel font-mono"
                                            placeholder="Ej: 0.50 o 80.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsIndicadorModalOpen(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    {editingIndicador ? 'Guardar Cambios' : 'Crear Indicador'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        {/* Right-side Detail Drawer */}
            {detailItem && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setDetailItem(null)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    {detailItem.type === 'linea' && <BookOpen size={20} />}
                                    {detailItem.type === 'periodo' && <Calendar size={20} />}
                                    {detailItem.type === 'producto' && <Tag size={20} />}
                                    {detailItem.type === 'dominio' && <Globe size={20} />}
                                    {detailItem.type === 'indicador' && <BarChart2 size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {detailItem.type === 'linea' && (detailItem.data as LineaInvestigacion).nombreLinea}
                                        {detailItem.type === 'periodo' && (detailItem.data as PeriodoAcademico).detalle || (detailItem.data as PeriodoAcademico).idPeriodo}
                                        {detailItem.type === 'producto' && (detailItem.data as TipoProducto).nombre}
                                        {detailItem.type === 'dominio' && (detailItem.data as DominioAcademico).nombre}
                                        {detailItem.type === 'indicador' && (detailItem.data as ConfigIndicador).nombreIndicador}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        {detailItem.type === 'linea' && 'Línea de Investigación'}
                                        {detailItem.type === 'periodo' && 'Período Académico'}
                                        {detailItem.type === 'producto' && 'Tipo de Producto'}
                                        {detailItem.type === 'dominio' && 'Dominio Académico'}
                                        {detailItem.type === 'indicador' && 'Indicador CACES'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setDetailItem(null)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {detailItem.type === 'linea' && (() => {
                                const l = detailItem.data as LineaInvestigacion;
                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Código</label>
                                                <p className="text-sm font-bold text-text-main font-mono">{l.codigoLinea || 'Sin código'}</p>
                                            </div>
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Estado</label>
                                                {l.activo ? (
                                                    <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                                )}
                                            </div>
                                        </div>
                                        {l.descripcion && (
                                            <div className="bento-card static p-4 space-y-3">
                                                <label className="section-label text-text-main"><BookOpen size={12} /> Descripción</label>
                                                <div className="divider-vercel !my-0" />
                                                <p className="text-sm text-text-main leading-relaxed">{l.descripcion}</p>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            {detailItem.type === 'periodo' && (() => {
                                const p = detailItem.data as PeriodoAcademico;
                                return (
                                    <>
                                        <div className="bento-card static p-4">
                                            <label className="section-label text-text-dim mb-2">Identificador</label>
                                            <p className="text-sm font-bold text-text-main font-mono">{p.idPeriodo}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Fecha de Inicio</label>
                                                <p className="text-sm font-bold text-text-main font-mono">{p.fechaInicial ? p.fechaInicial.split('T')[0] : 'N/A'}</p>
                                            </div>
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Fecha de Fin</label>
                                                <p className="text-sm font-bold text-text-main font-mono">{p.fechaFinal ? p.fechaFinal.split('T')[0] : 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Estado</label>
                                                {p.activo ? (
                                                    <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                                )}
                                            </div>
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Cerrado</label>
                                                {p.cerrado ? (
                                                    <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Cerrado</span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Abierto</span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}

                            {detailItem.type === 'producto' && (() => {
                                const t = detailItem.data as TipoProducto;
                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Categoría</label>
                                                <span className="badge-vercel badge-vercel-brand">{t.categoria}</span>
                                            </div>
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Estado</label>
                                                {t.activo ? (
                                                    <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bento-card static p-4 space-y-3">
                                            <label className="section-label text-text-main"><Tag size={12} /> Registro de Propiedad Intelectual</label>
                                            <div className="divider-vercel !my-0" />
                                            <p className="text-sm text-text-main">{t.requiereRegistro ? 'Requiere registro SENADI / Indexación' : 'No requiere registro adicional'}</p>
                                        </div>
                                    </>
                                );
                            })()}

                            {detailItem.type === 'dominio' && (() => {
                                const d = detailItem.data as DominioAcademico;
                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Fecha de Registro</label>
                                                <p className="text-sm font-bold text-text-main font-mono">{d.fechaRegistro ? d.fechaRegistro.split('T')[0] : 'N/A'}</p>
                                            </div>
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Estado</label>
                                                {d.activo ? (
                                                    <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}

                            {detailItem.type === 'indicador' && (() => {
                                const i = detailItem.data as ConfigIndicador;
                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Código</label>
                                                <p className="text-sm font-bold text-text-main font-mono">{i.codigoIndicador}</p>
                                            </div>
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Estado</label>
                                                {i.activo ? (
                                                    <span className="badge-vercel badge-vercel-success"><CheckCircle size={10} /> Activo</span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-error"><XCircle size={10} /> Inactivo</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Valor Referencia</label>
                                                <p className="text-lg font-bold text-text-main">{i.valorReferencia} {i.tipoDato === 'Porcentaje' ? '%' : i.tipoDato === 'Monto' ? '$' : ''}</p>
                                            </div>
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Tipo de Dato</label>
                                                <span className="badge-vercel badge-vercel-brand">{i.tipoDato}</span>
                                            </div>
                                            <div className="bento-card static p-4">
                                                <label className="section-label text-text-dim mb-2">Año Normativa</label>
                                                <p className="text-sm font-bold text-text-main font-mono">{i.añoNormativa}</p>
                                            </div>
                                        </div>
                                        {i.descripcion && (
                                            <div className="bento-card static p-4 space-y-3">
                                                <label className="section-label text-text-main"><BarChart2 size={12} /> Descripción</label>
                                                <div className="divider-vercel !my-0" />
                                                <p className="text-sm text-text-main leading-relaxed">{i.descripcion}</p>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setDetailItem(null)} className="btn-vercel-secondary">Cerrar</button>
                            <button 
                                onClick={() => {
                                    if (detailItem) {
                                        if (detailItem.type === 'linea') handleOpenLineaModal(detailItem.data as LineaInvestigacion);
                                        if (detailItem.type === 'periodo') handleOpenPeriodoModal(detailItem.data as PeriodoAcademico);
                                        if (detailItem.type === 'producto') handleOpenProductoModal(detailItem.data as TipoProducto);
                                        if (detailItem.type === 'dominio') handleOpenDominioModal(detailItem.data as DominioAcademico);
                                        if (detailItem.type === 'indicador') handleOpenIndicadorModal(detailItem.data as ConfigIndicador);
                                        setDetailItem(null);
                                    }
                                }}
                                className="btn-vercel-primary flex items-center gap-2"
                            >
                                <Edit2 size={14} /> Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ConfiguracionPage;