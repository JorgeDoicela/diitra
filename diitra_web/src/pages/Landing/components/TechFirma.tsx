import React, { useState } from 'react';
import { FileSignature, Fingerprint, Cpu, MessageSquareCode, Loader2, Check, Sparkles } from 'lucide-react';

const TechFirma: React.FC = () => {
    // Card 1: Firma Electrónica
    const [signState, setSignState] = useState<'idle' | 'scanning' | 'signed'>('idle');
    const [timestamp, setTimestamp] = useState<string>('');

    const startSigning = () => {
        if (signState !== 'idle') return;
        setSignState('scanning');
        
        setTimeout(() => {
            const now = new Date();
            setTimestamp(now.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }));
            setSignState('signed');
        }, 1500);
    };

    const resetSignature = () => {
        setSignState('idle');
    };

    // Card 2: IA Classifier
    const mockProjects = [
        { title: 'Robot de Limpieza Solar', line: 'Desarrollo de Software y Automatización Industrial' },
        { title: 'Detección de Plagas con Visión', line: 'Inteligencia Artificial Aplicada' },
        { title: 'Sistema de Riego Inteligente IoT', line: 'Redes y Telecomunicaciones' }
    ];
    const [selectedProject, setSelectedProject] = useState<number>(0);
    const [classifying, setClassifying] = useState<boolean>(false);
    const [classifiedLine, setClassifiedLine] = useState<string>('');

    const handleClassify = () => {
        if (classifying) return;
        setClassifying(true);
        setClassifiedLine('');
        
        setTimeout(() => {
            setClassifiedLine(mockProjects[selectedProject].line);
            setClassifying(false);
        }, 1000);
    };

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:-ml-24 lg:-mr-24 py-12 select-none">
            {/* Card 1: Firma Electrónica */}
            <div className="bento-card-static p-8 flex flex-col justify-between relative min-h-[250px]">
                <div className="flex justify-between items-start">
                    <div className="p-2 border border-border-thin rounded bg-bg-deep">
                        <FileSignature size={18} strokeWidth={1.5} className="text-text-main" />
                    </div>
                    <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Firma_Digital (Interactivo)</span>
                </div>
                
                <div className="mt-6 space-y-3">
                    <h3 className="text-lg font-bold tracking-tight text-text-main font-mono uppercase">
                        Firma Electrónica IST
                    </h3>
                    <p className="text-xs text-text-dim leading-relaxed">
                        Integración nativa con archivos **.p12**. Las rúbricas, actas de aprobación y reportes mensuales se firman digitalmente con validez jurídica completa.
                    </p>

                    {/* Interactive Signature Area */}
                    <div className="p-3 border border-border-thin rounded bg-surface/50 font-mono text-[9px] flex flex-col gap-2">
                        {signState === 'idle' && (
                            <button
                                onClick={startSigning}
                                className="w-full py-2 bg-text-main text-bg-deep rounded font-bold font-sans text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <Fingerprint size={12} />
                                Firmar Acta de Aprobación
                            </button>
                        )}

                        {signState === 'scanning' && (
                            <div className="w-full py-2 border border-brand/35 bg-brand-subtle text-brand rounded font-bold font-sans text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 animate-pulse">
                                <Loader2 size={12} className="animate-spin" />
                                Validando certificado p12...
                            </div>
                        )}

                        {signState === 'signed' && (
                            <div className="space-y-2 animate-fade-in">
                                <div className="flex justify-between items-center text-success font-sans font-semibold text-[10px]">
                                    <span className="flex items-center gap-1">
                                        <Check size={12} strokeWidth={3} />
                                        ACTA FIRMADA DIGITALMENTE
                                    </span>
                                    <button 
                                        onClick={resetSignature}
                                        className="text-text-dim hover:text-text-main text-[8px] font-mono border border-border-thin px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                    >
                                        REINICIAR
                                    </button>
                                </div>
                                <div className="text-[8px] text-text-dim space-y-0.5">
                                    <p>Firmante: Dr. Jorge Doicela</p>
                                    <p>Fecha: {timestamp}</p>
                                    <p className="font-mono text-brand truncate">Hash: SHA-256: 8f3b2a1c9e8d7f6c...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-[9px] font-mono text-text-main uppercase font-semibold">
                    <Fingerprint size={12} />
                    <span>Integración Segura FirmaEC</span>
                </div>
            </div>

            {/* Card 2: Automatización e IA */}
            <div className="bento-card-static p-8 flex flex-col justify-between relative min-h-[250px]">
                <div className="flex justify-between items-start">
                    <div className="p-2 border border-border-thin rounded bg-bg-deep">
                        <Cpu size={18} strokeWidth={1.5} className="text-text-main" />
                    </div>
                    <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Inteligencia_Artificial (Interactivo)</span>
                </div>

                <div className="mt-6 space-y-3">
                    <h3 className="text-lg font-bold tracking-tight text-text-main font-mono uppercase">
                        Clasificación por IA
                    </h3>
                    <p className="text-xs text-text-dim leading-relaxed">
                        Asistencia inteligente para mapear de manera precisa los títulos de proyectos a las líneas de investigación institucionales válidas.
                    </p>

                    {/* Interactive Classifier Area */}
                    <div className="p-3 border border-border-thin rounded bg-surface/50 font-mono text-[9px] flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-[8px] text-text-dim uppercase">// Selecciona un proyecto de prueba</label>
                            <div className="flex gap-1.5">
                                {mockProjects.map((p, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelectedProject(idx);
                                            setClassifiedLine('');
                                        }}
                                        className={`px-2 py-1 border text-[8px] rounded transition-all cursor-pointer truncate ${
                                            selectedProject === idx
                                                ? 'bg-bg-deep border-brand/50 text-text-main font-semibold'
                                                : 'border-border-thin text-text-dim hover:text-text-main hover:bg-surface/20'
                                        }`}
                                    >
                                        {p.title.split(' ')[0]}...
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 items-center">
                            <button
                                onClick={handleClassify}
                                disabled={classifying}
                                className="px-3 py-1.5 bg-brand text-white rounded font-bold font-sans text-[9px] uppercase tracking-wider flex items-center gap-1 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shrink-0"
                            >
                                {classifying && <Loader2 size={10} className="animate-spin" />}
                                {!classifying && <Sparkles size={10} />}
                                Clasificar con IA
                            </button>
                            
                            <div className="text-[8.5px] font-sans truncate text-text-dim">
                                Project: <span className="text-text-main font-mono font-semibold">"{mockProjects[selectedProject].title}"</span>
                            </div>
                        </div>

                        {classifiedLine && (
                            <div className="p-2 border border-brand/20 bg-brand-subtle rounded text-text-main text-[9.5px] font-sans animate-fade-in flex flex-col gap-0.5">
                                <span className="text-[7.5px] font-mono text-brand font-bold uppercase tracking-wider">Línea de Investigación Sugerida:</span>
                                <span className="font-semibold text-text-main">{classifiedLine}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-[9px] font-mono text-text-main uppercase font-semibold">
                    <MessageSquareCode size={12} />
                    <span>Control Automatizado</span>
                </div>
            </div>
        </section>
    );
};

export default TechFirma;
