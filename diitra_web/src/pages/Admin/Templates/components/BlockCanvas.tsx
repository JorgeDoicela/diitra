import React, { useRef, useEffect } from 'react';
import {
    useSortable,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Layers, Trash2, Eye, EyeOff, Copy, Move
} from 'lucide-react';
import type { DocumentBlock, GanttObjective, TableSection } from '../types';
import { useFreeFormDrag } from '../hooks/useFreeFormDrag';
import type { FreeFormPosition } from '../hooks/useFreeFormDrag';

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
}

const DYN_COLORS = {
    blue: '#1e2a4a',
    gold: '#b8912e',
    gray: '#475569',
    lightBlue: '#f0f3f9',
};

// ─────────────────────────────────────────────────────────────────────────────
// Posiciones por defecto para el modo freeform (% relativo al canvas A4)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_POSITIONS: Record<string, FreeFormPosition> = {
    institution: { x: 10, y: 4 },
    title: { x: 10, y: 35 },
    carrera: { x: 10, y: 70 },
    periodo: { x: 10, y: 80 },
};

type CoverElementId = 'institution' | 'title' | 'carrera' | 'periodo';

// ─────────────────────────────────────────────────────────────────────────────
// GUÍA DE ARQUITECTURA Y RESTRICCIONES DEL SISTEMA DE PORTADA DINÁMICA
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. ¿CÓMO SE GENERA EL PDF FÍSICO DESDE EL CANVAS LIBRE?
//    - El lienzo del navegador representa una hoja A4 física real (210mm x 297mm).
//    - Al mover los elementos, calculamos su ubicación en porcentaje (%) relativo al contenedor.
//    - El compilador HTML ("HtmlGenerator.ts") convierte estas coordenadas a estilos CSS en línea
//      (ej: position: absolute; left: 15.5%; top: 42%).
//    - El motor de PDF en el backend C# ("DocumentEngine.cs") utiliza PuppeteerSharp e iText,
//      los cuales respetan al 100% el box-model de CSS y posicionan los elementos con precisión
//      milimétrica física basándose en dichos porcentajes absolutos.
//
// 2. RESTRICCIÓN CRÍTICA DE SCRIBAN (¡EVITAR DAÑAR EL MOTOR DE PLANTILLAS!):
//    - ATENCIÓN: Las variables dinámicas de Scriban como {{default titulo '...'}}, {{carrera}},
//      o {{periodo}} NUNCA deben inyectarse dentro de atributos de estilo (ej. style="top: {{y}}%").
//      Scriban procesa e interpreta estas llaves como texto plano y el analizador de HTML del
//      generador de PDFs podría escapar o corromper los caracteres, rompiendo el CSS.
//    - La solución profesional: Las coordenadas X/Y las compila "HtmlGenerator.ts" directamente en
//      TypeScript como valores literales estáticos (ej: left: 10%; top: 35%). Las llaves de Scriban
//      se colocan única y exclusivamente dentro del CONTENIDO del texto del div (el innerHTML).
//      Esto es 100% robusto y seguro.
//
// 3. RETROCOMPATIBILIDAD DE COMPOSICIÓN (ZONAS vs. CANVAS LIBRE):
//    - Mantenemos el campo "coverLayoutMode". Si es "zones", la portada se renderiza usando el
//      diseño flexbox tradicional por tercios (Superior, Medio, Inferior). Si es "freeform",
//      se activa la maquetación de posiciones absolutas libres. Esto garantiza que ninguna
//      plantilla institucional existente en producción sufra desajustes.
//
// 4. ARRASTRE LIBRE PURO 1:1 (SIN MAGNETIZACIÓN):
//    - Desactivamos cualquier tipo de snap magnético automático o forzado en caliente, dado que
//      los saltos por software alteraban la trayectoria natural del puntero y generaban tosquedad.
//    - En su lugar, el arrastre es puramente lineal y directo 1:1. El lienzo muestra guías punteadas
//      estáticas de referencia en tercios (25%, 50%, 75%) para asistir visualmente en la alineación.
// ─────────────────────────────────────────────────────────────────────────────

const RenderCover: React.FC<{
    config: any;
    coverImage?: string;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
    themeConfig?: any;
}> = ({ config, coverImage, blockId, onUpdateConfig, themeConfig }) => {
    const gCover = themeConfig?.brand?.coverConfig || {};
    const color = config.colorTema || gCover.colorTema || DYN_COLORS.blue;
    const isFreeForm = (config.coverLayoutMode !== undefined ? config.coverLayoutMode : gCover.coverLayoutMode) !== 'zones';

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

    // Posiciones actuales (desde config o defaults)
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

    // ─── Renderizador de cada elemento arrastrable ────────────────────────────
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
                {/* Indicador de arrastre visible al hover */}
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

    // ─── Cuadrícula de guías (aparece solo durante drag en modo freeform) ─────
    const GuideGrid = () => (
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0'}`}>
            {/* Líneas horizontales de guía estándar */}
            {[25, 50, 75].map(pct => (
                <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-indigo-300/20" style={{ top: `${pct}%` }}>
                    <span className="absolute right-1 -top-3 text-[8px] text-indigo-400/40 font-mono select-none">{pct}%</span>
                </div>
            ))}
            {/* Líneas verticales de guía estándar */}
            {[33, 66].map(pct => (
                <div key={pct} className="absolute top-0 bottom-0 border-l border-dashed border-indigo-300/10" style={{ left: `${pct}%` }} />
            ))}


            {/* Cruz central de referencia */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 opacity-30">
                <div className="absolute left-1/2 top-0 bottom-0 border-l border-indigo-400" />
                <div className="absolute top-1/2 left-0 right-0 border-t border-indigo-400" />
            </div>
        </div>
    );

    // ─── MODO FREE-FORM ───────────────────────────────────────────────────────
    if (isFreeForm) {
        return (
            <div
                ref={containerRef}
                style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                className="relative w-full min-h-[1123px] flex-1 overflow-hidden bg-white select-none"
            >
                <GuideGrid />

                {/* Badge de modo freeform */}
                <div className="absolute top-2 right-2 z-50 bg-indigo-600/80 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-1 rounded-full flex items-center gap-1 pointer-events-none">
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

    // ─── MODO ZONES LEGACY (retrocompatibilidad) ──────────────────────────────
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
        const elems: React.ReactNode[] = [];
        if (showInst && posInst === sectionName) elems.push(
            <div key="inst" style={getHorizontalAlignmentStyle(alignInst)} className="w-full">
                <span className="text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-white flex items-center gap-1.5 w-max" style={{ backgroundColor: color }}>{textInst}</span>
            </div>
        );
        if (showTitle && posTitle === sectionName) elems.push(
            <div key="title" style={getHorizontalAlignmentStyle(alignTitle)} className="w-full">
                <h1 className="text-2xl font-black tracking-tight uppercase" style={{ color }}>{textTitle}</h1>
            </div>
        );
        if (showCarrera && posCarrera === sectionName) elems.push(
            <div key="carrera" style={getHorizontalAlignmentStyle(alignCarrera)} className="w-full text-sm font-bold text-gray-600 uppercase tracking-wider">{textCarrera}</div>
        );
        if (showPeriodo && posPeriodo === sectionName) elems.push(
            <div key="periodo" style={getHorizontalAlignmentStyle(alignPeriodo)} className="w-full text-xs text-gray-500 font-semibold uppercase">{textPeriodo}</div>
        );
        return elems.length > 0 ? <div className={`flex flex-col gap-4 w-full items-center ${mtClass}`}>{elems}</div> : null;
    };

    return (
        <div
            style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            className="relative w-full min-h-[1123px] flex-1 p-16 flex flex-col justify-between overflow-hidden bg-white select-none"
        >
            {renderZoneSection('top', 'mt-6')}
            <div className="my-auto">{renderZoneSection('middle', '')}</div>
            {renderZoneSection('bottom', 'mb-6')}
        </div>
    );
};

const RenderTitle: React.FC<{ config: any }> = ({ config }) => {
    const text = config.text || 'Título de Sección';
    // Soportar tanto config.fontSize (H1/H2/H3) como config.level (h1/h2/h3) por retrocompatibilidad
    const fontSize = (config.fontSize || config.level || 'H2').toUpperCase();

    if (fontSize === 'H1') {
        return (
            <h1 className="text-sm font-black uppercase mb-2 mt-4 tracking-wider flex items-center justify-between" style={{ color: DYN_COLORS.blue }}>
                <span>{text}</span>
            </h1>
        );
    }
    if (fontSize === 'H2') {
        return (
            <h2 className="text-xs font-black text-white px-3 py-2 uppercase tracking-wide mb-2 mt-4" style={{ backgroundColor: DYN_COLORS.blue }}>
                {text}
            </h2>
        );
    }
    return (
        <h3 className="text-xs font-bold uppercase tracking-wide mb-2 mt-3" style={{ color: DYN_COLORS.gold }}>
            {text}
        </h3>
    );
};

const RenderRichText: React.FC<{ config: any }> = ({ config }) => {
    const html = config.html || '<p className="text-gray-400 italic">Escribe el contenido enriquecido aquí...</p>';
    return (
        <div className="space-y-2">
            <div
                className="prose max-w-none text-xs leading-relaxed text-[#1e2a4a]/90 tiptap-editor"
                dangerouslySetInnerHTML={{ __html: html }}
            />
            <p className="text-[8px] text-pink-500 font-black border-t border-dashed border-pink-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                Los investigadores completarán este apartado en la pestaña "Plan Técnico" del Workspace.
            </p>
        </div>
    );
};

const RenderAdvancedTable: React.FC<{ config: any }> = ({ config }) => {
    const headers = config.headers || ['Columna 1', 'Columna 2'];
    const rows = config.rows || [{ cells: ['Dato A', 'Dato B'] }];
    const headerStyle = config.headerStyle || 'blue';
    const colWidths = config.colWidths || [];

    return (
        <div className="overflow-x-auto my-2">
            <table className="w-full border-collapse text-[10px] border border-slate-200">
                <thead>
                    <tr>
                        {headers.map((h: string, i: number) => (
                            <th
                                key={i}
                                className="border border-slate-300 p-2 font-bold text-left uppercase text-[9px]"
                                style={{
                                    backgroundColor: headerStyle === 'blue' ? DYN_COLORS.blue : headerStyle === 'gold' ? DYN_COLORS.gold : headerStyle === 'gray' ? DYN_COLORS.gray : '#f8fafc',
                                    color: headerStyle !== 'none' ? 'white' : '#1e2a4a',
                                    width: colWidths[i] || 'auto'
                                }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row: any, rIdx: number) => {
                        const cells = Array.isArray(row) ? row : (row.cells || []);
                        return (
                            <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                {cells.map((cell: string, cIdx: number) => (
                                    <td key={cIdx} className="border border-slate-200 p-2 text-slate-700 leading-normal">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const RenderMultiSectionTable: React.FC<{ config: any }> = ({ config }) => {
    const sections: TableSection[] = config.sections || [];
    if (sections.length === 0) {
        return <div className="text-[10px] text-slate-400 italic p-2 border rounded border-dashed text-center">Sin sub-tablas agregadas</div>;
    }
    return (
        <div className="space-y-4 my-2">
            {sections.map((sec, sIdx) => (
                <div key={sIdx} className="space-y-1">
                    <h5 className="text-[9px] font-black text-slate-700 uppercase tracking-wider">{sec.title || `Sub-tabla N° ${sIdx + 1}`}</h5>
                    <table className="w-full border-collapse text-[10px] border border-slate-200">
                        <thead>
                            <tr>
                                {sec.headers.map((h, i) => (
                                    <th
                                        key={i}
                                        className="border border-slate-300 p-1.5 font-bold text-left uppercase text-[8.5px]"
                                        style={{
                                            backgroundColor: sec.headerStyle === 'blue' ? DYN_COLORS.blue : sec.headerStyle === 'gold' ? DYN_COLORS.gold : sec.headerStyle === 'gray' ? DYN_COLORS.gray : '#f8fafc',
                                            color: sec.headerStyle !== 'none' ? 'white' : '#1e2a4a',
                                            width: sec.colWidths?.[i] || 'auto'
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sec.rows.map((row: any, rIdx) => {
                                const cells = Array.isArray(row) ? row : (row.cells || []);
                                return (
                                    <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                        {cells.map((cell: any, cIdx: number) => (
                                            <td key={cIdx} className="border border-slate-200 p-1.5 text-slate-700">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

const RenderTwoColumn: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="grid grid-cols-2 gap-3 my-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div className="flex flex-col border-r border-slate-200">
                <div className="p-2 font-bold text-[9px] uppercase text-white" style={{
                    backgroundColor: config.leftHeaderStyle === 'blue' ? DYN_COLORS.blue : config.leftHeaderStyle === 'gold' ? DYN_COLORS.gold : config.leftHeaderStyle === 'gray' ? DYN_COLORS.gray : '#f8fafc',
                    color: config.leftHeaderStyle !== 'none' ? 'white' : '#1e2a4a'
                }}>
                    {config.leftTitle || 'COLUMNA IZQUIERDA'}
                </div>
                <div
                    className="p-3 text-[10px] text-slate-700 rich-content tiptap-editor"
                    dangerouslySetInnerHTML={{ __html: config.leftContent || '' }}
                />
            </div>
            <div className="flex flex-col">
                <div className="p-2 font-bold text-[9px] uppercase text-white" style={{
                    backgroundColor: config.rightHeaderStyle === 'blue' ? DYN_COLORS.blue : config.rightHeaderStyle === 'gold' ? DYN_COLORS.gold : config.rightHeaderStyle === 'gray' ? DYN_COLORS.gray : '#f8fafc',
                    color: config.rightHeaderStyle !== 'none' ? 'white' : '#1e2a4a'
                }}>
                    {config.rightTitle || 'COLUMNA DERECHA'}
                </div>
                <div
                    className="p-3 text-[10px] text-slate-700 rich-content tiptap-editor"
                    dangerouslySetInnerHTML={{ __html: config.rightContent || '' }}
                />
            </div>
        </div>
    );
};

const RenderGantt: React.FC<{ config: any }> = ({ config }) => {
    const months = config.ganttMonths || [
        'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
        'Sept', 'Octubre', 'Nov', 'Dic', 'Enero', 'Febrero'
    ];
    const objectives: GanttObjective[] = config.ganttObjectives || [];

    const isInRange = (startMonth: number, startWeek: number, endMonth: number, endWeek: number, mIdx: number, wIdx: number): boolean => {
        const startGlobal = startMonth * 4 + startWeek;
        const endGlobal = endMonth * 4 + endWeek;
        const cellGlobal = mIdx * 4 + wIdx;
        return cellGlobal >= startGlobal && cellGlobal <= endGlobal;
    };

    return (
        <div className="overflow-x-auto my-2 border border-slate-200 rounded-lg">
            <table className="w-full border-collapse text-[9px] min-w-[700px]">
                <thead>
                    <tr>
                        <th className="border border-slate-300 p-1.5 bg-[#1e2a4a] text-white text-center font-bold" rowSpan={2}>Objetivos</th>
                        <th className="border border-slate-300 p-1.5 bg-[#1e2a4a] text-white text-center font-bold" rowSpan={2}>N°</th>
                        <th className="border border-slate-300 p-1.5 bg-[#1e2a4a] text-white text-center font-bold" rowSpan={2}>Actividades</th>
                        <th className="border border-slate-300 p-1.5 bg-[#1e2a4a] text-white text-center font-bold" rowSpan={2}>Recursos</th>
                        {months.map((m: string, i: number) => (
                            <th key={i} className="border border-slate-300 p-1 bg-[#1e2a4a] text-white text-center font-bold" colSpan={4}>
                                {m}
                            </th>
                        ))}
                    </tr>
                    <tr>
                        {months.map(() =>
                            [1, 2, 3, 4].map((w) => (
                                <th key={w} className="border border-slate-300 p-0.5 bg-[#1e2a4a] text-white text-[7px] text-center font-semibold">
                                    {w}
                                </th>
                            ))
                        )}
                    </tr>
                </thead>
                <tbody>
                    {objectives.map((obj, oIdx) => {
                        const acts = obj.activities.length > 0 ? obj.activities : [{ id: '', name: '(sin actividades)', resources: '', startMonth: 0, startWeek: 0, endMonth: 0, endWeek: 0, color: '#64748b' as const }];
                        return acts.map((act, aIdx) => (
                            <tr key={act.id || aIdx} className="hover:bg-slate-50/50">
                                {aIdx === 0 && (
                                    <td
                                        className="border border-slate-300 p-2 font-bold bg-slate-50/80 text-center align-middle text-[9px] w-8 uppercase text-slate-600"
                                        rowSpan={acts.length}
                                        style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                                    >
                                        OBJ {oIdx + 1}
                                    </td>
                                )}
                                <td className="border border-slate-200 p-1 text-center font-bold text-slate-500">{aIdx + 1}</td>
                                <td className="border border-slate-200 p-1.5 font-semibold text-slate-700">{act.name}</td>
                                <td className="border border-slate-200 p-1 text-slate-400 text-[8px] leading-tight">{act.resources}</td>
                                {months.map((_, mIdx) =>
                                    [0, 1, 2, 3].map((wIdx) => {
                                        const filled = isInRange(act.startMonth, act.startWeek, act.endMonth, act.endWeek, mIdx, wIdx);
                                        return (
                                            <td
                                                key={`${mIdx}-${wIdx}`}
                                                className="border border-slate-200 p-0"
                                                style={{ backgroundColor: filled ? act.color : 'transparent' }}
                                            />
                                        );
                                    })
                                )}
                            </tr>
                        ));
                    })}
                </tbody>
            </table>
            <p className="text-[8px] text-indigo-500 font-black border-t border-dashed border-indigo-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Los investigadores gestionarán el cronograma en la pestaña "Cronograma (Gantt)" del Workspace.
            </p>
        </div>
    );
};

const RenderSignatures: React.FC<{ config: any }> = ({ config }) => {
    const signatories = config.signatories || [
        { label: 'Elaborado por:', name: '[Director de Proyecto]', role: 'Docente Investigador' },
        { label: 'Aprobado por:', name: '[Rector/Director]', role: 'Comisión de Investigación' }
    ];
    return (
        <div className="mt-8 select-none">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-center">
                {signatories.map((sig: any, idx: number) => (
                    <div key={idx} className="text-center pt-8 border-t border-slate-300 max-w-[180px] mx-auto flex flex-col gap-0.5">
                        <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider mb-1">{sig.label}</span>
                        <span className="text-[9.5px] font-black text-slate-800 leading-snug">{sig.name}</span>
                        <span className="text-[8.5px] font-medium text-slate-500 leading-snug">{sig.role}</span>
                    </div>
                ))}
            </div>
            {config.textoPieFirma && (
                <p className="text-[8px] text-slate-400 border-t border-dashed mt-4 pt-1.5 text-center leading-normal">
                    {config.textoPieFirma}
                </p>
            )}
        </div>
    );
};

const RenderResearchersTable: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="overflow-x-auto my-2">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Tabla de Participantes (Investigadores del Proyecto)</span>
            </div>
            <table className="w-full border-collapse text-[10px] border border-slate-200">
                <thead>
                    <tr>
                        <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: DYN_COLORS.blue }}>Nombre Completo</th>
                        <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: DYN_COLORS.blue }}>Rol en Proyecto</th>
                        {config.mostrarCedula !== false && <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: DYN_COLORS.blue }}>Cédula</th>}
                        {config.mostrarEmail !== false && <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: DYN_COLORS.blue }}>Email</th>}
                        {config.mostrarTelefono !== false && <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: DYN_COLORS.blue }}>Teléfono</th>}
                        {config.mostrarNivelAcademico !== false && <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: DYN_COLORS.blue }}>Nivel Académico</th>}
                        {config.mostrarHoras !== false && <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: DYN_COLORS.blue }}>Horas</th>}
                    </tr>
                </thead>
                <tbody>
                    <tr className="hover:bg-slate-50/50">
                        <td className="border border-slate-200 p-2 text-slate-800 font-semibold">[Nombre del Director]</td>
                        <td className="border border-slate-200 p-2 text-slate-600">Director de Proyecto</td>
                        {config.mostrarCedula !== false && <td className="border border-slate-200 p-2 text-slate-500">17XXXXXX89</td>}
                        {config.mostrarEmail !== false && <td className="border border-slate-200 p-2 text-slate-500">director@istpet.edu.ec</td>}
                        {config.mostrarTelefono !== false && <td className="border border-slate-200 p-2 text-slate-500">0987654321</td>}
                        {config.mostrarNivelAcademico !== false && <td className="border border-slate-200 p-2 text-slate-500">Magíster / PhD</td>}
                        {config.mostrarHoras !== false && <td className="border border-slate-200 p-2 text-slate-600 font-bold">20 hs</td>}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                        <td className="border border-slate-200 p-2 text-slate-800 font-semibold">[Nombre de Docente]</td>
                        <td className="border border-slate-200 p-2 text-slate-600">Docente Colaborador</td>
                        {config.mostrarCedula !== false && <td className="border border-slate-200 p-2 text-slate-500">17XXXXXX75</td>}
                        {config.mostrarEmail !== false && <td className="border border-slate-200 p-2 text-slate-500">docente@istpet.edu.ec</td>}
                        {config.mostrarTelefono !== false && <td className="border border-slate-200 p-2 text-slate-500">0981234567</td>}
                        {config.mostrarNivelAcademico !== false && <td className="border border-slate-200 p-2 text-slate-500">Magíster</td>}
                        {config.mostrarHoras !== false && <td className="border border-slate-200 p-2 text-slate-600 font-bold">10 hs</td>}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const RenderRubricTable: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="overflow-x-auto my-2">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Rúbrica de Evaluación del Documento</span>
            </div>
            <table className="w-full border-collapse text-[10px] border border-slate-200">
                <thead>
                    <tr>
                        <th className="border border-slate-300 p-2 text-white font-bold text-left uppercase text-[9px]" style={{ backgroundColor: DYN_COLORS.blue }}>Criterio Evaluado</th>
                        <th className="border border-slate-300 p-2 text-white font-bold text-center uppercase text-[9px] w-20" style={{ backgroundColor: DYN_COLORS.blue }}>Máximo</th>
                        <th className="border border-slate-300 p-2 text-white font-bold text-center uppercase text-[9px] w-28" style={{ backgroundColor: DYN_COLORS.blue }}>Calificación</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="hover:bg-slate-50/50">
                        <td className="border border-slate-200 p-2 text-slate-800">
                            <strong className="block text-[10px] text-slate-800">Coherencia Metodológica</strong>
                            {config.mostrarDescripcionCriterio !== false && (
                                <span className="block text-[8.5px] text-slate-400 leading-relaxed mt-0.5">
                                    Define la correspondencia lógica entre objetivos, metodología y resultados planteados en el proyecto.
                                </span>
                            )}
                            {config.mostrarObservacionesCriterio !== false && (
                                <span className="block text-[8.5px] text-slate-500 font-semibold italic mt-1 text-amber-600">
                                    Obs: Se sugiere detallar el marco analítico.
                                </span>
                            )}
                        </td>
                        <td className="border border-slate-200 p-2 text-center text-slate-600 font-bold">40</td>
                        <td className="border border-slate-200 p-2 text-center text-slate-600 italic">[Pendiente]</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                        <td className="border border-slate-200 p-2 text-slate-800">
                            <strong className="block text-[10px] text-slate-800">Viabilidad del Proyecto</strong>
                            {config.mostrarDescripcionCriterio !== false && (
                                <span className="block text-[8.5px] text-slate-400 leading-relaxed mt-0.5">
                                    Análisis del presupuesto, cronograma y recursos humanos disponibles para su finalización.
                                </span>
                            )}
                        </td>
                        <td className="border border-slate-200 p-2 text-center text-slate-600 font-bold">60</td>
                        <td className="border border-slate-200 p-2 text-center text-slate-600 italic">[Pendiente]</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                        <td className="border border-slate-300 p-2 text-right text-slate-700 uppercase text-[9px]">Puntaje Total Consolidado:</td>
                        <td className="border border-slate-300 p-2 text-center text-slate-800 font-black">100</td>
                        <td className="border border-slate-300 p-2 text-center bg-slate-100 text-brand font-black text-xs">[Por calificar]</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const RenderProjectGeneralSection: React.FC<{ config: any }> = ({ config }) => {
    const c = config || {};
    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Ficha de Identificación del Proyecto (Metadatos Científicos)</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-700 leading-relaxed">
                {c.showTitulo !== false && (
                    <div className="col-span-2">
                        <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Título del Proyecto:</span>
                        <span className="font-bold text-slate-800">[TEMA / NOMBRE DEL PROYECTO EN MAYÚSCULAS]</span>
                    </div>
                )}
                {c.showDirector !== false && (
                    <div>
                        <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Director del Proyecto:</span>
                        <span className="font-semibold text-slate-600">[Nombre del Director]</span>
                    </div>
                )}
                {c.showCarrera !== false && (
                    <div>
                        <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Carrera / Unidad Académica:</span>
                        <span className="font-semibold text-slate-600">[Carrera del Docente]</span>
                    </div>
                )}
                {c.showConvocatoria !== false && (
                    <div>
                        <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Convocatoria:</span>
                        <span className="font-semibold text-slate-600">[Convocatoria Activa IST Traversari]</span>
                    </div>
                )}
                {c.showPrograma !== false && (
                    <div>
                        <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Programa de Investigación:</span>
                        <span className="font-semibold text-slate-600">[Programa Institucional]</span>
                    </div>
                )}
                {c.showGrupo !== false && (
                    <div>
                        <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Grupo de Investigación:</span>
                        <span className="font-semibold text-slate-600">[Grupo Aprobado]</span>
                    </div>
                )}
                {c.showLinea !== false && (
                    <div>
                        <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Línea de Investigación:</span>
                        <span className="font-semibold text-slate-600">[Dominio, Línea y Sublínea Científica]</span>
                    </div>
                )}
                {c.showTipo !== false && (
                    <div>
                        <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Tipo de Investigación:</span>
                        <span className="font-semibold text-slate-600">[Básica / Aplicada / Experimental]</span>
                    </div>
                )}
                {c.showCaces !== false && (
                    <div>
                        <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Campo Detallado CACES:</span>
                        <span className="font-semibold text-slate-600">[Clasificación CACES de la Carrera]</span>
                    </div>
                )}
                {c.showFechas !== false && (
                    <div>
                        <span className="font-bold block text-slate-500 text-[8px] uppercase tracking-wider">Fechas y Plazos:</span>
                        <span className="font-semibold text-slate-600">[Fecha Inicio - Fecha Fin]</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const RenderImpacts: React.FC<{ config: any }> = ({ config }) => {
    const c = config || {};
    const impactList = [
        { key: 'showImpactoSocial', label: 'Social' },
        { key: 'showImpactoCientifico', label: 'Científico' },
        { key: 'showImpactoEconomico', label: 'Económico' },
        { key: 'showImpactoPolitico', label: 'Político' },
        { key: 'showImpactoAmbiental', label: 'Ambiental' },
        { key: 'showImpactoOtro', label: 'Otro' },
    ].filter(i => (c as any)[i.key] !== false);

    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Matriz de Impactos y Productos Esperados</span>
            </div>

            <div className="space-y-4">
                {c.showProductosEsperados !== false && (
                    <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Productos Esperados:</span>
                        <table className="w-full border-collapse text-[10px] border border-slate-200 bg-white">
                            <thead>
                                <tr>
                                    <th className="border border-slate-300 p-1.5 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600">Tipo de Producto</th>
                                    <th className="border border-slate-300 p-1.5 bg-slate-100 font-bold text-center uppercase text-[8px] text-slate-600 w-16">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-200 p-1.5 text-slate-800">[Tipo de Producto de Investigación]</td>
                                    <td className="border border-slate-200 p-1.5 text-center font-bold text-slate-600">1</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {impactList.length > 0 && (
                    <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Áreas de Impacto Mapeadas:</span>
                        <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-700 leading-normal">
                            {impactList.map(item => (
                                <div key={item.label} className="p-2 border border-slate-150 rounded bg-white flex justify-between gap-4">
                                    <strong className="text-[8px] uppercase text-slate-400 w-16 text-left">{item.label}</strong>
                                    <span className="text-slate-600 italic font-medium flex-1 text-right">[Descripción de Impacto]</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const RenderProjectBudgetSection: React.FC<{ config: any }> = ({ config }) => {
    const c = config || {};
    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Presupuesto y Financiamiento del Proyecto</span>
            </div>

            <div className="space-y-4">
                {c.showRecursosDisponibles !== false && (
                    <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Recursos Disponibles (Equipos, Licencias, Espacios):</span>
                        <table className="w-full border-collapse text-[10px] border border-slate-200 bg-white">
                            <thead>
                                <tr>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600">Descripción del Recurso</th>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-center uppercase text-[8px] text-slate-600 w-12">Cant.</th>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600 w-24">Fuente</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-200 p-1 text-slate-800">[Equipo/Laboratorio Computación]</td>
                                    <td className="border border-slate-200 p-1 text-center font-bold text-slate-600">1</td>
                                    <td className="border border-slate-200 p-1 text-slate-600">ISTPET</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {c.showRecursosNecesarios !== false && (
                    <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Recursos Necesarios (Gasto Detallado):</span>
                        <table className="w-full border-collapse text-[10px] border border-slate-200 bg-white">
                            <thead>
                                <tr>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600">Partida / Rubro</th>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-center uppercase text-[8px] text-slate-600 w-12">Cant.</th>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-right uppercase text-[8px] text-slate-600 w-20">P. Unit.</th>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-right uppercase text-[8px] text-slate-600 w-20">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-200 p-1 text-slate-800">[Viáticos para salida de campo / Reactivos]</td>
                                    <td className="border border-slate-200 p-1 text-center font-bold text-slate-600">2</td>
                                    <td className="border border-slate-200 p-1 text-right text-slate-600">$50.00</td>
                                    <td className="border border-slate-200 p-1 text-right font-bold text-slate-800">$100.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {c.showFinanciamiento !== false && (
                    <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-dashed border-slate-200">
                        <div className="text-[9px] text-slate-700 space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 border border-slate-300 bg-slate-50 rounded" />
                                <span>Financiamiento Solicitado al ISTPET</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 border border-slate-300 bg-slate-50 rounded" />
                                <span>Financiamiento de Otras Fuentes</span>
                            </div>
                        </div>
                        <div className="text-right flex flex-col justify-end">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Presupuesto Total Estimado:</span>
                            <span className="text-sm font-black text-slate-800">$100.00</span>
                        </div>
                    </div>
                )}

                <p className="text-[8px] text-emerald-600 font-black border-t border-dashed border-emerald-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Los investigadores ingresarán los recursos y montos en la pestaña "Recursos & Financiamiento" del Workspace.
                </p>
            </div>
        </div>
    );
};

const RenderProjectTechnicalSection: React.FC<{ config: any }> = ({ config }) => {
    const c = config || {};
    const subs = [
        { key: 'showAntecedentes', title: '3.1 Antecedentes de la Problemática' },
        { key: 'showDescripcionProyecto', title: '3.2 Descripción General de la Propuesta' },
        { key: 'showJustificacion', title: '3.3 Justificación e Importancia' },
        { key: 'showObjetivoGeneral', title: '3.4 Objetivos (General)' },
        { key: 'showObjetivosEspecificos', title: '3.4 Objetivos (Específicos)' },
        { key: 'showOds', title: '3.5 Alineación ODS' },
        { key: 'showMarcoTeorico', title: '3.6 Marco Teórico Científico' },
        { key: 'showMetodologia', title: '3.7 Enfoque Metodológico' },
        { key: 'showEvaluacion', title: '3.8 Evaluación Técnica de Resultados' },
    ].filter(s => (c as any)[s.key] !== false);

    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Plan Técnico y Científico ({subs.length} Sub-Secciones Activas)</span>
            </div>

            <div className="space-y-2 text-[9px] text-slate-700">
                <div className="grid grid-cols-2 gap-2">
                    {subs.map(sub => (
                        <div key={sub.key} className="p-2 border border-slate-150 rounded bg-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                            <span className="font-semibold text-slate-600 truncate">{sub.title}</span>
                        </div>
                    ))}
                </div>

                <p className="text-[8px] text-pink-600 font-black border-t border-dashed border-pink-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                    Los investigadores redactarán estas secciones colaborativamente en la pestaña "Plan Técnico" del Workspace.
                </p>
            </div>
        </div>
    );
};

const RenderProjectProgressReport: React.FC<{ config: any }> = ({ config }) => {
    const c = config || {};
    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Avance de Ejecución y Monitoreo (Fase 3)</span>
            </div>

            <div className="space-y-4 text-[9px] text-slate-700">
                {c.showEvidencias !== false && (
                    <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Bitácora Científica:</span>
                        <p className="text-slate-500 italic">[Campo colaborativo para registrar conclusiones parciales y bitácora del período]</p>
                    </div>
                )}

                {c.showHitosCompletados !== false && (
                    <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Hitos y Entregables Completados:</span>
                        <table className="w-full border-collapse text-[10px] border border-slate-200 bg-white">
                            <thead>
                                <tr>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600">Actividad / Hito</th>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-center uppercase text-[8px] text-slate-600 w-16">Avance</th>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-center uppercase text-[8px] text-slate-600 w-16">Completado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-200 p-1 text-slate-800">[Desarrollo de experimentos de campo]</td>
                                    <td className="border border-slate-200 p-1 text-center text-slate-600">100%</td>
                                    <td className="border border-slate-200 p-1 text-center font-bold text-emerald-600">SÍ</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {c.showPresupuestoEjecutado !== false && (
                    <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ejecución del Presupuesto de Gasto:</span>
                        <table className="w-full border-collapse text-[10px] border border-slate-200 bg-white">
                            <thead>
                                <tr>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-left uppercase text-[8px] text-slate-600">Partida Ejecutada</th>
                                    <th className="border border-slate-300 p-1 bg-slate-100 font-bold text-right uppercase text-[8px] text-slate-600 w-24">Monto Gastado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-200 p-1 text-slate-800">[Adquisición de insumos de laboratorio]</td>
                                    <td className="border border-slate-200 p-1 text-right font-bold text-slate-800">$100.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="text-[8px] text-emerald-600 font-black border-t border-dashed border-emerald-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Los investigadores registrarán el avance, evidencias e hitos en la pestaña "Avance de Ejecución" del Workspace.
                </p>
            </div>
        </div>
    );
};

const RenderProjectEthicsReport: React.FC<{ config: any }> = () => {
    return (
        <div className="my-2 p-4 border border-slate-200 rounded-lg bg-slate-50/50 select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded">
                <span>Evaluación de Pertinencia Ética y Bioética</span>
            </div>

            <div className="space-y-3 text-[9px] text-slate-700">
                <div className="p-2 border border-slate-150 rounded bg-white">
                    <strong className="text-[8px] uppercase text-slate-400 block mb-0.5">Justificación Ética de la Propuesta:</strong>
                    <span className="text-slate-600 italic font-medium">[Descripción detallada del impacto ético e intervenciones]</span>
                </div>

                <div className="p-2 border border-slate-150 rounded bg-white">
                    <strong className="text-[8px] uppercase text-slate-400 block mb-0.5">Riesgos Identificados & Mitigación:</strong>
                    <span className="text-slate-600 italic font-medium">[Detalle de riesgos biológicos, sociales o digitales]</span>
                </div>

                <div className="p-2 border border-slate-150 rounded bg-white">
                    <strong className="text-[8px] uppercase text-slate-400 block mb-0.5">Mecanismo de Consentimiento Informado:</strong>
                    <span className="text-slate-600 italic font-medium">[Detalle del procedimiento de obtención del consentimiento]</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-dashed border-slate-200">
                    <div className="p-2 border border-slate-150 rounded bg-white">
                        <strong className="text-[8px] uppercase text-slate-400 block mb-0.5">Dictamen Final del Comité:</strong>
                        <span className="text-emerald-600 font-bold uppercase text-[9px]">Aprobado sin observaciones</span>
                    </div>
                    <div className="p-2 border border-slate-150 rounded bg-white">
                        <strong className="text-[8px] uppercase text-slate-400 block mb-0.5">Observaciones de Enmienda:</strong>
                        <span className="text-slate-500 italic font-medium">[Sin requerimientos obligatorios]</span>
                    </div>
                </div>

                <p className="text-[8px] text-emerald-600 font-black border-t border-dashed border-emerald-200/40 pt-1.5 mt-2 flex items-center gap-1 select-none uppercase tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    La comisión evaluará y dictaminará sobre el protocolo evaluado en el panel doble ciego.
                </p>
            </div>
        </div>
    );
};

const UNIQUE_BLOCK_TYPES = [
    'cover',
    'project_general_section',
    'project_technical_section',
    'project_budget_section',
    'project_progress_report',
    'project_ethics_report',
    'researchers_table',
    'gantt',
    'signatures',
    'impacts',
    'rubric_table'
];

// ─── Item arrastrable individual A4 ─────────────────────────────────────────────
interface SortableBlockItemProps {
    block: DocumentBlock;
    index: number;
    isActive: boolean;
    coverImage?: string;
    onSelectBlock: (id: string) => void;
    onToggleActive: (index: number) => void;
    onDeleteBlock: (id: string) => void;
    onDuplicateBlock: (id: string) => void;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
    themeConfig?: any;
}

const SortableBlockItem: React.FC<SortableBlockItemProps> = ({
    block, index, isActive, coverImage, onSelectBlock, onToggleActive, onDeleteBlock, onDuplicateBlock, onUpdateConfig, themeConfig,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        zIndex: isDragging ? 999 : undefined,
    };

    const badge = (() => {
        const baseStyle = 'bg-slate-50 text-slate-500 border-slate-200/60';
        const isEditable = block.config?.isEditableWorkspace !== false;

        switch (block.type) {
            case 'cover':
            case 'title':
            case 'page_break':
            case 'signatures':
                return { text: 'Estático', dotColor: 'bg-slate-400', color: baseStyle, activeCls: 'ring-1 ring-slate-400 border-slate-400 shadow-sm' };

            case 'two_column':
            case 'advanced_table':
            case 'rich_text':
                if (isEditable) {
                    return {
                        text: block.type === 'rich_text' ? 'Colaborativo' : 'Configurable',
                        dotColor: 'bg-pink-500 animate-pulse',
                        color: baseStyle,
                        activeCls: 'ring-1 ring-pink-500 border-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.08)]'
                    };
                } else {
                    return {
                        text: 'Estático',
                        dotColor: 'bg-slate-400',
                        color: baseStyle,
                        activeCls: 'ring-1 ring-slate-400 border-slate-400 shadow-sm'
                    };
                }
            case 'gantt':
                return { text: 'Cronograma', dotColor: 'bg-indigo-500', color: baseStyle, activeCls: 'ring-1 ring-indigo-500 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.08)]' };
            case 'project_general_section':
            case 'project_technical_section':
            case 'project_budget_section':
            case 'project_progress_report':
            case 'project_ethics_report':
            case 'researchers_table':
            case 'rubric_table':
            case 'impacts':
            case 'multi_section_table':
                return { text: 'Dinámico', dotColor: 'bg-emerald-500', color: baseStyle, activeCls: 'ring-1 ring-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.08)]' };
            default:
                return null;
        }
    })();

    const isCover = block.type === 'cover';

    const renderContent = () => {
        if (!block.isActive) {
            return (
                <div className="py-3 px-4 border border-dashed border-slate-200 bg-slate-50/50 rounded text-center text-slate-400 italic text-[10px]">
                    Bloque "{block.title}" oculto en la generación del PDF
                </div>
            );
        }

        switch (block.type) {
            case 'cover': return <RenderCover config={block.config} coverImage={coverImage} blockId={block.id} onUpdateConfig={onUpdateConfig} themeConfig={themeConfig} />;
            case 'title': return <RenderTitle config={block.config} />;
            case 'rich_text': return <RenderRichText config={block.config} />;
            case 'advanced_table': return <RenderAdvancedTable config={block.config} />;
            case 'multi_section_table': return <RenderMultiSectionTable config={block.config} />;
            case 'two_column': return <RenderTwoColumn config={block.config} />;
            case 'gantt': return <RenderGantt config={block.config} />;
            case 'researchers_table': return <RenderResearchersTable config={block.config} />;
            case 'rubric_table': return <RenderRubricTable config={block.config} />;
            case 'signatures': return <RenderSignatures config={block.config} />;
            case 'project_general_section': return <RenderProjectGeneralSection config={block.config} />;
            case 'project_technical_section': return <RenderProjectTechnicalSection config={block.config} />;
            case 'project_budget_section': return <RenderProjectBudgetSection config={block.config} />;
            case 'project_progress_report': return <RenderProjectProgressReport config={block.config} />;
            case 'project_ethics_report': return <RenderProjectEthicsReport config={block.config} />;
            case 'impacts': return <RenderImpacts config={block.config} />;
            case 'page_break': return null;
            default:
                return <div className="p-4 border bg-red-50 text-red-500 text-xs">Bloque no renderizado: {block.type}</div>;
        }
    };

    if (block.type === 'page_break') {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={() => onSelectBlock(block.id)}
                className={`group relative py-1.5 px-4 my-2 border-t-2 border-b-2 border-dashed border-slate-300 bg-slate-50/30 flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 cursor-grab active:cursor-grabbing hover:border-slate-400 hover:bg-slate-50/50
                    ${isActive ? 'ring-1 ring-zinc-950 border-zinc-950' : ''}
                    ${isDragging ? 'opacity-60 scale-[0.97] transition-none border-t-indigo-400 border-b-indigo-400 shadow-sm' : 'transition-all'}
                `}
            >
                <div className="flex items-center gap-2">
                    <span>Salto de Página en PDF</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={e => { e.stopPropagation(); onDeleteBlock(block.id); }}
                        className="p-1 rounded hover:bg-error/10 text-slate-400 hover:text-error transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    const themeCls = (() => {
        if (isCover) return '';
        switch (block.type) {
            case 'rich_text':
                return 'bg-white hover:bg-pink-50/30 hover:border-pink-300';
            case 'gantt':
                return 'bg-white hover:bg-indigo-50/30 hover:border-indigo-300';
            case 'project_general_section':
            case 'project_technical_section':
            case 'project_budget_section':
            case 'project_progress_report':
            case 'project_ethics_report':
            case 'researchers_table':
            case 'rubric_table':
            case 'impacts':
                return 'bg-white hover:bg-emerald-50/30 hover:border-emerald-300';
            default:
                return 'bg-white hover:bg-slate-50/30 hover:border-slate-300';
        }
    })();

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onSelectBlock(block.id)}
            className={`group relative cursor-grab active:cursor-grabbing ${isCover ? 'p-0 border-none w-full h-full flex flex-col flex-1' : 'border rounded-md p-4'} ${themeCls}
                ${isDragging
                    ? 'shadow-[0_20px_40px_rgba(0,0,0,0.12)] border-slate-300 opacity-80 scale-[0.97] rotate-[-0.5deg] transition-none z-[999]'
                    : isActive
                        ? (badge?.activeCls || 'ring-1 ring-zinc-950 border-zinc-950 shadow-sm')
                        : isCover
                            ? 'border-transparent'
                            : 'border-slate-200'
                }
            `}
        >
            {/* Insignia de Comportamiento del Plugin */}
            {badge && !isCover && (
                <div className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[8px] font-mono font-medium uppercase tracking-widest border select-none flex items-center gap-1.5 ${badge.color}`}>
                    <span className={`w-1 h-1 rounded-full ${badge.dotColor}`} />
                    {badge.text}
                </div>
            )}

            {/* Controles Flotantes Notion-style */}
            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm no-drag">
                <button
                    onClick={e => { e.stopPropagation(); onToggleActive(index); }}
                    className={`p-1 rounded hover:bg-slate-100 transition-colors ${block.isActive ? 'text-slate-400 hover:text-slate-600' : 'text-error'}`}
                    title={block.isActive ? 'Ocultar en PDF' : 'Mostrar en PDF'}
                >
                    {block.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                {!UNIQUE_BLOCK_TYPES.includes(block.type) && (
                    <button
                        onClick={e => { e.stopPropagation(); onDuplicateBlock(block.id); }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Duplicar bloque"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    onClick={e => { e.stopPropagation(); onDeleteBlock(block.id); }}
                    className="p-1 rounded hover:bg-error/10 text-slate-400 hover:text-error transition-colors"
                    title="Eliminar bloque"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Renderizado de contenido real */}
            <div className={`relative ${isCover ? 'pt-0 flex-1 flex flex-col' : 'pt-6'}`}>
                {renderContent()}
            </div>
        </div>
    );
};

// Separador visual de hoja A4
const PageBreakIndicator: React.FC<{ pageNum: number }> = ({ pageNum }) => (
    <div className="flex items-center gap-3 my-4 pointer-events-none">
        <div className="flex-1 border-t border-dashed border-slate-300" />
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest shrink-0 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Página {pageNum}
        </span>
        <div className="flex-1 border-t border-dashed border-slate-300" />
    </div>
);

// ─── Canvas principal en formato de Hoja A4 ─────────────────────────────────────
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
    rightActions,
    themeConfig,
    onUpdateConfig,
}) => {
    const activeRef = useRef<HTMLDivElement>(null);

    // Actualizar colores dinámicos desde el themeConfig
    if (themeConfig?.colors) {
        DYN_COLORS.blue = themeConfig.colors.primary || '#1e2a4a';
        DYN_COLORS.gold = themeConfig.colors.secondary || '#b8912e';
        DYN_COLORS.gray = themeConfig.colors.text || '#475569';
    }

    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [activeBlockId]);

    const activeCount = blocks.filter(b => b.isActive).length;

    // Agrupamos los bloques en páginas lógicas para renderizarlos en hojas A4 independientes.
    // La portada ('cover') siempre fuerza la creación de su propia página exclusiva.
    const pages: { pageNum: number; blocks: { block: DocumentBlock; originalIndex: number }[] }[] = [];
    let currentPageBlocks: { block: DocumentBlock; originalIndex: number }[] = [];
    let currentPageNum = 1;

    blocks.forEach((block, idx) => {
        if (block.type === 'page_break') {
            pages.push({ pageNum: currentPageNum, blocks: currentPageBlocks });
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
                    {onToggleHeader && (
                        <button
                            onClick={onToggleHeader}
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

                    {onToggleHeader && <div className="w-px h-3.5 bg-border-thin" />}

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
                {blocks.length === 0 ? (
                    /* Contenedor simulando hoja A4 vacía */
                    <div className="force-light-theme max-w-[794px] mx-auto bg-white text-slate-950 p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-200 min-h-[1123px] rounded-sm relative flex flex-col justify-center items-center text-center">
                        <Layers className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">El documento está vacío</h3>
                        <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                            Usa el menú superior "+ Agregar Bloque" para inyectar componentes en esta hoja A4.
                        </p>
                    </div>
                ) : (
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-8 flex flex-col items-center">
                            {pages.map((page) => {
                                const isCoverPage = page.blocks.some(b => b.block.type === 'cover');
                                const bgImg = !isCoverPage && themeConfig?.brand?.backgroundImage;

                                return (
                                    <React.Fragment key={page.pageNum}>
                                        {page.pageNum > 1 && <PageBreakIndicator pageNum={page.pageNum} />}
                                        <div
                                            onClick={e => e.stopPropagation()}
                                            style={bgImg ? {
                                                backgroundImage: `url(${bgImg})`,
                                                backgroundSize: 'contain',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'top center'
                                            } : undefined}
                                            className={`force-light-theme max-w-[794px] w-full bg-white text-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-zinc-200 min-h-[1123px] rounded-sm relative flex flex-col transition-all cursor-default ${isCoverPage ? 'p-0 gap-0' : 'p-12 gap-2'
                                                }`}
                                        >
                                            {page.blocks.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded p-6 text-slate-400 italic text-[10px]">
                                                    Página vacía. Arrastra bloques aquí o escribe contenido.
                                                </div>
                                            ) : (
                                                page.blocks.map(({ block, originalIndex }) => {
                                                    const isActiveBlock = activeBlockId === block.id;

                                                    return (
                                                        <div key={block.id} ref={isActiveBlock ? activeRef : undefined}>
                                                            <SortableBlockItem
                                                                block={block}
                                                                index={originalIndex}
                                                                isActive={isActiveBlock}
                                                                coverImage={themeConfig?.brand?.coverImage}
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
