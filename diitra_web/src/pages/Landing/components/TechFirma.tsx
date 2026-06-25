import React, { useState, useEffect } from 'react';
import { FileSignature, Check, RefreshCw, Key } from 'lucide-react';

const TechFirma: React.FC = () => {
    // Card 1: Firma Electrónica
    const [signState, setSignState] = useState<'idle' | 'scanning' | 'signed'>('idle');
    const [signProgress, setSignProgress] = useState<number>(0);
    const [timestamp, setTimestamp] = useState<string>('');

    useEffect(() => {
        let interval: any;
        if (signState === 'scanning') {
            setSignProgress(0);
            interval = setInterval(() => {
                setSignProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        const now = new Date();
                        setTimestamp(now.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }));
                        setSignState('signed');
                        return 100;
                    }
                    return prev + 5;
                });
            }, 80);
        }
        return () => clearInterval(interval);
    }, [signState]);

    const startSigning = () => {
        if (signState !== 'idle') return;
        setSignState('scanning');
    };

    const resetSignature = () => {
        setSignState('idle');
        setSignProgress(0);
    };

    return (
        <section className="py-12 lg:-ml-24 lg:-mr-24">
            {/* Custom Scan Line Keyframe Styling */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes scanLine {
                    0% { top: 0%; opacity: 0.8; }
                    50% { top: 100%; opacity: 0.8; }
                    100% { top: 0%; opacity: 0.8; }
                }
                .animate-scan-line {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #0070f3;
                    box-shadow: 0 0 10px #0070f3, 0 0 4px #0070f3;
                    animation: scanLine 2s linear infinite;
                }
            `}} />

            {/* Split panel layout bento-card */}
            <div className="bento-card-static p-8 relative min-h-[220px]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    
                    {/* Left panel: Info & Description */}
                    <div className="md:col-span-7 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 border border-border-thin rounded bg-bg-deep">
                                <FileSignature size={18} strokeWidth={1.5} className="text-text-main" />
                            </div>
                            <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Firma_Digital (Interactivo)</span>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold tracking-tight text-text-main font-mono uppercase">
                                Firma Electrónica IST
                            </h3>
                            <p className="text-xs text-text-dim leading-relaxed max-w-xl">
                                Integración nativa con archivos **.p12**. Las rúbricas, actas de aprobación y reportes mensuales se firman digitalmente con validez jurídica completa, cumpliendo de forma estricta con la normativa vigente de firma electrónica en el Ecuador.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-[9px] font-mono text-text-main uppercase font-semibold pt-2">
                            <Key size={12} className="text-brand animate-pulse" />
                            <span>Integración Segura FirmaEC (Banco Central)</span>
                        </div>
                    </div>

                    {/* Right panel: Interactive Signature Area */}
                    <div className="md:col-span-5 bg-surface/50 border border-border-thin rounded p-4 font-mono text-[9px]">
                        {signState === 'idle' && (
                            <div className="space-y-3">
                                <p className="text-[8px] text-text-dim uppercase tracking-wider font-mono">// DISPOSITIVO DE FIRMA LISTO</p>
                                <div className="p-3 border border-dashed border-border-thin rounded flex items-center justify-center bg-bg-deep/30">
                                    <span className="text-[8.5px] text-text-dim/80">Certificado digital p12 cargado.</span>
                                </div>
                                <button
                                    onClick={startSigning}
                                    className="w-full py-3 bg-text-main text-bg-deep rounded font-bold font-sans text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md"
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
                                    <span className="text-[8px] text-brand font-semibold mt-2 tracking-widest animate-pulse">GENERANDO FIRMA CRIPTOGRÁFICA...</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[8px] text-brand/80 font-mono">
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
                            <div className="space-y-2.5 animate-fade-in">
                                <div className="flex justify-between items-center text-success font-sans font-semibold text-[10px]">
                                    <span className="flex items-center gap-1">
                                        <Check size={12} strokeWidth={3} className="animate-scale-up" />
                                        ACTA FIRMADA CON ÉXITO
                                    </span>
                                    <button 
                                        onClick={resetSignature}
                                        className="text-text-dim hover:text-text-main text-[8px] font-mono border border-border-thin px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
                                    >
                                        <RefreshCw size={8} /> REINICIAR
                                    </button>
                                </div>
                                <div className="text-[8px] text-text-dim space-y-0.5 border-t border-border-thin/40 pt-2">
                                    <p>Firmante: <span className="text-text-main font-semibold">Dr. Jorge Doicela (Director I+D)</span></p>
                                    <p>Fecha de Firma: <span className="text-text-main font-semibold">{timestamp}</span></p>
                                    <p className="font-mono text-brand truncate">Hash SHA-256: 8f3b2a1c9e8d7f6c4b2a3e9c8a7b6c5d4e3f2a1b</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </section>
    );
};

export default TechFirma;

