import React, { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { IdentificationField, ImpactCategory } from '../../types';
import { DEFAULT_TECHNICAL_SUBSECTIONS, DEFAULT_IMPACT_CATEGORIES } from '../../types';
import { getHeaderStylePair } from './RenderCover';

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

    interface TableItem {
        id: string;
        key: string;
        label: string;
        value: string;
        isCustom?: boolean;
        colSpan: 1 | 2;
    }

    const rawItems: TableItem[] = [];

    if (c.showTitulo !== false) {
        rawItems.push({ id: 'showTitulo', key: 'showTitulo', label: c.customLabel_showTitulo || 'Título del Proyecto', value: '[TEMA / NOMBRE DEL PROYECTO CIENTÍFICO]', colSpan: c.colSpan_showTitulo || 2 });
    }
    if (c.showDirector !== false) {
        rawItems.push({ id: 'showDirector', key: 'showDirector', label: c.customLabel_showDirector || 'Director del Proyecto', value: '[Director Asignado]', colSpan: c.colSpan_showDirector || 1 });
    }
    if (c.showCarrera !== false) {
        rawItems.push({ id: 'showCarrera', key: 'showCarrera', label: c.customLabel_showCarrera || 'Carrera / Unidad Académica', value: '[Carrera Seleccionada]', colSpan: c.colSpan_showCarrera || 1 });
    }
    if (c.showConvocatoria !== false) {
        rawItems.push({ id: 'showConvocatoria', key: 'showConvocatoria', label: c.customLabel_showConvocatoria || 'Convocatoria', value: '[Convocatoria Vigente]', colSpan: c.colSpan_showConvocatoria || 1 });
    }
    if (c.showPrograma !== false) {
        rawItems.push({ id: 'showPrograma', key: 'showPrograma', label: c.customLabel_showPrograma || 'Programa', value: '[Programa Institucional]', colSpan: c.colSpan_showPrograma || 1 });
    }
    if (c.showGrupo !== false) {
        rawItems.push({ id: 'showGrupo', key: 'showGrupo', label: c.customLabel_showGrupo || 'Grupo de Investigación', value: '[Grupo Vinculado]', colSpan: c.colSpan_showGrupo || 1 });
    }
    if (c.showLinea !== false) {
        rawItems.push({ id: 'showLinea', key: 'showLinea', label: c.customLabel_showLinea || 'Línea de Investigación', value: 'Línea: [Línea] / Sublínea: [Sublínea]', colSpan: c.colSpan_showLinea || 1 });
    }
    if (c.showTipo !== false) {
        rawItems.push({ id: 'showTipo', key: 'showTipo', label: c.customLabel_showTipo || 'Tipo de Investigación', value: 'APLICADA', colSpan: c.colSpan_showTipo || 1 });
    }
    if (c.showCaces !== false) {
        rawItems.push({ id: 'showCaces', key: 'showCaces', label: c.customLabel_showCaces || 'Campo Detallado CACES', value: '[Campo CACES]', colSpan: c.colSpan_showCaces || 1 });
    }
    if (c.showFechas !== false) {
        rawItems.push({ id: 'showFechas', key: 'showFechas', label: c.customLabel_showFechas || 'Fechas y Plazos', value: 'Inicio: [Fecha] — Fin: [Fecha]', colSpan: c.colSpan_showFechas || 1 });
    }

    customFields.forEach((f) => {
        const val = f.fieldType === 'select_inline'
            ? `[Opciones: ${(f.options || []).join(', ')}]`
            : f.fieldType === 'select_catalog'
                ? `[Catálogo: ${f.catalogUrl || 'sin url'}]`
                : f.fieldType === 'date'
                    ? '[dd/mm/aaaa 📅]'
                    : `[${f.placeholder || f.label}]`;
        rawItems.push({ id: f.fieldKey, key: f.fieldKey, label: f.label, value: val, isCustom: true, colSpan: (f.colSpan as 1 | 2) || 1 });
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

    type RowGroup = { type: 'full'; item: TableItem } | { type: 'pair'; item1: TableItem; item2?: TableItem };
    const rows: RowGroup[] = [];

    let i = 0;
    while (i < rawItems.length) {
        const current = rawItems[i];
        if (current.colSpan === 2) {
            rows.push({ type: 'full', item: current });
            i++;
        } else {
            const next = rawItems[i + 1];
            if (next && next.colSpan === 1) {
                rows.push({ type: 'pair', item1: current, item2: next });
                i += 2;
            } else {
                rows.push({ type: 'pair', item1: current });
                i++;
            }
        }
    }

    const renderCellControls = (item: TableItem, itemIdx: number) => (
        <div className="absolute -top-3.5 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity bg-slate-900 text-white rounded px-1.5 py-0.5 shadow-md flex items-center gap-1 text-[8px] z-20">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleMoveItem(item.key, 'up'); }}
                disabled={itemIdx === 0}
                className="hover:text-amber-400 disabled:opacity-30 disabled:hover:text-white cursor-pointer px-0.5"
                title="Mover elemento arriba"
            >
                ▲
            </button>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleMoveItem(item.key, 'down'); }}
                disabled={itemIdx === rawItems.length - 1}
                className="hover:text-amber-400 disabled:opacity-30 disabled:hover:text-white cursor-pointer px-0.5"
                title="Mover elemento abajo"
            >
                ▼
            </button>
            <span className="text-slate-600 font-bold">|</span>
            <span className="text-slate-400 font-bold">Ancho:</span>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSpanChange(item, 1); }}
                className={`px-1 rounded cursor-pointer transition-colors ${item.colSpan === 1 ? 'bg-indigo-500 text-white font-bold' : 'hover:bg-slate-700 text-slate-300'}`}
                title="Ocupar la mitad de la fila (50%)"
            >
                Mitad
            </button>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSpanChange(item, 2); }}
                className={`px-1 rounded cursor-pointer transition-colors ${item.colSpan === 2 ? 'bg-indigo-500 text-white font-bold' : 'hover:bg-slate-700 text-slate-300'}`}
                title="Ocupar la fila completa (100%)"
            >
                Completo
            </button>
        </div>
    );

    return (
        <div className="my-2 p-3.5 border border-slate-200 rounded-xl bg-white select-none space-y-2 shadow-xs">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    FICHA DE IDENTIFICACIÓN DEL PROYECTO
                </span>
                <span className="text-[8px] text-slate-500 font-normal">
                    Pasa el cursor sobre cualquier celda para reordenar o cambiar su ancho
                </span>
            </div>

            <table className={`w-full border-collapse text-[10px] ${borderCss}`}>
                <tbody>
                    {rows.map((row, rIdx) => {
                        if (row.type === 'full') {
                            const item = row.item;
                            return (
                                <tr key={`r-${rIdx}`} className="group/cell relative border-b border-slate-200 last:border-0 hover:bg-slate-50/50">
                                    <td
                                        className={`p-2 font-bold text-[8.5px] uppercase w-1/4 relative align-top ${cellBorderCss}`}
                                        style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                                    >
                                        {item.label} {item.isCustom && <span className="text-[7px] text-emerald-400 font-mono">*</span>}
                                        {renderCellControls(item, rawItems.findIndex(x => x.key === item.key))}
                                    </td>
                                    <td colSpan={3} className={`p-2 text-slate-800 font-semibold bg-white align-top ${cellBorderCss}`}>
                                        {item.value}
                                    </td>
                                </tr>
                            );
                        } else {
                            const { item1, item2 } = row;
                            return (
                                <tr key={`r-${rIdx}`} className="border-b border-slate-200 last:border-0">
                                    <td
                                        className={`group/cell relative p-2 font-bold text-[8.5px] uppercase w-1/5 align-top ${cellBorderCss}`}
                                        style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                                    >
                                        {item1.label} {item1.isCustom && <span className="text-[7px] text-emerald-400 font-mono">*</span>}
                                        {renderCellControls(item1, rawItems.findIndex(x => x.key === item1.key))}
                                    </td>
                                    <td
                                        colSpan={item2 ? 1 : 3}
                                        className={`p-2 text-slate-800 font-semibold bg-white align-top ${cellBorderCss} ${item2 ? 'w-3/10' : ''}`}
                                    >
                                        {item1.value}
                                    </td>

                                    {item2 && (
                                        <>
                                            <td
                                                className={`group/cell relative p-2 font-bold text-[8.5px] uppercase w-1/5 align-top ${cellBorderCss}`}
                                                style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                                            >
                                                {item2.label} {item2.isCustom && <span className="text-[7px] text-emerald-400 font-mono">*</span>}
                                                {renderCellControls(item2, rawItems.findIndex(x => x.key === item2.key))}
                                            </td>
                                            <td className={`p-2 text-slate-800 font-semibold bg-white w-3/10 align-top ${cellBorderCss}`}>
                                                {item2.value}
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
    const layoutMode = c.technicalLayoutMode || 'table_2col';
    const headerColorKey = c.technicalHeaderColor || 'navy';
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
        const variants = ['standard', 'banner_gold', 'banner_navy'];
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

    let subs: Array<{ key: string; title: string; numberPrefix?: string; requirementText?: string; colSpan?: 1 | 2; variant?: string }> = [];

    if (c.technicalSections && Array.isArray(c.technicalSections) && c.technicalSections.length > 0) {
        subs = c.technicalSections
            .filter((s: any) => s.enabled !== false)
            .map((s: any) => ({
                key: s.id || s.fieldKey,
                title: s.title,
                numberPrefix: s.numberPrefix,
                requirementText: s.requirementText,
                colSpan: s.colSpan || 2,
                variant: s.variant || 'standard',
            }));
    } else {
        subs = DEFAULT_TECHNICAL_SUBSECTIONS.filter(s => s.enabled).map(s => ({
            key: s.id || s.fieldKey,
            title: s.title,
            numberPrefix: s.numberPrefix,
            requirementText: s.requirementText,
            colSpan: s.colSpan || 2,
            variant: s.variant || 'standard',
        }));
    }

    const renderDirectControlsPill = (sub: any, isFirst: boolean, isLast: boolean) => (
        <div className="inline-flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto bg-slate-900/90 px-1.5 py-0.5 rounded-md shadow-md backdrop-blur-xs font-sans text-white border border-slate-700/50">
            <button
                type="button"
                onClick={(e) => handleMoveDirect(sub.key, 'up', e)}
                disabled={isFirst}
                className="p-0.5 rounded hover:bg-white/20 text-white disabled:opacity-20 cursor-pointer"
                title="Mover subsección arriba"
            >
                <ArrowUp className="w-2.5 h-2.5" />
            </button>
            <button
                type="button"
                onClick={(e) => handleMoveDirect(sub.key, 'down', e)}
                disabled={isLast}
                className="p-0.5 rounded hover:bg-white/20 text-white disabled:opacity-20 cursor-pointer"
                title="Mover subsección abajo"
            >
                <ArrowDown className="w-2.5 h-2.5" />
            </button>
            <span className="w-px h-2.5 bg-white/20 my-auto" />
            <button
                type="button"
                onClick={(e) => handleToggleColSpanDirect(sub.key, e)}
                className="px-1.5 py-0.5 text-[7.5px] font-black rounded bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:bg-amber-500/50 transition-all cursor-pointer"
                title="Hacer clic directo para cambiar ancho (50% / 100%)"
            >
                {sub.colSpan === 1 ? '50%' : '100%'}
            </button>
            <button
                type="button"
                onClick={(e) => handleCycleVariantDirect(sub.key, e)}
                className="px-1.5 py-0.5 text-[7.5px] font-black rounded bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-500/50 transition-all cursor-pointer"
                title="Hacer clic directo para cambiar estilo (Dorado / Azul / Normal)"
            >
                {sub.variant === 'banner_gold' ? 'Dorado' : sub.variant === 'banner_navy' ? 'Azul' : 'Estándar'}
            </button>
        </div>
    );

    return (
        <div className="my-2 p-3.5 border border-slate-200 rounded-xl bg-white space-y-2 shadow-xs select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    Plan Técnico ({layoutMode === 'table_2col' ? 'Matriz Reticular Interactiva' : 'Secciones Consecutivas'})
                </span>
                <span className="text-[8px] font-mono text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                    {subs.length} SUB-SECCIONES (EDICIÓN EN CANVAS)
                </span>
            </div>

            {layoutMode === 'table_2col' ? (
                <div className="overflow-hidden border border-slate-300 rounded-lg shadow-xs">
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

                                    if (colSpan === 1) {
                                        const nextSub = subs[idx + 1];
                                        if (nextSub && (nextSub.colSpan === 1 || nextSub.variant === 'banner_navy')) {
                                            const nextNum = (nextSub.numberPrefix || '').trim();
                                            let nextTitleClean = (nextSub.title || '').trim();
                                            if (nextNum && nextTitleClean.toLowerCase().startsWith(nextNum.toLowerCase())) {
                                                nextTitleClean = nextTitleClean.substring(nextNum.length).trim();
                                            }
                                            const nextDisplayTitle = nextNum ? `${nextNum} ${nextTitleClean}` : nextTitleClean;

                                            const bg1 = sub.variant === 'banner_gold' ? goldColor : headerBg;
                                            const bg2 = nextSub.variant === 'banner_gold' ? goldColor : headerBg;

                                            rows.push(
                                                <React.Fragment key={sub.key}>
                                                    <tr className="border-b border-slate-300">
                                                        <td className="p-1.5 w-1/2 text-white font-bold text-center uppercase border-r border-slate-300 text-[8.5px] cursor-pointer group" style={{ backgroundColor: bg1 }}>
                                                            <span className="flex items-center justify-center gap-1">
                                                                {displayTitle}
                                                                {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                                            </span>
                                                        </td>
                                                        <td className="p-1.5 w-1/2 text-white font-bold text-center uppercase border-slate-300 text-[8.5px] cursor-pointer group" style={{ backgroundColor: bg2 }}>
                                                            <span className="flex items-center justify-center gap-1">
                                                                {nextDisplayTitle}
                                                                {renderDirectControlsPill(nextSub, idx + 1 === 0, idx + 1 === subs.length - 1)}
                                                            </span>
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
                                            const bg1 = sub.variant === 'banner_gold' ? goldColor : headerBg;
                                            rows.push(
                                                <tr key={sub.key} className="border-b border-slate-200">
                                                    <td className="p-2 w-[32%] text-white font-bold text-left uppercase align-middle border-r border-slate-300 text-[8.5px] cursor-pointer group" style={{ backgroundColor: bg1 }}>
                                                        <span className="flex items-center justify-between gap-1">
                                                            <span>{displayTitle}</span>
                                                            {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 w-[68%] text-slate-600 bg-white align-top text-[8.5px]">
                                                        {sub.requirementText ? <span className="font-bold text-slate-700 block">[{sub.requirementText}]</span> : <span className="italic text-slate-400">[Redacción colaborativa]</span>}
                                                    </td>
                                                </tr>
                                            );
                                            idx++;
                                        }
                                    } else if (variant === 'banner_gold') {
                                        rows.push(
                                            <tr key={sub.key} className="border-b border-slate-300">
                                                <td
                                                    colSpan={2}
                                                    className="p-1.5 text-center font-bold text-slate-900 uppercase text-[9px] tracking-wider cursor-pointer group"
                                                    style={{ backgroundColor: goldColor }}
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
                                                        <span className="flex items-center justify-center gap-1">
                                                            {displayTitle}
                                                            {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                        idx++;
                                    } else {
                                        rows.push(
                                            <tr key={sub.key} className="border-b border-slate-200">
                                                <td className="p-2 w-[32%] text-white font-bold text-left uppercase align-middle border-r border-slate-300 text-[8.5px] cursor-pointer group" style={{ backgroundColor: headerBg }}>
                                                    <span className="flex items-center justify-between gap-1">
                                                        <span>{displayTitle}</span>
                                                        {renderDirectControlsPill(sub, idx === 0, idx === subs.length - 1)}
                                                    </span>
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
            ) : (
                <div className="space-y-3">
                    {subs.map((sub, sIdx) => (
                        <div key={sub.key} className="border border-slate-200 rounded-lg overflow-hidden group">
                            <div className="p-2 font-bold text-white text-[9px] uppercase flex items-center justify-between" style={{ backgroundColor: sub.variant === 'banner_gold' ? '#b8912e' : headerBg }}>
                                <span>{sub.numberPrefix ? `${sub.numberPrefix} ${sub.title}` : sub.title}</span>
                                {renderDirectControlsPill(sub, sIdx === 0, sIdx === subs.length - 1)}
                            </div>
                            <div className="p-2.5 text-[9px] text-slate-600 bg-white">
                                {sub.requirementText ? <span className="font-bold text-slate-700 block">[{sub.requirementText}]</span> : <span className="italic text-slate-400">[Redacción colaborativa]</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const RenderExpectedProducts: React.FC<{ config: any }> = ({ config }) => {
    const c = config || {};
    const productosTitle = c.productosTitle || '5. Productos Esperados';

    return (
        <div className="my-2 p-3.5 border border-slate-200 rounded-xl bg-white space-y-3 shadow-xs select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    PRODUCTOS Y ENTREGABLES ESPERADOS DEL PROYECTO
                </span>
            </div>

            <div className="space-y-1.5 border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
                <h5 className="text-[9.5px] font-black uppercase text-slate-800 tracking-wide">{productosTitle}</h5>
                <table className="w-full border-collapse border border-slate-200 text-[9.5px]">
                    <thead>
                        <tr className="bg-[#1e2a4a] text-white">
                            <th className="p-1.5 text-left font-bold border border-slate-200">Tipo de Producto</th>
                            <th className="p-1.5 text-center font-bold border border-slate-200 w-28">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white text-slate-700">
                            <td className="p-1.5 border border-slate-200 font-medium">Artículos Científicos / Ponencias</td>
                            <td className="p-1.5 border border-slate-200 text-center font-mono font-bold text-emerald-600">1</td>
                        </tr>
                    </tbody>
                </table>
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
        <div className="my-2 p-3.5 border border-slate-200 rounded-xl bg-white space-y-3 shadow-xs select-none">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    MATRIZ DE IMPACTOS DEL PROYECTO
                </span>
                <span className="text-[8px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    MODO: {layoutMode === 'cards' ? 'TARJETAS BENTO' : layoutMode === 'sections' ? 'CONSECUTIVO' : 'TABLA CLÁSICA'}
                </span>
            </div>

            {/* MATRIZ DE IMPACTOS SEGÚN LAYOUT MODE */}
            <div className="space-y-2">
                <h5 className="text-[9.5px] font-black uppercase text-slate-800 tracking-wide">6. Matriz de Impactos</h5>

                {layoutMode === 'cards' ? (
                    /* MODO TARJETAS BENTO */
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat, idx) => (
                            <div key={cat.id || idx} className={`border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs ${cat.colSpan === 2 ? 'col-span-2' : 'col-span-1'}`}>
                                <div className="p-1.5 bg-[#1e2a4a] text-white font-bold text-[9px] uppercase tracking-wider flex items-center justify-between">
                                    <span>{cat.title}</span>
                                    <span className="text-[7.5px] font-mono opacity-70">{cat.scribanVariable || `impacto.${cat.key}`}</span>
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
                                        {cat.placeholder || `{{default ${cat.scribanVariable || `impacto.${cat.key}`} "Descripción del impacto..."}}`}
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
