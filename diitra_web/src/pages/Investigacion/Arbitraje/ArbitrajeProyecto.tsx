import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Gavel, AlertTriangle,
    Loader2, Users, Building, GraduationCap, FileDown,
    CalendarDays, X, Trash2, Scale,
    ExternalLink, RotateCw, UserPlus
} from 'lucide-react';
import {
    getArbitrajeByProject, cerrarArbitraje, revocarAsignacion, iniciarEjecucion,
    ESTADO_REVISION_CONFIG, ESTADO_ARBITRAJE_CONFIG, downloadDictamenPdf,
    extenderPlazo, updateProjectPeerReviewSettings
} from '../../../services/peerReviewService';
import type { ArbitrajeProyectoDto, PeerReviewDto, DictamenDto } from '../../../services/peerReviewService';
import AsignarArbitroModal from './AsignarArbitroModal';
import DictamenModal from './DictamenModal';
import ModalRevisorExterno from './ModalRevisorExterno';
import { formatNombre } from './arbitrajeUtils';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';
import { useWorkflowStates } from '../../../hooks/useWorkflowStates';

const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return null;
    const onlyDate = dateStr.split('T')[0];
    const parts = onlyDate.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month - 1, day);
        }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

const ArbitrajeProyecto: React.FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useNotifications();
    const confirm = useConfirm();
    const { getEstadoConfig } = useWorkflowStates();

    const fromWorkspace = (location.state as { fromWorkspace?: boolean })?.fromWorkspace;

    const handleBack = () => {
        if (fromWorkspace) {
            if (window.history.length > 2) {
                navigate(-1);
            } else if (projectUuid) {
                navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`);
            } else {
                navigate('/investigacion/mis-proyectos');
            }
        } else {
            navigate('/evaluacion-pares');
        }
    };

    const [arbitraje, setArbitraje] = useState<ArbitrajeProyectoDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [cerrando, setCerrando] = useState(false);
    const [iniciandoEjecucion, setIniciandoEjecucion] = useState(false);
    const [showAsignar, setShowAsignar] = useState(false);
    const [showCrearExterno, setShowCrearExterno] = useState(false);
    const [dictamen, setDictamen] = useState<DictamenDto | null>(null);
    const [revisionParaExtender, setRevisionParaExtender] = useState<PeerReviewDto | null>(null);
    const [projectAutoExtendDeadlines, setProjectAutoExtendDeadlines] = useState(false);
    const [projectAutoExtendDays, setProjectAutoExtendDays] = useState(7);
    const [savingSettings, setSavingSettings] = useState(false);

    const revisionesConPuntaje = arbitraje ? arbitraje.revisiones.filter(r => r.estado === 'Completada' && r.puntaje_total != null) : [];
    const promedioCalculado = revisionesConPuntaje.length > 0
        ? revisionesConPuntaje.reduce((sum, r) => sum + (r.puntaje_total ?? 0), 0) / revisionesConPuntaje.length
        : null;

    const fechaEstimadaProrroga = useMemo(() => {
        if (!arbitraje) return '';
        const pendingReviews = arbitraje.revisiones.filter(r => r.estado === 'Pendiente');
        let baseDate = new Date();
        if (pendingReviews.length > 0) {
            const timestamps = pendingReviews
                .map(r => new Date(r.fecha_limite).getTime())
                .filter(t => !isNaN(t));
            if (timestamps.length > 0) {
                baseDate = new Date(Math.max(...timestamps));
            }
        }
        const target = new Date(baseDate);
        target.setDate(target.getDate() + (projectAutoExtendDays || 7));
        return target.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }, [arbitraje, projectAutoExtendDays]);

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
            setArbitraje(prev => prev ? {
                ...prev,
                auto_extend_deadlines: autoExtend,
                auto_extend_days: days
            } : null);
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
            title: "Cerrar Evaluación",
            message: "¿Cerrar la evaluación por pares y emitir el dictamen final? Esta acción cambiará el estado del proyecto.",
            confirmText: "Cerrar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;

        setCerrando(true);
        try {
            const result = await cerrarArbitraje(projectUuid);
            setDictamen(result);
            loadData();
            addToast('Evaluación Cerrada', 'La evaluación por pares ha sido cerrada y el dictamen final emitido con éxito.', 'success');
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
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
            addToast('Asignación Revocada', 'La asignación del evaluador ha sido revocada con éxito.', 'success');
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
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
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
                <button onClick={handleBack} className="btn-vercel-secondary flex items-center gap-2 mb-6">
                    <ArrowLeft size={14} /> {fromWorkspace ? 'Volver al Proyecto' : 'Volver'}
                </button>
                <div className="empty-state py-20">
                    <p className="text-text-dim font-semibold">Proyecto no encontrado.</p>
                </div>
            </main>
        );
    }

    const estadoCfg = ESTADO_ARBITRAJE_CONFIG[arbitraje.estado_arbitraje] ?? ESTADO_ARBITRAJE_CONFIG['Pendiente'];
    const projectStatusCfg = getEstadoConfig(arbitraje.estado_proyecto);
    const externos = arbitraje.revisiones.filter(r => r.es_externo);

    const renderRevisionRow = (rev: PeerReviewDto) => {
        const cfg = ESTADO_REVISION_CONFIG[rev.estado] ?? ESTADO_REVISION_CONFIG['Pendiente'];
        const limite = parseLocalDate(rev.fecha_limite);
        const diasRestantes = limite
            ? Math.ceil((limite.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 0;
        return (
            <tr
                key={rev.uuid}
                className="group border-b border-border-thin/50 last:border-0 hover:bg-surface/40 transition-colors"
            >
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar temático diferenciado */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold border transition-colors ${rev.es_externo
                                ? 'bg-brand/10 border-brand/30 text-brand shadow-xs'
                                : 'bg-surface border-border-thin text-text-main shadow-2xs'
                            }`}>
                            {rev.revisor_nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                            {/* Nombre + Badge distintivo de tipo */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-text-main leading-snug truncate max-w-[200px] sm:max-w-[320px]">
                                    {formatNombre(rev.revisor_nombre)}
                                </p>
                                {rev.es_externo ? (
                                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                                        Par Externo (CACES)
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-text-dim font-medium">
                                        Docente Interno
                                    </span>
                                )}
                            </div>

                            {/* Subtexto: Carrera o Institución (sin etiquetas redundantes) */}
                            {((!rev.es_externo && rev.revisor_carrera && rev.revisor_carrera.toLowerCase() !== 'docente') || rev.institucion) && (
                                <p className="text-[11px] text-text-dim mt-0.5 truncate flex items-center gap-1.5 font-medium">
                                    {!rev.es_externo && rev.revisor_carrera && rev.revisor_carrera.toLowerCase() !== 'docente' && (
                                        <>
                                            <GraduationCap size={11} className="shrink-0 text-text-dim/80" />
                                            <span>{formatNombre(rev.revisor_carrera)}</span>
                                        </>
                                    )}
                                    {rev.institucion && (
                                        <>
                                            <Building size={11} className="shrink-0 text-text-dim/80" />
                                            <span>{rev.institucion}</span>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-4 py-4 text-center hidden sm:table-cell">
                    {rev.estado === 'Completada' ? (
                        <span className="text-xs font-mono text-text-dim/40">—</span>
                    ) : (
                        <span className={`text-xs font-mono ${diasRestantes <= 0 ? 'text-error font-semibold' : 'text-text-dim'}`}>
                            {diasRestantes > 0 ? `${diasRestantes}d restantes` : 'Expirado'}
                        </span>
                    )}
                </td>
                <td className="px-4 py-4 text-center hidden md:table-cell">
                    {rev.puntaje_total != null ? (
                        <span className={`text-sm font-semibold font-mono ${rev.puntaje_total >= 70 ? 'text-success/90' : 'text-error/90'}`}>
                            {rev.puntaje_total.toFixed(1)}
                        </span>
                    ) : (
                        <span className="text-text-dim/50 text-sm">—</span>
                    )}
                </td>
                <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-text-main">
                        <span className={`dot ${cfg.dot}`} />
                        <span>{cfg.label}</span>
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

    return (
        <main className="flex-1 bg-bg-deep p-6 lg:p-8 overflow-y-auto">
            {/* Breadcrumb Hierarchy */}
            <div className="flex items-center gap-2 mb-4 text-xs select-none animate-fade-in">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-text-dim hover:text-text-main transition-colors group cursor-pointer font-medium"
                >
                    <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>{fromWorkspace ? 'Volver al Proyecto' : 'Evaluación por Pares'}</span>
                </button>
                {arbitraje.codigo_institucional && (
                    <>
                        <span className="text-text-dim/30">/</span>
                        <span className="font-mono text-text-dim font-medium">{arbitraje.codigo_institucional}</span>
                    </>
                )}
            </div>

            {/* Header del Proyecto */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 mb-6 border-b border-border-thin animate-fade-in">
                <div className="space-y-2.5 max-w-3xl">
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text-main leading-snug">
                        {arbitraje.proyecto_titulo}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-text-dim">
                        {arbitraje.codigo_institucional && (
                            <button
                                onClick={() => navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`)}
                                className="inline-flex items-center gap-1.5 font-mono bg-surface hover:bg-surface-hover border border-border-thin hover:border-border-hover rounded px-2 py-0.5 text-text-dim hover:text-text-main transition-colors cursor-pointer group"
                                title="Ver ficha del proyecto en el Workspace"
                            >
                                <span>{arbitraje.codigo_institucional}</span>
                                <ExternalLink size={10} className="text-text-dim/60 group-hover:text-text-main transition-colors" />
                            </button>
                        )}

                        {/* Estado General del Proyecto */}
                        <div className="flex items-center gap-1.5">
                            <span>Proyecto:</span>
                            <span className="font-medium" style={{ color: projectStatusCfg.style?.color }}>
                                {projectStatusCfg.label}
                            </span>
                        </div>

                        <span className="text-border-thin select-none">|</span>

                        {/* Fase de Arbitraje */}
                        <div className="flex items-center gap-1.5 font-medium text-text-main">
                            <span className={`dot ${estadoCfg.dot}`} />
                            <span>Arbitraje: {estadoCfg.label}</span>
                        </div>

                        {/* Convocatoria */}
                        {arbitraje.convocatoria && (
                            <>
                                <span className="text-border-thin select-none">|</span>
                                <span className="text-text-dim max-w-sm truncate" title={arbitraje.convocatoria}>
                                    {arbitraje.convocatoria}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Acciones Principales con Jerarquía Vercel Geist */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!arbitraje.arbitraje_cerrado && (
                        <button
                            onClick={() => setShowAsignar(true)}
                            className="btn-vercel-secondary flex items-center gap-2 shrink-0"
                        >
                            <UserPlus size={14} />
                            <span>Asignar Evaluador</span>
                        </button>
                    )}
                    {arbitraje.arbitraje_cerrado ? (
                        <button
                            onClick={handleDescargarPdf}
                            disabled={descargandoPdf}
                            className="btn-vercel-primary flex items-center gap-2 shrink-0"
                        >
                            {descargandoPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                            <span>Descargar Acta PDF</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleCerrar}
                            disabled={!puedesCerrar || cerrando}
                            className="btn-vercel-primary flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {cerrando ? <Loader2 size={14} className="animate-spin" /> : <Scale size={14} />}
                            <span>Cerrar Evaluación</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Aviso si hay desempate */}
            {arbitraje.estado_arbitraje === 'Desempate' && (
                <div className="bento-card static p-4 border-error/20 bg-error/5 flex items-start gap-3 animate-fade-up mb-6">
                    <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-text-main">Caso de Desempate Detectado</p>
                        <p className="text-[11px] text-text-dim mt-1">
                            Los evaluadores presentan dictámenes contradictorios. Puede asignar un tercer evaluador para desempatar
                            o emitir una resolución fundada del Director de Investigación.
                        </p>
                    </div>
                </div>
            )}

            {/* Two-column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-up relative z-10">
                {/* Main Content Column: Tabla Unificada del Tribunal */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bento-card static overflow-hidden">
                        <div className="bg-surface/40 border-b border-border-thin px-5 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-text-dim" />
                                <span className="text-xs font-semibold text-text-main">
                                    Tribunal de Evaluación por Pares
                                </span>
                            </div>
                        </div>

                        {arbitraje.revisiones.length === 0 ? (
                            <div className="empty-state py-16">
                                <div className="icon-circle icon-circle-neutral !p-4 mb-3">
                                    <Gavel size={24} strokeWidth={1.5} />
                                </div>
                                <p className="text-text-main font-semibold text-sm">Sin evaluadores asignados</p>
                                <p className="text-text-dim text-xs mt-1 max-w-sm">Use el botón superior para asignar evaluadores a este proyecto.</p>
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border-thin bg-surface/20">
                                            <th className="text-left px-5 py-3"><span className="section-label">Evaluador</span></th>
                                            <th className="text-center px-4 py-3 hidden sm:table-cell"><span className="section-label justify-center">Plazo</span></th>
                                            <th className="text-center px-4 py-3 hidden md:table-cell"><span className="section-label justify-center">Puntaje</span></th>
                                            <th className="text-left px-4 py-3"><span className="section-label">Estado</span></th>
                                            <th className="px-4 py-3 w-[60px]" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {arbitraje.revisiones.map(renderRevisionRow)}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Avisos de Cumplimiento CACES */}
                    {(arbitraje.total_arbitros < 2 || externos.length === 0) && (
                        <p className="text-[11.5px] text-amber-600/90 dark:text-amber-400/90 pt-2 leading-relaxed">
                            <span className="font-medium text-amber-600 dark:text-amber-400">Cumplimiento CACES (Indicador I5):</span>
                            {' '}
                            <span className="text-amber-700/80 dark:text-amber-300/80 font-normal">
                                {arbitraje.total_arbitros < 2 && "Se requiere un mínimo de 2 evaluadores por propuesta para cumplir con los estándares mínimos. "}
                                {externos.length === 0 && "Es obligatorio contar con al menos 1 evaluador externo a la institución para la evaluación de proyectos."}
                            </span>
                        </p>
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
                                label: 'Total Evaluadores',
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
                                value: promedioCalculado || 0,
                                displayValue: promedioCalculado != null ? `${promedioCalculado.toFixed(1)}/100` : '—',
                                max: 100,
                                color: promedioCalculado && promedioCalculado >= 70 ? '#22c55e' : '#ef4444'
                            }
                        ]}
                    />

                    {/* Configuración de Prórrogas Automáticas del Proyecto */}
                    <div className="bento-card static p-5 relative overflow-hidden bg-surface w-full space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border-thin">
                            <div className="section-label">
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

                            {/* Input number con fecha inline minimalista */}
                            <div className="space-y-1.5 pt-1">
                                <label className="block text-[10px] font-semibold text-text-dim uppercase tracking-widest">
                                    Días de prórroga
                                </label>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={30}
                                        className="w-16 bg-bg-deep border border-border-thin rounded-md px-2 py-1 text-xs text-text-main focus:outline-none focus:border-text-dim transition-colors font-mono"
                                        disabled={!projectAutoExtendDeadlines || savingSettings || arbitraje.arbitraje_cerrado}
                                        value={projectAutoExtendDays}
                                        onChange={(e) => setProjectAutoExtendDays(parseInt(e.target.value) || 7)}
                                    />
                                    {fechaEstimadaProrroga && (
                                        <span className="text-xs text-text-dim font-medium">
                                            Hasta: <span className="text-text-main font-mono">{fechaEstimadaProrroga}</span>
                                        </span>
                                    )}
                                    {projectAutoExtendDays !== (arbitraje.auto_extend_days ?? 7) && !arbitraje.arbitraje_cerrado && (
                                        <button
                                            onClick={() => handleSaveProjectSettings(projectAutoExtendDeadlines, projectAutoExtendDays)}
                                            className="btn-vercel-primary !py-1 !px-2.5 !text-[11px] ml-auto font-medium"
                                            disabled={savingSettings}
                                        >
                                            {savingSettings ? 'Guardando...' : 'Guardar'}
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
            {showCrearExterno && (
                <ModalRevisorExterno
                    onClose={() => setShowCrearExterno(false)}
                    onSuccess={() => { setShowCrearExterno(false); loadData(); }}
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
                            {(() => {
                                const d = parseLocalDate(review.fecha_limite);
                                return d ? d.toLocaleDateString('es-EC', {
                                    day: '2-digit', month: 'long', year: 'numeric'
                                }) : '—';
                            })()}
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
                    className="p-1.5 text-text-dim hover:text-text-main hover:bg-surface border border-transparent hover:border-border-thin rounded-md transition-all cursor-pointer"
                    title={buttonLabel}
                >
                    <RotateCw size={13} className="hover:rotate-180 transition-transform duration-500" />
                </button>
            )}
        </div>
        <div className="space-y-1">
            {items.map((item: any, idx: number) => {
                return (
                    <div
                        key={idx}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-md transition-all group"
                        style={{ backgroundColor: idx % 2 === 0 ? 'var(--accents-1)' : 'transparent' }}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: item.color || 'var(--brand)' }}
                            />
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-medium text-text-main truncate">
                                    {item.label}
                                </span>
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
