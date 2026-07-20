import React from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, RotateCcw } from 'lucide-react';
import { COLORES_OPCIONES } from '../../../services/calendarioService';

interface EventoFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    isEditing: boolean;
    handleSaveEvent: (e: React.FormEvent) => void;
    formTitulo: string;
    setFormTitulo: (v: string) => void;
    formDescripcion: string;
    setFormDescripcion: (v: string) => void;
    formTipo: string;
    setFormTipo: (v: string) => void;
    formColorHex: string;
    setFormColorHex: (v: string) => void;
    formFechaInicio: string;
    setFormFechaInicio: (v: string) => void;
    formFechaFin: string;
    setFormFechaFin: (v: string) => void;
    formPrioridad: string;
    setFormPrioridad: (v: string) => void;
    formEstado: string;
    setFormEstado: (v: string) => void;
    formAlertaDias: number | '';
    setFormAlertaDias: (v: number | '') => void;
    formRecurrenciaAnual: boolean;
    setFormRecurrenciaAnual: (v: boolean) => void;
    formEsPrivado: boolean;
    setFormEsPrivado: (v: boolean) => void;
}

export const EventoFormDrawer: React.FC<EventoFormDrawerProps> = ({
    isOpen,
    onClose,
    isEditing,
    handleSaveEvent,
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
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                onClick={onClose}
            />

            <form
                onSubmit={handleSaveEvent}
                className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right"
            >
                <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                    <h2 className="text-xl font-bold tracking-tight text-text-main font-sans">
                        {isEditing ? 'Editar Tarea o Evento' : 'Nueva Tarea / Evento de Agenda'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-surface">
                    {/* Título */}
                    <div className="space-y-1">
                        <label className="section-label mb-1.5 block">Título *</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Reunión de Avance del Proyecto"
                            value={formTitulo}
                            onChange={(e) => setFormTitulo(e.target.value)}
                            className="input-vercel text-sm"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1">
                        <label className="section-label mb-1.5 block">Descripción o Detalles</label>
                        <textarea
                            rows={3}
                            placeholder="Ingresa notas o detalles sobre el evento..."
                            value={formDescripcion}
                            onChange={(e) => setFormDescripcion(e.target.value)}
                            className="input-vercel text-sm resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Tipo */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Categoría / Tipo</label>
                            <select
                                value={formTipo}
                                onChange={(e) => setFormTipo(e.target.value)}
                                className="input-vercel text-sm"
                            >
                                <option value="Personal">Personal / Nota</option>
                                <option value="Tarea">Tarea de Investigación</option>
                                <option value="Reunion">Reunión / Tutoría</option>
                                <option value="Hito">Hito de Proyecto</option>
                            </select>
                        </div>

                        {/* Color */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Etiqueta Visual (Color)</label>
                            <select
                                value={formColorHex}
                                onChange={(e) => setFormColorHex(e.target.value)}
                                className="input-vercel text-sm"
                            >
                                {COLORES_OPCIONES.map(({ value, label }) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha Inicio */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Fecha de Inicio *</label>
                            <input
                                type="date"
                                required
                                value={formFechaInicio || ''}
                                onChange={(e) => setFormFechaInicio(e.target.value)}
                                className="input-vercel text-sm"
                            />
                        </div>

                        {/* Fecha Fin */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Fecha de Fin</label>
                            <input
                                type="date"
                                value={formFechaFin || ''}
                                onChange={(e) => setFormFechaFin(e.target.value)}
                                className="input-vercel text-sm"
                            />
                        </div>

                        {/* Prioridad */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Prioridad</label>
                            <select
                                value={formPrioridad}
                                onChange={(e) => setFormPrioridad(e.target.value)}
                                className="input-vercel text-sm"
                            >
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                            </select>
                        </div>

                        {/* Estado */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Estado</label>
                            <select
                                value={formEstado}
                                onChange={(e) => setFormEstado(e.target.value)}
                                className="input-vercel text-sm"
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="EnProgreso">En Progreso</option>
                                <option value="Completado">Completado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>

                        {/* Alerta días */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block flex items-center gap-1.5">
                                <Bell size={10} /> Recordatorio (días antes)
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={90}
                                placeholder="Ej: 3 (dejar vacío para no recordar)"
                                value={formAlertaDias}
                                onChange={(e) => setFormAlertaDias(e.target.value === '' ? '' : Number(e.target.value))}
                                className="input-vercel text-sm"
                            />
                        </div>

                        {/* Recurrencia anual */}
                        <div className="space-y-1 flex flex-col justify-end">
                            <label className="section-label mb-1.5 block flex items-center gap-1.5">
                                <RotateCcw size={10} /> Repetición
                            </label>
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-border-thin rounded-lg">
                                <input
                                    type="checkbox"
                                    id="recurrencia_anual"
                                    checked={formRecurrenciaAnual}
                                    onChange={(e) => setFormRecurrenciaAnual(e.target.checked)}
                                    className="w-4 h-4 accent-brand cursor-pointer"
                                />
                                <label htmlFor="recurrencia_anual" className="text-sm text-text-main cursor-pointer select-none">
                                    Se repite cada año
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Es Privado */}
                    <div className="flex items-center gap-3 p-4 bg-surface border border-border-thin rounded-lg">
                        <input
                            type="checkbox"
                            id="es_privado"
                            checked={formEsPrivado}
                            onChange={(e) => setFormEsPrivado(e.target.checked)}
                            className="w-5 h-5 border border-border rounded accent-brand cursor-pointer"
                        />
                        <div className="flex flex-col">
                            <label htmlFor="es_privado" className="text-sm font-bold text-text-main cursor-pointer select-none">
                                Evento Privado / Personal
                            </label>
                            <span className="text-[11px] text-text-dim leading-snug">
                                Si está marcado, solo tú podrás ver este evento.
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border-thin bg-surface shrink-0 flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-vercel-secondary flex-1 py-3 text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn-vercel-primary flex-1 py-3 text-xs"
                    >
                        {isEditing ? 'Actualizar Evento' : 'Guardar Evento'}
                    </button>
                </div>
            </form>
        </div>,
        document.body
    );
};
