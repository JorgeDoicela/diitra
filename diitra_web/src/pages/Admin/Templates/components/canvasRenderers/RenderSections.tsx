import React from 'react';
import type { IdentificationField, ImpactCategory } from '../../types';
import { DEFAULT_TECHNICAL_SUBSECTIONS, DEFAULT_IMPACT_CATEGORIES } from '../../types';
import { getHeaderStylePair } from './RenderCover';

export const RenderProjectGeneralSection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config }) => {
    const headerColorKey = config.headerColor || 'blue';
    const borderStyleKey = config.borderStyle || 'solid';
    const headerPair = getHeaderStylePair(headerColorKey);

    const borderStyle = borderStyleKey === 'none'
        ? 'border-0 shadow-none'
        : borderStyleKey === 'dashed'
            ? 'border border-dashed border-slate-300'
            : 'border border-slate-300 shadow-2xs';

    const cellBorder = borderStyleKey === 'none'
        ? 'border-b border-slate-100'
        : borderStyleKey === 'dashed'
            ? 'border-b border-dashed border-slate-200'
            : 'border-b border-r border-slate-200 last:border-r-0';

    interface ItemConfig {
        key: string;
        label: string;
        content: string;
        colSpan: 1 | 2;
    }

    const items: ItemConfig[] = [];

    if (config.showTitulo !== false) {
        items.push({
            key: 'showTitulo',
            label: config.customLabel_showTitulo || 'Título del Proyecto',
            content: `[TEMA / NOMBRE DEL PROYECTO CIENTÍFICO]`,
            colSpan: (config.colSpan_showTitulo as 1 | 2) || 2
        });
    }
    if (config.showDirector !== false) {
        items.push({
            key: 'showDirector',
            label: config.customLabel_showDirector || 'Director del Proyecto',
            content: `[Director Asignado]`,
            colSpan: (config.colSpan_showDirector as 1 | 2) || 1
        });
    }
    if (config.showCarrera !== false) {
        items.push({
            key: 'showCarrera',
            label: config.customLabel_showCarrera || 'Carrera / Unidad Académica',
            content: `[Carrera Seleccionada]`,
            colSpan: (config.colSpan_showCarrera as 1 | 2) || 1
        });
    }
    if (config.showConvocatoria !== false) {
        items.push({
            key: 'showConvocatoria',
            label: config.customLabel_showConvocatoria || 'Convocatoria',
            content: `[Convocatoria Vigente]`,
            colSpan: (config.colSpan_showConvocatoria as 1 | 2) || 1
        });
    }
    if (config.showPrograma !== false) {
        items.push({
            key: 'showPrograma',
            label: config.customLabel_showPrograma || 'Programa',
            content: `[Programa Institucional]`,
            colSpan: (config.colSpan_showPrograma as 1 | 2) || 1
        });
    }
    if (config.showGrupo !== false) {
        items.push({
            key: 'showGrupo',
            label: config.customLabel_showGrupo || 'Grupo de Investigación',
            content: `[Grupo Vinculado]`,
            colSpan: (config.colSpan_showGrupo as 1 | 2) || 1
        });
    }
    if (config.showLinea !== false) {
        items.push({
            key: 'showLinea',
            label: config.customLabel_showLinea || 'Línea de Investigación',
            content: `Línea: [Línea] / Sublínea: [Sublínea]`,
            colSpan: (config.colSpan_showLinea as 1 | 2) || 1
        });
    }
    if (config.showTipo !== false) {
        items.push({
            key: 'showTipo',
            label: config.customLabel_showTipo || 'Tipo de Investigación',
            content: `APLICADA`,
            colSpan: (config.colSpan_showTipo as 1 | 2) || 1
        });
    }
    if (config.showCaces !== false) {
        items.push({
            key: 'showCaces',
            label: config.customLabel_showCaces || 'Campo Detallado CACES',
            content: `[Campo CACES]`,
            colSpan: (config.colSpan_showCaces as 1 | 2) || 1
        });
    }
    if (config.showFechas !== false) {
        items.push({
            key: 'showFechas',
            label: config.customLabel_showFechas || 'Fechas y Plazos',
            content: `Inicio: [Fecha] — Fin: [Fecha]`,
            colSpan: (config.colSpan_showFechas as 1 | 2) || 1
        });
    }

    const customFields: IdentificationField[] = config.customFields || [];
    customFields.forEach((f) => {
        items.push({
            key: f.fieldKey,
            label: f.label,
            content: f.scriptMode === 'static' ? (f.options?.[0] || f.label) : `[${f.label}]`,
            colSpan: (f.colSpan as 1 | 2) || 1
        });
    });

    const fieldsOrder: string[] = config.fieldsOrder || [];
    if (fieldsOrder.length > 0) {
        items.sort((a, b) => {
            const idxA = fieldsOrder.indexOf(a.key);
            const idxB = fieldsOrder.indexOf(b.key);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
    }

    type RowGroup = { type: 'full'; item: ItemConfig } | { type: 'pair'; item1: ItemConfig; item2?: ItemConfig };
    const rows: RowGroup[] = [];

    let idx = 0;
    while (idx < items.length) {
        const current = items[idx];
        if (current.colSpan === 2) {
            rows.push({ type: 'full', item: current });
            idx++;
        } else {
            const next = items[idx + 1];
            if (next && next.colSpan === 1) {
                rows.push({ type: 'pair', item1: current, item2: next });
                idx += 2;
            } else {
                rows.push({ type: 'pair', item1: current });
                idx++;
            }
        }
    }

    return (
        <div className="space-y-1.5 my-2">
            <h5 className="text-[9.5px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Ficha de Identificación del Proyecto</span>
                <span className="text-[8px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">Mapeado Dinámico BD</span>
            </h5>
            <div className={`overflow-hidden rounded-md bg-white ${borderStyle}`}>
                {rows.length === 0 ? (
                    <div className="p-3 text-[9px] text-slate-400 italic text-center">Todos los campos están deshabilitados</div>
                ) : (
                    <div className="divide-y divide-slate-200/60">
                        {rows.map((r, rIdx) => {
                            if (r.type === 'full') {
                                return (
                                    <div key={rIdx} className="grid grid-cols-4 text-[9px]">
                                        <div
                                            className={`p-1.5 font-bold uppercase tracking-wider flex items-center ${cellBorder}`}
                                            style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                                        >
                                            {r.item.label}
                                        </div>
                                        <div className={`col-span-3 p-1.5 font-medium text-slate-700 bg-white flex items-center ${cellBorder}`}>
                                            {r.item.content}
                                        </div>
                                    </div>
                                );
                            } else {
                                const { item1, item2 } = r;
                                return (
                                    <div key={rIdx} className="grid grid-cols-4 text-[9px]">
                                        <div
                                            className={`p-1.5 font-bold uppercase tracking-wider flex items-center ${cellBorder}`}
                                            style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                                        >
                                            {item1.label}
                                        </div>
                                        <div className={`p-1.5 font-medium text-slate-700 bg-white flex items-center ${item2 ? cellBorder : 'col-span-3 ' + cellBorder}`}>
                                            {item1.content}
                                        </div>
                                        {item2 && (
                                            <>
                                                <div
                                                    className={`p-1.5 font-bold uppercase tracking-wider flex items-center ${cellBorder}`}
                                                    style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                                                >
                                                    {item2.label}
                                                </div>
                                                <div className={`p-1.5 font-medium text-slate-700 bg-white flex items-center ${cellBorder}`}>
                                                    {item2.content}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export const RenderProjectTechnicalSection: React.FC<{ config: any }> = ({ config }) => {
    const layoutMode = config.technicalLayoutMode || 'table_2col';
    const headerColorKey = config.technicalHeaderColor || 'navy';
    const headerPair = getHeaderStylePair(headerColorKey);

    const getSectionsList = () => {
        if (config.technicalSections && Array.isArray(config.technicalSections) && config.technicalSections.length > 0) {
            return config.technicalSections;
        }
        return DEFAULT_TECHNICAL_SUBSECTIONS;
    };

    const activeSections = getSectionsList().filter((s: any) => s.enabled !== false);

    const formatDisplayTitle = (prefix?: string, title?: string) => {
        const p = (prefix || '').trim();
        let t = (title || '').trim();
        if (p && t.toLowerCase().startsWith(p.toLowerCase())) {
            t = t.substring(p.length).trim();
        }
        return p ? `${p} ${t}`.trim().toUpperCase() : t.toUpperCase();
    };

    return (
        <div className="space-y-2 my-2">
            <h5 className="text-[9.5px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Plan Técnico de Redacción ({activeSections.length} Secciones)</span>
                <span className="text-[8px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">Mapeado Workspace</span>
            </h5>

            {layoutMode === 'bento_cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activeSections.map((sec: any, idx: number) => (
                        <div key={sec.key || idx} className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-2xs">
                            <div className="px-2 py-1 font-bold text-[8.5px] uppercase tracking-wider text-white" style={{ backgroundColor: headerPair.bg }}>
                                {formatDisplayTitle(sec.numberPrefix, sec.title)}
                            </div>
                            <div className="p-2 text-[9px] text-slate-500 italic leading-snug">
                                [Redacción colaborativa enviada desde la pestaña Plan Técnico del Workspace]
                            </div>
                        </div>
                    ))}
                </div>
            ) : layoutMode === 'headings_text' ? (
                <div className="space-y-3 bg-white p-3 border border-slate-200 rounded-md">
                    {activeSections.map((sec: any, idx: number) => (
                        <div key={sec.key || idx} className="space-y-1">
                            <h6 className="text-[9px] font-black uppercase tracking-wider text-slate-800 pb-0.5 border-b border-slate-200">
                                {formatDisplayTitle(sec.numberPrefix, sec.title)}
                            </h6>
                            <p className="text-[9px] text-slate-500 italic leading-snug">
                                [Contenido redactado en tiempo real con formateador rico HTML / TipTap]
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                    <div className="divide-y divide-slate-200/80">
                        {activeSections.map((sec: any, idx: number) => (
                            <div key={sec.key || idx} className="grid grid-cols-4 text-[9px]">
                                <div
                                    className="p-2 font-bold uppercase tracking-wider flex items-center border-r border-slate-200 shrink-0"
                                    style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                                >
                                    {formatDisplayTitle(sec.numberPrefix, sec.title)}
                                </div>
                                <div className="col-span-3 p-2 font-normal text-slate-500 italic bg-white flex items-center">
                                    [Redacción del proyecto cargada dinámicamente desde el Workspace]
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const RenderImpacts: React.FC<{ config: any }> = ({ config }) => {
    const getCategoriesList = (): ImpactCategory[] => {
        if (config.impactCategories && Array.isArray(config.impactCategories) && config.impactCategories.length > 0) {
            return config.impactCategories;
        }
        return DEFAULT_IMPACT_CATEGORIES.map(def => {
            const legacyVal = def.legacyKey ? config[def.legacyKey] : undefined;
            return {
                ...def,
                enabled: legacyVal !== undefined ? Boolean(legacyVal) : def.enabled,
            };
        });
    };

    const activeCats = getCategoriesList().filter(c => c.enabled !== false);
    const layoutMode = config.impactsLayoutMode || 'table';

    return (
        <div className="space-y-2 my-2">
            <h5 className="text-[9.5px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Matriz de Impactos y Productos ({activeCats.length} Categorías)</span>
                <span className="text-[8px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">Mapeado Workspace</span>
            </h5>

            {layoutMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activeCats.map(cat => (
                        <div key={cat.key} className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-2xs">
                            <div className="px-2 py-1 font-bold text-[8.5px] uppercase tracking-wider text-white bg-[#1e2a4a]">
                                {cat.title}
                            </div>
                            <div className="p-2 text-[9px] text-slate-500 italic leading-snug">
                                [Detalle cargado dinámicamente desde la matriz de impactos]
                            </div>
                        </div>
                    ))}
                </div>
            ) : layoutMode === 'sections' ? (
                <div className="space-y-2 bg-white p-3 border border-slate-200 rounded-md">
                    {activeCats.map(cat => (
                        <div key={cat.key} className="space-y-1">
                            <h6 className="text-[9px] font-black uppercase tracking-wider text-[#1e2a4a] pb-0.5 border-b border-slate-200">
                                {cat.title}
                            </h6>
                            <p className="text-[9px] text-slate-500 italic leading-snug">
                                [Redacción cualitativa del impacto para la acreditación CACES]
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                    <div className="divide-y divide-slate-200/80">
                        {activeCats.map(cat => (
                            <div key={cat.key} className="grid grid-cols-4 text-[9px]">
                                <div className="p-2 font-bold uppercase tracking-wider flex items-center border-r border-slate-200 shrink-0 bg-[#1e2a4a] text-white">
                                    {cat.title}
                                </div>
                                <div className="col-span-3 p-2 font-normal text-slate-500 italic bg-white flex items-center">
                                    [Detalle cualitativo del impacto y evidencias de transferencia tecnológica]
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
