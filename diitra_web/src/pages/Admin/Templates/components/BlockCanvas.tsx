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
import { mergeWithDefaults, getOfficialDocumentCode } from '../utils/theme-schema';
import { FreeFormRegulatoryCode } from './FreeFormRegulatoryCode';

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
    onUpdateThemeConfig?: (newThemeJson: string) => void;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
    onUpdateRegulatoryCode?: (newCode: string) => void;
    selectedTemplate?: any;
    onSaveTemplate?: () => void;
    saving?: boolean;
    onCellChange?: any;
    onAddRow?: any;
    onRemoveRow?: any;
    isDark?: boolean;
    onToggleHeaderCollapse?: () => void;
}

/** Indicador visual de salto de página A4 con opción de cambio de orientación y eliminación */
/** Indicador visual de salto de página A4 con opción de cambio de orientación y eliminación bajo estándar Vercel Geist */
const PageOrientationSegmentedControl: React.FC<{
    isLandscape: boolean;
    onToggle: () => void;
}> = ({ isLandscape, onToggle }) => {
    return (
        <div className="inline-flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-md text-[10px] select-none">
            <button
                type="button"
                onClick={isLandscape ? onToggle : undefined}
                className={`px-2.5 py-0.5 rounded-[4px] text-[10px] transition-all ${
                    !isLandscape
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs cursor-default'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 font-medium cursor-pointer'
                }`}
                title="Página en orientación Vertical (A4 Portrait)"
            >
                Vertical
            </button>
            <button
                type="button"
                onClick={!isLandscape ? onToggle : undefined}
                className={`px-2.5 py-0.5 rounded-[4px] text-[10px] transition-all ${
                    isLandscape
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs cursor-default'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 font-medium cursor-pointer'
                }`}
                title="Página en orientación Horizontal (A4 Landscape)"
            >
                Horizontal
            </button>
        </div>
    );
};

const PageBreakIndicator: React.FC<{
    pageNum: number;
    pageBreakBlockId?: string;
    isLandscape?: boolean;
    onDeleteBlock: (id: string) => void;
    onToggleOrientation?: () => void;
}> = ({ pageNum, pageBreakBlockId, isLandscape = false, onDeleteBlock, onToggleOrientation }) => {
    return (
        <div className="w-[794px] max-w-[794px] flex items-center justify-between my-4 select-none group transition-all">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="mx-3 inline-flex items-center gap-2.5 px-3 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xs text-zinc-900 dark:text-zinc-100">
                <span className="font-mono text-[10.5px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                    PÁGINA {pageNum}
                </span>
                {onToggleOrientation && (
                    <>
                        <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800" />
                        <PageOrientationSegmentedControl
                            isLandscape={isLandscape}
                            onToggle={onToggleOrientation}
                        />
                    </>
                )}
                {pageBreakBlockId && (
                    <>
                        <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800" />
                        <button
                            type="button"
                            onClick={() => onDeleteBlock(pageBreakBlockId)}
                            className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                            title="Eliminar salto de página"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </>
                )}
            </div>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
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
    onUpdateThemeConfig,
    onUpdateConfig,
    onUpdateRegulatoryCode,
    selectedTemplate,
}) => {
    const activeRef = useRef<HTMLDivElement>(null);
    const toggleHeaderFn = onToggleHeader || onToggleHeaderCollapse;

    // Obtener la configuración del tema visual unificada (prop directa o extraída de selectedTemplate)
    const themeConfig = useMemo(() => {
        if (propsThemeConfig) return propsThemeConfig;
        if (selectedTemplate?.themeConfigJson) {
            return mergeWithDefaults(selectedTemplate.themeConfigJson, selectedTemplate.code);
        }
        return mergeWithDefaults(null, selectedTemplate?.code);
    }, [propsThemeConfig, selectedTemplate?.themeConfigJson, selectedTemplate?.code]);

    const docCode = useMemo(() => {
        return (
            selectedTemplate?.regulatoryCode ||
            selectedTemplate?.regulatory_code ||
            themeConfig?.brand?.documentCode ||
            themeConfig?.brand?.document_code ||
            getOfficialDocumentCode(selectedTemplate?.code)
        );
    }, [selectedTemplate?.regulatoryCode, selectedTemplate?.regulatory_code, themeConfig?.brand?.documentCode, themeConfig?.brand?.document_code, selectedTemplate?.code]);


    // Actualización de colores e identidad tipográfica del canvas en base a themeConfig
    if (themeConfig?.colors) {
        DYN_COLORS.blue = themeConfig.colors.primary || '#222c57';
        DYN_COLORS.gold = themeConfig.colors.secondary || '#c4a857';
        DYN_COLORS.gray = themeConfig.colors.text || '#475569';
        DYN_COLORS.tableHeaderBg = themeConfig.colors.tableHeaderBg || DYN_COLORS.blue;
        DYN_COLORS.tableHeaderColor = themeConfig.colors.tableHeaderColor || '#ffffff';
    }
    if (themeConfig?.typography) {
        DYN_COLORS.fontFamily = themeConfig.typography.fontFamily || "'Calibri', 'Open Sans', Arial, sans-serif";
        DYN_COLORS.baseSize = themeConfig.typography.baseSize || '10pt';
    }

    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [activeBlockId]);

    const activeCount = blocks.filter(b => b.isActive).length;

    // Única fuente de verdad: Orientación oficial del documento definida en Estilos (themeConfig)
    const docOrientation = (themeConfig?.layout?.pageOrientation || themeConfig?.layout?.page_orientation || 'portrait') as 'portrait' | 'landscape';
    const sectionOverrides = (themeConfig?.layout?.sectionOrientations || themeConfig?.layout?.section_orientations || {}) as Record<string, 'portrait' | 'landscape'>;

    const handleTogglePageOrientation = (firstBlockId?: string, currentOrientation?: 'portrait' | 'landscape') => {
        if (!firstBlockId || !onUpdateThemeConfig) return;
        const nextOrientation: 'portrait' | 'landscape' = currentOrientation === 'landscape' ? 'portrait' : 'landscape';

        const updatedTheme = JSON.parse(JSON.stringify(themeConfig || {}));
        if (!updatedTheme.layout) updatedTheme.layout = {};
        if (!updatedTheme.layout.sectionOrientations) updatedTheme.layout.sectionOrientations = {};

        if (nextOrientation === docOrientation) {
            delete updatedTheme.layout.sectionOrientations[firstBlockId];
        } else {
            updatedTheme.layout.sectionOrientations[firstBlockId] = nextOrientation;
        }

        onUpdateThemeConfig(JSON.stringify(updatedTheme));
    };

    // Agrupación dinámica de bloques en páginas A4 bajo la orientación del documento y sus secciones
    interface CanvasPage {
        pageNum: number;
        blocks: { block: DocumentBlock; originalIndex: number }[];
        orientation: 'portrait' | 'landscape';
        pageBreakBlockId?: string;
        firstBlockId?: string;
    }

    const pages: CanvasPage[] = [];
    let currentPageBlocks: { block: DocumentBlock; originalIndex: number }[] = [];
    let currentPageNum = 1;
    let pendingPageBreakBlockId: string | undefined = undefined;

    const pushPage = () => {
        if (currentPageBlocks.length === 0) return;
        const firstBlockId = currentPageBlocks[0]?.block?.id;
        const isGantt = currentPageBlocks.some(b => b.block.type === 'gantt');
        const orientation: 'portrait' | 'landscape' = 
            (firstBlockId && sectionOverrides[firstBlockId])
                ? sectionOverrides[firstBlockId]
                : (isGantt ? 'landscape' : docOrientation);

        pages.push({
            pageNum: currentPageNum,
            blocks: currentPageBlocks,
            orientation,
            firstBlockId,
            pageBreakBlockId: pendingPageBreakBlockId,
        });

        currentPageBlocks = [];
        pendingPageBreakBlockId = undefined;
        currentPageNum++;
    };

    blocks.forEach((block, idx) => {
        const hasBreakBefore = (block.config as any)?.pageBreakBefore === true;
        const isGantt = block.type === 'gantt';
        const isCover = block.type === 'cover';
        const isPageBreak = block.type === 'page_break';
        const hasOrientationOverride = !!sectionOverrides[block.id];

        if (isPageBreak) {
            pushPage();
            pendingPageBreakBlockId = block.id;
        } else if (isCover) {
            pushPage();
            currentPageBlocks = [{ block, originalIndex: idx }];
            pushPage();
        } else if (isGantt) {
            pushPage();
            currentPageBlocks = [{ block, originalIndex: idx }];
            pushPage();
        } else if ((hasBreakBefore || hasOrientationOverride) && currentPageBlocks.length > 0) {
            pushPage();
            currentPageBlocks = [{ block, originalIndex: idx }];
        } else {
            currentPageBlocks.push({ block, originalIndex: idx });
        }
    });

    pushPage();

    const docTitle = selectedTemplate?.name || templateName || 'Documento';

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-bg-deep border border-border-thin rounded-md overflow-hidden">
            {/* Header del panel alineado con el sistema de diseño Vercel Geist */}
            <div className="h-11 px-3.5 border-b border-border-thin bg-surface flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-2 min-w-0 max-w-[60%]">
                    <FileText className="w-3.5 h-3.5 text-text-main shrink-0" />
                    <span className="text-xs font-semibold text-text-main truncate" title={docTitle}>
                        {docTitle}
                    </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-text-dim font-medium">
                        {activeCount} / {blocks.length} visibles
                    </span>

                    {rightActions && <div className="w-px h-3.5 bg-border-thin" />}
                    {rightActions}

                    {toggleHeaderFn && (
                        <>
                            <div className="w-px h-3.5 bg-border-thin" />
                            <button
                                type="button"
                                onClick={toggleHeaderFn}
                                className="px-2 py-1 rounded hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                                title={headerCollapsed ? "Mostrar cabecera de la página" : "Ocultar cabecera (Modo Enfoque)"}
                            >
                                {headerCollapsed ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m18 15-6-6-6 6" /></svg>
                                        <span className="text-[9px] uppercase tracking-wider font-bold">Mostrar Cabecera</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m6 9 6 6 6-6" /></svg>
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-text-dim/60">Ocultar Cabecera</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {isDirty !== undefined && (
                        <>
                            <div className="w-px h-3.5 bg-border-thin" />
                            {isDirty ? (
                                <span className="flex items-center gap-1.5 text-[10px] text-text-dim">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Cambios sin guardar
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-[10px] text-text-dim">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Todo guardado
                                </span>
                            )}
                        </>
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
                    <div className="force-light-theme w-[794px] max-w-[794px] mx-auto bg-white text-slate-950 p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-200 min-h-[1123px] rounded-sm relative flex flex-col justify-start pt-48 items-center text-center">
                        <FileText className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Sin plantilla seleccionada</h3>
                        <p className="text-[10px] text-slate-400 max-w-[230px] mt-1.5 leading-normal">
                            Selecciona una plantilla del Catálogo (a la izquierda) para comenzar a visualizar y editar sus bloques.
                        </p>
                    </div>
                ) : blocks.length === 0 ? (
                    <div className="force-light-theme w-[794px] max-w-[794px] mx-auto bg-white text-slate-950 p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-200 min-h-[1123px] rounded-sm relative flex flex-col justify-start pt-48 items-center text-center">
                        <Layers className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">El documento está vacío</h3>
                        <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                            Usa el menú superior "+ Agregar Bloque" para inyectar componentes en esta hoja A4.
                        </p>
                    </div>
                ) : (
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col items-center mx-auto space-y-8">
                            {pages.map((page, pIdx) => {
                                const isCoverPage = page.blocks.some(b => b.block.type === 'cover');
                                const isLandscapePage = page.orientation === 'landscape';
                                const bgImg = !isCoverPage && themeConfig?.brand?.backgroundImage;
                                const bgOpacity = parseFloat(themeConfig?.brand?.backgroundOpacity ?? '0.12');
                                const bgFit = themeConfig?.brand?.backgroundFit || 'contain';
                                const marginTop = themeConfig?.layout?.marginTop || '3cm';
                                const marginBottom = themeConfig?.layout?.marginBottom || '2cm';
                                const marginLeft = themeConfig?.layout?.marginLeft || '2cm';
                                const marginRight = themeConfig?.layout?.marginRight || '2cm';

                                return (
                                    <React.Fragment key={pIdx}>
                                        {pIdx === 0 && (
                                            <div className="w-[794px] max-w-[794px] flex items-center justify-between mb-2 select-none group transition-all">
                                                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                                                <div className="mx-3 inline-flex items-center gap-2.5 px-3 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xs text-zinc-900 dark:text-zinc-100">
                                                    <span className="font-mono text-[10.5px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                                                        PÁGINA 1
                                                    </span>
                                                    {onUpdateThemeConfig && page.firstBlockId && (
                                                        <>
                                                            <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800" />
                                                            <PageOrientationSegmentedControl
                                                                isLandscape={isLandscapePage}
                                                                onToggle={() => handleTogglePageOrientation(page.firstBlockId, page.orientation)}
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                                            </div>
                                        )}
                                        {pIdx > 0 && (
                                            <PageBreakIndicator
                                                pageNum={page.pageNum}
                                                isLandscape={isLandscapePage}
                                                pageBreakBlockId={page.pageBreakBlockId}
                                                onDeleteBlock={onDeleteBlock}
                                                onToggleOrientation={
                                                    onUpdateThemeConfig && page.firstBlockId
                                                        ? () => handleTogglePageOrientation(page.firstBlockId, page.orientation)
                                                        : undefined
                                                }
                                            />
                                        )}
                                        <PageSheetWrapper
                                            key={`page-sheet-${pIdx}`}
                                            page={page}
                                            pIdx={pIdx}
                                            isCoverPage={isCoverPage}
                                            isLandscapePage={isLandscapePage}
                                            themeConfig={themeConfig}
                                            onUpdateThemeConfig={onUpdateThemeConfig}
                                            onUpdateRegulatoryCode={onUpdateRegulatoryCode}
                                            docCode={docCode}
                                            bgImg={bgImg}
                                            bgFit={bgFit}
                                            bgOpacity={bgOpacity}
                                            marginTop={marginTop}
                                            marginBottom={marginBottom}
                                            marginLeft={marginLeft}
                                            marginRight={marginRight}
                                            activeBlockId={activeBlockId}
                                            activeRef={activeRef}
                                            onSelectBlock={onSelectBlock}
                                            onToggleActive={onToggleActive}
                                            onDeleteBlock={onDeleteBlock}
                                            onDuplicateBlock={onDuplicateBlock}
                                            onUpdateConfig={onUpdateConfig}
                                        />
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

interface PageSheetWrapperProps {
    page: any;
    pIdx: number;
    isCoverPage: boolean;
    isLandscapePage: boolean;
    themeConfig: any;
    onUpdateThemeConfig?: (newThemeJson: string) => void;
    onUpdateRegulatoryCode?: (newCode: string) => void;
    docCode: string;
    bgImg: any;
    bgFit: string;
    bgOpacity: number;
    marginTop: string;
    marginBottom: string;
    marginLeft: string;
    marginRight: string;
    activeBlockId: string | null;
    activeRef: React.RefObject<HTMLDivElement | null>;
    onSelectBlock: (id: string | null) => void;
    onToggleActive: (index: number) => void;
    onDeleteBlock: (id: string) => void;
    onDuplicateBlock: (id: string) => void;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}

const PageSheetWrapper: React.FC<PageSheetWrapperProps> = ({
    page,
    pIdx,
    isCoverPage,
    isLandscapePage,
    themeConfig,
    onUpdateThemeConfig,
    onUpdateRegulatoryCode,
    docCode,
    bgImg,
    bgFit,
    bgOpacity,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    activeBlockId,
    activeRef,
    onSelectBlock,
    onToggleActive,
    onDeleteBlock,
    onDuplicateBlock,
    onUpdateConfig,
}) => {
    const pageRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={pageRef}
            onClick={e => e.stopPropagation()}
            style={{
                fontFamily: DYN_COLORS.fontFamily,
                fontSize: DYN_COLORS.baseSize,
                lineHeight: themeConfig?.typography?.lineHeight || '1.4',
                paddingTop: isCoverPage ? '0' : marginTop,
                paddingBottom: isCoverPage ? '0' : marginBottom,
                paddingLeft: isCoverPage ? '0' : marginLeft,
                paddingRight: isCoverPage ? '0' : marginRight,
            }}
            className={`force-light-theme w-[794px] min-w-[794px] max-w-[794px] ${
                isLandscapePage 
                    ? 'min-h-[561px]' 
                    : 'min-h-[1123px]'
            } bg-white text-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-200 rounded-sm relative flex flex-col transition-all cursor-default ${
                isCoverPage ? 'gap-0' : 'gap-2'
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

            {/* Código Normativo Libremente Arrastrable con useFreeFormDrag */}
            <FreeFormRegulatoryCode
                pageIndex={pIdx}
                pageNum={page.pageNum}
                isCoverPage={isCoverPage}
                isLandscape={isLandscapePage}
                docCode={docCode}
                themeConfig={themeConfig}
                onUpdateThemeConfig={onUpdateThemeConfig}
                onUpdateRegulatoryCode={onUpdateRegulatoryCode}
                containerRef={pageRef}
            />

            {page.blocks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded p-6 text-slate-400 italic text-[10px] relative z-10">
                    Página vacía. Arrastra bloques aquí o escribe contenido.
                </div>
            ) : (
                page.blocks.map(({ block, originalIndex }: any) => {
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
    );
};


