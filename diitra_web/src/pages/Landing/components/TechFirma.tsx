import React from 'react';
import { FileSignature, Fingerprint, Cpu, MessageSquareCode } from 'lucide-react';

const TechFirma: React.FC = () => {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:-ml-24 lg:-mr-24 py-12">
            {/* Card 1: Firma Electrónica */}
            <div className="bento-card-static p-8 flex flex-col justify-between relative min-h-[220px]">
                <div className="flex justify-between items-start">
                    <div className="p-2 border border-border-thin rounded bg-bg-deep">
                        <FileSignature size={18} strokeWidth={1.5} className="text-text-main" />
                    </div>
                    <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Firma_Digital</span>
                </div>
                
                <div className="mt-8 space-y-3">
                    <h3 className="text-lg font-bold tracking-tight text-text-main font-mono uppercase">
                        Firma Electrónica IST
                    </h3>
                    <p className="text-xs text-text-dim leading-relaxed">
                        Integración nativa con archivos **.p12**. Las rúbricas, actas de aprobación y reportes mensuales se firman digitalmente con validez jurídica completa ante entes evaluadores.
                    </p>
                </div>

                <div className="mt-6 flex items-center gap-2 text-[9px] font-mono text-text-main uppercase font-semibold">
                    <Fingerprint size={12} />
                    <span>Integración Segura FirmaEC</span>
                </div>
            </div>

            {/* Card 2: Automatización e IA */}
            <div className="bento-card-static p-8 flex flex-col justify-between relative min-h-[220px]">
                <div className="flex justify-between items-start">
                    <div className="p-2 border border-border-thin rounded bg-bg-deep">
                        <Cpu size={18} strokeWidth={1.5} className="text-text-main" />
                    </div>
                    <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Inteligencia_Artificial</span>
                </div>

                <div className="mt-8 space-y-3">
                    <h3 className="text-lg font-bold tracking-tight text-text-main font-mono uppercase">
                        Automatización e IA
                    </h3>
                    <p className="text-xs text-text-dim leading-relaxed">
                        Verificación de formato en propuestas previas al envío y asistencia inteligente para mapear de manera precisa los proyectos a las líneas de investigación institucionales válidas.
                    </p>
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
