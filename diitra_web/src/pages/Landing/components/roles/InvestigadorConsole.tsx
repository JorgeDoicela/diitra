import React from 'react';
import { Loader2 } from 'lucide-react';

interface InvestigadorConsoleProps {
    selectedProject: 'riego' | 'robot' | 'plagas';
    setSelectedProject: (proj: 'riego' | 'robot' | 'plagas') => void;
    hitoProgress: number;
    setHitoProgress: React.Dispatch<React.SetStateAction<number>>;
    invSigned: boolean;
    setInvSigned: (signed: boolean) => void;
    isSigning: boolean;
    handleSignProposal: () => void;
}

export const InvestigadorConsole: React.FC<InvestigadorConsoleProps> = ({
    selectedProject,
    setSelectedProject,
    hitoProgress,
    setHitoProgress,
    invSigned,
    setInvSigned,
    isSigning,
    handleSignProposal,
}) => {
    return (
        <div className="space-y-2.5 animate-fade-in text-[9.5px] font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="border border-border-thin rounded p-2 bg-bg-deep/40 space-y-1.5">
                    <span className="text-[8px] md:text-[8.5px] text-text-dim uppercase block">Proyecto actual</span>
                    <div className="flex flex-col gap-1.5 mt-1">
                        {[
                            { value: 'riego', label: '01/ Riego IoT' },
                            { value: 'robot', label: '02/ Limpieza Solar' },
                            { value: 'plagas', label: '03/ Visión Artificial' }
                        ].map((proj) => (
                            <button
                                key={proj.value}
                                type="button"
                                onClick={() => {
                                    setSelectedProject(proj.value as any);
                                    setInvSigned(false);
                                    setHitoProgress(50);
                                }}
                                className={`text-left px-2.5 py-1.5 rounded text-[9.5px] md:text-[10px] font-sans font-medium transition-all border cursor-pointer ${
                                    selectedProject === proj.value
                                        ? 'bg-brand border-brand text-white shadow-sm font-semibold'
                                        : 'bg-surface border-border-thin text-text-dim hover:text-text-main hover:bg-surface-hover'
                                }`}
                            >
                                {proj.label}
                            </button>
                        ))}
                    </div>
                    <span className="text-[8px] md:text-[8.5px] text-warning font-semibold block mt-0.5">Hito 2 en Proceso</span>
                </div>
                <div className="border border-border-thin rounded p-2 bg-bg-deep/40 space-y-1.5">
                    <span className="text-[8px] md:text-[8.5px] text-text-dim uppercase block">Progreso de evidencias: {hitoProgress}%</span>
                    <div className="w-full bg-border-thin/50 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-brand transition-all duration-300" 
                            style={{ width: `${hitoProgress}%` }} 
                        />
                    </div>
                    <div className="flex gap-2 items-center justify-between mt-1">
                        <button 
                            onClick={() => setHitoProgress(prev => Math.min(prev + 25, 100))}
                            disabled={hitoProgress === 100 || invSigned}
                            className="px-1.5 py-0.5 border border-border-thin rounded bg-surface hover:bg-surface-hover text-[8.5px] md:text-[9px] text-text-main cursor-pointer disabled:opacity-40"
                        >
                            Avanzar (+25%)
                        </button>
                        {hitoProgress === 100 && (
                            <span className="text-success text-[8.5px] md:text-[9px] font-sans font-semibold">✓ Listo</span>
                        )}
                    </div>
                </div>

                <div className="border border-border-thin rounded p-2 bg-bg-deep/40 flex flex-col justify-between gap-2">
                    <span className="text-[8px] md:text-[8.5px] text-text-dim uppercase block">Firma de entregable (.p12)</span>
                    {isSigning ? (
                        <div className="w-full py-1.5 bg-brand-subtle border border-brand/20 text-brand rounded font-bold text-[9.5px] md:text-[10px] flex items-center justify-center gap-1.5 flex-1 animate-pulse">
                            <Loader2 size={10} className="animate-spin" />
                            Firmando...
                        </div>
                    ) : invSigned ? (
                        <div className="space-y-0.5 text-left font-mono text-[8px] md:text-[8.5px] leading-tight">
                            <div className="bg-success/15 border border-success/30 text-success text-[8.5px] md:text-[9px] py-0.5 rounded font-bold text-center">
                                ✓ FIRMADO CON EXITO
                            </div>
                            <div className="text-text-dim space-y-0.5 bg-bg-deep/50 p-1 rounded border border-border-thin/50 text-[7.5px] md:text-[8px]">
                                <p>Autoridad: BCE Ecuador</p>
                                <p className="truncate">Sello: ECDSA_256_FirmaEC</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setInvSigned(false);
                                    setHitoProgress(50);
                                }}
                                className="w-full text-center text-text-dim hover:text-text-main text-[8px] md:text-[8.5px] underline cursor-pointer inline-block"
                            >
                                Reiniciar
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleSignProposal}
                            disabled={hitoProgress < 100}
                            className={`w-full py-1.5 rounded font-semibold text-[9.5px] md:text-[10px] uppercase tracking-wider cursor-pointer text-center transition-all ${
                                hitoProgress === 100 
                                    ? 'bg-brand text-white hover:opacity-90 active:scale-95' 
                                    : 'bg-surface border border-border-thin text-text-dim cursor-not-allowed'
                            }`}
                            title={hitoProgress < 100 ? "Completa el progreso antes de firmar" : ""}
                        >
                            Firmar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
