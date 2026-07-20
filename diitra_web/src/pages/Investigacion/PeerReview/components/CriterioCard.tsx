import React from 'react';
import type { CriterioRubricaDto } from '../../../../services/peerReviewService';
import type { EvaluacionDetalle } from '../hooks/useEvaluacionPage';
import { DEFAULT_RANGES } from '../hooks/useEvaluacionPage';

interface CriterioCardProps {
    numero: number;
    detalle: EvaluacionDetalle;
    criterioInfo?: CriterioRubricaDto;
    porcentaje: number;
    onPuntajeChange: (v: number) => void;
    onObsChange: (v: string) => void;
    disabled?: boolean;
    cacesRanges: any[];
}

export const CriterioCard: React.FC<CriterioCardProps> = ({
    numero, detalle, criterioInfo, porcentaje, onPuntajeChange, onObsChange, disabled, cacesRanges
}) => {
    const getCacesRango = (pct: number) => {
        const ranges = Array.isArray(cacesRanges) && cacesRanges.length > 0 ? cacesRanges : DEFAULT_RANGES;
        const sorted = [...ranges].sort((a, b) => a.max - b.max);
        for (const r of sorted) {
            if (pct < r.max) {
                return r;
            }
        }
        return sorted[sorted.length - 1] || { label: 'Excelente', badgeClass: 'text-success bg-success/10 border-success/20' };
    };

    const cacesInfo = getCacesRango(porcentaje);

    const color = cacesInfo.label.toLowerCase().includes('excelente') || cacesInfo.label.toLowerCase().includes('cumplido')
        ? 'var(--color-success)'
        : cacesInfo.label.toLowerCase().includes('satisfactorio')
            ? 'var(--color-info)'
            : cacesInfo.label.toLowerCase().includes('poco') || cacesInfo.label.toLowerCase().includes('proceso')
                ? 'var(--color-warning)'
                : 'var(--color-error)';

    const presets = [
        { label: 'Deficiente (25%)', pct: 0.25 },
        { label: 'Regular (50%)', pct: 0.50 },
        { label: 'Bueno (75%)', pct: 0.75 },
        { label: 'Excelente (100%)', pct: 1.00 },
    ];

    return (
        <div className="bento-card static p-5 space-y-4 hover:border-border-hover transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-surface border border-border-thin flex items-center justify-center text-[10px] font-semibold text-text-dim shrink-0">
                        {numero}
                    </span>
                    <div>
                        <h4 className="text-sm font-semibold text-text-main leading-tight">{detalle.criterio}</h4>
                        {criterioInfo?.descripcion && (
                            <p className="text-[10px] text-text-dim mt-1 leading-relaxed">{criterioInfo.descripcion}</p>
                        )}
                    </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            min={0}
                            max={detalle.max}
                            step={0.5}
                            value={detalle.puntaje}
                            disabled={disabled}
                            onChange={(e) => {
                                let val = parseFloat(e.target.value);
                                if (isNaN(val)) val = 0;
                                if (val < 0) val = 0;
                                if (val > detalle.max) val = detalle.max;
                                onPuntajeChange(val);
                            }}
                            className={`w-14 h-7 text-center font-bold bg-surface focus:bg-bg-deep border border-border-thin rounded text-sm text-text-main font-mono py-0 px-1 focus:border-text-main transition-colors select-all disabled:cursor-not-allowed ${disabled ? 'bg-surface border-dashed border-border-thin text-text-dim opacity-70' : 'hover:bg-surface-hover'}`}
                            style={{ color }}
                        />
                        <span className="text-text-dim text-xs font-semibold">/{detalle.max}</span>
                    </div>
                    {criterioInfo && (
                        <p className="text-[9px] font-mono text-text-dim uppercase tracking-wider">
                            Peso: {criterioInfo.peso_porcentaje}%
                        </p>
                    )}
                </div>
            </div>

            <div className="py-1">
                <input
                    type="range"
                    min={0}
                    max={detalle.max}
                    step={0.5}
                    value={detalle.puntaje}
                    disabled={disabled}
                    onChange={(e) => onPuntajeChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-surface-hover rounded-lg cursor-pointer focus:outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ accentColor: color }}
                />
            </div>

            <div className="flex flex-wrap gap-2 items-center justify-between mt-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-text-dim font-semibold uppercase tracking-wider">Nivel CACES:</span>
                    <span className={`badge-vercel text-[9px] font-semibold px-1.5 py-0.5 rounded transition-all duration-300 ${cacesInfo.badgeClass}`}>
                        {cacesInfo.label}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {presets.map(p => {
                        const targetScore = detalle.max * p.pct;
                        const isSelected = Math.abs(detalle.puntaje - targetScore) < 0.01;
                        return (
                            <button
                                key={p.label}
                                type="button"
                                disabled={disabled}
                                onClick={() => onPuntajeChange(targetScore)}
                                className={`bg-surface border border-border-thin text-text-dim font-sans text-[10px] font-semibold uppercase tracking-wider py-1 px-2.5 rounded transition-all cursor-pointer inline-flex items-center gap-1 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-text-main hover:enabled:bg-surface-hover hover:enabled:text-text-main ${isSelected ? 'bg-text-main text-bg-deep border-text-main' : ''}`}
                            >
                                {isSelected && <span className="mr-0.5 font-bold">✓</span>}
                                {p.label.split(' ')[0]}
                            </button>
                        );
                    })}
                </div>
            </div>

            <textarea
                className={`input-vercel !text-xs h-16 resize-none mt-2 ${disabled ? 'bg-surface border-dashed border-border-thin text-text-dim opacity-70 cursor-not-allowed' : ''}`}
                placeholder={`Justificación y observaciones específicas sobre ${detalle.criterio.toLowerCase()}...`}
                value={detalle.observaciones}
                disabled={disabled}
                onChange={(e) => onObsChange(e.target.value)}
            />
        </div>
    );
};
