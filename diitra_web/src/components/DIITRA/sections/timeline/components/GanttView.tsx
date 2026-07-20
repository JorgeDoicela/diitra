import React from 'react';
import { Layers, Info, AlertCircle, CalendarDays, Trash2, GripVertical } from 'lucide-react';

interface GanttViewProps {
    cronograma: any[];
    months: { name: string; year: number; weeksCount: number; weekOffset: number }[];
    totalWeeks: number;
    expandedCard: number | null;
    setExpandedCard: (idx: number | null) => void;
    setActiveTab: (tab: 'gantt' | 'cards' | 'calendar') => void;
    readOnly: boolean;
    dragOverTimelineWeek: number | null;
    onRemove: (index: number) => void;
    getWeekRange: (semanas: boolean[]) => { start: number; end: number };
    getInitials: (nameStr: string) => string;
    handleTimelineDragOver: (e: React.DragEvent) => void;
    handleTimelineDragLeave: () => void;
    handleTimelineDrop: (e: React.DragEvent) => void;
    handleCellMouseDown: (activityIndex: number, weekIndex: number) => void;
    handleCellMouseEnter: (activityIndex: number, weekIndex: number) => void;
    handleCellTouchStart: (activityIndex: number, weekIndex: number, e: React.TouchEvent) => void;
    handleCellTouchEnd: (activityIndex: number, weekIndex: number, e: React.TouchEvent) => void;
    handleInactiveRowTouchEnd: (activityIndex: number, e: React.TouchEvent) => void;
    handleGanttBarStart: (e: React.MouseEvent | React.TouchEvent, idx: number, type: 'move' | 'resize-left' | 'resize-right') => void;
}

export const GanttView: React.FC<GanttViewProps> = ({
    cronograma,
    months,
    totalWeeks,
    expandedCard,
    setExpandedCard,
    setActiveTab,
    readOnly,
    dragOverTimelineWeek,
    onRemove,
    getWeekRange,
    getInitials,
    handleTimelineDragOver,
    handleTimelineDragLeave,
    handleTimelineDrop,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellTouchStart,
    handleCellTouchEnd,
    handleInactiveRowTouchEnd,
    handleGanttBarStart
}) => {
    return (
        <div 
            className="bg-bg-deep border border-border-thin rounded-2xl p-5 shadow-sm space-y-4 select-none relative"
            onDragOver={handleTimelineDragOver}
            onDragLeave={handleTimelineDragLeave}
            onDrop={handleTimelineDrop}
        >
            {/* Visual Drop Overlay Indicator */}
            {dragOverTimelineWeek !== null && (
                <div className="absolute inset-0 bg-text-main/5 border-2 border-dashed border-text-main/40 rounded-2xl flex items-center justify-center z-20 pointer-events-none transition-all">
                    <div className="bg-bg-deep px-4 py-2 rounded-xl shadow-lg border border-text-main/30 text-[9px] font-bold uppercase tracking-widest text-text-main flex items-center gap-2">
                        <CalendarDays size={12} className="animate-bounce" />
                        <span>Soltar para crear en Semana {dragOverTimelineWeek + 1}</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border-thin/60 pb-3">
                <div className="flex items-center gap-2">
                    <Layers size={16} className="text-text-main" />
                    <h5 className="text-xs font-black uppercase tracking-widest text-text-main">Diagrama de Gantt Académico</h5>
                </div>
                <div className="text-[10.5px] font-bold text-text-dim flex items-center gap-1.5 px-3 py-1.5 rounded bg-bg-deep/80 border border-border-thin">
                    <Info size={12} className="text-text-main" />
                    <span>Arrastra el centro de las barras para mover, o los bordes para redimensionar.</span>
                </div>
            </div>

            {cronograma.length === 0 ? (
                <div className="py-12 text-center text-text-dim text-xs font-semibold border-2 border-dashed border-border-thin rounded-xl flex flex-col items-center justify-center gap-2">
                    <AlertCircle size={24} className="text-text-dim/60" />
                    <span>No hay actividades planificadas. Arrastra una sugerida del panel izquierdo.</span>
                </div>
            ) : (
                <div id="gantt-grid-container" className="overflow-x-auto w-full">
                    <div 
                        className="space-y-1"
                        style={{ minWidth: `${Math.max(900, 280 + totalWeeks * 32)}px` }}
                    >
                        {/* Cabecera del calendario */}
                        <div className="grid grid-cols-[280px_1fr] border-b border-border-thin pb-2 items-stretch" id="gantt-grid-header">
                            <div className="text-xs font-black text-text-dim uppercase tracking-wider pl-2 flex items-center border-r border-border-thin/50 pr-4 sticky left-0 bg-bg-deep z-20">Descripción de la Tarea</div>
                            <div className="flex flex-col gap-1.5 w-full relative z-0">
                                {/* Fila de Meses */}
                                <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }}>
                                    {months.map((m, mIdx) => (
                                        <div 
                                            key={mIdx} 
                                            className="border-l border-border-thin/60 text-center text-[10.5px] font-black uppercase tracking-wider text-text-main"
                                            style={{ gridColumn: `span ${m.weeksCount} / span ${m.weeksCount}` }}
                                        >
                                            <div className="truncate px-0.5">{m.name}</div>
                                            <div className="opacity-50 text-[8.5px] font-bold">{m.year}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Fila de Semanas */}
                                <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }}>
                                    {Array.from({ length: totalWeeks }).map((_, w) => (
                                        <div key={w} className="border-l border-border-thin/20 text-center text-[9px] font-black text-text-dim/80">
                                            S{w + 1}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Filas del Gantt */}
                        <div className="space-y-1">
                            {cronograma.map((_c, idx) => {
                                const activityColor = _c.colorHex || '#0070f3';
                                const number = _c.Numero || (idx + 1);
                                const name = _c.Actividad || 'Actividad por definir';
                                const semanas = _c.Semanas || Array(totalWeeks).fill(false);
                                const { start: startW, end: endW } = getWeekRange(semanas);
                                const isExpanded = expandedCard === idx;

                                return (
                                    <div 
                                        key={idx} 
                                        className={`grid grid-cols-[280px_1fr] items-stretch hover:bg-bg-deep/40 transition-all border-b border-border-thin/30 ${
                                            isExpanded ? 'bg-text-main/[0.03] font-semibold' : 'opacity-70 hover:opacity-90'
                                        }`}
                                        style={{
                                            borderLeft: '3px solid',
                                            borderLeftColor: isExpanded ? activityColor : 'transparent'
                                        }}
                                    >
                                        {/* Nombre de la actividad */}
                                        <div 
                                            className="text-xs font-semibold text-text-main pr-3 pl-2 flex items-center justify-between border-r border-border-thin/50 py-3 mr-2 group/row sticky left-0 bg-bg-deep z-10"
                                            title="Clic para editar detalles"
                                        >
                                            <div 
                                                className="flex items-start gap-2 pl-1 whitespace-normal cursor-pointer min-w-0"
                                                onClick={() => {
                                                    setActiveTab('cards');
                                                    setExpandedCard(idx);
                                                }}
                                            >
                                                <div 
                                                    className="w-1.5 h-3.5 rounded-full shrink-0 mt-0.5" 
                                                    style={{ backgroundColor: activityColor }} 
                                                />
                                                <span className="font-mono text-[11px] font-black select-none text-text-dim shrink-0">
                                                    {String(number).padStart(2, '0')}.
                                                </span>
                                                <span className="whitespace-normal break-words leading-tight line-clamp-2 pr-1.5 text-xs text-text-main font-semibold" title={name}>{name}</span>
                                            </div>
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemove(idx);
                                                    }}
                                                    className="p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-colors shrink-0 ml-1.5 cursor-pointer"
                                                    title="Eliminar Actividad"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Timeline track de la fila */}
                                        <div 
                                            id={idx === 0 ? "gantt-timeline-track" : undefined}
                                            className="relative h-full min-h-[48px] flex items-center bg-transparent w-full z-0"
                                        >
                                            {/* Grid celdas fondo */}
                                            <div className="absolute inset-0 grid h-full" style={{ gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }}>
                                                {Array.from({ length: totalWeeks }).map((_, w) => {
                                                    const isMonthBoundary = months.some(m => m.weekOffset === w);
                                                    return (
                                                        <div 
                                                            key={w} 
                                                            data-week-index={w}
                                                            data-activity-index={idx}
                                                            className={`h-full border-r border-border-thin/10 transition-colors ${
                                                                isMonthBoundary ? 'border-l border-l-border-thin/30' : ''
                                                            } ${
                                                                idx === expandedCard ? 'cursor-pointer hover:bg-text-main/5' : 'cursor-default'
                                                            }`}
                                                            onMouseDown={() => {
                                                                if (idx === expandedCard) {
                                                                    handleCellMouseDown(idx, w);
                                                                } else {
                                                                    setExpandedCard(idx);
                                                                }
                                                            }}
                                                            onMouseEnter={() => {
                                                                if (idx === expandedCard) {
                                                                    handleCellMouseEnter(idx, w);
                                                                }
                                                            }}
                                                            onTouchStart={(e) => {
                                                                handleCellTouchStart(idx, w, e);
                                                            }}
                                                            onTouchEnd={(e) => {
                                                                if (idx === expandedCard) {
                                                                    handleCellTouchEnd(idx, w, e);
                                                                } else {
                                                                    handleInactiveRowTouchEnd(idx, e);
                                                                }
                                                            }}
                                                        />
                                                    );
                                                })}
                                                {/* Barra de Rango de la Actividad (Draggable & Resizable) */}
                                                {startW !== -1 && (
                                                    <div 
                                                        className={`absolute h-[26px] rounded-md flex items-center justify-between px-1 shadow-sm select-none transition-all bg-surface border ${
                                                            idx === expandedCard 
                                                                ? 'border-border-thin shadow overflow-visible z-30' 
                                                                : 'cursor-pointer hover:opacity-90 overflow-hidden z-10'
                                                        }`}
                                                        onMouseDown={(e) => {
                                                            if (idx === expandedCard && e.button === 0) {
                                                                handleGanttBarStart(e, idx, 'move');
                                                            }
                                                        }}
                                                        style={{
                                                            left: `${(startW / totalWeeks) * 100}%`,
                                                            width: `${((endW - startW + 1) / totalWeeks) * 100}%`,
                                                            backgroundColor: `${activityColor}15`,
                                                            borderColor: activityColor,
                                                            touchAction: 'none'
                                                        }}
                                                        onClick={(e) => {
                                                            if (idx !== expandedCard) {
                                                                e.stopPropagation();
                                                                setExpandedCard(idx);
                                                            }
                                                        }}
                                                    >
                                                        <div 
                                                            className="absolute left-0 top-0 bottom-0 w-[4px] z-10" 
                                                            style={{ backgroundColor: activityColor }} 
                                                        />
                                                        {/* Resize Handle Izquierdo */}
                                                        {idx === expandedCard && !readOnly && (
                                                            <div 
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    handleGanttBarStart(e, idx, 'resize-left');
                                                                }}
                                                                onTouchStart={(e) => {
                                                                    e.stopPropagation();
                                                                    handleGanttBarStart(e, idx, 'resize-left');
                                                                }}
                                                                style={{ touchAction: 'none' }}
                                                                className="absolute left-0 top-0 bottom-0 w-4 -ml-2 cursor-ew-resize z-30 flex items-center justify-center group/handle"
                                                                title="Arrastrar para extender inicio"
                                                            >
                                                                <div className="w-1 h-3.5 bg-text-main/30 group-hover/handle:bg-text-main/60 rounded-full transition-colors" />
                                                            </div>
                                                        )}

                                                        {/* Grip de arrastre para mover toda la barra */}
                                                        {idx === expandedCard && !readOnly && (
                                                            <div 
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    handleGanttBarStart(e, idx, 'move');
                                                                }}
                                                                onTouchStart={(e) => {
                                                                    e.stopPropagation();
                                                                    handleGanttBarStart(e, idx, 'move');
                                                                }}
                                                                style={{ touchAction: 'none' }}
                                                                className="p-1 cursor-move text-text-main/40 hover:text-text-main/70 hover:bg-bg-deep/50 rounded shrink-0 z-20 flex items-center justify-center mr-1 ml-0.5"
                                                                title="Arrastrar para mover toda la barra"
                                                            >
                                                                <GripVertical size={11} />
                                                            </div>
                                                        )}
                                                        
                                                        <div className="text-[10px] font-bold text-text-main pr-1 pl-1 pointer-events-none select-none flex items-center gap-1 z-10 w-full overflow-hidden">
                                                            {_c.Responsable ? (
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <span 
                                                                        className="px-1.5 py-0.5 rounded-[3px] text-[8.5px] font-black uppercase tracking-wider bg-bg-deep/30 border border-border-thin text-text-main shrink-0"
                                                                        title={_c.Responsable}
                                                                    >
                                                                        {getInitials(_c.Responsable)}
                                                                    </span>
                                                                    {(endW - startW + 1) > 2 && (
                                                                        <span className="truncate text-text-main/90 font-medium" title={_c.Responsable}>
                                                                            {_c.Responsable.split(' ')[0]}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <span 
                                                                        className="px-1.5 py-0.5 rounded-[3px] text-[8.5px] font-black uppercase tracking-wider bg-orange-500/10 border border-orange-500/30 text-orange-500 shrink-0"
                                                                        title="Sin responsable asignado"
                                                                    >
                                                                        ?
                                                                    </span>
                                                                    {(endW - startW + 1) > 2 && (
                                                                        <span className="truncate text-orange-500/70 font-medium italic text-[9.5px]" title="Sin responsable asignado">
                                                                            Sin asignar
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Resize Handle Derecho */}
                                                        {idx === expandedCard && !readOnly && (
                                                            <div 
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    handleGanttBarStart(e, idx, 'resize-right');
                                                                }}
                                                                onTouchStart={(e) => {
                                                                    e.stopPropagation();
                                                                    handleGanttBarStart(e, idx, 'resize-right');
                                                                }}
                                                                style={{ touchAction: 'none' }}
                                                                className="absolute right-0 top-0 bottom-0 w-4 -mr-2 cursor-ew-resize z-30 flex items-center justify-center group/handle"
                                                                title="Arrastrar para extender fin"
                                                            >
                                                                <div className="w-1 h-3.5 bg-text-main/30 group-hover/handle:bg-text-main/60 rounded-full transition-colors" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
