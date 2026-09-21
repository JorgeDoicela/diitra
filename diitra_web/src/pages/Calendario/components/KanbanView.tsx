import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { PRIORIDAD_COLORS } from '../../../services/calendarioService';
import { KANBAN_COLUMNAS, type CalendarEventExtended, type Evento } from '../types/calendarioTypes';
import './KanbanView.css';

interface KanbanViewProps {
    filteredEventos: CalendarEventExtended[];
    dragOverColumn: string | null;
    draggingUuid: string | null;
    handleDragOver: (e: React.DragEvent, columnId: string) => void;
    setDragOverColumn: (col: string | null) => void;
    handleDrop: (e: React.DragEvent, columnId: string) => void;
    handleDragStart: (e: React.DragEvent, uuid: string) => void;
    handleGlobalDragEnd: () => void;
    setSelectedEvent: (ev: Evento) => void;
    handleQuickComplete: (ev: Evento) => void;
    handleDevolverAInbox: (uuid: string) => void;
    handleEditEventClick: (ev: Evento) => void;
    handleDeleteEvent: (uuid: string) => void;
    handleGoToEventAction: (ev: Evento) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
    filteredEventos,
    dragOverColumn,
    draggingUuid,
    handleDragOver,
    setDragOverColumn,
    handleDrop,
    handleDragStart,
    handleGlobalDragEnd,
    setSelectedEvent,
    handleQuickComplete,
    handleDevolverAInbox,
    handleEditEventClick,
    handleDeleteEvent,
    handleGoToEventAction,
}) => {
    const [filterScope, setFilterScope] = React.useState<'personal' | 'all'>('personal');

    const totalCardsCount = filteredEventos.filter(ev => filterScope === 'all' || ev.resource.categoria_global === 'Personal').length;

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
            {/* Barra de control superior de Kanban */}
            <div className="flex items-center justify-between px-1 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-dim font-sans">Mostrar en tablero:</span>
                    <div className="flex p-0.5 bg-surface border border-border-thin rounded-lg shadow-xs">
                        <button
                            type="button"
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${filterScope === 'personal' ? 'bg-bg-deep text-text-main shadow-xs font-bold' : 'text-text-dim hover:text-text-main'}`}
                            onClick={() => setFilterScope('personal')}
                        >
                            Solo mis tareas
                        </button>
                        <button
                            type="button"
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${filterScope === 'all' ? 'bg-bg-deep text-text-main shadow-xs font-bold' : 'text-text-dim hover:text-text-main'}`}
                            onClick={() => setFilterScope('all')}
                        >
                            Todos los hitos y plazos
                        </button>
                    </div>
                </div>
                <span className="text-[11px] font-mono text-text-dim">
                    {totalCardsCount} {totalCardsCount === 1 ? 'tarjeta visible' : 'tarjetas visibles'}
                </span>
            </div>

            <div className="kanban-board-container flex-1 min-h-0">
                {KANBAN_COLUMNAS.map(col => {
                    const colEvents = filteredEventos.filter(ev => {
                        if (filterScope === 'personal' && ev.resource.categoria_global !== 'Personal') return false;

                        const estado = ev.resource.estado;
                        if (col.id === 'EnProgreso') {
                            return estado === 'EnProgreso' || estado === 'En Ejecución' || estado === 'En Corrección' || estado === 'En Correccion';
                        }
                        if (col.id === 'Pendiente') {
                            return estado === 'Pendiente' || !estado || estado === 'Abierta';
                        }
                        return estado === col.id || (col.id === 'Completado' && (estado === 'Cerrada' || estado === 'Aprobado'));
                    });

                return (
                    <div
                        key={col.id}
                        className={`kanban-column ${dragOverColumn === col.id ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={() => setDragOverColumn(null)}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        <div className="kanban-column-header">
                            <div className="kanban-column-title-wrapper">
                                <span className="kanban-column-title">{col.label}</span>
                                <span className="kanban-column-count">{colEvents.length}</span>
                            </div>
                        </div>
                        <div className="kanban-cards-container">
                            {colEvents.length === 0 ? (
                                <div className="kanban-empty-state">
                                    Arrastra tareas aquí o usa Añadir Tarea
                                </div>
                            ) : (
                                colEvents.map(ev => {
                                    const r = ev.resource;
                                    const isCompleted = r.estado === 'Completado';
                                    const isPersonal = r.categoria_global === 'Personal';
                                    const hasDate = Boolean(r.fecha_inicio && ev.start && (ev.start as Date).getTime() > 0);
                                    const formattedDate = hasDate
                                        ? (r.fecha_fin && r.fecha_fin !== r.fecha_inicio
                                            ? `${format(ev.start as Date, 'd MMM', { locale: es })} - ${format(ev.end as Date, 'd MMM', { locale: es })}`
                                            : format(ev.start as Date, 'd MMM', { locale: es }))
                                        : 'Sin fecha';

                                    return (
                                        <div
                                            key={r.uuid}
                                            draggable={isPersonal}
                                            onDragStart={(e) => handleDragStart(e, r.uuid)}
                                            onDragEnd={handleGlobalDragEnd}
                                            className={`kanban-card ${draggingUuid === r.uuid ? 'dragging' : ''}`}
                                            style={{ '--card-color': r.color_hex || '#6B7280' } as React.CSSProperties}
                                            onClick={() => setSelectedEvent(r)}
                                        >
                                            <div className="flex flex-col gap-1.5">
                                                <div className="kanban-card-tags">
                                                    <span
                                                        className="kanban-badge categoria"
                                                        style={{ '--badge-bg': r.color_hex || '#6B7280' } as React.CSSProperties}
                                                    >
                                                        {r.categoria_global === 'Personal' ? 'Mi Tarea' : r.categoria_global}
                                                    </span>
                                                    {r.prioridad && (
                                                        <span
                                                            className="kanban-badge prioridad"
                                                            style={{
                                                                '--prio-bg': PRIORIDAD_COLORS[r.prioridad]?.bg || 'var(--border)',
                                                                '--prio-text': PRIORIDAD_COLORS[r.prioridad]?.text || 'var(--text-dim)',
                                                            } as React.CSSProperties}
                                                        >
                                                            {r.prioridad}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className={`kanban-card-title ${isCompleted ? 'completado' : ''}`}>
                                                    {r.titulo}
                                                </h4>
                                                {r.descripcion && (
                                                    <p className="kanban-card-desc">{r.descripcion}</p>
                                                )}
                                            </div>
                                            <div className="kanban-card-footer">
                                                <span className={`kanban-card-date ${!hasDate ? 'kanban-card-sin-fecha' : ''}`}>
                                                    <CalendarIcon size={10} />
                                                    {formattedDate}
                                                </span>
                                                <div className="kanban-card-actions" onClick={(e) => e.stopPropagation()}>
                                                    {isPersonal && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="kanban-action-btn delete"
                                                                onClick={() => handleDeleteEvent(r.uuid)}
                                                                title="Eliminar tarea"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="kanban-action-btn"
                                                                onClick={() => handleEditEventClick(r)}
                                                                title="Editar tarea"
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {isPersonal && !isCompleted && (
                                                        <button
                                                            type="button"
                                                            className="kanban-action-btn complete"
                                                            onClick={() => handleQuickComplete(r)}
                                                            title="Marcar como completada"
                                                        >
                                                            <CheckCircle size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
            </div>
        </div>
    );
};
