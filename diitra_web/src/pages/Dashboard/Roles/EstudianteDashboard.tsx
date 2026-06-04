import React from 'react';
import { GraduationCap, Award, BookOpen, UserPlus, Star } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';

export const EstudianteDashboard: React.FC = () => {
    const { user } = useAuth();
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const firstName = user?.nombre_completo ? capitalize(user.nombre_completo.split(' ')[0]) : 'Estudiante';

    return (
        <>
            <DashboardHeader 
                title={`Hola, ${firstName}`} 
                subtitle="Participa en proyectos de vanguardia, gana experiencia y construye tu perfil científico." 
                roleName="Estudiante Colaborador"
            />

            <BentoGrid className="px-2 animate-fade-up [animation-delay:200ms] pb-10">
                <BentoCard 
                    title="Mis Colaboraciones" 
                    description="Proyectos donde participas"
                    icon={<UserPlus size={14} />}
                    className="md:col-span-2"
                    isStatic={true}
                >
                    <div className="mt-4 empty-state">
                        <Star size={24} className="text-text-main/20 mb-2" />
                        <p className="text-[10px] text-text-dim uppercase font-semibold">No tienes participaciones activas</p>
                        <p className="text-[11px] text-text-dim mt-2 max-w-xs text-center">
                            Contacta con un docente investigador para unirte a un proyecto de investigación.
                        </p>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Mi Perfil" 
                    description="Puntuación acumulada"
                    icon={<GraduationCap size={14} />}
                    isStatic={true}
                >
                    <div className="mt-4">
                        <p className="stat-number">1,250</p>
                        <p className="text-[10px] text-text-dim mt-2 uppercase font-medium">Investigador Bronce</p>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Certificados" 
                    description="Documentos validados"
                    icon={<Award size={14} />}
                    isStatic={true}
                >
                    <div className="mt-4 flex flex-col gap-1">
                        <p className="stat-number stat-number--sm">00</p>
                        <p className="text-[9px] text-text-dim mt-4">Próximo: Finalización Proyecto IA</p>
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
                        {[
                            { name: 'Metodología Ágil', color: 'badge-vercel-info' },
                            { name: 'Python for Science', color: 'badge-vercel-violet' },
                            { name: 'Escritura APA 7', color: 'badge-vercel-warning' },
                            { name: 'Gestión de Datos', color: 'badge-vercel-success' },
                            { name: 'IA Generativa', color: 'badge-vercel-violet' }
                        ].map(tag => (
                            <span key={tag.name} className={`badge-vercel ${tag.color} !py-1 !px-3 text-xs font-semibold`}>
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </BentoCard>
            </BentoGrid>
        </>
    );
};

