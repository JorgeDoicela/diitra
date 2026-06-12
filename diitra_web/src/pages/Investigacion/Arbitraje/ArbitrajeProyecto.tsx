import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Gavel, AlertTriangle, CheckCircle2,
    Loader2, Users, Building, GraduationCap, FileDown,
    CalendarDays, X, PlusCircle, Trash2, Scale, Award
} from 'lucide-react';
import {
    getArbitrajeByProject, cerrarArbitraje, revocarAsignacion, iniciarEjecucion,
    ESTADO_REVISION_CONFIG, ESTADO_ARBITRAJE_CONFIG, downloadDictamenPdf,
    extenderPlazo, updateProjectPeerReviewSettings
} from '../../../services/peerReviewService';
import type { ArbitrajeProyectoDto, PeerReviewDto, DictamenDto } from '../../../services/peerReviewService';
import AsignarArbitroModal from './AsignarArbitroModal';
import DictamenModal from './DictamenModal';
import { formatNombre } from './arbitrajeUtils';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';

const ArbitrajeProyecto: React.FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const navigate = useNavigate();
    const { addToast } = useNotifications();
    const confirm = useConfirm();

    const [arbitraje, setArbitraje] = useState<ArbitrajeProyectoDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [cerrando, setCerrando] = useState(false);
    const [iniciandoEjecucion, setIniciandoEjecucion] = useState(false);
    const [showAsignar, setShowAsignar] = useState(false);
    const [dictamen, setDictamen] = useState<DictamenDto | null>(null);
    const [revisionParaExtender, setRevisionParaExtender] = useState<PeerReviewDto | null>(null);
    const [projectAutoExtendDeadlines, setProjectAutoExtendDeadlines] = useState(false);
    const [projectAutoExtendDays, setProjectAutoExtendDays] = useState(7);
    const [savingSettings, setSavingSettings] = useState(false);

    const internos = arbitraje ? arbitraje.revisiones.filter(r => !r.es_externo) : [];
    const externos = arbitraje ? arbitraje.revisiones.filter(r => r.es_externo) : [];

    const loadData = useCallback(async () => {
        if (!projectUuid) return;
        setLoading(true);
        try {
            const data = await getArbitrajeByProject(projectUuid);
            setArbitraje(data);
            setProjectAutoExtendDeadlines(data.auto_extend_deadlines ?? false);
            setProjectAutoExtendDays(data.auto_extend_days ?? 7);
        } catch (err) {
            console.error('[DIITRA] Error cargando arbitraje:', err);
        } finally {
            setLoading(false);
        }
    }, [projectUuid]);

    const handleSaveProjectSettings = async (autoExtend: boolean, days: number) => {
        if (!projectUuid) return;
        setSavingSettings(true);
        try {
            await updateProjectPeerReviewSettings(projectUuid, {
                auto_extend_deadlines: autoExtend,
                auto_extend_days: days
            });
            setProjectAutoExtendDeadlines(autoExtend);
            setProjectAutoExtendDays(days);
            addToast('Configuración Guardada', 'La configuración de prórrogas ha sido guardada con éxito.', 'success');
        } catch (err: any) {
            addToast('Error', err?.response?.data?.message ?? 'Error al guardar la configuración de prórrogas.', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    useEffect(() => { loadData(); }, [loadData]);

    const handleCerrar = async () => {
        if (!projectUuid || !arbitraje) return;
        if (!await confirm({
            title: "Cerrar Arbitraje",
            message: "¿Cerrar el arbitraje y emitir el dictamen final? Esta acción cambiará el estado del proyecto.",
            confirmText: "Cerrar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;

        setCerrando(true);
        try {
            const result = await cerrarArbitraje(projectUuid);
            setDictamen(result);
            loadData();
            addToast('Arbitraje Cerrado', 'El arbitraje ha sido cerrado y el dictamen final emitido con éxito.', 'success');
        } catch (err: any) {
            addToast('Error', err?.response?.data?.message ?? 'Error al cerrar el arbitraje.', 'error');
        } finally {
            setCerrando(false);
        }
    };

    const [descargandoPdf, setDescargandoPdf] = useState(false);

    const handleDescargarPdf = async () => {
        if (!projectUuid || !arbitraje) return;
        setDescargandoPdf(true);
        try {
            const blob = await downloadDictamenPdf(projectUuid);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cleanTitle = arbitraje.proyecto_titulo.replace(/[\/\\?%*:|"<>\.]/g, '').replace(/\s+/g, '_');
            a.download = `Acta_Dictamen_${cleanTitle}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('[DIITRA] Error descargando dictamen PDF:', err);
            addToast('Error de Descarga', err?.response?.data?.message ?? 'No se pudo descargar el Acta de Dictamen.', 'error');
        } finally {
            setDescargandoPdf(false);
        }
    };

    const handleRevocar = async (rev: PeerReviewDto) => {
        if (!await confirm({
            title: "Revocar Asignación",
            message: `¿Revocar la asignación de ${rev.revisor_nombre}? Esta acción no se puede deshacer.`,
            confirmText: "Revocar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;
        try {
            await revocarAsignacion(rev.uuid);
            loadData();
            addToast('Asignación Revocada', 'La asignación del árbitro ha sido revocada con éxito.', 'success');
        } catch {
            addToast('Error', 'No se pudo revocar la asignación.', 'error');
        }
    };

    const handleIniciarEjecucion = async () => {
        if (!projectUuid) return;
        if (!await confirm({
            title: "Iniciar Ejecución",
            message: "¿Iniciar la fase de ejecución del proyecto? Se habilitarán los informes de avance.",
            confirmText: "Iniciar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;
        setIniciandoEjecucion(true);
        try {
            await iniciarEjecucion(projectUuid);
            loadData();
            addToast('Ejecución Iniciada', 'El proyecto ha pasado a la fase de ejecución con éxito.', 'success');
        } catch (err: any) {
            addToast('Error', err?.response?.data?.message ?? 'Error al iniciar ejecución.', 'error');
        } finally {
            setIniciandoEjecucion(false);
        }
    };

    const puedesCerrar = arbitraje && arbitraje.revisiones.length > 0
        && arbitraje.revisiones.every(r => r.estado === 'Completada')
        && !arbitraje.arbitraje_cerrado;

    if (loading) {
        return (
            <main className="flex-1 bg-bg-deep flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-text-dim">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-xs font-semibold uppercase tracking-widest">Cargando arbitraje...</span>
                </div>
            </main>
        );
    }

    if (!arbitraje) {
        return (
            <main className="flex-1 bg-bg-deep p-10">
                <button onClick={() => navigate('/arbitraje')} className="btn-vercel-secondary flex items-center gap-2 mb-6">
                    <ArrowLeft size={14} /> Volver
                </button>
                <div className="empty-state py-20">
                    <p className="text-text-dim font-semibold">Proyecto no encontrado.</p>
                </div>
            </main>
        );
    }

    const estadoCfg = ESTADO_ARBITRAJE_CONFIG[arbitraje.estado_arbitraje] ?? ESTADO_ARBITRAJE_CONFIG['Pendiente'];

    const renderRevisionRow = (rev: PeerReviewDto) => {
        const cfg = ESTADO_REVISION_CONFIG[rev.estado] ?? ESTADO_REVISION_CONFIG['Pendiente'];
        const diasRestantes = Math.ceil(
            (new Date(rev.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return (
            <tr
                key={rev.uuid}
                className="group border-b border-border-thin/50 last:border-0 hover:bg-surface/40 transition-colors"
            >
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border-thin flex items-center justify-center shrink-0 text-text-dim text-[11px] font-mono font-medium">
                            {rev.revisor_nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-text-main leading-snug truncate max-w-[160px] sm:max-w-[240px]">
                                {formatNombre(rev.revisor_nombre)}
                            </p>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-text-dim font-medium">
                                {!rev.es_externo && rev.revisor_carrera && (
                                    <span className="flex items-center gap-0.5 bg-surface border border-border-thin px-1 py-0.5 rounded text-text-main font-semibold max-w-[100px] xs:max-w-[140px] sm:max-w-none" title={formatNombre(rev.revisor_carrera)}>
                                        <GraduationCap size={9} className="shrink-0" />
                                        <span className="truncate">{formatNombre(rev.revisor_carrera)}</span>
                                    </span>
                                )}
                                {rev.revisor_especialidad && (
                                    <span className="flex items-center gap-0.5 max-w-[110px] xs:max-w-[150px] sm:max-w-none" title={rev.revisor_especialidad}>
                                        <Award size={9} className="shrink-0" />
                                        <span className="truncate">{rev.revisor_especialidad}</span>
                                    </span>
                                )}
                                {rev.es_doble_ciego && (
                                    <span className="status-tag text-text-dim px-1.5 py-0.5 text-[9px] bg-surface/50 border border-border-thin shrink-0">Anónimo</span>
                                )}
                            </div>

                            {/* Detalle apilado para móviles (debajo del nombre) */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:hidden text-[9px] font-medium">
                                {rev.es_externo ? (
                                    <span className="text-brand bg-brand/5 border border-brand/10 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                                        <Building size={8} /> Ext. CACES
                                    </span>
                                ) : (
                                    <span className="text-text-dim bg-surface border border-border-thin rounded px-1.5 py-0.5 flex items-center gap-0.5">
                                        <Users size={8} /> Interno
                                    </span>
                                )}

                                <span className="bg-surface border border-border-thin rounded px-1.5 py-0.5 text-text-dim font-mono">
                                    {diasRestantes > 0 ? `${diasRestantes}d` : 'Expirado'}
                                </span>

                                {rev.puntaje_total != null && (
                                    <span className={`rounded px-1.5 py-0.5 font-mono ${rev.puntaje_total >= 70 ? 'bg-success/5 border border-success/20 text-success' : 'bg-error/5 border border-error/20 text-error'}`}>
                                        {rev.puntaje_total.toFixed(1)} pts
                                    </span>
                                )}

                                <div className={`scale-90 origin-left badge-vercel ${cfg.badge} !py-0 !px-1.5 !h-auto !text-[8px]`}>
                                    <span className={`dot ${cfg.dot} !w-1 !h-1`} />
                                    {cfg.label}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                    {rev.es_externo ? (
                        <span className="text-[11px] text-brand font-medium flex items-center gap-1">
                            <Building size={10} /> Par Externo (CACES)
                        </span>
                    ) : (
                        <span className="text-[11px] text-text-dim font-medium flex items-center gap-1">
                            <Users size={10} /> Docente Interno
                        </span>
                    )}
                </td>
                <td className="px-4 py-4 text-center hidden sm:table-cell">
                    <span className="text-xs font-mono text-text-dim">
                        {diasRestantes > 0 ? `${diasRestantes}d restantes` : 'Expirado'}
                    </span>
                </td>
                <td className="px-4 py-4 text-center hidden lg:table-cell">
                    {rev.puntaje_total != null ? (
                        <span className={`text-sm font-semibold font-mono ${rev.puntaje_total >= 70 ? 'text-success' : 'text-error'}`}>
                            {rev.puntaje_total.toFixed(1)}
                        </span>
                    ) : (
                        <span className="text-text-dim/50 text-sm">—</span>
                    )}
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                    <div className={`badge-vercel ${cfg.badge}`}>
                        <span className={`dot ${cfg.dot}`} />
                        {cfg.label}
                    </div>
                </td>
                <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {rev.estado === 'Pendiente' && (
                            <>
                                <button
                                    onClick={() => setRevisionParaExtender(rev)}
                                    className="p-1.5 text-text-dim hover:text-brand transition-colors rounded-md hover:bg-brand/10"
                                    title="Extender fecha límite"
                                >
                                    <CalendarDays size={13} />
                                </button>
                                <button
                                    onClick={() => handleRevocar(rev)}
                                    className="p-1.5 text-text-dim hover:text-error transition-colors rounded-md hover:bg-error/10"
                                    title="Revocar asignación"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    const renderTable = (title: string, icon: React.ReactNode, list: PeerReviewDto[], isExternal: boolean) => {
        return (
            <div className="bento-card static overflow-hidden">
                <div className="bg-surface/30 border-b border-border-thin px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {icon}
                        <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${isExternal ? 'text-brand' : 'text-text-main'}`}>
                            {title}
                        </span>
                    </div>
                    <span className={`text-[10px] font-mono rounded-full px-2 py-0.5 font-bold ${isExternal ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-surface border border-border-thin text-text-dim'}`}>
                        {list.length}
                    </span>
                </div>

                {list.length === 0 ? (
                    <div className="px-5 py-8 text-center text-text-dim/60 text-xs font-mono">
                        No hay {isExternal ? 'evaluadores externos' : 'evaluadores internos'} asignados.
                    </div>
                ) : (
                    <div className="w-full overflow-hidden">
                        <table className="w-full sm:table-fixed">
                            <thead>
                                <tr className="border-b border-border-thin">
                                    <th className="text-left px-5 py-3.5 sm:w-[40%]"><span className="section-label !tracking-[0.12em]">Árbitro / Evaluador</span></th>
                                    <th className="text-left px-4 py-3.5 hidden md:table-cell md:w-[18%]"><span className="section-label !tracking-[0.12em]">Tipo</span></th>
                                    <th className="text-center px-4 py-3.5 hidden sm:table-cell sm:w-[15%]"><span className="section-label justify-center !tracking-[0.12em]">Plazo</span></th>
                                    <th className="text-center px-4 py-3.5 hidden lg:table-cell lg:w-[10%]"><span className="section-label justify-center !tracking-[0.12em]">Puntaje</span></th>
                                    <th className="text-left px-4 py-3.5 hidden sm:table-cell sm:w-[12%]"><span className="section-label !tracking-[0.12em]">Estado</span></th>
                                    <th className="px-4 py-3.5 sm:w-[5%] w-[80px]" />
                                </tr>
                            </thead>
                            <tbody>
                                {list.map(renderRevisionRow)}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">
            {/* Header */}
            <header className="mb-10 animate-fade-up relative z-10">
                <button
                    onClick={() => navigate('/arbitraje')}
                    className="flex items-center gap-1 text-text-dim hover:text-text-main text-[11px] font-semibold uppercase tracking-widest transition-colors mb-6"
                >
                    <ArrowLeft size={12} /> Volver al Panel de Arbitraje
                </button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="section-label mb-2">
                            <Gavel size={12} className="text-brand" />
                            <span>Arbitraje · {arbitraje.convocatoria ?? 'Sin convocatoria'}</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-snug mb-3 max-w-4xl">
                            {arbitraje.proyecto_titulo}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                            {arbitraje.codigo_institucional && (
                                <span className="text-[10px] font-mono bg-surface border border-border-thin rounded px-1.5 py-0.5 text-text-dim">
                                    {arbitraje.codigo_institucional}
                                </span>
                            )}
                            <div className={`badge-vercel ${estadoCfg.badge}`}>
                                <span className={`dot ${estadoCfg.dot}`} />
                                {estadoCfg.label}
                            </div>
                            <span className="text-[10px] bg-surface border border-border-thin rounded px-1.5 py-0.5 text-text-dim">
                                Estado: {arbitraje.estado_proyecto}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 md:mt-1">
                        {!arbitraje.arbitraje_cerrado && (
                            <button
                                onClick={() => setShowAsignar(true)}
                                className="btn-vercel-secondary flex items-center gap-2 shrink-0"
                            >
                                <PlusCircle size={14} />
                                Agregar Árbitro
                            </button>
                        )}
                        {arbitraje.arbitraje_cerrado ? (
                            <button
                                onClick={handleDescargarPdf}
                                disabled={descargandoPdf}
                                className="btn-vercel-primary flex items-center gap-2 shrink-0"
                            >
                                {descargandoPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                                Descargar Acta PDF
                            </button>
                        ) : (
                            <button
                                onClick={handleCerrar}
                                disabled={!puedesCerrar || cerrando}
                                className="btn-vercel-primary flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {cerrando ? <Loader2 size={14} className="animate-spin" /> : <Scale size={14} />}
                                Cerrar Arbitraje
                            </button>
                        )}
                        {arbitraje.estado_proyecto === 'Aprobado' && (
                            <button
                                onClick={handleIniciarEjecucion}
                                disabled={iniciandoEjecucion}
                                className="btn-vercel-secondary flex items-center gap-2 shrink-0 border-brand/40 text-brand hover:bg-brand/5"
                            >
                                {iniciandoEjecucion ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                                Iniciar Ejecución
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Aviso si hay desempate */}
            {arbitraje.estado_arbitraje === 'Desempate' && (
                <div className="bento-card static p-4 border-error/20 bg-error/5 flex items-start gap-3 animate-fade-up mb-6">
                    <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-text-main">Caso de Desempate Detectado</p>
                        <p className="text-[11px] text-text-dim mt-1">
                            Los árbitros presentan dictámenes contradictorios. Puede asignar un tercer árbitro para desempatar
                            o emitir una resolución fundada del Director de Investigación.
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs Bar */}
            <div className="tabs-vercel animate-fade-up [animation-delay:50ms] relative z-10">
                <div className="tab-vercel-item active">
                    Evaluadores Asignados
                    {!loading && (
                        <span className="text-[10px] font-mono bg-surface border border-border-thin rounded-full px-1.5 py-px text-text-dim ml-1.5">
                            {arbitraje.revisiones.length}
                        </span>
                    )}
                </div>
            </div>

            {/* Two-column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up [animation-delay:60ms] relative z-10">
                {/* Main Content Column */}
                <div className="lg:col-span-3 space-y-6">
                    {arbitraje.revisiones.length === 0 ? (
                        <div className="bento-card static overflow-hidden">
                            <div className="empty-state py-20">
                                <div className="icon-circle icon-circle-neutral !p-4 mb-4">
                                    <Gavel size={28} strokeWidth={1.5} />
                                </div>
                                <p className="text-text-main font-bold uppercase tracking-widest text-sm">Sin árbitros asignados</p>
                                <p className="text-text-dim text-xs mt-2 max-w-sm">Use el botón superior para agregar evaluadores.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {renderTable("Evaluadores Internos", <Users size={12} className="text-text-dim/80" />, internos, false)}
                            {renderTable("Evaluadores Externos", <Building size={12} className="text-brand/80" />, externos, true)}
                        </div>
                    )}

                    {/* Avisos de Cumplimiento CACES */}
                    {(arbitraje.total_arbitros < 2 || externos.length === 0) && (
                        <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 text-warning text-xs flex items-start gap-2.5 mt-4">
                            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="font-semibold text-text-main">Cumplimiento Normativo CACES (Indicador I5):</span>
                                {' '}
                                <span className="text-text-dim">
                                    {arbitraje.total_arbitros < 2 && "Se requiere un mínimo de 2 árbitros evaluadores por propuesta para cumplir con los estándares mínimos. "}
                                    {externos.length === 0 && "Es obligatorio contar con al menos 1 árbitro externo a la institución para la evaluación de proyectos."}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <VercelUsageCard
                        title="Resumen del Tribunal"
                        buttonLabel="Actualizar"
                        onButtonClick={loadData}
                        items={[
                            {
                                label: 'Total Árbitros',
                                value: arbitraje.total_arbitros,
                                displayValue: `${arbitraje.total_arbitros}`,
                                max: 5,
                                color: 'var(--brand)'
                            },
                            {
                                label: 'Completados',
                                value: arbitraje.arbitros_completados,
                                displayValue: `${arbitraje.arbitros_completados}`,
                                max: arbitraje.total_arbitros || 1,
                                color: '#22c55e'
                            },
                            {
                                label: 'Pendientes',
                                value: arbitraje.total_arbitros - arbitraje.arbitros_completados,
                                displayValue: `${arbitraje.total_arbitros - arbitraje.arbitros_completados}`,
                                max: arbitraje.total_arbitros || 1,
                                color: '#f0a500'
                            },
                            {
                                label: 'Promedio',
                                value: arbitraje.puntaje_promedio || 0,
                                displayValue: arbitraje.puntaje_promedio != null ? `${arbitraje.puntaje_promedio.toFixed(1)}/100` : '—',
                                max: 100,
                                color: arbitraje.puntaje_promedio && arbitraje.puntaje_promedio >= 70 ? '#22c55e' : '#ef4444'
                            }
                        ]}
                    />

                    {/* Progress bar */}
                    {arbitraje.total_arbitros > 0 && (
                        <div className="bento-card static p-5 relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="section-label">
                                    <CheckCircle2 size={12} className="text-brand" />
                                    <span className="text-[13px] font-semibold text-text-main">Progreso Evaluaciones</span>
                                </div>
                                <span className="font-mono text-[13px] font-semibold text-brand">
                                    {Math.round((arbitraje.arbitros_completados / arbitraje.total_arbitros) * 100)}%
                                </span>
                            </div>
                            <div className="w-full bg-border-thin h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-brand transition-all duration-700"
                                    style={{ width: `${(arbitraje.arbitros_completados / arbitraje.total_arbitros) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Configuración de Prórrogas Automáticas del Proyecto */}
                    <div className="bento-card static p-5 relative overflow-hidden bg-surface w-full space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border-thin">
                            <div className="section-label">
                                <Scale size={12} className="text-brand" />
                                <span className="text-[13px] font-semibold text-text-main uppercase tracking-tight">Prórrogas del Proyecto</span>
                            </div>
                            {savingSettings && <Loader2 size={12} className="animate-spin text-text-dim" />}
                        </div>

                        <div className="space-y-4">
                            {/* Toggle switch */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-text-main">Auto-extender plazos</p>
                                    <p className="text-[10px] text-text-dim mt-0.5 leading-relaxed">Amplía el plazo automáticamente al expirar.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={projectAutoExtendDeadlines}
                                        onChange={(e) => handleSaveProjectSettings(e.target.checked, projectAutoExtendDays)}
                                        disabled={savingSettings || arbitraje.arbitraje_cerrado}
                                    />
                                    <div className="w-9 h-5 bg-border-thin rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                                </label>
                            </div>

                            {/* Input number */}
                            <div className="space-y-2 pt-1">
                                <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest">
                                    Días de prórroga
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        min={1}
                                        max={30}
                                        className="w-16 bg-bg-deep border border-border-thin rounded-md px-2 py-1.5 text-xs text-text-main focus:outline-none focus:border-text-dim transition-colors font-mono"
                                        disabled={!projectAutoExtendDeadlines || savingSettings || arbitraje.arbitraje_cerrado}
                                        value={projectAutoExtendDays}
                                        onChange={(e) => setProjectAutoExtendDays(parseInt(e.target.value) || 7)}
                                    />
                                    {projectAutoExtendDeadlines && !arbitraje.arbitraje_cerrado && (
                                        <button
                                            onClick={() => handleSaveProjectSettings(projectAutoExtendDeadlines, projectAutoExtendDays)}
                                            className="btn-vercel-secondary !py-1.5 !px-3 !text-[11px] font-semibold"
                                            disabled={savingSettings}
                                        >
                                            Guardar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAsignar && (
                <AsignarArbitroModal
                    proyecto={arbitraje}
                    onClose={() => setShowAsignar(false)}
                    onSuccess={() => { setShowAsignar(false); loadData(); }}
                />
            )}
            {dictamen && (
                <DictamenModal
                    dictamen={dictamen}
                    onClose={() => setDictamen(null)}
                />
            )}
            {revisionParaExtender && (
                <ExtenderPlazoModal
                    review={revisionParaExtender}
                    onClose={() => setRevisionParaExtender(null)}
                    onSuccess={() => { setRevisionParaExtender(null); loadData(); }}
                />
            )}
        </main>
    );
};

// ─────────────────────────────────────────────────────────────
//  Sub-componente: Modal para extender el plazo del evaluador
// ─────────────────────────────────────────────────────────────
interface ExtenderPlazoModalProps {
    review: PeerReviewDto;
    onClose: () => void;
    onSuccess: () => void;
}

const ExtenderPlazoModal: React.FC<ExtenderPlazoModalProps> = ({ review, onClose, onSuccess }) => {
    const [nuevaFecha, setNuevaFecha] = useState(() => {
        const currentLimit = new Date(review.fecha_limite);
        currentLimit.setDate(currentLimit.getDate() + 7);
        return currentLimit.toISOString().slice(0, 10);
    });
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');

    const handleExtender = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        setError('');
        try {
            const datePayload = new Date(nuevaFecha + 'T23:59:59').toISOString();
            await extenderPlazo(review.uuid, datePayload);
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Error al extender el plazo de evaluación.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-card !max-w-md animate-fade-up">
                <div className="modal-header border-b border-border-thin pb-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={18} className="text-brand" />
                        <h3 className="text-base font-semibold tracking-tight text-text-main uppercase">
                            Extender Plazo de Evaluación
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-text-dim hover:text-text-main transition-colors"><X size={18} /></button>
                </div>

                <form onSubmit={handleExtender} className="modal-body space-y-4 pt-4">
                    {error && (
                        <div className="p-3 rounded-md bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
                            <AlertTriangle size={13} /> {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <p className="text-xs text-text-dim">Evaluador:</p>
                        <p className="text-sm font-semibold text-text-main">{formatNombre(review.revisor_nombre)}</p>
                        <p className="text-[10px] text-text-dim font-mono">{review.es_externo ? 'Par Externo (CACES)' : 'Docente Interno'}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs text-text-dim">Fecha límite actual:</p>
                        <p className="text-sm font-medium text-text-main">
                            {new Date(review.fecha_limite).toLocaleDateString('es-EC', {
                                day: '2-digit', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-1">
                            Nueva fecha límite *
                        </label>
                        <input
                            type="date"
                            required
                            min={new Date().toISOString().slice(0, 10)}
                            className="w-full bg-surface border border-border-thin rounded-md px-3 py-2 text-sm text-text-main focus:outline-none focus:border-text-dim transition-colors"
                            value={nuevaFecha}
                            onChange={(e) => setNuevaFecha(e.target.value)}
                        />
                    </div>

                    <div className="modal-footer border-t border-border-thin pt-3 flex justify-end gap-2 bg-transparent !p-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-vercel-secondary !py-1.5 !px-3"
                            disabled={enviando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-vercel flex items-center gap-2 !py-1.5 !px-4"
                            disabled={enviando}
                        >
                            {enviando ? <Loader2 size={13} className="animate-spin" /> : <CalendarDays size={13} />}
                            {enviando ? 'Guardando...' : 'Confirmar Extensión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const VercelUsageCard = ({ title, buttonLabel, onButtonClick, items }: any) => (
    <div className="bento-card static p-5 flex flex-col relative overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
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
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-md transition-all group"
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
                                <span className="text-xs font-medium text-text-main truncate">
                                    {item.label}
                                </span>
                                <svg
                                    className="w-3 h-3 text-text-dim/40 hover:text-text-main transition-colors shrink-0 cursor-help"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <title>{item.tooltip}</title>
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-xs font-mono font-medium text-text-main shrink-0 ml-2">
                            {item.displayValue || item.value}
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
);

export default ArbitrajeProyecto;
