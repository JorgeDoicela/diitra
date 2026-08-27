import React, { useState } from 'react';
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

export const RenderRichText: React.FC<{ config: any }> = ({ config }) => {
    const html = config.html || '<p class="text-gray-400 italic">Escribe el contenido enriquecido aquí...</p>';
    return (
        <div className="space-y-2">
            <div
                className="prose max-w-none text-xs leading-relaxed text-[#1e2a4a]/90 tiptap-editor"
                dangerouslySetInnerHTML={{ __html: html }}
            />
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

export const RenderGantt: React.FC<{ config: any }> = ({ config }) => {
    const totalMonths = config.totalMonths || 6;
    const months = config.months || ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6'].slice(0, totalMonths);
    const objectives: GanttObjective[] = config.objectives || [
        {
            name: 'Objetivo 1: Diagnóstico y Fundamentación',
            activities: [
                { id: '1', name: 'Revisión sistemática de literatura', resources: 'Laptop, Papers IEEE/Scopus', startMonth: 0, startWeek: 0, endMonth: 1, endWeek: 2, color: '#3b82f6' },
                { id: '2', name: 'Diseño de instrumentos metodológicos', resources: 'Encuestas, Guías de entrevista', startMonth: 1, startWeek: 1, endMonth: 2, endWeek: 3, color: '#6366f1' },
            ]
        },
        {
            name: 'Objetivo 2: Desarrollo y Experimentación',
            activities: [
                { id: '3', name: 'Implementación del prototipo / modelo', resources: 'Servidor, Entorno de pruebas', startMonth: 2, startWeek: 0, endMonth: 4, endWeek: 2, color: '#10b981' },
                { id: '4', name: 'Pruebas de validación y métricas', resources: 'Población objetivo, Software estadístico', startMonth: 4, startWeek: 1, endMonth: 5, endWeek: 3, color: '#f59e0b' },
            ]
        }
    ];

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
                        <th className="border border-slate-300 p-1.5 text-center font-bold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }} rowSpan={2}>Objetivos</th>
                        <th className="border border-slate-300 p-1.5 text-center font-bold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }} rowSpan={2}>N°</th>
                        <th className="border border-slate-300 p-1.5 text-center font-bold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }} rowSpan={2}>Actividades</th>
                        <th className="border border-slate-300 p-1.5 text-center font-bold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }} rowSpan={2}>Recursos</th>
                        {months.map((m: string, i: number) => (
                            <th key={i} className="border border-slate-300 p-1 text-center font-bold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }} colSpan={4}>
                                {m}
                            </th>
                        ))}
                    </tr>
                    <tr>
                        {months.map((_, mIdx) =>
                            [1, 2, 3, 4].map((w) => (
                                <th key={`${mIdx}-${w}`} className="border border-slate-300 p-0.5 text-[7px] text-center font-semibold" style={{ backgroundColor: DYN_COLORS.tableHeaderBg, color: DYN_COLORS.tableHeaderColor }}>
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
