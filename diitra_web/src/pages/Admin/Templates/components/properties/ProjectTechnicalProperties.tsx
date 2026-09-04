import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Pencil, Check, X, Layers, Palette, ChevronUp, ChevronDown, Scissors, Bookmark } from 'lucide-react';
import type { DocumentBlock, TechnicalSubsection } from '../../types';
import { DEFAULT_TECHNICAL_SUBSECTIONS } from '../../types';

interface ProjectTechnicalPropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

export const ProjectTechnicalProperties: React.FC<ProjectTechnicalPropertiesProps> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};
    const headerColor = config.technicalHeaderColor || 'navy';
    const borderStyle = config.technicalBorderStyle || 'solid';

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
        pageBreakBefore: false,
        avoidBreakInside: true,
    });

    const updateSections = (newSecs: TechnicalSubsection[]) => {
        setSections(newSecs);
        onUpdateConfig(block.id, 'technicalSections', newSecs);
    };

    const handleToggleEnabled = (id: string, enabled: boolean) => {
        const updated = sections.map(s => s.id === id ? { ...s, enabled } : s);
        updateSections(updated);
    };

    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;
        const updated = [...sections];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
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
        onUpdateConfig(block.id, 'technicalLayoutMode', 'table_2col');
        onUpdateConfig(block.id, 'technicalHeaderColor', 'navy');
        onUpdateConfig(block.id, 'technicalBorderStyle', 'solid');
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
                    pageBreakBefore: Boolean(editForm.pageBreakBefore),
                    avoidBreakInside: editForm.avoidBreakInside !== false,
                } as TechnicalSubsection;
            }
            return s;
        });
        updateSections(updated);
        setEditingId(null);
    };

    const handleAddNew = (isBanner: boolean = false) => {
        if (!newForm.title?.trim()) return;
        const titleClean = newForm.title.trim();
        const { autoKey, autoScriban } = cleanAutoKeyAndScriban(titleClean, newForm.fieldKey, newForm.scribanVariable);

        const newSec: TechnicalSubsection = {
            id: `sec_${Date.now()}`,
            numberPrefix: newForm.numberPrefix?.trim() || `3.${sections.length + 1}`,
            title: titleClean,
            fieldKey: autoKey,
            scribanVariable: autoScriban,
            placeholder: newForm.placeholder || (isBanner ? '' : 'Redactar apartado...'),
            requirementText: newForm.requirementText || '',
            enabled: true,
            colSpan: newForm.colSpan || 2,
            variant: newForm.variant || (isBanner ? 'banner_gold' : 'standard'),
            hasContent: !isBanner && newForm.hasContent !== false,
            isGroupHeader: isBanner || Boolean(newForm.isGroupHeader),
            pageBreakBefore: Boolean(newForm.pageBreakBefore),
            avoidBreakInside: newForm.avoidBreakInside !== false,
        };

        updateSections([...sections, newSec]);
        setIsAddingNew(false);
        setNewForm({
            numberPrefix: `3.${sections.length + 2}`,
            title: '',
            fieldKey: '',
            scribanVariable: '',
            placeholder: 'Redactar apartado...',
            requirementText: '',
            enabled: true,
            colSpan: 2,
            variant: 'standard',
            pageBreakBefore: false,
            avoidBreakInside: true,
        });
    };

    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4 font-sans text-xs">
            {/* TÍTULO DE LA SECCIÓN Y BOTÓN RESET */}
            <div className="space-y-1.5 pb-3 border-b border-border-thin/20">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                        Título de la Sección
                    </label>
                    <button
                        type="button"
                        onClick={handleResetPresets}
                        className="btn-vercel-secondary text-[9.5px] font-bold py-0.5 px-2 rounded-lg flex items-center gap-1 text-text-dim hover:text-text-main transition-colors"
                        title="Restablecer al formato estándar oficial"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                </div>
                <input
                    type="text"
                    value={config.title !== undefined ? config.title : (block.title || '3. ESPECIFICACIÓN TÉCNICA')}
                    onChange={e => onUpdateConfig(block.id, 'title', e.target.value)}
                    placeholder="3. ESPECIFICACIÓN TÉCNICA"
                    className="w-full bg-surface border border-border-thin rounded-xl px-3 py-1.5 text-xs text-text-main font-semibold outline-none focus:border-text-main transition-colors"
                />
            </div>

            {/* SECCIÓN 1: ESTILOS VISUALES Y ACABADO PDF */}
            <div className="space-y-2.5 pb-3 border-b border-border-thin/20">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-text-main" />
                    Diseño y Estilo Visual
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Encabezado</label>
                        <select
                            value={headerColor}
                            onChange={e => onUpdateConfig(block.id, 'technicalHeaderColor', e.target.value)}
                            className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1.5 text-xs text-text-main outline-none focus:border-text-main font-medium transition-colors cursor-pointer"
                        >
                            <option value="navy">Azul Traversari</option>
                            <option value="gold">Dorado Acreditación</option>
                            <option value="slate">Gris Ejecutivo</option>
                            <option value="emerald">Verde Esmeralda</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Bordes</label>
                        <select
                            value={borderStyle}
                            onChange={e => onUpdateConfig(block.id, 'technicalBorderStyle', e.target.value)}
                            className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1.5 text-xs text-text-main outline-none focus:border-text-main font-medium transition-colors cursor-pointer"
                        >
                            <option value="solid">Institucional</option>
                            <option value="none">Sin Bordes</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: GESTIÓN DIRECTA DE SUB-SECCIONES */}
            <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between border-b border-border-thin/20 pb-1.5">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-text-main" />
                        Sub-secciones ({sections.length})
                    </span>
                </div>

                {/* Lista de Subsecciones con Reordenamiento y Edición */}
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pt-1 pr-1 pl-0.5 custom-scrollbar">
                    {sections.map((sec, idx) => {
                        const isEditing = editingId === sec.id;
                        return (
                            <div
                                key={sec.id}
                                className={`p-2.5 rounded-xl border transition-all ${
                                    isEditing
                                        ? 'border-border-hover bg-surface-hover/50 shadow-xs'
                                        : sec.enabled
                                            ? sec.isGroupHeader || sec.variant === 'banner_gold'
                                                ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                                                : sec.variant === 'banner_navy'
                                                    ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50'
                                                    : 'border-border-thin bg-surface hover:border-border-hover'
                                            : 'border-border-thin/40 bg-surface/30 opacity-60'
                                }`}
                            >
                                {isEditing ? (
                                    <div className="space-y-2.5 animate-fade-in text-xs">
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="col-span-1">
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Prefijo</label>
                                                <input
                                                    type="text"
                                                    value={editForm.numberPrefix || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, numberPrefix: e.target.value }))}
                                                    className="w-full text-xs font-mono px-2 py-1 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main font-bold"
                                                    placeholder="3.1"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Título *</label>
                                                <input
                                                    type="text"
                                                    value={editForm.title || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                                    className="w-full text-xs font-semibold px-2.5 py-1 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main"
                                                    placeholder="Nombre de subsección"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Variante Visual</label>
                                                <select
                                                    value={editForm.variant || 'standard'}
                                                    onChange={e => setEditForm(prev => ({ ...prev, variant: e.target.value as any }))}
                                                    className="w-full text-xs px-2 py-1 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main cursor-pointer"
                                                >
                                                    <option value="standard">Estándar</option>
                                                    <option value="banner_gold">Dorado (#c4a857)</option>
                                                    <option value="banner_navy">Azul (#222c57)</option>
                                                    <option value="banner_emerald">Verde (#065f46)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Ancho Fila</label>
                                                <select
                                                    value={editForm.colSpan || 2}
                                                    onChange={e => setEditForm(prev => ({ ...prev, colSpan: Number(e.target.value) as 1 | 2 }))}
                                                    className="w-full text-xs px-2 py-1 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main cursor-pointer"
                                                >
                                                    <option value={2}>Completa (100%)</option>
                                                    <option value={1}>Media (50%)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Guía / Requisito CACES</label>
                                            <textarea
                                                rows={2}
                                                value={editForm.requirementText || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, requirementText: e.target.value }))}
                                                className="w-full text-xs px-2.5 py-1.5 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main"
                                                placeholder="Ej: DETALLAR EN DOS PÁRRAFOS..."
                                            />
                                        </div>

                                        {/* Controles de Paginación Inteligente */}
                                        <div className="grid grid-cols-2 gap-2 p-2 bg-surface-hover/30 rounded-xl border border-border-thin/20">
                                            <label className="text-[10px] font-medium text-text-main flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(editForm.pageBreakBefore)}
                                                    onChange={e => setEditForm(prev => ({ ...prev, pageBreakBefore: e.target.checked }))}
                                                    className="w-4 h-4 text-text-main accent-text-main rounded cursor-pointer"
                                                />
                                                <span className="flex items-center gap-1">
                                                    <Scissors className="w-3 h-3 text-text-dim" />
                                                    Salto de Página Antes
                                                </span>
                                            </label>

                                            <label className="text-[10px] font-medium text-text-main flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.avoidBreakInside !== false}
                                                    onChange={e => setEditForm(prev => ({ ...prev, avoidBreakInside: e.target.checked }))}
                                                    className="w-4 h-4 text-text-main accent-text-main rounded cursor-pointer"
                                                />
                                                <span>Evitar Corte en Mitad</span>
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2 py-0.5">
                                            <label className="text-[10px] font-bold text-text-main flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.hasContent !== false}
                                                    onChange={e => setEditForm(prev => ({ ...prev, hasContent: e.target.checked }))}
                                                    className="w-4 h-4 text-text-main accent-text-main rounded cursor-pointer"
                                                />
                                                <span>¿Tiene Campo Redactable?</span>
                                            </label>
                                            <span className="text-[8.5px] text-text-dim">
                                                (Desmarcar para banner puro)
                                            </span>
                                        </div>

                                        {editForm.hasContent !== false && (
                                            <div className="border-t border-border-thin/20 pt-2 space-y-1">
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Herramientas del Editor (Normas APA / Formato)</label>
                                                <select
                                                    value={editForm.toolbarMode || 'apa_full'}
                                                    onChange={e => setEditForm(prev => ({ ...prev, toolbarMode: e.target.value as any }))}
                                                    className="w-full text-xs px-2.5 py-1.5 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main cursor-pointer"
                                                >
                                                    <option value="apa_full">Completo APA 7 (Niveles, Tablas, Figuras, Citas y Refs)</option>
                                                    <option value="standard">Redacción Estándar (Formato, Listas y Citas en Bloque)</option>
                                                    <option value="compact">Compacto / Texto Directo (Solo Negrita, Cursiva y Listas)</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-thin/20">
                                            <button
                                                type="button"
                                                onClick={() => setEditingId(null)}
                                                className="btn-vercel-secondary text-[10px] font-bold py-1.5 px-3 rounded-xl"
                                            >
                                                <X className="w-3 h-3 inline mr-1" /> Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveEdit}
                                                className="btn-vercel-primary text-[10px] font-bold py-1.5 px-4 rounded-xl"
                                            >
                                                <Check className="w-3 h-3 inline mr-1" /> Guardar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={sec.enabled}
                                                onChange={e => handleToggleEnabled(sec.id, e.target.checked)}
                                                className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded cursor-pointer shrink-0"
                                            />
                                            {sec.numberPrefix && (
                                                <span className="text-xs font-mono font-bold text-brand shrink-0">
                                                    {sec.numberPrefix}
                                                </span>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-xs font-bold text-text-main truncate block" title={sec.title}>
                                                        {sec.title}
                                                    </span>
                                                    {sec.pageBreakBefore && (
                                                        <span className="badge-vercel-neutral text-[7.5px] px-1.5 py-0.2">Salto Pág</span>
                                                    )}
                                                    {sec.variant === 'banner_gold' && (
                                                        <span className="badge-vercel-warning text-[8px] px-1.5 py-0.2">Dorado</span>
                                                    )}
                                                    {sec.variant === 'banner_navy' && (
                                                        <span className="badge-vercel-info text-[8px] px-1.5 py-0.2">Azul</span>
                                                    )}
                                                </div>
                                                {sec.requirementText && (
                                                    <span className="text-[9.5px] text-text-dim italic truncate block">
                                                        {sec.requirementText}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botones de acción rápida: Editar y Eliminar */}
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(sec)}
                                                className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                                                title="Editar subsección"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(sec.id)}
                                                className="p-1.5 rounded-lg text-text-dim hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                title="Eliminar subsección"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Formulario de Agregar o Botones de Acción */}
                {isAddingNew ? (
                    <div className="p-3 border border-border-hover rounded-xl bg-surface shadow-md space-y-2.5 animate-fade-in mt-2 text-xs">
                        <h4 className="text-[10px] font-bold text-text-main uppercase tracking-wider">
                            {newForm.isGroupHeader ? 'Nuevo Banner Dorado Divisional' : 'Nueva Sub-sección Técnica'}
                        </h4>

                        <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-1">
                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Prefijo</label>
                                <input
                                    type="text"
                                    value={newForm.numberPrefix || ''}
                                    onChange={e => setNewForm(prev => ({ ...prev, numberPrefix: e.target.value }))}
                                    className="w-full text-xs font-mono px-2 py-1 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main font-bold"
                                    placeholder={`3.${sections.length + 1}`}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Título *</label>
                                <input
                                    type="text"
                                    value={newForm.title || ''}
                                    onChange={e => setNewForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full text-xs font-semibold px-2.5 py-1 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main"
                                    placeholder="Ej: MARCO METODOLÓGICO Y DISEÑO"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Variante Visual</label>
                                <select
                                    value={newForm.variant || 'standard'}
                                    onChange={e => setNewForm(prev => ({ ...prev, variant: e.target.value as any }))}
                                    className="w-full text-xs px-2 py-1 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main cursor-pointer"
                                >
                                    <option value="standard">Estándar</option>
                                    <option value="banner_gold">Dorado (#c4a857)</option>
                                    <option value="banner_navy">Azul (#222c57)</option>
                                    <option value="banner_emerald">Verde (#065f46)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Ancho Fila</label>
                                <select
                                    value={newForm.colSpan || 2}
                                    onChange={e => setNewForm(prev => ({ ...prev, colSpan: Number(e.target.value) as 1 | 2 }))}
                                    className="w-full text-xs px-2 py-1 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main cursor-pointer"
                                >
                                    <option value={2}>Completa (100%)</option>
                                    <option value={1}>Media (50%)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Guía / Requisito CACES</label>
                            <input
                                type="text"
                                value={newForm.requirementText || ''}
                                onChange={e => setNewForm(prev => ({ ...prev, requirementText: e.target.value }))}
                                placeholder="Ej: DETALLAR EN DOS PÁRRAFOS..."
                                className="w-full text-xs px-2.5 py-1.5 bg-surface border border-border-thin rounded-xl focus:outline-none focus:border-text-main text-text-main"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-1.5 border-t border-border-thin/20">
                            <button
                                type="button"
                                onClick={() => setIsAddingNew(false)}
                                className="btn-vercel-secondary text-[10px] font-bold py-1 px-3 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddNew(false)}
                                className="btn-vercel-primary text-[10px] font-bold py-1 px-3.5 rounded-xl"
                            >
                                Guardar Sub-Sección
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setNewForm({
                                    numberPrefix: `3.${sections.length + 1}`,
                                    title: 'NUEVO GRUPO / BANNER',
                                    fieldKey: '',
                                    scribanVariable: '',
                                    placeholder: '',
                                    requirementText: '',
                                    enabled: true,
                                    colSpan: 2,
                                    variant: 'banner_gold',
                                    hasContent: false,
                                    isGroupHeader: true,
                                    pageBreakBefore: false,
                                    avoidBreakInside: true,
                                });
                                setIsAddingNew(true);
                            }}
                            className="btn-vercel-secondary text-[10px] font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-amber-600 hover:text-amber-500 border-amber-500/30 hover:border-amber-500/50"
                        >
                            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                            <span>+ Banner Dorado</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
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
                                    hasContent: true,
                                    isGroupHeader: false,
                                    pageBreakBefore: false,
                                    avoidBreakInside: true,
                                });
                                setIsAddingNew(true);
                            }}
                            className="btn-vercel-primary text-[10px] font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Sub-Sección</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


