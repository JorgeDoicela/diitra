import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Pencil, Check, X, Layers, Palette, FileText, Sparkles, Landmark } from 'lucide-react';
import type { DocumentBlock, TechnicalSubsection } from '../../types';
import { DEFAULT_TECHNICAL_SUBSECTIONS } from '../../types';

interface ProjectTechnicalPropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

export const ProjectTechnicalProperties: React.FC<ProjectTechnicalPropertiesProps> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};
    const layoutMode = config.technicalLayoutMode || 'table_2col';
    const headerColor = config.technicalHeaderColor || 'navy';

    const getActiveSections = (): TechnicalSubsection[] => {
        if (config.technicalSections && Array.isArray(config.technicalSections) && config.technicalSections.length > 0) {
            return config.technicalSections;
        }

        return DEFAULT_TECHNICAL_SUBSECTIONS.map(def => {
            const legacyVal = def.legacyKey ? (config as any)[def.legacyKey] : undefined;
            return {
                ...def,
                enabled: legacyVal !== undefined ? Boolean(legacyVal) : def.enabled,
            };
        });
    };

    const [sections, setSections] = useState<TechnicalSubsection[]>(getActiveSections);

    useEffect(() => {
        setSections(getActiveSections());
    }, [config.technicalSections]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<TechnicalSubsection>>({});
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newForm, setNewForm] = useState<Partial<TechnicalSubsection>>({
        numberPrefix: `3.${sections.length + 1}`,
        title: '',
        fieldKey: '',
        scribanVariable: '',
        placeholder: 'Redactar apartado...',
        requirementText: '',
        enabled: true,
        colSpan: 2,
        variant: 'standard',
    });

    const updateSections = (newSecs: TechnicalSubsection[]) => {
        setSections(newSecs);
        onUpdateConfig(block.id, 'technicalSections', newSecs);
    };

    const handleToggleEnabled = (id: string, enabled: boolean) => {
        const updated = sections.map(s => s.id === id ? { ...s, enabled } : s);
        updateSections(updated);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= sections.length) return;
        const updated = [...sections];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIndex, 0, moved);
        updateSections(updated);
    };

    const cleanAutoKeyAndScriban = (rawTitle: string, inputFieldKey?: string, inputScriban?: string) => {
        let titleClean = rawTitle.trim();
        const numMatch = titleClean.match(/^(\d+(\.\d+)*)\s+(.*)/);
        if (numMatch) {
            titleClean = numMatch[3].trim();
        }

        const autoKey = inputFieldKey?.trim() || titleClean.replace(/[^a-zA-Z0-9]/g, '');

        let autoScriban = inputScriban?.trim();
        if (!autoScriban) {
            autoScriban = titleClean
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "_")
                .replace(/_+/g, "_")
                .replace(/^_+|_+$/g, "");

            if (!autoScriban || /^\d/.test(autoScriban)) {
                autoScriban = `sec_${autoScriban || 'custom'}`;
            }
        }

        return { autoKey, autoScriban };
    };

    const handleStartEdit = (sec: TechnicalSubsection) => {
        setEditingId(sec.id);
        setEditForm({ ...sec });
    };

    const handleDelete = (id: string) => {
        const updated = sections.filter(s => s.id !== id);
        updateSections(updated);
    };

    const handleResetPresets = () => {
        updateSections(DEFAULT_TECHNICAL_SUBSECTIONS);
    };

    const handleSaveEdit = () => {
        if (!editingId) return;
        const titleClean = editForm.title?.trim() || '';
        const { autoKey, autoScriban } = cleanAutoKeyAndScriban(titleClean, editForm.fieldKey, editForm.scribanVariable);

        const updated = sections.map(s => {
            if (s.id === editingId) {
                return {
                    ...s,
                    ...editForm,
                    title: titleClean,
                    fieldKey: autoKey,
                    scribanVariable: autoScriban,
                } as TechnicalSubsection;
            }
            return s;
        });
        updateSections(updated);
        setEditingId(null);
    };

    const handleAddNew = () => {
        if (!newForm.title?.trim()) return;
        const titleClean = newForm.title.trim();
        const { autoKey, autoScriban } = cleanAutoKeyAndScriban(titleClean, newForm.fieldKey, newForm.scribanVariable);

        const newSec: TechnicalSubsection = {
            id: `sec_${Date.now()}`,
            numberPrefix: newForm.numberPrefix?.trim() || '3.9',
            title: titleClean,
            fieldKey: autoKey,
            scribanVariable: autoScriban,
            placeholder: newForm.placeholder || 'Redactar apartado...',
            requirementText: newForm.requirementText || '',
            enabled: true,
            colSpan: newForm.colSpan || 2,
            variant: newForm.variant || 'standard',
        };

        updateSections([...sections, newSec]);
        setIsAddingNew(false);
        setNewForm({
            numberPrefix: `3.${sections.length + 1}`,
            title: '',
            fieldKey: '',
            scribanVariable: '',
            placeholder: 'Redactar apartado...',
            requirementText: '',
            enabled: true,
            colSpan: 2,
            variant: 'standard',
        });
    };

    const handleToggleColSpan = (id: string) => {
        const updated = sections.map(s => {
            if (s.id === id) {
                return { ...s, colSpan: (s.colSpan === 1 ? 2 : 1) } as TechnicalSubsection;
            }
            return s;
        });
        updateSections(updated);
    };

    const handleCycleVariant = (id: string) => {
        const variants: TechnicalSubsection['variant'][] = ['standard', 'banner_gold', 'banner_navy'];
        const updated = sections.map(s => {
            if (s.id === id) {
                const currentIdx = variants.indexOf(s.variant || 'standard');
                const nextVariant = variants[(currentIdx + 1) % variants.length];
                return { ...s, variant: nextVariant } as TechnicalSubsection;
            }
            return s;
        });
        updateSections(updated);
    };

    return (
        <div className="space-y-5 border-t border-border-thin/20 pt-4 font-sans">


            <div className="space-y-2">
                <label className="text-[11px] font-bold text-text-main flex items-center gap-1.5 uppercase tracking-wider">
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    Color de Celda / Encabezado Temático
                </label>
                <div className="flex items-center gap-3 bg-surface border border-border-thin rounded-md p-2 w-max">
                    {[
                        { id: 'navy', name: 'Azul Traversari (#1e2a4a)', hex: '#1e2a4a' },
                        { id: 'gold', name: 'Dorado Acreditación (#b8912e)', hex: '#b8912e' },
                        { id: 'slate', name: 'Gris Ejecutivo (#334155)', hex: '#334155' },
                    ].map(c => {
                        const isSel = headerColor === c.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => onUpdateConfig(block.id, 'technicalHeaderColor', c.id)}
                                className={`relative w-6 h-6 rounded-full transition-all flex items-center justify-center cursor-pointer ${isSel ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-surface scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'
                                    }`}
                                title={c.name}
                            >
                                <div className="w-full h-full rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                                {isSel && <span className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. GESTIÓN DIRECTA DE SUB-SECCIONES */}
            <div className="space-y-3 pt-2 border-t border-border-thin/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h5 className="text-[11px] font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            Sub-secciones de la Matriz
                        </h5>
                    </div>
                    <button
                        type="button"
                        onClick={handleResetPresets}
                        className="text-[9px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 bg-indigo-500/10 rounded border border-indigo-500/20 transition-colors"
                        title="Restablecer al formato estándar oficial"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                </div>

                {/* Lista de Subsecciones con Controles Pills Directos */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                    {sections.map((sec, idx) => {
                        const isEditing = editingId === sec.id;
                        return (
                            <div
                                key={sec.id}
                                className={`p-2.5 rounded-lg border transition-all ${isEditing
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : sec.enabled
                                        ? 'border-border-thin/40 bg-surface-hover/20 hover:border-border-thin'
                                        : 'border-border-thin/20 bg-surface/30 opacity-60'
                                    }`}
                            >
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="col-span-1">
                                                <label className="text-[9px] font-bold text-text-dim block mb-0.5">Prefijo</label>
                                                <input
                                                    type="text"
                                                    value={editForm.numberPrefix || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, numberPrefix: e.target.value }))}
                                                    className="w-full text-xs font-mono px-2 py-1 bg-surface border border-border-thin rounded focus:outline-none focus:border-indigo-500 text-text-main"
                                                    placeholder="3.1"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-[9px] font-bold text-text-dim block mb-0.5">Título de la Subsección</label>
                                                <input
                                                    type="text"
                                                    value={editForm.title || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                                    className="w-full text-xs font-semibold px-2 py-1 bg-surface border border-border-thin rounded focus:outline-none focus:border-indigo-500 text-text-main"
                                                    placeholder="Nombre de subsección"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[9px] font-bold text-text-dim block mb-0.5">Texto de Requisito / Guía Visible</label>
                                            <textarea
                                                rows={2}
                                                value={editForm.requirementText || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, requirementText: e.target.value }))}
                                                className="w-full text-[10px] px-2 py-1 bg-surface border border-border-thin rounded focus:outline-none focus:border-indigo-500 text-text-main"
                                                placeholder="Ej: DETALLAR EN DOS PÁRRAFOS..."
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 py-1 border-t border-border-thin/20">
                                            <label className="text-[10px] font-bold text-text-main flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.hasContent !== false}
                                                    onChange={e => setEditForm(prev => ({ ...prev, hasContent: e.target.checked }))}
                                                    className="w-3.5 h-3.5 text-indigo-500 accent-indigo-500 rounded cursor-pointer"
                                                />
                                                <span>¿Tiene Campo Redactable?</span>
                                            </label>
                                            <span className="text-[8.5px] text-text-dim">
                                                (Si desmarca, actuará como banner/encabezado puro)
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border-thin/20">
                                            <button
                                                type="button"
                                                onClick={() => setEditingId(null)}
                                                className="px-2 py-1 text-[10px] font-semibold text-text-dim hover:text-text-main"
                                            >
                                                <X className="w-3 h-3 inline mr-0.5" /> Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveEdit}
                                                className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-sm"
                                            >
                                                <Check className="w-3 h-3 inline mr-0.5" /> Guardar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={sec.enabled}
                                                onChange={e => handleToggleEnabled(sec.id, e.target.checked)}
                                                className="w-4 h-4 text-indigo-500 accent-indigo-500 bg-surface border-border-thin rounded cursor-pointer"
                                            />
                                            {sec.numberPrefix && (
                                                <span className="text-[10px] font-mono font-bold text-indigo-400 shrink-0">
                                                    {sec.numberPrefix}
                                                </span>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <span className="text-xs font-semibold text-text-main truncate block" title={sec.title}>
                                                    {sec.title}
                                                </span>
                                                {sec.requirementText && (
                                                    <span className="text-[8.5px] text-text-dim/80 truncate block italic">
                                                        {sec.requirementText}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botones de acción limpia (Editar y Eliminar) */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(sec)}
                                                className="p-1 text-text-dim hover:text-indigo-400 cursor-pointer"
                                                title="Editar texto de requisito"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(sec.id)}
                                                className="p-1 text-text-dim hover:text-rose-400 cursor-pointer"
                                                title="Eliminar subsección"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Formulario Agregar Nueva Subsección */}
                {isAddingNew ? (
                    <div className="p-3 bg-surface border border-indigo-500/30 rounded-lg space-y-2">
                        <h6 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                            + Agregar Nueva Sub-Sección
                        </h6>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-1">
                                <label className="text-[9px] font-bold text-text-dim block mb-0.5">Prefijo</label>
                                <input
                                    type="text"
                                    value={newForm.numberPrefix || ''}
                                    onChange={e => setNewForm(prev => ({ ...prev, numberPrefix: e.target.value }))}
                                    className="w-full text-xs font-mono px-2 py-1 bg-surface-hover border border-border-thin rounded focus:outline-none text-text-main"
                                    placeholder="3.9"
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="text-[9px] font-bold text-text-dim block mb-0.5">Título de la Subsección</label>
                                <input
                                    type="text"
                                    value={newForm.title || ''}
                                    onChange={e => setNewForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full text-xs font-semibold px-2 py-1 bg-surface-hover border border-border-thin rounded focus:outline-none text-text-main"
                                    placeholder="Ej: ESTADO DEL ARTE"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-text-dim block mb-0.5">Requisito / Guía Institucional</label>
                            <input
                                type="text"
                                value={newForm.requirementText || ''}
                                onChange={e => setNewForm(prev => ({ ...prev, requirementText: e.target.value }))}
                                className="w-full text-[10px] px-2 py-1 bg-surface-hover border border-border-thin rounded focus:outline-none text-text-main"
                                placeholder="Ej: DETALLAR EN 2 PÁRRAFOS..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-text-dim block mb-0.5">Ancho de Columna (PDF)</label>
                                <select
                                    value={newForm.colSpan || 2}
                                    onChange={e => setNewForm(prev => ({ ...prev, colSpan: Number(e.target.value) as 1 | 2 }))}
                                    className="w-full text-[10px] px-2 py-1 bg-surface-hover border border-border-thin rounded focus:outline-none text-text-main"
                                >
                                    <option value={2}>100% Ancho Completo (1 Fila)</option>
                                    <option value={1}>50% Media Fila (2 Columnas)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-text-dim block mb-0.5">Estilo de Encabezado</label>
                                <select
                                    value={newForm.variant || 'standard'}
                                    onChange={e => setNewForm(prev => ({ ...prev, variant: e.target.value as any }))}
                                    className="w-full text-[10px] px-2 py-1 bg-surface-hover border border-border-thin rounded focus:outline-none text-text-main"
                                >
                                    <option value="standard">Encabezado Lateral Tradicional</option>
                                    <option value="banner_gold">Banner Dorado Divisional (Institucional)</option>
                                    <option value="banner_navy">Sub-encabezado Azul Marino (General/Esp.)</option>
                                    <option value="header_only">Separador (Solo Título)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setIsAddingNew(false)}
                                className="px-2 py-1 text-[10px] font-semibold text-text-dim hover:text-text-main"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleAddNew}
                                className="px-3 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-sm"
                            >
                                Añadir Sub-Sección
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsAddingNew(true)}
                        className="w-full py-2 border border-dashed border-border-thin hover:border-indigo-500/50 rounded-lg text-[10px] font-bold text-text-dim hover:text-indigo-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Añadir Sub-Sección Personalizada
                    </button>
                )}
            </div>
        </div>
    );
};
