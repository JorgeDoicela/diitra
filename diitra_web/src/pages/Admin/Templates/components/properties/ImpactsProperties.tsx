import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Pencil, Check, X, Layers, Layout, Target } from 'lucide-react';
import type { DocumentBlock, ImpactCategory } from '../../types';
import { DEFAULT_IMPACT_CATEGORIES } from '../../types';

interface ImpactsPropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

const inputCls = "w-full text-[11px] bg-surface-hover/60 hover:bg-surface-hover/90 border border-border-thin rounded-md p-2 text-text-main focus:bg-surface focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all focus:outline-none";
const selectCls = "w-full text-[11px] bg-surface-hover/60 hover:bg-surface-hover/90 border border-border-thin rounded-md p-2 text-text-main focus:bg-surface focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all focus:outline-none";

export const ImpactsProperties: React.FC<ImpactsPropertiesProps> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};
    const layoutMode = config.impactLayoutMode || 'table';

    const getActiveCategories = (): ImpactCategory[] => {
        if (config.impactCategories && Array.isArray(config.impactCategories) && config.impactCategories.length > 0) {
            return config.impactCategories;
        }

        return DEFAULT_IMPACT_CATEGORIES.map(def => {
            const legacyVal = def.legacyKey ? (config as any)[def.legacyKey] : undefined;
            return {
                ...def,
                enabled: legacyVal !== undefined ? Boolean(legacyVal) : def.enabled,
            };
        });
    };

    const [categories, setCategories] = useState<ImpactCategory[]>(getActiveCategories);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ImpactCategory>>({});
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newForm, setNewForm] = useState<Partial<ImpactCategory>>({
        key: '',
        title: '',
        placeholder: 'Descripción del impacto...',
        enabled: true,
        colSpan: 2,
    });

    useEffect(() => {
        setCategories(getActiveCategories());
    }, [config.impactCategories]);

    const updateCategories = (newCats: ImpactCategory[]) => {
        setCategories(newCats);
        onUpdateConfig(block.id, 'impactCategories', newCats);
    };

    const handleToggleEnabled = (id: string, enabled: boolean) => {
        const updated = categories.map(c => c.id === id ? { ...c, enabled } : c);
        updateCategories(updated);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;
        const updated = [...categories];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIndex, 0, moved);
        updateCategories(updated);
    };

    const handleStartEdit = (cat: ImpactCategory) => {
        setEditingId(cat.id);
        setEditForm({ ...cat });
    };

    const handleSaveEdit = (id: string) => {
        if (!editForm.title?.trim()) return;
        const keyClean = editForm.key?.trim() || editForm.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const scribanVar = `impacto.${keyClean}`;

        const updated = categories.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    ...editForm,
                    title: editForm.title!.trim(),
                    key: keyClean,
                    scribanVariable: scribanVar,
                } as ImpactCategory;
            }
            return c;
        });
        updateCategories(updated);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        const updated = categories.filter(c => c.id !== id);
        updateCategories(updated);
    };

    const handleAddCategory = () => {
        if (!newForm.title?.trim()) return;
        const rawTitle = newForm.title.trim();
        const keyClean = newForm.key?.trim() || rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const scribanVar = `impacto.${keyClean}`;

        const newCat: ImpactCategory = {
            id: `imp_custom_${Date.now()}`,
            key: keyClean,
            title: rawTitle,
            placeholder: newForm.placeholder || 'Descripción del impacto...',
            enabled: true,
            scribanVariable: scribanVar,
            colSpan: (newForm.colSpan as 1 | 2) || 2,
        };

        const updated = [...categories, newCat];
        updateCategories(updated);
        setIsAddingNew(false);
        setNewForm({
            key: '',
            title: '',
            placeholder: 'Descripción del impacto...',
            enabled: true,
            colSpan: 2,
        });
    };

    const handleResetToDefault = () => {
        if (window.confirm('¿Restablecer la Matriz de Impactos a la estructura estándar institucional ISTPET?')) {
            updateCategories(DEFAULT_IMPACT_CATEGORIES);
        }
    };

    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4 text-left">
            {/* MODO DE PRESENTACIÓN VISUAL */}
            <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                    <Layout size={13} className="text-brand" />
                    Diseño de Matriz de Impacto
                </h5>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'table', label: 'Tabla Clásica', desc: 'Reticular' },
                        { id: 'cards', label: 'Tarjetas Bento', desc: 'Modulares' },
                        { id: 'sections', label: 'Consecutivo', desc: 'Párrafos' },
                    ].map(mode => (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => onUpdateConfig(block.id, 'impactLayoutMode', mode.id)}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                layoutMode === mode.id
                                    ? 'border-brand bg-brand/10 text-text-main font-bold shadow-xs'
                                    : 'border-border-thin bg-surface hover:bg-surface-hover text-text-dim'
                            }`}
                        >
                            <span className="text-[10px] block font-bold">{mode.label}</span>
                            <span className="text-[8px] text-text-dim block opacity-80">{mode.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* GESTIÓN DE CATEGORÍAS DE IMPACTO */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                        <Layers size={13} className="text-brand" />
                        Categorías de Impacto ({categories.length})
                    </h5>
                    <button
                        type="button"
                        onClick={handleResetToDefault}
                        className="text-[9px] text-text-dim hover:text-brand flex items-center gap-1 transition-colors cursor-pointer"
                        title="Restablecer categorías originales ISTPET"
                    >
                        <RotateCcw size={10} /> Restablecer
                    </button>
                </div>

                <div className="space-y-2">
                    {categories.map((cat, index) => {
                        const isEditing = editingId === cat.id;

                        if (isEditing) {
                            return (
                                <div key={cat.id} className="p-3 bg-surface border border-brand rounded-xl space-y-2 animate-fade-in shadow-sm">
                                    <div className="flex justify-between items-center pb-1 border-b border-border-thin">
                                        <span className="text-[10px] font-bold text-brand uppercase">Editando Categoría</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEdit(cat.id)}
                                                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                                                title="Guardar"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingId(null)}
                                                className="p-1 text-error hover:bg-error/10 rounded"
                                                title="Cancelar"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-text-dim uppercase">Nombre / Título Visible</label>
                                            <input
                                                type="text"
                                                className={inputCls}
                                                value={editForm.title || ''}
                                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                placeholder="Ej: Impacto Tecnológico"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] font-bold text-text-dim uppercase">Clave Backend / Yjs</label>
                                                <input
                                                    type="text"
                                                    className={inputCls}
                                                    value={editForm.key || ''}
                                                    onChange={e => setEditForm({ ...editForm, key: e.target.value })}
                                                    placeholder="tecnologico"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-text-dim uppercase">Ancho Fila</label>
                                                <select
                                                    className={selectCls}
                                                    value={editForm.colSpan || 2}
                                                    onChange={e => setEditForm({ ...editForm, colSpan: Number(e.target.value) as 1 | 2 })}
                                                >
                                                    <option value={2}>Fila Completa (100%)</option>
                                                    <option value={1}>Media Fila (50%)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-text-dim uppercase">Guía de Redacción (Placeholder)</label>
                                            <input
                                                type="text"
                                                className={inputCls}
                                                value={editForm.placeholder || ''}
                                                onChange={e => setEditForm({ ...editForm, placeholder: e.target.value })}
                                                placeholder="Instrucción de lo que debe redactar el usuario..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={cat.id}
                                className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                                    cat.enabled
                                        ? 'bg-surface hover:bg-surface-hover border-border-thin'
                                        : 'bg-surface/40 border-border-thin/40 opacity-50'
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={cat.enabled}
                                        onChange={e => handleToggleEnabled(cat.id, e.target.checked)}
                                        className="w-3.5 h-3.5 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                                        title={cat.enabled ? 'Desactivar apartado' : 'Activar apartado'}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-text-main truncate">{cat.title}</span>
                                            <span className="text-[8px] font-mono bg-surface-hover text-text-dim px-1 rounded border border-border-thin">{cat.key}</span>
                                        </div>
                                        {cat.placeholder && (
                                            <span className="text-[8.5px] text-text-dim block truncate">{cat.placeholder}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleMove(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 text-text-dim hover:text-text-main disabled:opacity-20 cursor-pointer"
                                        title="Subir"
                                    >
                                        <ArrowUp size={12} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMove(index, 'down')}
                                        disabled={index === categories.length - 1}
                                        className="p-1 text-text-dim hover:text-text-main disabled:opacity-20 cursor-pointer"
                                        title="Bajar"
                                    >
                                        <ArrowDown size={12} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStartEdit(cat)}
                                        className="p-1 text-text-dim hover:text-brand cursor-pointer"
                                        title="Editar"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-1 text-text-dim hover:text-error cursor-pointer"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* BOTÓN PARA AÑADIR NUEVA CATEGORÍA */}
                {isAddingNew ? (
                    <div className="p-3 bg-surface border border-brand/50 rounded-xl space-y-2 animate-fade-in mt-2">
                        <div className="flex justify-between items-center pb-1 border-b border-border-thin">
                            <span className="text-[10px] font-bold text-brand uppercase">Nueva Categoría de Impacto</span>
                            <button
                                type="button"
                                onClick={() => setIsAddingNew(false)}
                                className="p-1 text-text-dim hover:text-error"
                            >
                                <X size={12} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <label className="text-[9px] font-bold text-text-dim uppercase">Nombre / Título Visible *</label>
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={newForm.title || ''}
                                    onChange={e => setNewForm({ ...newForm, title: e.target.value })}
                                    placeholder="Ej: Impacto Tecnológico e Innovación"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] font-bold text-text-dim uppercase">Clave Backend / Yjs</label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={newForm.key || ''}
                                        onChange={e => setNewForm({ ...newForm, key: e.target.value })}
                                        placeholder="tecnologico"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-text-dim uppercase">Ancho Fila</label>
                                    <select
                                        className={selectCls}
                                        value={newForm.colSpan || 2}
                                        onChange={e => setNewForm({ ...newForm, colSpan: Number(e.target.value) as 1 | 2 })}
                                    >
                                        <option value={2}>Fila Completa (100%)</option>
                                        <option value={1}>Media Fila (50%)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-text-dim uppercase">Guía de Redacción (Placeholder)</label>
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={newForm.placeholder || ''}
                                    onChange={e => setNewForm({ ...newForm, placeholder: e.target.value })}
                                    placeholder="Detallar el alcance tecnológico..."
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddCategory}
                                className="w-full py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                            >
                                <Plus size={14} /> Añadir Categoría de Impacto
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsAddingNew(true)}
                        className="w-full py-2 bg-surface-hover/50 hover:bg-surface-hover border border-dashed border-border-thin rounded-xl text-text-main text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
                    >
                        <Plus size={14} className="text-brand" /> Agregar Categoría de Impacto Personalizada
                    </button>
                )}
            </div>
        </div>
    );
};
