import React from 'react';
import { Globe } from 'lucide-react';

const Interoperability: React.FC = () => {
    return (
        <section className="text-center space-y-8 py-12 lg:-ml-24 lg:-mr-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-thin text-[10px] font-mono text-text-dim uppercase bg-surface/50">
                <Globe size={10} />
                Sincronización de Datos
            </div>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tighter text-text-main">
                Conectado con su <br /> Gestión Académica.
            </h3>
            <p className="text-xs text-text-dim max-w-md mx-auto leading-relaxed">
                DIITRA se acopla a las bases de datos académicas para validar en tiempo real los distributivos y horas asignadas a investigación de cada docente del Tecnológico Traversari.
            </p>
        </section>
    );
};

export default Interoperability;
