import React from 'react';
import type { Career } from '../types';

interface LinkedCareersSectionProps {
    carreras_ids: number[];
    carreras: Career[];
    formatCareerName: (name: string) => string;
}

export const LinkedCareersSection: React.FC<LinkedCareersSectionProps> = ({
    carreras_ids,
    carreras,
    formatCareerName
}) => {
    const linkedCareers = carreras_ids.map(carrId => {
        const career = carreras.find(c => c.id_carrera === carrId);
        return career ? career.carrera1 : null;
    }).filter(c => c !== null) as string[];

    const filtered = linkedCareers.filter((cName: string) => {
        const clean = cName.trim().toUpperCase();
        return clean !== 'DOCENTE' && clean !== 'ESTUDIANTE';
    });

    return (
        <section className="space-y-2 p-6 bg-bg-deep/20 rounded-2xl border border-border-thin">
            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Carreras Vinculadas Automáticamente</label>
            {filtered.length === 0 ? (
                <div className="p-3 text-center text-[10px] text-text-dim font-mono bg-bg-deep/30 rounded-xl border border-dashed border-border-thin">
                    Sin carreras vinculadas.
                </div>
            ) : (
                <div className="flex flex-wrap gap-2 p-4 bg-bg-deep/40 rounded-xl border border-border-thin">
                    {filtered.map((cName, idx) => (
                        <span key={idx} className="badge-vercel badge-vercel-info text-[9px] py-1 px-2.5 font-bold uppercase">
                            {formatCareerName(cName)}
                        </span>
                    ))}
                </div>
            )}
        </section>
    );
};
