import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PenTool, Calendar, Search, X, BookOpen, FileText, ArrowRight, Archive } from 'lucide-react';
import api from '../../../api/axios_config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreateProjectModal } from '../../../components/DIITRA/CreateProjectModal';
import { useAuth } from '../../../api/AuthContext';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useConfirm } from '../../../api/ConfirmContext';

interface Convocatoria {
    id_convocatoria: number;
    uuid: string;
    titulo: string;
    fecha_apertura: string;
    fecha_cierre: string;
    estado: string;
    codigo_convocatoria: string;
}

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

const formatLocalDate = (dateStr: string, formatStr = 'dd MMM, yyyy') => {
    const date = parseLocalDate(dateStr);
    if (!date) return 'Por definir';
    return format(date, formatStr, { locale: es });
};

const isPastDeadline = (fechaCierre: string) => {
    if (!fechaCierre) return false;
    const deadline = new Date(fechaCierre);
    const now = new Date();
    if (isNaN(deadline.getTime())) return false;
    if (fechaCierre.length <= 10) {
        const [year, month, day] = fechaCierre.split('-').map(Number);
        const localDeadline = new Date(year, month - 1, day, 23, 59, 59, 999);
        return now > localDeadline;
    }
    return now > deadline;
};

const PublicConvocatoriasPage = () => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const openUuid = searchParams.get('open');
    const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ABIERTAS' | 'CERRADAS'>('ALL');
    const [showNewProject, setShowNewProject] = useState(false);
    const [preselectedConvocatoriaId, setPreselectedConvocatoriaId] = useState<number | null>(null);
    const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);

    const postularId = searchParams.get('postular');

    const confirm = useConfirm();
    const [pendingDraft, setPendingDraft] = useState<{ titulo: string; timestamp: number } | null>(null);
    const [restoreDraftOnOpen, setRestoreDraftOnOpen] = useState(false);

    const checkPendingDraft = () => {
        const metaStr = localStorage.getItem('preproposal_draft_metadata');
        const draftStr = localStorage.getItem('preproposal_form_draft');
        if (metaStr && draftStr) {
            try {
                const parsedDraft = JSON.parse(draftStr);
                if (!parsedDraft.titulo?.trim() && !parsedDraft.descripcion?.trim()) {
                    localStorage.removeItem('preproposal_form_draft');
                    localStorage.removeItem('preproposal_draft_metadata');
                    setPendingDraft(null);
                } else {
                    setPendingDraft(JSON.parse(metaStr));
                }
            } catch (e) {
                console.error("Error reading draft metadata", e);
                localStorage.removeItem('preproposal_form_draft');
                localStorage.removeItem('preproposal_draft_metadata');
                setPendingDraft(null);
            }
        } else {
            setPendingDraft(null);
        }
    };

    const handleRestoreDraftExternal = () => {
        setRestoreDraftOnOpen(true);
        setShowNewProject(true);
    };

    const handleDiscardDraftExternal = () => {
        localStorage.removeItem('preproposal_form_draft');
        localStorage.removeItem('preproposal_draft_metadata');
        setPendingDraft(null);
        setRestoreDraftOnOpen(false);
    };

    useEffect(() => {
        if (openUuid && convocatorias.length > 0) {
            const target = convocatorias.find(c => c.uuid === openUuid);
            if (target) {
                setSelectedConvocatoria(target);
                setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.delete('open');
                    return next;
                });
            }
        }
    }, [openUuid, convocatorias, setSearchParams]);

    useEffect(() => {
        if (postularId && convocatorias.length > 0) {
            const id = parseInt(postularId, 10);
            if (!isNaN(id)) {
                const target = convocatorias.find(c => c.id_convocatoria === id);
                if (target) {
                    setPreselectedConvocatoriaId(id);
                    setShowNewProject(true);
                }
            }
        }
    }, [postularId, convocatorias]);

    useEffect(() => {
        checkPendingDraft();
        const handleFocus = () => {
            checkPendingDraft();
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [showNewProject]);

    useEffect(() => {
        const fetchConvocatorias = async () => {
            try {
                const response = await api.get('/Convocatorias');
                setConvocatorias(response.data.filter((c: any) => c.estado === 'Abierta' || c.estado === 'Cerrada' || (isAdmin && c.estado === 'Borrador')));
            } catch (error) {
                console.error('Error fetching convocatorias:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConvocatorias();
    }, [isAdmin]);

    const isConvocatoriaCerrada = (c: Convocatoria) => c.estado === 'Cerrada' || isPastDeadline(c.fecha_cierre);

    const filtered = convocatorias.filter(c =>
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.codigo_convocatoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const abiertas = filtered.filter(c => !isConvocatoriaCerrada(c));
    const cerradas = filtered.filter(c => isConvocatoriaCerrada(c));

    const displayedConvocatorias = statusFilter === 'ABIERTAS'
        ? abiertas
        : statusFilter === 'CERRADAS'
            ? cerradas
            : filtered;

    return (
        <div className="p-8 lg:p-12 space-y-10 animate-fade-up">
            {/* Header Section */}
            <header className="max-w-4xl space-y-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Oportunidades de Investigación e Innovación</h1>
                </div>
                <p className="text-text-dim text-sm md:text-base leading-relaxed max-w-2xl font-normal">
                    Explora las convocatorias vigentes y postula tus proyectos de investigación e innovación institucional.
                </p>
            </header>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-surface p-3.5 sm:p-4 rounded-xl border border-border-thin shadow-xs">
                <div className="relative flex-1 min-w-0">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por título o código..."
                        className="input-vercel !pl-9 !rounded-lg !py-2 !text-xs md:!text-sm !placeholder:text-text-dim w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Selector Segmentado de Estado Geist */}
                <div className="flex items-center p-1 bg-surface-hover/80 rounded-lg border border-border-thin self-start md:self-auto shrink-0">
                    <button
                        type="button"
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                            statusFilter === 'ALL'
                                ? 'bg-surface text-text-main shadow-xs font-semibold'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        Todas ({filtered.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('ABIERTAS')}
                        className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                            statusFilter === 'ABIERTAS'
                                ? 'bg-surface text-text-main shadow-xs font-semibold'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        Abiertas ({abiertas.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('CERRADAS')}
                        className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                            statusFilter === 'CERRADAS'
                                ? 'bg-surface text-text-main shadow-xs font-semibold'
                                : 'text-text-dim hover:text-text-main'
                        }`}
                    >
                        Cerradas ({cerradas.length})
                    </button>
                </div>
            </div>

            {/* Banner de Recuperación de Borrador */}
            {pendingDraft && (
                <div className="bento-card static p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up max-w-4xl">
                    <div className="flex items-center gap-3">
                        <FileText size={18} className="text-text-main shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-text-main">Borrador detectado</h4>
                            <p className="text-xs text-text-dim">
                                Tienes un borrador sin guardar de una postulación: <span className="text-text-main font-medium">"{pendingDraft.titulo}"</span>.
                            </p>
                            <p className="text-[10px] text-text-dim/60 font-mono">
                                Guardado automáticamente el {new Date(pendingDraft.timestamp).toLocaleDateString()} a las {new Date(pendingDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                        <button
                            onClick={handleRestoreDraftExternal}
                            className="btn-vercel-primary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Restaurar borrador
                        </button>
                        <button
                            onClick={handleDiscardDraftExternal}
                            className="btn-vercel-secondary !py-1.5 !px-3 !text-xs !normal-case !tracking-normal font-medium flex items-center justify-center gap-1.5"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}


            {/* Grid of Convocatorias */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bento-card animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state py-20">
                    <div className="icon-circle-neutral mb-4">
                        <PenTool size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-text-main uppercase tracking-widest">No se encontraron convocatorias</h3>
                        <p className="text-xs text-text-dim">
                            {searchTerm ? `No hay coincidencias para "${searchTerm}"` : 'Vuelve pronto para ver nuevas oportunidades de investigación'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* SECCIÓN 1: CONVOCATORIAS ABIERTAS (VIGENTES) */}
                    {(statusFilter === 'ALL' || statusFilter === 'ABIERTAS') && (
                        <section className="space-y-4">
                            <div>
                                <h2 className="text-sm md:text-base font-bold text-text-main tracking-tight font-sans">
                                    Convocatorias Abiertas
                                </h2>
                            </div>

                            {abiertas.length === 0 ? (
                                <div className="bento-card p-8 text-center space-y-2 border-dashed">
                                    <p className="text-sm font-semibold text-text-main">No hay convocatorias abiertas en este momento</p>
                                    <p className="text-xs text-text-dim max-w-md mx-auto">
                                        Actualmente no existen convocatorias en periodo de postulación. Puedes revisar las convocatorias anteriores en la sección histórica inferior.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {abiertas.map((c) => (
                                        <div
                                            key={c.uuid}
                                            onClick={() => setSelectedConvocatoria(c)}
                                            className={`bento-card p-6 flex flex-col justify-between group relative overflow-hidden transition-all cursor-pointer border-border-thin hover:border-text-main/40 ${selectedConvocatoria?.uuid === c.uuid
                                                ? 'bg-brand/[0.05] border-brand/35 shadow-[0_0_12px_rgba(0,112,243,0.08)]'
                                                : ''
                                            }`}
                                        >
                                            <div className="space-y-4 relative z-0">
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="font-mono font-medium text-xs text-text-dim">
                                                        {c.codigo_convocatoria}
                                                    </span>
                                                    <div className="text-[10px] font-mono font-semibold uppercase text-success tracking-wider shrink-0">
                                                        <span>{c.estado === 'Borrador' ? 'Borrador' : 'Abierta'}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 min-h-[48px]">
                                                    <h3 className="text-base md:text-lg font-bold text-text-main leading-snug group-hover:text-brand transition-colors">
                                                        {c.titulo}
                                                    </h3>
                                                </div>

                                                <div className="pt-3 border-t border-border-thin/50 flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim flex items-center gap-1">
                                                            <Calendar size={11} />
                                                            <span>Plazo de Cierre</span>
                                                        </span>
                                                        <p className="text-xs font-semibold text-text-main font-mono">
                                                            {formatLocalDate(c.fecha_cierre)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6 relative z-10">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedConvocatoria(c);
                                                    }}
                                                    className="btn-vercel-primary w-full flex items-center justify-center gap-2 !h-10 !text-xs font-medium cursor-pointer"
                                                >
                                                    <span>Postular</span>
                                                    <ArrowRight size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* SECCIÓN 2: CONVOCATORIAS CERRADAS (HISTÓRICO Y CONSULTA) */}
                    {(statusFilter === 'ALL' || statusFilter === 'CERRADAS') && (
                        <section className="space-y-4">
                            <div>
                                <h2 className="text-sm md:text-base font-bold text-text-dim tracking-tight font-sans">
                                    Convocatorias Cerradas
                                </h2>
                            </div>

                            {cerradas.length === 0 ? (
                                <div className="bento-card p-8 text-center space-y-2 border-dashed bg-surface/40">
                                    <p className="text-sm font-semibold text-text-dim">No hay convocatorias cerradas</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {cerradas.map((c) => (
                                        <div
                                            key={c.uuid}
                                            onClick={() => setSelectedConvocatoria(c)}
                                            className={`bento-card p-5 flex flex-col justify-between group relative overflow-hidden transition-all cursor-pointer bg-surface/50 border-border-thin/70 hover:border-border-thin hover:bg-surface/80 ${selectedConvocatoria?.uuid === c.uuid
                                                ? 'border-text-dim shadow-xs'
                                                : ''
                                            }`}
                                        >
                                            <div className="space-y-3.5 relative z-0">
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="font-mono text-xs text-text-dim font-medium">
                                                        {c.codigo_convocatoria}
                                                    </span>
                                                    <div className="text-[10px] font-mono font-medium text-text-dim shrink-0">
                                                        <span>Plazo Concluido</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1 min-h-[44px]">
                                                    <h3 className="text-sm md:text-[15px] font-semibold text-text-main/80 group-hover:text-text-main leading-snug transition-colors">
                                                        {c.titulo}
                                                    </h3>
                                                </div>

                                                <div className="pt-2.5 border-t border-border-thin/40 flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim/70 flex items-center gap-1">
                                                            <Calendar size={11} />
                                                            <span>Fecha de Cierre</span>
                                                        </span>
                                                        <p className="text-xs font-mono text-text-dim font-medium">
                                                            {formatLocalDate(c.fecha_cierre)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-5 relative z-10">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedConvocatoria(c);
                                                    }}
                                                    className="btn-vercel-secondary w-full flex items-center justify-center gap-1.5 !h-9 !text-xs font-medium text-text-dim group-hover:text-text-main cursor-pointer"
                                                >
                                                    <Archive size={12} />
                                                    <span>Consultar Bases Históricas</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            )}

            {/* Lanzador de nuevo proyecto con Convocatoria preseleccionada */}
            {showNewProject && (
                <CreateProjectModal
                    preselectedConvocatoriaId={preselectedConvocatoriaId}
                    onClose={() => {
                        setShowNewProject(false);
                        setPreselectedConvocatoriaId(null);
                        setRestoreDraftOnOpen(false);
                        checkPendingDraft();
                        setSearchParams(prev => {
                            const next = new URLSearchParams(prev);
                            next.delete('postular');
                            return next;
                        });
                    }}
                    onSuccess={(targetPath) => {
                        setShowNewProject(false);
                        setPreselectedConvocatoriaId(null);
                        setRestoreDraftOnOpen(false);
                        navigate(targetPath, { replace: true });
                    }}
                    restoreDraftOnOpen={restoreDraftOnOpen}
                />
            )}

            {/* Detail Panel */}
            {selectedConvocatoria && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setSelectedConvocatoria(null)}
                    />

                    <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-xs text-text-dim font-medium uppercase">
                                    {selectedConvocatoria.codigo_convocatoria}
                                </span>
                                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider">
                                    {selectedConvocatoria.estado === 'Cerrada' || isPastDeadline(selectedConvocatoria.fecha_cierre) ? (
                                        <>
                                            <span className="dot dot-error" />
                                            <span className="text-error">
                                                Convocatoria Cerrada (Plazo Vencido)
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className={`dot dot-pulse ${selectedConvocatoria.estado === 'Abierta' ? 'dot-success' : 'dot-warning'}`} />
                                            <span className={selectedConvocatoria.estado === 'Abierta' ? 'text-success' : 'text-warning'}>
                                                {selectedConvocatoria.estado === 'Abierta' ? 'Convocatoria Activa' : `Estado: ${selectedConvocatoria.estado}`}
                                            </span>
                                        </>
                                    )}
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
                            <div className="space-y-2">
                                <h2 className="text-3xl font-semibold tracking-tight text-text-main leading-tight font-sans">
                                    {selectedConvocatoria.titulo}
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bento-card p-5 space-y-1.5">
                                    <div className="text-[10px] font-semibold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar size={12} /> Fecha de Apertura
                                    </div>
                                    <div className="text-sm font-semibold text-text-main font-mono">
                                        {formatLocalDate(selectedConvocatoria.fecha_apertura)}
                                    </div>
                                </div>
                                <div className="bento-card p-5 space-y-1.5">
                                    <div className="text-[10px] font-semibold text-error uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar size={12} /> Fecha de Cierre (Límite)
                                    </div>
                                    <div className="text-sm font-semibold text-error font-mono">
                                        {formatLocalDate(selectedConvocatoria.fecha_cierre)}
                                    </div>
                                </div>
                            </div>

                            <div className="bento-card p-6 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-text-main uppercase tracking-wider">
                                    <BookOpen size={14} /> Marco Normativo y Calidad (CES · CACES · SENESCYT)
                                </div>
                                <p className="text-xs text-text-dim leading-relaxed font-normal">
                                    En cumplimiento de la <strong>Ley Orgánica de Educación Superior (LOES)</strong>, el Reglamento de Formación Técnica y Tecnológica del <strong>CES</strong> y el modelo de aseguramiento de la calidad del <strong>CACES</strong>, esta convocatoria promueve proyectos de <strong>investigación aplicada, desarrollo tecnológico e innovación (I+D+i)</strong> orientados a responder a problemáticas de los sectores social y productivo.
                                </p>
                                <p className="text-xs text-text-dim leading-relaxed font-normal">
                                    Todas las propuestas son sometidas a <strong>evaluación por pares técnicos o comités arbitrales especializados</strong>, garantizando rigor metodológico, trazabilidad inmutable y la adecuada custodia de la propiedad intelectual conforme a los principios del <strong>Código Orgánico INGENIOS</strong>.
                                </p>
                            </div>

                            <div className="bento-card p-6 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-text-main uppercase tracking-wider">
                                    <FileText size={14} /> Requisitos Clave para Postulación
                                </div>
                                <ul className="space-y-3 text-xs text-text-dim">
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 bg-text-main rounded-full mt-1.5 shrink-0" />
                                        <span><strong>Equipo de Investigación:</strong> Contar al menos con un Docente Investigador del ISTPET (con asignación horaria institucional para I+D+i) y fomentar la incorporación de estudiantes en calidad de semilleristas o asistentes técnicos.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 bg-text-main rounded-full mt-1.5 shrink-0" />
                                        <span><strong>Alineación Estratégica:</strong> La propuesta debe responder a las líneas institucionales de investigación formalizadas por el ISTPET y evidenciar aplicabilidad técnica y pertinencia territorial.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 bg-text-main rounded-full mt-1.5 shrink-0" />
                                        <span><strong>Protocolo Colaborativo:</strong> Formular de forma integral el protocolo de investigación/innovación y su plan de trabajo en la plataforma colaborativa de DIITRA.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-8 border-t border-border-thin bg-surface flex gap-4">
                            {selectedConvocatoria.estado === 'Cerrada' || isPastDeadline(selectedConvocatoria.fecha_cierre) ? (
                                <button
                                    disabled
                                    className="btn-vercel-secondary flex-1 cursor-not-allowed opacity-50"
                                >
                                    Plazo Vencido
                                </button>
                            ) : (
                                <Link
                                    to={`?postular=${selectedConvocatoria.id_convocatoria}`}
                                    onClick={() => setSelectedConvocatoria(null)}
                                    className="btn-vercel-primary flex-1 justify-center text-center flex items-center"
                                >
                                    Iniciar Postulación
                                </Link>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PublicConvocatoriasPage;
