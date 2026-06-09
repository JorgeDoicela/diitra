import React, { useState, useEffect } from 'react';
import { GraduationCap, Award, BookOpen, UserPlus, Star, ArrowRight, Loader2 } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios_config';
import { buildWorkspacePath } from '../../../core/documents/templateUrl';

interface ProyectoResumen {
    uuid: string;
    titulo: string;
    estado: string;
    linea_investigacion?: string;
    rol_en_proyecto?: string;
}

export const EstudianteDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [colaboraciones, setColaboraciones] = useState<ProyectoResumen[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const firstName = user?.nombre_completo ? capitalize(user.nombre_completo.split(' ')[0]) : 'Estudiante';

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [myRes, statsRes] = await Promise.all([
                    api.get('/projects/my'),
                    api.get('/projects/stats')
                ]);
                setColaboraciones(myRes.data);
                setStats(statsRes.data);
            } catch (e) {
                console.error('[DIITRA] Error al cargar datos del estudiante:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Puntuación acumulada: base de 100 puntos + 250 por proyecto activo + 500 por producto registrado
    const activeProjectsCount = stats?.mis_proyectos_activos ?? 0;
    const productsCount = stats?.mis_productos_registrados ?? 0;
    const score = 100 + (activeProjectsCount * 250) + (productsCount * 500);

    let tier = "Semillero Iniciante";
    if (score >= 1000) {
        tier = "Investigador Oro";
    } else if (score >= 500) {
        tier = "Investigador Plata";
    } else if (score >= 250) {
        tier = "Investigador Bronce";
    }

    // Certificados: proyectos finalizados
    const certificadosCount = colaboraciones.filter(p => p.estado === 'Finalizado').length;
    // Próximo proyecto en curso
    const activeProjects = colaboraciones.filter(p => p.estado === 'En Ejecución');
    const nextProjectTitle = activeProjects.length > 0 ? activeProjects[0].titulo : 'Ninguno en curso';

    // Generar ruta de aprendizaje dinámica basada en líneas de investigación de sus proyectos
    const getDynamicSkills = () => {
        if (colaboraciones.length === 0) {
            return [
                { name: 'Metodología Ágil', color: 'badge-vercel-info' },
                { name: 'Python for Science', color: 'badge-vercel-violet' },
                { name: 'Escritura APA 7', color: 'badge-vercel-warning' },
                { name: 'Gestión de Datos', color: 'badge-vercel-success' },
                { name: 'IA Generativa', color: 'badge-vercel-violet' }
            ];
        }

        const skills = new Set<string>();
        const colors = ['badge-vercel-info', 'badge-vercel-violet', 'badge-vercel-warning', 'badge-vercel-success', 'badge-vercel-violet'];

        colaboraciones.forEach(p => {
            if (p.linea_investigacion) {
                skills.add(p.linea_investigacion);
            }
        });

        // Habilidades generales complementarias
        skills.add('Metodología de Investigación');
        skills.add('Escritura APA 7');

        return Array.from(skills).slice(0, 5).map((name, i) => ({
            name,
            color: colors[i % colors.length]
        }));
    };

    const dynamicSkills = getDynamicSkills();

    return (
        <>
            <DashboardHeader 
                title={`Hola, ${firstName}`} 
                subtitle="Participa en proyectos de vanguardia, gana experiencia y construye tu perfil científico." 
                roleName="Estudiante Colaborador"
            />

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-text-dim" size={24} />
                </div>
            ) : (
                <BentoGrid className="px-2 animate-fade-up [animation-delay:200ms] pb-10">
                    <BentoCard 
                        title="Mis Colaboraciones" 
                        description="Proyectos donde participas"
                        icon={<UserPlus size={14} />}
                        className="md:col-span-2"
                        isStatic={true}
                    >
                        {colaboraciones.length === 0 ? (
                            <div className="mt-4 empty-state">
                                <Star size={24} className="text-text-main/20 mb-2" />
                                <p className="text-[10px] text-text-dim uppercase font-semibold">No tienes participaciones activas</p>
                                <p className="text-[11px] text-text-dim mt-2 max-w-xs text-center">
                                    Contacta con un docente investigador para unirte a un proyecto de investigación.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                {colaboraciones.map(p => (
                                    <div 
                                        key={p.uuid}
                                        onClick={() => navigate(buildWorkspacePath('PROTOCOLO_INVESTIGACION', p.uuid))}
                                        className="p-3 rounded-lg border border-border-thin bg-surface flex justify-between items-center group cursor-pointer hover:border-border-hover transition-all"
                                    >
                                        <div className="min-w-0 flex-1 pr-2">
                                            <p className="text-[10px] font-semibold text-text-main uppercase tracking-tighter truncate">{p.titulo}</p>
                                            <p className="text-[9px] text-text-dim mt-1">
                                                Rol: {p.rol_en_proyecto || 'Co-Investigador (Estudiante)'} · {p.estado}
                                            </p>
                                        </div>
                                        <ArrowRight size={12} className="text-text-dim group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </BentoCard>

                    <BentoCard 
                        title="Mi Perfil" 
                        description="Puntuación acumulada"
                        icon={<GraduationCap size={14} />}
                        isStatic={true}
                    >
                        <div className="mt-4">
                            <p className="stat-number">{score.toLocaleString('es-EC')}</p>
                            <p className="text-[10px] text-text-dim mt-2 uppercase font-medium">{tier}</p>
                        </div>
                    </BentoCard>

                    <BentoCard 
                        title="Certificados" 
                        description="Documentos validados"
                        icon={<Award size={14} />}
                        isStatic={true}
                    >
                        <div className="mt-4 flex flex-col gap-1">
                            <p className="stat-number stat-number--sm">{String(certificadosCount).padStart(2, '0')}</p>
                            <p className="text-[9px] text-text-dim mt-4 truncate" title={nextProjectTitle !== 'Ninguno en curso' ? `Próximo: Finalización ${nextProjectTitle}` : 'Ningún proyecto en curso'}>
                                {nextProjectTitle !== 'Ninguno en curso' ? `Próximo: Finalización ${nextProjectTitle.length > 25 ? nextProjectTitle.substring(0, 25) + '...' : nextProjectTitle}` : 'Ninguno en curso'}
                            </p>
                        </div>
                    </BentoCard>

                    <BentoCard 
                        title="Ruta de Aprendizaje" 
                        description="Habilidades requeridas por el instituto"
                        icon={<BookOpen size={14} />}
                        className="md:col-span-4"
                        isStatic={true}
                    >
                        <div className="mt-4 flex flex-wrap gap-2">
                            {dynamicSkills.map(tag => (
                                <span key={tag.name} className={`badge-vercel ${tag.color} !py-1 !px-3 text-xs font-semibold`}>
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    </BentoCard>
                </BentoGrid>
            )}
        </>
    );
};
