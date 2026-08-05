import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Pencil, Check, X, Shield } from 'lucide-react';
import type { DocumentBlock, ProgressStatusSubsection } from '../../types';
import { DEFAULT_PROGRESS_STATUS_SUBSECTIONS } from '../../types';

interface ProgressStatusPropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

export const ProgressStatusProperties: React.FC<ProgressStatusPropertiesProps> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};
    const headerColor = config.progressStatusHeaderColor || 'navy';

    const getActiveSections = (): ProgressStatusSubsection[] => {
        if (config.progressStatusSections && Array.isArray(config.progressStatusSections) && config.progressStatusSections.length > 0) {
            return config.progressStatusSections;
        }
        return DEFAULT_PROGRESS_STATUS_SUBSECTIONS;
    };

    const [sections, setSections] = useState<ProgressStatusSubsection[]>(getActiveSections);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ProgressStatusSubsection>>({});

    useEffect(() => {
        setSections(getActiveSections());
    }, [config.progressStatusSections]);

    const updateSections = (newSecs: ProgressStatusSubsection[]) => {
        setSections(newSecs);
        onUpdateConfig(block.id, 'progressStatusSections', newSecs);
    };

    const handleToggleEnabled = (id: string, enabled: boolean) => {
        const updated = sections.map(s => s.id === id ? { ...s, enabled } : s);
        updateSections(updated);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;
        const updated = [...sections];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        updateSections(updated);
    };

    const handleAccessRoleChange = (id: string, role: 'all' | 'director' | 'admin') => {
        const updated = sections.map(s => s.id === id ? { ...s, accessRole: role } : s);
        updateSections(updated);
    };

    return (
        <div className="space-y-6 text-xs">
            {/* Encabezado y Presets */}
            <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Sub-secciones de Estado y Observaciones ({sections.filter(s => s.enabled).length} de {sections.length})
                </label>
                <button
                    type="button"
                    onClick={() => updateSections(DEFAULT_PROGRESS_STATUS_SUBSECTIONS)}
                    className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                >
                    <RotateCcw className="w-3 h-3" /> Restablecer
                </button>
            </div>

            {/* Lista de Sub-secciones */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {sections.map((sec, idx) => (
                    <div
                        key={sec.id}
                        className={`p-3 rounded border transition-all ${
                            sec.enabled
                                ? 'border-slate-200 bg-white shadow-xs'
                                : 'border-slate-100 bg-slate-50 opacity-50'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <input
                                    type="checkbox"
                                    checked={sec.enabled}
                                    onChange={(e) => handleToggleEnabled(sec.id, e.target.checked)}
                                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                                />
                                <span className="font-bold text-slate-800 text-[11px] truncate">
                                    {sec.title}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
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
                                    disabled={idx === sections.length - 1}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                >
                                    <ArrowDown className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Rol de Acceso (Edición por Rol) */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-2">
                            <span className="text-[9.5px] font-semibold text-slate-500 flex items-center gap-1">
                                <Shield className="w-3 h-3 text-indigo-500" /> Permiso de Redacción:
                            </span>
                            <select
                                value={sec.accessRole || 'all'}
                                onChange={(e) => handleAccessRoleChange(sec.id, e.target.value as any)}
                                className="px-2 py-0.5 border border-slate-300 rounded text-[9.5px] bg-white font-medium text-slate-700"
                            >
                                <option value="all">Todos los Docentes</option>
                                <option value="director">Solo Director de Proyecto</option>
                                <option value="admin">Solo Admin DIITRA</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
