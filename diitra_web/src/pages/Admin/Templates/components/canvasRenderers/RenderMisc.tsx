import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    rectSortingStrategy,
    useSortable,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GanttObjective } from '../../types';
import { DYN_COLORS, getHeaderStylePair } from './RenderCover';

export const RenderTitle: React.FC<{ config: any; themeConfig?: any }> = ({ config, themeConfig }) => {
    const text = config.text || 'TÍTULO DE SECCIÓN';
    const fontSize = (config.fontSize || config.level || 'H2').toUpperCase();
    const align = config.alignment || 'left';

    const pTheme = themeConfig?.colors?.primary;
    const sTheme = themeConfig?.colors?.secondary;
    const tableHeaderBg = themeConfig?.colors?.tableHeaderBg || pTheme || DYN_COLORS.blue;
    const tableHeaderColor = themeConfig?.colors?.tableHeaderColor || '#ffffff';
    const primaryColor = pTheme || DYN_COLORS.blue;
    const secondaryColor = sTheme || DYN_COLORS.gold;

    const alignStyle: React.CSSProperties = {
        textAlign: align as any,
    };

    if (fontSize === 'H1') {
        return (
            <h1 className="text-sm font-black uppercase tracking-tight mb-2 mt-4 pb-1 border-b-2" style={{ ...alignStyle, color: primaryColor, borderColor: secondaryColor }}>
                {text}
            </h1>
        );
    }
    if (fontSize === 'H2') {
        return (
            <h2 className="text-xs font-black px-3 py-2 uppercase tracking-wide mb-2 mt-4 shadow-xs rounded-xs" style={{ ...alignStyle, backgroundColor: tableHeaderBg, color: tableHeaderColor }}>
                {text}
            </h2>
        );
    }
    return (
        <h3 className="text-xs font-bold uppercase tracking-wide mb-2 mt-3" style={{ ...alignStyle, color: secondaryColor }}>
            {text}
        </h3>
    );
};

export const RenderRichText: React.FC<{
    config: any;
    title?: string;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, title, blockId, onUpdateConfig }) => {
    const c = config || {};
    const displayTitle = c.title || title || '';
    const guideline = c.guidelineText ?? c.placeholder ?? '[El proyecto debe tener mínimo 10 y máximo 15 fuentes bibliográficas]';
    const html = c.html || c.text || '';

    const headerColorKey = c.headerColor || 'navy';
    const headerBg = headerColorKey === 'gold'
        ? '#c4a857'
        : headerColorKey === 'slate'
        ? '#334155'
        : headerColorKey === 'emerald'
        ? '#065f46'
        : headerColorKey.startsWith('#')
        ? headerColorKey
        : '#222c57';

    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');

    const handleStartEditing = (key: string, currentVal: string) => {
        if (!onUpdateConfig || !blockId) return;
        setEditingKey(key);
        setEditingText(currentVal);
    };

    const handleSaveText = (key: string) => {
        if (!onUpdateConfig || !blockId) return;
        onUpdateConfig(blockId, key, editingText);
        setEditingKey(null);
    };

    const handleCycleHeaderColor = () => {
        if (!onUpdateConfig || !blockId) return;
        const colorCycle = ['navy', 'gold', 'slate', 'emerald'];
        const currentIdx = colorCycle.indexOf(headerColorKey);
        const nextColor = colorCycle[(currentIdx + 1) % colorCycle.length];
        onUpdateConfig(blockId, 'headerColor', nextColor);
    };

    return (
        <div className="my-3 space-y-2 select-none relative group/richTextBlock">
            {/* PÍLDORA FLOTANTE DE CONTROLES */}
            {onUpdateConfig && blockId && (
                <div
                    className="absolute -top-3 right-0 z-30 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm opacity-0 group-hover/richTextBlock:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}
                >
                    <span className="text-[7.5px] uppercase font-bold text-slate-400">Color:</span>
                    <button
                        type="button"
                        onClick={handleCycleHeaderColor}
                        className={`px-1.5 py-0.2 text-[8px] font-bold rounded border transition-all cursor-pointer ${
                            headerColorKey === 'gold'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : headerColorKey === 'slate'
                                ? 'bg-slate-100 text-slate-800 border-slate-300'
                                : headerColorKey === 'emerald'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                        title="Cambiar color de título"
                    >
                        {headerColorKey === 'gold' ? 'Dorado' : headerColorKey === 'slate' ? 'Pizarra' : headerColorKey === 'emerald' ? 'Verde' : 'Azul'}
                    </button>
                    <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />
                    <button
                        type="button"
                        onClick={() => handleStartEditing('guidelineText', guideline)}
                        className="px-1.5 py-0.2 text-[8px] font-bold rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Editar texto de guía normativo"
                    >
                        Editar Guía
                    </button>
                </div>
            )}

            {/* TÍTULO DE LA SECCIÓN (EDITABLE IN-PLACE) */}
            {displayTitle && (
                <div className="mb-2 ml-7 sm:ml-8">
                    {editingKey === 'title' ? (
                        <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                            <input
                                type="text"
                                value={editingText}
                                onChange={e => setEditingText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveText('title');
                                    if (e.key === 'Escape') setEditingKey(null);
                                }}
                                autoFocus
                                className="text-[10.5pt] font-bold uppercase tracking-wide bg-white text-slate-900 border border-indigo-400 px-1 py-0.5 rounded outline-none w-full"
                            />
                            <button
                                type="button"
                                onClick={() => handleSaveText('title')}
                                className="p-1 bg-emerald-600 text-white rounded text-[10px]"
                            >
                                <Check className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingKey(null)}
                                className="p-1 bg-slate-400 text-white rounded text-[10px]"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <div
                            className="group/title flex items-center gap-2 cursor-pointer"
                            onClick={() => handleStartEditing('title', displayTitle)}
                            title="Clic para editar título"
                        >
                            <h5
                                className="text-[10.5pt] font-bold uppercase tracking-wide transition-colors"
                                style={{ color: headerBg }}
                            >
                                {displayTitle}
                            </h5>
                            {onUpdateConfig && blockId && (
                                <Pencil className="w-3 h-3 opacity-0 group-hover/title:opacity-100 text-indigo-600 transition-opacity" />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* CONTENIDO / TEXTO GUÍA (EDITABLE IN-PLACE) */}
            <div className="ml-12 sm:ml-16">
                {editingKey === 'guidelineText' ? (
                    <div className="flex items-start gap-1 select-text" onClick={e => e.stopPropagation()}>
                        <textarea
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveText('guidelineText');
                                if (e.key === 'Escape') setEditingKey(null);
                            }}
                            autoFocus
                            rows={2}
                            className="w-full text-[9.5pt] text-slate-800 bg-white border border-indigo-400 p-1.5 rounded outline-none resize-none font-sans"
                        />
                        <div className="flex flex-col gap-1">
                            <button
                                type="button"
                                onClick={() => handleSaveText('guidelineText')}
                                className="p-1 bg-emerald-600 text-white rounded text-[10px]"
                                title="Guardar (Ctrl+Enter)"
                            >
                                <Check className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingKey(null)}
                                className="p-1 bg-slate-400 text-white rounded text-[10px]"
                                title="Cancelar"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ) : html && html !== '<p class="text-gray-400 italic">Escribe el contenido enriquecido aquí...</p>' ? (
                    <div
                        className="prose max-w-none text-[9.5pt] leading-relaxed text-slate-800"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                ) : (
                    <div
                        className="text-[9.5pt] text-slate-900 leading-relaxed cursor-pointer hover:bg-indigo-50/40 p-1 rounded transition-colors group/guide flex items-center justify-between"
                        onClick={() => handleStartEditing('guidelineText', guideline)}
                        title="Clic para editar texto guía"
                    >
                        <span>{guideline}</span>
                        {onUpdateConfig && blockId && (
                            <Pencil className="w-3 h-3 opacity-0 group-hover/guide:opacity-100 text-indigo-500 transition-opacity ml-2 shrink-0" />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const RenderTwoColumn: React.FC<{ config: any }> = ({ config }) => {
    const leftPair = getHeaderStylePair(config.leftHeaderStyle || 'blue');
    const rightPair = getHeaderStylePair(config.rightHeaderStyle || 'blue');

    return (
        <div className="grid grid-cols-2 gap-3 my-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div className="flex flex-col border-r border-slate-200">
                <div className="p-2 font-bold text-[9px] uppercase" style={{
                    backgroundColor: leftPair.bg,
                    color: leftPair.fg
                }}>
                    {config.leftTitle || 'COLUMNA IZQUIERDA'}
                </div>
                <div
                    className="p-3 text-[10px] text-slate-700 rich-content tiptap-editor"
                    dangerouslySetInnerHTML={{ __html: config.leftContent || '' }}
                />
            </div>
            <div className="flex flex-col">
                <div className="p-2 font-bold text-[9px] uppercase" style={{
                    backgroundColor: rightPair.bg,
                    color: rightPair.fg
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

export const RenderGantt: React.FC<{
    config: any;
    title?: string;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, title, blockId, onUpdateConfig }) => {
    const c = config || {};
    const displayTitle = c.title || title || '7.  CRONOGRAMA DE ACTIVIDADES';
    const totalMonths = c.totalMonths || 12;
    const months = c.months || c.ganttMonths || [
        'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
        'Sept', 'Octubre', 'Nov', 'Dic', 'Enero', 'Feb'
    ].slice(0, totalMonths);

    const objectives: GanttObjective[] = c.objectives || c.ganttObjectives || [
        {
            id: 'obj-default-1',
            name: 'OBJETIVO N° 1',
            activities: [
                { id: '1', name: 'Especificar la actividad', resources: '', startMonth: 0, startWeek: 0, endMonth: 1, endWeek: 3, color: '#60a5fa' },
                { id: '2', name: 'Especificar la actividad', resources: '', startMonth: 2, startWeek: 0, endMonth: 3, endWeek: 3, color: '#f97316' },
            ]
        }
    ];

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleText, setTitleText] = useState(displayTitle);

    const handleSaveTitle = () => {
        setIsEditingTitle(false);
        if (onUpdateConfig && blockId) {
            onUpdateConfig(blockId, 'title', titleText);
        }
    };

    const isInRange = (startMonth: number, startWeek: number, endMonth: number, endWeek: number, mIdx: number, wIdx: number): boolean => {
        const startGlobal = startMonth * 4 + startWeek;
        const endGlobal = endMonth * 4 + endWeek;
        const cellGlobal = mIdx * 4 + wIdx;
        return cellGlobal >= startGlobal && cellGlobal <= endGlobal;
    };

    return (
        <div className="my-3 select-none">
            {/* Título de sección (con edición in-place y sangría institucional) */}
            <div className="mb-2 ml-7 sm:ml-8">
                {isEditingTitle ? (
                    <div className="flex items-center gap-2 select-text" onClick={e => e.stopPropagation()}>
                        <input
                            type="text"
                            value={titleText}
                            onChange={e => setTitleText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveTitle();
                                if (e.key === 'Escape') {
                                    setTitleText(displayTitle);
                                    setIsEditingTitle(false);
                                }
                            }}
                            autoFocus
                            className="text-[10pt] font-bold uppercase tracking-wide bg-white border border-indigo-400 px-2 py-0.5 rounded outline-none font-sans text-[#222c57] w-full max-w-md"
                        />
                        <button
                            type="button"
                            onClick={handleSaveTitle}
                            className="p-1 bg-emerald-600 text-white rounded text-[10px]"
                            title="Guardar"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setTitleText(displayTitle);
                                setIsEditingTitle(false);
                            }}
                            className="p-1 bg-slate-400 text-white rounded text-[10px]"
                            title="Cancelar"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <div
                        className="group/title flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                            setTitleText(displayTitle);
                            setIsEditingTitle(true);
                        }}
                        title="Clic para editar título"
                    >
                        <p className="font-bold text-[10pt] uppercase tracking-wide font-sans text-[#222c57]">
                            {displayTitle}
                        </p>
                        {onUpdateConfig && blockId && (
                            <Pencil className="w-3 h-3 opacity-0 group-hover/title:opacity-100 text-indigo-600 transition-opacity" />
                        )}
                    </div>
                )}
            </div>

            {/* Subtítulo institucional en cursiva */}
            <div className="text-center mb-2">
                <span className="italic font-bold text-[9pt] text-slate-800">
                    Cronograma (Diagrama de Gantt)
                </span>
            </div>

            {/* Contenedor apaisado (Landscape) con scroll horizontal fluido y badge identificador */}
            <div className="border border-black bg-white rounded-sm overflow-hidden shadow-xs">
                <div className="bg-slate-50 border-b border-slate-200 px-2.5 py-1 flex items-center justify-between text-[8px] text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                        <span>📄</span> Formato A4 Apaisado / Horizontal (297 × 210 mm)
                    </span>
                    <span>{months.length} meses · {months.length * 4} semanas</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[8.5pt] min-w-[860px]">
                        <thead>
                            <tr>
                                <th
                                    className="border border-black p-1 text-center font-bold uppercase text-[8pt]"
                                    style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor, width: '75px' }}
                                    rowSpan={2}
                                >
                                    Objetivos
                                </th>
                                <th
                                    className="border border-black p-1 text-center font-bold uppercase text-[8pt]"
                                    style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor, width: '24px' }}
                                    rowSpan={2}
                                >
                                    N°
                                </th>
                                <th
                                    className="border border-black p-1 text-center font-bold uppercase text-[8pt]"
                                    style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor, width: '24%' }}
                                    rowSpan={2}
                                >
                                    Actividades
                                </th>
                                <th
                                    className="border border-black p-1 text-center font-bold uppercase text-[8pt]"
                                    style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor, width: '18%' }}
                                    rowSpan={2}
                                >
                                    Recursos Necesarios
                                </th>
                                {months.map((m: string, i: number) => (
                                    <th
                                        key={i}
                                        className="border border-black p-1 text-center font-bold text-[7.5pt]"
                                        style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }}
                                        colSpan={4}
                                    >
                                        {m}
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                {months.map((_, mIdx) =>
                                    [1, 2, 3, 4].map((w) => (
                                        <th
                                            key={`${mIdx}-${w}`}
                                            className="border border-black p-0.5 text-[6.5pt] text-center font-bold leading-tight"
                                            style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }}
                                        >
                                            <span className="block text-[6px] opacity-80">S</span>
                                            <span className="block text-[7px]">{w}</span>
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
                                                className="border border-black p-1.5 font-bold bg-white text-center align-middle text-[7.5pt] uppercase text-slate-900"
                                                rowSpan={acts.length}
                                            >
                                                <div className="font-bold leading-tight">
                                                    <span>OBJETIVO</span>
                                                    <br />
                                                    <span>N° {oIdx + 1}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="border border-black p-1 text-center font-bold text-slate-800 text-[8pt]">
                                            {aIdx + 1}
                                        </td>
                                        <td className="border border-black p-1.5 text-slate-800 text-[8pt]">
                                            {act.name}
                                        </td>
                                        <td className="border border-black p-1 text-slate-600 text-[7.5pt] leading-tight">
                                            {act.resources}
                                        </td>
                                        {months.map((_, mIdx) =>
                                            [0, 1, 2, 3].map((wIdx) => {
                                                const filled = isInRange(act.startMonth, act.startWeek, act.endMonth, act.endWeek, mIdx, wIdx);
                                                return (
                                                    <td
                                                        key={`${mIdx}-${wIdx}`}
                                                        className="border border-black p-0"
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
                </div>
            </div>
        </div>
    );
};

interface SignerCard {
    id: string;
    label: string;
    name: string;
    role: string;
    isDynamic?: boolean;
}

const SignatureCardView: React.FC<{ sig: SignerCard; isDragging?: boolean }> = ({ sig, isDragging }) => (
    <div
        className={`w-full max-w-[200px] text-center flex flex-col items-center justify-between p-3.5 rounded-lg border transition-all duration-200 select-none ${
            isDragging
                ? 'shadow-2xl border-brand ring-2 ring-brand/20 bg-surface scale-105 z-50 cursor-grabbing'
                : 'border-border-thin bg-surface/50 hover:bg-surface hover:border-border-hover hover:shadow-xs cursor-grab active:cursor-grabbing'
        }`}
    >
        <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider block mb-3 pointer-events-none truncate max-w-full">
            {sig.label}
        </span>
        
        {/* Línea horizontal de firma formal y limpia */}
        <div className="w-4/5 border-t border-border-hover/70 mb-2.5 pointer-events-none" />

        <div className="space-y-0.5 pointer-events-none w-full">
            <span className="text-[10px] font-semibold text-text-main block truncate">
                {sig.name}
            </span>
            <span className="text-[8.5px] text-text-dim block truncate font-medium">
                {sig.role}
            </span>
        </div>
    </div>
);

const SortableSignatureCard: React.FC<{ sig: SignerCard; isInteractive: boolean }> = ({ sig, isInteractive }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: sig.id, disabled: !isInteractive });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="w-full flex justify-center">
            <SignatureCardView sig={sig} isDragging={false} />
        </div>
    );
};

export const RenderSignatures: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config = {}, blockId, onUpdateConfig }) => {
    const mode = config.signaturesMode || 'team_dynamic';
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 },
        })
    );

    let displaySignatories: SignerCard[] = [];

    if (mode === 'custom_manual') {
        const rawSigs = config.signatories || [
            { label: 'Elaborado por:', name: '[Director de Proyecto]', role: 'Docente Investigador' },
            { label: 'Aprobado por:', name: '[Coordinador de Carrera]', role: 'Coordinación de Carrera' }
        ];
        displaySignatories = rawSigs.map((s: any, i: number) => ({
            id: s._id || `manual_${i}_${s.role}`,
            label: s.label || 'Firmante:',
            name: s.name || '',
            role: s.role || '',
            isDynamic: false
        }));
    } else {
        const dynamicMap: Record<string, SignerCard> = {
            director: { id: 'director', label: 'DIRECTOR DEL PROYECTO', name: '[Director del Proyecto]', role: 'Director de Proyecto', isDynamic: true },
            docentes: { id: 'docentes', label: 'DOCENTE INVESTIGADOR', name: '[Docente Investigador]', role: 'Docente Investigador', isDynamic: true },
            estudiantes: { id: 'estudiantes', label: 'ESTUDIANTE INVESTIGADOR', name: '[Estudiante Auxiliar]', role: 'Auxiliar de Investigación', isDynamic: true },
            coordinador_carrera: { id: 'coordinador_carrera', label: 'COORDINACIÓN DE CARRERA', name: '[Coordinador de Carrera]', role: 'Coordinador de Carrera', isDynamic: true },
            coordinador_diitra: { id: 'coordinador_diitra', label: 'COMISIÓN DE EVALUACIÓN', name: '[Coordinador de Investigación]', role: 'Coordinación de Investigación', isDynamic: true },
            vicerrectorado: { id: 'vicerrectorado', label: 'RESOLUCIÓN INSTITUCIONAL', name: '[Vicerrector Académico]', role: 'Vicerrectorado Académico', isDynamic: true }
        };

        const activeDynamicIds = new Set<string>();
        if (config.includeDirector !== false) activeDynamicIds.add('director');
        if (config.includeDocentes !== false) activeDynamicIds.add('docentes');
        if (config.includeEstudiantes) activeDynamicIds.add('estudiantes');
        if (config.includeCoordinadorCarrera !== false) activeDynamicIds.add('coordinador_carrera');
        if (config.includeCoordinadorDiitra || mode === 'institutional_chain') activeDynamicIds.add('coordinador_diitra');
        if (config.includeVicerrectorado) activeDynamicIds.add('vicerrectorado');

        const defaultOrder = ['director', 'docentes', 'estudiantes', 'coordinador_carrera', 'coordinador_diitra', 'vicerrectorado'];
        const configuredOrder: string[] = config.signaturesOrder || defaultOrder;
        const fullOrder = Array.from(new Set([...configuredOrder, ...defaultOrder]));

        displaySignatories = fullOrder
            .filter(id => activeDynamicIds.has(id))
            .map(id => dynamicMap[id])
            .filter(Boolean);

        if (displaySignatories.length === 0) {
            displaySignatories = [
                dynamicMap.director,
                dynamicMap.coordinador_carrera
            ];
        }
    }

    const activeSig = activeId ? displaySignatories.find((s) => s.id === activeId) : null;

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id || !blockId || !onUpdateConfig) return;

        const oldIndex = displaySignatories.findIndex((s) => s.id === active.id);
        const newIndex = displaySignatories.findIndex((s) => s.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(displaySignatories, oldIndex, newIndex);
            if (mode === 'custom_manual') {
                onUpdateConfig(blockId, 'signatories', reordered.map(s => ({
                    label: s.label,
                    name: s.name,
                    role: s.role,
                    _id: s.id
                })));
            } else {
                const newOrder = reordered.map(s => s.id);
                onUpdateConfig(blockId, 'signaturesOrder', newOrder);
            }
        }
    };

    return (
        <div
            className="mt-8 select-none"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={displaySignatories.map((s) => s.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-center">
                        {displaySignatories.map((sig) => (
                            <SortableSignatureCard
                                key={sig.id}
                                sig={sig}
                                isInteractive={Boolean(onUpdateConfig && displaySignatories.length > 1)}
                            />
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                    {activeSig ? (
                        <div className="w-[180px]">
                            <SignatureCardView sig={activeSig} isDragging={true} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

