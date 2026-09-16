import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { GeistDatePicker } from '../../../components/Common/GeistDatePicker';
import type { PlanificandoState } from '../types/calendarioTypes';
import './KanbanView.css';

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
    useEffect(() => {
        if (!planificando) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [planificando, onClose]);

    if (!planificando) return null;

    const popoverWidth = 280;
    const popoverHeight = 320;
    const left = Math.max(16, Math.min(planificando.anchorPos.x - popoverWidth / 2, window.innerWidth - popoverWidth - 16));
    const top = Math.max(16, Math.min(planificando.anchorPos.y, window.innerHeight - popoverHeight - 16));

    return createPortal(
        <>
            <div
                className="kanban-popover-backdrop"
                onClick={onClose}
            />
            <div
                className="kanban-popover-planificacion kanban-popover-card animate-fade-in-up"
                style={{
                    left: `${left}px`,
                    top: `${top}px`,
                }}
            >
                <div className="kanban-popover-header">
                    <Clock size={14} />
                    <span>¿Cuándo planificarla?</span>
                    <button type="button" onClick={onClose} className="kanban-popover-close" aria-label="Cerrar">
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
