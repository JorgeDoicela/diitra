import React from 'react';
import { ColorPickerField, resolveHeaderColor } from './SharedColorPicker';

export interface BorderConfig {
    style: 'solid' | 'dashed' | 'double' | 'none' | string;
    color: string;
    width: number;
}

export const DEFAULT_BORDER_PRESETS: Array<{
    label: string;
    config: BorderConfig;
}> = [
    { label: 'Negro Institucional', config: { style: 'solid', color: '#000000', width: 1 } },
    { label: 'Gris Claro', config: { style: 'solid', color: '#cbd5e1', width: 1 } },
    { label: 'Azul ISTPET', config: { style: 'solid', color: '#222c57', width: 1 } },
    { label: 'Dorado', config: { style: 'solid', color: '#c4a857', width: 1 } },
    { label: 'Marcado', config: { style: 'solid', color: '#334155', width: 2 } },
    { label: 'Sin Bordes', config: { style: 'none', color: 'transparent', width: 0 } },
];

export function resolveBorderStyle(style?: string): string {
    if (!style) return 'solid';
    const clean = style.trim().toLowerCase();
    if (['solid', 'dashed', 'double', 'none'].includes(clean)) return clean;
    return 'solid';
}

export function resolveBorderColor(color?: string, fallback = '#000000'): string {
    if (!color) return fallback;
    return resolveHeaderColor(color, fallback);
}

export function resolveBorderWidth(width?: number | string, fallback = 1): number {
    if (width === undefined || width === null) return fallback;
    const n = typeof width === 'string' ? parseInt(width, 10) : width;
    return isNaN(n) || n < 0 ? fallback : n;
}

export function resolveBorderCss(config?: Partial<BorderConfig>) {
    const style = resolveBorderStyle(config?.style);
    const color = resolveBorderColor(config?.color);
    const width = resolveBorderWidth(config?.width);

    if (style === 'none' || width === 0) {
        return {
            tableBorder: 'border: 0;',
            cellBorder: 'border-bottom: 1px solid #f1f5f9;',
            style: 'none',
            color: 'transparent',
            width: 0,
            cssString: 'none',
        };
    }

    const cssString = `${width}px ${style} ${color}`;
    return {
        tableBorder: `border: ${cssString};`,
        cellBorder: `border: ${cssString};`,
        style,
        color,
        width,
        cssString,
    };
}

interface BorderPickerFieldProps {
    label?: string;
    borderStyle?: string;
    borderColor?: string;
    borderWidth?: number | string;
    onBorderStyleChange?: (style: string) => void;
    onBorderColorChange?: (color: string) => void;
    onBorderWidthChange?: (width: number) => void;
    onChangeAll?: (config: BorderConfig) => void;
    showColorPicker?: boolean;
    showWidthPicker?: boolean;
    showPresets?: boolean;
}

export const BorderPickerField: React.FC<BorderPickerFieldProps> = ({
    label = 'Bordes de Sección',
    borderStyle = 'solid',
    borderColor = '#cbd5e1',
    borderWidth = 1,
    onBorderStyleChange,
    onBorderColorChange,
    onBorderWidthChange,
    onChangeAll,
    showColorPicker = true,
    showWidthPicker = true,
    showPresets = true,
}) => {
    const currentStyle = resolveBorderStyle(borderStyle);
    const currentColor = resolveBorderColor(borderColor);
    const currentWidth = resolveBorderWidth(borderWidth);

    const handleStyleSelect = (st: string) => {
        onBorderStyleChange?.(st);
        onChangeAll?.({ style: st, color: currentColor, width: currentWidth });
    };

    const handleColorSelect = (col: string) => {
        onBorderColorChange?.(col);
        onChangeAll?.({ style: currentStyle, color: col, width: currentWidth });
    };

    const handleWidthSelect = (w: number) => {
        onBorderWidthChange?.(w);
        onChangeAll?.({ style: currentStyle, color: currentColor, width: w });
    };

    const handleApplyPreset = (preset: BorderConfig) => {
        onBorderStyleChange?.(preset.style);
        onBorderColorChange?.(preset.color);
        onBorderWidthChange?.(preset.width);
        onChangeAll?.(preset);
    };

    const isNone = currentStyle === 'none';

    return (
        <div className="space-y-2.5 font-sans w-full max-w-full">
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-text-dim block uppercase tracking-wider">
                        {label}
                    </label>
                    {/* Indicador visual en miniatura del borde actual */}
                    <div
                        className="w-10 h-3 rounded transition-all shrink-0 bg-surface shadow-2xs"
                        style={{
                            borderStyle: isNone ? 'dashed' : currentStyle,
                            borderColor: isNone ? '#cbd5e1' : currentColor,
                            borderWidth: isNone ? '1px' : `${Math.min(currentWidth, 3)}px`,
                            opacity: isNone ? 0.4 : 1,
                        }}
                        title={isNone ? 'Sin bordes exteriores' : `Borde ${currentStyle} ${currentWidth}px (${currentColor})`}
                    />
                </div>
            )}

            {/* Presets rápidos */}
            {showPresets && (
                <div className="flex items-center gap-1 flex-wrap">
                    {DEFAULT_BORDER_PRESETS.map((p) => {
                        const isSelected =
                            p.config.style === currentStyle &&
                            (p.config.style === 'none' ||
                                (p.config.color.toLowerCase() === currentColor.toLowerCase() &&
                                    p.config.width === currentWidth));

                        return (
                            <button
                                key={p.label}
                                type="button"
                                onClick={() => handleApplyPreset(p.config)}
                                className={`px-2 py-0.5 rounded text-[8.5px] font-bold transition-all cursor-pointer border ${
                                    isSelected
                                        ? 'bg-text-main text-bg-deep border-text-main shadow-2xs'
                                        : 'bg-surface hover:bg-surface-hover text-text-dim hover:text-text-main border-border-thin'
                                }`}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selectores de Tipo y Grosor */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                    <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">
                        Estilo
                    </label>
                    <select
                        value={currentStyle}
                        onChange={(e) => handleStyleSelect(e.target.value)}
                        className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1.5 text-xs text-text-main outline-none focus:border-text-main font-medium transition-colors cursor-pointer"
                    >
                        <option value="solid">Sólido Continuo</option>
                        <option value="dashed">Punteado / Guiones</option>
                        <option value="double">Doble Línea</option>
                        <option value="none">Sin Bordes</option>
                    </select>
                </div>

                {showWidthPicker && (
                    <div>
                        <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">
                            Grosor
                        </label>
                        <select
                            disabled={isNone}
                            value={currentWidth}
                            onChange={(e) => handleWidthSelect(Number(e.target.value))}
                            className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1.5 text-xs text-text-main outline-none focus:border-text-main font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <option value={1}>1px (Fino estándar)</option>
                            <option value={2}>2px (Medio institucional)</option>
                            <option value={3}>3px (Grueso énfasis)</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Selector de Color de Borde con ColorPickerField */}
            {showColorPicker && !isNone && (
                <div className="pt-1">
                    <ColorPickerField
                        label="Color del Borde"
                        value={currentColor}
                        onChange={handleColorSelect}
                        fallback="#cbd5e1"
                        presets={['#cbd5e1', '#94a3b8', '#222c57', '#c4a857', '#334155', '#065f46', '#000000']}
                    />
                </div>
            )}
        </div>
    );
};
