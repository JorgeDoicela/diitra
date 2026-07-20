import React from 'react';
import { Tag, CheckCircle, XCircle, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useConfiguracion } from './useConfiguracion';
import type { TipoProducto } from './useConfiguracion';

interface ProductosTabProps {
    hook: ReturnType<typeof useConfiguracion>;
    setDetailItem: React.Dispatch<React.SetStateAction<{ type: 'linea' | 'periodo' | 'producto' | 'dominio' | 'indicador' | 'calendario'; data: any; } | null>>;
}

export const ProductosTab: React.FC<ProductosTabProps> = ({ hook, setDetailItem }) => {
    const {
        filteredProductos,
        isProductoModalOpen,
        setIsProductoModalOpen,
        editingProducto,
        productoForm,
        setProductoForm,
        handleOpenProductoModal,
        handleSaveProducto,
        handleToggleProducto
    } = hook;

    return (
        <div className="w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                        <th className="p-4 font-semibold tracking-widest">Nombre del Producto</th>
                        <th className="p-4 font-semibold tracking-widest">Categoría</th>
                        <th className="p-4 font-semibold tracking-widest">Requiere PI/Indexación</th>
                        <th className="p-4 font-semibold tracking-widest">Estado</th>
                        <th className="p-4 font-semibold tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-thin">
                    {filteredProductos.map((t: TipoProducto) => (
                        <tr key={t.uuid} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => setDetailItem({ type: 'producto', data: t })}>
                            <td className="p-4 text-sm font-medium text-text-main uppercase tracking-tight">
                                {t.nombre}
                            </td>
                            <td className="p-4 text-xs font-mono font-medium text-text-dim uppercase">
                                {t.categoria}
                            </td>
                            <td className="p-4 text-xs text-text-dim">
                                {t.requiereRegistro ? 'Sí (SENADI / Indexación)' : 'No'}
                            </td>
                            <td className="p-4">
                                {t.activo ? (
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
                                        onClick={() => handleOpenProductoModal(t)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                        title="Editar Tipo de Producto"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleProducto(t)}
                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-error transition-all"
                                        title="Activar/Desactivar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredProductos.length === 0 && (
                        <tr>
                            <td colSpan={5} className="py-20 text-center text-text-dim text-xs font-mono uppercase">
                                No se encontraron tipos de producto registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Producto Modal */}
            {isProductoModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsProductoModalOpen(false)}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {editingProducto ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'}
                                    </h3>
                                    <p className="section-label text-text-dim">
                                        Clasificación y Puntuación CACES / SENADI
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsProductoModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProducto} className="flex-1 flex flex-col overflow-hidden">
                            <div className="modal-body space-y-6">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Nombre del Tipo de Producto
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        value={productoForm.nombre}
                                        onChange={(e) => setProductoForm({...productoForm, nombre: e.target.value})}
                                        className="input-vercel uppercase font-medium"
                                        placeholder="Ej: Artículo Científico Indexado, Libro, Prototipo Industrial"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        Categoría
                                    </label>
                                    <select 
                                        value={productoForm.categoria}
                                        onChange={(e) => setProductoForm({...productoForm, categoria: e.target.value})}
                                        className="input-vercel font-medium"
                                    >
                                        <option value="Académico">Académico</option>
                                        <option value="Tecnológico">Tecnológico</option>
                                        <option value="Innovación">Innovación</option>
                                        <option value="Transferencia">Transferencia</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-bg-deep/50 rounded-lg border border-border-thin">
                                    <input 
                                        type="checkbox"
                                        id="requiereRegistro"
                                        checked={productoForm.requiereRegistro}
                                        onChange={(e) => setProductoForm({...productoForm, requiereRegistro: e.target.checked})}
                                        className="accent-text-main w-4 h-4 rounded"
                                    />
                                    <label htmlFor="requiereRegistro" className="text-xs text-text-main font-semibold uppercase tracking-wide cursor-pointer select-none">
                                        Requiere Registro de Propiedad Intelectual o Indexación (SENADI/ISSN)
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setIsProductoModalOpen(false)}
                                    className="btn-vercel-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-vercel-primary"
                                >
                                    {editingProducto ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
