import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Scissors, Bookmark } from 'lucide-react';
import type { IdentificationField, ImpactCategory } from '../../types';
import { DEFAULT_TECHNICAL_SUBSECTIONS, DEFAULT_IMPACT_CATEGORIES, DEFAULT_FINAL_REPORT_WRITING_SUBSECTIONS } from '../../types';
import { getHeaderStylePair } from './RenderCover';
import { getNormalizedColumns, getNormalizedCategories } from '../properties/ExpectedProductsProperties';

export const RenderProjectGeneralSection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, blockId, onUpdateConfig }) => {
    const c = config || {};
    const customFields: IdentificationField[] = c.customFields || [];
    const headerColorMode = c.headerColor || 'blue';
    const borderStyleMode = c.borderStyle || 'solid';

    const headerPair = getHeaderStylePair(headerColorMode);
    const borderCss = borderStyleMode === 'none' ? 'border-0' : 'border border-slate-300';
    const cellBorderCss = borderStyleMode === 'none' ? 'border-b border-slate-100' : 'border border-slate-300';

    const resolveVariantBg = (variant?: string) => {
        switch (variant) {
            case 'banner_gold': return { bg: '#b8912e', fg: '#ffffff' };
            case 'banner_navy': return { bg: '#1e2a4a', fg: '#ffffff' };
            case 'banner_emerald': return { bg: '#065f46', fg: '#ffffff' };
            default: return headerPair;
        }
    };

    interface TableItem {
        id: string;
        key: string;
        label: string;
        value: string;
        isCustom?: boolean;
        isGroupHeader?: boolean;
        variant?: string;
        requirementText?: string;
        colSpan: 1 | 2;
    }

    const rawItems: TableItem[] = [];

    if (c.showTitulo !== false) {
        rawItems.push({
            id: 'showTitulo',
            key: 'showTitulo',
            label: c.customLabel_showTitulo || 'Nombre del Proyecto',
            value: '[TEMA / NOMBRE DEL PROYECTO CIENTÍFICO]',
            colSpan: c.colSpan_showTitulo || 2,
            variant: c.variant_showTitulo || 'standard',
            requirementText: c.req_showTitulo,
        });
    }
    if (c.showDirector !== false) {
        rawItems.push({
            id: 'showDirector',
            key: 'showDirector',
            label: c.customLabel_showDirector || 'Director del Proyecto',
            value: '[Director Asignado]',
            colSpan: c.colSpan_showDirector || 1,
            variant: c.variant_showDirector || 'standard',
            requirementText: c.req_showDirector,
        });
    }
    if (c.showCarrera !== false) {
        rawItems.push({
            id: 'showCarrera',
            key: 'showCarrera',
            label: c.customLabel_showCarrera || 'Carrera / Unidad Académica',
            value: '[Carrera Seleccionada]',
            colSpan: c.colSpan_showCarrera || 1,
            variant: c.variant_showCarrera || 'standard',
            requirementText: c.req_showCarrera,
        });
    }
    if (c.showConvocatoria !== false) {
        rawItems.push({
            id: 'showConvocatoria',
            key: 'showConvocatoria',
            label: c.customLabel_showConvocatoria || 'Convocatoria Activa',
            value: '[Convocatoria Vigente]',
            colSpan: c.colSpan_showConvocatoria || 1,
            variant: c.variant_showConvocatoria || 'standard',
            requirementText: c.req_showConvocatoria,
        });
    }
    if (c.showPrograma !== false) {
        rawItems.push({
            id: 'showPrograma',
            key: 'showPrograma',
            label: c.customLabel_showPrograma || 'Programa de Investigación',
            value: '[Programa Institucional]',
            colSpan: c.colSpan_showPrograma || 1,
            variant: c.variant_showPrograma || 'standard',
            requirementText: c.req_showPrograma,
        });
    }
    if (c.showGrupo !== false) {
        rawItems.push({
            id: 'showGrupo',
            key: 'showGrupo',
            label: c.customLabel_showGrupo || 'Grupo de Investigación',
            value: '[Grupo Vinculado]',
            colSpan: c.colSpan_showGrupo || 1,
            variant: c.variant_showGrupo || 'standard',
            requirementText: c.req_showGrupo,
        });
    }
    if (c.showLinea !== false) {
        rawItems.push({
            id: 'showLinea',
            key: 'showLinea',
            label: c.customLabel_showLinea || 'Línea de Investigación',
            value: 'Línea: [Línea] / Sublínea: [Sublínea]',
            colSpan: c.colSpan_showLinea || 1,
            variant: c.variant_showLinea || 'standard',
            requirementText: c.req_showLinea,
        });
    }
    if (c.showTipo !== false) {
        rawItems.push({
            id: 'showTipo',
            key: 'showTipo',
            label: c.customLabel_showTipo || 'Tipo de Investigación',
            value: 'APLICADA',
            colSpan: c.colSpan_showTipo || 1,
            variant: c.variant_showTipo || 'standard',
            requirementText: c.req_showTipo,
        });
    }
    if (c.showCaces !== false) {
        rawItems.push({
            id: 'showCaces',
            key: 'showCaces',
            label: c.customLabel_showCaces || 'Campo Detallado CACES',
            value: '[Campo CACES]',
            colSpan: c.colSpan_showCaces || 1,
            variant: c.variant_showCaces || 'standard',
            requirementText: c.req_showCaces,
        });
    }
    if (c.showFechas !== false) {
        rawItems.push({
            id: 'showFechas',
            key: 'showFechas',
            label: c.customLabel_showFechas || 'Fechas y Plazos',
            value: 'Inicio: [Fecha] — Fin: [Fecha]',
            colSpan: c.colSpan_showFechas || 1,
            variant: c.variant_showFechas || 'standard',
            requirementText: c.req_showFechas,
        });
    }

    customFields.forEach((f) => {
        if (f.isGroupHeader) {
            rawItems.push({
                id: f.fieldKey,
                key: f.fieldKey,
                label: f.label,
                value: '',
                isCustom: true,
                isGroupHeader: true,
                variant: f.variant || 'banner_gold',
                colSpan: 2,
            });
            return;
        }

        const val = f.fieldType === 'select_inline'
            ? `[Opciones: ${(f.options || []).join(', ')}]`
            : f.fieldType === 'select_catalog'
                ? `[Catálogo: ${f.catalogUrl || 'sin url'}]`
                : f.fieldType === 'date'
                    ? '[dd/mm/aaaa]'
                    : `[${f.placeholder || f.label}]`;

        rawItems.push({
            id: f.fieldKey,
            key: f.fieldKey,
            label: f.label,
            value: val,
            isCustom: true,
            isGroupHeader: false,
            variant: f.variant || 'standard',
            requirementText: f.requirementText,
            colSpan: (f.colSpan as 1 | 2) || 1,
        });
    });

    const fieldsOrder: string[] = c.fieldsOrder || [];

    const handleSpanChange = (item: TableItem, newSpan: 1 | 2) => {
        if (!onUpdateConfig || !blockId) return;
        if (item.isCustom) {
            const updated = customFields.map(f => f.fieldKey === item.key ? { ...f, colSpan: newSpan } : f);
            onUpdateConfig(blockId, 'customFields', updated);
        } else {
            onUpdateConfig(blockId, `colSpan_${item.key}`, newSpan);
        }
    };

    const handleMoveItem = (itemKey: string, direction: 'up' | 'down') => {
        if (!onUpdateConfig || !blockId) return;
        const currentKeys = rawItems.map(i => i.key);
        const activeOrder = fieldsOrder.length > 0
            ? fieldsOrder.filter(k => currentKeys.includes(k))
            : [...currentKeys];

        currentKeys.forEach(k => {
            if (!activeOrder.includes(k)) activeOrder.push(k);
        });

        const index = activeOrder.indexOf(itemKey);
        if (index === -1) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= activeOrder.length) return;

        const updatedOrder = [...activeOrder];
        const [moved] = updatedOrder.splice(index, 1);
        updatedOrder.splice(targetIndex, 0, moved);

        onUpdateConfig(blockId, 'fieldsOrder', updatedOrder);
    };

    if (fieldsOrder.length > 0) {
        rawItems.sort((a, b) => {
            const idxA = fieldsOrder.indexOf(a.key);
            const idxB = fieldsOrder.indexOf(b.key);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
    }

    type RowGroup = { type: 'header'; item: TableItem } | { type: 'full'; item: TableItem } | { type: 'pair'; item1: TableItem; item2?: TableItem };
    const rows: RowGroup[] = [];

    let i = 0;
    while (i < rawItems.length) {
        const current = rawItems[i];
        if (current.isGroupHeader) {
            rows.push({ type: 'header', item: current });
            i++;
        } else if (current.colSpan === 2) {
            rows.push({ type: 'full', item: current });
            i++;
        } else {
            const next = rawItems[i + 1];
            if (next && !next.isGroupHeader && next.colSpan === 1) {
                rows.push({ type: 'pair', item1: current, item2: next });
                i += 2;
            } else {
                rows.push({ type: 'pair', item1: current });
                i++;
            }
        }
    }

    const renderCellControls = (item: TableItem, itemIdx: number) => (
        <div className="absolute -top-3.5 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-md px-1.5 py-0.5 shadow-sm flex items-center gap-1 text-[8px] z-20 font-sans">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleMoveItem(item.key, 'up'); }}
                disabled={itemIdx === 0}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded px-0.5 py-0.2 disabled:opacity-20 cursor-pointer transition-colors"
                title="Mover elemento arriba"
            >
                ▲
            </button>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleMoveItem(item.key, 'down'); }}
                disabled={itemIdx === rawItems.length - 1}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded px-0.5 py-0.2 disabled:opacity-20 cursor-pointer transition-colors"
                title="Mover elemento abajo"
            >
                ▼
            </button>
            {!item.isGroupHeader && (
                <>
                    <span className="text-slate-200 dark:text-slate-700 font-bold">|</span>
                    <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider">Ancho:</span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSpanChange(item, 1); }}
                        className={`px-1.5 py-0.5 rounded text-[8px] cursor-pointer transition-all ${
                            item.colSpan === 1
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 font-bold shadow-2xs'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800'
                        }`}
                        title="Ocupar la mitad de la fila (50%)"
                    >
                        Mitad
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSpanChange(item, 2); }}
                        className={`px-1.5 py-0.5 rounded text-[8px] cursor-pointer transition-all ${
                            item.colSpan === 2
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 font-bold shadow-2xs'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800'
                        }`}
                        title="Ocupar la fila completa (100%)"
                    >
                        Completo
                    </button>
                </>
            )}
        </div>
    );

    return (
        <div className="my-2 select-none">
            <table className={`w-full border-collapse text-[10px] ${borderCss}`}>
                <tbody>
                    {rows.map((row, rIdx) => {
                        if (row.type === 'header') {
                            const item = row.item;
                            const style = resolveVariantBg(item.variant);
                            return (
                                <tr key={`r-${rIdx}`} className="group/cell relative border-b border-slate-300">
                                    <td
                                        colSpan={4}
                                        className={`p-1.5 font-bold text-center uppercase text-[9px] tracking-wider text-white relative align-middle ${cellBorderCss}`}
                                        style={{ backgroundColor: style.bg }}
                                    >
                                        <span className="flex items-center justify-center gap-1.5">
                                            <Bookmark className="w-3 h-3 text-white/90" />
                                            {item.label}
                                        </span>
                                        {renderCellControls(item, rawItems.findIndex(x => x.key === item.key))}
                                    </td>
                                </tr>
                            );
                        } else if (row.type === 'full') {
                            const item = row.item;
                            const style = resolveVariantBg(item.variant);
                            return (
                                <tr key={`r-${rIdx}`} className="group/cell relative border-b border-slate-200 last:border-0 hover:bg-slate-50/50">
                                    <td
                                        className={`p-2 font-bold text-[8.5px] uppercase w-1/4 relative align-top ${cellBorderCss}`}
                                        style={{ backgroundColor: style.bg, color: style.fg }}
                                    >
                                        {item.label} {item.isCustom && <span className="text-[7px] text-emerald-400 font-mono">*</span>}
                                        {renderCellControls(item, rawItems.findIndex(x => x.key === item.key))}
                                    </td>
                                    <td colSpan={3} className={`p-2 text-slate-800 font-semibold bg-white align-top ${cellBorderCss}`}>
                                        {item.value}
                                        {item.requirementText && (
                                            <span className="block text-[8px] text-slate-400 italic mt-0.5">{item.requirementText}</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        } else {
                            const { item1, item2 } = row;
                            const style1 = resolveVariantBg(item1.variant);
                            const style2 = item2 ? resolveVariantBg(item2.variant) : null;
                            return (
                                <tr key={`r-${rIdx}`} className="border-b border-slate-200 last:border-0">
                                    <td
                                        className={`group/cell relative p-2 font-bold text-[8.5px] uppercase w-1/5 align-top ${cellBorderCss}`}
                                        style={{ backgroundColor: style1.bg, color: style1.fg }}
                                    >
                                        {item1.label} {item1.isCustom && <span className="text-[7px] text-emerald-400 font-mono">*</span>}
                                        {renderCellControls(item1, rawItems.findIndex(x => x.key === item1.key))}
                                    </td>
                                    <td
                                        colSpan={item2 ? 1 : 3}
                                        className={`p-2 text-slate-800 font-semibold bg-white align-top ${cellBorderCss} ${item2 ? 'w-3/10' : ''}`}
                                    >
                                        {item1.value}
                                        {item1.requirementText && (
                                            <span className="block text-[8px] text-slate-400 italic mt-0.5">{item1.requirementText}</span>
                                        )}
                                    </td>

                                    {item2 && style2 && (
                                        <>
                                            <td
                                                className={`group/cell relative p-2 font-bold text-[8.5px] uppercase w-1/5 align-top ${cellBorderCss}`}
                                                style={{ backgroundColor: style2.bg, color: style2.fg }}
                                            >
                                                {item2.label} {item2.isCustom && <span className="text-[7px] text-emerald-400 font-mono">*</span>}
                                                {renderCellControls(item2, rawItems.findIndex(x => x.key === item2.key))}
                                            </td>
                                            <td className={`p-2 text-slate-800 font-semibold bg-white w-3/10 align-top ${cellBorderCss}`}>
                                                {item2.value}
                                                {item2.requirementText && (
                                                    <span className="block text-[8px] text-slate-400 italic mt-0.5">{item2.requirementText}</span>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        }
                    })}
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
}> = ({ config }) => {
    const c = config || {};
    const headerColorKey = c.writingHeaderColor || 'navy';
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
    const goldColor = '#b8912e';

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

    return (
        <div className="w-full font-sans my-4 space-y-6">
            {subs.map((sub: any) => (
                <div key={sub.key} className="w-full bg-white p-3 border-b border-slate-200">
                    <h2 className="text-[13pt] font-extrabold text-[#002060] text-center uppercase tracking-wide mb-1.5 font-sans">
                        {sub.numberPrefix ? `${sub.numberPrefix} ${sub.title}` : sub.title}
                    </h2>
                    {sub.requirementText && (
                        <p className="text-[9pt] text-slate-700 italic text-left mb-2 leading-relaxed">
                            {sub.requirementText}
                        </p>
                    )}
                    <div className="text-[9.5pt] text-slate-400 italic text-justify leading-relaxed">
                        [Redacción enriquecida colaborativa en Tiptap / Yjs...]
                    </div>
                </div>
            ))}
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

    const handleSelectLayout = (newMode: string) => {
        if (blockId && onUpdateConfig) {
            onUpdateConfig(blockId, 'productsLayoutMode', newMode);
        }
    };

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

export const RenderImpacts: React.FC<{ config: any }> = ({ config }) => {
    const c = config || {};
    const rawCats = c.impactCategories || c.categories;
    const categories: ImpactCategory[] = (Array.isArray(rawCats) && rawCats.length > 0)
        ? rawCats.filter((cat: any) => cat.enabled !== false)
        : DEFAULT_IMPACT_CATEGORIES;
    const layoutMode = c.impactLayoutMode || c.impactsLayoutMode || 'table';

    return (
        <div className="my-2 space-y-2 select-none">
            {/* MATRIZ DE IMPACTOS SEGÚN LAYOUT MODE */}
            <div className="space-y-2">
                <h5 className="text-[9.5px] font-black uppercase text-slate-800 tracking-wide">6. Matriz de Impactos</h5>

                {layoutMode === 'cards' ? (
                    /* MODO TARJETAS BENTO */
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat, idx) => (
                            <div key={cat.id || idx} className={`border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs ${cat.colSpan === 2 ? 'col-span-2' : 'col-span-1'}`}>
                                <div className="p-1.5 bg-[#1e2a4a] text-white font-bold text-[9px] uppercase tracking-wider">
                                    <span>{cat.title}</span>
                                </div>
                                <div className="p-2 text-[9px] text-slate-600 bg-slate-50/50 leading-relaxed italic">
                                    {cat.placeholder || 'Descripción del impacto asignado al proyecto...'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : layoutMode === 'sections' ? (
                    /* MODO CONSECUTIVO (PÁRRAFOS) */
                    <div className="space-y-2.5">
                        {categories.map((cat, idx) => (
                            <div key={cat.id || idx} className="border-l-4 border-[#1e2a4a] pl-3 py-1 bg-slate-50/40 rounded-r-md">
                                <h6 className="text-[9.5px] font-bold uppercase text-[#1e2a4a] tracking-wide">{cat.title}</h6>
                                <p className="text-[9px] text-slate-600 mt-0.5 leading-relaxed italic">
                                    {cat.placeholder || 'Descripción del impacto asignado al proyecto...'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* MODO TABLA CLÁSICA (RETICULAR) */
                    <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
                        <tbody>
                            {categories.map((cat, idx) => (
                                <tr key={cat.id || idx} className="border-b border-slate-200 last:border-0">
                                    <td className="p-2 bg-[#1e2a4a] text-white font-bold text-[8.5px] uppercase w-1/4 align-top border border-slate-300">
                                        {cat.title}
                                    </td>
                                    <td className="p-2 text-slate-700 bg-white align-top border border-slate-300 leading-relaxed italic text-[9px]">
                                        {cat.placeholder || 'Descripción del impacto asignado al proyecto...'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
