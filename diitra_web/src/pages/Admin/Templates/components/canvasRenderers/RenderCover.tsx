import React, { useRef } from 'react';
import { Move } from 'lucide-react';
import { useFreeFormDrag } from '../../hooks/useFreeFormDrag';
import type { FreeFormPosition } from '../../hooks/useFreeFormDrag';

export interface HeaderStylePair {
    id: string;
    label: string;
    bg: string;
    fg: string;
}

export const DYN_COLORS: Record<string, string> = {
    blue: '#1e2a4a',
    gold: '#b8912e',
    gray: '#475569',
    none: 'transparent',
    tableHeaderBg: '#1e2a4a',
    tableHeaderColor: '#ffffff',
    fontFamily: "'Calibri', 'Open Sans', Arial, sans-serif",
    baseSize: '10pt',
};

export const HEADER_STYLE_OPTIONS: HeaderStylePair[] = [
    { id: 'blue', label: 'Azul Institucional', bg: DYN_COLORS.blue, fg: '#ffffff' },
    { id: 'gold', label: 'Dorado Acreditación', bg: DYN_COLORS.gold, fg: '#ffffff' },
    { id: 'gray', label: 'Gris Neutro', bg: DYN_COLORS.gray, fg: '#ffffff' },
    { id: 'none', label: 'Sin fondo de encabezado', bg: 'transparent', fg: '#1e293b' },
];

export const getHeaderStylePair = (id: string): HeaderStylePair => {
    return HEADER_STYLE_OPTIONS.find(opt => opt.id === id) || HEADER_STYLE_OPTIONS[0];
};

const DEFAULT_POSITIONS: Record<string, FreeFormPosition> = {
    institution: { x: 10, y: 4 },
    title: { x: 10, y: 35 },
    carrera: { x: 10, y: 70 },
    periodo: { x: 10, y: 80 },
};

type CoverElementId = 'institution' | 'title' | 'carrera' | 'periodo';

interface RenderCoverProps {
    config: any;
    coverImage?: string;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
    themeConfig?: any;
}

export const RenderCover: React.FC<RenderCoverProps> = ({
    config,
    coverImage,
    blockId,
    onUpdateConfig,
    themeConfig
}) => {
    const gCover = themeConfig?.brand?.coverConfig || {};
    const color = config.colorTema || gCover.colorTema || DYN_COLORS.blue;
    const isFreeForm = (config.coverLayoutMode !== undefined ? config.coverLayoutMode : gCover.coverLayoutMode) !== 'zones';

    const activeCoverImage = coverImage || config.coverImage || gCover.coverImage || themeConfig?.brand?.coverImage;

    const showInst = config.showInstitution !== undefined ? config.showInstitution : (gCover.showInstitution !== undefined ? gCover.showInstitution : true);
    const showTitle = config.showTitle !== undefined ? config.showTitle : (gCover.showTitle !== undefined ? gCover.showTitle : true);
    const showCarrera = config.showCarrera !== undefined ? config.showCarrera : (gCover.showCarrera !== undefined ? gCover.showCarrera : true);
    const showPeriodo = config.showPeriodo !== undefined ? config.showPeriodo : (gCover.showPeriodo !== undefined ? gCover.showPeriodo : true);

    const alignInst = config.alignInstitution || gCover.alignInstitution || 'center';
    const alignTitle = config.alignTitle || gCover.alignTitle || 'center';
    const alignCarrera = config.alignCarrera || gCover.alignCarrera || 'center';
    const alignPeriodo = config.alignPeriodo || gCover.alignPeriodo || 'center';

    const textInst = config.textoInstitucion || gCover.textoInstitucion || 'INSTITUTO TECNOLÓGICO SUPERIOR TRAVERSARI';
    const textTitle = config.tituloSuperior || gCover.tituloSuperior || 'PORTADA DE PRUEBA DE IDENTIDAD VISUAL';
    const textCarrera = config.carreraPorDefecto || gCover.carreraPorDefecto || 'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE';
    const textPeriodo = config.periodoPorDefecto || gCover.periodoPorDefecto || 'PERIODO ACADÉMICO 2026-2026';

    const positions: Record<CoverElementId, FreeFormPosition> = {
        institution: {
            x: config.xInstitution ?? gCover.xInstitution ?? DEFAULT_POSITIONS.institution.x,
            y: config.yInstitution ?? gCover.yInstitution ?? DEFAULT_POSITIONS.institution.y
        },
        title: {
            x: config.xTitle ?? gCover.xTitle ?? DEFAULT_POSITIONS.title.x,
            y: config.yTitle ?? gCover.yTitle ?? DEFAULT_POSITIONS.title.y
        },
        carrera: {
            x: config.xCarrera ?? gCover.xCarrera ?? DEFAULT_POSITIONS.carrera.x,
            y: config.yCarrera ?? gCover.yCarrera ?? DEFAULT_POSITIONS.carrera.y
        },
        periodo: {
            x: config.xPeriodo ?? gCover.xPeriodo ?? DEFAULT_POSITIONS.periodo.x,
            y: config.yPeriodo ?? gCover.yPeriodo ?? DEFAULT_POSITIONS.periodo.y
        },
    };

    const containerRef = useRef<HTMLDivElement>(null);

    const { draggingId, isDragging, dragHandlers, getElementStyle } = useFreeFormDrag<CoverElementId>(
        containerRef,
        (elementId, position) => {
            if (onUpdateConfig && blockId) {
                const xKey = `x${elementId.charAt(0).toUpperCase() + elementId.slice(1)}` as string;
                const yKey = `y${elementId.charAt(0).toUpperCase() + elementId.slice(1)}` as string;
                onUpdateConfig(blockId, xKey, Math.round(position.x * 10) / 10);
                onUpdateConfig(blockId, yKey, Math.round(position.y * 10) / 10);
            }
        }
    );

    const getAlignStyle = (align: string): React.CSSProperties => {
        const map: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
        return {
            alignItems: map[align] || 'center',
            display: 'flex',
            flexDirection: 'column',
            textAlign: align as any
        };
    };

    const renderElement = (
        id: CoverElementId,
        visible: boolean,
        align: string,
        children: React.ReactNode
    ) => {
        if (!visible) return null;
        const pos = positions[id];
        const isThisDragging = draggingId === id;

        const style: React.CSSProperties = isFreeForm
            ? { ...getElementStyle(pos, isThisDragging), ...getAlignStyle(align), maxWidth: '80%' }
            : {};

        const handlers = isFreeForm ? dragHandlers(id, pos) : {};

        return (
            <div
                key={id}
                style={style}
                {...handlers}
                className={`group/item p-2 rounded-lg ${isFreeForm
                    ? isThisDragging
                        ? 'ring-2 ring-indigo-500 bg-indigo-50/20'
                        : 'hover:ring-1 hover:ring-indigo-400/40 hover:bg-white/10 transition-all duration-200'
                    : 'transition-all duration-200'
                    }`}
                title={isFreeForm ? `Arrastra para mover ${id}` : undefined}
            >
                {isFreeForm && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none select-none whitespace-nowrap flex items-center gap-1">
                        <Move className="w-2.5 h-2.5" />
                        Mover
                    </span>
                )}
                {children}
            </div>
        );
    };

    const GuideGrid = () => (
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0'}`}>
            {[25, 50, 75].map(pct => (
                <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-indigo-300/20" style={{ top: `${pct}%` }}>
                    <span className="absolute right-1 -top-3 text-[8px] text-indigo-400/40 font-mono select-none">{pct}%</span>
                </div>
            ))}
            {[33, 66].map(pct => (
                <div key={pct} className="absolute top-0 bottom-0 border-l border-dashed border-indigo-300/10" style={{ left: `${pct}%` }} />
            ))}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 opacity-30">
                <div className="absolute left-1/2 top-0 bottom-0 border-l border-indigo-400" />
                <div className="absolute top-1/2 left-0 right-0 border-t border-indigo-400" />
            </div>
        </div>
    );

    if (isFreeForm) {
        return (
            <div
                ref={containerRef}
                style={activeCoverImage ? { backgroundImage: `url(${activeCoverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                className="relative w-full min-h-[1123px] flex-1 overflow-hidden bg-white select-none"
            >
                <GuideGrid />
                <div className="absolute top-2 left-2 z-50 bg-indigo-600/80 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-1 rounded-full flex items-center gap-1 pointer-events-none">
                    <Move className="w-2.5 h-2.5" />
                    Canvas Libre
                </div>

                {renderElement('institution', showInst, alignInst,
                    <span className="text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-white select-none flex items-center gap-1.5" style={{ backgroundColor: color }}>
                        {textInst}
                    </span>
                )}

                {renderElement('title', showTitle, alignTitle,
                    <div>
                        <h1 className="text-2xl font-black tracking-tight uppercase leading-tight" style={{ color }}>{textTitle}</h1>
                        <div className="text-base font-bold uppercase mt-1 leading-tight opacity-70 italic" style={{ color }}>
                            Escribir tema aquí...
                        </div>
                    </div>
                )}

                {renderElement('carrera', showCarrera, alignCarrera,
                    <div>
                        <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">{textCarrera}</div>
                    </div>
                )}

                {renderElement('periodo', showPeriodo, alignPeriodo,
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{textPeriodo}</div>
                )}
            </div>
        );
    }

    const posInst = config.posInstitution || 'top';
    const posTitle = config.posTitle || 'middle';
    const posCarrera = config.posCarrera || 'bottom';
    const posPeriodo = config.posPeriodo || 'bottom';

    const getHorizontalAlignmentStyle = (align: string) => {
        if (align === 'left') return { textAlign: 'left' as const, alignSelf: 'flex-start' as const };
        if (align === 'right') return { textAlign: 'right' as const, alignSelf: 'flex-end' as const };
        return { textAlign: 'center' as const, alignSelf: 'center' as const };
    };

    const renderZoneSection = (sectionName: 'top' | 'middle' | 'bottom', mtClass: string) => {
        const hasInst = posInst === sectionName && showInst;
        const hasTitle = posTitle === sectionName && showTitle;
        const hasCarrera = posCarrera === sectionName && showCarrera;
        const hasPeriodo = posPeriodo === sectionName && showPeriodo;

        if (!hasInst && !hasTitle && !hasCarrera && !hasPeriodo) return null;

        return (
            <div className={`flex flex-col gap-4 w-full px-12 ${mtClass}`}>
                {hasInst && (
                    <div style={getHorizontalAlignmentStyle(alignInst)} className="w-full">
                        <span className="text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-white select-none inline-block shadow-sm" style={{ backgroundColor: color }}>
                            {textInst}
                        </span>
                    </div>
                )}

                {hasTitle && (
                    <div style={getHorizontalAlignmentStyle(alignTitle)} className="w-full">
                        <h1 className="text-2xl font-black tracking-tight uppercase leading-tight" style={{ color }}>
                            {textTitle}
                        </h1>
                        <div className="text-base font-bold uppercase mt-1 leading-tight opacity-70 italic" style={{ color }}>
                            Escribir tema aquí...
                        </div>
                    </div>
                )}

                {hasCarrera && (
                    <div style={getHorizontalAlignmentStyle(alignCarrera)} className="w-full">
                        <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                            {textCarrera}
                        </div>
                    </div>
                )}

                {hasPeriodo && (
                    <div style={getHorizontalAlignmentStyle(alignPeriodo)} className="w-full">
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                            {textPeriodo}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            style={activeCoverImage ? { backgroundImage: `url(${activeCoverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            className="relative w-full min-h-[1123px] flex-1 flex flex-col justify-between items-center py-16 bg-white border border-gray-200 select-none overflow-hidden"
        >
            {renderZoneSection('top', 'mt-4')}
            {renderZoneSection('middle', 'my-auto')}
            {renderZoneSection('bottom', 'mb-4')}
        </div>
    );
};
