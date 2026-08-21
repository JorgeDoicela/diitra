import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { PageHeader } from '../../../components/Common/PageHeader';
import {
    ArrowLeft, Plus, CheckCircle, AlertCircle, FileText,
    RefreshCw, ChevronDown, ChevronUp, X, FileSignature, Activity,
    Upload, Shield, ExternalLink
} from 'lucide-react';
import api from '../../../api/axios_config';
import { useAuth } from '../../../api/AuthContext';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';
import type {
    InformeAvanceDto,
    CreateInformeAvanceDto,
} from '../../../services/informesAvanceService';
import {
    getInformesByProyecto,
    createInforme,
    aprobarInforme,
    observarInforme,
    firmarInforme,
    ESTADO_INFORME_CONFIG,
} from '../../../services/informesAvanceService';

// ── DocumentEditor (Builder Core con 4 secciones CACES) ──────────────────────
import DocumentEditor from './Wizard/DocumentEditor';

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

const InformesAvancePage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { addToast } = useNotifications();
    const confirm = useConfirm();
    const canReview = isAdmin;

    const [informes, setInformes] = useState<InformeAvanceDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectNotFound, setProjectNotFound] = useState(false);
    const [projectTitle, setProjectTitle] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // ── Estado del DocumentEditor (Builder Core CACES de la URL) ──
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const editorInstanceUuid = queryParams.get('edit');
    const activeInformeIdParam = queryParams.get('informeId');
    const activeInformeId = activeInformeIdParam ? Number(activeInformeIdParam) : null;
    const activeInformeUuid = queryParams.get('informeUuid');
    const [openingEditor, setOpeningEditor] = useState(false);

    // Contexto de rutas dinámico
    const isResearcherRoute = location.pathname.includes('/mis-proyectos');
    const urlPrefix = isResearcherRoute || !isAdmin ? '/investigacion/mis-proyectos' : '/investigacion';

    // Modal: nuevo informe
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState<CreateInformeAvanceDto>({
        id_proyecto: 0,  // el backend lo resolverá desde project_uuid
        project_uuid: projectId ?? '',
        fecha_reporte: new Date().toISOString().slice(0, 10),
        resumen_actividades: '',
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Modal: observar
    const [observarTarget, setObservarTarget] = useState<InformeAvanceDto | null>(null);
    const [observacion, setObservacion] = useState('');
    const [actioning, setActioning] = useState<number | null>(null);
    const [firmarTarget, setFirmarTarget] = useState<InformeAvanceDto | null>(null);
    const [certFile, setCertFile] = useState<File | null>(null);
    const [certPassword, setCertPassword] = useState('');
    const [firmarError, setFirmarError] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        setProjectNotFound(false);
        try {
            const [data, projectRes] = await Promise.all([
                getInformesByProyecto(projectId ?? ''),
                api.get(`/projects/${projectId}/detail`).catch(() => null),
            ]);
            setInformes(data);
            if (projectRes?.data) {
                setProjectTitle(projectRes.data.titulo || projectRes.data.title || '');
            }
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } })?.response?.status;
            if (status === 404) {
                setProjectNotFound(true);
            }
            setInformes([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        load();
    }, [load, editorInstanceUuid]);

    // ── Abrir Builder Core (CACES) para un informe específico ─────
    const openBuilderForInforme = async (informe: InformeAvanceDto) => {
        if (!projectId) return;
        setOpeningEditor(true);
        try {
            // Resolvemos/creamos la instancia de documento para este informe
            const res = await api.get('/documents/instances/resolve', {
                params: {
                    templateCode: 'INFORME_AVANCE',
                    // Vinculamos por UUID del informe para que cada informe tenga su propio documento
                    entityUuid: informe.uuid,
                    entityType: 'InformeAvance',
                    title: `Informe de Avance #${informe.numero_informe} — ${projectTitle || 'Proyecto'}`,
                },
            });
            const instanceUuid = res.data?.uuid || res.data?.Uuid;
            if (instanceUuid) {
                const searchParams = new URLSearchParams(location.search);
                searchParams.set('edit', instanceUuid);
                searchParams.set('informeId', String(informe.id_informe));
                searchParams.set('informeUuid', informe.uuid);
                navigate({ search: searchParams.toString() }, { replace: true });
            } else {
                addToast('Error de Editor', 'No se pudo abrir el editor del informe.', 'error');
            }
        } catch {
            addToast('Error de Editor CACES', 'No se pudo abrir el editor CACES (hitos, evidencias y presupuesto).', 'error');
        } finally {
            setOpeningEditor(false);
        }
    };

    // ── Crear nuevo informe + abrir Builder inmediatamente ────────
    const handleCreate = async () => {
        if (!formData.resumen_actividades.trim()) {
            setCreateError('El resumen de actividades es obligatorio.');
            return;
        }
        setCreating(true);
        setCreateError('');
        try {
            const nuevoInforme: InformeAvanceDto = await createInforme(formData);
            setShowCreate(false);
            setFormData(f => ({ ...f, resumen_actividades: '', fecha_reporte: new Date().toISOString().slice(0, 10) }));
            await load();
            // Abrir automáticamente el Builder Core para el informe recién creado
            // nuevoInforme viene con id_informe y numero_informe desde el backend
            if (nuevoInforme?.id_informe) {
                await openBuilderForInforme(nuevoInforme);
            }
        } catch (e: any) {
            setCreateError(e?.response?.data?.message ?? 'Error al crear el informe.');
        } finally {
            setCreating(false);
        }
    };

    // ── Aprobar ───────────────────────────────────────────────────
    const handleAprobar = async (id: number) => {
        if (!await confirm({
            title: "Aprobar Informe",
            message: "¿Aprobar este informe de avance?",
            confirmText: "Aprobar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;
        setActioning(id);
        try {
            await aprobarInforme(id);
            await load();
        } finally {
            setActioning(null);
        }
    };

    // ── Firma PAdES ───────────────────────────────────────────────
    const handleFirmar = async () => {
        if (!firmarTarget || !certFile || !certPassword.trim()) {
            setFirmarError('Seleccione el certificado .p12/.pfx e ingrese su contraseña.');
            return;
        }
        setFirmarError('');
        setActioning(firmarTarget.id_informe);
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1] ?? '');
                };
                reader.onerror = reject;
                reader.readAsDataURL(certFile);
            });
            await firmarInforme(firmarTarget.id_informe, base64, certPassword);
            setFirmarTarget(null);
            setCertFile(null);
            setCertPassword('');
            await load();
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setFirmarError(msg ?? 'No se pudo aplicar la firma digital.');
        } finally {
            setActioning(null);
        }
    };

    // ── Observar ──────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────
    //  Si hay un editor abierto → renderizar el Builder Core CACES
    // ─────────────────────────────────────────────────────────────────
    if (editorInstanceUuid) {
        const informe = informes.find(i => i.id_informe === activeInformeId);
        const isReadOnly = informe?.estado === 'Aprobado';

        return (
            <DocumentEditor
                templateCode="INFORME_AVANCE"
                initialData={{ Uuid: editorInstanceUuid }}
                entityUuid={projectId || activeInformeUuid || ''}
                onClose={() => {
                    const searchParams = new URLSearchParams(location.search);
                    searchParams.delete('edit');
                    searchParams.delete('informeId');
                    searchParams.delete('informeUuid');
                    navigate({ search: searchParams.toString() }, { replace: true });
                }}
                readOnly={isReadOnly}
                readOnlyReason="state"
                projectStatus="En Ejecución"
            />
        );
    }

    // ─────────────────────────────────────────────────────────────────
    //  Render: lista de informes
    // ─────────────────────────────────────────────────────────────────
    return (
        <main className="flex-1 bg-bg-deep p-8 lg:p-10 overflow-y-auto">

            {/* Header */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-text-dim hover:text-text-main text-xs font-bold uppercase tracking-widest mb-4 transition-colors"
            >
                <ArrowLeft size={13} />
                Volver al proyecto
            </button>
            <PageHeader
                    kicker="Informes de Avance · DIITRA CACES"
                    icon={FileText}
                    title="Informes de Avance"
                    description={
                        <span className="flex flex-col gap-1">
                            {projectTitle && (
                                <strong className="text-text-main font-semibold text-xs block">{projectTitle}</strong>
                            )}
                            <span>
                                Cada informe contiene bitácora científica, avance de actividades del cronograma, evidencias físicas y ejecución presupuestaria — conforme al modelo CACES.
                            </span>
                        </span>
                    }
                >
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link
                            to={`${urlPrefix}/monitoreo/${projectId}`}
                            className="btn-vercel-secondary flex items-center gap-2 no-underline"
                        >
                            <Activity size={13} />
                            Monitoreo Gantt
                        </Link>
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
                </PageHeader>

            {/* Guía CACES */}
            <div className="mb-6 p-4 rounded-2xl bg-surface border border-border-thin flex flex-col sm:flex-row items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                    <Shield size={14} className="text-brand" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-text-main uppercase tracking-widest mb-1">Flujo de Acreditación CACES</p>
                    <p className="text-[11px] text-text-dim leading-relaxed">
                        Haz clic en <span className="font-bold text-text-main">«Completar informe»</span> para llenar las 4 secciones requeridas:
                        <span className="text-brand font-bold"> Bitácora Científica</span> ·
                        <span className="text-blue-400 font-bold"> Actividades del Cronograma</span> ·
                        <span className="text-emerald-400 font-bold"> Evidencias Físicas</span> ·
                        <span className="text-yellow-400 font-bold"> Ejecución Presupuestaria</span>
                    </p>
                </div>
            </div>

            {/* Lista de informes */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin h-8 w-8 border-t-2 border-brand rounded-full" />
                </div>
            ) : projectNotFound ? (
                <div className="text-center py-20 border border-dashed border-amber-500/30 rounded-3xl bg-amber-500/5">
                    <AlertCircle size={32} className="mx-auto mb-4 text-amber-400" />
                    <p className="text-sm font-bold text-text-main uppercase tracking-widest">
                        Proyecto no encontrado
                    </p>
                    <p className="text-xs text-text-dim mt-2 max-w-md mx-auto">
                        El identificador <span className="font-mono text-text-main">{projectId}</span> no coincide con ningún proyecto.
                        Abre esta página desde el espacio de trabajo del proyecto.
                    </p>
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
                        const isLoadingThisEditor = openingEditor && activeInformeId === inf.id_informe;

                        return (
                            <div
                                key={inf.id_informe}
                                className="bg-surface border border-border-thin rounded-2xl overflow-hidden"
                            >
                                {/* Row principal */}
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
                                                Período: {(() => {
                                                    const d = parseLocalDate(inf.fecha_reporte);
                                                    return d ? d.toLocaleDateString('es-EC', { year: 'numeric', month: 'long' }) : '—';
                                                })()}
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
                                                Firmado
                                            </span>
                                        )}
                                        <div className={`badge-vercel ${cfg.badge} flex items-center gap-1.5`}>
                                            <span className={`dot ${cfg.dot}`} />
                                            {cfg.label}
                                        </div>
                                        {isExpanded ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />}
                                    </div>
                                </div>

                                {/* Panel expandido */}
                                {isExpanded && (
                                    <div className="border-t border-border-thin p-5 space-y-4 animate-fade-in">

                                        {/* Resumen rápido */}
                                        <div>
                                            <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">
                                                Resumen de Actividades (Registro inicial)
                                            </p>
                                            <p className="text-sm text-text-main whitespace-pre-wrap leading-relaxed">
                                                {inf.resumen_actividades}
                                            </p>
                                        </div>

                                        {/* Evidencias adjuntas */}
                                        {inf.evidencias && inf.evidencias.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2">
                                                    Evidencias adjuntas ({inf.evidencias.length})
                                                </p>
                                                <ul className="space-y-2">
                                                    {inf.evidencias.map(ev => (
                                                        <li
                                                            key={ev.id_evidencia}
                                                            className="flex items-start justify-between gap-3 p-3 rounded-xl bg-bg-deep border border-border-thin text-xs"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-text-main truncate">
                                                                    {ev.descripcion || ev.tipo_evidencia || 'Evidencia'}
                                                                </p>
                                                                <p className="text-text-dim font-mono truncate mt-0.5">
                                                                    {ev.ruta_archivo}
                                                                </p>
                                                            </div>
                                                            {ev.ruta_archivo?.startsWith('http') && (
                                                                <a
                                                                    href={ev.ruta_archivo}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="shrink-0 text-brand hover:underline flex items-center gap-1"
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    <ExternalLink size={12} />
                                                                    Ver
                                                                </a>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Hash de firma */}
                                        {inf.hash_firma && (
                                            <div>
                                                <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">
                                                    Código de verificación
                                                </p>
                                                <code className="text-[10px] font-mono text-emerald-400 break-all">
                                                    {inf.hash_firma}
                                                </code>
                                                {inf.fecha_firma && (
                                                    <p className="text-[10px] text-text-dim mt-1">
                                                        Firmado: {new Date(inf.fecha_firma).toLocaleString('es-EC')}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Botones de acción ── */}
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-thin">

                                            {/* ★ BOTÓN PRINCIPAL: Abrir Builder CACES con las 4 secciones */}
                                            <button
                                                onClick={e => { e.stopPropagation(); openBuilderForInforme(inf); }}
                                                disabled={isLoadingThisEditor}
                                                className="btn-vercel-primary !py-2 !px-4 !text-xs flex items-center gap-1.5"
                                            >
                                                {isLoadingThisEditor
                                                    ? <RefreshCw size={12} className="animate-spin" />
                                                    : <Activity size={12} />}
                                                {inf.estado === 'Aprobado' ? 'Ver Informe Completo' : 'Completar informe'}
                                            </button>

                                            {/* Director de Investigación: validar */}
                                            {canReview && inf.estado !== 'Aprobado' && (
                                                <>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleAprobar(inf.id_informe); }}
                                                        disabled={actioning === inf.id_informe}
                                                        className="btn-vercel-secondary !py-2 !px-3 !text-xs flex items-center gap-1.5"
                                                    >
                                                        <CheckCircle size={12} />
                                                        Aprobar
                                                    </button>
                                                    {inf.estado === 'Pendiente' && (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setObservarTarget(inf); setObservacion(''); }}
                                                            disabled={actioning === inf.id_informe}
                                                            className="btn-vercel-secondary !py-2 !px-3 !text-xs flex items-center gap-1.5"
                                                        >
                                                            <AlertCircle size={12} />
                                                            Observar
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {/* Firma PAdES tras aprobación */}
                                            {inf.estado === 'Aprobado' && !inf.es_firmado_digital && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); setFirmarTarget(inf); setFirmarError(''); }}
                                                    disabled={actioning === inf.id_informe}
                                                    className="btn-vercel-secondary !py-2 !px-3 !text-xs flex items-center gap-1.5"
                                                >
                                                    <FileSignature size={12} />
                                                    Firmar digitalmente
                                                </button>
                                            )}

                                            {inf.es_firmado_digital && (
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest px-2 py-1.5">
                                                    <Shield size={12} />
                                                    Firma digital aplicada
                                                </span>
                                            )}
                                        </div>

                                        {inf.estado === 'Observado' && (
                                            <div className="flex items-start gap-2 bg-error/5 border border-error/20 rounded-xl p-3">
                                                <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                                                <p className="text-xs text-text-dim leading-relaxed">
                                                    Este informe ha sido observado. Revisa el contenido, corrígelo en el editor y vuelve a enviarlo.
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

            {/* ── Drawer: Crear informe ─────────────────────────────────── */}
            {showCreate && (
                <div className="fixed inset-0 z-[100] flex justify-end select-none">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300" 
                        onClick={() => setShowCreate(false)}
                    />
                    <div className="relative flex h-full w-full max-w-lg bg-surface border-l border-border-thin shadow-2xl flex-col z-10 animate-fade-in-right overflow-hidden font-sans">
                        {/* Header */}
                        <div className="border-b border-border-thin flex justify-between items-start p-5 sm:p-6 shrink-0 bg-surface">
                            <div className="flex flex-col gap-1 min-w-0 pr-4">
                                <h3 className="text-base sm:text-lg font-bold tracking-tight text-text-main font-sans truncate">
                                    Nuevo Informe de Avance
                                </h3>
                                <p className="section-label text-text-dim">
                                    Registro inicial · DIITRA CACES
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="p-1.5 hover:bg-surface-hover rounded-xl text-text-dim hover:text-text-main transition-all cursor-pointer shrink-0"
                                title="Cerrar panel"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
                            <div className="p-4 bg-surface border border-border-thin rounded-2xl">
                                <p className="text-xs text-text-dim leading-relaxed">
                                    Registra el período y un resumen inicial de ejecución. Posteriormente podrás completar la bitácora científica, cronograma, evidencias y presupuesto detallado dentro del editor CACES.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="section-label text-text-dim block">
                                        Período del Informe
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.fecha_reporte}
                                        onChange={e => setFormData(f => ({ ...f, fecha_reporte: e.target.value }))}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main/40 font-sans"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="section-label text-text-dim block">
                                        Resumen Inicial de Actividades
                                    </label>
                                    <textarea
                                        rows={5}
                                        placeholder="Describa brevemente el período. Podrá ampliar con bitácora, cronograma, evidencias y presupuesto en el editor del informe..."
                                        value={formData.resumen_actividades}
                                        onChange={e => setFormData(f => ({ ...f, resumen_actividades: e.target.value }))}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-sm text-text-main resize-none focus:outline-none focus:border-text-main/40 font-sans"
                                    />
                                </div>
                            </div>

                            {createError && (
                                <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-xl p-3">
                                    <AlertCircle size={14} className="text-error shrink-0" />
                                    <p className="text-xs text-error">{createError}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-5 border-t border-border-thin bg-surface shrink-0 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="py-2 px-4 btn-vercel-secondary text-xs font-semibold rounded-xl transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={creating}
                                className="py-2 px-5 btn-vercel-primary text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {creating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                                <span>Crear y abrir editor</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Drawer: Firmar digitalmente ─────────────────────────── */}
            {firmarTarget && (
                <div className="fixed inset-0 z-[100] flex justify-end select-none">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300" 
                        onClick={() => setFirmarTarget(null)}
                    />
                    <div className="relative flex h-full w-full max-w-lg bg-surface border-l border-border-thin shadow-2xl flex-col z-10 animate-fade-in-right overflow-hidden font-sans">
                        {/* Header */}
                        <div className="border-b border-border-thin flex justify-between items-start p-5 sm:p-6 shrink-0 bg-surface">
                            <div className="flex flex-col gap-1 min-w-0 pr-4">
                                <h3 className="text-base sm:text-lg font-bold tracking-tight text-text-main font-sans truncate">
                                    Firma Digital · Informe #{firmarTarget.numero_informe}
                                </h3>
                                <p className="section-label text-text-dim">
                                    Certificación CACES PAdES
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFirmarTarget(null)}
                                className="p-1.5 hover:bg-surface-hover rounded-xl text-text-dim hover:text-text-main transition-all cursor-pointer shrink-0"
                                title="Cerrar panel"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
                            <div className="p-4 bg-surface border border-border-thin rounded-2xl">
                                <p className="text-xs text-text-dim leading-relaxed">
                                    Cargue su certificado digital (.p12 o .pfx) para sellar formalmente el informe de avance aprobado con trazabilidad inmutable.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="section-label text-text-dim block">
                                        Certificado Digital (.p12 / .pfx)
                                    </label>
                                    <label className="flex items-center gap-2.5 w-full bg-bg-deep border border-dashed border-border-thin rounded-xl px-4 py-3 cursor-pointer hover:border-text-main/30 transition-colors">
                                        <Upload size={15} className="text-text-dim shrink-0" />
                                        <span className="text-xs text-text-dim truncate">
                                            {certFile ? certFile.name : 'Seleccionar archivo .p12 / .pfx'}
                                        </span>
                                        <input
                                            type="file"
                                            accept=".p12,.pfx"
                                            className="hidden"
                                            onChange={e => setCertFile(e.target.files?.[0] ?? null)}
                                        />
                                    </label>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="section-label text-text-dim block">
                                        Contraseña del Certificado
                                    </label>
                                    <input
                                        type="password"
                                        value={certPassword}
                                        onChange={e => setCertPassword(e.target.value)}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main/40 font-sans"
                                    />
                                </div>
                            </div>

                            {firmarError && (
                                <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-xl p-3">
                                    <AlertCircle size={14} className="text-error shrink-0" />
                                    <p className="text-xs text-error">{firmarError}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-5 border-t border-border-thin bg-surface shrink-0 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setFirmarTarget(null)}
                                className="py-2 px-4 btn-vercel-secondary text-xs font-semibold rounded-xl transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleFirmar}
                                disabled={actioning === firmarTarget.id_informe}
                                className="py-2 px-5 btn-vercel-primary text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {actioning === firmarTarget.id_informe
                                    ? <RefreshCw size={14} className="animate-spin" />
                                    : <FileSignature size={14} />}
                                <span>Aplicar firma</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Drawer: Observar ───────────────────────────────────── */}
            {observarTarget && (
                <div className="fixed inset-0 z-[100] flex justify-end select-none">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300" 
                        onClick={() => setObservarTarget(null)}
                    />
                    <div className="relative flex h-full w-full max-w-lg bg-surface border-l border-border-thin shadow-2xl flex-col z-10 animate-fade-in-right overflow-hidden font-sans">
                        {/* Header */}
                        <div className="border-b border-border-thin flex justify-between items-start p-5 sm:p-6 shrink-0 bg-surface">
                            <div className="flex flex-col gap-1 min-w-0 pr-4">
                                <h3 className="text-base sm:text-lg font-bold tracking-tight text-text-main font-sans truncate">
                                    Observar Informe #{observarTarget.numero_informe}
                                </h3>
                                <p className="section-label text-text-dim">
                                    Requerimiento de subsanación
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setObservarTarget(null)}
                                className="p-1.5 hover:bg-surface-hover rounded-xl text-text-dim hover:text-text-main transition-all cursor-pointer shrink-0"
                                title="Cerrar panel"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
                            <div className="space-y-1.5">
                                <label className="section-label text-text-dim block">
                                    Motivo / Correcciones Solicitadas
                                </label>
                                <textarea
                                    rows={6}
                                    placeholder="Indique qué correcciones debe realizar el Director de Proyecto en el editor del informe..."
                                    value={observacion}
                                    onChange={e => setObservacion(e.target.value)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-sm text-text-main resize-none focus:outline-none focus:border-text-main/40 font-sans"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-5 border-t border-border-thin bg-surface shrink-0 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setObservarTarget(null)}
                                className="py-2 px-4 btn-vercel-secondary text-xs font-semibold rounded-xl transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleObservar}
                                disabled={actioning === observarTarget.id_informe || !observacion.trim()}
                                className="py-2 px-5 btn-vercel-primary text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {actioning === observarTarget.id_informe
                                    ? <RefreshCw size={14} className="animate-spin" />
                                    : <AlertCircle size={14} />}
                                <span>Enviar Observación</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default InformesAvancePage;
