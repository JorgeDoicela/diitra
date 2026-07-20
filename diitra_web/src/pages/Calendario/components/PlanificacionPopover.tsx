import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { PlanificandoState } from '../types/calendarioTypes';

interface PlanificacionPopoverProps {
    planificando: PlanificandoState | null;
    onClose: () => void;
    handleConfirmPlanificacion: (fechaElegida: string) => void;
}

export const PlanificacionPopover: React.FC<PlanificacionPopoverProps> = ({
    planificando,
    onClose,
    handleConfirmPlanificacion,
}) => {
    if (!planificando) return null;

    return createPortal(
        <>
            <div
                className="kanban-popover-backdrop"
                onClick={onClose}
            />
            <div
                className="kanban-popover-planificacion animate-slide-up"
                style={{
                    left: Math.min(planificando.anchorPos.x, window.innerWidth - 260),
                    top: planificando.anchorPos.y,
                }}
            >
                <div className="kanban-popover-header">
                    <Clock size={13} />
                    <span>¿Cuándo planificarla?</span>
                    <button type="button" onClick={onClose} className="kanban-popover-close">
                        <X size={14} />
                    </button>
                </div>
                <p className="kanban-popover-note-title">{planificando.note.titulo}</p>
                <div className="kanban-popover-opciones">
                    {[
                        { label: 'Hoy', fecha: format(new Date(), 'yyyy-MM-dd') },
                        { label: 'Mañana', fecha: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
                        { label: 'En 3 días', fecha: format(addDays(new Date(), 3), 'yyyy-MM-dd') },
                        { label: 'Esta semana', fecha: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
                    ].map(op => (
                        <button
                            key={op.label}
                            type="button"
                            className="kanban-popover-opcion"
                            onClick={() => handleConfirmPlanificacion(op.fecha)}
                        >
                            {op.label}
                        </button>
                    ))}
                </div>
                <div className="kanban-popover-custom">
                    <label className="kanban-popover-label">O elige una fecha:</label>
                    <input
                        type="date"
                        className="kanban-popover-date-input"
                        min={format(new Date(), 'yyyy-MM-dd')}
                        onChange={(e) => e.target.value && handleConfirmPlanificacion(e.target.value)}
                    />
                </div>
            </div>
        </>,
        document.body
    );
};
