import React from 'react';
import { Globe, CheckCircle, XCircle, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useConfiguracion } from './useConfiguracion';
import type { DominioAcademico } from './useConfiguracion';

interface DominiosTabProps {
    hook: ReturnType<typeof useConfiguracion>;
    setDetailItem: React.Dispatch<React.SetStateAction<{ type: 'linea' | 'periodo' | 'producto' | 'dominio' | 'indicador' | 'calendario'; data: any; } | null>>;
}

export const DominiosTab: React.FC<DominiosTabProps> = ({ hook, setDetailItem }) => {
    const {
        filteredDominios,
        isDominioModalOpen,
        setIsDominioModalOpen,
        editingDominio,
        dominioForm,
        setDominioForm,
        handleOpenDominioModal,
        handleSaveDominio,
        handleToggleDominio
    } = hook;

    return (
        <div className="w-full">
            <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                        <th className="p-4 font-semibold tracking-widest">Nombre del Dominio</th>
                        <th className="p-4 font-semibold tracking-widest">Fecha de Registro</th>
                        <th className="p-4 font-semibold tracking-widest">Estado</th>
                        <th className="p-4 font-semibold tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-thin">
                    {filteredDominios.map((d: DominioAcademico) => (
                        <tr key={d.uuid} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'dominio', data: d })}>
                            <td className="p-4 text-sm font-medium text-text-main uppercase tracking-tight">
                                {d.nombre}
                            </td>
                            <td className="p-4 text-xs text-text-dim font-mono">
                                {d.fechaRegistro ? d.fechaRegistro.split('T')[0] : 'N/A'}
                            </td>
                            <td className="p-4">
                                {d.activo ? (
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
                                        onClick={() => handleOpenDominioModal(d)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                        title="Editar Dominio"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleDominio(d)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
                                        title="Activar/Desactivar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredDominios.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                No se encontraron dominios académicos registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Dominio Modal */}
            {isDominioModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsDominioModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingDominio ? 'Editar Dominio Académico' : 'Nuevo Dominio Académico'}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        Líneas y Carreras aprobadas por el CES
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsDominioModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDominio} className="flex-1 flex flex-col overflow-hidden">
                            <div className="modal-body space-y-6">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Nombre del Dominio Académico
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        value={dominioForm.nombre}
                                        onChange={(e) => setDominioForm({...dominioForm, nombre: e.target.value})}
                                        className="input-vercel uppercase font-medium"
                                        placeholder="Ej: TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIÓN, SERVICIOS SOCIALES"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsDominioModalOpen(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    {editingDominio ? 'Guardar Cambios' : 'Crear Dominio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
