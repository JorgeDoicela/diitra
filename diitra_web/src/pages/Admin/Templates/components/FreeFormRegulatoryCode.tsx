import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Move, Check, X, Edit3 } from 'lucide-react';
import { useFreeFormDrag, type FreeFormPosition } from '../hooks/useFreeFormDrag';

interface FreeFormRegulatoryCodeProps {
    pageIndex: number;
    pageNum: number;
    isCoverPage: boolean;
    isLandscape: boolean;
    docCode: string;
    themeConfig: any;
    onUpdateThemeConfig?: (newThemeJson: string) => void;
    onUpdateRegulatoryCode?: (newCode: string) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export const FreeFormRegulatoryCode: React.FC<FreeFormRegulatoryCodeProps> = ({
    pageIndex,
    pageNum,
    isCoverPage,
    isLandscape,
    docCode,
    themeConfig,
    onUpdateThemeConfig,
    onUpdateRegulatoryCode,
    containerRef
}) => {
    // 1. Resolver posición guardada o valores por defecto institucionales
    const defaultPos: FreeFormPosition = useMemo(() => {
        if (isLandscape) {
            return { x: 72, y: 1.5 };
        }
        return { x: 65, y: 1.2 };
    }, [isLandscape]);

    const brand = themeConfig?.brand || {};
    const codePos: FreeFormPosition = useMemo(() => {
        if (isLandscape && brand.codePositionLandscape) {
            return {
                x: Number(brand.codePositionLandscape.x ?? defaultPos.x),
                y: Number(brand.codePositionLandscape.y ?? defaultPos.y)
            };
        }
        if (brand.codePosition) {
            return {
                x: Number(brand.codePosition.x ?? defaultPos.x),
                y: Number(brand.codePosition.y ?? defaultPos.y)
            };
        }
        return defaultPos;
    }, [isLandscape, brand.codePosition, brand.codePositionLandscape, defaultPos]);

    const variant = (brand.codeVariant as 'minimal' | 'badge' | 'boxed') || 'minimal';
    const fontSize = brand.codeFontSize || '8pt';

    // 2. Estado de edición inline
    const [isEditing, setIsEditing] = useState(false);
    const [tempCode, setTempCode] = useState(docCode);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTempCode(docCode);
    }, [docCode]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    // 3. Callback de finalización de arrastre libre
    const handlePositionChanged = (_elemId: string, newPos: FreeFormPosition) => {
        if (!onUpdateThemeConfig) return;

        const roundedPos: FreeFormPosition = {
            x: Math.round(newPos.x * 10) / 10,
            y: Math.round(newPos.y * 10) / 10
        };

        const updatedTheme = {
            ...themeConfig,
            brand: {
                ...brand,
                ...(isLandscape 
                    ? { codePositionLandscape: roundedPos } 
                    : { codePosition: roundedPos }
                )
            }
        };

        onUpdateThemeConfig(JSON.stringify(updatedTheme));
    };

    const { isDragging, dragHandlers } = useFreeFormDrag<'regulatory_code'>(
        containerRef,
        handlePositionChanged
    );

    // 4. Guardar código normativo editado
    const handleSaveCode = (e?: React.SyntheticEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setIsEditing(false);
        const clean = tempCode.trim();
        if (onUpdateRegulatoryCode) {
            onUpdateRegulatoryCode(clean);
        }
    };

    const handleCancelCode = (e?: React.SyntheticEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setIsEditing(false);
        setTempCode(docCode);
    };

    // Respetar visibilidad condicional
    const showOnCover = brand.showCodeOnCover ?? false;
    const showOnPages = brand.showCodeOnPages ?? true;
    if (isCoverPage && !showOnCover) return null;
    if (!isCoverPage && !showOnPages) return null;

    // Desactivar drag handlers mientras se está editando inline para permitir clicks en botones y selecciones de texto
    const handlers = isEditing ? {} : dragHandlers('regulatory_code', codePos);

    return (
        <div
            style={{
                position: 'absolute',
                left: `${codePos.x}%`,
                top: `${codePos.y}%`,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                zIndex: isDragging ? 1000 : 40,
                transform: 'none',
                transition: 'none',
            }}
            {...handlers}
            onClick={(e) => {
                e.stopPropagation();
            }}
            className={`group/regcode select-none ${
                isDragging 
                    ? 'ring-2 ring-indigo-500 bg-white/95 dark:bg-zinc-900/95 shadow-xl rounded' 
                    : isEditing
                        ? 'rounded'
                        : 'hover:ring-1 hover:ring-indigo-400/60 rounded cursor-grab active:cursor-grabbing'
            }`}
            data-page-index={pageIndex}
            title={pageNum ? `Código oficial en página ${pageNum}. Arrastra libremente o haz clic para editar.` : 'Código oficial. Arrastra libremente o haz clic para editar.'}
        >
            {/* Badge visual de arrastre (idéntico a los elementos de portada) */}
            <span className={`absolute -top-5 left-1/2 -translate-x-1/2 ${isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover/regcode:opacity-100'} transition-all duration-150 bg-indigo-600 text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded-full pointer-events-none select-none whitespace-nowrap flex items-center gap-1 shadow-md z-50`}>
                <Move className="w-2.5 h-2.5" />
                Código Normativo
            </span>

            {/* Contenido editable in-place (cero saltos ni cambios de layout) */}
            {isEditing ? (
                <div 
                    className="relative inline-flex items-center"
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onPointerDown={e => e.stopPropagation()}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={tempCode}
                        onChange={e => setTempCode(e.target.value)}
                        onMouseDown={e => e.stopPropagation()}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveCode(e);
                            if (e.key === 'Escape') handleCancelCode(e);
                        }}
                        onBlur={() => handleSaveCode()}
                        placeholder="Ej: F – ISTPET – 001 – INDIV – ABR 2026"
                        style={{ 
                            fontSize,
                            width: `${Math.max((tempCode || docCode).length + 2, 14)}ch`,
                        }}
                        className="font-mono font-bold text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border-2 border-indigo-500 rounded px-2 py-0.5 outline-none tracking-wider shadow-md text-left"
                    />

                    {/* Botones de confirmación flotantes sin comprimir el input */}
                    <div className="absolute -top-7 right-0 flex items-center gap-1 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-700 shadow-md rounded-md px-1.5 py-0.5 z-50 text-[9px]">
                        <button
                            type="button"
                            onMouseDown={e => e.stopPropagation()}
                            onClick={handleSaveCode}
                            title="Guardar código normativo (Enter)"
                            className="flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-1 py-0.5 rounded cursor-pointer font-bold transition-colors"
                        >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Guardar</span>
                        </button>
                        <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-700" />
                        <button
                            type="button"
                            onMouseDown={e => e.stopPropagation()}
                            onClick={handleCancelCode}
                            title="Cancelar (Esc)"
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={(e) => {
                        // Solo activar edición si no se estuvo arrastrando
                        if (!isDragging) {
                            e.stopPropagation();
                            setIsEditing(true);
                        }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${
                        variant === 'badge'
                            ? 'bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-300 dark:border-zinc-700 shadow-2xs backdrop-blur-xs'
                            : variant === 'boxed'
                                ? 'bg-white/80 dark:bg-zinc-900/80 border-1.5 border-[#222c57] dark:border-zinc-300 shadow-2xs'
                                : 'border border-dashed border-transparent hover:border-indigo-300 dark:hover:border-zinc-600 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xs'
                    }`}
                >
                    <span
                        style={{ fontSize }}
                        className={`font-mono font-bold tracking-wider leading-none ${
                            variant === 'boxed'
                                ? 'text-[#222c57] dark:text-zinc-100'
                                : 'text-slate-600 dark:text-zinc-300 group-hover/regcode:text-slate-950 dark:group-hover/regcode:text-white'
                        }`}
                    >
                        {docCode || <span className="text-slate-400 font-sans italic font-normal text-[7pt]">+ Código Oficial</span>}
                    </span>
                    <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/regcode:opacity-100 transition-opacity" />
                </div>
            )}
        </div>
    );
};
