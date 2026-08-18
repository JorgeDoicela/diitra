import React from 'react';
import { createPortal } from 'react-dom';
import {
    X, RotateCcw, Calendar as CalendarIcon, Info, Bell,
    CheckCircle, Edit2, Trash2, ArrowRight
} from 'lucide-react';
import { PRIORIDAD_COLORS, ESTADO_LABELS, getContextDescription, resolveEventUrl } from '../../../services/calendarioService';
import { useAuth } from '../../../api/AuthContext';
import type { Evento } from '../types/calendarioTypes';
import './EventoDrawers.css';

interface EventoDetailDrawerProps {
    selectedEvent: Evento | null;
    onClose: () => void;
    handleQuickComplete: (ev: Evento) => void;
    handleEditEventClick: (ev: Evento) => void;
    handleDeleteEvent: (uuid: string) => void;
    handleGoToEventAction: (ev: Evento) => void;
}

export const EventoDetailDrawer: React.FC<EventoDetailDrawerProps> = ({
    selectedEvent,
    onClose,
    handleQuickComplete,
    handleEditEventClick,
    handleDeleteEvent,
    handleGoToEventAction,
}) => {
    const { isAdmin } = useAuth();
    if (!selectedEvent) return null;
    const hasAction = !!resolveEventUrl(selectedEvent, isAdmin);

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right">
                <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                    <div className="flex items-center gap-3">
                        <span
                            className="px-2.5 py-1 text-[10px] font-mono uppercase rounded-md border text-white font-bold"
                            style={{ backgroundColor: selectedEvent.color_hex || '#6B7280', borderColor: selectedEvent.color_hex || '#6B7280' }}
                        >
                            {selectedEvent.categoria_global === 'Personal' ? 'Mi Tarea' : selectedEvent.categoria_global}
                        </span>
                        {selectedEvent.subcategoria && selectedEvent.categoria_global !== 'Personal' && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-brand">
                                • {selectedEvent.subcategoria}
                            </div>
                        )}
                        {selectedEvent.es_privado && (
                            <span className="px-2 py-0.5 bg-bg-deep text-text-dim border border-border-thin text-[9px] font-bold uppercase rounded">
                                Privado
                            </span>
                        )}
                        {selectedEvent.recurrencia_anual && (
                            <span className="px-2 py-0.5 bg-brand-subtle text-brand border border-brand/20 text-[9px] font-bold uppercase rounded flex items-center gap-1">
                                <RotateCcw size={8} /> Anual
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface">
                    <div className="space-y-4">
                        <h2 className={`text-3xl font-bold tracking-tight text-text-main leading-tight font-sans ${selectedEvent.estado === 'Completado' ? 'line-through opacity-60' : ''}`}>
                            {selectedEvent.titulo}
                        </h2>
                        <p className="text-sm text-text-dim leading-relaxed font-medium">
                            {selectedEvent.descripcion || 'Sin descripción detallada.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bento-card static p-5 space-y-1.5">
                            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                <CalendarIcon size={12} /> Fecha de Inicio
                            </div>
                            <div className="text-sm font-bold text-text-main font-mono">
                                {selectedEvent.fecha_inicio}
                            </div>
                        </div>

                        {selectedEvent.fecha_fin && selectedEvent.fecha_fin !== selectedEvent.fecha_inicio ? (
                            <div className="bento-card static p-5 space-y-1.5">
                                <div className="text-[10px] font-bold text-error uppercase tracking-widest flex items-center gap-1.5">
                                    <CalendarIcon size={12} /> Fecha de Finalización
                                </div>
                                <div className="text-sm font-bold text-error font-mono">
                                    {selectedEvent.fecha_fin}
                                </div>
                            </div>
                        ) : (
                            <div className="bento-card static p-5 space-y-1.5">
                                <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                    <Info size={12} /> Duración
                                </div>
                                <div className="text-sm font-bold text-text-main">Todo el día</div>
                            </div>
                        )}

                        <div className="bento-card static p-5 space-y-1.5">
                            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Prioridad</div>
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded inline-block font-sans"
                                style={{
                                    background: PRIORIDAD_COLORS[selectedEvent.prioridad]?.bg || 'var(--border-thin)',
                                    color: PRIORIDAD_COLORS[selectedEvent.prioridad]?.text || 'var(--text-dim)',
                                }}>
                                {selectedEvent.prioridad || 'Media'}
                            </span>
                        </div>

                        <div className="bento-card static p-5 space-y-1.5">
                            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Estado</div>
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded inline-block font-sans ${selectedEvent.estado === 'Completado' ? 'bg-success-subtle text-success' :
                                selectedEvent.estado === 'EnProgreso' || selectedEvent.estado === 'En Ejecución' ? 'bg-info-subtle text-info' :
                                    selectedEvent.estado === 'Cancelado' ? 'bg-bg-deep text-text-dim' :
                                        'bg-warning-subtle text-warning'
                                }`}>
                                {ESTADO_LABELS[selectedEvent.estado] ?? selectedEvent.estado}
                            </span>
                        </div>

                        {/* Contexto de Origen */}
                        {(() => {
                            const desc = getContextDescription(selectedEvent);
                            if (!desc) return null;
                            return (
                                <div className="bento-card static p-5 space-y-2 col-span-2 bg-brand-subtle/10 border border-brand/10">
                                    <div className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1.5">
                                        <Info size={12} /> Detalle de Contexto
                                    </div>
                                    <p className="text-xs text-text-dim leading-relaxed font-sans font-medium">
                                        {desc}
                                    </p>
                                </div>
                            );
                        })()}

                        {/* Alerta */}
                        {selectedEvent.alerta_dias != null && (
                            <div className="bento-card static p-5 space-y-1.5 col-span-2">
                                <div className="text-[10px] font-bold text-warning uppercase tracking-widest flex items-center gap-1.5">
                                    <Bell size={12} /> Recordatorio
                                </div>
                                <div className="text-sm font-bold text-text-main">
                                    {selectedEvent.alerta_dias === 0
                                        ? 'El mismo día del evento'
                                        : `${selectedEvent.alerta_dias} día${selectedEvent.alerta_dias !== 1 ? 's' : ''} antes`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-border-thin bg-surface shrink-0 flex flex-col gap-3">
                    {selectedEvent.categoria_global === 'Personal' ? (
                        <div className="flex gap-3 w-full">
                            {selectedEvent.estado !== 'Completado' && (
                                <button
                                    onClick={() => handleQuickComplete(selectedEvent)}
                                    className="flex-1 py-3 bg-success text-white hover:bg-success/90 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={15} /> Completar
                                </button>
                            )}
                            <button
                                onClick={() => handleEditEventClick(selectedEvent)}
                                className="flex-1 py-3 bg-surface text-fg border border-border hover:bg-surface-hover rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Edit2 size={15} /> Editar
                            </button>
                            <button
                                onClick={() => handleDeleteEvent(selectedEvent.uuid)}
                                className="py-3 px-4 bg-error-subtle text-error hover:bg-error hover:text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center"
                                title="Eliminar tarea"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ) : (
                        <>
                            {hasAction ? (
                                <button
                                    onClick={() => handleGoToEventAction(selectedEvent)}
                                    className="w-full py-3.5 bg-fg text-bg border border-fg hover:bg-accents-7 hover:border-accents-7 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    Ver Detalle / Acción <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="w-full py-3.5 bg-surface text-fg border border-border hover:bg-surface-hover rounded-lg text-sm font-bold transition-all"
                                >
                                    Cerrar Panel
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
