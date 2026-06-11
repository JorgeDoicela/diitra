import React from 'react';
import { BookOpen, Plus, Trash2, ExternalLink, Shield } from 'lucide-react';

interface ResearchProductsListProps {
    currentProject: {
        puedeEditar: boolean;
    };
    products: any[];
    onOpenRegisterModal: () => void;
    onDeleteProduct: (id: number) => void;
}

export const ResearchProductsList: React.FC<ResearchProductsListProps> = ({
    currentProject,
    products,
    onOpenRegisterModal,
    onDeleteProduct
}) => {
    return (
        <div className="bento-card static p-6 flex flex-col justify-between group">
            <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                    <BookOpen size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                    <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Productos de Investigación</h3>
                </div>
            </div>
            <div className="mt-4 flex-1">
                {currentProject.puedeEditar !== false && (
                    <div className="flex justify-end mb-4">
                        <button 
                            type="button"
                            onClick={onOpenRegisterModal}
                            className="btn-vercel-primary !py-2"
                        >
                            <Plus size={12} />
                            <span>Registrar</span>
                        </button>
                    </div>
                )}
                
                {products.length === 0 ? (
                    <div className="p-8 text-center text-[10px] text-text-dim uppercase tracking-wider border border-dashed border-border-thin rounded-xl font-mono">
                        Sin productos registrados
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {products.map((prod: any) => (
                            <div key={prod.id_producto} className="p-4 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover hover:bg-surface-hover/20 transition-all flex flex-col justify-between group">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="badge-vercel badge-vercel-info text-[8px] font-bold uppercase tracking-wider py-0.5">
                                            {prod.tipo_producto_nombre}
                                        </span>
                                        {currentProject.puedeEditar !== false && (
                                            <button 
                                                type="button"
                                                onClick={() => onDeleteProduct(prod.id_producto)}
                                                className="p-1.5 hover:bg-error/10 hover:text-error text-text-dim rounded-lg transition-all"
                                                title="Eliminar producto"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs font-semibold text-text-main leading-relaxed mb-2" title={prod.titulo}>{prod.titulo}</p>
                                </div>
                                
                                <div className="text-[10px] font-mono mt-2 space-y-1">
                                    {prod.url_producto && (
                                        <a href={prod.url_producto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-light hover:text-brand hover:underline">
                                            <ExternalLink size={10} /> 
                                            <span className="truncate max-w-[200px]">{prod.url_producto}</span>
                                        </a>
                                    )}
                                    {prod.es_propiedad_intelectual && (
                                        <div className="flex items-center gap-1 text-success font-medium">
                                            <Shield size={10} />
                                            <span>SENADI: {prod.numero_registro || 'En trámite'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResearchProductsList;
