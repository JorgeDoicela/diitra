import React, { useState } from 'react';
import { Plus, Trash2, Database, Sliders, ChevronDown, ChevronUp, Pencil, Palette } from 'lucide-react';
import type { DocumentBlock, IdentificationField } from '../../types';
import { HEADER_STYLE_OPTIONS } from '../BlockCanvas';

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

    const handleStartAdd = () => {
        setEditingIndex(null);
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

    const [editingCoreKey, setEditingCoreKey] = useState<string | null>(null);

    const CORE_ITEMS = [
        { key: 'showTitulo', labelKey: 'customLabel_showTitulo', scribanKey: 'customScriban_showTitulo', defaultLabel: 'Nombre del Proyecto', defaultScriban: 'titulo', desc: 'Campo de texto en mayúsculas para el tema.' },
        { key: 'showDirector', labelKey: 'customLabel_showDirector', scribanKey: 'customScriban_showDirector', defaultLabel: 'Director del Proyecto', defaultScriban: 'director_proyecto', desc: 'Campo para ingresar el nombre del director.' },
        { key: 'showCarrera', labelKey: 'customLabel_showCarrera', scribanKey: 'customScriban_showCarrera', defaultLabel: 'Carrera / Unidad Académica', defaultScriban: 'carrera', desc: 'Selector de la carrera vinculada del docente.' },
        { key: 'showConvocatoria', labelKey: 'customLabel_showConvocatoria', scribanKey: 'customScriban_showConvocatoria', defaultLabel: 'Convocatoria Activa', defaultScriban: 'convocatoria', desc: 'Selector de los plazos y convocatorias vigentes.' },
        { key: 'showPrograma', labelKey: 'customLabel_showPrograma', scribanKey: 'customScriban_showPrograma', defaultLabel: 'Programa de Investigación', defaultScriban: 'programa', desc: 'Campo de texto/catálogo para clasificar el programa.' },
        { key: 'showGrupo', labelKey: 'customLabel_showGrupo', scribanKey: 'customScriban_showGrupo', defaultLabel: 'Grupo de Investigación', defaultScriban: 'grupo_investigacion', desc: 'Selectores de grupos aprobados con cascada a Dominio y Línea.' },
        { key: 'showLinea', labelKey: 'customLabel_showLinea', scribanKey: 'customScriban_showLinea', defaultLabel: 'Línea de Investigación', defaultScriban: 'linea_investigacion', desc: 'Dominios científicos, líneas y sublíneas.' },
        { key: 'showTipo', labelKey: 'customLabel_showTipo', scribanKey: 'customScriban_showTipo', defaultLabel: 'Tipo de Investigación', defaultScriban: 'tipo_investigacion', desc: 'Investigación básica, aplicada o experimental.' },
        { key: 'showCaces', labelKey: 'customLabel_showCaces', scribanKey: 'customScriban_showCaces', defaultLabel: 'Campo Detallado CACES', defaultScriban: 'campo_detallado', desc: 'Clasificación de campo amplio, específico y detallado.' },
        { key: 'showFechas', labelKey: 'customLabel_showFechas', scribanKey: 'customScriban_showFechas', defaultLabel: 'Fechas y Plazos', defaultScriban: 'fechas', desc: 'Campos de fechas de presentación, inicio y fin.' },
    ];

    return (
        <div className="space-y-5 border-t border-border-thin/20 pt-4">
            {/* SECCIÓN 0: DISEÑO Y ESTILOS DE LA TABLA PDF */}
            <div className="space-y-3 pb-3 border-b border-border-thin/20">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-text-main" />
                    Diseño y Estilo Visual en PDF
                </span>

                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                        <label className="block text-[9px] font-bold text-text-dim uppercase">Estilo de Tabla PDF</label>
                        <select
                            value={config.tableStyle || 'classic'}
                            onChange={e => onUpdateConfig(block.id, 'tableStyle', e.target.value)}
                            className="w-full bg-surface border border-border-thin rounded px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-medium"
                        >
                            <option value="classic">Clásica Institucional</option>
                            <option value="grid">Grilla de Filas</option>
                            <option value="cards">Fichas / Tarjetas (Bento Box)</option>
                            <option value="minimal">Minimalista Cero Bordes</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-text-dim uppercase">Estilo de Encabezado</label>
                        <select
                            value={config.headerColor || 'blue'}
                            onChange={e => onUpdateConfig(block.id, 'headerColor', e.target.value)}
                            className="w-full bg-surface border border-border-thin rounded px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-medium"
                        >
                            {HEADER_STYLE_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-text-dim uppercase">Columnas Bento</label>
                        <select
                            value={config.bentoColumns || 3}
                            onChange={e => onUpdateConfig(block.id, 'bentoColumns', Number(e.target.value))}
                            className="w-full bg-surface border border-border-thin rounded px-2 py-1 text-xs text-text-main outline-none focus:border-text-main font-medium"
                        >
                            <option value={2}>2 Columnas</option>
                            <option value={3}>3 Columnas (Bento Grid)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECCIÓN A: CAMPOS INSTITUCIONALES CORE */}
            <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border-thin/20 pb-2">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-text-main" />
                        Campos Institucionales Core
                    </span>
                </div>
                <p className="text-[10px] text-text-dim leading-relaxed">
                    Activa/desactiva y edita las etiquetas que verán los docentes al redactar el documento:
                </p>
                {CORE_ITEMS.map((item) => {
                    const isChecked = (config as any)[item.key] !== false;
                    const customLabel = (config as any)[item.labelKey] || item.defaultLabel;
                    const customScriban = (config as any)[item.scribanKey] || item.defaultScriban;
                    const isEditingThis = editingCoreKey === item.key;

                    return (
                        <div key={item.key} className="border-b border-border-thin/10 pb-2.5 last:border-0 last:pb-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-xs font-semibold text-text-main truncate block">{customLabel}</label>
                                        {customLabel !== item.defaultLabel && (
                                            <span className="px-1 py-0.2 rounded text-[7px] font-mono bg-surface-hover text-text-main border border-border-thin">personalizado</span>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-text-dim block mt-0.5 leading-tight">{item.desc}</span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setEditingCoreKey(isEditingThis ? null : item.key)}
                                        className={`p-1 text-text-dim hover:text-text-main transition-colors rounded ${isEditingThis ? 'text-text-main bg-surface-hover' : ''}`}
                                        title="Personalizar nombre del campo"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={e => onUpdateConfig(block.id, item.key, e.target.checked)}
                                        className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Acordión de edición inline para el campo Core */}
                            {isEditingThis && (
                                <div className="p-3.5 border border-emerald-500/30 rounded-xl bg-surface-deep/80 space-y-3 animate-fade-in my-1 text-xs">
                                    <div>
                                        <label className="block text-[9px] font-bold text-text-dim uppercase">Nombre Visible en el Formulario</label>
                                        <input
                                            type="text"
                                            value={customLabel}
                                            onChange={e => onUpdateConfig(block.id, item.labelKey, e.target.value)}
                                            placeholder={item.defaultLabel}
                                            className="w-full bg-surface border border-border-thin rounded px-2.5 py-1.5 text-xs text-text-main outline-none focus:border-emerald-500"
                                        />
                                        <span className="text-[8.5px] text-text-dim/70 mt-1 block">Este nombre aparecerá en el encabezado de este campo para los usuarios.</span>
                                    </div>

                                    {/* Ajustes avanzados de PDF desplegables opcionales */}
                                    <div className="pt-2 border-t border-border-thin/20 space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAdvancedPdfOptions(!showAdvancedPdfOptions)}
                                            className="text-[9px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                                        >
                                            <span>{showAdvancedPdfOptions ? 'Ocultar Ajustes Avanzados de PDF' : 'Ajustes Avanzados de PDF (Opcional)'}</span>
                                        </button>

                                        {showAdvancedPdfOptions && (
                                            <div className="animate-fade-in space-y-1 bg-surface/50 p-2 rounded-lg border border-border-thin/20">
                                                <label className="block text-[9px] font-bold text-text-dim uppercase">Identificador en Documento PDF</label>
                                                <input
                                                    type="text"
                                                    value={customScriban}
                                                    onChange={e => onUpdateConfig(block.id, item.scribanKey, e.target.value)}
                                                    placeholder={item.defaultScriban}
                                                    className="w-full bg-surface border border-border-thin rounded px-2 py-1 text-xs text-text-main outline-none focus:border-emerald-500 font-mono text-[10px]"
                                                />
                                                <span className="text-[8px] text-text-dim/60 block font-mono">Clave interna: {`{{${customScriban || item.defaultScriban}}}`}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setEditingCoreKey(null)}
                                            className="px-3 py-1 bg-emerald-500 text-white rounded text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                                        >
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* SECCIÓN B: CAMPOS PERSONALIZADOS EXTENDIDOS */}
            <div className="space-y-4 pt-3 border-t border-border-thin/20">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                        Campos Adicionales / Personalizados ({customFields.length})
                    </span>
                    {!isAdding && (
                        <button
                            type="button"
                            onClick={handleStartAdd}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                            <Plus className="w-3 h-3" />
                            <span>Añadir Campo</span>
                        </button>
                    )}
                </div>

                    {/* Lista de campos configurados */}
                    {customFields.length === 0 && !isAdding && (
                        <p className="text-[10px] text-text-dim/60 italic text-center py-4 border border-dashed border-border-thin/30 rounded-lg">
                            No hay campos adicionales configurados. Haz clic en "Añadir Campo" para agregar el primero.
                        </p>
                    )}

                    {/* Función de renderizado del formulario inline */}
                    {(() => {
                        const isPresetCatalog = SYSTEM_CATALOGS.some(cat => cat.url === newField.catalogUrl);
                        const selectedCatalogMode = isPresetCatalog ? (newField.catalogUrl || '/api/catalogs/programas') : 'custom';

                        const renderForm = () => (
                            <div className="p-4 border border-emerald-500/30 rounded-xl bg-surface-deep/90 space-y-3.5 animate-fade-in my-2">
                                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-between">
                                    <span>{editingIndex !== null ? 'Editar Campo Personalizado' : 'Nuevo Campo Personalizado'}</span>
                                </h4>

                                <div className="space-y-3 text-xs">
                                    <div>
                                        <label className="block text-[9px] font-bold text-text-dim uppercase">Nombre del Campo (Etiqueta Visible) *</label>
                                        <input
                                            type="text"
                                            value={newField.label || ''}
                                            onChange={e => handleLabelChange(e.target.value)}
                                            placeholder="Ej: Nombre del Coordinador o Responsable"
                                            className="w-full bg-surface border border-border-thin rounded-lg px-3 py-1.5 text-xs text-text-main outline-none focus:border-emerald-500 shadow-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[9px] font-bold text-text-dim uppercase">Tipo de Campo</label>
                                            <select
                                                value={newField.fieldType || 'text'}
                                                onChange={e => setNewField(prev => ({ ...prev, fieldType: e.target.value as any }))}
                                                className="w-full bg-surface border border-border-thin rounded px-2 py-1.5 text-xs text-text-main outline-none focus:border-emerald-500 font-medium"
                                            >
                                                <option value="text">Texto Corto (Una línea)</option>
                                                <option value="textarea">Texto Largo (Párrafo explicativo)</option>
                                                <option value="date">Fecha (Calendario interactivo)</option>
                                                <option value="select_inline">Selector (Opciones Fijas Predefinidas)</option>
                                                <option value="select_catalog">Selector (Catálogo de Base de Datos)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-bold text-text-dim uppercase">¿Cómo se llena en el Documento?</label>
                                            <select
                                                value={newField.scriptMode || 'scriban'}
                                                onChange={e => setNewField(prev => ({ ...prev, scriptMode: e.target.value as any }))}
                                                className="w-full bg-surface border border-border-thin rounded px-2 py-1.5 text-xs text-text-main outline-none focus:border-emerald-500 font-medium"
                                            >
                                                <option value="scriban">Interactivo (El docente escribe la información)</option>
                                                <option value="static">Texto Fijo (Imprime valor predeterminado)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Opciones inline para select_inline */}
                                    {newField.fieldType === 'select_inline' && (
                                        <div className="space-y-1">
                                            <label className="block text-[9px] font-bold text-text-dim uppercase">Opciones Disponibles (Escriba una opción por línea)</label>
                                            <textarea
                                                rows={3}
                                                value={inlineOptionsText}
                                                onChange={e => setInlineOptionsText(e.target.value)}
                                                placeholder={"Opción 1\nOpción 2\nOpción 3"}
                                                className="w-full bg-surface border border-border-thin rounded p-2 text-xs text-text-main outline-none focus:border-emerald-500 font-mono text-[10px]"
                                            />
                                        </div>
                                    )}

                                    {/* Opciones de catálogo BD para select_catalog */}
                                    {newField.fieldType === 'select_catalog' && (
                                        <div className="space-y-2 border-t border-border-thin/20 pt-2">
                                            <div>
                                                <label className="block text-[9px] font-bold text-text-dim uppercase">Catálogo de Base de Datos del Sistema</label>
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
                                                    className="w-full bg-surface border border-border-thin rounded px-2 py-1.5 text-xs text-text-main outline-none focus:border-emerald-500 font-medium"
                                                >
                                                    {SYSTEM_CATALOGS.map(cat => (
                                                        <option key={cat.url} value={cat.url}>{cat.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {selectedCatalogMode === 'custom' && (
                                                <div>
                                                    <label className="block text-[9px] font-bold text-text-dim uppercase">URL de API Personalizada</label>
                                                    <input
                                                        type="text"
                                                        value={newField.catalogUrl || ''}
                                                        onChange={e => setNewField(prev => ({ ...prev, catalogUrl: e.target.value }))}
                                                        placeholder="Ej: /api/catalogs/mi-catalogo"
                                                        className="w-full bg-surface border border-border-thin rounded px-2 py-1 text-xs text-text-main outline-none focus:border-emerald-500 font-mono text-[10px]"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Identificador avanzado PDF (Opcional/Auto-generado) */}
                                    <div className="pt-2 border-t border-border-thin/20 space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAdvancedPdfOptions(!showAdvancedPdfOptions)}
                                            className="text-[9px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                                        >
                                            <span>{showAdvancedPdfOptions ? 'Ocultar Identificadores Avanzados' : 'Opciones Avanzadas (Identificadores y Claves)'}</span>
                                        </button>

                                        {showAdvancedPdfOptions && (
                                            <div className="animate-fade-in space-y-2 bg-surface/50 p-2.5 rounded-lg border border-border-thin/20 grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[9px] font-bold text-text-dim uppercase">Clave de Campo (fieldKey)</label>
                                                    <input
                                                        type="text"
                                                        value={newField.fieldKey || ''}
                                                        onChange={e => setNewField(prev => ({ ...prev, fieldKey: e.target.value }))}
                                                        placeholder="Auto-generado"
                                                        className="w-full bg-surface border border-border-thin rounded px-2 py-1 text-xs text-text-main outline-none focus:border-emerald-500 font-mono text-[10px]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-text-dim uppercase">Identificador en PDF (Variable)</label>
                                                    <input
                                                        type="text"
                                                        value={newField.scriptVariable || ''}
                                                        onChange={e => setNewField(prev => ({ ...prev, scriptVariable: e.target.value }))}
                                                        placeholder="Auto-generado"
                                                        className="w-full bg-surface border border-border-thin rounded px-2 py-1 text-xs text-text-main outline-none focus:border-emerald-500 font-mono text-[10px]"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {!showAdvancedPdfOptions && newField.label && (
                                            <p className="text-[8.5px] font-mono text-text-dim/60 italic">
                                                Variable PDF generada automáticamente: <span className="font-bold text-emerald-600">{`{{${newField.scriptVariable || newField.fieldKey || 'campo'}}}`}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-thin/10">
                                    <button
                                        type="button"
                                        onClick={() => { setIsAdding(false); setEditingIndex(null); }}
                                        className="px-3 py-1.5 bg-surface border border-border-thin text-text-dim rounded text-xs hover:text-text-main transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveField}
                                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                    >
                                        {editingIndex !== null ? 'Actualizar Campo' : 'Guardar Campo'}
                                    </button>
                                </div>
                            </div>
                        );

                        return (
                            <>
                                <div className="space-y-2">
                                    {customFields.map((field, idx) => (
                                        <React.Fragment key={field.fieldKey + idx}>
                                            <div
                                                className={`p-3 border rounded-lg transition-all flex items-start justify-between gap-2 ${
                                                    editingIndex === idx
                                                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-sm'
                                                        : 'border-border-thin/40 bg-surface/40 hover:bg-surface/80'
                                                }`}
                                            >
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-text-main truncate">{field.label}</span>
                                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                            {field.fieldType}
                                                        </span>
                                                    </div>
                                                    <div className="text-[9px] font-mono text-text-dim flex flex-wrap gap-x-3 gap-y-0.5">
                                                        <span>PDF: {field.scriptMode === 'static' ? 'estático' : `{{${field.scriptVariable || field.fieldKey}}}`}</span>
                                                        {field.catalogUrl && <span>catálogo: {field.catalogUrl}</span>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartEdit(idx)}
                                                        className="p-1 text-text-dim hover:text-emerald-500 transition-colors"
                                                        title="Editar campo"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={idx === 0}
                                                        onClick={() => handleMoveField(idx, 'up')}
                                                        className="p-1 text-text-dim hover:text-text-main disabled:opacity-30"
                                                        title="Mover arriba"
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={idx === customFields.length - 1}
                                                        onClick={() => handleMoveField(idx, 'down')}
                                                        className="p-1 text-text-dim hover:text-text-main disabled:opacity-30"
                                                        title="Mover abajo"
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveField(idx)}
                                                        className="p-1 text-text-dim hover:text-red-500 transition-colors"
                                                        title="Eliminar campo"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Si estamos editando ESTE elemento específico, mostrar el formulario debajo */}
                                            {editingIndex === idx && isAdding && renderForm()}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* Si estamos agregando un NUEVO elemento, mostrar el formulario al final */}
                                {editingIndex === null && isAdding && renderForm()}
                            </>
                        );
                    })()}
                </div>
        </div>
    );
};
