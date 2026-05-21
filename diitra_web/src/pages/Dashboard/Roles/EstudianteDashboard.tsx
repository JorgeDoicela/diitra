import React from 'react';
import { Search, GraduationCap, Award, BookOpen, UserPlus, Star } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';
import { useNavigate } from 'react-router-dom';

export const EstudianteDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const firstName = user?.nombre_completo?.split(' ')[0] || 'Estudiante';

    return (
        <>
            <DashboardHeader 
                title={`Hola, ${firstName}`} 
                subtitle="Participa en proyectos de vanguardia, gana experiencia y construye tu perfil científico." 
                roleName="Estudiante Colaborador"
                actions={
                    <>
                        <button 
                            onClick={() => navigate('/convocatorias')}
                            className="btn-vercel-primary flex-1 md:flex-none"
                        >
                            <Search size={16} />
                            <span>Ver Convocatorias</span>
                        </button>
                    </>
                }
            />

            <BentoGrid className="px-2 animate-fade-up [animation-delay:200ms] pb-10">
                <BentoCard 
                    title="Mis Colaboraciones" 
                    description="Proyectos donde participas"
                    icon={<UserPlus size={14} />}
                    className="md:col-span-2"
                >
                    <div className="mt-4 empty-state">
                        <Star size={24} className="text-text-main/20 mb-2" />
                        <p className="text-[10px] text-text-dim uppercase font-bold">No tienes participaciones activas</p>
                        <button 
                            onClick={() => navigate('/convocatorias')}
                            className="btn-vercel-secondary mt-4"
                        >
                            Postular a una vacante
                        </button>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Mi Perfil" 
                    description="Puntuación acumulada"
                    icon={<GraduationCap size={14} />}
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
                >
                    <div className="mt-4 flex flex-wrap gap-2">
                        {['Metodología Ágil', 'Python for Science', 'Escritura APA 7', 'Gestión de Datos', 'IA Generativa'].map(tag => (
                            <span key={tag} className="badge-vercel">{tag}</span>
                        ))}
                    </div>
                </BentoCard>
            </BentoGrid>
        </>
    );
};
