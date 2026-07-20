import React from 'react';
import type { EstadoConteo } from '../types/analytics.types';

export interface DonutChartProps {
    elements: EstadoConteo[];
    total: number;
    selectedSegment: string | null;
    setSelectedSegment: (seg: string | null) => void;
}

export const DonutChart: React.FC<DonutChartProps> = ({
    elements,
    total,
    selectedSegment,
    setSelectedSegment
}) => {
    let accumulatedPercent = 0;

    return (
        <div className="flex justify-center items-center py-4 relative">
            <svg width="170" height="170" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="var(--border)"
                    strokeWidth="5"
                    className="opacity-45"
                />
                {elements.map((item, idx) => {
                    const pct = (item.cantidad / (total || 1)) * 100;
                    const strokeDash = `${pct} ${100 - pct}`;
                    const currentOffset = accumulatedPercent;
                    accumulatedPercent += pct;

                    const isSelected = selectedSegment === item.estado;

                    return (
                        <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth={isSelected ? "8" : "5"}
                            strokeDasharray={strokeDash}
                            strokeDashoffset={100 - currentOffset}
                            strokeLinecap="round"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setSelectedSegment(item.estado)}
                            onMouseLeave={() => setSelectedSegment(null)}
                            style={{ transformOrigin: '50px 50px' }}
                        />
                    );
                })}
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
                {selectedSegment ? (
                    <>
                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider font-mono">
                            {selectedSegment}
                        </span>
                        <span className="text-2xl font-black text-text-main font-mono">
                            {elements.find(i => i.estado === selectedSegment)?.cantidad}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-[8px] font-black text-text-dim uppercase tracking-widest font-mono">
                            TOTAL
                        </span>
                        <span className="text-3xl font-black text-text-main font-mono leading-none">
                            {total}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};
