import React, { useState } from 'react';
import { Columns, Plus, Trash2, Layers, Pencil, Check, X, ArrowUp, ArrowDown, RotateCcw, Palette } from 'lucide-react';
import type { DocumentBlock } from '../../types';
import { HEADER_STYLE_OPTIONS } from '../canvasRenderers/RenderCover';

interface ExpectedProductsPropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

export interface ExpectedProductCategory {
    id: string;
    name: string;
    code: string;
    enabled: boolean;
    scribanVariable?: string;
    subtypes?: string[];
}

export const DEFAULT_PRODUCT_COLUMNS: Record<string, boolean> = {
    showCategory: true,
    showSubtype: true,
    showProductName: true,
    showSenadi: true,
    showTrl: true,
    showIndicator: true,
    showVerificationMeans: true,
    showQuantity: true,
    showDeadline: false,
};

export const DEFAULT_EXPECTED_PRODUCT_CATEGORIES: ExpectedProductCategory[] = [
    {
        id: 'cat_idi',
        name: 'I+D+i Aplicada (Prototipos Funcionales, Modelos de Utilidad, Plantas Piloto)',
        code: 'IDI_APLICADA',
        enabled: true,
        scribanVariable: 'productos.idi_aplicada',
        subtypes: ['Prototipo Funcional / Operativo', 'Modelo de Utilidad (SENADI)', 'Planta Piloto / Banco de Pruebas', 'Diseño Industrial / Maqueta Operativa']
    },
    {
        id: 'cat_senadi',
        name: 'Desarrollo de Software y Registro SENADI (Aplicaciones, Algoritmos, Derechos de Autor)',
        code: 'SOFTWARE_SENADI',
        enabled: true,
        scribanVariable: 'productos.software_senadi',
        subtypes: ['Aplicación Web / Móvil con Registro SENADI', 'Algoritmo / Sistema de Gestión', 'Base de Datos Especializada', 'Derecho de Autor de Software']
    },
    {
        id: 'cat_transferencia',
        name: 'Transferencia Tecnológica y Vinculación (Manuales Técnicos, Guías, Kits)',
        code: 'TRANSFERENCIA',
        enabled: true,
        scribanVariable: 'productos.transferencia',
        subtypes: ['Manual Técnico de Operación / Mantenimiento', 'Guía Metodológica / de Transferencia', 'Kit Tecnológico / Didáctico', 'Capacitación al Sector Productivo / Comunidad']
    },
    {
        id: 'cat_divulgacion',
        name: 'Divulgación Técnica y Publicaciones (Ponencias, Artículos Latindex, Guías)',
        code: 'DIVULGACION_TECNICA',
        enabled: true,
        scribanVariable: 'productos.divulgacion',
        subtypes: ['Ponencia en Evento / Congreso Técnico', 'Artículo Científico / Técnico (Latindex/Regional)', 'Guía de Prácticas de Laboratorio']
    },
    {
        id: 'cat_titulacion',
        name: 'Titulación & PIS (Proyectos Integradores de Saberes, Trabajos Prácticos)',
        code: 'TITULACION_PIS',
        enabled: true,
        scribanVariable: 'productos.titulacion',
        subtypes: ['Proyecto Integrador de Saberes (PIS)', 'Trabajo Práctico de Titulación / Caso Técnico']
    },
];

export function getNormalizedColumns(configCols?: any): Record<string, boolean> {
    if (!configCols || typeof configCols !== 'object') {
        return { ...DEFAULT_PRODUCT_COLUMNS };
    }
    return {
        ...DEFAULT_PRODUCT_COLUMNS,
        ...configCols,
    };
}

export function getNormalizedCategories(rawCategories?: any[]): ExpectedProductCategory[] {
    if (!Array.isArray(rawCategories) || rawCategories.length === 0) {
        return DEFAULT_EXPECTED_PRODUCT_CATEGORIES;
    }
    const hasOldCategories = rawCategories.some(c => ['cat_cientifico', 'cat_rrhh'].includes(c.id));
    if (hasOldCategories) {
        return DEFAULT_EXPECTED_PRODUCT_CATEGORIES;
    }
    return rawCategories;
}

const inputCls = "w-full text-[11px] bg-surface-hover/60 hover:bg-surface-hover/90 border border-border-thin rounded-md p-2 text-text-main focus:bg-surface focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all focus:outline-none";

export const ExpectedProductsProperties: React.FC<ExpectedProductsPropertiesProps> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};
    const productosTitle = config.productosTitle || '5. Productos y Entregables Esperados';
    const headerColor = config.headerColor || 'blue';

    const cols = getNormalizedColumns(config.productColumns);
    const rawCategories = config.productCategories || config.categories;
    const categories = getNormalizedCategories(rawCategories);

    // Estado para edición en línea de categorías
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ExpectedProductCategory>>({});

    // Estado para añadir nueva categoría
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatCode, setNewCatCode] = useState('');
    const [newCatScriban, setNewCatScriban] = useState('');

    const handleColumnToggle = (colKey: string, checked: boolean) => {
        const updatedCols = { ...cols, [colKey]: checked };
        onUpdateConfig(block.id, 'productColumns', updatedCols);
    };

    const handleCategoryToggle = (catId: string, enabled: boolean) => {
        const updatedCats = categories.map(cat => cat.id === catId ? { ...cat, enabled } : cat);
        onUpdateConfig(block.id, 'productCategories', updatedCats);
    };

    const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= categories.length) return;
        const updated = [...categories];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        onUpdateConfig(block.id, 'productCategories', updated);
    };

    const handleStartEdit = (cat: ExpectedProductCategory) => {
        setEditingCatId(cat.id);
        setEditForm({ ...cat });
    };

    const handleSaveEdit = () => {
        if (!editingCatId) return;
        const updatedCats = categories.map(cat => {
            if (cat.id === editingCatId) {
                return {
                    ...cat,
                    ...editForm,
                    name: editForm.name?.trim() || cat.name,
                    code: editForm.code?.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '') || cat.code,
                    scribanVariable: editForm.scribanVariable?.trim() || cat.scribanVariable,
                };
            }
            return cat;
        });
        onUpdateConfig(block.id, 'productCategories', updatedCats);
        setEditingCatId(null);
    };

    const handleAddCategory = () => {
        if (!newCatName.trim()) return;
        const codeClean = newCatCode.trim()
            ? newCatCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '')
            : `CUSTOM_${Date.now()}`;

        const scribanClean = newCatScriban.trim()
            ? newCatScriban.trim()
            : `productos.${codeClean.toLowerCase()}`;

        const newCat: ExpectedProductCategory = {
            id: `cat_custom_${Date.now()}`,
            name: newCatName.trim(),
            code: codeClean,
            enabled: true,
            scribanVariable: scribanClean,
            subtypes: ['Entregable Tecnológico General'],
        };
        const updatedCats = [...categories, newCat];
        onUpdateConfig(block.id, 'productCategories', updatedCats);
        setNewCatName('');
        setNewCatCode('');
        setNewCatScriban('');
        setIsAddingNew(false);
    };

    const handleRemoveCategory = (catId: string) => {
        const updatedCats = categories.filter(cat => cat.id !== catId);
        onUpdateConfig(block.id, 'productCategories', updatedCats);
    };

    const handleResetToDefault = () => {
        onUpdateConfig(block.id, 'productCategories', DEFAULT_EXPECTED_PRODUCT_CATEGORIES);
        onUpdateConfig(block.id, 'productColumns', DEFAULT_PRODUCT_COLUMNS);
    };

    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4 text-left">
            {/* SECCIÓN 0: ESTILO DE ENCABEZADO Y TÍTULO */}
            <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                    <Palette size={13} className="text-brand" />
                    Diseño y Estilo Visual en PDF
                </h5>

                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <label className="block text-[9px] font-bold text-text-dim uppercase">Estilo de Encabezado</label>
                        <select
                            value={headerColor}
                            onChange={e => onUpdateConfig(block.id, 'headerColor', e.target.value)}
                            className="w-full bg-surface border border-border-thin rounded px-2 py-1.5 text-xs text-text-main outline-none focus:border-text-main font-medium cursor-pointer"
                        >
                            {HEADER_STYLE_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-text-dim uppercase">Título de Sección</label>
                        <input
                            type="text"
                            className={inputCls}
                            value={productosTitle}
                            onChange={e => onUpdateConfig(block.id, 'productosTitle', e.target.value)}
                            placeholder="Ej: 5. Productos y Entregables del Proyecto"
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 1: CAMPOS Y COLUMNAS VISIBLES (CON VARIABLES SCRIBAN) */}
            <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                    <Columns size={13} className="text-brand" />
                    Campos Visibles en Formulario & Tabla PDF
                </h5>
                <div className="space-y-2">
                    {[
                        { key: 'showCategory', label: 'Categoría IST / CACES', scriban: 'categoria', desc: 'Clasificación por familia de entregable tecnológico.' },
                        { key: 'showSubtype', label: 'Subtipo de Entregable', scriban: 'tipo', desc: 'Ej: Prototipo, Software SENADI, Manual Técnico, Ponencia.' },
                        { key: 'showProductName', label: 'Nombre del Producto', scriban: 'titulo', desc: 'Título o descripción del resultado esperado.' },
                        { key: 'showSenadi', label: 'Propiedad Intelectual SENADI', scriban: 'requiere_senadi', desc: 'Registro de derecho de autor o modelo de utilidad.' },
                        { key: 'showTrl', label: 'Nivel TRL (Madurez Técnica)', scriban: 'trl', desc: 'Escala TRL 1 al TRL 9 de desarrollo tecnológico.' },
                        { key: 'showIndicator', label: 'Indicador Verificable CACES', scriban: 'indicador', desc: 'Métrica de auditoría e impacto.' },
                        { key: 'showVerificationMeans', label: 'Medio de Verificación', scriban: 'medio_verificacion', desc: 'Evidencia (Certificado SENADI, Repositorio DSpace).' },
                        { key: 'showQuantity', label: 'Cantidad Planeada', scriban: 'cantidad', desc: 'Número total de entregables a generar.' },
                        { key: 'showDeadline', label: 'Plazo / Trimestre', scriban: 'plazo', desc: 'Mes o trimestre programado de entrega.' },
                    ].map(({ key, label, scriban, desc }) => (
                        <div key={key} className="flex items-center justify-between border-b border-border-thin/10 pb-2 last:border-0 last:pb-0">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <label className="text-xs font-semibold text-text-main block">{label}</label>
                                    <span className="text-[8px] font-mono bg-surface-hover/80 text-text-dim px-1 rounded border border-border-thin">
                                        {`{{ ${scriban} }}`}
                                    </span>
                                </div>
                                <span className="text-[9px] text-text-dim block leading-tight">{desc}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={cols[key] !== false}
                                onChange={e => handleColumnToggle(key, e.target.checked)}
                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer shrink-0"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN 2: GESTIÓN INTERACTIVA DE CATEGORÍAS & SUBTIPOS */}
            <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                        <Layers size={13} className="text-brand" />
                        Categorías & Subtipos IST
                    </h5>
                    <button
                        type="button"
                        onClick={handleResetToDefault}
                        className="text-[9.5px] font-semibold text-text-dim hover:text-brand flex items-center gap-1 transition-colors cursor-pointer"
                        title="Restablecer a categorías de fábrica CACES/SENADI"
                    >
                        <RotateCcw size={10} />
                        <span>Restablecer</span>
                    </button>
                </div>

                {/* Lista de Categorías con Reordenamiento y Edición */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {categories.map((cat, idx) => {
                        const isEditing = editingCatId === cat.id;

                        if (isEditing) {
                            return (
                                <div key={cat.id} className="p-3 rounded-lg bg-surface border border-brand/50 space-y-2.5 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Editando Categoría</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={handleSaveEdit}
                                                className="p-1 bg-brand text-white rounded hover:opacity-90 transition-opacity cursor-pointer"
                                                title="Guardar cambios"
                                            >
                                                <Check size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingCatId(null)}
                                                className="p-1 bg-surface-hover text-text-dim rounded hover:text-text-main transition-colors cursor-pointer"
                                                title="Cancelar"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-text-dim uppercase block">Nombre de Categoría</label>
                                        <input
                                            type="text"
                                            value={editForm.name || ''}
                                            onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-text-dim uppercase block">Código Único</label>
                                            <input
                                                type="text"
                                                value={editForm.code || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-text-dim uppercase block">Variable Scriban (PDF)</label>
                                            <input
                                                type="text"
                                                value={editForm.scribanVariable || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, scribanVariable: e.target.value }))}
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-thin/50 hover:border-border-hover/80 transition-all">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={cat.enabled !== false}
                                        onChange={e => handleCategoryToggle(cat.id, e.target.checked)}
                                        className="w-3.5 h-3.5 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <span className={`text-[10.5px] font-medium block truncate ${cat.enabled !== false ? 'text-text-main font-semibold' : 'text-text-dim/50 line-through'}`}>
                                            {cat.name}
                                        </span>
                                        {cat.scribanVariable && (
                                            <span className="text-[8px] font-mono text-text-dim/70 block">
                                                {`{{ ${cat.scribanVariable} }}`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button
                                        type="button"
                                        onClick={() => handleMoveCategory(idx, 'up')}
                                        disabled={idx === 0}
                                        className="p-1 text-text-dim hover:text-text-main disabled:opacity-20 transition-colors cursor-pointer"
                                        title="Mover arriba"
                                    >
                                        <ArrowUp size={11} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMoveCategory(idx, 'down')}
                                        disabled={idx === categories.length - 1}
                                        className="p-1 text-text-dim hover:text-text-main disabled:opacity-20 transition-colors cursor-pointer"
                                        title="Mover abajo"
                                    >
                                        <ArrowDown size={11} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStartEdit(cat)}
                                        className="p-1 text-text-dim hover:text-brand transition-colors cursor-pointer"
                                        title="Editar en línea"
                                    >
                                        <Pencil size={11} />
                                    </button>
                                    {cat.id.startsWith('cat_custom_') && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCategory(cat.id)}
                                            className="p-1 text-text-dim hover:text-error transition-colors cursor-pointer"
                                            title="Eliminar categoría personalizada"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Formulario para Añadir Nueva Categoría */}
                {isAddingNew ? (
                    <div className="p-3 rounded-lg bg-surface border border-brand/50 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Nueva Categoría Personalizada</span>
                            <button
                                type="button"
                                onClick={() => setIsAddingNew(false)}
                                className="p-1 text-text-dim hover:text-text-main transition-colors cursor-pointer"
                            >
                                <X size={12} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            placeholder="Nombre de la categoría..."
                            className={inputCls}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={newCatCode}
                                onChange={e => setNewCatCode(e.target.value)}
                                placeholder="Código (ej. CUSTOM_ID)"
                                className={inputCls}
                            />
                            <input
                                type="text"
                                value={newCatScriban}
                                onChange={e => setNewCatScriban(e.target.value)}
                                placeholder="Variable Scriban"
                                className={inputCls}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddCategory}
                            disabled={!newCatName.trim()}
                            className="w-full py-1.5 bg-brand text-white rounded text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
                        >
                            <Plus size={12} />
                            Guardar Categoría
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsAddingNew(true)}
                        className="w-full py-2 bg-surface hover:bg-surface-hover border border-dashed border-border-thin rounded-lg text-xs font-semibold text-text-main transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        <Plus size={12} />
                        Añadir Categoría Personalizada
                    </button>
                )}
            </div>
        </div>
    );
};
