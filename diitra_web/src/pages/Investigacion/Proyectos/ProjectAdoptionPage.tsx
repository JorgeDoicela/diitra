import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios_config';
import { useAuth } from '../../../api/AuthContext';
import {
    ClipboardList, Search, ArrowRight, Loader2, BookOpen, User, 
    CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight, X, Check, Info, Award
} from 'lucide-react';

interface UnfinishedProject {
    id_proyecto: number;
    uuid: string;
    titulo: string;
    codigo_institucional?: string;
    descripcion?: string;
    estado: string;
    disponible_adopcion: boolean;
    linea_investigacion: string;
    sublinea: string;
    director_anterior: string;
    director_anterior_email: string;
}

interface GeneralProject {
    uuid: string;
    idProyecto: number;
    titulo: string;
    codigoInstitucional?: string;
    estado: string;
    lineaInvestigacion?: string;
    directorProyecto?: string;
    fechaRegistro?: string;
    costoTotal?: number;
}

const ProjectAdoptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAdmin, isDocente } = useAuth();

    // Available projects for adoption (Teachers/Admins)
    const [unfinishedProjects, setUnfinishedProjects] = useState<UnfinishedProject[]>([]);
    
    // All system projects (Only for Admins to declare unfinished)
    const [allProjects, setAllProjects] = useState<GeneralProject[]>([]);

    // Loading & UI States
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [adminActiveTab, setAdminActiveTab] = useState<'view' | 'declare'>('view');

    // Dialog: Confirm Adoption
    const [adoptingProject, setAdoptingProject] = useState<UnfinishedProject | null>(null);
    const [adoptionSuccess, setAdoptionSuccess] = useState<string | null>(null);
    const [adoptionError, setAdoptionError] = useState<string | null>(null);

    // Dialog: Declare Unfinished (Admin)
    const [declaringProject, setDeclaringProject] = useState<GeneralProject | null>(null);
    const [declareReason, setDeclareReason] = useState('');
    const [declareError, setDeclareError] = useState<string | null>(null);
    const [declareSuccess, setDeclareSuccess] = useState<string | null>(null);

    // Detail modal
    const [detailProject, setDetailProject] = useState<UnfinishedProject | null>(null);

    // Fetch available unfinished projects
    const fetchUnfinishedProjects = async () => {
        try {
            const res = await api.get<UnfinishedProject[]>('/Admin/email-engine/projects/unfinished');
            setUnfinishedProjects(res.data);
        } catch (e) {
            console.error('[DIITRA ADOPTION] Error fetching available projects:', e);
        }
    };

    // Fetch all projects (For Admin declare view)
    const fetchAllProjects = async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/projects');
            // Check if returned data is direct array or wrapped
            const projectList = Array.isArray(res.data) ? res.data : res.data.items || [];
            setAllProjects(projectList);
        } catch (e) {
            console.error('[DIITRA ADOPTION] Error fetching all projects:', e);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            await fetchUnfinishedProjects();
            if (isAdmin) {
                await fetchAllProjects();
            }
        } catch (e) {
            console.error('[DIITRA ADOPTION] Error loading lists:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [isAdmin]);

    // Handle Adopt project post
    const handleConfirmAdoption = async () => {
        if (!adoptingProject) return;
        setSubmitting(true);
        setAdoptionError(null);
        try {
            const res = await api.post(`/Admin/email-engine/projects/${adoptingProject.id_proyecto}/adopt`);
            setAdoptionSuccess(res.data.message || 'Proyecto adoptado con éxito.');
            
            // Reload list and close adoption prompt
            await fetchUnfinishedProjects();
            if (isAdmin) {
                await fetchAllProjects();
            }
            
            setTimeout(() => {
                setAdoptionSuccess(null);
                setAdoptingProject(null);
                // Redirect user to My Projects to resume work
                navigate('/investigacion/mis-proyectos');
            }, 3000);
        } catch (err: any) {
            console.error('[DIITRA ADOPTION] Error adopting project:', err);
            setAdoptionError(err.response?.data?.message || err.response?.data || 'No se pudo procesar la adopción. Verifique sus permisos de docente.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Declare unfinished post
    const handleConfirmDeclare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!declaringProject || !declareReason.trim()) return;
        setSubmitting(true);
        setDeclareError(null);
        try {
            const res = await api.post(`/Admin/email-engine/projects/${declaringProject.idProyecto}/mark-unfinished`, {
                reason: declareReason
            });
            setDeclareSuccess(res.data.message || 'Proyecto marcado como inconcluso con éxito.');
            setDeclareReason('');
            
            // Reload list and close prompt
            await fetchUnfinishedProjects();
            await fetchAllProjects();

            setTimeout(() => {
                setDeclareSuccess(null);
                setDeclaringProject(null);
            }, 2500);
        } catch (err: any) {
            console.error('[DIITRA ADOPTION] Error declaring project unfinished:', err);
            setDeclareError(err.response?.data?.message || err.response?.data || 'Error al actualizar el estado del proyecto.');
        } finally {
            setSubmitting(false);
        }
    };

    // Filter available projects for adoption
    const filteredUnfinished = unfinishedProjects.filter(p => {
        const query = searchQuery.toLowerCase();
        return p.titulo.toLowerCase().includes(query) ||
               (p.codigo_institucional || '').toLowerCase().includes(query) ||
               p.linea_investigacion.toLowerCase().includes(query) ||
               p.sublinea.toLowerCase().includes(query);
    });

    // Filter all projects (for admin declare view)
    const filteredAllProjects = allProjects.filter(p => {
        const query = searchQuery.toLowerCase();
        // Skip projects already inconcluso or finished
        const matchesQuery = p.titulo.toLowerCase().includes(query) ||
               (p.codigoInstitucional || '').toLowerCase().includes(query) ||
               (p.directorProyecto || '').toLowerCase().includes(query);
        const eligibleState = p.estado !== 'Inconcluso' && p.estado !== 'Finalizado' && p.estado !== 'Rechazado';
        return matchesQuery && eligibleState;
    });

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-brand" size={32} />
                    <p className="text-text-dim text-xs font-mono uppercase tracking-widest">Cargando catálogo de reasignaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-up">
                    <div className="space-y-2">
                        <div className="section-label text-brand">
                            <Award size={10} strokeWidth={2} />
                            <span>Centro de Adopciones DIITRA</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-none">
                            Bandeja de Adopción de Proyectos
                        </h2>
                        <p className="text-xs md:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                            Rescate y reanudación de proyectos de investigación inconclusos o abandonados para asegurar la continuidad del conocimiento.
                        </p>
                    </div>

                    {/* Admin Switch View */}
                    {isAdmin && (
                        <div className="flex border border-border-thin bg-surface rounded-lg p-1 select-none">
                            <button
                                onClick={() => { setAdminActiveTab('view'); setSearchQuery(''); }}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                                    adminActiveTab === 'view'
                                        ? 'bg-bg-deep border border-border-thin text-text-main shadow-sm'
                                        : 'text-text-dim hover:text-text-main'
                                }`}
                            >
                                Disponibles ({unfinishedProjects.length})
                            </button>
                            <button
                                onClick={() => { setAdminActiveTab('declare'); setSearchQuery(''); }}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                                    adminActiveTab === 'declare'
                                        ? 'bg-bg-deep border border-border-thin text-text-main shadow-sm'
                                        : 'text-text-dim hover:text-text-main'
                                }`}
                            >
                                Declarar Inconcluso
                            </button>
                        </div>
                    )}
                </header>

                {/* Filter and search bar */}
                <div className="relative mb-8 max-w-md animate-fade-up [animation-delay:100ms]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={
                            isAdmin && adminActiveTab === 'declare'
                                ? "Buscar proyectos activos para declarar inconclusos..."
                                : "Buscar proyectos disponibles por título, código o línea..."
                        }
                        className="input-vercel !pl-10 !py-2.5 !text-sm"
                    />
                </div>

                {/* FLOW A: DOCENTE VIEW / ADMIN AVAILABLE VIEW */}
                {(!isAdmin || adminActiveTab === 'view') && (
                    <div className="space-y-6 animate-fade-up [animation-delay:150ms]">
                        {filteredUnfinished.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center bento-card p-10">
                                <div className="w-12 h-12 rounded-full bg-surface border border-border-thin flex items-center justify-center text-text-dim mb-4">
                                    <ClipboardList size={20} />
                                </div>
                                <h4 className="text-sm font-bold text-text-main uppercase tracking-wider">No hay proyectos disponibles</h4>
                                <p className="text-xs text-text-dim max-w-xs mt-2 leading-relaxed">
                                    Actualmente no existen proyectos de investigación marcados como inconclusos o disponibles para adopción.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredUnfinished.map(p => (
                                    <div
                                        key={p.id_proyecto}
                                        onClick={() => setDetailProject(p)}
                                        className="bento-card group p-6 cursor-pointer flex flex-col justify-between relative hover:border-brand/40 transition-all overflow-hidden"
                                    >
                                        <div className="space-y-4">
                                            {/* Top Label */}
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] font-mono">
                                                    {p.codigo_institucional || 'SIN CÓDIGO'}
                                                </span>
                                                <span className="status-tag badge-vercel-warning text-[9px] font-bold py-0.5 px-2">
                                                    INCONCLUSO
                                                </span>
                                            </div>

                                            {/* Project Title */}
                                            <h3 className="font-bold text-text-main text-sm leading-snug group-hover:text-brand transition-colors line-clamp-2">
                                                {p.titulo}
                                            </h3>

                                            {/* Line and subline */}
                                            <div className="flex items-center gap-1.5 text-[10px] text-text-dim">
                                                <BookOpen size={11} className="shrink-0" />
                                                <span className="truncate">{p.sublinea}</span>
                                            </div>

                                            {/* Former director info */}
                                            <div className="p-3 bg-bg-deep/50 rounded-lg border border-border-thin flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs shrink-0 uppercase">
                                                    {p.director_anterior ? p.director_anterior.substring(0,2).toUpperCase() : 'DA'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Director Anterior</p>
                                                    <p className="text-[11px] font-bold text-text-main truncate leading-tight">{p.director_anterior}</p>
                                                </div>
                                            </div>

                                            {/* Description snippet */}
                                            <p className="text-xs text-text-dim leading-relaxed line-clamp-3">
                                                {p.descripcion || 'Este proyecto no cuenta con una descripción breve registrada en su postulación.'}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-6 pt-4 border-t border-border-thin flex items-center justify-between text-xs">
                                            <span className="text-[10px] font-bold text-brand uppercase tracking-wider flex items-center gap-1">
                                                Ficha del proyecto <ChevronRight size={12} />
                                            </span>
                                            
                                            {isDocente && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAdoptingProject(p);
                                                    }}
                                                    className="btn-vercel-primary text-[10.5px] !py-1.5 !px-3.5 flex items-center gap-1 cursor-pointer"
                                                >
                                                    Adoptar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* FLOW B: ADMIN DECLARE UNFINISHED VIEW */}
                {isAdmin && adminActiveTab === 'declare' && (
                    <div className="bento-card static overflow-hidden animate-fade-up [animation-delay:150ms]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-surface/50 border-b border-border-thin">
                                        <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase">Código</th>
                                        <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/3">Título del Proyecto</th>
                                        <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase">Director Original</th>
                                        <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase">Estado</th>
                                        <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase">Línea Investigación</th>
                                        <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-thin">
                                    {filteredAllProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-text-dim text-xs">
                                                No se encontraron proyectos activos elegibles para declarar inconclusos.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAllProjects.map(p => (
                                            <tr key={p.uuid} className="hover:bg-surface/20 transition-all">
                                                <td className="p-4 whitespace-nowrap font-mono text-xs text-text-main">
                                                    {p.codigoInstitucional || 'SIN CÓDIGO'}
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-bold text-text-main block leading-snug">{p.titulo}</span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className="text-xs font-medium text-text-main flex items-center gap-1.5">
                                                        <User size={12} className="text-text-dim" />
                                                        {p.directorProyecto || 'Sin asignar'}
                                                    </span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className="badge-vercel badge-vercel-neutral py-0.5 px-2 text-[9px] uppercase font-bold">
                                                        {p.estado}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs text-text-dim max-w-xs truncate" title={p.lineaInvestigacion}>
                                                    {p.lineaInvestigacion || 'General'}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setDeclaringProject(p);
                                                            setDeclareReason('');
                                                            setDeclareError(null);
                                                        }}
                                                        className="btn-vercel-secondary text-[10px] !py-1.5 !px-3 font-bold uppercase tracking-wider cursor-pointer hover:!text-error hover:!border-error/30"
                                                    >
                                                        Declarar Inconcluso
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* DIALOG: CONFIRM ADOPTION (TEACHER FLOW) */}
            {adoptingProject && (
                <div className="modal-overlay !z-50 animate-fade-in">
                    <div className="modal-card animate-fade-up max-w-md w-full">
                        <header className="modal-header">
                            <h4 className="font-bold text-text-main text-sm uppercase tracking-wider flex items-center gap-2">
                                <Award className="text-brand" size={16} /> Confirmar Adopción de Proyecto
                            </h4>
                            <button
                                onClick={() => { if (!submitting) setAdoptingProject(null); }}
                                className="text-text-dim hover:text-text-main transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </header>

                        <div className="modal-body space-y-4">
                            <div className="flex items-start gap-3.5 bg-brand-subtle/10 border border-brand/20 p-4 rounded-xl">
                                <Info size={20} className="text-brand shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h5 className="text-xs font-bold text-text-main">¿Qué implica la adopción?</h5>
                                    <p className="text-[11px] text-text-dim leading-relaxed">
                                        Al adoptar este proyecto, usted asumirá el rol de **Director de Proyecto**. Será el principal responsable de su ejecución, control de presupuesto y de registrar los informes mensuales/trimestrales.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 border-y border-border-thin py-3 text-xs leading-relaxed text-text-dim">
                                <p><strong>Proyecto:</strong> <span className="text-text-main font-semibold">"{adoptingProject.titulo}"</span></p>
                                <p><strong>Código:</strong> <span className="text-text-main font-mono">{adoptingProject.codigo_institucional || 'N/A'}</span></p>
                                <p><strong>Director Anterior:</strong> <span className="text-text-main">{adoptingProject.director_anterior} ({adoptingProject.director_anterior_email})</span></p>
                            </div>

                            <p className="text-[11px] text-text-dim leading-relaxed">
                                El sistema registrará este cambio de forma permanente según la normativa LOES y documentará la transición de estado de <strong className="text-text-main">Inconcluso</strong> a <strong className="text-text-main">En Ejecución</strong>.
                            </p>

                            {adoptionSuccess && (
                                <div className="badge-vercel-success !rounded-xl !p-3 text-xs flex items-center gap-2">
                                    <CheckCircle2 size={15} />
                                    <span>{adoptionSuccess} Redireccionando...</span>
                                </div>
                            )}

                            {adoptionError && (
                                <div className="badge-vercel-error !rounded-xl !p-3 text-xs flex items-center gap-2">
                                    <AlertTriangle size={15} className="shrink-0" />
                                    <span className="leading-normal">{adoptionError}</span>
                                </div>
                            )}
                        </div>

                        <footer className="modal-footer">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setAdoptingProject(null)}
                                className="btn-vercel-secondary py-2 text-xs uppercase"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleConfirmAdoption}
                                className="btn-vercel-primary py-2 text-xs uppercase cursor-pointer flex items-center gap-1.5"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={13} />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={13} />
                                        <span>Confirmar y Adoptar</span>
                                    </>
                                )}
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* DIALOG: DECLARE UNFINISHED (ADMIN FLOW) */}
            {declaringProject && (
                <div className="modal-overlay !z-50 animate-fade-in">
                    <div className="modal-card animate-fade-up max-w-md w-full">
                        <header className="modal-header">
                            <h4 className="font-bold text-text-main text-sm uppercase tracking-wider flex items-center gap-2 text-error">
                                <AlertTriangle size={16} /> Declarar Proyecto Inconcluso
                            </h4>
                            <button
                                onClick={() => { if (!submitting) setDeclaringProject(null); }}
                                className="text-text-dim hover:text-text-main transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </header>

                        <form onSubmit={handleConfirmDeclare}>
                            <div className="modal-body space-y-4">
                                <p className="text-xs text-text-dim leading-relaxed">
                                    Está declarando el proyecto <strong className="text-text-main">"{declaringProject.titulo}"</strong> de forma oficial como **Inconcluso**. Esto liberará la plaza de director, notificará automáticamente a todos los docentes del departamento e incluirá la propuesta en la bandeja de reasignaciones.
                                </p>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Motivo Académico / Justificación *</label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Ej: El docente director original ha cesado en funciones o no posee horas disponibles en el presente periodo académico para completar el cronograma."
                                        className="input-vercel text-xs leading-relaxed"
                                        value={declareReason}
                                        onChange={e => setDeclareReason(e.target.value)}
                                    />
                                    <span className="text-[8px] text-text-dim block leading-relaxed">Este motivo quedará registrado de forma permanente en el historial del proyecto y se enviará en el correo de difusión.</span>
                                </div>

                                {declareSuccess && (
                                    <div className="badge-vercel-success !rounded-xl !p-3 text-xs flex items-center gap-2">
                                        <CheckCircle2 size={15} />
                                        <span>{declareSuccess}</span>
                                    </div>
                                )}

                                {declareError && (
                                    <div className="badge-vercel-error !rounded-xl !p-3 text-xs flex items-center gap-2">
                                        <AlertTriangle size={15} className="shrink-0" />
                                        <span className="leading-normal">{declareError}</span>
                                    </div>
                                )}
                            </div>

                            <footer className="modal-footer">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setDeclaringProject(null)}
                                    className="btn-vercel-secondary py-2 text-xs uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !declareReason.trim()}
                                    className="btn-brand !bg-error !border-error hover:!text-error hover:!bg-transparent py-2 text-xs uppercase cursor-pointer flex items-center gap-1.5"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={13} />
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={13} />
                                            <span>Aplicar Cambio</span>
                                        </>
                                    )}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            {/* DRAWER: DETALLE DEL PROYECTO SELECCIONADO */}
            {detailProject && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setDetailProject(null)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <header className="modal-header">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold tracking-tighter text-text-main uppercase">Ficha Técnica de Reasignación</h3>
                                <p className="text-[10px] font-mono text-brand uppercase tracking-widest">{detailProject.codigo_institucional || 'Código Pendiente'}</p>
                            </div>
                            <button onClick={() => setDetailProject(null)} className="text-text-dim hover:text-text-main transition-colors cursor-pointer">
                                <X size={18} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Title & Badge */}
                            <div className="space-y-3">
                                <span className="status-tag badge-vercel-warning text-[9px] font-bold py-0.5 px-2">
                                    INCONCLUSO - DISPONIBLE PARA ADOPCIÓN
                                </span>
                                <h2 className="text-lg font-bold text-text-main leading-snug">
                                    {detailProject.titulo}
                                </h2>
                            </div>

                            {/* Lines of Research */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bento-card static p-4">
                                    <label className="section-label text-text-dim mb-1.5">Línea de Investigación</label>
                                    <div className="text-xs font-bold text-text-main">
                                        {detailProject.linea_investigacion}
                                    </div>
                                </div>
                                <div className="bento-card static p-4">
                                    <label className="section-label text-text-dim mb-1.5">Sublinea de Investigación</label>
                                    <div className="text-xs font-bold text-text-main">
                                        {detailProject.sublinea}
                                    </div>
                                </div>
                            </div>

                            {/* Former Director Details */}
                            <div className="bento-card static p-4 space-y-3">
                                <label className="section-label text-text-dim">Director Anterior Coordinador</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold text-white uppercase shrink-0">
                                        {detailProject.director_anterior ? detailProject.director_anterior.substring(0, 2).toUpperCase() : 'DA'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-text-main">
                                            {detailProject.director_anterior}
                                        </div>
                                        <div className="text-[11px] text-text-dim font-mono mt-0.5 truncate">
                                            {detailProject.director_anterior_email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Project Description */}
                            <div className="space-y-2">
                                <label className="section-label text-text-dim">Antecedentes & Descripción del Proyecto</label>
                                <div className="p-4 bg-bg-deep/50 rounded-xl border border-border-thin leading-relaxed text-xs text-text-dim whitespace-pre-wrap">
                                    {detailProject.descripcion || 'Este proyecto no cuenta con una descripción breve registrada en su postulación.'}
                                </div>
                            </div>

                            {/* Informative Note */}
                            <div className="p-4 rounded-xl border border-border-thin bg-surface/30 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-black text-text-main uppercase tracking-widest">
                                    <ShieldCheck size={14} className="text-brand" /> Respaldo Normativo Traversari
                                </div>
                                <p className="text-[11.5px] text-text-dim leading-relaxed">
                                    En base al Reglamento de Régimen Académico del IST Traversari, los proyectos inconclusos pueden ser adoptados por cualquier docente investigador del instituto que posea distributivo de horas de investigación disponible en el periodo académico vigente. Al completar la adopción, el sistema sincroniza automáticamente los metadatos correspondientes con el CACES para la evaluación institucional anual.
                                </p>
                            </div>
                        </div>

                        <footer className="p-4 bg-surface/50 border-t border-border-thin flex justify-between items-center gap-3">
                            <button
                                onClick={() => setDetailProject(null)}
                                className="btn-vercel-secondary text-xs uppercase py-2 cursor-pointer"
                            >
                                Cerrar Detalle
                            </button>

                            {isDocente && (
                                <button
                                    onClick={() => {
                                        setAdoptingProject(detailProject);
                                        setDetailProject(null);
                                    }}
                                    className="btn-vercel-primary text-xs uppercase py-2 px-6 cursor-pointer flex items-center gap-1.5"
                                >
                                    Adoptar Proyecto
                                    <ArrowRight size={13} />
                                </button>
                            )}
                        </footer>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ProjectAdoptionPage;
