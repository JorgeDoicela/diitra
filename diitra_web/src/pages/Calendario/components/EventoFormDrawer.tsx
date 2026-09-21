import React from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, RotateCcw } from 'lucide-react';
import { COLORES_OPCIONES } from '../../../services/calendarioService';
import { GeistSelect } from '../../../components/Common/GeistSelect';
import { GeistDatePicker } from '../../../components/Common/GeistDatePicker';
import { useAuth } from '../../../api/AuthContext';
import './EventoDrawers.css';

const toDisplayDate = (val?: string) => {
    if (!val) return '';
    const clean = val.split('T')[0];
    if (clean.includes('-')) {
        const [y, m, d] = clean.split('-');
        if (y && m && d) return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return clean;
};

const toISODate = (val?: string) => {
    if (!val) return '';
    const clean = val.trim();
    if (clean.includes('/')) {
        const [d, m, y] = clean.split('/');
        if (d && m && y) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return clean;
};

const TIPO_OPCIONES = [
    { value: 'Personal', label: 'Personal / Nota' },
    { value: 'Tarea', label: 'Tarea de Investigación' },
    { value: 'Reunion', label: 'Reunión / Tutoría' },
    { value: 'Hito', label: 'Hito de Proyecto' },
    { value: 'Normativo', label: 'Hito Normativo / CACES' },
];

const PRIORIDAD_OPCIONES = [
    { value: 'Baja', label: 'Baja' },
    { value: 'Media', label: 'Media' },
    { value: 'Alta', label: 'Alta' },
];

const ESTADO_OPCIONES = [
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'EnProgreso', label: 'En Progreso' },
    { value: 'Completado', label: 'Completado' },
    { value: 'Cancelado', label: 'Cancelado' },
];

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
    formEsNormativo?: boolean;
    setFormEsNormativo?: (v: boolean) => void;
    formRolesVisibles?: string;
    setFormRolesVisibles?: (v: string) => void;
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
    formEsNormativo = false,
    setFormEsNormativo,
    formRolesVisibles = '',
    setFormRolesVisibles,
}) => {
    const { isAdmin } = useAuth();
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
                        {isEditing
                            ? (formEsNormativo ? 'Editar Hito Institucional' : 'Editar Tarea o Evento')
                            : (formEsNormativo ? 'Nuevo Hito Normativo Institucional' : 'Nueva Tarea / Evento de Agenda')}
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
                    {/* Selector de Ámbito para Administradores */}
                    {isAdmin && setFormEsNormativo && (
                        <div className="space-y-2 pb-4 border-b border-border-thin">
                            <label className="section-label block">Ámbito del Evento</label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-bg-deep rounded-xl border border-border-thin">
                                <button
                                    type="button"
                                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${!formEsNormativo ? 'bg-surface text-text-main shadow-sm border border-border-thin font-bold' : 'text-text-dim hover:text-text-main'}`}
                                    onClick={() => {
                                        setFormEsNormativo(false);
                                        setFormEsPrivado(true);
                                        if (formTipo === 'Normativo') setFormTipo('Personal');
                                    }}
                                >
                                    Mi Tarea Personal
                                </button>
                                <button
                                    type="button"
                                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${formEsNormativo ? 'bg-brand text-white shadow-sm font-bold' : 'text-text-dim hover:text-text-main'}`}
                                    onClick={() => {
                                        setFormEsNormativo(true);
                                        setFormEsPrivado(false);
                                        setFormTipo('Normativo');
                                        setFormColorHex('#1E3A8A');
                                    }}
                                >
                                    Hito Institucional (Público)
                                </button>
                            </div>

                            {formEsNormativo && setFormRolesVisibles && (
                                <div className="pt-2 space-y-1">
                                    <label className="section-label mb-1.5 block">Destinatarios Visibles</label>
                                    <GeistSelect
                                        value={formRolesVisibles || 'TODOS'}
                                        onChange={(v) => setFormRolesVisibles(v === 'TODOS' ? '' : String(v))}
                                        options={[
                                            { value: 'TODOS', label: 'Toda la Comunidad (Docentes, Revisores, Estudiantes)' },
                                            { value: 'DIITRA_DOCENTE', label: 'Solo Docentes Investigadores' },
                                            { value: 'DIITRA_REVISOR_EXTERNO', label: 'Solo Evaluadores y Revisores Pares' },
                                            { value: 'DIITRA_ESTUDIANTE', label: 'Solo Estudiantes / Semilleristas' },
                                        ]}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Título */}
                    <div className="space-y-1">
                        <label className="section-label mb-1.5 block">Título *</label>
                        <input
                            type="text"
                            required
                            placeholder={formEsNormativo ? "Ej: Plazo de Cierre CACES / Entrega Semestral" : "Ej: Reunión de Avance del Proyecto"}
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
                            <GeistSelect
                                value={formTipo}
                                options={TIPO_OPCIONES}
                                placeholder="Seleccionar Tipo..."
                                onChange={(val) => setFormTipo(String(val))}
                            />
                        </div>

                        {/* Color */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Etiqueta Visual (Color)</label>
                            <GeistSelect
                                value={formColorHex}
                                options={COLORES_OPCIONES}
                                placeholder="Seleccionar Color..."
                                onChange={(val) => setFormColorHex(String(val))}
                            />
                        </div>

                        {/* Fecha Inicio */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Fecha de Inicio *</label>
                            <GeistDatePicker
                                value={toDisplayDate(formFechaInicio)}
                                placeholder="dd/mm/aaaa"
                                onChange={(newVal) => setFormFechaInicio(toISODate(newVal))}
                            />
                        </div>

                        {/* Fecha Fin */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Fecha de Fin</label>
                            <GeistDatePicker
                                value={toDisplayDate(formFechaFin)}
                                placeholder="dd/mm/aaaa"
                                onChange={(newVal) => setFormFechaFin(toISODate(newVal))}
                            />
                        </div>

                        {/* Prioridad */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Prioridad</label>
                            <GeistSelect
                                value={formPrioridad}
                                options={PRIORIDAD_OPCIONES}
                                placeholder="Seleccionar Prioridad..."
                                onChange={(val) => setFormPrioridad(String(val))}
                            />
                        </div>

                        {/* Estado */}
                        <div className="space-y-1">
                            <label className="section-label mb-1.5 block">Estado</label>
                            <GeistSelect
                                value={formEstado}
                                options={ESTADO_OPCIONES}
                                placeholder="Seleccionar Estado..."
                                onChange={(val) => setFormEstado(String(val))}
                            />
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

                    {/* Es Privado o Hito Institucional */}
                    {formEsNormativo ? (
                        <div className="flex items-center gap-3 p-4 bg-brand-subtle/50 border border-brand/20 rounded-xl text-brand">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold font-sans">
                                    Hito Institucional Oficial
                                </span>
                                <span className="text-[11px] opacity-80 leading-snug">
                                    Este evento se publicará en el calendario institucional de los roles seleccionados y se sincronizará con los feeds iCal correspondientes.
                                </span>
                            </div>
                        </div>
                    ) : (
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
                                    Si está marcado, solo tú podrás ver este evento en tu agenda y tablero.
                                </span>
                            </div>
                        </div>
                    )}
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
