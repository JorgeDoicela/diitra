import React from 'react';
import { CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';
import { useConfiguracion } from './useConfiguracion';
import type { EventoNormativo } from './useConfiguracion';

interface CalendarioTabProps {
    hook: ReturnType<typeof useConfiguracion>;
    setDetailItem: React.Dispatch<React.SetStateAction<{ type: 'linea' | 'periodo' | 'producto' | 'dominio' | 'indicador' | 'calendario'; data: any; } | null>>;
}

export const CalendarioTab: React.FC<CalendarioTabProps> = ({ hook, setDetailItem }) => {
    const {
        filteredCalendario,
        isCalendarioModalOpen,
        setIsCalendarioModalOpen,
        editingCalendario,
        calendarioForm,
        setCalendarioForm,
        handleOpenCalendarioModal,
        handleSaveCalendario,
        handleDeleteCalendario
    } = hook;

    return (
        <div className="w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                        <th className="p-4 font-semibold tracking-widest">Título del Hito</th>
                        <th className="p-4 font-semibold tracking-widest">Tipo</th>
                        <th className="p-4 font-semibold tracking-widest">Fecha Inicio</th>
                        <th className="p-4 font-semibold tracking-widest">Fecha Fin</th>
                        <th className="p-4 font-semibold tracking-widest">Estado</th>
                        <th className="p-4 font-semibold tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-thin">
                    {filteredCalendario.map((c: EventoNormativo) => (
                        <tr key={c.uuid} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'calendario', data: c })}>
                            <td className="p-4 text-sm font-medium text-text-main uppercase tracking-tight">
                                <div className="flex items-center gap-2">
                                    <span 
                                        className="w-2.5 h-2.5 rounded-full border border-white/20" 
                                        style={{ backgroundColor: c.colorHex || '#6B7280' }} 
                                    />
                                    <span>{c.titulo}</span>
                                </div>
                            </td>
                            <td className="p-4 text-xs font-mono font-medium text-text-dim uppercase">
                                {c.tipoEvento}
                            </td>
                            <td className="p-4 text-xs text-text-dim font-mono">
                                {c.fechaInicio ? c.fechaInicio.split('T')[0] : 'N/A'}
                            </td>
                            <td className="p-4 text-xs text-text-dim font-mono">
                                {c.fechaFin ? c.fechaFin.split('T')[0] : 'TODO EL DÍA'}
                            </td>
                            <td className="p-4">
                                {c.activo ? (
                                    <span className="badge-vercel badge-vercel-success">
                                        <CheckCircle size={10} strokeWidth={3} /> Activo
                                    </span>
                                ) : (
                                    <span className="badge-vercel badge-vercel-error">
                                        <XCircle size={10} strokeWidth={3} /> Inactivo
                                    </span>
                                )}
                            </td>
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => handleOpenCalendarioModal(c)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                        title="Editar Hito"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCalendario(c)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
                                        title="Eliminar Hito"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredCalendario.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                No se encontraron hitos normativos registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Calendario Modal */}
            {isCalendarioModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
                        onClick={() => setIsCalendarioModalOpen(false)} 
                    />
                    
                    <div className="relative w-full max-w-lg bg-bg-deep border-l border-border-thin shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                        <div className="modal-header">
                            <div>
                                <span className="text-[10px] uppercase font-mono tracking-widest text-text-dim">Módulo Calendario</span>
                                <h3 className="text-lg font-semibold text-text-main">
                                    {editingCalendario ? 'Editar Hito Normativo' : 'Nuevo Hito Normativo'}
                                </h3>
                            </div>
                            <button onClick={() => setIsCalendarioModalOpen(false)} className="btn-close-modal">
                                <XCircle size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCalendario} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text-main uppercase tracking-wider">Título del Hito *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={calendarioForm.titulo}
                                    onChange={(e) => setCalendarioForm(prev => ({ ...prev, titulo: e.target.value }))}
                                    placeholder="Ej. Cierre de Convocatoria CACES 2025"
                                    className="input-vercel"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text-main uppercase tracking-wider">Descripción / Directrices</label>
                                <textarea 
                                    value={calendarioForm.descripcion}
                                    onChange={(e) => setCalendarioForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                    placeholder="Instrucciones específicas..."
                                    className="textarea-vercel h-24 font-normal"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-main uppercase tracking-wider">Tipo de Evento</label>
                                    <select 
                                        value={calendarioForm.tipoEvento}
                                        onChange={(e) => setCalendarioForm(prev => ({ ...prev, tipoEvento: e.target.value }))}
                                        className="select-vercel"
                                    >
                                        <option value="Normativo">Normativo (CACES/CES)</option>
                                        <option value="Academico">Académico (IST)</option>
                                        <option value="Institucional">Institucional</option>
                                        <option value="Feriado">Feriado / Receso</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-main uppercase tracking-wider">Color Etiqueta</label>
                                    <input 
                                        type="color" 
                                        value={calendarioForm.colorHex}
                                        onChange={(e) => setCalendarioForm(prev => ({ ...prev, colorHex: e.target.value }))}
                                        className="w-full h-9 rounded-md border border-border-thin cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-main uppercase tracking-wider">Fecha Inicio *</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={calendarioForm.fechaInicio}
                                        onChange={(e) => setCalendarioForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
                                        className="input-vercel"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-main uppercase tracking-wider">Fecha Fin</label>
                                    <input 
                                        type="date" 
                                        value={calendarioForm.fechaFin}
                                        onChange={(e) => setCalendarioForm(prev => ({ ...prev, fechaFin: e.target.value }))}
                                        className="input-vercel"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-main">
                                    <input 
                                        type="checkbox" 
                                        checked={calendarioForm.esTodoElDia}
                                        onChange={(e) => setCalendarioForm(prev => ({ ...prev, esTodoElDia: e.target.checked }))}
                                    />
                                    <span>Todo el día</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-main">
                                    <input 
                                        type="checkbox" 
                                        checked={calendarioForm.recurrenciaAnual}
                                        onChange={(e) => setCalendarioForm(prev => ({ ...prev, recurrenciaAnual: e.target.checked }))}
                                    />
                                    <span>Recurre Anualmente</span>
                                </label>
                            </div>

                            {calendarioForm.recurrenciaAnual && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-main uppercase tracking-wider">Repetir Hasta</label>
                                    <input 
                                        type="date" 
                                        value={calendarioForm.recurrenciaHasta}
                                        onChange={(e) => setCalendarioForm(prev => ({ ...prev, recurrenciaHasta: e.target.value }))}
                                        className="input-vercel"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-main uppercase tracking-wider">Alerta Anticipada (Días)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={calendarioForm.alertaDias}
                                        onChange={(e) => setCalendarioForm(prev => ({ ...prev, alertaDias: Number(e.target.value) }))}
                                        placeholder="Ej. 7"
                                        className="input-vercel font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-main uppercase tracking-wider">Roles Visibles (CSV)</label>
                                    <input 
                                        type="text" 
                                        value={calendarioForm.rolesVisibles}
                                        onChange={(e) => setCalendarioForm(prev => ({ ...prev, rolesVisibles: e.target.value }))}
                                        placeholder="Ej. DIITRA_ADMIN,DIITRA_DOCENTE"
                                        className="input-vercel"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full btn-vercel-primary py-3 font-semibold text-sm">
                                {editingCalendario ? 'Actualizar Hito' : 'Crear Hito'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
