import React from 'react';
import { GraduationCap, X, Users } from 'lucide-react';

interface GroupMember {
    id_grupo_miembro: number;
    id_usuario: number;
    nombre_completo: string;
    cedula?: string;
    rol: string;
    activo: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
    carrera?: string;
}

interface CareerLinkageModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: {
        id_profesor_coordinador?: string | null;
    };
    selectedCoordName: string;
    selectedCoordCareer: string;
    groupMembers: GroupMember[];
    formatCareerName: (name: string) => string;
}

export const CareerLinkageModal: React.FC<CareerLinkageModalProps> = ({
    isOpen,
    onClose,
    formData,
    selectedCoordName,
    selectedCoordCareer,
    groupMembers,
    formatCareerName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={onClose}
            />
            <div className="relative w-full max-w-2xl bg-surface border border-border-thin rounded-2xl shadow-2xl flex flex-col z-10 animate-fade-up overflow-hidden max-h-[85vh]">
                <div className="p-5 border-b border-border-thin flex justify-between items-center bg-bg-deep/25">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <GraduationCap size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-text-main uppercase tracking-widest leading-none mb-1">
                                Detalle de Carreras por Integrante
                            </h3>
                            <p className="text-[10px] text-text-dim uppercase font-bold tracking-tight">
                                Distribución y mapeo automático de carreras del grupo
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-surface-hover text-text-dim hover:text-text-main transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    <div className="space-y-3">
                        {/* Coordinator (If exists) */}
                        {formData.id_profesor_coordinador ? (
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-black text-text-main uppercase truncate">
                                            {selectedCoordName || 'Coordinador Responsable'}
                                        </h4>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                                            Coordinador
                                        </span>
                                    </div>
                                    <p className="text-[9px] font-mono text-text-dim">C.I. {formData.id_profesor_coordinador}</p>
                                </div>
                                <div className="flex flex-wrap gap-1.5 shrink-0 max-w-[280px]">
                                    {selectedCoordCareer ? (
                                        selectedCoordCareer.split(',').map((c, i) => (
                                            <span key={i} className="badge-vercel badge-vercel-info text-[8px] py-0.5 px-2 font-bold uppercase truncate">
                                                {formatCareerName(c.trim())}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[9px] font-bold text-text-dim uppercase italic">Sin carrera registrada</span>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {/* Group Members */}
                        {groupMembers.map((member) => (
                            <div
                                key={member.id_grupo_miembro}
                                className="p-4 bg-bg-deep/20 border border-border-thin rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-border-thin/80 transition-all"
                            >
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-black text-text-main uppercase truncate">
                                            {member.nombre_completo}
                                        </h4>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-blue-500/15 border border-blue-500/20 text-blue-400">
                                            {member.rol}
                                        </span>
                                    </div>
                                    <p className="text-[9px] font-mono text-text-dim">C.I. {member.cedula || 'S/D'}</p>
                                </div>
                                <div className="flex flex-wrap gap-1.5 shrink-0 max-w-[280px]">
                                    {member.carrera ? (
                                        member.carrera.split(',').map((c, i) => (
                                            <span key={i} className="badge-vercel badge-vercel-info text-[8px] py-0.5 px-2 font-bold uppercase truncate">
                                                {formatCareerName(c.trim())}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[9px] font-bold text-text-dim uppercase italic">Sin carrera registrada</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {(!formData.id_profesor_coordinador && groupMembers.length === 0) && (
                            <div className="py-12 text-center space-y-2">
                                <Users size={24} className="mx-auto text-text-dim/30" />
                                <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">
                                    No hay integrantes en este grupo todavía
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-bg-deep/45 border-t border-border-thin flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-text-main text-bg-deep font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
