import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { GeistDatePicker } from '../../../components/Common/GeistDatePicker';
import type { PlanificandoState } from '../types/calendarioTypes';

const toISODate = (val?: string) => {
    if (!val) return '';
    const clean = val.trim();
    if (clean.includes('/')) {
        const [d, m, y] = clean.split('/');
        if (d && m && y) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return clean;
};

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
                className="kanban-popover-card animate-fade-in"
                style={{
                    left: Math.min(planificando.anchorPos.x, window.innerWidth - 260),
                    top: planificando.anchorPos.y,
                }}
            >
                <div className="kanban-popover-header">
                    <Clock size={14} />
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
                <div className="kanban-popover-custom space-y-1.5">
                    <label className="kanban-popover-label">O elige una fecha:</label>
                    <GeistDatePicker
                        placeholder="Seleccionar fecha..."
                        minDate={format(new Date(), 'yyyy-MM-dd')}
                        onChange={(newVal) => {
                            const iso = toISODate(newVal);
                            if (iso) handleConfirmPlanificacion(iso);
                        }}
                    />
                </div>
            </div>
        </>,
        document.body
    );
};
