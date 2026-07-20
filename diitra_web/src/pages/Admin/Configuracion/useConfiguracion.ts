import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../api/axios_config';
import { useConfirm } from '../../../api/ConfirmContext';

export interface LineaInvestigacion {
    idLinea?: number;
    uuid?: string;
    codigoLinea: string;
    nombreLinea: string;
    descripcion?: string;
    activo?: boolean;
}

export interface PeriodoAcademico {
    idPeriodo: string;
    detalle?: string;
    fechaInicial?: string;
    fechaFinal?: string;
    activo?: boolean;
    cerrado?: boolean;
}

export interface TipoProducto {
    idTipoProducto?: number;
    uuid?: string;
    nombre: string;
    categoria: string;
    requiereRegistro?: boolean;
    activo?: boolean;
}

export interface DominioAcademico {
    idDominio?: number;
    uuid?: string;
    nombre: string;
    activo?: boolean;
    fechaRegistro?: string;
}

export interface ConfigIndicador {
    idConfig?: number;
    idInstitucion?: number;
    codigoIndicador: string;
    nombreIndicador: string;
    descripcion?: string;
    tipoDato?: string;
    valorReferencia?: number;
    umbralCumplido?: number;
    umbralEnProceso?: number;
    añoNormativa: number;
    activo?: boolean;
}

export interface EventoNormativo {
    uuid?: string;
    titulo: string;
    descripcion?: string;
    tipoEvento: string;
    fechaInicio: string;
    fechaFin?: string;
    esTodoElDia: boolean;
    recurrenciaAnual: boolean;
    recurrenciaHasta?: string;
    rolesVisibles?: string;
    moduloOrigen?: string;
    urlAccion?: string;
    colorHex?: string;
    alertaDias?: number;
    activo?: boolean;
}

export const useConfiguracion = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const activeTab = (tabParam === 'lineas' || tabParam === 'periodos' || tabParam === 'productos' || tabParam === 'dominios' || tabParam === 'indicadores' || tabParam === 'calendario') ? tabParam : 'lineas';
    
    const setActiveTab = (tab: 'lineas' | 'periodos' | 'productos' | 'dominios' | 'indicadores' | 'calendario') => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    };

    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const confirm = useConfirm();

    // Data lists
    const [lineas, setLineas] = useState<LineaInvestigacion[]>([]);
    const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
    const [productos, setProductos] = useState<TipoProducto[]>([]);
    const [dominios, setDominios] = useState<DominioAcademico[]>([]);
    const [indicadores, setIndicadores] = useState<ConfigIndicador[]>([]);
    const [calendario, setCalendario] = useState<EventoNormativo[]>([]);

    // Modals control states
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
        umbralCumplido: 0,
        umbralEnProceso: 0,
        añoNormativa: new Date().getFullYear()
    });

    const [isCalendarioModalOpen, setIsCalendarioModalOpen] = useState(false);
    const [editingCalendario, setEditingCalendario] = useState<EventoNormativo | null>(null);
    const [calendarioForm, setCalendarioForm] = useState({
        titulo: '',
        descripcion: '',
        tipoEvento: 'Normativo',
        fechaInicio: '',
        fechaFin: '',
        esTodoElDia: true,
        recurrenciaAnual: false,
        recurrenciaHasta: '',
        rolesVisibles: '',
        moduloOrigen: '',
        urlAccion: '',
        colorHex: '#6B7280',
        alertaDias: 7
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
                    umbralCumplido: i.umbral_cumplido ?? 0,
                    umbralEnProceso: i.umbral_en_proceso ?? 0,
                    añoNormativa: i.año_normativa || new Date().getFullYear(),
                    activo: i.activo
                }));
                setIndicadores(mappedData);
            } else if (activeTab === 'calendario') {
                const res = await api.get('/calendario/normativos');
                const rawData = res.data || [];
                const mappedData = rawData.map((e: any) => ({
                    uuid: e.uuid,
                    titulo: e.titulo || '',
                    descripcion: e.descripcion || '',
                    tipoEvento: e.tipo_evento || 'Normativo',
                    fechaInicio: e.fecha_inicio || '',
                    fechaFin: e.fecha_fin || '',
                    esTodoElDia: e.es_todo_el_dia ?? true,
                    recurrenciaAnual: e.recurrencia_anual ?? false,
                    recurrenciaHasta: e.recurrencia_hasta || '',
                    rolesVisibles: e.roles_visibles || '',
                    moduloOrigen: e.modulo_origen || '',
                    urlAccion: e.url_accion || '',
                    colorHex: e.color_hex || '#6B7280',
                    alertaDias: e.alerta_dias ?? 7,
                    activo: e.activo
                }));
                setCalendario(mappedData);
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

    // Lineas de Investigación actions
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

    // Periodo Académico actions
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

    // Tipo de Producto actions
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

    // Dominio Académico actions
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

    // Indicadores actions
    const handleOpenIndicadorModal = (item: ConfigIndicador | null = null) => {
        if (item) {
            setEditingIndicador(item);
            setIndicadorForm({
                codigoIndicador: item.codigoIndicador,
                nombreIndicador: item.nombreIndicador,
                descripcion: item.descripcion || '',
                tipoDato: item.tipoDato || 'Cantidad',
                valorReferencia: item.valorReferencia || 0,
                umbralCumplido: item.umbralCumplido || 0,
                umbralEnProceso: item.umbralEnProceso || 0,
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
                umbralCumplido: 0,
                umbralEnProceso: 0,
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
                umbral_cumplido: Number(indicadorForm.umbralCumplido),
                umbral_en_proceso: Number(indicadorForm.umbralEnProceso),
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

    // Calendario actions
    const handleOpenCalendarioModal = (item: EventoNormativo | null = null) => {
        if (item) {
            setEditingCalendario(item);
            setCalendarioForm({
                titulo: item.titulo,
                descripcion: item.descripcion || '',
                tipoEvento: item.tipoEvento,
                fechaInicio: item.fechaInicio,
                fechaFin: item.fechaFin || '',
                esTodoElDia: item.esTodoElDia,
                recurrenciaAnual: item.recurrenciaAnual,
                recurrenciaHasta: item.recurrenciaHasta || '',
                rolesVisibles: item.rolesVisibles || '',
                moduloOrigen: item.moduloOrigen || '',
                urlAccion: item.urlAccion || '',
                colorHex: item.colorHex || '#6B7280',
                alertaDias: item.alertaDias ?? 7
            });
        } else {
            setEditingCalendario(null);
            setCalendarioForm({
                titulo: '',
                descripcion: '',
                tipoEvento: 'Normativo',
                fechaInicio: '',
                fechaFin: '',
                esTodoElDia: true,
                recurrenciaAnual: false,
                recurrenciaHasta: '',
                rolesVisibles: '',
                moduloOrigen: '',
                urlAccion: '',
                colorHex: '#6B7280',
                alertaDias: 7
            });
        }
        setIsCalendarioModalOpen(true);
    };

    const handleSaveCalendario = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                titulo: calendarioForm.titulo,
                descripcion: calendarioForm.descripcion,
                tipo_evento: calendarioForm.tipoEvento,
                fecha_inicio: calendarioForm.fechaInicio,
                fecha_fin: calendarioForm.fechaFin || null,
                es_todo_el_dia: calendarioForm.esTodoElDia,
                recurrencia_anual: calendarioForm.recurrenciaAnual,
                recurrencia_hasta: calendarioForm.recurrenciaHasta || null,
                roles_visibles: calendarioForm.rolesVisibles || null,
                modulo_origen: calendarioForm.moduloOrigen || null,
                url_accion: calendarioForm.urlAccion || null,
                color_hex: calendarioForm.colorHex,
                alerta_dias: calendarioForm.alertaDias ? Number(calendarioForm.alertaDias) : null,
                activo: editingCalendario ? editingCalendario.activo : true
            };
            if (editingCalendario && editingCalendario.uuid) {
                await api.put(`/calendario/normativos/${editingCalendario.uuid}`, payload);
            } else {
                await api.post('/calendario/normativos', payload);
            }
            setIsCalendarioModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert('Error al guardar hito: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteCalendario = async (item: EventoNormativo) => {
        if (!await confirm({
            title: "Eliminar Hito Normativo",
            message: `¿Está seguro de eliminar el hito normativo "${item.titulo}" del calendario?`,
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;
        try {
            await api.delete(`/calendario/normativos/${item.uuid}`);
            fetchData();
        } catch (error: any) {
            alert('Error al eliminar hito: ' + error.message);
        }
    };

    // Filtered lists for searching
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
    
    const filteredCalendario = calendario.filter(c => 
        (c.titulo || '').toLowerCase().includes(search.toLowerCase()) || 
        (c.descripcion || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.tipoEvento || '').toLowerCase().includes(search.toLowerCase())
    );

    return {
        activeTab,
        setActiveTab,
        loading,
        search,
        setSearch,

        // Data arrays
        lineas,
        periodos,
        productos,
        dominios,
        indicadores,
        calendario,

        // Filtered lists
        filteredLineas,
        filteredPeriodos,
        filteredProductos,
        filteredDominios,
        filteredIndicadores,
        filteredCalendario,

        // Linea states & actions
        isLineaModalOpen,
        setIsLineaModalOpen,
        editingLinea,
        lineaForm,
        setLineaForm,
        handleOpenLineaModal,
        handleSaveLinea,
        handleToggleLinea,

        // Periodo states & actions
        isPeriodoModalOpen,
        setIsPeriodoModalOpen,
        editingPeriodo,
        periodoForm,
        setPeriodoForm,
        handleOpenPeriodoModal,
        handleSavePeriodo,
        handleTogglePeriodo,

        // Producto states & actions
        isProductoModalOpen,
        setIsProductoModalOpen,
        editingProducto,
        productoForm,
        setProductoForm,
        handleOpenProductoModal,
        handleSaveProducto,
        handleToggleProducto,

        // Dominio states & actions
        isDominioModalOpen,
        setIsDominioModalOpen,
        editingDominio,
        dominioForm,
        setDominioForm,
        handleOpenDominioModal,
        handleSaveDominio,
        handleToggleDominio,

        // Indicador states & actions
        isIndicadorModalOpen,
        setIsIndicadorModalOpen,
        editingIndicador,
        indicadorForm,
        setIndicadorForm,
        handleOpenIndicadorModal,
        handleSaveIndicador,
        handleToggleIndicador,

        // Calendario states & actions
        isCalendarioModalOpen,
        setIsCalendarioModalOpen,
        editingCalendario,
        calendarioForm,
        setCalendarioForm,
        handleOpenCalendarioModal,
        handleSaveCalendario,
        handleDeleteCalendario,

        fetchData
    };
};
