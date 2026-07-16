import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PenTool, Calendar, Search, X, BookOpen } from 'lucide-react';
import api from '../../../api/axios_config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreateProjectModal } from '../../../components/DIITRA/CreateProjectModal';
import { useAuth } from '../../../api/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';

interface Convocatoria {
    id_convocatoria: number;
    uuid: string;
    titulo: string;
    descripcion: string;
    fecha_apertura: string;
    fecha_cierre: string;
    monto_maximo_proyecto?: number;
    presupuesto_total?: number;
    url_bases: string;
    estado: string;
    rubrica_nombre?: string;
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
    const [searchParams, setSearchParams] = useSearchParams();
    const openUuid = searchParams.get('open');
    const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewProject, setShowNewProject] = useState(false);
    const [preselectedConvocatoriaId, setPreselectedConvocatoriaId] = useState<number | null>(null);
    const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);

    const postularId = searchParams.get('postular');

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
        const fetchConvocatorias = async () => {
            try {
                const response = await api.get('/Convocatorias');
                setConvocatorias(response.data.filter((c: any) => c.estado === 'Abierta' || (isAdmin && c.estado === 'Borrador')));
            } catch (error) {
                console.error('Error fetching convocatorias:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConvocatorias();
    }, [isAdmin]);

    const filtered = convocatorias.filter(c =>
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.codigo_convocatoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-fade-up">
            {/* Header Section */}
            <header className="max-w-4xl space-y-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Oportunidades de Investigación</h1>
                </div>
                <p className="text-text-dim text-base leading-relaxed max-w-2xl font-medium">
                    Explora las convocatorias vigentes y postula tus proyectos de investigación e innovación institucional.
                </p>
            </header>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-surface p-4 rounded-lg border border-border-thin">
                <div className="relative flex-1 min-w-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por título o código..."
                        className="input-vercel !pl-9 !rounded-xl !py-2.5 !text-sm !placeholder:text-text-dim w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid of Convocatorias */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-96 bento-card animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state py-20">
                    <div className="icon-circle-neutral mb-4">
                        <PenTool size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-text-main uppercase tracking-widest">No hay convocatorias activas</h3>
                        <p className="text-xs text-text-dim">Vuelve pronto para ver nuevas oportunidades</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((c) => (
                        <div
                            key={c.uuid}
                            className={`bento-card p-6 group relative overflow-hidden transition-all ${selectedConvocatoria?.uuid === c.uuid
                                ? 'bg-brand/[0.05] border-brand/35 shadow-[0_0_12px_rgba(0,112,243,0.08)]'
                                : ''
                                }`}
                        >
                            <Link to={`?open=${c.uuid}`} className="absolute inset-0 z-10" />

                            <div className="space-y-6 relative z-0 pointer-events-none">
                                <div className="flex justify-between items-start">
                                    <span className="badge-vercel">
                                        {c.codigo_convocatoria}
                                    </span>
                                    {isPastDeadline(c.fecha_cierre) ? (
                                        <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest">
                                            <span className="dot dot-error" />
                                            <span className="text-error">
                                                Cerrada
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest">
                                            <span className={`dot dot-pulse ${c.estado === 'Abierta' ? 'dot-success' : 'dot-warning'}`} />
                                            <span className={c.estado === 'Abierta' ? 'text-success' : 'text-warning'}>
                                                {c.estado}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-text-main leading-tight group-hover:text-text-main transition-colors">
                                        {c.titulo}
                                    </h3>
                                    {c.descripcion && (
                                        <p className="text-xs text-text-dim leading-relaxed font-medium">
                                            {c.descripcion}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <div className="space-y-1">
                                        <div className="section-label">
                                            <Calendar size={10} />
                                            <span>Cierre</span>
                                        </div>
                                        <p className="text-xs font-semibold text-text-main font-mono">
                                            {formatLocalDate(c.fecha_cierre)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex items-center gap-4 relative z-20 pointer-events-auto">
                                {isPastDeadline(c.fecha_cierre) ? (
                                    <button
                                        disabled
                                        className="btn-vercel-secondary flex-1 cursor-not-allowed opacity-50"
                                    >
                                        Plazo Vencido
                                    </button>
                                ) : (
                                    <Link
                                        to={`?postular=${c.id_convocatoria}`}
                                        className="btn-vercel-primary flex-1 justify-center text-center flex items-center"
                                    >
                                        Postular Ahora
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lanzador de nuevo proyecto con Convocatoria preseleccionada */}
            {showNewProject && (
                <CreateProjectModal
                    preselectedConvocatoriaId={preselectedConvocatoriaId}
                    onClose={() => {
                        setShowNewProject(false);
                        setPreselectedConvocatoriaId(null);
                        setSearchParams(prev => {
                            const next = new URLSearchParams(prev);
                            next.delete('postular');
                            return next;
                        });
                    }}
                />
            )}

            {/* Detail Panel */}
            {selectedConvocatoria && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end animate-fade-up">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                        onClick={() => setSelectedConvocatoria(null)}
                    />

                    <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 bg-bg-deep text-text-dim border border-border-thin text-[10px] font-mono uppercase rounded-md">
                                    {selectedConvocatoria.codigo_convocatoria}
                                </span>
                                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider">
                                    {isPastDeadline(selectedConvocatoria.fecha_cierre) ? (
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
                            <div className="space-y-4">
                                <h2 className="text-3xl font-semibold tracking-tight text-text-main leading-tight font-sans">
                                    {selectedConvocatoria.titulo}
                                </h2>
                                {selectedConvocatoria.descripcion && (
                                    <p className="text-sm text-text-dim leading-relaxed font-medium">
                                        {selectedConvocatoria.descripcion}
                                    </p>
                                )}
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

                            <div className="bento-card p-6 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-text-main uppercase tracking-wider">
                                    <BookOpen size={14} /> Alineación Académica CACES
                                </div>
                                <p className="text-xs text-text-dim leading-relaxed font-medium">
                                    Esta convocatoria opera bajo el Reglamento de Régimen Académico del <strong>CES</strong> y de la <strong>SENESCYT</strong>. Todos los proyectos presentados pasarán por revisión por pares anónima y registro permanente de cambios.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-text-main uppercase tracking-widest">Requisitos Clave para Postulación</h4>
                                <ul className="space-y-2.5 text-xs text-text-dim">
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 bg-text-main rounded-full mt-1.5 shrink-0" />
                                        <span>El equipo debe constar al menos de un Docente Investigador titular del ISTPET.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 bg-text-main rounded-full mt-1.5 shrink-0" />
                                        <span>Subir el protocolo completo de investigación redactado de forma colaborativa.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-8 border-t border-border-thin bg-surface flex gap-4">
                            {isPastDeadline(selectedConvocatoria.fecha_cierre) ? (
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
