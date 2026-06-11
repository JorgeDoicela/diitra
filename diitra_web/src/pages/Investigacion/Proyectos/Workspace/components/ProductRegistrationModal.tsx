import React from 'react';
import { BookOpen } from 'lucide-react';

interface ProductRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    newProduct: {
        id_tipo_producto: number;
        titulo: string;
        cantidad: number;
        url_producto: string;
        es_propiedad_intelectual: boolean;
        numero_registro: string;
        fecha_registro_senadi: string;
    };
    setNewProduct: React.Dispatch<React.SetStateAction<{
        id_tipo_producto: number;
        titulo: string;
        cantidad: number;
        url_producto: string;
        es_propiedad_intelectual: boolean;
        numero_registro: string;
        fecha_registro_senadi: string;
    }>>;
    productTypes: any[];
}

export const ProductRegistrationModal: React.FC<ProductRegistrationModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    newProduct,
    setNewProduct,
    productTypes
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fade-in">
            <div className="modal-card animate-fade-up">
                <div className="modal-header">
                    <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-brand" />
                        <h3 className="text-[10px] font-semibold uppercase tracking-widest">Registrar Producto</h3>
                    </div>
                    <button type="button" onClick={onClose} className="text-text-dim hover:text-text-main transition-colors text-sm">✕</button>
                </div>
                
                <form onSubmit={onSubmit} className="modal-body space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Tipo de Producto</label>
                        <select 
                            value={newProduct.id_tipo_producto}
                            onChange={(e) => setNewProduct({ ...newProduct, id_tipo_producto: Number(e.target.value) })}
                            className="input-vercel !text-xs"
                        >
                            {productTypes.map((type) => (
                                <option key={type.id_tipo_producto} value={type.id_tipo_producto}>
                                    {type.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Título del Producto</label>
                        <input 
                            type="text"
                            required
                            placeholder="Ej: Análisis comparativo de algoritmos CNN..."
                            value={newProduct.titulo}
                            onChange={(e) => setNewProduct({ ...newProduct, titulo: e.target.value })}
                            className="input-vercel !text-xs"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Cantidad</label>
                            <input 
                                type="number"
                                min="1"
                                required
                                value={newProduct.cantidad}
                                onChange={(e) => setNewProduct({ ...newProduct, cantidad: Number(e.target.value) })}
                                className="input-vercel !text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">URL / DOI</label>
                            <input 
                                type="text"
                                placeholder="https://doi.org/..."
                                value={newProduct.url_producto}
                                onChange={(e) => setNewProduct({ ...newProduct, url_producto: e.target.value })}
                                className="input-vercel !text-xs"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-1">
                        <input 
                            type="checkbox"
                            id="es_propiedad_intelectual"
                            checked={newProduct.es_propiedad_intelectual}
                            onChange={(e) => setNewProduct({ ...newProduct, es_propiedad_intelectual: e.target.checked })}
                            className="w-4 h-4 rounded border-border-thin bg-surface text-brand accent-text-main"
                        />
                        <label htmlFor="es_propiedad_intelectual" className="text-xs text-text-dim select-none">Propiedad Intelectual (SENADI)</label>
                    </div>
                    
                    {newProduct.es_propiedad_intelectual && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-thin animate-fade-in">
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">N. Registro</label>
                                <input 
                                    type="text"
                                    placeholder="SENADI-2026-0045"
                                    value={newProduct.numero_registro}
                                    onChange={(e) => setNewProduct({ ...newProduct, numero_registro: e.target.value })}
                                    className="input-vercel !text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Fecha de Registro</label>
                                <input 
                                    type="date"
                                    value={newProduct.fecha_registro_senadi}
                                    onChange={(e) => setNewProduct({ ...newProduct, fecha_registro_senadi: e.target.value })}
                                    className="input-vercel !text-xs"
                                />
                            </div>
                        </div>
                    )}
                    <div className="modal-footer !px-0 !pb-0 !border-0 !bg-transparent">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="btn-vercel-secondary !py-2"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="btn-vercel-primary !py-2"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductRegistrationModal;
