import React, { useState } from 'react';
import { Plus, Trash2, Database, Sliders, ChevronDown, ChevronUp, Pencil, Palette, RotateCcw, Bookmark } from 'lucide-react';
import type { DocumentBlock, IdentificationField } from '../../types';
import { ColorPickerField } from './SharedColorPicker';

interface ProjectGeneralPropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

export const ProjectGeneralProperties: React.FC<ProjectGeneralPropertiesProps> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};
    const customFields: IdentificationField[] = config.customFields || [];

    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const [newField, setNewField] = useState<Partial<IdentificationField>>({
        label: '',
        fieldKey: '',
        fieldType: 'text',
        colSpan: 1,
        scriptMode: 'scriban',
        scriptVariable: '',
        options: [],
        catalogUrl: '/api/catalogs/programas',
        catalogLabelKey: 'nombre',
        catalogValueKey: 'nombre',
        placeholder: '',
        isGroupHeader: false,
        variant: 'standard',
        requirementText: '',
    });

    const [inlineOptionsText, setInlineOptionsText] = useState('');
    const [showAdvancedPdfOptions, setShowAdvancedPdfOptions] = useState(false);

    const SYSTEM_CATALOGS = [
        { label: 'Programas de Investigación', url: '/api/catalogs/programas' },
        { label: 'Carreras / Unidades Académicas', url: '/api/catalogs/carreras' },
        { label: 'Grupos de Investigación Aprobados', url: '/api/catalogs/grupos-investigacion' },
        { label: 'Convocatorias Vigentes', url: '/api/catalogs/convocatorias' },
        { label: 'Otro (Ingresar Endpoint de API personalizado...)', url: 'custom' },
    ];

    const handleLabelChange = (val: string) => {
        const autoKey = val.trim().replace(/[^a-zA-Z0-9]/g, '');
        const autoScriban = autoKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

        setNewField(prev => {
            const currentAutoKey = (prev.label || '').trim().replace(/[^a-zA-Z0-9]/g, '');
            const currentAutoScriban = currentAutoKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

            const isKeyEdited = prev.fieldKey && prev.fieldKey !== currentAutoKey;
            const isScribanEdited = prev.scriptVariable && prev.scriptVariable !== currentAutoScriban;

            return {
                ...prev,
                label: val,
                fieldKey: isKeyEdited ? prev.fieldKey : autoKey,
                scriptVariable: isScribanEdited ? prev.scriptVariable : autoScriban,
            };
        });
    };

    const handleStartAdd = (isBanner: boolean = false) => {
        setEditingIndex(null);
        setNewField({
            label: isBanner ? 'NUEVA SECCIÓN / GRUPO TEMÁTICO' : '',
            fieldKey: '',
            fieldType: 'text',
            colSpan: 2,
            scriptMode: 'scriban',
            scriptVariable: '',
            options: [],
            catalogUrl: '/api/catalogs/programas',
            catalogLabelKey: 'nombre',
            catalogValueKey: 'nombre',
            placeholder: '',
            isGroupHeader: isBanner,
            variant: isBanner ? 'banner_gold' : 'standard',
            requirementText: '',
        });
        setInlineOptionsText('');
        setShowAdvancedPdfOptions(false);
        setIsAdding(true);
    };

    const handleStartEdit = (index: number) => {
        const field = customFields[index];
        if (!field) return;
        setEditingIndex(index);
        setNewField({ ...field });
        setInlineOptionsText(field.options ? field.options.join('\n') : '');
        setShowAdvancedPdfOptions(false);
        setIsAdding(true);
    };

    const handleSaveField = () => {
        if (!newField.label || !newField.label.trim()) return;

        const generatedKey = newField.fieldKey && newField.fieldKey.trim() !== ''
            ? newField.fieldKey.trim()
            : newField.label.trim().replace(/[^a-zA-Z0-9]/g, '');

        const generatedScriban = newField.scriptVariable && newField.scriptVariable.trim() !== ''
            ? newField.scriptVariable.trim()
            : generatedKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

        const parsedOptions = newField.fieldType === 'select_inline'
            ? inlineOptionsText.split('\n').map(s => s.trim()).filter(Boolean)
            : undefined;

        const fieldToSave: IdentificationField = {
            fieldKey: generatedKey,
            label: newField.label.trim(),
            fieldType: newField.fieldType || 'text',
            colSpan: newField.colSpan || 1,
            scriptMode: newField.scriptMode || 'scriban',
            scriptVariable: generatedScriban,
            options: parsedOptions,
            catalogUrl: newField.fieldType === 'select_catalog' ? (newField.catalogUrl || '') : undefined,
            catalogLabelKey: newField.fieldType === 'select_catalog' ? (newField.catalogLabelKey || 'nombre') : undefined,
            catalogValueKey: newField.fieldType === 'select_catalog' ? (newField.catalogValueKey || 'nombre') : undefined,
            placeholder: newField.placeholder || '',
            required: newField.required || false,
            isGroupHeader: Boolean(newField.isGroupHeader),
            variant: newField.variant || (newField.isGroupHeader ? 'banner_gold' : 'standard'),
            requirementText: newField.requirementText || '',
        };

        let updated: IdentificationField[];
        if (editingIndex !== null) {
            updated = [...customFields];
            updated[editingIndex] = fieldToSave;
        } else {
            updated = [...customFields, fieldToSave];
        }

        onUpdateConfig(block.id, 'customFields', updated);

        // Reset form
        setNewField({
            label: '',
            fieldKey: '',
            fieldType: 'text',
            colSpan: 1,
            scriptMode: 'scriban',
            scriptVariable: '',
            options: [],
            catalogUrl: '/api/catalogs/programas',
            catalogLabelKey: 'nombre',
            catalogValueKey: 'nombre',
            placeholder: '',
            isGroupHeader: false,
            variant: 'standard',
            requirementText: '',
        });
        setInlineOptionsText('');
        setEditingIndex(null);
        setIsAdding(false);
    };

    const handleRemoveField = (index: number) => {
        const updated = customFields.filter((_, i) => i !== index);
        onUpdateConfig(block.id, 'customFields', updated);
    };

    const handleMoveField = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= customFields.length) return;
        const updated = [...customFields];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        onUpdateConfig(block.id, 'customFields', updated);
    };

    const handleResetDefaults = () => {
        onUpdateConfig(block.id, 'title', '1. IDENTIFICACIÓN DEL PROYECTO');
        onUpdateConfig(block.id, 'headerColor', 'blue');
        onUpdateConfig(block.id, 'borderStyle', 'solid');
        onUpdateConfig(block.id, 'identificationLayoutMode', 'table');
        onUpdateConfig(block.id, 'showTitulo', true);
        onUpdateConfig(block.id, 'showDirector', true);
        onUpdateConfig(block.id, 'showCarrera', true);
        onUpdateConfig(block.id, 'showConvocatoria', true);
        onUpdateConfig(block.id, 'showPrograma', true);
        onUpdateConfig(block.id, 'showGrupo', true);
        onUpdateConfig(block.id, 'showLinea', true);
        onUpdateConfig(block.id, 'showTipo', true);
        onUpdateConfig(block.id, 'showCaces', true);
        onUpdateConfig(block.id, 'showFechas', true);
        onUpdateConfig(block.id, 'fieldsOrder', []);
    };

    const [editingCoreKey, setEditingCoreKey] = useState<string | null>(null);

    const CORE_ITEMS = [
        { key: 'showTitulo', labelKey: 'customLabel_showTitulo', scribanKey: 'customScriban_showTitulo', variantKey: 'variant_showTitulo', reqKey: 'req_showTitulo', defaultLabel: 'Nombre del Proyecto', defaultScriban: 'titulo', desc: 'Campo de texto en mayúsculas para el tema.' },
        { key: 'showPrograma', labelKey: 'customLabel_showPrograma', scribanKey: 'customScriban_showPrograma', variantKey: 'variant_showPrograma', reqKey: 'req_showPrograma', defaultLabel: 'Programa de Investigación', defaultScriban: 'programa', desc: 'Campo de texto/catálogo para clasificar el programa.' },
        { key: 'showGrupo', labelKey: 'customLabel_showGrupo', scribanKey: 'customScriban_showGrupo', variantKey: 'variant_showGrupo', reqKey: 'req_showGrupo', defaultLabel: 'Grupo de Investigación', defaultScriban: 'grupo_investigacion', desc: 'Selectores de grupos aprobados con cascada a Dominio y Línea.' },
        { key: 'showLinea', labelKey: 'customLabel_showLinea', scribanKey: 'customScriban_showLinea', variantKey: 'variant_showLinea', reqKey: 'req_showLinea', defaultLabel: 'Línea de Investigación', defaultScriban: 'linea_investigacion', desc: 'Dominios científicos, líneas y sublíneas.' },
        { key: 'showTipo', labelKey: 'customLabel_showTipo', scribanKey: 'customScriban_showTipo', variantKey: 'variant_showTipo', reqKey: 'req_showTipo', defaultLabel: 'Tipo de Investigación', defaultScriban: 'tipo_investigacion', desc: 'Investigación básica, aplicada o experimental.' },
        { key: 'showCaces', labelKey: 'customLabel_showCaces', scribanKey: 'customScriban_showCaces', variantKey: 'variant_showCaces', reqKey: 'req_showCaces', defaultLabel: 'Clasificación UNESCO / CACES', defaultScriban: 'campo_detallado', desc: 'Clasificación de campo amplio, específico y detallado.' },
        { key: 'showCarrera', labelKey: 'customLabel_showCarrera', scribanKey: 'customScriban_showCarrera', variantKey: 'variant_showCarrera', reqKey: 'req_showCarrera', defaultLabel: 'Carrera / Unidad Académica', defaultScriban: 'carrera', desc: 'Selector de la carrera vinculada del docente.' },
        { key: 'showDirector', labelKey: 'customLabel_showDirector', scribanKey: 'customScriban_showDirector', variantKey: 'variant_showDirector', reqKey: 'req_showDirector', defaultLabel: 'Director del Proyecto', defaultScriban: 'director_proyecto', desc: 'Campo para ingresar el nombre del director.' },
        { key: 'showConvocatoria', labelKey: 'customLabel_showConvocatoria', scribanKey: 'customScriban_showConvocatoria', variantKey: 'variant_showConvocatoria', reqKey: 'req_showConvocatoria', defaultLabel: 'Convocatoria Activa', defaultScriban: 'convocatoria', desc: 'Selector de los plazos y convocatorias vigentes.' },
        { key: 'showFechas', labelKey: 'customLabel_showFechas', scribanKey: 'customScriban_showFechas', variantKey: 'variant_showFechas', reqKey: 'req_showFechas', defaultLabel: 'Periodo, Tiempo y Fechas', defaultScriban: 'fechas', desc: 'Periodo de convocatoria, tiempo de ejecución y fechas previstas.' },
    ];

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
                        onClick={handleResetDefaults}
                        className="btn-vercel-secondary text-[9.5px] font-bold py-0.5 px-2 rounded-lg flex items-center gap-1 text-text-dim hover:text-text-main transition-colors"
                        title="Restablecer al formato estándar oficial"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                </div>
                <input
                    type="text"
                    value={config.title !== undefined ? config.title : (block.title || '1. IDENTIFICACIÓN DEL PROYECTO')}
                    onChange={e => onUpdateConfig(block.id, 'title', e.target.value)}
                    placeholder="1. IDENTIFICACIÓN DEL PROYECTO"
                    className="w-full bg-surface border border-border-thin rounded-xl px-3 py-1.5 text-xs text-text-main font-semibold outline-none focus:border-text-main transition-colors"
                />
            </div>

            {/* SECCIÓN 0: ESTILOS VISUALES DE LA TABLA */}
            <div className="space-y-2.5 pb-3 border-b border-border-thin/20">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-text-main" />
                    Diseño y Estilo Visual
                </span>

                <div className="space-y-2.5 text-xs">
                    <ColorPickerField
                        label="Color de Encabezado"
                        value={config.headerColor || '#222c57'}
                        onChange={val => onUpdateConfig(block.id, 'headerColor', val)}
                    />

                    <div>
                        <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Bordes</label>
                        <select
                            value={config.borderStyle || 'solid'}
                            onChange={e => onUpdateConfig(block.id, 'borderStyle', e.target.value)}
                            className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1.5 text-xs text-text-main outline-none focus:border-text-main font-medium transition-colors cursor-pointer"
                        >
                            <option value="solid">Institucional</option>
                            <option value="none">Sin Bordes</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECCIÓN A: CAMPOS INSTITUCIONALES CORE */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-border-thin/20 pb-1.5">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-text-main" />
                        Campos ({CORE_ITEMS.length})
                    </span>
                </div>

                {(() => {
                    const fieldsOrder: string[] = config.fieldsOrder || [];
                    const sortedCoreItems = [...CORE_ITEMS].sort((a, b) => {
                        if (fieldsOrder.length === 0) return 0;
                        const idxA = fieldsOrder.indexOf(a.key);
                        const idxB = fieldsOrder.indexOf(b.key);
                        if (idxA === -1 && idxB === -1) return 0;
                        if (idxA === -1) return 1;
                        if (idxB === -1) return -1;
                        return idxA - idxB;
                    });

                    const handleMoveCoreItem = (itemKey: string, direction: 'up' | 'down') => {
                        const allKeys = [...CORE_ITEMS.map(c => c.key), ...customFields.map(f => f.fieldKey || (f as any).id)];
                        const currentOrder = fieldsOrder.length > 0
                            ? fieldsOrder.filter(k => allKeys.includes(k))
                            : [...allKeys];

                        allKeys.forEach(k => {
                            if (!currentOrder.includes(k)) currentOrder.push(k);
                        });

                        const index = currentOrder.indexOf(itemKey);
                        if (index === -1) return;
                        const targetIndex = direction === 'up' ? index - 1 : index + 1;
                        if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

                        const updated = [...currentOrder];
                        const [moved] = updated.splice(index, 1);
                        updated.splice(targetIndex, 0, moved);

                        onUpdateConfig(block.id, 'fieldsOrder', updated);
                    };

                    return (
                        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pt-1 pr-1 pl-0.5 custom-scrollbar">
                            {sortedCoreItems.map((item, idx) => {
                                const isChecked = (config as any)[item.key] !== false;
                                const customLabel = (config as any)[item.labelKey] || item.defaultLabel;
                                const customScriban = (config as any)[item.scribanKey] || item.defaultScriban;
                                const customVariant = (config as any)[item.variantKey] || 'standard';
                                const customReq = (config as any)[item.reqKey] || '';
                                const isEditingThis = editingCoreKey === item.key;

                                return (
                                    <div
                                        key={item.key}
                                        className={`p-2.5 rounded-xl border transition-all ${isEditingThis
                                                ? 'border-border-hover bg-surface-hover/50 shadow-xs'
                                                : isChecked
                                                    ? customVariant === 'banner_gold'
                                                        ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                                                        : customVariant === 'banner_navy'
                                                            ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50'
                                                            : 'border-border-thin bg-surface hover:border-border-hover'
                                                    : 'border-border-thin/40 bg-surface/30 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={e => onUpdateConfig(block.id, item.key, e.target.checked)}
                                                    className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded cursor-pointer shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-xs font-bold text-text-main truncate block">{customLabel}</span>
                                                        {customVariant === 'banner_gold' && (
                                                             <span className="badge-vercel-warning text-[8px] px-1 py-0.2">Dorado</span>
                                                        )}
                                                        {customVariant === 'banner_navy' && (
                                                            <span className="badge-vercel-info text-[8px] px-1 py-0.2">Azul</span>
                                                        )}
                                                        {customLabel !== item.defaultLabel && (
                                                            <span className="badge-vercel-neutral text-[8px] font-mono px-1 py-0.2">personalizado</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[9.5px] text-text-dim block mt-0.5 leading-tight truncate">{item.desc}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={() => handleMoveCoreItem(item.key, 'up')}
                                                    className="p-1 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover disabled:opacity-20 transition-colors cursor-pointer"
                                                    title="Mover arriba"
                                                >
                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === sortedCoreItems.length - 1}
                                                    onClick={() => handleMoveCoreItem(item.key, 'down')}
                                                    className="p-1 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover disabled:opacity-20 transition-colors cursor-pointer"
                                                    title="Mover abajo"
                                                >
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingCoreKey(isEditingThis ? null : item.key)}
                                                    className={`p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer ${isEditingThis ? 'text-text-main bg-surface-hover font-bold' : ''}`}
                                                    title="Personalizar campo"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Acordeón de edición inline para el campo Core */}
                                        {isEditingThis && (
                                            <div className="mt-2.5 pt-2.5 border-t border-border-thin/20 space-y-2.5 animate-fade-in text-xs">
                                                <div>
                                                    <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Nombre Visible</label>
                                                    <input
                                                        type="text"
                                                        value={customLabel}
                                                        onChange={e => onUpdateConfig(block.id, item.labelKey, e.target.value)}
                                                        placeholder={item.defaultLabel}
                                                        className="w-full bg-surface border border-border-thin rounded-xl px-2.5 py-1.5 text-xs text-text-main outline-none focus:border-text-main font-semibold transition-colors"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Variante Color</label>
                                                        <select
                                                            value={customVariant}
                                                            onChange={e => onUpdateConfig(block.id, item.variantKey, e.target.value)}
                                                            className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-medium transition-colors cursor-pointer"
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
                                                            value={(config as any)[`colSpan_${item.key}`] || (item.key === 'showTitulo' || item.key === 'showDirector' ? 2 : 1)}
                                                            onChange={e => onUpdateConfig(block.id, `colSpan_${item.key}`, Number(e.target.value))}
                                                            className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-medium transition-colors cursor-pointer"
                                                        >
                                                            <option value={1}>Media (50%)</option>
                                                            <option value={2}>Completa (100%)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Requisito para Docentes</label>
                                                    <input
                                                        type="text"
                                                        value={customReq}
                                                        onChange={e => onUpdateConfig(block.id, item.reqKey, e.target.value)}
                                                        placeholder="Ej: Ingrese en mayúsculas..."
                                                        className="w-full bg-surface border border-border-thin rounded-xl px-2.5 py-1.5 text-xs text-text-main outline-none focus:border-text-main transition-colors"
                                                    />
                                                </div>

                                                {/* Ajustes avanzados de PDF */}
                                                <div className="pt-1.5 border-t border-border-thin/20 space-y-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAdvancedPdfOptions(!showAdvancedPdfOptions)}
                                                        className="text-[9px] font-bold text-text-dim hover:text-text-main flex items-center gap-1 transition-colors"
                                                    >
                                                        <span>{showAdvancedPdfOptions ? 'Ocultar Variable PDF' : 'Variable en PDF (Avanzado)'}</span>
                                                    </button>

                                                    {showAdvancedPdfOptions && (
                                                        <div className="animate-fade-in space-y-1 bg-surface-hover/30 p-2 rounded-xl border border-border-thin/20">
                                                            <input
                                                                type="text"
                                                                value={customScriban}
                                                                onChange={e => onUpdateConfig(block.id, item.scribanKey, e.target.value)}
                                                                placeholder={item.defaultScriban}
                                                                className="w-full bg-surface border border-border-thin rounded-lg px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-mono text-[10px]"
                                                            />
                                                            <span className="text-[8px] text-text-dim block font-mono">Etiqueta: {`{{${customScriban || item.defaultScriban}}}`}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex justify-end pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingCoreKey(null)}
                                                        className="btn-vercel-primary text-[10px] font-bold py-1 px-3 rounded-xl"
                                                    >
                                                        Listo
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>

            {/* SECCIÓN B: CAMPOS PERSONALIZADOS Y BANNERS TEMÁTICOS */}
            <div className="space-y-2.5 pt-3 border-t border-border-thin/20">
                <div className="flex items-center justify-between border-b border-border-thin/20 pb-1.5">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-text-main" />
                        Campos y Banners Extra ({customFields.length})
                    </span>
                </div>

                {customFields.length === 0 && !isAdding && (
                    <div className="empty-state p-4 text-center rounded-xl border border-dashed border-border-thin">
                        <p className="text-[10px] text-text-dim italic">
                            No hay campos o banners adicionales configurados. Añade uno con los botones inferiores.
                        </p>
                    </div>
                )}

                {(() => {
                    const isPresetCatalog = SYSTEM_CATALOGS.some(cat => cat.url === newField.catalogUrl);
                    const selectedCatalogMode = isPresetCatalog ? (newField.catalogUrl || '/api/catalogs/programas') : 'custom';

                    const renderForm = () => (
                        <div className="p-3.5 border border-border-hover rounded-xl bg-surface shadow-md space-y-3 animate-fade-in my-1.5 text-xs">
                            <h4 className="text-[10px] font-bold text-text-main uppercase tracking-wider flex items-center justify-between">
                                <span>
                                    {newField.isGroupHeader
                                        ? (editingIndex !== null ? 'Editar Banner de Grupo' : 'Nuevo Banner de Grupo Temático')
                                        : (editingIndex !== null ? 'Editar Campo Personalizado' : 'Nuevo Campo Personalizado')}
                                </span>
                            </h4>

                            <div className="space-y-2.5 text-xs">
                                <div>
                                    <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">
                                        {newField.isGroupHeader ? 'Título del Banner / Grupo *' : 'Nombre del Campo (Etiqueta Visible) *'}
                                    </label>
                                    <input
                                        type="text"
                                        value={newField.label || ''}
                                        onChange={e => handleLabelChange(e.target.value)}
                                        placeholder={newField.isGroupHeader ? 'Ej: A. CLASIFICACIÓN CIENTÍFICA Y CACES' : 'Ej: Nombre del Coordinador o Responsable'}
                                        className="w-full bg-surface border border-border-thin rounded-xl px-2.5 py-1.5 text-xs text-text-main outline-none focus:border-text-main font-semibold transition-colors"
                                    />
                                </div>

                                {newField.isGroupHeader ? (
                                    <div>
                                        <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Estilo Visual del Banner</label>
                                        <select
                                            value={newField.variant || 'banner_gold'}
                                            onChange={e => setNewField(prev => ({ ...prev, variant: e.target.value as any }))}
                                            className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-medium transition-colors cursor-pointer"
                                        >
                                            <option value="banner_gold">Dorado Acreditación (#c4a857)</option>
                                            <option value="banner_navy">Azul Institucional (#222c57)</option>
                                            <option value="banner_emerald">Verde Esmeralda (#065f46)</option>
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Tipo de Campo</label>
                                                <select
                                                    value={newField.fieldType || 'text'}
                                                    onChange={e => setNewField(prev => ({ ...prev, fieldType: e.target.value as any }))}
                                                    className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-medium transition-colors cursor-pointer"
                                                >
                                                    <option value="text">Texto Corto (Línea)</option>
                                                    <option value="textarea">Texto Largo (Área)</option>
                                                    <option value="date">Fecha (dd/mm/aaaa)</option>
                                                    <option value="select_catalog">Catálogo Institucional API</option>
                                                    <option value="select_inline">Selector con Opciones Propias</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Ancho de Fila</label>
                                                <select
                                                    value={newField.colSpan || 1}
                                                    onChange={e => setNewField(prev => ({ ...prev, colSpan: Number(e.target.value) as 1 | 2 }))}
                                                    className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-medium transition-colors cursor-pointer"
                                                >
                                                    <option value={1}>Media Fila (50%)</option>
                                                    <option value={2}>Fila Completa (100%)</option>
                                                </select>
                                            </div>
                                        </div>

                                        {newField.fieldType === 'select_catalog' && (
                                            <div className="space-y-1.5 bg-surface-hover/30 p-2 rounded-xl border border-border-thin/20">
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block">Origen del Catálogo</label>
                                                <select
                                                    value={selectedCatalogMode}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        if (val === 'custom') {
                                                            setNewField(prev => ({ ...prev, catalogUrl: '' }));
                                                        } else {
                                                            setNewField(prev => ({ ...prev, catalogUrl: val }));
                                                        }
                                                    }}
                                                    className="w-full bg-surface border border-border-thin rounded-xl px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-medium cursor-pointer"
                                                >
                                                    {SYSTEM_CATALOGS.map(c => (
                                                        <option key={c.url} value={c.url}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {newField.fieldType === 'select_inline' && (
                                            <div>
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Opciones (una por línea)</label>
                                                <textarea
                                                    rows={3}
                                                    value={inlineOptionsText}
                                                    onChange={e => setInlineOptionsText(e.target.value)}
                                                    placeholder={'Opción 1\nOpción 2\nOpción 3'}
                                                    className="w-full bg-surface border border-border-thin rounded-xl px-2.5 py-1.5 text-xs text-text-main outline-none focus:border-text-main font-mono text-[11px]"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                <div>
                                    <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-1">Guía / Requisito CACES para Docentes</label>
                                    <input
                                        type="text"
                                        value={newField.requirementText || ''}
                                        onChange={e => setNewField(prev => ({ ...prev, requirementText: e.target.value }))}
                                        placeholder="Ej: Instrucción obligatoria que orientará al docente..."
                                        className="w-full bg-surface border border-border-thin rounded-xl px-2.5 py-1.5 text-xs text-text-main outline-none focus:border-text-main transition-colors"
                                    />
                                </div>

                                <div className="pt-1.5 border-t border-border-thin/20">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvancedPdfOptions(!showAdvancedPdfOptions)}
                                        className="text-[9.5px] font-bold text-text-dim hover:text-text-main flex items-center gap-1 transition-colors"
                                    >
                                        <span>{showAdvancedPdfOptions ? 'Ocultar Opciones Avanzadas' : 'Opciones Avanzadas (Identificadores y Claves)'}</span>
                                    </button>

                                    {showAdvancedPdfOptions && (
                                        <div className="animate-fade-in space-y-1.5 bg-surface-hover/30 p-2 rounded-xl border border-border-thin/20 grid grid-cols-2 gap-2 mt-1.5">
                                            <div>
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-0.5">Clave de Campo</label>
                                                <input
                                                    type="text"
                                                    value={newField.fieldKey || ''}
                                                    onChange={e => setNewField(prev => ({ ...prev, fieldKey: e.target.value }))}
                                                    placeholder="Auto-generado"
                                                    className="w-full bg-surface border border-border-thin rounded-lg px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-mono text-[10px]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wide block mb-0.5">Identificador en PDF</label>
                                                <input
                                                    type="text"
                                                    value={newField.scriptVariable || ''}
                                                    onChange={e => setNewField(prev => ({ ...prev, scriptVariable: e.target.value }))}
                                                    placeholder="Auto-generado"
                                                    className="w-full bg-surface border border-border-thin rounded-lg px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-mono text-[10px]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-border-thin/20">
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); setEditingIndex(null); }}
                                    className="btn-vercel-secondary text-[10px] font-bold py-1 px-3 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveField}
                                    className="btn-vercel-primary text-[10px] font-bold py-1 px-3.5 rounded-xl"
                                >
                                    {editingIndex !== null ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    );

                    return (
                        <>
                            <div className="space-y-1.5">
                                {customFields.map((field, idx) => (
                                    <React.Fragment key={field.fieldKey + idx}>
                                        <div
                                            className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 ${editingIndex === idx
                                                    ? 'border-border-hover bg-surface-hover/50 shadow-xs'
                                                    : field.isGroupHeader
                                                        ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                                                        : 'border-border-thin bg-surface hover:border-border-hover'
                                                }`}
                                        >
                                            <div className="space-y-0.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {field.isGroupHeader && (
                                                        <Bookmark className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    )}
                                                    <span className="text-xs font-bold text-text-main truncate">{field.label}</span>
                                                    {field.isGroupHeader ? (
                                                        <span className="badge-vercel-warning text-[8px] px-1.5 py-0.2">
                                                            Banner Grupo
                                                        </span>
                                                    ) : (
                                                        <span className="badge-vercel-neutral font-mono text-[8px] px-1.5 py-0.2 uppercase">
                                                            {field.fieldType}
                                                        </span>
                                                    )}
                                                </div>
                                                {!field.isGroupHeader && (
                                                    <div className="text-[9px] font-mono text-text-dim flex flex-wrap gap-x-3 gap-y-0.5">
                                                        <span>PDF: {field.scriptMode === 'static' ? 'estático' : `{{${field.scriptVariable || field.fieldKey}}}`}</span>
                                                        {field.catalogUrl && <span>catálogo: {field.catalogUrl}</span>}
                                                    </div>
                                                )}
                                                {field.requirementText && (
                                                    <span className="text-[9px] text-text-dim italic block truncate">{field.requirementText}</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={() => handleMoveField(idx, 'up')}
                                                    className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors disabled:opacity-20 disabled:pointer-events-none"
                                                    title="Mover arriba"
                                                >
                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === customFields.length - 1}
                                                    onClick={() => handleMoveField(idx, 'down')}
                                                    className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors disabled:opacity-20 disabled:pointer-events-none"
                                                    title="Mover abajo"
                                                >
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(idx)}
                                                    className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                                                    title="Editar elemento"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveField(idx)}
                                                    className="p-1.5 rounded-lg text-text-dim hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                    title="Eliminar elemento"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {editingIndex === idx && isAdding && renderForm()}
                                    </React.Fragment>
                                ))}
                            </div>

                            {editingIndex === null && isAdding && renderForm()}

                            {!isAdding && (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleStartAdd(true)}
                                        className="btn-vercel-secondary text-[10px] font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-amber-600 hover:text-amber-500 border-amber-500/30 hover:border-amber-500/50"
                                        title="Crear separador de grupo temático"
                                    >
                                        <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                                        <span>+ Banner Grupo</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStartAdd(false)}
                                        className="btn-vercel-primary text-[10px] font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>+ Campo</span>
                                    </button>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
};


