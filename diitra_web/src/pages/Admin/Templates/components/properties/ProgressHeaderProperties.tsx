import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, Check, X, RotateCcw } from 'lucide-react';
import type { DocumentBlock, ProgressHeaderField } from '../../types';
import { DEFAULT_PROGRESS_HEADER_FIELDS } from '../../types';
import { ColorPickerField } from './SharedColorPicker';

interface ProgressHeaderPropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

export const ProgressHeaderProperties: React.FC<ProgressHeaderPropertiesProps> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};
    const headerColor = config.progressHeaderColor || '#222c57';
    const borderStyle = config.progressHeaderBorder || 'solid';

    const getActiveFields = (): ProgressHeaderField[] => {
        if (config.progressHeaderFields && Array.isArray(config.progressHeaderFields) && config.progressHeaderFields.length > 0) {
            return config.progressHeaderFields;
        }
        return DEFAULT_PROGRESS_HEADER_FIELDS;
    };

    const [fields, setFields] = useState<ProgressHeaderField[]>(getActiveFields);

    useEffect(() => {
        setFields(getActiveFields());
    }, [config.progressHeaderFields]);

    const updateFields = (newFields: ProgressHeaderField[]) => {
        setFields(newFields);
        onUpdateConfig(block.id, 'progressHeaderFields', newFields);
    };

    const handleToggleEnabled = (id: string, enabled: boolean) => {
        const updated = fields.map(f => f.id === id ? { ...f, enabled } : f);
        updateFields(updated);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= fields.length) return;
        const updated = [...fields];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        updateFields(updated);
    };

    const handleSpanChange = (id: string, colSpan: 1 | 2) => {
        const updated = fields.map(f => f.id === id ? { ...f, colSpan } : f);
        updateFields(updated);
    };

    return (
        <div className="space-y-6 text-xs font-sans">
            {/* Color del Encabezado */}
            <ColorPickerField
                label="Color del Encabezado"
                value={headerColor}
                onChange={val => onUpdateConfig(block.id, 'progressHeaderColor', val)}
            />

            {/* Subsecciones / Campos de Identificación */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Campos de Identificación ({fields.filter(f => f.enabled).length} de {fields.length})
                    </label>
                    <button
                        type="button"
                        onClick={() => updateFields(DEFAULT_PROGRESS_HEADER_FIELDS)}
                        className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                        title="Restablecer a campos institucionales estándar"
                    >
                        <RotateCcw className="w-3 h-3" /> Restablecer
                    </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {fields.map((field, idx) => (
                        <div
                            key={field.id}
                            className={`p-2.5 rounded border transition-all flex items-center justify-between gap-2 ${
                                field.enabled
                                    ? 'border-slate-200 bg-white shadow-xs'
                                    : 'border-slate-100 bg-slate-50 opacity-50'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <input
                                    type="checkbox"
                                    checked={field.enabled}
                                    onChange={(e) => handleToggleEnabled(field.id, e.target.checked)}
                                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                                />
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-slate-800 text-[11px] truncate">
                                        {field.label}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono truncate">
                                        {field.readOnly ? 'Auto-poblado' : field.fieldType} • colSpan: {field.colSpan}
                                    </span>
                                </div>
                            </div>

                            {/* Controles de orden y colSpan */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleSpanChange(field.id, field.colSpan === 1 ? 2 : 1)}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        field.colSpan === 2 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                                    }`}
                                    title="Alternar ancho: 50% vs 100%"
                                >
                                    {field.colSpan === 2 ? '100%' : '50%'}
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
                                    disabled={idx === fields.length - 1}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                >
                                    <ArrowDown className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

