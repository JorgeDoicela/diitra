import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Scissors, Pencil, Check, X, EyeOff, Plus } from 'lucide-react';
import type { ImpactCategory } from '../../types';
import { DEFAULT_TECHNICAL_SUBSECTIONS, DEFAULT_IMPACT_CATEGORIES, DEFAULT_FINAL_REPORT_WRITING_SUBSECTIONS } from '../../types';
import { getNormalizedColumns, getNormalizedCategories } from '../properties/ExpectedProductsProperties';

import { resolveHeaderColor, getContrastFg } from '../properties/SharedColorPicker';

export const RenderProjectGeneralSection: React.FC<{
    config?: any;
    title?: string;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, title, blockId, onUpdateConfig }) => {
    const c = config || {};
    const displayTitle = c.title || title || '1.  IDENTIFICACIÓN DEL PROYECTO';
    const defaultHeaderBg = resolveHeaderColor(c.headerColor || '#222c57');
    const borderStyle = c.borderStyle || 'solid';
    const isNoBorder = borderStyle === 'none';

    const tableBorderCss = isNoBorder ? 'border-0' : 'border border-black';
    const cellBorderCss = isNoBorder ? 'border-b border-black' : 'border-r border-black';
    const rowBorderCss = 'border-b border-black';

    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');

    const resolveBg = (variant?: string, defaultColor = defaultHeaderBg) => {
        if (variant === 'banner_gold') return '#c4a857';
        if (variant === 'banner_emerald') return '#065f46';
        if (variant === 'banner_navy') return '#222c57';
        if (variant && (variant.startsWith('#') || variant.startsWith('rgb') || variant.startsWith('hsl'))) return variant;
        return defaultColor;
    };

    const customFields: any[] = Array.isArray(c.customFields) ? c.customFields : [];

    const handleMoveDirect = (itemKey: string, direction: 'up' | 'down', currentActiveKeys: string[]) => {
        if (!onUpdateConfig || !blockId) return;
        const index = currentActiveKeys.indexOf(itemKey);
        if (index === -1) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentActiveKeys.length) return;

        const updatedOrder = [...currentActiveKeys];
        const [moved] = updatedOrder.splice(index, 1);
        updatedOrder.splice(targetIndex, 0, moved);

        onUpdateConfig(blockId, 'fieldsOrder', updatedOrder);
    };

    const handleCycleVariantDirect = (itemKey: string, isCustom = false) => {
        if (!onUpdateConfig || !blockId) return;
        const variants = ['standard', 'banner_gold', 'banner_navy', 'banner_emerald'];
        if (isCustom) {
            const updated = customFields.map(f => {
                if ((f.fieldKey || f.id) === itemKey) {
                    const currentIdx = variants.indexOf(f.variant || 'standard');
                    const nextVariant = variants[(currentIdx + 1) % variants.length];
                    return { ...f, variant: nextVariant };
                }
                return f;
            });
            onUpdateConfig(blockId, 'customFields', updated);
        } else {
            const current = c[`variant_${itemKey}`] || 'standard';
            const currentIdx = variants.indexOf(current);
            const nextVariant = variants[(currentIdx + 1) % variants.length];
            onUpdateConfig(blockId, `variant_${itemKey}`, nextVariant);
        }
    };

    const handleHideFieldDirect = (itemKey: string, isCustom = false) => {
        if (!onUpdateConfig || !blockId) return;
        if (isCustom) {
            const updated = customFields.filter(f => (f.fieldKey || f.id) !== itemKey);
            onUpdateConfig(blockId, 'customFields', updated);
        } else {
            onUpdateConfig(blockId, itemKey, false);
        }
    };

    const handleSaveLabelDirect = (itemKey: string, isCustom = false) => {
        if (!onUpdateConfig || !blockId) return;
        if (itemKey === 'section_title') {
            onUpdateConfig(blockId, 'title', editingText.trim() || '1. IDENTIFICACIÓN DEL PROYECTO');
        } else if (isCustom) {
            const updated = customFields.map(f => {
                if ((f.fieldKey || f.id) === itemKey) {
                    return { ...f, label: editingText.trim() };
                }
                return f;
            });
            onUpdateConfig(blockId, 'customFields', updated);
        } else {
            onUpdateConfig(blockId, `customLabel_${itemKey}`, editingText.trim());
        }
        setEditingKey(null);
    };

    const handleQuickAdd = (isBanner: boolean) => {
        if (!onUpdateConfig || !blockId) return;
        const newKey = `custom_${Date.now().toString().slice(-4)}`;
        const newField = {
            fieldKey: newKey,
            label: isBanner ? 'NUEVO ENCABEZADO TEMÁTICO' : 'NUEVO CAMPO',
            fieldType: 'text',
            colSpan: isBanner ? 2 : 1,
            isGroupHeader: isBanner,
            variant: isBanner ? 'banner_gold' : 'standard',
            placeholder: 'Información a completar...',
        };
        onUpdateConfig(blockId, 'customFields', [...customFields, newField]);
    };

    const renderDirectControlsPill = (
        itemKey: string,
        rawLabel: string,
        isFirst: boolean,
        isLast: boolean,
        variant: string,
        isCustom = false,
        allActiveKeys: string[]
    ) => {
        if (!onUpdateConfig) return null;
        return (
            <div
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover/row:opacity-100 transition-opacity absolute top-1 right-2 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-1.5 py-0.5 rounded-md shadow-md border border-slate-200 dark:border-slate-700 text-[8px] z-30 font-sans select-none"
            >
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleMoveDirect(itemKey, 'up', allActiveKeys); }}
                    disabled={isFirst}
                    className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 disabled:opacity-20 cursor-pointer transition-colors"
                    title="Mover arriba"
                >
                    <ArrowUp className="w-2.5 h-2.5" />
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleMoveDirect(itemKey, 'down', allActiveKeys); }}
                    disabled={isLast}
                    className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 disabled:opacity-20 cursor-pointer transition-colors"
                    title="Mover abajo"
                >
                    <ArrowDown className="w-2.5 h-2.5" />
                </button>

                <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setEditingKey(itemKey);
                        setEditingText(rawLabel);
                    }}
                    className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-text-main cursor-pointer transition-colors flex items-center gap-0.5"
                    title="Renombrar etiqueta"
                >
                    <Pencil className="w-2.5 h-2.5" />
                </button>

                <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />

                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleCycleVariantDirect(itemKey, isCustom); }}
                    className={`px-1 py-0.2 text-[7.5px] font-bold rounded border transition-all cursor-pointer ${
                        variant === 'banner_gold'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : variant === 'banner_navy'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : variant === 'banner_emerald'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Cambiar color del encabezado"
                >
                    {variant === 'banner_gold' ? 'Dorado' : variant === 'banner_navy' ? 'Azul' : variant === 'banner_emerald' ? 'Verde' : 'Estándar'}
                </button>

                <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />

                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleHideFieldDirect(itemKey, isCustom); }}
                    className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                    title="Ocultar campo del formulario"
                >
                    <EyeOff className="w-2.5 h-2.5" />
                </button>
            </div>
        );
    };

    interface BaseItem {
        id: string;
        rawLabel: string;
        variant: string;
        isCustom?: boolean;
        render: (isFirst: boolean, isLast: boolean, allKeys: string[]) => React.ReactNode;
    }

    const items: BaseItem[] = [];

    // 1. NOMBRE DEL PROYECTO
    if (c.showTitulo !== false) {
        const variant = c.variant_showTitulo || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showTitulo || 'Nombre del Proyecto';
        const labelDisplay = c.customLabel_showTitulo ? `${c.customLabel_showTitulo.trim()}:` : 'Nombre del Proyecto:';
        const req = c.req_showTitulo || 'Es el título del proyecto; deben escribir un nombre claro, específico y relacionado con el problema o solución que se investiga. ';

        items.push({
            id: 'showTitulo',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <tr key="showTitulo" className={`${rowBorderCss} group/row relative`}>
                    <td
                        className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                        style={{ backgroundColor: bg, color: fg }}
                    >
                        {editingKey === 'showTitulo' ? (
                            <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={editingText}
                                    onChange={e => setEditingText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('showTitulo'); if (e.key === 'Escape') setEditingKey(null); }}
                                    autoFocus
                                    className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                />
                                <button type="button" onClick={() => handleSaveLabelDirect('showTitulo')} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                    <Check className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <span>{labelDisplay}</span>
                        )}
                        {renderDirectControlsPill('showTitulo', rawLabel, isFirst, isLast, variant, false, allKeys)}
                    </td>
                    <td colSpan={6} className="p-2 text-slate-700 bg-white align-middle">
                        <span className="text-slate-600 italic">[{req}]</span>
                    </td>
                </tr>
            )
        });
    }

    // 1.1 CÓDIGO DEL PROYECTO
    if (c.showCodigo !== false) {
        const variant = c.variant_showCodigo || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showCodigo || 'Código del Proyecto';
        const labelDisplay = c.customLabel_showCodigo ? `${c.customLabel_showCodigo.trim()}:` : 'Código del Proyecto:';
        const defaultCode = c.req_showCodigo || 'INV-PROY-26.27-01';

        items.push({
            id: 'showCodigo',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <tr key="showCodigo" className={`${rowBorderCss} group/row relative`}>
                    <td
                        className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                        style={{ backgroundColor: bg, color: fg }}
                    >
                        {editingKey === 'showCodigo' ? (
                            <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={editingText}
                                    onChange={e => setEditingText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('showCodigo'); if (e.key === 'Escape') setEditingKey(null); }}
                                    autoFocus
                                    className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                />
                                <button type="button" onClick={() => handleSaveLabelDirect('showCodigo')} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                    <Check className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <span>{labelDisplay}</span>
                        )}
                        {renderDirectControlsPill('showCodigo', rawLabel, isFirst, isLast, variant, false, allKeys)}
                    </td>
                    <td colSpan={6} className="p-2 text-slate-800 font-mono text-[8.5px] bg-white align-middle">
                        {defaultCode}
                    </td>
                </tr>
            )
        });
    }

    // 2. PROGRAMA
    if (c.showPrograma !== false) {
        const variant = c.variant_showPrograma || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showPrograma || 'Programa';
        const labelDisplay = c.customLabel_showPrograma ? `${c.customLabel_showPrograma.trim()}:` : 'Programa:';
        const req = c.req_showPrograma || 'Elija un elemento.';

        items.push({
            id: 'showPrograma',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <tr key="showPrograma" className={`${rowBorderCss} group/row relative`}>
                    <td
                        className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                        style={{ backgroundColor: bg, color: fg }}
                    >
                        {editingKey === 'showPrograma' ? (
                            <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={editingText}
                                    onChange={e => setEditingText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('showPrograma'); if (e.key === 'Escape') setEditingKey(null); }}
                                    autoFocus
                                    className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                />
                                <button type="button" onClick={() => handleSaveLabelDirect('showPrograma')} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                    <Check className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <span>{labelDisplay}</span>
                        )}
                        {renderDirectControlsPill('showPrograma', rawLabel, isFirst, isLast, variant, false, allKeys)}
                    </td>
                    <td colSpan={6} className="p-2 text-slate-600 italic bg-white align-middle">
                        {req}
                    </td>
                </tr>
            )
        });
    }

    // 3. GRUPO DE INVESTIGACIÓN (LAYOUT OFICIAL CACES SUB-GRILLA SI/NO)
    if (c.showGrupo !== false) {
        const variant = c.variant_showGrupo || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showGrupo || 'Grupo de Investigación al que pertenece el Proyecto';
        const labelDisplay = c.customLabel_showGrupo ? `${c.customLabel_showGrupo.trim()}:` : 'Grupo de Investigación al que pertenece el Proyecto:';
        const req = c.req_showGrupo || 'Escriba el Nombre o N/A';

        items.push({
            id: 'showGrupo',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <React.Fragment key="showGrupo">
                    <tr className={`${rowBorderCss} group/row relative`}>
                        <td
                            rowSpan={2}
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            {editingKey === 'showGrupo' ? (
                                <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editingText}
                                        onChange={e => setEditingText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('showGrupo'); if (e.key === 'Escape') setEditingKey(null); }}
                                        autoFocus
                                        className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                    />
                                    <button type="button" onClick={() => handleSaveLabelDirect('showGrupo')} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                        <Check className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <span>{labelDisplay}</span>
                            )}
                            {renderDirectControlsPill('showGrupo', rawLabel, isFirst, isLast, variant, false, allKeys)}
                        </td>
                        <td className={`font-bold text-[8px] text-center ${cellBorderCss} p-1 align-middle bg-white text-slate-800`}>
                            SI
                        </td>
                        <td className={`text-center ${cellBorderCss} p-1 text-[8.5px] align-middle bg-white`}>
                            <span className="inline-block w-3.5 h-3.5 border border-slate-500 rounded-xs bg-slate-50/50"></span>
                        </td>
                        <td rowSpan={2} colSpan={4} className="p-2 text-slate-600 italic text-[8.5px] align-middle bg-white">
                            [{req}]
                        </td>
                    </tr>
                    <tr className={rowBorderCss}>
                        <td className={`font-bold text-[8px] text-center ${cellBorderCss} p-1 align-middle bg-white text-slate-800`}>
                            NO
                        </td>
                        <td className={`text-center ${cellBorderCss} p-1 text-[8.5px] align-middle bg-white`}>
                            <span className="inline-block w-3.5 h-3.5 border border-slate-500 rounded-xs bg-slate-50/50"></span>
                        </td>
                    </tr>
                </React.Fragment>
            )
        });
    }

    // 4. LÍNEA Y SUBLÍNEA DE INVESTIGACIÓN (DOMINIO OPCIONAL)
    if (c.showLinea !== false) {
        const variant = c.variant_showLinea || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showLinea || 'Línea de Investigación';
        const labelDisplay = c.customLabel_showLinea ? `${c.customLabel_showLinea.trim()}:` : 'Línea de Investigación:';
        const reqLinea = c.req_showLinea || ' Define el área general del conocimiento del proyecto; deben escribir una línea institucional vigente. ';
        const reqSublinea = c.req_showSublinea || ' Especifica el enfoque particular dentro de la línea; deben escribir la sublínea que se relacione directamente con el tema. ';

        items.push({
            id: 'showLinea',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <React.Fragment key="showLinea">
                    {c.showDominio === true && (
                        <tr className={`${rowBorderCss} group/row relative`}>
                            <td
                                className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                                style={{ backgroundColor: bg, color: fg }}
                            >
                                DOMINIO:
                            </td>
                            <td colSpan={6} className="p-2 text-slate-600 italic text-[8.5px] bg-white align-middle">
                                [Área del conocimiento]
                            </td>
                        </tr>
                    )}
                    <tr className={`${rowBorderCss} group/row relative`}>
                        <td
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            {editingKey === 'showLinea' ? (
                                <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editingText}
                                        onChange={e => setEditingText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('showLinea'); if (e.key === 'Escape') setEditingKey(null); }}
                                        autoFocus
                                        className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                    />
                                    <button type="button" onClick={() => handleSaveLabelDirect('showLinea')} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                        <Check className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <span>{labelDisplay}</span>
                            )}
                            {renderDirectControlsPill('showLinea', rawLabel, isFirst, isLast, variant, false, allKeys)}
                        </td>
                        <td colSpan={6} className="p-2 text-slate-600 italic text-[8.5px] bg-white align-middle">
                            [{reqLinea}]
                        </td>
                    </tr>
                    <tr className={rowBorderCss}>
                        <td
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            Sublínea de Investigación:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-600 italic text-[8.5px] bg-white align-middle">
                            [{reqSublinea}]
                        </td>
                    </tr>
                </React.Fragment>
            )
        });
    }

    // 5. TIPO DE INVESTIGACIÓN (LAYOUT OFICIAL CACES 4 CASILLAS)
    if (c.showTipo !== false) {
        const variant = c.variant_showTipo || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showTipo || 'Tipo de Investigación (X)';
        const labelDisplay = c.customLabel_showTipo ? `${c.customLabel_showTipo.trim()}:` : 'Tipo de Investigación (X):';

        items.push({
            id: 'showTipo',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <React.Fragment key="showTipo">
                    <tr className={`${rowBorderCss} group/row relative`}>
                        <td
                            rowSpan={2}
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            {editingKey === 'showTipo' ? (
                                <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editingText}
                                        onChange={e => setEditingText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('showTipo'); if (e.key === 'Escape') setEditingKey(null); }}
                                        autoFocus
                                        className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                    />
                                    <button type="button" onClick={() => handleSaveLabelDirect('showTipo')} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                        <Check className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <span>{labelDisplay}</span>
                            )}
                            {renderDirectControlsPill('showTipo', rawLabel, isFirst, isLast, variant, false, allKeys)}
                        </td>
                        <td className={`font-bold text-[7.5px] text-center ${cellBorderCss} p-1 align-middle bg-white text-slate-800 leading-tight`}>
                            BÁSICA PURA
                        </td>
                        <td className={`text-center ${cellBorderCss} p-1 text-[8.5px] align-middle bg-white`}>
                            <span className="inline-block w-3.5 h-3.5 border border-slate-500 rounded-xs bg-slate-50/50"></span>
                        </td>
                        <td rowSpan={2} className={`font-bold text-[7.5px] text-center ${cellBorderCss} p-1 align-middle bg-white text-slate-800`}>
                            APLICADA
                        </td>
                        <td rowSpan={2} className={`text-center ${cellBorderCss} p-1 text-[8.5px] align-middle bg-white`}>
                            <span className="inline-block w-3.5 h-3.5 border border-slate-500 rounded-xs bg-slate-50/50"></span>
                        </td>
                        <td rowSpan={2} className={`font-bold text-[7px] text-center ${cellBorderCss} p-1 align-middle bg-white text-slate-800 leading-tight`}>
                            DESARROLLO EXPERIMENTAL
                        </td>
                        <td rowSpan={2} className="text-center p-1 text-[8.5px] align-middle bg-white">
                            <span className="inline-block w-3.5 h-3.5 border border-slate-500 rounded-xs bg-slate-50/50"></span>
                        </td>
                    </tr>
                    <tr className={rowBorderCss}>
                        <td className={`font-bold text-[7.5px] text-center ${cellBorderCss} p-1 align-middle bg-white text-slate-800 leading-tight`}>
                            BÁSICA ORIENTADA
                        </td>
                        <td className={`text-center ${cellBorderCss} p-1 text-[8.5px] align-middle bg-white`}>
                            <span className="inline-block w-3.5 h-3.5 border border-slate-500 rounded-xs bg-slate-50/50"></span>
                        </td>
                    </tr>
                </React.Fragment>
            )
        });
    }

    // 6. CLASIFICACIÓN CACES / UNESCO (OPCIONAL, OCULTO POR DEFECTO EN FORMATO OFICIAL)
    if (c.showCaces === true) {
        const variant = c.variant_showCaces || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showCaces || 'Clasificación UNESCO / CACES';
        const labelDisplay = c.customLabel_showCaces ? `${c.customLabel_showCaces.trim()}:` : 'CAMPO DETALLADO:';
        const req = c.req_showCaces;

        items.push({
            id: 'showCaces',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <React.Fragment key="showCaces">
                    <tr className={`${rowBorderCss} group/row relative`}>
                        <td
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            CAMPO AMPLIO:
                            {renderDirectControlsPill('showCaces', rawLabel, isFirst, isLast, variant, false, allKeys)}
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    <tr className={rowBorderCss}>
                        <td
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            CAMPO ESPECÍFICO:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    <tr className={rowBorderCss}>
                        <td
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            {editingKey === 'showCaces' ? (
                                <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editingText}
                                        onChange={e => setEditingText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('showCaces'); if (e.key === 'Escape') setEditingKey(null); }}
                                        autoFocus
                                        className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                    />
                                    <button type="button" onClick={() => handleSaveLabelDirect('showCaces')} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                        <Check className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <span>{labelDisplay}</span>
                            )}
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            {req ? <span className="text-slate-500 italic">[{req}]</span> : <>&nbsp;</>}
                        </td>
                    </tr>
                </React.Fragment>
            )
        });
    }

    // 7. CARRERA(S) / ÁREA
    if (c.showCarrera !== false) {
        const variant = c.variant_showCarrera || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showCarrera || 'Carrera(s)/Área';
        const labelDisplay = c.customLabel_showCarrera ? `${c.customLabel_showCarrera.trim()}:` : 'Carrera(s)/Área:';
        const req = c.req_showCarrera || ' Indica la carrera(s) o área académica involucrada; deben escribir una o varias carreras relacionadas con el proyecto. ';

        items.push({
            id: 'showCarrera',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <tr key="showCarrera" className={`${rowBorderCss} group/row relative`}>
                    <td
                        className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                        style={{ backgroundColor: bg, color: fg }}
                    >
                        {editingKey === 'showCarrera' ? (
                            <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={editingText}
                                    onChange={e => setEditingText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('showCarrera'); if (e.key === 'Escape') setEditingKey(null); }}
                                    autoFocus
                                    className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                />
                                <button type="button" onClick={() => handleSaveLabelDirect('showCarrera')} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                    <Check className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <span>{labelDisplay}</span>
                        )}
                        {renderDirectControlsPill('showCarrera', rawLabel, isFirst, isLast, variant, false, allKeys)}
                    </td>
                    <td colSpan={6} className="p-2 text-slate-600 italic text-[8.5px] bg-white align-middle">
                        [{req}]
                    </td>
                </tr>
            )
        });
    }

    // 8. PERIODO ACADÉMICO DE CONVOCATORIA Y TIEMPO DE EJECUCIÓN
    if (c.showConvocatoria !== false) {
        const variant = c.variant_showConvocatoria || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showConvocatoria || 'Periodo y Convocatoria';
        const labelDisplay = c.customLabel_showConvocatoria ? `${c.customLabel_showConvocatoria.trim()}:` : 'Periodo Académico de convocatoria:';
        const reqConvocatoria = c.req_showConvocatoria || ' Señala el periodo en que se presentó o aprobó el proyecto; deben escribir el periodo académico oficial. ';
        const reqTiempo = c.req_showTiempo || ' Indica la duración total del proyecto; deben escribir el número de meses o el rango de fechas. ';

        items.push({
            id: 'showConvocatoria',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <React.Fragment key="showConvocatoria">
                    <tr className={`${rowBorderCss} group/row relative`}>
                        <td
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            {editingKey === 'showConvocatoria' ? (
                                <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editingText}
                                        onChange={e => setEditingText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('showConvocatoria'); if (e.key === 'Escape') setEditingKey(null); }}
                                        autoFocus
                                        className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                    />
                                    <button type="button" onClick={() => handleSaveLabelDirect('showConvocatoria')} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                        <Check className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <span>{labelDisplay}</span>
                            )}
                            {renderDirectControlsPill('showConvocatoria', rawLabel, isFirst, isLast, variant, false, allKeys)}
                        </td>
                        <td colSpan={6} className="p-2 text-slate-600 italic text-[8.5px] bg-white align-middle">
                            [{reqConvocatoria}]
                        </td>
                    </tr>
                    <tr className={rowBorderCss}>
                        <td
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            Tiempo de Ejecución:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-600 italic text-[8.5px] bg-white align-middle">
                            [{reqTiempo}]
                        </td>
                    </tr>
                </React.Fragment>
            )
        });
    }

    // 9. DIRECTOR DEL PROYECTO
    if (c.showDirector !== false) {
        const variant = c.variant_showDirector || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showDirector || 'Director del Proyecto';
        const labelDisplay = c.customLabel_showDirector ? `${c.customLabel_showDirector.trim()}:` : 'Director del Proyecto:';
        const req = c.req_showDirector || 'Título abreviado, Apellidos y Nombres Completos';

        items.push({
            id: 'showDirector',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <tr key="showDirector" className={`${rowBorderCss} group/row relative`}>
                    <td
                        className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                        style={{ backgroundColor: bg, color: fg }}
                    >
                        {editingKey === 'showDirector' ? (
                            <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={editingText}
                                    onChange={e => setEditingText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('showDirector'); if (e.key === 'Escape') setEditingKey(null); }}
                                    autoFocus
                                    className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                />
                                <button type="button" onClick={() => handleSaveLabelDirect('showDirector')} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                    <Check className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <span>{labelDisplay}</span>
                        )}
                        {renderDirectControlsPill('showDirector', rawLabel, isFirst, isLast, variant, false, allKeys)}
                    </td>
                    <td colSpan={6} className="p-2 text-slate-600 italic text-[8.5px] bg-white align-middle">
                        [{req}]
                    </td>
                </tr>
            )
        });
    }

    // 10. FECHAS (BANNER DORADO INSTITUCIONAL)
    if (c.showFechas !== false) {
        const variant = c.variant_showFechas || 'banner_gold';
        const bg = resolveBg(variant, '#c4a857');
        const fg = getContrastFg(bg);
        const rawLabel = 'Fechas y Plazos';

        items.push({
            id: 'showFechas',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <React.Fragment key="showFechas">
                    <tr className={`${rowBorderCss} group/row relative`}>
                        <td className={`p-1.5 font-bold text-[7.5px] text-center ${cellBorderCss} align-middle relative`} style={{ backgroundColor: bg, color: fg }}>
                            Fecha de presentación del Proyecto
                            {renderDirectControlsPill('showFechas', rawLabel, isFirst, isLast, variant, false, allKeys)}
                        </td>
                        <td colSpan={3} className={`p-1.5 font-bold text-[7.5px] text-center ${cellBorderCss} align-middle`} style={{ backgroundColor: bg, color: fg }}>
                            Fecha prevista de inicio del Proyecto
                        </td>
                        <td colSpan={3} className="p-1.5 font-bold text-[7.5px] text-center align-middle" style={{ backgroundColor: bg, color: fg }}>
                            Fecha prevista de finalización del Proyecto
                        </td>
                    </tr>
                    <tr className={`${rowBorderCss} text-[8px] text-slate-600 italic bg-white text-center`}>
                        <td className={`p-1.5 ${cellBorderCss} align-middle`}>
                            [día/mes/año]
                        </td>
                        <td colSpan={3} className={`p-1.5 ${cellBorderCss} align-middle`}>
                            [día/mes/año]
                        </td>
                        <td colSpan={3} className="p-1.5 align-middle">
                            [día/mes/año]
                        </td>
                    </tr>
                </React.Fragment>
            )
        });
    }

    // 11. CAMPOS Y BANNERS EXTRA PERSONALIZADOS
    customFields.forEach((field, fIdx) => {
        const fieldKey = field.fieldKey || field.id || `custom_${fIdx}`;
        const isBanner = field.isGroupHeader || field.variant?.startsWith('banner');
        const variant = field.variant || (isBanner ? 'banner_gold' : 'standard');
        const fieldBg = resolveBg(variant, defaultHeaderBg);
        const fieldFg = getContrastFg(fieldBg);
        const rawLabel = field.label || (isBanner ? 'NUEVO ENCABEZADO' : 'NUEVO CAMPO');

        if (isBanner) {
            items.push({
                id: fieldKey,
                rawLabel,
                variant,
                isCustom: true,
                render: (isFirst, isLast, allKeys) => (
                    <tr key={fieldKey} className={`${rowBorderCss} group/row relative`}>
                        <td colSpan={7} className="p-1.5 font-bold text-[8px] text-center uppercase align-middle relative" style={{ backgroundColor: fieldBg, color: fieldFg }}>
                            {editingKey === fieldKey ? (
                                <div className="flex items-center justify-center gap-1 select-text max-w-sm mx-auto" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editingText}
                                        onChange={e => setEditingText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect(fieldKey, true); if (e.key === 'Escape') setEditingKey(null); }}
                                        autoFocus
                                        className="bg-white text-slate-900 px-1.5 py-0.5 text-[8.5px] rounded outline-none font-bold text-center w-full"
                                    />
                                    <button type="button" onClick={() => handleSaveLabelDirect(fieldKey, true)} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                        <Check className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <span>{rawLabel}</span>
                            )}
                            {renderDirectControlsPill(fieldKey, rawLabel, isFirst, isLast, variant, true, allKeys)}
                        </td>
                    </tr>
                )
            });
        } else {
            const valPlaceholder = field.requirementText
                ? `[${field.requirementText}]`
                : field.fieldType === 'select_inline'
                    ? `[Opciones: ${(field.options || []).join(', ')}]`
                    : field.fieldType === 'select_catalog'
                        ? `[Catálogo: ${field.catalogUrl || 'API'}]`
                        : field.fieldType === 'date'
                            ? '[día/mes/año]'
                            : (field.placeholder ? `[${field.placeholder}]` : <>&nbsp;</>);

            items.push({
                id: fieldKey,
                rawLabel,
                variant,
                isCustom: true,
                render: (isFirst, isLast, allKeys) => (
                    <tr key={fieldKey} className={`${rowBorderCss} group/row relative`}>
                        <td className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`} style={{ backgroundColor: fieldBg, color: fieldFg }}>
                            {editingKey === fieldKey ? (
                                <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editingText}
                                        onChange={e => setEditingText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect(fieldKey, true); if (e.key === 'Escape') setEditingKey(null); }}
                                        autoFocus
                                        className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold w-full"
                                    />
                                    <button type="button" onClick={() => handleSaveLabelDirect(fieldKey, true)} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                                        <Check className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <span>{rawLabel ? `${rawLabel.trim().toUpperCase()}:` : 'CAMPO:'}</span>
                            )}
                            {renderDirectControlsPill(fieldKey, rawLabel, isFirst, isLast, variant, true, allKeys)}
                        </td>
                        <td colSpan={6} className="p-2 text-slate-700 bg-white align-middle">
                            {valPlaceholder}
                        </td>
                    </tr>
                )
            });
        }
    });

    // Ordenamiento si el usuario reordenó campos
    const fieldsOrder: string[] = Array.isArray(c.fieldsOrder) ? c.fieldsOrder : [];
    if (fieldsOrder.length > 0) {
        items.sort((a, b) => {
            const idxA = fieldsOrder.indexOf(a.id);
            const idxB = fieldsOrder.indexOf(b.id);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
    }

    const allActiveKeys = items.map(i => i.id);

    return (
        <div className="my-2 select-none font-sans group/section relative">
            <div className="flex items-center justify-between mb-2">
                {editingKey === 'section_title' ? (
                    <div className="flex items-center gap-1.5 flex-1 max-w-md select-text" onClick={e => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveLabelDirect('section_title'); if (e.key === 'Escape') setEditingKey(null); }}
                            autoFocus
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-border-thin px-2 py-1 text-xs font-bold uppercase rounded-lg outline-none w-full"
                        />
                        <button type="button" onClick={() => handleSaveLabelDirect('section_title')} className="btn-vercel-primary text-[10px] py-1 px-2">
                            Guardar
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 ml-7 sm:ml-8">
                        <p className="font-bold text-[10pt] uppercase tracking-wide font-sans cursor-pointer hover:opacity-80 transition-opacity" style={{ color: defaultHeaderBg }} onClick={() => { setEditingKey('section_title'); setEditingText(displayTitle); }}>
                            {displayTitle}
                        </p>
                        {onUpdateConfig && (
                            <button
                                type="button"
                                onClick={() => { setEditingKey('section_title'); setEditingText(displayTitle); }}
                                className="opacity-0 group-hover/section:opacity-100 transition-opacity text-slate-400 hover:text-text-main p-1 rounded"
                                title="Editar título de la sección"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                )}

                {onUpdateConfig && (
                    <div className="opacity-0 group-hover/section:opacity-100 transition-opacity flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => handleQuickAdd(false)}
                            className="btn-vercel-secondary text-[9px] font-bold py-0.5 px-2 rounded-lg flex items-center gap-1 text-text-dim hover:text-text-main transition-colors"
                            title="Añadir un campo personalizado directamente"
                        >
                            <Plus className="w-3 h-3" />
                            Campo
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickAdd(true)}
                            className="btn-vercel-secondary text-[9px] font-bold py-0.5 px-2 rounded-lg flex items-center gap-1 text-text-dim hover:text-text-main transition-colors"
                            title="Añadir un banner divisor dorado"
                        >
                            <Plus className="w-3 h-3" />
                            Banner
                        </button>
                    </div>
                )}
            </div>

            <table className={`w-full border-collapse ${tableBorderCss} text-[9px] table-fixed`}>
                <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[13%]" />
                    <col className="w-[7%]" />
                    <col className="w-[14%]" />
                    <col className="w-[7%]" />
                    <col className="w-[18%]" />
                    <col className="w-[7%]" />
                </colgroup>
                <tbody>
                    {items.map((item, idx) => item.render(idx === 0, idx === items.length - 1, allActiveKeys))}
                </tbody>
            </table>
        </div>
    );
};

export const RenderProjectTechnicalSection: React.FC<{
    config: any;
    title?: string;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, title, blockId, onUpdateConfig }) => {
    const c = config || {};
    const displaySectionTitle = c.title || title || '3.  ESPECIFICACIÓN DEL PROYECTO';
    const headerColorKey = c.technicalHeaderColor || '#222c57';
    const borderStyleKey = c.technicalBorderStyle || 'solid';
    const borderColorKey = c.technicalBorderColor || '#000000';
    const borderWidthKey = c.technicalBorderWidth !== undefined ? c.technicalBorderWidth : 1;

    const resolveHeaderBg = (col: string) => {
        if (col && (col.startsWith('#') || col.startsWith('rgb') || col.startsWith('hsl'))) return col;
        switch (col) {
            case 'gold': return '#c4a857';
            case 'slate': return '#334155';
            case 'emerald': return '#065f46';
            case 'navy':
            default: return '#222c57';
        }
    };
    const headerBg = resolveHeaderBg(headerColorKey);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingTitleText, setEditingTitleText] = useState<string>('');

    const handleToggleColSpanDirect = (subKey: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateConfig || !blockId) return;
        const rawSections = c.technicalSections && c.technicalSections.length > 0 ? c.technicalSections : DEFAULT_TECHNICAL_SUBSECTIONS;
        const updated = rawSections.map((s: any) => {
            if ((s.id || s.fieldKey) === subKey) {
                return { ...s, colSpan: (s.colSpan === 1 ? 2 : 1) };
            }
            return s;
        });
        onUpdateConfig(blockId, 'technicalSections', updated);
    };

    const handleCycleVariantDirect = (subKey: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateConfig || !blockId) return;
        const rawSections = c.technicalSections && c.technicalSections.length > 0 ? c.technicalSections : DEFAULT_TECHNICAL_SUBSECTIONS;
        const variants = ['standard', 'banner_gold', 'banner_navy', 'banner_emerald'];
        const updated = rawSections.map((s: any) => {
            if ((s.id || s.fieldKey) === subKey) {
                const currentIdx = variants.indexOf(s.variant || 'standard');
                const nextVariant = variants[(currentIdx + 1) % variants.length];
                return { ...s, variant: nextVariant };
            }
            return s;
        });
        onUpdateConfig(blockId, 'technicalSections', updated);
    };

    const handleMoveDirect = (subKey: string, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateConfig || !blockId) return;
        const rawSections = c.technicalSections && c.technicalSections.length > 0 ? c.technicalSections : DEFAULT_TECHNICAL_SUBSECTIONS;
        const index = rawSections.findIndex((s: any) => (s.id || s.fieldKey) === subKey);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= rawSections.length) return;

        const updated = [...rawSections];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIndex, 0, moved);
        onUpdateConfig(blockId, 'technicalSections', updated);
    };

    const handleSaveTitleDirect = (subKey: string) => {
        if (!onUpdateConfig || !blockId) return;
        const rawSections = c.technicalSections && c.technicalSections.length > 0 ? c.technicalSections : DEFAULT_TECHNICAL_SUBSECTIONS;
        const updated = rawSections.map((s: any) => {
            if ((s.id || s.fieldKey) === subKey) {
                return { ...s, title: editingTitleText };
            }
            return s;
        });
        onUpdateConfig(blockId, 'technicalSections', updated);
        setEditingKey(null);
    };

    let subs: Array<{
        key: string;
        title: string;
        numberPrefix?: string;
        requirementText?: string;
        placeholder?: string;
        colSpan?: 1 | 2;
        variant?: string;
        isGroupHeader?: boolean;
        pageBreakBefore?: boolean;
        avoidBreakInside?: boolean;
    }> = [];

    if (c.technicalSections && Array.isArray(c.technicalSections) && c.technicalSections.length > 0) {
        subs = c.technicalSections
            .filter((sec: any) => sec.enabled !== false)
            .map((sec: any) => ({
                key: sec.id || sec.fieldKey,
                title: sec.title,
                numberPrefix: sec.numberPrefix,
                requirementText: sec.requirementText,
                placeholder: sec.placeholder,
                colSpan: sec.colSpan || 2,
                variant: sec.variant || 'standard',
                isGroupHeader: sec.isGroupHeader || sec.hasContent === false,
                pageBreakBefore: sec.pageBreakBefore,
                avoidBreakInside: sec.avoidBreakInside,
            }));
    } else {
        if (c.showAntecedentes !== false) subs.push({ key: 'antecedentes', numberPrefix: '3.1', title: 'Antecedentes', colSpan: 2 });
        if (c.showDescripcionProyecto !== false) subs.push({ key: 'descripcion', numberPrefix: '3.2', title: 'Descripción del Proyecto', colSpan: 2 });
        if (c.showJustificacion !== false) subs.push({ key: 'justificacion', numberPrefix: '3.3', title: 'Justificación', colSpan: 2 });
        if (c.showObjetivoGeneral !== false || c.showObjetivosEspecificos !== false) {
            subs.push({ key: 'banner_objetivos', numberPrefix: '3.4', title: 'OBJETIVOS', variant: 'banner_gold', colSpan: 2, isGroupHeader: true });
            if (c.showObjetivoGeneral !== false) subs.push({ key: 'obj_gen', title: 'GENERAL', colSpan: 1 });
            if (c.showObjetivosEspecificos !== false) subs.push({ key: 'obj_esp', title: 'ESPECÍFICOS', colSpan: 1 });
        }
        if (c.showOds !== false) subs.push({ key: 'ods', numberPrefix: '3.5', title: 'Objetivos de Desarrollo Sostenible (Alineación)', colSpan: 2 });
        if (c.showMarcoTeorico !== false) subs.push({ key: 'marco_teorico', numberPrefix: '3.6', title: 'Marco Teórico', colSpan: 2 });
        if (c.showMetodologia !== false) subs.push({ key: 'metodologia', numberPrefix: '3.7', title: 'Metodología', colSpan: 2 });
        if (c.showEvaluacion !== false) subs.push({ key: 'evaluacion', numberPrefix: '3.8', title: 'Evaluación y Monitoreo', colSpan: 2 });
    }

    const renderDirectControlsPill = (sub: any, isFirst: boolean, isLast: boolean) => (
        <div
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700 text-[8px] z-20 font-sans"
        >
            <button
                type="button"
                onClick={(e) => handleMoveDirect(sub.key, 'up', e)}
                disabled={isFirst}
                className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-20 cursor-pointer transition-colors"
                title="Mover subsección arriba"
            >
                <ArrowUp className="w-2.5 h-2.5" />
            </button>
            <button
                type="button"
                onClick={(e) => handleMoveDirect(sub.key, 'down', e)}
                disabled={isLast}
                className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-20 cursor-pointer transition-colors"
                title="Mover subsección abajo"
            >
                <ArrowDown className="w-2.5 h-2.5" />
            </button>
            <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />
            <span className="text-[7.5px] uppercase font-bold text-slate-400">Ancho:</span>
            <button
                type="button"
                onClick={(e) => handleToggleColSpanDirect(sub.key, e)}
                className={`px-1.5 py-0.2 text-[8px] font-bold rounded transition-all cursor-pointer ${
                    sub.colSpan === 1
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
                title="Cambiar ancho (Mitad 50% / Completo 100%)"
            >
                {sub.colSpan === 1 ? 'Mitad' : 'Completo'}
            </button>
            <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />
            <span className="text-[7.5px] uppercase font-bold text-slate-400">Estilo:</span>
            <button
                type="button"
                onClick={(e) => handleCycleVariantDirect(sub.key, e)}
                className={`px-1.5 py-0.2 text-[8px] font-bold rounded border transition-all cursor-pointer ${
                    sub.variant === 'banner_gold'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                        : sub.variant === 'banner_navy'
                        ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                        : sub.variant === 'banner_emerald'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Cambiar estilo (Dorado / Azul / Esmeralda / Estándar)"
            >
                {sub.variant === 'banner_gold' ? 'Dorado' : sub.variant === 'banner_navy' ? 'Azul' : sub.variant === 'banner_emerald' ? 'Verde' : 'Estándar'}
            </button>
        </div>
    );

    const borderCss = borderStyleKey === 'none'
        ? 'none'
        : `${borderWidthKey}px ${borderStyleKey} ${borderColorKey}`;

    const borderBottomStyle: React.CSSProperties = borderStyleKey === 'none'
        ? {}
        : { borderBottom: borderCss };

    const borderRightStyle: React.CSSProperties = borderStyleKey === 'none'
        ? {}
        : { borderRight: borderCss };

    const borderFullStyle: React.CSSProperties = borderStyleKey === 'none'
        ? {}
        : { border: borderCss };

    return (
        <div className="my-2 select-none">
            <div className="mb-2 ml-7 sm:ml-8">
                <p className="font-bold text-[10pt] uppercase tracking-wide font-sans" style={{ color: headerBg }}>
                    {displaySectionTitle}
                </p>
            </div>
            <div
                className="rounded-lg shadow-xs overflow-hidden"
                style={borderFullStyle}
            >
                <table className="w-full border-collapse text-[9px] table-fixed" style={{ borderCollapse: 'collapse', ...borderFullStyle }}>
                    <colgroup>
                        <col className="w-[26%]" />
                        <col className="w-[74%]" />
                    </colgroup>
                    <tbody>
                        {(() => {
                            const rows: React.ReactNode[] = [];
                            const goldColor = '#c4a857';
                            let idx = 0;

                            while (idx < subs.length) {
                                const sub = subs[idx];
                                const num = (sub.numberPrefix || '').trim();
                                let titleClean = (sub.title || '').trim();
                                if (num && titleClean.toLowerCase().startsWith(num.toLowerCase())) {
                                    titleClean = titleClean.substring(num.length).trim();
                                }
                                const displayTitle = num ? `${num} ${titleClean}` : titleClean;
                                const variant = sub.variant || 'standard';
                                const colSpan = sub.colSpan || 2;
                                const isEditingThis = editingKey === sub.key;

                                const resolveBg = (v?: string) => {
                                    if (v === 'banner_gold') return goldColor;
                                    if (v === 'banner_navy') return '#222c57';
                                    if (v === 'banner_emerald') return '#065f46';
                                    if (v === 'standard') return '#ffffff';
                                    return headerBg;
                                };

                                const resolveFg = (v?: string) => {
                                    if (v === 'standard') return '#0f172a';
                                    if (v === 'banner_gold') return '#000000';
                                    return '#ffffff';
                                };

                                if (sub.pageBreakBefore) {
                                    rows.push(
                                        <tr key={`break-${sub.key}`} className="bg-purple-50" style={borderBottomStyle}>
                                            <td colSpan={2} className="py-0.5 px-2 text-[7.5px] font-bold text-purple-700 uppercase flex items-center gap-1">
                                                <Scissors className="w-2.5 h-2.5" />
                                                <span>Salto de página obligatorio en PDF antes de: {displayTitle}</span>
                                            </td>
                                        </tr>
                                    );
                                }

                                if (colSpan === 1) {
                                    const nextSub = subs[idx + 1];
                                    if (nextSub && nextSub.colSpan === 1 && !nextSub.isGroupHeader) {
                                        const nextNum = (nextSub.numberPrefix || '').trim();
                                        let nextTitleClean = (nextSub.title || '').trim();
                                        if (nextNum && nextTitleClean.toLowerCase().startsWith(nextNum.toLowerCase())) {
                                            nextTitleClean = nextTitleClean.substring(nextNum.length).trim();
                                        }
                                        const nextDisplayTitle = nextNum ? `${nextNum} ${nextTitleClean}` : nextTitleClean;

                                        const bg1 = resolveBg(sub.variant);
                                        const bg2 = resolveBg(nextSub.variant);
                                        const fg1 = resolveFg(sub.variant);
                                        const fg2 = resolveFg(nextSub.variant);

                                        rows.push(
                                            <tr key={sub.key} style={borderBottomStyle}>
                                                <td colSpan={2} className="p-0" style={{ border: 'none' }}>
                                                    <table className="w-full border-collapse table-fixed" style={{ borderCollapse: 'collapse' }}>
                                                        <colgroup>
                                                            <col className="w-1/2" />
                                                            <col className="w-1/2" />
                                                        </colgroup>
                                                        <tbody>
                                                            <tr style={borderBottomStyle}>
                                                                <td className="p-1.5 w-1/2 font-bold text-center uppercase text-[8.5px] cursor-pointer relative group/cell" style={{ backgroundColor: bg1, color: fg1, ...borderRightStyle, ...borderBottomStyle }}>
                                                                    <span>{displayTitle}</span>
                                                                    {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                                                </td>
                                                                <td className="p-1.5 w-1/2 font-bold text-center uppercase text-[8.5px] cursor-pointer relative group/cell" style={{ backgroundColor: bg2, color: fg2, ...borderBottomStyle }}>
                                                                    <span>{nextDisplayTitle}</span>
                                                                    {renderDirectControlsPill(nextSub, idx + 1 === 0, idx + 1 === subs.length - 1)}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="p-2 w-1/2 text-slate-700 bg-white align-top text-[8.5px] leading-relaxed whitespace-pre-line select-text" style={borderRightStyle}>
                                                                    {sub.placeholder ? (
                                                                        <div className="text-slate-800 font-normal select-text">{sub.placeholder}</div>
                                                                    ) : sub.requirementText ? (
                                                                        <span className="font-bold text-slate-700 block">[{sub.requirementText}]</span>
                                                                    ) : (
                                                                        <span className="italic text-slate-400">[Redacción colaborativa]</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-2 w-1/2 text-slate-700 bg-white align-top text-[8.5px] leading-relaxed whitespace-pre-line select-text">
                                                                    {nextSub.placeholder ? (
                                                                        <div className="text-slate-800 font-normal select-text">{nextSub.placeholder}</div>
                                                                    ) : nextSub.requirementText ? (
                                                                        <span className="font-bold text-slate-700 block">[{nextSub.requirementText}]</span>
                                                                    ) : (
                                                                        <span className="italic text-slate-400">[Redacción colaborativa]</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        );
                                        idx += 2;
                                    } else {
                                        const bg1 = resolveBg(sub.variant);
                                        const fg1 = resolveFg(sub.variant);
                                        rows.push(
                                            <tr key={sub.key} style={borderBottomStyle}>
                                                <td colSpan={2} className="p-0" style={{ border: 'none' }}>
                                                    <table className="w-full border-collapse table-fixed" style={{ borderCollapse: 'collapse' }}>
                                                        <colgroup>
                                                            <col className="w-1/2" />
                                                            <col className="w-1/2" />
                                                        </colgroup>
                                                        <tbody>
                                                            <tr style={borderBottomStyle}>
                                                                <td className="p-1.5 w-1/2 font-bold text-center uppercase text-[8.5px] cursor-pointer relative group/cell" style={{ backgroundColor: bg1, color: fg1, ...borderRightStyle, ...borderBottomStyle }}>
                                                                    <span>{displayTitle}</span>
                                                                    {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                                                </td>
                                                                <td className="p-1.5 w-1/2 bg-slate-50/50 text-slate-400 font-normal italic text-center uppercase text-[8px]" style={borderBottomStyle}>
                                                                    [Espacio disponible (50%)]
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="p-2 w-1/2 text-slate-700 bg-white align-top text-[8.5px] leading-relaxed whitespace-pre-line select-text" style={borderRightStyle}>
                                                                    {sub.placeholder ? (
                                                                        <div className="text-slate-800 font-normal select-text">{sub.placeholder}</div>
                                                                    ) : sub.requirementText ? (
                                                                        <span className="font-bold text-slate-700 block">[{sub.requirementText}]</span>
                                                                    ) : (
                                                                        <span className="italic text-slate-400">[Redacción colaborativa]</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-2 w-1/2 bg-slate-50/30 text-slate-300 italic align-top text-[8px] text-center">
                                                                    —
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        );
                                        idx++;
                                    }
                                } else if (variant === 'banner_gold' || sub.isGroupHeader) {
                                    rows.push(
                                        <tr key={sub.key} style={borderBottomStyle}>
                                            <td
                                                colSpan={2}
                                                className="p-1.5 text-center font-bold uppercase text-[9px] tracking-wider cursor-pointer relative group/cell"
                                                style={{ backgroundColor: resolveBg(sub.variant), color: resolveFg(sub.variant), ...borderBottomStyle }}
                                                onClick={() => {
                                                    setEditingKey(sub.key);
                                                    setEditingTitleText(sub.title);
                                                }}
                                            >
                                                {isEditingThis ? (
                                                    <input
                                                        type="text"
                                                        value={editingTitleText}
                                                        onChange={e => setEditingTitleText(e.target.value)}
                                                        onBlur={() => handleSaveTitleDirect(sub.key)}
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveTitleDirect(sub.key)}
                                                        autoFocus
                                                        className="w-full px-2 py-0.5 bg-white text-slate-900 font-bold border rounded focus:outline-none text-center"
                                                    />
                                                ) : (
                                                    <>
                                                        <span className="drop-shadow-xs">{displayTitle}</span>
                                                        {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                    idx++;
                                } else {
                                    const bg1 = resolveBg(sub.variant);
                                    const fg1 = resolveFg(sub.variant);
                                    const textAlign = sub.variant === 'banner_navy' ? 'text-center' : 'text-left';
                                    rows.push(
                                        <tr key={sub.key} style={borderBottomStyle}>
                                            <td className={`p-2 w-[26%] font-bold ${textAlign} uppercase align-middle text-[8.5px] cursor-pointer relative group/cell`} style={{ backgroundColor: bg1, color: fg1, ...borderRightStyle }}>
                                                <span>{displayTitle}</span>
                                                {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                            </td>
                                            <td className="p-2 w-[74%] text-slate-700 bg-white align-top text-[8.5px] leading-relaxed whitespace-pre-line select-text">
                                                {sub.placeholder ? (
                                                    <div className="text-slate-800 font-normal select-text">
                                                        {sub.placeholder}
                                                    </div>
                                                ) : sub.requirementText ? (
                                                    <span className="font-bold text-slate-700 block">[{sub.requirementText}]</span>
                                                ) : (
                                                    <span className="italic text-slate-400">[Redacción colaborativa]</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                    idx++;
                                }
                            }
                            return rows;
                        })()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const RenderFinalReportWritingSection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, blockId, onUpdateConfig }) => {
    const c = config || {};

    const [editingSubKey, setEditingSubKey] = useState<string | null>(null);
    const [editingSubField, setEditingSubField] = useState<'title' | 'req'>('title');
    const [editingSubText, setEditingSubText] = useState<string>('');

    const rawSections = (c.writingSections && Array.isArray(c.writingSections) && c.writingSections.length > 0)
        ? c.writingSections
        : DEFAULT_FINAL_REPORT_WRITING_SUBSECTIONS;

    const subs = rawSections.filter((s: any) => s.enabled !== false).map((s: any) => ({
        key: s.id || s.fieldKey,
        title: s.title,
        numberPrefix: s.numberPrefix || '',
        requirementText: s.requirementText || s.placeholder || '',
        colSpan: s.colSpan || 2,
        variant: s.variant || 'standard'
    }));

    const handleMoveSub = (subKey: string, direction: 'up' | 'down') => {
        if (!onUpdateConfig || !blockId) return;
        const index = rawSections.findIndex((s: any) => (s.id || s.fieldKey) === subKey);
        if (index === -1) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= rawSections.length) return;

        const updated = [...rawSections];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        onUpdateConfig(blockId, 'writingSections', updated);
    };

    const handleHideSub = (subKey: string) => {
        if (!onUpdateConfig || !blockId) return;
        const updated = rawSections.map((s: any) => {
            if ((s.id || s.fieldKey) === subKey) {
                return { ...s, enabled: false };
            }
            return s;
        });
        onUpdateConfig(blockId, 'writingSections', updated);
    };

    const handleSaveSubText = (subKey: string) => {
        if (!onUpdateConfig || !blockId) return;
        const updated = rawSections.map((s: any) => {
            if ((s.id || s.fieldKey) === subKey) {
                if (editingSubField === 'title') {
                    return { ...s, title: editingSubText };
                } else {
                    return { ...s, requirementText: editingSubText };
                }
            }
            return s;
        });
        onUpdateConfig(blockId, 'writingSections', updated);
        setEditingSubKey(null);
    };

    const handleAddSub = () => {
        if (!onUpdateConfig || !blockId) return;
        const nextNum = (rawSections.length + 1).toString();
        const newSub = {
            id: `writing_sec_${Date.now().toString().slice(-4)}`,
            numberPrefix: `${nextNum}.`,
            title: 'NUEVA SECCIÓN DE REDACCIÓN',
            requirementText: 'Describa detalladamente los resultados o análisis...',
            enabled: true,
            colSpan: 2,
            variant: 'standard'
        };
        onUpdateConfig(blockId, 'writingSections', [...rawSections, newSub]);
    };

    return (
        <div className="w-full font-sans my-4 space-y-6 group/writing-block relative select-none">
            {onUpdateConfig && (
                <div className="opacity-0 group-hover/writing-block:opacity-100 transition-opacity flex justify-end mb-2">
                    <button
                        type="button"
                        onClick={handleAddSub}
                        className="btn-vercel-secondary text-[9.5px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 text-text-dim hover:text-text-main transition-colors"
                        title="Añadir una nueva subsección de redacción al informe"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Añadir Subsección
                    </button>
                </div>
            )}

            {subs.map((sub: any, sIdx: number) => {
                const isEditingTitle = editingSubKey === sub.key && editingSubField === 'title';
                const isEditingReq = editingSubKey === sub.key && editingSubField === 'req';

                return (
                    <div key={sub.key} className="w-full bg-white p-3 border-b border-slate-200 relative group/sub hover:bg-slate-50/40 transition-colors rounded-sm">
                        {onUpdateConfig && (
                            <div
                                onClick={e => e.stopPropagation()}
                                className="opacity-0 group-hover/sub:opacity-100 transition-opacity absolute top-2 right-2 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-1.5 py-0.5 rounded-md shadow-md border border-slate-200 dark:border-slate-700 text-[8px] z-30 font-sans select-none"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleMoveSub(sub.key, 'up')}
                                    disabled={sIdx === 0}
                                    className="p-0.5 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 disabled:opacity-20 cursor-pointer transition-colors"
                                    title="Mover subsección arriba"
                                >
                                    <ArrowUp className="w-2.5 h-2.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMoveSub(sub.key, 'down')}
                                    disabled={sIdx === subs.length - 1}
                                    className="p-0.5 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 disabled:opacity-20 cursor-pointer transition-colors"
                                    title="Mover subsección abajo"
                                >
                                    <ArrowDown className="w-2.5 h-2.5" />
                                </button>
                                <span className="w-px h-2.5 bg-slate-200 my-auto" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingSubKey(sub.key);
                                        setEditingSubField('title');
                                        setEditingSubText(sub.title);
                                    }}
                                    className="p-0.5 rounded hover:bg-slate-100 text-slate-500 hover:text-text-main cursor-pointer transition-colors"
                                    title="Editar título de la subsección"
                                >
                                    <Pencil className="w-2.5 h-2.5" />
                                </button>
                                <span className="w-px h-2.5 bg-slate-200 my-auto" />
                                <button
                                    type="button"
                                    onClick={() => handleHideSub(sub.key)}
                                    className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                                    title="Ocultar subsección"
                                >
                                    <EyeOff className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        )}

                        {isEditingTitle ? (
                            <div className="flex items-center gap-1 max-w-md mx-auto mb-2 select-text" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={editingSubText}
                                    onChange={e => setEditingSubText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveSubText(sub.key); if (e.key === 'Escape') setEditingSubKey(null); }}
                                    autoFocus
                                    className="bg-white text-slate-900 border border-border-thin px-2 py-1 text-xs font-bold uppercase rounded-lg outline-none w-full text-center"
                                />
                                <button type="button" onClick={() => handleSaveSubText(sub.key)} className="p-1 text-emerald-600 hover:text-emerald-700">
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <h2
                                onClick={() => {
                                    if (onUpdateConfig) {
                                        setEditingSubKey(sub.key);
                                        setEditingSubField('title');
                                        setEditingSubText(sub.title);
                                    }
                                }}
                                className="text-[13pt] font-extrabold text-[#002060] text-center uppercase tracking-wide mb-1.5 font-sans cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                {sub.numberPrefix ? `${sub.numberPrefix} ${sub.title}` : sub.title}
                            </h2>
                        )}

                        {isEditingReq ? (
                            <div className="flex items-center gap-1 mb-2 select-text" onClick={e => e.stopPropagation()}>
                                <textarea
                                    value={editingSubText}
                                    onChange={e => setEditingSubText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveSubText(sub.key); } if (e.key === 'Escape') setEditingSubKey(null); }}
                                    rows={2}
                                    autoFocus
                                    className="bg-white text-slate-800 border border-border-thin p-1.5 text-[9pt] italic rounded-lg outline-none w-full"
                                />
                                <button type="button" onClick={() => handleSaveSubText(sub.key)} className="p-1 text-emerald-600 hover:text-emerald-700">
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <p
                                onClick={() => {
                                    if (onUpdateConfig) {
                                        setEditingSubKey(sub.key);
                                        setEditingSubField('req');
                                        setEditingSubText(sub.requirementText || '');
                                    }
                                }}
                                className="text-[9pt] text-slate-700 italic text-left mb-2 leading-relaxed cursor-pointer hover:text-slate-900 transition-colors"
                                title="Haga clic para editar las instrucciones para docentes"
                            >
                                {sub.requirementText || <span className="text-slate-300">[Clic para añadir guía o requisitos para el docente...]</span>}
                            </p>
                        )}

                        <div className="text-[9.5pt] text-slate-400 italic text-justify leading-relaxed bg-slate-50/50 p-2 rounded border border-dashed border-slate-200">
                            [Redacción enriquecida colaborativa en Tiptap / Yjs...]
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const RenderExpectedProducts: React.FC<{ config: any; blockId?: string; onUpdateConfig?: (blockId: string, key: string, value: any) => void }> = ({ config, blockId, onUpdateConfig }) => {
    const c = config || {};
    const productosTitle = c.productosTitle || '5. PRODUCTOS ESPERADOS';
    const layoutMode = c.productsLayoutMode || c.layoutMode || 'table_simple';

    const headerColorKey = c.productsHeaderColor || '#222c57';
    const borderStyleKey = c.productsBorderStyle || 'solid';
    const borderColorKey = c.productsBorderColor || '#000000';
    const borderWidthKey = c.productsBorderWidth !== undefined ? c.productsBorderWidth : 1;

    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');

    const resolveHeaderBg = (col?: string) => {
        const target = col || headerColorKey;
        if (target && (target.startsWith('#') || target.startsWith('rgb') || target.startsWith('hsl'))) return target;
        switch (target) {
            case 'gold': return '#c4a857';
            case 'slate': return '#334155';
            case 'emerald': return '#065f46';
            case 'navy':
            default: return '#222c57';
        }
    };
    const headerBg = resolveHeaderBg(headerColorKey);

    const borderCss = borderStyleKey === 'none'
        ? 'none'
        : `${borderWidthKey}px ${borderStyleKey} ${borderColorKey}`;

    const borderBottomStyle: React.CSSProperties = borderStyleKey === 'none'
        ? {}
        : { borderBottom: borderCss };

    const borderRightStyle: React.CSSProperties = borderStyleKey === 'none'
        ? {}
        : { borderRight: borderCss };

    const borderFullStyle: React.CSSProperties = borderStyleKey === 'none'
        ? {}
        : { border: borderCss };

    const cols = getNormalizedColumns(c.productColumns);
    const rawCats = c.productCategories || c.categories;
    const categories = getNormalizedCategories(rawCats).filter((cat: any) => cat.enabled !== false);

    const handleToggleColumn = (colKey: string) => {
        if (blockId && onUpdateConfig) {
            const updatedCols = { ...cols, [colKey]: !cols[colKey] };
            onUpdateConfig(blockId, 'productColumns', updatedCols);
        }
    };

    const handleCycleHeaderColor = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateConfig || !blockId) return;
        const variants = ['navy', 'gold', 'slate', 'emerald'];
        const currentIdx = variants.indexOf(c.productsHeaderColor || 'navy');
        const next = variants[(currentIdx + 1) % variants.length];
        onUpdateConfig(blockId, 'productsHeaderColor', next);
    };

    const handleToggleLayoutMode = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateConfig || !blockId) return;
        const nextMode = layoutMode === 'table_simple' ? 'table_detailed' : 'table_simple';
        onUpdateConfig(blockId, 'productsLayoutMode', nextMode);
    };

    const handleSaveText = (key: string) => {
        if (!onUpdateConfig || !blockId) return;
        onUpdateConfig(blockId, key, editingText);
        setEditingKey(null);
    };

    const titleTipo = c.titleTipo || 'TIPO';
    const titleCantidad = c.titleCantidad || 'CANTIDAD';
    const guidelineTipo = c.guidelineTipo ?? '[Indique que tipo de productos generará su proyecto Eje. Publicaciones Científicas, Desarrollo Tangible de un producto, Publicaciones Docentes]';
    const guidelineCantidad = c.guidelineCantidad ?? '[Defina cantidad de productos]';

    const renderEditableText = (key: string, currentText: string, isMultiline = false) => {
        if (editingKey === key) {
            return (
                <div className="inline-flex items-center gap-1 select-text w-full" onClick={e => e.stopPropagation()}>
                    {isMultiline ? (
                        <textarea
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Escape') setEditingKey(null);
                            }}
                            autoFocus
                            rows={2}
                            className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none border border-indigo-400 w-full"
                        />
                    ) : (
                        <input
                            type="text"
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveText(key);
                                if (e.key === 'Escape') setEditingKey(null);
                            }}
                            autoFocus
                            className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold text-center border border-indigo-400 w-auto min-w-[70px]"
                        />
                    )}
                    <button
                        type="button"
                        onClick={() => handleSaveText(key)}
                        className="p-0.5 text-emerald-500 hover:text-emerald-400 cursor-pointer shrink-0"
                        title="Guardar"
                    >
                        <Check className="w-3 h-3" />
                    </button>
                </div>
            );
        }

        return (
            <span
                onClick={(e) => {
                    e.stopPropagation();
                    setEditingKey(key);
                    setEditingText(currentText);
                }}
                className="cursor-pointer hover:underline decoration-dotted transition-colors group-hover/th:text-indigo-200 inline-flex items-center gap-1"
                title="Clic para editar en el lienzo"
            >
                {currentText}
                <Pencil className="w-2 h-2 opacity-0 group-hover/table:opacity-40 transition-opacity shrink-0" />
            </span>
        );
    };

    return (
        <div className="my-3 space-y-2 select-none group/table relative font-sans">
            {/* PÍLDORA FLOTANTE DE CONTROLES RÁPIDOS EN EL LIENZO */}
            {onUpdateConfig && blockId && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover/table:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700 text-[8px] absolute -top-2 right-0 z-20"
                >
                    <span className="text-[7.5px] uppercase font-bold text-slate-400">Color:</span>
                    <button
                        type="button"
                        onClick={handleCycleHeaderColor}
                        className={`px-1.5 py-0.2 text-[8px] font-bold rounded border transition-all cursor-pointer ${
                            headerColorKey === 'gold'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : headerColorKey === 'slate'
                                ? 'bg-slate-100 text-slate-800 border-slate-300'
                                : headerColorKey === 'emerald'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                        title="Cambiar color de cabecera"
                    >
                        {headerColorKey === 'gold' ? 'Dorado' : headerColorKey === 'slate' ? 'Pizarra' : headerColorKey === 'emerald' ? 'Verde' : 'Azul'}
                    </button>
                    <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />
                    <button
                        type="button"
                        onClick={handleToggleLayoutMode}
                        className="px-1.5 py-0.2 text-[8px] font-bold rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Alternar entre formato simple (2 columnas) y detallado CACES"
                    >
                        {layoutMode === 'table_simple' ? 'Modo CACES' : 'Modo Oficial 2 Col'}
                    </button>
                </div>
            )}

            {/* TÍTULO DE LA SECCIÓN (EDITABLE) */}
            <div className="mb-2 ml-7 sm:ml-8">
                {editingKey === 'productosTitle' ? (
                    <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveText('productosTitle');
                                if (e.key === 'Escape') setEditingKey(null);
                            }}
                            autoFocus
                            className="text-[10.5pt] font-bold uppercase tracking-wide bg-white text-slate-900 border border-indigo-400 px-1 py-0.5 rounded outline-none w-full"
                        />
                        <button
                            type="button"
                            onClick={() => handleSaveText('productosTitle')}
                            className="p-1 text-emerald-500 hover:text-emerald-400 cursor-pointer"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingKey('productosTitle');
                            setEditingText(productosTitle);
                        }}
                        className="text-[10.5pt] font-bold uppercase tracking-wide cursor-pointer hover:underline decoration-dotted inline-flex items-center gap-1.5"
                        style={{ color: '#222c57' }}
                        title="Clic para renombrar título"
                    >
                        <span>{productosTitle}</span>
                        <Pencil className="w-3 h-3 opacity-0 group-hover/table:opacity-40 transition-opacity" />
                    </div>
                )}
            </div>

            {/* TABLA PRINCIPAL DEL LIENZO */}
            {layoutMode === 'table_simple' ? (
                /* FORMATO INSTITUCIONAL OFICIAL (2 COLUMNAS: TIPO Y CANTIDAD) */
                <div className="overflow-hidden" style={borderFullStyle}>
                    <table className="w-full text-[8.5px] border-collapse" style={{ borderCollapse: 'collapse', ...borderFullStyle }}>
                        <colgroup>
                            <col style={{ width: '65%' }} />
                            <col style={{ width: '35%' }} />
                        </colgroup>
                        <thead>
                            <tr style={borderBottomStyle}>
                                <th
                                    className="p-2 text-center font-bold uppercase text-[9px] tracking-wider group/th"
                                    style={{ backgroundColor: headerBg, color: '#ffffff', ...borderRightStyle, ...borderBottomStyle }}
                                >
                                    {renderEditableText('titleTipo', titleTipo)}
                                </th>
                                <th
                                    className="p-2 text-center font-bold uppercase text-[9px] tracking-wider group/th"
                                    style={{ backgroundColor: headerBg, color: '#ffffff', ...borderBottomStyle }}
                                >
                                    {renderEditableText('titleCantidad', titleCantidad)}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={borderBottomStyle}>
                                <td className="p-2 text-slate-700 bg-white align-top text-left text-[8.5px] leading-relaxed group/td" style={borderRightStyle}>
                                    {renderEditableText('guidelineTipo', guidelineTipo, true)}
                                </td>
                                <td className="p-2 text-slate-700 bg-white align-top text-left text-[8.5px] leading-relaxed group/td">
                                    {renderEditableText('guidelineCantidad', guidelineCantidad, true)}
                                </td>
                            </tr>
                            <tr style={borderBottomStyle}>
                                <td className="p-2 bg-white" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 bg-white">&nbsp;</td>
                            </tr>
                            <tr>
                                <td className="p-2 bg-white" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 bg-white">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : layoutMode === 'grouped_sections' ? (
                /* MODO SECCIONES CONSECUTIVAS */
                <div className="space-y-3">
                    {categories.map((cat: any) => (
                        <div key={cat.id || cat.name} className="space-y-1">
                            <h6 className="text-[8.5px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {cat.name}
                            </h6>
                            <table className="w-full border-collapse text-[9px]" style={borderFullStyle}>
                                <thead>
                                    <tr style={{ backgroundColor: headerBg, color: '#ffffff' }}>
                                        <th className="p-1 text-left" style={borderRightStyle}>Entregable Tecnológico</th>
                                        {cols.showSenadi !== false && <th className="p-1 text-center w-16" style={borderRightStyle}>SENADI</th>}
                                        {cols.showTrl !== false && <th className="p-1 text-center w-14" style={borderRightStyle}>TRL</th>}
                                        {cols.showIndicator !== false && <th className="p-1 text-left" style={borderRightStyle}>Indicador CACES</th>}
                                        {cols.showVerificationMeans !== false && <th className="p-1 text-left" style={borderRightStyle}>Medio Verificación</th>}
                                        {cols.showQuantity !== false && <th className="p-1 text-center w-12">Cant.</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-white text-slate-700" style={borderBottomStyle}>
                                        <td className="p-1 font-medium" style={borderRightStyle}>Prototipo funcional / Software de gestión</td>
                                        {cols.showSenadi !== false && <td className="p-1 text-center font-bold text-emerald-600 text-[8px]" style={borderRightStyle}>Sí</td>}
                                        {cols.showTrl !== false && <td className="p-1 text-center font-mono text-amber-600 font-bold text-[8px]" style={borderRightStyle}>TRL 6</td>}
                                        {cols.showIndicator !== false && <td className="p-1" style={borderRightStyle}>1 Prototipo operativo en laboratorio</td>}
                                        {cols.showVerificationMeans !== false && <td className="p-1" style={borderRightStyle}>Certificado SENADI / Acta de entrega</td>}
                                        {cols.showQuantity !== false && <td className="p-1 text-center font-bold text-emerald-600">1</td>}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            ) : (
                /* MODO TABLA DETALLADA CACES */
                <div className="overflow-hidden" style={borderFullStyle}>
                    <table className="w-full border-collapse text-[9px]" style={{ borderCollapse: 'collapse', ...borderFullStyle }}>
                        <thead>
                            <tr style={{ backgroundColor: headerBg, color: '#ffffff', ...borderBottomStyle }}>
                                {cols.showCategory !== false && <th className="p-1.5 text-left" style={borderRightStyle}>Categoría IST</th>}
                                {cols.showSubtype !== false && <th className="p-1.5 text-left" style={borderRightStyle}>Subtipo / Entregable</th>}
                                {cols.showProductName !== false && <th className="p-1.5 text-left" style={borderRightStyle}>Nombre del Producto</th>}
                                {cols.showSenadi !== false && <th className="p-1.5 text-center w-16" style={borderRightStyle}>SENADI</th>}
                                {cols.showTrl !== false && <th className="p-1.5 text-center w-14" style={borderRightStyle}>TRL</th>}
                                {cols.showIndicator !== false && <th className="p-1.5 text-left" style={borderRightStyle}>Indicador CACES</th>}
                                {cols.showVerificationMeans !== false && <th className="p-1.5 text-left" style={borderRightStyle}>Medio de Verificación</th>}
                                {cols.showQuantity !== false && <th className="p-1.5 text-center w-14" style={borderRightStyle}>Cant.</th>}
                                {cols.showDeadline !== false && <th className="p-1.5 text-center w-20">Plazo</th>}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white text-slate-700" style={borderBottomStyle}>
                                {cols.showCategory !== false && <td className="p-1.5 font-semibold text-emerald-700" style={borderRightStyle}>I+D+i Aplicada</td>}
                                {cols.showSubtype !== false && <td className="p-1.5 font-medium" style={borderRightStyle}>Prototipo / Software SENADI</td>}
                                {cols.showProductName !== false && <td className="p-1.5" style={borderRightStyle}>Prototipo de banco de pruebas automatizado...</td>}
                                {cols.showSenadi !== false && <td className="p-1.5 text-center font-bold text-emerald-600 text-[8.5px]" style={borderRightStyle}>Depósito Legal</td>}
                                {cols.showTrl !== false && <td className="p-1.5 text-center font-mono text-amber-600 font-bold text-[8.5px]" style={borderRightStyle}>TRL 6</td>}
                                {cols.showIndicator !== false && <td className="p-1.5" style={borderRightStyle}>1 Prototipo validado en laboratorio</td>}
                                {cols.showVerificationMeans !== false && <td className="p-1.5" style={borderRightStyle}>Certificado SENADI / Acta de entrega</td>}
                                {cols.showQuantity !== false && <td className="p-1.5 text-center font-mono font-bold text-emerald-600" style={borderRightStyle}>1</td>}
                                {cols.showDeadline !== false && <td className="p-1.5 text-center">Trimestre 4</td>}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export const RenderImpacts: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, blockId, onUpdateConfig }) => {
    const c = config || {};
    const displayTitle = c.impactsTitle || c.title || '6.  IMPACTO DEL PROYECTO';
    const rawCats = c.impactCategories || c.categories;
    const allCategories: ImpactCategory[] = (Array.isArray(rawCats) && rawCats.length > 0)
        ? rawCats
        : DEFAULT_IMPACT_CATEGORIES;
    const categories = allCategories.filter((cat: any) => cat.enabled !== false);
    const layoutMode = c.impactLayoutMode || c.impactsLayoutMode || 'table';

    // Paleta de cabecera y bordes
    const headerColorKey = c.impactHeaderColor || c.headerColor || 'navy';
    const headerBg = headerColorKey === 'gold'
        ? '#c4a857'
        : headerColorKey === 'slate'
        ? '#334155'
        : headerColorKey === 'emerald'
        ? '#065f46'
        : headerColorKey.startsWith('#')
        ? headerColorKey
        : '#222c57';

    const borderStyle = c.impactBorderStyle || 'solid';
    const isNoBorder = borderStyle === 'none';
    const borderColor = c.impactBorderColor || '#000000';

    const borderFullStyle: React.CSSProperties = isNoBorder
        ? { border: 'none' }
        : { border: `1px solid ${borderColor}` };
    const borderRightStyle: React.CSSProperties = isNoBorder
        ? {}
        : { borderRight: `1px solid ${borderColor}` };
    const borderBottomStyle: React.CSSProperties = isNoBorder
        ? { borderBottom: `1px solid ${borderColor}` }
        : { borderBottom: `1px solid ${borderColor}` };

    const titleImpactoCol = c.titleImpactoCol || 'IMPACTO DEL PROYECTO';
    const titleAplicaCol = c.titleAplicaCol || 'Aplica (X)';
    const titleNoAplicaCol = c.titleNoAplicaCol || 'No aplica (x)';
    const titleDescripcionCol = c.titleDescripcionCol || 'DESCRIPCIÓN BREVE (Solamente si aplica)';

    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editingTitleText, setEditingTitleText] = useState<string>('');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');

    const handleStartEditing = (key: string, currentVal: string) => {
        if (!onUpdateConfig || !blockId) return;
        setEditingKey(key);
        setEditingText(currentVal);
    };

    const handleSaveText = (key: string) => {
        if (!onUpdateConfig || !blockId) return;
        onUpdateConfig(blockId, key, editingText);
        setEditingKey(null);
    };

    const handleCycleHeaderColor = () => {
        if (!onUpdateConfig || !blockId) return;
        const colorCycle: string[] = ['navy', 'gold', 'slate', 'emerald'];
        const currentIdx = colorCycle.indexOf(headerColorKey);
        const nextColor = colorCycle[(currentIdx + 1) % colorCycle.length];
        onUpdateConfig(blockId, 'impactHeaderColor', nextColor);
    };

    const handleToggleBorderStyle = () => {
        if (!onUpdateConfig || !blockId) return;
        onUpdateConfig(blockId, 'impactBorderStyle', isNoBorder ? 'solid' : 'none');
        if (isNoBorder) {
            onUpdateConfig(blockId, 'impactBorderColor', '#000000');
        }
    };

    const handleToggleLayoutMode = () => {
        if (!onUpdateConfig || !blockId) return;
        const nextMode = layoutMode === 'table' ? 'cards' : layoutMode === 'cards' ? 'sections' : 'table';
        onUpdateConfig(blockId, 'impactLayoutMode', nextMode);
    };

    const handleUpdateCategoryTitle = (catId: string, newTitle: string) => {
        if (!onUpdateConfig || !blockId) return;
        const updated = allCategories.map(cat => {
            if ((cat.id || cat.key) === catId) {
                return { ...cat, title: newTitle };
            }
            return cat;
        });
        onUpdateConfig(blockId, 'impactCategories', updated);
        setEditingCatId(null);
    };

    const handleMoveCategory = (catId: string, direction: 'up' | 'down') => {
        if (!onUpdateConfig || !blockId) return;
        const index = allCategories.findIndex(cat => (cat.id || cat.key) === catId);
        if (index === -1) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= allCategories.length) return;

        const updated = [...allCategories];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        onUpdateConfig(blockId, 'impactCategories', updated);
    };

    const handleToggleCategory = (catId: string) => {
        if (!onUpdateConfig || !blockId) return;
        const updated = allCategories.map(cat => {
            if ((cat.id || cat.key) === catId) {
                return { ...cat, enabled: false };
            }
            return cat;
        });
        onUpdateConfig(blockId, 'impactCategories', updated);
    };

    const handleAddCategory = () => {
        if (!onUpdateConfig || !blockId) return;
        const newCat: ImpactCategory = {
            id: `custom_impact_${Date.now()}`,
            key: `custom_impact_${Date.now()}`,
            title: 'Otro Impacto',
            placeholder: 'Descripción breve (solamente si aplica)...',
            enabled: true,
            colSpan: 1
        };
        onUpdateConfig(blockId, 'impactCategories', [...allCategories, newCat]);
    };

    const renderControls = (cat: ImpactCategory, isFirst: boolean, isLast: boolean) => {
        if (!onUpdateConfig || !blockId) return null;
        const id = cat.id || cat.key || '';
        return (
            <div
                className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex items-center gap-0.5 bg-slate-900/90 text-white p-0.5 rounded shadow-sm opacity-0 group-hover/cell:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMoveCategory(id, 'up')}
                    className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-30 cursor-pointer"
                    title="Mover arriba"
                >
                    <ArrowUp className="w-2.5 h-2.5" />
                </button>
                <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMoveCategory(id, 'down')}
                    className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-30 cursor-pointer"
                    title="Mover abajo"
                >
                    <ArrowDown className="w-2.5 h-2.5" />
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setEditingCatId(id);
                        setEditingTitleText(cat.title);
                    }}
                    className="p-0.5 hover:bg-slate-700 rounded cursor-pointer"
                    title="Renombrar título"
                >
                    <Pencil className="w-2.5 h-2.5 text-amber-300" />
                </button>
                <button
                    type="button"
                    onClick={() => handleToggleCategory(id)}
                    className="p-0.5 hover:bg-red-900/80 rounded text-red-300 cursor-pointer"
                    title="Ocultar categoría"
                >
                    <EyeOff className="w-2.5 h-2.5" />
                </button>
            </div>
        );
    };

    return (
        <div className="my-2 space-y-2 select-none relative group/impactsBlock">
            {/* PÍLDORA FLOTANTE DE CONTROLES RÁPIDOS */}
            {onUpdateConfig && blockId && (
                <div
                    className="absolute -top-3 right-0 z-30 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm opacity-0 group-hover/impactsBlock:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}
                >
                    <span className="text-[7.5px] uppercase font-bold text-slate-400">Color:</span>
                    <button
                        type="button"
                        onClick={handleCycleHeaderColor}
                        className={`px-1.5 py-0.2 text-[8px] font-bold rounded border transition-all cursor-pointer ${
                            headerColorKey === 'gold'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : headerColorKey === 'slate'
                                ? 'bg-slate-100 text-slate-800 border-slate-300'
                                : headerColorKey === 'emerald'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                        title="Cambiar color de cabecera"
                    >
                        {headerColorKey === 'gold' ? 'Dorado' : headerColorKey === 'slate' ? 'Pizarra' : headerColorKey === 'emerald' ? 'Verde' : 'Azul'}
                    </button>
                    <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />
                    <button
                        type="button"
                        onClick={handleToggleBorderStyle}
                        className="px-1.5 py-0.2 text-[8px] font-bold rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Alternar bordes sólidos"
                    >
                        {isNoBorder ? 'Borde: Ninguno' : 'Borde: Sólido'}
                    </button>
                    <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />
                    <button
                        type="button"
                        onClick={handleToggleLayoutMode}
                        className="px-1.5 py-0.2 text-[8px] font-bold rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Alternar diseño: Tabla Oficial / Tarjetas / Párrafos"
                    >
                        {layoutMode === 'table' ? 'Tabla 4 Col' : layoutMode === 'cards' ? 'Tarjetas' : 'Párrafos'}
                    </button>
                    <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />
                    <button
                        type="button"
                        onClick={handleAddCategory}
                        className="flex items-center gap-0.5 text-[8px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                        title="Añadir nueva fila de impacto"
                    >
                        <Plus className="w-2.5 h-2.5" /> Fila
                    </button>
                </div>
            )}

            {/* TÍTULO DE LA SECCIÓN (EDITABLE IN-PLACE) */}
            <div className="mb-2 ml-7 sm:ml-8">
                {editingKey === 'impactsTitle' ? (
                    <div className="flex items-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveText('impactsTitle');
                                if (e.key === 'Escape') setEditingKey(null);
                            }}
                            autoFocus
                            className="text-[10.5pt] font-bold uppercase tracking-wide bg-white text-slate-900 border border-indigo-400 px-1 py-0.5 rounded outline-none w-full"
                        />
                        <button
                            type="button"
                            onClick={() => handleSaveText('impactsTitle')}
                            className="p-1 bg-emerald-600 text-white rounded text-[10px]"
                        >
                            <Check className="w-3 h-3" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditingKey(null)}
                            className="p-1 bg-slate-400 text-white rounded text-[10px]"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div
                        className="group/title flex items-center gap-2 cursor-pointer"
                        onClick={() => handleStartEditing('impactsTitle', displayTitle)}
                        title="Doble clic o clic para editar título"
                    >
                        <h5
                            className="text-[10.5pt] font-bold uppercase tracking-wide transition-colors"
                            style={{ color: headerBg }}
                        >
                            {displayTitle}
                        </h5>
                        {onUpdateConfig && blockId && (
                            <Pencil className="w-3 h-3 opacity-0 group-hover/title:opacity-100 text-indigo-600 transition-opacity" />
                        )}
                    </div>
                )}
            </div>

            {layoutMode === 'cards' ? (
                /* MODO TARJETAS BENTO */
                <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat, idx) => {
                        const id = cat.id || cat.key || `${idx}`;
                        const isEditing = editingCatId === id;
                        return (
                            <div key={id} className={`border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs group/cell relative ${cat.colSpan === 2 ? 'col-span-2' : 'col-span-1'}`}>
                                <div className="p-1.5 text-white font-bold text-[9px] uppercase tracking-wider relative flex items-center justify-between" style={{ backgroundColor: headerBg }}>
                                    {isEditing ? (
                                        <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                value={editingTitleText}
                                                onChange={e => setEditingTitleText(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleUpdateCategoryTitle(id, editingTitleText)}
                                                autoFocus
                                                className="w-full px-1 py-0.5 text-slate-900 bg-white text-[9px] font-bold rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateCategoryTitle(id, editingTitleText)}
                                                className="p-1 bg-emerald-600 rounded text-white"
                                            >
                                                <Check className="w-2.5 h-2.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingCatId(null)}
                                                className="p-1 bg-slate-600 rounded text-white"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="truncate pr-16">{cat.title}</span>
                                            {renderControls(cat, idx === 0, idx === categories.length - 1)}
                                        </>
                                    )}
                                </div>
                                <div className="p-2 text-[9px] text-slate-600 bg-slate-50/50 leading-relaxed italic">
                                    {cat.placeholder || 'Descripción del impacto asignado al proyecto...'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : layoutMode === 'sections' ? (
                /* MODO CONSECUTIVO (PÁRRAFOS) */
                <div className="space-y-2.5">
                    {categories.map((cat, idx) => {
                        const id = cat.id || cat.key || `${idx}`;
                        const isEditing = editingCatId === id;
                        return (
                            <div key={id} className="pl-3 py-1 bg-slate-50/40 rounded-r-md group/cell relative" style={{ borderLeft: `4px solid ${headerBg}` }}>
                                {isEditing ? (
                                    <div className="flex items-center gap-1 my-1" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editingTitleText}
                                            onChange={e => setEditingTitleText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleUpdateCategoryTitle(id, editingTitleText)}
                                            autoFocus
                                            className="px-1 py-0.5 text-slate-900 bg-white text-[9.5px] font-bold rounded border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateCategoryTitle(id, editingTitleText)}
                                            className="p-1 bg-emerald-600 rounded text-white"
                                        >
                                            <Check className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingCatId(null)}
                                            className="p-1 bg-slate-600 rounded text-white"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <h6 className="text-[9.5px] font-bold uppercase tracking-wide" style={{ color: headerBg }}>{cat.title}</h6>
                                        {renderControls(cat, idx === 0, idx === categories.length - 1)}
                                    </div>
                                )}
                                <p className="text-[9px] text-slate-600 mt-0.5 leading-relaxed italic">
                                    {cat.placeholder || 'Descripción del impacto asignado al proyecto...'}
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* MODO OFICIAL INSTITUCIONAL: TABLA RETICULAR DE 4 COLUMNAS */
                <div className="overflow-hidden" style={borderFullStyle}>
                    <table className="w-full border-collapse text-[9px]" style={{ borderCollapse: 'collapse', ...borderFullStyle }}>
                        <thead>
                            <tr style={{ backgroundColor: headerBg, color: '#ffffff', ...borderBottomStyle }}>
                                {/* COL 1: IMPACTO DEL PROYECTO */}
                                <th
                                    className="p-1.5 text-left font-bold uppercase tracking-wider relative group/th cursor-pointer"
                                    style={{ width: '26%', ...borderRightStyle }}
                                    onClick={() => handleStartEditing('titleImpactoCol', titleImpactoCol)}
                                    title="Clic para editar encabezado"
                                >
                                    {editingKey === 'titleImpactoCol' ? (
                                        <input
                                            type="text"
                                            value={editingText}
                                            onChange={e => setEditingText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveText('titleImpactoCol');
                                                if (e.key === 'Escape') setEditingKey(null);
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            autoFocus
                                            className="w-full px-1 py-0.5 text-slate-900 bg-white text-[8.5px] font-bold rounded"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span>{titleImpactoCol}</span>
                                            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/th:opacity-80 text-amber-300" />
                                        </div>
                                    )}
                                </th>

                                {/* COL 2: Aplica (X) */}
                                <th
                                    className="p-1.5 text-center font-bold tracking-wider relative group/th cursor-pointer"
                                    style={{ width: '12%', ...borderRightStyle }}
                                    onClick={() => handleStartEditing('titleAplicaCol', titleAplicaCol)}
                                    title="Clic para editar encabezado"
                                >
                                    {editingKey === 'titleAplicaCol' ? (
                                        <input
                                            type="text"
                                            value={editingText}
                                            onChange={e => setEditingText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveText('titleAplicaCol');
                                                if (e.key === 'Escape') setEditingKey(null);
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            autoFocus
                                            className="w-full px-1 py-0.5 text-slate-900 bg-white text-[8.5px] font-bold rounded"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center gap-1">
                                            <span>{titleAplicaCol}</span>
                                            <Pencil className="w-2 h-2 opacity-0 group-hover/th:opacity-80 text-amber-300" />
                                        </div>
                                    )}
                                </th>

                                {/* COL 3: No aplica (x) */}
                                <th
                                    className="p-1.5 text-center font-bold tracking-wider relative group/th cursor-pointer"
                                    style={{ width: '12%', ...borderRightStyle }}
                                    onClick={() => handleStartEditing('titleNoAplicaCol', titleNoAplicaCol)}
                                    title="Clic para editar encabezado"
                                >
                                    {editingKey === 'titleNoAplicaCol' ? (
                                        <input
                                            type="text"
                                            value={editingText}
                                            onChange={e => setEditingText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveText('titleNoAplicaCol');
                                                if (e.key === 'Escape') setEditingKey(null);
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            autoFocus
                                            className="w-full px-1 py-0.5 text-slate-900 bg-white text-[8.5px] font-bold rounded"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center gap-1">
                                            <span>{titleNoAplicaCol}</span>
                                            <Pencil className="w-2 h-2 opacity-0 group-hover/th:opacity-80 text-amber-300" />
                                        </div>
                                    )}
                                </th>

                                {/* COL 4: DESCRIPCIÓN BREVE (Solamente si aplica) */}
                                <th
                                    className="p-1.5 text-left font-bold uppercase tracking-wider relative group/th cursor-pointer"
                                    style={{ width: '50%' }}
                                    onClick={() => handleStartEditing('titleDescripcionCol', titleDescripcionCol)}
                                    title="Clic para editar encabezado"
                                >
                                    {editingKey === 'titleDescripcionCol' ? (
                                        <input
                                            type="text"
                                            value={editingText}
                                            onChange={e => setEditingText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveText('titleDescripcionCol');
                                                if (e.key === 'Escape') setEditingKey(null);
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            autoFocus
                                            className="w-full px-1 py-0.5 text-slate-900 bg-white text-[8.5px] font-bold rounded"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span>{titleDescripcionCol}</span>
                                            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/th:opacity-80 text-amber-300" />
                                        </div>
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat, idx) => {
                                const id = cat.id || cat.key || `${idx}`;
                                const isEditing = editingCatId === id;
                                return (
                                    <tr key={id} className="bg-white hover:bg-slate-50/50 transition-colors group/row" style={borderBottomStyle}>
                                        {/* COL 1: Categoría de Impacto */}
                                        <td className="p-1.5 font-bold text-slate-900 text-[9px] relative group/cell" style={borderRightStyle}>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="text"
                                                        value={editingTitleText}
                                                        onChange={e => setEditingTitleText(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleUpdateCategoryTitle(id, editingTitleText)}
                                                        autoFocus
                                                        className="w-full px-1 py-0.5 text-slate-900 bg-white text-[8.5px] font-bold rounded border"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateCategoryTitle(id, editingTitleText)}
                                                        className="p-0.5 bg-emerald-600 rounded text-white"
                                                    >
                                                        <Check className="w-2.5 h-2.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingCatId(null)}
                                                        className="p-0.5 bg-slate-600 rounded text-white"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <span>{cat.title}</span>
                                                    {renderControls(cat, idx === 0, idx === categories.length - 1)}
                                                </div>
                                            )}
                                        </td>

                                        {/* COL 2: Aplica (X) */}
                                        <td className="p-1.5 text-center font-bold text-slate-700 text-[9px]" style={borderRightStyle}>
                                            <span className="inline-block w-4 h-4 leading-4 text-center text-slate-400"> </span>
                                        </td>

                                        {/* COL 3: No aplica (x) */}
                                        <td className="p-1.5 text-center font-bold text-slate-700 text-[9px]" style={borderRightStyle}>
                                            <span className="inline-block w-4 h-4 leading-4 text-center text-slate-400"> </span>
                                        </td>

                                        {/* COL 4: DESCRIPCIÓN BREVE */}
                                        <td className="p-1.5 text-slate-400 italic text-[8.5px]">
                                            {cat.placeholder || 'Descripción breve (solamente si aplica)...'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


