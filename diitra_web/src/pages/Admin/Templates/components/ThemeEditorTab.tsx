import React from 'react';
import { Palette, Plus, Trash2, Type, Layout, Shield, RotateCcw } from 'lucide-react';
import { THEME_SCHEMA, mergeWithDefaults, buildDefaultTheme } from '../utils/theme-schema';

interface ThemeEditorTabProps {
    themeConfigJson: string | null | undefined;
    onUpdateThemeConfig: (newThemeJson: string) => void;
    activeBlockId?: string;
    activeBlockType?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}

const LabeledField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-text-dim block">{label}</label>
        {children}
    </div>
);

const inputCls = "w-full text-[11px] bg-surface-hover/60 hover:bg-surface-hover/90 border border-border-thin rounded-md p-2 text-text-main focus:bg-surface focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all focus:outline-none";
const selectCls = "w-full text-[11px] bg-surface-hover/60 hover:bg-surface-hover/90 border border-border-thin rounded-md p-2 text-text-main focus:bg-surface focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all focus:outline-none";

const CATEGORY_META = {
    colors: { label: 'Paleta de Colores', icon: Palette },
    typography: { label: 'Tipografía', icon: Type },
    layout: { label: 'Diseño y Márgenes', icon: Layout },
    brand: { label: 'Marca e Identidad', icon: Shield },
};

export const ThemeEditorTab: React.FC<ThemeEditorTabProps> = ({
    themeConfigJson,
    onUpdateThemeConfig,
    activeBlockId,
    activeBlockType,
    onUpdateConfig,
}) => {
    const theme = React.useMemo(() => {
        return mergeWithDefaults(themeConfigJson);
    }, [themeConfigJson]);

    const handleThemeChange = (category: string, key: string, val: any) => {
        const nextTheme = {
            ...theme,
            [category]: {
                ...(theme as any)[category],
                [key]: val
            }
        };
        onUpdateThemeConfig(JSON.stringify(nextTheme));
        if (key === 'coverImage' && val === '' && activeBlockId && activeBlockType === 'cover' && onUpdateConfig) {
            onUpdateConfig(activeBlockId, 'coverImage', '');
        }
    };

    const categories = ['colors', 'typography', 'layout', 'brand'] as const;

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28 custom-scrollbar">
            <div className="flex items-center justify-between gap-2 border-b border-border-thin/20 pb-3">
                <p className="text-[10px] text-text-dim leading-relaxed">
                    Configura el tema visual y el diseño de página del documento PDF. Estos ajustes aplican a todo el documento.
                </p>
                <button
                    type="button"
                    onClick={() => onUpdateThemeConfig(JSON.stringify(buildDefaultTheme()))}
                    className="p-1.5 text-[10px] font-medium text-text-dim hover:text-text-main hover:bg-surface-hover rounded-md border border-border-thin shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                    title="Restablecer valores institucionales por defecto"
                >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer</span>
                </button>
            </div>

            {categories.map(cat => {
                const meta = CATEGORY_META[cat];
                const CatIcon = meta.icon;
                const tokens = THEME_SCHEMA.filter(t => t.category === cat);

                return (
                    <div key={cat} className="space-y-3 border-t border-border-thin/25 pt-4 first:border-t-0 first:pt-0">
                        <h5 className="text-[10px] font-black text-text-main uppercase tracking-wider flex items-center gap-1.5">
                            <CatIcon className="w-3.5 h-3.5 text-text-main" />
                            {meta.label}
                        </h5>

                        <div className="space-y-4">
                            {tokens.map(token => {
                                const currentVal = (theme as any)[cat]?.[token.camelKey] ?? token.defaultValue;

                                return (
                                    <div key={token.key}>
                                        <LabeledField label={token.label}>
                                            {token.type === 'color' && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-md border border-border-thin shadow-xs overflow-hidden shrink-0 relative bg-surface">
                                                        <input
                                                            type="color"
                                                            value={currentVal}
                                                            onChange={e => handleThemeChange(cat, token.camelKey, e.target.value)}
                                                            className="absolute -inset-2 w-11 h-11 cursor-pointer p-0 border-0"
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={currentVal}
                                                        onChange={e => handleThemeChange(cat, token.camelKey, e.target.value)}
                                                        className="w-full text-[11px] font-mono uppercase tracking-wider border border-border-thin rounded-md p-1.5 bg-surface-hover/60 focus:bg-surface text-text-main focus:outline-none focus:border-black dark:focus:border-white transition-all"
                                                    />
                                                </div>
                                            )}

                                            {token.type === 'select' && (
                                                <select
                                                    value={currentVal}
                                                    onChange={e => handleThemeChange(cat, token.camelKey, e.target.value)}
                                                    className={selectCls}
                                                >
                                                    {token.options?.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {token.type === 'text' && (
                                                <input
                                                    type="text"
                                                    value={currentVal}
                                                    onChange={e => handleThemeChange(cat, token.camelKey, e.target.value)}
                                                    className={inputCls}
                                                    placeholder={`Ej: ${token.defaultValue}`}
                                                />
                                            )}

                                            {token.type === 'toggle' && (
                                                <div className="flex items-center justify-between bg-surface-hover/30 border border-border-thin/15 rounded-md p-2">
                                                    <span className="text-[10px] text-text-dim">Activar</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!currentVal}
                                                        onChange={e => handleThemeChange(cat, token.camelKey, e.target.checked)}
                                                        className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded cursor-pointer"
                                                    />
                                                </div>
                                            )}

                                            {token.type === 'image' && (
                                                <div className="space-y-2">
                                                    {currentVal ? (
                                                        <div className="relative group border border-border-thin rounded-lg overflow-hidden bg-surface-hover/30 p-1.5 flex items-center justify-between gap-3 animate-fade-in">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <img
                                                                    src={currentVal as string}
                                                                    alt={token.label}
                                                                    className="w-10 h-10 object-cover rounded-md border border-border-thin shrink-0 bg-white"
                                                                />
                                                                <div className="text-[10px] text-text-dim truncate">
                                                                    <span className="font-semibold text-text-main block">Personalizado</span>
                                                                    Imagen cargada
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleThemeChange(cat, token.camelKey, '')}
                                                                className="p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-colors duration-150 shrink-0 cursor-pointer"
                                                                title="Eliminar imagen y usar valor por defecto"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="border border-dashed border-border-thin hover:border-text-main/50 rounded-lg p-3 text-center block cursor-pointer bg-surface-hover/20 hover:bg-surface-hover/40 transition-all duration-150 relative">
                                                            <input
                                                                type="file"
                                                                accept="image/png, image/jpeg, image/jpg"
                                                                onChange={e => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onloadend = () => {
                                                                            const base64String = reader.result as string;
                                                                            handleThemeChange(cat, token.camelKey, base64String);
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    }
                                                                }}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            />
                                                            <div className="flex flex-col items-center justify-center gap-1 text-text-dim hover:text-text-main transition-colors">
                                                                <Plus className="w-4 h-4" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Cargar Imagen</span>
                                                                <span className="text-[8px] opacity-75">PNG, JPG hasta 2MB</span>
                                                            </div>
                                                        </label>
                                                    )}
                                                </div>
                                            )}
                                        </LabeledField>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
