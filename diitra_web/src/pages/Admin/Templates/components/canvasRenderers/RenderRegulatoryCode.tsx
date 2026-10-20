import React, { useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Check, X, Edit2, ShieldCheck } from 'lucide-react';

interface RenderRegulatoryCodeProps {
    config: any;
    blockId: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}

export const RenderRegulatoryCode: React.FC<RenderRegulatoryCodeProps> = ({
    config,
    blockId,
    onUpdateConfig
}) => {
    const code = config?.code || config?.regulatoryCode || 'F – ISTPET – 001 – INDIV – ABR 2026';
    const align = config?.align || config?.alignment || 'right';
    const variant = config?.variant || 'minimal'; // 'minimal' | 'badge' | 'boxed'
    const fontSize = config?.fontSize || '8.5pt';

    const [isEditing, setIsEditing] = useState(false);
    const [tempCode, setTempCode] = useState(code);

    const handleSave = () => {
        setIsEditing(false);
        if (onUpdateConfig) {
            onUpdateConfig(blockId, 'code', tempCode.trim());
            onUpdateConfig(blockId, 'regulatoryCode', tempCode.trim());
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempCode(code);
    };

    const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
        if (onUpdateConfig) {
            onUpdateConfig(blockId, 'align', newAlign);
            onUpdateConfig(blockId, 'alignment', newAlign);
        }
    };

    const handleVariantChange = (newVariant: 'minimal' | 'badge' | 'boxed') => {
        if (onUpdateConfig) {
            onUpdateConfig(blockId, 'variant', newVariant);
        }
    };

    const alignClass = 
        align === 'left' ? 'justify-start text-left' :
        align === 'center' ? 'justify-center text-center' :
        'justify-end text-right';

    return (
        <div className="w-full py-1.5 flex flex-col gap-1.5 select-none group/regblock">
            {/* Contenedor principal alineable */}
            <div className={`w-full flex items-center ${alignClass}`}>
                {isEditing ? (
                    <div 
                        className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-blue-500 rounded-md shadow-lg px-2.5 py-1 z-30"
                        onClick={e => e.stopPropagation()}
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <input
                            type="text"
                            autoFocus
                            value={tempCode}
                            onChange={e => setTempCode(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                            placeholder="Ej: F – ISTPET – 001 – INDIV – ABR 2026"
                            className="font-mono text-[8pt] md:text-[8.5pt] font-bold text-slate-800 dark:text-zinc-100 bg-transparent border-none outline-none w-64 tracking-wider"
                        />
                        <button
                            type="button"
                            onClick={handleSave}
                            title="Guardar código (Enter)"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            title="Cancelar (Esc)"
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => {
                            setTempCode(code);
                            setIsEditing(true);
                        }}
                        title="Hacer clic para editar el código normativo oficial"
                        className={`group/code inline-flex items-center gap-2 px-2.5 py-1 rounded transition-all cursor-pointer ${
                            variant === 'badge' 
                                ? 'bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-2xs' 
                                : variant === 'boxed'
                                    ? 'bg-transparent border-1.5 border-[#222c57] dark:border-zinc-300 shadow-2xs'
                                    : 'border border-dashed border-transparent hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <span 
                            style={{ fontSize }}
                            className={`font-mono font-bold tracking-wider transition-colors ${
                                variant === 'boxed' 
                                    ? 'text-[#222c57] dark:text-zinc-100' 
                                    : 'text-slate-600 dark:text-zinc-300 group-hover/code:text-slate-900 dark:group-hover/code:text-white'
                            }`}
                        >
                            {code || <span className="text-slate-400 font-sans italic font-normal text-[7.5pt]">+ Definir código normativo</span>}
                        </span>
                        <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/code:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>

            {/* Quick mini-toolbar para alineación y variante visual cuando no se está editando */}
            {!isEditing && onUpdateConfig && (
                <div className="opacity-0 group-hover/regblock:opacity-100 transition-opacity flex items-center gap-1 justify-center pt-0.5">
                    <div className="inline-flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-[9px] gap-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAlignChange('left'); }}
                            title="Alinear a la izquierda"
                            className={`p-1 rounded transition-colors cursor-pointer ${align === 'left' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                        >
                            <AlignLeft className="w-3 h-3" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAlignChange('center'); }}
                            title="Centrar"
                            className={`p-1 rounded transition-colors cursor-pointer ${align === 'center' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                        >
                            <AlignCenter className="w-3 h-3" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAlignChange('right'); }}
                            title="Alinear a la derecha"
                            className={`p-1 rounded transition-colors cursor-pointer ${align === 'right' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                        >
                            <AlignRight className="w-3 h-3" />
                        </button>

                        <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700 mx-0.5" />

                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleVariantChange('minimal'); }}
                            title="Texto simple"
                            className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${variant === 'minimal' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'}`}
                        >
                            Simple
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleVariantChange('badge'); }}
                            title="Formato cápsula / badge"
                            className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${variant === 'badge' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'}`}
                        >
                            Badge
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleVariantChange('boxed'); }}
                            title="Recuadro oficial"
                            className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${variant === 'boxed' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'}`}
                        >
                            Recuadro
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
