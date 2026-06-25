import React from 'react';
import { Globe, Terminal } from 'lucide-react';

const Interoperability: React.FC = () => {
    return (
        <section className="text-center space-y-8 py-16 lg:-ml-24 lg:-mr-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-thin text-[10px] font-mono text-text-dim uppercase bg-surface/50 select-none">
                <Globe size={10} />
                Sincronización de Datos
            </div>
            <h3 className="text-3xl md:text-5xl lg:text-[56px] font-bold tracking-tighter text-text-main leading-[0.95]">
                Conectado con su <br className="hidden md:inline" /> Gestión Académica.
            </h3>
            <p className="text-xs text-text-dim max-w-lg mx-auto leading-relaxed">
                DIITRA se acopla a las bases de datos académicas para validar en tiempo real los distributivos y horas asignadas a investigación de cada docente del Tecnológico Traversari.
            </p>

            {/* Mock API Terminal Box */}
            <div className="max-w-xl mx-auto border border-border-thin rounded-xl bg-surface/35 backdrop-blur-sm shadow-xl p-4 font-mono text-[11px] text-left relative overflow-hidden select-none">
                <div className="flex items-center gap-1.5 border-b border-border-thin pb-2.5 mb-3">
                    <Terminal size={12} className="text-text-dim" />
                    <span className="text-[10px] text-text-dim font-bold">// API Sincronización ISTPET</span>
                </div>
                <div className="space-y-1.5 text-text-dim">
                    <p className="text-text-main">
                        <span className="text-brand">$</span> curl -X POST https://api.diitra.edu.ec/v1/sync \
                    </p>
                    <p className="pl-4">
                        -H <span className="text-success">"Authorization: Bearer token_istpet_2026"</span>
                    </p>
                    <p className="text-text-main mt-3">// RESPONSE OK (200)</p>
                    <p className="text-success font-medium">
                        {`{ "status": "synchronized", "academic_period": "2025-2026", "teachers_loaded": 48 }`}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Interoperability;
