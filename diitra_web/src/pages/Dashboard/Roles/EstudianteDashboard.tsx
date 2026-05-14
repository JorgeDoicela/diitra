import React from 'react';
import { Search, GraduationCap, Award, BookOpen, UserPlus, Star } from 'lucide-react';
import { BentoGrid, BentoCard } from '../../../components/Common/BentoGrid';
import { DashboardHeader } from '../Components/DashboardHeader';
import { useAuth } from '../../../api/AuthContext';

export const EstudianteDashboard: React.FC = () => {
    const { user } = useAuth();
    const firstName = user?.nombre_completo?.split(' ')[0] || 'Estudiante';

    return (
        <>
            <DashboardHeader 
                title={`Hola, ${firstName}`} 
                subtitle="Participa en proyectos de vanguardia, gana experiencia y construye tu perfil científico." 
                roleName="Estudiante Colaborador"
                actions={
                    <>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-bg-deep hover:bg-surface text-text-main px-4 md:px-5 py-2.5 md:py-2 rounded-md border border-border-thin text-[10px] font-bold uppercase tracking-widest transition-all">
                            <BookOpen size={14} />
                            <span>Recursos</span>
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-text-main hover:opacity-90 text-bg-deep px-4 md:px-6 py-2.5 md:py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all">
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
                    <div className="mt-4 p-4 rounded-lg bg-surface border border-border-thin border-dashed flex flex-col items-center justify-center text-center">
                        <Star size={24} className="text-text-main/20 mb-2" />
                        <p className="text-[10px] text-text-dim uppercase font-bold">No tienes participaciones activas</p>
                        <button className="mt-4 text-[9px] font-bold text-text-main underline decoration-text-main/30 underline-offset-4 uppercase tracking-widest">Postular a una vacante</button>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Mi Perfil" 
                    description="Puntuación acumulada"
                    icon={<GraduationCap size={14} />}
                >
                    <div className="mt-4">
                        <p className="text-4xl font-bold font-mono text-text-main tracking-tighter">1,250</p>
                        <p className="text-[10px] text-text-dim mt-2 uppercase font-medium">Investigador Bronce</p>
                    </div>
                </BentoCard>

                <BentoCard 
                    title="Certificados" 
                    description="Documentos validados"
                    icon={<Award size={14} />}
                >
                    <div className="mt-4 flex flex-col gap-1">
                        <p className="text-2xl font-bold font-mono text-text-main tracking-tighter">00</p>
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
                            <span key={tag} className="px-2 py-1 bg-surface border border-border-thin rounded-full text-[9px] font-bold text-text-main uppercase tracking-tighter">
                                {tag}
                            </span>
                        ))}
                    </div>
                </BentoCard>
            </BentoGrid>
        </>
    );
};
