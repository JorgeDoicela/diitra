import React from 'react';

export const INSTITUTIONAL_COLOR_PRESETS = [
    '#222c57', // Azul Marino ISTPET
    '#c4a857', // Dorado Institucional
    '#475569', // Gris Neutro
    '#065f46', // Verde Institucional
    '#000000', // Negro
    '#ffffff', // Blanco
];

export const TOKEN_COLOR_MAP: Record<string, string> = {
    blue: '#222c57',
    navy: '#222c57',
    gold: '#c4a857',
    gray: '#475569',
    slate: '#475569',
    emerald: '#065f46',
    white: '#ffffff',
    black: '#000000',
    none: 'transparent',
    transparent: 'transparent',
};

/**
 * Resuelve cualquier valor (token legacy como 'navy' o 'gold', o HEX directo)
 * retornando siempre un color utilizable en CSS.
 */
export function resolveHeaderColor(value?: string, fallback = '#222c57'): string {
    if (!value) return fallback;
    const clean = value.trim().toLowerCase();
    if (clean.startsWith('#') || clean.startsWith('rgb') || clean.startsWith('hsl')) {
        return value;
    }
    return TOKEN_COLOR_MAP[clean] || (clean.length === 6 || clean.length === 3 ? `#${clean}` : fallback);
}

/**
 * Calcula automáticamente un color de texto de alto contraste (blanco o gris oscuro)
 * basado en la luminosidad del color de fondo provisto.
 */
export function getContrastFg(colorVal?: string): string {
    if (!colorVal) return '#ffffff';
    const resolved = resolveHeaderColor(colorVal);
    if (resolved === 'transparent') return '#1e293b';

    let hex = resolved.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) return '#ffffff';

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

interface ColorPickerFieldProps {
    label?: string;
    value?: string;
    onChange: (color: string) => void;
    fallback?: string;
    presets?: string[];
    allowTransparent?: boolean;
    inputCls?: string;
}

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
    label,
    value,
    onChange,
    fallback = '#222c57',
    presets = INSTITUTIONAL_COLOR_PRESETS,
    allowTransparent = false,
}) => {
    const rawVal = value || fallback;
    const isTransparent = allowTransparent && (rawVal === 'none' || rawVal === 'transparent');
    const resolvedHex = resolveHeaderColor(isTransparent ? 'transparent' : rawVal, fallback);
    const safePickerVal = (resolvedHex.startsWith('#') && (resolvedHex.length === 7 || resolvedHex.length === 4))
        ? resolvedHex
        : fallback;

    const displayHex = isTransparent
        ? 'SIN FONDO'
        : (resolvedHex.startsWith('#') ? resolvedHex.toUpperCase() : safePickerVal.toUpperCase());

    return (
        <div className="space-y-1.5 font-sans w-full max-w-full">
            {label && (
                <label className="text-[10px] font-bold text-text-dim block uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div className="flex items-center gap-1.5 w-full max-w-full">
                {/* Cuadro de color nativo */}
                <input
                    type="color"
                    value={isTransparent ? '#ffffff' : safePickerVal}
                    onChange={e => onChange(e.target.value)}
                    className="w-7 h-7 rounded border border-border-thin p-0 cursor-pointer bg-transparent shrink-0"
                    title="Seleccionar color personalizado"
                />

                {/* Input de texto HEX con ancho fijo estricto */}
                <input
                    type="text"
                    value={displayHex}
                    onChange={e => onChange(e.target.value)}
                    placeholder="#222C57"
                    className="text-xs bg-surface border border-border-thin rounded-md text-text-main focus:outline-none font-mono text-[9.5px] uppercase w-20 shrink-0 px-1.5 py-1 text-center font-semibold"
                />

                {/* Presets circulares */}
                <div className="flex items-center gap-1.5 ml-auto shrink-0 flex-wrap justify-end">
                    {presets.map(preset => {
                        const isSelected = !isTransparent && resolvedHex.toLowerCase() === preset.toLowerCase();
                        return (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => onChange(preset)}
                                className={`w-4 h-4 rounded-full border transition-all hover:scale-110 cursor-pointer shrink-0 ${
                                    isSelected
                                        ? 'ring-2 ring-text-main ring-offset-1 ring-offset-surface scale-110 border-black/30 dark:border-white/30'
                                        : 'border-border-thin opacity-85 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: preset }}
                                title={preset}
                            />
                        );
                    })}

                    {/* Botón Sin Fondo solo si allowTransparent es true */}
                    {allowTransparent && (
                        <button
                            type="button"
                            onClick={() => onChange('none')}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all cursor-pointer shrink-0 ${
                                isTransparent
                                    ? 'bg-surface-hover border-text-main text-text-main ring-1 ring-text-main'
                                    : 'border-border-thin text-text-dim hover:text-text-main hover:bg-surface-hover/50'
                            }`}
                            title="Sin color de fondo"
                        >
                            Sin fondo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

