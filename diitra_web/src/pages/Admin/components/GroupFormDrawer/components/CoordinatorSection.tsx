import React from 'react';
import { User, Search } from 'lucide-react';
import { formatNombre } from '../hooks/useGroupFormDrawer';

interface CoordinatorSectionProps {
    coordSearchQuery: string;
    setCoordSearchQuery: (query: string) => void;
    selectedCoordName: string;
    showCoordResults: boolean;
    setShowCoordResults: (show: boolean) => void;
    isCoordSearching: boolean;
    coordSearchResults: any[];
    handleSelectCoordinator: (teacher: any) => void;
}

export const CoordinatorSection: React.FC<CoordinatorSectionProps> = ({
    coordSearchQuery,
    setCoordSearchQuery,
    selectedCoordName,
    showCoordResults,
    setShowCoordResults,
    isCoordSearching,
    coordSearchResults,
    handleSelectCoordinator
}) => {
    return (
        <section className="space-y-6">
            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Coordinador Responsable
            </h4>
            <div className="p-6 bg-bg-deep/20 rounded-2xl border border-border-thin space-y-4">
                <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Buscar Coordinador</label>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/60" />
                        <input
                            type="text"
                            value={coordSearchQuery}
                            onChange={(e) => {
                                setCoordSearchQuery(e.target.value);
                                setShowCoordResults(true);
                            }}
                            onFocus={() => setShowCoordResults(true)}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg pl-10 pr-4 py-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase placeholder:normal-case font-medium"
                            placeholder={selectedCoordName ? selectedCoordName : "Buscar docente por nombre o cédula..."}
                        />
                        {showCoordResults && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowCoordResults(false)}></div>
                                <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border-thin rounded-lg p-1.5 shadow-xl max-h-[180px] overflow-y-auto z-30 custom-scrollbar">
                                    {isCoordSearching ? (
                                        <div className="p-3 text-center text-xs text-text-dim font-mono">
                                            Buscando docente...
                                        </div>
                                    ) : coordSearchResults.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-text-dim font-mono">
                                            No se encontraron docentes con ese nombre o cédula.
                                        </div>
                                    ) : (
                                        coordSearchResults.map((teacher: any) => (
                                            <button
                                                key={teacher.cedula}
                                                type="button"
                                                onClick={() => handleSelectCoordinator(teacher)}
                                                className="w-full text-left p-2.5 rounded hover:bg-bg-deep/50 transition-colors flex justify-between items-center"
                                            >
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-text-main text-xs flex items-center gap-2">
                                                        <span>{formatNombre(teacher.nombre)}</span>
                                                        {teacher.horas_disponibles !== undefined && (
                                                            <span className={`badge-vercel text-[10px] font-medium px-2 py-0.5 ${
                                                                (teacher.horas_disponibles - (teacher.horas_asignadas || 0)) > 0 
                                                                    ? 'badge-vercel-success' 
                                                                    : 'badge-vercel-error'
                                                            }`}>
                                                                Disp: {teacher.horas_disponibles - (teacher.horas_asignadas || 0)}h / {teacher.horas_disponibles}h
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {teacher.cedula} | {teacher.carrera || 'SIN CARRERA'}</p>
                                                </div>
                                                <span className="badge-vercel text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 badge-vercel-violet">
                                                    Docente
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
