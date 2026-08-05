import React from 'react';
import type {
    ProgressHeaderField,
    ProgressActivityColumn,
    ProgressStatusSubsection,
    ProgressActivityVariant
} from '../../types';
import {
    DEFAULT_PROGRESS_HEADER_FIELDS,
    DEFAULT_ACTIVITY_COLUMNS,
    DEFAULT_PROGRESS_STATUS_SUBSECTIONS
} from '../../types';
import { getHeaderStylePair } from './RenderCover';

export const RenderProgressHeaderSection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config }) => {
    const c = config || {};
    const fields: ProgressHeaderField[] = (c.progressHeaderFields && Array.isArray(c.progressHeaderFields) && c.progressHeaderFields.length > 0)
        ? c.progressHeaderFields
        : DEFAULT_PROGRESS_HEADER_FIELDS;

    const headerColorMode = c.progressHeaderColor || 'navy';
    const borderStyleMode = c.progressHeaderBorder || 'solid';
    const headerPair = getHeaderStylePair(headerColorMode);
    const borderCss = borderStyleMode === 'none' ? 'border-0' : 'border border-slate-300';
    const cellBorderCss = borderStyleMode === 'none' ? 'border-b border-slate-100' : 'border border-slate-300';

    const activeFields = fields.filter(f => f.enabled);

    return (
        <div className="w-full text-slate-900 font-sans my-2">
            <div className={`w-full overflow-hidden rounded-xs ${borderCss}`}>
                {/* Header principal del bloque */}
                <div
                    className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                    style={{ backgroundColor: headerPair.bg, color: headerPair.color }}
                >
                    <span>1. DATOS GENERALES DEL PROYECTO (AUTO-POBLADOS)</span>
                    <span className="text-[9px] opacity-80 font-normal">Identificación Institucional ISTPET</span>
                </div>

                {/* Grid de campos de encabezado */}
                <div className="grid grid-cols-2 bg-white">
                    {activeFields.map((field) => {
                        const colSpanClass = field.colSpan === 2 ? 'col-span-2' : 'col-span-1';

                        return (
                            <div
                                key={field.id}
                                className={`${colSpanClass} p-2 ${cellBorderCss} flex flex-col justify-start bg-slate-50/40`}
                            >
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">
                                    {field.label}
                                </span>

                                {field.fieldType === 'checkbox_group' ? (
                                    <div className="flex items-center gap-4 mt-1">
                                        {(field.options || ['BÁSICA', 'APLICADA', 'EXPERIMENTAL']).map((opt, idx) => (
                                            <label key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-800 font-medium cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    disabled
                                                    checked={opt === 'APLICADA'}
                                                    className="w-3 h-3 text-indigo-600 rounded border-slate-300 focus:ring-0"
                                                />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-slate-600 italic font-mono">
                                        {field.readOnly ? `[${field.label.toUpperCase()} AUTO-POBLADO DESDE PROTOCOLO]` : (field.placeholder || 'Redactar campo...')}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const RenderProgressActivitySection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config }) => {
    const c = config || {};
    const variant: ProgressActivityVariant = c.activityVariant || 'ejecutadas';
    const rawColumns: ProgressActivityColumn[] = (c.activityColumns && Array.isArray(c.activityColumns) && c.activityColumns.length > 0)
        ? c.activityColumns
        : DEFAULT_ACTIVITY_COLUMNS;

    // Activar o desactivar columnas según variante por defecto si no ha sido personalizada
    const activeColumns = rawColumns.filter(col => {
        if (!col.enabled) return false;
        if (variant === 'ejecutadas') {
            if (col.fieldKey === 'ObjetivoAsociado' || col.fieldKey === 'Limitacion') return false;
        }
        return true;
    });

    const headerColorMode = c.activityHeaderColor || (variant === 'obstaculos' ? 'gold' : 'navy');
    const headerPair = getHeaderStylePair(headerColorMode);

    const getVariantTitle = () => {
        if (c.activityTableTitle) return c.activityTableTitle;
        switch (variant) {
            case 'no_previstas':
                return 'ACTIVIDADES NO PREVISTAS (NP)';
            case 'obstaculos':
                return 'OBSTÁCULOS Y ACTIVIDADES CORRECTIVAS (OBS)';
            default:
                return 'MATRIZ DE ACTIVIDADES EJECUTADAS';
        }
    };

    return (
        <div className="w-full text-slate-900 font-sans my-2">
            <div className="w-full border border-slate-300 overflow-hidden rounded-xs">
                {/* Header del bloque */}
                <div
                    className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                    style={{ backgroundColor: headerPair.bg, color: headerPair.color }}
                >
                    <span>{getVariantTitle()}</span>
                    <span className="text-[9px] opacity-80 font-normal">
                        Variante: <strong className="uppercase">{variant}</strong>
                    </span>
                </div>

                {/* Vista previa de tabla A4 */}
                <div className="w-full overflow-x-auto bg-white">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 text-[9px] font-bold text-slate-700 uppercase">
                                {activeColumns.map((col) => (
                                    <th
                                        key={col.id}
                                        className="p-1.5 border-r border-slate-300 last:border-r-0"
                                        style={{ width: col.colWidthPct ? `${col.colWidthPct}%` : 'auto' }}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Fila de demostración */}
                            <tr className="border-b border-slate-200 text-[9.5px] text-slate-600">
                                {activeColumns.map((col) => (
                                    <td key={col.id} className="p-1.5 border-r border-slate-200 last:border-r-0 align-top">
                                        {col.fieldKey === 'NumeroActividad' ? (
                                            <span className="font-bold text-indigo-900">
                                                Actividad 1{variant === 'no_previstas' ? ' NP' : variant === 'obstaculos' ? ' OBS' : ''}
                                            </span>
                                        ) : col.fieldKey === 'PorcentajeAvance' ? (
                                            <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px]">
                                                100%
                                            </span>
                                        ) : col.requirementText ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[8.5px] text-amber-700 font-semibold uppercase tracking-tight">
                                                    [{col.requirementText}]
                                                </span>
                                                <span className="italic text-slate-400">
                                                    {col.placeholder || 'Redactar en workspace...'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="italic text-slate-400">
                                                {col.placeholder || `[${col.label}]`}
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const RenderProgressStatusSection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config }) => {
    const c = config || {};
    const sections: ProgressStatusSubsection[] = (c.progressStatusSections && Array.isArray(c.progressStatusSections) && c.progressStatusSections.length > 0)
        ? c.progressStatusSections
        : DEFAULT_PROGRESS_STATUS_SUBSECTIONS;

    const activeSections = sections.filter(s => s.enabled);
    const headerColorMode = c.progressStatusHeaderColor || 'navy';
    const headerPair = getHeaderStylePair(headerColorMode);
    const options = c.statusOptions || ['INICIADO', 'EN AVANCE', 'SUSPENDIDO', 'POR FINALIZAR', 'FINALIZADO'];

    return (
        <div className="w-full text-slate-900 font-sans my-2">
            <div className="w-full border border-slate-300 overflow-hidden rounded-xs bg-white space-y-3 p-3">
                {activeSections.map((sec) => {
                    const isBanner = sec.variant?.startsWith('banner');
                    const isGold = sec.variant === 'banner_gold';

                    return (
                        <div key={sec.id} className="w-full border border-slate-200 rounded-xs overflow-hidden">
                            {/* Cabecera de la sub-sección */}
                            <div
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
                                    isGold ? 'bg-amber-600 text-white' : isBanner ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'
                                }`}
                            >
                                <span>{sec.title}</span>
                                {sec.accessRole && sec.accessRole !== 'all' && (
                                    <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-white/20 font-mono text-white">
                                        Acceso: {sec.accessRole.toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Contenido según tipo */}
                            <div className="p-2.5 bg-white">
                                {sec.fieldType === 'status_table' ? (
                                    <div className="w-full">
                                        {sec.requirementText && (
                                            <p className="text-[8.5px] font-bold text-amber-700 uppercase mb-1.5">
                                                Requisito: {sec.requirementText}
                                            </p>
                                        )}
                                        <div className="grid grid-cols-5 gap-1 text-center">
                                            {options.map((opt: string, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`p-1.5 border text-[9px] font-bold rounded ${
                                                        opt === 'EN AVANCE'
                                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-400'
                                                            : 'border-slate-200 text-slate-500 bg-slate-50'
                                                    }`}
                                                >
                                                    <div>{opt}</div>
                                                    <div className="text-[11px] mt-0.5">
                                                        {opt === 'EN AVANCE' ? '☑' : '☐'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="min-h-[40px] text-[10px] text-slate-500 italic flex flex-col justify-between">
                                        <span>{sec.placeholder || 'Redacción en workspace por el rol correspondiente...'}</span>
                                        {sec.requirementText && (
                                            <span className="text-[8.5px] text-slate-400 font-semibold uppercase mt-1">
                                                Guía: {sec.requirementText}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
