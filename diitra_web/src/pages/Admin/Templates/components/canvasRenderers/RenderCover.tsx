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
    const activeCoverImage = coverImage || config.coverImage || gCover.coverImage || themeConfig?.brand?.coverImage;

    const showInst = config.showInstitution !== undefined ? config.showInstitution : (gCover.showInstitution !== undefined ? gCover.showInstitution : true);
    const showTitle = config.showTitle !== undefined ? config.showTitle : (gCover.showTitle !== undefined ? gCover.showTitle : true);
    const showTema = config.showTemaProyecto !== undefined ? config.showTemaProyecto : (gCover.showTemaProyecto !== undefined ? gCover.showTemaProyecto : true);
    const showCarrera = config.showCarrera !== undefined ? config.showCarrera : (gCover.showCarrera !== undefined ? gCover.showCarrera : true);
    const showPeriodo = config.showPeriodo !== undefined ? config.showPeriodo : (gCover.showPeriodo !== undefined ? gCover.showPeriodo : true);

    const textInst = config.textoInstitucion || gCover.textoInstitucion || 'INSTITUTO TECNOLÓGICO SUPERIOR TRAVERSARI';
    const textTitle = config.tituloSuperior || gCover.tituloSuperior || 'INFORME FINAL DEL PROYECTO DE INVESTIGACIÓN';
    const placeholderTema = config.placeholderTema || gCover.placeholderTema || 'ESCRIBIR EL TEMA EN MAYÚSCULAS';
    const textCarrera = config.carreraPorDefecto || gCover.carreraPorDefecto || 'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE';
    const textPeriodo = config.periodoPorDefecto || gCover.periodoPorDefecto || 'PERIODO ACADÉMICO MARZO 2025 – SEPTIEMBRE 2025';

    const colorTitleKey = config.colorTituloSuperior || gCover.colorTituloSuperior || 'navy';
    const titleColor = colorTitleKey === 'gold' ? '#b8912e' : colorTitleKey === 'white' ? '#ffffff' : colorTitleKey === 'slate' ? '#475569' : colorTitleKey === 'navy' ? '#1e2a4a' : colorTitleKey;
    const tituloFontSize = Number(config.tituloFontSize || 20);
    const tituloItalica = Boolean(config.tituloItalica);

    const temaFontSize = Number(config.temaFontSize || 13);
    const temaItalica = Boolean(config.temaItalica);

    const carreraFontSize = Number(config.carreraFontSize || 11);
    const carreraItalica = Boolean(config.carreraItalica);

    const periodoFontSize = Number(config.periodoFontSize || 10);
    const periodoItalica = Boolean(config.periodoItalica);

    const rawColorInst = config.colorInstitution || gCover.colorInstitution;
    const rawColorTema = config.colorTemaProyecto || gCover.colorTemaProyecto;
    const rawColorCar = config.colorCarrera || gCover.colorCarrera;
    const rawColorPer = config.colorPeriodo || gCover.colorPeriodo;

    const colorInst = rawColorInst || '#ffffff';
    const colorTema = rawColorTema || (activeCoverImage ? '#ffffff' : '#1e2a4a');
    const colorCar = rawColorCar || (activeCoverImage ? '#ffffff' : '#1e2a4a');
    const colorPer = rawColorPer || (activeCoverImage ? '#ffffff' : '#475569');

    // Carrera
    const prefijoCarrera = config.prefijoCarrera !== undefined ? config.prefijoCarrera : 'TECNOLOGÍA SUPERIOR EN';
    const displayCarrera = '[NOMBRE DE LA CARRERA]';

    // Periodo
    const prefijoPeriodo = config.prefijoPeriodo !== undefined ? config.prefijoPeriodo : 'PERIODO ACADÉMICO';
    const displayPeriodo = '[PERIODO ACADÉMICO ACTIVO]';

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

    const renderElement = (
        id: CoverElementId,
        visible: boolean,
        children: React.ReactNode
    ) => {
        if (!visible) return null;
        const pos = positions[id];
        const isThisDragging = draggingId === id;

        const style: React.CSSProperties = {
            ...getElementStyle(pos, isThisDragging),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '80%'
        };

        const handlers = dragHandlers(id, pos);

        return (
            <div
                key={id}
                style={style}
                {...handlers}
                className={`group/item p-2 rounded-lg cursor-grab active:cursor-grabbing ${
                    isThisDragging
                        ? 'ring-2 ring-indigo-500 bg-indigo-50/20 shadow-md'
                        : 'hover:ring-1 hover:ring-indigo-400/40 hover:bg-white/10 transition-all duration-200'
                }`}
                title={`Arrastra para mover ${id}`}
            >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none select-none whitespace-nowrap flex items-center gap-1">
                    <Move className="w-2.5 h-2.5" />
                    Mover
                </span>
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

    const instMode = config.institutionMode || gCover.institutionMode || 'text';
    const instImage = config.institutionImage || gCover.institutionImage || '';
    const instLogoHeight = Number(config.institutionLogoHeight || gCover.institutionLogoHeight || 48);
    const instLogoRadius = config.institutionLogoRadius || gCover.institutionLogoRadius || 'none';
    const instLogoInvert = config.institutionLogoInvert ?? gCover.institutionLogoInvert ?? false;
    const instVariant = config.institutionVariant || gCover.institutionVariant || 'pill';
    const instBg = config.bgInstitution || gCover.bgInstitution || '#1e2a4a';

    const renderInstitutionContent = () => {
        if (instMode === 'image' && instImage) {
            return (
                <div className="inline-flex items-center">
                    <img
                        src={instImage}
                        alt={textInst}
                        style={{
                            height: `${instLogoHeight}px`,
                            maxWidth: '280px',
                            objectFit: 'contain',
                            borderRadius: instLogoRadius === 'full' ? '9999px' : instLogoRadius === 'md' ? '8px' : instLogoRadius === 'sm' ? '4px' : '0px',
                            filter: instLogoInvert ? 'brightness(0) invert(1)' : undefined
                        }}
                        className="pointer-events-none select-none drop-shadow-xs"
                    />
                </div>
            );
        }

        if (instMode === 'hybrid') {
            return (
                <div
                    className={`inline-flex items-center gap-3 ${
                        instVariant === 'pill'
                            ? 'px-4 py-1.5 rounded-full shadow-xs'
                            : instVariant === 'bordered'
                                ? 'px-4 py-1.5 rounded-full border shadow-xs'
                                : 'p-1'
                    }`}
                    style={{
                        backgroundColor: instVariant === 'pill' ? instBg : instVariant === 'bordered' ? `${instBg}15` : 'transparent',
                        borderColor: instVariant === 'bordered' ? instBg : undefined
                    }}
                >
                    {instImage && (
                        <img
                            src={instImage}
                            alt={textInst}
                            style={{
                                height: `${Math.min(instLogoHeight, 36)}px`,
                                maxWidth: '120px',
                                objectFit: 'contain',
                                borderRadius: instLogoRadius === 'full' ? '9999px' : '4px',
                                filter: instLogoInvert ? 'brightness(0) invert(1)' : undefined
                            }}
                            className="pointer-events-none select-none shrink-0"
                        />
                    )}
                    <span
                        className="text-[11px] font-black uppercase tracking-widest select-none"
                        style={{ color: instVariant === 'clean' ? (!activeCoverImage && isWhite(colorInst) ? '#1e2a4a' : colorInst) : colorInst }}
                    >
                        {textInst}
                    </span>
                </div>
            );
        }

        if (instVariant === 'pill') {
            return (
                <span className="text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full select-none inline-flex items-center gap-1.5 shadow-xs" style={{ backgroundColor: instBg, color: colorInst }}>
                    {textInst}
                </span>
            );
        }

        if (instVariant === 'bordered') {
            return (
                <span className="text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full select-none inline-flex items-center gap-1.5 border shadow-xs" style={{ borderColor: instBg, color: colorInst === '#ffffff' && !activeCoverImage ? '#1e2a4a' : colorInst, backgroundColor: `${instBg}15` }}>
                    {textInst}
                </span>
            );
        }

        return (
            <span className="text-[11px] font-black uppercase tracking-widest select-none inline-flex items-center gap-1.5" style={{ color: colorInst === '#ffffff' && !activeCoverImage ? '#1e2a4a' : colorInst }}>
                {textInst}
            </span>
        );
    };

    return (
        <div
            ref={containerRef}
            style={activeCoverImage ? { backgroundImage: `url(${activeCoverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            className="relative w-full min-h-[1123px] flex-1 overflow-hidden bg-white select-none"
        >
            <GuideGrid />

            {renderElement('institution', showInst, renderInstitutionContent())}

            {renderElement('title', showTitle,
                <div className="space-y-4">
                    <h1
                        className={`font-extrabold tracking-tight uppercase leading-snug ${tituloItalica ? 'italic' : ''}`}
                        style={{ color: titleColor, fontSize: `${tituloFontSize * 1.33}px` }}
                    >
                        {textTitle}
                    </h1>
                    {showTema && (
                        <div
                            className={`font-extrabold uppercase tracking-wide leading-tight ${temaItalica ? 'italic' : ''}`}
                            style={{ color: colorTema, fontSize: `${temaFontSize * 1.33}px` }}
                        >
                            {placeholderTema}
                        </div>
                    )}
                </div>
            )}

            {renderElement('carrera', showCarrera,
                <div className="space-y-1" style={{ color: colorCar }}>
                    {prefijoCarrera && (
                        <div
                            className="font-bold uppercase tracking-wider opacity-85"
                            style={{ fontSize: `${Math.max(10, Math.round(carreraFontSize * 1.1))}px` }}
                        >
                            {prefijoCarrera}
                        </div>
                    )}
                    <div
                        className={`font-extrabold uppercase tracking-wide ${carreraItalica ? 'italic' : ''}`}
                        style={{ fontSize: `${carreraFontSize * 1.33}px` }}
                    >
                        {displayCarrera}
                    </div>
                </div>
            )}

            {renderElement('periodo', showPeriodo,
                <div className="space-y-1" style={{ color: colorPer }}>
                    {prefijoPeriodo && (
                        <div
                            className="font-bold uppercase tracking-wider opacity-85"
                            style={{ fontSize: `${Math.max(10, Math.round(periodoFontSize * 1.1))}px` }}
                        >
                            {prefijoPeriodo}
                        </div>
                    )}
                    <div
                        className={`font-semibold uppercase tracking-wide ${periodoItalica ? 'italic' : ''}`}
                        style={{ fontSize: `${periodoFontSize * 1.33}px` }}
                    >
                        {displayPeriodo}
                    </div>
                </div>
            )}
        </div>
    );
};
