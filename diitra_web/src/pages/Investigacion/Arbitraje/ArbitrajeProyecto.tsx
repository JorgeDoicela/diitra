import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Gavel, UserCheck, AlertTriangle,
    CheckCircle2, Clock, PlusCircle, Trash2, Award,
    Scale, Loader2, Users, Building, GraduationCap, FileDown,
    CalendarDays, X
} from 'lucide-react';
import {
    getArbitrajeByProject, cerrarArbitraje, revocarAsignacion, iniciarEjecucion,
    ESTADO_REVISION_CONFIG, ESTADO_ARBITRAJE_CONFIG, downloadDictamenPdf,
    extenderPlazo, updateProjectPeerReviewSettings
} from '../../../services/peerReviewService';
import type { ArbitrajeProyectoDto, PeerReviewDto, DictamenDto } from '../../../services/peerReviewService';
import AsignarArbitroModal from './AsignarArbitroModal';
import DictamenModal from './DictamenModal';
import { formatNombre, getAvatarStyle } from './arbitrajeUtils';
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
                autoExtendDeadlines: autoExtend,
                autoExtendDays: days
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
            // Clean title for standard safe filename
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

    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-up">
                <button
                    onClick={() => navigate('/arbitraje')}
                    className="flex items-center gap-1.5 text-text-dim hover:text-text-main text-xs font-semibold uppercase tracking-widest transition-colors mb-6"
                >
                    <ArrowLeft size={14} /> Volver al Panel de Arbitraje
                </button>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div>
                        <div className="section-label mb-2">
                            <Gavel size={12} />
                            <span>Arbitraje · {arbitraje.convocatoria ?? 'Sin convocatoria'}</span>
                        </div>
                        <h2 className="text-3xl font-semibold text-text-main tracking-tighter leading-tight mb-2 max-w-2xl">
                            {arbitraje.proyecto_titulo}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3">
                            {arbitraje.codigo_institucional && (
                                <span className="status-tag text-text-dim">{arbitraje.codigo_institucional}</span>
                            )}
                            <div className={`badge-vercel ${estadoCfg.badge}`}>
                                <span className={`dot ${estadoCfg.dot}`} />
                                {estadoCfg.label}
                            </div>
                            <span className="status-tag text-text-dim">Estado: {arbitraje.estado_proyecto}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 shrink-0">
                        {!arbitraje.arbitraje_cerrado && (
                            <button
                                onClick={() => setShowAsignar(true)}
                                className="btn-vercel-secondary flex items-center gap-2"
                            >
                                <PlusCircle size={14} />
                                Agregar Árbitro
                            </button>
                        )}
                        {arbitraje.arbitraje_cerrado ? (
                            <button
                                onClick={handleDescargarPdf}
                                disabled={descargandoPdf}
                                className="btn-brand flex items-center gap-2 transition-all duration-300"
                            >
                                {descargandoPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                                Descargar Acta PDF
                            </button>
                        ) : (
                            <button
                                onClick={handleCerrar}
                                disabled={!puedesCerrar || cerrando}
                                className="btn-vercel-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {cerrando ? <Loader2 size={14} className="animate-spin" /> : <Scale size={14} />}
                                Cerrar Arbitraje
                            </button>
                        )}
                        {arbitraje.estado_proyecto === 'Aprobado' && (
                            <button
                                onClick={handleIniciarEjecucion}
                                disabled={iniciandoEjecucion}
                                className="btn-vercel-secondary flex items-center gap-2 border-brand/40 text-brand"
                            >
                                {iniciandoEjecucion ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                                Iniciar Ejecución
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Two-column Vercel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up [animation-delay:50ms]">
                
                {/* Main Content: Left Column */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Aviso si hay desempate */}
                    {arbitraje.estado_arbitraje === 'Desempate' && (
                        <div className="bento-card static p-4 border-error/40 flex items-start gap-4 animate-fade-up">
                            <AlertTriangle size={20} className="text-error shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-text-main">Caso de Desempate Detectado</p>
                                <p className="text-xs text-text-dim mt-1">
                                    Los árbitros presentan dictámenes contradictorios. Puede asignar un árbitro dirimente adicional
                                    o emitir una resolución fundada del Director de Investigación.
                                </p>
                            </div>
                        </div>
                    )}

            {/* Lista de Árbitros */}
            <div className="animate-fade-up [animation-delay:100ms] space-y-4">
                <div className="section-label mb-2">
                    <UserCheck size={12} />
                    <span>Árbitros Asignados</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna 1: Árbitros Internos */}
                    <div className="p-5 bg-surface/40 rounded-xl border border-border-thin/50 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border-thin/50">
                            <span className="text-xs font-semibold text-text-main flex items-center gap-2">
                                <Users size={14} className="text-text-dim" /> Árbitros Internos
                            </span>
                            <span className="text-[10px] font-mono bg-bg-deep px-2 py-0.5 rounded-md border border-border-thin text-text-dim">
                                {internos.length}
                            </span>
                        </div>

                        {internos.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-border-thin rounded-xl bg-surface/20">
                                <p className="text-xs text-text-dim italic">Ningún árbitro interno asignado</p>
                                <button
                                    onClick={() => setShowAsignar(true)}
                                    className="mt-3 btn-vercel-secondary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5 font-medium transition-all"
                                >
                                    <PlusCircle size={13} /> Asignar Interno
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {internos.map((rev) => (
                                    <ArbitroCard
                                        key={rev.uuid}
                                        review={rev}
                                        onRevocar={() => handleRevocar(rev)}
                                        onExtender={() => setRevisionParaExtender(rev)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Columna 2: Árbitros Externos */}
                    <div className="p-5 bg-surface/40 rounded-xl border border-border-thin/50 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border-thin/50">
                            <span className="text-xs font-semibold text-text-main flex items-center gap-2">
                                <Building size={14} className="text-text-dim" /> Árbitros Externos (CACES)
                            </span>
                            <span className="text-[10px] font-mono bg-bg-deep px-2 py-0.5 rounded-md border border-border-thin text-text-dim">
                                {externos.length}
                            </span>
                        </div>

                        {externos.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-border-thin rounded-xl bg-surface/20 space-y-2">
                                <p className="text-xs text-text-dim italic">Ningún árbitro externo asignado</p>
                                {arbitraje.total_arbitros > 0 && (
                                    <p className="text-[10px] text-error font-semibold flex items-center justify-center gap-1">
                                        CACES exige al menos 1 árbitro externo
                                    </p>
                                )}
                                <button
                                    onClick={() => setShowAsignar(true)}
                                    className="mt-2 btn-vercel-secondary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5 font-medium transition-all"
                                >
                                    <PlusCircle size={13} /> Asignar Externo
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {externos.map((rev) => (
                                    <ArbitroCard
                                        key={rev.uuid}
                                        review={rev}
                                        onRevocar={() => handleRevocar(rev)}
                                        onExtender={() => setRevisionParaExtender(rev)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Avisos de Cumplimiento CACES */}
                {(arbitraje.total_arbitros < 2 || externos.length === 0) && (
                    <div className="p-4 rounded-xl border border-warning/30 bg-warning/5 flex items-start gap-3 animate-fade-in">
                        <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-text-main">Cumplimiento Normativo CACES (Indicador I5)</p>
                            <p className="text-[11px] text-text-dim">
                                {arbitraje.total_arbitros < 2 && "• Se recomienda un mínimo de 2 árbitros evaluadores por propuesta académica para un panel completo. "}
                                {externos.length === 0 && "• Es obligatorio contar con al menos 1 árbitro externo a la institución para la evaluación de proyectos."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>

            {/* Sidebar: Right Column */}
            <div className="space-y-6">
                <VercelUsageCard 
                    title="Resumen del Tribunal"
                    buttonLabel="Actualizar"
                    onButtonClick={loadData}
                    items={[
                        {
                            label: 'Total Árbitros',
                            value: arbitraje.total_arbitros,
                            displayValue: `${arbitraje.total_arbitros} asignados`,
                            max: 5,
                            color: 'var(--brand)'
                        },
                        {
                            label: 'Completados',
                            value: arbitraje.arbitros_completados,
                            displayValue: `${arbitraje.arbitros_completados} dictámenes`,
                            max: arbitraje.total_arbitros || 1,
                            color: '#22c55e'
                        },
                        {
                            label: 'Pendientes',
                            value: arbitraje.total_arbitros - arbitraje.arbitros_completados,
                            displayValue: `${arbitraje.total_arbitros - arbitraje.arbitros_completados} en espera`,
                            max: arbitraje.total_arbitros || 1,
                            color: '#f0a500'
                        },
                        {
                            label: 'Promedio /100',
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

                {/* ── Configuración de Prórrogas Automáticas del Proyecto ──── */}
                <div className="bento-card static p-5 relative overflow-hidden bg-surface w-full space-y-4 animate-fade-up">
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
//  Sub-componente: Tarjeta de un árbitro asignado
// ─────────────────────────────────────────────────────────────
const ArbitroCard: React.FC<{ review: PeerReviewDto; onRevocar: () => void; onExtender: () => void }> = ({ review, onRevocar, onExtender }) => {
    const cfg = ESTADO_REVISION_CONFIG[review.estado] ?? ESTADO_REVISION_CONFIG['Pendiente'];
    const diasRestantes = Math.ceil(
        (new Date(review.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const avStyle = getAvatarStyle(review.revisor_nombre);

    return (
        <div className="bento-card static p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-200">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avStyle.bg} border text-xs font-semibold flex items-center justify-center shrink-0`}>
                    {review.revisor_nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-text-main">{formatNombre(review.revisor_nombre)}</span>
                        {review.es_externo && (
                            <span className="badge-vercel badge-vercel-info text-[9px]">PAR EXTERNO</span>
                        )}
                        {review.es_doble_ciego && (
                            <span className="status-tag text-text-dim">Anónimo</span>
                        )}
                        <div className={`badge-vercel ${cfg.badge}`}>
                            <span className={`dot ${cfg.dot}`} />
                            {cfg.label}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-dim font-medium">
                        {!review.es_externo && review.revisor_carrera && (
                            <span className="flex items-center gap-1 bg-surface border border-border-thin px-1 py-0.5 rounded text-text-main font-semibold">
                                <GraduationCap size={10} /> {formatNombre(review.revisor_carrera)}
                            </span>
                        )}
                        {review.revisor_especialidad && (
                            <span className="flex items-center gap-1">
                                <Award size={10} /> {review.revisor_especialidad}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {diasRestantes > 0 ? `${diasRestantes}d restantes` : 'Fecha límite vencida'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {review.puntaje_total != null && (
                    <div className="text-center">
                        <p className={`text-xl font-semibold leading-none ${review.puntaje_total >= 70 ? 'text-success' : 'text-error'}`}>
                            {review.puntaje_total.toFixed(1)}
                        </p>
                        <p className="text-[9px] text-text-dim uppercase tracking-widest font-semibold">/100</p>
                    </div>
                )}
                {review.estado === 'Pendiente' && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onExtender}
                            className="p-2 text-text-dim hover:text-brand transition-colors rounded-md hover:bg-brand/10"
                            title="Extender fecha límite"
                        >
                            <CalendarDays size={14} />
                        </button>
                        <button
                            onClick={onRevocar}
                            className="p-2 text-text-dim hover:text-error transition-colors rounded-md hover:bg-error/10"
                            title="Revocar asignación"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
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
                    <button onClick={onClose} className="p-1 text-text-dim hover:text-text-main transition-colors">
                        <X size={18} />
                    </button>
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

export default ArbitrajeProyecto;
