import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Activity, DollarSign, Calendar, 
    CheckCircle2, TrendingUp, Wallet, 
    Plus, Trash2, ArrowUpRight, BarChart3, X 
} from 'lucide-react';
import api from '../../../api/axios_config';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DIITRA ARCHITECTURE: MONITOREO & EJECUCIÓN (FASE C) - MÓDULO SATÉLITE
 * ══════════════════════════════════════════════════════════════════════════════
 */

interface GastoRegistrado {
    id: string;
    descripcion: string;
    partida: string;
    monto: number;
    fecha: string;
    referenciaFactura: string;
    categoria: string;
}

export const MonitoringPage: React.FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const navigate = useNavigate();
    const { addToast } = useNotifications();
    const confirm = useConfirm();

    const [activeTab, setActiveTab] = useState<'cronograma' | 'presupuesto'>('cronograma');
    const [projectDetail, setProjectDetail] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estado para el Libro Diario (Gastos Ejecutados reales en la Fase C)
    const [gastos, setGastos] = useState<GastoRegistrado[]>([
        { id: '1', descripcion: 'Reactivos de laboratorio para cultivos', partida: '53.08.04', monto: 350.00, fecha: '2026-05-10', referenciaFactura: 'FAC-2026-0089', categoria: 'Materiales de Consumo' },
        { id: '2', descripcion: 'Servicios de Computación en la Nube (AWS Dev)', partida: '53.01.05', monto: 120.00, fecha: '2026-05-18', referenciaFactura: 'FAC-AWS-9982', categoria: 'Tecnología/Servicios' }
    ]);

    const [showGastoModal, setShowGastoModal] = useState(false);
    const [nuevoGasto, setNuevoGasto] = useState({
        descripcion: '',
        partida: '',
        monto: '',
        referenciaFactura: '',
        categoria: 'Materiales de Consumo'
    });

    useEffect(() => {
        const fetchDetail = async () => {
            if (!projectUuid) return;
            setIsLoading(true);
            try {
                const res = await api.get(`/projects/${projectUuid}/detail`);
                setProjectDetail(res.data);
            } catch (err: any) {
                console.error('[DIITRA] Error al cargar detalles para el monitoreo:', err);
                setError(err.response?.data?.message || 'No se pudo cargar la información del proyecto.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
    }, [projectUuid]);

    const handleAddGasto = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevoGasto.descripcion || !nuevoGasto.monto) {
            addToast('Campos Requeridos', 'Por favor complete los campos obligatorios', 'warning');
            return;
        }

        const gasto: GastoRegistrado = {
            id: Math.random().toString(36).substring(2, 9),
            descripcion: nuevoGasto.descripcion,
            partida: nuevoGasto.partida || 'General',
            monto: parseFloat(nuevoGasto.monto),
            fecha: new Date().toISOString().split('T')[0],
            referenciaFactura: nuevoGasto.referenciaFactura || 'S/N',
            categoria: nuevoGasto.categoria
        };

        setGastos(prev => [gasto, ...prev]);
        setShowGastoModal(false);
        addToast('Egreso Registrado', 'El egreso ha sido registrado con éxito en el Libro Diario.', 'success');
        setNuevoGasto({
            descripcion: '',
            partida: '',
            monto: '',
            referenciaFactura: '',
            categoria: 'Materiales de Consumo'
        });
    };

    const handleDeleteGasto = async (id: string) => {
        if (!await confirm({
            title: "Eliminar Registro de Gasto",
            message: "¿Está seguro de eliminar este registro de gasto?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;
        setGastos(prev => prev.filter(g => g.id !== id));
        addToast('Egreso Eliminado', 'El egreso ha sido eliminado con éxito.', 'success');
    };

    // Cálculos financieros consolidantes
    const presupuestoPlanificado = projectDetail?.costoTotal || 0;
    const totalGastado = gastos.reduce((acc, curr) => acc + curr.monto, 0);
    const saldoRestante = presupuestoPlanificado - totalGastado;
    const porcentajeEjecucion = presupuestoPlanificado > 0 ? (totalGastado / presupuestoPlanificado) * 100 : 0;

    if (isLoading) {
        return (
            <div className="flex-1 bg-bg-deep flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="animate-spin h-8 w-8 border-t-2 border-brand rounded-full"></div>
                    <p className="text-[10px] font-bold text-text-dim uppercase tracking-[0.3em]">Cargando Monitoreo...</p>
                </div>
            </div>
        );
    }

    if (error || !projectDetail) {
        return (
            <div className="flex-1 bg-bg-deep flex items-center justify-center min-h-screen p-8 text-center">
                <div className="bg-surface border border-red-500/20 p-8 rounded-3xl max-w-md shadow-2xl">
                    <h3 className="text-red-500 text-lg font-bold uppercase tracking-wider mb-2">Error de Carga</h3>
                    <p className="text-text-dim text-sm font-medium mb-6">
                        {error || 'No se pudo resolver la instancia del proyecto de investigación.'}
                    </p>
                    <button onClick={() => navigate('/investigacion')} className="btn-vercel-primary py-3 w-full">
                        Volver a Investigaciones
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-bg-deep min-h-screen text-text-main p-4 md:p-10 overflow-y-auto selection:bg-text-main selection:text-bg-deep">
            {/* Header del Satélite */}
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 md:gap-0 sticky top-0 bg-bg-deep/80 backdrop-blur z-20 pb-4 border-b border-border-thin">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2.5 rounded-xl bg-surface border border-border-thin hover:border-text-main text-text-dim hover:text-text-main transition-all"
                        title="Volver al Workspace"
                    >
                        <ArrowLeft size={14} />
                    </button>
                    <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-dim uppercase tracking-[0.3em]">
                            <Activity size={10} className="text-brand animate-pulse" />
                            <span>Módulo de Monitoreo & Ejecución · IST Traversari</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight mt-0.5">{projectDetail.titulo}</h1>
                    </div>
                </div>
                
                {/* Switcher Bento de Tabs */}
                <div className="flex bg-surface p-1 rounded-xl border border-border-thin w-full md:w-auto">
                    <button 
                        onClick={() => setActiveTab('cronograma')}
                        className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'cronograma' ? 'bg-text-main text-bg-deep shadow' : 'text-text-dim hover:text-text-main'}`}
                    >
                        <Calendar size={14} />
                        <span>Cronograma (Gantt)</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('presupuesto')}
                        className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'presupuesto' ? 'bg-text-main text-bg-deep shadow' : 'text-text-dim hover:text-text-main'}`}
                    >
                        <DollarSign size={14} />
                        <span>Presupuesto (Libro Diario)</span>
                    </button>
                </div>
            </header>

            {/* Ficha Rápida del Proyecto en Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-fade-up">
                <div className="bento-card static p-5 space-y-1">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Director de Proyecto</span>
                    <p className="text-sm font-semibold text-text-main truncate">{projectDetail.directorProyecto || 'Jorge Doicela'}</p>
                </div>
                <div className="bento-card static p-5 space-y-1">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Línea de Investigación</span>
                    <p className="text-sm font-semibold text-text-main truncate">{projectDetail.lineaInvestigacion || 'No especificada'}</p>
                </div>
                <div className="bento-card static p-5 space-y-1">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Estado de Ciclo de Vida</span>
                    <span className="badge-vercel badge-vercel-violet text-[9px] font-bold w-fit mt-1">
                        <span className="dot dot-brand dot-pulse" />
                        En Ejecución (Fase C)
                    </span>
                </div>
                <div className="bento-card static p-5 space-y-1">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Acreditación CACES</span>
                    <p className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-success" />
                        <span>Metadatos Forenses Listos</span>
                    </p>
                </div>
            </div>

            {/* Contenido Dinámico de Tabs */}
            <main className="animate-fade-up [animation-delay:100ms]">
                {activeTab === 'cronograma' ? (
                    /* ── VISTA DEL CRONOGRAMA (DIAGRAMA DE GANTT INTERACTIVO) ── */
                    <div className="bento-card static p-6 md:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-thin pb-4 gap-3 sm:gap-0">
                            <div>
                                <h3 className="text-lg font-bold text-text-main">Diagrama de Gantt Académico</h3>
                                <p className="text-xs text-text-dim mt-0.5">Seguimiento de las semanas de desarrollo programadas contra entregables institucionales.</p>
                            </div>
                            <div className="flex gap-4 text-[10px] uppercase font-bold text-text-dim tracking-wider">
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-brand" /> <span>Semana Ejecutada</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-border-thin" /> <span>Planificado</span></div>
                            </div>
                        </div>

                        {/* Contenedor del Scrollbar de Gantt */}
                        <div className="overflow-x-auto pr-1 scrollbar-thin scrollbar-thumb-surface border border-border-thin rounded-xl">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-surface/30 text-left border-b border-border-thin">
                                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim w-12 text-center">N°</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim min-w-[250px]">Actividad Planificada</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim w-32 text-center">CACES</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim w-[450px]">Gantt (Semanas de Plan de Trabajo)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-thin">
                                    {projectDetail.cronograma && projectDetail.cronograma.length > 0 ? (
                                        projectDetail.cronograma.map((act: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-surface/20 transition-colors">
                                                <td className="p-4 text-center font-mono font-bold text-text-dim text-xs">{act.numero}</td>
                                                <td className="p-4">
                                                    <p className="text-xs font-medium text-text-main">{act.actividad}</p>
                                                    {act.recursosNecesarios && <span className="text-[10px] text-text-dim block mt-0.5 font-medium">Recurso: {act.recursosNecesarios}</span>}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`badge-vercel text-[9px] font-bold mx-auto w-fit ${act.esEntregableCaces ? 'badge-vercel-warning' : 'badge-vercel-neutral'}`}>
                                                        {act.esEntregableCaces ? 'CACES Mandatorio' : 'Interno'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {/* Representación de 12 semanas para visualización simplificada */}
                                                    <div className="flex gap-1.5">
                                                        {Array.from({ length: 12 }).map((_, weekIdx) => {
                                                            // Simular semanas de GANTT basadas en el índice
                                                            const isPlanned = idx % 2 === 0 
                                                                ? (weekIdx >= idx && weekIdx <= idx + 3)
                                                                : (weekIdx >= idx - 1 && weekIdx <= idx + 1);
                                                            return (
                                                                <div 
                                                                    key={weekIdx} 
                                                                    className={`w-6 h-6 rounded flex items-center justify-center text-[8px] font-mono font-bold transition-all ${
                                                                        isPlanned 
                                                                            ? 'bg-brand/20 border border-brand/50 text-brand' 
                                                                            : 'border border-border-thin text-text-dim/30'
                                                                    }`}
                                                                    title={`Semana ${weekIdx + 1}: ${isPlanned ? 'Planificado' : 'Sin actividad'}`}
                                                                >
                                                                    S{weekIdx + 1}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-text-dim text-xs uppercase tracking-wider font-mono">
                                                Sin actividades registradas en el cronograma.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* ── VISTA DE PRESUPUESTO & LIBRO DIARIO DE EGRESOS (FINANCIERO) ── */
                    <div className="space-y-6">
                        {/* Tarjetas Bento de Métricas Financieras */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bento-card static p-6 flex items-center justify-between group">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Presupuesto Asignado</span>
                                    <p className="text-2xl font-black text-text-main tracking-tight">${presupuestoPlanificado.toFixed(2)}</p>
                                </div>
                                <div className="icon-circle icon-circle-neutral"><Wallet size={20} /></div>
                            </div>
                            <div className="bento-card static p-6 flex items-center justify-between group">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Ejecución Real (Gastado)</span>
                                    <p className="text-2xl font-black text-brand tracking-tight">${totalGastado.toFixed(2)}</p>
                                    <span className="text-[10px] text-text-dim block mt-0.5">Porcentaje de uso: <span className="font-bold text-brand">{porcentajeEjecucion.toFixed(1)}%</span></span>
                                </div>
                                <div className="icon-circle icon-circle-brand"><TrendingUp size={20} /></div>
                            </div>
                            <div className="bento-card static p-6 flex items-center justify-between group">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Saldo Restante</span>
                                    <p className="text-2xl font-black text-text-main tracking-tight">${saldoRestante.toFixed(2)}</p>
                                </div>
                                <div className="icon-circle icon-circle-neutral"><BarChart3 size={20} /></div>
                            </div>
                        </div>

                        {/* Bento Card del Libro Diario */}
                        <div className="bento-card static p-6 md:p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-thin pb-4 gap-3 sm:gap-0">
                                <div>
                                    <h3 className="text-lg font-bold text-text-main">Libro Diario de Gastos</h3>
                                    <p className="text-xs text-text-dim mt-0.5">Control y registro de facturas para justificación física ante auditorías del CACES.</p>
                                </div>
                                <button 
                                    onClick={() => setShowGastoModal(true)}
                                    className="btn-vercel-primary !py-2 text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center"
                                >
                                    <Plus size={14} />
                                    <span>Registrar Egreso</span>
                                </button>
                            </div>

                            {/* Listado de egresos */}
                            <div className="overflow-x-auto pr-1 scrollbar-thin scrollbar-thumb-surface border border-border-thin rounded-xl">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-surface/30 text-left border-b border-border-thin">
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim">Fecha</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim">Detalle / Justificación</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim text-center">Partida</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim">Categoría</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim text-right">Monto</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim text-center">Factura/Ref</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-text-dim text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-thin text-xs">
                                        {gastos.map((g) => (
                                            <tr key={g.id} className="hover:bg-surface/20 transition-colors">
                                                <td className="p-4 font-mono text-text-dim">{new Date(g.fecha).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <p className="font-medium text-text-main">{g.descripcion}</p>
                                                </td>
                                                <td className="p-4 text-center font-mono font-medium text-text-dim">{g.partida}</td>
                                                <td className="p-4">
                                                    <span className="badge-vercel badge-vercel-neutral text-[9px] font-bold">
                                                        {g.categoria}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-bold text-text-main">${g.monto.toFixed(2)}</td>
                                                <td className="p-4 text-center font-mono text-text-dim uppercase tracking-wider">{g.referenciaFactura}</td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={() => handleDeleteGasto(g.id)}
                                                        className="p-2 text-text-dim hover:text-red-500 transition-colors rounded hover:bg-red-500/10 cursor-pointer"
                                                        title="Eliminar Gasto"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {gastos.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-text-dim text-xs uppercase tracking-wider font-mono">
                                                    Sin egresos registrados. Clic en "Registrar Egreso" para añadir.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal para registrar egresos */}
            {showGastoModal && (
                <div className="modal-overlay z-50" onClick={(e) => { if (e.target === e.currentTarget) setShowGastoModal(false); }}>
                    <div className="modal-card modal-card--sm animate-fade-up max-h-[85vh] overflow-y-auto">
                        <div className="modal-header border-b border-border-thin pb-4">
                            <div>
                                <h3 className="text-xl font-semibold tracking-tight text-text-main">
                                    Registrar Egreso
                                </h3>
                                <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest mt-0.5">Control Financiero - Fase C</p>
                            </div>
                            <button onClick={() => setShowGastoModal(false)} className="p-2 text-text-dim hover:text-text-main transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddGasto} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Descripción / Justificación *</label>
                                <input 
                                    type="text" required
                                    value={nuevoGasto.descripcion}
                                    onChange={(e) => setNuevoGasto({...nuevoGasto, descripcion: e.target.value})}
                                    placeholder="Ej: Materiales y reactivos de bioanálisis"
                                    className="input-vercel !text-xs !py-3"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Monto ($ USD) *</label>
                                    <input 
                                        type="number" required min="0.01" step="0.01"
                                        value={nuevoGasto.monto}
                                        onChange={(e) => setNuevoGasto({...nuevoGasto, monto: e.target.value})}
                                        placeholder="Ej: 150.00"
                                        className="input-vercel !text-xs !py-3 font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Partida Presupuestaria</label>
                                    <input 
                                        type="text"
                                        value={nuevoGasto.partida}
                                        onChange={(e) => setNuevoGasto({...nuevoGasto, partida: e.target.value})}
                                        placeholder="Ej: 53.08.04"
                                        className="input-vercel !text-xs !py-3 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Referencia Factura</label>
                                    <input 
                                        type="text"
                                        value={nuevoGasto.referenciaFactura}
                                        onChange={(e) => setNuevoGasto({...nuevoGasto, referenciaFactura: e.target.value})}
                                        placeholder="Ej: FAC-2026-0012"
                                        className="input-vercel !text-xs !py-3 font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Categoría</label>
                                    <select 
                                        value={nuevoGasto.categoria}
                                        onChange={(e) => setNuevoGasto({...nuevoGasto, categoria: e.target.value})}
                                        className="input-vercel !text-xs !py-3 bg-bg-deep cursor-pointer"
                                    >
                                        <option value="Materiales de Consumo">Materiales de Consumo</option>
                                        <option value="Equipos / Activos">Equipos / Activos</option>
                                        <option value="Tecnología/Servicios">Tecnología/Servicios</option>
                                        <option value="Publicación/Difusión">Publicación/Difusión</option>
                                        <option value="Viáticos/Movilización">Viáticos/Movilización</option>
                                    </select>
                                </div>
                            </div>

                            <div className="divider-vercel pt-2" />

                            <div className="flex gap-4 justify-end pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowGastoModal(false)}
                                    className="btn-vercel-secondary !py-2 text-xs"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary !py-2 text-xs flex items-center gap-1.5"
                                >
                                    <ArrowUpRight size={12} />
                                    <span>Registrar Gasto</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonitoringPage;
