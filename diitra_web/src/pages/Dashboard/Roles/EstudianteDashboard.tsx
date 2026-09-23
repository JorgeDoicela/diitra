import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserPlus, Star, ArrowRight, Folder, Lightbulb } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../../api/axios_config';
import { buildWorkspacePath } from '../../../core/documents/templateUrl';
import { ProximosEventosWidget } from '../../../components/Common/ProximosEventosWidget';
import { FullscreenLoader } from '../../../components/Common/FullscreenLoader';
import { getProjectProgress } from '../utils/projectProgress';

interface ProyectoResumen {
    uuid: string;
    titulo: string;
    estado: string;
    rol_en_proyecto?: string;
    total_informes?: number;
    informes_aprobados?: number;
    total_productos?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
}

export const EstudianteDashboard: React.FC = () => {
    const { user } = useAuth();
    const [colaboraciones, setColaboraciones] = useState<ProyectoResumen[]>([]);
    const [loading, setLoading] = useState(true);

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const firstName = user?.nombre_completo ? capitalize(user.nombre_completo.split(' ')[0]) : 'Estudiante';

    const lastFetchRef = useRef<number>(0);

    const fetchData = async (isInitial = false, silent = false) => {
        const startTime = Date.now();
        if (isInitial) {
            setLoading(true);
        }
        try {
            const myRes = await api.get('/projects/my');
            setColaboraciones(myRes.data);
            lastFetchRef.current = Date.now();
        } catch (e) {
            console.error('[DIITRA] Error al cargar datos del estudiante:', e);
        } finally {
            if (!silent && !isInitial) {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 600 - elapsed);
                if (remaining > 0) {
                    await new Promise(resolve => setTimeout(resolve, remaining));
                }
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(true, false);

        // Suscripción al bus reactivo en tiempo real (SignalR + Mutaciones locales)
        const handleProjectsChanged = () => {
            fetchData(false, true);
        };
        window.addEventListener('diitra-projects-changed', handleProjectsChanged);

        // Polling de respaldo inteligente cada 30 segundos (solo si la pestaña está visible)
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible' && Date.now() - lastFetchRef.current > 15000) {
                fetchData(false, true);
            }
        }, 30000);

        const handleFocus = () => {
            if (Date.now() - lastFetchRef.current > 15000) {
                fetchData(false, true);
            }
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('diitra-projects-changed', handleProjectsChanged);
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Filtrar para mostrar únicamente colaboraciones vigentes (excluyendo rechazados, anulados o borradores ajenos)
    const colaboracionesVigentes = useMemo(() => {
        return colaboraciones.filter(p => p.estado !== 'Rechazado' && p.estado !== 'Anulado' && p.estado !== 'Borrador');
    }, [colaboraciones]);

    return (
        <>
            <DashboardHeader 
                title={`Hola, ${firstName}`} 
                subtitle="Participa en proyectos de vanguardia, gana experiencia y construye tu perfil científico." 
                roleName="Estudiante Colaborador"
                actions={
                    <>
                        <Link
                            to="/investigacion/mis-proyectos"
                            className="btn-vercel-secondary flex-1 md:flex-none no-underline"
                        >
                            <Folder size={14} />
                            <span>Investigación</span>
                        </Link>
                        <Link
                            to="/innovacion"
                            className="btn-vercel-secondary flex-1 md:flex-none no-underline"
                        >
                            <Lightbulb size={14} />
                            <span>Innovación</span>
                        </Link>
                    </>
                }
            />

            {loading ? (
                <FullscreenLoader fullscreen={false} message="Cargando colaboraciones y proyectos..." />
            ) : (
                <BentoGrid className="md:!grid-rows-1 px-2 animate-fade-up [animation-delay:200ms] pb-10">
                    <BentoCard 
                        title="Mis Colaboraciones" 
                        description="Proyectos donde participas"
                        icon={<UserPlus size={14} />}
                        className="md:col-span-2"
                        isStatic={true}
                    >
                        {colaboracionesVigentes.length === 0 ? (
                            <div className="mt-4 empty-state">
                                <Star size={24} className="text-text-main/20 mb-2" />
                                <p className="text-[10px] text-text-dim uppercase font-semibold">No tienes participaciones activas</p>
                                <p className="text-[11px] text-text-dim mt-2 max-w-xs text-center">
                                    Contacta con un docente investigador para unirte a un proyecto de investigación.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3 max-h-[270px] overflow-y-auto pr-1">
                                {colaboracionesVigentes.map(p => {
                                    const progress = getProjectProgress(p);
                                    return (
                                        <Link 
                                            key={p.uuid}
                                            to={buildWorkspacePath('PROTOCOLO_INVESTIGACION', p.uuid, '', '/investigacion/mis-proyectos')}
                                            className="p-3 rounded-lg border border-border-thin bg-surface flex flex-col gap-2 group cursor-pointer hover:border-border-hover transition-all no-underline text-inherit"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-semibold text-text-main uppercase tracking-tight line-clamp-2 group-hover:text-brand transition-colors">
                                                        {p.titulo}
                                                    </p>
                                                </div>
                                                <span className={`badge-vercel ${progress.badgeClass} !py-0.5 !px-2 text-[9px] font-semibold uppercase tracking-wider shrink-0`}>
                                                    {progress.badgeLabel}
                                                </span>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between text-[10px] text-text-dim mb-1 font-mono">
                                                    <span>{progress.label}</span>
                                                    <span>{p.rol_en_proyecto || 'Semillerista'}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-brand rounded-full transition-all duration-500" 
                                                        style={{ width: `${progress.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </BentoCard>

                    <BentoCard 
                        title="Agenda Semanal" 
                        description="Próximos eventos normativos y del proyecto"
                        className="md:col-span-2"
                        isStatic={true}
                    >
                        <div className="mt-2">
                            <ProximosEventosWidget />
                        </div>
                    </BentoCard>
                </BentoGrid>
            )}
        </>
    );
};
