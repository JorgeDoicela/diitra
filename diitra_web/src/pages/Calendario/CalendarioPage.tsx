import React from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './CalendarioPage.css';

import { CalendarioSidebar } from './components/CalendarioSidebar';
import { CalendarioHeader } from './components/CalendarioHeader';
import { CalendarView } from './components/CalendarView';
import { KanbanView } from './components/KanbanView';
import { InboxView } from './components/InboxView';
import { EventoFormDrawer } from './components/EventoFormDrawer';
import { EventoDetailDrawer } from './components/EventoDetailDrawer';
import { PlanificacionPopover } from './components/PlanificacionPopover';

import { useICalSync } from './hooks/useICalSync';
import { useCalendarioEvents } from './hooks/useCalendarioEvents';
import { useStickyNotes } from './hooks/useStickyNotes';
import { useKanbanOrchestration } from './hooks/useKanbanOrchestration';

export const CalendarioPage: React.FC = () => {
    // 1. Hook de Sincronización iCal
    const {
        icalUrl,
        generatingToken,
        copied,
        handleGenerarToken,
        handleCopyIcal,
    } = useICalSync();

    // 2. Hook de Notas Adhesivas (Inbox)
    const {
        stickyNotes,
        setStickyNotes,
        fetchStickyNotes,
        searchQuery,
        setSearchQuery,
        selectedFilterContext,
        setSelectedFilterContext,
        selectedFilterColor,
        setSelectedFilterColor,
        draggedNoteIndex,
        draggedNote,
        draggedSize,
        dragPreviewRef,
        handleInboxPointerDown,
        handleInboxPointerMove,
        handleInboxPointerUp,
        handleGlobalDragEnd: handleGlobalDragEndFromNotes,
        handleDeleteStickyNote,
        handleQuickPriorityChange,
        handleQuickColorChange,
    } = useStickyNotes();

    // 3. Hook de Eventos de Calendario
    const {
        loading,
        eventos,
        setEventos,
        currentDate,
        view,
        setView,
        categoriasVisibles,
        toggleCategoria,
        filteredEventos,
        proximosEventos,
        selectedEvent,
        setSelectedEvent,
        isFormOpen,
        setIsFormOpen,
        isEditing,
        formTitulo,
        setFormTitulo,
        formDescripcion,
        setFormDescripcion,
        formTipo,
        setFormTipo,
        formColorHex,
        setFormColorHex,
        formFechaInicio,
        setFormFechaInicio,
        formFechaFin,
        setFormFechaFin,
        formPrioridad,
        setFormPrioridad,
        formEstado,
        setFormEstado,
        formAlertaDias,
        setFormAlertaDias,
        formRecurrenciaAnual,
        setFormRecurrenciaAnual,
        formEsPrivado,
        setFormEsPrivado,
        handleNewEventClick,
        handleSelectSlot,
        handleEditEventClick,
        handleSaveEvent,
        handleDeleteEvent,
        handleQuickComplete,
        handleEventDrop,
        handleEventResize,
        fetchEventos,
        handleNavigate,
        handleSelectEvent,
        handleGoToEventAction,
        eventStyleGetter,
        isDraggable,
        handleNavigateClick,
        getLabelFecha,
    } = useCalendarioEvents(fetchStickyNotes);

    // 4. Hook de Orquestación Kanban y Asignación
    const {
        viewMode,
        setViewMode,
        draggingUuid,
        dragOverColumn,
        setDragOverColumn,
        planificando,
        setPlanificando,
        handleNoteDragStart,
        handleDragStart,
        handleGlobalDragEnd,
        handleDragOver,
        handleDrop,
        handleConfirmPlanificacion,
        handleDevolverAInbox,
    } = useKanbanOrchestration({
        eventos,
        setEventos,
        stickyNotes,
        setStickyNotes,
        fetchStickyNotes,
        fetchEventos,
        currentDate,
        handleGlobalDragEndFromNotes,
    });

    return (
        <div className="calendario-page-container">
            <CalendarioSidebar
                categoriasVisibles={categoriasVisibles}
                toggleCategoria={toggleCategoria}
                stickyNotes={stickyNotes}
                draggingUuid={draggingUuid}
                handleNoteDragStart={handleNoteDragStart}
                handleGlobalDragEnd={handleGlobalDragEnd}
                handleEditEventClick={handleEditEventClick}
                handleDeleteStickyNote={(uuid) => handleDeleteStickyNote(uuid)}
                proximosEventos={proximosEventos}
                setSelectedEvent={setSelectedEvent}
                icalUrl={icalUrl}
                copied={copied}
                generatingToken={generatingToken}
                handleCopyIcal={handleCopyIcal}
                handleGenerarToken={handleGenerarToken}
            />

            <div className={`calendario-main ${loading ? 'calendario-loading' : ''}`}>
                <CalendarioHeader
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    view={view}
                    setView={setView}
                    handleNavigateClick={handleNavigateClick}
                    getLabelFecha={getLabelFecha}
                    handleNewEventClick={handleNewEventClick}
                />

                {viewMode === 'calendar' ? (
                    <CalendarView
                        view={view}
                        setView={setView}
                        currentDate={currentDate}
                        filteredEventos={filteredEventos}
                        handleSelectEvent={handleSelectEvent}
                        handleSelectSlot={handleSelectSlot}
                        handleNavigate={handleNavigate}
                        eventStyleGetter={eventStyleGetter}
                        handleEventDrop={handleEventDrop}
                        handleEventResize={handleEventResize}
                        isDraggable={isDraggable}
                    />
                ) : viewMode === 'kanban' ? (
                    <KanbanView
                        filteredEventos={filteredEventos}
                        dragOverColumn={dragOverColumn}
                        draggingUuid={draggingUuid}
                        handleDragOver={handleDragOver}
                        setDragOverColumn={setDragOverColumn}
                        handleDrop={handleDrop}
                        handleDragStart={handleDragStart}
                        handleGlobalDragEnd={handleGlobalDragEnd}
                        setSelectedEvent={setSelectedEvent}
                        handleQuickComplete={handleQuickComplete}
                        handleDevolverAInbox={handleDevolverAInbox}
                        handleEditEventClick={handleEditEventClick}
                        handleDeleteEvent={handleDeleteEvent}
                        handleGoToEventAction={handleGoToEventAction}
                    />
                ) : (
                    <InboxView
                        stickyNotes={stickyNotes}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedFilterContext={selectedFilterContext}
                        setSelectedFilterContext={setSelectedFilterContext}
                        selectedFilterColor={selectedFilterColor}
                        setSelectedFilterColor={setSelectedFilterColor}
                        draggedNoteIndex={draggedNoteIndex}
                        draggedNote={draggedNote}
                        draggedSize={draggedSize}
                        dragPreviewRef={dragPreviewRef}
                        handleInboxPointerDown={handleInboxPointerDown}
                        handleInboxPointerMove={handleInboxPointerMove}
                        handleInboxPointerUp={handleInboxPointerUp}
                        setPlanificando={setPlanificando}
                        handleEditEventClick={handleEditEventClick}
                        handleDeleteStickyNote={(uuid) => handleDeleteStickyNote(uuid)}
                        handleQuickPriorityChange={handleQuickPriorityChange}
                        handleQuickColorChange={handleQuickColorChange}
                    />
                )}
            </div>

            {/* Event Detail Drawer */}
            <EventoDetailDrawer
                selectedEvent={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                handleQuickComplete={handleQuickComplete}
                handleEditEventClick={handleEditEventClick}
                handleDeleteEvent={handleDeleteEvent}
                handleGoToEventAction={handleGoToEventAction}
            />

            {/* Event Form Drawer */}
            <EventoFormDrawer
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                isEditing={isEditing}
                handleSaveEvent={handleSaveEvent}
                formTitulo={formTitulo}
                setFormTitulo={setFormTitulo}
                formDescripcion={formDescripcion}
                setFormDescripcion={setFormDescripcion}
                formTipo={formTipo}
                setFormTipo={setFormTipo}
                formColorHex={formColorHex}
                setFormColorHex={setFormColorHex}
                formFechaInicio={formFechaInicio}
                setFormFechaInicio={setFormFechaInicio}
                formFechaFin={formFechaFin}
                setFormFechaFin={setFormFechaFin}
                formPrioridad={formPrioridad}
                setFormPrioridad={setFormPrioridad}
                formEstado={formEstado}
                setFormEstado={setFormEstado}
                formAlertaDias={formAlertaDias}
                setFormAlertaDias={setFormAlertaDias}
                formRecurrenciaAnual={formRecurrenciaAnual}
                setFormRecurrenciaAnual={setFormRecurrenciaAnual}
                formEsPrivado={formEsPrivado}
                setFormEsPrivado={setFormEsPrivado}
            />

            {/* Popover de Planificación */}
            <PlanificacionPopover
                planificando={planificando}
                onClose={() => setPlanificando(null)}
                handleConfirmPlanificacion={handleConfirmPlanificacion}
            />
        </div>
    );
};
