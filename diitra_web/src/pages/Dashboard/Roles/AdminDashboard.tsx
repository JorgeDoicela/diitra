import React, { useState, useEffect } from 'react';
import {
    Users, Activity, BarChart3,
    ClipboardList, Loader2, Megaphone, TrendingUp,
    UserPlus, Eye, Award, X
} from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios_config';

interface GlobalStats {
    total_proyectos: number;
    proyectos_borrador: number;
    proyectos_en_revision: number;
    proyectos_aprobados: number;
    proyectos_en_ejecucion: number;
    proyectos_finalizados: number;
    total_convocatorias_abiertas: number;
    total_investigadores_activos: number;
    total_productos_periodo: number;
    articulos_indexados: number;
    prototipos: number;
    ponencias: number;
    presupuesto_total_asignado: number;
    presupuesto_total_ejecutado: number;
    proyectos_por_estado: Array<{ estado: string; cantidad: number; color: string }>;
    actividad_reciente: Array<{
        tipo: string;
        descripcion: string;
        fecha: string;
        uuid?: string;
        estado?: string;
    }>;
}

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const firstName = user?.nombre_completo?.split(' ')[0] || 'Admin';
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Peer Review States
    const [projects, setProjects] = useState<any[]>([]);
    const [reviewers, setReviewers] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState({
        idRevisor: 0,
        fechaLimite: '',
        esExterno: false
    });
    const [selectedProjectReviews, setSelectedProjectReviews] = useState<any[]>([]);
    const [showReviewsModal, setShowReviewsModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/projects/stats');
            setStats(res.data);

            const projRes = await api.get('/projects');
            setProjects(projRes.data || []);

            const revRes = await api.get('/Admin/users?type=DOCENTE&pageSize=100');
            if (revRes.data?.items) {
                setReviewers(revRes.data.items);
            } else {
                setReviewers(revRes.data || []);
            }
        } catch (e) {
            console.error('[DIITRA] Error al cargar datos:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenAssignModal = (proj: any) => {
        setSelectedProject(proj);
        const firstValidReviewer = reviewers.find(r => r.id_usuario !== null && r.id_usuario !== undefined);
        setAssignForm({
            idRevisor: firstValidReviewer?.id_usuario || 0,
            fechaLimite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 días por defecto
            esExterno: false
        });
        setShowAssignModal(true);
    };

    const handleAssignReviewer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;

        try {
            await api.post('/PeerReviews/assign', {
                idProyecto: selectedProject.id_proyecto,
                idRevisor: Number(assignForm.idRevisor),
                fechaLimite: new Date(assignForm.fechaLimite).toISOString(),
                esExterno: assignForm.esExterno
            });
            setShowAssignModal(false);
            fetchData();
        } catch (error) {
            console.error('[DIITRA] Error al asignar revisor:', error);
        }
    };

    const handleViewReviews = async (proj: any) => {
        setSelectedProject(proj);
        try {
            const response = await api.get(`/PeerReviews/project/${proj.id_proyecto}`);
            setSelectedProjectReviews(response.data || []);
            setShowReviewsModal(true);
        } catch (error) {
            console.error('[DIITRA] Error al cargar rúbricas:', error);
        }
    };

    const ejecucionPorc = stats?.presupuesto_total_asignado
        ? Math.min(100, ((stats.presupuesto_total_ejecutado ?? 0) / stats.presupuesto_total_asignado) * 100)
        : 0;

    return (
        <>
            <DashboardHeader
                title={`Panel de Control, ${firstName}`}
                subtitle="Supervisión global del DIITRA · Investigación, Innovación y Cumplimiento CACES."
                roleName="Director / Administrador"
                actions={
                    <>
                        <button
                            onClick={() => navigate('/usuarios')}
                            className="btn-vercel-secondary flex-1 md:flex-none"
                        >
                            <Users size={14} />
                            <span>Gestionar Usuarios</span>
                        </button>
                        <button
                            onClick={() => navigate('/convocatorias')}
                            className="btn-vercel-primary flex-1 md:flex-none"
                        >
                            <Megaphone size={16} />
                            <span>Convocatorias</span>
                        </button>
                    </>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-text-dim" size={24} />
                </div>
            ) : (
                <>
                    <BentoGrid className="px-2 animate-fade-up [animation-delay:200ms] pb-10">

                    {/* Embudo de proyectos */}
                    <BentoCard
                        title="Proyectos Institucionales"
                        description="Estado del pipeline de investigación"
                        icon={<ClipboardList size={14} />}
                        className="md:col-span-2"
                    >
                        <div className="mt-6 space-y-2">
                            {stats?.proyectos_por_estado.map((est) => (
                                <div key={est.estado} className="flex items-center gap-3">
                                    <span className="text-[10px] text-text-dim uppercase tracking-wide w-24 shrink-0">
                                        {est.estado}
                                    </span>
                                    <div className="flex-1 h-2 bg-border-thin rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: stats.total_proyectos
                                                    ? `${(est.cantidad / stats.total_proyectos) * 100}%`
                                                    : '0%',
                                                backgroundColor: est.color
                                            }}
                                        />
                                    </div>
                                    <span className="stat-number--sm text-text-main font-mono w-6 text-right">
                                        {est.cantidad}
                                    </span>
                                </div>
                            ))}
                            <div className="divider-vercel my-3" />
                            <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-text-dim">Total proyectos</span>
                                <span className="font-bold text-text-main">{stats?.total_proyectos ?? 0}</span>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Convocatorias abiertas */}
                    <BentoCard
                        title="Convocatorias Activas"
                        description="Abiertas para postulación"
                        icon={<Megaphone size={14} />}
                    >
                        <div className="mt-4">
                            <p className={`stat-number ${(stats?.total_convocatorias_abiertas ?? 0) > 0 ? 'text-success' : 'text-text-dim'}`}>
                                {stats?.total_convocatorias_abiertas ?? 0}
                            </p>
                            <p className="text-[10px] text-text-dim mt-2 uppercase tracking-wide">
                                {(stats?.total_convocatorias_abiertas ?? 0) === 1 ? 'convocatoria abierta' : 'convocatorias abiertas'}
                            </p>
                        </div>
                    </BentoCard>

                    {/* Producción científica */}
                    <BentoCard
                        title="Producción Científica"
                        description="Artículos, prototipos y ponencias"
                        icon={<BarChart3 size={14} />}
                    >
                        <div className="mt-4 space-y-3">
                            <div className="flex justify-between text-[11px]">
                                <span className="text-text-dim">Artículos indexados</span>
                                <span className="font-bold text-text-main font-mono">{stats?.articulos_indexados ?? 0}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-text-dim">Prototipos</span>
                                <span className="font-bold text-text-main font-mono">{stats?.prototipos ?? 0}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-text-dim">Ponencias</span>
                                <span className="font-bold text-text-main font-mono">{stats?.ponencias ?? 0}</span>
                            </div>
                            <div className="divider-vercel" style={{ marginTop: '0.5rem', marginBottom: '0' }} />
                            <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-text-dim">Total productos</span>
                                <span className="font-bold text-text-main">{stats?.total_productos_periodo ?? 0}</span>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Ejecución presupuestaria global */}
                    <BentoCard
                        title="Ejecución Presupuestaria"
                        description="Fondos asignados vs ejecutados (global)"
                        icon={<TrendingUp size={14} />}
                        className="md:col-span-2"
                    >
                        <div className="mt-6">
                            <div className="flex items-end justify-between mb-3">
                                <div>
                                    <p className="stat-number text-text-main">
                                        {ejecucionPorc.toFixed(1)}%
                                    </p>
                                    <p className="text-[10px] text-text-dim mt-1 uppercase tracking-wide">
                                        ejecutado del total asignado
                                    </p>
                                </div>
                                <div className="text-right text-[10px] font-mono text-text-dim">
                                    <p>${(stats?.presupuesto_total_ejecutado ?? 0).toLocaleString('es-EC')}</p>
                                    <p className="text-text-dim opacity-60">de ${(stats?.presupuesto_total_asignado ?? 0).toLocaleString('es-EC')}</p>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-border-thin rounded-full overflow-hidden">
                                <div
                                    className="progress-fill progress-fill--success"
                                    style={{ width: `${ejecucionPorc}%` }}
                                />
                            </div>
                        </div>
                    </BentoCard>

                    {/* Actividad reciente */}
                    <BentoCard
                        title="Actividad Institucional Reciente"
                        description="Últimos eventos en el sistema DIITRA"
                        icon={<Activity size={14} />}
                        className="md:col-span-4"
                    >
                        <div className="mt-4 space-y-2">
                            {(!stats?.actividad_reciente || stats.actividad_reciente.length === 0) ? (
                                <div className="empty-state py-4">
                                    <p className="text-[11px] text-text-dim">
                                        No hay actividad reciente registrada.
                                    </p>
                                </div>
                            ) : (
                                stats.actividad_reciente.slice(0, 6).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-deep border border-border-thin">
                                        <div className={`dot ${
                                            item.tipo === 'informe' ? 'dot-brand' : 'dot-info'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-text-main truncate">{item.descripcion}</p>
                                            <p className="text-[9px] text-text-dim uppercase tracking-wide">
                                                {item.tipo} · {new Date(item.fecha).toLocaleDateString('es-EC')}
                                            </p>
                                        </div>
                                        {item.estado && (
                                            <span className="status-tag text-text-dim border-border-thin">
                                                {item.estado}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </BentoCard>

                </BentoGrid>

                {/* Consola de Arbitraje Científico (Peer Review) */}
                <section className="mt-8 px-2 animate-fade-up [animation-delay:300ms]">
                    <div className="section-label mb-2">
                        <Award size={12} className="text-text-main" />
                        <span>Comité Institucional de Selección</span>
                    </div>
                    <h3 className="text-3xl font-bold text-text-main tracking-tighter uppercase mb-6">Arbitraje y Evaluación por Pares</h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 1. Proyectos Pendientes de Arbitraje */}
                        <div className="bento-card p-6 flex flex-col h-[500px]">
                            <header className="mb-4">
                                <h4 className="text-lg font-bold text-text-main uppercase tracking-tight">Proyectos Postulados</h4>
                                <p className="text-xs text-text-dim">Proyectos en estado 'Enviado' o 'En Revisión' listos para asignar evaluador.</p>
                            </header>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {projects.filter(p => p.estado === 'Enviado' || p.estado === 'En Revisión').length === 0 ? (
                                    <div className="empty-state h-full">
                                        <p className="text-xs text-text-dim font-bold uppercase tracking-wider">No hay proyectos postulados pendientes</p>
                                    </div>
                                ) : (
                                    projects.filter(p => p.estado === 'Enviado' || p.estado === 'En Revisión').map((proj) => (
                                        <div key={proj.uuid} className="p-4 rounded-lg bg-bg-deep border border-border-thin hover:border-border-hover transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`status-tag ${
                                                        proj.estado === 'Enviado' ? 'badge-vercel-warning' : 'badge-vercel-info'
                                                    }`}>
                                                        {proj.estado}
                                                    </span>
                                                    {proj.codigo_institucional && (
                                                        <span className="text-[9px] text-text-dim font-mono">{proj.codigo_institucional}</span>
                                                    )}
                                                </div>
                                                <h5 className="text-sm font-bold text-text-main truncate">{proj.titulo}</h5>
                                                <p className="text-[10px] text-text-dim truncate">Línea: {proj.linea_investigacion || 'General'} · TRL Meta: {proj.trl_meta || 1}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleOpenAssignModal(proj)}
                                                className="btn-vercel-secondary shrink-0"
                                            >
                                                <UserPlus size={12} />
                                                <span>Asignar Par</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 2. Historial de Evaluación y Calificación */}
                        <div className="bento-card p-6 flex flex-col h-[500px]">
                            <header className="mb-4">
                                <h4 className="text-lg font-bold text-text-main uppercase tracking-tight">Dictámenes y Calificaciones</h4>
                                <p className="text-xs text-text-dim">Puntajes finales otorgados y rúbricas auditables (CACES Compliance).</p>
                            </header>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {projects.filter(p => ['En Revisión', 'Aprobado', 'Rechazado'].includes(p.estado)).length === 0 ? (
                                    <div className="empty-state h-full">
                                        <p className="text-xs text-text-dim font-bold uppercase tracking-wider">No hay evaluaciones registradas</p>
                                    </div>
                                ) : (
                                    projects.filter(p => ['En Revisión', 'Aprobado', 'Rechazado'].includes(p.estado)).map((proj) => (
                                        <div key={proj.uuid} className="p-4 rounded-lg bg-bg-deep border border-border-thin hover:border-border-hover transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`status-tag ${
                                                        proj.estado === 'Aprobado' ? 'badge-vercel-success' : 
                                                        proj.estado === 'Rechazado' ? 'badge-vercel-error' :
                                                        'badge-vercel-info'
                                                    }`}>
                                                        {proj.estado}
                                                    </span>
                                                    <span className="text-[9px] text-text-dim font-mono">Calificación: {proj.puntaje_evaluacion !== null && proj.puntaje_evaluacion !== undefined ? `${proj.puntaje_evaluacion}/100` : 'Pendiente'}</span>
                                                </div>
                                                <h5 className="text-sm font-bold text-text-main truncate">{proj.titulo}</h5>
                                                <p className="text-[10px] text-text-dim truncate">Presupuesto: ${proj.presupuesto_total?.toLocaleString() ?? 0} · TRL Actual: {proj.trl_actual || 1}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleViewReviews(proj)}
                                                className="btn-vercel-secondary shrink-0"
                                            >
                                                <Eye size={12} />
                                                <span>Ver Detalle</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* MODAL: ASIGNAR REVISOR */}
                {showAssignModal && selectedProject && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <header className="modal-header">
                                <div>
                                    <h3 className="text-xl font-bold tracking-tighter text-text-main uppercase">
                                        Asignación de Par Evaluador
                                    </h3>
                                    <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest">Proyecto: {selectedProject.titulo}</p>
                                </div>
                                <button onClick={() => setShowAssignModal(false)} className="p-2 text-text-dim hover:text-text-main transition-colors">
                                    <X size={20} />
                                </button>
                            </header>

                            <form onSubmit={handleAssignReviewer} className="modal-body space-y-6">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">Seleccionar Revisor (Docente)</label>
                                    <select 
                                        className="input-vercel"
                                        value={assignForm.idRevisor}
                                        onChange={(e) => setAssignForm({ ...assignForm, idRevisor: Number(e.target.value) })}
                                    >
                                        {reviewers
                                            .filter((rev) => rev.id_usuario !== null && rev.id_usuario !== undefined)
                                            .map((rev) => (
                                                <option key={rev.id_usuario} value={rev.id_usuario}>
                                                    {rev.nombre_completo} ({rev.email})
                                                </option>
                                            ))}
                                        {reviewers.filter((rev) => rev.id_usuario !== null && rev.id_usuario !== undefined).length === 0 && (
                                            <option value={0}>No hay revisores disponibles</option>
                                        )}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">Fecha Límite</label>
                                        <input 
                                            type="date"
                                            className="input-vercel"
                                            value={assignForm.fechaLimite}
                                            onChange={(e) => setAssignForm({ ...assignForm, fechaLimite: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">Tipo de Arbitraje</label>
                                        <div className="flex items-center h-11">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-border-thin bg-surface text-text-main accent-text-main"
                                                    checked={assignForm.esExterno}
                                                    onChange={(e) => setAssignForm({ ...assignForm, esExterno: e.target.checked })}
                                                />
                                                <span className="text-xs text-text-main font-bold uppercase tracking-wider">Evaluador Externo</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer" style={{ margin: '0 -1.5rem' }}>
                                    <button 
                                        type="button"
                                        onClick={() => setShowAssignModal(false)}
                                        className="btn-vercel-secondary"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="btn-vercel-primary"
                                    >
                                        Confirmar Asignación
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL: VER EVALUACIONES */}
                {showReviewsModal && selectedProject && (
                    <div className="modal-overlay">
                        <div className="modal-card modal-card--lg" style={{ maxHeight: '85vh' }}>
                            <header className="modal-header">
                                <div>
                                    <h3 className="text-xl font-bold tracking-tighter text-text-main uppercase">
                                        Dictámenes de Evaluación por Pares
                                    </h3>
                                    <p className="text-[9px] text-text-dim font-mono uppercase tracking-widest">Proyecto: {selectedProject.titulo}</p>
                                </div>
                                <button onClick={() => setShowReviewsModal(false)} className="p-2 text-text-dim hover:text-text-main transition-colors">
                                    <X size={20} />
                                </button>
                            </header>

                            <div className="modal-body space-y-6">
                                {selectedProjectReviews.length === 0 ? (
                                    <p className="text-xs text-text-dim py-8 text-center uppercase font-bold tracking-wider">No se han registrado evaluaciones para este proyecto.</p>
                                ) : (
                                    selectedProjectReviews.map((rev, i) => (
                                        <div key={i} className="p-4 rounded bg-surface/10 border border-border-thin space-y-4">
                                            <div className="flex justify-between items-center border-b border-border-thin pb-2">
                                                <div>
                                                    <p className="text-xs text-text-main font-bold uppercase">Revisor ID: {rev.id_revisor} {rev.es_externo && <span className="text-info font-bold ml-2">[EXTERNO]</span>}</p>
                                                    <p className="text-[9px] text-text-dim uppercase tracking-wider">Límite: {new Date(rev.fecha_limite).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`status-tag ${
                                                    rev.estado === 'Completada' ? 'badge-vercel-success' : 'badge-vercel-warning'
                                                }`}>
                                                    {rev.estado}
                                                </span>
                                            </div>

                                            {rev.estado === 'Completada' && (
                                                <div className="space-y-4">
                                                    <div className="rounded bg-surface/20 p-3">
                                                        <p className="text-[10px] section-label text-text-dim" style={{ marginBottom: '0.25rem' }}>Dictamen General:</p>
                                                        <p className="text-xs text-text-main italic font-medium leading-relaxed">"{rev.observaciones_gral || 'Sin observaciones'}"</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <footer className="modal-footer">
                                <button 
                                    onClick={() => setShowReviewsModal(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cerrar Ventana
                                </button>
                            </footer>
                        </div>
                    </div>
                )}
                </>
            )}
        </>
    );
};
