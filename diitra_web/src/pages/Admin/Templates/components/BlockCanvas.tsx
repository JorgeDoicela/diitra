/**
 * @file BlockCanvas.tsx
 * @description Lienzo A4 interactivo de previsualización y maquetación visual de plantillas en DIITRA.
 * 
 * @architecture
 * Implementa el patrón **Renderer Registry / Component Delegation**.
 * En lugar de acumular el código de renderizado de cada tipo de bloque en este archivo monolítico,
 * delega la representación visual de cada elemento a renderizadores especializados (`canvasRenderers/`)
 * e integra la lista ordenable mediante `SortableBlockItem` y `@dnd-kit/sortable`.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Layers, Trash2, FileText } from 'lucide-react';
import type { DocumentBlock } from '../types';
import { SortableBlockItem } from './SortableBlockItem';
import { DYN_COLORS, HEADER_STYLE_OPTIONS, getHeaderStylePair } from './canvasRenderers/RenderCover';
import type { HeaderStylePair } from './canvasRenderers/RenderCover';
import { mergeWithDefaults } from '../utils/theme-schema';

export { DYN_COLORS, HEADER_STYLE_OPTIONS, getHeaderStylePair };
export type { HeaderStylePair };

interface BlockCanvasProps {
    blocks: DocumentBlock[];
    activeBlockId: string | null;
    onSelectBlock: (id: string | null) => void;
    onToggleActive: (index: number) => void;
    onDeleteBlock: (id: string) => void;
    onDuplicateBlock: (id: string) => void;
    templateName?: string;
    isDirty?: boolean;
    headerCollapsed?: boolean;
    onToggleHeader?: () => void;
    rightActions?: React.ReactNode;
    themeConfig?: any;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
    selectedTemplate?: any;
    onSaveTemplate?: () => void;
    saving?: boolean;
    onCellChange?: any;
    onAddRow?: any;
    onRemoveRow?: any;
    isDark?: boolean;
    onToggleHeaderCollapse?: () => void;
}

/** Indicador visual de salto de página A4 con opción de eliminación directa */
const PageBreakIndicator: React.FC<{
    pageNum: number;
    pageBreakBlockId?: string;
    onDeleteBlock: (id: string) => void;
}> = ({ pageNum, pageBreakBlockId, onDeleteBlock }) => {
    return (
        <div className="w-full flex items-center justify-between my-4 select-none group">
            <div className="flex-1 border-t-2 border-dashed border-slate-300 dark:border-slate-700" />
            <div className="mx-4 flex items-center gap-2 px-3 py-1 bg-slate-800 text-white rounded-full text-[10px] font-bold shadow-sm">
                <span>PÁGINA {pageNum}</span>
                {pageBreakBlockId && (
                    <button
                        type="button"
                        onClick={() => onDeleteBlock(pageBreakBlockId)}
                        className="p-0.5 hover:bg-white/20 rounded text-slate-300 hover:text-red-300 transition-colors cursor-pointer"
                        title="Eliminar salto de página"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
            </div>
            <div className="flex-1 border-t-2 border-dashed border-slate-300 dark:border-slate-700" />
        </div>
    );
};

export const BlockCanvas: React.FC<BlockCanvasProps> = ({
    blocks,
    activeBlockId,
    onSelectBlock,
    onToggleActive,
    onDeleteBlock,
    onDuplicateBlock,
    templateName,
    isDirty,
    headerCollapsed,
    onToggleHeader,
    onToggleHeaderCollapse,
    rightActions,
    themeConfig: propsThemeConfig,
    onUpdateConfig,
    selectedTemplate,
}) => {
    const activeRef = useRef<HTMLDivElement>(null);
    const toggleHeaderFn = onToggleHeader || onToggleHeaderCollapse;

    // Obtener la configuración del tema visual unificada (prop directa o extraída de selectedTemplate)
    const themeConfig = useMemo(() => {
        if (propsThemeConfig) return propsThemeConfig;
        if (selectedTemplate?.themeConfigJson) {
            return mergeWithDefaults(selectedTemplate.themeConfigJson);
        }
        return mergeWithDefaults(null);
    }, [propsThemeConfig, selectedTemplate?.themeConfigJson]);

    // Actualización de colores e identidad tipográfica del canvas en base a themeConfig
    if (themeConfig?.colors) {
        DYN_COLORS.blue = themeConfig.colors.primary || '#1e2a4a';
        DYN_COLORS.gold = themeConfig.colors.secondary || '#b8912e';
        DYN_COLORS.gray = themeConfig.colors.text || '#475569';
        DYN_COLORS.tableHeaderBg = themeConfig.colors.tableHeaderBg || DYN_COLORS.blue;
        DYN_COLORS.tableHeaderColor = themeConfig.colors.tableHeaderColor || '#ffffff';
        DYN_COLORS.accent = themeConfig.colors.accent || '#9ad3de';
    }
    if (themeConfig?.typography) {
        DYN_COLORS.fontFamily = themeConfig.typography.fontFamily || "'Calibri', 'Open Sans', Arial, sans-serif";
        DYN_COLORS.baseSize = themeConfig.typography.baseSize || '10pt';
    }

    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [activeBlockId]);

    const activeCount = blocks.filter(b => b.isActive).length;

    // Agrupación dinámica de bloques en páginas A4 lógicas
    const pages: { pageNum: number; blocks: { block: DocumentBlock; originalIndex: number }[]; pageBreakBlockId?: string }[] = [];
    let currentPageBlocks: { block: DocumentBlock; originalIndex: number }[] = [];
    let currentPageNum = 1;

    blocks.forEach((block, idx) => {
        if (block.type === 'page_break') {
            pages.push({ pageNum: currentPageNum, blocks: currentPageBlocks, pageBreakBlockId: block.id });
            currentPageBlocks = [];
            currentPageNum++;
        } else if (block.type === 'cover') {
            if (currentPageBlocks.length > 0) {
                pages.push({ pageNum: currentPageNum, blocks: currentPageBlocks });
                currentPageNum++;
            }
            pages.push({ pageNum: currentPageNum, blocks: [{ block, originalIndex: idx }] });
            currentPageBlocks = [];
            currentPageNum++;
        } else {
            currentPageBlocks.push({ block, originalIndex: idx });
        }
    });
    if (currentPageBlocks.length > 0 || pages.length === 0) {
        pages.push({ pageNum: currentPageNum, blocks: currentPageBlocks });
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-bg-deep border border-border-thin rounded-md overflow-hidden">
            {/* Header del panel */}
            <div className="p-3 border-b border-border-thin bg-surface flex items-center justify-between shrink-0 shadow-none">
                <span className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-text-main" />
                    {templateName || 'Lienzo de Maquetación (Edición Directa A4)'}
                </span>
                <span className="text-[10px] font-medium text-text-dim transform -translate-x-10">
                    {activeCount} / {blocks.length} visibles
                </span>
                <div className="flex items-center gap-3.5 shrink-0">
                    {rightActions}
                    {rightActions && <div className="w-px h-3.5 bg-border-thin" />}
                    {toggleHeaderFn && (
                        <button
                            type="button"
                            onClick={toggleHeaderFn}
                            className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                            title={headerCollapsed ? "Mostrar cabecera de la página" : "Ocultar cabecera (Modo Enfoque)"}
                        >
                            {headerCollapsed ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m18 15-6-6-6 6" /></svg>
                                    <span className="text-[9px] uppercase tracking-wider font-bold">Mostrar Cabecera</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m6 9 6 6 6-6" /></svg>
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-text-dim/60">Ocultar Cabecera</span>
                                </>
                            )}
                        </button>
                    )}

                    {toggleHeaderFn && <div className="w-px h-3.5 bg-border-thin" />}

                    {isDirty !== undefined && (
                        isDirty ? (
                            <span className="flex items-center gap-1.5 text-[10px] text-text-dim">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Cambios sin guardar
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-[10px] text-text-dim">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Todo guardado
                            </span>
                        )
                    )}
                </div>
            </div>

            {/* Scroll del lienzo */}
            <div
                onClick={() => onSelectBlock(null)}
                className="flex-1 overflow-y-auto p-8 pb-32 bg-bg-deep cursor-default"
                style={{ scrollbarWidth: 'thin' }}
            >
                {!selectedTemplate ? (
                    <div className="force-light-theme max-w-[794px] mx-auto bg-white text-slate-950 p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-200 min-h-[1123px] rounded-sm relative flex flex-col justify-start pt-48 items-center text-center">
                        <FileText className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Sin plantilla seleccionada</h3>
                        <p className="text-[10px] text-slate-400 max-w-[230px] mt-1.5 leading-normal">
                            Selecciona una plantilla o el "Diseño Global Institucional" del Catálogo (izquierda) para comenzar a trabajar.
                        </p>
                    </div>
                ) : blocks.length === 0 ? (
                    <div className="force-light-theme max-w-[794px] mx-auto bg-white text-slate-950 p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-200 min-h-[1123px] rounded-sm relative flex flex-col justify-start pt-48 items-center text-center">
                        <Layers className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">El documento está vacío</h3>
                        <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                            Usa el menú superior "+ Agregar Bloque" para inyectar componentes en esta hoja A4.
                        </p>
                    </div>
                ) : (
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-8 flex flex-col items-center">
                            {pages.map((page, pIdx) => {
                                const isCoverPage = page.blocks.some(b => b.block.type === 'cover');
                                const bgImg = !isCoverPage && themeConfig?.brand?.backgroundImage;
                                const bgOpacity = parseFloat(themeConfig?.brand?.backgroundOpacity ?? '0.12');
                                const bgFit = themeConfig?.brand?.backgroundFit || 'contain';
                                const marginTop = themeConfig?.layout?.marginTop || '3cm';
                                const marginBottom = themeConfig?.layout?.marginBottom || '2cm';
                                const marginLeft = themeConfig?.layout?.marginLeft || '2cm';
                                const marginRight = themeConfig?.layout?.marginRight || '2cm';

                                return (
                                    <React.Fragment key={pIdx}>
                                        {pIdx > 0 && (
                                            <PageBreakIndicator
                                                pageNum={page.pageNum}
                                                pageBreakBlockId={pages[pIdx - 1]?.pageBreakBlockId}
                                                onDeleteBlock={onDeleteBlock}
                                            />
                                        )}
                                        <div
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                fontFamily: DYN_COLORS.fontFamily,
                                                fontSize: DYN_COLORS.baseSize,
                                                paddingTop: isCoverPage ? '0' : marginTop,
                                                paddingBottom: isCoverPage ? '0' : marginBottom,
                                                paddingLeft: isCoverPage ? '0' : marginLeft,
                                                paddingRight: isCoverPage ? '0' : marginRight,
                                            }}
                                            className={`force-light-theme max-w-[794px] w-full bg-white text-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-200 min-h-[1123px] rounded-sm relative flex flex-col transition-all cursor-default ${isCoverPage ? 'gap-0' : 'gap-2'
                                                }`}
                                        >
                                            {bgImg && (
                                                <div
                                                    className="absolute inset-0 pointer-events-none rounded-sm overflow-hidden z-0"
                                                    style={{
                                                        backgroundImage: `url(${bgImg})`,
                                                        backgroundSize: bgFit,
                                                        backgroundPosition: 'center center',
                                                        backgroundRepeat: 'no-repeat',
                                                        opacity: bgOpacity,
                                                    }}
                                                />
                                            )}

                                            {page.blocks.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded p-6 text-slate-400 italic text-[10px] relative z-10">
                                                    Página vacía. Arrastra bloques aquí o escribe contenido.
                                                </div>
                                            ) : (
                                                page.blocks.map(({ block, originalIndex }) => {
                                                    const isActiveBlock = activeBlockId === block.id;

                                                    return (
                                                        <div key={block.id} ref={isActiveBlock ? activeRef : undefined} className="relative z-10">
                                                            <SortableBlockItem
                                                                block={block}
                                                                index={originalIndex}
                                                                isActive={isActiveBlock}
                                                                coverImage={themeConfig?.brand?.coverImage || undefined}
                                                                onSelectBlock={onSelectBlock}
                                                                onToggleActive={onToggleActive}
                                                                onDeleteBlock={onDeleteBlock}
                                                                onDuplicateBlock={onDuplicateBlock}
                                                                onUpdateConfig={onUpdateConfig}
                                                                themeConfig={themeConfig}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </SortableContext>
                )}
            </div>
        </div>
    );
};
