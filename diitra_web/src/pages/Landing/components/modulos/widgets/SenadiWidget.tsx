import React from 'react';
import type { CommitItem } from '../hooks/useModulosOrchestration';

interface SenadiWidgetProps {
    commits: CommitItem[];
    handlePushCommit: () => void;
    downloadStates: { [key: string]: 'idle' | number | 'success' };
    triggerDownload: (fileName: string) => void;
}

export const SenadiWidget: React.FC<SenadiWidgetProps> = ({
    commits,
    handlePushCommit,
    downloadStates,
    triggerDownload
}) => {
    return (
        <div className="h-full flex flex-col gap-3">

            {/* Header del widget */}
            <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[10px] font-mono text-text-dim">
                <span className="font-semibold text-text-main">// PROPIEDAD INTELECTUAL</span>
                <span>MOD-03</span>
            </div>

            {/* Descargas interactivas */}
            <div className="flex-1 flex flex-col justify-center gap-2.5">

                {/* Monitor de Commits Git de la Universidad Interactivo */}
                <div className="grid grid-cols-12 gap-3 bg-surface/20 p-2.5 rounded border border-border-thin/30 text-left font-mono">

                    {/* Lista de commits */}
                    <div className="col-span-7 space-y-1">
                        <div className="text-[8px] text-text-dim uppercase font-mono tracking-wider font-bold">// COMMITS REPOSITORIO</div>
                        <div className="space-y-0.5 max-h-[48px] overflow-hidden">
                            {commits.map((c, idx) => (
                                <div key={c.hash + idx} className="flex justify-between items-center text-[8.5px] gap-1 animate-fade-in">
                                    <span className="text-brand font-bold">{c.hash}</span>
                                    <span className="text-text-main truncate max-w-[85px]">{c.msg}</span>
                                    <span className="text-[7px] text-text-dim whitespace-nowrap">{c.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Acción de Simular Commit / Push */}
                    <div className="col-span-5 flex flex-col items-center justify-center border-l border-border-thin/20 pl-3">
                        <button
                            onClick={handlePushCommit}
                            className="w-full py-1.5 px-2 bg-text-main text-bg-deep rounded font-bold font-sans text-[8.5px] uppercase tracking-wider hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer text-center"
                        >
                            SIMULAR COMMIT
                        </button>
                        <span className="text-[7px] text-text-dim/80 mt-1 block uppercase font-mono text-center">Branch: main</span>
                    </div>

                </div>

                <div className="flex justify-between items-center text-[9px] font-mono text-text-dim border border-dashed border-border-thin bg-surface/20 p-2.5 rounded text-left">
                    <span>REGISTRO SENADI ACTIVO:</span>
                    <span className="text-success font-bold text-[9.5px]">REG-SENADI-2026-00459 (VIGENTE)</span>
                </div>

                {Object.keys(downloadStates).map((fileName) => {
                    const state = downloadStates[fileName];
                    return (
                        <button
                            key={fileName}
                            onClick={() => triggerDownload(fileName)}
                            className="p-2.5 border border-border-thin rounded bg-bg-deep flex flex-col gap-1 text-left w-full transition-all duration-300 hover:border-brand/40 cursor-pointer"
                        >
                            <div className="flex justify-between items-center font-sans">
                                <span className="text-[10px] text-text-main font-bold font-mono">{fileName}</span>
                                <span className="text-brand text-[8.5px] font-bold font-mono bg-brand-subtle px-2 py-0.5 rounded border border-brand/20">
                                    {state === 'idle' ? 'DESCARGAR' : state === 'success' ? 'COMPLETO' : `DESCARGANDO: ${state}%`}
                                </span>
                            </div>
                            {typeof state === 'number' && (
                                <div className="w-full bg-border-thin h-1 rounded-full overflow-hidden mt-1.5">
                                    <div className="h-full bg-brand transition-all duration-200" style={{ width: `${state}%` }} />
                                </div>
                            )}
                        </button>
                    );
                })}

            </div>

        </div>
    );
};
