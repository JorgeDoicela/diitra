import React from 'react';
import { BookOpen, CheckCircle, XCircle, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useConfiguracion } from './useConfiguracion';
import type { LineaInvestigacion } from './useConfiguracion';

interface LineasTabProps {
    hook: ReturnType<typeof useConfiguracion>;
    setDetailItem: React.Dispatch<React.SetStateAction<{ type: 'linea' | 'periodo' | 'producto' | 'dominio' | 'indicador' | 'calendario'; data: any; } | null>>;
}

export const LineasTab: React.FC<LineasTabProps> = ({ hook, setDetailItem }) => {
    const {
        filteredLineas,
        isLineaModalOpen,
        setIsLineaModalOpen,
        editingLinea,
        lineaForm,
        setLineaForm,
        handleOpenLineaModal,
        handleSaveLinea,
        handleToggleLinea
    } = hook;

    return (
        <div className="w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                        <th className="p-4 font-semibold tracking-widest">Código</th>
                        <th className="p-4 font-semibold tracking-widest">Línea de Investigación</th>
                        <th className="p-4 font-semibold tracking-widest">Descripción</th>
                        <th className="p-4 font-semibold tracking-widest">Estado</th>
                        <th className="p-4 font-semibold tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-thin">
                    {filteredLineas.map((l: LineaInvestigacion) => (
                        <tr key={l.uuid} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'linea', data: l })}>
                            <td className="p-4 text-xs font-mono font-medium text-text-dim">
                                {l.codigoLinea}
                            </td>
                            <td className="p-4 text-sm font-medium text-text-main uppercase tracking-tight">
                                {l.nombreLinea}
                            </td>
                            <td className="p-4 text-xs text-text-dim max-w-xs truncate">
                                {l.descripcion || 'Sin descripción'}
                            </td>
                            <td className="p-4">
                                {l.activo ? (
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
                                        onClick={() => handleOpenLineaModal(l)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                        title="Editar Línea"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleLinea(l)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
                                        title="Activar/Desactivar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredLineas.length === 0 && (
                        <tr>
                            <td colSpan={5} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                No se encontraron líneas registradas
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Linea Modal */}
            {isLineaModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsLineaModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingLinea ? 'Editar Línea de Investigación' : 'Nueva Línea de Investigación'}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        Parámetros de catalogación CACES / SENESCYT
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsLineaModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveLinea} className="flex-1 flex flex-col overflow-hidden">
                            <div className="modal-body space-y-6">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Código de Línea
                                    </label>
                                    <input 
                                        type="text" 
                                        value={lineaForm.codigoLinea}
                                        onChange={(e) => setLineaForm({...lineaForm, codigoLinea: e.target.value})}
                                        className="input-vercel uppercase font-mono"
                                        placeholder="LIN-SOFTWARE (Opcional, se autogenera)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Nombre de la Línea
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        value={lineaForm.nombreLinea}
                                        onChange={(e) => setLineaForm({...lineaForm, nombreLinea: e.target.value})}
                                        className="input-vercel uppercase font-medium"
                                        placeholder="Ej: INTELIGENCIA ARTIFICIAL Y DESARROLLO DE SOFTWARE"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Descripción / Áreas de Enfoque
                                    </label>
                                    <textarea 
                                        rows={4}
                                        value={lineaForm.descripcion}
                                        onChange={(e) => setLineaForm({...lineaForm, descripcion: e.target.value})}
                                        className="input-vercel resize-none"
                                        placeholder="Detalles sobre sublíneas y pertinencia..."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsLineaModalOpen(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    {editingLinea ? 'Guardar Cambios' : 'Crear Línea'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
