import React from 'react';
import type { View } from 'react-big-calendar';
import { Calendar as CalendarIcon, Layers, FileText, Plus } from 'lucide-react';
import type { CalendarViewMode } from '../types/calendarioTypes';

interface CalendarioHeaderProps {
    viewMode: CalendarViewMode;
    setViewMode: (mode: CalendarViewMode) => void;
    view: View;
    setView: (view: View) => void;
    handleNavigateClick: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
    getLabelFecha: () => string;
    handleNewEventClick: () => void;
}

export const CalendarioHeader: React.FC<CalendarioHeaderProps> = ({
    viewMode,
    setViewMode,
    view,
    setView,
    handleNavigateClick,
    getLabelFecha,
    handleNewEventClick,
}) => {
    return (
        <div className="calendario-header-actions">
            <div className="flex items-center gap-6">
                <div className="view-selector-pill">
                    <button
                        type="button"
                        className={`view-selector-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                        onClick={() => setViewMode('calendar')}
                    >
                        <CalendarIcon size={12} />
                        Calendario
                    </button>
                    <button
                        type="button"
                        className={`view-selector-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                        onClick={() => setViewMode('kanban')}
                    >
                        <Layers size={12} />
                        Tablero Kanban
                    </button>
                    <button
                        type="button"
                        className={`view-selector-btn ${viewMode === 'inbox' ? 'active' : ''}`}
                        onClick={() => setViewMode('inbox')}
                    >
                        <FileText size={12} />
                        Bandeja de Notas
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {viewMode === 'calendar' && (
                    <>
                        {/* Navegador Temporal */}
                        <div className="view-selector-pill">
                            <button
                                onClick={() => handleNavigateClick('PREV')}
                                className="view-selector-btn font-semibold"
                                title="Anterior"
                            >
                                &lt;
                            </button>
                            <span className="text-xs font-semibold px-2 min-w-[120px] text-center text-fg font-sans select-none flex items-center justify-center">
                                {getLabelFecha()}
                            </span>
                            <button
                                onClick={() => handleNavigateClick('NEXT')}
                                className="view-selector-btn font-semibold"
                                title="Siguiente"
                            >
                                &gt;
                            </button>
                            <button
                                onClick={() => handleNavigateClick('TODAY')}
                                className="view-selector-btn text-[10px] font-bold uppercase"
                            >
                                Hoy
                            </button>
                        </div>

                        {/* Selector Sub-vistas (Agenda al inicio, luego Mes, Semana, Día) */}
                        <div className="view-selector-pill">
                            {(['agenda', 'month', 'week', 'day'] as const).map(v => (
                                <button
                                    key={v}
                                    type="button"
                                    className={`view-selector-btn ${view === v ? 'active' : ''}`}
                                    onClick={() => setView(v)}
                                >
                                    {v === 'agenda' ? 'Agenda' : v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Botón Global de Añadir Tarea / Nota */}
                <button
                    type="button"
                    className="global-add-task-btn"
                    onClick={viewMode === 'inbox' ? () => {
                        const floatingTrigger = document.querySelector('.sticky-floating-trigger-btn') as HTMLElement;
                        if (floatingTrigger) floatingTrigger.click();
                    } : handleNewEventClick}
                >
                    <Plus size={14} />
                    <span>{viewMode === 'inbox' ? 'Añadir Nota' : 'Añadir Tarea'}</span>
                </button>
            </div>
        </div>
    );
};
