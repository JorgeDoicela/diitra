import React from 'react';
import { Loader2, Cpu } from 'lucide-react';

interface AdminConsoleProps {
    selectedApi: 'siies' | 'dspace' | 'senadi';
    setSelectedApi: (api: 'siies' | 'dspace' | 'senadi') => void;
    apiTesting: boolean;
    apiResult: string;
    setApiResult: (res: string) => void;
    runApiTest: () => void;
    syncProgress: number;
    syncState: 'idle' | 'syncing' | 'completed';
    runSyncSimulation: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
    selectedApi,
    setSelectedApi,
    apiTesting,
    apiResult,
    setApiResult,
    runApiTest,
    syncProgress,
    syncState,
    runSyncSimulation,
}) => {
    return (
        <div className="space-y-2.5 animate-fade-in text-[9.5px] font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-stretch">
                <div className="sm:col-span-5 border border-border-thin rounded p-2 bg-bg-deep/40 flex flex-col justify-between gap-2.5 text-left">
                    <div>
                        <span className="text-[8px] md:text-[8.5px] text-text-dim uppercase block">Pasarela externa de sincronización</span>
                        <div className="flex flex-col gap-1.5 mt-1.5">
                            {[
                                { value: 'siies', label: 'SIIES API (CACES)' },
                                { value: 'dspace', label: 'DSpace (Repositorio)' },
                                { value: 'senadi', label: 'SENADI (Propiedad Int.)' }
                            ].map((apiOpt) => (
                                <button
                                    key={apiOpt.value}
                                    type="button"
                                    onClick={() => {
                                        setSelectedApi(apiOpt.value as any);
                                        setApiResult('');
                                    }}
                                    className={`text-left px-2.5 py-1.5 rounded text-[9.5px] md:text-[10px] font-sans font-medium transition-all border cursor-pointer ${
                                        selectedApi === apiOpt.value
                                            ? 'bg-brand border-brand text-white shadow-sm font-semibold'
                                            : 'bg-surface border-border-thin text-text-dim hover:text-text-main hover:bg-surface-hover'
                                    }`}
                                >
                                    {apiOpt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={runApiTest}
                            disabled={apiTesting}
                            className="w-full py-1.5 bg-brand text-white rounded font-semibold text-[9.5px] md:text-[10px] uppercase tracking-wider cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            {apiTesting && <Loader2 size={10} className="animate-spin" />}
                            {!apiTesting && <Cpu size={10} />}
                            Probar Conexión
                        </button>
                    </div>
                </div>

                <div className="sm:col-span-7 border border-border-thin rounded p-2 bg-bg-deep/40 flex flex-col justify-between gap-2.5 min-h-[70px] text-left">
                    <div>
                        <span className="text-[8px] md:text-[8.5px] text-text-dim uppercase block">Respuesta de latencia de red</span>
                        <div className="min-h-[22px] flex items-center mt-0.5">
                            {apiTesting ? (
                                <p className="text-brand animate-pulse text-[8.5px] md:text-[9px] font-sans">Realizando diagnóstico...</p>
                            ) : apiResult ? (
                                <p className="text-success text-[8.5px] md:text-[9px] leading-tight font-sans">{apiResult}</p>
                            ) : (
                                <p className="text-text-dim text-[8.5px] md:text-[9px] font-sans">Haz clic en probar para conectarte al gateway.</p>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-border-thin/20 pt-1.5 space-y-1">
                        <div className="flex justify-between items-center text-[8px] md:text-[8.5px] text-text-dim uppercase">
                            <span>Sincronizar base de datos general</span>
                            <span>{syncProgress}%</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="flex-1 bg-border-thin/50 h-1 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-success transition-all duration-150" 
                                    style={{ width: `${syncProgress}%` }} 
                                />
                            </div>
                            <button
                                onClick={runSyncSimulation}
                                disabled={syncState === 'syncing'}
                                className="px-1.5 py-0.5 bg-text-main text-bg-deep rounded font-semibold text-[8px] md:text-[8.5px] uppercase cursor-pointer hover:opacity-90 disabled:opacity-50"
                            >
                                {syncState === 'syncing' ? '...' : syncState === 'completed' ? '✓' : 'Sincronizar'}
                            </button>
                        </div>
                        {syncState === 'completed' && (
                            <p className="text-success text-[7.5px] md:text-[8px] font-sans leading-none">✓ Evidencias y distributivos sincronizados con SIGAFI.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
