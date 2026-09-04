import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Scissors, Pencil, Check, X, EyeOff, Plus, RotateCcw } from 'lucide-react';
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
    const defaultHeaderBg = resolveHeaderColor(c.headerColor || '#1e2a4a');
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
        if (variant === 'banner_navy') return '#1e2a4a';
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
        const labelDisplay = c.customLabel_showTitulo ? `${c.customLabel_showTitulo.trim()}:` : 'NOMBRE DEL PROYECTO:';
        const req = c.req_showTitulo;

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
                    <td colSpan={6} className="p-2 text-slate-800 font-semibold bg-white align-middle">
                        {req ? <span className="text-slate-500 italic">[{req}]</span> : <>&nbsp;</>}
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
        const labelDisplay = c.customLabel_showPrograma ? `${c.customLabel_showPrograma.trim()}:` : 'PROGRAMA:';
        const req = c.req_showPrograma;

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
                    <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                        {req ? <span className="text-slate-500 italic">[{req}]</span> : <>&nbsp;</>}
                    </td>
                </tr>
            )
        });
    }

    // 3. GRUPO DE INVESTIGACIÓN
    if (c.showGrupo !== false) {
        const variant = c.variant_showGrupo || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showGrupo || 'Grupo de Investigación';
        const labelDisplay = c.customLabel_showGrupo ? `${c.customLabel_showGrupo.trim()}:` : 'GRUPO DE INVESTIGACIÓN:';
        const req = c.req_showGrupo || '[Escriba el Nombre o borrar este título]';

        items.push({
            id: 'showGrupo',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <tr key="showGrupo" className={`${rowBorderCss} group/row relative`}>
                    <td
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
                    <td className={`font-bold text-[8px] text-center ${cellBorderCss} p-1.5 align-middle bg-white text-slate-800`}>
                        NO
                    </td>
                    <td className={`text-center ${cellBorderCss} p-1.5 text-[8.5px] align-middle bg-white`}>
                        &nbsp;
                    </td>
                    <td className={`font-bold text-[8px] text-center ${cellBorderCss} p-1.5 align-middle bg-white text-slate-800`}>
                        SI
                    </td>
                    <td colSpan={3} className="p-1.5 text-slate-400 italic text-[8.5px] align-middle bg-white">
                        {req}
                    </td>
                </tr>
            )
        });
    }

    // 4. DOMINIO Y LÍNEA DE INVESTIGACIÓN
    if (c.showLinea !== false) {
        const variant = c.variant_showLinea || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showLinea || 'Línea de Investigación';
        const labelDisplay = c.customLabel_showLinea ? `${c.customLabel_showLinea.trim()}:` : 'LÍNEA DE INVESTIGACIÓN:';
        const req = c.req_showLinea;

        items.push({
            id: 'showLinea',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <React.Fragment key="showLinea">
                    <tr className={`${rowBorderCss} group/row relative`}>
                        <td
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle relative`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            DOMINIO:
                            {renderDirectControlsPill('showLinea', rawLabel, isFirst, isLast, variant, false, allKeys)}
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
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            {req ? <span className="text-slate-500 italic">[{req}]</span> : <>&nbsp;</>}
                        </td>
                    </tr>
                    <tr className={rowBorderCss}>
                        <td
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            SUBLÍNEA DE INVESTIGACIÓN:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                </React.Fragment>
            )
        });
    }

    // 5. TIPO DE INVESTIGACIÓN
    if (c.showTipo !== false) {
        const variant = c.variant_showTipo || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showTipo || 'Tipo de Investigación';
        const labelDisplay = c.customLabel_showTipo ? `${c.customLabel_showTipo.trim()}:` : 'TIPO DE INVESTIGACIÓN (X):';

        items.push({
            id: 'showTipo',
            rawLabel,
            variant,
            render: (isFirst, isLast, allKeys) => (
                <tr key="showTipo" className={`${rowBorderCss} group/row relative`}>
                    <td
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
                    <td className={`font-bold text-[7.5px] text-center ${cellBorderCss} p-1.5 align-middle bg-white text-slate-800`}>
                        BÁSICA
                    </td>
                    <td className={`text-center ${cellBorderCss} p-1.5 text-[8.5px] align-middle bg-white`}>
                        &nbsp;
                    </td>
                    <td className={`font-bold text-[7.5px] text-center ${cellBorderCss} p-1.5 align-middle bg-white text-slate-800`}>
                        APLICADA
                    </td>
                    <td className={`text-center ${cellBorderCss} p-1.5 text-[8.5px] align-middle bg-white`}>
                        &nbsp;
                    </td>
                    <td className={`font-bold text-[7px] text-center ${cellBorderCss} p-1.5 align-middle bg-white text-slate-800`}>
                        DESARROLLO EXPERIMENTAL
                    </td>
                    <td className="text-center p-1.5 text-[8.5px] align-middle bg-white">
                        &nbsp;
                    </td>
                </tr>
            )
        });
    }

    // 6. CLASIFICACIÓN CACES / UNESCO
    if (c.showCaces !== false) {
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

    // 7. CARRERA
    if (c.showCarrera !== false) {
        const variant = c.variant_showCarrera || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showCarrera || 'Carrera';
        const labelDisplay = c.customLabel_showCarrera ? `${c.customLabel_showCarrera.trim()}:` : 'CARRERA:';
        const req = c.req_showCarrera;

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
                    <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                        Tecnología Superior en {req ? `[${req}]` : ''}
                    </td>
                </tr>
            )
        });
    }

    // 8. CONVOCATORIA Y TIEMPO DE EJECUCIÓN
    if (c.showConvocatoria !== false) {
        const variant = c.variant_showConvocatoria || 'standard';
        const bg = resolveBg(variant);
        const fg = getContrastFg(bg);
        const rawLabel = c.customLabel_showConvocatoria || 'Convocatoria';
        const labelDisplay = c.customLabel_showConvocatoria ? `${c.customLabel_showConvocatoria.trim()}:` : 'PERIODO ACADÉMICO DE CONVOCATORIA:';
        const req = c.req_showConvocatoria;

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
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            {req ? <span className="text-slate-500 italic">[{req}]</span> : <>&nbsp;</>}
                        </td>
                    </tr>
                    <tr className={rowBorderCss}>
                        <td
                            className={`p-2 font-bold text-[8.5px] uppercase ${cellBorderCss} align-middle`}
                            style={{ backgroundColor: bg, color: fg }}
                        >
                            TIEMPO DE EJECUCIÓN:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
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
        const labelDisplay = c.customLabel_showDirector ? `${c.customLabel_showDirector.trim()}:` : 'DIRECTOR DEL PROYECTO:';
        const req = c.req_showDirector || '[Título abreviado, Apellidos y Nombres Completos]';

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
                    <td colSpan={6} className="p-2 text-slate-500 italic bg-white align-middle">
                        {req}
                    </td>
                </tr>
            )
        });
    }

    // 10. FECHAS (BANNER DORADO O PERSONALIZADO)
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
                            FECHA DE PRESENTACIÓN DEL PROYECTO
                            {renderDirectControlsPill('showFechas', rawLabel, isFirst, isLast, variant, false, allKeys)}
                        </td>
                        <td colSpan={3} className={`p-1.5 font-bold text-[7.5px] text-center ${cellBorderCss} align-middle`} style={{ backgroundColor: bg, color: fg }}>
                            FECHA PREVISTA DE INICIO DEL PROYECTO
                        </td>
                        <td colSpan={3} className="p-1.5 font-bold text-[7.5px] text-center align-middle" style={{ backgroundColor: bg, color: fg }}>
                            FECHA PREVISTA DE FINALIZACIÓN DEL PROYECTO
                        </td>
                    </tr>
                    <tr className={`${rowBorderCss} text-[8px] text-slate-500 italic bg-white text-center`}>
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
                    <div className="flex items-center gap-2">
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
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, blockId, onUpdateConfig }) => {
    const c = config || {};
    const headerColorKey = c.technicalHeaderColor || 'navy';
    const borderStyleKey = c.technicalBorderStyle || 'solid';

    const resolveHeaderBg = (col: string) => {
        switch (col) {
            case 'gold': return '#b8912e';
            case 'slate': return '#334155';
            case 'emerald': return '#065f46';
            case 'navy':
            default: return '#1e2a4a';
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

    return (
        <div className="my-2 select-none">
            <div className={`rounded-lg shadow-xs overflow-hidden ${borderStyleKey === 'none' ? '' : 'border border-slate-300'}`}>
                <table className="w-full border-collapse text-[9px]">
                    <tbody>
                        {(() => {
                            const rows: React.ReactNode[] = [];
                            const goldColor = '#b8912e';
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
                                    if (v === 'banner_navy') return '#1e2a4a';
                                    if (v === 'banner_emerald') return '#065f46';
                                    return headerBg;
                                };

                                if (sub.pageBreakBefore) {
                                    rows.push(
                                        <tr key={`break-${sub.key}`} className="bg-purple-50 border-b border-purple-200">
                                            <td colSpan={2} className="py-0.5 px-2 text-[7.5px] font-bold text-purple-700 uppercase flex items-center gap-1">
                                                <Scissors className="w-2.5 h-2.5" />
                                                <span>Salto de página obligatorio en PDF antes de: {displayTitle}</span>
                                            </td>
                                        </tr>
                                    );
                                }

                                if (colSpan === 1) {
                                    const nextSub = subs[idx + 1];
                                    if (nextSub && (nextSub.colSpan === 1 || nextSub.variant === 'banner_navy')) {
                                        const nextNum = (nextSub.numberPrefix || '').trim();
                                        let nextTitleClean = (nextSub.title || '').trim();
                                        if (nextNum && nextTitleClean.toLowerCase().startsWith(nextNum.toLowerCase())) {
                                            nextTitleClean = nextTitleClean.substring(nextNum.length).trim();
                                        }
                                        const nextDisplayTitle = nextNum ? `${nextNum} ${nextTitleClean}` : nextTitleClean;

                                        const bg1 = resolveBg(sub.variant);
                                        const bg2 = resolveBg(nextSub.variant);

                                        rows.push(
                                            <React.Fragment key={sub.key}>
                                                <tr className="border-b border-slate-300">
                                                    <td className="p-1.5 w-1/2 text-white font-bold text-center uppercase border-r border-slate-300 text-[8.5px] cursor-pointer relative group/cell" style={{ backgroundColor: bg1 }}>
                                                        <span>{displayTitle}</span>
                                                        {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                                    </td>
                                                    <td className="p-1.5 w-1/2 text-white font-bold text-center uppercase border-slate-300 text-[8.5px] cursor-pointer relative group/cell" style={{ backgroundColor: bg2 }}>
                                                        <span>{nextDisplayTitle}</span>
                                                        {renderDirectControlsPill(nextSub, idx + 1 === 0, idx + 1 === subs.length - 1)}
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-slate-200">
                                                    <td className="p-2 w-1/2 text-slate-600 bg-white border-r border-slate-200 align-top text-[8.5px]">
                                                        {sub.requirementText ? <span className="font-bold text-slate-700 block">[{sub.requirementText}]</span> : <span className="italic text-slate-400">[Redacción colaborativa]</span>}
                                                    </td>
                                                    <td className="p-2 w-1/2 text-slate-600 bg-white align-top text-[8.5px]">
                                                        {nextSub.requirementText ? <span className="font-bold text-slate-700 block">[{nextSub.requirementText}]</span> : <span className="italic text-slate-400">[Redacción colaborativa]</span>}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                        idx += 2;
                                    } else {
                                        const bg1 = resolveBg(sub.variant);
                                        rows.push(
                                            <React.Fragment key={sub.key}>
                                                <tr className="border-b border-slate-300">
                                                    <td className="p-1.5 w-1/2 text-white font-bold text-center uppercase border-r border-slate-300 text-[8.5px] cursor-pointer relative group/cell" style={{ backgroundColor: bg1 }}>
                                                        <span>{displayTitle}</span>
                                                        {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                                    </td>
                                                    <td className="p-1.5 w-1/2 bg-slate-50/50 text-slate-300 font-normal italic text-center uppercase border-slate-300 text-[8px]">
                                                        [Espacio disponible (50%)]
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-slate-200">
                                                    <td className="p-2 w-1/2 text-slate-600 bg-white border-r border-slate-200 align-top text-[8.5px]">
                                                        {sub.requirementText ? <span className="font-bold text-slate-700 block">[{sub.requirementText}]</span> : <span className="italic text-slate-400">[Redacción colaborativa]</span>}
                                                    </td>
                                                    <td className="p-2 w-1/2 bg-slate-50/30 text-slate-300 italic align-top text-[8px] text-center">
                                                        —
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                        idx++;
                                    }
                                } else if (variant === 'banner_gold' || sub.isGroupHeader) {
                                    rows.push(
                                        <tr key={sub.key} className="border-b border-slate-300">
                                            <td
                                                colSpan={2}
                                                className="p-1.5 text-center font-bold text-slate-900 uppercase text-[9px] tracking-wider cursor-pointer relative group/cell"
                                                style={{ backgroundColor: resolveBg(sub.variant) }}
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
                                                        <span className="text-white drop-shadow-xs">{displayTitle}</span>
                                                        {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                    idx++;
                                } else {
                                    const bg1 = resolveBg(sub.variant);
                                    rows.push(
                                        <tr key={sub.key} className="border-b border-slate-200">
                                            <td className="p-2 w-[32%] text-white font-bold text-left uppercase align-middle border-r border-slate-300 text-[8.5px] cursor-pointer relative group/cell" style={{ backgroundColor: bg1 }}>
                                                <span>{displayTitle}</span>
                                                {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                            </td>
                                            <td className="p-2 w-[68%] text-slate-600 bg-white align-top text-[8.5px]">
                                                {sub.requirementText ? <span className="font-bold text-slate-700 block">[{sub.requirementText}]</span> : <span className="italic text-slate-400">[Redacción colaborativa]</span>}
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
    const productosTitle = c.productosTitle || '5. Productos y Entregables Esperados';
    const layoutMode = c.productsLayoutMode || c.layoutMode || 'table_detailed';

    const cols = getNormalizedColumns(c.productColumns);
    const rawCats = c.productCategories || c.categories;
    const categories = getNormalizedCategories(rawCats).filter((cat: any) => cat.enabled !== false);

    const handleToggleColumn = (colKey: string) => {
        if (blockId && onUpdateConfig) {
            const updatedCols = { ...cols, [colKey]: !cols[colKey] };
            onUpdateConfig(blockId, 'productColumns', updatedCols);
        }
    };

    return (
        <div className="my-2 space-y-2 select-none">
            {/* BARRA DE BOTONES CHIP EN LIENZO PARA TOGGLE DIRECTO DE COLUMNAS */}
            {onUpdateConfig && blockId && (layoutMode === 'table_detailed' || layoutMode === 'grouped_sections') && (
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-emerald-50/50 border border-emerald-100 rounded-md text-[8.5px]">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider shrink-0 mr-1">Campos en Lienzo:</span>
                    {[
                        { key: 'showCategory', label: 'Categoría IST' },
                        { key: 'showSubtype', label: 'Subtipo' },
                        { key: 'showProductName', label: 'Nombre' },
                        { key: 'showSenadi', label: 'SENADI' },
                        { key: 'showTrl', label: 'TRL' },
                        { key: 'showIndicator', label: 'Indicador CACES' },
                        { key: 'showVerificationMeans', label: 'Medio Verif.' },
                        { key: 'showQuantity', label: 'Cantidad' },
                        { key: 'showDeadline', label: 'Plazo' },
                    ].map(({ key, label }) => {
                        const active = cols[key] !== false;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleToggleColumn(key); }}
                                className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer font-medium ${active
                                    ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                                    : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 line-through'
                                    }`}
                            >
                                {active ? '✓ ' : '+ '}{label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ÁREA PRINCIPAL DEL LIENZO A4 */}
            <div className="space-y-2 border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
                {/* Título Editable Directamente en el Lienzo */}
                {onUpdateConfig && blockId ? (
                    <input
                        type="text"
                        value={productosTitle}
                        onChange={e => onUpdateConfig(blockId, 'productosTitle', e.target.value)}
                        className="text-[10px] font-black uppercase text-slate-800 tracking-wide bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-600 focus:outline-none w-full py-0.5"
                    />
                ) : (
                    <h5 className="text-[9.5px] font-black uppercase text-slate-800 tracking-wide">{productosTitle}</h5>
                )}

                {layoutMode === 'grouped_sections' ? (
                    /* MODO SECCIONES CONSECUTIVAS */
                    <div className="space-y-3">
                        {categories.map((cat: any) => (
                            <div key={cat.id || cat.name} className="space-y-1">
                                <h6 className="text-[8.5px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {cat.name}
                                </h6>
                                <table className="w-full border-collapse border border-slate-200 text-[9px]">
                                    <thead>
                                        <tr className="bg-[#1e2a4a] text-white">
                                            <th className="p-1 text-left border border-slate-200">Entregable Tecnológico</th>
                                            {cols.showSenadi !== false && <th className="p-1 text-center border border-slate-200 w-16">SENADI</th>}
                                            {cols.showTrl !== false && <th className="p-1 text-center border border-slate-200 w-14">TRL</th>}
                                            {cols.showIndicator !== false && <th className="p-1 text-left border border-slate-200">Indicador CACES</th>}
                                            {cols.showVerificationMeans !== false && <th className="p-1 text-left border border-slate-200">Medio Verificación</th>}
                                            {cols.showQuantity !== false && <th className="p-1 text-center border border-slate-200 w-12">Cant.</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="bg-white text-slate-700">
                                            <td className="p-1 border border-slate-200 font-medium">Prototipo funcional / Software de gestión</td>
                                            {cols.showSenadi !== false && <td className="p-1 border border-slate-200 text-center font-bold text-emerald-600 text-[8px]">Sí</td>}
                                            {cols.showTrl !== false && <td className="p-1 border border-slate-200 text-center font-mono text-amber-600 font-bold text-[8px]">TRL 6</td>}
                                            {cols.showIndicator !== false && <td className="p-1 border border-slate-200">1 Prototipo operativo en laboratorio</td>}
                                            {cols.showVerificationMeans !== false && <td className="p-1 border border-slate-200">Certificado SENADI / Acta de entrega</td>}
                                            {cols.showQuantity !== false && <td className="p-1 border border-slate-200 text-center font-bold text-emerald-600">1</td>}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                ) : layoutMode === 'table_simple' ? (
                    /* MODO TABLA SIMPLE */
                    <table className="w-full border-collapse border border-slate-200 text-[9.5px]">
                        <thead>
                            <tr className="bg-[#1e2a4a] text-white">
                                <th className="p-1.5 text-left font-bold border border-slate-200">Tipo de Entregable Tecnológico (IST)</th>
                                <th className="p-1.5 text-center font-bold border border-slate-200 w-24">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white text-slate-700">
                                <td className="p-1.5 border border-slate-200 font-medium">Prototipos Funcionales / Software SENADI</td>
                                <td className="p-1.5 border border-slate-200 text-center font-mono font-bold text-emerald-600">1</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    /* MODO TABLA DETALLADA CACES (DEFAULT) */
                    <table className="w-full border-collapse border border-slate-200 text-[9px]">
                        <thead>
                            <tr className="bg-[#1e2a4a] text-white">
                                {cols.showCategory !== false && <th className="p-1.5 text-left border border-slate-200">Categoría IST</th>}
                                {cols.showSubtype !== false && <th className="p-1.5 text-left border border-slate-200">Subtipo / Entregable</th>}
                                {cols.showProductName !== false && <th className="p-1.5 text-left border border-slate-200">Nombre del Producto</th>}
                                {cols.showSenadi !== false && <th className="p-1.5 text-center border border-slate-200 w-16">SENADI</th>}
                                {cols.showTrl !== false && <th className="p-1.5 text-center border border-slate-200 w-14">TRL</th>}
                                {cols.showIndicator !== false && <th className="p-1.5 text-left border border-slate-200">Indicador CACES</th>}
                                {cols.showVerificationMeans !== false && <th className="p-1.5 text-left border border-slate-200">Medio de Verificación</th>}
                                {cols.showQuantity !== false && <th className="p-1.5 text-center border border-slate-200 w-14">Cant.</th>}
                                {cols.showDeadline !== false && <th className="p-1.5 text-center border border-slate-200 w-20">Plazo</th>}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white text-slate-700">
                                {cols.showCategory !== false && <td className="p-1.5 border border-slate-200 font-semibold text-emerald-700">I+D+i Aplicada</td>}
                                {cols.showSubtype !== false && <td className="p-1.5 border border-slate-200 font-medium">Prototipo / Software SENADI</td>}
                                {cols.showProductName !== false && <td className="p-1.5 border border-slate-200">Prototipo de banco de pruebas automatizado...</td>}
                                {cols.showSenadi !== false && <td className="p-1.5 border border-slate-200 text-center font-bold text-emerald-600 text-[8.5px]">Depósito Legal</td>}
                                {cols.showTrl !== false && <td className="p-1.5 border border-slate-200 text-center font-mono text-amber-600 font-bold text-[8.5px]">TRL 6</td>}
                                {cols.showIndicator !== false && <td className="p-1.5 border border-slate-200">1 Prototipo validado en laboratorio</td>}
                                {cols.showVerificationMeans !== false && <td className="p-1.5 border border-slate-200">Certificado SENADI / Acta de entrega</td>}
                                {cols.showQuantity !== false && <td className="p-1.5 border border-slate-200 text-center font-mono font-bold text-emerald-600">1</td>}
                                {cols.showDeadline !== false && <td className="p-1.5 border border-slate-200 text-center">Trimestre 4</td>}
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export const RenderImpacts: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, blockId, onUpdateConfig }) => {
    const c = config || {};
    const displayTitle = c.impactsTitle || c.title || '6.  MATRIZ DE IMPACTOS';
    const rawCats = c.impactCategories || c.categories;
    const allCategories: ImpactCategory[] = (Array.isArray(rawCats) && rawCats.length > 0)
        ? rawCats
        : DEFAULT_IMPACT_CATEGORIES;
    const categories = allCategories.filter((cat: any) => cat.enabled !== false);
    const layoutMode = c.impactLayoutMode || c.impactsLayoutMode || 'table';

    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editingTitleText, setEditingTitleText] = useState<string>('');

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
            title: 'NUEVO IMPACTO PERSONALIZADO',
            placeholder: 'Descripción detallada del impacto esperado...',
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
        <div className="my-2 space-y-2 select-none">
            {/* Encabezado de sección con edición de título */}
            <div className="flex items-center justify-between">
                {onUpdateConfig && blockId ? (
                    <input
                        type="text"
                        value={displayTitle}
                        onChange={e => onUpdateConfig(blockId, 'impactsTitle', e.target.value)}
                        className="text-[9.5px] font-black uppercase text-slate-800 tracking-wide bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none py-0.5 max-w-md"
                    />
                ) : (
                    <h5 className="text-[9.5px] font-black uppercase text-slate-800 tracking-wide">{displayTitle}</h5>
                )}

                {onUpdateConfig && blockId && (
                    <button
                        type="button"
                        onClick={handleAddCategory}
                        className="flex items-center gap-1 text-[8.5px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded shadow-2xs transition-all cursor-pointer"
                    >
                        <Plus className="w-2.5 h-2.5" /> Añadir Impacto
                    </button>
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
                                <div className="p-1.5 bg-[#1e2a4a] text-white font-bold text-[9px] uppercase tracking-wider relative flex items-center justify-between">
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
                            <div key={id} className="border-l-4 border-[#1e2a4a] pl-3 py-1 bg-slate-50/40 rounded-r-md group/cell relative">
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
                                        <h6 className="text-[9.5px] font-bold uppercase text-[#1e2a4a] tracking-wide">{cat.title}</h6>
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
                /* MODO TABLA CLÁSICA (RETICULAR) */
                <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
                    <tbody>
                        {categories.map((cat, idx) => {
                            const id = cat.id || cat.key || `${idx}`;
                            const isEditing = editingCatId === id;
                            return (
                                <tr key={id} className="border-b border-slate-200 last:border-0 group/cell">
                                    <td className="p-2 bg-[#1e2a4a] text-white font-bold text-[8.5px] uppercase w-1/3 align-top border border-slate-300 relative">
                                        {isEditing ? (
                                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editingTitleText}
                                                    onChange={e => setEditingTitleText(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdateCategoryTitle(id, editingTitleText)}
                                                    autoFocus
                                                    className="w-full px-1 py-0.5 text-slate-900 bg-white text-[8.5px] font-bold rounded"
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
                                            <>
                                                <span className="block pr-16">{cat.title}</span>
                                                {renderControls(cat, idx === 0, idx === categories.length - 1)}
                                            </>
                                        )}
                                    </td>
                                    <td className="p-2 text-slate-700 bg-white align-top border border-slate-300 leading-relaxed italic text-[9px]">
                                        {cat.placeholder || 'Descripción del impacto asignado al proyecto...'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};
