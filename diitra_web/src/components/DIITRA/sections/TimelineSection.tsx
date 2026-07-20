import React from 'react';
import { Compass } from 'lucide-react';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { 
    useTimelineSection, 
    colorsPalette, 
    suggestedCatalog, 
    parseProjectDate, 
    formatDateForInput, 
    getWeekRange, 
    getInitials 
} from './timeline/hooks/useTimelineSection';
import { TimelineHeader } from './timeline/components/TimelineHeader';
import { SuggestedActivitiesBank } from './timeline/components/SuggestedActivitiesBank';
import { GanttView } from './timeline/components/GanttView';
import { CalendarView } from './timeline/components/CalendarView';
import { ActivityCardItem } from './timeline/components/ActivityCardItem';

interface TimelineSectionProps {
    cronograma: any[];
    formData?: any;
    cowork: CoWorkHandle;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: string, value: any) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    readOnly?: boolean;
}

export const TimelineSection: React.FC<TimelineSectionProps> = (props) => {
    const {
        cronograma = [],
        formData = {},
        cowork,
        onAdd,
        onRemove,
        onUpdate,
        onReorder,
        readOnly = false
    } = props;

    const {
        activeTab,
        setActiveTab,
        expandedCard,
        setExpandedCard,
        draggedCardIndex,
        dragOverCardIndex,
        dragOverTimelineWeek,
        months,
        totalWeeks,
        teamMembers,
        objectives,
        projectStartDate,
        projectEndDate,
        durationText,
        handleLoadSuggestedTimeline,
        handleCellMouseDown,
        handleCellMouseEnter,
        handleCellTouchStart,
        handleCellTouchEnd,
        handleInactiveRowTouchEnd,
        handleAddSuggestedActivity,
        handleGanttBarStart,
        handleCardDragStart,
        handleCardDragOver,
        handleCardDragEnd,
        handleCardDrop,
        handleTimelineDragOver,
        handleTimelineDragLeave,
        handleTimelineDrop,
        handleCardDropZoneDrop,
        handleActivityDateChange
    } = useTimelineSection(props);

    return (
        <div className="space-y-6 text-text-main pb-10">
            {/* 1. CABECERA GENERAL DEL MÓDULO */}
            <TimelineHeader
                projectStartDate={projectStartDate}
                projectEndDate={projectEndDate}
                durationText={durationText}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                cronogramaCount={cronograma.length}
                readOnly={readOnly}
                onLoadSuggested={handleLoadSuggestedTimeline}
                onAdd={onAdd}
            />

            {/* 2. DISEÑO PRINCIPAL EN DOS COLUMNAS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 2.1 PANEL LATERAL: BANCO DE SUGERENCIAS DRAGGABLE */}
                <div className="lg:col-span-3">
                    <SuggestedActivitiesBank
                        readOnly={readOnly}
                        suggestedCatalog={suggestedCatalog}
                        onAddSuggestedActivity={handleAddSuggestedActivity}
                    />
                </div>

                {/* 2.2 TABLERO ACTIVO (VISTAS) */}
                <div className="lg:col-span-9">

                    {/* VISTA A: DIAGRAMA GANTT INTERACTIVO */}
                    {activeTab === 'gantt' && (
                        <GanttView
                            cronograma={cronograma}
                            months={months}
                            totalWeeks={totalWeeks}
                            expandedCard={expandedCard}
                            setExpandedCard={setExpandedCard}
                            setActiveTab={setActiveTab}
                            readOnly={readOnly}
                            dragOverTimelineWeek={dragOverTimelineWeek}
                            onRemove={onRemove}
                            getWeekRange={getWeekRange}
                            getInitials={getInitials}
                            handleTimelineDragOver={handleTimelineDragOver}
                            handleTimelineDragLeave={handleTimelineDragLeave}
                            handleTimelineDrop={handleTimelineDrop}
                            handleCellMouseDown={handleCellMouseDown}
                            handleCellMouseEnter={handleCellMouseEnter}
                            handleCellTouchStart={handleCellTouchStart}
                            handleCellTouchEnd={handleCellTouchEnd}
                            handleInactiveRowTouchEnd={handleInactiveRowTouchEnd}
                            handleGanttBarStart={handleGanttBarStart}
                        />
                    )}

                    {/* VISTA B: VISTA CALENDARIO MENSUAL ACADÉMICO */}
                    {activeTab === 'calendar' && (
                        <CalendarView
                            cronograma={cronograma}
                            months={months}
                            setActiveTab={setActiveTab}
                            setExpandedCard={setExpandedCard}
                        />
                    )}

                    {/* VISTA C: DETALLE Y EDICIÓN DE TARJETAS (REORDENABLE VERTICALMENTE) */}
                    {activeTab === 'cards' && (
                        <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleCardDropZoneDrop}
                            className="space-y-4"
                        >
                            {cronograma.length === 0 ? (
                                <div className="py-12 text-center text-text-dim text-xs font-semibold border-2 border-dashed border-border-thin rounded-2xl flex flex-col items-center justify-center gap-2">
                                    <Compass size={24} className="text-text-dim/60 animate-spin" />
                                    <span>No hay actividades creadas. Arrastra desde el panel lateral para planificar.</span>
                                </div>
                            ) : (
                                cronograma.map((_c, i) => (
                                    <ActivityCardItem
                                        key={_c.id || _c.uuid || i}
                                        item={_c}
                                        index={i}
                                        totalWeeks={totalWeeks}
                                        months={months}
                                        objectives={objectives}
                                        teamMembers={teamMembers}
                                        formData={formData}
                                        cowork={cowork}
                                        isExpanded={expandedCard === i}
                                        isDragging={draggedCardIndex === i}
                                        isDragOver={dragOverCardIndex === i}
                                        readOnly={readOnly}
                                        colorsPalette={colorsPalette}
                                        setExpandedCard={setExpandedCard}
                                        onRemove={onRemove}
                                        onUpdate={onUpdate}
                                        parseProjectDate={parseProjectDate}
                                        formatDateForInput={formatDateForInput}
                                        getWeekRange={getWeekRange}
                                        handleCardDragStart={handleCardDragStart}
                                        handleCardDragOver={handleCardDragOver}
                                        handleCardDragEnd={handleCardDragEnd}
                                        handleCardDrop={handleCardDrop}
                                        handleActivityDateChange={handleActivityDateChange}
                                    />
                                ))
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
