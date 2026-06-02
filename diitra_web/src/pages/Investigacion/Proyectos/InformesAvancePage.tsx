import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, CheckCircle, AlertCircle, Clock, FileText,
    RefreshCw, ChevronDown, ChevronUp, X
} from 'lucide-react';
import api from '../../../api/axios_config';
import { useAuth } from '../../../api/AuthContext';
import {
    InformeAvanceDto,
    CreateInformeAvanceDto,
    getInformesByProyecto,
    createInforme,
    aprobarInforme,
    observarInforme,
    ESTADO_INFORME_CONFIG,
} from '../../../services/informesAvanceService';

// ─────────────────────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────────────────────

const InformesAvancePage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [informes, setInformes] = useState<InformeAvanceDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectTitle, setProjectTitle] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Modal: nuevo informe
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState<CreateInformeAvanceDto>({
        id_proyecto: Number(projectId),
        fecha_reporte: new Date().toISOString().slice(0, 10),
        resumen_actividades: '',
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Modal: observar
    const [observarTarget, setObservarTarget] = useState<InformeAvanceDto | null>(null);
    const [observacion, setObservacion] = useState('');
    const [actioning, setActioning] = useState<number | null>(null);

    const load = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const [data, projectRes] = await Promise.all([
                getInformesByProyecto(Number(projectId)),
                api.get(`/projects/${projectId}`).catch(() => null),
            ]);
            setInformes(data);
            if (projectRes?.data) {
                setProjectTitle(projectRes.data.titulo || projectRes.data.title || '');
            }
        } catch {
            setInformes([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { load(); }, [load]);

    // ── Crear informe ──────────────────────────────────────────
    const handleCreate = async () => {
        if (!formData.resumen_actividades.trim()) {
            setCreateError('El resumen de actividades es obligatorio.');
            return;
        }
        setCreating(true);
        setCreateError('');
        try {
            await createInforme(formData);
            setShowCreate(false);
            setFormData(f => ({ ...f, resumen_actividades: '', fecha_reporte: new Date().toISOString().slice(0, 10) }));
            await load();
        } catch (e: any) {
            setCreateError(e?.response?.data?.message ?? 'Error al crear el informe.');
        } finally {
            setCreating(false);
        }
    };

    // ── Aprobar ────────────────────────────────────────────────
    const handleAprobar = async (id: number) => {
        if (!window.confirm('¿Aprobar este informe de avance?')) return;
        setActioning(id);
        try {
            await aprobarInforme(id);
            await load();
        } finally {
            setActioning(null);
        }
    };

    // ── Observar ───────────────────────────────────────────────
    const handleObservar = async () => {
        if (!observarTarget || !observacion.trim()) return;
        setActioning(observarTarget.id_informe);
        try {
            await observarInforme(observarTarget.id_informe, observacion);
            setObservarTarget(null);
            setObservacion('');
            await load();
        } finally {
            setActioning(null);
        }
    };

    // ─────────────────────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────────────────────
    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">

            {/* Header */}
            <header className="mb-8 animate-fade-up">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-text-dim hover:text-text-main text-xs font-bold uppercase tracking-widest mb-4 transition-colors"
                >
                    <ArrowLeft size={13} />
                    Volver al Workspace
                </button>
                <div className="section-label mb-2">
                    <FileText size={12} className="text-text-main" />
                    <span>Informes de Avance · DIITRA CACES</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-text-main tracking-tighter uppercase leading-none mb-2">
                            Informes de Avance
                        </h2>
                        {projectTitle && (
                            <p className="text-sm text-text-dim font-medium">{projectTitle}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={load}
                            disabled={loading}
                            className="btn-vercel-secondary flex items-center gap-2"
                        >
                            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                            Actualizar
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="btn-vercel-primary flex items-center gap-2"
                        >
                            <Plus size={13} />
                            Nuevo Informe
                        </button>
                    </div>
                </div>
            </header>

            {/* Lista de informes */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin h-8 w-8 border-t-2 border-brand rounded-full" />
                </div>
            ) : informes.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-border-thin rounded-3xl">
                    <FileText size={32} className="mx-auto mb-4 text-text-dim opacity-40" />
                    <p className="text-sm font-bold text-text-dim uppercase tracking-widest">
                        No hay informes registrados
                    </p>
                    <p className="text-xs text-text-dim mt-1">
                        El Director de Proyecto puede crear el primer informe de avance.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {informes.map(inf => {
                        const cfg = ESTADO_INFORME_CONFIG[inf.estado] ?? ESTADO_INFORME_CONFIG['Pendiente'];
                        const isExpanded = expandedId === inf.id_informe;
                        return (
                            <div
                                key={inf.id_informe}
                                className="bg-surface border border-border-thin rounded-2xl overflow-hidden"
                            >
                                {/* Row */}
                                <div
                                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface/60 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : inf.id_informe)}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="shrink-0 w-9 h-9 bg-text-main/10 rounded-xl flex items-center justify-center font-mono text-sm font-black text-text-main">
                                            {String(inf.numero_informe).padStart(2, '0')}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-text-main truncate">
                                                Informe de Avance #{inf.numero_informe}
                                            </p>
                                            <p className="text-xs text-text-dim">
                                                Período: {new Date(inf.fecha_reporte).toLocaleDateString('es-EC', { year: 'numeric', month: 'long' })}
                                                {inf.validado_por_nombre && (
                                                    <span className="ml-2 text-text-dim/60">
                                                        · Validado por: {inf.validado_por_nombre}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {inf.es_firmado_digital && (
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest hidden sm:block">
                                                PAdES ✓
                                            </span>
                                        )}
                                        <div className={`badge-vercel ${cfg.badge} flex items-center gap-1.5`}>
                                            <span className={`dot ${cfg.dot}`} />
                                            {cfg.label}
                                        </div>
                                        {isExpanded ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />}
                                    </div>
                                </div>

                                {/* Expandido */}
                                {isExpanded && (
                                    <div className="border-t border-border-thin p-5 space-y-4 animate-fade-in">
                                        <div>
                                            <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">
                                                Resumen de Actividades
                                            </p>
                                            <p className="text-sm text-text-main whitespace-pre-wrap leading-relaxed">
                                                {inf.resumen_actividades}
                                            </p>
                                        </div>

                                        {inf.hash_firma && (
                                            <div>
                                                <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">
                                                    Hash de Integridad (SHA-256)
                                                </p>
                                                <code className="text-[10px] font-mono text-emerald-400 break-all">
                                                    {inf.hash_firma}
                                                </code>
                                            </div>
                                        )}

                                        {/* Acciones para el Director de Investigación */}
                                        {isAdmin && inf.estado === 'Pendiente' && (
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => handleAprobar(inf.id_informe)}
                                                    disabled={actioning === inf.id_informe}
                                                    className="btn-vercel-primary !py-1.5 !px-3 !text-xs flex items-center gap-1.5"
                                                >
                                                    <CheckCircle size={12} />
                                                    Aprobar
                                                </button>
                                                <button
                                                    onClick={() => { setObservarTarget(inf); setObservacion(''); }}
                                                    disabled={actioning === inf.id_informe}
                                                    className="btn-vercel-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1.5"
                                                >
                                                    <AlertCircle size={12} />
                                                    Observar
                                                </button>
                                            </div>
                                        )}

                                        {inf.estado === 'Observado' && (
                                            <div className="flex items-start gap-2 bg-error/5 border border-error/20 rounded-xl p-3">
                                                <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                                                <p className="text-xs text-text-dim leading-relaxed">
                                                    Este informe ha sido observado. Revisa el contenido, corrígelo y vuelve a enviarlo.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modal: Crear informe ──────────────────────────────── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-border-thin rounded-3xl w-full max-w-lg p-6 space-y-5 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                                Nuevo Informe de Avance
                            </h3>
                            <button onClick={() => setShowCreate(false)} className="text-text-dim hover:text-text-main">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">
                                    Período del Informe
                                </label>
                                <input
                                    type="date"
                                    value={formData.fecha_reporte}
                                    onChange={e => setFormData(f => ({ ...f, fecha_reporte: e.target.value }))}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main/40"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">
                                    Resumen de Actividades Realizadas
                                </label>
                                <textarea
                                    rows={5}
                                    placeholder="Describa las actividades completadas, avances y evidencias del período..."
                                    value={formData.resumen_actividades}
                                    onChange={e => setFormData(f => ({ ...f, resumen_actividades: e.target.value }))}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-sm text-text-main resize-none focus:outline-none focus:border-text-main/40"
                                />
                            </div>
                        </div>

                        {createError && (
                            <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-xl p-3">
                                <AlertCircle size={13} className="text-error shrink-0" />
                                <p className="text-xs text-error">{createError}</p>
                            </div>
                        )}

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="btn-vercel-secondary !py-2 !px-4 !text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="btn-vercel-primary !py-2 !px-4 !text-xs flex items-center gap-1.5"
                            >
                                {creating ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                                Registrar Informe
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Observar ───────────────────────────────────── */}
            {observarTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-border-thin rounded-3xl w-full max-w-md p-6 space-y-5 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                                Observar Informe #{observarTarget.numero_informe}
                            </h3>
                            <button onClick={() => setObservarTarget(null)} className="text-text-dim hover:text-text-main">
                                <X size={16} />
                            </button>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">
                                Motivo / Correcciones Solicitadas
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Indique qué correcciones debe realizar el Director de Proyecto..."
                                value={observacion}
                                onChange={e => setObservacion(e.target.value)}
                                className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-sm text-text-main resize-none focus:outline-none focus:border-text-main/40"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setObservarTarget(null)}
                                className="btn-vercel-secondary !py-2 !px-4 !text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleObservar}
                                disabled={actioning === observarTarget.id_informe || !observacion.trim()}
                                className="btn-vercel-primary !py-2 !px-4 !text-xs flex items-center gap-1.5"
                            >
                                {actioning === observarTarget.id_informe
                                    ? <RefreshCw size={12} className="animate-spin" />
                                    : <AlertCircle size={12} />}
                                Enviar Observación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default InformesAvancePage;
