import type { Event as BigCalendarEvent } from 'react-big-calendar';
import type { EventoCalendario } from '../../../services/calendarioService';

export type Evento = EventoCalendario;

export interface CalendarEventExtended extends BigCalendarEvent {
    resource: Evento;
}

export type CalendarViewMode = 'calendar' | 'kanban' | 'inbox';

export interface PlanificandoState {
    note: EventoCalendario;
    targetEstado: string;
    anchorPos: { x: number; y: number };
}

export interface KanbanColumn {
    id: string;
    label: string;
}

export const KANBAN_COLUMNAS: KanbanColumn[] = [
    { id: 'Pendiente', label: 'Pendiente' },
    { id: 'EnProgreso', label: 'En Progreso' },
    { id: 'Completado', label: 'Completado' },
    { id: 'Cancelado', label: 'Cancelado' },
];

export interface FormEventoState {
    titulo: string;
    descripcion: string;
    tipo: string;
    fechaInicio: string;
    fechaFin: string;
    esTodoElDia: boolean;
    colorHex: string;
    esPrivado: boolean;
    prioridad: string;
    estado: string;
    alertaDias: number | '';
    recurrenciaAnual: boolean;
}
