import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Group } from '../types';

interface LineaStat {
    nombre: string;
    groupsCount: number;
    projectsCount: number;
}

interface PublicGroupsImpactProps {
    groups: Group[];
    lineasStats: LineaStat[];
    totalProyectos: number;
}

export const PublicGroupsImpact: React.FC<PublicGroupsImpactProps> = ({
    groups,
    lineasStats,
    totalProyectos
}) => {
    return (
        <section id="impacto" className="scroll-mt-24 border-t border-border-thin/40 pt-24 lg:-ml-24 lg:-mr-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                <div className="lg:col-span-5 space-y-8">
                    <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">Investigación aplicada</p>
                    <h2 className="text-3xl md:text-[44px] font-bold tracking-tighter text-text-main leading-tight">
                        Transformación a través del conocimiento
                    </h2>
                    <p className="text-text-dim text-sm leading-relaxed">
                        Los grupos del ISTPET se organizan en torno a líneas de investigación que responden a las necesidades productivas y sociales del Ecuador, generando patentes, publicaciones científicas y soluciones tecnológicas de aplicación real.
                    </p>
                    <div className="space-y-6 pt-2">
                        {[
                            { title: 'Acreditación CACES', desc: 'Cumplimiento del modelo de evaluación para institutos tecnológicos en I+D+i.' },
                            { title: 'Desarrollo tecnológico', desc: 'Proyectos en ciberseguridad, energías renovables, desarrollo de software y biotecnología.' },
                            { title: 'Propiedad intelectual', desc: 'Registro de patentes y derechos de autor a través del SENADI.' },
                        ].map(({ title, desc }) => (
                            <div key={title}>
                                <h4 className="text-sm font-semibold text-text-main mb-1">{title}</h4>
                                <p className="text-xs text-text-dim leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panel derecha */}
                <div className="lg:col-span-7 bento-card static bg-surface/10 divide-y divide-border-thin/50 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                    <div className="px-6 py-4 flex items-center justify-between bg-surface/20">
                        <span className="text-xs font-mono text-text-dim uppercase tracking-wider">// Líneas de Investigación</span>
                        <span className="badge-vercel badge-vercel-success text-[9px] font-mono uppercase tracking-wide">Investigación</span>
                    </div>
                    {lineasStats.map((linea) => {
                        const pct = Math.min(100, (linea.projectsCount / Math.max(1, totalProyectos)) * 100);
                        return (
                            <div key={linea.nombre} className="px-6 py-5 hover:bg-surface/30 transition-all cursor-default group/impacto">
                                <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-sm font-semibold text-text-main truncate max-w-[70%] group-hover/impacto:text-brand transition-colors">{linea.nombre}</span>
                                    <span className="text-xs font-mono font-medium text-text-dim">
                                        {linea.projectsCount} {linea.projectsCount === 1 ? 'proyecto' : 'proyectos'} · {linea.groupsCount} {linea.groupsCount === 1 ? 'grupo' : 'grupos'}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-surface-hover border border-border-thin rounded-full overflow-hidden p-[1px]">
                                    <div className="h-full bg-gradient-to-r from-brand/60 to-brand rounded-full transition-all duration-700" style={{ width: `${Math.max(8, pct)}%` }} />
                                </div>
                            </div>
                        );
                    })}
                    {groups.length === 0 && (
                        <div className="px-6 py-8 text-sm text-text-dim flex items-center gap-2 justify-center font-mono">
                            <Loader2 size={12} className="animate-spin text-brand" /> Sincronizando datos...
                        </div>
                    )}
                    <div className="px-6 py-4 text-xs font-semibold text-text-dim bg-surface/15 font-mono">
                        {totalProyectos} PROYECTOS REGISTRADOS EN {groups.length} GRUPOS ACTIVOS
                    </div>
                </div>
            </div>
        </section>
    );
};
