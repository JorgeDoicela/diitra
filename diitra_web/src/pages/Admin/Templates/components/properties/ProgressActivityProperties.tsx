import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Pencil, Check, X } from 'lucide-react';
import type { DocumentBlock, ProgressActivityColumn, ProgressActivityVariant } from '../../types';
import { DEFAULT_ACTIVITY_COLUMNS } from '../../types';

interface ProgressActivityPropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

export const ProgressActivityProperties: React.FC<ProgressActivityPropertiesProps> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};
    const variant: ProgressActivityVariant = config.activityVariant || 'ejecutadas';
    const headerColor = config.activityHeaderColor || 'navy';
    const tableTitle = config.activityTableTitle || '';

    const getActiveColumns = (): ProgressActivityColumn[] => {
        if (config.activityColumns && Array.isArray(config.activityColumns) && config.activityColumns.length > 0) {
            return config.activityColumns;
        }
        return DEFAULT_ACTIVITY_COLUMNS;
    };

    const [columns, setColumns] = useState<ProgressActivityColumn[]>(getActiveColumns);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ProgressActivityColumn>>({});

    useEffect(() => {
        setColumns(getActiveColumns());
    }, [config.activityColumns]);

    const updateColumns = (newCols: ProgressActivityColumn[]) => {
        setColumns(newCols);
        onUpdateConfig(block.id, 'activityColumns', newCols);
    };

    const handleVariantChange = (newVariant: ProgressActivityVariant) => {
        onUpdateConfig(block.id, 'activityVariant', newVariant);
        // Ajustar columnas recomendadas por defecto según la variante seleccionada
        const autoAdjusted = columns.map(c => {
            if (newVariant === 'no_previstas') {
                if (c.fieldKey === 'ObjetivoAsociado') return { ...c, enabled: true };
                if (c.fieldKey === 'Limitacion') return { ...c, enabled: false };
            } else if (newVariant === 'obstaculos') {
                if (c.fieldKey === 'ObjetivoAsociado') return { ...c, enabled: true };
                if (c.fieldKey === 'Limitacion') return { ...c, enabled: true };
            } else {
                if (c.fieldKey === 'ObjetivoAsociado' || c.fieldKey === 'Limitacion') return { ...c, enabled: false };
            }
            return c;
        });
        updateColumns(autoAdjusted);
    };

    const handleToggleEnabled = (id: string, enabled: boolean) => {
        const updated = columns.map(c => c.id === id ? { ...c, enabled } : c);
        updateColumns(updated);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= columns.length) return;
        const updated = [...columns];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        updateColumns(updated);
    };

    const handleStartEdit = (col: ProgressActivityColumn) => {
        setEditingId(col.id);
        setEditForm({ ...col });
    };

    const handleSaveEdit = () => {
        if (!editingId) return;
        const updated = columns.map(c => c.id === editingId ? { ...c, ...editForm } : c);
        updateColumns(updated);
        setEditingId(null);
    };

    return (
        <div className="space-y-6 text-xs">
            {/* Selector de Variante */}
            <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Variante de la Matriz de Actividades
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                    {[
                        { id: 'ejecutadas', label: '1. EJECUTADAS', desc: 'Planificadas' },
                        { id: 'no_previstas', label: '2. NO PREVISTAS', desc: 'Sufijo NP' },
                        { id: 'obstaculos', label: '3. OBSTÁCULOS', desc: 'Sufijo OBS' },
                    ].map(v => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => handleVariantChange(v.id as ProgressActivityVariant)}
                            className={`p-2 rounded text-left transition-all border ${
                                variant === v.id
                                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className="font-bold text-[10px] text-slate-800">{v.label}</div>
                            <div className="text-[8.5px] text-slate-500">{v.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Título Personalizable */}
            <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Título Personalizado del Encabezado (Opcional)
                </label>
                <input
                    type="text"
                    value={tableTitle}
                    onChange={(e) => onUpdateConfig(block.id, 'activityTableTitle', e.target.value)}
                    placeholder="Ej: MATRIZ DE ACTIVIDADES EJECUTADAS"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-[11px] focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* Columnas de la Matriz */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Columnas Habilitadas ({columns.filter(c => c.enabled).length} de {columns.length})
                    </label>
                    <button
                        type="button"
                        onClick={() => updateColumns(DEFAULT_ACTIVITY_COLUMNS)}
                        className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                    >
                        <RotateCcw className="w-3 h-3" /> Restablecer
                    </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {columns.map((col, idx) => (
                        <div
                            key={col.id}
                            className={`p-2.5 rounded border transition-all ${
                                col.enabled
                                    ? 'border-slate-200 bg-white shadow-xs'
                                    : 'border-slate-100 bg-slate-50 opacity-50'
                            }`}
                        >
                            {editingId === col.id ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={editForm.label || ''}
                                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                        className="w-full px-2 py-1 border border-indigo-400 rounded text-[11px]"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editForm.requirementText || ''}
                                            onChange={(e) => setEditForm({ ...editForm, requirementText: e.target.value })}
                                            placeholder="Texto Requisito (ej: DETALLAR EVIDENCIAS)"
                                            className="flex-1 px-2 py-1 border border-slate-300 rounded text-[9.5px]"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveEdit}
                                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <input
                                            type="checkbox"
                                            checked={col.enabled}
                                            onChange={(e) => handleToggleEnabled(col.id, e.target.checked)}
                                            className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-slate-800 text-[11px] truncate">
                                                {col.label}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-mono truncate">
                                                {col.fieldType} • Ancho: {col.colWidthPct || 'Auto'}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(col)}
                                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMove(idx, 'up')}
                                            disabled={idx === 0}
                                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                        >
                                            <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMove(idx, 'down')}
                                            disabled={idx === columns.length - 1}
                                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                        >
                                            <ArrowDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
