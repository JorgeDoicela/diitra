import React from 'react';
import { Loader2 } from 'lucide-react';

interface ComiteConsoleProps {
    gradeMetodologia: number;
    setGradeMetodologia: (grade: number) => void;
    gradeEtica: boolean;
    setGradeEtica: (ethics: boolean) => void;
    voteState: 'idle' | 'approved' | 'rejected';
    setVoteState: (state: 'idle' | 'approved' | 'rejected') => void;
    isVoting: boolean;
    handleCastVote: (approved: boolean) => void;
}

export const ComiteConsole: React.FC<ComiteConsoleProps> = ({
    gradeMetodologia,
    setGradeMetodologia,
    gradeEtica,
    setGradeEtica,
    voteState,
    setVoteState,
    isVoting,
    handleCastVote,
}) => {
    return (
        <div className="space-y-2.5 animate-fade-in text-[9.5px] font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-5 border border-border-thin rounded p-2 bg-bg-deep/40 space-y-1.5 text-left">
                    <div>
                        <span className="text-[8px] md:text-[8.5px] text-text-dim uppercase block">1. Calidad Metodológica (1-5)</span>
                        <div className="flex gap-1.5 mt-1.5">
                            {[1, 2, 3, 4, 5].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => {
                                        setGradeMetodologia(val);
                                        setVoteState('idle');
                                    }}
                                    className={`w-6.5 h-6.5 rounded flex items-center justify-center font-bold text-[10.5px] cursor-pointer transition-all border ${
                                        gradeMetodologia === val 
                                            ? 'bg-brand border-brand text-white shadow-sm' 
                                            : 'bg-surface border-border-thin text-text-dim hover:text-text-main'
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-[8px] md:text-[8.5px] text-text-dim uppercase block">2. Aspectos Éticos & LOPDP</span>
                        <button
                            onClick={() => {
                                setGradeEtica(!gradeEtica);
                                setVoteState('idle');
                            }}
                            className={`w-full py-1.5 mt-1.5 text-[9.5px] md:text-[10px] font-semibold border rounded cursor-pointer text-center transition-all ${
                                gradeEtica 
                                    ? 'bg-success/15 border-success/35 text-success' 
                                    : 'bg-error/15 border-error/35 text-error'
                            }`}
                        >
                            {gradeEtica ? '✓ Cumple Normas de Ética' : '✗ Pendiente de Dictamen Ético'}
                        </button>
                    </div>
                </div>

                <div className="sm:col-span-7 border border-border-thin rounded p-2 bg-bg-deep/40 flex flex-col justify-between gap-2.5 text-left">
                    <div className="space-y-0.5">
                        <span className="text-[8px] md:text-[8.5px] text-text-dim uppercase block">Simulación de dictamen previo</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[8.5px] md:text-[9px] text-text-main font-sans font-medium">Puntos: {gradeMetodologia}/5</span>
                            <span className="text-text-dim opacity-50">•</span>
                            {gradeMetodologia >= 4 && gradeEtica ? (
                                <span className="text-success font-bold text-[8px] md:text-[9px] flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-success" />
                                    Aprobación viable
                                </span>
                            ) : gradeMetodologia < 4 && gradeEtica ? (
                                <span className="text-warning font-bold text-[8px] md:text-[9px] flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-warning" />
                                    Requiere correcciones
                                </span>
                            ) : (
                                <span className="text-error font-bold text-[8px] md:text-[9px] flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-error" />
                                    Rechazo ético inmediato
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {isVoting ? (
                            <button disabled className="flex-1 py-1.5 bg-text-main/80 text-bg-deep rounded font-semibold text-[9.5px] md:text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 animate-pulse">
                                <Loader2 size={10} className="animate-spin" />
                                Emitiendo...
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleCastVote(gradeMetodologia >= 4 && gradeEtica)}
                                disabled={voteState !== 'idle'}
                                className="flex-1 py-1.5 bg-text-main text-bg-deep rounded font-semibold text-[9.5px] md:text-[10px] uppercase tracking-wider cursor-pointer hover:opacity-90 disabled:opacity-50"
                            >
                                Emitir Dictamen
                            </button>
                        )}
                        {voteState !== 'idle' && (
                            <button 
                                onClick={() => setVoteState('idle')}
                                className="px-1.5 py-1 border border-border-thin rounded text-text-dim hover:text-text-main text-[8px] md:text-[8.5px] font-mono cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {voteState === 'approved' && (
                        <div className="space-y-0.5 bg-success/10 border border-success/30 p-1 rounded text-success text-[8.5px] md:text-[9px] leading-tight font-sans animate-fade-in">
                            <p className="font-bold">✓ DICTAMEN APROBADO EMITIDO</p>
                            <p className="text-[7.5px] md:text-[8px] opacity-90">Resolución firmada y enviada a DSpace.</p>
                        </div>
                    )}
                    {voteState === 'rejected' && (
                        <div className={`space-y-0.5 p-1 rounded text-[8.5px] md:text-[9px] leading-tight font-sans animate-fade-in border ${
                            gradeEtica === false 
                                ? 'bg-error/10 border-error/30 text-error' 
                                : 'bg-warning/10 border-warning/30 text-warning'
                        }`}>
                            <p className="font-bold">
                                {gradeEtica === false ? 'DICTAMEN DE RECHAZO EMITIDO' : 'RETORNADO PARA CORRECCIONES'}
                            </p>
                            <p className="text-[7.5px] md:text-[8px] opacity-90">
                                {gradeEtica === false 
                                    ? 'No cumple con criterios bioéticos mínimos o LOPDP.' 
                                    : 'Puntuación metodológica inferior a 4.0/5.0.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
