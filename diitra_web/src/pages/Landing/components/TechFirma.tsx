import React from 'react';
import { FileSignature, Fingerprint, Cpu, MessageSquareCode } from 'lucide-react';

const TechFirma: React.FC = () => {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:-ml-24 lg:-mr-24">
            <div className="bento-card static p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 border border-border-thin rounded bg-bg-deep text-text-main">
                        <FileSignature size={18} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-text-main">Firma Electrónica IST</h3>
                </div>
                <p className="text-xs text-text-dim leading-relaxed">
                    Integración nativa con archivos **.p12**. Las rúbricas, actas de aprobación y reportes mensuales se firman digitalmente con validez jurídica completa ante entes evaluadores.
                </p>
                <div className="flex items-center gap-2 text-[9px] font-mono text-text-main uppercase font-semibold">
                    <Fingerprint size={12} />
                    <span>Integración Segura FirmaEC</span>
                </div>
            </div>
            <div className="bento-card static p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 border border-border-thin rounded bg-bg-deep text-text-main">
                        <Cpu size={18} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-text-main">Automatización e IA</h3>
                </div>
                <p className="text-xs text-text-dim leading-relaxed">
                    Verificación de formato en propuestas previas al envío y asistencia para mapear de manera precisa los proyectos a las líneas de investigación institucionales válidas.
                </p>
                <div className="flex items-center gap-2 text-[9px] font-mono text-text-main uppercase font-semibold">
                    <MessageSquareCode size={12} />
                    <span>Control Automatizado</span>
                </div>
            </div>
        </section>
    );
};

export default TechFirma;
