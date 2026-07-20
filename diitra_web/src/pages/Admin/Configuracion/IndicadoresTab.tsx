import React from 'react';
import { BarChart2, CheckCircle, XCircle, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useConfiguracion } from './useConfiguracion';
import type { ConfigIndicador } from './useConfiguracion';

interface IndicadoresTabProps {
    hook: ReturnType<typeof useConfiguracion>;
    setDetailItem: React.Dispatch<React.SetStateAction<{ type: 'linea' | 'periodo' | 'producto' | 'dominio' | 'indicador' | 'calendario'; data: any; } | null>>;
}

export const IndicadoresTab: React.FC<IndicadoresTabProps> = ({ hook, setDetailItem }) => {
    const {
        filteredIndicadores,
        isIndicadorModalOpen,
        setIsIndicadorModalOpen,
        editingIndicador,
        indicadorForm,
        setIndicadorForm,
        handleOpenIndicadorModal,
        handleSaveIndicador,
        handleToggleIndicador
    } = hook;

    return (
        <div className="w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                        <th className="p-4 font-semibold tracking-widest">Código</th>
                        <th className="p-4 font-semibold tracking-widest">Nombre del Indicador</th>
                        <th className="p-4 font-semibold tracking-widest">Año</th>
                        <th className="p-4 font-semibold tracking-widest">Valor de Referencia / Meta</th>
                        <th className="p-4 font-semibold tracking-widest">Estado</th>
                        <th className="p-4 font-semibold tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-thin">
                    {filteredIndicadores.map((i: ConfigIndicador) => (
                        <tr key={i.idConfig} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'indicador', data: i })}>
                            <td className="p-4 text-xs font-mono font-medium text-text-dim">
                                {i.codigoIndicador}
                            </td>
                            <td className="p-4 text-sm font-medium text-text-main uppercase tracking-tight">
                                {i.nombreIndicador}
                            </td>
                            <td className="p-4 text-xs text-text-dim font-mono">
                                {i.añoNormativa}
                            </td>
                            <td className="p-4 text-xs text-text-main font-semibold font-mono">
                                {i.valorReferencia} ({i.tipoDato})
                            </td>
                            <td className="p-4">
                                {i.activo ? (
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
                                        onClick={() => handleOpenIndicadorModal(i)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                        title="Editar Indicador"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleIndicador(i)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
                                        title="Activar/Desactivar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredIndicadores.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                No se encontraron indicadores registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Indicador Modal */}
            {isIndicadorModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsIndicadorModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <BarChart2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingIndicador ? 'Editar Indicador CACES' : 'Nuevo Indicador CACES'}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        Parámetros de Evaluación y Acreditación de Calidad
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsIndicadorModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveIndicador} className="flex-1 flex flex-col overflow-hidden">
                            <div className="modal-body space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Código de Indicador
                                        </label>
                                        <input 
                                            required
                                            type="text" 
                                            value={indicadorForm.codigoIndicador}
                                            onChange={(e) => setIndicadorForm({...indicadorForm, codigoIndicador: e.target.value})}
                                            className="input-vercel uppercase font-mono"
                                            placeholder="Ej: IND-PUB-ART"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Año de la Normativa
                                        </label>
                                        <input 
                                            required
                                            type="number" 
                                            value={indicadorForm.añoNormativa}
                                            onChange={(e) => setIndicadorForm({...indicadorForm, añoNormativa: Number(e.target.value)})}
                                            className="input-vercel font-mono"
                                            placeholder="Ej: 2026"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Nombre del Indicador
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        value={indicadorForm.nombreIndicador}
                                        onChange={(e) => setIndicadorForm({...indicadorForm, nombreIndicador: e.target.value})}
                                        className="input-vercel uppercase font-medium"
                                        placeholder="Ej: Tasa de Publicación Científica por Docente TC"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Descripción / Metodología de Cálculo
                                    </label>
                                    <textarea 
                                        rows={3}
                                        value={indicadorForm.descripcion}
                                        onChange={(e) => setIndicadorForm({...indicadorForm, descripcion: e.target.value})}
                                        className="input-vercel resize-none"
                                        placeholder="Detalle sobre el cálculo y pertinencia del indicador..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Tipo de Dato
                                        </label>
                                        <select 
                                            value={indicadorForm.tipoDato}
                                            onChange={(e) => setIndicadorForm({...indicadorForm, tipoDato: e.target.value})}
                                            className="input-vercel font-medium"
                                        >
                                            <option value="Cantidad">Cantidad</option>
                                            <option value="Monto">Monto / Presupuesto</option>
                                            <option value="Porcentaje">Porcentaje</option>
                                            <option value="Booleano">Booleano</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Valor de Referencia / Meta
                                        </label>
                                        <input 
                                            required
                                            type="number" 
                                            step="0.01"
                                            value={indicadorForm.valorReferencia}
                                            onChange={(e) => setIndicadorForm({...indicadorForm, valorReferencia: Number(e.target.value)})}
                                            className="input-vercel font-mono"
                                            placeholder="Ej: 0.50 o 80.00"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Umbral Cumplido (%)
                                        </label>
                                        <input 
                                            required
                                            type="number" 
                                            step="0.01"
                                            value={indicadorForm.umbralCumplido}
                                            onChange={(e) => setIndicadorForm({...indicadorForm, umbralCumplido: Number(e.target.value)})}
                                            className="input-vercel font-mono"
                                            placeholder="Ej: 80.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="section-label text-text-dim">
                                            Umbral En Proceso (%)
                                        </label>
                                        <input 
                                            required
                                            type="number" 
                                            step="0.01"
                                            value={indicadorForm.umbralEnProceso}
                                            onChange={(e) => setIndicadorForm({...indicadorForm, umbralEnProceso: Number(e.target.value)})}
                                            className="input-vercel font-mono"
                                            placeholder="Ej: 50.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsIndicadorModalOpen(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    {editingIndicador ? 'Guardar Cambios' : 'Crear Indicador'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
