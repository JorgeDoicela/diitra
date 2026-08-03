import React, { useState } from 'react';
import { Target, Layout, Columns, CheckSquare, Plus, Trash2, Layers } from 'lucide-react';
import type { DocumentBlock } from '../../types';

interface ExpectedProductsPropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

export interface ExpectedProductCategory {
    id: string;
    name: string;
    code: string;
    enabled: boolean;
}

export const DEFAULT_EXPECTED_PRODUCT_CATEGORIES: ExpectedProductCategory[] = [
    { id: 'cat_cientifico', name: 'Productos Científico-Tecnológicos (Artículos, Libros, Patentes)', code: 'CIENTIFICO', enabled: true },
    { id: 'cat_rrhh', name: 'Formación de Recursos Humanos (Tesis Grado / Posgrado)', code: 'RRHH', enabled: true },
    { id: 'cat_divulgacion', name: 'Divulgación y Vinculación (Ponencias, Congresos, Comunidades)', code: 'DIVULGACION', enabled: true },
    { id: 'cat_senadi', name: 'Propiedad Intelectual y Registro SENADI', code: 'SENADI', enabled: true },
];

const inputCls = "w-full text-[11px] bg-surface-hover/60 hover:bg-surface-hover/90 border border-border-thin rounded-md p-2 text-text-main focus:bg-surface focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all focus:outline-none";

export const ExpectedProductsProperties: React.FC<ExpectedProductsPropertiesProps> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};
    const [newCatName, setNewCatName] = useState('');

    const productosTitle = config.productosTitle || '5. Productos y Entregables Esperados';
    const layoutMode = config.productsLayoutMode || config.layoutMode || 'table_detailed';

    // Obtener columnas con defaults
    const cols = config.productColumns || {
        showCategory: true,
        showSubtype: true,
        showProductName: true,
        showIndicator: true,
        showVerificationMeans: true,
        showQuantity: true,
        showDeadline: false,
    };

    // Obtener categorías con defaults
    const rawCategories = config.productCategories || config.categories;
    const categories: ExpectedProductCategory[] = (Array.isArray(rawCategories) && rawCategories.length > 0)
        ? rawCategories
        : DEFAULT_EXPECTED_PRODUCT_CATEGORIES;

    const handleColumnToggle = (colKey: string, checked: boolean) => {
        const updatedCols = { ...cols, [colKey]: checked };
        onUpdateConfig(block.id, 'productColumns', updatedCols);
    };

    const handleCategoryToggle = (catId: string, enabled: boolean) => {
        const updatedCats = categories.map(cat => cat.id === catId ? { ...cat, enabled } : cat);
        onUpdateConfig(block.id, 'productCategories', updatedCats);
    };

    const handleAddCategory = () => {
        if (!newCatName.trim()) return;
        const newCat: ExpectedProductCategory = {
            id: `cat_custom_${Date.now()}`,
            name: newCatName.trim(),
            code: `CUSTOM_${Date.now()}`,
            enabled: true,
        };
        const updatedCats = [...categories, newCat];
        onUpdateConfig(block.id, 'productCategories', updatedCats);
        setNewCatName('');
    };

    const handleRemoveCategory = (catId: string) => {
        const updatedCats = categories.filter(cat => cat.id !== catId);
        onUpdateConfig(block.id, 'productCategories', updatedCats);
    };

    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4 text-left">
            {/* Título de Sección */}
            <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                    <Target size={13} className="text-brand" />
                    General de Productos Esperados
                </h5>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Título de la Sección</label>
                    <input
                        type="text"
                        className={inputCls}
                        value={productosTitle}
                        onChange={e => onUpdateConfig(block.id, 'productosTitle', e.target.value)}
                        placeholder="Ej: 5. Productos y Entregables del Proyecto"
                    />
                </div>
            </div>

            {/* Modo de Maquetación */}
            <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                    <Layout size={13} className="text-brand" />
                    Modo de Visualización / Layout
                </h5>
                <select
                    value={layoutMode}
                    onChange={e => onUpdateConfig(block.id, 'productsLayoutMode', e.target.value)}
                    className={inputCls}
                >
                    <option value="table_detailed">Tabla Detallada CACES (Categorías + Indicadores)</option>
                    <option value="table_simple">Tabla Simple (Tipo de Producto + Cantidad)</option>
                    <option value="cards_by_category">Tarjetas Bento por Categoría</option>
                    <option value="grouped_sections">Secciones Consecutivas por Categoría</option>
                </select>
            </div>

            {/* Configuración de Columnas Visibles */}
            <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                    <Columns size={13} className="text-brand" />
                    Columnas Visibles en Tabla
                </h5>
                <div className="space-y-2">
                    {[
                        { key: 'showCategory', label: 'Categoría CACES / Tipo', desc: 'Muestra la categoría principal del producto.' },
                        { key: 'showSubtype', label: 'Subtipo de Entregable', desc: 'Ej: Artículo Scopus Q1, Ponencia, Registro SENADI.' },
                        { key: 'showProductName', label: 'Nombre del Producto', desc: 'Título o descripción corta del entregable.' },
                        { key: 'showIndicator', label: 'Indicador Verificable', desc: 'Métrica de cumplimiento (ej: 1 Artículo Aceptado).' },
                        { key: 'showVerificationMeans', label: 'Medio de Verificación', desc: 'Evidencia (Certificado, DOI, Acta SENADI).' },
                        { key: 'showQuantity', label: 'Cantidad Planeada', desc: 'Número total de productos a entregar.' },
                        { key: 'showDeadline', label: 'Plazo / Trimestre', desc: 'Mes o trimestre programado de entrega.' },
                    ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between border-b border-border-thin/10 pb-2 last:border-0 last:pb-0">
                            <div>
                                <label className="text-xs font-semibold text-text-main block">{label}</label>
                                <span className="text-[9px] text-text-dim block leading-tight">{desc}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={cols[key] !== false}
                                onChange={e => handleColumnToggle(key, e.target.checked)}
                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Configuración de Categorías Aceptadas */}
            <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                    <Layers size={13} className="text-brand" />
                    Categorías de Productos Habilitadas
                </h5>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-thin/50">
                            <div className="flex items-center gap-2 min-w-0">
                                <input
                                    type="checkbox"
                                    checked={cat.enabled !== false}
                                    onChange={e => handleCategoryToggle(cat.id, e.target.checked)}
                                    className="w-3.5 h-3.5 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer shrink-0"
                                />
                                <span className={`text-[10.5px] font-medium truncate ${cat.enabled !== false ? 'text-text-main' : 'text-text-dim/50 line-through'}`}>
                                    {cat.name}
                                </span>
                            </div>
                            {cat.id.startsWith('cat_custom_') && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveCategory(cat.id)}
                                    className="p-1 text-text-dim hover:text-error transition-colors shrink-0"
                                    title="Eliminar categoría personalizada"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border-thin/30">
                    <input
                        type="text"
                        className={inputCls}
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="Nueva categoría personalizada..."
                    />
                    <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={!newCatName.trim()}
                        className="px-3 py-2 bg-text-main text-bg-deep rounded-md text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0 cursor-pointer flex items-center gap-1"
                    >
                        <Plus size={12} />
                        Añadir
                    </button>
                </div>
            </div>
        </div>
    );
};

