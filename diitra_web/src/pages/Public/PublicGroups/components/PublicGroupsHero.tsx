import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Loader2 } from 'lucide-react';
import { estadoColor } from '../types';
import type { Group } from '../types';

interface PublicGroupsHeroProps {
    heroRef: React.RefObject<HTMLDivElement>;
    handleHeroMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    currentTheme?: 'dark' | 'light';
    groups: Group[];
    totalMiembros: number;
    totalProyectos: number;
    loading: boolean;
}

export const PublicGroupsHero: React.FC<PublicGroupsHeroProps> = ({
    heroRef,
    handleHeroMouseMove,
    currentTheme,
    groups,
    totalMiembros,
    totalProyectos,
    loading
}) => {
    return (
        <section
            ref={heroRef}
            onMouseMove={handleHeroMouseMove}
            className="min-h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-7.5rem)] flex flex-col justify-between pt-4 pb-2 relative group"
        >
            {/* Cursor glow sutil */}
            <div
                className="absolute pointer-events-none rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    left: 'var(--mouse-x)',
                    top: 'var(--mouse-y)',
                    width: '500px',
                    height: '500px',
                    transform: 'translate(-50%, -50%)',
                    background: currentTheme === 'dark'
                        ? 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)'
                        : 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 65%)',
                    zIndex: 0,
                }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto relative z-10">
                {/* Texto izquierda */}
                <div className="lg:col-span-5 space-y-7 animate-fade-up lg:-ml-24">
                    <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
                        Tecnológico Traversari — ISTPET
                    </div>
                    <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[72px] font-normal text-text-main tracking-tighter leading-[0.85]">
                        Grupos de <br />Investigación
                    </h1>
                    <p className="text-text-dim text-sm leading-relaxed max-w-sm">
                        Equipos académicos que generan conocimiento, desarrollan tecnología e impulsan la innovación en el Instituto Superior Tecnológico Traversari.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <a
                            href="#catalogo"
                            className="flex items-center justify-center gap-2 bg-text-main text-bg-deep px-6 py-3 rounded-md text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-sm"
                        >
                            Ver grupos <ArrowRight size={12} />
                        </a>
                        <a
                            href="#impacto"
                            className="flex items-center justify-center gap-2 bg-transparent text-text-main px-6 py-3 rounded-md border border-border-thin text-[11px] font-semibold uppercase tracking-widest hover:bg-surface-hover/40 hover:border-border-hover transition-all"
                        >
                            Sobre la investigación
                        </a>
                    </div>
                </div>

                {/* Bloque derecha */}
                <div className="lg:col-span-7 lg:pl-12 animate-fade-up" style={{ animationDelay: '100ms' }}>
                    <div className="bento-card static bg-surface/20 backdrop-blur-sm overflow-hidden border border-border-thin shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                        <div className="grid grid-cols-3 divide-x divide-border-thin/30 border-b border-border-thin/50">
                            {[
                                { label: 'Grupos activos', value: groups.length > 0 ? groups.length : '—' },
                                { label: 'Investigadores', value: totalMiembros > 0 ? totalMiembros : '—' },
                                { label: 'Proyectos', value: totalProyectos > 0 ? totalProyectos : '—' },
                            ].map(({ label, value }) => (
                                <div key={label} className="px-6 py-8 text-center bg-surface/10">
                                    <div className="text-3xl font-extrabold text-text-main tabular-nums mb-1 tracking-tight">{value}</div>
                                    <div className="text-[10px] text-text-dim uppercase tracking-wider font-mono">{label}</div>
                                </div>
                            ))}
                        </div>

                        {groups.length > 0 && (
                            (() => {
                                const featuredProjects = groups
                                    .flatMap(g => (g.proyectos || []).map(p => ({ ...p, grupoSiglas: g.siglas, grupoUuid: g.uuid })))
                                    .slice(0, 3);

                                if (featuredProjects.length === 0) return null;

                                return (
                                    <div className="divide-y divide-border-thin/30 bg-surface/5">
                                        <div className="px-6 py-3.5 bg-surface/10 flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">// Proyectos Destacados</span>
                                            <span className="text-[9px] font-mono text-brand uppercase tracking-widest">Actividad</span>
                                        </div>
                                        {featuredProjects.map((p) => (
                                            <Link
                                                key={p.uuid}
                                                to={`/grupos-investigacion/${p.grupoUuid}`}
                                                className="flex items-center justify-between px-6 py-4 hover:bg-surface-hover/30 transition-all cursor-pointer group/destacado"
                                            >
                                                <div className="min-w-0 pr-4">
                                                    <p className="text-sm font-semibold text-text-main leading-snug truncate group-hover/destacado:text-brand transition-colors">{p.titulo}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full border border-border-thin/30 uppercase tracking-wider text-brand bg-brand/5">
                                                            {p.grupoSiglas || 'PROYECTO'}
                                                        </span>
                                                        <span className={`text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full border border-border-thin/30 uppercase tracking-wider ${estadoColor(p.estado)} bg-surface/15`}>
                                                            {p.estado}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className="text-text-dim/40 group-hover/destacado:text-text-main group-hover/destacado:translate-x-0.5 transition-all shrink-0" />
                                            </Link>
                                        ))}
                                        <div className="px-6 py-4 border-t border-border-thin/30 bg-surface/10">
                                            <a href="#catalogo" className="text-xs text-brand font-medium hover:underline transition-colors flex items-center gap-1.5 w-fit">
                                                Explorar todos los grupos y proyectos <ArrowRight size={12} />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })()
                        )}

                        {loading && groups.length === 0 && (
                            <div className="px-6 py-10 flex items-center gap-2 text-text-dim justify-center bg-surface/5">
                                <Loader2 size={14} className="animate-spin text-brand" />
                                <span className="text-xs font-medium font-mono">Sincronizando catálogo...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ticker logos institucionales */}
            <div className="w-full pt-12 pb-4 flex flex-wrap justify-center lg:justify-between items-center gap-x-8 gap-y-5 text-black dark:text-white select-none lg:-ml-24 lg:-mr-24 relative z-10">
                {[
                    <span key="se" className="font-sans font-extrabold tracking-tight text-[14px]">SENESCYT</span>,
                    <span key="ces" className="font-serif font-bold italic tracking-wide text-[16px]">CES</span>,
                    <span key="ca" className="font-mono font-bold tracking-tighter text-[12px]">CACES</span>,
                    <span key="sn" className="font-sans font-light tracking-[0.10em] text-[14px]">SENA<strong className="font-bold">DI</strong></span>,
                    <span key="si" className="font-sans font-black tracking-tight text-[14px]">SIIES</span>,
                    <span key="ds" className="font-sans font-bold tracking-tight text-[14px]">DSPACE</span>,
                ].map((el, i) => (
                    <div key={i} className="opacity-60 hover:opacity-100 transition-opacity">{el}</div>
                ))}
            </div>
        </section>
    );
};
