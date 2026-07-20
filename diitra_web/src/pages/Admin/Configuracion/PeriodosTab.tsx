import React from 'react';
import { Calendar, CheckCircle, XCircle, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useConfiguracion } from './useConfiguracion';
import type { PeriodoAcademico } from './useConfiguracion';

interface PeriodosTabProps {
    hook: ReturnType<typeof useConfiguracion>;
    setDetailItem: React.Dispatch<React.SetStateAction<{ type: 'linea' | 'periodo' | 'producto' | 'dominio' | 'indicador' | 'calendario'; data: any; } | null>>;
}

export const PeriodosTab: React.FC<PeriodosTabProps> = ({ hook, setDetailItem }) => {
    const {
        filteredPeriodos,
        isPeriodoModalOpen,
        setIsPeriodoModalOpen,
        editingPeriodo,
        periodoForm,
        setPeriodoForm,
        handleOpenPeriodoModal,
        handleSavePeriodo,
        handleTogglePeriodo
    } = hook;

    return (
        <div className="w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                        <th className="p-4 font-semibold tracking-widest">ID Período</th>
                        <th className="p-4 font-semibold tracking-widest">Detalle / Nombre</th>
                        <th className="p-4 font-semibold tracking-widest">Fecha Inicial</th>
                        <th className="p-4 font-semibold tracking-widest">Fecha Final</th>
                        <th className="p-4 font-semibold tracking-widest">Estado</th>
                        <th className="p-4 font-semibold tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-thin">
                    {filteredPeriodos.map((p: PeriodoAcademico) => (
                        <tr key={p.idPeriodo} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'periodo', data: p })}>
                            <td className="p-4 text-xs font-mono font-medium text-text-main">
                                {p.idPeriodo}
                            </td>
                            <td className="p-4 text-sm font-medium text-text-main uppercase tracking-tight">
                                {p.detalle || 'N/A'}
                            </td>
                            <td className="p-4 text-xs text-text-dim font-mono">
                                {p.fechaInicial ? p.fechaInicial.split('T')[0] : 'N/A'}
                            </td>
                            <td className="p-4 text-xs text-text-dim font-mono">
                                {p.fechaFinal ? p.fechaFinal.split('T')[0] : 'N/A'}
                            </td>
                            <td className="p-4">
                                {p.activo ? (
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
                                        onClick={() => handleOpenPeriodoModal(p)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                        title="Editar Período"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleTogglePeriodo(p)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
                                        title="Activar/Desactivar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredPeriodos.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                No se encontraron períodos académicos registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Periodo Modal */}
            {isPeriodoModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsPeriodoModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingPeriodo ? 'Editar Período Académico' : 'Nuevo Período Académico'}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        Calendario y asignaciones institucionales
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsPeriodoModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePeriodo} className="flex-1 flex flex-col overflow-hidden">
                            <div className="modal-body space-y-6">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Identificador del Período
                                    </label>
                                    <input 
                                        required
                                        disabled={editingPeriodo !== null}
                                        type="text" 
                                        value={periodoForm.idPeriodo}
                                        onChange={(e) => setPeriodoForm({...periodoForm, idPeriodo: e.target.value})}
                                        className="input-vercel uppercase font-mono disabled:opacity-50"
                                        placeholder="Ej: 2026-A"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Detalle / Nombre
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        value={periodoForm.detalle}
                                        onChange={(e) => setPeriodoForm({...periodoForm, detalle: e.target.value})}
                                        className="input-vercel uppercase font-medium"
                                        placeholder="Ej: PERÍODO MAYO - OCTUBRE 2026"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Fecha de Inicio
                                        </label>
                                        <input 
                                            type="date" 
                                            value={periodoForm.fechaInicial}
                                            onChange={(e) => setPeriodoForm({...periodoForm, fechaInicial: e.target.value})}
                                            className="input-vercel"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Fecha de Fin
                                        </label>
                                        <input 
                                            type="date" 
                                            value={periodoForm.fechaFinal}
                                            onChange={(e) => setPeriodoForm({...periodoForm, fechaFinal: e.target.value})}
                                            className="input-vercel"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsPeriodoModalOpen(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    {editingPeriodo ? 'Guardar Cambios' : 'Crear Período'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
