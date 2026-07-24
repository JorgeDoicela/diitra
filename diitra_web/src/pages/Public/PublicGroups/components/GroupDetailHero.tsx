import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Layers, Users, FileText, BookOpen, Mail } from 'lucide-react';
import { formatNombre, formatFecha } from '../types';
import type { Group } from '../types';

interface GroupDetailHeroProps {
    selectedGroup: Group;
}

export const GroupDetailHero: React.FC<GroupDetailHeroProps> = ({ selectedGroup }) => {
    const navigate = useNavigate();

    const miembrosCount = selectedGroup.miembros?.length || 0;
    const proyectosCount = selectedGroup.proyectos?.length || 0;
    const emailContacto = selectedGroup.nombreCoordinador
        ? `${selectedGroup.nombreCoordinador.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".")}@istpet.edu.ec`
        : "investigacion@istpet.edu.ec";

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-8 animate-fade-up text-xs lg:-ml-24">
                <button
                    onClick={() => navigate('/grupos-investigacion')}
                    className="flex items-center gap-1.5 text-text-dim hover:text-text-main transition-colors group"
                >
                    <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                    Grupos de Investigación
                </button>
                <span className="text-text-dim/30">/</span>
                <span className="text-text-main/80 font-medium">{selectedGroup.siglas || selectedGroup.nombre}</span>
            </div>

            {/* Cabecera / Hero del Grupo */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-16 animate-fade-up lg:-ml-24 lg:-mr-24">
                {/* Izquierda (lg:col-span-7): Título y Métricas KPIs */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="space-y-4">
                        <p className="text-[10px] font-mono text-brand uppercase tracking-widest">{selectedGroup.tipoGrupo}</p>
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text-main leading-[0.95] max-w-2xl">
                            {selectedGroup.nombre}
                        </h1>
                    </div>

                    {/* Fila de Métricas / KPIs */}
                    <div className="flex flex-wrap gap-8 pt-4 border-t border-border-thin/30 select-none">
                        <div className="flex flex-col">
                            <span className="text-3xl font-extrabold text-text-main tracking-tight">{miembrosCount}</span>
                            <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">Miembros</span>
                        </div>
                        <div className="flex flex-col border-l border-border-thin/30 pl-8">
                            <span className="text-3xl font-extrabold text-text-main tracking-tight">{proyectosCount}</span>
                            <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">Proyectos</span>
                        </div>
                        <div className="flex flex-col border-l border-border-thin/30 pl-8">
                            <span className="text-3xl font-extrabold text-text-main tracking-tight">{selectedGroup.lineasNombres?.length || 0}</span>
                            <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">Líneas</span>
                        </div>
                    </div>
                </div>

                {/* Derecha (lg:col-span-5): Ficha de Datos del Grupo */}
                <div className="lg:col-span-5">
                    <div className="bento-card static p-6 space-y-6 bg-surface/40 backdrop-blur-md border border-border-thin shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                        <div className="grid grid-cols-2 gap-4 divide-x divide-border-thin/30">
                            <div className="flex items-start gap-2.5">
                                <Calendar size={14} className="text-text-dim mt-1 shrink-0" />
                                <div>
                                    <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-0.5">Fundación</p>
                                    <p className="text-sm font-semibold text-text-main">{formatFecha(selectedGroup.fechaCreacion)}</p>
                                </div>
                            </div>
                            <div className="pl-4 flex items-start gap-2.5">
                                <Layers size={14} className="text-text-dim mt-1 shrink-0" />
                                <div>
                                    <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-0.5">Categoría</p>
                                    <p className="text-sm font-semibold text-text-main">{selectedGroup.categoriaConsolidacion || 'En Formación'}</p>
                                </div>
                            </div>
                        </div>

                        {selectedGroup.nombreCoordinador && (
                            <div className="border-t border-border-thin/30 pt-4 flex items-start gap-2.5">
                                <Users size={14} className="text-text-dim mt-1 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-0.5">Coordinador Principal</p>
                                    <p className="text-sm font-semibold text-text-main truncate">{formatNombre(selectedGroup.nombreCoordinador)}</p>
                                    {selectedGroup.carreraCoordinador && <p className="text-xs text-text-dim mt-0.5">{selectedGroup.carreraCoordinador}</p>}
                                </div>
                            </div>
                        )}

                        {selectedGroup.resolucionAprobacion && (
                            <div className="border-t border-border-thin/30 pt-4 flex items-start gap-2.5">
                                <FileText size={14} className="text-text-dim mt-1 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-0.5">Resolución de Aprobación</p>
                                    <p className="text-xs font-mono text-text-main break-all">{selectedGroup.resolucionAprobacion}</p>
                                </div>
                            </div>
                        )}

                        {selectedGroup.carrerasNombres && selectedGroup.carrerasNombres.length > 0 && (
                            <div className="border-t border-border-thin/30 pt-4 flex items-start gap-2.5">
                                <BookOpen size={14} className="text-text-dim mt-1 shrink-0" />
                                <div>
                                    <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-2">Programas Académicos</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedGroup.carrerasNombres.map((c, i) => (
                                            <span key={i} className="badge-vercel badge-vercel-info text-[9px] font-mono px-2 py-0.5 uppercase tracking-wide">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-border-thin/30 pt-4 flex items-start gap-2.5">
                            <Mail size={14} className="text-text-dim mt-1 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-0.5">Contacto Oficial</p>
                                <a href={`mailto:${emailContacto}`} className="text-xs text-brand hover:underline block truncate font-medium">
                                    {emailContacto}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner de Portada Cinematográfica */}
            <div className="w-full h-64 sm:h-96 md:h-[450px] rounded-2xl overflow-hidden bg-surface/30 relative border border-border-thin select-none mb-24 animate-fade-up lg:-ml-24 lg:-mr-24">
                {selectedGroup.fotoUrl ? (
                    <img src={selectedGroup.fotoUrl.split(',')[0]} alt={selectedGroup.nombre} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full vercel-grid-fade bg-glow flex items-center justify-center relative overflow-hidden bg-surface/10 px-4">
                        <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-brand/10 blur-[90px] pointer-events-none" />
                        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-purple-500/10 blur-[90px] pointer-events-none" />

                        <span className="relative z-10 font-black text-3xl sm:text-5xl md:text-7xl lg:text-8xl tracking-[0.2em] font-mono select-none uppercase bg-clip-text text-transparent bg-gradient-to-b from-text-main to-text-dim/10 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.05)] pl-[0.2em] break-all text-center max-w-[90%]">
                            {selectedGroup.siglas || 'ISTPET'}
                        </span>
                    </div>
                )}
            </div>
        </>
    );
};
