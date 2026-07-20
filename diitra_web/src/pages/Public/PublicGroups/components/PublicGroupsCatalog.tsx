import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Loader2 } from 'lucide-react';
import { Group, formatNombre } from '../types';

interface PublicGroupsCatalogProps {
    selectedType: string;
    setSelectedType: (type: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedCarrera: string;
    setSelectedCarrera: (carrera: string) => void;
    uniqueCarreras: string[];
    groups: Group[];
    filteredGroups: Group[];
    loading: boolean;
}

export const PublicGroupsCatalog: React.FC<PublicGroupsCatalogProps> = ({
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    selectedCarrera,
    setSelectedCarrera,
    uniqueCarreras,
    groups,
    filteredGroups,
    loading
}) => {
    return (
        <section id="catalogo" className="scroll-mt-24 space-y-10 lg:-ml-24 lg:-mr-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <h2 className="text-3xl md:text-[40px] font-bold tracking-tighter text-text-main">
                    Catálogo
                </h2>
                <div className="flex items-center gap-1 p-1 bg-surface border border-border-thin rounded-lg w-fit">
                    {[
                        ['todos', 'Todos'],
                        ['investigación', 'Investigación'],
                        ['semillero', 'Semilleros']
                    ].map(([val, lbl]) => (
                        <button
                            key={val}
                            onClick={() => setSelectedType(val)}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${selectedType === val ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:text-text-main'}`}
                        >
                            {lbl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Buscador + Filtro de Carrera */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center max-w-3xl">
                <div className="relative flex-1 border border-border-thin rounded-lg bg-surface/20 focus-within:border-brand/40 focus-within:shadow-[0_0_15px_rgba(0,112,243,0.03)] transition-all duration-300">
                    <div className="flex items-center px-4 py-2.5">
                        <Search size={14} className="mr-3 text-text-dim shrink-0" />
                        <input
                            type="text"
                            className="w-full bg-transparent text-sm text-text-main placeholder-text-dim focus:outline-none"
                            placeholder="Buscar grupos o líneas de investigación..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {uniqueCarreras.length > 0 && (
                    <div className="relative border border-border-thin rounded-lg bg-surface/20 focus-within:border-brand/40 transition-all duration-300 min-w-[220px] flex items-center pr-3">
                        <select
                            value={selectedCarrera}
                            onChange={e => setSelectedCarrera(e.target.value)}
                            className="w-full bg-transparent text-sm text-text-main px-4 py-2.5 outline-none cursor-pointer appearance-none z-10"
                        >
                            <option value="todas" className="bg-bg-deep text-text-main">Todas las carreras</option>
                            {uniqueCarreras.map(c => (
                                <option key={c} value={c} className="bg-bg-deep text-text-main">{c}</option>
                            ))}
                        </select>
                        <ChevronRight size={14} className="text-text-dim/50 rotate-90 shrink-0 pointer-events-none absolute right-3" />
                    </div>
                )}
            </div>

            {/* Grid */}
            {loading && groups.length === 0 ? (
                <div className="flex items-center gap-3 py-16 text-text-dim">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Cargando grupos de investigación...</span>
                </div>
            ) : filteredGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
                    {filteredGroups.map((grupo, idx) => (
                        <Link
                            key={grupo.uuid}
                            to={`/grupos-investigacion/${grupo.uuid}`}
                            className="bento-card p-5 cursor-pointer flex flex-col justify-between"
                            style={{ animationDelay: `${idx * 40}ms` }}
                        >
                            <div>
                                {/* Banner de grupo (Foto o Gradiente de Siglas) */}
                                <div className="h-32 w-full rounded-lg overflow-hidden mb-5 bg-surface/30 relative border border-border-thin/30 select-none">
                                    {grupo.fotoUrl ? (
                                        <img
                                            src={grupo.fotoUrl.split(',')[0]}
                                            alt={grupo.nombre}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full vercel-grid bg-surface/40 flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                                            <div className="absolute inset-0 bg-radial-gradient from-brand/5 via-transparent to-transparent pointer-events-none" />
                                            <span className="relative z-10 text-text-dim/30 font-black text-xl tracking-widest font-mono uppercase filter drop-shadow-sm">{grupo.siglas || 'ISTPET'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mb-3.5">
                                    <span className={`badge-vercel text-[8px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${grupo.tipoGrupo.toLowerCase() === 'semillero' ? 'badge-vercel-violet' : 'badge-vercel-info'}`}>
                                        {grupo.tipoGrupo}
                                    </span>
                                    {grupo.siglas && <span className="text-[10px] font-mono text-text-dim/60 font-semibold">{grupo.siglas}</span>}
                                </div>
                                <h3 className="text-[15px] font-bold text-text-main leading-snug mb-2 group-hover:text-brand transition-colors">
                                    {grupo.nombre}
                                </h3>
                                <p className="text-text-dim text-xs leading-relaxed line-clamp-2 mb-4">
                                    {grupo.mision || grupo.objetivoGeneral || 'Investigación aplicada y desarrollo de soluciones técnicas en el ISTPET.'}
                                </p>

                                {/* Líneas de investigación del grupo */}
                                {grupo.lineasNombres && grupo.lineasNombres.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-6">
                                        {grupo.lineasNombres.slice(0, 2).map((l, i) => (
                                            <span key={i} className="badge-vercel badge-vercel-neutral text-[9px] font-mono px-2 py-0.5">
                                                {l}
                                            </span>
                                        ))}
                                        {grupo.lineasNombres.length > 2 && (
                                            <span className="badge-vercel badge-vercel-neutral text-[9px] font-mono px-2 py-0.5 text-text-dim/50">+{grupo.lineasNombres.length - 2}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-xs text-text-dim border-t border-border-thin/40 pt-4 mt-auto">
                                <span className="truncate max-w-[160px] font-semibold text-text-main/80">{formatNombre(grupo.nombreCoordinador)}</span>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-medium">{grupo.miembros?.length || 0} miembros</span>
                                    <ChevronRight size={12} className="text-text-dim/40 group-hover:text-text-main group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="py-16 text-text-dim">
                    <p className="text-sm">No se encontraron grupos que coincidan con tu búsqueda o filtros.</p>
                </div>
            )}
        </section>
    );
};
