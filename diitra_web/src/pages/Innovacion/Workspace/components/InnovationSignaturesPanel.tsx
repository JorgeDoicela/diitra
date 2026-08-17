import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

interface Props {
    directorNombre?: string;
    hasTransfer?: boolean;
}

export const InnovationSignaturesPanel: React.FC<Props> = ({ directorNombre }) => {
    return (
        <div className="bento-card static p-5 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-text-main/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-text-main/8 transition-colors duration-500" />
            
            <div>
                <div className="flex items-center gap-2.5 mb-2">
                    <Shield size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                    <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">
                        Firmas y Custodia Legal
                    </h3>
                </div>
                <p className="text-[10px] text-text-dim leading-relaxed mt-1">
                    Estado de validez y firmas electrónicas de la ficha técnica y acta de transferencia CTT.
                </p>
            </div>

            <div className="mt-5 space-y-3">
                {/* Director del Proyecto */}
                <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-text-dim">
                                Director de Proyecto
                            </span>
                            <p className="text-xs font-bold text-text-main">
                                {directorNombre || 'Docente Investigador'}
                            </p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <CheckCircle2 size={13} />
                        </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        <span>Firmado Electrónicamente</span>
                    </p>
                </div>

                {/* Responsable CTT / Entidad Receptora */}
                <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-text-dim">
                                Coordinación CTT / Vinculación
                            </span>
                            <p className="text-xs font-bold text-text-main">
                                Validación Institucional
                            </p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <CheckCircle2 size={13} />
                        </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        <span>Acreditado ante CACES</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
