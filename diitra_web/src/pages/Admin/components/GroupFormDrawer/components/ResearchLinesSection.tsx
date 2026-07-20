import React from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';
import type { ResearchLine } from '../types';

interface ResearchLinesSectionProps {
    lines: ResearchLine[];
    selectedLineIds: number[];
    toggleLine: (id: number) => void;
}

export const ResearchLinesSection: React.FC<ResearchLinesSectionProps> = ({
    lines,
    selectedLineIds,
    toggleLine
}) => {
    return (
        <section className="space-y-6">
            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={12} /> Líneas de Investigación Institucionales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-6 bg-bg-deep/20 rounded-2xl border border-border-thin">
                {lines.map(line => (
                    <div
                        key={line.id}
                        onClick={() => toggleLine(line.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                            selectedLineIds.includes(line.id)
                                ? 'bg-text-main/10 border-text-main text-text-main'
                                : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                        }`}
                    >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedLineIds.includes(line.id) ? 'border-text-main bg-text-main' : 'border-border-thin'
                        }`}>
                            {selectedLineIds.includes(line.id) && <CheckCircle size={10} className="text-bg-deep" />}
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-tight">{line.nombre}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};
