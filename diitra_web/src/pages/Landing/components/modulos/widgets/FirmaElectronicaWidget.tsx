import React from 'react';
import { Key, Check, RefreshCw } from 'lucide-react';

interface FirmaElectronicaWidgetProps {
    signState: 'idle' | 'scanning' | 'signed';
    signProgress: number;
    signTimestamp: string;
    startSigning: () => void;
    resetSignature: () => void;
}

export const FirmaElectronicaWidget: React.FC<FirmaElectronicaWidgetProps> = ({
    signState,
    signProgress,
    signTimestamp,
    startSigning,
    resetSignature
}) => {
    return (
        <div className="h-full flex flex-col gap-3">

            {/* Header del widget */}
            <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[10px] font-mono text-text-dim">
                <span className="font-semibold text-text-main">// FIRMA DIGITAL ACTA</span>
                <span>MOD-05</span>
            </div>

            {/* Panel interactivo de firma */}
            <div className="flex-1 flex flex-col justify-center font-mono text-[9px]">

                {/* Folio del Documento Digital Interactivo */}
                <div className="bg-surface/30 p-2 rounded border border-border-thin/30 text-left font-mono mb-2">
                    <div className="flex justify-between items-center text-[8.5px] border-b border-border-thin/20 pb-1.5 mb-1">
                        <span className="font-bold text-text-main">DOCUMENTO: acta_aprobacion_id.pdf</span>
                        <span className={`text-[7.5px] px-1.5 py-0.5 rounded-full font-bold font-sans uppercase tracking-wider ${signState === 'signed' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning animate-pulse'
                            }`}>
                            {signState === 'signed' ? 'FIRMADO' : 'PENDIENTE FIRMA'}
                        </span>
                    </div>
                    <div className="space-y-1 opacity-65 text-[7.5px] text-text-dim">
                        <p>PROYECTO: Automatización de Convocatorias Académicas (DIITRA-2026)</p>
                    </div>
                </div>

                {signState === 'idle' && (
                    <div className="space-y-3">
                        <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono">// DISPOSITIVO DE FIRMA LISTO</p>
                        <div className="p-3.5 border border-dashed border-border-thin rounded flex items-center justify-center bg-bg-deep/30">
                            <span className="text-[9px] text-text-dim/80">Certificado digital p12 cargado.</span>
                        </div>
                        <button
                            onClick={startSigning}
                            className="w-full py-3 bg-text-main text-bg-deep rounded font-bold font-sans text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <Key size={12} />
                            Firmar Acta de Aprobación
                        </button>
                    </div>
                )}

                {signState === 'scanning' && (
                    <div className="space-y-3">
                        <div className="relative h-20 border border-brand/20 bg-bg-deep rounded flex flex-col items-center justify-center overflow-hidden">
                            <div className="animate-scan-line" />
                            <Key size={28} className="text-brand/60 animate-pulse" />
                            <span className="text-[9px] text-brand font-semibold mt-2 tracking-widest animate-pulse">GENERANDO FIRMA CRIPTOGRÁFICA...</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-brand/80 font-mono">
                                <span>APLICANDO SELLO CRIPTOGRÁFICO P12</span>
                                <span>{signProgress}%</span>
                            </div>
                            <div className="w-full h-1 bg-border-thin rounded-full overflow-hidden">
                                <div className="h-full bg-brand transition-all duration-75" style={{ width: `${signProgress}%` }} />
                            </div>
                        </div>
                    </div>
                )}

                {signState === 'signed' && (
                    <div className="space-y-3 animate-fade-in text-left">
                        {/* Encabezado del Certificado Digital */}
                        <div className="flex justify-between items-center bg-success/10 border border-success/30 p-2.5 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-success">
                                    <Check size={12} strokeWidth={3} className="animate-scale-up" />
                                </div>
                                <div>
                                    <p className="text-[9.5px] font-bold text-success font-sans leading-none">CERTIFICACIÓN VÁLIDA</p>
                                    <p className="text-[8px] text-text-dim mt-0.5 font-mono">Banco Central del Ecuador</p>
                                </div>
                            </div>
                            <button
                                onClick={resetSignature}
                                className="text-text-dim hover:text-text-main text-[8.5px] font-mono border border-border-thin px-2 py-1 rounded cursor-pointer transition-all hover:bg-surface/50 active:scale-95 flex items-center gap-1.5 bg-surface/30"
                            >
                                <RefreshCw size={10} /> REINICIAR
                            </button>
                        </div>

                        {/* Detalles del Firmante Oficial */}
                        <div className="bg-surface/35 border border-border-thin/40 p-3 rounded-lg space-y-2 text-[9px] font-mono">
                            <div className="grid grid-cols-2 gap-2 border-b border-border-thin/20 pb-2">
                                <div>
                                    <span className="text-[8px] text-text-dim block uppercase font-sans">Firmante</span>
                                    <span className="text-text-main font-semibold block mt-0.5">Dr. Jorge Doicela</span>
                                </div>
                                <div>
                                    <span className="text-[8px] text-text-dim block uppercase font-sans">Cargo</span>
                                    <span className="text-text-main font-semibold block mt-0.5">Director I+D</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                    <span className="text-[8px] text-text-dim block uppercase font-sans">Fecha de Firma</span>
                                    <span className="text-text-main font-semibold block mt-0.5">{signTimestamp}</span>
                                </div>
                                <div>
                                    <span className="text-[8px] text-text-dim block uppercase font-sans">Entidad</span>
                                    <span className="text-success font-semibold block mt-0.5">FirmaEC (IST)</span>
                                </div>
                            </div>
                            <div className="border-t border-border-thin/20 pt-2 mt-1">
                                <span className="text-[7.5px] text-text-dim block uppercase font-sans">Hash Criptográfico</span>
                                <span className="text-brand font-bold text-[8.5px] block truncate font-mono mt-0.5">
                                    8f3b2a1c9e8d7f6c4b2a3e9c8a7b6c5d4e3f2a1b
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};
